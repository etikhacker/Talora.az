-- Talora: public seat totals + per-admin unread section watermarks.
-- Additive; no change to existing RLS grants, enrollments or application data.
-- Requires the existing private.is_admin() and auth.uid() functions.

-- Watermarks are private: the client never accesses this table directly.
CREATE TABLE private.admin_section_seen (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section text NOT NULL CHECK (section IN (
    'internships', 'applications', 'tasks', 'submissions', 'students',
    'completed', 'certificate-orders', 'certificates', 'contact-messages'
  )),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, section)
);
ALTER TABLE private.admin_section_seen ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.admin_section_seen FROM PUBLIC, anon, authenticated;

-- Returns only safe aggregate counts, not user IDs or submission content.
-- The function is called by the admin browser; non-admins cannot execute it.
CREATE FUNCTION public.get_admin_sidebar_counts()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $admin_counts$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL OR NOT COALESCE(private.is_admin(),false) THEN
    RAISE EXCEPTION 'Admin authorization required' USING ERRCODE='42501';
  END IF;
  RETURN pg_catalog.jsonb_build_object(
    'internships', (SELECT count(*) FROM public.internships x
      WHERE x.created_at > COALESCE(
        (SELECT s.last_seen_at FROM private.admin_section_seen s
         WHERE s.user_id=v_user AND s.section='internships'),
        '-infinity'::timestamptz)),
    'applications', (SELECT count(*) FROM public.applications x
      WHERE x.status='pending' AND x.created_at > COALESCE(
        (SELECT s.last_seen_at FROM private.admin_section_seen s
         WHERE s.user_id=v_user AND s.section='applications'),
        '-infinity'::timestamptz)),
    'tasks', (SELECT count(*) FROM public.internship_tasks x
      WHERE x.created_at > COALESCE(
        (SELECT s.last_seen_at FROM private.admin_section_seen s
         WHERE s.user_id=v_user AND s.section='tasks'),
        '-infinity'::timestamptz)),
    'submissions', (SELECT count(*) FROM public.task_submissions x
      WHERE x.status='pending' AND x.submitted_at > COALESCE(
        (SELECT s.last_seen_at FROM private.admin_section_seen s
         WHERE s.user_id=v_user AND s.section='submissions'),
        '-infinity'::timestamptz)),
    'students', (SELECT count(*) FROM public.profiles x
      WHERE x.role='student' AND x.created_at > COALESCE(
        (SELECT s.last_seen_at FROM private.admin_section_seen s
         WHERE s.user_id=v_user AND s.section='students'),
        '-infinity'::timestamptz)),
    'completed', (SELECT count(*) FROM public.enrollments x
      WHERE x.status='completed' AND x.completed_at > COALESCE(
        (SELECT s.last_seen_at FROM private.admin_section_seen s
         WHERE s.user_id=v_user AND s.section='completed'),
        '-infinity'::timestamptz)),
    'certificate-orders', (SELECT count(*) FROM public.certificate_payments x
      WHERE x.status='pending' AND x.created_at > COALESCE(
        (SELECT s.last_seen_at FROM private.admin_section_seen s
         WHERE s.user_id=v_user AND s.section='certificate-orders'),
        '-infinity'::timestamptz)),
    'certificates', (SELECT count(*) FROM public.certificates x
      WHERE x.created_at > COALESCE(
        (SELECT s.last_seen_at FROM private.admin_section_seen s
         WHERE s.user_id=v_user AND s.section='certificates'),
        '-infinity'::timestamptz)),
    'contact-messages', (SELECT count(*) FROM public.contact_messages x
      WHERE x.status='new' AND x.created_at > COALESCE(
        (SELECT s.last_seen_at FROM private.admin_section_seen s
         WHERE s.user_id=v_user AND s.section='contact-messages'),
        '-infinity'::timestamptz))
  );
END;
$admin_counts$;
REVOKE ALL ON FUNCTION public.get_admin_sidebar_counts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_sidebar_counts() TO authenticated;

-- Opening a sidebar section marks that section as seen for this admin only.
CREATE FUNCTION public.mark_admin_sidebar_seen(p_section text)
RETURNS timestamptz LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $admin_seen$
DECLARE
  v_user uuid := auth.uid();
  v_seen timestamptz;
BEGIN
  IF v_user IS NULL OR NOT COALESCE(private.is_admin(),false) THEN
    RAISE EXCEPTION 'Admin authorization required' USING ERRCODE='42501';
  END IF;
  IF p_section NOT IN (
    'internships','applications','tasks','submissions','students',
    'completed','certificate-orders','certificates','contact-messages'
  ) OR p_section IS NULL THEN
    RAISE EXCEPTION 'Unsupported sidebar section' USING ERRCODE='22023';
  END IF;
  INSERT INTO private.admin_section_seen(user_id,section,last_seen_at)
    VALUES (v_user,p_section,pg_catalog.clock_timestamp())
  ON CONFLICT (user_id,section) DO UPDATE
    SET last_seen_at=pg_catalog.greatest(
      private.admin_section_seen.last_seen_at,EXCLUDED.last_seen_at
    )
  RETURNING last_seen_at INTO v_seen;
  RETURN v_seen;
END;
$admin_seen$;
REVOKE ALL ON FUNCTION public.mark_admin_sidebar_seen(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_admin_sidebar_seen(text) TO authenticated;

-- This intentionally public RPC exposes ONLY seat counts for published
-- internships. Anonymous users have no SELECT permission on enrollments.
CREATE FUNCTION public.get_public_internship_seats(p_internship_id uuid DEFAULT NULL)
RETURNS TABLE (
  internship_id uuid,
  capacity integer,
  active_enrollments integer,
  remaining_seats integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $public_seats$
  SELECT i.id, i.max_students,
    COALESCE(e.active_count,0)::integer,
    CASE WHEN i.max_students IS NULL THEN NULL
      ELSE pg_catalog.greatest(i.max_students-COALESCE(e.active_count,0)::integer,0)
    END
  FROM public.internships i
  LEFT JOIN LATERAL (
    SELECT count(*)::integer AS active_count
    FROM public.enrollments en
    WHERE en.internship_id=i.id AND en.status='active'
  ) e ON true
  WHERE i.status='published'
    AND (p_internship_id IS NULL OR i.id=p_internship_id);
$public_seats$;
REVOKE ALL ON FUNCTION public.get_public_internship_seats(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_internship_seats(uuid) TO anon, authenticated;
