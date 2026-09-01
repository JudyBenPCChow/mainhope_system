-- 接續 20260902040000：刪校舍假期列與重編堂次寫在同一條 writable CTE 時，
-- ranked 讀到的仍是刪除前快照，編號缺口沒有收合。本檔只做重編。
-- 套用：npm run db:apply -- supabase/migrations/20260902043000_renumber_sessions_after_holiday_delete.sql

begin;

with affected as (
  select class_id
  from public.schedules
  group by class_id
  having max(session_number) is distinct from count(*)
      or min(session_number) is distinct from 1
      or count(distinct session_number) is distinct from count(*)
),
ranked as (
  select
    s.id,
    row_number() over (
      partition by s.class_id
      order by s.scheduled_date, s.start_time, s.consecutive_slot_index nulls first, s.id
    ) as new_sn
  from public.schedules s
  where s.class_id in (select class_id from affected)
)
update public.schedules s
set session_number = ranked.new_sn
from ranked
where s.id = ranked.id
  and s.session_number is distinct from ranked.new_sn;

commit;
