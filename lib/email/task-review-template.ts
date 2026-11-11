import { renderAnnouncementEmailHtml } from './announcement-template.ts';

export type TaskReviewDecision = 'approved' | 'revision_requested' | 'rejected';

export const TASK_REVIEW_DECISION_LABELS: Record<TaskReviewDecision, string> = {
  approved: 'Təsdiqləndi',
  revision_requested: 'Düzəliş tələb olunur',
  rejected: 'Rədd edildi',
};

export function buildTaskReviewEmail(input: {
  fullName: string;
  taskTitle: string;
  status: TaskReviewDecision;
  feedback: string;
  taskId: string;
}): { subject: string; text: string; html: string } {
  const label = TASK_REVIEW_DECISION_LABELS[input.status];
  const subject = 'Talora | Tapşırıq: ' + label;
  const link = 'https://talora-az.vercel.app/dashboard/internship/tasks/' + encodeURIComponent(input.taskId);
  const body = [
    'Salam, ' + (input.fullName.trim() || 'hörmətli iştirakçı') + '!',
    '',
    '“' + input.taskTitle + '” tapşırığınız qiymətləndirildi.',
    'Qərar: ' + label,
    ...(input.feedback.trim() ? ['', 'Admin rəyi:', input.feedback.trim()] : []),
    '',
    'Tapşırığa baxın: ' + link,
    '',
    'Hörmətlə,',
    'Talora komandası',
  ].join('\n');

  return {
    subject,
    text: body,
    html: renderAnnouncementEmailHtml({ title: subject, body }),
  };
}
