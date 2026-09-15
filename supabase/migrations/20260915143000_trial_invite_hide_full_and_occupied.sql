-- 公開試堂目錄：就讀中超過 5 人不顯示班別；該堂已有未取消試堂則不顯示該排程

begin;

create or replace function public.trial_invite_class_under_enrolled_cap(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    select count(*)::int
    from public.student_class_enrollments e
    where e.class_id = p_class_id
      and e.status = '就讀中'
  ) <= 5;
$$;

comment on function public.trial_invite_class_under_enrolled_cap(uuid) is
  '試堂邀請公開目錄：就讀中人數 ≤ 5 才顯示。超過 5 人不納入。';

revoke all on function public.trial_invite_class_under_enrolled_cap(uuid) from public;
revoke all on function public.trial_invite_class_under_enrolled_cap(uuid) from anon;
grant execute on function public.trial_invite_class_under_enrolled_cap(uuid) to authenticated;

create or replace function public.trial_invite_schedule_open_for_parent(p_schedule_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.schedules sch
    where sch.id = p_schedule_id
      and sch.scheduled_date >= current_date
      and coalesce(sch.status, '') not ilike '%取消%'
      and coalesce(sch.trial_invite_excluded, false) = false
      and not exists (
        select 1
        from public.trial_sessions ts
        where ts.schedule_id = sch.id
          and coalesce(ts.status, '') not ilike '%取消%'
      )
  );
$$;

comment on function public.trial_invite_schedule_open_for_parent(uuid) is
  '試堂邀請公開目錄：未來、未取消、未剔除，且該堂尚無未取消試堂學生。';

