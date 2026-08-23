select
  btrim(st.full_name) as student_name,
  st.student_code,
  s.name_zh as subject,
  l.source_subject_label
from public.legacy_student_subject_enrollments l
join public.students st on st.id = l.student_id
join public.subjects s on s.id = l.subject_id
order by st.student_code nulls last, st.full_name, s.name_zh;
