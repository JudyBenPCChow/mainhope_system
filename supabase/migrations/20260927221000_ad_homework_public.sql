-- 功課輔導班公開頁：目錄與試堂提交不套專科就讀人數上限，亦不按專科年級過濾。
-- 功輔為混級同一場次；專科「就讀中 ≤ 5」與年級對照不適用。

begin;

create or replace function public.ad_homework_catalog_allows_class(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.classes c
    join public.academic_years ay on ay.id = c.academic_year_id
    where c.id = p_class_id
      and ay.is_current
      and c.class_kind = 'homework'
      and coalesce(c.status, '') not ilike '%已結束%'
      and c.ad_trial_listed
  );
$$;

comment on function public.ad_homework_catalog_allows_class(uuid) is
  '功課輔導班公開頁：目前學年、已納入廣告目錄、未結束。不計就讀中人數。';

revoke all on function public.ad_homework_catalog_allows_class(uuid) from public, anon, authenticated;

create or replace function public.ad_homework_catalog_get()
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_classes jsonb := '[]'::jsonb;
begin
  perform public.ad_public_assert_rate_limit('catalog');

  select coalesce(jsonb_agg(cls_row order by cls_row->>'course_name'), '[]'::jsonb)
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
            and public.ad_trial_schedule_open(s1.id)
          order by s1.scheduled_date, s1.start_time, s1.session_number nulls last
          limit 40
        ) s2
      ), '[]'::jsonb)
    ) as cls_row
    from public.classes c
    left join public.courses co on co.id = c.course_id
    left join public.subjects subj on subj.id = co.subject_id
    left join public.teachers t on t.id = c.teacher_id
    where public.ad_homework_catalog_allows_class(c.id)
      and exists (
        select 1
        from public.schedules sx
        where sx.class_id = c.id
          and public.ad_trial_schedule_open(sx.id)
      )
  ) q;

  return jsonb_build_object('classes', coalesce(v_classes, '[]'::jsonb));
end;
$$;

comment on function public.ad_homework_catalog_get() is
  '功課輔導班公開頁目錄：不按年級、不按就讀人數過濾。堂次仍須未來、未取消、未剔除。';

revoke all on function public.ad_homework_catalog_get() from public;
grant execute on function public.ad_homework_catalog_get() to anon, authenticated, service_role;

