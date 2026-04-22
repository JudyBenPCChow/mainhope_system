-- 新增學生電話欄位，與家長電話分離
alter table public.students
add column if not exists student_phone text;

comment on column public.students.student_phone is '學生本人電話';
