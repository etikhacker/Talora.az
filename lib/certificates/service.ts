import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import {
  CertificateSettings,
  CertificatePayment,
  Certificate,
  CertificateCandidate,
  Enrollment,
} from '@/types/database';
import { getStudentEnrollments } from '@/lib/enrollments/service';
import { getAllTasksForInternship } from '@/lib/tasks/service';
import { getStudentSubmissionsForEnrollment } from '@/lib/submissions/service';

// Generate unique standardized certificate ID (e.g. AZ-INT-2026-7A9B-C3D5)
export function generateCertificateId(): string {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) rand += '-';
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `AZ-INT-${year}-${rand}`;
}

// ==========================================
// 1. Certificate Settings
// ==========================================

export async function getCertificateSettings(internshipId: string): Promise<CertificateSettings | null> {
  if (!internshipId || !isSupabaseConfigured()) return null;

  const supabase = createClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('certificate_settings')
      .select('*, internship:internships(*)')
      .eq('internship_id', internshipId)
      .maybeSingle();

    if (error || !data) return null;
    return data as CertificateSettings;
  } catch (err) {
    console.warn('Exception in getCertificateSettings:', err);
    return null;
  }
}

export async function getAllCertificateSettings(): Promise<CertificateSettings[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('certificate_settings')
      .select('*, internship:internships(*)')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as CertificateSettings[];
  } catch (err) {
    console.warn('Exception in getAllCertificateSettings:', err);
    return [];
  }
}

export async function saveCertificateSettings({
  internshipId,
  price,
  currency = 'AZN',
  cardNumber,
  m10PhoneNumber,
  isEnabled,
}: {
  internshipId: string;
  price: number;
  currency?: string;
  cardNumber: string;
  m10PhoneNumber: string;
  isEnabled: boolean;
}): Promise<{ success: boolean; error?: string; settings?: CertificateSettings }> {
  if (!Number.isFinite(price) || price < 0) {
    return { success: false, error: 'Qiymət mənfi ola bilməz.' };
  }
  if (isEnabled && !cardNumber.trim() && !m10PhoneNumber.trim()) {
    return { success: false, error: 'Sertifikat aktiv olduqda bank kartı və ya M10 nömrəsi daxil edilməlidir.' };
  }
  const m10Digits = m10PhoneNumber.replace(/\D/g, '');
  if (m10Digits && (m10Digits.length < 9 || m10Digits.length > 15)) {
    return { success: false, error: 'M10 nömrəsini düzgün formatda daxil edin.' };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Verilənlər bazası konfiqurasiya edilməyib.' };
  }

  const supabase = createClient();
  if (!supabase) return { success: false, error: 'Verilənlər bazası əlçatan deyil.' };

  try {
    const payload = {
      internship_id: internshipId,
      price: Number(price),
      currency: currency.trim() || 'AZN',
      card_number: cardNumber.trim(),
      m10_phone_number: m10PhoneNumber.trim() || null,
      is_enabled: isEnabled,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('certificate_settings')
      .upsert(payload, { onConflict: 'internship_id' })
      .select('*, internship:internships(*)')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, settings: data as CertificateSettings };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Sertifikat parametrləri yadda saxlanılarkən xəta baş verdi.';
    return { success: false, error: msg };
  }
}

// ==========================================
// 2. Student Certificate Eligibility & Details
// ==========================================

