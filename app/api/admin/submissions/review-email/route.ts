import { NextRequest, NextResponse } from 'next/server';
import { isSoleAdminEmail } from '@/lib/auth/admin';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { isGmailConfigured, sendGmailEmail } from '@/lib/email/gmail';
import { classifyDeliveryFailure } from '@/lib/email/application-delivery';
import { buildTaskReviewEmail } from '@/lib/email/task-review-template';
import { shouldSendNotification } from '@/lib/email/gmail-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const noStore = { 'Cache-Control': 'private, no-store' };
// Existing decisions before the email outbox was installed must never generate
// emails implicitly; one-at-a-time manual send requires explicit confirmation.
const OUTBOX_ENABLED_AT = new Date('2026-11-11T05:51:54.000Z').getTime();

type DeliveryState = 'queued' | 'sending' | 'sent' | 'failed' | 'uncertain' | 'skipped';
type ReviewState = 'approved' | 'revision_requested' | 'rejected';
interface Delivery {
  id: string;
  submission_id: string;
  recipient_user_id: string;
  task_id: string;
  task_title: string;
  review_status: ReviewState;
  review_feedback: string;
  reviewed_at: string;
  status: DeliveryState;
  attempts: number;
  claimed_at: string | null;
  sent_at: string | null;
  last_error_code: string | null;
}
interface ReviewRow {
  id: string;
  student_id: string;
  status: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

function canInitializeHistorical(review: ReviewRow | null, delivery: Delivery | null): boolean {
  return !!review && !delivery
    && ['approved', 'revision_requested', 'rejected'].includes(review.status)
    && !!review.reviewed_by
    && !!review.reviewed_at
    && Number.isFinite(new Date(review.reviewed_at).getTime())
    && new Date(review.reviewed_at).getTime() < OUTBOX_ENABLED_AT;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: noStore });
}
function publicStatus(delivery: Delivery | null) {
  if (!delivery) return null;
  const stale = delivery.status === 'sending' && delivery.claimed_at !== null
    && Date.now() - new Date(delivery.claimed_at).getTime() >= 10 * 60_000;
  return {
    state: stale ? 'uncertain' : delivery.status,
    attempts: delivery.attempts,
    sentAt: delivery.sent_at,
    errorCode: delivery.last_error_code,
    requiresManualCheck: stale || delivery.status === 'uncertain',
  };
}
async function requireAdmin() {
  const session = await createClient();
  if (!session) return { error: jsonError('Konfiqurasiya xətası.', 503), admin: null };
  const { data, error } = await session.auth.getUser();
  if (error || !data.user) return { error: jsonError('Daxil olmalısınız.', 401), admin: null };
  if (!isSoleAdminEmail(data.user.email)) {
    return { error: jsonError('İcazə yoxdur.', 403), admin: null };
  }
  const admin = await createAdminClient();
  if (!admin) return { error: jsonError('Konfiqurasiya xətası.', 503), admin: null };
  return { error: null, admin };
}
function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try { return new URL(origin).host === request.nextUrl.host; }
  catch { return false; }
}
function isSameDecision(review: ReviewRow, delivery: Delivery) {
  return review.status === delivery.review_status
    && review.reviewed_at !== null
    && new Date(review.reviewed_at).getTime() === new Date(delivery.reviewed_at).getTime();
}

