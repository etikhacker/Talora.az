import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('public availability is aggregated server-side, no private enrollment identities', () => {
  const api = read('app/api/internships/public/route.ts');
  const byId = read('app/api/internships/[id]/seats/route.ts');
  const migration = read('scripts/admin-badges-and-seats.sql');
  assert.match(api, /rpc\('get_public_internship_seats'\)/);
  assert.match(api, /seat_availability/);
  assert.match(byId, /p_internship_id: id/);
  assert.match(migration, /WHERE i.status='published'/);
  assert.match(migration, /en.status='active'/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public.get_public_internship_seats\(uuid\) TO anon, authenticated/);
  assert.doesNotMatch(api, /createAdminClient|service_role|\.from\('enrollments'\)/);
});

test('remaining seat labels and cards never invent count if unavailable', () => {
  const types = read('lib/internships/seats.ts');
  const card = read('app/internships/page.tsx');
  const details = read('app/internships/[slug]/page.tsx');
  assert.match(types, /if \(!seat\) return null/);
  assert.match(types, /seat.remaining_seats === 0/);
  assert.match(types, /seat.capacity === null/);
  assert.match(card, /InternshipSeatIndicator/);
  assert.match(details, /InternshipSeatIndicator/);
  assert.match(details, /\/api\/internships\//);
});

test('admin badge sections use authenticated read-state and polling', () => {
  const sidebar = read('components/admin/admin-sidebar.tsx');
  const helper = read('lib/admin/sidebar-badges.ts');
  const sql = read('scripts/admin-badges-and-seats.sql');
  for (const section of [
    'internships','applications','tasks','submissions','students',
    'completed','certificate-orders','certificates','contact-messages',
  ]) {
    assert.ok(helper.includes(section), section);
    assert.ok(sql.includes("'" + section + "'"), section);
  }
  assert.match(sidebar, /get_admin_sidebar_counts/);
  assert.match(sidebar, /mark_admin_sidebar_seen/);
  assert.match(sidebar, /visibilitychange/);
  assert.match(sidebar, /60_000/);
  assert.match(sql, /private\.is_admin\(\)/);
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/);
  assert.match(sql, /REVOKE ALL ON TABLE private\.admin_section_seen/);
});
