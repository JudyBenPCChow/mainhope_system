-- 僅列出「姓名重複」的學生明細（依姓名、建立時間）
SELECT s.full_name,
       s.id,
       btrim(s.student_code, E' \t\n\r') AS student_code_norm,
       s.grade,
       s.status,
       s.created_at::date AS created_date
FROM public.students s
WHERE s.full_name IN (
  SELECT full_name
  FROM public.students
  GROUP BY full_name
  HAVING COUNT(*) > 1
)
ORDER BY s.full_name, s.created_at, s.id;
