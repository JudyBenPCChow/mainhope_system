-- Realign model:
-- courses: subject + grade + course_seq + price (no academic year)
-- classes: bind one course to one academic year (+ teacher/classroom/schedule metadata)

begin;

alter table public.courses
  add column if not exists price_per_lesson numeric;

alter table public.classes
  add column if not exists academic_year_id uuid references public.academic_years (id) on delete restrict;

-- Backfill course price from existing classes (if any)
with p as (
  select course_id, max(price_per_lesson) as price_per_lesson
  from public.classes
  where course_id is not null and price_per_lesson is not null
  group by course_id
)
update public.courses c
set price_per_lesson = p.price_per_lesson,
    updated_at = now()
from p
where c.id = p.course_id
  and c.price_per_lesson is null;

-- Backfill class academic year from old course.academic_year_id (if present)
update public.classes cls
set academic_year_id = c.academic_year_id
from public.courses c
where cls.course_id = c.id
  and cls.academic_year_id is null
  and c.academic_year_id is not null;

-- courses no longer keyed by academic year
alter table public.courses
  drop constraint if exists courses_unique_tuple;

alter table public.courses
  add constraint courses_unique_tuple_subject_grade_seq
  unique (subject_id, grade_code, course_seq);

-- classes keyed by academic year + course + section
drop index if exists classes_course_id_section_code_unique_idx;
create unique index if not exists classes_ay_course_section_unique_idx
  on public.classes (academic_year_id, course_id, section_code)
  where academic_year_id is not null and course_id is not null and section_code is not null;

comment on column public.courses.academic_year_id is
  'Deprecated: academic year moved to classes.academic_year_id';
comment on column public.courses.price_per_lesson is
  '課程模板學費（可跨學年重用）';
comment on column public.classes.academic_year_id is
  '開班實例所屬學年';

commit;

