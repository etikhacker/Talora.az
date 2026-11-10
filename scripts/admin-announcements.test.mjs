import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { validateAnnouncement } from '../lib/announcements/validation.ts';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const valid = {
  title: 'Yeni proqram elan edilir',
  body: 'Tələbələr üçün ətraflı məlumat və müraciət qaydaları.',
  audience: 'all',
  recipientEmail: null,
  requestId: '36d50fd7-c221-4fbd-a8a8-84b795086055',
};

test('broadcast and active trainee notifications require validated content and request UUID', () => {
  for (const audience of ['all', 'active']) {
    const result = validateAnnouncement({ ...valid, audience });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.value.audience, audience);
      assert.equal(result.value.recipientEmail, null);
    }
  }
  assert.equal(validateAnnouncement({ ...valid, requestId: 'not-a-uuid' }).success, false);
  assert.equal(validateAnnouncement({ ...valid, title: 'AB' }).success, false);
  assert.equal(validateAnnouncement({ ...valid, body: 'too short' }).success, false);
  assert.equal(validateAnnouncement({ ...valid, title: 'A'.repeat(121) }).success, false);
  assert.equal(validateAnnouncement({ ...valid, body: 'B'.repeat(2001) }).success, false);
});

test('individual notification requires valid email and blocks additional bulk email', () => {
  const personal = validateAnnouncement({
    ...valid, audience: 'individual', recipientEmail: ' Student@Example.COM ',
  });
  assert.equal(personal.success, true);
  if (personal.success) assert.equal(personal.value.recipientEmail, 'student@example.com');
  for (const recipientEmail of ['', 'bad@', 'a\nb@example.com']) {
    assert.equal(validateAnnouncement({ ...valid, audience: 'individual', recipientEmail }).success, false);
  }
  assert.equal(validateAnnouncement({ ...valid, recipientEmail: 'anyone@example.com' }).success, false);
  assert.equal(validateAnnouncement({ ...valid, audience: 'other' }).success, false);
});

test('database migration delivers atomically with idempotency and locked-down API roles', () => {
  const sql = read('supabase/migrations/20261110104253_admin_announcements.sql');
  assert.match(sql, /CREATE TABLE public\.admin_announcements/);
  assert.match(sql, /request_id uuid NOT NULL UNIQUE/);
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/);
  assert.match(sql, /REVOKE ALL ON TABLE public\.admin_announcements FROM PUBLIC, anon, authenticated/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.publish_admin_announcement\(text,text,text,text,uuid\)\s+TO service_role/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.publish_admin_announcement\(text,text,text,text,uuid\)\s+FROM PUBLIC, anon, authenticated/);
  assert.match(sql, /SECURITY DEFINER SET search_path = ''/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /WHERE a\.request_id = p_request_id/);
  assert.match(sql, /GET DIAGNOSTICS v_count = ROW_COUNT/);
  assert.match(sql, /INSERT INTO public\.student_notifications/);
  assert.match(sql, /event_key/);
  assert.match(sql, /p\.role = 'student'/);
  assert.match(sql, /SELECT 1 FROM public\.enrollments e/);
  assert.match(sql, /v_count > 500/);
  assert.doesNotMatch(sql, /GRANT (ALL|EXECUTE).*TO (anon|authenticated)/);
});

test('admin API authorizes sole admin, validates and never sends external emails', () => {
  const route = read('app/api/admin/announcements/route.ts');
  assert.match(route, /session\.auth\.getUser\(\)/);
  assert.match(route, /isSoleAdminEmail\(data\.user\.email\)/);
  assert.match(route, /validateAnnouncement\(parsed\)/);
  assert.match(route, /admin\.rpc\('publish_admin_announcement'/);
  assert.match(route, /Cache-Control.*private, no-store/);
  assert.doesNotMatch(route, /sendGmail|fetch\(['"]https:\/\//);
});

test('admin composer is connected and students can read new announcements in existing inbox', () => {
  const admin = read('app/admin/notifications/page.tsx');
  const student = read('app/dashboard/notifications/page.tsx');
  const types = read('lib/notifications/inbox.ts');
  assert.match(admin, /onClick=\{openComposer\}/);
  assert.match(admin, /fetch\('\/api\/admin\/announcements'/);
  assert.match(admin, /method: 'POST'/);
  assert.match(admin, /window\.confirm/);
  assert.match(admin, /requestId/);
  assert.match(admin, /role="dialog"/);
  assert.match(types, /'announcement:published'/);
  assert.match(student, /item\.kind === 'announcement' \? Bell/);
});
