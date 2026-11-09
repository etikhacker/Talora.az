DO $verify$
DECLARE n integer; bad integer;
BEGIN
 SELECT count(*) INTO n FROM public.internship_tasks;
 IF n<>100 THEN RAISE EXCEPTION 'Expected 100 tasks, found %',n; END IF;
 SELECT count(*) INTO bad FROM public.internship_tasks
 WHERE length(instructions)<4000
 OR instructions NOT LIKE '%## Hansı pulsuz alətlər lazımdır?%'
 OR instructions NOT LIKE '%## Addım-addım icra təlimatı%'
 OR instructions NOT LIKE '%## Qiymətləndirmə meyarları (100 bal)%'
 OR instructions NOT LIKE '%## Free tools and platforms%'
 OR instructions NOT LIKE '%## Step-by-step guide%'
 OR instructions NOT LIKE '%## Scoring rubric (100 points)%'
 OR instructions NOT LIKE '%[[AZ]]%'
 OR instructions NOT LIKE '%[[EN]]%'
 OR description NOT LIKE '%Pulsuz alətlər:%'
 OR description NOT LIKE '%Free tools:%';
 IF bad<>0 THEN RAISE EXCEPTION 'Tasks missing detailed guidance: %',bad; END IF;
 SELECT count(*) INTO bad FROM (
  SELECT internship_id,count(*) AS total,count(distinct task_number) AS unique_count,
   count(*) FILTER(WHERE status='published' AND is_required) AS required
  FROM public.internship_tasks GROUP BY internship_id
  HAVING count(*)<>10 OR count(distinct task_number)<>10
   OR count(*) FILTER(WHERE status='published' AND is_required)<>10
 ) q;
 IF bad<>0 THEN RAISE EXCEPTION 'Task structure regression'; END IF;
 RAISE NOTICE 'PASS: 100 bilingual tasks with detailed free-tool instructions and intact structure';
END;
$verify$;
SELECT i.category,count(t.id) task_count,min(length(t.instructions)) minimum_length,
  round(avg(length(t.instructions))) average_length
FROM public.internships i JOIN public.internship_tasks t ON t.internship_id=i.id
GROUP BY i.category ORDER BY i.category;