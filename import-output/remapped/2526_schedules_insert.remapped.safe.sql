-- AUTO-REMAP from 2526_schedules_insert.sql
-- table: schedules
-- total old refs: 1493
-- class remapped refs: 894
-- class unmapped refs: 599
-- student remapped refs: 0
-- student unmapped refs: 0

-- 2526 排程 CSV → public.schedules
-- 來源: /Users/hoiyingfan/Downloads/私人和共用 2/【2526】排程 25973b60cb0280b4917cccc613542ebb_all.csv
-- 日期條件: 晚於 2026-04-15；已取消不匯入；classroom_id 一律 NULL
-- 共 534 筆 INSERT（略過已存在之同班同日同起迄時間）

BEGIN;

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-20'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid
    AND s.scheduled_date = '2026-04-20'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 39 中三級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-27'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid
    AND s.scheduled_date = '2026-04-27'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 40 中三級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-04'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid
    AND s.scheduled_date = '2026-05-04'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 41 中三級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-11'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid
    AND s.scheduled_date = '2026-05-11'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 42 中三級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-18'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid
    AND s.scheduled_date = '2026-05-18'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 43 中三級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-25'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid
    AND s.scheduled_date = '2026-05-25'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 44 中三級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-01'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid
    AND s.scheduled_date = '2026-06-01'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 45 中三級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-08'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid
    AND s.scheduled_date = '2026-06-08'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 46 中三級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-15'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid
    AND s.scheduled_date = '2026-06-15'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 47 中三級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-22'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid
    AND s.scheduled_date = '2026-06-22'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 48 中三級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-29'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid
    AND s.scheduled_date = '2026-06-29'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 49 中三級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-28'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid
    AND s.scheduled_date = '2026-04-28'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 80 中三級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-05'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid
    AND s.scheduled_date = '2026-05-05'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 81 中三級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-12'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid
    AND s.scheduled_date = '2026-05-12'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 82 中三級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-19'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid
    AND s.scheduled_date = '2026-05-19'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 83 中三級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-26'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid
    AND s.scheduled_date = '2026-05-26'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 84 中三級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-02'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid
    AND s.scheduled_date = '2026-06-02'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 85 中三級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-09'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid
    AND s.scheduled_date = '2026-06-09'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 86 中三級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-16'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid
    AND s.scheduled_date = '2026-06-16'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 87 中三級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-23'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid
    AND s.scheduled_date = '2026-06-23'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 88 中三級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-30'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid
    AND s.scheduled_date = '2026-06-30'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 89 中三級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-04-22'::date, '17:00', '18:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid
    AND s.scheduled_date = '2026-04-22'::date
    AND coalesce(s.start_time, '') = '17:00'
    AND coalesce(s.end_time, '') = '18:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 118 中四級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-04-29'::date, '17:00', '18:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid
    AND s.scheduled_date = '2026-04-29'::date
    AND coalesce(s.start_time, '') = '17:00'
    AND coalesce(s.end_time, '') = '18:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 119 中四級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-06'::date, '17:00', '18:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid
    AND s.scheduled_date = '2026-05-06'::date
    AND coalesce(s.start_time, '') = '17:00'
    AND coalesce(s.end_time, '') = '18:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 120 中四級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-13'::date, '17:00', '18:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid
    AND s.scheduled_date = '2026-05-13'::date
    AND coalesce(s.start_time, '') = '17:00'
    AND coalesce(s.end_time, '') = '18:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 121 中四級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-20'::date, '17:00', '18:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid
    AND s.scheduled_date = '2026-05-20'::date
    AND coalesce(s.start_time, '') = '17:00'
    AND coalesce(s.end_time, '') = '18:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 122 中四級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-27'::date, '17:00', '18:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid
    AND s.scheduled_date = '2026-05-27'::date
    AND coalesce(s.start_time, '') = '17:00'
    AND coalesce(s.end_time, '') = '18:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 123 中四級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-03'::date, '17:00', '18:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid
    AND s.scheduled_date = '2026-06-03'::date
    AND coalesce(s.start_time, '') = '17:00'
    AND coalesce(s.end_time, '') = '18:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 124 中四級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-10'::date, '17:00', '18:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid
    AND s.scheduled_date = '2026-06-10'::date
    AND coalesce(s.start_time, '') = '17:00'
    AND coalesce(s.end_time, '') = '18:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 125 中四級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-17'::date, '17:00', '18:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid
    AND s.scheduled_date = '2026-06-17'::date
    AND coalesce(s.start_time, '') = '17:00'
    AND coalesce(s.end_time, '') = '18:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 126 中四級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-24'::date, '17:00', '18:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid
    AND s.scheduled_date = '2026-06-24'::date
    AND coalesce(s.start_time, '') = '17:00'
    AND coalesce(s.end_time, '') = '18:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 127 中四級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '9d18b4f6-a4f5-4029-abb0-5c8926e16d19'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-29'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '9d18b4f6-a4f5-4029-abb0-5c8926e16d19'::uuid
    AND s.scheduled_date = '2026-04-29'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '9d18b4f6-a4f5-4029-abb0-5c8926e16d19'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 137 中六級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '9d18b4f6-a4f5-4029-abb0-5c8926e16d19'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-22'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '9d18b4f6-a4f5-4029-abb0-5c8926e16d19'::uuid
    AND s.scheduled_date = '2026-04-22'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '9d18b4f6-a4f5-4029-abb0-5c8926e16d19'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 138 中六級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-18'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid
    AND s.scheduled_date = '2026-06-18'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 172 中四級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-11'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid
    AND s.scheduled_date = '2026-06-11'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 173 中四級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-04'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid
    AND s.scheduled_date = '2026-06-04'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 174 中四級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-28'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid
    AND s.scheduled_date = '2026-05-28'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 175 中四級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-21'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid
    AND s.scheduled_date = '2026-05-21'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 176 中四級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-25'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid
    AND s.scheduled_date = '2026-06-25'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 177 中四級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-14'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid
    AND s.scheduled_date = '2026-05-14'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 178 中四級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-07'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid
    AND s.scheduled_date = '2026-05-07'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 179 中四級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-30'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid
    AND s.scheduled_date = '2026-04-30'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 180 中四級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-23'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid
    AND s.scheduled_date = '2026-04-23'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 181 中四級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-16'::date, '17:45', '19:00', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid
    AND s.scheduled_date = '2026-04-16'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 182 中四級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-18'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid
    AND s.scheduled_date = '2026-06-18'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 210 中二級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-11'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid
    AND s.scheduled_date = '2026-06-11'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 211 中二級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-04'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid
    AND s.scheduled_date = '2026-06-04'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 212 中二級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-30'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid
    AND s.scheduled_date = '2026-04-30'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 217 中二級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-23'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid
    AND s.scheduled_date = '2026-04-23'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 218 中二級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-16'::date, '16:30', '17:45', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid
    AND s.scheduled_date = '2026-04-16'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 219 中二級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-25'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid
    AND s.scheduled_date = '2026-06-25'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 224 中二級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-26'::date, '16:45', '18:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid
    AND s.scheduled_date = '2026-06-26'::date
    AND coalesce(s.start_time, '') = '16:45'
    AND coalesce(s.end_time, '') = '18:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 290 中五級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-19'::date, '16:45', '18:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid
    AND s.scheduled_date = '2026-06-19'::date
    AND coalesce(s.start_time, '') = '16:45'
    AND coalesce(s.end_time, '') = '18:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 291 中五級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-12'::date, '16:45', '18:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid
    AND s.scheduled_date = '2026-06-12'::date
    AND coalesce(s.start_time, '') = '16:45'
    AND coalesce(s.end_time, '') = '18:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 292 中五級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-05'::date, '16:45', '18:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid
    AND s.scheduled_date = '2026-06-05'::date
    AND coalesce(s.start_time, '') = '16:45'
    AND coalesce(s.end_time, '') = '18:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 293 中五級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-29'::date, '16:45', '18:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid
    AND s.scheduled_date = '2026-05-29'::date
    AND coalesce(s.start_time, '') = '16:45'
    AND coalesce(s.end_time, '') = '18:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 294 中五級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-22'::date, '16:45', '18:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid
    AND s.scheduled_date = '2026-05-22'::date
    AND coalesce(s.start_time, '') = '16:45'
    AND coalesce(s.end_time, '') = '18:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 295 中五級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-15'::date, '16:45', '18:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid
    AND s.scheduled_date = '2026-05-15'::date
    AND coalesce(s.start_time, '') = '16:45'
    AND coalesce(s.end_time, '') = '18:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 296 中五級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-08'::date, '16:45', '18:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid
    AND s.scheduled_date = '2026-05-08'::date
    AND coalesce(s.start_time, '') = '16:45'
    AND coalesce(s.end_time, '') = '18:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 297 中五級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-01'::date, '16:45', '18:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid
    AND s.scheduled_date = '2026-05-01'::date
    AND coalesce(s.start_time, '') = '16:45'
    AND coalesce(s.end_time, '') = '18:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 298 中五級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-24'::date, '16:45', '18:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid
    AND s.scheduled_date = '2026-04-24'::date
    AND coalesce(s.start_time, '') = '16:45'
    AND coalesce(s.end_time, '') = '18:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 299 中五級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-17'::date, '16:45', '18:00', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid
    AND s.scheduled_date = '2026-04-17'::date
    AND coalesce(s.start_time, '') = '16:45'
    AND coalesce(s.end_time, '') = '18:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 300 中五級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-26'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid
    AND s.scheduled_date = '2026-06-26'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 330 中五級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-19'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid
    AND s.scheduled_date = '2026-06-19'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 331 中五級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-12'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid
    AND s.scheduled_date = '2026-06-12'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 332 中五級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-05'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid
    AND s.scheduled_date = '2026-06-05'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 333 中五級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-29'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid
    AND s.scheduled_date = '2026-05-29'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 334 中五級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-22'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid
    AND s.scheduled_date = '2026-05-22'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 335 中五級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-15'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid
    AND s.scheduled_date = '2026-05-15'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 336 中五級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-08'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid
    AND s.scheduled_date = '2026-05-08'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 337 中五級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-01'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid
    AND s.scheduled_date = '2026-05-01'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 338 中五級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-04-24'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid
    AND s.scheduled_date = '2026-04-24'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 339 中五級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-04-17'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid
    AND s.scheduled_date = '2026-04-17'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 340 中五級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-06-26'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid
    AND s.scheduled_date = '2026-06-26'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001020'::uuid);
