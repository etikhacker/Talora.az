import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { TaskSubmission, SubmissionStatus } from '@/types/database';
import { requestTaskReviewEmail, type TaskReviewEmailResult } from '@/lib/email/request-task-review';

// Get student's submissions for an internship / enrollment
export async function getStudentSubmissionsForEnrollment(
  studentId: string,
  enrollmentId?: string
): Promise<TaskSubmission[]> {
  if (!studentId || !isSupabaseConfigured()) return [];

  const supabase = createClient();
  if (!supabase) return [];

  try {
    let query = supabase
      .from('task_submissions')
      .select(`
        *,
        task:internship_tasks(*)
      `)
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false });

    if (enrollmentId) {
      query = query.eq('enrollment_id', enrollmentId);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as TaskSubmission[];
  } catch (err) {
    console.warn('Exception in getStudentSubmissionsForEnrollment:', err);
    return [];
  }
}

// Get student's submission for a single task
export async function getStudentSubmissionForTask(
  studentId: string,
  taskId: string
): Promise<TaskSubmission | null> {
  if (!studentId || !taskId || !isSupabaseConfigured()) return null;

  const supabase = createClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('task_submissions')
      .select(`
        *,
        task:internship_tasks(*)
      `)
      .eq('student_id', studentId)
      .eq('task_id', taskId)
      .maybeSingle();

    if (error || !data) return null;
    return data as TaskSubmission;
  } catch (err) {
    console.warn('Exception in getStudentSubmissionForTask:', err);
    return null;
  }
}

// Alias with (taskId, studentId) argument order
export async function getSubmissionForTask(
  taskId: string,
  studentId: string
): Promise<TaskSubmission | null> {
  return getStudentSubmissionForTask(studentId, taskId);
}

// Submit or update a task solution
export async function submitTaskSolution({
  taskId,
  studentId,
  enrollmentId,
  textAnswer,
  submissionUrl,
  githubUrl,
  filePath,
  fileName,
  file,
  comment,
}: {
  taskId: string;
  studentId: string;
  enrollmentId: string;
  textAnswer?: string | null;
  submissionUrl?: string | null;
  githubUrl?: string | null;
  filePath?: string | null;
  fileName?: string | null;
  file?: File | null;
  comment?: string | null;
}): Promise<{ success: boolean; error?: string; submission?: TaskSubmission }> {
  let resolvedFilePath = filePath || null;
  let resolvedFileName = fileName || null;

  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Verilənlər bazası konfiqurasiya edilməyib.' };
  }

  const supabase = createClient();
  if (!supabase) return { success: false, error: 'Verilənlər bazası əlçatan deyil.' };

  try {
    const [{ data: enrollment, error: enrollmentError }, { data: task, error: taskError }] = await Promise.all([
      supabase
        .from('enrollments')
        .select('id, student_id, internship_id, status')
        .eq('id', enrollmentId)
        .maybeSingle(),
      supabase
        .from('internship_tasks')
        .select('id, internship_id')
        .eq('id', taskId)
        .maybeSingle(),
    ]);

    if (enrollmentError || !enrollment || taskError || !task) {
      return { success: false, error: 'Təcrübəçi qeydiyyatı və ya tapşırıq tapılmadı.' };
    }

    if (
      enrollment.student_id !== studentId ||
      enrollment.internship_id !== task.internship_id ||
      enrollment.status !== 'active'
    ) {
      return { success: false, error: 'Bu tapşırıq üçün təqdimat göndərmək icazəniz yoxdur.' };
    }

    if (file) {
      const uploadRes = await uploadSubmissionFile(studentId, taskId, file);
      if (!uploadRes.success) {
        return { success: false, error: uploadRes.error || 'Fayl yüklənə bilmədi.' };
      }
      resolvedFilePath = uploadRes.filePath || null;
      resolvedFileName = uploadRes.fileName || null;
    }

    // Fetch the current row so a text-only resubmission does not erase its existing file.
    const { data: existing, error: existingError } = await supabase
      .from('task_submissions')
      .select('id, file_path, file_name')
      .eq('task_id', taskId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (existingError) {
      return { success: false, error: existingError.message };
    }

    if (!file && !filePath && existing) {
      resolvedFilePath = existing.file_path || null;
      resolvedFileName = existing.file_name || null;
    }

    const payload = {
      task_id: taskId,
      student_id: studentId,
      enrollment_id: enrollmentId,
      text_answer: textAnswer || null,
      submission_url: submissionUrl || null,
      github_url: githubUrl || null,
      file_path: resolvedFilePath,
      file_name: resolvedFileName,
      comment: comment || null,
      status: 'pending' as SubmissionStatus,
      admin_feedback: null,
      reviewed_by: null,
      reviewed_at: null,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existing) {
      // Update existing submission (resubmission)
      result = await supabase
        .from('task_submissions')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      // Insert new submission
      result = await supabase
        .from('task_submissions')
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true, submission: result.data as TaskSubmission };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Tapşırıq təqdim edilərkən xəta baş verdi.';
    return { success: false, error: msg };
  }
}

