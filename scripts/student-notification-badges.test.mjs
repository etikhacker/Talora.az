import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('student sidebar shows owner unread count in desktop and mobile navigation', () => {
  const source = read('components/dashboard/student-sidebar.tsx');
  assert.ok(source.includes('useNotifications()'));
  assert.ok(source.includes('item.href === "/dashboard/notifications" && unreadCount > 0'));
  assert.ok(source.includes('unreadCount > 99 ? "99+" : unreadCount'));
  assert.ok(source.includes('aria-label={language === "az"'));
  assert.ok(!source.includes('service_role'));
});

test('bell toast announces only newly delivered unread notifications, not existing initial count', () => {
  const provider = read('components/dashboard/notification-provider.tsx');
  const topbar = read('components/dashboard/workspace-topbar.tsx');
  assert.ok(provider.includes('previousUnreadCount.current'));
  assert.ok(provider.includes('previous !== null && nextUnreadCount > previous'));
  assert.ok(provider.includes('newArrivalCount'));
  assert.ok(provider.includes('dismissNewArrivals'));
  assert.ok(topbar.includes('aria-live="polite"'));
  assert.ok(topbar.includes('newArrivalCount > 0'));
  assert.ok(topbar.includes('href="/dashboard/notifications"'));
  assert.ok(topbar.includes('onClick={dismissNewArrivals}'));
});

test('existing notification inbox remains owner-scoped and refreshes in browser', () => {
  const source = read('components/dashboard/notification-provider.tsx');
  assert.ok(source.includes(".from('student_notifications')"));
  assert.ok(source.includes(".eq('user_id', userId)"));
  assert.ok(source.includes(".is('read_at', null)"));
  assert.ok(source.includes("window.addEventListener('focus', onVisible)"));
  assert.ok(source.includes("window.setInterval(onVisible, 60000)"));
  assert.ok(source.includes("client.from('student_notifications').update({ read_at:"));
  const grant = read('scripts/student-inbox-read-grant.sql');
  assert.ok(grant.includes('GRANT UPDATE (read_at)'));
  assert.ok(!grant.includes('GRANT UPDATE ON TABLE'));
});
