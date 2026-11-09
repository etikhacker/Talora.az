import { createClient } from '@/lib/supabase/client';

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseStatus = 'draft' | 'published' | 'archived';
export type CourseContentStatus = 'draft' | 'published';

export interface CourseCategory {
  id: string;
  slug: string;
  name_az: string;
  name_en: string;
  parent_id: string | null;
  is_active: boolean;
}
export interface Course {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  description: string;
  category_id: string | null;
  level: CourseLevel;
  language_code: 'az' | 'en';
  duration_minutes: number | null;
  status: CourseStatus;
  created_at: string;
}
export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string;
  position: number;
  status: CourseContentStatus;
}
export interface CourseLesson {
  id: string;
  module_id: string;
  title: string;
  position: number;
  lesson_type: 'text' | 'video' | 'link';
  content_md: string;
  resource_url: string | null;
  is_required: boolean;
  status: CourseContentStatus;
}
export interface CourseEnrollment {
  id: string;
  course_id: string;
  student_id: string;
  status: 'active' | 'completed' | 'cancelled';
  enrolled_at: string;
  completed_at: string | null;
}
export interface CourseEnrollmentWithCourse extends CourseEnrollment {
  courses: Course | null;
}
export interface LessonProgress {
  lesson_id: string;
  completed_at: string;
}

function client() {
  const connection = createClient();
  if (!connection) throw new Error('Database connection is not configured.');
  return connection;
}
function requireData<T>(data: T, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  return data;
}

export async function getCourseCategories(): Promise<CourseCategory[]> {
  const { data, error } = await client().from('categories').select('id,slug,name_az,name_en,parent_id,is_active')
    .eq('is_active', true).order('name_en');
  return requireData(data ?? [], error) as CourseCategory[];
}
export async function getPublishedCourses(): Promise<Course[]> {
  const { data, error } = await client().from('courses').select('*')
    .eq('status', 'published').order('created_at', { ascending: false });
  return requireData(data ?? [], error) as Course[];
}
export async function getPublishedCourseBySlug(slug: string): Promise<Course | null> {
  const { data, error } = await client().from('courses').select('*')
    .eq('slug', slug).eq('status', 'published').maybeSingle();
  return requireData(data, error) as Course | null;
}
export async function getPublishedModules(courseId: string): Promise<CourseModule[]> {
  const { data, error } = await client().from('course_modules').select('*')
    .eq('course_id', courseId).eq('status', 'published')
    .order('position', { ascending: true });
  return requireData(data ?? [], error) as CourseModule[];
}
export async function getPublishedLessons(moduleId: string): Promise<CourseLesson[]> {
  const { data, error } = await client().from('course_lessons').select('*')
    .eq('module_id', moduleId).eq('status', 'published')
    .order('position', { ascending: true });
  return requireData(data ?? [], error) as CourseLesson[];
}
export async function getLessonById(id: string): Promise<CourseLesson | null> {
  const { data, error } = await client().from('course_lessons').select('*')
    .eq('id', id).eq('status', 'published').maybeSingle();
  return requireData(data, error) as CourseLesson | null;
}
export async function getMyCourseEnrollment(courseId: string, studentId: string): Promise<CourseEnrollment | null> {
  const { data, error } = await client().from('course_enrollments').select('*')
    .eq('course_id', courseId).eq('student_id', studentId).maybeSingle();
  return requireData(data, error) as CourseEnrollment | null;
}
export async function getMyCourseEnrollments(studentId: string): Promise<CourseEnrollmentWithCourse[]> {
  const { data, error } = await client().from('course_enrollments')
    .select('*,courses(*)').eq('student_id', studentId)
    .order('enrolled_at', { ascending: false });
  return requireData(data ?? [], error) as CourseEnrollmentWithCourse[];
}
export async function enrollInCourse(courseId: string, studentId: string): Promise<CourseEnrollment> {
  const { data, error } = await client().from('course_enrollments')
    .insert({ course_id: courseId, student_id: studentId })
    .select('*').single();
  if (error?.code === '23505') {
    const existing = await getMyCourseEnrollment(courseId, studentId);
    if (existing) return existing;
  }
  return requireData(data, error) as CourseEnrollment;
}
export async function getLessonProgress(enrollmentId: string): Promise<LessonProgress[]> {
  const { data, error } = await client().from('lesson_progress')
    .select('lesson_id,completed_at').eq('enrollment_id', enrollmentId);
  return requireData(data ?? [], error) as LessonProgress[];
}
export async function markLessonComplete(enrollmentId: string, lessonId: string): Promise<void> {
  const { error } = await client().from('lesson_progress')
    .insert({ enrollment_id: enrollmentId, lesson_id: lessonId });
  if (error && error.code !== '23505') throw new Error(error.message);
}

