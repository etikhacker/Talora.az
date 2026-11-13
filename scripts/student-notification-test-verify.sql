DO $acl$
BEGIN
 IF NOT has_column_privilege('authenticated','public.student_notifications','read_at','UPDATE') THEN
  RAISE EXCEPTION 'Student cannot mark notification read';
 END IF;
 IF has_column_privilege('authenticated','public.student_notifications','user_id','UPDATE')
 OR has_column_privilege('authenticated','public.student_notifications','body','UPDATE')
 OR has_table_privilege('anon','public.student_notifications','SELECT')
 OR has_table_privilege('anon','public.student_notifications','UPDATE') THEN
  RAISE EXCEPTION 'Inbox permission leakage';
 END IF;
END;
$acl$;

BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000a1',true);
DO $student$
DECLARE
  visible_count integer;
  changed integer;
BEGIN
 SELECT count(*) INTO visible_count FROM public.student_notifications;
 IF visible_count <> 1 THEN RAISE EXCEPTION 'Cross-student inbox leak'; END IF;
 UPDATE public.student_notifications SET read_at=now()
  WHERE id='00000000-0000-4000-8000-0000000000b1';
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>1 THEN RAISE EXCEPTION 'Own read status not updated'; END IF;
 UPDATE public.student_notifications SET read_at=now()
  WHERE id='00000000-0000-4000-8000-0000000000b2';
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>0 THEN RAISE EXCEPTION 'Modified another student inbox'; END IF;
END;
$student$;
COMMIT;

DO $check$
DECLARE own_seen boolean; other_unread boolean;
BEGIN
 SELECT read_at IS NOT NULL INTO own_seen FROM public.student_notifications
 WHERE id='00000000-0000-4000-8000-0000000000b1';
 SELECT read_at IS NULL INTO other_unread FROM public.student_notifications
 WHERE id='00000000-0000-4000-8000-0000000000b2';
 IF NOT own_seen OR NOT other_unread THEN
  RAISE EXCEPTION 'Read updates crossed identity boundary';
 END IF;
END;
$check$;
SELECT 'PASS: student can mark own notification read, cannot modify others or content' AS result;
