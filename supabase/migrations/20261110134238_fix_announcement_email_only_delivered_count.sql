-- Fix 23502 when an email-only announcement has no in-app recipients.
-- The earlier SELECT INTO sets v_delivered to NULL when request_id is new.
-- This migration was applied to the connected Supabase DB with the same version.
CREATE OR REPLACE FUNCTION public.publish_admin_announcement_v2(
  p_title text, p_body text, p_audience text, p_recipient_email text,
  p_request_id uuid, p_channel text
)
RETURNS TABLE(announcement_id uuid, delivered_count integer, published_at timestamptz, email_queued integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_title text := btrim(coalesce(p_title,''));
  v_body text := btrim(coalesce(p_body,''));
  v_email text := nullif(lower(btrim(coalesce(p_recipient_email,''))),'');
  v_id uuid;
  v_delivered integer := 0;
  v_queued integer := 0;
  v_recipient_count integer := 0;
  v_created timestamptz;
BEGIN
  IF p_request_id IS NULL OR p_channel IS NULL OR
     p_channel NOT IN ('in_app','email','both') THEN
    RAISE EXCEPTION 'ANNOUNCEMENT_INPUT_INVALID' USING ERRCODE='22023';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(27110422);

  SELECT a.id,a.delivered_count,a.created_at
    INTO v_id,v_delivered,v_created FROM public.admin_announcements a
    WHERE a.request_id=p_request_id;
  IF FOUND THEN
    SELECT count(*)::integer INTO v_queued
      FROM public.admin_announcement_email_deliveries d WHERE d.announcement_id=v_id;
    RETURN QUERY SELECT v_id,v_delivered,v_created,v_queued;
    RETURN;
  END IF;

  -- SELECT INTO with zero rows resets v_delivered to NULL.
  -- Email-only mode does not run the student_notifications INSERT.
  v_delivered := 0;

  IF char_length(v_title) NOT BETWEEN 5 AND 120
    OR char_length(v_body) NOT BETWEEN 10 AND 2000
    OR p_audience IS NULL OR p_audience NOT IN ('all','active','individual') THEN
    RAISE EXCEPTION 'ANNOUNCEMENT_INPUT_INVALID' USING ERRCODE='22023';
  END IF;
  IF p_audience = 'individual' THEN
    IF v_email IS NULL OR char_length(v_email)>254 OR
       v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
      RAISE EXCEPTION 'ANNOUNCEMENT_RECIPIENT_INVALID' USING ERRCODE='22023';
    END IF;
  ELSE
    IF v_email IS NOT NULL THEN
      RAISE EXCEPTION 'ANNOUNCEMENT_RECIPIENT_INVALID' USING ERRCODE='22023';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.admin_announcements a
      WHERE a.audience IN ('all','active')
        AND a.created_at > now()-interval '60 seconds'
    ) THEN
      RAISE EXCEPTION 'ANNOUNCEMENT_BULK_COOLDOWN' USING ERRCODE='22023';
    END IF;
  END IF;

  SELECT count(DISTINCT p.user_id)::integer INTO v_recipient_count
  FROM public.profiles p WHERE p.role='student' AND
    (p_audience='all' OR
      (p_audience='active' AND EXISTS (
         SELECT 1 FROM public.enrollments e
         WHERE e.student_id=p.id AND e.status='active'
      )) OR
      (p_audience='individual' AND lower(p.email)=v_email));
  IF v_recipient_count=0 THEN
    RAISE EXCEPTION 'ANNOUNCEMENT_NO_RECIPIENTS' USING ERRCODE='22023';
  END IF;
  IF v_recipient_count>500 THEN
    RAISE EXCEPTION 'ANNOUNCEMENT_RECIPIENT_LIMIT' USING ERRCODE='22023';
  END IF;

  INSERT INTO public.admin_announcements
    (request_id,title,body,audience,recipient_email,delivery_channel)
  VALUES
    (p_request_id,v_title,v_body,p_audience,
      CASE WHEN p_audience='individual' THEN v_email ELSE NULL END,p_channel)
  RETURNING id,created_at INTO v_id,v_created;

  IF p_channel IN ('in_app','both') THEN
    INSERT INTO public.student_notifications(user_id,kind,event_key,subject,status,body,href)
    SELECT DISTINCT p.user_id,'announcement',
      'announcement:' || v_id::text || ':' || p.user_id::text,
      v_title,'published',v_body,'/dashboard/notifications'
    FROM public.profiles p WHERE p.role='student' AND
      (p_audience='all' OR
        (p_audience='active' AND EXISTS (
           SELECT 1 FROM public.enrollments e
           WHERE e.student_id=p.id AND e.status='active'
        )) OR
        (p_audience='individual' AND lower(p.email)=v_email));
    GET DIAGNOSTICS v_delivered = ROW_COUNT;
  END IF;

  IF p_channel IN ('email','both') THEN
    INSERT INTO public.admin_announcement_email_deliveries
      (announcement_id,user_id,recipient_email)
    SELECT DISTINCT ON (p.user_id) v_id,p.user_id,lower(btrim(p.email))
    FROM public.profiles p
    WHERE p.role='student' AND p.email IS NOT NULL AND
      btrim(p.email) ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
      AND (p_audience='all' OR
        (p_audience='active' AND EXISTS (
           SELECT 1 FROM public.enrollments e
           WHERE e.student_id=p.id AND e.status='active'
        )) OR
        (p_audience='individual' AND lower(p.email)=v_email))
    ORDER BY p.user_id,p.id;
    GET DIAGNOSTICS v_queued = ROW_COUNT;
    IF v_queued=0 THEN
      RAISE EXCEPTION 'ANNOUNCEMENT_NO_EMAIL_RECIPIENTS' USING ERRCODE='22023';
    END IF;
  END IF;

  UPDATE public.admin_announcements a
    SET delivered_count=v_delivered WHERE a.id=v_id;
  RETURN QUERY SELECT v_id,v_delivered,v_created,v_queued;
END;
$$;
