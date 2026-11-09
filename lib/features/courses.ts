/**
 * Courses is disabled by default until its database migration and environment
 * have been verified. Keep this flag public: it is NOT an authorization control.
 * RLS must still enforce student/admin permissions.
 *
 * To enable only in a safe environment, set NEXT_PUBLIC_COURSES_ENABLED=true
 * for that environment and redeploy. Never enable on previews connected to
 * production Supabase before the migration and end-to-end tests pass.
 */
export const isCoursesEnabled = process.env.NEXT_PUBLIC_COURSES_ENABLED === 'true';
