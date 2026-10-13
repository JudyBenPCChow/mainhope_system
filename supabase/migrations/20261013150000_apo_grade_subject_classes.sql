-- 明學IT狗：按年級＋科目查目前學年進行中的專科班（不含學生姓名）

begin;

create or replace function public.apo_assistant_grade_subject_classes(
  p_filters jsonb,
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
  v_classes jsonb;
begin
  -- p_teacher_id 保留與其他助手函式相同的呼叫形狀；此目錄不列學生，不按老師收窄。
  if p_user_role not in ('admin', 'manager', 'finance', 'teacher', 'alien') then
    return jsonb_build_object('ok', false, 'error', '無權限查詢班別');
  end if;

  if jsonb_typeof(p_filters) is distinct from 'array'
     or jsonb_array_length(p_filters) < 1
     or jsonb_array_length(p_filters) > 12 then
    return jsonb_build_object('ok', false, 'error', '請指出年級同科目');
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_filters) as f(item)
    where coalesce(f.item->>'gradeCode', '') !~ '^[PS][1-6]$'
       or coalesce(f.item->>'subjectCode', '') !~ '^[A-Z0-9]{2,8}$'
       or not exists (
         select 1
         from public.subjects s
         where upper(s.code) = upper(f.item->>'subjectCode')
       )
  ) then
    return jsonb_build_object('ok', false, 'error', '請指出年級同科目');
  end if;

  select coalesce(
    jsonb_agg(
      to_jsonb(c)
      order by c.filter_index, c.course_code_full, c.section_code
    ),
    '[]'::jsonb
  )
  into v_classes
  from (
    select
      f.ord::int as filter_index,
      upper(f.item->>'gradeCode') as grade_code,
      upper(f.item->>'subjectCode') as subject_code,
      cl.course_code_full,
      cl.section_code,
      cl.day_of_week,
      cl.time_slot,
      coalesce(
        nullif(btrim(te.english_name), ''),
        nullif(btrim(te.full_name), '')
      ) as teacher_name,
      (
        select count(*)::int
        from public.student_class_enrollments e
        where e.class_id = cl.id
          and e.status = '就讀中'
      ) as enrolled_count
    from jsonb_array_elements(p_filters) with ordinality as f(item, ord)
    join public.classes cl
      on cl.class_kind = 'group'
     and cl.status = '進行中'
    join public.academic_years ay
      on ay.id = cl.academic_year_id
     and ay.is_current
    join public.courses cr on cr.id = cl.course_id
    join public.subjects subj on subj.id = cr.subject_id
    left join public.teachers te on te.id = cl.teacher_id
    where upper(subj.code) = upper(f.item->>'subjectCode')
      and (
        upper(btrim(cr.grade_code)) = upper(f.item->>'gradeCode')
        or exists (
          select 1
          from unnest(coalesce(cr.eligible_grade_codes, array[]::text[])) as eg(code)
          where upper(btrim(eg.code)) = upper(f.item->>'gradeCode')
        )
        or exists (
          select 1
          from unnest(coalesce(cl.grade, array[]::text[])) as g(label)
          where regexp_replace(btrim(g.label), '級$', '') = f.item->>'gradeLabel'
        )
      )
      and (
        coalesce(jsonb_array_length(f.item->'sections'), 0) = 0
        or upper(btrim(cl.section_code)) in (
          select upper(btrim(section_letter))
          from jsonb_array_elements_text(coalesce(f.item->'sections', '[]'::jsonb)) as section_letter
        )
      )
  ) c;

  return jsonb_build_object('ok', true, 'classes', v_classes);
end;
$$;

comment on function public.apo_assistant_grade_subject_classes(jsonb, text, uuid) is
  '明學IT狗：目前學年進行中專科班，按年級與科目列出。人數為就讀中報讀，不含學生姓名。';

revoke all on function public.apo_assistant_grade_subject_classes(jsonb, text, uuid) from public;
revoke all on function public.apo_assistant_grade_subject_classes(jsonb, text, uuid) from anon;
revoke all on function public.apo_assistant_grade_subject_classes(jsonb, text, uuid) from authenticated;
grant execute on function public.apo_assistant_grade_subject_classes(jsonb, text, uuid) to service_role;

notify pgrst, 'reload schema';

commit;
