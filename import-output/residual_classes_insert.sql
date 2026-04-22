-- 對照報告中「對不到」+「模糊多候選」之 CSV 列：新增 public.classes
-- 共 22 筆；course_code / teacher_id / classroom_id 為 NULL
-- 執行前請備份；若與既有班別語意重複，請自行刪除或調整後再執行。

BEGIN;

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '北區百人英文科星期三組', NULL, ARRAY['中五級','中六級','中四級']::text[], '星期三', '19:00-20:15', NULL, NULL, NULL, 950, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=42 原始班名：北區百人英文科星期三組

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('306a873b-d0dd-584b-9040-620dea54d4fa'::uuid, '中四級M2科單對單', NULL, ARRAY['中四級']::text[], NULL, '10:15-11:30', NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=51 原始班名：中四級M2科單對單NKWO

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('1a00cbaf-079f-56f5-a8ec-c706ea085bd5'::uuid, '北區百人英文科星期四組', NULL, ARRAY['中五級','中六級','中四級']::text[], '星期四', '19:00-20:15', NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=54 原始班名：北區百人英文科星期四組

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('32d27b30-3c72-5de1-ac94-12e4f0ab4652'::uuid, '中四級英文科一對一', NULL, ARRAY['中四級']::text[], NULL, '17:45-19:00', NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=57 原始班名：中四級英文科一對一JLAU

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('b3a33113-49e2-5946-81c0-0a6f070253fa'::uuid, '中三級聖誕中文科範文班', NULL, ARRAY['中三級']::text[], NULL, '11:30-12:45, 12:45-14:00', NULL, NULL, NULL, 250, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=60 原始班名：中三級聖誕中文科範文班CFAN

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('23545f03-b404-5400-a978-bc912c2241d3'::uuid, '中五級聖誕中文科範文班', NULL, ARRAY['中五級']::text[], NULL, '11:30-12:45, 12:45-14:00', NULL, NULL, NULL, 275, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=62 原始班名：中五級聖誕中文科範文班CFAN

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('fd006aab-01f8-56ac-b0bb-268b9c3273e7'::uuid, '中六級聖誕中文科範文班', NULL, ARRAY['中六級']::text[], NULL, '15:15-16:30, 16:30-17:45', NULL, NULL, NULL, 275, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=63 原始班名：中六級聖誕中文科範文班CFAN

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('a17e604c-21c8-5d6f-98b4-4abf21c78891'::uuid, '中五級聖誕英文科操卷班', NULL, ARRAY['中五級']::text[], NULL, '11:30-12:45, 12:45-14:00', NULL, NULL, NULL, 275, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=65 原始班名：中五級聖誕英文科操卷班JLAU

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('2aee06cb-2630-53c2-911d-b55e1c288c11'::uuid, '中四級數學科操卷班', NULL, ARRAY['中四級']::text[], NULL, '11:30-12:45, 12:45-14:00', NULL, NULL, NULL, 275, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=67 原始班名：中四級數學科操卷班MYU

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('91b3d1b0-dc0b-5401-b664-77e528afc602'::uuid, '中五級數學科操卷班', NULL, ARRAY['中五級']::text[], NULL, '15:15-16:30, 16:30-17:45', NULL, NULL, NULL, 275, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=68 原始班名：中五級數學科操卷班MYU

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('31c49d90-2cf6-5df0-a0f1-f53ff8214bc9'::uuid, '中六級數學科操卷班', NULL, ARRAY['中六級']::text[], NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=69 原始班名：中六級數學科操卷班MYU

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('ed572526-da92-59ed-aa1e-7c54b5357c43'::uuid, '中一級數學科操卷班', NULL, ARRAY['中一級']::text[], NULL, '11:30-12:45, 12:45-14:00', NULL, NULL, NULL, 250, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=70 原始班名：中一級數學科操卷班NKWO

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('565ec2a7-fead-5408-90be-ea7d3bc28823'::uuid, '中四級會計理財操卷班', NULL, ARRAY['中四級']::text[], NULL, '10:15-11:30, 11:30-12:45', NULL, NULL, NULL, 275, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=73 原始班名：中四級會計理財操卷班LING

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('8cdc3f86-fc05-5313-b93b-bce3ffbedc1a'::uuid, '中五級會計理財操卷班', NULL, ARRAY['中五級']::text[], NULL, '17:45-19:00, 19:00-20:15', NULL, NULL, NULL, 275, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=74 原始班名：中五級會計理財操卷班LING

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('b075b618-7cc2-5953-bc4f-8bb2c4da9949'::uuid, '中六級會計理財操卷班', NULL, ARRAY['中六級']::text[], NULL, '14:00-15:15, 15:15-16:30', NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=75 原始班名：中六級會計理財操卷班LING

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('8df44c46-8f35-57b7-a5e8-39f349aace93'::uuid, '中六級英文科一對二', NULL, ARRAY['中六級']::text[], NULL, '14:00-15:15', NULL, NULL, NULL, 550, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=78 原始班名：中六級英文科一對二CYNG

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('2a48b2d2-f78e-54f5-9211-e3882f7d6b2b'::uuid, '中五莊靖思中文科單對單', NULL, ARRAY['中五級']::text[], NULL, '15:15-16:30', NULL, NULL, NULL, 825, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=81 原始班名：中五莊靖思中文科單對單

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('5c865266-89ac-5657-a4b8-b5481181d0dd'::uuid, '中五莊靖思生物科單對單', NULL, ARRAY['中五級']::text[], NULL, '17:45-19:00', NULL, NULL, NULL, 825, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=82 原始班名：中五莊靖思生物科單對單

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('1cff8de6-f6ab-5ae4-b56a-471f385c89d5'::uuid, '中五莊靖思BAFS科單對單', NULL, ARRAY['中五級']::text[], NULL, NULL, NULL, NULL, NULL, 825, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=84 原始班名：中五莊靖思BAFS科單對單

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('7660d2d3-8130-5351-ac91-cda5b209940c'::uuid, '補堂/加堂專用', NULL, ARRAY['中一級']::text[], NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=94 原始班名：補堂/加堂專用LIAM

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('1eeef1e2-4da6-59aa-bbdf-cff365b2e7fa'::uuid, '智珩功課班', NULL, ARRAY['中二級']::text[], NULL, '16:30-17:45', NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=97 原始班名：智珩功課班 Rain

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('00739748-862e-5153-a032-9c659138fb7b'::uuid, '中五級英文科一對一', NULL, ARRAY['中五級']::text[], NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');
-- row_index=109 原始班名：中五級英文科一對一 CYNG

-- row_index → class_id（選課用）
-- 42:a8018965-f273-5b4f-acb1-186af2767d6f | 51:306a873b-d0dd-584b-9040-620dea54d4fa | 54:1a00cbaf-079f-56f5-a8ec-c706ea085bd5 | 57:32d27b30-3c72-5de1-ac94-12e4f0ab4652 | 60:b3a33113-49e2-5946-81c0-0a6f070253fa | 62:23545f03-b404-5400-a978-bc912c2241d3 | 63:fd006aab-01f8-56ac-b0bb-268b9c3273e7 | 65:a17e604c-21c8-5d6f-98b4-4abf21c78891 | 67:2aee06cb-2630-53c2-911d-b55e1c288c11 | 68:91b3d1b0-dc0b-5401-b664-77e528afc602 | 69:31c49d90-2cf6-5df0-a0f1-f53ff8214bc9 | 70:ed572526-da92-59ed-aa1e-7c54b5357c43 | 73:565ec2a7-fead-5408-90be-ea7d3bc28823 | 74:8cdc3f86-fc05-5313-b93b-bce3ffbedc1a | 75:b075b618-7cc2-5953-bc4f-8bb2c4da9949 | 78:8df44c46-8f35-57b7-a5e8-39f349aace93 | 81:2a48b2d2-f78e-54f5-9211-e3882f7d6b2b | 82:5c865266-89ac-5657-a4b8-b5481181d0dd | 84:1cff8de6-f6ab-5ae4-b56a-471f385c89d5 | 94:7660d2d3-8130-5351-ac91-cda5b209940c | 97:1eeef1e2-4da6-59aa-bbdf-cff365b2e7fa | 109:00739748-862e-5153-a032-9c659138fb7b

COMMIT;