// Admin methods still enforce database RLS, not browser-controlled role flags.
export async function getAllCoursesForAdmin(): Promise<Course[]> {
  const { data, error } = await client().from('courses').select('*')
    .order('created_at', { ascending: false });
  return requireData(data ?? [], error) as Course[];
}
export async function createDraftCourse(input: Pick<Course, 'title' | 'slug' | 'short_description' | 'description' | 'category_id' | 'level' | 'language_code'>, createdBy: string): Promise<Course> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) throw new Error('Invalid course slug.');
  if (!input.title.trim()) throw new Error('Course title is required.');
  const { data, error } = await client().from('courses')
    .insert({ ...input, status: 'draft', created_by: createdBy }).select('*').single();
  return requireData(data, error) as Course;
}
export async function createCourseModule(courseId: string, title: string, position: number): Promise<CourseModule> {
  if (!title.trim() || !Number.isSafeInteger(position) || position < 1) throw new Error('Invalid module.');
  const { data, error } = await client().from('course_modules')
    .insert({ course_id: courseId, title: title.trim(), position, status: 'draft' })
    .select('*').single();
  return requireData(data, error) as CourseModule;
}
export async function createCourseLesson(moduleId: string, title: string, position: number): Promise<CourseLesson> {
  if (!title.trim() || !Number.isSafeInteger(position) || position < 1) throw new Error('Invalid lesson.');
  const { data, error } = await client().from('course_lessons')
    .insert({ module_id: moduleId, title: title.trim(), position, status: 'draft' })
    .select('*').single();
  return requireData(data, error) as CourseLesson;
}


export interface CourseProgressSummary {
  requiredTotal: number;
  completedRequired: number;
  percent: number;
}

/**
 * Resolve progress for an entire student's dashboard in three batched queries.
 * Every query is still restricted by the caller's Supabase RLS policies.
 * The method never trusts a client-submitted percentage.
 */
export async function getMyCourseProgress(
  enrollments: CourseEnrollmentWithCourse[],
): Promise<Record<string, CourseProgressSummary>> {
  const available = enrollments.filter(
    (enrollment) => enrollment.courses !== null && enrollment.status !== 'cancelled',
  );
  if (available.length === 0) return {};

  const supabase = client();
  const courseIds = [...new Set(available.map((enrollment) => enrollment.course_id))];
  const { data: modules, error: moduleError } = await supabase
    .from('course_modules')
    .select('id,course_id')
    .in('course_id', courseIds)
    .eq('status', 'published');
  if (moduleError) throw new Error(moduleError.message);

  const moduleToCourse = new Map(
    (modules ?? []).map((module) => [module.id, module.course_id]),
  );
  const courseRequired = new Map<string, Set<string>>();
  for (const courseId of courseIds) courseRequired.set(courseId, new Set());

  if (moduleToCourse.size > 0) {
    const { data: lessons, error: lessonError } = await supabase
      .from('course_lessons')
      .select('id,module_id')
      .in('module_id', [...moduleToCourse.keys()])
      .eq('status', 'published')
      .eq('is_required', true);
    if (lessonError) throw new Error(lessonError.message);
    for (const lesson of lessons ?? []) {
      const courseId = moduleToCourse.get(lesson.module_id);
      if (courseId) courseRequired.get(courseId)?.add(lesson.id);
    }
  }

  const { data: progress, error: progressError } = await supabase
    .from('lesson_progress')
    .select('enrollment_id,lesson_id')
    .in('enrollment_id', available.map((enrollment) => enrollment.id));
  if (progressError) throw new Error(progressError.message);

  const completionByEnrollment = new Map<string, Set<string>>();
  for (const row of progress ?? []) {
    const done = completionByEnrollment.get(row.enrollment_id) ?? new Set<string>();
    done.add(row.lesson_id);
    completionByEnrollment.set(row.enrollment_id, done);
  }

  const summary: Record<string, CourseProgressSummary> = {};
  for (const enrollment of available) {
    const required = courseRequired.get(enrollment.course_id) ?? new Set<string>();
    const done = completionByEnrollment.get(enrollment.id) ?? new Set<string>();
    let completedRequired = 0;
    for (const id of required) if (done.has(id)) completedRequired += 1;
    const requiredTotal = required.size;
    summary[enrollment.id] = {
      requiredTotal,
      completedRequired,
      percent: requiredTotal > 0 ? Math.round((completedRequired / requiredTotal) * 100) : 0,
    };
  }
  return summary;
}
