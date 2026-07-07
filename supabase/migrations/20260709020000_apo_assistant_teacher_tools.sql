-- 明學IT狗：老師搜尋與班別查詢 RPC

begin;

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

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'apo_assistant_search_teachers(text,text,uuid,int)',
    'apo_assistant_teacher_classes(uuid,text,uuid)'
  ]
  loop
    execute format('revoke all on function public.%s from public', fn);
    execute format('revoke all on function public.%s from anon', fn);
    execute format('revoke all on function public.%s from authenticated', fn);
    execute format('grant execute on function public.%s to service_role', fn);
  end loop;
end $$;

commit;
