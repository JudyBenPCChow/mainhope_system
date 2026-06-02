-- Auto-fill courses.course_code_base on insert/update when CSV omits it.
-- Format: {subject.code}{grade_code}{course_seq:3} e.g. BAFS + S4 + 001 → BAFSS4001

begin;

create or replace function public.courses_normalize_grade_code(grade text)
returns text
language sql
immutable
as $$
  select case
    when upper(trim(coalesce(grade, ''))) ~ '^F[1-6]$'
      then 'S' || substring(upper(trim(grade)) from 2)
    else upper(trim(coalesce(grade, '')))
  end;
$$;

create or replace function public.courses_build_code_base(
  p_subject_id uuid,
  p_grade_code text,
  p_course_seq integer
)
returns text
language plpgsql
stable
as $$
declare
  subj_code text;
  g text;
  seq integer;
begin
  select s.code into subj_code
  from public.subjects s
  where s.id = p_subject_id;

  if subj_code is null then
    raise exception 'courses_build_code_base: 找不到科目 subject_id=%', p_subject_id;
  end if;

  g := public.courses_normalize_grade_code(p_grade_code);
  if g is null or g = '' then
    raise exception 'courses_build_code_base: grade_code 不可為空';
  end if;

  seq := coalesce(p_course_seq, 1);
  if seq < 1 then seq := 1; end if;
  if seq > 999 then seq := 999; end if;

  return upper(subj_code) || g || lpad(seq::text, 3, '0');
end;
$$;

create or replace function public.courses_set_code_base_trigger()
returns trigger
language plpgsql
as $$
begin
  new.grade_code := public.courses_normalize_grade_code(new.grade_code);
  new.course_seq := least(greatest(coalesce(new.course_seq, 1), 1), 999);

  if new.course_code_base is null or trim(new.course_code_base) = '' then
    new.course_code_base := public.courses_build_code_base(
      new.subject_id,
      new.grade_code,
      new.course_seq
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_courses_set_code_base on public.courses;

create trigger trg_courses_set_code_base
before insert or update of subject_id, grade_code, course_seq, course_code_base
on public.courses
for each row
execute function public.courses_set_code_base_trigger();

comment on function public.courses_build_code_base(uuid, text, integer) is
  '課程模板碼：科目代碼+年級碼+三位種子（例 BAFSS4001）';

commit;
