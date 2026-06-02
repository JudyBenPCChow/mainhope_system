-- After legacy SQL import (classes inserted with old columns),
-- backfill new class structure fields:
--   courses, classes.course_id, classes.section_code, classes.course_code_full

begin;

create or replace function public.map_subject_code(name_zh text)
returns text
language plpgsql
immutable
as $$
declare
  s text := trim(coalesce(name_zh, ''));
begin
  if s = '' then return null; end if;
  if s ilike '%M1%' or s ilike '%單元一%' then return 'M1'; end if;
  if s ilike '%M2%' or s ilike '%單元二%' then return 'M2'; end if;
  if s ilike '%BAFS%' or s ilike '%企業%' or s ilike '%企會財%' or s ilike '%會計%' then return 'BAFS'; end if;
  if s ilike '%中國歷史%' or s ilike '%中史%' then return 'CHIS'; end if;
  if s ilike '%歷史%' then return 'HIST'; end if;
  if s ilike '%地理%' then return 'GEOG'; end if;
  if s ilike '%經濟%' then return 'ECON'; end if;
  if s ilike '%旅遊%' or s ilike '%款待%' then return 'THS'; end if;
  if s ilike '%設計與應用%' or s ilike '%應用科技%' then return 'DAT'; end if;
  if s ilike '%資訊%' or s ilike '%ICT%' or s ilike '%通訊%' then return 'ICT'; end if;
  if s ilike '%視覺藝術%' then return 'VA'; end if;
  if s ilike '%音樂%' then return 'MUS'; end if;
  if s ilike '%體育%' then return 'PE'; end if;
  if s ilike '%健康管理%' or s ilike '%社會關懷%' then return 'HMSC'; end if;
  if s ilike '%綜合科學%' then return 'SCI'; end if;
  if s ilike '%物理%' then return 'PHY'; end if;
  if s ilike '%化學%' then return 'CHEM'; end if;
  if s ilike '%生物%' then return 'BIO'; end if;
  if s ilike '%中國文學%' then return 'CLIT'; end if;
  if s ilike '%功課%' or s ilike '%輔導%' then return 'HWK'; end if;
  if s ilike '%數學%' then return 'MATH'; end if;
  if s ilike '%英國語文%' or s ilike '%英文%' or s ilike '%英語%' then return 'ENG'; end if;
  if s ilike '%中國語文%' or s ilike '%中文%' then return 'CHI'; end if;
  return null;
end
$$;

create or replace function public.map_grade_code(grades text[])
returns text
language plpgsql
immutable
as $$
declare
  raw text := array_to_string(coalesce(grades, array[]::text[]), ',');
  m text[];
begin
  m := regexp_match(raw, '(小|中)(一|二|三|四|五|六)');
  if m is null then return null; end if;
  if m[1] = '小' then
    return case m[2]
      when '一' then 'P1' when '二' then 'P2' when '三' then 'P3'
      when '四' then 'P4' when '五' then 'P5' when '六' then 'P6'
      else null end;
  end if;
  return case m[2]
    when '一' then 'F1' when '二' then 'F2' when '三' then 'F3'
    when '四' then 'F4' when '五' then 'F5' when '六' then 'F6'
    else null end;
end
$$;

create or replace function public.section_code_from_ord(n integer)
returns text
language sql
immutable
as $$
  select case
    when n <= 26 then chr(64 + n)
    else chr(64 + ((n - 1) % 26 + 1)) || ((n - 1) / 26 + 1)::text
  end
$$;

update public.classes
set course_id = null,
    section_code = null,
    course_code_full = null;

truncate table public.courses restart identity cascade;

insert into public.subjects (code, name_zh, short_name)
values
  ('CHI',  '中國語文', '中文'), ('ENG', '英國語文', '英文'), ('MATH', '數學（必修部份）', '數學'),
  ('SCI',  '綜合科學', '科學'), ('CHIS', '中國歷史', '中史'), ('HIST', '歷史', '歷史'),
  ('GEOG', '地理', '地理'), ('ECON', '經濟', '經濟'), ('CLIT', '中國文學', '文學'),
  ('THS',  '旅遊與款待', '旅款'), ('PHY', '物理', '物理'), ('CHEM', '化學', '化學'),
  ('BIO',  '生物', '生物'), ('ICT', '資訊及通訊科技 (ICT)', 'ICT'), ('DAT', '設計與應用科技', '設計'),
  ('BAFS', '企業、會計與財務概論', '企會財'), ('VA', '視覺藝術', '視藝'), ('MUS', '音樂', '音樂'),
  ('PE',   '體育', '體育'), ('HMSC', '健康管理與社會關懷', '健管'),
  ('M1',   '數學延伸部分（單元一 M1）', 'M1'), ('M2', '數學延伸部分（單元二 M2）', 'M2'),
  ('HWK',  '功課輔導', '功輔')
