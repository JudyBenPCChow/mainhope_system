-- 驗證班別 subject / grade 對齊狀態

-- A) 有 course_id 但 subject 與模板不一致
select
  c.id,
  c.subject as class_subject,
  s.name_zh as template_subject,
  c.course_id
from public.classes c
join public.courses co on co.id = c.course_id
join public.subjects s on s.id = co.subject_id
where c.subject is distinct from s.name_zh
limit 100;

-- B) 有 course_id 但 grade 與模板不一致
select
  c.id,
  c.grade as class_grade,
  public.grade_code_to_label(co.grade_code) as template_grade,
  co.grade_code,
  c.course_id
from public.classes c
join public.courses co on co.id = c.course_id
where public.grade_code_to_label(co.grade_code) is not null
  and c.grade is distinct from array[public.grade_code_to_label(co.grade_code)]::text[]
limit 100;

-- C) 無 course_id 且 grade 仍含非標準標籤
select
  c.id,
  c.subject,
  c.grade,
  public.normalize_class_grade_array(c.grade) as normalized_grade
from public.classes c
where c.course_id is null
  and c.grade is not null
  and cardinality(c.grade) > 0
  and c.grade is distinct from public.normalize_class_grade_array(c.grade)
limit 100;

-- D) 無 course_id 且 subject 無法映射標準科目
select c.id, c.subject, c.grade
from public.classes c
where c.course_id is null
  and public.map_subject_code(c.subject) is null
limit 100;
