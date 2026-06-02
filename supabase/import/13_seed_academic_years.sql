-- 學年字典（18 筆）。需已執行 migration 20260602170000_academic_years_dictionary.sql
-- 可於 Supabase SQL Editor 單獨執行。

insert into public.academic_years (label, start_date, end_date, is_current)
values
  ('2425', date '2024-09-01', date '2025-06-30', false),
  ('25SM', date '2025-07-01', date '2025-08-31', false),
  ('2526', date '2025-09-01', date '2026-06-30', false),
  ('26SM', date '2026-07-01', date '2026-08-31', false),
  ('2627', date '2026-09-01', date '2027-06-30', false),
  ('27SM', date '2027-07-01', date '2027-08-31', false),
  ('2728', date '2027-09-01', date '2028-06-30', false),
  ('28SM', date '2028-07-01', date '2028-08-31', false),
  ('2829', date '2028-09-01', date '2029-06-30', false),
  ('29SM', date '2029-07-01', date '2029-08-31', false),
  ('2930', date '2029-09-01', date '2030-06-30', false),
  ('30SM', date '2030-07-01', date '2030-08-31', false),
  ('3031', date '2030-09-01', date '2031-06-30', false),
  ('31SM', date '2031-07-01', date '2031-08-31', false),
  ('3132', date '2031-09-01', date '2032-06-30', false),
  ('32SM', date '2032-07-01', date '2032-08-31', false),
  ('3233', date '2032-09-01', date '2033-06-30', false),
  ('33SM', date '2033-07-01', date '2033-08-31', false)
on conflict (label) do update
  set start_date = excluded.start_date,
      end_date = excluded.end_date,
      updated_at = now();

update public.academic_years set is_current = false;
update public.academic_years
set is_current = true, updated_at = now()
where current_date >= start_date and current_date <= end_date;