on conflict (code) do update
set name_zh = excluded.name_zh, short_name = excluded.short_name, updated_at = now();

with class_years as (
  select distinct
    case
      when c.start_date is null then
        (extract(year from now())::int - case when extract(month from now())::int >= 9 then 0 else 1 end)
      when extract(month from c.start_date)::int >= 9 then extract(year from c.start_date)::int
      else extract(year from c.start_date)::int - 1
    end as start_year
  from public.classes c
)
insert into public.academic_years (label, start_date, end_date, is_current)
select
  lpad((start_year % 100)::text, 2, '0') || lpad(((start_year + 1) % 100)::text, 2, '0'),
  make_date(start_year, 9, 1),
  make_date(start_year + 1, 8, 31),
  false
from class_years
on conflict (label) do update
set start_date = excluded.start_date,
    end_date = excluded.end_date,
    updated_at = now();

update public.academic_years
set is_current = (current_date >= start_date and current_date <= end_date);

with classes_normalized as (
  select
    c.id as class_id,
    case
      when c.start_date is null then
        (extract(year from now())::int - case when extract(month from now())::int >= 9 then 0 else 1 end)
      when extract(month from c.start_date)::int >= 9 then extract(year from c.start_date)::int
      else extract(year from c.start_date)::int - 1
    end as start_year,
    public.map_subject_code(c.subject) as subject_code,
    public.map_grade_code(c.grade) as grade_code,
    case
      when c.course_code ~ '([0-9]{4})$' then substring(c.course_code from '([0-9]{4})$')::int
      else 1001
    end as course_seq
  from public.classes c
),
valid_classes as (
  select * from classes_normalized where subject_code is not null and grade_code is not null
),
course_seed as (
  select distinct start_year, subject_code, grade_code, course_seq from valid_classes
)
insert into public.courses (subject_id, grade_code, course_seq, course_code_base)
select
  s.id,
  cs.grade_code,
  cs.course_seq,
  s.code || cs.grade_code || lpad(cs.course_seq::text, 4, '0')
from course_seed cs
join public.subjects s on s.code = cs.subject_code
on conflict (subject_id, grade_code, course_seq) do update
set course_code_base = excluded.course_code_base, updated_at = now();

with class_course as (
  select
    c.id as class_id,
    crs.id as course_id,
    ay.label as ay_label,
    sb.code as subject_code,
    crs.grade_code,
    crs.course_seq
  from public.classes c
  join public.courses crs on true
  join public.academic_years ay on true
  join public.subjects sb on sb.id = crs.subject_id
  where sb.code = public.map_subject_code(c.subject)
    and crs.grade_code = public.map_grade_code(c.grade)
    and crs.course_seq = case
      when c.course_code ~ '([0-9]{4})$' then substring(c.course_code from '([0-9]{4})$')::int
      else 1001
    end
    and ay.label = (
      lpad((
        (case
          when c.start_date is null then (extract(year from now())::int - case when extract(month from now())::int >= 9 then 0 else 1 end)
          when extract(month from c.start_date)::int >= 9 then extract(year from c.start_date)::int
          else extract(year from c.start_date)::int - 1
        end) % 100
      )::text, 2, '0')
      ||
      lpad((
        ((case
          when c.start_date is null then (extract(year from now())::int - case when extract(month from now())::int >= 9 then 0 else 1 end)
          when extract(month from c.start_date)::int >= 9 then extract(year from c.start_date)::int
          else extract(year from c.start_date)::int - 1
        end) + 1) % 100
      )::text, 2, '0')
    )
),
ranked as (
  select
    cc.*,
    row_number() over (partition by cc.course_id order by c.created_at, c.id) as ord
  from class_course cc
  join public.classes c on c.id = cc.class_id
)
update public.classes c
set
  course_id = r.course_id,
  academic_year_id = ay.id,
  section_code = public.section_code_from_ord(r.ord::integer),
  course_code_full = r.ay_label || '-' || r.subject_code || r.grade_code || lpad(r.course_seq::text, 4, '0') || '-' || public.section_code_from_ord(r.ord::integer),
  updated_at = now()
from ranked r
join public.academic_years ay on ay.label = r.ay_label
where c.id = r.class_id;

commit;
