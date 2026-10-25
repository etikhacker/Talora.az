-- Run as database owner. All source updates/read states roll back; no email sent.
BEGIN;
-- Exercise the same authenticated administrator checks as the review UI.
SELECT set_config('request.jwt.claim.sub',(SELECT id::text FROM auth.users WHERE lower(email)='babayev.omr.23@gmail.com'),true) IS NOT NULL AS configured_review_identity;
DO $$
DECLARE app public.applications; submission public.task_submissions; before_count bigint;
BEGIN
  SELECT * INTO STRICT app FROM public.applications WHERE status='accepted' LIMIT 1;
  SELECT count(*) INTO before_count FROM public.student_notifications;
  UPDATE public.applications SET status=status WHERE id=app.id;
  IF (SELECT count(*) FROM public.student_notifications) <> before_count THEN RAISE EXCEPTION 'Duplicate no-op notification'; END IF;
  UPDATE public.applications SET status='rejected',reviewed_at=now() WHERE id=app.id;
  IF NOT EXISTS(SELECT 1 FROM public.student_notifications WHERE event_key LIKE 'applications:'||app.id||':rejected:%') THEN RAISE EXCEPTION 'Application trigger failed'; END IF;
  SELECT * INTO STRICT submission FROM public.task_submissions WHERE status='approved' LIMIT 1;
  UPDATE public.task_submissions SET status='revision_requested',admin_feedback='Inbox regression: revise the documentation',reviewed_at=now() WHERE id=submission.id;
  IF NOT EXISTS(SELECT 1 FROM public.student_notifications WHERE event_key LIKE 'task_submissions:'||submission.id||':revision_requested:%' AND body='Inbox regression: revise the documentation') THEN RAISE EXCEPTION 'Review trigger failed'; END IF;
  INSERT INTO public.deadline_notifications(student_id,enrollment_id,task_id,kind,message)
    VALUES(submission.student_id,submission.enrollment_id,submission.task_id,'deadline_warning','Inbox deadline regression')
    ON CONFLICT(student_id,task_id,kind) DO NOTHING;
  IF NOT EXISTS(SELECT 1 FROM public.student_notifications WHERE kind='deadline' AND href='/dashboard/internship/tasks/'||submission.task_id) THEN RAISE EXCEPTION 'Deadline trigger failed'; END IF;
  PERFORM set_config('test.inbox_owner',(SELECT user_id::text FROM public.profiles WHERE id=app.student_id),true);
  -- Controlled second-owner row proves cross-account reads/updates are denied.
  INSERT INTO public.student_notifications(user_id,kind,event_key,subject,status,href)
    SELECT id,'application','test:other-user','Private notification','accepted','/dashboard/applications'
    FROM auth.users WHERE id<>(SELECT user_id FROM public.profiles WHERE id=app.student_id) LIMIT 1;
END $$;
SELECT set_config('request.jwt.claim.sub',current_setting('test.inbox_owner'),true) IS NOT NULL AS configured_test_identity;
SET LOCAL ROLE authenticated;
DO $$
DECLARE affected bigint;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.student_notifications) THEN RAISE EXCEPTION 'Owner cannot read inbox'; END IF;
  IF EXISTS(SELECT 1 FROM public.student_notifications WHERE user_id<>auth.uid()) THEN RAISE EXCEPTION 'Cross-user read allowed'; END IF;
  UPDATE public.student_notifications SET read_at=now() WHERE event_key='test:other-user';
  GET DIAGNOSTICS affected=ROW_COUNT;
  IF affected<>0 THEN RAISE EXCEPTION 'Cross-user update allowed'; END IF;
  UPDATE public.student_notifications SET read_at=now() WHERE user_id=auth.uid();
  GET DIAGNOSTICS affected=ROW_COUNT;
  IF affected=0 THEN RAISE EXCEPTION 'Owner cannot mark read'; END IF;
  BEGIN
    UPDATE public.student_notifications SET subject='forged' WHERE user_id=auth.uid();
    RAISE EXCEPTION 'Notification content is writable';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    INSERT INTO public.student_notifications(user_id,kind,event_key,subject,status,href)
      VALUES(auth.uid(),'application','test:forged','Forged','accepted','/dashboard/applications');
    RAISE EXCEPTION 'Client can fabricate notifications';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
  BEGIN
    PERFORM id FROM public.student_notifications LIMIT 1;
    RAISE EXCEPTION 'Anonymous inbox access allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'Notification trigger, ownership, read-state, and write protection checks passed; all test changes rolled back' AS result;
