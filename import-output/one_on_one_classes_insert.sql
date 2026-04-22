-- 一對一／單對單班別：寫入 public.classes（course_code 留空；無老師／課室）
-- 來源：import-output/one_on_one_and_single_classes.csv
-- 每列固定 uuid，便於之後寫 student_class_enrollments。執行前請備份。

BEGIN;

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('005e8d52-6109-522e-9478-2023cf91b100'::uuid, '溫珏禧/中六數學一對一', NULL, ARRAY['中六級']::text[], '星期二', '20:15-22:15', NULL, NULL, NULL, 825, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=44 原始班名：溫珏禧/中六數學一對一

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('bbbe5495-4c46-50ba-b7c3-cd4960d4ab73'::uuid, '中四級英文科單對單', NULL, ARRAY['中四級']::text[], '星期三', '16:30-17:45, 17:45-19:00', NULL, NULL, NULL, 825, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=49 原始班名：中四級英文科單對單JLAU

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('e0ba7411-3a12-5a09-82b6-1876d091582a'::uuid, '中四級M2科單對單', NULL, ARRAY['中四級']::text[], NULL, '10:15-11:30', NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=51 原始班名：中四級M2科單對單NKWO

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('c91ce175-d827-595f-90c3-6196ded6c598'::uuid, '中一級數學科單對單', NULL, ARRAY['中一級']::text[], '星期六', '15:15-16:30', NULL, NULL, NULL, 625, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=56 原始班名：中一級數學科單對單NKWO

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('61a49dfc-f3ed-551b-9865-48e6d8bc7454'::uuid, '中四級英文科一對一', NULL, ARRAY['中四級']::text[], NULL, '17:45-19:00', NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=57 原始班名：中四級英文科一對一JLAU

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('88cd19b5-db52-5f1a-9880-851eab3fc9be'::uuid, '中五級BAFS科單對單', NULL, ARRAY['中五級']::text[], '星期三', '14:15-17:45', NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=59 原始班名：中五級BAFS科單對單RALI

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('6cf56a34-42ff-59e2-964e-64186dcebf9e'::uuid, '中六級英文科一對一', NULL, ARRAY['中六級']::text[], NULL, '15:15-16:30', NULL, NULL, NULL, 825, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=76 原始班名：中六級英文科一對一JLAU

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('d4a698bf-e6e0-5b1c-a56a-dd8a7f311459'::uuid, '中六級數學科一對一', NULL, ARRAY['中六級']::text[], NULL, '17:45-19:00', NULL, NULL, NULL, 825, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=77 原始班名：中六級數學科一對一MYU

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('e8c7604a-1f15-56a7-8253-0e8661f114ee'::uuid, '（試）中四級化學科一對一', NULL, ARRAY['中四級']::text[], NULL, '16:30-17:45', NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=79 原始班名：（試）中四級化學科一對一SBLA

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('b85da346-e8e3-5c0e-87fd-cc921403da08'::uuid, '中五莊靖思中文科單對單', NULL, ARRAY['中五級']::text[], NULL, '15:15-16:30', NULL, NULL, NULL, 825, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=81 原始班名：中五莊靖思中文科單對單

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('403e47ed-ac7b-5c0c-b159-3629dac22da2'::uuid, '中五莊靖思生物科單對單', NULL, ARRAY['中五級']::text[], NULL, '17:45-19:00', NULL, NULL, NULL, 825, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=82 原始班名：中五莊靖思生物科單對單

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('0611f048-1abf-5d73-ab36-8b860a9ebb75'::uuid, '中五莊靖思物理科單對單', NULL, ARRAY['中五級']::text[], NULL, '16:30-17:45, 17:45-19:00', NULL, NULL, NULL, 825, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=83 原始班名：中五莊靖思物理科單對單

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('b3b16a30-5018-56a8-95ad-70e6c4e085e2'::uuid, '中五莊靖思BAFS科單對單', NULL, ARRAY['中五級']::text[], NULL, NULL, NULL, NULL, NULL, 825, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=84 原始班名：中五莊靖思BAFS科單對單

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('2b48c681-8017-590b-852f-232097fac865'::uuid, '中一級數學科單對單', NULL, ARRAY['中一級']::text[], '星期四', '18:00-19:15', NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=87 原始班名：中一級數學科單對單NKWO

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('e3fc2cfb-ddde-5bcd-8079-f987585fec5c'::uuid, '林家綺中文科單對單', NULL, ARRAY['中四級']::text[], NULL, '15:15-16:30', NULL, NULL, NULL, 825, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=88 原始班名：林家綺中文科單對單 CFAN

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('0321e2d4-5ac7-5303-ba20-0f33e3126db2'::uuid, '俞逸軒一對一', NULL, ARRAY['中六級']::text[], '星期二', '19:00-20:15', NULL, NULL, NULL, 825, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=89 原始班名：俞逸軒一對一 MYU

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('7702ea6f-bd18-506a-bee5-7605213bf5fa'::uuid, '陳煒傑一對一', NULL, NULL, '星期日', '12:45-14:00', NULL, NULL, NULL, 825, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=93 原始班名：陳煒傑一對一CYND

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('2b8c7bb6-e76b-5816-9a9a-bfeaedf13561'::uuid, '中六級中文科一對一', NULL, ARRAY['中六級']::text[], '星期五, 星期一', '15:15-16:30', NULL, NULL, NULL, 825, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=95 原始班名：中六級中文科一對一CFAN

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('9dac7c67-dd60-57cf-82b5-17d01f31228a'::uuid, '馮記昰一對一', NULL, ARRAY['中二級']::text[], NULL, '19:00-20:15', NULL, NULL, NULL, 825, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=105 原始班名：馮記昰一對一Kenneth

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('987d72f6-0aac-5032-8100-2fc1e56cec8f'::uuid, '中三級物理科單對單', NULL, ARRAY['中三級']::text[], '星期一', '20:00-21:15', NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=106 原始班名：中三級物理科單對單THOM

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('3f6cfda5-189d-554c-baa4-0112dd6ba5d8'::uuid, '中六級中文科一對一', NULL, ARRAY['中六級']::text[], NULL, '16:15-17:30, 17:30-18:45', NULL, NULL, NULL, 825, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=107 原始班名：中六級中文科一對一 CFAN

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid, '中五級英文科一對一', NULL, ARRAY['中五級']::text[], '星期日', '14:00-15:15', NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=108 原始班名：中五級英文科一對一 CYNG

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('562eadbf-b824-5329-9cad-cb69f5fdb209'::uuid, '中五級英文科一對一', NULL, ARRAY['中五級']::text[], NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=109 原始班名：中五級英文科一對一 CYNG

-- row_index → class_id 對照（選課／核對用）
-- 44:005e8d52-6109-522e-9478-2023cf91b100 | 49:bbbe5495-4c46-50ba-b7c3-cd4960d4ab73 | 51:e0ba7411-3a12-5a09-82b6-1876d091582a | 56:c91ce175-d827-595f-90c3-6196ded6c598 | 57:61a49dfc-f3ed-551b-9865-48e6d8bc7454 | 59:88cd19b5-db52-5f1a-9880-851eab3fc9be | 76:6cf56a34-42ff-59e2-964e-64186dcebf9e | 77:d4a698bf-e6e0-5b1c-a56a-dd8a7f311459 | 79:e8c7604a-1f15-56a7-8253-0e8661f114ee | 81:b85da346-e8e3-5c0e-87fd-cc921403da08 | 82:403e47ed-ac7b-5c0c-b159-3629dac22da2 | 83:0611f048-1abf-5d73-ab36-8b860a9ebb75 | 84:b3b16a30-5018-56a8-95ad-70e6c4e085e2 | 87:2b48c681-8017-590b-852f-232097fac865 | 88:e3fc2cfb-ddde-5bcd-8079-f987585fec5c | 89:0321e2d4-5ac7-5303-ba20-0f33e3126db2 | 93:7702ea6f-bd18-506a-bee5-7605213bf5fa | 95:2b8c7bb6-e76b-5816-9a9a-bfeaedf13561 | 105:9dac7c67-dd60-57cf-82b5-17d01f31228a | 106:987d72f6-0aac-5032-8100-2fc1e56cec8f | 107:3f6cfda5-189d-554c-baa4-0112dd6ba5d8 | 108:bc798b21-6476-5754-954e-edb5b4ba22f2 | 109:562eadbf-b824-5329-9cad-cb69f5fdb209

COMMIT;