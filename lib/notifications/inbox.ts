export interface InboxNotification {
  id: string;
  kind: 'application' | 'task_review' | 'deadline';
  subject: string;
  status: string;
  body: string;
  href: string;
  read_at: string | null;
  created_at: string;
}

export function notificationLabel(item: InboxNotification, isAz: boolean): string {
  const labels: Record<string, [string, string]> = {
    'application:accepted': ['Müraciətiniz qəbul edildi', 'Application accepted'],
    'application:rejected': ['Müraciətiniz qəbul edilmədi', 'Application not accepted'],
    'task_review:approved': ['Tapşırığınız təsdiqləndi', 'Assignment approved'],
    'task_review:revision_requested': ['Tapşırığa düzəliş tələb olunur', 'Assignment needs revision'],
    'task_review:rejected': ['Tapşırığınız qəbul edilmədi', 'Assignment not approved'],
    'deadline:deadline_warning': ['Son təhvil tarixi yaxınlaşır', 'Assignment deadline approaching'],
    'deadline:deadline_expired': ['Təhvil müddəti bitdi', 'Assignment deadline passed'],
  };
  return (labels[`${item.kind}:${item.status}`] || ['Yeni bildiriş', 'New notification'])[isAz ? 0 : 1];
}

export function notificationHref(item: InboxNotification): string {
  return /^\/dashboard\/[a-z0-9/-]+$/.test(item.href) ? item.href : '/dashboard';
}
