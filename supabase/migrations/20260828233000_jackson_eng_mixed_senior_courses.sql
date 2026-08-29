-- 課程模板可接受多個年級（編號年級仍寫入 course_code_base）。
-- Jackson Lau 2627 兩班英文：ENGS4001-B → ENGS4004-B、ENGS5001-B → ENGS5004-B，
-- 接受中四／中五／中六。Cyndi 的 ENGS4001-A／ENGS5001-A 不變。

begin;

alter table public.courses
  add column if not exists eligible_grade_codes text[];

comment on column public.courses.eligible_grade_codes is
  '報讀／畫面接受年級（S1 等）。編號年級 grade_code 仍只一個、寫入課程模板碼；專科班通常等於 grade_code，高中混級英文等可為 S4+S5+S6。';

update public.courses
set eligible_grade_codes = array[grade_code]::text[]
where eligible_grade_codes is null
   or cardinality(eligible_grade_codes) = 0;

alter table public.courses
  alter column eligible_grade_codes set default array[]::text[];

alter table public.courses
  alter column eligible_grade_codes set not null;

alter table public.courses
  drop constraint if exists courses_eligible_grade_codes_check;

alter table public.courses
  add constraint courses_eligible_grade_codes_check
  check (
    cardinality(eligible_grade_codes) >= 1
    and eligible_grade_codes <@ array['P1','P2','P3','P4','P5','P6','S1','S2','S3','S4','S5','S6']::text[]
    and grade_code = any (eligible_grade_codes)
  );

create or replace function public.grade_codes_to_class_labels(p_codes text[])
returns text[]
language sql
immutable
as $$
  select coalesce(
    array(
      select public.grade_code_to_label(c.code)
      from unnest(
        array['P1','P2','P3','P4','P5','P6','S1','S2','S3','S4','S5','S6']::text[]
      ) with ordinality as c(code, ord)
      where c.code = any (coalesce(p_codes, array[]::text[]))
        and public.grade_code_to_label(c.code) is not null
      order by c.ord
    ),
    array[]::text[]
  );
$$;

comment on function public.grade_codes_to_class_labels(text[]) is
  '課程 eligible_grade_codes → classes.grade 中文標籤（小一–中六，固定順序）';

grant execute on function public.grade_codes_to_class_labels(text[]) to authenticated;

create or replace function public.courses_normalize_eligible_grade_codes()
returns trigger
language plpgsql
as $$
declare
  normalized text[] := array[]::text[];
  raw text;
  g text;
begin
  new.grade_code := public.courses_normalize_grade_code(new.grade_code);

  if new.eligible_grade_codes is not null then
    foreach raw in array new.eligible_grade_codes loop
      g := public.courses_normalize_grade_code(raw);
      if g ~ '^[PS][1-6]$' and not (g = any (normalized)) then
        normalized := array_append(normalized, g);
      end if;
    end loop;
  end if;

  if new.grade_code is not null
     and new.grade_code ~ '^[PS][1-6]$'
     and not (new.grade_code = any (normalized)) then
    normalized := array_prepend(new.grade_code, normalized);
  end if;

  if cardinality(normalized) = 0 and new.grade_code is not null then
    normalized := array[new.grade_code]::text[];
  end if;

  new.eligible_grade_codes := normalized;
  return new;
end;
$$;

drop trigger if exists trg_courses_normalize_eligible_grades on public.courses;

create trigger trg_courses_normalize_eligible_grades
before insert or update of grade_code, eligible_grade_codes
on public.courses
for each row
execute function public.courses_normalize_eligible_grade_codes();

-- ENGS4004 / ENGS5004：複製 ENGS4001 / ENGS5001 學費；接受 S4–S6
insert into public.courses (
  subject_id,
  grade_code,
  course_seq,
  course_code_base,
  course_name,
  course_mode,
  price_per_lesson,
  price_per_lesson_period_2,
  price_per_lesson_both_periods,
  eligible_grade_codes
)
select
  s.id,
  v.grade_code,
  v.course_seq,
  v.course_code_base,
  '高中常規英文班（中四至中六）',
  coalesce(src.course_mode, 'regular'),
  src.price_per_lesson,
  src.price_per_lesson_period_2,
  src.price_per_lesson_both_periods,
  array['S4', 'S5', 'S6']::text[]
from (
  values
    ('ENGS4004', 'S4', 4, 'ENGS4001'),
    ('ENGS5004', 'S5', 4, 'ENGS5001')
) as v(course_code_base, grade_code, course_seq, src_code)
join public.subjects s on s.code = 'ENG'
left join public.courses src on src.course_code_base = v.src_code
on conflict (subject_id, grade_code, course_seq) do update
set
  course_code_base = excluded.course_code_base,
  course_name = excluded.course_name,
  eligible_grade_codes = excluded.eligible_grade_codes,
  price_per_lesson = coalesce(public.courses.price_per_lesson, excluded.price_per_lesson),
  price_per_lesson_period_2 = coalesce(public.courses.price_per_lesson_period_2, excluded.price_per_lesson_period_2),
  price_per_lesson_both_periods = coalesce(public.courses.price_per_lesson_both_periods, excluded.price_per_lesson_both_periods),
  updated_at = now();

-- Jackson 2627 兩班改掛新模板；排程經 class_id，不必逐堂改 course_code
update public.classes c
set
  course_id = n.id,
  course_code_full = v.new_full,
  grade = public.grade_codes_to_class_labels(n.eligible_grade_codes),
  updated_at = now()
from (
  values
    ('2627-ENGS4001-B', '2627-ENGS4004-B', 'ENGS4004'),
    ('2627-ENGS5001-B', '2627-ENGS5004-B', 'ENGS5004')
) as v(old_full, new_full, new_base)
join public.courses n on n.course_code_base = v.new_base
join public.academic_years ay on ay.label = '2627'
where c.course_code_full = v.old_full
  and c.academic_year_id = ay.id;

commit;
