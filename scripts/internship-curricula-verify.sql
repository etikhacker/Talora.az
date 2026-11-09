-- Assertions must run after seed, in the same database.
DO $test$
DECLARE n_programs integer; n_tasks integer; bad_rows integer;
BEGIN
 SELECT count(*) INTO n_programs FROM public.internships;
 SELECT count(*) INTO n_tasks FROM public.internship_tasks;
 IF n_programs <> 10 OR n_tasks <> 100 THEN
  RAISE EXCEPTION 'Expected 10 programs/100 tasks, got %/%',n_programs,n_tasks;
 END IF;

 SELECT count(*) INTO bad_rows FROM public.internships
 WHERE status<>'draft' OR duration_weeks<>8 OR cardinality(requirements)<2
   OR description NOT LIKE '%[[AZ]]%' OR description NOT LIKE '%[[EN]]%';
 IF bad_rows<>0 THEN RAISE EXCEPTION 'Bad internship metadata: %',bad_rows; END IF;

 SELECT count(*) INTO bad_rows FROM (
  SELECT internship_id, COUNT(*) c, COUNT(DISTINCT task_number) unique_numbers,
   MIN(week_number) start_week,MAX(week_number) end_week
  FROM public.internship_tasks GROUP BY internship_id
  HAVING COUNT(*)<>10 OR COUNT(DISTINCT task_number)<>10
   OR MIN(week_number)<>1 OR MAX(week_number)<>8
 ) invalid;
 IF bad_rows<>0 THEN RAISE EXCEPTION 'Bad curriculum scheduling: %',bad_rows; END IF;

 SELECT count(*) INTO bad_rows FROM public.internship_tasks
 WHERE status<>'published' OR NOT is_required
 OR description NOT LIKE '%[[AZ]]%' OR description NOT LIKE '%[[EN]]%'
 OR instructions NOT LIKE '%[[AZ]]%' OR instructions NOT LIKE '%[[EN]]%'
 OR instructions NOT LIKE '%Qəbul meyarları%' OR instructions NOT LIKE '%Acceptance criteria%';
 IF bad_rows<>0 THEN RAISE EXCEPTION 'Bad bilingual task content: %',bad_rows; END IF;

 RAISE NOTICE 'PASS: 10 draft internships and 100 bilingual tasks with 8-week schedules';
END;
$test$;

SELECT i.category, i.title, i.status, COUNT(t.id) AS task_count
FROM public.internships i JOIN public.internship_tasks t ON t.internship_id=i.id
GROUP BY i.category,i.title,i.status ORDER BY i.category;
