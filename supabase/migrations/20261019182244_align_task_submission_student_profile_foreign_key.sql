-- The client, enrollment FK and submission RLS all use profiles.id.
-- Production drifted to auth.users.id, rejecting valid student submissions.
-- Validate existing rows before changing the FK; do not rewrite student data.
BEGIN;
SET LOCAL lock_timeout = '5s';
LOCK TABLE public.task_submissions IN ACCESS EXCLUSIVE MODE;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.task_submissions s
    LEFT JOIN public.profiles p ON p.id = s.student_id
    WHERE p.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Submission student IDs require review before aligning the profile foreign key';
  END IF;
END;
$$;
ALTER TABLE public.task_submissions
  DROP CONSTRAINT task_submissions_student_id_fkey,
  ADD CONSTRAINT task_submissions_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
NOTIFY pgrst, 'reload schema';
COMMIT;
