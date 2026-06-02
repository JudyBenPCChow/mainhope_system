-- 學生資料：保留舊系統學生編號（純紀錄，不參與新編號規則）
alter table public.students
  add column if not exists old_student_id text;

comment on column public.students.old_student_id is
  '舊資料庫學生ID（歷史對照用）；新建立學生可為 null';

