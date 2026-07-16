-- 待補堂：遲報／繳費堂數多於已綁排程時，記錄尚欠堂數（非請假）

create table if not exists public.student_pending_lessons (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  enrollment_id uuid references public.student_class_enrollments (id) on delete set null,
  owed_count integer not null default 1
    check (owed_count > 0 and owed_count <= 99),
  reason text not null default '遲報缺堂',
  status text not null default '待補'
    check (status in ('待補', '已安排', '已完成', '取消')),
  remarks text,
  resolved_schedule_id uuid references public.schedules (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists student_pending_lessons_student_id_idx
  on public.student_pending_lessons (student_id);

create index if not exists student_pending_lessons_class_id_idx
  on public.student_pending_lessons (class_id);

create index if not exists student_pending_lessons_enrollment_id_idx
  on public.student_pending_lessons (enrollment_id);

create index if not exists student_pending_lessons_pending_idx
  on public.student_pending_lessons (student_id, class_id)
  where status = '待補';

comment on table public.student_pending_lessons is
  '待補堂：已繳／應享堂數多於已綁排程時的差額（如遲報），非請假補課';

comment on column public.student_pending_lessons.owed_count is
  '尚欠堂數；一筆可記多於 1 堂';

comment on column public.student_pending_lessons.reason is
  '原因：遲報缺堂／堂數差額／其他';

alter table public.student_pending_lessons enable row level security;

drop policy if exists rls_mgmt_all_student_pending_lessons on public.student_pending_lessons;
create policy rls_mgmt_all_student_pending_lessons
on public.student_pending_lessons
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

drop policy if exists rls_teacher_select_student_pending_lessons on public.student_pending_lessons;
create policy rls_teacher_select_student_pending_lessons
on public.student_pending_lessons
for select
to authenticated
using (
  public.is_teacher_role()
  and public.teacher_can_access_class(class_id)
);

grant select, insert, update, delete on public.student_pending_lessons to authenticated;
