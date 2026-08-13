# Re-import Quick Path (No CSV Staging)

This path avoids manual CSV import. It reuses existing SQL files in `import-output`.

## Run Order (FK-safe)

1. Reset target tables:
   - `supabase/import/00_reset_for_rebuild.sql`
2. Import core data (single ID lineage):
   - `import-output/2526_import.sql`
   - `import-output/one_on_one_classes_insert.sql`
   - `import-output/residual_classes_insert.sql`
3. Backfill current schema class structure:
   - `supabase/import/25_backfill_course_fields_after_legacy_import.sql`
4. Seed weekday alias dictionary:
   - `supabase/import/34_seed_weekday_aliases.sql`
5. Run preflight checks:
   - `supabase/import/32_preflight_fk_checks.sql`
6. Rebuild schedules from current `classes` metadata:
   - `supabase/import/35_rebuild_schedules_from_classes.sql`
7. Validate:
   - `supabase/import/30_validate_counts_and_conflicts.sql`

## Notes

- Run files one by one in Supabase SQL Editor.
- If one step fails, stop and fix before proceeding.
- Do not run legacy/remapped `2526_enrollments_insert.sql`, `2526_schedules_insert.sql`, or `2526_attendance_insert.sql` in this path.
- This path avoids legacy FK mismatch and rebuilds schedules deterministically from existing classes.
- After backfill, class display code comes from:
  - `classes.course_id`
  - `classes.section_code`
  - `classes.course_code_full`
