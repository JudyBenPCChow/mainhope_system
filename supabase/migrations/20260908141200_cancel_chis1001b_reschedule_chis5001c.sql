-- 2627：取消中一中文 B（Katie Lee）；中五中文 C 由星期二改逢星期三 16:30–17:45。
-- 班號不重排（中一仍為 A／C／D／E）。排程刪列、不標取消（避免補堂跟進）。
-- 專科最後上課日 2027-06-28；星期三扣假後 40 堂，至 2027-06-23。
-- 套用：npm run db:apply -- supabase/migrations/20260908141200_cancel_chis1001b_reschedule_chis5001c.sql

begin;

do $$
declare
  b_id uuid;
  c_id uuid;
  n int;
begin
  select id into b_id from public.classes where course_code_full = '2627-CHIS1001-B';
  select id into c_id from public.classes where course_code_full = '2627-CHIS5001-C';

  if c_id is null then
    raise exception '找不到 2627-CHIS5001-C';
  end if;

  if b_id is not null then
    select count(*) into n from public.student_class_enrollments where class_id = b_id;
    if n > 0 then
      raise exception '2627-CHIS1001-B 仍有報讀，中止刪班';
    end if;
    select count(*) into n
    from public.attendance_details ad
    where ad.class_id = b_id;
    if n > 0 then
      raise exception '2627-CHIS1001-B 已有點名紀錄，中止刪班';
    end if;
  end if;

  select count(*) into n
  from public.attendance_details ad
  where ad.class_id = c_id;
  if n > 0 then
    raise exception '2627-CHIS5001-C 已有點名紀錄，中止改期';
  end if;
end $$;

-- 1) 取消 2627-CHIS1001-B（排程 CASCADE 刪列）
delete from public.classes
where course_code_full = '2627-CHIS1001-B';

-- 2) 中五 C：逢星期三 16:30–17:45，承接原 B 班矩尺座
update public.classes c
set
  day_of_week = '星期三',
  time_slot = '16:30–17:45',
  classroom_id = '8b5e30bf-c38b-42ba-8fa2-c71cc9f4087f',
  updated_at = now()
where c.course_code_full = '2627-CHIS5001-C';

delete from public.schedules s
using public.classes c
where s.class_id = c.id
  and c.course_code_full = '2627-CHIS5001-C';

insert into public.schedules (
  class_id,
  teacher_id,
  classroom_id,
  scheduled_date,
  start_time,
  end_time,
  status,
  session_number,
  roster_policy
)
select
  c.id,
  c.teacher_id,
  c.classroom_id,
  d::date,
  '16:30',
  '17:45',
  '正常',
  row_number() over (order by d)::int,
  'class_all'
from public.classes c
join public.academic_years ay on ay.id = c.academic_year_id and ay.label = '2627'
cross join lateral generate_series(date '2026-09-01', date '2027-06-28', interval '1 day') as d
where c.course_code_full = '2627-CHIS5001-C'
  and extract(dow from d)::int = 3
  and not exists (
    select 1
    from public.academic_calendar_closures acc
    where acc.academic_year_id = ay.id
      and acc.closure_date = d::date
  );

do $$
declare
  n int;
begin
  select count(*) into n
  from public.schedules s
  join public.classes c on c.id = s.class_id
  where c.course_code_full = '2627-CHIS5001-C';
  if n <> 40 then
    raise exception '2627-CHIS5001-C 應有 40 堂，實際 %', n;
  end if;

  if exists (select 1 from public.classes where course_code_full = '2627-CHIS1001-B') then
    raise exception '2627-CHIS1001-B 刪除失敗';
  end if;
end $$;

commit;
