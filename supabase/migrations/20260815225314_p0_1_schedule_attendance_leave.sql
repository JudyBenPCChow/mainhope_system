-- P0-1 domain 3：排程／出席／請假改用 capability predicate。
-- 未喺 staging allow-deny 通過前，唔好套 production（禁 npm run db:apply --linked）。
--
-- 產品覆寫（2026-08-15）：老師只可改 schedules.teaching_notes（＋ updated_at）；
-- 不可改 status、堂次編號、排程備註、代堂、時間。老師可以點名（INSERT／UPDATE 出席列）。
-- 財務：排程／出席只讀；請假不可讀不可寫。
-- classroom_booking_requests 今次唔收。

-- catalog：老師唔再有 schedule.update_status
delete from private.authz_role_capabilities
where role = 'teacher'
  and capability_key = 'schedule.update_status';

-- ---------------------------------------------------------------------------
-- 老師 UPDATE 白名單：只許 teaching_notes、updated_at
-- ---------------------------------------------------------------------------

create or replace function public.schedules_enforce_teacher_update_columns()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if public.is_teacher_role() then
    if new.class_id is distinct from old.class_id
      or new.teacher_id is distinct from old.teacher_id
      or new.classroom_id is distinct from old.classroom_id
      or new.scheduled_date is distinct from old.scheduled_date
      or new.start_time is distinct from old.start_time
      or new.end_time is distinct from old.end_time
      or new.status is distinct from old.status
      or new.remarks is distinct from old.remarks
      or new.session_number is distinct from old.session_number
      or new.consecutive_group_id is distinct from old.consecutive_group_id
      or new.consecutive_slot_index is distinct from old.consecutive_slot_index
      or new.cancel_reason is distinct from old.cancel_reason
      or new.is_extra_lesson is distinct from old.is_extra_lesson
      or new.original_teacher_id is distinct from old.original_teacher_id
      or new.id is distinct from old.id
      or new.created_at is distinct from old.created_at
    then
      raise exception 'TEACHER_SCHEDULE_UPDATE_DENIED'
        using errcode = '42501',
          hint = '老師僅可更新教學備註；不可改狀態、堂次編號、排程備註、代堂或時間';
    end if;
  end if;
  return new;
end;
$$;

comment on function public.schedules_enforce_teacher_update_columns() is
  'Teacher active role: only teaching_notes／updated_at may change.';

-- ---------------------------------------------------------------------------
-- schedules
-- ---------------------------------------------------------------------------

drop policy if exists rls_phase_b_mgmt_all_schedules on public.schedules;
drop policy if exists rls_cap_select_schedules on public.schedules;
drop policy if exists rls_cap_insert_schedules on public.schedules;
drop policy if exists rls_cap_update_schedules on public.schedules;
drop policy if exists rls_cap_delete_schedules on public.schedules;

create policy rls_cap_select_schedules
on public.schedules for select to authenticated
using (private.has_capability('schedule.read') and public.is_mgmt_staff());

create policy rls_cap_insert_schedules
on public.schedules for insert to authenticated
with check (private.has_capability('schedule.create'));

create policy rls_cap_update_schedules
on public.schedules for update to authenticated
using (
  private.has_capability('schedule.create')
  or private.has_capability('schedule.reschedule')
  or private.has_capability('schedule.cancel')
  or private.has_capability('schedule.substitute')
  or private.has_capability('schedule.update_status')
)
with check (
  private.has_capability('schedule.create')
  or private.has_capability('schedule.reschedule')
  or private.has_capability('schedule.cancel')
  or private.has_capability('schedule.substitute')
  or private.has_capability('schedule.update_status')
);

create policy rls_cap_delete_schedules
on public.schedules for delete to authenticated
using (
  private.has_capability('schedule.create')
  or private.has_capability('schedule.cancel')
);

-- teacher select／update 政策保留（update 再由 trigger 限欄）

-- ---------------------------------------------------------------------------
-- attendance_details
-- 老師點名＝scoped INSERT＋UPDATE；DELETE 只職員 attendance.delete
-- ---------------------------------------------------------------------------

drop policy if exists rls_phase_b_mgmt_all_attendance_details on public.attendance_details;
drop policy if exists rls_cap_select_attendance_details on public.attendance_details;
drop policy if exists rls_cap_insert_attendance_details on public.attendance_details;
drop policy if exists rls_cap_update_attendance_details on public.attendance_details;
drop policy if exists rls_cap_delete_attendance_details on public.attendance_details;

create policy rls_cap_select_attendance_details
on public.attendance_details for select to authenticated
using (private.has_capability('attendance.read') and public.is_mgmt_staff());

create policy rls_cap_insert_attendance_details
on public.attendance_details for insert to authenticated
with check (
  private.has_capability('attendance.take')
  and public.is_mgmt_staff()
);

create policy rls_cap_update_attendance_details
on public.attendance_details for update to authenticated
using (
  public.is_mgmt_staff()
  and (
    private.has_capability('attendance.take')
    or private.has_capability('attendance.correct')
  )
)
with check (
  public.is_mgmt_staff()
  and (
    private.has_capability('attendance.take')
    or private.has_capability('attendance.correct')
  )
);

create policy rls_cap_delete_attendance_details
on public.attendance_details for delete to authenticated
using (private.has_capability('attendance.delete') and public.is_mgmt_staff());

-- ---------------------------------------------------------------------------
-- leave_makeup_records（財務無 leaves.read）
-- ---------------------------------------------------------------------------

drop policy if exists rls_phase_b_mgmt_all_leave_makeup_records on public.leave_makeup_records;
drop policy if exists rls_cap_select_leave_makeup_records on public.leave_makeup_records;
drop policy if exists rls_cap_write_leave_makeup_records on public.leave_makeup_records;

create policy rls_cap_select_leave_makeup_records
on public.leave_makeup_records for select to authenticated
using (private.has_capability('leaves.read') and public.is_mgmt_staff());

create policy rls_cap_write_leave_makeup_records
on public.leave_makeup_records for all to authenticated
using (private.has_capability('leaves.manage'))
with check (private.has_capability('leaves.manage'));

update private.authz_meta
set authz_version = 4,
    updated_at = now()
where id = 1;