export async function getStudentCertificateEligibility(studentId: string): Promise<{
  eligible: boolean;
  completedEnrollments: Enrollment[];
  eligibleEnrollment: Enrollment | null;
  settings: CertificateSettings | null;
  currentPayment: CertificatePayment | null;
  currentCertificate: Certificate | null;
  tasksCompletedCount?: number;
  totalRequiredTasksCount?: number;
}> {
  const enrollments = await getStudentEnrollments(studentId);

  // A student is eligible for a certificate ONLY when enrollments.status === 'completed'
  const completed = enrollments.filter((e) => e.status === 'completed');

  const activeEnrollment = enrollments.find((e) => e.status === 'active');
  const targetEnrollment = completed.length > 0 ? completed[0] : activeEnrollment;

  let tasksCompletedCount = 0;
  let totalRequiredTasksCount = 0;

  if (targetEnrollment) {
    try {
      const tasks = await getAllTasksForInternship(targetEnrollment.internship_id, false);
      const reqTasks = tasks.filter((t) => t.is_required && t.status === 'published');
      totalRequiredTasksCount = reqTasks.length;

      const subs = await getStudentSubmissionsForEnrollment(studentId, targetEnrollment.id);
      tasksCompletedCount = reqTasks.filter((t) =>
        subs.some((s) => s.task_id === t.id && s.status === 'approved')
      ).length;
    } catch {
      // ignore
    }
  }

  if (completed.length === 0) {
    return {
      eligible: false,
      completedEnrollments: [],
      eligibleEnrollment: null,
      settings: targetEnrollment ? await getCertificateSettings(targetEnrollment.internship_id) : null,
      currentPayment: null,
      currentCertificate: null,
      tasksCompletedCount,
      totalRequiredTasksCount,
    };
  }

  const primaryEnrollment = completed[0];
  const settings = await getCertificateSettings(primaryEnrollment.internship_id);
  const payments = await getStudentCertificatePayments(studentId, primaryEnrollment.id);
  // Prefer an actionable pending payment, then an approved payment; a later rejected
  // attempt must not hide an earlier approved payment from the student dashboard.
  const currentPayment =
    payments.find((payment) => payment.status === 'pending') ||
    payments.find((payment) => payment.status === 'approved') ||
    payments[0] ||
    null;
  const certificate = await getCertificateForEnrollment(primaryEnrollment.id, studentId);

  return {
    eligible: true,
    completedEnrollments: completed,
    eligibleEnrollment: primaryEnrollment,
    settings,
    currentPayment,
    currentCertificate: certificate,
    tasksCompletedCount,
    totalRequiredTasksCount,
  };
}

