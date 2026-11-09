-- Run only after Courses Foundation migration has been applied to staging.
-- Read-only schema smoke checks. Expected: six new tables have RLS enabled.
SELECT tablename, rowsecurity
FROM pg_tables WHERE schemaname='public'
  AND tablename IN ('categories','courses','course_modules','course_lessons','course_enrollments','lesson_progress')
ORDER BY tablename;

-- Expected: all 8 existing internships retain original category, and category_id is populated.
SELECT category, COUNT(*) AS records, COUNT(category_id) AS linked
FROM public.internships GROUP BY category ORDER BY category;

-- Expected: published courses (if any) are separate from drafts.
SELECT status, COUNT(*) FROM public.courses GROUP BY status ORDER BY status;

-- Expected: all 6 new tables have policies; verify roles, predicates, and grants.
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname='public' AND tablename IN
 ('categories','courses','course_modules','course_lessons','course_enrollments','lesson_progress')
ORDER BY tablename,policyname;

-- Metadata-only check for course grants; run tests under real JWT sessions for RLS.
SELECT table_name, privilege_type, grantee
FROM information_schema.role_table_grants
WHERE table_schema='public' AND table_name IN
 ('categories','courses','course_modules','course_lessons','course_enrollments','lesson_progress')
 AND grantee IN ('anon','authenticated')
ORDER BY table_name,grantee,privilege_type;
