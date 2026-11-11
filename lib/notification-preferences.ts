export interface NotificationPreferences {
  new_internship_announcements: boolean;
  application_status_updates: boolean;
  task_review_updates: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  new_internship_announcements: true,
  application_status_updates: true,
  task_review_updates: true,
};

export function normalizeNotificationPreferences(value: unknown): NotificationPreferences {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }

  const stored = value as Partial<NotificationPreferences>;

  return {
    new_internship_announcements:
      typeof stored.new_internship_announcements === 'boolean'
        ? stored.new_internship_announcements
        : DEFAULT_NOTIFICATION_PREFERENCES.new_internship_announcements,
    application_status_updates:
      typeof stored.application_status_updates === 'boolean'
        ? stored.application_status_updates
        : DEFAULT_NOTIFICATION_PREFERENCES.application_status_updates,
    task_review_updates:
      typeof stored.task_review_updates === 'boolean'
        ? stored.task_review_updates
        : DEFAULT_NOTIFICATION_PREFERENCES.task_review_updates,
  };
}

export function mergeNotificationPreferences(
  userMetadata: unknown,
  preferences: NotificationPreferences
): Record<string, unknown> {
  const existingMetadata =
    userMetadata && typeof userMetadata === 'object' && !Array.isArray(userMetadata)
      ? (userMetadata as Record<string, unknown>)
      : {};

  return {
    ...existingMetadata,
    notification_preferences: normalizeNotificationPreferences(preferences),
  };
}