revoke all on function public.trial_invite_schedule_open_for_parent(uuid) from public;
revoke all on function public.trial_invite_schedule_open_for_parent(uuid) from anon;
grant execute on function public.trial_invite_schedule_open_for_parent(uuid) to authenticated;

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
              and public.trial_invite_schedule_open_for_parent(s1.id)
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
        and public.trial_invite_class_under_enrolled_cap(c.id)
        and exists (
          select 1
          from public.schedules sx
          where sx.class_id = c.id
            and public.trial_invite_schedule_open_for_parent(sx.id)
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

create or replace function public.trial_invite_submit(
  p_token text,
  p_lines jsonb,
  p_parent_note text default null,
  p_elected_subject_codes text[] default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.trial_invite_tokens%rowtype;
  s public.students%rowtype;
  v_request_id uuid;
  v_item jsonb;
  v_class_id uuid;
  v_schedule_id uuid;
  v_seen uuid[] := '{}'::uuid[];
  v_count int := 0;
  v_grade text;
  v_needs_electives boolean := false;
  v_elected text[] := '{}'::text[];
  v_code text;
  v_cat text;
  v_kind text;
begin
  if p_token is null or length(trim(p_token)) < 8 then
    raise exception '連結無效';
  end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) < 1 then
    raise exception '請至少選一科試堂';
  end if;
  if jsonb_array_length(p_lines) > 20 then
    raise exception '一次最多選 20 科';
  end if;

  select * into r
  from public.trial_invite_tokens
  where token = trim(p_token)
  for update;
  if not found then
    raise exception '找不到此邀請連結';
  end if;

  if r.expires_at < now() then
    update public.trial_invite_tokens set status = 'expired' where id = r.id;
    raise exception '此連結已過期，請向職員索取新連結';
  end if;

  if r.status <> 'open' then
    raise exception '此連結已無法再提交（狀態：%）', r.status;
  end if;

  select * into s from public.students where id = r.student_id;
  if not found then
    raise exception '找不到對應學生';
  end if;

  v_grade := upper(btrim(coalesce(s.grade, '')));
  v_needs_electives := v_grade in ('S4', 'S5', 'S6');

  if p_elected_subject_codes is not null then
    select coalesce(array_agg(distinct upper(btrim(x))), '{}'::text[])
    into v_elected
    from unnest(p_elected_subject_codes) as x
    where nullif(btrim(x), '') is not null;
  end if;

  if v_needs_electives and cardinality(v_elected) > 0 then
    if exists (
      select 1
      from unnest(v_elected) as code
      where not exists (
        select 1
        from public.subjects sub
        where sub.code = code
          and sub.category = 'senior_elective'
      )
    ) then
      raise exception '選修科目無效';
    end if;
  end if;

  insert into public.trial_invite_requests (
    token_id, student_id, status, parent_note, elected_subject_codes
  )
  values (
    r.id,
    r.student_id,
    'submitted',
    nullif(btrim(coalesce(p_parent_note, '')), ''),
    coalesce(v_elected, '{}'::text[])
  )
  returning id into v_request_id;

  for v_item in select * from jsonb_array_elements(p_lines)
  loop
    begin
      v_class_id := (v_item->>'class_id')::uuid;
      v_schedule_id := (v_item->>'schedule_id')::uuid;
    exception when others then
      raise exception '班別或堂次格式無效';
    end;

    if v_class_id = any (v_seen) then
      raise exception '同一科請只選一個堂次';
    end if;
    v_seen := array_append(v_seen, v_class_id);

    if not public.trial_invite_class_matches_student(v_class_id, r.student_id) then
      raise exception '所選班別不適用於此學生年級';
    end if;

    if not public.trial_invite_catalog_allows_class(v_class_id) then
      raise exception '所選班別目前未開放試堂邀請';
    end if;

    if not public.trial_invite_class_under_enrolled_cap(v_class_id) then
      raise exception '所選班別目前人數已滿，未能申請試堂';
    end if;

    select c.class_kind, coalesce(subj.code, ''), coalesce(subj.category, 'other')
    into v_kind, v_code, v_cat
    from public.classes c
    left join public.courses co on co.id = c.course_id
    left join public.subjects subj on subj.id = co.subject_id
    where c.id = v_class_id;

    if not found then
      raise exception '班別不存在';
    end if;

    if v_needs_electives and v_kind = 'group' then
      if v_cat is distinct from 'main'
         and not (v_code = any (v_elected))
      then
        raise exception '高中試堂僅可選主科或你已勾選的選修科目';
      end if;
    end if;

    if not exists (
      select 1
      from public.schedules sch
      where sch.id = v_schedule_id
        and sch.class_id = v_class_id
    ) then
      raise exception '所選堂次無效、已取消或未開放試堂邀請';
    end if;

    if not public.trial_invite_schedule_open_for_parent(v_schedule_id) then
      raise exception '所選堂次無效、已取消、未開放試堂邀請或已有試堂學生';
    end if;

    if exists (
      select 1
      from public.student_class_enrollments e
      where e.student_id = r.student_id
        and e.class_id = v_class_id
        and e.status = '就讀中'
    ) then
      raise exception '已報讀「%」，無需再申請試堂', public.trial_invite_class_label(v_class_id);
    end if;

    insert into public.trial_invite_request_lines (
      request_id, class_id, schedule_id, class_label
    ) values (
      v_request_id,
      v_class_id,
      v_schedule_id,
      public.trial_invite_class_label(v_class_id)
    );
    v_count := v_count + 1;
  end loop;

  if v_count < 1 then
    raise exception '請至少選一科試堂';
  end if;

  update public.trial_invite_tokens
  set status = 'submitted', submitted_at = now()
  where id = r.id;

  return public.trial_invite_get(p_token);
end;
$$;

revoke all on function public.trial_invite_get(text) from public;
grant execute on function public.trial_invite_get(text) to anon, authenticated;

revoke all on function public.trial_invite_submit(text, jsonb, text) from public;
revoke all on function public.trial_invite_submit(text, jsonb, text) from anon;
revoke all on function public.trial_invite_submit(text, jsonb, text) from authenticated;

revoke all on function public.trial_invite_submit(text, jsonb, text, text[]) from public;
grant execute on function public.trial_invite_submit(text, jsonb, text, text[]) to anon, authenticated;

notify pgrst, 'reload schema';

commit;
