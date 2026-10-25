-- Durable inbox. Only trusted source-table events create notifications.
CREATE TABLE public.student_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('application','task_review','deadline')),
  event_key text NOT NULL UNIQUE,
  subject text NOT NULL,
  status text NOT NULL,
  body text NOT NULL DEFAULT '',
  href text NOT NULL CHECK (href LIKE '/dashboard/%'),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX student_notifications_user_date_idx ON public.student_notifications(user_id,created_at DESC,id DESC);
CREATE INDEX student_notifications_unread_idx ON public.student_notifications(user_id) WHERE read_at IS NULL;
ALTER TABLE public.student_notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.student_notifications FROM anon, authenticated;
GRANT SELECT, UPDATE(read_at) ON public.student_notifications TO authenticated;
GRANT ALL ON public.student_notifications TO service_role;
CREATE POLICY inbox_select_own ON public.student_notifications FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY inbox_read_own ON public.student_notifications FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

-- Invoker-only helper in the existing non-exposed schema. No client EXECUTE.
CREATE FUNCTION private.record_student_notification(source_table text, row_data jsonb)
RETURNS void LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE
  recipient uuid;
  event_kind text;
  event_status text := row_data->>'status';
  event_subject text;
  event_body text := '';
  event_href text;
  event_time timestamptz;
  event_read timestamptz;
  event_identity text;
BEGIN
  SELECT user_id INTO recipient FROM public.profiles WHERE id = (row_data->>'student_id')::uuid;
  IF recipient IS NULL THEN RETURN; END IF;
  IF source_table = 'applications' THEN
    IF event_status NOT IN ('accepted','rejected') THEN RETURN; END IF;
    event_kind := 'application';
    SELECT title INTO event_subject FROM public.internships WHERE id = (row_data->>'internship_id')::uuid;
    event_href := '/dashboard/applications';
    -- Deliberately omit internal application admin_note.
  ELSIF source_table = 'task_submissions' THEN
    IF event_status NOT IN ('approved','revision_requested','rejected') THEN RETURN; END IF;
    event_kind := 'task_review';
    SELECT title INTO event_subject FROM public.internship_tasks WHERE id = (row_data->>'task_id')::uuid;
    event_body := coalesce(row_data->>'admin_feedback','');
    event_href := '/dashboard/internship/tasks/' || (row_data->>'task_id');
  ELSIF source_table = 'deadline_notifications' THEN
    event_kind := 'deadline';
    event_status := row_data->>'kind';
    SELECT title INTO event_subject FROM public.internship_tasks WHERE id = (row_data->>'task_id')::uuid;
    event_body := coalesce(row_data->>'message','');
    event_href := CASE WHEN event_status='deadline_expired' THEN '/dashboard/internship'
      ELSE '/dashboard/internship/tasks/' || (row_data->>'task_id') END;
    event_read := (row_data->>'read_at')::timestamptz;
  ELSE
    RAISE EXCEPTION 'Unsupported notification source';
  END IF;
  IF event_subject IS NULL THEN RETURN; END IF;
  event_time := coalesce((row_data->>'reviewed_at')::timestamptz,
    (row_data->>'updated_at')::timestamptz,(row_data->>'created_at')::timestamptz,
    (row_data->>'submitted_at')::timestamptz,now());
  event_identity := source_table || ':' || (row_data->>'id') || ':' || event_status;
  IF event_kind <> 'deadline' THEN
    event_identity := event_identity || ':' || md5(coalesce(row_data->>'reviewed_at','') || ':' || event_body);
  END IF;
  INSERT INTO public.student_notifications(user_id,kind,event_key,subject,status,body,href,created_at,read_at)
    VALUES(recipient,event_kind,event_identity,event_subject,event_status,event_body,event_href,event_time,event_read)
    ON CONFLICT(event_key) DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION private.record_student_notification(text,jsonb) FROM PUBLIC,anon,authenticated;

-- The source tables' RLS authorizes the review. Definer rights are needed only
-- to deliver to another user's inbox; the trigger cannot be invoked as an RPC.
CREATE FUNCTION private.capture_student_notification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_TABLE_SCHEMA <> 'public' OR TG_TABLE_NAME NOT IN ('applications','task_submissions','deadline_notifications') THEN
    RAISE EXCEPTION 'Unsupported notification trigger';
  END IF;
  IF auth.uid() IS NOT NULL AND NOT private.is_admin() THEN RETURN NEW; END IF;
  IF TG_OP='UPDATE' THEN
    IF TG_TABLE_NAME='applications' THEN
      IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
    ELSIF TG_TABLE_NAME='task_submissions' THEN
      IF (NEW.status,NEW.admin_feedback,NEW.reviewed_at) IS NOT DISTINCT FROM
        (OLD.status,OLD.admin_feedback,OLD.reviewed_at) THEN RETURN NEW; END IF;
    END IF;
  END IF;
  PERFORM private.record_student_notification(TG_TABLE_NAME,to_jsonb(NEW));
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.capture_student_notification() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER application_inbox_event AFTER INSERT OR UPDATE OF status ON public.applications
  FOR EACH ROW EXECUTE FUNCTION private.capture_student_notification();
CREATE TRIGGER task_review_inbox_event AFTER INSERT OR UPDATE OF status,admin_feedback,reviewed_at ON public.task_submissions
  FOR EACH ROW EXECUTE FUNCTION private.capture_student_notification();
CREATE TRIGGER deadline_inbox_event AFTER INSERT ON public.deadline_notifications
  FOR EACH ROW EXECUTE FUNCTION private.capture_student_notification();

-- Backfill real existing decisions only; do not fabricate history or send email.
SELECT private.record_student_notification('applications',to_jsonb(a)) FROM public.applications a WHERE a.status IN ('accepted','rejected');
SELECT private.record_student_notification('task_submissions',to_jsonb(s)) FROM public.task_submissions s WHERE s.status IN ('approved','revision_requested','rejected');
SELECT private.record_student_notification('deadline_notifications',to_jsonb(d)) FROM public.deadline_notifications d;
