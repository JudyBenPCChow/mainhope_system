-- Leo Chan 功輔時薪：自 2026-09-01 起由 $70 改為 $100／小時
-- 套用：npm run db:apply -- supabase/migrations/20261007044000_leo_chan_homework_rate_100.sql

begin;

update public.payroll_homework_rates h
   set hourly_rate = 100,
       notes = 'Leo Chan：功輔 $100／小時（自 2026-09-01）',
       updated_at = now()
 where h.teacher_id = (
        select t.id from public.teachers t
         where t.full_name = 'Leo Chan'
         limit 1
      )
   and h.effective_from = date '2026-09-01'
   and h.hourly_rate is distinct from 100;

-- 若尚未有 2026-09-01 列則插入
insert into public.payroll_homework_rates (teacher_id, hourly_rate, effective_from, notes)
select t.id, 100, date '2026-09-01', 'Leo Chan：功輔 $100／小時（自 2026-09-01）'
from public.teachers t
where t.full_name = 'Leo Chan'
  and not exists (
    select 1
    from public.payroll_homework_rates h
    where h.teacher_id = t.id
      and h.effective_from = date '2026-09-01'
  );

commit;
