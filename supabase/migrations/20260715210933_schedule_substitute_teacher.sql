-- 排程代堂：original_teacher_id 記錄原任老師；teacher_id 為實際上課（可點名）老師。

begin;

alter table public.schedules
  add column if not exists original_teacher_id uuid references public.teachers (id) on delete set null;

comment on column public.schedules.original_teacher_id is
  '代堂前原任老師；非空表示已指派代堂，此時 teacher_id 為實際上課（可點名）老師。';

create index if not exists schedules_original_teacher_id_idx
  on public.schedules (original_teacher_id)
  where original_teacher_id is not null;

-- 老師可讀：排程現任老師、原任老師、或班別常任老師
create or replace function public.teacher_can_access_schedule(p_schedule_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.schedules s
    left join public.classes c on c.id = s.class_id
    where s.id = p_schedule_id
      and (
        s.teacher_id = public.current_teacher_id()
        or s.original_teacher_id = public.current_teacher_id()
        or c.teacher_id = public.current_teacher_id()
      )
  );
$$;

comment on function public.teacher_can_access_schedule(uuid) is
  'RLS: schedule owned by current/original teacher, or class assigned to current teacher.';

-- 出席讀取：班別老師，或該堂現任／原任老師
create or replace function public.teacher_can_read_attendance(p_class_id uuid, p_schedule_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.teacher_can_access_class(p_class_id)
    or (
      p_schedule_id is not null
      and exists (
        select 1
        from public.schedules s
        where s.id = p_schedule_id
          and (
            s.teacher_id = public.current_teacher_id()
            or s.original_teacher_id = public.current_teacher_id()
          )
      )
    );
$$;

-- 出席寫入：有 schedule_id 時僅現任排程老師；無 schedule_id 時仍依班別老師
create or replace function public.teacher_can_write_attendance(p_class_id uuid, p_schedule_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_schedule_id is not null then exists (
      select 1
      from public.schedules s
      where s.id = p_schedule_id
        and s.teacher_id = public.current_teacher_id()
    )
    else public.teacher_can_access_class(p_class_id)
  end;
$$;

revoke all on function public.teacher_can_read_attendance(uuid, uuid) from public;
revoke all on function public.teacher_can_read_attendance(uuid, uuid) from anon;
grant execute on function public.teacher_can_read_attendance(uuid, uuid) to authenticated;

revoke all on function public.teacher_can_write_attendance(uuid, uuid) from public;
revoke all on function public.teacher_can_write_attendance(uuid, uuid) from anon;
grant execute on function public.teacher_can_write_attendance(uuid, uuid) to authenticated;

drop policy if exists rls_phase_b_teacher_all_attendance_details on public.attendance_details;
drop policy if exists rls_phase_b_teacher_select_attendance_details on public.attendance_details;
drop policy if exists rls_phase_b_teacher_insert_attendance_details on public.attendance_details;
drop policy if exists rls_phase_b_teacher_update_attendance_details on public.attendance_details;

create policy rls_phase_b_teacher_select_attendance_details
on public.attendance_details
for select
to authenticated
using (
  public.is_teacher_role()
  and public.teacher_can_read_attendance(class_id, schedule_id)
);

create policy rls_phase_b_teacher_insert_attendance_details
on public.attendance_details
for insert
to authenticated
with check (
  public.is_teacher_role()
  and public.teacher_can_write_attendance(class_id, schedule_id)
);

create policy rls_phase_b_teacher_update_attendance_details
on public.attendance_details
for update
to authenticated
using (
  public.is_teacher_role()
  and public.teacher_can_write_attendance(class_id, schedule_id)
)
with check (
  public.is_teacher_role()
  and public.teacher_can_write_attendance(class_id, schedule_id)
);

commit;
