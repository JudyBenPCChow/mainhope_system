-- 2526 CSV → student_class_enrollments（略過已存在之相同 student_id + class_id）
-- 重名學生已取第一筆 id，請見 import-output/enrollment_generation_report.json

BEGIN;

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'ffa0780b-5590-4ace-899e-91f343d78a81'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'ffa0780b-5590-4ace-899e-91f343d78a81'::uuid AND e.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
);
-- row 2 中四級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid AND e.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
);
-- row 2 中四級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'a84ea9f8-7c1d-4739-b347-058cee5a27e1'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'a84ea9f8-7c1d-4739-b347-058cee5a27e1'::uuid AND e.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
);
-- row 2 中四級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b9ec0998-36bc-4bc9-8b4b-6ad4e9000e98'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b9ec0998-36bc-4bc9-8b4b-6ad4e9000e98'::uuid AND e.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
);
-- row 2 中四級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'a09da146-6195-4d68-a1f8-22a8202a1f3d'::uuid, '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'a09da146-6195-4d68-a1f8-22a8202a1f3d'::uuid AND e.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
);
-- row 3 中四級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '6340373f-9c3e-42a3-85e2-672a73fd16ad'::uuid, '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '6340373f-9c3e-42a3-85e2-672a73fd16ad'::uuid AND e.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
);
-- row 3 中四級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'c0cc0734-be3f-4c35-a4a4-9e94914bfea5'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'c0cc0734-be3f-4c35-a4a4-9e94914bfea5'::uuid AND e.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
);
-- row 4 中四級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'ffa0780b-5590-4ace-899e-91f343d78a81'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'ffa0780b-5590-4ace-899e-91f343d78a81'::uuid AND e.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
);
-- row 4 中四級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid AND e.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
);
-- row 4 中四級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd78cdee9-fc3f-4ffa-ab33-68861dc36143'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd78cdee9-fc3f-4ffa-ab33-68861dc36143'::uuid AND e.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
);
-- row 4 中四級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'c3103566-5e93-4765-8b3d-d465306c97ba'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'c3103566-5e93-4765-8b3d-d465306c97ba'::uuid AND e.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
);
-- row 4 中四級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '771f28d9-790f-46e1-a803-ae64a635d68b'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科B班'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '771f28d9-790f-46e1-a803-ae64a635d68b'::uuid AND e.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
);
-- row 5 中四五級英文科B班

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'c9d95382-dc26-44eb-9439-689cd9856022'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科B班'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'c9d95382-dc26-44eb-9439-689cd9856022'::uuid AND e.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
);
-- row 5 中四五級英文科B班

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科B班'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid AND e.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
);
-- row 5 中四五級英文科B班

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '5991bbd6-d744-46dd-a2db-30655bf3b150'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科B班'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '5991bbd6-d744-46dd-a2db-30655bf3b150'::uuid AND e.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
);
-- row 5 中四五級英文科B班

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科B班'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid AND e.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
);
-- row 5 中四五級英文科B班

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'fc447e55-3829-4793-8a7a-51efaacb75c4'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科B班'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'fc447e55-3829-4793-8a7a-51efaacb75c4'::uuid AND e.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
);
-- row 5 中四五級英文科B班

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科B班'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid AND e.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
);
-- row 5 中四五級英文科B班

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'f1c444db-4ae1-4cf1-89fe-bf5b316bf121'::uuid, '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級M2科A班TIMC'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'f1c444db-4ae1-4cf1-89fe-bf5b316bf121'::uuid AND e.class_id = '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid
);
-- row 6 中四級M2科A班TIMC

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級中文科A班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid AND e.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
);
-- row 8 中五級中文科A班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '24331c17-871b-4e56-96ca-ad72058fb371'::uuid, '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級中文科A班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '24331c17-871b-4e56-96ca-ad72058fb371'::uuid AND e.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
);
-- row 8 中五級中文科A班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '495c1b7f-a4bf-42a3-a9ba-92c70d4202ea'::uuid, '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級中文科A班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '495c1b7f-a4bf-42a3-a9ba-92c70d4202ea'::uuid AND e.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
);
-- row 8 中五級中文科A班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b62fffd2-f2f9-4ce9-b9a8-e8e4b39c6304'::uuid, 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b62fffd2-f2f9-4ce9-b9a8-e8e4b39c6304'::uuid AND e.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
);
-- row 9 中五級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid, 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid AND e.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
);
-- row 9 中五級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid, 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid AND e.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
);
-- row 9 中五級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b048d92b-aa05-487c-b0be-545ef6745e2d'::uuid, 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b048d92b-aa05-487c-b0be-545ef6745e2d'::uuid AND e.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
);
-- row 9 中五級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid, '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid AND e.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
);
-- row 10 中五級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid, '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid AND e.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
);
-- row 10 中五級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid AND e.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
);
-- row 11 中五級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid AND e.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
);
-- row 11 中五級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '24331c17-871b-4e56-96ca-ad72058fb371'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '24331c17-871b-4e56-96ca-ad72058fb371'::uuid AND e.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
);
-- row 11 中五級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid AND e.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
);
-- row 11 中五級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'da86a454-fb29-4b1c-bd73-1230b7455b98'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'da86a454-fb29-4b1c-bd73-1230b7455b98'::uuid AND e.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
);
-- row 11 中五級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b048d92b-aa05-487c-b0be-545ef6745e2d'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b048d92b-aa05-487c-b0be-545ef6745e2d'::uuid AND e.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
);
-- row 11 中五級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid AND e.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
);
-- row 11 中五級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid AND e.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
);
-- row 11 中五級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, 'a91bdded-21b2-49e5-9481-40938006062a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級M2科A班TIMC'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid AND e.class_id = 'a91bdded-21b2-49e5-9481-40938006062a'::uuid
);
-- row 12 中五級M2科A班TIMC

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級物理科A班THOM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid AND e.class_id = '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid
);
-- row 13 中五級物理科A班THOM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '56a2d62d-efe0-4954-b6b1-0e5b739985c8'::uuid, '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級物理科A班THOM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '56a2d62d-efe0-4954-b6b1-0e5b739985c8'::uuid AND e.class_id = '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid
);
-- row 13 中五級物理科A班THOM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid, 'd23852cd-3827-4365-853d-00e23e093e83'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級化學科A班SBLA'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid AND e.class_id = 'd23852cd-3827-4365-853d-00e23e093e83'::uuid
);
-- row 14 中五級化學科A班SBLA

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, 'd23852cd-3827-4365-853d-00e23e093e83'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級化學科A班SBLA'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid AND e.class_id = 'd23852cd-3827-4365-853d-00e23e093e83'::uuid
);
-- row 14 中五級化學科A班SBLA

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '24331c17-871b-4e56-96ca-ad72058fb371'::uuid, 'd23852cd-3827-4365-853d-00e23e093e83'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級化學科A班SBLA'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '24331c17-871b-4e56-96ca-ad72058fb371'::uuid AND e.class_id = 'd23852cd-3827-4365-853d-00e23e093e83'::uuid
);
-- row 14 中五級化學科A班SBLA

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '19145380-aeb2-44f6-a27e-e2f263c7b35f'::uuid, '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級生物科A班JCHU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '19145380-aeb2-44f6-a27e-e2f263c7b35f'::uuid AND e.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
);
-- row 15 中五級生物科A班JCHU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '01529c73-438d-4040-9c40-944d0b0d1af0'::uuid, '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級生物科A班JCHU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '01529c73-438d-4040-9c40-944d0b0d1af0'::uuid AND e.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
);
-- row 15 中五級生物科A班JCHU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '37bd4518-13c0-47e0-8c45-30ac9f0a5507'::uuid, '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級生物科A班JCHU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '37bd4518-13c0-47e0-8c45-30ac9f0a5507'::uuid AND e.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
);
-- row 15 中五級生物科A班JCHU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '3ab0dc4c-7eab-474a-8cff-f4e6ea4bc0c2'::uuid, '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級生物科A班JCHU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '3ab0dc4c-7eab-474a-8cff-f4e6ea4bc0c2'::uuid AND e.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
);
-- row 15 中五級生物科A班JCHU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid, '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科A班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid AND e.class_id = '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid
);
-- row 16 中六級中文科A班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '745ddccd-f3cc-4f18-b409-5e62f513bfcd'::uuid, '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科A班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '745ddccd-f3cc-4f18-b409-5e62f513bfcd'::uuid AND e.class_id = '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid
);
-- row 16 中六級中文科A班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid, '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科A班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid AND e.class_id = '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid
);
-- row 16 中六級中文科A班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '061dca0d-7523-405e-b10d-e4e2fc12b422'::uuid, '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科A班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '061dca0d-7523-405e-b10d-e4e2fc12b422'::uuid AND e.class_id = '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid
);
-- row 16 中六級中文科A班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '264e8911-ad63-49d9-a4b7-9356bd265ebd'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '264e8911-ad63-49d9-a4b7-9356bd265ebd'::uuid AND e.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
);
-- row 17 中六級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'a5e577da-bf4f-4c97-aa15-e255a14374bf'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'a5e577da-bf4f-4c97-aa15-e255a14374bf'::uuid AND e.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
);
-- row 17 中六級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid AND e.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
);
-- row 17 中六級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '51939e47-073b-4189-a5cc-588773fa40be'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '51939e47-073b-4189-a5cc-588773fa40be'::uuid AND e.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
);
-- row 17 中六級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'a72586a0-ab9c-477b-b9c5-7231f1a23909'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'a72586a0-ab9c-477b-b9c5-7231f1a23909'::uuid AND e.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
);
-- row 17 中六級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd73ff8ba-fa6a-4cb0-b977-770cc04d87f4'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd73ff8ba-fa6a-4cb0-b977-770cc04d87f4'::uuid AND e.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
);
-- row 17 中六級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '25c71966-a146-4aab-afa6-52dfeddf57fb'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '25c71966-a146-4aab-afa6-52dfeddf57fb'::uuid AND e.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
);
-- row 18 中六級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'a72586a0-ab9c-477b-b9c5-7231f1a23909'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'a72586a0-ab9c-477b-b9c5-7231f1a23909'::uuid AND e.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
);
-- row 18 中六級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid AND e.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
);
-- row 18 中六級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '28f0d007-5359-4616-9782-2457964cdbca'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '28f0d007-5359-4616-9782-2457964cdbca'::uuid AND e.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
);
-- row 18 中六級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid AND e.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
);
-- row 19 中六級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'f1934160-c64f-4e4d-be4e-c90a2027ad19'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'f1934160-c64f-4e4d-be4e-c90a2027ad19'::uuid AND e.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
);
-- row 19 中六級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '702b4bb3-159c-4835-92cf-be10ff810e50'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '702b4bb3-159c-4835-92cf-be10ff810e50'::uuid AND e.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
);
-- row 19 中六級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '15a85db9-eba7-4d60-9ed5-531dc68060d6'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '15a85db9-eba7-4d60-9ed5-531dc68060d6'::uuid AND e.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
);
-- row 19 中六級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'ae885f95-aa43-4d19-883a-8cba99ae65b9'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'ae885f95-aa43-4d19-883a-8cba99ae65b9'::uuid AND e.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
);
-- row 19 中六級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '28f0d007-5359-4616-9782-2457964cdbca'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科B班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '28f0d007-5359-4616-9782-2457964cdbca'::uuid AND e.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
);
-- row 19 中六級數學科B班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科A班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid AND e.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
);
-- row 20 中四五級英文科A班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '486dd132-f2b2-4c0e-b5e4-853e07434826'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科A班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '486dd132-f2b2-4c0e-b5e4-853e07434826'::uuid AND e.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
);
-- row 20 中四五級英文科A班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '6340373f-9c3e-42a3-85e2-672a73fd16ad'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科A班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '6340373f-9c3e-42a3-85e2-672a73fd16ad'::uuid AND e.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
);
-- row 20 中四五級英文科A班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科A班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid AND e.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
);
-- row 20 中四五級英文科A班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid, '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級物理科A班THOM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid AND e.class_id = '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid
);
-- row 21 中六級物理科A班THOM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd9260dcb-e6b8-4dc7-a885-c72235135645'::uuid, '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級物理科A班THOM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd9260dcb-e6b8-4dc7-a885-c72235135645'::uuid AND e.class_id = '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid
);
-- row 21 中六級物理科A班THOM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'f1934160-c64f-4e4d-be4e-c90a2027ad19'::uuid, '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級物理科A班THOM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'f1934160-c64f-4e4d-be4e-c90a2027ad19'::uuid AND e.class_id = '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid
);
-- row 21 中六級物理科A班THOM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '08a65222-0baf-47be-976d-73685070e38d'::uuid, '47ecae0c-df23-4449-bb25-f1835977d2a6'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級化學科A班SBLA'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '08a65222-0baf-47be-976d-73685070e38d'::uuid AND e.class_id = '47ecae0c-df23-4449-bb25-f1835977d2a6'::uuid
);
-- row 22 中六級化學科A班SBLA

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '32de9874-da52-43c8-8f13-c10a943c4618'::uuid, '47ecae0c-df23-4449-bb25-f1835977d2a6'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級化學科A班SBLA'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '32de9874-da52-43c8-8f13-c10a943c4618'::uuid AND e.class_id = '47ecae0c-df23-4449-bb25-f1835977d2a6'::uuid
);
-- row 22 中六級化學科A班SBLA

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '08a65222-0baf-47be-976d-73685070e38d'::uuid, '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級生物科A班JCHU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '08a65222-0baf-47be-976d-73685070e38d'::uuid AND e.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
);
-- row 23 中六級生物科A班JCHU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '5a0cdd32-30df-4acc-89ac-d954e07904c9'::uuid, '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級生物科A班JCHU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '5a0cdd32-30df-4acc-89ac-d954e07904c9'::uuid AND e.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
);
-- row 23 中六級生物科A班JCHU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid, '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級生物科A班JCHU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid AND e.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
);
-- row 23 中六級生物科A班JCHU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '51939e47-073b-4189-a5cc-588773fa40be'::uuid, '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級生物科A班JCHU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '51939e47-073b-4189-a5cc-588773fa40be'::uuid AND e.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
);
-- row 23 中六級生物科A班JCHU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '7801ffd1-6991-4a37-9015-61d33320b215'::uuid, 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科B班NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '7801ffd1-6991-4a37-9015-61d33320b215'::uuid AND e.class_id = 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid
);
-- row 25 中一級數學科B班NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '8333a1b0-0ee1-4b9b-9232-a4e8caf3cd8f'::uuid, 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科B班NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '8333a1b0-0ee1-4b9b-9232-a4e8caf3cd8f'::uuid AND e.class_id = 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid
);
-- row 25 中一級數學科B班NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'fbb6b90a-2eda-4d65-84b7-f32c4c774c33'::uuid, '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英文科B班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'fbb6b90a-2eda-4d65-84b7-f32c4c774c33'::uuid AND e.class_id = '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid
);
-- row 27 中一二級英文科B班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b71f8795-7d99-4204-bd9c-791bf1395ffc'::uuid, '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英文科B班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b71f8795-7d99-4204-bd9c-791bf1395ffc'::uuid AND e.class_id = '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid
);
-- row 27 中一二級英文科B班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'fee10737-293b-4abc-b861-cf90c12f49e9'::uuid, '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英文科B班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'fee10737-293b-4abc-b861-cf90c12f49e9'::uuid AND e.class_id = '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid
);
-- row 27 中一二級英文科B班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '22fcad0f-8d89-48b1-abbd-9d0a52dc88ce'::uuid, 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英文科C班TIMC'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '22fcad0f-8d89-48b1-abbd-9d0a52dc88ce'::uuid AND e.class_id = 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid
);
-- row 28 中一二級英文科C班TIMC

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'ed1f7de2-d8dc-44b6-91c0-7c64d03c499d'::uuid, 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英文科C班TIMC'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'ed1f7de2-d8dc-44b6-91c0-7c64d03c499d'::uuid AND e.class_id = 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid
);
-- row 28 中一二級英文科C班TIMC

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '05fa33c2-cd5c-49b0-b5c9-4cfdf83038cc'::uuid, 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英文科C班TIMC'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '05fa33c2-cd5c-49b0-b5c9-4cfdf83038cc'::uuid AND e.class_id = 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid
);
-- row 28 中一二級英文科C班TIMC

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid, '611974a7-8e91-494b-be09-3ceed9b14944'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid AND e.class_id = '611974a7-8e91-494b-be09-3ceed9b14944'::uuid
);
-- row 31 中二級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd8423166-450c-4632-a18f-1da678532886'::uuid, '611974a7-8e91-494b-be09-3ceed9b14944'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級中文科B班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd8423166-450c-4632-a18f-1da678532886'::uuid AND e.class_id = '611974a7-8e91-494b-be09-3ceed9b14944'::uuid
);
-- row 31 中二級中文科B班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid AND e.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
);
-- row 32 中二級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '5787d58f-5d75-4c5b-b1c1-fb7f223d150f'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '5787d58f-5d75-4c5b-b1c1-fb7f223d150f'::uuid AND e.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
);
-- row 32 中二級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '6d169f47-d3cb-42e0-b4bf-ed8e77ee7b99'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '6d169f47-d3cb-42e0-b4bf-ed8e77ee7b99'::uuid AND e.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
);
-- row 32 中二級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '22fcad0f-8d89-48b1-abbd-9d0a52dc88ce'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '22fcad0f-8d89-48b1-abbd-9d0a52dc88ce'::uuid AND e.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
);
-- row 32 中二級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '05fa33c2-cd5c-49b0-b5c9-4cfdf83038cc'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '05fa33c2-cd5c-49b0-b5c9-4cfdf83038cc'::uuid AND e.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
);
-- row 32 中二級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '8d0c77a0-b0cf-4903-9d4e-560ae3502250'::uuid, '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科B班NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '8d0c77a0-b0cf-4903-9d4e-560ae3502250'::uuid AND e.class_id = '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid
);
-- row 33 中二級數學科B班NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'cb245455-33e2-4a36-b948-d4f8e4e701bc'::uuid, '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科B班NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'cb245455-33e2-4a36-b948-d4f8e4e701bc'::uuid AND e.class_id = '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid
);
-- row 33 中二級數學科B班NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid, '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級中文科A班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid AND e.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
);
-- row 34 中三級中文科A班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd8423166-450c-4632-a18f-1da678532886'::uuid, '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級中文科A班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd8423166-450c-4632-a18f-1da678532886'::uuid AND e.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
);
-- row 34 中三級中文科A班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid, '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid AND e.class_id = '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid
);
-- row 35 中三級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid, '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid AND e.class_id = '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid
);
-- row 35 中三級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'fe2cae65-566c-42de-b757-d1807e84d9d5'::uuid, '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級數學科A班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'fe2cae65-566c-42de-b757-d1807e84d9d5'::uuid AND e.class_id = '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid
);
-- row 35 中三級數學科A班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd70cb168-58f1-44bd-a4ee-6d5d803cf26e'::uuid, '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級數學科B班NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd70cb168-58f1-44bd-a4ee-6d5d803cf26e'::uuid AND e.class_id = '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid
);
-- row 36 中三級數學科B班NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '80e22011-8207-4a75-87ee-02e7f2f5be4f'::uuid, '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級數學科B班NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '80e22011-8207-4a75-87ee-02e7f2f5be4f'::uuid AND e.class_id = '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid
);
-- row 36 中三級數學科B班NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '0bf2b340-46d8-4272-90e1-48a098d220f9'::uuid, '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級數學科B班NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '0bf2b340-46d8-4272-90e1-48a098d220f9'::uuid AND e.class_id = '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid
);
-- row 36 中三級數學科B班NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'bd9c5612-0c8b-46c8-9fe3-1fb6f06b558b'::uuid, '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級英文科A班TIMC'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'bd9c5612-0c8b-46c8-9fe3-1fb6f06b558b'::uuid AND e.class_id = '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid
);
-- row 37 中三級英文科A班TIMC

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid, '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級英文科A班TIMC'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid AND e.class_id = '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid
);
-- row 37 中三級英文科A班TIMC

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd6d91a52-7b94-4e15-b91f-fabeb6916e65'::uuid, 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級科學科A班SBLA'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd6d91a52-7b94-4e15-b91f-fabeb6916e65'::uuid AND e.class_id = 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid
);
-- row 38 中三級科學科A班SBLA

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid, 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級科學科A班SBLA'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid AND e.class_id = 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid
);
-- row 38 中三級科學科A班SBLA

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd6d91a52-7b94-4e15-b91f-fabeb6916e65'::uuid, '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級科學科B班THOM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd6d91a52-7b94-4e15-b91f-fabeb6916e65'::uuid AND e.class_id = '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid
);
-- row 39 中三級科學科B班THOM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'a93f497b-6e75-48dc-aad3-ca036f8dd2cd'::uuid, '36f7e78d-2a92-4611-80fb-f30b5fda201f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（中學）'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'a93f497b-6e75-48dc-aad3-ca036f8dd2cd'::uuid AND e.class_id = '36f7e78d-2a92-4611-80fb-f30b5fda201f'::uuid
);
-- row 40 功課輔導班（中學）

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'eb3e8cf2-6fde-4138-b38d-99d698542306'::uuid, '36f7e78d-2a92-4611-80fb-f30b5fda201f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（中學）'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'eb3e8cf2-6fde-4138-b38d-99d698542306'::uuid AND e.class_id = '36f7e78d-2a92-4611-80fb-f30b5fda201f'::uuid
);
-- row 40 功課輔導班（中學）

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'f7bda8a4-86a4-47d6-95e6-e617f7375876'::uuid, '36f7e78d-2a92-4611-80fb-f30b5fda201f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（中學）'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'f7bda8a4-86a4-47d6-95e6-e617f7375876'::uuid AND e.class_id = '36f7e78d-2a92-4611-80fb-f30b5fda201f'::uuid
);
-- row 40 功課輔導班（中學）

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '11a138c8-5084-45cf-bddf-028fc1988a8b'::uuid, '36f7e78d-2a92-4611-80fb-f30b5fda201f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（中學）'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '11a138c8-5084-45cf-bddf-028fc1988a8b'::uuid AND e.class_id = '36f7e78d-2a92-4611-80fb-f30b5fda201f'::uuid
);
-- row 40 功課輔導班（中學）

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'ed1f7de2-d8dc-44b6-91c0-7c64d03c499d'::uuid, '36f7e78d-2a92-4611-80fb-f30b5fda201f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（中學）'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'ed1f7de2-d8dc-44b6-91c0-7c64d03c499d'::uuid AND e.class_id = '36f7e78d-2a92-4611-80fb-f30b5fda201f'::uuid
);
-- row 40 功課輔導班（中學）

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'f5914901-73e4-47b9-816b-3a4bdaec7356'::uuid, '36f7e78d-2a92-4611-80fb-f30b5fda201f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（中學）'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'f5914901-73e4-47b9-816b-3a4bdaec7356'::uuid AND e.class_id = '36f7e78d-2a92-4611-80fb-f30b5fda201f'::uuid
);
-- row 40 功課輔導班（中學）

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'e510f82c-a4e5-46a7-a500-4088d677b0e1'::uuid, '36f7e78d-2a92-4611-80fb-f30b5fda201f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（中學）'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'e510f82c-a4e5-46a7-a500-4088d677b0e1'::uuid AND e.class_id = '36f7e78d-2a92-4611-80fb-f30b5fda201f'::uuid
);
-- row 40 功課輔導班（中學）

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'ea7b4737-36c9-441e-aeb0-80be03239296'::uuid, '709881b5-9fce-421f-bd74-b1ff04513109'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（小學）'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'ea7b4737-36c9-441e-aeb0-80be03239296'::uuid AND e.class_id = '709881b5-9fce-421f-bd74-b1ff04513109'::uuid
);
-- row 41 功課輔導班（小學）

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '3078de17-7201-4f7d-8798-6056f24e04cc'::uuid, '709881b5-9fce-421f-bd74-b1ff04513109'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（小學）'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '3078de17-7201-4f7d-8798-6056f24e04cc'::uuid AND e.class_id = '709881b5-9fce-421f-bd74-b1ff04513109'::uuid
);
-- row 41 功課輔導班（小學）

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b6bec776-7c95-41a0-ab67-b11a8027670c'::uuid, '709881b5-9fce-421f-bd74-b1ff04513109'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（小學）'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b6bec776-7c95-41a0-ab67-b11a8027670c'::uuid AND e.class_id = '709881b5-9fce-421f-bd74-b1ff04513109'::uuid
);
-- row 41 功課輔導班（小學）

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '348e09ea-1cd9-44e7-9556-d536f6123da0'::uuid, '709881b5-9fce-421f-bd74-b1ff04513109'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（小學）'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '348e09ea-1cd9-44e7-9556-d536f6123da0'::uuid AND e.class_id = '709881b5-9fce-421f-bd74-b1ff04513109'::uuid
);
-- row 41 功課輔導班（小學）

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'fef46182-4c68-4560-9d3f-99b5abc8ae8e'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 北區百人英文科星期三組'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'fef46182-4c68-4560-9d3f-99b5abc8ae8e'::uuid AND e.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
);
-- row 42 北區百人英文科星期三組

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b048d92b-aa05-487c-b0be-545ef6745e2d'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 北區百人英文科星期三組'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b048d92b-aa05-487c-b0be-545ef6745e2d'::uuid AND e.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
);
-- row 42 北區百人英文科星期三組

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 北區百人英文科星期三組'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid AND e.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
);
-- row 42 北區百人英文科星期三組

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '771f28d9-790f-46e1-a803-ae64a635d68b'::uuid, 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級生物科B班JCHU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '771f28d9-790f-46e1-a803-ae64a635d68b'::uuid AND e.class_id = 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid
);
-- row 43 中五級生物科B班JCHU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'e42d3ed1-6383-4856-9fd3-ad29e9084ed4'::uuid, '005e8d52-6109-522e-9478-2023cf91b100'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 溫珏禧/中六數學一對一'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'e42d3ed1-6383-4856-9fd3-ad29e9084ed4'::uuid AND e.class_id = '005e8d52-6109-522e-9478-2023cf91b100'::uuid
);
-- row 44 溫珏禧/中六數學一對一

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'a9306a6e-1365-4a0c-bfa4-0ab21c59ee37'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 北區百人英文科星期六組'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'a9306a6e-1365-4a0c-bfa4-0ab21c59ee37'::uuid AND e.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
);
-- row 45 北區百人英文科星期六組

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '31bbcda2-e3f9-44d5-8445-5115685e1ef6'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 北區百人英文科星期六組'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '31bbcda2-e3f9-44d5-8445-5115685e1ef6'::uuid AND e.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
);
-- row 45 北區百人英文科星期六組

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '3aa01047-b955-4510-a96f-5cb7e41329b4'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 北區百人英文科星期六組'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '3aa01047-b955-4510-a96f-5cb7e41329b4'::uuid AND e.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
);
-- row 45 北區百人英文科星期六組

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '314253d9-0110-4705-8b07-71caf08c7a53'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 北區百人英文科星期六組'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '314253d9-0110-4705-8b07-71caf08c7a53'::uuid AND e.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
);
-- row 45 北區百人英文科星期六組

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '98b38abc-55c5-41cb-8815-5ece90f15645'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科C班LIAM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '98b38abc-55c5-41cb-8815-5ece90f15645'::uuid AND e.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
);
-- row 48 中一級數學科C班LIAM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '617dd2b5-bbad-412a-a3bf-b6b17f7dbd41'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科C班LIAM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '617dd2b5-bbad-412a-a3bf-b6b17f7dbd41'::uuid AND e.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
);
-- row 48 中一級數學科C班LIAM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '6023b53d-82b5-4544-86ff-1297c8664616'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科C班LIAM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '6023b53d-82b5-4544-86ff-1297c8664616'::uuid AND e.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
);
-- row 48 中一級數學科C班LIAM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '6b2b2711-4d57-4db6-90aa-334b4fa98f10'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科C班LIAM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '6b2b2711-4d57-4db6-90aa-334b4fa98f10'::uuid AND e.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
);
-- row 48 中一級數學科C班LIAM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '7c4427c6-234b-43b4-a598-a5fd27461fab'::uuid, 'bbbe5495-4c46-50ba-b7c3-cd4960d4ab73'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級英文科單對單JLAU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '7c4427c6-234b-43b4-a598-a5fd27461fab'::uuid AND e.class_id = 'bbbe5495-4c46-50ba-b7c3-cd4960d4ab73'::uuid
);
-- row 49 中四級英文科單對單JLAU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '47f6312e-52a4-4711-af4d-8dc5fc06f3e2'::uuid, '1a00cbaf-079f-56f5-a8ec-c706ea085bd5'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級英文科一對二JLAU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '47f6312e-52a4-4711-af4d-8dc5fc06f3e2'::uuid AND e.class_id = '1a00cbaf-079f-56f5-a8ec-c706ea085bd5'::uuid
);
-- row 50 中四級英文科一對二JLAU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '9aa63afc-6ddd-4ce1-94ef-3e054523f207'::uuid, '1a00cbaf-079f-56f5-a8ec-c706ea085bd5'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級英文科一對二JLAU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '9aa63afc-6ddd-4ce1-94ef-3e054523f207'::uuid AND e.class_id = '1a00cbaf-079f-56f5-a8ec-c706ea085bd5'::uuid
);
-- row 50 中四級英文科一對二JLAU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '7c4427c6-234b-43b4-a598-a5fd27461fab'::uuid, '306a873b-d0dd-584b-9040-620dea54d4fa'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級M2科單對單NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '7c4427c6-234b-43b4-a598-a5fd27461fab'::uuid AND e.class_id = '306a873b-d0dd-584b-9040-620dea54d4fa'::uuid
);
-- row 51 中四級M2科單對單NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '6b2b2711-4d57-4db6-90aa-334b4fa98f10'::uuid, '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級中文科A班SHEK'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '6b2b2711-4d57-4db6-90aa-334b4fa98f10'::uuid AND e.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
);
-- row 52 中一級中文科A班SHEK

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'dd4893a5-f53a-4f0e-bdff-45353a7494dd'::uuid, '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級中文科A班SHEK'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'dd4893a5-f53a-4f0e-bdff-45353a7494dd'::uuid AND e.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
);
-- row 52 中一級中文科A班SHEK

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'ef0c9409-d389-47ac-9287-e4517bbe4b45'::uuid, '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級中文科A班SHEK'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'ef0c9409-d389-47ac-9287-e4517bbe4b45'::uuid AND e.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
);
-- row 52 中一級中文科A班SHEK

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '495c1b7f-a4bf-42a3-a9ba-92c70d4202ea'::uuid, 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級BAFS科A班RALI'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '495c1b7f-a4bf-42a3-a9ba-92c70d4202ea'::uuid AND e.class_id = 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid
);
-- row 55 中五級BAFS科A班RALI

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd985e2e0-e140-49cf-9070-5d5f22145ef9'::uuid, 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科單對單NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd985e2e0-e140-49cf-9070-5d5f22145ef9'::uuid AND e.class_id = 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid
);
-- row 56 中一級數學科單對單NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '9aa63afc-6ddd-4ce1-94ef-3e054523f207'::uuid, '32d27b30-3c72-5de1-ac94-12e4f0ab4652'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級英文科一對一JLAU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '9aa63afc-6ddd-4ce1-94ef-3e054523f207'::uuid AND e.class_id = '32d27b30-3c72-5de1-ac94-12e4f0ab4652'::uuid
);
-- row 57 中四級英文科一對一JLAU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '90b1d98d-d7e7-4fab-ae37-ffbe64eb1eb1'::uuid, 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級生物科C班JCHU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '90b1d98d-d7e7-4fab-ae37-ffbe64eb1eb1'::uuid AND e.class_id = 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid
);
-- row 58 中五級生物科C班JCHU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'a67d1325-ab70-4a74-8aef-5a9d73ca9e12'::uuid, 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級生物科C班JCHU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'a67d1325-ab70-4a74-8aef-5a9d73ca9e12'::uuid AND e.class_id = 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid
);
-- row 58 中五級生物科C班JCHU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'f80f24c8-c46d-4401-afab-7f93ebfc2f6b'::uuid, '88cd19b5-db52-5f1a-9880-851eab3fc9be'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級BAFS科單對單RALI'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'f80f24c8-c46d-4401-afab-7f93ebfc2f6b'::uuid AND e.class_id = '88cd19b5-db52-5f1a-9880-851eab3fc9be'::uuid
);
-- row 59 中五級BAFS科單對單RALI

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid, 'b3a33113-49e2-5946-81c0-0a6f070253fa'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級聖誕中文科範文班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid AND e.class_id = 'b3a33113-49e2-5946-81c0-0a6f070253fa'::uuid
);
-- row 60 中三級聖誕中文科範文班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd8423166-450c-4632-a18f-1da678532886'::uuid, 'b3a33113-49e2-5946-81c0-0a6f070253fa'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級聖誕中文科範文班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd8423166-450c-4632-a18f-1da678532886'::uuid AND e.class_id = 'b3a33113-49e2-5946-81c0-0a6f070253fa'::uuid
);
-- row 60 中三級聖誕中文科範文班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid, 'b3a33113-49e2-5946-81c0-0a6f070253fa'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級聖誕中文科範文班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid AND e.class_id = 'b3a33113-49e2-5946-81c0-0a6f070253fa'::uuid
);
-- row 60 中三級聖誕中文科範文班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'a84ea9f8-7c1d-4739-b347-058cee5a27e1'::uuid, 'e3fc2cfb-ddde-5bcd-8079-f987585fec5c'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級聖誕中文科範文班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'a84ea9f8-7c1d-4739-b347-058cee5a27e1'::uuid AND e.class_id = 'e3fc2cfb-ddde-5bcd-8079-f987585fec5c'::uuid
);
-- row 61 中四級聖誕中文科範文班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid, 'e3fc2cfb-ddde-5bcd-8079-f987585fec5c'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級聖誕中文科範文班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid AND e.class_id = 'e3fc2cfb-ddde-5bcd-8079-f987585fec5c'::uuid
);
-- row 61 中四級聖誕中文科範文班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b9ec0998-36bc-4bc9-8b4b-6ad4e9000e98'::uuid, 'e3fc2cfb-ddde-5bcd-8079-f987585fec5c'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級聖誕中文科範文班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b9ec0998-36bc-4bc9-8b4b-6ad4e9000e98'::uuid AND e.class_id = 'e3fc2cfb-ddde-5bcd-8079-f987585fec5c'::uuid
);
-- row 61 中四級聖誕中文科範文班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '495c1b7f-a4bf-42a3-a9ba-92c70d4202ea'::uuid, '23545f03-b404-5400-a978-bc912c2241d3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級聖誕中文科範文班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '495c1b7f-a4bf-42a3-a9ba-92c70d4202ea'::uuid AND e.class_id = '23545f03-b404-5400-a978-bc912c2241d3'::uuid
);
-- row 62 中五級聖誕中文科範文班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, '23545f03-b404-5400-a978-bc912c2241d3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級聖誕中文科範文班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid AND e.class_id = '23545f03-b404-5400-a978-bc912c2241d3'::uuid
);
-- row 62 中五級聖誕中文科範文班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b048d92b-aa05-487c-b0be-545ef6745e2d'::uuid, '23545f03-b404-5400-a978-bc912c2241d3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級聖誕中文科範文班CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b048d92b-aa05-487c-b0be-545ef6745e2d'::uuid AND e.class_id = '23545f03-b404-5400-a978-bc912c2241d3'::uuid
);
-- row 62 中五級聖誕中文科範文班CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級聖誕英文科操卷班JLAU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid AND e.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
);
-- row 64 中四級聖誕英文科操卷班JLAU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b048d92b-aa05-487c-b0be-545ef6745e2d'::uuid, 'a17e604c-21c8-5d6f-98b4-4abf21c78891'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級聖誕英文科操卷班JLAU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b048d92b-aa05-487c-b0be-545ef6745e2d'::uuid AND e.class_id = 'a17e604c-21c8-5d6f-98b4-4abf21c78891'::uuid
);
-- row 65 中五級聖誕英文科操卷班JLAU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd78cdee9-fc3f-4ffa-ab33-68861dc36143'::uuid, '2aee06cb-2630-53c2-911d-b55e1c288c11'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科操卷班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd78cdee9-fc3f-4ffa-ab33-68861dc36143'::uuid AND e.class_id = '2aee06cb-2630-53c2-911d-b55e1c288c11'::uuid
);
-- row 67 中四級數學科操卷班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'a84ea9f8-7c1d-4739-b347-058cee5a27e1'::uuid, '2aee06cb-2630-53c2-911d-b55e1c288c11'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科操卷班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'a84ea9f8-7c1d-4739-b347-058cee5a27e1'::uuid AND e.class_id = '2aee06cb-2630-53c2-911d-b55e1c288c11'::uuid
);
-- row 67 中四級數學科操卷班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'a09da146-6195-4d68-a1f8-22a8202a1f3d'::uuid, '2aee06cb-2630-53c2-911d-b55e1c288c11'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科操卷班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'a09da146-6195-4d68-a1f8-22a8202a1f3d'::uuid AND e.class_id = '2aee06cb-2630-53c2-911d-b55e1c288c11'::uuid
);
-- row 67 中四級數學科操卷班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b9ec0998-36bc-4bc9-8b4b-6ad4e9000e98'::uuid, '2aee06cb-2630-53c2-911d-b55e1c288c11'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科操卷班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b9ec0998-36bc-4bc9-8b4b-6ad4e9000e98'::uuid AND e.class_id = '2aee06cb-2630-53c2-911d-b55e1c288c11'::uuid
);
-- row 67 中四級數學科操卷班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, '91b3d1b0-dc0b-5401-b664-77e528afc602'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科操卷班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid AND e.class_id = '91b3d1b0-dc0b-5401-b664-77e528afc602'::uuid
);
-- row 68 中五級數學科操卷班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid, '91b3d1b0-dc0b-5401-b664-77e528afc602'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科操卷班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid AND e.class_id = '91b3d1b0-dc0b-5401-b664-77e528afc602'::uuid
);
-- row 68 中五級數學科操卷班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '3636de02-c540-483c-a724-0341ef029f44'::uuid, '91b3d1b0-dc0b-5401-b664-77e528afc602'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科操卷班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '3636de02-c540-483c-a724-0341ef029f44'::uuid AND e.class_id = '91b3d1b0-dc0b-5401-b664-77e528afc602'::uuid
);
-- row 68 中五級數學科操卷班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b048d92b-aa05-487c-b0be-545ef6745e2d'::uuid, '91b3d1b0-dc0b-5401-b664-77e528afc602'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科操卷班MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b048d92b-aa05-487c-b0be-545ef6745e2d'::uuid AND e.class_id = '91b3d1b0-dc0b-5401-b664-77e528afc602'::uuid
);
-- row 68 中五級數學科操卷班MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '7801ffd1-6991-4a37-9015-61d33320b215'::uuid, 'ed572526-da92-59ed-aa1e-7c54b5357c43'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科操卷班NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '7801ffd1-6991-4a37-9015-61d33320b215'::uuid AND e.class_id = 'ed572526-da92-59ed-aa1e-7c54b5357c43'::uuid
);
-- row 70 中一級數學科操卷班NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '617dd2b5-bbad-412a-a3bf-b6b17f7dbd41'::uuid, 'ed572526-da92-59ed-aa1e-7c54b5357c43'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科操卷班NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '617dd2b5-bbad-412a-a3bf-b6b17f7dbd41'::uuid AND e.class_id = 'ed572526-da92-59ed-aa1e-7c54b5357c43'::uuid
);
-- row 70 中一級數學科操卷班NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '98b38abc-55c5-41cb-8815-5ece90f15645'::uuid, 'ed572526-da92-59ed-aa1e-7c54b5357c43'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科操卷班NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '98b38abc-55c5-41cb-8815-5ece90f15645'::uuid AND e.class_id = 'ed572526-da92-59ed-aa1e-7c54b5357c43'::uuid
);
-- row 70 中一級數學科操卷班NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b71f8795-7d99-4204-bd9c-791bf1395ffc'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科操卷班NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b71f8795-7d99-4204-bd9c-791bf1395ffc'::uuid AND e.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
);
-- row 71 中二級數學科操卷班NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd8423166-450c-4632-a18f-1da678532886'::uuid, '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級數學科操卷班NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd8423166-450c-4632-a18f-1da678532886'::uuid AND e.class_id = '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid
);
-- row 72 中三級數學科操卷班NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid, '565ec2a7-fead-5408-90be-ea7d3bc28823'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級會計理財操卷班LING'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid AND e.class_id = '565ec2a7-fead-5408-90be-ea7d3bc28823'::uuid
);
-- row 73 中四級會計理財操卷班LING

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '495c1b7f-a4bf-42a3-a9ba-92c70d4202ea'::uuid, '8cdc3f86-fc05-5313-b93b-bce3ffbedc1a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級會計理財操卷班LING'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '495c1b7f-a4bf-42a3-a9ba-92c70d4202ea'::uuid AND e.class_id = '8cdc3f86-fc05-5313-b93b-bce3ffbedc1a'::uuid
);
-- row 74 中五級會計理財操卷班LING

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '805bda3f-ac9a-4acf-aca6-39f491c1b5c7'::uuid, '6cf56a34-42ff-59e2-964e-64186dcebf9e'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級英文科一對一JLAU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '805bda3f-ac9a-4acf-aca6-39f491c1b5c7'::uuid AND e.class_id = '6cf56a34-42ff-59e2-964e-64186dcebf9e'::uuid
);
-- row 76 中六級英文科一對一JLAU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '805bda3f-ac9a-4acf-aca6-39f491c1b5c7'::uuid, 'd4a698bf-e6e0-5b1c-a56a-dd8a7f311459'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科一對一MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '805bda3f-ac9a-4acf-aca6-39f491c1b5c7'::uuid AND e.class_id = 'd4a698bf-e6e0-5b1c-a56a-dd8a7f311459'::uuid
);
-- row 77 中六級數學科一對一MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '77d6c2c9-9a38-45e6-88c8-e7e744c6c5b9'::uuid, '8df44c46-8f35-57b7-a5e8-39f349aace93'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級英文科一對二CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '77d6c2c9-9a38-45e6-88c8-e7e744c6c5b9'::uuid AND e.class_id = '8df44c46-8f35-57b7-a5e8-39f349aace93'::uuid
);
-- row 78 中六級英文科一對二CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'a2655bb3-6f9c-4ef2-a885-c789669c4061'::uuid, '8df44c46-8f35-57b7-a5e8-39f349aace93'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級英文科一對二CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'a2655bb3-6f9c-4ef2-a885-c789669c4061'::uuid AND e.class_id = '8df44c46-8f35-57b7-a5e8-39f349aace93'::uuid
);
-- row 78 中六級英文科一對二CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '9ff4db86-7b9e-463d-9127-51556940b038'::uuid, 'e8c7604a-1f15-56a7-8253-0e8661f114ee'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] （試）中四級化學科一對一SBLA'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '9ff4db86-7b9e-463d-9127-51556940b038'::uuid AND e.class_id = 'e8c7604a-1f15-56a7-8253-0e8661f114ee'::uuid
);
-- row 79 （試）中四級化學科一對一SBLA

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid, '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級物理科A班THOM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid AND e.class_id = '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid
);
-- row 80 中五級物理科A班THOM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd69612dc-a1ec-450c-8902-333eb4c0171f'::uuid, '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級物理科A班THOM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd69612dc-a1ec-450c-8902-333eb4c0171f'::uuid AND e.class_id = '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid
);
-- row 80 中五級物理科A班THOM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'f80f24c8-c46d-4401-afab-7f93ebfc2f6b'::uuid, '2a48b2d2-f78e-54f5-9211-e3882f7d6b2b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五莊靖思中文科單對單'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'f80f24c8-c46d-4401-afab-7f93ebfc2f6b'::uuid AND e.class_id = '2a48b2d2-f78e-54f5-9211-e3882f7d6b2b'::uuid
);
-- row 81 中五莊靖思中文科單對單

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'f80f24c8-c46d-4401-afab-7f93ebfc2f6b'::uuid, '5c865266-89ac-5657-a4b8-b5481181d0dd'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五莊靖思生物科單對單'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'f80f24c8-c46d-4401-afab-7f93ebfc2f6b'::uuid AND e.class_id = '5c865266-89ac-5657-a4b8-b5481181d0dd'::uuid
);
-- row 82 中五莊靖思生物科單對單

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'f80f24c8-c46d-4401-afab-7f93ebfc2f6b'::uuid, '0611f048-1abf-5d73-ab36-8b860a9ebb75'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五莊靖思物理科單對單'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'f80f24c8-c46d-4401-afab-7f93ebfc2f6b'::uuid AND e.class_id = '0611f048-1abf-5d73-ab36-8b860a9ebb75'::uuid
);
-- row 83 中五莊靖思物理科單對單

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'f80f24c8-c46d-4401-afab-7f93ebfc2f6b'::uuid, '1cff8de6-f6ab-5ae4-b56a-471f385c89d5'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五莊靖思BAFS科單對單'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'f80f24c8-c46d-4401-afab-7f93ebfc2f6b'::uuid AND e.class_id = '1cff8de6-f6ab-5ae4-b56a-471f385c89d5'::uuid
);
-- row 84 中五莊靖思BAFS科單對單

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '9af92580-3c8f-4e34-9b0e-259f7b1d29d4'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科C班LIAM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '9af92580-3c8f-4e34-9b0e-259f7b1d29d4'::uuid AND e.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
);
-- row 86 中二級數學科C班LIAM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '33d9d899-bc3e-417f-a73e-25e51ddec12c'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科C班LIAM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '33d9d899-bc3e-417f-a73e-25e51ddec12c'::uuid AND e.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
);
-- row 86 中二級數學科C班LIAM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'd985e2e0-e140-49cf-9070-5d5f22145ef9'::uuid, '2b48c681-8017-590b-852f-232097fac865'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科單對單NKWO'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'd985e2e0-e140-49cf-9070-5d5f22145ef9'::uuid AND e.class_id = '2b48c681-8017-590b-852f-232097fac865'::uuid
);
-- row 87 中一級數學科單對單NKWO

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '7c4427c6-234b-43b4-a598-a5fd27461fab'::uuid, 'e3fc2cfb-ddde-5bcd-8079-f987585fec5c'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 林家綺中文科單對單 CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '7c4427c6-234b-43b4-a598-a5fd27461fab'::uuid AND e.class_id = 'e3fc2cfb-ddde-5bcd-8079-f987585fec5c'::uuid
);
-- row 88 林家綺中文科單對單 CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '5defd314-7fff-4181-90a2-12dae25e21cf'::uuid, '0321e2d4-5ac7-5303-ba20-0f33e3126db2'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 俞逸軒一對一 MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '5defd314-7fff-4181-90a2-12dae25e21cf'::uuid AND e.class_id = '0321e2d4-5ac7-5303-ba20-0f33e3126db2'::uuid
);
-- row 89 俞逸軒一對一 MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科A班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid AND e.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
);
-- row 90 中四五級英文科A班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'c9d95382-dc26-44eb-9439-689cd9856022'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科A班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'c9d95382-dc26-44eb-9439-689cd9856022'::uuid AND e.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
);
-- row 90 中四五級英文科A班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '771f28d9-790f-46e1-a803-ae64a635d68b'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科A班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '771f28d9-790f-46e1-a803-ae64a635d68b'::uuid AND e.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
);
-- row 90 中四五級英文科A班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科A班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid AND e.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
);
-- row 90 中四五級英文科A班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'fc447e55-3829-4793-8a7a-51efaacb75c4'::uuid, 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文B班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'fc447e55-3829-4793-8a7a-51efaacb75c4'::uuid AND e.class_id = 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid
);
-- row 91 中四五級英文B班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文B班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid AND e.class_id = 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid
);
-- row 91 中四五級英文B班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid, 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文B班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid AND e.class_id = 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid
);
-- row 91 中四五級英文B班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'fee10737-293b-4abc-b861-cf90c12f49e9'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英B班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'fee10737-293b-4abc-b861-cf90c12f49e9'::uuid AND e.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
);
-- row 92 中一二級英B班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'fbb6b90a-2eda-4d65-84b7-f32c4c774c33'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英B班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'fbb6b90a-2eda-4d65-84b7-f32c4c774c33'::uuid AND e.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
);
-- row 92 中一二級英B班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'b71f8795-7d99-4204-bd9c-791bf1395ffc'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英B班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'b71f8795-7d99-4204-bd9c-791bf1395ffc'::uuid AND e.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
);
-- row 92 中一二級英B班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'ef0c9409-d389-47ac-9287-e4517bbe4b45'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英B班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'ef0c9409-d389-47ac-9287-e4517bbe4b45'::uuid AND e.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
);
-- row 92 中一二級英B班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '08c84fc8-67fc-4bba-8a53-d060de658a90'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英B班CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '08c84fc8-67fc-4bba-8a53-d060de658a90'::uuid AND e.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
);
-- row 92 中一二級英B班CYNG

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '7a3d4401-60e0-4022-b56a-618e1096a6eb'::uuid, '7702ea6f-bd18-506a-bee5-7605213bf5fa'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 陳煒傑一對一CYND'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '7a3d4401-60e0-4022-b56a-618e1096a6eb'::uuid AND e.class_id = '7702ea6f-bd18-506a-bee5-7605213bf5fa'::uuid
);
-- row 93 陳煒傑一對一CYND

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '98f9ffe4-4c78-4582-8f37-c3db330f5048'::uuid, '2b8c7bb6-e76b-5816-9a9a-bfeaedf13561'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科一對一CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '98f9ffe4-4c78-4582-8f37-c3db330f5048'::uuid AND e.class_id = '2b8c7bb6-e76b-5816-9a9a-bfeaedf13561'::uuid
);
-- row 95 中六級中文科一對一CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '2d28dd37-b19d-41d8-b220-a13fdf37041d'::uuid, '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科一對二 MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '2d28dd37-b19d-41d8-b220-a13fdf37041d'::uuid AND e.class_id = '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid
);
-- row 96 中六級數學科一對二 MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '486dd132-f2b2-4c0e-b5e4-853e07434826'::uuid, '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科一對二 MYU'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '486dd132-f2b2-4c0e-b5e4-853e07434826'::uuid AND e.class_id = '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid
);
-- row 96 中六級數學科一對二 MYU

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'eb3e8cf2-6fde-4138-b38d-99d698542306'::uuid, '1eeef1e2-4da6-59aa-bbdf-cff365b2e7fa'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 智珩功課班 Rain'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'eb3e8cf2-6fde-4138-b38d-99d698542306'::uuid AND e.class_id = '1eeef1e2-4da6-59aa-bbdf-cff365b2e7fa'::uuid
);
-- row 97 智珩功課班 Rain

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid, '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級科學A班 PHEB'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid AND e.class_id = '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid
);
-- row 101 中二級科學A班 PHEB

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid, '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級科學A班 PHEB'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid AND e.class_id = '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid
);
-- row 101 中二級科學A班 PHEB

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '6d169f47-d3cb-42e0-b4bf-ed8e77ee7b99'::uuid, '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級科學A班 PHEB'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '6d169f47-d3cb-42e0-b4bf-ed8e77ee7b99'::uuid AND e.class_id = '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid
);
-- row 101 中二級科學A班 PHEB

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '5787d58f-5d75-4c5b-b1c1-fb7f223d150f'::uuid, '91f31145-3842-400b-8009-8d0e7086c536'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級中文科A班 SHEK'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '5787d58f-5d75-4c5b-b1c1-fb7f223d150f'::uuid AND e.class_id = '91f31145-3842-400b-8009-8d0e7086c536'::uuid
);
-- row 103 中二級中文科A班 SHEK

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '89679223-91e9-4250-9c16-33c4382f1467'::uuid, '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級BAFS科A班 Rafael'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '89679223-91e9-4250-9c16-33c4382f1467'::uuid AND e.class_id = '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid
);
-- row 104 中四級BAFS科A班 Rafael

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'c452051b-6455-4cdd-b5fc-278afdb68668'::uuid, '9dac7c67-dd60-57cf-82b5-17d01f31228a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 馮記昰一對一Kenneth'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'c452051b-6455-4cdd-b5fc-278afdb68668'::uuid AND e.class_id = '9dac7c67-dd60-57cf-82b5-17d01f31228a'::uuid
);
-- row 105 馮記昰一對一Kenneth

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '2d75f2ce-1a08-4e4c-b40f-9ed967d89e07'::uuid, '987d72f6-0aac-5032-8100-2fc1e56cec8f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級物理科單對單THOM'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '2d75f2ce-1a08-4e4c-b40f-9ed967d89e07'::uuid AND e.class_id = '987d72f6-0aac-5032-8100-2fc1e56cec8f'::uuid
);
-- row 106 中三級物理科單對單THOM

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT '805bda3f-ac9a-4acf-aca6-39f491c1b5c7'::uuid, '3f6cfda5-189d-554c-baa4-0112dd6ba5d8'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科一對一 CFAN'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = '805bda3f-ac9a-4acf-aca6-39f491c1b5c7'::uuid AND e.class_id = '3f6cfda5-189d-554c-baa4-0112dd6ba5d8'::uuid
);
-- row 107 中六級中文科一對一 CFAN

INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks)
SELECT 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid, 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級英文科一對一 CYNG'
WHERE NOT EXISTS (
  SELECT 1 FROM public.student_class_enrollments e
  WHERE e.student_id = 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid AND e.class_id = 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid
);
-- row 108 中五級英文科一對一 CYNG

COMMIT;