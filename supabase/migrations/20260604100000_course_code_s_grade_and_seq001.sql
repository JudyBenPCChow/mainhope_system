-- Course template codes: secondary F1–F6 → S1–S6; seed 1001 → 001 (3-digit).

begin;

-- map_grade_code: 中一–中六 → S1–S6
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
  if m is null then
    return null;
  end if;
  if m[1] = '小' then
    return case m[2]
      when '一' then 'P1'
      when '二' then 'P2'
      when '三' then 'P3'
      when '四' then 'P4'
      when '五' then 'P5'
      when '六' then 'P6'
      else null
    end;
  end if;
  return case m[2]
    when '一' then 'S1'
    when '二' then 'S2'
    when '三' then 'S3'
    when '四' then 'S4'
    when '五' then 'S5'
    when '六' then 'S6'
    else null
  end;
end
$$;

alter table public.courses drop constraint if exists courses_seq_check;
alter table public.courses
  add constraint courses_seq_check check (course_seq between 1 and 999);

-- F* → S*
update public.courses
set grade_code = 'S' || substring(grade_code from 2),
    updated_at = now()
where grade_code ~ '^F[1-6]$';

-- legacy seed 1001+ → 001+
update public.courses
set course_seq = course_seq - 1000,
    updated_at = now()
where course_seq >= 1000;

-- recompute template codes
update public.courses c
set course_code_base = s.code || c.grade_code || lpad(c.course_seq::text, 3, '0'),
    updated_at = now()
from public.subjects s
where s.id = c.subject_id;

-- recompute class display codes (where linked)
update public.classes cls
set course_code_full = ay.label || '-' || s.code || crs.grade_code
    || lpad(crs.course_seq::text, 3, '0') || '-' || cls.section_code,
    updated_at = now()
from public.courses crs
join public.subjects s on s.id = crs.subject_id
join public.academic_years ay on ay.id = cls.academic_year_id
where cls.course_id = crs.id
  and cls.section_code is not null
  and cls.academic_year_id is not null;

commit;
