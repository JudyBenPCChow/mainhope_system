-- 2526 排程 CSV → public.schedules
-- 來源: /Users/hoiyingfan/Downloads/私人和共用 2/【2526】排程 25973b60cb0280b4917cccc613542ebb_all.csv
-- 日期條件: 晚於 2026-04-15；已取消不匯入；classroom_id 一律 NULL
-- 共 534 筆 INSERT（略過已存在之同班同日同起迄時間）

BEGIN;

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-20'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND s.scheduled_date = '2026-04-20'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
);
-- line 39 中三級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-27'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND s.scheduled_date = '2026-04-27'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
);
-- line 40 中三級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-04'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND s.scheduled_date = '2026-05-04'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
);
-- line 41 中三級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-11'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND s.scheduled_date = '2026-05-11'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
);
-- line 42 中三級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-18'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND s.scheduled_date = '2026-05-18'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
);
-- line 43 中三級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-25'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND s.scheduled_date = '2026-05-25'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
);
-- line 44 中三級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-01'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND s.scheduled_date = '2026-06-01'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
);
-- line 45 中三級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-08'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND s.scheduled_date = '2026-06-08'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
);
-- line 46 中三級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-15'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND s.scheduled_date = '2026-06-15'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
);
-- line 47 中三級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-22'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND s.scheduled_date = '2026-06-22'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
);
-- line 48 中三級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-29'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND s.scheduled_date = '2026-06-29'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
);
-- line 49 中三級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-28'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid
    AND s.scheduled_date = '2026-04-28'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 80 中三級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-05'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid
    AND s.scheduled_date = '2026-05-05'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 81 中三級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-12'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid
    AND s.scheduled_date = '2026-05-12'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 82 中三級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-19'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid
    AND s.scheduled_date = '2026-05-19'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 83 中三級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-26'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid
    AND s.scheduled_date = '2026-05-26'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 84 中三級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-02'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid
    AND s.scheduled_date = '2026-06-02'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 85 中三級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-09'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid
    AND s.scheduled_date = '2026-06-09'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 86 中三級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-16'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid
    AND s.scheduled_date = '2026-06-16'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 87 中三級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-23'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid
    AND s.scheduled_date = '2026-06-23'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 88 中三級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-30'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid
    AND s.scheduled_date = '2026-06-30'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 89 中三級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-04-22'::date, '17:00', '18:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid
    AND s.scheduled_date = '2026-04-22'::date
    AND coalesce(s.start_time, '') = '17:00'
    AND coalesce(s.end_time, '') = '18:15'
);
-- line 118 中四級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-04-29'::date, '17:00', '18:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid
    AND s.scheduled_date = '2026-04-29'::date
    AND coalesce(s.start_time, '') = '17:00'
    AND coalesce(s.end_time, '') = '18:15'
);
-- line 119 中四級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-06'::date, '17:00', '18:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid
    AND s.scheduled_date = '2026-05-06'::date
    AND coalesce(s.start_time, '') = '17:00'
    AND coalesce(s.end_time, '') = '18:15'
);
-- line 120 中四級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-13'::date, '17:00', '18:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid
    AND s.scheduled_date = '2026-05-13'::date
    AND coalesce(s.start_time, '') = '17:00'
    AND coalesce(s.end_time, '') = '18:15'
);
-- line 121 中四級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-20'::date, '17:00', '18:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid
    AND s.scheduled_date = '2026-05-20'::date
    AND coalesce(s.start_time, '') = '17:00'
    AND coalesce(s.end_time, '') = '18:15'
);
-- line 122 中四級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-27'::date, '17:00', '18:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid
    AND s.scheduled_date = '2026-05-27'::date
    AND coalesce(s.start_time, '') = '17:00'
    AND coalesce(s.end_time, '') = '18:15'
);
-- line 123 中四級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-03'::date, '17:00', '18:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid
    AND s.scheduled_date = '2026-06-03'::date
    AND coalesce(s.start_time, '') = '17:00'
    AND coalesce(s.end_time, '') = '18:15'
);
-- line 124 中四級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-10'::date, '17:00', '18:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid
    AND s.scheduled_date = '2026-06-10'::date
    AND coalesce(s.start_time, '') = '17:00'
    AND coalesce(s.end_time, '') = '18:15'
);
-- line 125 中四級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-17'::date, '17:00', '18:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid
    AND s.scheduled_date = '2026-06-17'::date
    AND coalesce(s.start_time, '') = '17:00'
    AND coalesce(s.end_time, '') = '18:15'
);
-- line 126 中四級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-24'::date, '17:00', '18:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid
    AND s.scheduled_date = '2026-06-24'::date
    AND coalesce(s.start_time, '') = '17:00'
    AND coalesce(s.end_time, '') = '18:15'
);
-- line 127 中四級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-29'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid
    AND s.scheduled_date = '2026-04-29'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
);
-- line 137 中六級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-22'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid
    AND s.scheduled_date = '2026-04-22'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
);
-- line 138 中六級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-18'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
    AND s.scheduled_date = '2026-06-18'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 172 中四級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-11'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
    AND s.scheduled_date = '2026-06-11'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 173 中四級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-04'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
    AND s.scheduled_date = '2026-06-04'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 174 中四級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-28'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
    AND s.scheduled_date = '2026-05-28'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 175 中四級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-21'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
    AND s.scheduled_date = '2026-05-21'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 176 中四級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-25'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
    AND s.scheduled_date = '2026-06-25'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 177 中四級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-14'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
    AND s.scheduled_date = '2026-05-14'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 178 中四級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-07'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
    AND s.scheduled_date = '2026-05-07'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 179 中四級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-30'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
    AND s.scheduled_date = '2026-04-30'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 180 中四級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-23'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
    AND s.scheduled_date = '2026-04-23'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 181 中四級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-16'::date, '17:45', '19:00', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
    AND s.scheduled_date = '2026-04-16'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 182 中四級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-18'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND s.scheduled_date = '2026-06-18'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 210 中二級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-11'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND s.scheduled_date = '2026-06-11'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 211 中二級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-04'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND s.scheduled_date = '2026-06-04'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 212 中二級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-30'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND s.scheduled_date = '2026-04-30'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 217 中二級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-23'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND s.scheduled_date = '2026-04-23'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 218 中二級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-16'::date, '16:30', '17:45', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND s.scheduled_date = '2026-04-16'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 219 中二級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-25'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND s.scheduled_date = '2026-06-25'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 224 中二級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-26'::date, '16:45', '18:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
    AND s.scheduled_date = '2026-06-26'::date
    AND coalesce(s.start_time, '') = '16:45'
    AND coalesce(s.end_time, '') = '18:00'
);
-- line 290 中五級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-19'::date, '16:45', '18:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
    AND s.scheduled_date = '2026-06-19'::date
    AND coalesce(s.start_time, '') = '16:45'
    AND coalesce(s.end_time, '') = '18:00'
);
-- line 291 中五級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-12'::date, '16:45', '18:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
    AND s.scheduled_date = '2026-06-12'::date
    AND coalesce(s.start_time, '') = '16:45'
    AND coalesce(s.end_time, '') = '18:00'
);
-- line 292 中五級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-05'::date, '16:45', '18:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
    AND s.scheduled_date = '2026-06-05'::date
    AND coalesce(s.start_time, '') = '16:45'
    AND coalesce(s.end_time, '') = '18:00'
);
-- line 293 中五級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-29'::date, '16:45', '18:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
    AND s.scheduled_date = '2026-05-29'::date
    AND coalesce(s.start_time, '') = '16:45'
    AND coalesce(s.end_time, '') = '18:00'
);
-- line 294 中五級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-22'::date, '16:45', '18:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
    AND s.scheduled_date = '2026-05-22'::date
    AND coalesce(s.start_time, '') = '16:45'
    AND coalesce(s.end_time, '') = '18:00'
);
-- line 295 中五級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-15'::date, '16:45', '18:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
    AND s.scheduled_date = '2026-05-15'::date
    AND coalesce(s.start_time, '') = '16:45'
    AND coalesce(s.end_time, '') = '18:00'
);
-- line 296 中五級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-08'::date, '16:45', '18:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
    AND s.scheduled_date = '2026-05-08'::date
    AND coalesce(s.start_time, '') = '16:45'
    AND coalesce(s.end_time, '') = '18:00'
);
-- line 297 中五級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-01'::date, '16:45', '18:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
    AND s.scheduled_date = '2026-05-01'::date
    AND coalesce(s.start_time, '') = '16:45'
    AND coalesce(s.end_time, '') = '18:00'
);
-- line 298 中五級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-24'::date, '16:45', '18:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
    AND s.scheduled_date = '2026-04-24'::date
    AND coalesce(s.start_time, '') = '16:45'
    AND coalesce(s.end_time, '') = '18:00'
);
-- line 299 中五級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-17'::date, '16:45', '18:00', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
    AND s.scheduled_date = '2026-04-17'::date
    AND coalesce(s.start_time, '') = '16:45'
    AND coalesce(s.end_time, '') = '18:00'
);
-- line 300 中五級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-26'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND s.scheduled_date = '2026-06-26'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 330 中五級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-19'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND s.scheduled_date = '2026-06-19'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 331 中五級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-12'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND s.scheduled_date = '2026-06-12'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 332 中五級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-05'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND s.scheduled_date = '2026-06-05'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 333 中五級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-29'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND s.scheduled_date = '2026-05-29'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 334 中五級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-22'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND s.scheduled_date = '2026-05-22'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 335 中五級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-15'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND s.scheduled_date = '2026-05-15'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 336 中五級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-08'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND s.scheduled_date = '2026-05-08'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 337 中五級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-01'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND s.scheduled_date = '2026-05-01'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 338 中五級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-04-24'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND s.scheduled_date = '2026-04-24'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 339 中五級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-04-17'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND s.scheduled_date = '2026-04-17'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 340 中五級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-06-26'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid
    AND s.scheduled_date = '2026-06-26'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 450 中一二級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-06-19'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid
    AND s.scheduled_date = '2026-06-19'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 451 中一二級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-06-12'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid
    AND s.scheduled_date = '2026-06-12'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 452 中一二級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-06-05'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid
    AND s.scheduled_date = '2026-06-05'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 453 中一二級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-05-29'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid
    AND s.scheduled_date = '2026-05-29'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 454 中一二級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-05-22'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid
    AND s.scheduled_date = '2026-05-22'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 455 中一二級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-05-15'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid
    AND s.scheduled_date = '2026-05-15'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 456 中一二級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-05-08'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid
    AND s.scheduled_date = '2026-05-08'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 457 中一二級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-05-01'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid
    AND s.scheduled_date = '2026-05-01'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 458 中一二級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-04-24'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid
    AND s.scheduled_date = '2026-04-24'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 459 中一二級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-04-17'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid
    AND s.scheduled_date = '2026-04-17'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 460 中一二級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-27'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND s.scheduled_date = '2026-06-27'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 490 中四級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-20'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND s.scheduled_date = '2026-06-20'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 491 中四級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-06'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND s.scheduled_date = '2026-06-06'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 492 中四級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-30'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND s.scheduled_date = '2026-05-30'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 493 中四級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-23'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND s.scheduled_date = '2026-05-23'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 494 中四級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-16'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND s.scheduled_date = '2026-05-16'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 495 中四級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-09'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND s.scheduled_date = '2026-05-09'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 496 中四級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-02'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND s.scheduled_date = '2026-05-02'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 497 中四級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-25'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND s.scheduled_date = '2026-04-25'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 498 中四級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-18'::date, '15:15', '16:30', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND s.scheduled_date = '2026-04-18'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 499 中四級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-13'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND s.scheduled_date = '2026-06-13'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 528 中四級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid, NULL::uuid, NULL::uuid, '2026-06-27'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid
    AND s.scheduled_date = '2026-06-27'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 569 中四級化學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid, NULL::uuid, NULL::uuid, '2026-06-20'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid
    AND s.scheduled_date = '2026-06-20'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 570 中四級化學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid, NULL::uuid, NULL::uuid, '2026-06-13'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid
    AND s.scheduled_date = '2026-06-13'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 571 中四級化學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid, NULL::uuid, NULL::uuid, '2026-06-06'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid
    AND s.scheduled_date = '2026-06-06'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 572 中四級化學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid, NULL::uuid, NULL::uuid, '2026-05-30'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid
    AND s.scheduled_date = '2026-05-30'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 573 中四級化學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid, NULL::uuid, NULL::uuid, '2026-05-23'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid
    AND s.scheduled_date = '2026-05-23'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 574 中四級化學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid, NULL::uuid, NULL::uuid, '2026-05-16'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid
    AND s.scheduled_date = '2026-05-16'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 575 中四級化學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid, NULL::uuid, NULL::uuid, '2026-05-09'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid
    AND s.scheduled_date = '2026-05-09'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 576 中四級化學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid, NULL::uuid, NULL::uuid, '2026-05-02'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid
    AND s.scheduled_date = '2026-05-02'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 577 中四級化學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid, NULL::uuid, NULL::uuid, '2026-04-25'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid
    AND s.scheduled_date = '2026-04-25'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 578 中四級化學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid, NULL::uuid, NULL::uuid, '2026-04-18'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid
    AND s.scheduled_date = '2026-04-18'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 579 中四級化學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '280fb7c0-345c-422a-90ca-26489c918974'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-27'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND s.scheduled_date = '2026-06-27'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 627 中五級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '280fb7c0-345c-422a-90ca-26489c918974'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-20'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND s.scheduled_date = '2026-06-20'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 628 中五級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '280fb7c0-345c-422a-90ca-26489c918974'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-13'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND s.scheduled_date = '2026-06-13'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 629 中五級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '280fb7c0-345c-422a-90ca-26489c918974'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-06'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND s.scheduled_date = '2026-06-06'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 630 中五級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '280fb7c0-345c-422a-90ca-26489c918974'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-30'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND s.scheduled_date = '2026-05-30'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 631 中五級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '280fb7c0-345c-422a-90ca-26489c918974'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-23'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND s.scheduled_date = '2026-05-23'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 632 中五級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '280fb7c0-345c-422a-90ca-26489c918974'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-16'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND s.scheduled_date = '2026-05-16'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 633 中五級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '280fb7c0-345c-422a-90ca-26489c918974'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-09'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND s.scheduled_date = '2026-05-09'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 634 中五級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '280fb7c0-345c-422a-90ca-26489c918974'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-02'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND s.scheduled_date = '2026-05-02'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 635 中五級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '280fb7c0-345c-422a-90ca-26489c918974'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-25'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND s.scheduled_date = '2026-04-25'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 636 中五級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '280fb7c0-345c-422a-90ca-26489c918974'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-18'::date, '14:00', '15:15', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND s.scheduled_date = '2026-04-18'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 637 中五級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd23852cd-3827-4365-853d-00e23e093e83'::uuid, NULL::uuid, NULL::uuid, '2026-06-27'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd23852cd-3827-4365-853d-00e23e093e83'::uuid
    AND s.scheduled_date = '2026-06-27'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 666 中五級化學科A班PHBE

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd23852cd-3827-4365-853d-00e23e093e83'::uuid, NULL::uuid, NULL::uuid, '2026-06-20'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd23852cd-3827-4365-853d-00e23e093e83'::uuid
    AND s.scheduled_date = '2026-06-20'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 667 中五級化學科A班PHBE

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd23852cd-3827-4365-853d-00e23e093e83'::uuid, NULL::uuid, NULL::uuid, '2026-06-13'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd23852cd-3827-4365-853d-00e23e093e83'::uuid
    AND s.scheduled_date = '2026-06-13'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 668 中五級化學科A班PHBE

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd23852cd-3827-4365-853d-00e23e093e83'::uuid, NULL::uuid, NULL::uuid, '2026-06-06'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd23852cd-3827-4365-853d-00e23e093e83'::uuid
    AND s.scheduled_date = '2026-06-06'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 669 中五級化學科A班PHBE

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd23852cd-3827-4365-853d-00e23e093e83'::uuid, NULL::uuid, NULL::uuid, '2026-05-30'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd23852cd-3827-4365-853d-00e23e093e83'::uuid
    AND s.scheduled_date = '2026-05-30'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 670 中五級化學科A班PHBE

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd23852cd-3827-4365-853d-00e23e093e83'::uuid, NULL::uuid, NULL::uuid, '2026-05-23'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd23852cd-3827-4365-853d-00e23e093e83'::uuid
    AND s.scheduled_date = '2026-05-23'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 671 中五級化學科A班PHBE

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd23852cd-3827-4365-853d-00e23e093e83'::uuid, NULL::uuid, NULL::uuid, '2026-05-16'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd23852cd-3827-4365-853d-00e23e093e83'::uuid
    AND s.scheduled_date = '2026-05-16'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 672 中五級化學科A班PHBE

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd23852cd-3827-4365-853d-00e23e093e83'::uuid, NULL::uuid, NULL::uuid, '2026-05-09'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd23852cd-3827-4365-853d-00e23e093e83'::uuid
    AND s.scheduled_date = '2026-05-09'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 673 中五級化學科A班PHBE

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd23852cd-3827-4365-853d-00e23e093e83'::uuid, NULL::uuid, NULL::uuid, '2026-05-02'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd23852cd-3827-4365-853d-00e23e093e83'::uuid
    AND s.scheduled_date = '2026-05-02'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 674 中五級化學科A班PHBE

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd23852cd-3827-4365-853d-00e23e093e83'::uuid, NULL::uuid, NULL::uuid, '2026-04-25'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd23852cd-3827-4365-853d-00e23e093e83'::uuid
    AND s.scheduled_date = '2026-04-25'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 675 中五級化學科A班PHBE

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd23852cd-3827-4365-853d-00e23e093e83'::uuid, NULL::uuid, NULL::uuid, '2026-04-18'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd23852cd-3827-4365-853d-00e23e093e83'::uuid
    AND s.scheduled_date = '2026-04-18'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 676 中五級化學科A班PHBE

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-24'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND s.scheduled_date = '2026-06-24'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 742 中五級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-17'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND s.scheduled_date = '2026-06-17'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 743 中五級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-03'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND s.scheduled_date = '2026-06-03'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 744 中五級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-27'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND s.scheduled_date = '2026-05-27'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 745 中五級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-20'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND s.scheduled_date = '2026-05-20'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 746 中五級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-13'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND s.scheduled_date = '2026-05-13'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 747 中五級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-06'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND s.scheduled_date = '2026-05-06'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 748 中五級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-29'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND s.scheduled_date = '2026-04-29'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 749 中五級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-22'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND s.scheduled_date = '2026-04-22'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 750 中五級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-10'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND s.scheduled_date = '2026-06-10'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 780 中五級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-06-13'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid
    AND s.scheduled_date = '2026-06-13'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 781 中一級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-06-27'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid
    AND s.scheduled_date = '2026-06-27'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 782 中一級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-06-20'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid
    AND s.scheduled_date = '2026-06-20'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 783 中一級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-06-06'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid
    AND s.scheduled_date = '2026-06-06'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 784 中一級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-30'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid
    AND s.scheduled_date = '2026-05-30'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 785 中一級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-23'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid
    AND s.scheduled_date = '2026-05-23'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 786 中一級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-16'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid
    AND s.scheduled_date = '2026-05-16'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 787 中一級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-09'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid
    AND s.scheduled_date = '2026-05-09'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 788 中一級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-02'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid
    AND s.scheduled_date = '2026-05-02'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 789 中一級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-04-25'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid
    AND s.scheduled_date = '2026-04-25'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 790 中一級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-04-18'::date, '10:15', '11:30', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid
    AND s.scheduled_date = '2026-04-18'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 791 中一級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-06-27'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid
    AND s.scheduled_date = '2026-06-27'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 856 中二級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-06-20'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid
    AND s.scheduled_date = '2026-06-20'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 857 中二級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-06-13'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid
    AND s.scheduled_date = '2026-06-13'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 858 中二級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-06-06'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid
    AND s.scheduled_date = '2026-06-06'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 859 中二級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-30'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid
    AND s.scheduled_date = '2026-05-30'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 860 中二級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-23'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid
    AND s.scheduled_date = '2026-05-23'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 861 中二級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-16'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid
    AND s.scheduled_date = '2026-05-16'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 862 中二級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-09'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid
    AND s.scheduled_date = '2026-05-09'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 863 中二級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-02'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid
    AND s.scheduled_date = '2026-05-02'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 864 中二級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-04-25'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid
    AND s.scheduled_date = '2026-04-25'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 865 中二級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-04-18'::date, '11:30', '12:45', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid
    AND s.scheduled_date = '2026-04-18'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 866 中二級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-06-27'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid
    AND s.scheduled_date = '2026-06-27'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 896 中三級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-06-20'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid
    AND s.scheduled_date = '2026-06-20'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 897 中三級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-06-13'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid
    AND s.scheduled_date = '2026-06-13'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 898 中三級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-06-06'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid
    AND s.scheduled_date = '2026-06-06'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 899 中三級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-30'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid
    AND s.scheduled_date = '2026-05-30'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 900 中三級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-23'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid
    AND s.scheduled_date = '2026-05-23'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 901 中三級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-16'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid
    AND s.scheduled_date = '2026-05-16'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 902 中三級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-09'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid
    AND s.scheduled_date = '2026-05-09'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 903 中三級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-02'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid
    AND s.scheduled_date = '2026-05-02'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 904 中三級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-04-25'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid
    AND s.scheduled_date = '2026-04-25'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 905 中三級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-04-18'::date, '12:45', '14:00', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid
    AND s.scheduled_date = '2026-04-18'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 906 中三級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-06-27'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-06-27'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 975 中一級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-06-20'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-06-20'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 976 中一級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-06-13'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-06-13'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 977 中一級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-06-06'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-06-06'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 978 中一級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-05-30'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-05-30'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 979 中一級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-05-23'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-05-23'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 980 中一級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-05-16'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-05-16'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 981 中一級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-05-09'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-05-09'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 982 中一級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-05-02'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-05-02'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 983 中一級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-04-25'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-04-25'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 984 中一級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-04-18'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-04-18'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 985 中一級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid, NULL::uuid, NULL::uuid, '2026-06-27'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid
    AND s.scheduled_date = '2026-06-27'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1014 中三級科學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid, NULL::uuid, NULL::uuid, '2026-06-20'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid
    AND s.scheduled_date = '2026-06-20'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1015 中三級科學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid, NULL::uuid, NULL::uuid, '2026-06-13'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid
    AND s.scheduled_date = '2026-06-13'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1016 中三級科學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid, NULL::uuid, NULL::uuid, '2026-06-06'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid
    AND s.scheduled_date = '2026-06-06'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1017 中三級科學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid, NULL::uuid, NULL::uuid, '2026-05-30'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid
    AND s.scheduled_date = '2026-05-30'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1018 中三級科學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid, NULL::uuid, NULL::uuid, '2026-05-23'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid
    AND s.scheduled_date = '2026-05-23'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1019 中三級科學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid, NULL::uuid, NULL::uuid, '2026-05-16'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid
    AND s.scheduled_date = '2026-05-16'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1020 中三級科學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid, NULL::uuid, NULL::uuid, '2026-05-09'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid
    AND s.scheduled_date = '2026-05-09'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1021 中三級科學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid, NULL::uuid, NULL::uuid, '2026-05-02'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid
    AND s.scheduled_date = '2026-05-02'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1022 中三級科學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid, NULL::uuid, NULL::uuid, '2026-04-25'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid
    AND s.scheduled_date = '2026-04-25'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1023 中三級科學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid, NULL::uuid, NULL::uuid, '2026-04-18'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid
    AND s.scheduled_date = '2026-04-18'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1024 中三級科學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid, NULL::uuid, NULL::uuid, '2026-06-27'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid
    AND s.scheduled_date = '2026-06-27'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1152 中二級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid, NULL::uuid, NULL::uuid, '2026-06-20'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid
    AND s.scheduled_date = '2026-06-20'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1153 中二級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid, NULL::uuid, NULL::uuid, '2026-06-13'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid
    AND s.scheduled_date = '2026-06-13'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1154 中二級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid, NULL::uuid, NULL::uuid, '2026-06-06'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid
    AND s.scheduled_date = '2026-06-06'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1155 中二級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid, NULL::uuid, NULL::uuid, '2026-05-30'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid
    AND s.scheduled_date = '2026-05-30'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1156 中二級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid, NULL::uuid, NULL::uuid, '2026-05-23'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid
    AND s.scheduled_date = '2026-05-23'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1157 中二級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid, NULL::uuid, NULL::uuid, '2026-05-16'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid
    AND s.scheduled_date = '2026-05-16'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1158 中二級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid, NULL::uuid, NULL::uuid, '2026-05-09'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid
    AND s.scheduled_date = '2026-05-09'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1159 中二級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid, NULL::uuid, NULL::uuid, '2026-05-02'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid
    AND s.scheduled_date = '2026-05-02'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1160 中二級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid, NULL::uuid, NULL::uuid, '2026-04-25'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid
    AND s.scheduled_date = '2026-04-25'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1161 中二級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid, NULL::uuid, NULL::uuid, '2026-04-18'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid
    AND s.scheduled_date = '2026-04-18'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1162 中二級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-28'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1193 中四級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-21'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1194 中四級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-14'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1195 中四級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-07'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1196 中四級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-31'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1197 中四級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-24'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1198 中四級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-17'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1199 中四級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-10'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1200 中四級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-03'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1201 中四級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-26'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1202 中四級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-19'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1203 中四級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-28'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1232 中四級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-21'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1233 中四級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-14'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1234 中四級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-07'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1235 中四級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-31'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1236 中四級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-24'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1237 中四級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-17'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1238 中四級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-10'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1239 中四級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-03'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1240 中四級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-04-26'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1241 中四級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-04-19'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1242 中四級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '70d314f5-7501-4b53-9067-33347f1733cd'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-06-28'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 1272 中四級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '70d314f5-7501-4b53-9067-33347f1733cd'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-06-21'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 1273 中四級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '70d314f5-7501-4b53-9067-33347f1733cd'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-06-14'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 1274 中四級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '70d314f5-7501-4b53-9067-33347f1733cd'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-06-07'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 1275 中四級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '70d314f5-7501-4b53-9067-33347f1733cd'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-31'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 1276 中四級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '70d314f5-7501-4b53-9067-33347f1733cd'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-24'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 1277 中四級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '70d314f5-7501-4b53-9067-33347f1733cd'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-17'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 1278 中四級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '70d314f5-7501-4b53-9067-33347f1733cd'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-10'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 1279 中四級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '70d314f5-7501-4b53-9067-33347f1733cd'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-03'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 1280 中四級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '70d314f5-7501-4b53-9067-33347f1733cd'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-04-26'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 1281 中四級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '70d314f5-7501-4b53-9067-33347f1733cd'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-04-19'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 1282 中四級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-14'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1312 中五級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-28'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1313 中五級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-21'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1314 中五級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-07'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1315 中五級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-31'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1316 中五級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-24'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1317 中五級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-17'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1318 中五級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-10'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1319 中五級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-03'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1320 中五級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-26'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1321 中五級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-19'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1322 中五級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a91bdded-21b2-49e5-9481-40938006062a'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-28'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a91bdded-21b2-49e5-9481-40938006062a'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1352 中五級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a91bdded-21b2-49e5-9481-40938006062a'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-21'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a91bdded-21b2-49e5-9481-40938006062a'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1353 中五級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a91bdded-21b2-49e5-9481-40938006062a'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-14'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a91bdded-21b2-49e5-9481-40938006062a'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1354 中五級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a91bdded-21b2-49e5-9481-40938006062a'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-07'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a91bdded-21b2-49e5-9481-40938006062a'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1355 中五級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a91bdded-21b2-49e5-9481-40938006062a'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-31'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a91bdded-21b2-49e5-9481-40938006062a'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1356 中五級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a91bdded-21b2-49e5-9481-40938006062a'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-24'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a91bdded-21b2-49e5-9481-40938006062a'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1357 中五級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a91bdded-21b2-49e5-9481-40938006062a'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-17'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a91bdded-21b2-49e5-9481-40938006062a'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1358 中五級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a91bdded-21b2-49e5-9481-40938006062a'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-10'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a91bdded-21b2-49e5-9481-40938006062a'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1359 中五級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a91bdded-21b2-49e5-9481-40938006062a'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-03'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a91bdded-21b2-49e5-9481-40938006062a'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1360 中五級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a91bdded-21b2-49e5-9481-40938006062a'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-04-26'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a91bdded-21b2-49e5-9481-40938006062a'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1361 中五級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a91bdded-21b2-49e5-9481-40938006062a'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-04-19'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a91bdded-21b2-49e5-9481-40938006062a'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1362 中五級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-06-28'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1392 中五級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-06-21'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1393 中五級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-06-14'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1394 中五級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-06-07'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1395 中五級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-31'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1396 中五級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-24'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1397 中五級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-17'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1398 中五級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-10'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1399 中五級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-03'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1400 中五級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-04-26'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1401 中五級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-04-19'::date, '14:00', '15:15', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1402 中五級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-28'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1432 中六級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-21'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1433 中六級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-14'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1434 中六級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-07'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1435 中六級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-31'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1436 中六級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-24'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1437 中六級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-17'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1438 中六級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-10'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1439 中六級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-03'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1440 中六級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-04-26'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1441 中六級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-04-19'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1442 中六級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-06-28'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1472 中六級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-06-21'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1473 中六級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-06-14'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1474 中六級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-06-07'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1475 中六級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-31'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1476 中六級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-24'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1477 中六級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-17'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1478 中六級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-10'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1479 中六級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-03'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1480 中六級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-04-26'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1481 中六級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-04-19'::date, '15:15', '16:30', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1482 中六級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-28'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1511 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-21'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1512 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-14'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1513 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-07'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1514 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-31'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1515 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-24'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1516 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-17'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1517 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-10'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1518 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-03'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1519 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-04-26'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1520 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-04-26'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1581 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-03'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1582 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-10'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1583 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-17'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1584 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-24'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1585 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-31'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1586 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-07'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1587 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-14'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1588 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-21'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1589 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-28'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 1590 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-28'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1592 中一二級英文科C班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-21'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1593 中一二級英文科C班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-14'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1594 中一二級英文科C班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-07'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1595 中一二級英文科C班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-31'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1596 中一二級英文科C班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-24'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1597 中一二級英文科C班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-17'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1598 中一二級英文科C班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-10'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1599 中一二級英文科C班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-03'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1600 中一二級英文科C班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-04-26'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1601 中一二級英文科C班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-04-19'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 1602 中一二級英文科C班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '611974a7-8e91-494b-be09-3ceed9b14944'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-28'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '611974a7-8e91-494b-be09-3ceed9b14944'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1632 中二級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '611974a7-8e91-494b-be09-3ceed9b14944'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-21'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '611974a7-8e91-494b-be09-3ceed9b14944'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1633 中二級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '611974a7-8e91-494b-be09-3ceed9b14944'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-14'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '611974a7-8e91-494b-be09-3ceed9b14944'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1634 中二級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '611974a7-8e91-494b-be09-3ceed9b14944'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-07'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '611974a7-8e91-494b-be09-3ceed9b14944'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1635 中二級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '611974a7-8e91-494b-be09-3ceed9b14944'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-31'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '611974a7-8e91-494b-be09-3ceed9b14944'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1636 中二級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '611974a7-8e91-494b-be09-3ceed9b14944'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-24'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '611974a7-8e91-494b-be09-3ceed9b14944'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1637 中二級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '611974a7-8e91-494b-be09-3ceed9b14944'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-17'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '611974a7-8e91-494b-be09-3ceed9b14944'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1638 中二級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '611974a7-8e91-494b-be09-3ceed9b14944'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-10'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '611974a7-8e91-494b-be09-3ceed9b14944'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1639 中二級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '611974a7-8e91-494b-be09-3ceed9b14944'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-03'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '611974a7-8e91-494b-be09-3ceed9b14944'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1640 中二級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '611974a7-8e91-494b-be09-3ceed9b14944'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-26'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '611974a7-8e91-494b-be09-3ceed9b14944'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1641 中二級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '611974a7-8e91-494b-be09-3ceed9b14944'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-19'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '611974a7-8e91-494b-be09-3ceed9b14944'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1642 中二級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-28'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 1673 中三級英文科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-21'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 1674 中三級英文科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-14'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 1675 中三級英文科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-07'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 1676 中三級英文科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-31'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 1677 中三級英文科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-24'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 1678 中三級英文科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-17'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 1679 中三級英文科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-10'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 1680 中三級英文科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-03'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 1681 中三級英文科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-04-26'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 1682 中三級英文科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-04-19'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 1683 中三級英文科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-28'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 1752 中五級生物科B班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-21'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 1753 中五級生物科B班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-14'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 1754 中五級生物科B班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-07'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 1755 中五級生物科B班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-31'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 1756 中五級生物科B班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-24'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 1757 中五級生物科B班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-17'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 1758 中五級生物科B班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-10'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 1759 中五級生物科B班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-03'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 1760 中五級生物科B班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-04-26'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 1761 中五級生物科B班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, 'f1ee1000-0000-4000-8000-000000001021'::uuid, NULL::uuid, '2026-06-28'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1792 中一級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, 'f1ee1000-0000-4000-8000-000000001021'::uuid, NULL::uuid, '2026-06-21'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1793 中一級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, 'f1ee1000-0000-4000-8000-000000001021'::uuid, NULL::uuid, '2026-06-14'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1794 中一級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, 'f1ee1000-0000-4000-8000-000000001021'::uuid, NULL::uuid, '2026-06-07'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1795 中一級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, 'f1ee1000-0000-4000-8000-000000001021'::uuid, NULL::uuid, '2026-05-31'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1796 中一級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, 'f1ee1000-0000-4000-8000-000000001021'::uuid, NULL::uuid, '2026-05-24'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1797 中一級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, 'f1ee1000-0000-4000-8000-000000001021'::uuid, NULL::uuid, '2026-05-17'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1798 中一級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, 'f1ee1000-0000-4000-8000-000000001021'::uuid, NULL::uuid, '2026-05-10'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1799 中一級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, 'f1ee1000-0000-4000-8000-000000001021'::uuid, NULL::uuid, '2026-05-03'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1800 中一級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, 'f1ee1000-0000-4000-8000-000000001021'::uuid, NULL::uuid, '2026-04-26'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1801 中一級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, 'f1ee1000-0000-4000-8000-000000001021'::uuid, NULL::uuid, '2026-04-19'::date, '10:15', '11:30', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 1802 中一級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-03'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 1840 中六級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-26'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 1841 中六級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-19'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 1842 中六級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-30'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND s.scheduled_date = '2026-06-30'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 1873 中一級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-23'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND s.scheduled_date = '2026-06-23'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 1874 中一級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-16'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND s.scheduled_date = '2026-06-16'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 1875 中一級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-09'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND s.scheduled_date = '2026-06-09'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 1876 中一級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-02'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND s.scheduled_date = '2026-06-02'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 1877 中一級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-05-26'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND s.scheduled_date = '2026-05-26'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 1878 中一級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-05-19'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND s.scheduled_date = '2026-05-19'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 1879 中一級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-05-12'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND s.scheduled_date = '2026-05-12'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 1880 中一級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-05-05'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND s.scheduled_date = '2026-05-05'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 1881 中一級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-04-28'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND s.scheduled_date = '2026-04-28'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 1882 中一級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-04-21'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND s.scheduled_date = '2026-04-21'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 1883 中一級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-30'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid
    AND s.scheduled_date = '2026-06-30'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 1912 中一級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-23'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid
    AND s.scheduled_date = '2026-06-23'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 1913 中一級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-16'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid
    AND s.scheduled_date = '2026-06-16'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 1914 中一級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-09'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid
    AND s.scheduled_date = '2026-06-09'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 1915 中一級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-02'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid
    AND s.scheduled_date = '2026-06-02'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 1916 中一級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-26'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid
    AND s.scheduled_date = '2026-05-26'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 1917 中一級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-19'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid
    AND s.scheduled_date = '2026-05-19'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 1918 中一級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-12'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid
    AND s.scheduled_date = '2026-05-12'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 1919 中一級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-05'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid
    AND s.scheduled_date = '2026-05-05'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 1920 中一級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-28'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid
    AND s.scheduled_date = '2026-04-28'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 1921 中一級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-21'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid
    AND s.scheduled_date = '2026-04-21'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 1922 中一級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, 'f1ee1000-0000-4000-8000-000000001017'::uuid, NULL::uuid, '2026-06-27'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND s.scheduled_date = '2026-06-27'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1957 北區百人英文科星期六組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, 'f1ee1000-0000-4000-8000-000000001017'::uuid, NULL::uuid, '2026-06-20'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND s.scheduled_date = '2026-06-20'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1958 北區百人英文科星期六組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, 'f1ee1000-0000-4000-8000-000000001017'::uuid, NULL::uuid, '2026-06-13'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND s.scheduled_date = '2026-06-13'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1959 北區百人英文科星期六組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, 'f1ee1000-0000-4000-8000-000000001017'::uuid, NULL::uuid, '2026-06-06'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND s.scheduled_date = '2026-06-06'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1960 北區百人英文科星期六組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, 'f1ee1000-0000-4000-8000-000000001017'::uuid, NULL::uuid, '2026-05-30'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND s.scheduled_date = '2026-05-30'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1961 北區百人英文科星期六組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, 'f1ee1000-0000-4000-8000-000000001017'::uuid, NULL::uuid, '2026-05-23'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND s.scheduled_date = '2026-05-23'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1962 北區百人英文科星期六組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, 'f1ee1000-0000-4000-8000-000000001017'::uuid, NULL::uuid, '2026-05-16'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND s.scheduled_date = '2026-05-16'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1963 北區百人英文科星期六組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, 'f1ee1000-0000-4000-8000-000000001017'::uuid, NULL::uuid, '2026-05-09'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND s.scheduled_date = '2026-05-09'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1964 北區百人英文科星期六組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, 'f1ee1000-0000-4000-8000-000000001017'::uuid, NULL::uuid, '2026-05-02'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND s.scheduled_date = '2026-05-02'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1965 北區百人英文科星期六組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, 'f1ee1000-0000-4000-8000-000000001017'::uuid, NULL::uuid, '2026-04-25'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND s.scheduled_date = '2026-04-25'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1966 北區百人英文科星期六組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, 'f1ee1000-0000-4000-8000-000000001017'::uuid, NULL::uuid, '2026-04-18'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND s.scheduled_date = '2026-04-18'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 1967 北區百人英文科星期六組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, NULL::uuid, NULL::uuid, '2026-06-24'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND s.scheduled_date = '2026-06-24'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
);
-- line 1995 北區百人英文科星期三組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, NULL::uuid, NULL::uuid, '2026-06-17'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND s.scheduled_date = '2026-06-17'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
);
-- line 1996 北區百人英文科星期三組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, NULL::uuid, NULL::uuid, '2026-06-10'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND s.scheduled_date = '2026-06-10'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
);
-- line 1997 北區百人英文科星期三組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, NULL::uuid, NULL::uuid, '2026-06-03'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND s.scheduled_date = '2026-06-03'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
);
-- line 1998 北區百人英文科星期三組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, NULL::uuid, NULL::uuid, '2026-05-27'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND s.scheduled_date = '2026-05-27'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
);
-- line 1999 北區百人英文科星期三組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, NULL::uuid, NULL::uuid, '2026-05-20'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND s.scheduled_date = '2026-05-20'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
);
-- line 2000 北區百人英文科星期三組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, NULL::uuid, NULL::uuid, '2026-05-13'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND s.scheduled_date = '2026-05-13'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
);
-- line 2001 北區百人英文科星期三組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, NULL::uuid, NULL::uuid, '2026-05-06'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND s.scheduled_date = '2026-05-06'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
);
-- line 2002 北區百人英文科星期三組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, NULL::uuid, NULL::uuid, '2026-04-29'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND s.scheduled_date = '2026-04-29'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
);
-- line 2003 北區百人英文科星期三組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, NULL::uuid, NULL::uuid, '2026-04-22'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND s.scheduled_date = '2026-04-22'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
);
-- line 2004 北區百人英文科星期三組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-27'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND s.scheduled_date = '2026-06-27'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 2134 中一級中文科A班SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-20'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND s.scheduled_date = '2026-06-20'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 2135 中一級中文科A班SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-13'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND s.scheduled_date = '2026-06-13'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 2136 中一級中文科A班SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-06'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND s.scheduled_date = '2026-06-06'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 2137 中一級中文科A班SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-05-30'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND s.scheduled_date = '2026-05-30'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 2138 中一級中文科A班SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-05-23'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND s.scheduled_date = '2026-05-23'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 2139 中一級中文科A班SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-05-16'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND s.scheduled_date = '2026-05-16'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 2140 中一級中文科A班SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-05-09'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND s.scheduled_date = '2026-05-09'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 2141 中一級中文科A班SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-05-02'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND s.scheduled_date = '2026-05-02'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 2142 中一級中文科A班SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-04-25'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND s.scheduled_date = '2026-04-25'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 2143 中一級中文科A班SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-04-18'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND s.scheduled_date = '2026-04-18'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 2144 中一級中文科A班SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid, NULL::uuid, NULL::uuid, '2026-06-27'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid
    AND s.scheduled_date = '2026-06-27'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 2227 中一級數學科單對單NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid, NULL::uuid, NULL::uuid, '2026-06-20'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid
    AND s.scheduled_date = '2026-06-20'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 2228 中一級數學科單對單NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid, NULL::uuid, NULL::uuid, '2026-06-13'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid
    AND s.scheduled_date = '2026-06-13'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 2229 中一級數學科單對單NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid, NULL::uuid, NULL::uuid, '2026-06-06'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid
    AND s.scheduled_date = '2026-06-06'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 2230 中一級數學科單對單NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid, NULL::uuid, NULL::uuid, '2026-05-30'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid
    AND s.scheduled_date = '2026-05-30'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 2231 中一級數學科單對單NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid, NULL::uuid, NULL::uuid, '2026-05-23'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid
    AND s.scheduled_date = '2026-05-23'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 2232 中一級數學科單對單NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid, NULL::uuid, NULL::uuid, '2026-05-16'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid
    AND s.scheduled_date = '2026-05-16'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 2233 中一級數學科單對單NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid, NULL::uuid, NULL::uuid, '2026-05-09'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid
    AND s.scheduled_date = '2026-05-09'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 2234 中一級數學科單對單NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid, NULL::uuid, NULL::uuid, '2026-05-02'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid
    AND s.scheduled_date = '2026-05-02'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 2235 中一級數學科單對單NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid, NULL::uuid, NULL::uuid, '2026-04-25'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid
    AND s.scheduled_date = '2026-04-25'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 2236 中一級數學科單對單NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid, NULL::uuid, NULL::uuid, '2026-04-18'::date, '15:15', '16:30', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid
    AND s.scheduled_date = '2026-04-18'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
);
-- line 2237 中一級數學科單對單NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-05'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid
    AND s.scheduled_date = '2026-06-05'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 2294 中五級生物科C班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-12'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid
    AND s.scheduled_date = '2026-06-12'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 2295 中五級生物科C班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-19'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid
    AND s.scheduled_date = '2026-06-19'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 2296 中五級生物科C班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-26'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid
    AND s.scheduled_date = '2026-06-26'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 2297 中五級生物科C班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-15'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid
    AND s.scheduled_date = '2026-05-15'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 2298 中五級生物科C班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-22'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid
    AND s.scheduled_date = '2026-05-22'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 2299 中五級生物科C班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-29'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid
    AND s.scheduled_date = '2026-05-29'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 2300 中五級生物科C班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-04-24'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid
    AND s.scheduled_date = '2026-04-24'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 2304 中五級生物科C班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-01'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid
    AND s.scheduled_date = '2026-05-01'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 2305 中五級生物科C班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-08'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid
    AND s.scheduled_date = '2026-05-08'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 2306 中五級生物科C班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-04-17'::date, '19:15', '20:30', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid
    AND s.scheduled_date = '2026-04-17'::date
    AND coalesce(s.start_time, '') = '19:15'
    AND coalesce(s.end_time, '') = '20:30'
);
-- line 2559 中五級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-04-24'::date, '19:15', '20:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid
    AND s.scheduled_date = '2026-04-24'::date
    AND coalesce(s.start_time, '') = '19:15'
    AND coalesce(s.end_time, '') = '20:30'
);
-- line 2560 中五級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-05-01'::date, '19:15', '20:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid
    AND s.scheduled_date = '2026-05-01'::date
    AND coalesce(s.start_time, '') = '19:15'
    AND coalesce(s.end_time, '') = '20:30'
);
-- line 2561 中五級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-05-08'::date, '19:15', '20:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid
    AND s.scheduled_date = '2026-05-08'::date
    AND coalesce(s.start_time, '') = '19:15'
    AND coalesce(s.end_time, '') = '20:30'
);
-- line 2562 中五級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-05-15'::date, '19:15', '20:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid
    AND s.scheduled_date = '2026-05-15'::date
    AND coalesce(s.start_time, '') = '19:15'
    AND coalesce(s.end_time, '') = '20:30'
);
-- line 2563 中五級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-05-22'::date, '19:15', '20:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid
    AND s.scheduled_date = '2026-05-22'::date
    AND coalesce(s.start_time, '') = '19:15'
    AND coalesce(s.end_time, '') = '20:30'
);
-- line 2564 中五級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-05-29'::date, '19:15', '20:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid
    AND s.scheduled_date = '2026-05-29'::date
    AND coalesce(s.start_time, '') = '19:15'
    AND coalesce(s.end_time, '') = '20:30'
);
-- line 2565 中五級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-06-05'::date, '19:15', '20:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid
    AND s.scheduled_date = '2026-06-05'::date
    AND coalesce(s.start_time, '') = '19:15'
    AND coalesce(s.end_time, '') = '20:30'
);
-- line 2566 中五級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-06-12'::date, '19:15', '20:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid
    AND s.scheduled_date = '2026-06-12'::date
    AND coalesce(s.start_time, '') = '19:15'
    AND coalesce(s.end_time, '') = '20:30'
);
-- line 2567 中五級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-06-19'::date, '19:15', '20:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid
    AND s.scheduled_date = '2026-06-19'::date
    AND coalesce(s.start_time, '') = '19:15'
    AND coalesce(s.end_time, '') = '20:30'
);
-- line 2568 中五級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-06-26'::date, '19:15', '20:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid
    AND s.scheduled_date = '2026-06-26'::date
    AND coalesce(s.start_time, '') = '19:15'
    AND coalesce(s.end_time, '') = '20:30'
);
-- line 2569 中五級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-04-19'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(60)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 2588 中三級科學科B班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-04-26'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(60)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 2589 中三級科學科B班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-05-03'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(60)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 2590 中三級科學科B班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-05-10'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(60)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 2591 中三級科學科B班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-05-17'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(60)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 2592 中三級科學科B班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-05-24'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(60)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 2593 中三級科學科B班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-05-31'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(60)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 2594 中三級科學科B班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-06-07'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(60)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 2595 中三級科學科B班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-06-14'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(60)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 2596 中三級科學科B班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-06-21'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(60)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 2597 中三級科學科B班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-06-28'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(60)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
);
-- line 2598 中三級科學科B班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-05-03'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 2706 中四級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-05-10'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 2707 中四級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-04-26'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 2710 中四級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-04-19'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 2711 中四級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-21'::date, '16:30', '17:45', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND s.scheduled_date = '2026-04-21'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 2831 中二級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-28'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND s.scheduled_date = '2026-04-28'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 2832 中二級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-05'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND s.scheduled_date = '2026-05-05'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 2833 中二級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-12'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND s.scheduled_date = '2026-05-12'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 2834 中二級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-19'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND s.scheduled_date = '2026-05-19'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 2835 中二級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-26'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND s.scheduled_date = '2026-05-26'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 2836 中二級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-02'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND s.scheduled_date = '2026-06-02'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 2837 中二級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-09'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND s.scheduled_date = '2026-06-09'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 2838 中二級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-16'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND s.scheduled_date = '2026-06-16'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 2839 中二級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-23'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND s.scheduled_date = '2026-06-23'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 2840 中二級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-30'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND s.scheduled_date = '2026-06-30'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 2841 中二級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid, NULL::uuid, NULL::uuid, '2026-04-26'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 2892 中六級英文科一對二CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-04-19'::date, '11:30', '12:45', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 2921 中四五級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-04-26'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 2922 中四五級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-05-03'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 2923 中四五級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-05-10'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 2924 中四五級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-05-17'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 2925 中四五級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-05-24'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 2926 中四五級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-05-31'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 2927 中四五級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-06-07'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 2928 中四五級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-06-14'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 2929 中四五級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-06-21'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 2930 中四五級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-06-28'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
);
-- line 2931 中四五級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7702ea6f-bd18-506a-bee5-7605213bf5fa'::uuid, NULL::uuid, NULL::uuid, '2026-04-19'::date, '12:45', '14:00', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7702ea6f-bd18-506a-bee5-7605213bf5fa'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 2995 陳煒傑一對一CYND

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7702ea6f-bd18-506a-bee5-7605213bf5fa'::uuid, NULL::uuid, NULL::uuid, '2026-04-26'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7702ea6f-bd18-506a-bee5-7605213bf5fa'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 2996 陳煒傑一對一CYND

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7702ea6f-bd18-506a-bee5-7605213bf5fa'::uuid, NULL::uuid, NULL::uuid, '2026-05-03'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7702ea6f-bd18-506a-bee5-7605213bf5fa'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 2997 陳煒傑一對一CYND

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7702ea6f-bd18-506a-bee5-7605213bf5fa'::uuid, NULL::uuid, NULL::uuid, '2026-05-10'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7702ea6f-bd18-506a-bee5-7605213bf5fa'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 2998 陳煒傑一對一CYND

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7702ea6f-bd18-506a-bee5-7605213bf5fa'::uuid, NULL::uuid, NULL::uuid, '2026-05-17'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7702ea6f-bd18-506a-bee5-7605213bf5fa'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 2999 陳煒傑一對一CYND

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7702ea6f-bd18-506a-bee5-7605213bf5fa'::uuid, NULL::uuid, NULL::uuid, '2026-05-24'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7702ea6f-bd18-506a-bee5-7605213bf5fa'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 3000 陳煒傑一對一CYND

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7702ea6f-bd18-506a-bee5-7605213bf5fa'::uuid, NULL::uuid, NULL::uuid, '2026-05-31'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7702ea6f-bd18-506a-bee5-7605213bf5fa'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 3001 陳煒傑一對一CYND

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7702ea6f-bd18-506a-bee5-7605213bf5fa'::uuid, NULL::uuid, NULL::uuid, '2026-06-07'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7702ea6f-bd18-506a-bee5-7605213bf5fa'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 3002 陳煒傑一對一CYND

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7702ea6f-bd18-506a-bee5-7605213bf5fa'::uuid, NULL::uuid, NULL::uuid, '2026-06-14'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7702ea6f-bd18-506a-bee5-7605213bf5fa'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 3003 陳煒傑一對一CYND

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7702ea6f-bd18-506a-bee5-7605213bf5fa'::uuid, NULL::uuid, NULL::uuid, '2026-06-21'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7702ea6f-bd18-506a-bee5-7605213bf5fa'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 3004 陳煒傑一對一CYND

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7702ea6f-bd18-506a-bee5-7605213bf5fa'::uuid, NULL::uuid, NULL::uuid, '2026-06-28'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7702ea6f-bd18-506a-bee5-7605213bf5fa'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
);
-- line 3006 陳煒傑一對一CYND

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '91f31145-3842-400b-8009-8d0e7086c536'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-04-20'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '91f31145-3842-400b-8009-8d0e7086c536'::uuid
    AND s.scheduled_date = '2026-04-20'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 3054 中二級中文科A班 SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '91f31145-3842-400b-8009-8d0e7086c536'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-04-27'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '91f31145-3842-400b-8009-8d0e7086c536'::uuid
    AND s.scheduled_date = '2026-04-27'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 3055 中二級中文科A班 SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '91f31145-3842-400b-8009-8d0e7086c536'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-05-04'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '91f31145-3842-400b-8009-8d0e7086c536'::uuid
    AND s.scheduled_date = '2026-05-04'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 3056 中二級中文科A班 SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '91f31145-3842-400b-8009-8d0e7086c536'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-05-11'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '91f31145-3842-400b-8009-8d0e7086c536'::uuid
    AND s.scheduled_date = '2026-05-11'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 3057 中二級中文科A班 SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '91f31145-3842-400b-8009-8d0e7086c536'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-05-18'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '91f31145-3842-400b-8009-8d0e7086c536'::uuid
    AND s.scheduled_date = '2026-05-18'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 3058 中二級中文科A班 SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '91f31145-3842-400b-8009-8d0e7086c536'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-05-25'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '91f31145-3842-400b-8009-8d0e7086c536'::uuid
    AND s.scheduled_date = '2026-05-25'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 3059 中二級中文科A班 SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '91f31145-3842-400b-8009-8d0e7086c536'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-01'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '91f31145-3842-400b-8009-8d0e7086c536'::uuid
    AND s.scheduled_date = '2026-06-01'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 3060 中二級中文科A班 SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '91f31145-3842-400b-8009-8d0e7086c536'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-08'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '91f31145-3842-400b-8009-8d0e7086c536'::uuid
    AND s.scheduled_date = '2026-06-08'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 3061 中二級中文科A班 SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '91f31145-3842-400b-8009-8d0e7086c536'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-15'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '91f31145-3842-400b-8009-8d0e7086c536'::uuid
    AND s.scheduled_date = '2026-06-15'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 3062 中二級中文科A班 SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '91f31145-3842-400b-8009-8d0e7086c536'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-22'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '91f31145-3842-400b-8009-8d0e7086c536'::uuid
    AND s.scheduled_date = '2026-06-22'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 3063 中二級中文科A班 SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '91f31145-3842-400b-8009-8d0e7086c536'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-29'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '91f31145-3842-400b-8009-8d0e7086c536'::uuid
    AND s.scheduled_date = '2026-06-29'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
);
-- line 3064 中二級中文科A班 SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-05-17'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 3089 中四級BAFS科A班 Rafael

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-05-24'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 3090 中四級BAFS科A班 Rafael

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-05-31'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 3091 中四級BAFS科A班 Rafael

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-06-07'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 3092 中四級BAFS科A班 Rafael

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-06-14'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 3093 中四級BAFS科A班 Rafael

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-06-21'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 3094 中四級BAFS科A班 Rafael

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-06-28'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
);
-- line 3095 中四級BAFS科A班 Rafael

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-04-17'::date, '16:00', '18:00', '預定', '[2526排程CSV] 原狀態:補堂 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND s.scheduled_date = '2026-04-17'::date
    AND coalesce(s.start_time, '') = '16:00'
    AND coalesce(s.end_time, '') = '18:00'
);
-- line 3125 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid, NULL::uuid, NULL::uuid, '2026-04-19'::date, '14:00', '15:15', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 3131 中五級英文科一對一 CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid, NULL::uuid, NULL::uuid, '2026-05-03'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 3133 中五級英文科一對一 CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid, NULL::uuid, NULL::uuid, '2026-05-10'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 3134 中五級英文科一對一 CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid, NULL::uuid, NULL::uuid, '2026-05-17'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 3135 中五級英文科一對一 CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid, NULL::uuid, NULL::uuid, '2026-05-24'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 3136 中五級英文科一對一 CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid, NULL::uuid, NULL::uuid, '2026-05-31'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 3137 中五級英文科一對一 CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid, NULL::uuid, NULL::uuid, '2026-06-07'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 3138 中五級英文科一對一 CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid, NULL::uuid, NULL::uuid, '2026-06-14'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 3139 中五級英文科一對一 CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid, NULL::uuid, NULL::uuid, '2026-06-21'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 3140 中五級英文科一對一 CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid, NULL::uuid, NULL::uuid, '2026-06-28'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
);
-- line 3141 中五級英文科一對一 CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-04-23'::date, '17:15', '18:30', '預定', '[2526排程CSV] 原狀態:補堂 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid
    AND s.scheduled_date = '2026-04-23'::date
    AND coalesce(s.start_time, '') = '17:15'
    AND coalesce(s.end_time, '') = '18:30'
);
-- line 3143 中四級BAFS科A班 Rafael

COMMIT;