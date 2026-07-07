-- 明學IT狗：唯讀資料庫查詢 RPC（僅供 Edge Function service_role 呼叫）
-- 依 user_role / teacher_id 範圍過濾；不回傳電話、地址等個資。

begin;

create or replace function public.apo_assistant_hk_today()
returns date
language sql
stable
set search_path = public
as $$
  select (timezone('Asia/Hong_Kong', now()))::date;
$$;

create or replace function public.apo_assistant_can_access_student(
  p_student_id uuid,
  p_user_role text,
  p_teacher_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_user_role in ('admin', 'alien') then true
    when p_user_role = 'teacher' and p_teacher_id is not null then exists (
      select 1
      from public.student_class_enrollments e
      join public.classes c on c.id = e.class_id
      where e.student_id = p_student_id
        and c.teacher_id = p_teacher_id
    )
    else false
  end;
$$;

create or replace function public.apo_assistant_can_access_class(
  p_class_id uuid,
  p_user_role text,
  p_teacher_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_user_role in ('admin', 'alien') then true
    when p_user_role = 'teacher' and p_teacher_id is not null then exists (
      select 1
      from public.classes c
      where c.id = p_class_id
        and c.teacher_id = p_teacher_id
    )
    else false
  end;
$$;

create or replace function public.apo_assistant_search_students(
  p_query text,
  p_user_role text,
  p_teacher_id uuid default null,
  p_limit int default 8
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_query text := trim(coalesce(p_query, ''));
  v_result jsonb;
  v_count int;
begin
  if length(v_query) < 1 then
    return jsonb_build_object('ok', false, 'error', '請提供搜尋關鍵字');
  end if;

  if p_user_role not in ('admin', 'teacher', 'alien') then
    return jsonb_build_object('ok', false, 'error', '無權限查詢學生');
  end if;

  if p_user_role = 'teacher' and p_teacher_id is null then
    return jsonb_build_object('ok', false, 'error', '老師身分未設定，無法查詢學生');
  end if;

  select coalesce(jsonb_agg(to_jsonb(t) - 'rank'), '[]'::jsonb)
  into v_result
  from (
    select
      s.id,
      s.student_code,
      s.full_name,
      s.english_name,
      s.grade,
      s.school,
      s.registration_status,
      s.enrollment_status,
      s.activity_status,
      s.academic_stage,
      case
        when s.full_name ilike v_query then 1
        when s.full_name ilike '%' || v_query || '%' then 2
        when coalesce(s.english_name, '') ilike '%' || v_query || '%' then 3
        when coalesce(s.student_code, '') ilike '%' || v_query || '%' then 4
        else 5
      end as rank
    from public.students s
    where (
      s.full_name ilike '%' || v_query || '%'
      or coalesce(s.english_name, '') ilike '%' || v_query || '%'
      or coalesce(s.student_code, '') ilike '%' || v_query || '%'
    )
    and (
      p_user_role in ('admin', 'alien')
      or exists (
        select 1
        from public.student_class_enrollments e
        join public.classes c on c.id = e.class_id
        where e.student_id = s.id
          and c.teacher_id = p_teacher_id
      )
    )
    order by rank, s.full_name
    limit least(greatest(coalesce(p_limit, 8), 1), 15)
  ) t;

  v_count := coalesce(jsonb_array_length(v_result), 0);
  return jsonb_build_object('ok', true, 'students', v_result, 'count', v_count);
end;
$$;

create or replace function public.apo_assistant_student_today_lessons(
  p_student_id uuid,
  p_date date default null,
  p_user_role text default 'admin',
  p_teacher_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_date date := coalesce(p_date, public.apo_assistant_hk_today());
  v_lessons jsonb;
begin
  if not public.apo_assistant_can_access_student(p_student_id, p_user_role, p_teacher_id) then
    return jsonb_build_object('ok', false, 'error', '無權限查詢此學生');
  end if;

  select coalesce(jsonb_agg(to_jsonb(x) order by x.start_time nulls last, x.subject), '[]'::jsonb)
  into v_lessons
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
      coalesce(cr.course_name, '') as course_name,
      t.full_name as teacher_name,
      rm.name as classroom_name,
      coalesce(l.leave_reason, '') as leave_reason,
      coalesce(l.status, '') as leave_status,
      coalesce(a.status, '') as attendance_status,
      case
        when coalesce(s.status, '') like '%取消%' then 'cancelled'
        when l.id is not null then 'on_leave'
        when coalesce(a.status, '') like '%假%' and coalesce(a.status, '') not like '%補%' then 'excused'
        when coalesce(a.status, '') like '%缺席%' then 'absent'
        when coalesce(a.status, '') <> '' then 'marked'
        else 'expected'
      end as lesson_state
    from public.student_class_enrollments e
    join public.classes c on c.id = e.class_id
    left join public.courses cr on cr.id = c.course_id
    left join public.teachers t on t.id = c.teacher_id
    join public.schedules s on s.class_id = c.id and s.scheduled_date = v_date
    left join public.classrooms rm on rm.id = s.classroom_id
    left join public.leave_makeup_records l
      on l.student_id = p_student_id
     and l.class_id = c.id
     and l.leave_date = v_date
    left join public.attendance_details a
      on a.student_id = p_student_id
     and a.class_id = c.id
     and a.attendance_date = v_date
    where e.student_id = p_student_id
      and e.status = '就讀中'
      and (
        p_user_role in ('admin', 'alien')
        or c.teacher_id = p_teacher_id
      )
  ) x;

  return jsonb_build_object(
    'ok', true,
    'date', v_date,
    'student_id', p_student_id,
    'lessons', v_lessons,
    'lesson_count', coalesce(jsonb_array_length(v_lessons), 0)
  );
end;
$$;

create or replace function public.apo_assistant_student_profile(
  p_student_id uuid,
  p_user_role text default 'admin',
  p_teacher_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_student jsonb;
  v_enrollments jsonb;
begin
  if not public.apo_assistant_can_access_student(p_student_id, p_user_role, p_teacher_id) then
    return jsonb_build_object('ok', false, 'error', '無權限查詢此學生');
  end if;

  select to_jsonb(s) - 'parent_phone' - 'whatsapp' - 'address' - 'parent_name'
  into v_student
  from (
    select
      id,
      student_code,
      full_name,
      english_name,
      gender,
      grade,
      school,
      registration_status,
      enrollment_status,
      activity_status,
      academic_stage,
      status,
      remarks
    from public.students
    where id = p_student_id
  ) s;

  if v_student is null then
    return jsonb_build_object('ok', false, 'error', '找不到學生');
  end if;

  select coalesce(jsonb_agg(to_jsonb(e)), '[]'::jsonb)
  into v_enrollments
  from (
    select
      en.id as enrollment_id,
      en.status as enrollment_status,
      en.enroll_date,
      en.enrollment_period,
      c.id as class_id,
      c.subject,
      c.course_code_full,
      c.day_of_week,
      c.time_slot,
      t.full_name as teacher_name
    from public.student_class_enrollments en
    join public.classes c on c.id = en.class_id
    left join public.teachers t on t.id = c.teacher_id
    where en.student_id = p_student_id
      and (
        p_user_role in ('admin', 'alien')
        or c.teacher_id = p_teacher_id
      )
    order by en.status, c.subject
  ) e;

  return jsonb_build_object(
    'ok', true,
    'student', v_student,
    'enrollments', v_enrollments
  );
end;
$$;

create or replace function public.apo_assistant_student_tuition(
  p_student_id uuid,
  p_user_role text default 'admin',
  p_teacher_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_paid numeric;
  v_attended bigint;
  v_needs_arrears boolean;
begin
  if p_user_role not in ('admin', 'alien') then
    return jsonb_build_object('ok', false, 'error', '繳費堂數僅管理員可查');
  end if;

  if not public.apo_assistant_can_access_student(p_student_id, p_user_role, p_teacher_id) then
    return jsonb_build_object('ok', false, 'error', '無權限查詢此學生');
  end if;

  select paid_lessons, attended_lessons
  into v_paid, v_attended
  from public.student_tuition_arrears(array[p_student_id]::uuid[])
  limit 1;

  v_paid := coalesce(v_paid, 0);
  v_attended := coalesce(v_attended, 0);
  v_needs_arrears := v_attended >= v_paid and (v_paid > 0 or v_attended > 0);

  return jsonb_build_object(
    'ok', true,
    'student_id', p_student_id,
    'paid_lessons', v_paid,
    'attended_lessons', v_attended,
    'needs_tuition_arrears', v_needs_arrears
  );
end;
$$;

create or replace function public.apo_assistant_student_attendance(
  p_student_id uuid,
  p_limit int default 10,
  p_user_role text default 'admin',
  p_teacher_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_records jsonb;
begin
  if not public.apo_assistant_can_access_student(p_student_id, p_user_role, p_teacher_id) then
    return jsonb_build_object('ok', false, 'error', '無權限查詢此學生');
  end if;

  select coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb)
  into v_records
  from (
    select
      a.attendance_date,
      a.status,
      a.remarks,
      c.subject,
      c.course_code_full,
      t.full_name as teacher_name
    from public.attendance_details a
    join public.classes c on c.id = a.class_id
    left join public.teachers t on t.id = c.teacher_id
    where a.student_id = p_student_id
      and (
        p_user_role in ('admin', 'alien')
        or c.teacher_id = p_teacher_id
      )
    order by a.attendance_date desc
    limit least(greatest(coalesce(p_limit, 10), 1), 30)
  ) r;

  return jsonb_build_object('ok', true, 'student_id', p_student_id, 'records', v_records);
end;
$$;

create or replace function public.apo_assistant_teacher_schedule(
  p_date date default null,
  p_user_role text default 'teacher',
  p_teacher_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_date date := coalesce(p_date, public.apo_assistant_hk_today());
  v_schedules jsonb;
begin
  if p_user_role <> 'teacher' or p_teacher_id is null then
    return jsonb_build_object('ok', false, 'error', '僅專班老師可查自己的排程');
  end if;

  select coalesce(jsonb_agg(to_jsonb(x) order by x.start_time nulls last), '[]'::jsonb)
  into v_schedules
  from (
    select
      s.id as schedule_id,
      s.scheduled_date,
      s.start_time,
      s.end_time,
      s.status,
      c.subject,
      c.course_code_full,
      rm.name as classroom_name,
      (
        select count(*)::int
        from public.student_class_enrollments e
        where e.class_id = c.id
          and e.status = '就讀中'
      ) as enrolled_count
    from public.schedules s
    join public.classes c on c.id = s.class_id
    left join public.classrooms rm on rm.id = s.classroom_id
    where s.teacher_id = p_teacher_id
      and s.scheduled_date = v_date
    order by s.start_time nulls last
  ) x;

  return jsonb_build_object(
    'ok', true,
    'date', v_date,
    'teacher_id', p_teacher_id,
    'schedules', v_schedules,
    'schedule_count', coalesce(jsonb_array_length(v_schedules), 0)
  );
end;
$$;

create or replace function public.apo_assistant_today_leaves(
  p_date date default null,
  p_user_role text default 'admin',
  p_teacher_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_date date := coalesce(p_date, public.apo_assistant_hk_today());
  v_leaves jsonb;
begin
  if p_user_role not in ('admin', 'teacher', 'alien') then
    return jsonb_build_object('ok', false, 'error', '無權限');
  end if;

  if p_user_role = 'teacher' and p_teacher_id is null then
    return jsonb_build_object('ok', false, 'error', '老師身分未設定');
  end if;

  select coalesce(jsonb_agg(to_jsonb(l) order by l.full_name), '[]'::jsonb)
  into v_leaves
  from (
    select
      st.full_name,
      st.grade,
      c.subject,
      c.course_code_full,
      lm.leave_reason,
      lm.status as leave_status,
      lm.makeup_type,
      lm.makeup_date
    from public.leave_makeup_records lm
    join public.students st on st.id = lm.student_id
    join public.classes c on c.id = lm.class_id
    where lm.leave_date = v_date
      and (
        p_user_role in ('admin', 'alien')
        or c.teacher_id = p_teacher_id
      )
    order by st.full_name
    limit 50
  ) l;

  return jsonb_build_object(
    'ok', true,
    'date', v_date,
    'leaves', v_leaves,
    'leave_count', coalesce(jsonb_array_length(v_leaves), 0)
  );
end;
$$;

create or replace function public.apo_assistant_class_roster(
  p_class_query text,
  p_date date default null,
  p_user_role text default 'admin',
  p_teacher_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_query text := trim(coalesce(p_class_query, ''));
  v_date date := coalesce(p_date, public.apo_assistant_hk_today());
  v_class_id uuid;
  v_class jsonb;
  v_roster jsonb;
begin
  if length(v_query) < 1 then
    return jsonb_build_object('ok', false, 'error', '請提供班別名稱或課程代碼');
  end if;

  select c.id,
         jsonb_build_object(
           'class_id', c.id,
           'subject', c.subject,
           'course_code_full', c.course_code_full,
           'day_of_week', c.day_of_week,
           'time_slot', c.time_slot,
           'teacher_name', t.full_name
         )
  into v_class_id, v_class
  from public.classes c
  left join public.teachers t on t.id = c.teacher_id
  where (
    c.subject ilike '%' || v_query || '%'
    or coalesce(c.course_code_full, '') ilike '%' || v_query || '%'
  )
  and (
    p_user_role in ('admin', 'alien')
    or c.teacher_id = p_teacher_id
  )
  order by
    case when c.course_code_full ilike v_query then 1 else 2 end,
    c.subject
  limit 1;

  if v_class_id is null then
    return jsonb_build_object('ok', false, 'error', '找不到符合的班別');
  end if;

  if not public.apo_assistant_can_access_class(v_class_id, p_user_role, p_teacher_id) then
    return jsonb_build_object('ok', false, 'error', '無權限查詢此班別');
  end if;

  select coalesce(jsonb_agg(to_jsonb(r) order by r.full_name), '[]'::jsonb)
  into v_roster
  from (
    select
      st.id as student_id,
      st.full_name,
      st.english_name,
      st.grade,
      e.status as enrollment_status,
      coalesce(a.status, '') as attendance_status,
      coalesce(lm.leave_reason, '') as leave_reason
    from public.student_class_enrollments e
    join public.students st on st.id = e.student_id
    left join public.attendance_details a
      on a.student_id = e.student_id
     and a.class_id = e.class_id
     and a.attendance_date = v_date
    left join public.leave_makeup_records lm
      on lm.student_id = e.student_id
     and lm.class_id = e.class_id
     and lm.leave_date = v_date
    where e.class_id = v_class_id
      and e.status = '就讀中'
    order by st.full_name
  ) r;

  return jsonb_build_object(
    'ok', true,
    'date', v_date,
    'class', v_class,
    'roster', v_roster,
    'student_count', coalesce(jsonb_array_length(v_roster), 0)
  );
end;
$$;

create or replace function public.apo_assistant_upcoming_trials(
  p_days int default 7,
  p_user_role text default 'admin',
  p_teacher_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_from date := public.apo_assistant_hk_today();
  v_to date := v_from + least(greatest(coalesce(p_days, 7), 1), 30);
  v_trials jsonb;
begin
  if p_user_role not in ('admin', 'teacher', 'alien') then
    return jsonb_build_object('ok', false, 'error', '無權限');
  end if;

  select coalesce(jsonb_agg(to_jsonb(t) order by t.trial_date, t.start_time nulls last), '[]'::jsonb)
  into v_trials
  from (
    select
      ts.trial_date,
      ts.trial_type,
      ts.status as trial_status,
      st.full_name,
      st.grade,
      c.subject,
      c.course_code_full,
      s.start_time,
      s.end_time,
      te.full_name as teacher_name
    from public.trial_sessions ts
    join public.students st on st.id = ts.student_id
    join public.classes c on c.id = ts.class_id
    join public.schedules s on s.id = ts.schedule_id
    left join public.teachers te on te.id = c.teacher_id
    where ts.trial_date between v_from and v_to
      and (
        p_user_role in ('admin', 'alien')
        or c.teacher_id = p_teacher_id
      )
    order by ts.trial_date, s.start_time nulls last
    limit 40
  ) t;

  return jsonb_build_object(
    'ok', true,
    'from_date', v_from,
    'to_date', v_to,
    'trials', v_trials,
    'trial_count', coalesce(jsonb_array_length(v_trials), 0)
  );
end;
$$;

-- 僅 service_role（Edge Function）可執行
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'apo_assistant_hk_today()',
    'apo_assistant_can_access_student(uuid,text,uuid)',
    'apo_assistant_can_access_class(uuid,text,uuid)',
    'apo_assistant_search_students(text,text,uuid,int)',
    'apo_assistant_student_today_lessons(uuid,date,text,uuid)',
    'apo_assistant_student_profile(uuid,text,uuid)',
    'apo_assistant_student_tuition(uuid,text,uuid)',
    'apo_assistant_student_attendance(uuid,int,text,uuid)',
    'apo_assistant_teacher_schedule(date,text,uuid)',
    'apo_assistant_today_leaves(date,text,uuid)',
    'apo_assistant_class_roster(text,date,text,uuid)',
    'apo_assistant_upcoming_trials(int,text,uuid)'
  ]
  loop
    execute format('revoke all on function public.%s from public', fn);
    execute format('revoke all on function public.%s from anon', fn);
    execute format('revoke all on function public.%s from authenticated', fn);
    execute format('grant execute on function public.%s to service_role', fn);
  end loop;
end $$;

commit;
