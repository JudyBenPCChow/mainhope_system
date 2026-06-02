-- Full rebuild reset (PRODUCTION ONLY WITH MANUAL CONFIRMATION)
-- Keep: teachers, app_users
-- Rebuild: students + class-related transactional data

begin;

-- 1) Clear transactional data first
truncate table
  public.classroom_booking_requests,
  public.trial_sessions,
  public.leave_makeup_records,
  public.attendance_details,
  public.payment_details,
  public.payments,
  public.student_class_enrollments,
  public.schedules,
  public.enrollment_change_events
restart identity;

-- 2) Clear class structure
truncate table
  public.classes,
  public.courses
restart identity cascade;

-- 3) Rebuild students too (requested full re-import)
truncate table public.students restart identity cascade;

-- 4) Keep subjects dictionary and current year anchor
-- 科目字典標準（23 科）。匯入比對：name_zh 或 short_name 與 subject_name 一致即可。
insert into public.subjects (code, name_zh, short_name)
values
  ('CHI',  '中國語文', '中文'),
  ('ENG',  '英國語文', '英文'),
  ('MATH', '數學（必修部份）', '數學'),
  ('SCI',  '綜合科學', '科學'),
  ('CHIS', '中國歷史', '中史'),
  ('HIST', '歷史', '歷史'),
  ('GEOG', '地理', '地理'),
  ('ECON', '經濟', '經濟'),
  ('CLIT', '中國文學', '文學'),
  ('THS',  '旅遊與款待', '旅款'),
  ('PHY',  '物理', '物理'),
  ('CHEM', '化學', '化學'),
  ('BIO',  '生物', '生物'),
  ('ICT',  '資訊及通訊科技 (ICT)', 'ICT'),
  ('DAT',  '設計與應用科技', '設計'),
  ('BAFS', '企業、會計與財務概論', '企會財'),
  ('VA',   '視覺藝術', '視藝'),
  ('MUS',  '音樂', '音樂'),
  ('PE',   '體育', '體育'),
  ('HMSC', '健康管理與社會關懷', '健管'),
  ('M1',   '數學延伸部分（單元一 M1）', 'M1'),
  ('M2',   '數學延伸部分（單元二 M2）', 'M2'),
  ('HWK',  '功課輔導', '功輔')
on conflict (code) do update
  set name_zh = excluded.name_zh,
      short_name = excluded.short_name,
      updated_at = now();

-- 學年字典（見 migration 20260602170000 或 import/13_seed_academic_years.sql）
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

commit;
