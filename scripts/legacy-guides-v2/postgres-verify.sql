DO $verify$
DECLARE expected_count integer; untouched_count integer;
BEGIN
 SELECT count(*) INTO expected_count
 FROM public.internship_tasks t
 JOIN public.internships i ON i.id=t.internship_id
 WHERE i.slug<>'unrelated-program'
 AND t.status='published' AND t.is_required
 AND length(t.instructions)>6000
 AND t.description LIKE '%Pulsuz alətlər:%'
 AND t.description LIKE '%Free tools:%'
 AND t.instructions LIKE '%100%'
 AND t.instructions LIKE '%Free tools%';
 IF expected_count<>80 THEN
  RAISE EXCEPTION 'Detailed instructions missing for %/80 tasks',80-expected_count;
 END IF;
 SELECT count(*) INTO untouched_count
 FROM public.internship_tasks t
 JOIN public.internships i ON i.id=t.internship_id
 WHERE i.slug='unrelated-program'
 AND t.instructions='Unchanged' AND t.description='Do not modify';
 IF untouched_count<>1 THEN RAISE EXCEPTION 'Unrelated task was changed'; END IF;
 IF (SELECT count(*) FROM public.task_submissions WHERE status='approved')<>1
 THEN RAISE EXCEPTION 'Existing submission record changed'; END IF;
 IF (SELECT count(*) FROM public.internship_tasks)<>81
 THEN RAISE EXCEPTION 'Unexpected task count'; END IF;
 RAISE NOTICE 'PASS 80/80 beginner guides; untouched submission, statuses and unrelated task';
END;
$verify$;
SELECT i.slug,count(t.id) AS tasks,MIN(length(t.instructions)) AS min_length,
 ROUND(AVG(length(t.instructions))) AS average_length
FROM public.internships i JOIN public.internship_tasks t ON t.internship_id=i.id
GROUP BY i.slug ORDER BY i.slug;
