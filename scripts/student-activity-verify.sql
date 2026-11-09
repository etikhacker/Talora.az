-- No public access to Auth fields, last-seen table, or admin activity RPC.
DO $test$
BEGIN
  IF pg_catalog.has_function_privilege('anon','public.touch_student_presence()','EXECUTE') THEN
    RAISE EXCEPTION 'Anon can touch presence';
  END IF;
  IF pg_catalog.has_function_privilege('anon','public.get_admin_student_activity(uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'Anon can query activity';
  END IF;
  IF pg_catalog.has_table_privilege('authenticated','private.student_presence','SELECT') THEN
    RAISE EXCEPTION 'Student can directly query presence';
  END IF;
  IF pg_catalog.has_table_privilege('authenticated','auth.users','SELECT') THEN
    RAISE EXCEPTION 'Authenticated user has Auth table SELECT';
  END IF;
END;
$test$;

-- Student can touch their own row, not query the admin RPC.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000a1',true);
SELECT public.touch_student_presence();
DO $test$
DECLARE blocked boolean := false;
BEGIN
  BEGIN
    PERFORM public.get_admin_student_activity('00000000-0000-4000-8000-0000000000b2');
  EXCEPTION WHEN insufficient_privilege THEN
    blocked := true;
  END;
  IF NOT blocked THEN RAISE EXCEPTION 'Student read another student activity'; END IF;
END;
$test$;
COMMIT;

-- Student B cannot change Student A's last-seen row using the zero-arg RPC.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000a2',true);
SELECT public.touch_student_presence();
COMMIT;

DO $test$
DECLARE rowcount integer;
BEGIN
  SELECT count(*) INTO rowcount FROM private.student_presence;
  IF rowcount <> 2 THEN RAISE EXCEPTION 'Expected two independent student presence rows'; END IF;
END;
$test$;

-- Authorized admin sees only structured events for the requested profile.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT pg_catalog.set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000a3',true);
DO $test$
DECLARE payload jsonb;
BEGIN
  payload:=public.get_admin_student_activity('00000000-0000-4000-8000-0000000000b1');
  IF payload->>'last_sign_in_at' IS NULL OR payload->>'last_seen_at' IS NULL
    OR pg_catalog.jsonb_array_length(payload->'events') <> 3 THEN
    RAISE EXCEPTION 'Invalid admin student activity summary %',payload;
  END IF;
  IF (payload->'events'->0->>'kind') <> 'task_submitted' THEN
    RAISE EXCEPTION 'Expected most recent task submission';
  END IF;
  IF payload::text LIKE '%text_answer%' OR payload::text LIKE '%user_id%' THEN
    RAISE EXCEPTION 'Sensitive fields leaked';
  END IF;
  payload:=public.get_admin_student_activity('00000000-0000-4000-8000-0000000000b2');
  IF pg_catalog.jsonb_array_length(payload->'events') <> 0 THEN
    RAISE EXCEPTION 'Student activity crossed profile boundary';
  END IF;
END;
$test$;
ROLLBACK;

SELECT 'PASS: last sign-in, minimal presence and admin-only action summary' AS outcome;
