import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = (name) => readFileSync(new URL('../' + name, import.meta.url), 'utf8');

test('admin student detail uses role-restricted RPC, never service role credentials', () => {
  const page = source('app/admin/students/page.tsx');
  assert.match(page, /get_admin_student_activity/);
  assert.match(page, /p_profile_id: student.id/);
  assert.match(page, /onClick=\{\(\) => void openStudent\(student\)\}/);
  assert.match(page, /role="dialog"/);
  assert.match(page, /last_sign_in_at/);
  assert.match(page, /last_seen_at/);
  assert.match(page, /last_seen_at/);
  assert.match(page, /Asia\/Baku/);
  assert.match(page, /application_submitted/);
  assert.match(page, /task_submitted/);
  assert.doesNotMatch(page, /SUPABASE_SERVICE_ROLE_KEY|createAdminClient|auth\.admin/);
});

test('presence tracking is minimally scoped, throttled and sign-in protected', () => {
  const provider = source('components/layout/providers.tsx');
  const tracker = source('components/layout/student-presence.tsx');
  const sql = source('scripts/student-presence-and-admin-activity.sql');
  assert.match(provider, /<StudentPresence \/>/);
  assert.match(tracker, /profile\?\.role !== 'student'/);
  assert.match(tracker, /touch_student_presence/);
  assert.match(tracker, /120_000/);
  assert.match(tracker, /180_000/);
  assert.match(sql, /WHERE p\.user_id=v_user AND p\.role='student'/);
  assert.match(sql, /private\.student_presence/);
  assert.match(sql, /REFERENCES auth\.users\(id\) ON DELETE CASCADE/);
  assert.match(sql, /get_admin_student_activity/);
  assert.match(sql, /private\.is_admin\(\)/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.get_admin_student_activity/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.get_admin_student_activity\(uuid\) TO authenticated/);
  assert.doesNotMatch(sql, /create policy .*using \(true\)|client_ip|ip_address|user_agent|page_url/ig);
});

test('desktop internship cards are compact with accessible card information preserved', () => {
  const page = source('app/internships/page.tsx');
  const artwork = source('components/internships/program-artwork.css');
  assert.match(page, /grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4/);
  assert.match(page, /catalogue-card bg-white rounded-xl border border-slate-200 p-4 sm:p-5/);
  assert.match(page, /<InternshipSeatIndicator/);
  assert.match(page, /line-clamp-2/);
  assert.match(page, /\/internships\/\$\{internship\.slug\}/);
  assert.match(artwork, /\.catalogue-card \.program-artwork \{ aspect-ratio:auto; height:clamp/);
  assert.match(artwork, /prefers-reduced-motion/);
});
