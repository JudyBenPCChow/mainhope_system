-- 廣告表單聯絡方式：WhatsApp 寫電話，WeChat 寫 ID。

begin;

alter table public.leads
  add column if not exists contact_method text not null default 'WhatsApp';

alter table public.leads
  drop constraint if exists leads_contact_method_check;

alter table public.leads
  add constraint leads_contact_method_check
  check (contact_method in ('WhatsApp', 'WeChat'));

alter table public.leads
  add column if not exists wechat_id text;

alter table public.leads
  alter column phone drop not null,
  alter column phone_normalized drop not null;

comment on column public.leads.contact_method is
  'WhatsApp 或 WeChat。WhatsApp 用 phone；WeChat 用 wechat_id。';

drop function if exists public.ad_trial_submit(text, text, text, text, text, jsonb, text[], text);
drop function if exists public.ad_trial_interest_submit(text, text, text, text, text, text[], text);

create or replace function public.ad_trial_submit(
  p_full_name text,
  p_school text,
  p_grade text,
  p_phone text,
  p_note text default null,
  p_lines jsonb default '[]'::jsonb,
  p_elected_subject_codes text[] default null,
  p_company text default null,
  p_contact_method text default 'WhatsApp',
  p_wechat_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grade text;
  v_phone text;
  v_method text;
  v_wechat text;
  v_name text;
  v_school text;
  v_note text;
  v_needs_electives boolean := false;
  v_elected text[] := '{}'::text[];
  v_lead_id uuid;
  v_item jsonb;
  v_class_id uuid;
  v_schedule_id uuid;
  v_seen uuid[] := '{}'::uuid[];
  v_count int := 0;
  v_code text;
  v_cat text;
  v_kind text;
  v_label text;
  v_date date;
  v_start time;
  v_end time;
begin
  if nullif(btrim(coalesce(p_company, '')), '') is not null then
    return jsonb_build_object('accepted', true);
  end if;

  v_name := btrim(coalesce(p_full_name, ''));
  v_school := btrim(coalesce(p_school, ''));
  v_note := nullif(btrim(coalesce(p_note, '')), '');
  v_grade := public.ad_trial_normalize_grade(p_grade);
  v_method := case when btrim(coalesce(p_contact_method, '')) = 'WeChat' then 'WeChat' else 'WhatsApp' end;
  v_wechat := nullif(btrim(coalesce(p_wechat_id, '')), '');
  v_phone := public.ad_trial_normalize_phone(p_phone);

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
    if v_wechat is null or char_length(v_wechat) > 40 then
      raise exception '請填寫 WeChat ID';
    end if;
  else
    v_wechat := null;
    if v_phone is null then
      raise exception '請填寫 8 位聯絡電話';
    end if;
  end if;
  if v_note is not null and char_length(v_note) > 500 then
    raise exception '備註過長';
  end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) < 1 then
    raise exception '請至少選一堂';
  end if;
  if jsonb_array_length(p_lines) > 20 then
    raise exception '一次最多選 20 科';
  end if;

  if v_phone is not null and exists (
    select 1
    from public.leads l
    where l.phone_normalized = v_phone
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

  v_needs_electives := v_grade in ('S4', 'S5', 'S6');

  if p_elected_subject_codes is not null then
    select coalesce(array_agg(distinct upper(btrim(x))), '{}'::text[])
    into v_elected
    from unnest(p_elected_subject_codes) as x
    where nullif(btrim(x), '') is not null;
  end if;

  if cardinality(v_elected) > 20 then
    raise exception '選修科目過多';
  end if;

  if v_needs_electives and cardinality(v_elected) > 0 then
    if exists (
      select 1
      from unnest(v_elected) as code
      where not exists (
        select 1
        from public.subjects sub
        where upper(btrim(sub.code)) = code
          and sub.category = 'senior_elective'
      )
    ) then
      raise exception '選修科目無效';
    end if;
  end if;

  insert into public.leads (
    full_name, school, grade, phone, phone_normalized, note, source, status,
    elected_subject_codes, contact_method, wechat_id
  ) values (
    v_name, v_school, v_grade, v_phone, v_phone, v_note, 'ad_trial', 'new',
    coalesce(v_elected, '{}'::text[]), v_method, v_wechat
  )
  returning id into v_lead_id;

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

    if not public.ad_trial_class_matches_grade(v_class_id, v_grade) then
      raise exception '所選班別不適用於此年級';
    end if;
    if not public.ad_trial_catalog_allows_class(v_class_id) then
      raise exception '所選班別目前未開放廣告試堂';
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

    select c.class_kind, coalesce(subj.code, ''), coalesce(subj.category, 'other')
    into v_kind, v_code, v_cat
    from public.classes c
    left join public.courses co on co.id = c.course_id
    left join public.subjects subj on subj.id = co.subject_id
    where c.id = v_class_id;

    if v_needs_electives and v_kind = 'group' then
      if v_cat is distinct from 'main'
         and not (upper(btrim(v_code)) = any (v_elected))
      then
        raise exception '高中試堂僅可選主科或已勾選的選修科目';
      end if;
    end if;

    select
      coalesce(nullif(btrim(co.course_name), ''), nullif(btrim(c.subject), ''), nullif(btrim(c.course_code_full), ''), '班別'),
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
    v_count := v_count + 1;
  end loop;

  if v_count < 1 then
    raise exception '請至少選一堂';
  end if;

  return jsonb_build_object('accepted', true);
end;
$$;

create or replace function public.ad_trial_interest_submit(
  p_full_name text,
  p_school text,
  p_grade text,
  p_phone text,
  p_note text default null,
  p_subjects text[] default null,
  p_company text default null,
  p_contact_method text default 'WhatsApp',
  p_wechat_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grade text;
  v_phone text;
  v_method text;
  v_wechat text;
  v_name text;
  v_school text;
  v_note text;
  v_subjects text[] := '{}'::text[];
begin
  if nullif(btrim(coalesce(p_company, '')), '') is not null then
    return jsonb_build_object('accepted', true);
  end if;

  v_name := btrim(coalesce(p_full_name, ''));
  v_school := btrim(coalesce(p_school, ''));
  v_note := nullif(btrim(coalesce(p_note, '')), '');
  v_grade := public.ad_trial_normalize_grade(p_grade);
  v_method := case when btrim(coalesce(p_contact_method, '')) = 'WeChat' then 'WeChat' else 'WhatsApp' end;
  v_wechat := nullif(btrim(coalesce(p_wechat_id, '')), '');
  v_phone := public.ad_trial_normalize_phone(p_phone);

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
    if v_wechat is null or char_length(v_wechat) > 40 then
      raise exception '請填寫 WeChat ID';
    end if;
  else
    v_wechat := null;
    if v_phone is null then
      raise exception '請填寫 8 位聯絡電話';
    end if;
  end if;
  if v_note is not null and char_length(v_note) > 500 then
    raise exception '備註過長';
  end if;

  select coalesce(array_agg(distinct s), '{}'::text[])
  into v_subjects
  from (
    select btrim(x) as s
    from unnest(coalesce(p_subjects, '{}'::text[])) as x
    where nullif(btrim(x), '') is not null
  ) cleaned
  where char_length(s) <= 40;

  if cardinality(v_subjects) < 1 then
    raise exception '請至少選擇一科';
  end if;
  if cardinality(v_subjects) > 20 then
    raise exception '一次最多選 20 科';
  end if;

  if v_phone is not null and exists (
    select 1 from public.leads l
    where l.phone_normalized = v_phone
      and l.source = 'ad_trial'
      and l.created_at > now() - interval '24 hours'
  ) then
    return jsonb_build_object('accepted', true);
  end if;
  if v_wechat is not null and exists (
    select 1 from public.leads l
    where lower(l.wechat_id) = lower(v_wechat)
      and l.source = 'ad_trial'
      and l.created_at > now() - interval '24 hours'
  ) then
    return jsonb_build_object('accepted', true);
  end if;

  insert into public.leads (
    full_name, school, grade, phone, phone_normalized, note, source, status,
    interested_subjects, contact_method, wechat_id
  ) values (
    v_name, v_school, v_grade, v_phone, v_phone, v_note, 'ad_trial', 'new',
    v_subjects, v_method, v_wechat
  );

  return jsonb_build_object('accepted', true);
end;
$$;

revoke all on function public.ad_trial_submit(text, text, text, text, text, jsonb, text[], text, text, text) from public;
grant execute on function public.ad_trial_submit(text, text, text, text, text, jsonb, text[], text, text, text) to anon, authenticated;

revoke all on function public.ad_trial_interest_submit(text, text, text, text, text, text[], text, text, text) from public;
grant execute on function public.ad_trial_interest_submit(text, text, text, text, text, text[], text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';

commit;
