-- Minimal isolated Supabase-like fixture for PostgreSQL 17 integration tests.
-- This is NOT a dump from production. No personal data, secrets or live IDs.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;
CREATE SCHEMA private;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid;
$$;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated;
CREATE TABLE auth.users (id uuid PRIMARY KEY, email text UNIQUE);

CREATE TABLE public.profiles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id),
 role text NOT NULL CHECK (role IN ('student','admin'))
);
CREATE FUNCTION private.is_admin() RETURNS boolean LANGUAGE sql STABLE
SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT EXISTS (
   SELECT 1 FROM public.profiles WHERE user_id=(SELECT auth.uid()) AND role='admin'
 );
$$;
REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.profiles TO authenticated;
CREATE POLICY profiles_read ON public.profiles FOR SELECT TO authenticated USING (
 user_id=(SELECT auth.uid()) OR (SELECT private.is_admin())
);

CREATE TABLE public.internships (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 category text NOT NULL
);
INSERT INTO auth.users(id,email) VALUES
 ('00000000-0000-4000-8000-0000000000a1','student-a@example.test'),
 ('00000000-0000-4000-8000-0000000000a2','student-b@example.test'),
 ('00000000-0000-4000-8000-0000000000a3','admin@example.test');
INSERT INTO public.profiles(id,user_id,role) VALUES
 ('00000000-0000-4000-8000-0000000000b1','00000000-0000-4000-8000-0000000000a1','student'),
 ('00000000-0000-4000-8000-0000000000b2','00000000-0000-4000-8000-0000000000a2','student'),
 ('00000000-0000-4000-8000-0000000000b3','00000000-0000-4000-8000-0000000000a3','admin');
INSERT INTO public.internships(category) VALUES
 ('Frontend'),('Backend'),('Data'),('AI'),
 ('Cybersecurity'),('Automation'),('Mobile Development'),('UI/UX Design');
