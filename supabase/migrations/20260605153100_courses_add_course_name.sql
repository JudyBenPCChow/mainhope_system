-- Add a human-friendly course name to course templates.
-- Keep it nullable for backwards compatibility, with a lightweight backfill.

alter table public.courses
  add column if not exists course_name text;

update public.courses
set course_name = course_code_base
where course_name is null or btrim(course_name) = '';

