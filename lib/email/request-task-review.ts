export type TaskReviewEmailState =
  | 'queued' | 'sending' | 'sent' | 'failed' | 'uncertain' | 'skipped';

export interface TaskReviewEmailResult {
  state: TaskReviewEmailState | 'unavailable';
  warning?: string;
}

export async function requestTaskReviewEmail(
  submissionId: string,
  fetcher: typeof fetch = fetch
): Promise<TaskReviewEmailResult> {
  try {
    const response = await fetcher('/api/admin/submissions/review-email', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId }),
    });
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      delivery?: { state?: TaskReviewEmailState; errorCode?: string };
    } | null;

    if (!response.ok) return {
      state: 'unavailable',
      warning: typeof payload?.error === 'string'
        ? payload.error : 'Email göndərişinin nəticəsi yoxlanılmadı.',
    };
    const state = payload?.delivery?.state;
    if (!state) return { state: 'unavailable', warning: 'Email statusu təqdim olunmadı.' };
    if (state === 'sent') return { state };
    if (state === 'skipped') return { state, warning: 'Tələbənin e-poçt bildirişi deaktivdir və ya ünvanı yoxdur.' };
    if (state === 'failed') return { state, warning: 'Email göndərilmədi. Admin panelindən yenidən göndərilə bilər.' };
    if (state === 'uncertain') return { state, warning: 'Emailin çatdırılma nəticəsi qeyri-müəyyəndir. Gmail Sent qovluğunu yoxlayın.' };
    return { state, warning: 'Qərar saxlanıldı. Email göndərişi növbədədir.' };
  } catch {
    return { state: 'unavailable', warning: 'Qərar saxlanıldı, amma email göndərişi tamamlanmadı. Statusu yoxlayın.' };
  }
}
