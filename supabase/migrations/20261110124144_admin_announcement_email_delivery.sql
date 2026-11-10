-- Email channel support for admin announcements. Safe to apply after
-- 20261110104253_admin_announcements.sql. Existing in-app RPC stays intact.
ALTER TABLE public.admin_announcements
  ADD COLUMN delivery_channel text NOT NULL DEFAULT 'in_app'
  CHECK (delivery_channel IN ('in_app', 'email', 'both'));

CREATE TABLE public.admin_announcement_email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.admin_announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','sending','sent','failed','uncertain')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 10),
  last_error_code text,
  claimed_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);
CREATE INDEX admin_announcement_email_jobs_idx
  ON public.admin_announcement_email_deliveries(status,created_at,id);
CREATE INDEX admin_announcement_email_announcement_idx
  ON public.admin_announcement_email_deliveries(announcement_id,status);
ALTER TABLE public.admin_announcement_email_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_announcement_email_deliveries FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.admin_announcement_email_deliveries TO service_role;

-- Atomic history creation, inbox delivery and email-job enqueueing.
CREATE FUNCTION public.publish_admin_announcement_v2(
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
REVOKE ALL ON FUNCTION public.publish_admin_announcement_v2(text,text,text,text,uuid,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_admin_announcement_v2(text,text,text,text,uuid,text)
  TO service_role;

-- Claim work under a row lock. A request can claim at most 6 jobs.
-- Ambiguous interrupted sends are never automatically retried.
CREATE FUNCTION public.claim_admin_announcement_email_jobs(
  p_announcement_id uuid, p_retry_failed boolean DEFAULT false,
  p_retry_uncertain boolean DEFAULT false
)
RETURNS TABLE(job_id uuid, recipient_email text, subject text, body text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.admin_announcement_email_deliveries d
    SET status='uncertain',last_error_code='INTERRUPTED_UNCONFIRMED'
    WHERE d.announcement_id=p_announcement_id AND d.status='sending'
      AND d.claimed_at < now()-interval '10 minutes';

  RETURN QUERY
  WITH picked AS (
    SELECT d.id FROM public.admin_announcement_email_deliveries d
    WHERE d.announcement_id=p_announcement_id AND d.attempts<10
      AND (d.status='queued'
        OR (p_retry_failed AND d.status='failed')
        OR (p_retry_uncertain AND d.status='uncertain'))
    ORDER BY d.created_at,d.id LIMIT 6 FOR UPDATE SKIP LOCKED
  ),
  updated AS (
    UPDATE public.admin_announcement_email_deliveries d
      SET status='sending',claimed_at=now(),attempts=d.attempts+1,
        last_error_code=NULL
      FROM picked WHERE d.id=picked.id
    RETURNING d.id,d.recipient_email,d.announcement_id
  )
  SELECT u.id,u.recipient_email,a.title,a.body
  FROM updated u JOIN public.admin_announcements a ON a.id=u.announcement_id;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_admin_announcement_email_jobs(uuid,boolean,boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_admin_announcement_email_jobs(uuid,boolean,boolean)
  TO service_role;

CREATE FUNCTION public.admin_announcement_email_summaries(p_ids uuid[])
RETURNS TABLE(announcement_id uuid, queued_count integer, sending_count integer,
  sent_count integer, failed_count integer, uncertain_count integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT d.announcement_id,
    count(*) FILTER (WHERE d.status='queued')::integer,
    count(*) FILTER (WHERE d.status='sending')::integer,
    count(*) FILTER (WHERE d.status='sent')::integer,
    count(*) FILTER (WHERE d.status='failed')::integer,
    count(*) FILTER (WHERE d.status='uncertain')::integer
  FROM public.admin_announcement_email_deliveries d
  WHERE d.announcement_id=ANY(p_ids)
  GROUP BY d.announcement_id;
$$;
REVOKE ALL ON FUNCTION public.admin_announcement_email_summaries(uuid[])
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_announcement_email_summaries(uuid[])
  TO service_role;