-- line 450 中一二級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-06-19'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid
    AND s.scheduled_date = '2026-06-19'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001020'::uuid);
-- line 451 中一二級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-06-12'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid
    AND s.scheduled_date = '2026-06-12'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001020'::uuid);
-- line 452 中一二級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-06-05'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid
    AND s.scheduled_date = '2026-06-05'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001020'::uuid);
-- line 453 中一二級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-05-29'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid
    AND s.scheduled_date = '2026-05-29'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001020'::uuid);
-- line 454 中一二級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-05-22'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid
    AND s.scheduled_date = '2026-05-22'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001020'::uuid);
-- line 455 中一二級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-05-15'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid
    AND s.scheduled_date = '2026-05-15'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001020'::uuid);
-- line 456 中一二級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-05-08'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid
    AND s.scheduled_date = '2026-05-08'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001020'::uuid);
-- line 457 中一二級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-05-01'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid
    AND s.scheduled_date = '2026-05-01'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001020'::uuid);
-- line 458 中一二級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-04-24'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid
    AND s.scheduled_date = '2026-04-24'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001020'::uuid);
-- line 459 中一二級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-04-17'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid
    AND s.scheduled_date = '2026-04-17'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'a874a45d-d45b-4ea4-a82c-0a570e2b3795'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001020'::uuid);
-- line 460 中一二級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-27'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid
    AND s.scheduled_date = '2026-06-27'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 490 中四級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-20'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid
    AND s.scheduled_date = '2026-06-20'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 491 中四級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-06'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid
    AND s.scheduled_date = '2026-06-06'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 492 中四級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-30'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid
    AND s.scheduled_date = '2026-05-30'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 493 中四級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-23'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid
    AND s.scheduled_date = '2026-05-23'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 494 中四級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-16'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid
    AND s.scheduled_date = '2026-05-16'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 495 中四級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-09'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid
    AND s.scheduled_date = '2026-05-09'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 496 中四級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-02'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid
    AND s.scheduled_date = '2026-05-02'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 497 中四級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-25'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid
    AND s.scheduled_date = '2026-04-25'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 498 中四級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-18'::date, '15:15', '16:30', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid
    AND s.scheduled_date = '2026-04-18'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 499 中四級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-13'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid
    AND s.scheduled_date = '2026-06-13'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 528 中四級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid, NULL::uuid, NULL::uuid, '2026-06-27'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid
    AND s.scheduled_date = '2026-06-27'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid);
-- line 569 中四級化學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid, NULL::uuid, NULL::uuid, '2026-06-20'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid
    AND s.scheduled_date = '2026-06-20'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid);
-- line 570 中四級化學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid, NULL::uuid, NULL::uuid, '2026-06-13'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid
    AND s.scheduled_date = '2026-06-13'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid);
-- line 571 中四級化學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid, NULL::uuid, NULL::uuid, '2026-06-06'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid
    AND s.scheduled_date = '2026-06-06'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid);
-- line 572 中四級化學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid, NULL::uuid, NULL::uuid, '2026-05-30'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid
    AND s.scheduled_date = '2026-05-30'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid);
-- line 573 中四級化學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid, NULL::uuid, NULL::uuid, '2026-05-23'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid
    AND s.scheduled_date = '2026-05-23'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid);
-- line 574 中四級化學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid, NULL::uuid, NULL::uuid, '2026-05-16'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid
    AND s.scheduled_date = '2026-05-16'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid);
-- line 575 中四級化學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid, NULL::uuid, NULL::uuid, '2026-05-09'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid
    AND s.scheduled_date = '2026-05-09'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid);
-- line 576 中四級化學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid, NULL::uuid, NULL::uuid, '2026-05-02'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid
    AND s.scheduled_date = '2026-05-02'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid);
-- line 577 中四級化學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid, NULL::uuid, NULL::uuid, '2026-04-25'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid
    AND s.scheduled_date = '2026-04-25'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid);
-- line 578 中四級化學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid, NULL::uuid, NULL::uuid, '2026-04-18'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid
    AND s.scheduled_date = '2026-04-18'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '7a9c1c43-2bc2-4e68-8f0a-b190e43dad3f'::uuid);
-- line 579 中四級化學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '167607d0-b816-4485-9030-ff617f8b4382'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-27'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid
    AND s.scheduled_date = '2026-06-27'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 627 中五級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '167607d0-b816-4485-9030-ff617f8b4382'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-20'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid
    AND s.scheduled_date = '2026-06-20'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 628 中五級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '167607d0-b816-4485-9030-ff617f8b4382'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-13'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid
    AND s.scheduled_date = '2026-06-13'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 629 中五級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '167607d0-b816-4485-9030-ff617f8b4382'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-06'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid
    AND s.scheduled_date = '2026-06-06'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 630 中五級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '167607d0-b816-4485-9030-ff617f8b4382'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-30'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid
    AND s.scheduled_date = '2026-05-30'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 631 中五級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '167607d0-b816-4485-9030-ff617f8b4382'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-23'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid
    AND s.scheduled_date = '2026-05-23'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 632 中五級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '167607d0-b816-4485-9030-ff617f8b4382'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-16'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid
    AND s.scheduled_date = '2026-05-16'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 633 中五級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '167607d0-b816-4485-9030-ff617f8b4382'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-09'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid
    AND s.scheduled_date = '2026-05-09'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 634 中五級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '167607d0-b816-4485-9030-ff617f8b4382'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-02'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid
    AND s.scheduled_date = '2026-05-02'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 635 中五級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '167607d0-b816-4485-9030-ff617f8b4382'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-25'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid
    AND s.scheduled_date = '2026-04-25'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 636 中五級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '167607d0-b816-4485-9030-ff617f8b4382'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-18'::date, '14:00', '15:15', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid
    AND s.scheduled_date = '2026-04-18'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 637 中五級數學科B班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid, NULL::uuid, NULL::uuid, '2026-06-27'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid
    AND s.scheduled_date = '2026-06-27'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid);
-- line 666 中五級化學科A班PHBE

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid, NULL::uuid, NULL::uuid, '2026-06-20'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid
    AND s.scheduled_date = '2026-06-20'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid);
-- line 667 中五級化學科A班PHBE

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid, NULL::uuid, NULL::uuid, '2026-06-13'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid
    AND s.scheduled_date = '2026-06-13'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid);
