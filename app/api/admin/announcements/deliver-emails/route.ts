import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { isSoleAdminEmail } from '@/lib/auth/admin';
import { isGmailConfigured, sendGmailEmail } from '@/lib/email/gmail';
import { parseAnnouncementDeliveryLookup } from '@/lib/announcements/delivery-lookup';
import { renderAnnouncementEmailHtml } from '@/lib/email/announcement-template';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const headers = { 'Cache-Control': 'private, no-store' };

interface EmailJob {
  job_id: string;
  recipient_email: string;
  subject: string;
  body: string;
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers });
}

function isCertainFailure(code: string): boolean {
  return /^(GMAIL_API_NOT_CONFIGURED|GMAIL_NOT_CONFIGURED|GMAIL_PROVIDER_INVALID|GMAIL_API_INVALID_|GMAIL_API_TOKEN_|GMAIL_API_SEND_HTTP_4)/.test(code);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).host !== request.nextUrl.host) return errorResponse('İcazə yoxdur.', 403);
    } catch {
      return errorResponse('İcazə yoxdur.', 403);
    }
  }
  const session = await createClient();
  if (!session) return errorResponse('Konfiqurasiya xətası.', 503);
  const { data, error } = await session.auth.getUser();
  if (error || !data.user) return errorResponse('Daxil olmalısınız.', 401);
  if (!isSoleAdminEmail(data.user.email)) return errorResponse('İcazə yoxdur.', 403);

  if (!isGmailConfigured()) return errorResponse('Gmail göndərişi konfiqurasiya olunmayıb.', 503);
  let input: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('INVALID');
    input = parsed as Record<string, unknown>;
  } catch {
    return errorResponse('Sorğu formatı düzgün deyil.', 400);
  }
  const lookup = parseAnnouncementDeliveryLookup(input);
  if (!lookup) return errorResponse('Elan və ya sorğu identifikatoru düzgün deyil.', 400);
  const retryFailed = input.retryFailed === true;
  const retryUncertain = input.retryUncertain === true && input.confirmPossibleDuplicate === true;
  if (input.retryUncertain === true && !retryUncertain) {
    return errorResponse('Qeyri-müəyyən göndərişi təkrarlamaq üçün ayrıca təsdiq tələb olunur.', 400);
  }

  const admin = await createAdminClient();
  if (!admin) return errorResponse('Konfiqurasiya xətası.', 503);
  const { data: announcement, error: lookupError } = await admin
    .from('admin_announcements').select('id,request_id,delivery_channel')
    .eq(lookup.column, lookup.value).maybeSingle();
  if (lookupError) return errorResponse('Elan yoxlanıla bilmədi.', 500);
  if (!announcement) return errorResponse('Elan tapılmadı.', 404);
  if (lookup.expectedId && announcement.id !== lookup.expectedId) {
    return errorResponse('Elan və sorğu identifikatorları uyğun gəlmir.', 409);
  }
  const announcementId = announcement.id;
  if (announcement.delivery_channel === 'in_app') {
    return errorResponse('Bu elanın e-poçt kanalı yoxdur.', 422);
  }

  const { data: claimed, error: claimError } = await admin.rpc('claim_admin_announcement_email_jobs', {
    p_announcement_id: announcementId,
    p_retry_failed: retryFailed,
    p_retry_uncertain: retryUncertain,
  });
  if (claimError) {
    console.error('Announcement email claim failed:', claimError.code);
    return errorResponse('Göndəriləcək email siyahısını əldə etmək mümkün olmadı.', 500);
  }
  const jobs = (Array.isArray(claimed) ? claimed : []) as EmailJob[];
  const results = await Promise.all(jobs.map(async job => {
    let status: 'sent' | 'failed' | 'uncertain' = 'sent';
    let code: string | null = null;
    try {
      await sendGmailEmail(job.recipient_email, {
        subject: job.subject,
        text: job.body,
        html: renderAnnouncementEmailHtml({ title: job.subject, body: job.body }),
      });
    } catch (error) {
      const raw = error instanceof Error ? error.message : 'DELIVERY_UNKNOWN';
      code = /^[A-Z0-9_]{1,80}$/.test(raw) ? raw : 'DELIVERY_UNKNOWN';
      status = isCertainFailure(code) ? 'failed' : 'uncertain';
      console.error('Announcement email delivery:', status, code);
    }
    const { error: updateError } = await admin
      .from('admin_announcement_email_deliveries')
      .update({
        status,
        last_error_code: code,
        sent_at: status === 'sent' ? new Date().toISOString() : null,
      })
      .eq('id', job.job_id).eq('status', 'sending');
    if (updateError) console.error('Announcement email receipt update failed:', updateError.code);
    return status;
  }));
  const { data: summary, error: summaryError } = await admin
    .rpc('admin_announcement_email_summaries', { p_ids: [announcementId] });
  if (summaryError) console.error('Announcement email summary unavailable:', summaryError.code);
  const totals = Array.isArray(summary) ? summary[0] || null : null;
  return NextResponse.json({
    processed: jobs.length,
    sent: results.filter(x => x === 'sent').length,
    failed: results.filter(x => x === 'failed').length,
    uncertain: results.filter(x => x === 'uncertain').length,
    summary: totals,
  }, { headers });
}
