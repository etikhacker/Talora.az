-- Isolated PostgreSQL 17 fixture. No production users or messages.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $uid$
  SELECT NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid;
$uid$;
GRANT USAGE ON SCHEMA auth, public TO authenticated,anon;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated,anon;

CREATE TABLE public.student_notifications (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  kind text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL,
  body text NOT NULL DEFAULT '',
  href text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.student_notifications ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.student_notifications TO authenticated;
CREATE POLICY inbox_select_own ON public.student_notifications
  FOR SELECT TO authenticated USING (user_id=(SELECT auth.uid()));
CREATE POLICY inbox_read_own ON public.student_notifications
  FOR UPDATE TO authenticated USING (user_id=(SELECT auth.uid()))
  WITH CHECK (user_id=(SELECT auth.uid()));

INSERT INTO public.student_notifications(id,user_id,kind,subject,status,href) VALUES
 ('00000000-0000-4000-8000-0000000000b1','00000000-0000-4000-8000-0000000000a1','application','Program A','accepted','/dashboard/applications'),
 ('00000000-0000-4000-8000-0000000000b2','00000000-0000-4000-8000-0000000000a2','application','Program B','accepted','/dashboard/applications');