-- line 668 中五級化學科A班PHBE

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid, NULL::uuid, NULL::uuid, '2026-06-06'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid
    AND s.scheduled_date = '2026-06-06'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid);
-- line 669 中五級化學科A班PHBE

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid, NULL::uuid, NULL::uuid, '2026-05-30'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid
    AND s.scheduled_date = '2026-05-30'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid);
-- line 670 中五級化學科A班PHBE

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid, NULL::uuid, NULL::uuid, '2026-05-23'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid
    AND s.scheduled_date = '2026-05-23'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid);
-- line 671 中五級化學科A班PHBE

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid, NULL::uuid, NULL::uuid, '2026-05-16'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid
    AND s.scheduled_date = '2026-05-16'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid);
-- line 672 中五級化學科A班PHBE

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid, NULL::uuid, NULL::uuid, '2026-05-09'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid
    AND s.scheduled_date = '2026-05-09'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid);
-- line 673 中五級化學科A班PHBE

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid, NULL::uuid, NULL::uuid, '2026-05-02'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid
    AND s.scheduled_date = '2026-05-02'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid);
-- line 674 中五級化學科A班PHBE

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid, NULL::uuid, NULL::uuid, '2026-04-25'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid
    AND s.scheduled_date = '2026-04-25'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid);
-- line 675 中五級化學科A班PHBE

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid, NULL::uuid, NULL::uuid, '2026-04-18'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid
    AND s.scheduled_date = '2026-04-18'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid);
-- line 676 中五級化學科A班PHBE

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-24'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid
    AND s.scheduled_date = '2026-06-24'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 742 中五級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-17'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid
    AND s.scheduled_date = '2026-06-17'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 743 中五級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-03'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid
    AND s.scheduled_date = '2026-06-03'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 744 中五級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-27'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid
    AND s.scheduled_date = '2026-05-27'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 745 中五級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-20'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid
    AND s.scheduled_date = '2026-05-20'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 746 中五級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-13'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid
    AND s.scheduled_date = '2026-05-13'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 747 中五級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-06'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid
    AND s.scheduled_date = '2026-05-06'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 748 中五級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-29'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid
    AND s.scheduled_date = '2026-04-29'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 749 中五級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-22'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid
    AND s.scheduled_date = '2026-04-22'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 750 中五級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-10'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid
    AND s.scheduled_date = '2026-06-10'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 780 中五級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-06-13'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid
    AND s.scheduled_date = '2026-06-13'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 781 中一級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-06-27'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid
    AND s.scheduled_date = '2026-06-27'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 782 中一級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-06-20'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid
    AND s.scheduled_date = '2026-06-20'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 783 中一級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-06-06'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid
    AND s.scheduled_date = '2026-06-06'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 784 中一級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-30'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid
    AND s.scheduled_date = '2026-05-30'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 785 中一級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-23'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid
    AND s.scheduled_date = '2026-05-23'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 786 中一級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-16'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid
    AND s.scheduled_date = '2026-05-16'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 787 中一級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-09'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid
    AND s.scheduled_date = '2026-05-09'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 788 中一級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-02'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid
    AND s.scheduled_date = '2026-05-02'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 789 中一級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-04-25'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid
    AND s.scheduled_date = '2026-04-25'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 790 中一級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-04-18'::date, '10:15', '11:30', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid
    AND s.scheduled_date = '2026-04-18'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 791 中一級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-06-27'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid
    AND s.scheduled_date = '2026-06-27'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 856 中二級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-06-20'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid
    AND s.scheduled_date = '2026-06-20'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 857 中二級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-06-13'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid
    AND s.scheduled_date = '2026-06-13'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 858 中二級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-06-06'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid
    AND s.scheduled_date = '2026-06-06'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 859 中二級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-30'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid
    AND s.scheduled_date = '2026-05-30'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 860 中二級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-23'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid
    AND s.scheduled_date = '2026-05-23'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 861 中二級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-16'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid
    AND s.scheduled_date = '2026-05-16'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 862 中二級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-09'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid
    AND s.scheduled_date = '2026-05-09'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 863 中二級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-02'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid
    AND s.scheduled_date = '2026-05-02'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 864 中二級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-04-25'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid
    AND s.scheduled_date = '2026-04-25'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 865 中二級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-04-18'::date, '11:30', '12:45', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid
    AND s.scheduled_date = '2026-04-18'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 866 中二級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-06-27'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid
    AND s.scheduled_date = '2026-06-27'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 896 中三級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-06-20'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid
    AND s.scheduled_date = '2026-06-20'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 897 中三級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-06-13'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid
    AND s.scheduled_date = '2026-06-13'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 898 中三級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-06-06'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid
    AND s.scheduled_date = '2026-06-06'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 899 中三級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-30'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid
    AND s.scheduled_date = '2026-05-30'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 900 中三級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-23'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid
    AND s.scheduled_date = '2026-05-23'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 901 中三級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-16'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid
    AND s.scheduled_date = '2026-05-16'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 902 中三級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-09'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid
    AND s.scheduled_date = '2026-05-09'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 903 中三級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-05-02'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid
    AND s.scheduled_date = '2026-05-02'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 904 中三級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-04-25'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid
    AND s.scheduled_date = '2026-04-25'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 905 中三級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid, 'f1ee1000-0000-4000-8000-000000001015'::uuid, NULL::uuid, '2026-04-18'::date, '12:45', '14:00', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid
    AND s.scheduled_date = '2026-04-18'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001015'::uuid);
-- line 906 中三級數學科B班NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-06-27'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-06-27'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid);
-- line 975 中一級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-06-20'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-06-20'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid);
-- line 976 中一級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-06-13'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-06-13'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid);
-- line 977 中一級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-06-06'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-06-06'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid);
-- line 978 中一級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-05-30'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-05-30'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid);
-- line 979 中一級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-05-23'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-05-23'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid);
-- line 980 中一級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-05-16'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-05-16'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid);
-- line 981 中一級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-05-09'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-05-09'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid);
-- line 982 中一級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-05-02'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-05-02'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid);
-- line 983 中一級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-04-25'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-04-25'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid);
-- line 984 中一級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-04-18'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-04-18'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid);
-- line 985 中一級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid, NULL::uuid, NULL::uuid, '2026-06-27'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid
    AND s.scheduled_date = '2026-06-27'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid);
-- line 1014 中三級科學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid, NULL::uuid, NULL::uuid, '2026-06-20'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid
    AND s.scheduled_date = '2026-06-20'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid);
-- line 1015 中三級科學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid, NULL::uuid, NULL::uuid, '2026-06-13'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid
    AND s.scheduled_date = '2026-06-13'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid);
-- line 1016 中三級科學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid, NULL::uuid, NULL::uuid, '2026-06-06'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid
    AND s.scheduled_date = '2026-06-06'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid);
-- line 1017 中三級科學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid, NULL::uuid, NULL::uuid, '2026-05-30'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid
    AND s.scheduled_date = '2026-05-30'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid);
-- line 1018 中三級科學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid, NULL::uuid, NULL::uuid, '2026-05-23'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid
    AND s.scheduled_date = '2026-05-23'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid);
-- line 1019 中三級科學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid, NULL::uuid, NULL::uuid, '2026-05-16'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid
    AND s.scheduled_date = '2026-05-16'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid);
-- line 1020 中三級科學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid, NULL::uuid, NULL::uuid, '2026-05-09'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid
    AND s.scheduled_date = '2026-05-09'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid);
-- line 1021 中三級科學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid, NULL::uuid, NULL::uuid, '2026-05-02'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid
    AND s.scheduled_date = '2026-05-02'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid);
-- line 1022 中三級科學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid, NULL::uuid, NULL::uuid, '2026-04-25'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid
    AND s.scheduled_date = '2026-04-25'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid);
-- line 1023 中三級科學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid, NULL::uuid, NULL::uuid, '2026-04-18'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid
    AND s.scheduled_date = '2026-04-18'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid);
-- line 1024 中三級科學科A班PHEB

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '21627141-68b0-4be0-a072-8cc7c4878654'::uuid, NULL::uuid, NULL::uuid, '2026-06-27'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '21627141-68b0-4be0-a072-8cc7c4878654'::uuid
    AND s.scheduled_date = '2026-06-27'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '21627141-68b0-4be0-a072-8cc7c4878654'::uuid);
