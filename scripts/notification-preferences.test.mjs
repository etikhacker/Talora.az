import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  mergeNotificationPreferences,
  normalizeNotificationPreferences,
} from '../lib/notification-preferences.ts';

test('missing stored preferences use the existing enabled-by-default choices', () => {
  assert.deepEqual(normalizeNotificationPreferences(null), DEFAULT_NOTIFICATION_PREFERENCES);
});

test('saved false choices remain disabled when preferences are loaded again', () => {
  assert.deepEqual(
    normalizeNotificationPreferences({
      new_internship_announcements: false,
      application_status_updates: true,
      task_review_updates: true,
    }),
    {
      new_internship_announcements: false,
      application_status_updates: true,
      task_review_updates: true,
    }
  );
});

test('malformed or partial data cannot turn an explicitly disabled choice back on', () => {
  assert.deepEqual(
    normalizeNotificationPreferences({ new_internship_announcements: false }),
    {
      new_internship_announcements: false,
      application_status_updates: true,
      task_review_updates: true,
    }
  );
  assert.deepEqual(normalizeNotificationPreferences('invalid'), DEFAULT_NOTIFICATION_PREFERENCES);
});

test('saving notification choices preserves unrelated account metadata', () => {
  assert.deepEqual(
    mergeNotificationPreferences(
      { full_name: 'A student', university: 'MDU', notification_preferences: { old: true } },
      { new_internship_announcements: false, application_status_updates: false, task_review_updates: false }
    ),
    {
      full_name: 'A student',
      university: 'MDU',
      notification_preferences: {
        new_internship_announcements: false,
        application_status_updates: false,
        task_review_updates: false,
      },
    }
  );
});

test('student can turn off task review emails without disabling in-app notifications', () => {
  const result = normalizeNotificationPreferences({
    new_internship_announcements: true,
    application_status_updates: false,
    task_review_updates: false,
  });
  assert.equal(result.task_review_updates, false);
  assert.equal(normalizeNotificationPreferences({ task_review_updates: true }).task_review_updates, true);
  assert.equal(normalizeNotificationPreferences({ task_review_updates: 'false' }).task_review_updates, true);
});
