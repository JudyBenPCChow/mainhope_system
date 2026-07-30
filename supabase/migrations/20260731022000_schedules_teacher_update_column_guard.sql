-- P0-1: 老師不可任意改課堂狀態／排程管理欄；僅允許教學備註、排程備註、堂次編號。
-- Postgres RLS 無法單靠 policy 限欄，故用 BEFORE UPDATE trigger 對齊白名單。

create or replace function public.schedules_enforce_teacher_update_columns()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if public.is_teacher_role() then
    if new.status is distinct from old.status
      or new.cancel_reason is distinct from old.cancel_reason
      or new.is_extra_lesson is distinct from old.is_extra_lesson
      or new.teacher_id is distinct from old.teacher_id
      or new.original_teacher_id is distinct from old.original_teacher_id
      or new.classroom_id is distinct from old.classroom_id
      or new.scheduled_date is distinct from old.scheduled_date
      or new.start_time is distinct from old.start_time
      or new.end_time is distinct from old.end_time
      or new.class_id is distinct from old.class_id
      or new.consecutive_group_id is distinct from old.consecutive_group_id
      or new.consecutive_slot_index is distinct from old.consecutive_slot_index
      or new.id is distinct from old.id
      or new.created_at is distinct from old.created_at
    then
      raise exception 'TEACHER_SCHEDULE_UPDATE_DENIED'
        using errcode = '42501',
          hint = '老師僅可更新教學備註／排程備註／堂次編號；不可取消或變更課堂狀態';
    end if;
  end if;
  return new;
end;
$$;

comment on function public.schedules_enforce_teacher_update_columns() is
  'Teacher active role: block UPDATE of schedule management columns (status/cancel/teacher/time/room/…).';

drop trigger if exists trg_schedules_enforce_teacher_update_columns on public.schedules;
create trigger trg_schedules_enforce_teacher_update_columns
  before update on public.schedules
  for each row
  execute function public.schedules_enforce_teacher_update_columns();