-- line 1152 中二級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '21627141-68b0-4be0-a072-8cc7c4878654'::uuid, NULL::uuid, NULL::uuid, '2026-06-20'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '21627141-68b0-4be0-a072-8cc7c4878654'::uuid
    AND s.scheduled_date = '2026-06-20'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '21627141-68b0-4be0-a072-8cc7c4878654'::uuid);
-- line 1153 中二級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '21627141-68b0-4be0-a072-8cc7c4878654'::uuid, NULL::uuid, NULL::uuid, '2026-06-13'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '21627141-68b0-4be0-a072-8cc7c4878654'::uuid
    AND s.scheduled_date = '2026-06-13'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '21627141-68b0-4be0-a072-8cc7c4878654'::uuid);
-- line 1154 中二級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '21627141-68b0-4be0-a072-8cc7c4878654'::uuid, NULL::uuid, NULL::uuid, '2026-06-06'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '21627141-68b0-4be0-a072-8cc7c4878654'::uuid
    AND s.scheduled_date = '2026-06-06'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '21627141-68b0-4be0-a072-8cc7c4878654'::uuid);
-- line 1155 中二級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '21627141-68b0-4be0-a072-8cc7c4878654'::uuid, NULL::uuid, NULL::uuid, '2026-05-30'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '21627141-68b0-4be0-a072-8cc7c4878654'::uuid
    AND s.scheduled_date = '2026-05-30'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '21627141-68b0-4be0-a072-8cc7c4878654'::uuid);
-- line 1156 中二級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '21627141-68b0-4be0-a072-8cc7c4878654'::uuid, NULL::uuid, NULL::uuid, '2026-05-23'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '21627141-68b0-4be0-a072-8cc7c4878654'::uuid
    AND s.scheduled_date = '2026-05-23'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '21627141-68b0-4be0-a072-8cc7c4878654'::uuid);
-- line 1157 中二級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '21627141-68b0-4be0-a072-8cc7c4878654'::uuid, NULL::uuid, NULL::uuid, '2026-05-16'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '21627141-68b0-4be0-a072-8cc7c4878654'::uuid
    AND s.scheduled_date = '2026-05-16'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '21627141-68b0-4be0-a072-8cc7c4878654'::uuid);
-- line 1158 中二級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '21627141-68b0-4be0-a072-8cc7c4878654'::uuid, NULL::uuid, NULL::uuid, '2026-05-09'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '21627141-68b0-4be0-a072-8cc7c4878654'::uuid
    AND s.scheduled_date = '2026-05-09'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '21627141-68b0-4be0-a072-8cc7c4878654'::uuid);
-- line 1159 中二級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '21627141-68b0-4be0-a072-8cc7c4878654'::uuid, NULL::uuid, NULL::uuid, '2026-05-02'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '21627141-68b0-4be0-a072-8cc7c4878654'::uuid
    AND s.scheduled_date = '2026-05-02'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '21627141-68b0-4be0-a072-8cc7c4878654'::uuid);
-- line 1160 中二級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '21627141-68b0-4be0-a072-8cc7c4878654'::uuid, NULL::uuid, NULL::uuid, '2026-04-25'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '21627141-68b0-4be0-a072-8cc7c4878654'::uuid
    AND s.scheduled_date = '2026-04-25'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '21627141-68b0-4be0-a072-8cc7c4878654'::uuid);
-- line 1161 中二級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '21627141-68b0-4be0-a072-8cc7c4878654'::uuid, NULL::uuid, NULL::uuid, '2026-04-18'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '21627141-68b0-4be0-a072-8cc7c4878654'::uuid
    AND s.scheduled_date = '2026-04-18'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '21627141-68b0-4be0-a072-8cc7c4878654'::uuid);
