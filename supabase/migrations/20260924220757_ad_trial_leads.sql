-- 潛在客戶與廣告試堂公開目錄：leads、意向行、班／堂控管欄、anon catalog／submit

begin;

-- ---------------------------------------------------------------------------
-- 控管欄（與舊生邀請分開；廣告預設不公開）
-- ---------------------------------------------------------------------------

alter table public.classes
  add column if not exists ad_trial_listed boolean not null default false;

comment on column public.classes.ad_trial_listed is
  '廣告試堂公開目錄：true＝此班可出現。預設 false，須職員逐班打開。';

alter table public.schedules
  add column if not exists ad_trial_excluded boolean not null default false;

comment on column public.schedules.ad_trial_excluded is
  '廣告試堂公開目錄：true＝此堂次不提供選取。預設 false。';

-- ---------------------------------------------------------------------------
-- 潛在客戶
-- ---------------------------------------------------------------------------

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  school text not null default '',
  grade text not null,
  phone text not null,
  phone_normalized text not null,
  note text,
  source text not null
    check (source in ('ad_trial', 'phone', 'front_desk', 'website', 'other')),
  status text not null default 'new'
    check (status in ('new', 'contacted', 'converted', 'closed')),
  elected_subject_codes text[] not null default '{}',
  converted_student_id uuid references public.students (id) on delete set null,
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_grade_code_chk check (
    grade in ('P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6')
  )
);

create index if not exists leads_status_created_idx
  on public.leads (status, created_at desc);
create index if not exists leads_source_created_idx
  on public.leads (source, created_at desc);
create index if not exists leads_phone_source_created_idx
  on public.leads (phone_normalized, source, created_at desc);
create index if not exists leads_converted_student_id_idx
  on public.leads (converted_student_id)
  where converted_student_id is not null;

comment on table public.leads is
  '潛在客戶：廣告試堂、來電、前台等尚未建學生主檔的登記。anon 不可直讀。';

create table if not exists public.lead_trial_intentions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  class_id uuid references public.classes (id) on delete set null,
  schedule_id uuid references public.schedules (id) on delete set null,
  class_label text not null default '',
  scheduled_date date,
  start_time time,
  end_time time,
  created_at timestamptz not null default now()
);

create unique index if not exists lead_trial_intentions_lead_class_uidx
  on public.lead_trial_intentions (lead_id, class_id)
  where class_id is not null;

create index if not exists lead_trial_intentions_lead_id_idx
  on public.lead_trial_intentions (lead_id);
create index if not exists lead_trial_intentions_schedule_id_idx
  on public.lead_trial_intentions (schedule_id)
  where schedule_id is not null;

comment on table public.lead_trial_intentions is
  '潛在客戶想試堂次快照。不建學生、不建試堂、不佔堂。';

create or replace function public.leads_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
before update on public.leads
for each row
execute function public.leads_set_updated_at();

alter table public.leads enable row level security;
alter table public.lead_trial_intentions enable row level security;

drop policy if exists rls_cap_all_leads on public.leads;
create policy rls_cap_all_leads
on public.leads
for all
to authenticated
using (public.is_mgmt_staff() and private.has_capability('students.enroll'))
with check (public.is_mgmt_staff() and private.has_capability('students.enroll'));

drop policy if exists rls_cap_all_lead_trial_intentions on public.lead_trial_intentions;
create policy rls_cap_all_lead_trial_intentions
on public.lead_trial_intentions
for all
to authenticated
using (public.is_mgmt_staff() and private.has_capability('students.enroll'))
with check (public.is_mgmt_staff() and private.has_capability('students.enroll'));

revoke all on table public.leads from public, anon;
revoke all on table public.lead_trial_intentions from public, anon;
grant select, insert, update, delete on table public.leads to authenticated;
grant select, insert, update, delete on table public.lead_trial_intentions to authenticated;

-- ---------------------------------------------------------------------------
-- 目錄輔助（不授予 anon；只供 security definer RPC 呼叫）
-- ---------------------------------------------------------------------------

