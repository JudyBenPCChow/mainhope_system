-- 保守回填：若沒有家長姓名與關係，且學生電話為空，推定 parent_phone 可能是誤匯入的學生電話
update public.students
set student_phone = parent_phone,
    updated_at = now()
where coalesce(student_phone, '') = ''
  and coalesce(parent_phone, '') <> ''
  and coalesce(trim(parent_name), '') = ''
  and coalesce(trim(parent_relationship), '') = '';
