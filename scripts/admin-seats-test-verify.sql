-- Public seats: read-only aggregate, draft programs cannot be enumerated.
BEGIN;
SET LOCAL ROLE anon;
DO $check$
DECLARE
 c integer;
 rem integer;
 act integer;
 unbounded integer;
 denied boolean := false;
BEGIN
 SELECT count(*) INTO c FROM public.get_public_internship_seats();
 IF c<>3 THEN RAISE EXCEPTION 'Expected 3 public programs, got %',c; END IF;
 SELECT remaining_seats,active_enrollments INTO rem,act
 FROM public.get_public_internship_seats('00000000-0000-4000-8000-0000000000b1');
 IF rem<>1 OR act<>2 THEN RAISE EXCEPTION 'Wrong available seats %, active %',rem,act; END IF;
 SELECT remaining_seats INTO rem FROM public.get_public_internship_seats('00000000-0000-4000-8000-0000000000b2');
 IF rem<>0 THEN RAISE EXCEPTION 'Seats may not go negative'; END IF;
 SELECT remaining_seats INTO unbounded FROM public.get_public_internship_seats('00000000-0000-4000-8000-0000000000b3');
 IF unbounded IS NOT NULL THEN RAISE EXCEPTION 'Unlimited should be NULL'; END IF;
 SELECT count(*) INTO c FROM public.get_public_internship_seats('00000000-0000-4000-8000-0000000000b4');
 IF c<>0 THEN RAISE EXCEPTION 'Draft internship was exposed'; END IF;
 BEGIN
  PERFORM count(*) FROM public.enrollments;
 EXCEPTION WHEN insufficient_privilege THEN denied:=true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'Anonymous can query enrollment identities'; END IF;
 denied:=false;
 BEGIN
  PERFORM public.get_admin_sidebar_counts();
 EXCEPTION WHEN insufficient_privilege THEN denied:=true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'Anonymous admin count function access'; END IF;
END;
$check$;
ROLLBACK;

-- Students cannot read admin counts or mark any section as read.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000a1',true);
DO $check$
DECLARE denied boolean:=false;
BEGIN
 BEGIN
  PERFORM public.get_admin_sidebar_counts();
 EXCEPTION WHEN insufficient_privilege THEN denied:=true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'Student saw admin badge counts'; END IF;
 denied:=false;
 BEGIN
  PERFORM public.mark_admin_sidebar_seen('applications');
 EXCEPTION WHEN insufficient_privilege THEN denied:=true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'Student marked admin section read'; END IF;
END;
$check$;
ROLLBACK;

-- First visit shows new records; only the clicked section is cleared.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000a2',true);
DO $check$
DECLARE counts jsonb;
BEGIN
 counts := public.get_admin_sidebar_counts();
 IF (counts->>'applications')::integer <> 1 OR
 (counts->>'submissions')::integer <> 1 OR
 (counts->>'contact-messages')::integer <> 1 OR
 (counts->>'certificate-orders')::integer <> 1 OR
 (counts->>'students')::integer <> 1 OR
 (counts->>'internships')::integer <> 4 OR
 (counts->>'completed')::integer <> 1 THEN
   RAISE EXCEPTION 'Unexpected first unread counts: %',counts;
 END IF;
 PERFORM public.mark_admin_sidebar_seen('applications');
 counts := public.get_admin_sidebar_counts();
 IF (counts->>'applications')::integer <> 0 OR
 (counts->>'submissions')::integer <> 1 THEN
   RAISE EXCEPTION 'Section watermark was not isolated: %',counts;
 END IF;
 BEGIN
  PERFORM public.mark_admin_sidebar_seen('unknown');
  RAISE EXCEPTION 'Unknown section was accepted';
 EXCEPTION WHEN invalid_parameter_value THEN NULL;
 END;
END;
$check$;
ROLLBACK;
SELECT 'PASS: public seat aggregation and secure per-admin unread watermarks' AS verification;
