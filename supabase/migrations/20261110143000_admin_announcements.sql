-- Durable admin announcements and atomic, idempotent in-app delivery.
-- Only the server-side service_role may publish or inspect announcement history.
-- No new email messages are sent by this migration.
CREATE TABLE public.admin_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 5 AND 120),
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 10 AND 2000),
  audience text NOT NULL CHECK (audience IN ('all', 'active', 'individual')),
  recipient_email text,
  delivered_count integer NOT NULL DEFAULT 0 CHECK (delivered_count BETWEEN 0 AND 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_announcement_individual_recipient_check CHECK (
    (audience = 'individual' AND recipient_email IS NOT NULL) OR
    (audience <> 'individual' AND recipient_email IS NULL)
  )
);
CREATE INDEX admin_announcements_created_idx
  ON public.admin_announcements (created_at DESC, id DESC);
ALTER TABLE public.admin_announcements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_announcements FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.admin_announcements TO service_role;

ALTER TABLE public.student_notifications
  DROP CONSTRAINT student_notifications_kind_check;
ALTER TABLE public.student_notifications
  ADD CONSTRAINT student_notifications_kind_check
  CHECK (kind IN ('application', 'task_review', 'deadline', 'announcement'));

-- This function is an atomic fan-out: either the announcement AND all inbox
-- records are committed, or none are. It is never executable with a browser
-- token. The API authenticates and checks sole-admin before using service_role.
CREATE FUNCTION public.publish_admin_announcement(
  p_title text,
  p_body text,
  p_audience text,
  p_recipient_email text,
  p_request_id uuid
)
RETURNS TABLE (announcement_id uuid, delivered_count integer, published_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_title text := btrim(coalesce(p_title, ''));
  v_body text := btrim(coalesce(p_body, ''));
  v_email text := nullif(lower(btrim(coalesce(p_recipient_email, ''))), '');
  v_id uuid;
  v_count integer;
  v_created timestamptz;
BEGIN
  IF p_request_id IS NULL THEN
    RAISE EXCEPTION 'ANNOUNCEMENT_REQUEST_ID_REQUIRED' USING ERRCODE='22023';
  END IF;

  -- Serialize delivery creation so simultaneous POSTs do not bypass the
  -- 60-second bulk cooldown. Unique request_id is the idempotency barrier.
  PERFORM pg_catalog.pg_advisory_xact_lock(27110422);

  SELECT a.id, a.delivered_count, a.created_at
    INTO v_id, v_count, v_created
    FROM public.admin_announcements AS a WHERE a.request_id = p_request_id;
  IF FOUND THEN
    RETURN QUERY SELECT v_id, v_count, v_created;
    RETURN;
  END IF;

  IF char_length(v_title) NOT BETWEEN 5 AND 120 OR
     char_length(v_body) NOT BETWEEN 10 AND 2000 OR
     p_audience NOT IN ('all','active','individual') THEN
    RAISE EXCEPTION 'ANNOUNCEMENT_INPUT_INVALID' USING ERRCODE='22023';
  END IF;
  IF p_audience = 'individual' THEN
    IF v_email IS NULL OR char_length(v_email) > 254 OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
      RAISE EXCEPTION 'ANNOUNCEMENT_RECIPIENT_INVALID' USING ERRCODE='22023';
    END IF;
  ELSE
    IF v_email IS NOT NULL THEN
      RAISE EXCEPTION 'ANNOUNCEMENT_RECIPIENT_NOT_ALLOWED' USING ERRCODE='22023';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.admin_announcements
      WHERE audience IN ('all','active')
        AND created_at > now() - interval '60 seconds'
    ) THEN
      RAISE EXCEPTION 'ANNOUNCEMENT_BULK_COOLDOWN' USING ERRCODE='22023';
    END IF;
  END IF;

  SELECT count(DISTINCT p.user_id) INTO v_count
    FROM public.profiles p
    WHERE p.role = 'student'
      AND (
        p_audience = 'all'
        OR (p_audience = 'active' AND EXISTS (
          SELECT 1 FROM public.enrollments e
          WHERE e.student_id = p.id AND e.status = 'active'
        ))
        OR (p_audience = 'individual' AND lower(p.email) = v_email)
      );

  IF v_count = 0 THEN
    RAISE EXCEPTION 'ANNOUNCEMENT_NO_RECIPIENTS' USING ERRCODE='22023';
  END IF;
  IF v_count > 500 THEN
    RAISE EXCEPTION 'ANNOUNCEMENT_RECIPIENT_LIMIT' USING ERRCODE='22023';
  END IF;

  INSERT INTO public.admin_announcements(request_id,title,body,audience,recipient_email)
    VALUES (p_request_id,v_title,v_body,p_audience,CASE WHEN p_audience='individual' THEN v_email ELSE NULL END)
    RETURNING id, created_at INTO v_id, v_created;

  INSERT INTO public.student_notifications(user_id,kind,event_key,subject,status,body,href)
  SELECT DISTINCT p.user_id, 'announcement',
    'announcement:' || v_id::text || ':' || p.user_id::text,
    v_title, 'published', v_body, '/dashboard/notifications'
  FROM public.profiles p
  WHERE p.role = 'student'
    AND (
      p_audience = 'all'
      OR (p_audience = 'active' AND EXISTS (
        SELECT 1 FROM public.enrollments e
        WHERE e.student_id = p.id AND e.status = 'active'
      ))
      OR (p_audience = 'individual' AND lower(p.email) = v_email)
    );
  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE public.admin_announcements SET delivered_count = v_count
    WHERE id = v_id;

  RETURN QUERY SELECT v_id, v_count, v_created;
END;
$$;
REVOKE ALL ON FUNCTION public.publish_admin_announcement(text,text,text,text,uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_admin_announcement(text,text,text,text,uuid)
  TO service_role;
