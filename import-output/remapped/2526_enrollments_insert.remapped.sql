-- AUTO-REMAP from 2526_enrollments_insert.sql
-- table: student_class_enrollments
-- total old refs: 856
-- class remapped refs: 412
-- class unmapped refs: 0
-- student remapped refs: 414
-- student unmapped refs: 30

-- 2526 CSV → student_class_enrollments（略過已存在之相同 student_id + class_id）
-- 重名學生已取第一筆 id，請見 import-output/enrollment_generation_report.json

BEGIN;

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '96cd39e1-d5c1-4994-b5a9-58e9cddfe5bf'::uuid, '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '96cd39e1-d5c1-4994-b5a9-58e9cddfe5bf'::uuid AND e.class_id = '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid
);
-- row 2 中四級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '3e92f8a4-49ab-42e9-9687-e6735b26411e'::uuid, '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '3e92f8a4-49ab-42e9-9687-e6735b26411e'::uuid AND e.class_id = '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid
);
-- row 2 中四級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '029ff376-ea0b-466e-8d78-6b71a4ca6e0e'::uuid, '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '029ff376-ea0b-466e-8d78-6b71a4ca6e0e'::uuid AND e.class_id = '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid
);
-- row 2 中四級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '65443d7d-dd95-4dcf-8ab3-287e19edbf76'::uuid, '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '65443d7d-dd95-4dcf-8ab3-287e19edbf76'::uuid AND e.class_id = '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid
);
-- row 2 中四級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'a09da146-6195-4d68-a1f8-22a8202a1f3d'::uuid, '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'a09da146-6195-4d68-a1f8-22a8202a1f3d'::uuid AND e.class_id = '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid
);
-- row 3 中四級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'db2d4d1b-7b41-461f-bd22-8b86e0e27014'::uuid, '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'db2d4d1b-7b41-461f-bd22-8b86e0e27014'::uuid AND e.class_id = '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid
);
-- row 3 中四級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b173bc1e-153d-4ef7-9ed6-a36be060319c'::uuid, '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b173bc1e-153d-4ef7-9ed6-a36be060319c'::uuid AND e.class_id = '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid
);
-- row 4 中四級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '96cd39e1-d5c1-4994-b5a9-58e9cddfe5bf'::uuid, '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '96cd39e1-d5c1-4994-b5a9-58e9cddfe5bf'::uuid AND e.class_id = '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid
);
-- row 4 中四級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '3e92f8a4-49ab-42e9-9687-e6735b26411e'::uuid, '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '3e92f8a4-49ab-42e9-9687-e6735b26411e'::uuid AND e.class_id = '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid
);
-- row 4 中四級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '40740569-ed26-4b9c-9bca-1afb6eb920ab'::uuid, '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '40740569-ed26-4b9c-9bca-1afb6eb920ab'::uuid AND e.class_id = '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid
);
-- row 4 中四級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '5cad8567-6932-437f-8488-65af68420a02'::uuid, '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '5cad8567-6932-437f-8488-65af68420a02'::uuid AND e.class_id = '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid
);
-- row 4 中四級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '5174ab4c-3cf9-4640-97c8-78dd6f83c44e'::uuid, '43aab94a-c3d2-4647-abbb-244d9ae970aa'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科B班'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '5174ab4c-3cf9-4640-97c8-78dd6f83c44e'::uuid AND e.class_id = '43aab94a-c3d2-4647-abbb-244d9ae970aa'::uuid
);
-- row 5 中四五級英文科B班

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '2d75a8f3-7d21-49e3-985c-6b7defb351fc'::uuid, '43aab94a-c3d2-4647-abbb-244d9ae970aa'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科B班'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '2d75a8f3-7d21-49e3-985c-6b7defb351fc'::uuid AND e.class_id = '43aab94a-c3d2-4647-abbb-244d9ae970aa'::uuid
);
-- row 5 中四五級英文科B班

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'c5ca6855-9331-4e61-af32-2d5dd9cd75cc'::uuid, '43aab94a-c3d2-4647-abbb-244d9ae970aa'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科B班'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'c5ca6855-9331-4e61-af32-2d5dd9cd75cc'::uuid AND e.class_id = '43aab94a-c3d2-4647-abbb-244d9ae970aa'::uuid
);
-- row 5 中四五級英文科B班

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd9b18c83-41c2-4e39-94f9-95513e096c39'::uuid, '43aab94a-c3d2-4647-abbb-244d9ae970aa'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科B班'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd9b18c83-41c2-4e39-94f9-95513e096c39'::uuid AND e.class_id = '43aab94a-c3d2-4647-abbb-244d9ae970aa'::uuid
);
-- row 5 中四五級英文科B班

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'f93c9942-8f06-4354-9f95-30c01fd6b58d'::uuid, '43aab94a-c3d2-4647-abbb-244d9ae970aa'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科B班'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'f93c9942-8f06-4354-9f95-30c01fd6b58d'::uuid AND e.class_id = '43aab94a-c3d2-4647-abbb-244d9ae970aa'::uuid
);
-- row 5 中四五級英文科B班

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'e850f4ce-0e20-4280-9d14-b5f85b39dcdc'::uuid, '43aab94a-c3d2-4647-abbb-244d9ae970aa'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科B班'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'e850f4ce-0e20-4280-9d14-b5f85b39dcdc'::uuid AND e.class_id = '43aab94a-c3d2-4647-abbb-244d9ae970aa'::uuid
);
-- row 5 中四五級英文科B班

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '813935d3-09f3-4f8c-b633-6a3be4692649'::uuid, '43aab94a-c3d2-4647-abbb-244d9ae970aa'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科B班'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '813935d3-09f3-4f8c-b633-6a3be4692649'::uuid AND e.class_id = '43aab94a-c3d2-4647-abbb-244d9ae970aa'::uuid
);
-- row 5 中四五級英文科B班

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '3bf0758e-7f75-403c-82eb-a995ef71f447'::uuid, '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級M2科A班TIMC'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '3bf0758e-7f75-403c-82eb-a995ef71f447'::uuid AND e.class_id = '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid
);
-- row 6 中四級M2科A班TIMC

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '813935d3-09f3-4f8c-b633-6a3be4692649'::uuid, 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級中文科A班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '813935d3-09f3-4f8c-b633-6a3be4692649'::uuid AND e.class_id = 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid
);
-- row 8 中五級中文科A班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'aeaa29b9-9ca0-43c5-954c-ee4757266a3c'::uuid, 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級中文科A班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'aeaa29b9-9ca0-43c5-954c-ee4757266a3c'::uuid AND e.class_id = 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid
);
-- row 8 中五級中文科A班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '065d4b56-88e3-4063-91f1-4a4792add0c0'::uuid, 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級中文科A班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '065d4b56-88e3-4063-91f1-4a4792add0c0'::uuid AND e.class_id = 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid
);
-- row 8 中五級中文科A班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '108c284f-4f70-4689-a6c3-4af894eb74b4'::uuid, 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '108c284f-4f70-4689-a6c3-4af894eb74b4'::uuid AND e.class_id = 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid
);
-- row 9 中五級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'c5ca6855-9331-4e61-af32-2d5dd9cd75cc'::uuid, 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'c5ca6855-9331-4e61-af32-2d5dd9cd75cc'::uuid AND e.class_id = 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid
);
-- row 9 中五級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'f93c9942-8f06-4354-9f95-30c01fd6b58d'::uuid, 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'f93c9942-8f06-4354-9f95-30c01fd6b58d'::uuid AND e.class_id = 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid
);
-- row 9 中五級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b0107d72-413c-4e5b-94e0-0a4de1d14f6f'::uuid, 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b0107d72-413c-4e5b-94e0-0a4de1d14f6f'::uuid AND e.class_id = 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid
);
-- row 9 中五級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '6febe4d0-557d-48a2-b283-07963139d5c3'::uuid, '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '6febe4d0-557d-48a2-b283-07963139d5c3'::uuid AND e.class_id = '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid
);
-- row 10 中五級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '20361dec-731e-4c2f-bf0b-0b8f474361ff'::uuid, '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '20361dec-731e-4c2f-bf0b-0b8f474361ff'::uuid AND e.class_id = '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid
);
-- row 10 中五級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '813935d3-09f3-4f8c-b633-6a3be4692649'::uuid, '167607d0-b816-4485-9030-ff617f8b4382'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '813935d3-09f3-4f8c-b633-6a3be4692649'::uuid AND e.class_id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid
);
-- row 11 中五級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'c5ca6855-9331-4e61-af32-2d5dd9cd75cc'::uuid, '167607d0-b816-4485-9030-ff617f8b4382'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'c5ca6855-9331-4e61-af32-2d5dd9cd75cc'::uuid AND e.class_id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid
);
-- row 11 中五級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'aeaa29b9-9ca0-43c5-954c-ee4757266a3c'::uuid, '167607d0-b816-4485-9030-ff617f8b4382'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'aeaa29b9-9ca0-43c5-954c-ee4757266a3c'::uuid AND e.class_id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid
);
-- row 11 中五級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'f93c9942-8f06-4354-9f95-30c01fd6b58d'::uuid, '167607d0-b816-4485-9030-ff617f8b4382'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'f93c9942-8f06-4354-9f95-30c01fd6b58d'::uuid AND e.class_id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid
);
-- row 11 中五級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '3f44050b-d295-4ed4-ae90-6f58eafdcccd'::uuid, '167607d0-b816-4485-9030-ff617f8b4382'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '3f44050b-d295-4ed4-ae90-6f58eafdcccd'::uuid AND e.class_id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid
);
-- row 11 中五級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b0107d72-413c-4e5b-94e0-0a4de1d14f6f'::uuid, '167607d0-b816-4485-9030-ff617f8b4382'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b0107d72-413c-4e5b-94e0-0a4de1d14f6f'::uuid AND e.class_id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid
);
-- row 11 中五級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '6febe4d0-557d-48a2-b283-07963139d5c3'::uuid, '167607d0-b816-4485-9030-ff617f8b4382'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '6febe4d0-557d-48a2-b283-07963139d5c3'::uuid AND e.class_id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid
);
-- row 11 中五級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '20361dec-731e-4c2f-bf0b-0b8f474361ff'::uuid, '167607d0-b816-4485-9030-ff617f8b4382'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '20361dec-731e-4c2f-bf0b-0b8f474361ff'::uuid AND e.class_id = '167607d0-b816-4485-9030-ff617f8b4382'::uuid
);
-- row 11 中五級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '813935d3-09f3-4f8c-b633-6a3be4692649'::uuid, '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級M2科A班TIMC'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '813935d3-09f3-4f8c-b633-6a3be4692649'::uuid AND e.class_id = '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid
);
-- row 12 中五級M2科A班TIMC

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '813935d3-09f3-4f8c-b633-6a3be4692649'::uuid, '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級物理科A班THOM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '813935d3-09f3-4f8c-b633-6a3be4692649'::uuid AND e.class_id = '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid
);
-- row 13 中五級物理科A班THOM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'dde027ee-458a-48b6-88d9-f1ec6d819698'::uuid, '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級物理科A班THOM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'dde027ee-458a-48b6-88d9-f1ec6d819698'::uuid AND e.class_id = '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid
);
-- row 13 中五級物理科A班THOM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '20361dec-731e-4c2f-bf0b-0b8f474361ff'::uuid, 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級化學科A班SBLA'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '20361dec-731e-4c2f-bf0b-0b8f474361ff'::uuid AND e.class_id = 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid
);
-- row 14 中五級化學科A班SBLA

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '813935d3-09f3-4f8c-b633-6a3be4692649'::uuid, 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級化學科A班SBLA'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '813935d3-09f3-4f8c-b633-6a3be4692649'::uuid AND e.class_id = 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid
);
-- row 14 中五級化學科A班SBLA

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'aeaa29b9-9ca0-43c5-954c-ee4757266a3c'::uuid, 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級化學科A班SBLA'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'aeaa29b9-9ca0-43c5-954c-ee4757266a3c'::uuid AND e.class_id = 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid
);
-- row 14 中五級化學科A班SBLA

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'fa7e5572-9889-486d-9ea6-29d17ce33e4f'::uuid, 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級生物科A班JCHU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'fa7e5572-9889-486d-9ea6-29d17ce33e4f'::uuid AND e.class_id = 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid
);
-- row 15 中五級生物科A班JCHU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b09a62d4-58b0-4ba8-a413-6263a03eec8c'::uuid, 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級生物科A班JCHU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b09a62d4-58b0-4ba8-a413-6263a03eec8c'::uuid AND e.class_id = 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid
);
-- row 15 中五級生物科A班JCHU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '8b67097c-4edf-4e5a-b370-a2972e4322ef'::uuid, 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級生物科A班JCHU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '8b67097c-4edf-4e5a-b370-a2972e4322ef'::uuid AND e.class_id = 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid
);
-- row 15 中五級生物科A班JCHU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'fc090614-5e34-4daf-b367-62b79b3ecb57'::uuid, 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級生物科A班JCHU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'fc090614-5e34-4daf-b367-62b79b3ecb57'::uuid AND e.class_id = 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid
);
-- row 15 中五級生物科A班JCHU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '915602a6-c807-465f-9d8f-f66f5f070ce9'::uuid, '9d18b4f6-a4f5-4029-abb0-5c8926e16d19'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科A班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '915602a6-c807-465f-9d8f-f66f5f070ce9'::uuid AND e.class_id = '9d18b4f6-a4f5-4029-abb0-5c8926e16d19'::uuid
);
-- row 16 中六級中文科A班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'f98aacc3-3dcb-477c-be80-50e4286a8c4a'::uuid, '9d18b4f6-a4f5-4029-abb0-5c8926e16d19'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科A班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'f98aacc3-3dcb-477c-be80-50e4286a8c4a'::uuid AND e.class_id = '9d18b4f6-a4f5-4029-abb0-5c8926e16d19'::uuid
);
-- row 16 中六級中文科A班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'a44e6718-427b-43d1-93de-1e34ba3c4535'::uuid, '9d18b4f6-a4f5-4029-abb0-5c8926e16d19'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科A班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'a44e6718-427b-43d1-93de-1e34ba3c4535'::uuid AND e.class_id = '9d18b4f6-a4f5-4029-abb0-5c8926e16d19'::uuid
);
-- row 16 中六級中文科A班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '4f9e4c16-0f95-4adf-b383-593811de4c13'::uuid, '9d18b4f6-a4f5-4029-abb0-5c8926e16d19'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科A班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '4f9e4c16-0f95-4adf-b383-593811de4c13'::uuid AND e.class_id = '9d18b4f6-a4f5-4029-abb0-5c8926e16d19'::uuid
);
-- row 16 中六級中文科A班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '15b93f72-82ce-4fbe-920c-ca0c96931b6a'::uuid, '2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '15b93f72-82ce-4fbe-920c-ca0c96931b6a'::uuid AND e.class_id = '2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid
);
-- row 17 中六級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b81410b2-eb80-4af4-8d00-528ce073d5bd'::uuid, '2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b81410b2-eb80-4af4-8d00-528ce073d5bd'::uuid AND e.class_id = '2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid
);
-- row 17 中六級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '0ae337c5-615d-476e-9cb9-1544bbb8c439'::uuid, '2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '0ae337c5-615d-476e-9cb9-1544bbb8c439'::uuid AND e.class_id = '2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid
);
-- row 17 中六級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd86901d2-1e2e-46b6-9f09-6f770bc683cb'::uuid, '2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd86901d2-1e2e-46b6-9f09-6f770bc683cb'::uuid AND e.class_id = '2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid
);
-- row 17 中六級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '395e0b9d-acc1-4ef8-97ea-5c3ab4eb1ac8'::uuid, '2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '395e0b9d-acc1-4ef8-97ea-5c3ab4eb1ac8'::uuid AND e.class_id = '2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid
);
-- row 17 中六級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '99d984ce-1e92-4741-9d2a-f6b588082de4'::uuid, '2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '99d984ce-1e92-4741-9d2a-f6b588082de4'::uuid AND e.class_id = '2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid
);
-- row 17 中六級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '301a4b5e-c55d-4b4d-91d7-0bc05aada67d'::uuid, '5563dfc9-cbb2-4dfb-8cc5-f3709ce0cb76'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '301a4b5e-c55d-4b4d-91d7-0bc05aada67d'::uuid AND e.class_id = '5563dfc9-cbb2-4dfb-8cc5-f3709ce0cb76'::uuid
);
-- row 18 中六級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '395e0b9d-acc1-4ef8-97ea-5c3ab4eb1ac8'::uuid, '5563dfc9-cbb2-4dfb-8cc5-f3709ce0cb76'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '395e0b9d-acc1-4ef8-97ea-5c3ab4eb1ac8'::uuid AND e.class_id = '5563dfc9-cbb2-4dfb-8cc5-f3709ce0cb76'::uuid
);
-- row 18 中六級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'a44e6718-427b-43d1-93de-1e34ba3c4535'::uuid, '5563dfc9-cbb2-4dfb-8cc5-f3709ce0cb76'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'a44e6718-427b-43d1-93de-1e34ba3c4535'::uuid AND e.class_id = '5563dfc9-cbb2-4dfb-8cc5-f3709ce0cb76'::uuid
);
-- row 18 中六級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'e2ff6f4b-ce16-4dca-8a01-82d69a552a68'::uuid, '5563dfc9-cbb2-4dfb-8cc5-f3709ce0cb76'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'e2ff6f4b-ce16-4dca-8a01-82d69a552a68'::uuid AND e.class_id = '5563dfc9-cbb2-4dfb-8cc5-f3709ce0cb76'::uuid
);
-- row 18 中六級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '154bec19-0f58-47ee-9a40-1d33ff0e0f2a'::uuid, '370475e2-9a1e-4778-84b1-d097b4133f93'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '154bec19-0f58-47ee-9a40-1d33ff0e0f2a'::uuid AND e.class_id = '370475e2-9a1e-4778-84b1-d097b4133f93'::uuid
);
-- row 19 中六級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '411f1dad-c0d2-4205-b84e-3f342ee5c54c'::uuid, '370475e2-9a1e-4778-84b1-d097b4133f93'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '411f1dad-c0d2-4205-b84e-3f342ee5c54c'::uuid AND e.class_id = '370475e2-9a1e-4778-84b1-d097b4133f93'::uuid
);
-- row 19 中六級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'a09f0716-e546-4db0-aa69-30ff70ae6fb1'::uuid, '370475e2-9a1e-4778-84b1-d097b4133f93'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'a09f0716-e546-4db0-aa69-30ff70ae6fb1'::uuid AND e.class_id = '370475e2-9a1e-4778-84b1-d097b4133f93'::uuid
);
-- row 19 中六級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'a50f0a8f-6112-4444-9d65-f1eb29b6968f'::uuid, '370475e2-9a1e-4778-84b1-d097b4133f93'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'a50f0a8f-6112-4444-9d65-f1eb29b6968f'::uuid AND e.class_id = '370475e2-9a1e-4778-84b1-d097b4133f93'::uuid
);
-- row 19 中六級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'cc09b6ef-d2b0-437b-9d42-c2f65d9b0959'::uuid, '370475e2-9a1e-4778-84b1-d097b4133f93'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'cc09b6ef-d2b0-437b-9d42-c2f65d9b0959'::uuid AND e.class_id = '370475e2-9a1e-4778-84b1-d097b4133f93'::uuid
);
-- row 19 中六級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'e2ff6f4b-ce16-4dca-8a01-82d69a552a68'::uuid, '370475e2-9a1e-4778-84b1-d097b4133f93'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'e2ff6f4b-ce16-4dca-8a01-82d69a552a68'::uuid AND e.class_id = '370475e2-9a1e-4778-84b1-d097b4133f93'::uuid
);
-- row 19 中六級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '915602a6-c807-465f-9d8f-f66f5f070ce9'::uuid, 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科A班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '915602a6-c807-465f-9d8f-f66f5f070ce9'::uuid AND e.class_id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid
);
-- row 20 中四五級英文科A班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '174c983e-7ecf-432d-acc7-c60d0fa48623'::uuid, 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科A班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '174c983e-7ecf-432d-acc7-c60d0fa48623'::uuid AND e.class_id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid
);
-- row 20 中四五級英文科A班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'db2d4d1b-7b41-461f-bd22-8b86e0e27014'::uuid, 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科A班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'db2d4d1b-7b41-461f-bd22-8b86e0e27014'::uuid AND e.class_id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid
);
-- row 20 中四五級英文科A班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '6febe4d0-557d-48a2-b283-07963139d5c3'::uuid, 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科A班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '6febe4d0-557d-48a2-b283-07963139d5c3'::uuid AND e.class_id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid
);
-- row 20 中四五級英文科A班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '154bec19-0f58-47ee-9a40-1d33ff0e0f2a'::uuid, '1c610853-1733-40ad-90ed-5085baaea561'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級物理科A班THOM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '154bec19-0f58-47ee-9a40-1d33ff0e0f2a'::uuid AND e.class_id = '1c610853-1733-40ad-90ed-5085baaea561'::uuid
);
-- row 21 中六級物理科A班THOM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '05fbd9a6-0a16-48b0-81d1-df45293e23ec'::uuid, '1c610853-1733-40ad-90ed-5085baaea561'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級物理科A班THOM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '05fbd9a6-0a16-48b0-81d1-df45293e23ec'::uuid AND e.class_id = '1c610853-1733-40ad-90ed-5085baaea561'::uuid
);
-- row 21 中六級物理科A班THOM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '411f1dad-c0d2-4205-b84e-3f342ee5c54c'::uuid, '1c610853-1733-40ad-90ed-5085baaea561'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級物理科A班THOM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '411f1dad-c0d2-4205-b84e-3f342ee5c54c'::uuid AND e.class_id = '1c610853-1733-40ad-90ed-5085baaea561'::uuid
);
-- row 21 中六級物理科A班THOM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '2f2cbe75-b1a6-4235-b2f5-05fc3a752aa6'::uuid, '36de22e8-74e0-41e0-af01-a6cfaf72651f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級化學科A班SBLA'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '2f2cbe75-b1a6-4235-b2f5-05fc3a752aa6'::uuid AND e.class_id = '36de22e8-74e0-41e0-af01-a6cfaf72651f'::uuid
);
-- row 22 中六級化學科A班SBLA

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '5707f4fb-4f63-4098-86d8-8682033e5859'::uuid, '36de22e8-74e0-41e0-af01-a6cfaf72651f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級化學科A班SBLA'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '5707f4fb-4f63-4098-86d8-8682033e5859'::uuid AND e.class_id = '36de22e8-74e0-41e0-af01-a6cfaf72651f'::uuid
);
-- row 22 中六級化學科A班SBLA

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '2f2cbe75-b1a6-4235-b2f5-05fc3a752aa6'::uuid, '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級生物科A班JCHU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '2f2cbe75-b1a6-4235-b2f5-05fc3a752aa6'::uuid AND e.class_id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid
);
-- row 23 中六級生物科A班JCHU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'a644ff5a-3115-47f4-ade3-7a2fca30897e'::uuid, '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級生物科A班JCHU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'a644ff5a-3115-47f4-ade3-7a2fca30897e'::uuid AND e.class_id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid
);
-- row 23 中六級生物科A班JCHU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '0ae337c5-615d-476e-9cb9-1544bbb8c439'::uuid, '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級生物科A班JCHU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '0ae337c5-615d-476e-9cb9-1544bbb8c439'::uuid AND e.class_id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid
);
-- row 23 中六級生物科A班JCHU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd86901d2-1e2e-46b6-9f09-6f770bc683cb'::uuid, '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級生物科A班JCHU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd86901d2-1e2e-46b6-9f09-6f770bc683cb'::uuid AND e.class_id = '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid
);
-- row 23 中六級生物科A班JCHU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '025a1e5d-1af3-4ca9-bb2e-42e636b03ffb'::uuid, '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科B班NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '025a1e5d-1af3-4ca9-bb2e-42e636b03ffb'::uuid AND e.class_id = '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid
);
-- row 25 中一級數學科B班NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '1ceb6453-02b0-4104-a9f0-8b6cabe31206'::uuid, '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科B班NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '1ceb6453-02b0-4104-a9f0-8b6cabe31206'::uuid AND e.class_id = '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid
);
-- row 25 中一級數學科B班NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '0b656f33-268d-4d21-a49f-a37818134fa2'::uuid, '4669cf9a-0d02-450a-a0be-3b8907764d56'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英文科B班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '0b656f33-268d-4d21-a49f-a37818134fa2'::uuid AND e.class_id = '4669cf9a-0d02-450a-a0be-3b8907764d56'::uuid
);
-- row 27 中一二級英文科B班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'bb8803c5-0b02-47ee-afc6-af3d0240705c'::uuid, '4669cf9a-0d02-450a-a0be-3b8907764d56'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英文科B班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'bb8803c5-0b02-47ee-afc6-af3d0240705c'::uuid AND e.class_id = '4669cf9a-0d02-450a-a0be-3b8907764d56'::uuid
);
-- row 27 中一二級英文科B班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '7a68bb12-3c7e-4a6e-918d-99caa4f3427a'::uuid, '4669cf9a-0d02-450a-a0be-3b8907764d56'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英文科B班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '7a68bb12-3c7e-4a6e-918d-99caa4f3427a'::uuid AND e.class_id = '4669cf9a-0d02-450a-a0be-3b8907764d56'::uuid
);
-- row 27 中一二級英文科B班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '0390c81e-b8b3-4d1e-a0f0-b2cdaae2c6a9'::uuid, '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英文科C班TIMC'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '0390c81e-b8b3-4d1e-a0f0-b2cdaae2c6a9'::uuid AND e.class_id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid
);
-- row 28 中一二級英文科C班TIMC

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '2bf676ec-00e5-42b2-bd4f-26c93580c406'::uuid, '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英文科C班TIMC'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '2bf676ec-00e5-42b2-bd4f-26c93580c406'::uuid AND e.class_id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid
);
-- row 28 中一二級英文科C班TIMC

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '9587f3e7-7016-49a3-841c-cf384c884c30'::uuid, '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英文科C班TIMC'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '9587f3e7-7016-49a3-841c-cf384c884c30'::uuid AND e.class_id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid
);
-- row 28 中一二級英文科C班TIMC

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b1d2933b-0459-4f85-9e0c-dd9eb0bc403a'::uuid, '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b1d2933b-0459-4f85-9e0c-dd9eb0bc403a'::uuid AND e.class_id = '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid
);
-- row 31 中二級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd8423166-450c-4632-a18f-1da678532886'::uuid, '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd8423166-450c-4632-a18f-1da678532886'::uuid AND e.class_id = '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid
);
-- row 31 中二級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'c6cdae79-baa1-425e-8345-976e45c84315'::uuid, '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'c6cdae79-baa1-425e-8345-976e45c84315'::uuid AND e.class_id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid
);
-- row 32 中二級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '86d25c49-66d0-406b-a725-5b4973f21df3'::uuid, '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '86d25c49-66d0-406b-a725-5b4973f21df3'::uuid AND e.class_id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid
);
-- row 32 中二級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '17575f59-9a5a-4d56-8e46-b75c6c2ae37c'::uuid, '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '17575f59-9a5a-4d56-8e46-b75c6c2ae37c'::uuid AND e.class_id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid
);
-- row 32 中二級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '0390c81e-b8b3-4d1e-a0f0-b2cdaae2c6a9'::uuid, '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '0390c81e-b8b3-4d1e-a0f0-b2cdaae2c6a9'::uuid AND e.class_id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid
);
-- row 32 中二級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '9587f3e7-7016-49a3-841c-cf384c884c30'::uuid, '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '9587f3e7-7016-49a3-841c-cf384c884c30'::uuid AND e.class_id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid
);
-- row 32 中二級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '550ef8fa-8579-42a7-904c-e634a697ae5c'::uuid, 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科B班NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '550ef8fa-8579-42a7-904c-e634a697ae5c'::uuid AND e.class_id = 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid
);
-- row 33 中二級數學科B班NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '7ffd3cb4-45b3-4a6b-bde3-2e9a7b5c37a0'::uuid, 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科B班NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '7ffd3cb4-45b3-4a6b-bde3-2e9a7b5c37a0'::uuid AND e.class_id = 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid
);
-- row 33 中二級數學科B班NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'ce8c4982-bf08-4213-86f7-99292a8f70ff'::uuid, '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級中文科A班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'ce8c4982-bf08-4213-86f7-99292a8f70ff'::uuid AND e.class_id = '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid
);
-- row 34 中三級中文科A班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd8423166-450c-4632-a18f-1da678532886'::uuid, '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級中文科A班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd8423166-450c-4632-a18f-1da678532886'::uuid AND e.class_id = '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid
);
-- row 34 中三級中文科A班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'ce8c4982-bf08-4213-86f7-99292a8f70ff'::uuid, '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'ce8c4982-bf08-4213-86f7-99292a8f70ff'::uuid AND e.class_id = '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid
);
-- row 35 中三級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '879205e4-a499-445f-86ab-ff56f3569438'::uuid, '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '879205e4-a499-445f-86ab-ff56f3569438'::uuid AND e.class_id = '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid
);
-- row 35 中三級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '3e419707-1d86-4a23-b369-46e34f95957f'::uuid, '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '3e419707-1d86-4a23-b369-46e34f95957f'::uuid AND e.class_id = '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid
);
-- row 35 中三級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '28396f5a-c066-43bf-bcc6-cfd4fee72e92'::uuid, 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級數學科B班NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '28396f5a-c066-43bf-bcc6-cfd4fee72e92'::uuid AND e.class_id = 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid
);
-- row 36 中三級數學科B班NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '5214a841-39c8-4805-8720-c20a7f202d98'::uuid, 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級數學科B班NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '5214a841-39c8-4805-8720-c20a7f202d98'::uuid AND e.class_id = 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid
);
-- row 36 中三級數學科B班NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '4ddd2ba1-1d17-46e8-b9c3-11c38a584254'::uuid, 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級數學科B班NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '4ddd2ba1-1d17-46e8-b9c3-11c38a584254'::uuid AND e.class_id = 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid
);
-- row 36 中三級數學科B班NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'e937c6a5-9116-44f3-a203-318c48fa6aec'::uuid, 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級英文科A班TIMC'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'e937c6a5-9116-44f3-a203-318c48fa6aec'::uuid AND e.class_id = 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid
);
-- row 37 中三級英文科A班TIMC

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'ce8c4982-bf08-4213-86f7-99292a8f70ff'::uuid, 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級英文科A班TIMC'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'ce8c4982-bf08-4213-86f7-99292a8f70ff'::uuid AND e.class_id = 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid
);
-- row 37 中三級英文科A班TIMC

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '1a034fbe-7be1-4a3a-954a-0e6e371cd52f'::uuid, '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級科學科A班SBLA'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '1a034fbe-7be1-4a3a-954a-0e6e371cd52f'::uuid AND e.class_id = '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid
);
-- row 38 中三級科學科A班SBLA

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '879205e4-a499-445f-86ab-ff56f3569438'::uuid, '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級科學科A班SBLA'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '879205e4-a499-445f-86ab-ff56f3569438'::uuid AND e.class_id = '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid
);
-- row 38 中三級科學科A班SBLA

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '1a034fbe-7be1-4a3a-954a-0e6e371cd52f'::uuid, 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級科學科B班THOM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '1a034fbe-7be1-4a3a-954a-0e6e371cd52f'::uuid AND e.class_id = 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid
);
-- row 39 中三級科學科B班THOM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'a1522691-c771-4b9b-b6e5-9a3c55dcbe97'::uuid, 'f12744ff-26e9-4d4e-aaed-ff331c533cc3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（中學）'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'a1522691-c771-4b9b-b6e5-9a3c55dcbe97'::uuid AND e.class_id = 'f12744ff-26e9-4d4e-aaed-ff331c533cc3'::uuid
);
-- row 40 功課輔導班（中學）

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '6858d8f8-e32f-4637-ab46-a88cef82ac45'::uuid, 'f12744ff-26e9-4d4e-aaed-ff331c533cc3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（中學）'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '6858d8f8-e32f-4637-ab46-a88cef82ac45'::uuid AND e.class_id = 'f12744ff-26e9-4d4e-aaed-ff331c533cc3'::uuid
);
-- row 40 功課輔導班（中學）

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'e9d49e58-14b5-4e81-9630-234f2b0b6596'::uuid, 'f12744ff-26e9-4d4e-aaed-ff331c533cc3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（中學）'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'e9d49e58-14b5-4e81-9630-234f2b0b6596'::uuid AND e.class_id = 'f12744ff-26e9-4d4e-aaed-ff331c533cc3'::uuid
);
-- row 40 功課輔導班（中學）

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '4bc8b385-a109-4479-844d-1c2b72e690c8'::uuid, 'f12744ff-26e9-4d4e-aaed-ff331c533cc3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（中學）'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '4bc8b385-a109-4479-844d-1c2b72e690c8'::uuid AND e.class_id = 'f12744ff-26e9-4d4e-aaed-ff331c533cc3'::uuid
);
-- row 40 功課輔導班（中學）

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '2bf676ec-00e5-42b2-bd4f-26c93580c406'::uuid, 'f12744ff-26e9-4d4e-aaed-ff331c533cc3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（中學）'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '2bf676ec-00e5-42b2-bd4f-26c93580c406'::uuid AND e.class_id = 'f12744ff-26e9-4d4e-aaed-ff331c533cc3'::uuid
);
-- row 40 功課輔導班（中學）

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '50be3ef2-b35a-464c-8e1b-08b68658d419'::uuid, 'f12744ff-26e9-4d4e-aaed-ff331c533cc3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（中學）'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '50be3ef2-b35a-464c-8e1b-08b68658d419'::uuid AND e.class_id = 'f12744ff-26e9-4d4e-aaed-ff331c533cc3'::uuid
);
-- row 40 功課輔導班（中學）

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '7be42e31-ace8-44a4-a871-77d528f341f2'::uuid, 'f12744ff-26e9-4d4e-aaed-ff331c533cc3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（中學）'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '7be42e31-ace8-44a4-a871-77d528f341f2'::uuid AND e.class_id = 'f12744ff-26e9-4d4e-aaed-ff331c533cc3'::uuid
);
-- row 40 功課輔導班（中學）

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '63893559-39a1-48ab-8a11-8279e1a57b2d'::uuid, '710c6327-6b24-488b-a183-11ed5b676286'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（小學）'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '63893559-39a1-48ab-8a11-8279e1a57b2d'::uuid AND e.class_id = '710c6327-6b24-488b-a183-11ed5b676286'::uuid
);
-- row 41 功課輔導班（小學）

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'a61d62aa-44b1-4477-98be-8d7fc007f6a1'::uuid, '710c6327-6b24-488b-a183-11ed5b676286'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（小學）'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'a61d62aa-44b1-4477-98be-8d7fc007f6a1'::uuid AND e.class_id = '710c6327-6b24-488b-a183-11ed5b676286'::uuid
);
-- row 41 功課輔導班（小學）

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '130450c8-769f-4a59-8eda-62ba44d3de40'::uuid, '710c6327-6b24-488b-a183-11ed5b676286'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（小學）'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '130450c8-769f-4a59-8eda-62ba44d3de40'::uuid AND e.class_id = '710c6327-6b24-488b-a183-11ed5b676286'::uuid
);
-- row 41 功課輔導班（小學）

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b08ea99a-47d4-42c4-b689-d88150ac29ad'::uuid, '710c6327-6b24-488b-a183-11ed5b676286'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（小學）'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b08ea99a-47d4-42c4-b689-d88150ac29ad'::uuid AND e.class_id = '710c6327-6b24-488b-a183-11ed5b676286'::uuid
);
-- row 41 功課輔導班（小學）

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'f13c6165-aeeb-4791-ba10-a2de49b58f49'::uuid, '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 北區百人英文科星期三組'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'f13c6165-aeeb-4791-ba10-a2de49b58f49'::uuid AND e.class_id = '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid
);
-- row 42 北區百人英文科星期三組

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b0107d72-413c-4e5b-94e0-0a4de1d14f6f'::uuid, '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 北區百人英文科星期三組'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b0107d72-413c-4e5b-94e0-0a4de1d14f6f'::uuid AND e.class_id = '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid
);
-- row 42 北區百人英文科星期三組

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '6febe4d0-557d-48a2-b283-07963139d5c3'::uuid, '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 北區百人英文科星期三組'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '6febe4d0-557d-48a2-b283-07963139d5c3'::uuid AND e.class_id = '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid
);
-- row 42 北區百人英文科星期三組

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '5174ab4c-3cf9-4640-97c8-78dd6f83c44e'::uuid, '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級生物科B班JCHU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '5174ab4c-3cf9-4640-97c8-78dd6f83c44e'::uuid AND e.class_id = '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid
);
-- row 43 中五級生物科B班JCHU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '789a19a5-0423-4a3c-86a4-a080aae7b952'::uuid, 'efba129c-bbfc-4ddf-ae87-7aea17ef4ac1'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 溫珏禧/中六數學一對一'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '789a19a5-0423-4a3c-86a4-a080aae7b952'::uuid AND e.class_id = 'efba129c-bbfc-4ddf-ae87-7aea17ef4ac1'::uuid
);
-- row 44 溫珏禧/中六數學一對一

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '46751600-8619-4cbd-a752-13b9b81f1984'::uuid, '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 北區百人英文科星期六組'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '46751600-8619-4cbd-a752-13b9b81f1984'::uuid AND e.class_id = '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid
);
-- row 45 北區百人英文科星期六組

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '63bbd1bc-5be3-4535-b317-b27c183d649f'::uuid, '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 北區百人英文科星期六組'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '63bbd1bc-5be3-4535-b317-b27c183d649f'::uuid AND e.class_id = '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid
);
-- row 45 北區百人英文科星期六組

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '96136915-084f-427b-9937-7beb74bf35f4'::uuid, '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 北區百人英文科星期六組'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '96136915-084f-427b-9937-7beb74bf35f4'::uuid AND e.class_id = '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid
);
-- row 45 北區百人英文科星期六組

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '314253d9-0110-4705-8b07-71caf08c7a53'::uuid, '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 北區百人英文科星期六組'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '314253d9-0110-4705-8b07-71caf08c7a53'::uuid AND e.class_id = '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid
);
-- row 45 北區百人英文科星期六組

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'ba7d09f2-5167-4418-b5ad-a83d20c67c63'::uuid, '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科C班LIAM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'ba7d09f2-5167-4418-b5ad-a83d20c67c63'::uuid AND e.class_id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid
);
-- row 48 中一級數學科C班LIAM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '02bb5dac-c1fd-43a6-aa6b-0544929c0672'::uuid, '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科C班LIAM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '02bb5dac-c1fd-43a6-aa6b-0544929c0672'::uuid AND e.class_id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid
);
-- row 48 中一級數學科C班LIAM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '8fd4f614-b322-4785-967c-daa035605150'::uuid, '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科C班LIAM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '8fd4f614-b322-4785-967c-daa035605150'::uuid AND e.class_id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid
);
-- row 48 中一級數學科C班LIAM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '754fdd71-0513-4200-a1f4-b5051fb183c6'::uuid, '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科C班LIAM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '754fdd71-0513-4200-a1f4-b5051fb183c6'::uuid AND e.class_id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid
);
-- row 48 中一級數學科C班LIAM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '5eaf6c4a-eb16-4992-948d-641652fe639f'::uuid, '807945d5-5ceb-4343-a937-48c34478341a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級英文科單對單JLAU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '5eaf6c4a-eb16-4992-948d-641652fe639f'::uuid AND e.class_id = '807945d5-5ceb-4343-a937-48c34478341a'::uuid
);
-- row 49 中四級英文科單對單JLAU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '6e060632-9bd7-4a69-9aa7-e4d9dea292a7'::uuid, '1a00cbaf-079f-56f5-a8ec-c706ea085bd5'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級英文科一對二JLAU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '6e060632-9bd7-4a69-9aa7-e4d9dea292a7'::uuid AND e.class_id = '1a00cbaf-079f-56f5-a8ec-c706ea085bd5'::uuid
);
-- row 50 中四級英文科一對二JLAU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'c21d45bc-fd44-4c45-a764-2cea83e7ff57'::uuid, '1a00cbaf-079f-56f5-a8ec-c706ea085bd5'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級英文科一對二JLAU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'c21d45bc-fd44-4c45-a764-2cea83e7ff57'::uuid AND e.class_id = '1a00cbaf-079f-56f5-a8ec-c706ea085bd5'::uuid
);
-- row 50 中四級英文科一對二JLAU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '5eaf6c4a-eb16-4992-948d-641652fe639f'::uuid, '306a873b-d0dd-584b-9040-620dea54d4fa'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級M2科單對單NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '5eaf6c4a-eb16-4992-948d-641652fe639f'::uuid AND e.class_id = '306a873b-d0dd-584b-9040-620dea54d4fa'::uuid
);
-- row 51 中四級M2科單對單NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '754fdd71-0513-4200-a1f4-b5051fb183c6'::uuid, 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級中文科A班SHEK'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '754fdd71-0513-4200-a1f4-b5051fb183c6'::uuid AND e.class_id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid
);
-- row 52 中一級中文科A班SHEK

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '521bdfcb-74ff-4166-9e6f-5721ac1650f4'::uuid, 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級中文科A班SHEK'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '521bdfcb-74ff-4166-9e6f-5721ac1650f4'::uuid AND e.class_id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid
);
-- row 52 中一級中文科A班SHEK

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'f9d50fe3-6546-46ff-9f67-630bfda1d63f'::uuid, 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級中文科A班SHEK'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'f9d50fe3-6546-46ff-9f67-630bfda1d63f'::uuid AND e.class_id = 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid
);
-- row 52 中一級中文科A班SHEK

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '065d4b56-88e3-4063-91f1-4a4792add0c0'::uuid, '93560085-b304-4169-b604-0cc96af25cc8'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級BAFS科A班RALI'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '065d4b56-88e3-4063-91f1-4a4792add0c0'::uuid AND e.class_id = '93560085-b304-4169-b604-0cc96af25cc8'::uuid
);
-- row 55 中五級BAFS科A班RALI

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd0490601-ab06-4b2f-b3e3-6e06007665c9'::uuid, 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科單對單NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd0490601-ab06-4b2f-b3e3-6e06007665c9'::uuid AND e.class_id = 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid
);
-- row 56 中一級數學科單對單NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'c21d45bc-fd44-4c45-a764-2cea83e7ff57'::uuid, '32d27b30-3c72-5de1-ac94-12e4f0ab4652'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級英文科一對一JLAU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'c21d45bc-fd44-4c45-a764-2cea83e7ff57'::uuid AND e.class_id = '32d27b30-3c72-5de1-ac94-12e4f0ab4652'::uuid
);
-- row 57 中四級英文科一對一JLAU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '0d708d45-f2c3-4edc-bf6e-f11f4f37abc0'::uuid, '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級生物科C班JCHU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '0d708d45-f2c3-4edc-bf6e-f11f4f37abc0'::uuid AND e.class_id = '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid
);
-- row 58 中五級生物科C班JCHU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'db303f37-2f92-4c35-8a7d-dd8773d1507a'::uuid, '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級生物科C班JCHU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'db303f37-2f92-4c35-8a7d-dd8773d1507a'::uuid AND e.class_id = '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid
);
-- row 58 中五級生物科C班JCHU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '47b7153c-1393-4bdf-bed2-47640213ec5e'::uuid, '2fc57346-c51f-4597-839f-9c30a8b9b65e'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級BAFS科單對單RALI'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '47b7153c-1393-4bdf-bed2-47640213ec5e'::uuid AND e.class_id = '2fc57346-c51f-4597-839f-9c30a8b9b65e'::uuid
);
-- row 59 中五級BAFS科單對單RALI

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'ce8c4982-bf08-4213-86f7-99292a8f70ff'::uuid, 'db4b8fea-9f4a-4c76-ab83-197d9dc001d3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級聖誕中文科範文班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'ce8c4982-bf08-4213-86f7-99292a8f70ff'::uuid AND e.class_id = 'db4b8fea-9f4a-4c76-ab83-197d9dc001d3'::uuid
);
-- row 60 中三級聖誕中文科範文班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd8423166-450c-4632-a18f-1da678532886'::uuid, 'db4b8fea-9f4a-4c76-ab83-197d9dc001d3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級聖誕中文科範文班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd8423166-450c-4632-a18f-1da678532886'::uuid AND e.class_id = 'db4b8fea-9f4a-4c76-ab83-197d9dc001d3'::uuid
);
-- row 60 中三級聖誕中文科範文班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '879205e4-a499-445f-86ab-ff56f3569438'::uuid, 'db4b8fea-9f4a-4c76-ab83-197d9dc001d3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級聖誕中文科範文班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '879205e4-a499-445f-86ab-ff56f3569438'::uuid AND e.class_id = 'db4b8fea-9f4a-4c76-ab83-197d9dc001d3'::uuid
);
-- row 60 中三級聖誕中文科範文班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '029ff376-ea0b-466e-8d78-6b71a4ca6e0e'::uuid, '3dc598a6-1b70-40b1-b12f-3078e769a8d3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級聖誕中文科範文班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '029ff376-ea0b-466e-8d78-6b71a4ca6e0e'::uuid AND e.class_id = '3dc598a6-1b70-40b1-b12f-3078e769a8d3'::uuid
);
-- row 61 中四級聖誕中文科範文班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '3e92f8a4-49ab-42e9-9687-e6735b26411e'::uuid, '3dc598a6-1b70-40b1-b12f-3078e769a8d3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級聖誕中文科範文班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '3e92f8a4-49ab-42e9-9687-e6735b26411e'::uuid AND e.class_id = '3dc598a6-1b70-40b1-b12f-3078e769a8d3'::uuid
);
-- row 61 中四級聖誕中文科範文班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '65443d7d-dd95-4dcf-8ab3-287e19edbf76'::uuid, '3dc598a6-1b70-40b1-b12f-3078e769a8d3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級聖誕中文科範文班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '65443d7d-dd95-4dcf-8ab3-287e19edbf76'::uuid AND e.class_id = '3dc598a6-1b70-40b1-b12f-3078e769a8d3'::uuid
);
-- row 61 中四級聖誕中文科範文班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '065d4b56-88e3-4063-91f1-4a4792add0c0'::uuid, '3ee16b58-0cb7-42ea-b535-65aaa2062120'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級聖誕中文科範文班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '065d4b56-88e3-4063-91f1-4a4792add0c0'::uuid AND e.class_id = '3ee16b58-0cb7-42ea-b535-65aaa2062120'::uuid
);
-- row 62 中五級聖誕中文科範文班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '813935d3-09f3-4f8c-b633-6a3be4692649'::uuid, '3ee16b58-0cb7-42ea-b535-65aaa2062120'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級聖誕中文科範文班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '813935d3-09f3-4f8c-b633-6a3be4692649'::uuid AND e.class_id = '3ee16b58-0cb7-42ea-b535-65aaa2062120'::uuid
);
-- row 62 中五級聖誕中文科範文班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b0107d72-413c-4e5b-94e0-0a4de1d14f6f'::uuid, '3ee16b58-0cb7-42ea-b535-65aaa2062120'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級聖誕中文科範文班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b0107d72-413c-4e5b-94e0-0a4de1d14f6f'::uuid AND e.class_id = '3ee16b58-0cb7-42ea-b535-65aaa2062120'::uuid
);
-- row 62 中五級聖誕中文科範文班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '3e92f8a4-49ab-42e9-9687-e6735b26411e'::uuid, '43aab94a-c3d2-4647-abbb-244d9ae970aa'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級聖誕英文科操卷班JLAU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '3e92f8a4-49ab-42e9-9687-e6735b26411e'::uuid AND e.class_id = '43aab94a-c3d2-4647-abbb-244d9ae970aa'::uuid
);
-- row 64 中四級聖誕英文科操卷班JLAU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b0107d72-413c-4e5b-94e0-0a4de1d14f6f'::uuid, 'ea2ce06d-6289-49d0-a377-16d3b71c9a75'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級聖誕英文科操卷班JLAU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b0107d72-413c-4e5b-94e0-0a4de1d14f6f'::uuid AND e.class_id = 'ea2ce06d-6289-49d0-a377-16d3b71c9a75'::uuid
);
-- row 65 中五級聖誕英文科操卷班JLAU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '40740569-ed26-4b9c-9bca-1afb6eb920ab'::uuid, 'cbbb004d-eb13-43bb-84f2-27d0e931af4b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科操卷班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '40740569-ed26-4b9c-9bca-1afb6eb920ab'::uuid AND e.class_id = 'cbbb004d-eb13-43bb-84f2-27d0e931af4b'::uuid
);
-- row 67 中四級數學科操卷班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '029ff376-ea0b-466e-8d78-6b71a4ca6e0e'::uuid, 'cbbb004d-eb13-43bb-84f2-27d0e931af4b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科操卷班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '029ff376-ea0b-466e-8d78-6b71a4ca6e0e'::uuid AND e.class_id = 'cbbb004d-eb13-43bb-84f2-27d0e931af4b'::uuid
);
-- row 67 中四級數學科操卷班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'a09da146-6195-4d68-a1f8-22a8202a1f3d'::uuid, 'cbbb004d-eb13-43bb-84f2-27d0e931af4b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科操卷班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'a09da146-6195-4d68-a1f8-22a8202a1f3d'::uuid AND e.class_id = 'cbbb004d-eb13-43bb-84f2-27d0e931af4b'::uuid
);
-- row 67 中四級數學科操卷班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '65443d7d-dd95-4dcf-8ab3-287e19edbf76'::uuid, 'cbbb004d-eb13-43bb-84f2-27d0e931af4b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科操卷班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '65443d7d-dd95-4dcf-8ab3-287e19edbf76'::uuid AND e.class_id = 'cbbb004d-eb13-43bb-84f2-27d0e931af4b'::uuid
);
-- row 67 中四級數學科操卷班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '813935d3-09f3-4f8c-b633-6a3be4692649'::uuid, '73dfedfd-4fe1-4b10-b9b6-aba11c4d3e89'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科操卷班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '813935d3-09f3-4f8c-b633-6a3be4692649'::uuid AND e.class_id = '73dfedfd-4fe1-4b10-b9b6-aba11c4d3e89'::uuid
);
-- row 68 中五級數學科操卷班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'c5ca6855-9331-4e61-af32-2d5dd9cd75cc'::uuid, '73dfedfd-4fe1-4b10-b9b6-aba11c4d3e89'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科操卷班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'c5ca6855-9331-4e61-af32-2d5dd9cd75cc'::uuid AND e.class_id = '73dfedfd-4fe1-4b10-b9b6-aba11c4d3e89'::uuid
);
-- row 68 中五級數學科操卷班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '35893dd5-f77e-4ef4-b6b2-4baabb14f357'::uuid, '73dfedfd-4fe1-4b10-b9b6-aba11c4d3e89'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科操卷班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '35893dd5-f77e-4ef4-b6b2-4baabb14f357'::uuid AND e.class_id = '73dfedfd-4fe1-4b10-b9b6-aba11c4d3e89'::uuid
);
-- row 68 中五級數學科操卷班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b0107d72-413c-4e5b-94e0-0a4de1d14f6f'::uuid, '73dfedfd-4fe1-4b10-b9b6-aba11c4d3e89'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科操卷班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b0107d72-413c-4e5b-94e0-0a4de1d14f6f'::uuid AND e.class_id = '73dfedfd-4fe1-4b10-b9b6-aba11c4d3e89'::uuid
);
-- row 68 中五級數學科操卷班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '025a1e5d-1af3-4ca9-bb2e-42e636b03ffb'::uuid, 'ede15113-4017-4806-9109-3f5bee9a35d0'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科操卷班NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '025a1e5d-1af3-4ca9-bb2e-42e636b03ffb'::uuid AND e.class_id = 'ede15113-4017-4806-9109-3f5bee9a35d0'::uuid
);
-- row 70 中一級數學科操卷班NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '02bb5dac-c1fd-43a6-aa6b-0544929c0672'::uuid, 'ede15113-4017-4806-9109-3f5bee9a35d0'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科操卷班NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '02bb5dac-c1fd-43a6-aa6b-0544929c0672'::uuid AND e.class_id = 'ede15113-4017-4806-9109-3f5bee9a35d0'::uuid
);
-- row 70 中一級數學科操卷班NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'ba7d09f2-5167-4418-b5ad-a83d20c67c63'::uuid, 'ede15113-4017-4806-9109-3f5bee9a35d0'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科操卷班NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'ba7d09f2-5167-4418-b5ad-a83d20c67c63'::uuid AND e.class_id = 'ede15113-4017-4806-9109-3f5bee9a35d0'::uuid
);
-- row 70 中一級數學科操卷班NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'bb8803c5-0b02-47ee-afc6-af3d0240705c'::uuid, '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科操卷班NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'bb8803c5-0b02-47ee-afc6-af3d0240705c'::uuid AND e.class_id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid
);
-- row 71 中二級數學科操卷班NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd8423166-450c-4632-a18f-1da678532886'::uuid, '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級數學科操卷班NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd8423166-450c-4632-a18f-1da678532886'::uuid AND e.class_id = '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid
);
-- row 72 中三級數學科操卷班NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '3e92f8a4-49ab-42e9-9687-e6735b26411e'::uuid, '92db74e0-d474-44a9-a828-a157327a4262'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級會計理財操卷班LING'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '3e92f8a4-49ab-42e9-9687-e6735b26411e'::uuid AND e.class_id = '92db74e0-d474-44a9-a828-a157327a4262'::uuid
);
-- row 73 中四級會計理財操卷班LING

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '065d4b56-88e3-4063-91f1-4a4792add0c0'::uuid, 'd0a97649-fedd-4935-a385-d798d66bbcac'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級會計理財操卷班LING'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '065d4b56-88e3-4063-91f1-4a4792add0c0'::uuid AND e.class_id = 'd0a97649-fedd-4935-a385-d798d66bbcac'::uuid
);
-- row 74 中五級會計理財操卷班LING

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '058ed296-1bba-4bd0-8e6e-482d585fabdd'::uuid, 'dbdc70bd-3489-45f5-bb5c-618c378bfec4'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級英文科一對一JLAU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '058ed296-1bba-4bd0-8e6e-482d585fabdd'::uuid AND e.class_id = 'dbdc70bd-3489-45f5-bb5c-618c378bfec4'::uuid
);
-- row 76 中六級英文科一對一JLAU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '058ed296-1bba-4bd0-8e6e-482d585fabdd'::uuid, '156e4f4b-99d6-41ea-b6c6-b17eb7d97bd5'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科一對一MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '058ed296-1bba-4bd0-8e6e-482d585fabdd'::uuid AND e.class_id = '156e4f4b-99d6-41ea-b6c6-b17eb7d97bd5'::uuid
);
-- row 77 中六級數學科一對一MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'bdf4ef17-29f2-4d92-8ea9-ab06b9e47f1d'::uuid, '910c4b0e-0bfd-420f-a51c-523efa2d6c6a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級英文科一對二CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'bdf4ef17-29f2-4d92-8ea9-ab06b9e47f1d'::uuid AND e.class_id = '910c4b0e-0bfd-420f-a51c-523efa2d6c6a'::uuid
);
-- row 78 中六級英文科一對二CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'f11cc305-e7d8-4296-a524-421d7d53212f'::uuid, '910c4b0e-0bfd-420f-a51c-523efa2d6c6a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級英文科一對二CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'f11cc305-e7d8-4296-a524-421d7d53212f'::uuid AND e.class_id = '910c4b0e-0bfd-420f-a51c-523efa2d6c6a'::uuid
);
-- row 78 中六級英文科一對二CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'f4317920-332c-445a-930d-7a5c230051e8'::uuid, 'cee13d56-4e2b-4db3-900f-de73fc6d55e9'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] （試）中四級化學科一對一SBLA'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'f4317920-332c-445a-930d-7a5c230051e8'::uuid AND e.class_id = 'cee13d56-4e2b-4db3-900f-de73fc6d55e9'::uuid
);
-- row 79 （試）中四級化學科一對一SBLA

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '154bec19-0f58-47ee-9a40-1d33ff0e0f2a'::uuid, '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級物理科A班THOM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '154bec19-0f58-47ee-9a40-1d33ff0e0f2a'::uuid AND e.class_id = '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid
);
-- row 80 中五級物理科A班THOM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '082ae102-2471-45f5-b1c7-676e2743dca3'::uuid, '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級物理科A班THOM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '082ae102-2471-45f5-b1c7-676e2743dca3'::uuid AND e.class_id = '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid
);
-- row 80 中五級物理科A班THOM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '47b7153c-1393-4bdf-bed2-47640213ec5e'::uuid, '2a48b2d2-f78e-54f5-9211-e3882f7d6b2b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五莊靖思中文科單對單'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '47b7153c-1393-4bdf-bed2-47640213ec5e'::uuid AND e.class_id = '2a48b2d2-f78e-54f5-9211-e3882f7d6b2b'::uuid
);
-- row 81 中五莊靖思中文科單對單

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '47b7153c-1393-4bdf-bed2-47640213ec5e'::uuid, '5c865266-89ac-5657-a4b8-b5481181d0dd'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五莊靖思生物科單對單'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '47b7153c-1393-4bdf-bed2-47640213ec5e'::uuid AND e.class_id = '5c865266-89ac-5657-a4b8-b5481181d0dd'::uuid
);
-- row 82 中五莊靖思生物科單對單

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '47b7153c-1393-4bdf-bed2-47640213ec5e'::uuid, '0b4faead-d8e5-47e1-9279-47b05db9c510'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五莊靖思物理科單對單'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '47b7153c-1393-4bdf-bed2-47640213ec5e'::uuid AND e.class_id = '0b4faead-d8e5-47e1-9279-47b05db9c510'::uuid
);
-- row 83 中五莊靖思物理科單對單

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '47b7153c-1393-4bdf-bed2-47640213ec5e'::uuid, '1cff8de6-f6ab-5ae4-b56a-471f385c89d5'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五莊靖思BAFS科單對單'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '47b7153c-1393-4bdf-bed2-47640213ec5e'::uuid AND e.class_id = '1cff8de6-f6ab-5ae4-b56a-471f385c89d5'::uuid
);
-- row 84 中五莊靖思BAFS科單對單

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '3a22fc95-e268-4a8c-abbb-4bd43ac9194d'::uuid, '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科C班LIAM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '3a22fc95-e268-4a8c-abbb-4bd43ac9194d'::uuid AND e.class_id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid
);
-- row 86 中二級數學科C班LIAM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '667ead37-34fc-4be7-bf70-fd4eda66ca8d'::uuid, '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科C班LIAM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '667ead37-34fc-4be7-bf70-fd4eda66ca8d'::uuid AND e.class_id = '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid
);
-- row 86 中二級數學科C班LIAM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd0490601-ab06-4b2f-b3e3-6e06007665c9'::uuid, 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科單對單NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd0490601-ab06-4b2f-b3e3-6e06007665c9'::uuid AND e.class_id = 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid
);
-- row 87 中一級數學科單對單NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '5eaf6c4a-eb16-4992-948d-641652fe639f'::uuid, '3dc598a6-1b70-40b1-b12f-3078e769a8d3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 林家綺中文科單對單 CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '5eaf6c4a-eb16-4992-948d-641652fe639f'::uuid AND e.class_id = '3dc598a6-1b70-40b1-b12f-3078e769a8d3'::uuid
);
-- row 88 林家綺中文科單對單 CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '50d43ef7-b5a2-46a4-9925-2073ddb055f9'::uuid, '649fcde3-4df4-424d-a957-9f26f4ded592'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 俞逸軒一對一 MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '50d43ef7-b5a2-46a4-9925-2073ddb055f9'::uuid AND e.class_id = '649fcde3-4df4-424d-a957-9f26f4ded592'::uuid
);
-- row 89 俞逸軒一對一 MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'f93c9942-8f06-4354-9f95-30c01fd6b58d'::uuid, 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科A班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'f93c9942-8f06-4354-9f95-30c01fd6b58d'::uuid AND e.class_id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid
);
-- row 90 中四五級英文科A班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '2d75a8f3-7d21-49e3-985c-6b7defb351fc'::uuid, 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科A班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '2d75a8f3-7d21-49e3-985c-6b7defb351fc'::uuid AND e.class_id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid
);
-- row 90 中四五級英文科A班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '5174ab4c-3cf9-4640-97c8-78dd6f83c44e'::uuid, 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科A班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '5174ab4c-3cf9-4640-97c8-78dd6f83c44e'::uuid AND e.class_id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid
);
-- row 90 中四五級英文科A班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'c5ca6855-9331-4e61-af32-2d5dd9cd75cc'::uuid, 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科A班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'c5ca6855-9331-4e61-af32-2d5dd9cd75cc'::uuid AND e.class_id = 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid
);
-- row 90 中四五級英文科A班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'e850f4ce-0e20-4280-9d14-b5f85b39dcdc'::uuid, '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文B班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'e850f4ce-0e20-4280-9d14-b5f85b39dcdc'::uuid AND e.class_id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid
);
-- row 91 中四五級英文B班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '813935d3-09f3-4f8c-b633-6a3be4692649'::uuid, '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文B班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '813935d3-09f3-4f8c-b633-6a3be4692649'::uuid AND e.class_id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid
);
-- row 91 中四五級英文B班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '6febe4d0-557d-48a2-b283-07963139d5c3'::uuid, '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文B班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '6febe4d0-557d-48a2-b283-07963139d5c3'::uuid AND e.class_id = '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid
);
-- row 91 中四五級英文B班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '7a68bb12-3c7e-4a6e-918d-99caa4f3427a'::uuid, '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英B班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '7a68bb12-3c7e-4a6e-918d-99caa4f3427a'::uuid AND e.class_id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid
);
-- row 92 中一二級英B班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '0b656f33-268d-4d21-a49f-a37818134fa2'::uuid, '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英B班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '0b656f33-268d-4d21-a49f-a37818134fa2'::uuid AND e.class_id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid
);
-- row 92 中一二級英B班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'bb8803c5-0b02-47ee-afc6-af3d0240705c'::uuid, '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英B班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'bb8803c5-0b02-47ee-afc6-af3d0240705c'::uuid AND e.class_id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid
);
-- row 92 中一二級英B班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'f9d50fe3-6546-46ff-9f67-630bfda1d63f'::uuid, '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英B班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'f9d50fe3-6546-46ff-9f67-630bfda1d63f'::uuid AND e.class_id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid
);
-- row 92 中一二級英B班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b98e410e-09c5-45e7-a18d-d120ffc95867'::uuid, '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英B班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b98e410e-09c5-45e7-a18d-d120ffc95867'::uuid AND e.class_id = '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid
);
-- row 92 中一二級英B班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'c73ff545-d4b8-4b06-9972-a076406b406a'::uuid, 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 陳煒傑一對一CYND'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'c73ff545-d4b8-4b06-9972-a076406b406a'::uuid AND e.class_id = 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid
);
-- row 93 陳煒傑一對一CYND

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'f7c8f44b-990d-4d06-b80b-3e050aec614c'::uuid, '7ad272a3-df88-42c9-bbac-0cbfdb4e9b60'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科一對一CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'f7c8f44b-990d-4d06-b80b-3e050aec614c'::uuid AND e.class_id = '7ad272a3-df88-42c9-bbac-0cbfdb4e9b60'::uuid
);
-- row 95 中六級中文科一對一CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '223038a1-164b-482a-9408-1007dc373467'::uuid, 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科一對二 MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '223038a1-164b-482a-9408-1007dc373467'::uuid AND e.class_id = 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid
);
-- row 96 中六級數學科一對二 MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '174c983e-7ecf-432d-acc7-c60d0fa48623'::uuid, 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科一對二 MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '174c983e-7ecf-432d-acc7-c60d0fa48623'::uuid AND e.class_id = 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid
);
-- row 96 中六級數學科一對二 MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '6858d8f8-e32f-4637-ab46-a88cef82ac45'::uuid, '1eeef1e2-4da6-59aa-bbdf-cff365b2e7fa'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 智珩功課班 Rain'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '6858d8f8-e32f-4637-ab46-a88cef82ac45'::uuid AND e.class_id = '1eeef1e2-4da6-59aa-bbdf-cff365b2e7fa'::uuid
);
-- row 97 智珩功課班 Rain

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b1d2933b-0459-4f85-9e0c-dd9eb0bc403a'::uuid, '21627141-68b0-4be0-a072-8cc7c4878654'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級科學A班 PHEB'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b1d2933b-0459-4f85-9e0c-dd9eb0bc403a'::uuid AND e.class_id = '21627141-68b0-4be0-a072-8cc7c4878654'::uuid
);
-- row 101 中二級科學A班 PHEB

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'c6cdae79-baa1-425e-8345-976e45c84315'::uuid, '21627141-68b0-4be0-a072-8cc7c4878654'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級科學A班 PHEB'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'c6cdae79-baa1-425e-8345-976e45c84315'::uuid AND e.class_id = '21627141-68b0-4be0-a072-8cc7c4878654'::uuid
);
-- row 101 中二級科學A班 PHEB

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '17575f59-9a5a-4d56-8e46-b75c6c2ae37c'::uuid, '21627141-68b0-4be0-a072-8cc7c4878654'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級科學A班 PHEB'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '17575f59-9a5a-4d56-8e46-b75c6c2ae37c'::uuid AND e.class_id = '21627141-68b0-4be0-a072-8cc7c4878654'::uuid
);
-- row 101 中二級科學A班 PHEB

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '86d25c49-66d0-406b-a725-5b4973f21df3'::uuid, '210ee57a-12af-415e-8543-73862201a136'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級中文科A班 SHEK'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '86d25c49-66d0-406b-a725-5b4973f21df3'::uuid AND e.class_id = '210ee57a-12af-415e-8543-73862201a136'::uuid
);
-- row 103 中二級中文科A班 SHEK

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '95574867-771a-4264-a7b3-d58a31247b08'::uuid, '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級BAFS科A班 Rafael'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '95574867-771a-4264-a7b3-d58a31247b08'::uuid AND e.class_id = '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid
);
-- row 104 中四級BAFS科A班 Rafael

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd199899c-a7a1-4ee7-a4b8-7138f702a1b2'::uuid, '38bdec8b-3b0e-4318-939e-cbe0d477aa61'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 馮記昰一對一Kenneth'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd199899c-a7a1-4ee7-a4b8-7138f702a1b2'::uuid AND e.class_id = '38bdec8b-3b0e-4318-939e-cbe0d477aa61'::uuid
);
-- row 105 馮記昰一對一Kenneth

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '0eca10e9-ab38-41a0-8d11-c9468f5afddb'::uuid, '45df6f39-9f7d-4313-a86e-7d56f6d1cf54'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級物理科單對單THOM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '0eca10e9-ab38-41a0-8d11-c9468f5afddb'::uuid AND e.class_id = '45df6f39-9f7d-4313-a86e-7d56f6d1cf54'::uuid
);
-- row 106 中三級物理科單對單THOM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '058ed296-1bba-4bd0-8e6e-482d585fabdd'::uuid, '555a62d7-edc1-4e19-83b1-7a52b6048a88'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科一對一 CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '058ed296-1bba-4bd0-8e6e-482d585fabdd'::uuid AND e.class_id = '555a62d7-edc1-4e19-83b1-7a52b6048a88'::uuid
);
-- row 107 中六級中文科一對一 CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '6febe4d0-557d-48a2-b283-07963139d5c3'::uuid, '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級英文科一對一 CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '6febe4d0-557d-48a2-b283-07963139d5c3'::uuid AND e.class_id = '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid
);
-- row 108 中五級英文科一對一 CYNG

COMMIT;