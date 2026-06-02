-- 學年字典：正規學年（2425）+ 暑期（25SM）
-- 正規：當年 9 月 1 日 ~ 翌年 6 月 30 日
-- 暑期：當年 7 月 1 日 ~ 8 月 31 日

alter table public.academic_years drop constraint if exists academic_years_label_check;

alter table public.academic_years add constraint academic_years_label_check
  check (label ~ '^(\d{4}|\d{2}SM)$');

comment on table public.academic_years is
  '學年／暑期字典。label：2425=24/9~25/6；25SM=25/7~25/8';

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

-- 依今日日期標記 is_current（僅一個區間應命中）
update public.academic_years set is_current = false;
update public.academic_years
set is_current = true, updated_at = now()
where current_date >= start_date and current_date <= end_date;
