import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { adminRouteDestination, isAdminRoute } from '../lib/auth/admin-route-gate.ts';

test('anonymous visitors cannot view any admin page including former login', () => {
  for (const pathname of [
    '/admin', '/admin/', '/admin/login', '/admin/login/',
    '/admin/students', '/admin/applications/111', '/ADMIN',
    '/AdMiN/LOGIN', '/admin/settings/',
  ]) {
    assert.equal(isAdminRoute(pathname), true, pathname);
    assert.equal(adminRouteDestination(pathname, false, false), '/', pathname);
  }
});

test('authenticated students never see admin console or former admin login', () => {
  for (const pathname of ['/admin', '/admin/login', '/ADMIN/notifications']) {
    assert.equal(adminRouteDestination(pathname, true, false), '/dashboard', pathname);
  }
});

test('verified admins retain console access and old login URL redirects to console', () => {
  assert.equal(adminRouteDestination('/admin', true, true), null);
  assert.equal(adminRouteDestination('/admin/students', true, true), null);
  assert.equal(adminRouteDestination('/admin/login', true, true), '/admin');
  assert.equal(adminRouteDestination('/ADMIN/LOGIN/', true, true), '/admin');
});

test('normal public URLs are unaffected and admin prefix cannot swallow lookalikes', () => {
  for (const pathname of ['/', '/login', '/register', '/dashboard', '/administer', '/admin-panel']) {
    assert.equal(isAdminRoute(pathname), false);
    assert.equal(adminRouteDestination(pathname, false, false), null);
  }
});

test('middleware applies verified Supabase Auth and fail-closed routing', () => {
  const middleware = readFileSync(new URL('../lib/supabase/middleware.ts', import.meta.url), 'utf8');
  assert.match(middleware, /supabase\.auth\.getUser\(\)/);
  assert.match(middleware, /isSoleAdminEmail\(user\?\.email\)/);
  assert.match(middleware, /adminRouteDestination\(pathname, Boolean\(user\), isAdmin\)/);
  assert.match(middleware, /const isProtectedArea = isAdminArea \|\| isDashboardArea;/);
  assert.match(middleware, /if \(isAdminArea\) \{\s*return redirectTo\(request, '\/'\);/);
  assert.doesNotMatch(middleware, /return redirectTo\(request, '\/admin\/login'/);
  assert.match(middleware, /private, no-store/);
});

test('the old admin login page is removed; shared login still supports admin users', () => {
  assert.equal(existsSync(new URL('../app/admin/login/page.tsx', import.meta.url)), false);
  const login = readFileSync(new URL('../app/(auth)/login/page.tsx', import.meta.url), 'utf8');
  assert.match(login, /if \(res\.role === 'admin'\) \{\s*router\.replace\('\/admin'\);/);
  const layout = readFileSync(new URL('../app/admin/layout.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(layout, /\/admin\/login/);
  assert.match(layout, /if \(!user\) router\.replace\('\/'\)/);
});