-- line 1162 中二級科學科A班SBLA

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-28'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1193 中四級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-21'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1194 中四級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-14'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1195 中四級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-07'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1196 中四級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-31'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1197 中四級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-24'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1198 中四級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-17'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1199 中四級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-10'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1200 中四級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-03'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1201 中四級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-26'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1202 中四級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-19'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1203 中四級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-28'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1232 中四級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-21'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1233 中四級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-14'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1234 中四級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-07'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1235 中四級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-31'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1236 中四級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-24'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1237 中四級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-17'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1238 中四級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-10'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1239 中四級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-03'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1240 中四級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-04-26'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1241 中四級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-04-19'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1242 中四級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '70d314f5-7501-4b53-9067-33347f1733cd'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-06-28'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1272 中四級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '70d314f5-7501-4b53-9067-33347f1733cd'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-06-21'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1273 中四級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '70d314f5-7501-4b53-9067-33347f1733cd'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-06-14'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1274 中四級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '70d314f5-7501-4b53-9067-33347f1733cd'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-06-07'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1275 中四級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '70d314f5-7501-4b53-9067-33347f1733cd'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-31'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1276 中四級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '70d314f5-7501-4b53-9067-33347f1733cd'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-24'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1277 中四級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '70d314f5-7501-4b53-9067-33347f1733cd'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-17'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1278 中四級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '70d314f5-7501-4b53-9067-33347f1733cd'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-10'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1279 中四級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '70d314f5-7501-4b53-9067-33347f1733cd'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-03'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1280 中四級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '70d314f5-7501-4b53-9067-33347f1733cd'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-04-26'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1281 中四級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '70d314f5-7501-4b53-9067-33347f1733cd'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-04-19'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '70d314f5-7501-4b53-9067-33347f1733cd'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1282 中四級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-14'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1312 中五級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-28'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1313 中五級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-21'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1314 中五級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-07'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1315 中五級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-31'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1316 中五級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-24'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1317 中五級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-17'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1318 中五級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-10'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1319 中五級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-03'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1320 中五級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-26'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1321 中五級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-19'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1322 中五級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-28'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1352 中五級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-21'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1353 中五級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-14'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1354 中五級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-07'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1355 中五級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-31'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1356 中五級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-24'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1357 中五級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-17'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1358 中五級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-10'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1359 中五級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-03'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1360 中五級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-04-26'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1361 中五級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-04-19'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1362 中五級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-06-28'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1392 中五級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-06-21'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1393 中五級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-06-14'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1394 中五級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-06-07'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1395 中五級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-31'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1396 中五級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-24'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1397 中五級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-17'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1398 中五級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-10'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1399 中五級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-03'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1400 中五級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-04-26'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1401 中五級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-04-19'::date, '14:00', '15:15', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1402 中五級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-28'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1432 中六級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-21'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1433 中六級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-14'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1434 中六級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-07'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1435 中六級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-31'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1436 中六級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-24'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1437 中六級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-17'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1438 中六級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-10'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1439 中六級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-03'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1440 中六級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-04-26'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1441 中六級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-04-19'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4a70c207-6093-44e7-9b53-5e4249b028ab'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1442 中六級M2科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1c610853-1733-40ad-90ed-5085baaea561'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-06-28'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1c610853-1733-40ad-90ed-5085baaea561'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1c610853-1733-40ad-90ed-5085baaea561'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1472 中六級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1c610853-1733-40ad-90ed-5085baaea561'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-06-21'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1c610853-1733-40ad-90ed-5085baaea561'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1c610853-1733-40ad-90ed-5085baaea561'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1473 中六級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1c610853-1733-40ad-90ed-5085baaea561'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-06-14'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1c610853-1733-40ad-90ed-5085baaea561'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1c610853-1733-40ad-90ed-5085baaea561'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1474 中六級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1c610853-1733-40ad-90ed-5085baaea561'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-06-07'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1c610853-1733-40ad-90ed-5085baaea561'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1c610853-1733-40ad-90ed-5085baaea561'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1475 中六級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1c610853-1733-40ad-90ed-5085baaea561'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-31'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1c610853-1733-40ad-90ed-5085baaea561'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1c610853-1733-40ad-90ed-5085baaea561'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1476 中六級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1c610853-1733-40ad-90ed-5085baaea561'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-24'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1c610853-1733-40ad-90ed-5085baaea561'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1c610853-1733-40ad-90ed-5085baaea561'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1477 中六級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1c610853-1733-40ad-90ed-5085baaea561'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-17'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1c610853-1733-40ad-90ed-5085baaea561'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1c610853-1733-40ad-90ed-5085baaea561'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1478 中六級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1c610853-1733-40ad-90ed-5085baaea561'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-10'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1c610853-1733-40ad-90ed-5085baaea561'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1c610853-1733-40ad-90ed-5085baaea561'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1479 中六級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1c610853-1733-40ad-90ed-5085baaea561'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-05-03'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1c610853-1733-40ad-90ed-5085baaea561'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1c610853-1733-40ad-90ed-5085baaea561'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1480 中六級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1c610853-1733-40ad-90ed-5085baaea561'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-04-26'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1c610853-1733-40ad-90ed-5085baaea561'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1c610853-1733-40ad-90ed-5085baaea561'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1481 中六級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1c610853-1733-40ad-90ed-5085baaea561'::uuid, 'f1ee1000-0000-4000-8000-000000001014'::uuid, NULL::uuid, '2026-04-19'::date, '15:15', '16:30', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1c610853-1733-40ad-90ed-5085baaea561'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1c610853-1733-40ad-90ed-5085baaea561'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001014'::uuid);
-- line 1482 中六級物理科A班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-28'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1511 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-21'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1512 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-14'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1513 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-07'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1514 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-31'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1515 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-24'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1516 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-17'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1517 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-10'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1518 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-03'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1519 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-04-26'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1520 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-04-26'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1581 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-03'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1582 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-10'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1583 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-17'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1584 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-24'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1585 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-31'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1586 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-07'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1587 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-14'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1588 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-21'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1589 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-28'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1590 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-28'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1592 中一二級英文科C班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-21'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1593 中一二級英文科C班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-14'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1594 中一二級英文科C班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-07'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1595 中一二級英文科C班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-31'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1596 中一二級英文科C班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-24'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1597 中一二級英文科C班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-17'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1598 中一二級英文科C班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-10'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1599 中一二級英文科C班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-03'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1600 中一二級英文科C班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-04-26'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1601 中一二級英文科C班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-04-19'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1602 中一二級英文科C班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-28'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1632 中二級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-21'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1633 中二級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-14'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1634 中二級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-06-07'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1635 中二級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-31'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1636 中二級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-24'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1637 中二級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-17'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1638 中二級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-10'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1639 中二級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-03'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1640 中二級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-26'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1641 中二級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-19'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1642 中二級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-28'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1673 中三級英文科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-21'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1674 中三級英文科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-14'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1675 中三級英文科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-06-07'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1676 中三級英文科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-31'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1677 中三級英文科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-24'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1678 中三級英文科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-17'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1679 中三級英文科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-10'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1680 中三級英文科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-05-03'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1681 中三級英文科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-04-26'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1682 中三級英文科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid, 'f1ee1000-0000-4000-8000-000000001013'::uuid, NULL::uuid, '2026-04-19'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001013'::uuid);
-- line 1683 中三級英文科A班TIMC

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-28'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1752 中五級生物科B班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-21'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1753 中五級生物科B班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-14'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1754 中五級生物科B班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-07'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1755 中五級生物科B班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-31'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1756 中五級生物科B班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-24'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1757 中五級生物科B班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-17'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1758 中五級生物科B班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-10'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1759 中五級生物科B班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-03'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1760 中五級生物科B班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-04-26'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 1761 中五級生物科B班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid, 'f1ee1000-0000-4000-8000-000000001021'::uuid, NULL::uuid, '2026-06-28'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001021'::uuid);
-- line 1792 中一級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid, 'f1ee1000-0000-4000-8000-000000001021'::uuid, NULL::uuid, '2026-06-21'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001021'::uuid);
-- line 1793 中一級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid, 'f1ee1000-0000-4000-8000-000000001021'::uuid, NULL::uuid, '2026-06-14'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001021'::uuid);
-- line 1794 中一級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid, 'f1ee1000-0000-4000-8000-000000001021'::uuid, NULL::uuid, '2026-06-07'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001021'::uuid);
-- line 1795 中一級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid, 'f1ee1000-0000-4000-8000-000000001021'::uuid, NULL::uuid, '2026-05-31'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001021'::uuid);
-- line 1796 中一級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid, 'f1ee1000-0000-4000-8000-000000001021'::uuid, NULL::uuid, '2026-05-24'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001021'::uuid);
-- line 1797 中一級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid, 'f1ee1000-0000-4000-8000-000000001021'::uuid, NULL::uuid, '2026-05-17'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001021'::uuid);
-- line 1798 中一級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid, 'f1ee1000-0000-4000-8000-000000001021'::uuid, NULL::uuid, '2026-05-10'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001021'::uuid);
-- line 1799 中一級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid, 'f1ee1000-0000-4000-8000-000000001021'::uuid, NULL::uuid, '2026-05-03'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001021'::uuid);
-- line 1800 中一級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid, 'f1ee1000-0000-4000-8000-000000001021'::uuid, NULL::uuid, '2026-04-26'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001021'::uuid);
-- line 1801 中一級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid, 'f1ee1000-0000-4000-8000-000000001021'::uuid, NULL::uuid, '2026-04-19'::date, '10:15', '11:30', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001021'::uuid);
-- line 1802 中一級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-05-03'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1840 中六級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-26'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1841 中六級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid, 'f1ee1000-0000-4000-8000-000000001012'::uuid, NULL::uuid, '2026-04-19'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001012'::uuid);
-- line 1842 中六級中文科B班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-30'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid
    AND s.scheduled_date = '2026-06-30'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 1873 中一級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-23'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid
    AND s.scheduled_date = '2026-06-23'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 1874 中一級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-16'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid
    AND s.scheduled_date = '2026-06-16'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 1875 中一級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-09'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid
    AND s.scheduled_date = '2026-06-09'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 1876 中一級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-02'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid
    AND s.scheduled_date = '2026-06-02'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 1877 中一級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-05-26'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid
    AND s.scheduled_date = '2026-05-26'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 1878 中一級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-05-19'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid
    AND s.scheduled_date = '2026-05-19'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 1879 中一級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-05-12'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid
    AND s.scheduled_date = '2026-05-12'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 1880 中一級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-05-05'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid
    AND s.scheduled_date = '2026-05-05'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 1881 中一級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-04-28'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid
    AND s.scheduled_date = '2026-04-28'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 1882 中一級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-04-21'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid
    AND s.scheduled_date = '2026-04-21'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 1883 中一級中文科A班CFAN

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-30'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid
    AND s.scheduled_date = '2026-06-30'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 1912 中一級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-23'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid
    AND s.scheduled_date = '2026-06-23'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 1913 中一級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-16'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid
    AND s.scheduled_date = '2026-06-16'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 1914 中一級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-09'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid
    AND s.scheduled_date = '2026-06-09'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 1915 中一級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-02'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid
    AND s.scheduled_date = '2026-06-02'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 1916 中一級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-26'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid
    AND s.scheduled_date = '2026-05-26'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 1917 中一級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-19'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid
    AND s.scheduled_date = '2026-05-19'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 1918 中一級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-12'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid
    AND s.scheduled_date = '2026-05-12'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 1919 中一級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-05'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid
    AND s.scheduled_date = '2026-05-05'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 1920 中一級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-28'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid
    AND s.scheduled_date = '2026-04-28'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 1921 中一級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-21'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:未有學生報讀 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid
    AND s.scheduled_date = '2026-04-21'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'fddf4208-e790-4c4c-9091-f749875224e6'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 1922 中一級數學科A班MYU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid, 'f1ee1000-0000-4000-8000-000000001017'::uuid, NULL::uuid, '2026-06-27'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid
    AND s.scheduled_date = '2026-06-27'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001017'::uuid);
-- line 1957 北區百人英文科星期六組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid, 'f1ee1000-0000-4000-8000-000000001017'::uuid, NULL::uuid, '2026-06-20'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid
    AND s.scheduled_date = '2026-06-20'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001017'::uuid);
-- line 1958 北區百人英文科星期六組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid, 'f1ee1000-0000-4000-8000-000000001017'::uuid, NULL::uuid, '2026-06-13'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid
    AND s.scheduled_date = '2026-06-13'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001017'::uuid);
-- line 1959 北區百人英文科星期六組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid, 'f1ee1000-0000-4000-8000-000000001017'::uuid, NULL::uuid, '2026-06-06'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid
    AND s.scheduled_date = '2026-06-06'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001017'::uuid);
-- line 1960 北區百人英文科星期六組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid, 'f1ee1000-0000-4000-8000-000000001017'::uuid, NULL::uuid, '2026-05-30'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid
    AND s.scheduled_date = '2026-05-30'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001017'::uuid);
-- line 1961 北區百人英文科星期六組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid, 'f1ee1000-0000-4000-8000-000000001017'::uuid, NULL::uuid, '2026-05-23'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid
    AND s.scheduled_date = '2026-05-23'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001017'::uuid);
