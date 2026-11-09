-- Isolated PostgreSQL 17 fixture for student activity authorization tests.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;
CREATE SCHEMA private;

CREATE TABLE auth.users (
  id uuid PRIMARY KEY,
  last_sign_in_at timestamptz
);
CREATE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE AS $uid$
  SELECT NULLIF(pg_catalog.current_setting('request.jwt.claim.sub',true),'')::uuid
$uid$;
GRANT USAGE ON SCHEMA public,auth TO anon,authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  role text NOT NULL,
  full_name text NOT NULL
);
CREATE FUNCTION private.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $admin$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id=auth.uid() AND role='admin'
  )
$admin$;
REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

CREATE TABLE public.internships (
  id uuid PRIMARY KEY,
  title text NOT NULL
);
CREATE TABLE public.internship_tasks (
  id uuid PRIMARY KEY,
  internship_id uuid REFERENCES public.internships(id),
  title text NOT NULL
);
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id uuid REFERENCES public.internships(id),
  student_id uuid REFERENCES public.profiles(id),
  status text NOT NULL,
  created_at timestamptz NOT NULL
);
CREATE TABLE public.task_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.internship_tasks(id),
  student_id uuid REFERENCES public.profiles(id),
  status text NOT NULL,
  submitted_at timestamptz NOT NULL
);
CREATE TABLE public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id uuid REFERENCES public.internships(id),
  student_id uuid REFERENCES public.profiles(id),
  status text NOT NULL,
  enrolled_at timestamptz NOT NULL,
  completed_at timestamptz
);
INSERT INTO auth.users (id,last_sign_in_at) VALUES
('00000000-0000-4000-8000-0000000000a1','2026-11-07 10:00:00+00'),
('00000000-0000-4000-8000-0000000000a2','2026-11-08 10:00:00+00'),
('00000000-0000-4000-8000-0000000000a3','2026-11-09 10:00:00+00');
INSERT INTO public.profiles(id,user_id,role,full_name) VALUES
('00000000-0000-4000-8000-0000000000b1','00000000-0000-4000-8000-0000000000a1','student','Student A'),
('00000000-0000-4000-8000-0000000000b2','00000000-0000-4000-8000-0000000000a2','student','Student B'),
('00000000-0000-4000-8000-0000000000b3','00000000-0000-4000-8000-0000000000a3','admin','Admin');
INSERT INTO public.internships(id,title) VALUES
('00000000-0000-4000-8000-0000000000c1','Example Internship');
INSERT INTO public.internship_tasks(id,internship_id,title) VALUES
('00000000-0000-4000-8000-0000000000d1','00000000-0000-4000-8000-0000000000c1','Example Task');
INSERT INTO public.applications(internship_id,student_id,status,created_at) VALUES
('00000000-0000-4000-8000-0000000000c1','00000000-0000-4000-8000-0000000000b1','pending','2026-11-08 11:00:00+00');
INSERT INTO public.task_submissions(task_id,student_id,status,submitted_at) VALUES
('00000000-0000-4000-8000-0000000000d1','00000000-0000-4000-8000-0000000000b1','approved','2026-11-09 11:00:00+00');
INSERT INTO public.enrollments(internship_id,student_id,status,enrolled_at) VALUES
('00000000-0000-4000-8000-0000000000c1','00000000-0000-4000-8000-0000000000b1','active','2026-11-08 12:00:00+00');
