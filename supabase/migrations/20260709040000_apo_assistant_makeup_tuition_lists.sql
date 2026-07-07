-- 明學IT狗：待補課名單、追收學費名單（分頁，每頁 20 筆）

begin;

create or replace function public.apo_assistant_is_pending_makeup(p_status text)
returns boolean
language sql
immutable
as $$
  select
    coalesce(trim(p_status), '') <> ''
    and coalesce(p_status, '') not ilike '%放棄%'
    and coalesce(p_status, '') not ilike '%已補課%'
    and coalesce(p_status, '') not ilike '%已完成%';
$$;

comment on function public.apo_assistant_is_pending_makeup(text) is
  '對齊請假管理「待補課」分頁：非放棄、非已補課／已完成。';

create or replace function public.apo_assistant_pending_makeups(
  p_offset int default 0,
  p_limit int default 20,
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
  v_offset int := greatest(coalesce(p_offset, 0), 0);
  v_limit int := least(greatest(coalesce(p_limit, 20), 1), 20);
  v_total int;
  v_records jsonb;
begin
  if p_user_role not in ('admin', 'teacher', 'alien') then
    return jsonb_build_object('ok', false, 'error', '無權限');
  end if;

  if p_user_role = 'teacher' and p_teacher_id is null then
    return jsonb_build_object('ok', false, 'error', '老師身分未設定');
  end if;

  select count(*)::int
  into v_total
  from public.leave_makeup_records lm
  join public.classes c on c.id = lm.class_id
  where public.apo_assistant_is_pending_makeup(lm.status)
    and (
      p_user_role in ('admin', 'alien')
      or c.teacher_id = p_teacher_id
    );

  select coalesce(jsonb_agg(to_jsonb(r) order by r.leave_date, r.full_name), '[]'::jsonb)
  into v_records
  from (
    select
      lm.id as record_id,
      lm.student_id,
      st.full_name,
      st.grade,
      c.subject,
      c.course_code_full,
      te.full_name as teacher_name,
      lm.leave_date,
      sc.scheduled_date as sched_date,
      lm.leave_reason,
      lm.makeup_type,
      lm.status
    from public.leave_makeup_records lm
    join public.students st on st.id = lm.student_id
    join public.classes c on c.id = lm.class_id
    left join public.teachers te on te.id = c.teacher_id
    left join public.schedules sc on sc.id = lm.schedule_id
    where public.apo_assistant_is_pending_makeup(lm.status)
      and (
        p_user_role in ('admin', 'alien')
        or c.teacher_id = p_teacher_id
      )
    order by lm.leave_date asc, st.full_name asc
    offset v_offset
    limit v_limit
  ) r;

  return jsonb_build_object(
    'ok', true,
    'total_count', v_total,
    'offset', v_offset,
    'limit', v_limit,
    'has_more', (v_offset + v_limit) < v_total,
    'next_offset', case when (v_offset + v_limit) < v_total then v_offset + v_limit else null end,
    'records', coalesce(v_records, '[]'::jsonb),
    'record_count', coalesce(jsonb_array_length(v_records), 0)
  );
end;
$$;

create or replace function public.apo_assistant_overdue_tuition_list(
  p_offset int default 0,
  p_limit int default 20,
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
  v_offset int := greatest(coalesce(p_offset, 0), 0);
  v_limit int := least(greatest(coalesce(p_limit, 20), 1), 20);
  v_total int;
  v_records jsonb;
begin
  if p_user_role not in ('admin', 'alien') then
    return jsonb_build_object('ok', false, 'error', '追收學費名單僅管理員可查');
  end if;

  with scoped_students as (
    select
      s.id,
      s.student_code,
      s.full_name,
      s.english_name,
      s.grade,
      s.enrollment_status,
      s.activity_status
    from public.students s
    where s.enrollment_status = '在讀'
       or s.activity_status = '活躍生'
  ),
  paid as (
    select p.student_id, coalesce(sum(pd.lesson_count), 0)::numeric as paid_lessons
    from public.payments p
    join public.payment_details pd on pd.payment_id = p.id
    join scoped_students ss on ss.id = p.student_id
    where p.status = '已收款'
      and pd.lesson_count > 0
    group by p.student_id
  ),
  attended as (
    select a.student_id, count(*)::bigint as attended_lessons
    from public.attendance_details a
    join scoped_students ss on ss.id = a.student_id
    where coalesce(a.status, '') not like '%缺席%'
      and not (
        coalesce(a.status, '') like '%假%'
        and coalesce(a.status, '') not like '%補%'
      )
    group by a.student_id
  ),
  arrears as (
    select
      ss.id as student_id,
      ss.student_code,
      ss.full_name,
      ss.english_name,
      ss.grade,
      ss.enrollment_status,
      ss.activity_status,
      coalesce(paid.paid_lessons, 0)::numeric as paid_lessons,
      coalesce(attended.attended_lessons, 0)::bigint as attended_lessons
    from scoped_students ss
    left join paid on paid.student_id = ss.id
    left join attended on attended.student_id = ss.id
    where coalesce(attended.attended_lessons, 0) >= coalesce(paid.paid_lessons, 0)
      and not (
        coalesce(paid.paid_lessons, 0) = 0
        and coalesce(attended.attended_lessons, 0) = 0
      )
  )
  select count(*)::int
  into v_total
  from arrears;

  with scoped_students as (
    select
      s.id,
      s.student_code,
      s.full_name,
      s.english_name,
      s.grade,
      s.enrollment_status,
      s.activity_status
    from public.students s
    where s.enrollment_status = '在讀'
       or s.activity_status = '活躍生'
  ),
  paid as (
    select p.student_id, coalesce(sum(pd.lesson_count), 0)::numeric as paid_lessons
    from public.payments p
    join public.payment_details pd on pd.payment_id = p.id
    join scoped_students ss on ss.id = p.student_id
    where p.status = '已收款'
      and pd.lesson_count > 0
    group by p.student_id
  ),
  attended as (
    select a.student_id, count(*)::bigint as attended_lessons
    from public.attendance_details a
    join scoped_students ss on ss.id = a.student_id
    where coalesce(a.status, '') not like '%缺席%'
      and not (
        coalesce(a.status, '') like '%假%'
        and coalesce(a.status, '') not like '%補%'
      )
    group by a.student_id
  ),
  arrears as (
    select
      ss.id as student_id,
      ss.student_code,
      ss.full_name,
      ss.english_name,
      ss.grade,
      ss.enrollment_status,
      ss.activity_status,
      coalesce(paid.paid_lessons, 0)::numeric as paid_lessons,
      coalesce(attended.attended_lessons, 0)::bigint as attended_lessons,
      (coalesce(attended.attended_lessons, 0) - coalesce(paid.paid_lessons, 0))::bigint as lesson_gap
    from scoped_students ss
    left join paid on paid.student_id = ss.id
    left join attended on attended.student_id = ss.id
    where coalesce(attended.attended_lessons, 0) >= coalesce(paid.paid_lessons, 0)
      and not (
        coalesce(paid.paid_lessons, 0) = 0
        and coalesce(attended.attended_lessons, 0) = 0
      )
  )
  select coalesce(jsonb_agg(to_jsonb(r) order by r.lesson_gap desc, r.full_name), '[]'::jsonb)
  into v_records
  from (
    select *
    from arrears
    order by lesson_gap desc, full_name asc
    offset v_offset
    limit v_limit
  ) r;

  return jsonb_build_object(
    'ok', true,
    'total_count', v_total,
    'offset', v_offset,
    'limit', v_limit,
    'has_more', (v_offset + v_limit) < v_total,
    'next_offset', case when (v_offset + v_limit) < v_total then v_offset + v_limit else null end,
    'records', coalesce(v_records, '[]'::jsonb),
    'record_count', coalesce(jsonb_array_length(v_records), 0)
  );
end;
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'apo_assistant_is_pending_makeup(text)',
    'apo_assistant_pending_makeups(int,int,text,uuid)',
    'apo_assistant_overdue_tuition_list(int,int,text,uuid)'
  ]
  loop
    execute format('revoke all on function public.%s from public', fn);
    execute format('revoke all on function public.%s from anon', fn);
    execute format('revoke all on function public.%s from authenticated', fn);
    execute format('grant execute on function public.%s to service_role', fn);
  end loop;
end $$;

commit;
