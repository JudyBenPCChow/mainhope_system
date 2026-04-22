-- 一次性修復：將誤置資料互換回正規欄位
-- student_phone 應存學生電話；parent_phone 應存家長電話
update public.students
set student_phone = parent_phone,
    parent_phone = student_phone,
    updated_at = now()
where coalesce(student_phone, '') <> ''
   or coalesce(parent_phone, '') <> '';
