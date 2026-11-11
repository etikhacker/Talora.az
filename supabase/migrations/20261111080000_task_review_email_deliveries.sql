-- New task-review email ledger. Never backfill historical reviews.
-- Student in-app notifications keep using task_review_inbox_event.
CREATE TABLE public.task_review_email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.task_submissions(id) ON DELETE CASCADE,
  recipient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.internship_tasks(id) ON DELETE CASCADE,
  task_title text NOT NULL,
  review_status text NOT NULL CHECK (review_status IN ('approved','revision_requested','rejected')),
  review_feedback text NOT NULL DEFAULT '',
  reviewed_at timestamptz NOT NULL,
  event_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','sending','sent','failed','uncertain','skipped')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
  claimed_at timestamptz,
  sent_at timestamptz,
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX task_review_email_submission_latest_idx
  ON public.task_review_email_deliveries(submission_id,reviewed_at DESC,created_at DESC);
CREATE INDEX task_review_email_queue_idx
  ON public.task_review_email_deliveries(status,created_at);

ALTER TABLE public.task_review_email_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.task_review_email_deliveries FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public.task_review_email_deliveries TO service_role;

-- This private trigger is the atomic outbox writer: an admin's decision and
-- a single pending email entry commit or roll back in the same transaction.
CREATE FUNCTION private.capture_task_review_email()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_task_title text;
  v_event_key text;
BEGIN
  IF TG_TABLE_SCHEMA <> 'public' OR TG_TABLE_NAME <> 'task_submissions'
    OR TG_OP <> 'UPDATE' THEN
    RAISE EXCEPTION 'Invalid task review email trigger';
  END IF;
  IF NEW.status::text NOT IN ('approved','revision_requested','rejected')
    OR NEW.reviewed_at IS NULL
    OR NEW.reviewed_by IS NULL THEN
    RETURN NEW;
  END IF;
  IF (NEW.status,NEW.admin_feedback,NEW.reviewed_at) IS NOT DISTINCT FROM
     (OLD.status,OLD.admin_feedback,OLD.reviewed_at) THEN
    RETURN NEW;
  END IF;
  -- RLS + submission review field protection authorize the write.
  -- A logged-in non-admin must never enqueue another user's email.
  IF (SELECT auth.uid()) IS NOT NULL AND NOT (SELECT private.is_admin()) THEN
    RETURN NEW;
  END IF;

  SELECT p.user_id INTO v_user_id FROM public.profiles p WHERE p.id=NEW.student_id;
  SELECT t.title INTO v_task_title FROM public.internship_tasks t WHERE t.id=NEW.task_id;
  IF v_user_id IS NULL OR v_task_title IS NULL THEN RETURN NEW; END IF;

  v_event_key := 'task-review:' || NEW.id::text || ':' ||
    pg_catalog.md5(NEW.status::text || ':' || NEW.reviewed_at::text || ':' ||
      coalesce(NEW.admin_feedback,''));

  INSERT INTO public.task_review_email_deliveries(
    submission_id, recipient_user_id,task_id,task_title,
    review_status,review_feedback,reviewed_at,event_key
  ) VALUES (
    NEW.id,v_user_id,NEW.task_id,v_task_title,
    NEW.status::text,coalesce(NEW.admin_feedback,''),NEW.reviewed_at,v_event_key
  )
  ON CONFLICT (event_key) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.capture_task_review_email() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER task_review_email_event
  AFTER UPDATE OF status,admin_feedback,reviewed_at ON public.task_submissions
  FOR EACH ROW EXECUTE FUNCTION private.capture_task_review_email();
