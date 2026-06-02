-- Fix: prior realign migration left courses.academic_year_id NOT NULL.
-- Courses are year-agnostic templates; academic year belongs on classes.

begin;

alter table public.courses
  drop constraint if exists courses_academic_year_id_fkey;

alter table public.courses
  drop column if exists academic_year_id;

commit;