// Get all submissions for Admin panel
export async function getAllSubmissions(filter?: {
  status?: string;
  internshipId?: string;
}): Promise<TaskSubmission[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createClient();
  if (!supabase) return [];

  try {
    let query = supabase
      .from('task_submissions')
      .select(`
        *,
        task:internship_tasks(*),
        student:profiles!task_submissions_student_id_fkey(*),
        enrollment:enrollments(*)
      `)
      .order('submitted_at', { ascending: false });

    if (filter?.status && filter.status !== 'all') {
      query = query.eq('status', filter.status);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    let filtered = data as TaskSubmission[];
    if (filter?.internshipId && filter.internshipId !== 'all') {
      filtered = filtered.filter((s) => s.task?.internship_id === filter.internshipId);
    }
    return filtered;
  } catch (err) {
    console.warn('Exception in getAllSubmissions:', err);
    return [];
  }
}

// Get single submission by ID for review
export async function getSubmissionById(submissionId: string): Promise<TaskSubmission | null> {
  if (!submissionId || !isSupabaseConfigured()) return null;

  const supabase = createClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('task_submissions')
      .select(`
        *,
        task:internship_tasks(*),
        student:profiles!task_submissions_student_id_fkey(*),
        enrollment:enrollments(*)
      `)
      .eq('id', submissionId)
      .maybeSingle();

    if (error || !data) return null;
    return data as TaskSubmission;
  } catch (err) {
    console.warn('Exception in getSubmissionById:', err);
    return null;
  }
}

// Review a submission (Approve / Request Revision / Reject)
export async function reviewSubmission({
  submissionId,
  action,
  adminFeedback,
  reviewerId,
}: {
  submissionId: string;
  action: 'approve' | 'revision_requested' | 'reject';
  adminFeedback?: string | null;
  reviewerId?: string;
}): Promise<{ success: boolean; error?: string; submission?: TaskSubmission; emailDelivery?: TaskReviewEmailResult; reviewUnchanged?: boolean }> {
  // Validate requirement: Feedback is mandatory for revision_requested and reject!
  if ((action === 'revision_requested' || action === 'reject') && (!adminFeedback || adminFeedback.trim().length < 5)) {
    return {
      success: false,
      error: 'Düzəliş tələb edildikdə və ya rədd edildikdə rəy/səbəb qeyd edilməsi məcburidir (ən azı 5 simvol).',
    };
  }

  if ((adminFeedback || '').length > 2000) {
    return { success: false, error: 'Admin rəyi 2000 simvoldan uzun olmamalıdır.' };
  }

  const targetStatus: SubmissionStatus =
    action === 'approve'
      ? 'approved'
      : action === 'revision_requested'
      ? 'revision_requested'
      : 'rejected';

  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Verilənlər bazası konfiqurasiya edilməyib.' };
  }

  const supabase = createClient();
  if (!supabase) return { success: false, error: 'Verilənlər bazası əlçatan deyil.' };

  try {
    const { data: previous, error: previousError } = await supabase
      .from('task_submissions')
      .select('id,status,admin_feedback,updated_at,reviewed_at')
      .eq('id', submissionId)
      .maybeSingle();
    if (previousError || !previous) {
      return { success: false, error: 'Təqdimat tapılmadı və ya yoxlama icazəsi yoxdur.' };
    }
    const normalizedFeedback = adminFeedback?.trim() || '';
    if (previous.status === targetStatus
      && (previous.admin_feedback || '') === normalizedFeedback
      && previous.reviewed_at) {
      // A repeated click isn't a new review. Never trigger an email for
      // already-reviewed work, particularly historic work without an outbox.
      const existing = await getSubmissionById(submissionId);
      return {
        success: true,
        submission: existing || undefined,
        reviewUnchanged: true,
      };
    }
    const { data: updated, error } = await supabase
      .from('task_submissions')
      .update({
        status: targetStatus,
        admin_feedback: normalizedFeedback || null,
        reviewed_by: reviewerId || null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .eq('status', previous.status)
      .eq('updated_at', previous.updated_at)
      .select(`
        *,
        task:internship_tasks(*),
        student:profiles!task_submissions_student_id_fkey(*)
      `)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }
    if (!updated) {
      return { success: false, error: 'Bu təqdimat başqa sorğuda dəyişdirilib. Səhifəni yeniləyin.' };
    }

    // If approved, verify if this completes all required tasks for the enrollment
    if (targetStatus === 'approved' && updated.enrollment_id) {
      try {
        const { checkAndUpdateEnrollmentCompletion } = await import('@/lib/enrollments/service');
        await checkAndUpdateEnrollmentCompletion(updated.enrollment_id);
      } catch (compErr) {
        console.warn('Failed to check enrollment completion trigger:', compErr);
      }
    }

    const emailDelivery = await requestTaskReviewEmail(submissionId);
    return { success: true, submission: updated as TaskSubmission, emailDelivery };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Təqdimat yoxlanılarkən xəta baş verdi.';
    return { success: false, error: msg };
  }
}

// Upload file to Supabase Storage
export async function uploadSubmissionFile(
  studentId: string,
  taskId: string,
  file: File
): Promise<{ success: boolean; filePath?: string; fileName?: string; error?: string }> {
  // Keep the server-side limit aligned with the student form and storage bucket.
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: 'Faylın həcmi 10MB-dan çox ola bilməz.' };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Storage konfiqurasiya edilməyib.' };
  }

  const supabase = createClient();
  if (!supabase) return { success: false, error: 'Storage müştərisi əlçatan deyil.' };

  try {
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${studentId}/${taskId}/${Date.now()}_${cleanName}`;

    const { error } = await supabase.storage
      .from('task-submissions')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      filePath: path,
      fileName: file.name,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Fayl yüklənərkən xəta baş verdi.';
    return { success: false, error: msg };
  }
}

// Get file download/view URL (signed URL)
export async function getSubmissionFileUrl(filePath: string): Promise<string> {
  if (!filePath || !isSupabaseConfigured()) return '#';

  const supabase = createClient();
  if (!supabase) return '#';

  try {
    const { data, error } = await supabase.storage
      .from('task-submissions')
      .createSignedUrl(filePath, 3600); // 1 hour link

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
    return '#';
  } catch (err) {
    console.warn('Exception in getSubmissionFileUrl:', err);
    return '#';
  }
}
