-- 廣告公開表單防護：IP／全域限速、事件紀錄；submit 改僅 service_role（經 Edge Function）
-- 接在 20260925140000（phone_country_code）之後。

begin;

create table if not exists public.ad_public_rate_events (
  id bigint generated always as identity primary key,
  kind text not null
    check (kind in ('catalog', 'submit', 'submit_accepted')),
  client_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists ad_public_rate_events_kind_client_created_idx
  on public.ad_public_rate_events (kind, client_key, created_at desc);

create index if not exists ad_public_rate_events_created_idx
  on public.ad_public_rate_events (created_at desc);

comment on table public.ad_public_rate_events is
  '廣告公開頁限速與監控事件。anon 不可直讀。';

alter table public.ad_public_rate_events enable row level security;

revoke all on table public.ad_public_rate_events from public, anon, authenticated;

create or replace function public.ad_public_client_key()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  headers_raw text;
  headers jsonb;
  ip text;
begin
  begin
    headers_raw := current_setting('request.headers', true);
  exception when others then
    headers_raw := null;
  end;
  if headers_raw is null or btrim(headers_raw) = '' then
    return 'unknown';
  end if;
  begin
    headers := headers_raw::jsonb;
  exception when others then
    return 'unknown';
  end;
  ip := nullif(btrim(coalesce(
    headers->>'cf-connecting-ip',
    headers->>'x-real-ip',
    split_part(coalesce(headers->>'x-forwarded-for', ''), ',', 1)
  )), '');
  if ip is null then
    return 'unknown';
  end if;
  if char_length(ip) > 80 then
    ip := left(ip, 80);
  end if;
  return lower(ip);
end;
$$;

create or replace function public.ad_public_assert_rate_limit(
  p_kind text,
  p_client_key text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kind text := btrim(lower(coalesce(p_kind, '')));
  v_key text := nullif(btrim(lower(coalesce(p_client_key, ''))), '');
  v_hour int;
  v_minute int;
  v_global_hour int;
  v_max_hour int;
  v_max_minute int;
begin
  if v_kind not in ('catalog', 'submit') then
    raise exception '無效的限速種類';
  end if;

  if v_key is null then
    v_key := public.ad_public_client_key();
  elsif char_length(v_key) > 80 then
    v_key := left(v_key, 80);
  end if;

  if v_kind = 'catalog' then
    v_max_hour := case when v_key = 'unknown' then 40 else 120 end;
    v_max_minute := case when v_key = 'unknown' then 12 else 30 end;
  else
    v_max_hour := case when v_key = 'unknown' then 4 else 12 end;
    v_max_minute := case when v_key = 'unknown' then 2 else 4 end;
  end if;

  select count(*)::int into v_minute
  from public.ad_public_rate_events e
  where e.kind = v_kind
    and e.client_key = v_key
    and e.created_at > now() - interval '1 minute';

  if v_minute >= v_max_minute then
    raise exception '請求過於頻繁，請稍後再試';
  end if;

  select count(*)::int into v_hour
  from public.ad_public_rate_events e
  where e.kind = v_kind
    and e.client_key = v_key
    and e.created_at > now() - interval '1 hour';

  if v_hour >= v_max_hour then
    raise exception '請求過於頻繁，請稍後再試';
  end if;

  if v_kind = 'submit' then
    select count(*)::int into v_global_hour
    from public.ad_public_rate_events e
    where e.kind = 'submit_accepted'
      and e.created_at > now() - interval '1 hour';
    if v_global_hour >= 200 then
      raise exception '系統繁忙，請稍後再試';
    end if;
  end if;

  insert into public.ad_public_rate_events (kind, client_key)
  values (v_kind, v_key);
end;
$$;

create or replace function public.ad_public_mark_submit_accepted(p_client_key text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := nullif(btrim(lower(coalesce(p_client_key, ''))), '');
begin
  if v_key is null then
    v_key := public.ad_public_client_key();
  elsif char_length(v_key) > 80 then
    v_key := left(v_key, 80);
  end if;
  insert into public.ad_public_rate_events (kind, client_key)
  values ('submit_accepted', v_key);
end;
$$;

create or replace function public.ad_public_abuse_stats(p_hours int default 24)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_hours int := greatest(1, least(coalesce(p_hours, 24), 168));
begin
  if not (public.is_mgmt_staff() and private.has_capability('students.enroll')) then
    raise exception '無權限';
  end if;
  return jsonb_build_object(
    'window_hours', v_hours,
    'catalog', (
      select count(*)::int from public.ad_public_rate_events
      where kind = 'catalog' and created_at > now() - make_interval(hours => v_hours)
    ),
    'submit_attempts', (
      select count(*)::int from public.ad_public_rate_events
      where kind = 'submit' and created_at > now() - make_interval(hours => v_hours)
    ),
    'submit_accepted', (
      select count(*)::int from public.ad_public_rate_events
      where kind = 'submit_accepted' and created_at > now() - make_interval(hours => v_hours)
    ),
    'leads_ad_trial', (
      select count(*)::int from public.leads
      where source = 'ad_trial' and created_at > now() - make_interval(hours => v_hours)
    ),
    'top_submit_clients', coalesce((
      select jsonb_agg(jsonb_build_object('client_key', client_key, 'n', n) order by n desc)
      from (
        select client_key, count(*)::int as n
        from public.ad_public_rate_events
        where kind = 'submit' and created_at > now() - make_interval(hours => v_hours)
        group by client_key
        order by count(*) desc
        limit 10
      ) t
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.ad_public_client_key() from public, anon, authenticated;
revoke all on function public.ad_public_assert_rate_limit(text, text) from public, anon, authenticated;
revoke all on function public.ad_public_mark_submit_accepted(text) from public, anon, authenticated;
revoke all on function public.ad_public_abuse_stats(int) from public, anon;
grant execute on function public.ad_public_abuse_stats(int) to authenticated;


-- catalog：開頭加限速（本體與既有相同）
create or replace function public.ad_trial_catalog_get(p_grade text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_grade text;
  v_needs_electives boolean := false;
  v_electives jsonb := '[]'::jsonb;
  v_classes jsonb := '[]'::jsonb;
begin
  perform public.ad_public_assert_rate_limit('catalog');

  v_grade := public.ad_trial_normalize_grade(p_grade);
  v_needs_electives := v_grade in ('S4', 'S5', 'S6');

  if v_grade is null then
    return jsonb_build_object(
      'grade', '',
      'requires_elective_survey', false,
      'elective_subject_options', '[]'::jsonb,
      'classes', '[]'::jsonb
    );
  end if;

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
      where public.ad_trial_catalog_allows_class(c.id)
        and public.ad_trial_class_matches_grade(c.id, v_grade)
        and c.class_kind = 'group'
        and subj.category = 'senior_elective'
        and coalesce(btrim(subj.code), '') <> ''
        and exists (
          select 1
          from public.schedules sx
          where sx.class_id = c.id
            and public.ad_trial_schedule_open(sx.id)
        )
    ) offered on offered.code = upper(btrim(sub.code))
    where sub.category = 'senior_elective'
      and coalesce(sub.is_active, true);
  end if;

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
            and public.ad_trial_schedule_open(s1.id)
          order by s1.scheduled_date, s1.start_time, s1.session_number nulls last
          limit 12
        ) s2
      ), '[]'::jsonb)
    ) as cls_row
    from public.classes c
    left join public.courses co on co.id = c.course_id
    left join public.subjects subj on subj.id = co.subject_id
    left join public.teachers t on t.id = c.teacher_id
    where public.ad_trial_catalog_allows_class(c.id)
      and public.ad_trial_class_matches_grade(c.id, v_grade)
      and exists (
        select 1
        from public.schedules sx
        where sx.class_id = c.id
          and public.ad_trial_schedule_open(sx.id)
      )
  ) q;

  return jsonb_build_object(
    'grade', v_grade,
    'requires_elective_survey', v_needs_electives,
    'elective_subject_options', coalesce(v_electives, '[]'::jsonb),
    'classes', coalesce(v_classes, '[]'::jsonb)
  );
end;
$$;

drop function if exists public.ad_trial_submit(text, text, text, text, text, jsonb, text[], text, text, text, text);

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
    full_name, school, grade, phone, phone_normalized, phone_country_code, note, source, status,
    elected_subject_codes, contact_method, wechat_id
  ) values (
    v_name, v_school, v_grade, v_phone, v_phone, v_cc, v_note, 'ad_trial', 'new',
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

  perform public.ad_public_mark_submit_accepted(v_rate_key);
  return jsonb_build_object('accepted', true);
end;
$$;

drop function if exists public.ad_trial_interest_submit(text, text, text, text, text, text[], text, text, text, text);

create or replace function public.ad_trial_interest_submit(
  p_full_name text,
  p_school text,
  p_grade text,
  p_phone text,
  p_note text default null,
  p_subjects text[] default null,
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
  v_subjects text[] := '{}'::text[];
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
      and l.phone_country_code = v_cc
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
    full_name, school, grade, phone, phone_normalized, phone_country_code, note, source, status,
    interested_subjects, contact_method, wechat_id
  ) values (
    v_name, v_school, v_grade, v_phone, v_phone, v_cc, v_note, 'ad_trial', 'new',
    v_subjects, v_method, v_wechat
  );

  perform public.ad_public_mark_submit_accepted(v_rate_key);
  return jsonb_build_object('accepted', true);
end;
$$;

revoke all on function public.ad_trial_submit(text, text, text, text, text, jsonb, text[], text, text, text, text, text)
  from public;
grant execute on function public.ad_trial_submit(text, text, text, text, text, jsonb, text[], text, text, text, text, text)
  to anon, authenticated, service_role;

revoke all on function public.ad_trial_interest_submit(text, text, text, text, text, text[], text, text, text, text, text)
  from public;
grant execute on function public.ad_trial_interest_submit(text, text, text, text, text, text[], text, text, text, text, text)
  to anon, authenticated, service_role;

-- 註：正式只走 Edge 後，另開 migration 撤銷 anon／authenticated 的 execute。

notify pgrst, 'reload schema';

commit;