// Get student's certificate payments
export async function getStudentCertificatePayments(
  studentId: string,
  enrollmentId?: string
): Promise<CertificatePayment[]> {
  if (!studentId || !isSupabaseConfigured()) return [];

  const supabase = createClient();
  if (!supabase) return [];

  try {
    let query = supabase
      .from('certificate_payments')
      .select(`
        *,
        internship:internships(*),
        enrollment:enrollments(*)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (enrollmentId) {
      query = query.eq('enrollment_id', enrollmentId);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as CertificatePayment[];
  } catch (err) {
    console.warn('Exception in getStudentCertificatePayments:', err);
    return [];
  }
}

// Upload receipt to private bucket `certificate-payments`
export async function uploadReceiptFile(
  studentId: string,
  enrollmentId: string,
  file: File
): Promise<{ success: boolean; error?: string; filePath?: string; fileName?: string }> {
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!allowedExtensions.includes(ext)) {
    return {
      success: false,
      error: 'Yalnız JPG, JPEG, PNG, WEBP və PDF fayl formatları qəbul edilir.',
    };
  }
  const expectedMime: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    pdf: 'application/pdf',
  };
  if (file.type && file.type !== expectedMime[ext]) {
    return { success: false, error: 'Faylın formatı ilə uzantısı uyğun gəlmir.' };
  }

  if (file.size > 10 * 1024 * 1024) {
    return {
      success: false,
      error: 'Faylın həcmi 10MB-dan çox ola bilməz.',
    };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Storage konfiqurasiya edilməyib.' };
  }

  const supabase = createClient();
  if (!supabase) return { success: false, error: 'Storage müştərisi əlçatan deyil.' };

  try {
    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
    const path = `${studentId}/${uniqueId}.${ext}`;

    const { error } = await supabase.storage
      .from('certificate-payments')
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
    const msg = err instanceof Error ? err.message : 'Qəbz yüklənərkən xəta baş verdi.';
    return { success: false, error: msg };
  }
}

// Submit payment receipt
export async function submitCertificatePayment({
  studentId,
  internshipId,
  enrollmentId,
  amount,
  currency = 'AZN',
  receiptFile,
  receiptPath,
  receiptName,
}: {
  studentId: string;
  internshipId: string;
  enrollmentId: string;
  amount?: number;
  currency?: string;
  receiptFile?: File | null;
  receiptPath?: string;
  receiptName?: string;
}): Promise<{ success: boolean; error?: string; payment?: CertificatePayment }> {
  // Never trust a client-supplied amount. Payment is available only when the
  // administrator has enabled certificate issuance for this internship.
  const settings = await getCertificateSettings(internshipId);
  if (!settings || !settings.is_enabled) {
    return { success: false, error: 'Bu təcrübə proqramı üçün sertifikat ödənişi hazırda aktiv deyil.' };
  }
  const finalAmount = Number(settings.price);
  const finalCurrency = (settings.currency || 'AZN').trim();
  if (!Number.isFinite(finalAmount) || finalAmount < 0 || !finalCurrency) {
    return { success: false, error: 'Sertifikat ödəniş parametrləri düzgün deyil. Administratorla əlaqə saxlayın.' };
  }

  let finalReceiptPath = receiptPath || '';
  let finalReceiptName = receiptName || '';

  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Verilənlər bazası konfiqurasiya edilməyib.' };
  }

  const supabase = createClient();
  if (!supabase) return { success: false, error: 'Verilənlər bazası əlçatan deyil.' };

  try {
    // Validate enrollment status
    const { data: enrollmentData, error: enrollError } = await supabase
      .from('enrollments')
      .select('id, status, student_id, internship_id')
      .eq('id', enrollmentId)
      .single();

    if (enrollError || !enrollmentData) {
      return { success: false, error: 'Təcrübəçi qeydiyyatı tapılmadı.' };
    }

    if (enrollmentData.status !== 'completed') {
      return { success: false, error: 'Ödəniş yalnız proqramı uğurla tamamlamış tələbələr tərəfindən göndərilə bilər.' };
    }

    if (enrollmentData.student_id !== studentId || enrollmentData.internship_id !== internshipId) {
      return { success: false, error: 'Təcrübəçi qeydiyyatı ilə göndərilən tələbə/proqram məlumatları uyğun gəlmir.' };
    }

    // Verify the actual required-task approvals before uploading a receipt. This
    // avoids orphaned uploads when a record was manually marked completed.
    const tasks = await getAllTasksForInternship(internshipId, false);
    if (tasks.length === 0) {
      return { success: false, error: 'Tapşırıq siyahısı yoxlanıla bilmədi. Bir qədər sonra yenidən cəhd edin.' };
    }
    const requiredTasks = tasks.filter((task) => task.is_required && task.status === 'published');
    const submissions = await getStudentSubmissionsForEnrollment(studentId, enrollmentId);
    const allRequiredApproved = requiredTasks.every((task) =>
      submissions.some((submission) => submission.task_id === task.id && submission.status === 'approved')
    );
    if (!allRequiredApproved) {
      return { success: false, error: 'Sertifikat ödənişindən əvvəl bütün məcburi tapşırıqlar mentor tərəfindən təsdiqlənməlidir.' };
    }

    if (receiptFile) {
      const uploadRes = await uploadReceiptFile(studentId, enrollmentId, receiptFile);
      if (!uploadRes.success) {
        return { success: false, error: uploadRes.error || 'Qəbz faylı yüklənə bilmədi.' };
      }
      finalReceiptPath = uploadRes.filePath || '';
      finalReceiptName = uploadRes.fileName || '';
    }

    if (!finalReceiptPath) {
      return { success: false, error: 'Zəhmət olmasa ödəniş qəbzini yükləyin.' };
    }
    if (!finalReceiptPath.startsWith(`${studentId}/`)) {
      return { success: false, error: 'Qəbz faylının yolu bu tələbəyə aid deyil.' };
    }

    // An approved payment already satisfies the payment requirement; do not create
    // duplicate payment requests after approval.
    const { data: existingApproved, error: approvedLookupError } = await supabase
      .from('certificate_payments')
      .select('id')
      .eq('student_id', studentId)
      .eq('enrollment_id', enrollmentId)
      .eq('status', 'approved')
      .maybeSingle();

    if (approvedLookupError) {
      return { success: false, error: approvedLookupError.message };
    }
    if (existingApproved) {
      return { success: false, error: 'Bu təcrübə üçün sertifikat ödənişi artıq təsdiqlənib.' };
    }

    // Check existing pending payment
    const { data: existingPending } = await supabase
      .from('certificate_payments')
      .select('id')
      .eq('student_id', studentId)
      .eq('enrollment_id', enrollmentId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingPending) {
      const { data: updated, error: updateError } = await supabase
        .from('certificate_payments')
        // Keep the original amount/currency for an already-pending request. Students
        // may replace its receipt, but cannot alter the financial terms.
        .update({
          receipt_path: finalReceiptPath,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPending.id)
        .select('*, internship:internships(*), enrollment:enrollments(*)')
        .single();

      if (updateError) {
        return { success: false, error: updateError.message };
      }
      return { success: true, payment: updated as CertificatePayment };
    }

    const payload = {
      student_id: studentId,
      internship_id: internshipId,
      enrollment_id: enrollmentId,
      amount: finalAmount,
      currency: finalCurrency,
      receipt_path: finalReceiptPath,
      status: 'pending',
      admin_note: null,
      reviewed_by: null,
      reviewed_at: null,
    };

    const { data, error } = await supabase
      .from('certificate_payments')
      .insert(payload)
      .select('*, internship:internships(*), enrollment:enrollments(*)')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, payment: data as CertificatePayment };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ödəniş qəbzi göndərilərkən xəta baş verdi.';
    return { success: false, error: msg };
  }
}

// Get Signed URL for Payment Receipt from private bucket `certificate-payments`
export async function getPaymentReceiptSignedUrl(receiptPath: string): Promise<string> {
  if (!receiptPath || !isSupabaseConfigured()) return '#';

  const supabase = createClient();
  if (!supabase) return '#';

  try {
    const { data, error } = await supabase.storage
      .from('certificate-payments')
      .createSignedUrl(receiptPath, 3600); // 1 hour link

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
    return '#';
  } catch (err) {
    console.warn('Exception in getPaymentReceiptSignedUrl:', err);
    return '#';
  }
}

// ==========================================
// 3. Admin Certificate Orders & Review
// ==========================================

export async function getAdminCertificatePayments(filter?: {
  status?: string;
  search?: string;
}): Promise<CertificatePayment[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createClient();
  if (!supabase) return [];

  try {
    let query = supabase
      .from('certificate_payments')
      .select(`
        *,
        student:profiles!certificate_payments_student_id_fkey(*),
        internship:internships(*),
        enrollment:enrollments(*)
      `)
      .order('created_at', { ascending: false });

    if (filter?.status && filter.status !== 'all') {
      query = query.eq('status', filter.status);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    let list = data as CertificatePayment[];
    if (filter?.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.student?.full_name?.toLowerCase().includes(q) ||
          p.student?.email?.toLowerCase().includes(q) ||
          p.internship?.title?.toLowerCase().includes(q)
      );
    }
    return list;
  } catch (err) {
    console.warn('Exception in getAdminCertificatePayments:', err);
    return [];
  }
}

export async function reviewCertificatePayment({
  paymentId,
  status,
  adminId,
  adminNote,
}: {
  paymentId: string;
  status: 'approved' | 'rejected';
  adminId: string;
  adminNote?: string;
}): Promise<{ success: boolean; error?: string; payment?: CertificatePayment }> {
  if (status === 'rejected' && (!adminNote || !adminNote.trim())) {
    return { success: false, error: 'Ödənişi rədd edərkən səbəb / qeyd mütləq yazılmalıdır.' };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Verilənlər bazası konfiqurasiya edilməyib.' };
  }

  const supabase = createClient();
  if (!supabase) return { success: false, error: 'Verilənlər bazası əlçatan deyil.' };

  try {
    const payload = {
      status,
      admin_note: adminNote?.trim() || null,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('certificate_payments')
      .update(payload)
      .eq('id', paymentId)
      .select('*, student:profiles!certificate_payments_student_id_fkey(*), internship:internships(*)')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, payment: data as CertificatePayment };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ödəniş icmalı yadda saxlanılarkən xəta baş verdi.';
    return { success: false, error: msg };
  }
}

// ==========================================
// 4. Admin Certificates & Issuance (Canva PDF)
// ==========================================

export async function getCertificateForEnrollment(
  enrollmentId: string,
  studentId?: string
): Promise<Certificate | null> {
  if (!enrollmentId || !isSupabaseConfigured()) return null;

  const supabase = createClient();
  if (!supabase) return null;

  try {
    let query = supabase
      .from('certificates')
      .select('*, student:profiles!certificates_student_id_fkey(*), internship:internships(*)')
      .eq('enrollment_id', enrollmentId);

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    const { data, error } = await query.maybeSingle();
    if (error || !data) return null;
    return data as Certificate;
  } catch (err) {
    console.warn('Exception in getCertificateForEnrollment:', err);
    return null;
  }
}

// Get candidates awaiting certificate issuance:
// (Completed internship + approved certificate payment + no issued certificate)
export async function getCertificateCandidates(): Promise<CertificateCandidate[]> {
  const payments = await getAdminCertificatePayments({ status: 'approved' });
  const certs = await getAdminCertificates();

  const candidates: CertificateCandidate[] = [];

  for (const p of payments) {
    const existingCert = certs.find((c) => c.enrollment_id === p.enrollment_id && c.status === 'issued');
    if (
      existingCert ||
      p.enrollment?.status !== 'completed' ||
      !p.internship ||
      !p.student
    ) {
      continue;
    }

    // Do not offer issuance if an admin manually marked the enrollment completed
    // before every published required task was approved.
    const tasks = await getAllTasksForInternship(p.internship_id, false);
    if (tasks.length === 0) continue; // Fail closed if the task list could not be loaded.
    const requiredTasks = tasks.filter((task) => task.is_required && task.status === 'published');
    const submissions = await getStudentSubmissionsForEnrollment(p.student_id, p.enrollment_id);
    const allRequiredTasksApproved = requiredTasks.every((task) =>
      submissions.some((submission) => submission.task_id === task.id && submission.status === 'approved')
    );
    if (!allRequiredTasksApproved) continue;

    candidates.push({
      enrollment: p.enrollment,
      student: p.student,
      internship: p.internship,
      payment: p,
      certificate: certs.find((c) => c.enrollment_id === p.enrollment_id) || null,
    });
  }

  return candidates;
}

export async function getAdminCertificates(filter?: {
  status?: string;
  search?: string;
}): Promise<Certificate[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createClient();
  if (!supabase) return [];

  try {
    let query = supabase
      .from('certificates')
      .select(`
        *,
        student:profiles!certificates_student_id_fkey(*),
        internship:internships(*),
        enrollment:enrollments(*)
      `)
      .order('created_at', { ascending: false });

    if (filter?.status && filter.status !== 'all') {
      query = query.eq('status', filter.status);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    let list = data as Certificate[];
    if (filter?.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.student_name?.toLowerCase().includes(q) ||
          c.internship_title?.toLowerCase().includes(q) ||
          c.certificate_id?.toLowerCase().includes(q)
      );
    }
    return list;
  } catch (err) {
    console.warn('Exception in getAdminCertificates:', err);
    return [];
  }
}

// Upload Certificate PDF to private bucket `certificates`
export async function uploadCertificatePdf(
  studentId: string,
  enrollmentId: string,
  file: File
): Promise<{ success: boolean; error?: string; filePath?: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (ext !== 'pdf') {
    return { success: false, error: 'Sertifikat faylı yalnız PDF formatında olmalıdır.' };
  }

  if (file.size > 20 * 1024 * 1024) {
    return { success: false, error: 'PDF faylının həcmi 20MB-dan çox ola bilməz.' };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Storage konfiqurasiya edilməyib.' };
  }

  const supabase = createClient();
  if (!supabase) return { success: false, error: 'Storage müştərisi əlçatan deyil.' };

  try {
    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
    const path = `${studentId}/${uniqueId}.pdf`;

    const { error } = await supabase.storage
      .from('certificates')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, filePath: path };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Sertifikat PDF yüklənərkən xəta baş verdi.';
    return { success: false, error: msg };
  }
}

// Issue Certificate
export async function issueCertificate({
  studentId,
  internshipId,
  enrollmentId,
  studentName,
  internshipTitle,
  certificateFile,
  certificateFilePath,
}: {
  studentId: string;
  internshipId: string;
  enrollmentId: string;
  studentName: string;
  internshipTitle: string;
  certificateFile?: File | null;
  certificateFilePath?: string;
}): Promise<{ success: boolean; error?: string; certificate?: Certificate }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Verilənlər bazası konfiqurasiya edilməyib.' };
  }
  if (!studentId || !internshipId || !enrollmentId || !studentName.trim() || !internshipTitle.trim()) {
    return { success: false, error: 'Tələbə, təcrübə və sertifikat məlumatları tam doldurulmalıdır.' };
  }

  let finalPath = certificateFilePath || '';
  if (certificateFile) {
    const uploadRes = await uploadCertificatePdf(studentId, enrollmentId, certificateFile);
    if (!uploadRes.success) {
      return { success: false, error: uploadRes.error || 'Sertifikat PDF faylı yüklənə bilmədi.' };
    }
    finalPath = uploadRes.filePath || '';
  }
  if (!finalPath) {
    return { success: false, error: 'Zəhmət olmasa tərtib edilmiş sertifikat PDF faylını yükləyin.' };
  }
  if (!finalPath.startsWith(`${studentId}/`)) {
    return { success: false, error: 'Sertifikat faylının yolu tələbəyə uyğun deyil.' };
  }

  const supabase = createClient();
  if (!supabase) return { success: false, error: 'Verilənlər bazası əlçatan deyil.' };

  try {
    // Certificate issuance must always go through the database-side authorization
    // and payment/completion checks. Never fall back to direct table writes.
    const { data, error } = await supabase.rpc('issue_certificate_secure', {
      p_enrollment_id: enrollmentId,
      p_student_id: studentId,
      p_internship_id: internshipId,
      p_student_name: studentName.trim(),
      p_internship_title: internshipTitle.trim(),
      p_certificate_file_path: finalPath,
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'Sertifikat verilməsi üçün təhlükəsiz yoxlama uğursuz oldu.',
      };
    }
    if (!data) {
      return { success: false, error: 'Verilənlər bazası sertifikat qeydi qaytarmadı.' };
    }

    const certificate = (Array.isArray(data) ? data[0] : data) as Certificate;
    if (!certificate?.certificate_id || certificate.status !== 'issued') {
      return { success: false, error: 'Sertifikat qeydi yaradıldı, lakin cavabın statusu təsdiqlənmədi.' };
    }
    return { success: true, certificate };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Sertifikat tərtib edilərkən xəta baş verdi.';
    return { success: false, error: msg };
  }
}

export const issueCertificateDirectly = issueCertificate;

// Revoke Certificate
export async function revokeCertificate(
  idOrCertId: string,
  adminNote?: string
): Promise<{ success: boolean; error?: string }> {
  if (!idOrCertId) {
    return { success: false, error: 'Sertifikat ID-si qeyd edilməyib.' };
  }
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Verilənlər bazası konfiqurasiya edilməyib.' };
  }

  const supabase = createClient();
  if (!supabase) return { success: false, error: 'Verilənlər bazası əlçatan deyil.' };

  try {
    // No direct-update fallback: revocation must pass the admin-only RPC.
    const { data, error } = await supabase.rpc('revoke_certificate_secure', {
      p_certificate_id: idOrCertId,
      p_admin_note: adminNote || null,
    });
    if (error) return { success: false, error: error.message };
    if (!data) return { success: false, error: 'Sertifikatın ləğvi təsdiqlənmədi.' };
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Sertifikat ləğv edilərkən xəta baş verdi.';
    return { success: false, error: msg };
  }
}

// Get Signed URL for Certificate PDF from private bucket `certificates`
export async function getCertificateSignedUrl(certificateFilePath: string): Promise<string> {
  if (!certificateFilePath || !isSupabaseConfigured()) return '#';

  const supabase = createClient();
  if (!supabase) return '#';

  try {
    const { data, error } = await supabase.storage
      .from('certificates')
      .createSignedUrl(certificateFilePath, 3600); // 1 hour link

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
    return '#';
  } catch (err) {
    console.warn('Exception in getCertificateSignedUrl:', err);
    return '#';
  }
}

// ==========================================
// 5. Public Certificate Verification
// ==========================================
export async function getPublicCertificate(certificateId: string): Promise<{
  certificate_id: string;
  student_name: string;
  internship_title: string;
  issued_at: string;
  status: 'issued' | 'revoked';
} | null> {
  if (!certificateId || !certificateId.trim() || !isSupabaseConfigured()) return null;

  const cleanId = certificateId.trim();
  const supabase = createClient();
  if (!supabase) return null;

  try {
    // The public verifier is intentionally backed by a narrowly-scoped RPC that
    // returns only the fields safe to disclose for an issued certificate.
    const { data, error } = await supabase.rpc('get_public_certificate', {
      p_certificate_id: cleanId,
    });

    if (!error && data) {
      const row = Array.isArray(data) ? data[0] : data;
      if (row && (row.status === 'issued' || row.status === 'revoked')) {
        return {
          certificate_id: row.certificate_id,
          student_name: row.student_name,
          internship_title: row.internship_title,
          issued_at: row.issued_at,
          status: row.status as 'issued' | 'revoked',
        };
      }
    }
    return null;
  } catch (err) {
    console.warn('Exception in getPublicCertificate:', err);
    return null;
  }
}