-- line 1962 北區百人英文科星期六組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid, 'f1ee1000-0000-4000-8000-000000001017'::uuid, NULL::uuid, '2026-05-16'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid
    AND s.scheduled_date = '2026-05-16'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001017'::uuid);
-- line 1963 北區百人英文科星期六組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid, 'f1ee1000-0000-4000-8000-000000001017'::uuid, NULL::uuid, '2026-05-09'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid
    AND s.scheduled_date = '2026-05-09'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001017'::uuid);
-- line 1964 北區百人英文科星期六組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid, 'f1ee1000-0000-4000-8000-000000001017'::uuid, NULL::uuid, '2026-05-02'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid
    AND s.scheduled_date = '2026-05-02'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001017'::uuid);
-- line 1965 北區百人英文科星期六組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid, 'f1ee1000-0000-4000-8000-000000001017'::uuid, NULL::uuid, '2026-04-25'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid
    AND s.scheduled_date = '2026-04-25'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001017'::uuid);
-- line 1966 北區百人英文科星期六組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid, 'f1ee1000-0000-4000-8000-000000001017'::uuid, NULL::uuid, '2026-04-18'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid
    AND s.scheduled_date = '2026-04-18'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001017'::uuid);
-- line 1967 北區百人英文科星期六組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid, NULL::uuid, NULL::uuid, '2026-06-24'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid
    AND s.scheduled_date = '2026-06-24'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid);
-- line 1995 北區百人英文科星期三組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid, NULL::uuid, NULL::uuid, '2026-06-17'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid
    AND s.scheduled_date = '2026-06-17'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid);
-- line 1996 北區百人英文科星期三組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid, NULL::uuid, NULL::uuid, '2026-06-10'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid
    AND s.scheduled_date = '2026-06-10'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid);
-- line 1997 北區百人英文科星期三組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid, NULL::uuid, NULL::uuid, '2026-06-03'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid
    AND s.scheduled_date = '2026-06-03'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid);
-- line 1998 北區百人英文科星期三組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid, NULL::uuid, NULL::uuid, '2026-05-27'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid
    AND s.scheduled_date = '2026-05-27'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid);
-- line 1999 北區百人英文科星期三組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid, NULL::uuid, NULL::uuid, '2026-05-20'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid
    AND s.scheduled_date = '2026-05-20'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid);
-- line 2000 北區百人英文科星期三組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid, NULL::uuid, NULL::uuid, '2026-05-13'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid
    AND s.scheduled_date = '2026-05-13'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid);
-- line 2001 北區百人英文科星期三組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid, NULL::uuid, NULL::uuid, '2026-05-06'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid
    AND s.scheduled_date = '2026-05-06'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid);
-- line 2002 北區百人英文科星期三組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid, NULL::uuid, NULL::uuid, '2026-04-29'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid
    AND s.scheduled_date = '2026-04-29'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid);
-- line 2003 北區百人英文科星期三組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid, NULL::uuid, NULL::uuid, '2026-04-22'::date, '19:00', '20:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid
    AND s.scheduled_date = '2026-04-22'::date
    AND coalesce(s.start_time, '') = '19:00'
    AND coalesce(s.end_time, '') = '20:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid);
-- line 2004 北區百人英文科星期三組

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-27'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid
    AND s.scheduled_date = '2026-06-27'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 2134 中一級中文科A班SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-20'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid
    AND s.scheduled_date = '2026-06-20'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 2135 中一級中文科A班SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-13'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid
    AND s.scheduled_date = '2026-06-13'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 2136 中一級中文科A班SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-06'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid
    AND s.scheduled_date = '2026-06-06'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 2137 中一級中文科A班SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-05-30'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid
    AND s.scheduled_date = '2026-05-30'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 2138 中一級中文科A班SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-05-23'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid
    AND s.scheduled_date = '2026-05-23'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 2139 中一級中文科A班SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-05-16'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid
    AND s.scheduled_date = '2026-05-16'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 2140 中一級中文科A班SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-05-09'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid
    AND s.scheduled_date = '2026-05-09'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 2141 中一級中文科A班SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-05-02'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid
    AND s.scheduled_date = '2026-05-02'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 2142 中一級中文科A班SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-04-25'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid
    AND s.scheduled_date = '2026-04-25'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 2143 中一級中文科A班SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-04-18'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid
    AND s.scheduled_date = '2026-04-18'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 2144 中一級中文科A班SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid, NULL::uuid, NULL::uuid, '2026-06-27'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid
    AND s.scheduled_date = '2026-06-27'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid);
-- line 2227 中一級數學科單對單NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid, NULL::uuid, NULL::uuid, '2026-06-20'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid
    AND s.scheduled_date = '2026-06-20'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid);
-- line 2228 中一級數學科單對單NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid, NULL::uuid, NULL::uuid, '2026-06-13'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid
    AND s.scheduled_date = '2026-06-13'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid);
-- line 2229 中一級數學科單對單NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid, NULL::uuid, NULL::uuid, '2026-06-06'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid
    AND s.scheduled_date = '2026-06-06'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid);
-- line 2230 中一級數學科單對單NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid, NULL::uuid, NULL::uuid, '2026-05-30'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid
    AND s.scheduled_date = '2026-05-30'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid);
-- line 2231 中一級數學科單對單NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid, NULL::uuid, NULL::uuid, '2026-05-23'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid
    AND s.scheduled_date = '2026-05-23'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid);
-- line 2232 中一級數學科單對單NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid, NULL::uuid, NULL::uuid, '2026-05-16'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid
    AND s.scheduled_date = '2026-05-16'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid);
-- line 2233 中一級數學科單對單NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid, NULL::uuid, NULL::uuid, '2026-05-09'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid
    AND s.scheduled_date = '2026-05-09'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid);
-- line 2234 中一級數學科單對單NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid, NULL::uuid, NULL::uuid, '2026-05-02'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid
    AND s.scheduled_date = '2026-05-02'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid);
-- line 2235 中一級數學科單對單NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid, NULL::uuid, NULL::uuid, '2026-04-25'::date, '15:15', '16:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid
    AND s.scheduled_date = '2026-04-25'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid);
-- line 2236 中一級數學科單對單NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid, NULL::uuid, NULL::uuid, '2026-04-18'::date, '15:15', '16:30', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid
    AND s.scheduled_date = '2026-04-18'::date
    AND coalesce(s.start_time, '') = '15:15'
    AND coalesce(s.end_time, '') = '16:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid);
-- line 2237 中一級數學科單對單NKWO

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-05'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid
    AND s.scheduled_date = '2026-06-05'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 2294 中五級生物科C班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-12'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid
    AND s.scheduled_date = '2026-06-12'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 2295 中五級生物科C班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-19'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid
    AND s.scheduled_date = '2026-06-19'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 2296 中五級生物科C班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-06-26'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid
    AND s.scheduled_date = '2026-06-26'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 2297 中五級生物科C班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-15'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid
    AND s.scheduled_date = '2026-05-15'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 2298 中五級生物科C班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-22'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid
    AND s.scheduled_date = '2026-05-22'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 2299 中五級生物科C班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-29'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid
    AND s.scheduled_date = '2026-05-29'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 2300 中五級生物科C班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-04-24'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid
    AND s.scheduled_date = '2026-04-24'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 2304 中五級生物科C班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-01'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid
    AND s.scheduled_date = '2026-05-01'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 2305 中五級生物科C班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-05-08'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid
    AND s.scheduled_date = '2026-05-08'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 2306 中五級生物科C班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '93560085-b304-4169-b604-0cc96af25cc8'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-04-17'::date, '19:15', '20:30', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '93560085-b304-4169-b604-0cc96af25cc8'::uuid
    AND s.scheduled_date = '2026-04-17'::date
    AND coalesce(s.start_time, '') = '19:15'
    AND coalesce(s.end_time, '') = '20:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '93560085-b304-4169-b604-0cc96af25cc8'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001019'::uuid);
-- line 2559 中五級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '93560085-b304-4169-b604-0cc96af25cc8'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-04-24'::date, '19:15', '20:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '93560085-b304-4169-b604-0cc96af25cc8'::uuid
    AND s.scheduled_date = '2026-04-24'::date
    AND coalesce(s.start_time, '') = '19:15'
    AND coalesce(s.end_time, '') = '20:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '93560085-b304-4169-b604-0cc96af25cc8'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001019'::uuid);
