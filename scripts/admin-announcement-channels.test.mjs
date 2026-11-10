import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { validateAnnouncement } from '../lib/announcements/validation.ts';

const read = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const input = {
  title: 'Yeni təcrübə proqramı',
  body: 'Tələbələr üçün yeni elan və müraciət qaydaları.',
  audience: 'individual',
  recipientEmail: ' Student@Example.com ',
  requestId: 'a8c1cc33-21c6-4e37-9e2a-500135675e2d',
};

test('all announcement channels are validated and individual email is normalized', () => {
  for (const channel of ['in_app', 'email', 'both']) {
    const result = validateAnnouncement({ ...input, channel });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.value.channel, channel);
      assert.equal(result.value.recipientEmail, 'student@example.com');
    }
  }
  assert.equal(validateAnnouncement({ ...input, channel: 'sms' }).success, false);
  assert.equal(validateAnnouncement({ ...input, channel: '' }).success, false);
  assert.equal(validateAnnouncement({ ...input, channel: 123 }).success, false);
});

test('email migration enables RLS, private grants and idempotent jobs', () => {
  const sql = read('supabase/migrations/20261110124144_admin_announcement_email_delivery.sql');
  assert.match(sql, /ALTER TABLE public.admin_announcements/);
  assert.match(sql, /CREATE TABLE public.admin_announcement_email_deliveries/);
  assert.match(sql, /UNIQUE\(announcement_id, user_id\)/);
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/);
  assert.match(sql, /REVOKE ALL ON TABLE public.admin_announcement_email_deliveries FROM PUBLIC, anon, authenticated/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public.publish_admin_announcement_v2/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public.claim_admin_announcement_email_jobs/);
  assert.match(sql, /SECURITY DEFINER SET search_path = ''/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /FOR UPDATE SKIP LOCKED/);
  assert.match(sql, /status='uncertain'/);
  assert.match(sql, /attempts<10/);
});

test('student discovery and email delivery are strictly admin protected', () => {
  for (const file of [
    'app/api/admin/announcements/students/route.ts',
    'app/api/admin/announcements/deliver-emails/route.ts',
  ]) {
    const source = read(file);
    assert.match(source, /auth.getUser\(\)/);
    assert.match(source, /isSoleAdminEmail/);
    assert.match(source, /Cache-Control.*private, no-store/);
  }
  const deliver = read('app/api/admin/announcements/deliver-emails/route.ts');
  assert.match(deliver, /isGmailConfigured\(\)/);
  assert.match(deliver, /sendGmailEmail\(/);
  assert.match(deliver, /confirmPossibleDuplicate/);
  assert.match(deliver, /\.eq\('status', 'sending'\)/);
});

test('composer supports searchable student picker, channel and durable email status', () => {
  const source = read('app/admin/notifications/page.tsx');
  assert.match(source, /announcements\/students\?search=/);
  assert.match(source, /<option value="in_app">/);
  assert.match(source, /<option value="email">/);
  assert.match(source, /<option value="both">/);
  assert.match(source, /aria-pressed=/);
  assert.match(source, /deliver-emails/);
  assert.match(source, /failed_count/);
  assert.match(source, /uncertain_count/);
});

test('email-only null delivery count regression is fixed in the applied migration', () => {
  const sql = read('supabase/migrations/20261110134238_fix_announcement_email_only_delivered_count.sql');
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\\.publish_admin_announcement_v2/);
  assert.match(sql, /END IF;\\s+-- SELECT INTO with zero rows resets v_delivered to NULL\\.\\s+-- Email-only mode does not run the student_notifications INSERT\\.\\s+v_delivered := 0;/);
  assert.match(sql, /UPDATE public\\.admin_announcements a\\s+SET delivered_count=v_delivered/);
});

test('student choice collapses list and typing reopens it', () => {
  const page = read('app/admin/notifications/page.tsx');
  assert.match(page, /const \\[studentPickerOpen, setStudentPickerOpen\\] = useState\\(false\\)/);
  assert.match(page, /onFocus=\\{\\(\\) => setStudentPickerOpen\\(true\\)\\}/);
  assert.match(page, /\\{studentPickerOpen && \\(/);
  assert.match(page, /setForm\\(prev => \\(\\{ \\.\\.\\.prev, recipientEmail: student\\.email \\}\\)\\);\\s+setStudentSearch\\(''\\);\\s+setStudentPickerOpen\\(false\\)/);
  assert.match(page, /onKeyDown=\\{event => \\{ if \\(event\\.key === 'Escape'\\) setStudentPickerOpen\\(false\\); \\}\\}/);
});
