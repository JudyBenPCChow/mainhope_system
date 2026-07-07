-- 明學IT狗：學生報讀查詢加入 course_name（班名）

begin;

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

  select coalesce(jsonb_agg(to_jsonb(e) order by e.sort_key, e.class_name), '[]'::jsonb)
  into v_enrollments
  from (
    select
      en.id as enrollment_id,
      en.status as enrollment_status,
      en.enroll_date,
      en.enrollment_period,
      c.id as class_id,
      c.subject,
      coalesce(nullif(trim(cr.course_name), ''), c.subject) as class_name,
      cr.course_name,
      c.course_code_full,
      c.section_code,
      c.day_of_week,
      c.time_slot,
      t.full_name as teacher_name,
      case when en.status = '就讀中' then 0 else 1 end as sort_key
    from public.student_class_enrollments en
    join public.classes c on c.id = en.class_id
    left join public.courses cr on cr.id = c.course_id
    left join public.teachers t on t.id = c.teacher_id
    where en.student_id = p_student_id
      and (
        p_user_role in ('admin', 'alien')
        or c.teacher_id = p_teacher_id
      )
    order by sort_key, class_name
  ) e;

  return jsonb_build_object(
    'ok', true,
    'student', v_student,
    'enrollments', v_enrollments,
    'enrollment_count', coalesce(jsonb_array_length(v_enrollments), 0)
  );
end;
$$;

do $$
begin
  execute 'revoke all on function public.apo_assistant_student_profile(uuid,text,uuid) from public';
  execute 'revoke all on function public.apo_assistant_student_profile(uuid,text,uuid) from anon';
  execute 'revoke all on function public.apo_assistant_student_profile(uuid,text,uuid) from authenticated';
  execute 'grant execute on function public.apo_assistant_student_profile(uuid,text,uuid) to service_role';
end $$;

commit;
