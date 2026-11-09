-- One published program remains visible to everyone.
BEGIN;
SET LOCAL ROLE anon;
DO $test$
DECLARE c integer;
BEGIN
 SELECT count(*) INTO c FROM public.internships;
 IF c<>1 THEN RAISE EXCEPTION 'Anonymous saw % internships instead of one published row',c; END IF;
END;
$test$;
ROLLBACK;

-- A student may only see published programs, not the ten draft seed programs.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
DO $test$
DECLARE c integer;
BEGIN
 SELECT count(*) INTO c FROM public.internships;
 IF c<>1 THEN RAISE EXCEPTION 'Student saw % internships instead of one published row',c; END IF;
END;
$test$;
ROLLBACK;

-- An admin can read the ten new drafts plus the original published row.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
DO $test$
DECLARE c integer;
BEGIN
 SELECT count(*) INTO c FROM public.internships;
 IF c<>11 THEN RAISE EXCEPTION 'Admin expected 11 internships; found %',c; END IF;
END;
$test$;
ROLLBACK;

SELECT 'PASS: anon=1 published, student=1 published, admin=11 incl ten drafts' AS verification;