-- line 2560 中五級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '93560085-b304-4169-b604-0cc96af25cc8'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-05-01'::date, '19:15', '20:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '93560085-b304-4169-b604-0cc96af25cc8'::uuid
    AND s.scheduled_date = '2026-05-01'::date
    AND coalesce(s.start_time, '') = '19:15'
    AND coalesce(s.end_time, '') = '20:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '93560085-b304-4169-b604-0cc96af25cc8'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001019'::uuid);
-- line 2561 中五級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '93560085-b304-4169-b604-0cc96af25cc8'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-05-08'::date, '19:15', '20:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '93560085-b304-4169-b604-0cc96af25cc8'::uuid
    AND s.scheduled_date = '2026-05-08'::date
    AND coalesce(s.start_time, '') = '19:15'
    AND coalesce(s.end_time, '') = '20:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '93560085-b304-4169-b604-0cc96af25cc8'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001019'::uuid);
-- line 2562 中五級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '93560085-b304-4169-b604-0cc96af25cc8'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-05-15'::date, '19:15', '20:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '93560085-b304-4169-b604-0cc96af25cc8'::uuid
    AND s.scheduled_date = '2026-05-15'::date
    AND coalesce(s.start_time, '') = '19:15'
    AND coalesce(s.end_time, '') = '20:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '93560085-b304-4169-b604-0cc96af25cc8'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001019'::uuid);
-- line 2563 中五級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '93560085-b304-4169-b604-0cc96af25cc8'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-05-22'::date, '19:15', '20:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '93560085-b304-4169-b604-0cc96af25cc8'::uuid
    AND s.scheduled_date = '2026-05-22'::date
    AND coalesce(s.start_time, '') = '19:15'
    AND coalesce(s.end_time, '') = '20:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '93560085-b304-4169-b604-0cc96af25cc8'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001019'::uuid);
-- line 2564 中五級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '93560085-b304-4169-b604-0cc96af25cc8'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-05-29'::date, '19:15', '20:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '93560085-b304-4169-b604-0cc96af25cc8'::uuid
    AND s.scheduled_date = '2026-05-29'::date
    AND coalesce(s.start_time, '') = '19:15'
    AND coalesce(s.end_time, '') = '20:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '93560085-b304-4169-b604-0cc96af25cc8'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001019'::uuid);
-- line 2565 中五級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '93560085-b304-4169-b604-0cc96af25cc8'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-06-05'::date, '19:15', '20:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '93560085-b304-4169-b604-0cc96af25cc8'::uuid
    AND s.scheduled_date = '2026-06-05'::date
    AND coalesce(s.start_time, '') = '19:15'
    AND coalesce(s.end_time, '') = '20:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '93560085-b304-4169-b604-0cc96af25cc8'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001019'::uuid);
-- line 2566 中五級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '93560085-b304-4169-b604-0cc96af25cc8'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-06-12'::date, '19:15', '20:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '93560085-b304-4169-b604-0cc96af25cc8'::uuid
    AND s.scheduled_date = '2026-06-12'::date
    AND coalesce(s.start_time, '') = '19:15'
    AND coalesce(s.end_time, '') = '20:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '93560085-b304-4169-b604-0cc96af25cc8'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001019'::uuid);
-- line 2567 中五級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '93560085-b304-4169-b604-0cc96af25cc8'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-06-19'::date, '19:15', '20:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '93560085-b304-4169-b604-0cc96af25cc8'::uuid
    AND s.scheduled_date = '2026-06-19'::date
    AND coalesce(s.start_time, '') = '19:15'
    AND coalesce(s.end_time, '') = '20:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '93560085-b304-4169-b604-0cc96af25cc8'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001019'::uuid);
-- line 2568 中五級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '93560085-b304-4169-b604-0cc96af25cc8'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-06-26'::date, '19:15', '20:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '93560085-b304-4169-b604-0cc96af25cc8'::uuid
    AND s.scheduled_date = '2026-06-26'::date
    AND coalesce(s.start_time, '') = '19:15'
    AND coalesce(s.end_time, '') = '20:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '93560085-b304-4169-b604-0cc96af25cc8'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001019'::uuid);
-- line 2569 中五級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-04-19'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(60)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid);
-- line 2588 中三級科學科B班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-04-26'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(60)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid);
-- line 2589 中三級科學科B班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-05-03'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(60)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid);
-- line 2590 中三級科學科B班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-05-10'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(60)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid);
-- line 2591 中三級科學科B班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-05-17'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(60)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid);
-- line 2592 中三級科學科B班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-05-24'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(60)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid);
-- line 2593 中三級科學科B班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-05-31'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(60)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid);
-- line 2594 中三級科學科B班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-06-07'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(60)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid);
-- line 2595 中三級科學科B班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-06-14'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(60)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid);
-- line 2596 中三級科學科B班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-06-21'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(60)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid);
-- line 2597 中三級科學科B班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, NULL::uuid, NULL::uuid, '2026-06-28'::date, '17:45', '19:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(60)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '17:45'
    AND coalesce(s.end_time, '') = '19:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid);
-- line 2598 中三級科學科B班THOM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-05-03'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001019'::uuid);
-- line 2706 中四級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-05-10'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001019'::uuid);
-- line 2707 中四級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-04-26'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001019'::uuid);
-- line 2710 中四級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-04-19'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001019'::uuid);
-- line 2711 中四級BAFS科A班RALI

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-21'::date, '16:30', '17:45', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid
    AND s.scheduled_date = '2026-04-21'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 2831 中二級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-04-28'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid
    AND s.scheduled_date = '2026-04-28'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 2832 中二級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-05'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid
    AND s.scheduled_date = '2026-05-05'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 2833 中二級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-12'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid
    AND s.scheduled_date = '2026-05-12'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 2834 中二級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-19'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid
    AND s.scheduled_date = '2026-05-19'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 2835 中二級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-05-26'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid
    AND s.scheduled_date = '2026-05-26'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 2836 中二級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-02'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid
    AND s.scheduled_date = '2026-06-02'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 2837 中二級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-09'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid
    AND s.scheduled_date = '2026-06-09'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 2838 中二級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-16'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid
    AND s.scheduled_date = '2026-06-16'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 2839 中二級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-23'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid
    AND s.scheduled_date = '2026-06-23'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 2840 中二級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, 'f1ee1000-0000-4000-8000-000000001011'::uuid, NULL::uuid, '2026-06-30'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(80)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid
    AND s.scheduled_date = '2026-06-30'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001011'::uuid);
-- line 2841 中二級數學科C班LIAM

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid, NULL::uuid, NULL::uuid, '2026-04-26'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(95)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid);
-- line 2892 中六級英文科一對二CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-04-19'::date, '11:30', '12:45', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001020'::uuid);
-- line 2921 中四五級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-04-26'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001020'::uuid);
-- line 2922 中四五級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-05-03'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001020'::uuid);
-- line 2923 中四五級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-05-10'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001020'::uuid);
-- line 2924 中四五級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-05-17'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001020'::uuid);
-- line 2925 中四五級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-05-24'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001020'::uuid);
-- line 2926 中四五級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-05-31'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001020'::uuid);
-- line 2927 中四五級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-06-07'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001020'::uuid);
-- line 2928 中四五級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-06-14'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001020'::uuid);
-- line 2929 中四五級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-06-21'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001020'::uuid);
-- line 2930 中四五級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid, 'f1ee1000-0000-4000-8000-000000001020'::uuid, NULL::uuid, '2026-06-28'::date, '11:30', '12:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '11:30'
    AND coalesce(s.end_time, '') = '12:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001020'::uuid);
-- line 2931 中四五級英文科A班CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid, NULL::uuid, NULL::uuid, '2026-04-19'::date, '12:45', '14:00', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid);
-- line 2995 陳煒傑一對一CYND

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid, NULL::uuid, NULL::uuid, '2026-04-26'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid
    AND s.scheduled_date = '2026-04-26'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid);
