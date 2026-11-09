-- Talora student presence and admin-only student activity summary.
-- Data minimisation: one last_seen timestamp; no IP, device, location, or URL history.
-- Existing applications, enrollments, and submissions provide action history.

CREATE TABLE private.student_presence (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT pg_catalog.now()
);
ALTER TABLE private.student_presence ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.student_presence FROM PUBLIC, anon, authenticated;

-- Student-presence writes are authenticated, scoped to auth.uid and role-checked.
-- Server timestamps and a two-minute DB rate limit prevent client-forged times.
CREATE FUNCTION public.touch_student_presence()
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $touch_student$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id=v_user AND p.role='student'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO private.student_presence (user_id,last_seen_at)
  VALUES (v_user,pg_catalog.clock_timestamp())
  ON CONFLICT (user_id) DO UPDATE
    SET last_seen_at=EXCLUDED.last_seen_at
    WHERE private.student_presence.last_seen_at
      <= EXCLUDED.last_seen_at - interval '2 minutes';
END;
$touch_student$;
REVOKE ALL ON FUNCTION public.touch_student_presence() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.touch_student_presence() TO authenticated;

-- Only existing server-side admin authorization can retrieve activity.
-- Does not expose task answers, application letters, email, IP, or browsing history.
CREATE FUNCTION public.get_admin_student_activity(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $student_activity$
DECLARE
  v_user uuid;
  v_signin timestamptz;
  v_last_seen timestamptz;
  v_events jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT COALESCE(private.is_admin(), false) THEN
    RAISE EXCEPTION 'Admin authorization required' USING ERRCODE='42501';
  END IF;

  SELECT p.user_id INTO v_user FROM public.profiles p
  WHERE p.id=p_profile_id AND p.role='student';
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Student not found' USING ERRCODE='P0002';
  END IF;

  SELECT u.last_sign_in_at, sp.last_seen_at INTO v_signin,v_last_seen
  FROM auth.users u
  LEFT JOIN private.student_presence sp ON sp.user_id=u.id
  WHERE u.id=v_user;

  SELECT COALESCE(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'kind', actions.kind,
        'at', actions.occurred_at,
        'title', actions.title,
        'program', actions.program,
        'status', actions.status
      ) ORDER BY actions.occurred_at DESC
    ),'[]'::jsonb
  ) INTO v_events
  FROM (
    SELECT a.created_at AS occurred_at, 'application_submitted'::text AS kind,
           i.title::text AS title, i.title::text AS program, a.status::text AS status
    FROM public.applications a
    JOIN public.internships i ON i.id=a.internship_id
    WHERE a.student_id=p_profile_id

    UNION ALL

    SELECT s.submitted_at, 'task_submitted',
           t.title::text, i.title::text, s.status::text
    FROM public.task_submissions s
    JOIN public.internship_tasks t ON t.id=s.task_id
    JOIN public.internships i ON i.id=t.internship_id
    WHERE s.student_id=p_profile_id

    UNION ALL

    SELECT e.enrolled_at, 'enrolled',
           i.title::text, i.title::text, e.status::text
    FROM public.enrollments e
    JOIN public.internships i ON i.id=e.internship_id
    WHERE e.student_id=p_profile_id

    UNION ALL

    SELECT e.completed_at, 'internship_completed',
           i.title::text, i.title::text, e.status::text
    FROM public.enrollments e
    JOIN public.internships i ON i.id=e.internship_id
    WHERE e.student_id=p_profile_id AND e.completed_at IS NOT NULL
    ORDER BY occurred_at DESC
    LIMIT 12
  ) actions;

  RETURN pg_catalog.jsonb_build_object(
    'last_sign_in_at',v_signin,
    'last_seen_at',v_last_seen,
    'events',v_events
  );
END;
$student_activity$;
REVOKE ALL ON FUNCTION public.get_admin_student_activity(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_student_activity(uuid) TO authenticated;
