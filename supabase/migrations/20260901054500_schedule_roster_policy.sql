-- 加堂名單政策（非常規排程 3.3）
-- 正式堂／安排補堂補回堂：class_all；其餘加堂：selected。
-- is_extra_lesson 只作分類標籤，不可用來開關剔人。
-- 套用：npm run db:apply -- supabase/migrations/20260901054500_schedule_roster_policy.sql

begin;

alter table public.schedules
  add column if not exists roster_policy text not null default 'class_all';

alter table public.schedules
  drop constraint if exists schedules_roster_policy_check;

alter table public.schedules
  add constraint schedules_roster_policy_check
  check (roster_policy in ('class_all', 'selected'));

alter table public.schedules
  add column if not exists roster_confirmed_at timestamptz;

alter table public.schedules
  add column if not exists roster_confirmed_by uuid references public.app_users (id) on delete set null;

comment on column public.schedules.roster_policy is
  '點名紙就讀生名單：class_all＝全體就讀生；selected＝已確認挑選。既有列預設 class_all。';

comment on column public.schedules.roster_confirmed_at is
  'selected 名單最近一次確認時間；null 表示尚未挑選（與「明確選了零人」區分）。';

comment on column public.schedules.roster_confirmed_by is
  '最近一次確認挑選的 app_users.id。';

-- 老師不可改名單政策（與狀態／加堂旗標同一白名單）
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
      or new.roster_policy is distinct from old.roster_policy
      or new.roster_confirmed_at is distinct from old.roster_confirmed_at
      or new.roster_confirmed_by is distinct from old.roster_confirmed_by
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
  'Teacher active role: block UPDATE of schedule management columns (status/cancel/teacher/time/room/roster/…).';

commit;
