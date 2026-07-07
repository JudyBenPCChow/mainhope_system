-- 明學IT狗：收緊老師查詢範圍，對齊 RLS teacher_can_access_student

begin;

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
    when p_user_role = 'teacher' and p_teacher_id is not null then (
      exists (
        select 1
        from public.student_class_enrollments e
        join public.classes c on c.id = e.class_id
        where e.student_id = p_student_id
          and c.teacher_id = p_teacher_id
      )
      or exists (
        select 1
        from public.calendar_event_students ces
        join public.calendar_event_teachers cet on cet.event_id = ces.event_id
        where ces.student_id = p_student_id
          and cet.teacher_id = p_teacher_id
      )
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
      or public.apo_assistant_can_access_student(s.id, p_user_role, p_teacher_id)
    )
    order by rank, s.full_name
    limit least(greatest(coalesce(p_limit, 8), 1), 15)
  ) t;

  v_count := coalesce(jsonb_array_length(v_result), 0);
  return jsonb_build_object('ok', true, 'students', v_result, 'count', v_count);
end;
$$;

create or replace function public.apo_assistant_search_teachers(
  p_query text,
  p_user_role text default 'admin',
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
    return jsonb_build_object('ok', false, 'error', '無權限查詢老師');
  end if;

  -- 專班老師不可搜尋其他老師
  if p_user_role = 'teacher' then
    if p_teacher_id is null then
      return jsonb_build_object('ok', false, 'error', '老師身分未設定');
    end if;
    return jsonb_build_object('ok', false, 'error', '專班老師不可查詢其他老師，請使用「我的班別」或時間表');
  end if;

  select coalesce(jsonb_agg(to_jsonb(t) - 'rank'), '[]'::jsonb)
  into v_result
  from (
    select
      te.id,
      te.full_name,
      te.english_name,
      te.status,
      (
        select count(*)::int
        from public.classes c
        where c.teacher_id = te.id
      ) as class_count,
      case
        when te.full_name ilike v_query then 1
        when te.english_name ilike v_query then 2
        when te.full_name ilike '%' || v_query || '%' then 3
        when coalesce(te.english_name, '') ilike '%' || v_query || '%' then 4
        else 5
      end as rank
    from public.teachers te
    where (
      te.full_name ilike '%' || v_query || '%'
      or coalesce(te.english_name, '') ilike '%' || v_query || '%'
    )
    order by rank, te.full_name
    limit least(greatest(coalesce(p_limit, 8), 1), 15)
  ) t;

  v_count := coalesce(jsonb_array_length(v_result), 0);
  return jsonb_build_object('ok', true, 'teachers', v_result, 'count', v_count);
end;
$$;

create or replace function public.apo_assistant_teacher_classes(
  p_teacher_id uuid,
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
  v_teacher jsonb;
  v_classes jsonb;
begin
  if p_user_role not in ('admin', 'teacher', 'alien') then
    return jsonb_build_object('ok', false, 'error', '無權限查詢老師班別');
  end if;

  if p_user_role = 'teacher' then
    if p_scope_teacher_id is null then
      return jsonb_build_object('ok', false, 'error', '老師身分未設定');
    end if;
    if p_teacher_id is distinct from p_scope_teacher_id then
      return jsonb_build_object('ok', false, 'error', '你只能查詢自己負責的班別');
    end if;
  end if;

  select to_jsonb(te)
  into v_teacher
  from (
    select id, full_name, english_name, status
    from public.teachers
    where id = p_teacher_id
  ) te;

  if v_teacher is null then
    return jsonb_build_object('ok', false, 'error', '找不到老師');
  end if;

  select coalesce(jsonb_agg(to_jsonb(c) order by c.day_of_week, c.time_slot, c.subject), '[]'::jsonb)
  into v_classes
  from (
    select
      cl.id as class_id,
      cl.subject,
      cl.course_code_full,
      cl.day_of_week,
      cl.time_slot,
      cl.status,
      (
        select count(*)::int
        from public.student_class_enrollments e
        where e.class_id = cl.id
          and e.status = '就讀中'
      ) as enrolled_count
    from public.classes cl
    where cl.teacher_id = p_teacher_id
    order by cl.day_of_week nulls last, cl.time_slot nulls last, cl.subject
  ) c;

  return jsonb_build_object(
    'ok', true,
    'teacher', v_teacher,
    'teacher_id', p_teacher_id,
    'classes', v_classes,
    'class_count', coalesce(jsonb_array_length(v_classes), 0)
  );
end;
$$;

commit;
