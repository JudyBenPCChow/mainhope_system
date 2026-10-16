-- 2627：硬刪中一數學 A（2627-MATHS1001-A）。
-- 班號不重排（中一數學仍為 B／C）。排程隨班別 CASCADE 刪列，不標取消。
-- 中四數學 B、中五數學 B 另有點名與已完成調堂，不在本檔。

begin;

do $$
declare
  a_id uuid;
  n int;
begin
  select id into a_id
  from public.classes
  where course_code_full = '2627-MATHS1001-A';

  if a_id is null then
    raise exception '找不到 2627-MATHS1001-A';
  end if;

  select count(*) into n
  from public.student_class_enrollments
  where class_id = a_id;
  if n > 0 then
    raise exception '2627-MATHS1001-A 仍有報讀，中止刪班';
  end if;

  select count(*) into n
  from public.attendance_details
  where class_id = a_id;
  if n > 0 then
    raise exception '2627-MATHS1001-A 已有點名紀錄，中止刪班';
  end if;

  select count(*) into n
  from public.schedules s
  join public.attendance_declarations d on d.schedule_id = s.id
  where s.class_id = a_id;
  if n > 0 then
    raise exception '2627-MATHS1001-A 已有到課宣告，中止刪班';
  end if;

  select count(*) into n
  from public.schedules s
  join public.leave_makeup_records l
    on l.schedule_id = s.id or l.makeup_schedule_id = s.id
  where s.class_id = a_id;
  if n > 0 then
    raise exception '2627-MATHS1001-A 已有請假或調堂，中止刪班';
  end if;
end $$;

delete from public.classes
where course_code_full = '2627-MATHS1001-A';

do $$
begin
  if exists (select 1 from public.classes where course_code_full = '2627-MATHS1001-A') then
    raise exception '2627-MATHS1001-A 刪除失敗';
  end if;

  if exists (
    select 1
    from public.classes
    where course_code_full in ('2627-MATHS1001-B', '2627-MATHS1001-C')
      and section_code not in ('B', 'C')
  ) then
    raise exception '中一數學其餘班號被改動';
  end if;
end $$;

insert into public.mgmt_audit_log (actor_label, role, action, path, detail)
values (
  'agent',
  'agent',
  'admin_ops.hard_delete_empty_class',
  '/Classes',
  '硬刪空班 2627-MATHS1001-A（中一數學 A）。排程隨班別刪列，不標取消。班號不重排，B／C 維持。'
);

commit;
