-- PostgreSQL 17 synthetic fixture: no live users or production records.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;
CREATE SCHEMA private;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $uid$
 SELECT NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid
$uid$;
GRANT USAGE ON SCHEMA public,auth TO anon,authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated;
CREATE TABLE public.profiles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id),
 role text NOT NULL DEFAULT 'student',
 created_at timestamptz NOT NULL DEFAULT now() - interval '1 day'
);
CREATE FUNCTION private.is_admin() RETURNS boolean
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $f$
 SELECT EXISTS(SELECT 1 FROM public.profiles
   WHERE user_id=auth.uid() AND role='admin');
$f$;
REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

CREATE TABLE public.internships (
 id uuid PRIMARY KEY,
 status text NOT NULL,
 max_students integer,
 created_at timestamptz DEFAULT now()-interval '1 day'
);
CREATE TABLE public.enrollments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 internship_id uuid NOT NULL REFERENCES public.internships(id),
 status text NOT NULL,
 completed_at timestamptz
);
CREATE TABLE public.applications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 status text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()-interval '1 day'
);
CREATE TABLE public.internship_tasks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 created_at timestamptz NOT NULL DEFAULT now()-interval '1 day'
);
CREATE TABLE public.task_submissions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 status text NOT NULL,
 submitted_at timestamptz NOT NULL DEFAULT now()-interval '1 day'
);
CREATE TABLE public.certificate_payments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 status text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()-interval '1 day'
);
CREATE TABLE public.certificates (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 created_at timestamptz NOT NULL DEFAULT now()-interval '1 day'
);
CREATE TABLE public.contact_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 status text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()-interval '1 day'
);
INSERT INTO auth.users(id) VALUES
 ('00000000-0000-4000-8000-0000000000a1'),
 ('00000000-0000-4000-8000-0000000000a2');
INSERT INTO public.profiles(user_id,role) VALUES
 ('00000000-0000-4000-8000-0000000000a1','student'),
 ('00000000-0000-4000-8000-0000000000a2','admin');
INSERT INTO public.internships(id,status,max_students) VALUES
 ('00000000-0000-4000-8000-0000000000b1','published',3),
 ('00000000-0000-4000-8000-0000000000b2','published',1),
 ('00000000-0000-4000-8000-0000000000b3','published',NULL),
 ('00000000-0000-4000-8000-0000000000b4','draft',10);
INSERT INTO public.enrollments(internship_id,status,completed_at) VALUES
 ('00000000-0000-4000-8000-0000000000b1','active',NULL),
 ('00000000-0000-4000-8000-0000000000b1','active',NULL),
 ('00000000-0000-4000-8000-0000000000b1','completed',now()-interval '1 day'),
 ('00000000-0000-4000-8000-0000000000b2','active',NULL),
 ('00000000-0000-4000-8000-0000000000b2','active',NULL),
 ('00000000-0000-4000-8000-0000000000b4','active',NULL);
INSERT INTO public.applications(status) VALUES ('pending'),('accepted');
INSERT INTO public.internship_tasks DEFAULT VALUES;
INSERT INTO public.task_submissions(status) VALUES ('pending'),('approved');
INSERT INTO public.certificate_payments(status) VALUES ('pending'),('rejected');
INSERT INTO public.certificates DEFAULT VALUES;
INSERT INTO public.contact_messages(status) VALUES ('new'),('read');
