-- 校舍假期不是取消堂：刪誤建列、重編堂次、寫入閘、排程管理統計 RPC。
-- 套用：npm run db:apply -- supabase/migrations/20260902040000_campus_holiday_not_cancelled.sql

begin;

-- 1) 刪「校舍假期」取消列（須同時落在該班學年校曆），並重編該班餘下堂次編號。
with doomed as (
  select s.id, s.class_id
  from public.schedules s
  join public.classes c on c.id = s.class_id
  join public.academic_calendar_closures cl
    on cl.academic_year_id = c.academic_year_id
   and cl.closure_date = s.scheduled_date
  where position('取消' in coalesce(s.status, '')) > 0
    and coalesce(s.cancel_reason, '') like '校舍假期%'
),
deleted as (
  delete from public.schedules s
  using doomed d
  where s.id = d.id
  returning s.class_id
), ranked as (
  select
    s.id,
    row_number() over (
      partition by s.class_id
      order by s.scheduled_date, s.start_time, s.consecutive_slot_index nulls first, s.id
    ) as new_sn
  from public.schedules s
  where s.class_id in (select distinct class_id from deleted)
)
update public.schedules s
set session_number = ranked.new_sn
from ranked
where s.id = ranked.id
  and s.session_number is distinct from ranked.new_sn;

-- 2) 校曆關閉日禁止再建排程。
create or replace function public.schedules_reject_academic_calendar_closures()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  if new.scheduled_date is null or new.class_id is null then
    return new;
  end if;

  select cl.name
    into v_name
  from public.academic_calendar_closures cl
  join public.classes c on c.id = new.class_id
  where cl.academic_year_id = c.academic_year_id
    and cl.closure_date = new.scheduled_date
  limit 1;

  if v_name is not null then
    raise exception '校舍假期（%）當日不建立排程', v_name;
  end if;

  return new;
end;
$$;

revoke all on function public.schedules_reject_academic_calendar_closures() from public, anon, authenticated;

drop trigger if exists trg_schedules_reject_academic_calendar_closures on public.schedules;
create trigger trg_schedules_reject_academic_calendar_closures
before insert or update of scheduled_date, class_id on public.schedules
for each row
execute function public.schedules_reject_academic_calendar_closures();

comment on function public.schedules_reject_academic_calendar_closures() is
  '校舍假期（academic_calendar_closures）當日禁止新增或改期排程；不是取消堂。';

-- 3) 排程管理頁統計：角色只算一次；待處理排除校舍假期取消列。
create or replace function public.get_schedule_manage_stats(
  p_as_of date,
  p_teacher_id uuid default null
)
returns table (
  today_lesson_count integer,
  pending_cancelled_count integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_is_staff boolean := public.is_mgmt_staff();
  v_is_teacher boolean := public.is_teacher_role();
  v_teacher_id uuid;
begin
  if p_as_of is null then
    raise exception 'AS_OF_REQUIRED';
  end if;
  if not (v_is_staff or v_is_teacher) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  if v_is_staff then
    v_teacher_id := p_teacher_id;
  else
    v_teacher_id := public.current_teacher_id();
    if v_teacher_id is null then
      return query select 0, 0;
      return;
    end if;
  end if;

  return query
  select
    count(*) filter (
      where s.scheduled_date = p_as_of
        and position('取消' in coalesce(s.status, '')) = 0
    )::integer as today_lesson_count,
    count(*) filter (
      where position('取消' in coalesce(s.status, '')) > 0
        and coalesce(s.cancel_reason, '') not like '校舍假期%'
    )::integer as pending_cancelled_count
  from public.schedules s
  where s.scheduled_date >= p_as_of
    and (
      case
        when v_is_staff and v_teacher_id is null then true
        when v_teacher_id is not null then
          s.teacher_id = v_teacher_id or s.original_teacher_id = v_teacher_id
        else false
      end
    );
end;
$$;

revoke all on function public.get_schedule_manage_stats(date, uuid) from public, anon;
grant execute on function public.get_schedule_manage_stats(date, uuid) to authenticated;

comment on function public.get_schedule_manage_stats(date, uuid) is
  '排程管理頁統計：當日未取消堂數、今日起真取消堂數（排除校舍假期）。職員可選老師範圍；老師僅自己。角色只算一次。';

notify pgrst, 'reload schema';

commit;
