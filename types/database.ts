export type UserRole = 'student' | 'admin';

export type ContactMessageStatus = 'new' | 'read' | 'archived';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  created_at: string;
  read_at: string | null;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  phone: string | null;
  university: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateInput {
  full_name?: string;
  phone?: string | null;
  university?: string | null;
  avatar_url?: string | null;
}

export type InternshipStatus = 'draft' | 'published' | 'closed' | 'archived';
export type InternshipDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Internship {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  category: string;
  duration_weeks: number;
  difficulty: InternshipDifficulty;
  skills: string[];
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  max_students: number | null;
  status: InternshipStatus;
  application_deadline: string | null;
  start_date: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface Application {
  id: string;
  internship_id: string;
  student_id: string;
  motivation: string;
  experience: string | null;
  portfolio_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  status: ApplicationStatus;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  // Relational joins
  internship?: Internship;
  student?: Profile;
}

export type EnrollmentStatus = 'active' | 'completed' | 'cancelled';

export interface Enrollment {
  id: string;
  internship_id: string;
  student_id: string;
  application_id: string | null;
  status: EnrollmentStatus;
  enrolled_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Relational joins
  internship?: Internship;
  student?: Profile;
}

export interface AdminStats {
  totalStudents: number;
  activeInternships: number;
  pendingApplications: number;
  activeInterns: number;
  pendingSubmissions: number;
  completedInternships: number;
  pendingCertificatePayments: number;
  certificatesIssued: number;
}

export type TaskDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type TaskSubmissionType = 'text' | 'link' | 'file' | 'github' | 'multiple';
export type TaskStatus = 'draft' | 'published' | 'archived';

export interface InternshipTask {
  id: string;
  internship_id: string;
  title: string;
  description: string;
  instructions: string;
  week_number: number;
  task_number: number;
  difficulty: TaskDifficulty;
  submission_type: TaskSubmissionType;
  deadline: string | null;
  is_required: boolean;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  // Relational joins
  internship?: Internship;
}

export type SubmissionStatus = 'pending' | 'revision_requested' | 'approved' | 'rejected';

export interface TaskSubmission {
  id: string;
  task_id: string;
  student_id: string;
  enrollment_id: string;
  text_answer: string | null;
  submission_url: string | null;
  github_url: string | null;
  file_path: string | null;
  file_name?: string | null;
  comment: string | null;
  status: SubmissionStatus;
  admin_feedback: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string;
  updated_at: string;
  // Relational joins
  task?: InternshipTask;
  student?: Profile;
  enrollment?: Enrollment;
  reviewer?: Profile;
}

export type PaymentStatus = 'pending' | 'approved' | 'rejected';
export type CertificateStatus = 'pending' | 'issued' | 'revoked';

export interface CertificateSettings {
  id: string;
  internship_id: string;
  price: number;
  currency: string;
  card_number: string;
  m10_phone_number: string | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  // Relational joins
  internship?: Internship;
}

export interface CertificatePayment {
  id: string;
  student_id: string;
  internship_id: string;
  enrollment_id: string;
  amount: number;
  currency: string;
  receipt_path: string;
  receipt_name?: string | null;
  status: PaymentStatus;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  // Relational joins
  student?: Profile;
  internship?: Internship;
  enrollment?: Enrollment;
  reviewer?: Profile;
}

export interface Certificate {
  id: string;
  certificate_id: string;
  student_id: string;
  internship_id: string;
  enrollment_id: string;
  student_name: string;
  internship_title: string;
  issued_at: string;
  certificate_file_path: string;
  status: CertificateStatus;
  created_at: string;
  updated_at: string;
  // Relational joins
  student?: Profile;
  internship?: Internship;
  enrollment?: Enrollment;
}

export interface CertificateCandidate {
  enrollment: Enrollment;
  student: Profile;
  internship: Internship;
  payment: CertificatePayment;
  certificate?: Certificate | null;
}
