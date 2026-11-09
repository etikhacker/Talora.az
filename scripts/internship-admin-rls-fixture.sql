-- Synthetic role configuration to verify internship draft read isolation.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;
CREATE SCHEMA private;
GRANT USAGE ON SCHEMA public TO anon,authenticated;
GRANT USAGE ON SCHEMA auth TO anon,authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $uid$
  SELECT NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid;
$uid$;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated;
CREATE TABLE public.profiles (user_id uuid PRIMARY KEY, role text NOT NULL);
INSERT INTO public.profiles(user_id,role) VALUES
  ('00000000-0000-4000-8000-000000000001','student'),
  ('00000000-0000-4000-8000-000000000002','admin');
CREATE FUNCTION private.is_admin() RETURNS boolean
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $admin$
 SELECT EXISTS(
  SELECT 1 FROM public.profiles p
  WHERE p.user_id=(SELECT auth.uid()) AND p.role='admin'
 );
$admin$;
REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.internships TO anon,authenticated;
CREATE POLICY internships_public_select ON public.internships
  FOR SELECT TO anon,authenticated USING (status='published');
INSERT INTO public.internships(title,slug,status)
 VALUES ('Existing published internship','legacy-public-program','published');
