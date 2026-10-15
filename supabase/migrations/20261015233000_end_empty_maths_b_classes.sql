-- 2627：中四數學 B、中五數學 B 改為已結束。
-- 刪 2026-10-15 之後、沒有點名／到課宣告／調堂連結的正常排程。
-- 已上堂、調堂、點名與 2026-10-15 取消補回堂保留。班號不重排。

begin;

do $$
declare
  n int;
begin
  select count(*) into n
  from public.classes
  where course_code_full in ('2627-MATHS4001-B', '2627-MATHS5001-B');
  if n <> 2 then
    raise exception '應有兩班數學 B，實際 %', n;
  end if;

  if exists (
    select 1
    from public.student_class_enrollments e
    join public.classes c on c.id = e.class_id
    where c.course_code_full in ('2627-MATHS4001-B', '2627-MATHS5001-B')
      and e.status = '就讀中'
  ) then
    raise exception '數學 B 仍有就讀中報讀，中止';
  end if;
end $$;

update public.classes
set status = '已結束',
    updated_at = now()
where course_code_full in ('2627-MATHS4001-B', '2627-MATHS5001-B');

delete from public.schedules s
using public.classes c
where s.class_id = c.id
  and c.course_code_full in ('2627-MATHS4001-B', '2627-MATHS5001-B')
  and s.scheduled_date > date '2026-10-15'
  and coalesce(s.status, '') = '正常'
  and coalesce(s.remarks, '') not ilike '%makeup_of=%'
  and not exists (
    select 1 from public.attendance_details a where a.schedule_id = s.id
  )
  and not exists (
    select 1 from public.attendance_declarations d where d.schedule_id = s.id
  )
  and not exists (
    select 1
    from public.leave_makeup_records l
    where l.schedule_id = s.id or l.makeup_schedule_id = s.id
  )
  and not exists (
    select 1 from public.trial_sessions ts where ts.schedule_id = s.id
  )
  and not exists (
    select 1 from public.trial_invite_request_lines tl where tl.schedule_id = s.id
  );

do $$
declare
  n int;
  code text;
begin
  foreach code in array array['2627-MATHS4001-B', '2627-MATHS5001-B']
  loop
    select count(*) into n
    from public.schedules s
    join public.classes c on c.id = s.class_id
    where c.course_code_full = code
      and s.scheduled_date > date '2026-10-15'
      and coalesce(s.status, '') = '正常';
    if n <> 0 then
      raise exception '% 仍有日後正常排程 %', code, n;
    end if;
  end loop;

  select count(*) into n
  from public.schedules s
  join public.classes c on c.id = s.class_id
  where c.course_code_full = '2627-MATHS4001-B';
  if n <> 9 then
    raise exception '2627-MATHS4001-B 應保留 9 堂，實際 %', n;
  end if;

  select count(*) into n
  from public.schedules s
  join public.classes c on c.id = s.class_id
  where c.course_code_full = '2627-MATHS5001-B';
  if n <> 7 then
    raise exception '2627-MATHS5001-B 應保留 7 堂，實際 %', n;
  end if;

  if exists (
    select 1
    from public.classes
    where course_code_full in (
      '2627-MATHS4001-A', '2627-MATHS4001-D',
      '2627-MATHS5001-A', '2627-MATHS5001-D'
    )
      and section_code not in ('A', 'D')
  ) then
    raise exception '其餘數學班號被改動';
  end if;

  if exists (
    select 1
    from public.classes
    where course_code_full in ('2627-MATHS4001-B', '2627-MATHS5001-B')
      and (status <> '已結束' or section_code <> 'B')
  ) then
    raise exception '數學 B 狀態或班號不正確';
  end if;
end $$;

insert into public.mgmt_audit_log (actor_label, role, action, path, detail)
values (
  'agent',
  'agent',
  'class.end_empty_keep_history',
  '/Classes',
  '2627-MATHS4001-B、2627-MATHS5001-B 改為已結束。刪 2026-10-15 之後無點名無調堂的正常排程（各 34 堂）。保留已上堂、調堂、點名與 2026-10-15 取消補回堂。班號仍為 B。'
);

commit;
