select
  btrim(st.full_name) as student_name,
  st.student_code,
  ay.label as academic_year,
  coalesce(sub.name_zh, c.subject) as subject,
  t.full_name as teacher_name,
  sce.status,
  c.class_kind
from public.student_class_enrollments sce
join public.students st on st.id = sce.student_id
join public.classes c on c.id = sce.class_id
left join public.academic_years ay on ay.id = c.academic_year_id
left join public.teachers t on t.id = c.teacher_id
left join public.courses co on co.id = c.course_id
left join public.subjects sub on sub.id = co.subject_id
where ay.label in ('26SM', '2526')
  and sce.status in ('就讀中', '已退讀')
order by st.student_code nulls last, st.full_name, ay.label, subject;
