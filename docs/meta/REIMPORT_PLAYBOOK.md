# Re-import Playbook (Current Schema)

## Goal
- Rebuild all key data using current schema and constraints.
- Preserve explicit IDs from import sources.
- Ensure class code uses current fields: `course_id`, `section_code`, `course_code_full`.

## Files
- `supabase/import/00_reset_for_rebuild.sql`
- `supabase/import/10_create_staging_tables.sql`
- `supabase/import/20_transform_to_current_schema.sql`
- `supabase/import/32_preflight_fk_checks.sql`
- `supabase/import/34_seed_weekday_aliases.sql`
- `supabase/import/35_rebuild_schedules_from_classes.sql`
- `supabase/import/11_create_reject_tables.sql`
- `supabase/import/40_fk_safe_load_from_staging.sql`
- `supabase/import/41_reject_report.sql`
- `supabase/import/30_validate_counts_and_conflicts.sql`

## Procedure
1. Run `00_reset_for_rebuild.sql`.
2. Run `10_create_staging_tables.sql`.
3. Import CSVs into `staging.*` tables using Supabase Table Editor (Import data):
   - `staging.students_import`
   - `staging.classes_import`
   - `staging.enrollments_import`
   - `staging.schedules_import`
   - `staging.attendance_import`
4. Run `20_transform_to_current_schema.sql`.
5. Run `34_seed_weekday_aliases.sql`.
6. Run `32_preflight_fk_checks.sql`.
7. Run `35_rebuild_schedules_from_classes.sql`.
8. Run `11_create_reject_tables.sql`.
9. (Optional, only if you imported staging enroll/schedule/attendance CSV) Run `40_fk_safe_load_from_staging.sql`.
10. (Optional) Run `41_reject_report.sql` to inspect dropped rows.
11. Run `30_validate_counts_and_conflicts.sql`.

## Required CSV columns

### `staging.students_import`
- `id`, `student_code`, `full_name`, `english_name`, `grade`, `school`, `status`, `registration_status`, `enrollment_status`, `academic_stage`

### `staging.classes_import`
- `class_id`, `academic_year_label`, `subject_name`, `grade_code`, `course_seq`, `section_code`, `day_of_week`, `time_slot`, `teacher_id`, `classroom_id`, `capacity`, `price_per_lesson`, `start_date`, `end_date`, `status`

### `staging.enrollments_import`
- `student_id`, `class_id`, `status`, `enroll_date`, `remarks`

### `staging.schedules_import`
- `class_id`, `teacher_id`, `classroom_id`, `scheduled_date`, `start_time`, `end_time`, `status`, `remarks`

### `staging.attendance_import`
- `student_id`, `class_id`, `attendance_date`, `status`, `remarks`

## Notes
- `classes.grade` currently stores `grade_code` as single-element array (for compatibility).
- `course_code_full` is generated during transform.
- If validation shows duplicate `student_code` or `course_code_full`, fix staging CSV and rerun reset -> transform.
- For FK safety, this playbook does not replay legacy remapped schedule/attendance SQL.
- FK-safe staging loader writes invalid rows into `staging.rejected_*` instead of throwing FK errors.
