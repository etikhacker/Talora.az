-- Integration checks executed on an isolated PostgreSQL 17 fixture.
-- Run AFTER fixture and Courses Foundation migration. Stop on first failed assertion.
DO $$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM public.categories;
 IF n < 20 THEN RAISE EXCEPTION 'Missing category seeds: %',n; END IF;
 SELECT count(*) INTO n FROM public.internships WHERE category_id IS NOT NULL;
 IF n <> 8 THEN RAISE EXCEPTION 'Expected 8 mapped legacy internships, found %',n; END IF;
END;
$$;

-- Normalization also applies to newly created internships.
INSERT INTO public.internships(category) VALUES ('Business Analysis'),('Prompt Engineering');
DO $$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM public.internships
 WHERE category IN ('Business Analysis','Prompt Engineering') AND category_id IS NOT NULL;
 IF n <> 2 THEN RAISE EXCEPTION 'New internship category normalization failed'; END IF;
END;
$$;

-- Public role must not access private lesson bodies even if table names are known.
BEGIN;
SET LOCAL ROLE anon;
DO $$
DECLARE blocked boolean := false;
BEGIN
 BEGIN
  PERFORM count(*) FROM public.course_lessons;
 EXCEPTION WHEN insufficient_privilege THEN
  blocked := true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'anon can read lesson bodies'; END IF;
END;
$$;
ROLLBACK;

-- Admin creates two courses and verifies DB rejects publication without content.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000a3',true);
INSERT INTO public.courses(id,slug,title) VALUES
 ('00000000-0000-4000-8000-0000000000c1','prompt-basics','Prompt Engineering Basics'),
 ('00000000-0000-4000-8000-0000000000c2','empty-course','Course with no lessons'),
 ('00000000-0000-4000-8000-0000000000c3','other-course','Other published course');

DO $$
DECLARE blocked boolean := false;
BEGIN
 BEGIN
  UPDATE public.courses SET status='published'
   WHERE id='00000000-0000-4000-8000-0000000000c2';
 EXCEPTION WHEN check_violation THEN blocked := true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'Empty course was published'; END IF;
END;
$$;

INSERT INTO public.course_modules(id,course_id,title,position,status) VALUES
 ('00000000-0000-4000-8000-0000000000d1','00000000-0000-4000-8000-0000000000c1','Introduction',1,'published'),
 ('00000000-0000-4000-8000-0000000000d3','00000000-0000-4000-8000-0000000000c3','Other content',1,'published');
INSERT INTO public.course_lessons(id,module_id,title,position,status,content_md) VALUES
 ('00000000-0000-4000-8000-0000000000e1','00000000-0000-4000-8000-0000000000d1','What is a prompt?',1,'published','Test lesson material'),
 ('00000000-0000-4000-8000-0000000000e2','00000000-0000-4000-8000-0000000000d1','Writing prompts',2,'published','Test lesson material'),
 ('00000000-0000-4000-8000-0000000000e4','00000000-0000-4000-8000-0000000000d1','Draft lesson',3,'draft',''),
 ('00000000-0000-4000-8000-0000000000e3','00000000-0000-4000-8000-0000000000d3','Other lesson',1,'published','Test lesson material');
UPDATE public.courses SET status='published' WHERE id IN
 ('00000000-0000-4000-8000-0000000000c1','00000000-0000-4000-8000-0000000000c3');
COMMIT;

-- Publishing an empty text lesson is not allowed.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000a3',true);
DO $
DECLARE rejected boolean := false;
BEGIN
 BEGIN
  UPDATE public.course_lessons SET status='published'
    WHERE id='00000000-0000-4000-8000-0000000000e4';
 EXCEPTION WHEN check_violation THEN rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'Empty published lesson was accepted'; END IF;
END;
$;
COMMIT;

-- A live course cannot lose its published curriculum.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000a3',true);
DO $
DECLARE blocked boolean;
BEGIN
 blocked := false;
 BEGIN
  UPDATE public.course_modules SET status='draft'
   WHERE id='00000000-0000-4000-8000-0000000000d1';
 EXCEPTION WHEN check_violation THEN blocked:=true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'Published course module was hidden'; END IF;
 blocked := false;
 BEGIN
  UPDATE public.course_lessons SET status='draft'
   WHERE id='00000000-0000-4000-8000-0000000000e1';
 EXCEPTION WHEN check_violation THEN blocked:=true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'Published course lesson was hidden'; END IF;
 blocked := false;
 BEGIN
  DELETE FROM public.course_lessons WHERE id='00000000-0000-4000-8000-0000000000e1';
 EXCEPTION WHEN check_violation THEN blocked:=true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'Published lesson was deleted'; END IF;
END;
$;
COMMIT;

-- Student A cannot read lesson bodies before enrollment.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000a1',true);
DO $$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM public.course_lessons;
 IF n <> 0 THEN RAISE EXCEPTION 'Unenrolled student can read % lessons',n; END IF;
END;
$$;
INSERT INTO public.course_enrollments(course_id,student_id) VALUES
 ('00000000-0000-4000-8000-0000000000c1','00000000-0000-4000-8000-0000000000b1');
DO $$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM public.course_lessons;
 IF n <> 2 THEN RAISE EXCEPTION 'Expected two published enrolled lessons, got %',n; END IF;
END;
$$;

INSERT INTO public.lesson_progress(enrollment_id,lesson_id)
SELECT id,'00000000-0000-4000-8000-0000000000e1'
 FROM public.course_enrollments WHERE course_id='00000000-0000-4000-8000-0000000000c1';

DO $$
DECLARE denied boolean := false;
BEGIN
 BEGIN
  INSERT INTO public.lesson_progress(enrollment_id,lesson_id)
  SELECT id,'00000000-0000-4000-8000-0000000000e3'
   FROM public.course_enrollments WHERE course_id='00000000-0000-4000-8000-0000000000c1';
 EXCEPTION WHEN insufficient_privilege OR check_violation THEN denied:=true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'Cross-course progress insert was permitted'; END IF;
END;
$$;
COMMIT;

-- Student B may not read or impersonate student A enrollment.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000a2',true);
DO $$
DECLARE n integer; denied boolean:=false;
BEGIN
 SELECT count(*) INTO n FROM public.course_enrollments;
 IF n <> 0 THEN RAISE EXCEPTION 'Student B could read student A enrollment'; END IF;
 BEGIN
  INSERT INTO public.course_enrollments(course_id,student_id) VALUES
   ('00000000-0000-4000-8000-0000000000c3','00000000-0000-4000-8000-0000000000b1');
 EXCEPTION WHEN insufficient_privilege THEN denied:=true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'Student B enrolled as student A'; END IF;
END;
$$;
COMMIT;

-- Enrolled student cannot record new progress after admin archives the course.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000a3',true);
UPDATE public.courses SET status='archived' WHERE id='00000000-0000-4000-8000-0000000000c1';
COMMIT;

BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-0000000000a1',true);
DO $$
DECLARE denied boolean:=false;
BEGIN
 BEGIN
  INSERT INTO public.lesson_progress(enrollment_id,lesson_id)
  SELECT id,'00000000-0000-4000-8000-0000000000e2'
  FROM public.course_enrollments WHERE course_id='00000000-0000-4000-8000-0000000000c1';
 EXCEPTION WHEN insufficient_privilege OR check_violation THEN denied:=true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'Student wrote progress to archived course'; END IF;
END;
$$;
ROLLBACK;

SELECT 'Courses SQL migration and RLS integration tests passed' AS result;