create or replace function public.ad_homework_trial_submit(
  p_full_name text,
  p_school text,
  p_grade text,
  p_phone text,
  p_note text default null,
  p_lines jsonb default '[]'::jsonb,
  p_company text default null,
  p_contact_method text default 'WhatsApp',
  p_wechat_id text default null,
  p_phone_country_code text default '+852',
  p_rate_client_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grade text;
  v_phone text;
  v_cc text;
  v_method text;
  v_wechat text;
  v_name text;
  v_school text;
  v_note text;
  v_lead_id uuid;
  v_item jsonb;
  v_class_id uuid;
  v_schedule_id uuid;
  v_kind text;
  v_label text;
  v_date date;
  v_start time;
  v_end time;
  v_count int := 0;
  v_rate_key text := nullif(btrim(coalesce(p_rate_client_key, '')), '');
begin
  perform public.ad_public_assert_rate_limit('submit', v_rate_key);

  if nullif(btrim(coalesce(p_company, '')), '') is not null then
    return jsonb_build_object('accepted', true);
  end if;

  v_name := btrim(coalesce(p_full_name, ''));
  v_school := btrim(coalesce(p_school, ''));
  v_note := nullif(btrim(coalesce(p_note, '')), '');
  v_grade := public.ad_trial_normalize_grade(p_grade);
  v_method := case when btrim(coalesce(p_contact_method, '')) = 'WeChat' then 'WeChat' else 'WhatsApp' end;
  v_wechat := nullif(btrim(coalesce(p_wechat_id, '')), '');
  v_cc := case
    when btrim(coalesce(p_phone_country_code, '')) in ('+86', '86') then '+86'
    else '+852'
  end;
  v_phone := public.ad_trial_normalize_phone(p_phone, v_cc);

  if v_name = '' or char_length(v_name) > 80 then
    raise exception '請填寫姓名';
  end if;
  if v_school = '' or char_length(v_school) > 120 then
    raise exception '請填寫學校';
  end if;
  if v_grade is null then
    raise exception '請選擇年級';
  end if;
  if v_method = 'WeChat' then
    v_phone := null;
    v_cc := '+852';
    if v_wechat is null or char_length(v_wechat) > 40 then
      raise exception '請填寫 WeChat ID';
    end if;
  else
    v_wechat := null;
    if v_phone is null then
      if v_cc = '+86' then
        raise exception '請填寫 11 位聯絡電話';
      end if;
      raise exception '請填寫 8 位聯絡電話';
    end if;
  end if;
  if v_note is not null and char_length(v_note) > 500 then
    raise exception '備註過長';
  end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) <> 1 then
    raise exception '請選擇一個試堂日子';
  end if;

  if v_phone is not null and exists (
    select 1
    from public.leads l
    where l.phone_normalized = v_phone
      and l.phone_country_code = v_cc
      and l.source = 'ad_trial'
      and l.created_at > now() - interval '24 hours'
  ) then
    return jsonb_build_object('accepted', true);
  end if;
  if v_wechat is not null and exists (
    select 1
    from public.leads l
    where lower(l.wechat_id) = lower(v_wechat)
      and l.source = 'ad_trial'
      and l.created_at > now() - interval '24 hours'
  ) then
    return jsonb_build_object('accepted', true);
  end if;

  insert into public.leads (
    full_name, school, grade, phone, phone_normalized, phone_country_code, note, source, status,
    contact_method, wechat_id, interested_subjects
  ) values (
    v_name, v_school, v_grade, v_phone, v_phone, v_cc, v_note, 'ad_trial', 'new',
    v_method, v_wechat, array['功課輔導']::text[]
  )
  returning id into v_lead_id;

  v_item := p_lines->0;
  begin
    v_class_id := (v_item->>'class_id')::uuid;
    v_schedule_id := (v_item->>'schedule_id')::uuid;
  exception when others then
    raise exception '班別或堂次格式無效';
  end;

  if not public.ad_homework_catalog_allows_class(v_class_id) then
    raise exception '所選功課輔導班目前未開放';
  end if;
  if not public.ad_trial_schedule_open(v_schedule_id) then
    raise exception '所選堂次無效、已取消或未開放';
  end if;
  if not exists (
    select 1 from public.schedules sch
    where sch.id = v_schedule_id and sch.class_id = v_class_id
  ) then
    raise exception '所選堂次不屬於該班';
  end if;

  select c.class_kind
  into v_kind
  from public.classes c
  where c.id = v_class_id;

  if v_kind is distinct from 'homework' then
    raise exception '只可選擇功課輔導班';
  end if;

  select
    coalesce(nullif(btrim(co.course_name), ''), nullif(btrim(c.subject), ''), nullif(btrim(c.course_code_full), ''), '功課輔導班'),
    sch.scheduled_date, sch.start_time, sch.end_time
  into v_label, v_date, v_start, v_end
  from public.schedules sch
  join public.classes c on c.id = sch.class_id
  left join public.courses co on co.id = c.course_id
  where sch.id = v_schedule_id;

  insert into public.lead_trial_intentions (
    lead_id, class_id, schedule_id, class_label, scheduled_date, start_time, end_time
  ) values (
    v_lead_id, v_class_id, v_schedule_id, v_label, v_date, v_start, v_end
  );
  v_count := 1;

  if v_count < 1 then
    raise exception '請選擇一個試堂日子';
  end if;

  perform public.ad_public_mark_submit_accepted(v_rate_key);
  return jsonb_build_object('accepted', true);
end;
$$;

comment on function public.ad_homework_trial_submit(text, text, text, text, text, jsonb, text, text, text, text, text) is
  '功課輔導班公開頁：寫潛在客戶與一個試堂日子。不檢查專科人數上限與年級對照。';

revoke all on function public.ad_homework_trial_submit(text, text, text, text, text, jsonb, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.ad_homework_trial_submit(text, text, text, text, text, jsonb, text, text, text, text, text) to service_role;

notify pgrst, 'reload schema';

commit;
