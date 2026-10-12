-- 2627：中六企會財 A（2627-BAFSS6001-A）由星期五 19:00–20:15 改 17:45–19:00。
-- 矩尺座該格已有中五生物（2627-BIOS5001-A），班別與日後排程改山案座。
-- 只改 2026-09-11 起未取消、原 19:00 堂；保留 2026-09-04 取消列與 2026-09-08 補回堂。
-- 套用：npm run db:apply -- supabase/migrations/20260910174000_bafss6001a_friday_slot_1745.sql

begin;

do $$
declare
  cls_id uuid;
  room_shanan uuid := '9b8d95ae-e2b7-4062-8b10-f608d41a0298';
  n int;
  conflict_code text;
begin
  select id into cls_id from public.classes where course_code_full = '2627-BAFSS6001-A';
  if cls_id is null then
    raise exception '找不到 2627-BAFSS6001-A';
  end if;

  select count(*) into n
  from public.schedules
  where class_id = cls_id
    and scheduled_date >= date '2026-09-11'
    and status = '正常'
    and start_time::time = time '19:00';
  if n <> 39 then
    raise exception '預期 39 堂日後星期五 19:00，實際 %', n;
  end if;

  select c.course_code_full into conflict_code
  from public.schedules s
  join public.classes c on c.id = s.class_id
  where s.classroom_id = room_shanan
    and s.status is distinct from '取消'
    and s.start_time::time < time '19:00'
    and s.end_time::time > time '17:45'
    and s.scheduled_date in (
      select scheduled_date
      from public.schedules
      where class_id = cls_id
        and scheduled_date >= date '2026-09-11'
        and status = '正常'
        and start_time::time = time '19:00'
    )
  limit 1;
  if conflict_code is not null then
    raise exception '山案座 17:45–19:00 與 % 撞室', conflict_code;
  end if;
end $$;

update public.classes
set
  time_slot = '17:45–19:00',
  classroom_id = '9b8d95ae-e2b7-4062-8b10-f608d41a0298',
  updated_at = now()
where course_code_full = '2627-BAFSS6001-A';

update public.schedules s
set
  start_time = time '17:45',
  end_time = time '19:00',
  classroom_id = '9b8d95ae-e2b7-4062-8b10-f608d41a0298',
  updated_at = now()
from public.classes c
where s.class_id = c.id
  and c.course_code_full = '2627-BAFSS6001-A'
  and s.scheduled_date >= date '2026-09-11'
  and s.status = '正常'
  and s.start_time::time = time '19:00';

do $$
declare
  n int;
  slot text;
  room text;
begin
  select c.time_slot, cl.name into slot, room
  from public.classes c
  left join public.classrooms cl on cl.id = c.classroom_id
  where c.course_code_full = '2627-BAFSS6001-A';
  if slot is distinct from '17:45–19:00' or room is distinct from '山案座' then
    raise exception '班別未改妥：time_slot=% classroom=%', slot, room;
  end if;

  select count(*) into n
  from public.schedules s
  join public.classes c on c.id = s.class_id
  where c.course_code_full = '2627-BAFSS6001-A'
    and s.scheduled_date >= date '2026-09-11'
    and s.status = '正常'
    and s.start_time::time = time '17:45'
    and s.end_time::time = time '19:00';
  if n <> 39 then
    raise exception '日後堂應有 39 筆 17:45–19:00，實際 %', n;
  end if;

  select count(*) into n
  from public.schedules s
  join public.classes c on c.id = s.class_id
  where c.course_code_full = '2627-BAFSS6001-A'
    and s.scheduled_date = date '2026-09-04'
    and s.status = '取消'
    and s.start_time::time = time '19:00';
  if n <> 1 then
    raise exception '2026-09-04 取消堂不應改動';
  end if;

  select count(*) into n
  from public.schedules s
  join public.classes c on c.id = s.class_id
  where c.course_code_full = '2627-BAFSS6001-A'
    and s.scheduled_date = date '2026-09-08'
    and s.start_time::time = time '17:45'
    and s.remarks like 'makeup_of=%';
  if n <> 1 then
    raise exception '2026-09-08 補回堂不應改動';
  end if;
end $$;

commit;
