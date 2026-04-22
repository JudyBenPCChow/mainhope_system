-- student_code 資料品質：空字串轉 null，並要求非空值唯一

update public.students
set student_code = null,
    updated_at = now()
where student_code is not null
  and btrim(student_code) = '';

create unique index if not exists students_student_code_unique_idx
on public.students (student_code)
where student_code is not null;