create or replace function public.ad_trial_normalize_grade(p_raw text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  code text;
  lbl text;
begin
  code := public.courses_normalize_grade_code(p_raw);
  if code in ('P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6') then
    return code;
  end if;
  lbl := public.normalize_class_grade_label(p_raw);
  return case lbl
    when '小一' then 'P1'
    when '小二' then 'P2'
    when '小三' then 'P3'
    when '小四' then 'P4'
    when '小五' then 'P5'
    when '小六' then 'P6'
    when '中一' then 'S1'
    when '中二' then 'S2'
    when '中三' then 'S3'
    when '中四' then 'S4'
    when '中五' then 'S5'
    when '中六' then 'S6'
    else null
  end;
end;
$$;

comment on function public.ad_trial_normalize_grade(text) is
  '廣告試堂：年級字串正規成 P1–S6；無法辨識回傳 null。';

create or replace function public.ad_trial_normalize_phone(p_raw text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  digits text;
begin
  digits := regexp_replace(coalesce(p_raw, ''), '\D', '', 'g');
  if digits ~ '^852[0-9]{8}$' then
    digits := substring(digits from 4);
  end if;
  if digits ~ '^[0-9]{8}$' then
    return digits;
  end if;
  return null;
end;
$$;

comment on function public.ad_trial_normalize_phone(text) is
  '廣告試堂：電話留 8 位數字；852 國碼會去掉。無法辨識回傳 null。';

create or replace function public.ad_trial_class_matches_grade(
  p_class_id uuid,
  p_grade text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.classes c
    left join public.courses co on co.id = c.course_id
    cross join lateral (
      select public.grade_code_to_label(p_grade) as lbl
    ) g
    where c.id = p_class_id
      and g.lbl is not null
      and c.class_kind in ('group', 'homework')
      and (
        exists (
          select 1
          from unnest(coalesce(c.grade, '{}'::text[])) gr
          where public.normalize_class_grade_label(gr) = g.lbl
             or gr = g.lbl
             or gr like g.lbl || '%'
        )
        or public.grade_code_to_label(co.grade_code) = g.lbl
        or (
          p_grade is not null
          and p_grade = any (coalesce(co.eligible_grade_codes, array[co.grade_code]::text[]))
        )
      )
  );
$$;

create or replace function public.ad_trial_class_under_enrolled_cap(p_class_id uuid)
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

comment on function public.ad_trial_class_under_enrolled_cap(uuid) is
  '廣告試堂公開目錄：就讀中人數 ≤ 5 才顯示。不含試堂人頭。';

create or replace function public.ad_trial_catalog_allows_class(p_class_id uuid)
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
      and c.class_kind in ('group', 'homework')
      and coalesce(c.status, '') not ilike '%已結束%'
      and c.ad_trial_listed
      and public.ad_trial_class_under_enrolled_cap(c.id)
  );
$$;

comment on function public.ad_trial_catalog_allows_class(uuid) is
  '廣告試堂：目前學年、專科或功輔、未結束、已納入廣告目錄、就讀中 ≤ 5。';

create or replace function public.ad_trial_schedule_open(p_schedule_id uuid)
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
      and coalesce(sch.ad_trial_excluded, false) = false
  );
$$;

comment on function public.ad_trial_schedule_open(uuid) is
  '廣告試堂公開目錄：未來、未取消、未剔除。不以他生試堂佔位。';

revoke all on function public.ad_trial_normalize_grade(text) from public, anon, authenticated;
revoke all on function public.ad_trial_normalize_phone(text) from public, anon, authenticated;
revoke all on function public.ad_trial_class_matches_grade(uuid, text) from public, anon, authenticated;
revoke all on function public.ad_trial_class_under_enrolled_cap(uuid) from public, anon, authenticated;
revoke all on function public.ad_trial_catalog_allows_class(uuid) from public, anon, authenticated;
revoke all on function public.ad_trial_schedule_open(uuid) from public, anon, authenticated;
revoke all on function public.leads_set_updated_at() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- anon：目錄
-- ---------------------------------------------------------------------------

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

comment on function public.ad_trial_catalog_get(text) is
  '廣告試堂公開目錄。不回就讀人數或同學姓名。不以邀請試堂佔位。';

revoke all on function public.ad_trial_catalog_get(text) from public;
grant execute on function public.ad_trial_catalog_get(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- anon：提交（只寫 leads；蜜罐與 24 小時同電話去重皆回 accepted）
-- ---------------------------------------------------------------------------

create or replace function public.ad_trial_submit(
  p_full_name text,
  p_school text,
  p_grade text,
  p_phone text,
  p_note text default null,
  p_lines jsonb default '[]'::jsonb,
  p_elected_subject_codes text[] default null,
  p_company text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grade text;
  v_phone text;
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
  if v_phone is null then
    raise exception '請填寫 8 位聯絡電話';
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

  if exists (
    select 1
    from public.leads l
    where l.phone_normalized = v_phone
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
    full_name,
    school,
    grade,
    phone,
    phone_normalized,
    note,
    source,
    status,
    elected_subject_codes
  ) values (
    v_name,
    v_school,
    v_grade,
    v_phone,
    v_phone,
    v_note,
    'ad_trial',
    'new',
    coalesce(v_elected, '{}'::text[])
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
      select 1
      from public.schedules sch
      where sch.id = v_schedule_id
        and sch.class_id = v_class_id
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
      coalesce(
        nullif(btrim(co.course_name), ''),
        nullif(btrim(c.subject), ''),
        nullif(btrim(c.course_code_full), ''),
        '班別'
      ),
      sch.scheduled_date,
      sch.start_time,
      sch.end_time
    into v_label, v_date, v_start, v_end
    from public.schedules sch
    join public.classes c on c.id = sch.class_id
    left join public.courses co on co.id = c.course_id
    where sch.id = v_schedule_id;

    insert into public.lead_trial_intentions (
      lead_id,
      class_id,
      schedule_id,
      class_label,
      scheduled_date,
      start_time,
      end_time
    ) values (
      v_lead_id,
      v_class_id,
      v_schedule_id,
      v_label,
      v_date,
      v_start,
      v_end
    );
    v_count := v_count + 1;
  end loop;

  if v_count < 1 then
    raise exception '請至少選一堂';
  end if;

  return jsonb_build_object('accepted', true);
end;
$$;

comment on function public.ad_trial_submit(text, text, text, text, text, jsonb, text[], text) is
  '廣告試堂公開提交：只寫潛在客戶與想試堂次。p_company 為蜜罐。24 小時內同電話不重複寫入。不回 lead id。';

revoke all on function public.ad_trial_submit(text, text, text, text, text, jsonb, text[], text) from public;
grant execute on function public.ad_trial_submit(text, text, text, text, text, jsonb, text[], text) to anon, authenticated;

notify pgrst, 'reload schema';

commit;
