-- students.grade: 標準年級碼 P1–P6（小學）、S1–S6（中學）、GD（已畢業）、NA（不適用）
-- 先正規化既有資料，再加 CHECK，避免 23514

begin;

create or replace function public.normalize_student_grade(raw text)
returns text
language plpgsql
immutable
as $$
declare
  t text;
  src text;
begin
  src := trim(coalesce(raw, ''));
  if src = '' then
    return null;
  end if;

  t := upper(src);

  if t in (
    'P1','P2','P3','P4','P5','P6',
    'S1','S2','S3','S4','S5','S6',
    'GD','NA'
  ) then
    return t;
  end if;

  -- 舊課程代碼 F1–F6 → S1–S6
  if t ~ '^F[1-6]$' then
    return 'S' || substring(t from 2);
  end if;

  return case src
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
    when '已畢業' then 'GD'
    when '畢業' then 'GD'
    when '不適用' then 'NA'
    when 'N/A' then 'NA'
    when '—' then null
    when '-' then null
    else null
  end;
end;
$$;

comment on column public.students.grade is
  '年級碼：P1–P6 小學、S1–S6 中學、GD 已畢業、NA 不適用';

-- 正規化既有 grade（無法辨識的改為 NULL）
update public.students
set grade = public.normalize_student_grade(grade)
where grade is not null;

alter table public.students
  drop constraint if exists students_grade_check;

alter table public.students
  add constraint students_grade_check
  check (
    grade is null
    or grade in (
      'P1','P2','P3','P4','P5','P6',
      'S1','S2','S3','S4','S5','S6',
      'GD','NA'
    )
  );

commit;