type AdminDb = NonNullable<Awaited<ReturnType<typeof createAdminClient>>>;
async function getLatest(admin: AdminDb, submissionId: string) {
  const [submissionResult, receiptResult] = await Promise.all([
    admin.from('task_submissions').select('id,student_id,status,reviewed_at,reviewed_by')
      .eq('id', submissionId).maybeSingle(),
    admin.from('task_review_email_deliveries').select('*')
      .eq('submission_id', submissionId)
      .order('reviewed_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1).maybeSingle(),
  ]);
  if (submissionResult.error || receiptResult.error) throw new Error('REVIEW_EMAIL_LOOKUP_FAILED');
  const review = (submissionResult.data || null) as ReviewRow | null;
  const delivery = (receiptResult.data || null) as Delivery | null;
  if (!review) return { found: false, review: null, delivery: null };
  return {
    found: true,
    review,
    delivery: delivery && isSameDecision(review, delivery) ? delivery : null,
  };
}
async function finish(admin: AdminDb, job: Delivery, state: DeliveryState, code: string | null = null) {
  const { data, error } = await admin.from('task_review_email_deliveries')
    .update({
      status: state,
      last_error_code: code,
      sent_at: state === 'sent' ? new Date().toISOString() : null,
    }).eq('id', job.id).eq('status', 'sending').eq('attempts', job.attempts)
    .select('id').maybeSingle();
  if (error || !data) throw new Error('REVIEW_EMAIL_RECEIPT_WRITE_FAILED');
}
export async function GET(request: NextRequest) {
  const { admin, error } = await requireAdmin();
  if (error) return error;
  if (!admin) return jsonError('Server konfiqurasiyası çatışmır.', 503);
  const id = request.nextUrl.searchParams.get('submissionId');
  if (!id || !UUID.test(id)) return jsonError('Tapşırıq ID-si düzgün deyil.', 400);
  try {
    const result = await getLatest(admin, id);
    if (!result.found) return jsonError('Təqdimat tapılmadı.', 404);
    return NextResponse.json({
      delivery: publicStatus(result.delivery),
      canInitializeHistorical: canInitializeHistorical(result.review, result.delivery),
    }, { headers: noStore });
  } catch {
    return jsonError('E-poçt statusunu yoxlamaq mümkün olmadı.', 500);
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return jsonError('İcazə yoxdur.', 403);
  const { admin, error } = await requireAdmin();
  if (error) return error;
  if (!admin) return jsonError('Server konfiqurasiyası çatışmır.', 503);

  let input: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 2000) return jsonError('Sorğu çox böyükdür.', 413);
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('INVALID');
    input = parsed as Record<string, unknown>;
  } catch {
    return jsonError('Sorğu formatı düzgün deyil.', 400);
  }
  const id = input.submissionId;
  if (typeof id !== 'string' || !UUID.test(id)) return jsonError('Tapşırıq ID-si düzgün deyil.', 400);
  const initializeHistorical = input.initializeHistorical === true;
  const confirmHistorical = input.confirmHistorical === true;
  const retryFailed = input.retryFailed === true;
  const retryUncertain = input.retryUncertain === true;
  if (retryUncertain && input.confirmPossibleDuplicate !== true) {
    return jsonError('Nəticəsi qeyri-müəyyən məktubu təkrar göndərmək üçün təsdiq lazımdır.', 400);
  }

  try {
    const latest = await getLatest(admin, id);
    if (!latest.found) return jsonError('Təqdimat tapılmadı.', 404);
    if (!latest.review) return jsonError('Təqdimat tapılmadı.', 404);

    let existingDelivery = latest.delivery;
    if (!existingDelivery) {
      if (!canInitializeHistorical(latest.review, null)) {
        return jsonError('Bu qərar üçün email qeydi tapılmadı. Yeni qərarlar avtomatik növbəyə əlavə edilməlidir.', 409);
      }
      if (!initializeHistorical || !confirmHistorical) {
        return jsonError('Əvvəlki qərar üçün məktub yalnız adminin ayrıca təsdiqi ilə göndərilə bilər.', 409);
      }

      // Fetch the exact previously reviewed decision. Do not update the
      // underlying submission: changing reviewed_at would create fake review
      // events and duplicate in-app notifications.
      const { data: review, error: reviewError } = await admin.from('task_submissions')
        .select('id,student_id,task_id,status,admin_feedback,reviewed_at,reviewed_by')
        .eq('id', id).maybeSingle();
      if (reviewError || !review || !canInitializeHistorical(review as ReviewRow, null)
        || review.reviewed_at !== latest.review.reviewed_at
        || review.status !== latest.review.status) {
        return jsonError('Tapşırıq qərarı dəyişib. Səhifəni yeniləyin.', 409);
      }
      const [{ data: profile, error: profileError }, { data: task, error: taskError }] = await Promise.all([
        admin.from('profiles').select('user_id').eq('id', review.student_id).maybeSingle(),
        admin.from('internship_tasks').select('title').eq('id', review.task_id).maybeSingle(),
      ]);
      if (profileError || taskError || !profile?.user_id || !task?.title) {
        return jsonError('Tələbə və ya tapşırıq məlumatları tapılmadı.', 422);
      }
      const { error: insertError } = await admin.from('task_review_email_deliveries')
        .insert({
          submission_id: review.id,
          recipient_user_id: profile.user_id,
          task_id: review.task_id,
          task_title: task.title,
          review_status: review.status,
          review_feedback: review.admin_feedback || '',
          reviewed_at: review.reviewed_at,
          event_key: 'task-review:historical:' + review.id + ':' + review.reviewed_at,
        });
      if (insertError?.code === '23505') {
        return jsonError('Bu qərar üçün email artıq qeydiyyata alınıb. Statusu yeniləyin.', 409);
      }
      if (insertError) {
        console.error('Historical task review email enqueue failed:',insertError.code);
        return jsonError('Əvvəlki qərar üçün email növbəsi yaradıla bilmədi.',500);
      }
      const refreshed = await getLatest(admin, id);
      if (!refreshed.delivery || !refreshed.review ||
          refreshed.review.status !== review.status ||
          refreshed.review.reviewed_at !== review.reviewed_at) {
        return jsonError('Qərar yenilənib. Email göndərilmədi; statusu yoxlayın.',409);
      }
      existingDelivery = refreshed.delivery;
    }

    let job = existingDelivery;
    // Interrupted requests might already have reached Gmail. Never auto-retry.
    if (job.status === 'sending' && job.claimed_at
      && Date.now() - new Date(job.claimed_at).getTime() > 10 * 60_000) {
      const { data, error: staleError } = await admin.from('task_review_email_deliveries')
        .update({ status: 'uncertain', last_error_code: 'INTERRUPTED_UNCONFIRMED' })
        .eq('id', job.id).eq('status', 'sending').select('*').maybeSingle();
      if (staleError) throw new Error('REVIEW_EMAIL_STALE_WRITE_FAILED');
      if (data) job = data as Delivery;
    }
    const allowed = job.status === 'queued'
      || (retryFailed && job.status === 'failed')
      || (retryUncertain && input.confirmPossibleDuplicate === true && job.status === 'uncertain');
    if (!allowed) {
      return NextResponse.json({ delivery: publicStatus(job), processed: false }, { headers: noStore });
    }
    if (job.attempts >= 5) return jsonError('Email üçün maksimum 5 göndəriş cəhdi istifadə olunub.', 429);
    if (job.status !== 'queued' && job.claimed_at
      && Date.now() - new Date(job.claimed_at).getTime() < 60_000) {
      return jsonError('Yenidən göndərmək üçün ən azı 60 saniyə keçməlidir.', 429);
    }
    if (!isGmailConfigured()) return jsonError('Gmail konfiqurasiya olunmayıb; qərar və email növbəsi saxlanılıb.', 503);

    // Compare-and-swap claim is atomic, even if two admins click simultaneously.
    const { data: claimed, error: claimError } = await admin.from('task_review_email_deliveries')
      .update({
        status: 'sending',
        attempts: job.attempts + 1,
        claimed_at: new Date().toISOString(),
        last_error_code: null,
        sent_at: null,
      })
      .eq('id', job.id).eq('status', job.status).eq('attempts', job.attempts)
      .select('*').maybeSingle();
    if (claimError) throw new Error('REVIEW_EMAIL_CLAIM_FAILED');
    if (!claimed) return jsonError('Email göndərişi başqa sorğuda icra olunur.', 409);
    job = claimed as Delivery;

    try {
      const { data: current, error: reviewError } = await admin.from('task_submissions')
        .select('id,student_id,status,reviewed_at').eq('id',id).maybeSingle();
      if (reviewError) throw new Error('REVIEW_EMAIL_CURRENT_DECISION_LOOKUP_FAILED');
      if (!current || !isSameDecision(current as ReviewRow,job)) {
        await finish(admin,job,'skipped','STALE_DECISION');
        return NextResponse.json({ delivery: { state: 'skipped', attempts: job.attempts, errorCode:'STALE_DECISION' }, processed: false }, { headers: noStore });
      }
      const { data: profile, error: profileError } = await admin.from('profiles')
        .select('user_id,full_name').eq('id',current.student_id).maybeSingle();
      if (profileError) throw new Error('REVIEW_EMAIL_STUDENT_LOOKUP_FAILED');
      if (!profile || profile.user_id !== job.recipient_user_id) {
        await finish(admin,job,'skipped','RECIPIENT_MISMATCH');
        return NextResponse.json({ delivery:{state:'skipped',attempts:job.attempts,errorCode:'RECIPIENT_MISMATCH'},processed:false }, { headers:noStore });
      }
      const { data: userData, error: userError } = await admin.auth.admin.getUserById(job.recipient_user_id);
      if (userError) throw new Error('REVIEW_EMAIL_AUTH_LOOKUP_FAILED');
      const recipient = userData.user;
      if (!recipient?.email) {
        await finish(admin,job,'skipped','RECIPIENT_EMAIL_MISSING');
        return NextResponse.json({ delivery:{state:'skipped',attempts:job.attempts,errorCode:'RECIPIENT_EMAIL_MISSING'},processed:false }, { headers:noStore });
      }
      if (!shouldSendNotification(recipient.user_metadata,'task_review_updates')) {
        await finish(admin,job,'skipped','PREFERENCE_DISABLED');
        return NextResponse.json({ delivery:{state:'skipped',attempts:job.attempts,errorCode:'PREFERENCE_DISABLED'},processed:false }, { headers:noStore });
      }
      const message = buildTaskReviewEmail({
        fullName: profile.full_name || 'Tələbə',
        taskTitle: job.task_title,
        status: job.review_status,
        feedback: job.review_feedback,
        taskId: job.task_id,
      });
      await sendGmailEmail(recipient.email,message);
      await finish(admin,job,'sent');
      return NextResponse.json({ delivery:{state:'sent',attempts:job.attempts,sentAt:new Date().toISOString()},processed:true }, { headers:noStore });
    } catch (sendError) {
      const failure = classifyDeliveryFailure(sendError);
      try { await finish(admin,job,failure.state,failure.code); }
      catch (updateError) {
        console.error('Task review email status finalization failed:',updateError instanceof Error ? updateError.message:'UNKNOWN');
        return jsonError('Email statusunu qeydə almaq mümkün olmadı. Təkrar göndərməzdən əvvəl yoxlayın.',502);
      }
      console.error('Task review email delivery failed:',failure.code);
      return NextResponse.json({ delivery:{state:failure.state,attempts:job.attempts,errorCode:failure.code},processed:true }, { headers:noStore });
    }
  } catch (error) {
    console.error('Task review email request failed:',error instanceof Error ? error.message:'UNKNOWN');
    return jsonError('Email göndərişini işləmək mümkün olmadı; qərar saxlanılıb.',500);
  }
}
