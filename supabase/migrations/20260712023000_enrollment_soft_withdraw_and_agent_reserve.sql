-- 報讀改為軟退讀（status=已退讀），僅「就讀中」維持 student+class 唯一
-- 預留代理人欄位：students.assigned_agent_user_id（Phase 2 代理人角色）

drop index if exists public.student_class_enrollments_student_class_unique_idx;

create unique index if not exists student_class_enrollments_student_class_active_unique_idx
  on public.student_class_enrollments (student_id, class_id)
  where status = '就讀中';

comment on index public.student_class_enrollments_student_class_active_unique_idx is
  '同一學生同一班別僅能有一筆就讀中報讀；已退讀可保留歷史列';

alter table public.students
  add column if not exists assigned_agent_user_id uuid
    references public.app_users (id) on delete set null;

comment on column public.students.assigned_agent_user_id is
  '所屬代理人（外包中介，Phase 2）；一生一中介，由 admin／alien 指派';

create index if not exists students_assigned_agent_user_id_idx
  on public.students (assigned_agent_user_id)
  where assigned_agent_user_id is not null;
