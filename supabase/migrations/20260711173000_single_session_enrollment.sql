-- 單堂／非連續報讀：enrollment_period 加「單堂」+ 選堂明細表

-- 1. 報讀形式：保留既有期數，新增「單堂」
alter table public.student_class_enrollments
  drop constraint if exists student_class_enrollments_period_check;

alter table public.student_class_enrollments
  add constraint student_class_enrollments_period_check
  check (
    enrollment_period is null
    or enrollment_period in ('第一期', '第二期', '兩期全報', '單堂')
  );

comment on column public.student_class_enrollments.enrollment_period is
  '報讀形式：第一期／第二期／兩期全報（暑期）；單堂（自選堂數）；正規全期為 NULL';

-- 2. 單堂報讀所選排程
create table if not exists public.student_enrollment_sessions (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.student_class_enrollments (id) on delete cascade,
  schedule_id uuid not null references public.schedules (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint student_enrollment_sessions_unique unique (enrollment_id, schedule_id)
);

create index if not exists student_enrollment_sessions_enrollment_id_idx
  on public.student_enrollment_sessions (enrollment_id);

create index if not exists student_enrollment_sessions_schedule_id_idx
  on public.student_enrollment_sessions (schedule_id);

comment on table public.student_enrollment_sessions is
  '單堂報讀明細：enrollment_period=單堂 時綁定實際 schedules；顯示堂數用 schedules.session_number';

alter table public.student_enrollment_sessions enable row level security;

drop policy if exists rls_mgmt_all_student_enrollment_sessions on public.student_enrollment_sessions;
create policy rls_mgmt_all_student_enrollment_sessions
on public.student_enrollment_sessions
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

drop policy if exists rls_teacher_select_student_enrollment_sessions on public.student_enrollment_sessions;
create policy rls_teacher_select_student_enrollment_sessions
on public.student_enrollment_sessions
for select
to authenticated
using (
  public.is_teacher_role()
  and exists (
    select 1
    from public.student_class_enrollments e
    where e.id = enrollment_id
      and public.teacher_can_access_class(e.class_id)
  )
);

-- 3. 增退紀錄允許 session_change
alter table public.enrollment_change_events
  drop constraint if exists enrollment_change_events_action_check;

alter table public.enrollment_change_events
  add constraint enrollment_change_events_action_check
  check (action in ('enroll', 'withdraw', 'period_change', 'session_change'));
