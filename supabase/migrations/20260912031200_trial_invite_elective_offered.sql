-- 選修「本社有開設」跟目前學年專科班（不問家長年級／該班是否納入試堂名單）

begin;

create or replace function public.trial_invite_get(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.trial_invite_tokens%rowtype;
  s public.students%rowtype;
  v_classes jsonb := '[]'::jsonb;
  v_req jsonb := null;
  v_grade text;
  v_needs_electives boolean := false;
  v_electives jsonb := '[]'::jsonb;
begin
  if p_token is null or length(trim(p_token)) < 8 then
    raise exception '連結無效';
  end if;

  select * into r
  from public.trial_invite_tokens
  where token = trim(p_token)
  limit 1;
  if not found then
    raise exception '找不到此邀請連結';
  end if;

  if r.expires_at < now() and r.status in ('open', 'submitted') then
    update public.trial_invite_tokens
    set status = 'expired'
    where id = r.id;
    r.status := 'expired';
  end if;

  select * into s from public.students where id = r.student_id;
  if not found then
    raise exception '找不到對應學生';
  end if;

  v_grade := upper(btrim(coalesce(s.grade, '')));
  v_needs_electives := v_grade in ('S4', 'S5', 'S6');

  if v_needs_electives then
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'code', sub.code,
          'name_zh', sub.name_zh,
          'short_name', coalesce(nullif(btrim(sub.short_name), ''), sub.name_zh),
          'offered', offered.code is not null
        )
        order by sub.name_zh
      ),
      '[]'::jsonb
    )
    into v_electives
    from public.subjects sub
    left join (
      select distinct upper(btrim(subj.code)) as code
      from public.classes c
      join public.courses co on co.id = c.course_id
      join public.subjects subj on subj.id = co.subject_id
      join public.academic_years ay on ay.id = c.academic_year_id
      where ay.is_current
        and c.class_kind = 'group'
        and coalesce(c.status, '') not ilike '%已結束%'
        and subj.category = 'senior_elective'
        and coalesce(btrim(subj.code), '') <> ''
    ) offered on offered.code = upper(btrim(sub.code))
    where sub.category = 'senior_elective'
      and coalesce(sub.is_active, true);
  end if;

  if r.status = 'open' then
    select coalesce(jsonb_agg(cls_row order by cls_row->>'sort_kind', cls_row->>'course_name'), '[]'::jsonb)
    into v_classes
    from (
      select jsonb_build_object(
        'id', c.id,
        'class_kind', c.class_kind,
        'subject', coalesce(c.subject, ''),
        'subject_code', coalesce(subj.code, ''),
        'subject_category', coalesce(subj.category, 'other'),
        'course_code_full', coalesce(c.course_code_full, ''),
        'course_name', coalesce(co.course_name, c.subject, ''),
        'teacher_name', coalesce(nullif(btrim(t.full_name), ''), t.abbr, ''),
        'day_of_week', coalesce(c.day_of_week, ''),
        'time_slot', coalesce(c.time_slot, ''),
        'sort_kind', case when c.class_kind = 'group' then 0 else 1 end,
        'schedules', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'id', s2.id,
              'scheduled_date', s2.scheduled_date,
              'start_time', s2.start_time::text,
              'end_time', s2.end_time::text,
              'session_number', s2.session_number
            )
            order by s2.scheduled_date, s2.start_time, s2.session_number nulls last
          )
          from (
            select s1.*
            from public.schedules s1
            where s1.class_id = c.id
              and s1.scheduled_date >= current_date
              and coalesce(s1.status, '') not ilike '%取消%'
              and coalesce(s1.trial_invite_excluded, false) = false
            order by s1.scheduled_date, s1.start_time, s1.session_number nulls last
            limit 12
          ) s2
        ), '[]'::jsonb)
      ) as cls_row
      from public.classes c
      left join public.courses co on co.id = c.course_id
      left join public.subjects subj on subj.id = co.subject_id
      left join public.teachers t on t.id = c.teacher_id
      where public.trial_invite_class_matches_student(c.id, r.student_id)
        and public.trial_invite_catalog_allows_class(c.id)
        and exists (
          select 1
          from public.schedules sx
          where sx.class_id = c.id
            and sx.scheduled_date >= current_date
            and coalesce(sx.status, '') not ilike '%取消%'
            and coalesce(sx.trial_invite_excluded, false) = false
        )
    ) q;
  end if;

  select jsonb_build_object(
    'id', req.id,
    'status', req.status,
    'parent_note', req.parent_note,
    'elected_subject_codes', coalesce(req.elected_subject_codes, '{}'::text[]),
    'created_at', req.created_at,
    'lines', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ln.id,
        'class_id', ln.class_id,
        'schedule_id', ln.schedule_id,
        'class_label', ln.class_label,
        'scheduled_date', sch.scheduled_date,
        'start_time', sch.start_time::text,
        'end_time', sch.end_time::text
      ) order by ln.created_at)
      from public.trial_invite_request_lines ln
      left join public.schedules sch on sch.id = ln.schedule_id
      where ln.request_id = req.id
    ), '[]'::jsonb)
  )
  into v_req
  from public.trial_invite_requests req
  where req.token_id = r.id
  order by req.created_at desc
  limit 1;

  return jsonb_build_object(
    'id', r.id,
    'token', r.token,
    'student_id', r.student_id,
    'status', r.status,
    'expires_at', r.expires_at,
    'submitted_at', r.submitted_at,
    'approved_at', r.approved_at,
    'created_at', r.created_at,
    'identity', jsonb_build_object(
      'full_name', s.full_name,
      'student_code', coalesce(s.student_code, ''),
      'grade', coalesce(s.grade, ''),
      'school', coalesce(s.school, '')
    ),
    'requires_elective_survey', v_needs_electives,
    'elective_subject_options', coalesce(v_electives, '[]'::jsonb),
    'classes', coalesce(v_classes, '[]'::jsonb),
    'submitted_request', v_req
  );
end;
$$;

revoke all on function public.trial_invite_get(text) from public;
grant execute on function public.trial_invite_get(text) to anon, authenticated;

notify pgrst, 'reload schema';

commit;
