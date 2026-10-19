import { NextRequest, NextResponse } from 'next/server';
import { isSoleAdminEmail } from '@/lib/auth/admin';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { isGmailConfigured, sendGmailBatchEmail, sendGmailEmail } from '@/lib/email/gmail';
import {
  buildApplicationStatusEmail,
  buildInternshipAnnouncementEmail,
  shouldSendNotification,
} from '@/lib/email/gmail-helpers';

export const runtime = 'nodejs';
export const maxDuration = 60;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STUDENT_PAGE_SIZE = 500;
const AUTH_PAGE_SIZE = 1000;
const MAX_ANNOUNCEMENT_RECIPIENTS = 500;
const ANNOUNCEMENT_BATCH_SIZE = 50;

function getAppBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (configuredUrl) {
    try {
      const parsed = new URL(configuredUrl);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return parsed.origin;
    } catch {
      // Use the Vercel production URL fallback below.
    }
  }

  return 'https://talora-az.vercel.app';
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function sendApplicationStatusEmail(admin: NonNullable<Awaited<ReturnType<typeof createAdminClient>>>, id: string) {
  const { data: application, error: applicationError } = await admin
    .from('applications')
    .select('id,status,student_id,internship_id')
    .eq('id', id)
    .maybeSingle();

  if (applicationError) throw new Error('APPLICATION_LOOKUP_FAILED');
  if (!application) return { sent: 0, skipped: 1, failed: 0, reason: 'application_not_found' };
  if (application.status !== 'accepted' && application.status !== 'rejected') {
    return { sent: 0, skipped: 1, failed: 0, reason: 'application_not_reviewed' };
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('user_id,full_name')
    .eq('id', application.student_id)
    .maybeSingle();

  if (profileError) throw new Error('STUDENT_PROFILE_LOOKUP_FAILED');
  if (!profile?.user_id) return { sent: 0, skipped: 1, failed: 0, reason: 'student_profile_missing' };

  const { data: authUserData, error: authUserError } = await admin.auth.admin.getUserById(profile.user_id);
  if (authUserError) throw new Error('STUDENT_AUTH_LOOKUP_FAILED');
  const recipient = authUserData.user;
  const email = recipient?.email;
  if (!recipient || !email) return { sent: 0, skipped: 1, failed: 0, reason: 'student_email_missing' };
  if (!shouldSendNotification(recipient.user_metadata, 'application_status_updates')) {
    return { sent: 0, skipped: 1, failed: 0, reason: 'preference_disabled' };
  }

  const { data: internship, error: internshipError } = await admin
    .from('internships')
    .select('title')
    .eq('id', application.internship_id)
    .maybeSingle();

  if (internshipError) throw new Error('INTERNSHIP_LOOKUP_FAILED');
  if (!internship) return { sent: 0, skipped: 1, failed: 0, reason: 'internship_missing' };

  await sendGmailEmail(email, buildApplicationStatusEmail({
    fullName: profile.full_name || 'Tələbə',
    internshipTitle: internship.title,
    status: application.status,
    applicationUrl: `${getAppBaseUrl()}/dashboard/applications`,
  }));

  return { sent: 1, skipped: 0, failed: 0 };
}

async function sendNewInternshipEmails(admin: NonNullable<Awaited<ReturnType<typeof createAdminClient>>>, id: string) {
  const { data: internship, error: internshipError } = await admin
    .from('internships')
    .select('id,title,slug,short_description,status')
    .eq('id', id)
    .maybeSingle();

  if (internshipError) throw new Error('INTERNSHIP_LOOKUP_FAILED');
  if (!internship || internship.status !== 'published') {
    return { sent: 0, skipped: 0, failed: 0, reason: 'internship_not_published' };
  }

  const studentIds = new Set<string>();
  for (let offset = 0; ; offset += STUDENT_PAGE_SIZE) {
    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('user_id')
      .eq('role', 'student')
      .range(offset, offset + STUDENT_PAGE_SIZE - 1);

    if (profilesError) throw new Error('STUDENT_LIST_FAILED');
    for (const profile of profiles || []) {
      if (profile.user_id) studentIds.add(profile.user_id);
    }
    if (!profiles || profiles.length < STUDENT_PAGE_SIZE) break;
  }

  if (studentIds.size === 0) return { sent: 0, skipped: 0, failed: 0 };

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  let enabledRecipientsSeen = 0;
  const recipientEmails: string[] = [];
  const internshipUrl = `${getAppBaseUrl()}/internships/${encodeURIComponent(internship.slug)}`;
  const message = buildInternshipAnnouncementEmail({
    title: internship.title,
    shortDescription: internship.short_description,
    internshipUrl,
  });

  for (let page = 1; ; page += 1) {
    const { data, error: usersError } = await admin.auth.admin.listUsers({ page, perPage: AUTH_PAGE_SIZE });
    if (usersError) throw new Error('STUDENT_AUTH_LIST_FAILED');

    for (const user of data.users) {
      if (!studentIds.has(user.id)) continue;
      if (!user.email || !user.email_confirmed_at || !shouldSendNotification(user.user_metadata, 'new_internship_announcements')) {
        skipped += 1;
        continue;
      }

      enabledRecipientsSeen += 1;
      if (enabledRecipientsSeen > MAX_ANNOUNCEMENT_RECIPIENTS) {
        skipped += 1;
        continue;
      }

      recipientEmails.push(user.email);
    }

    if (data.users.length < AUTH_PAGE_SIZE) break;
  }

  for (let offset = 0; offset < recipientEmails.length; offset += ANNOUNCEMENT_BATCH_SIZE) {
    const batch = recipientEmails.slice(offset, offset + ANNOUNCEMENT_BATCH_SIZE);
    try {
      await sendGmailBatchEmail(batch, message);
      sent += batch.length;
    } catch (error) {
      failed += batch.length;
      console.error('Internship notification batch failed:', error instanceof Error ? error.message : 'Unknown SMTP error');
    }
  }

  return {
    sent,
    skipped,
    failed,
    capped: enabledRecipientsSeen > MAX_ANNOUNCEMENT_RECIPIENTS,
  };
}

export async function POST(request: NextRequest) {
  const sessionClient = await createClient();
  if (!sessionClient) return jsonError('Supabase konfiqurasiya edilməyib.', 503);

  const { data: { user }, error: authError } = await sessionClient.auth.getUser();
  if (authError || !user) return jsonError('Sessiya tapılmadı. Yenidən daxil olun.', 401);
  if (!isSoleAdminEmail(user.email)) return jsonError('Bu əməliyyat üçün icazə yoxdur.', 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Sorğu formatı düzgün deyil.', 400);
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonError('Sorğu formatı düzgün deyil.', 400);
  }

  const event = (body as Record<string, unknown>).event;
  const id = (body as Record<string, unknown>).id;
  if ((event !== 'application-status' && event !== 'new-internship') || typeof id !== 'string' || !UUID_PATTERN.test(id)) {
    return jsonError('Bildiriş hadisəsi və ID düzgün deyil.', 400);
  }

  if (!isGmailConfigured()) {
    return jsonError('Gmail göndərişi hələ konfiqurasiya edilməyib.', 503);
  }

  const admin = await createAdminClient();
  if (!admin) return jsonError('Supabase server key konfiqurasiya edilməyib.', 503);

  try {
    const result = event === 'application-status'
      ? await sendApplicationStatusEmail(admin, id)
      : await sendNewInternshipEmails(admin, id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Email notification request failed:', error instanceof Error ? error.message : 'Unknown notification error');
    return jsonError('Bildiriş e-poçtunu göndərmək mümkün olmadı.', 502);
  }
}