-- line 2996 陳煒傑一對一CYND

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid, NULL::uuid, NULL::uuid, '2026-05-03'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid);
-- line 2997 陳煒傑一對一CYND

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid, NULL::uuid, NULL::uuid, '2026-05-10'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid);
-- line 2998 陳煒傑一對一CYND

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid, NULL::uuid, NULL::uuid, '2026-05-17'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid);
-- line 2999 陳煒傑一對一CYND

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid, NULL::uuid, NULL::uuid, '2026-05-24'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid);
-- line 3000 陳煒傑一對一CYND

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid, NULL::uuid, NULL::uuid, '2026-05-31'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid);
-- line 3001 陳煒傑一對一CYND

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid, NULL::uuid, NULL::uuid, '2026-06-07'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid);
-- line 3002 陳煒傑一對一CYND

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid, NULL::uuid, NULL::uuid, '2026-06-14'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid);
-- line 3003 陳煒傑一對一CYND

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid, NULL::uuid, NULL::uuid, '2026-06-21'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid);
-- line 3004 陳煒傑一對一CYND

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid, NULL::uuid, NULL::uuid, '2026-06-28'::date, '12:45', '14:00', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '12:45'
    AND coalesce(s.end_time, '') = '14:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid);
-- line 3006 陳煒傑一對一CYND

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '210ee57a-12af-415e-8543-73862201a136'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-04-20'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '210ee57a-12af-415e-8543-73862201a136'::uuid
    AND s.scheduled_date = '2026-04-20'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '210ee57a-12af-415e-8543-73862201a136'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 3054 中二級中文科A班 SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '210ee57a-12af-415e-8543-73862201a136'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-04-27'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '210ee57a-12af-415e-8543-73862201a136'::uuid
    AND s.scheduled_date = '2026-04-27'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '210ee57a-12af-415e-8543-73862201a136'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 3055 中二級中文科A班 SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '210ee57a-12af-415e-8543-73862201a136'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-05-04'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '210ee57a-12af-415e-8543-73862201a136'::uuid
    AND s.scheduled_date = '2026-05-04'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '210ee57a-12af-415e-8543-73862201a136'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 3056 中二級中文科A班 SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '210ee57a-12af-415e-8543-73862201a136'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-05-11'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '210ee57a-12af-415e-8543-73862201a136'::uuid
    AND s.scheduled_date = '2026-05-11'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '210ee57a-12af-415e-8543-73862201a136'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 3057 中二級中文科A班 SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '210ee57a-12af-415e-8543-73862201a136'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-05-18'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '210ee57a-12af-415e-8543-73862201a136'::uuid
    AND s.scheduled_date = '2026-05-18'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '210ee57a-12af-415e-8543-73862201a136'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 3058 中二級中文科A班 SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '210ee57a-12af-415e-8543-73862201a136'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-05-25'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '210ee57a-12af-415e-8543-73862201a136'::uuid
    AND s.scheduled_date = '2026-05-25'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '210ee57a-12af-415e-8543-73862201a136'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 3059 中二級中文科A班 SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '210ee57a-12af-415e-8543-73862201a136'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-01'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '210ee57a-12af-415e-8543-73862201a136'::uuid
    AND s.scheduled_date = '2026-06-01'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '210ee57a-12af-415e-8543-73862201a136'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 3060 中二級中文科A班 SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '210ee57a-12af-415e-8543-73862201a136'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-08'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '210ee57a-12af-415e-8543-73862201a136'::uuid
    AND s.scheduled_date = '2026-06-08'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '210ee57a-12af-415e-8543-73862201a136'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 3061 中二級中文科A班 SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '210ee57a-12af-415e-8543-73862201a136'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-15'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '210ee57a-12af-415e-8543-73862201a136'::uuid
    AND s.scheduled_date = '2026-06-15'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '210ee57a-12af-415e-8543-73862201a136'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 3062 中二級中文科A班 SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '210ee57a-12af-415e-8543-73862201a136'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-22'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '210ee57a-12af-415e-8543-73862201a136'::uuid
    AND s.scheduled_date = '2026-06-22'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '210ee57a-12af-415e-8543-73862201a136'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 3063 中二級中文科A班 SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '210ee57a-12af-415e-8543-73862201a136'::uuid, 'f1ee1000-0000-4000-8000-000000001016'::uuid, NULL::uuid, '2026-06-29'::date, '16:30', '17:45', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '210ee57a-12af-415e-8543-73862201a136'::uuid
    AND s.scheduled_date = '2026-06-29'::date
    AND coalesce(s.start_time, '') = '16:30'
    AND coalesce(s.end_time, '') = '17:45'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '210ee57a-12af-415e-8543-73862201a136'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001016'::uuid);
-- line 3064 中二級中文科A班 SHEK

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-05-17'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001019'::uuid);
-- line 3089 中四級BAFS科A班 Rafael

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-05-24'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001019'::uuid);
-- line 3090 中四級BAFS科A班 Rafael

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-05-31'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001019'::uuid);
-- line 3091 中四級BAFS科A班 Rafael

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-06-07'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001019'::uuid);
-- line 3092 中四級BAFS科A班 Rafael

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-06-14'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001019'::uuid);
-- line 3093 中四級BAFS科A班 Rafael

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-06-21'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001019'::uuid);
-- line 3094 中四級BAFS科A班 Rafael

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-06-28'::date, '10:15', '11:30', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '10:15'
    AND coalesce(s.end_time, '') = '11:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001019'::uuid);
-- line 3095 中四級BAFS科A班 Rafael

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, 'f1ee1000-0000-4000-8000-000000001001'::uuid, NULL::uuid, '2026-04-17'::date, '16:00', '18:00', '預定', '[2526排程CSV] 原狀態:補堂 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid
    AND s.scheduled_date = '2026-04-17'::date
    AND coalesce(s.start_time, '') = '16:00'
    AND coalesce(s.end_time, '') = '18:00'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001001'::uuid);
-- line 3125 中六級生物科A班JCHU

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid, NULL::uuid, NULL::uuid, '2026-04-19'::date, '14:00', '15:15', '完成', '[2526排程CSV] 原狀態:正常（已完成） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid
    AND s.scheduled_date = '2026-04-19'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid);
-- line 3131 中五級英文科一對一 CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid, NULL::uuid, NULL::uuid, '2026-05-03'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid
    AND s.scheduled_date = '2026-05-03'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid);
-- line 3133 中五級英文科一對一 CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid, NULL::uuid, NULL::uuid, '2026-05-10'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid
    AND s.scheduled_date = '2026-05-10'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid);
-- line 3134 中五級英文科一對一 CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid, NULL::uuid, NULL::uuid, '2026-05-17'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid
    AND s.scheduled_date = '2026-05-17'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid);
-- line 3135 中五級英文科一對一 CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid, NULL::uuid, NULL::uuid, '2026-05-24'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid
    AND s.scheduled_date = '2026-05-24'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid);
-- line 3136 中五級英文科一對一 CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid, NULL::uuid, NULL::uuid, '2026-05-31'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid
    AND s.scheduled_date = '2026-05-31'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid);
-- line 3137 中五級英文科一對一 CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid, NULL::uuid, NULL::uuid, '2026-06-07'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid
    AND s.scheduled_date = '2026-06-07'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid);
-- line 3138 中五級英文科一對一 CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid, NULL::uuid, NULL::uuid, '2026-06-14'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid
    AND s.scheduled_date = '2026-06-14'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid);
-- line 3139 中五級英文科一對一 CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid, NULL::uuid, NULL::uuid, '2026-06-21'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid
    AND s.scheduled_date = '2026-06-21'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid);
-- line 3140 中五級英文科一對一 CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid, NULL::uuid, NULL::uuid, '2026-06-28'::date, '14:00', '15:15', '預定', '[2526排程CSV] 原狀態:正常（排程中） 對班:soft_match(115)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid
    AND s.scheduled_date = '2026-06-28'::date
    AND coalesce(s.start_time, '') = '14:00'
    AND coalesce(s.end_time, '') = '15:15'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid);
-- line 3141 中五級英文科一對一 CYNG

INSERT INTO public.schedules (class_id, teacher_id, classroom_id, scheduled_date, start_time, end_time, status, remarks)
SELECT '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid, 'f1ee1000-0000-4000-8000-000000001019'::uuid, NULL::uuid, '2026-04-23'::date, '17:15', '18:30', '預定', '[2526排程CSV] 原狀態:補堂 對班:班名鍵精確/括號變體'
WHERE NOT EXISTS (
  SELECT 1 FROM public.schedules s
  WHERE s.class_id = '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid
    AND s.scheduled_date = '2026-04-23'::date
    AND coalesce(s.start_time, '') = '17:15'
    AND coalesce(s.end_time, '') = '18:30'
)
AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid)
AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = 'f1ee1000-0000-4000-8000-000000001019'::uuid);
-- line 3143 中四級BAFS科A班 Rafael

COMMIT;