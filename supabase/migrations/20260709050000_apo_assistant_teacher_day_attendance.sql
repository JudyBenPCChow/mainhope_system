-- 明學IT狗：老師指定日期（預設今日香港）各堂點名狀態

begin;

create or replace function public.apo_assistant_teacher_day_attendance(
  p_teacher_id uuid,
  p_date date default null,
  p_user_role text default 'admin',
  p_scope_teacher_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_date date := coalesce(p_date, public.apo_assistant_hk_today());
  v_teacher jsonb;
  v_classes jsonb;
begin
  if p_teacher_id is null then
    return jsonb_build_object('ok', false, 'error', '缺少 teacher_id');
  end if;

  if p_user_role not in ('admin', 'teacher', 'alien') then
    return jsonb_build_object('ok', false, 'error', '無權限');
  end if;

  if p_user_role = 'teacher' and (p_scope_teacher_id is null or p_teacher_id <> p_scope_teacher_id) then
    return jsonb_build_object('ok', false, 'error', '專班老師只能查自己的點名狀態');
  end if;

  select jsonb_build_object(
    'id', te.id,
    'full_name', te.full_name,
    'english_name', te.english_name
  )
  into v_teacher
  from public.teachers te
  where te.id = p_teacher_id;

  if v_teacher is null then
    return jsonb_build_object('ok', false, 'error', '找不到老師');
  end if;

  select coalesce(jsonb_agg(to_jsonb(x) order by x.start_time nulls last), '[]'::jsonb)
  into v_classes
  from (
    select
      s.id as schedule_id,
      s.scheduled_date,
      s.start_time,
      s.end_time,
      s.status as schedule_status,
      c.id as class_id,
      c.subject,
      c.course_code_full,
      rm.name as classroom_name,
      (
        select count(*)::int
        from public.student_class_enrollments e
        where e.class_id = c.id
          and e.status = '就讀中'
      ) as enrolled_count,
      (
        select count(*)::int
        from public.attendance_details a
        where a.class_id = c.id
          and a.attendance_date = v_date
          and (a.schedule_id = s.id or a.schedule_id is null)
          and coalesce(a.status, '') <> ''
      ) as marked_count,
      (
        select count(*)::int
        from public.attendance_details a
        where a.class_id = c.id
          and a.attendance_date = v_date
          and (a.schedule_id = s.id or a.schedule_id is null)
          and coalesce(a.status, '') not like '%缺席%'
          and not (
            coalesce(a.status, '') like '%假%'
            and coalesce(a.status, '') not like '%補%'
          )
      ) as present_count,
      (
        select count(*)::int
        from public.attendance_details a
        where a.class_id = c.id
          and a.attendance_date = v_date
          and (a.schedule_id = s.id or a.schedule_id is null)
          and coalesce(a.status, '') like '%缺席%'
      ) as absent_count,
      (
        select count(*)::int
        from public.attendance_details a
        where a.class_id = c.id
          and a.attendance_date = v_date
          and (a.schedule_id = s.id or a.schedule_id is null)
          and coalesce(a.status, '') like '%假%'
          and coalesce(a.status, '') not like '%補%'
      ) as leave_count,
      greatest(
        (
          select count(*)::int
          from public.student_class_enrollments e
          where e.class_id = c.id
            and e.status = '就讀中'
        ) - (
          select count(*)::int
          from public.attendance_details a
          where a.class_id = c.id
            and a.attendance_date = v_date
            and (a.schedule_id = s.id or a.schedule_id is null)
            and coalesce(a.status, '') <> ''
        ),
        0
      ) as unmarked_count,
      (
        select count(*)::int
        from public.attendance_details a
        where a.class_id = c.id
          and a.attendance_date = v_date
          and (a.schedule_id = s.id or a.schedule_id is null)
          and coalesce(a.status, '') <> ''
      ) > 0 as attendance_taken
    from public.schedules s
    join public.classes c on c.id = s.class_id
    left join public.classrooms rm on rm.id = s.classroom_id
    where s.scheduled_date = v_date
      and (
        s.teacher_id = p_teacher_id
        or c.teacher_id = p_teacher_id
      )
    order by s.start_time nulls last
  ) x;

  return jsonb_build_object(
    'ok', true,
    'date', v_date,
    'teacher', v_teacher,
    'teacher_id', p_teacher_id,
    'classes', v_classes,
    'class_count', coalesce(jsonb_array_length(v_classes), 0)
  );
end;
$$;

do $$
begin
  execute 'revoke all on function public.apo_assistant_teacher_day_attendance(uuid,date,text,uuid) from public';
  execute 'revoke all on function public.apo_assistant_teacher_day_attendance(uuid,date,text,uuid) from anon';
  execute 'revoke all on function public.apo_assistant_teacher_day_attendance(uuid,date,text,uuid) from authenticated';
  execute 'grant execute on function public.apo_assistant_teacher_day_attendance(uuid,date,text,uuid) to service_role';
end $$;

commit;
