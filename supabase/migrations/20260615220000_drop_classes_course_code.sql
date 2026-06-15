-- Remove legacy classes.course_code (superseded by course_code_full + course_id).

alter table public.classes drop column if exists course_code;
