import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { isSoleAdminEmail } from '@/lib/auth/admin';
import { validateAnnouncement } from '@/lib/announcements/validation';
import { isGmailConfigured } from '@/lib/email/gmail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'private, no-store' };
const MAX_REQUEST_CHARS = 9_000;

type HistoryRow = {
  id: string;
  title: string;
  body: string;
  audience: string;
  recipient_email: string | null;
  delivered_count: number;
  delivery_channel: string;
  created_at: string;
};

type SummaryRow = {
  announcement_id: string;
  queued_count: number;
  sending_count: number;
  sent_count: number;
  failed_count: number;
  uncertain_count: number;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: noStore });
}

async function requireAdmin() {
  const session = await createClient();
  if (!session) return { error: jsonError('Server konfiqurasiyası çatışmır.', 503), admin: null };
  const { data, error } = await session.auth.getUser();
  if (error || !data.user) return { error: jsonError('Daxil olmalısınız.', 401), admin: null };
  if (!isSoleAdminEmail(data.user.email)) return { error: jsonError('İcazə yoxdur.', 403), admin: null };
  const admin = await createAdminClient();
  if (!admin) return { error: jsonError('Server konfiqurasiyası çatışmır.', 503), admin: null };
  return { error: null, admin };
}

export async function GET() {
  const { error: authError, admin } = await requireAdmin();
  if (authError || !admin) return authError;
  const { data, error } = await admin
    .from('admin_announcements')
    .select('id,title,body,audience,recipient_email,delivered_count,delivery_channel,created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    console.error('Admin announcement history read failed:', error.code);
    return jsonError('Elan tarixçəsini yükləmək mümkün olmadı.', 500);
  }
  const ids = ((data || []) as HistoryRow[]).map(item => item.id);
  if (!ids.length) return NextResponse.json({ announcements: [] }, { headers: noStore });
  const { data: summaries, error: summaryError } = await admin
    .rpc('admin_announcement_email_summaries', { p_ids: ids });
  if (summaryError) {
    console.error('Admin announcement email summary read failed:', summaryError.code);
    return jsonError('Elan statuslarını yükləmək mümkün olmadı.', 500);
  }
  const byId = new Map(((summaries || []) as SummaryRow[]).map(item => [item.announcement_id, item]));
  const announcements = ((data || []) as HistoryRow[]).map(item => ({
    ...item,
    email_delivery: byId.get(item.id) || null,
  }));
  return NextResponse.json({ announcements }, { headers: noStore });
}

export async function POST(request: NextRequest) {
  const { error: authError, admin } = await requireAdmin();
  if (authError || !admin) return authError;

  const length = Number(request.headers.get('content-length'));
  if (Number.isFinite(length) && length > MAX_REQUEST_CHARS) {
    return jsonError('Elan sorğusu çox böyükdür.', 413);
  }

  let parsed: unknown;
  try {
    const raw = await request.text();
    if (raw.length > MAX_REQUEST_CHARS) return jsonError('Elan sorğusu çox böyükdür.', 413);
    parsed = JSON.parse(raw);
  } catch {
    return jsonError('Sorğu formatı düzgün deyil.', 400);
  }

  const validation = validateAnnouncement(parsed);
  if (!validation.success) return jsonError(validation.error, 400);
  const { title, body, audience, recipientEmail, requestId, channel } = validation.value;
  if (channel !== 'in_app' && !isGmailConfigured()) {
    return jsonError('E-poçt göndərişi konfiqurasiya olunmayıb.', 503);
  }

  try {
    // Transactionally stores inbox entries and/or email delivery jobs.
    // No external API calls are made inside this idempotent POST.
    const { data, error } = await admin.rpc('publish_admin_announcement_v2', {
      p_title: title,
      p_body: body,
      p_audience: audience,
      p_recipient_email: recipientEmail,
      p_request_id: requestId,
      p_channel: channel,
    });

    if (error) {
      const code = error.message || '';
      if (code.includes('ANNOUNCEMENT_NO_RECIPIENTS')) {
        return jsonError('Bu seçimə uyğun tələbə tapılmadı. Heç bir elan göndərilmədi.', 422);
      }
      if (code.includes('ANNOUNCEMENT_BULK_COOLDOWN')) {
        return jsonError('Kütləvi elanlar arasında ən azı 60 saniyə interval olmalıdır.', 429);
      }
      if (code.includes('ANNOUNCEMENT_NO_EMAIL_RECIPIENTS')) {
        return jsonError('Seçilmiş tələbələrin etibarlı e-poçt ünvanı yoxdur.', 422);
      }
      if (code.includes('ANNOUNCEMENT_RECIPIENT_LIMIT')) {
        return jsonError('Bir elanın alıcı sayı 500-dən çox ola bilməz.', 422);
      }
      if (code.includes('ANNOUNCEMENT_INPUT_INVALID') || code.includes('ANNOUNCEMENT_RECIPIENT_INVALID')) {
        return jsonError('Elan məlumatları və ya alıcı düzgün deyil.', 400);
      }
      console.error('Admin announcement publish failed:', error.code);
      return jsonError('Elan göndərilmədi. Server yoxlamasını təkrar edin.', 500);
    }

    const published = Array.isArray(data) ? data[0] : null;
    if (!published || typeof published.announcement_id !== 'string') {
      console.error('Admin announcement publish returned an invalid receipt');
      return jsonError('Göndərişin nəticəsini təsdiqləmək mümkün olmadı. Tarixçəni yoxlayın.', 502);
    }
    return NextResponse.json({
      id: published.announcement_id,
      deliveredCount: published.delivered_count,
      createdAt: published.published_at,
      channel,
      emailQueued: published.email_queued,
    }, { status: 200, headers: noStore });
  } catch {
    return jsonError('Server xətası baş verdi. Təkrar göndərməzdən əvvəl tarixçəni yoxlayın.', 502);
  }
}
