-- 2526 attendance import chunk
-- part 13/13, inserts 3601-3680 of 3680
BEGIN;

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '9af92580-3c8f-4e34-9b0e-259f7b1d29d4'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2026-04-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '9af92580-3c8f-4e34-9b0e-259f7b1d29d4'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2026-04-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '33d9d899-bc3e-417f-a73e-25e51ddec12c'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2026-04-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '33d9d899-bc3e-417f-a73e-25e51ddec12c'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2026-04-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '9af92580-3c8f-4e34-9b0e-259f7b1d29d4'::uuid, 'bbbe5495-4c46-50ba-b7c3-cd4960d4ab73'::uuid, '2026-04-15'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '9af92580-3c8f-4e34-9b0e-259f7b1d29d4'::uuid
    AND a.class_id = 'bbbe5495-4c46-50ba-b7c3-cd4960d4ab73'::uuid
    AND a.attendance_date = '2026-04-15'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '33d9d899-bc3e-417f-a73e-25e51ddec12c'::uuid, 'bbbe5495-4c46-50ba-b7c3-cd4960d4ab73'::uuid, '2026-04-15'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '33d9d899-bc3e-417f-a73e-25e51ddec12c'::uuid
    AND a.class_id = 'bbbe5495-4c46-50ba-b7c3-cd4960d4ab73'::uuid
    AND a.attendance_date = '2026-04-15'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '2026-04-11'::date, '出席', '[2526出席CSV] 教學紀錄: Set4 P2'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid
    AND a.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
    AND a.attendance_date = '2026-04-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '2026-04-11'::date, '出席', '[2526出席CSV] 教學紀錄: Set4 P2'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid
    AND a.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
    AND a.attendance_date = '2026-04-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a72586a0-ab9c-477b-b9c5-7231f1a23909'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '2026-04-11'::date, '出席', '[2526出席CSV] 教學紀錄: Set4 P2'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a72586a0-ab9c-477b-b9c5-7231f1a23909'::uuid
    AND a.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
    AND a.attendance_date = '2026-04-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'e42d3ed1-6383-4856-9fd3-ad29e9084ed4'::uuid, '005e8d52-6109-522e-9478-2023cf91b100'::uuid, '2026-04-11'::date, '出席', '[2526出席CSV] 教學紀錄: LKS 25-26 Mock P2'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'e42d3ed1-6383-4856-9fd3-ad29e9084ed4'::uuid
    AND a.class_id = '005e8d52-6109-522e-9478-2023cf91b100'::uuid
    AND a.attendance_date = '2026-04-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2d28dd37-b19d-41d8-b220-a13fdf37041d'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '2026-04-12'::date, '出席', '[2526出席CSV] 教學紀錄: Tanghin 25-26 Mock P1 A1'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2d28dd37-b19d-41d8-b220-a13fdf37041d'::uuid
    AND a.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND a.attendance_date = '2026-04-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '486dd132-f2b2-4c0e-b5e4-853e07434826'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '2026-04-12'::date, '出席', '[2526出席CSV] 教學紀錄: Tanghin 25-26 Mock P1 A1'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '486dd132-f2b2-4c0e-b5e4-853e07434826'::uuid
    AND a.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND a.attendance_date = '2026-04-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'e42d3ed1-6383-4856-9fd3-ad29e9084ed4'::uuid, '005e8d52-6109-522e-9478-2023cf91b100'::uuid, '2026-04-12'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'e42d3ed1-6383-4856-9fd3-ad29e9084ed4'::uuid
    AND a.class_id = '005e8d52-6109-522e-9478-2023cf91b100'::uuid
    AND a.attendance_date = '2026-04-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2026-04-16'::date, '出席', '[2526出席CSV] 教學紀錄: Exam11 10-11 almost finished'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2026-04-16'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5787d58f-5d75-4c5b-b1c1-fb7f223d150f'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2026-04-16'::date, '出席', '[2526出席CSV] 教學紀錄: Exam11 10-11 almost finished'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5787d58f-5d75-4c5b-b1c1-fb7f223d150f'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2026-04-16'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6d169f47-d3cb-42e0-b4bf-ed8e77ee7b99'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2026-04-16'::date, '出席', '[2526出席CSV] 教學紀錄: Exam11 10-11 almost finished'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6d169f47-d3cb-42e0-b4bf-ed8e77ee7b99'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2026-04-16'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '22fcad0f-8d89-48b1-abbd-9d0a52dc88ce'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2026-04-16'::date, '出席', '[2526出席CSV] 教學紀錄: Exam11 10-11 almost finished'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '22fcad0f-8d89-48b1-abbd-9d0a52dc88ce'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2026-04-16'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '05fa33c2-cd5c-49b0-b5c9-4cfdf83038cc'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2026-04-16'::date, '出席', '[2526出席CSV] 教學紀錄: Exam11 10-11 almost finished'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '05fa33c2-cd5c-49b0-b5c9-4cfdf83038cc'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2026-04-16'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fe2cae65-566c-42de-b757-d1807e84d9d5'::uuid, '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, '2026-04-16'::date, '出席', '[2526出席CSV] 教學紀錄: assign application of trigo | 請堂或補堂紀錄（老師填寫）: 林曉柔調25/4 Natalie, 莫凱晴調18/4 Natalie'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fe2cae65-566c-42de-b757-d1807e84d9d5'::uuid
    AND a.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
    AND a.attendance_date = '2026-04-16'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a9306a6e-1365-4a0c-bfa4-0ab21c59ee37'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2026-04-11'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a9306a6e-1365-4a0c-bfa4-0ab21c59ee37'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2026-04-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '31bbcda2-e3f9-44d5-8445-5115685e1ef6'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2026-04-11'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '31bbcda2-e3f9-44d5-8445-5115685e1ef6'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2026-04-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '3aa01047-b955-4510-a96f-5cb7e41329b4'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2026-04-11'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '3aa01047-b955-4510-a96f-5cb7e41329b4'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2026-04-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '314253d9-0110-4705-8b07-71caf08c7a53'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2026-04-11'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '314253d9-0110-4705-8b07-71caf08c7a53'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2026-04-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fef46182-4c68-4560-9d3f-99b5abc8ae8e'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2026-04-15'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fef46182-4c68-4560-9d3f-99b5abc8ae8e'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2026-04-15'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b048d92b-aa05-487c-b0be-545ef6745e2d'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2026-04-15'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b048d92b-aa05-487c-b0be-545ef6745e2d'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2026-04-15'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2026-04-15'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2026-04-15'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '8d0c77a0-b0cf-4903-9d4e-560ae3502250'::uuid, '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid, '2026-04-18'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '8d0c77a0-b0cf-4903-9d4e-560ae3502250'::uuid
    AND a.class_id = '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid
    AND a.attendance_date = '2026-04-18'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd70cb168-58f1-44bd-a4ee-6d5d803cf26e'::uuid, '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid, '2026-04-18'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd70cb168-58f1-44bd-a4ee-6d5d803cf26e'::uuid
    AND a.class_id = '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid
    AND a.attendance_date = '2026-04-18'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd70cb168-58f1-44bd-a4ee-6d5d803cf26e'::uuid, '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid, '2026-04-18'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd70cb168-58f1-44bd-a4ee-6d5d803cf26e'::uuid
    AND a.class_id = '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid
    AND a.attendance_date = '2026-04-18'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '80e22011-8207-4a75-87ee-02e7f2f5be4f'::uuid, '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid, '2026-04-18'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '80e22011-8207-4a75-87ee-02e7f2f5be4f'::uuid
    AND a.class_id = '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid
    AND a.attendance_date = '2026-04-18'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '0bf2b340-46d8-4272-90e1-48a098d220f9'::uuid, '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid, '2026-04-18'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '0bf2b340-46d8-4272-90e1-48a098d220f9'::uuid
    AND a.class_id = '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid
    AND a.attendance_date = '2026-04-18'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid, '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid, '2026-04-18'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid
    AND a.class_id = '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid
    AND a.attendance_date = '2026-04-18'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5787d58f-5d75-4c5b-b1c1-fb7f223d150f'::uuid, '91f31145-3842-400b-8009-8d0e7086c536'::uuid, '2026-04-13'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5787d58f-5d75-4c5b-b1c1-fb7f223d150f'::uuid
    AND a.class_id = '91f31145-3842-400b-8009-8d0e7086c536'::uuid
    AND a.attendance_date = '2026-04-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd985e2e0-e140-49cf-9070-5d5f22145ef9'::uuid, 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid, '2026-04-11'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd985e2e0-e140-49cf-9070-5d5f22145ef9'::uuid
    AND a.class_id = 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid
    AND a.attendance_date = '2026-04-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd985e2e0-e140-49cf-9070-5d5f22145ef9'::uuid, 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid, '2026-04-18'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd985e2e0-e140-49cf-9070-5d5f22145ef9'::uuid
    AND a.class_id = 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid
    AND a.attendance_date = '2026-04-18'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '7801ffd1-6991-4a37-9015-61d33320b215'::uuid, 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid, '2026-04-18'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '7801ffd1-6991-4a37-9015-61d33320b215'::uuid
    AND a.class_id = 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid
    AND a.attendance_date = '2026-04-18'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '8333a1b0-0ee1-4b9b-9232-a4e8caf3cd8f'::uuid, 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid, '2026-04-18'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '8333a1b0-0ee1-4b9b-9232-a4e8caf3cd8f'::uuid
    AND a.class_id = 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid
    AND a.attendance_date = '2026-04-18'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a09da146-6195-4d68-a1f8-22a8202a1f3d'::uuid, '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, '2026-04-18'::date, '出席', '[2526出席CSV] 教學紀錄: 開新課Variation up to Q21'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a09da146-6195-4d68-a1f8-22a8202a1f3d'::uuid
    AND a.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
    AND a.attendance_date = '2026-04-18'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid, '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, '2026-04-17'::date, '出席', '[2526出席CSV] 教學紀錄: Revised 2D ws | 請堂或補堂紀錄（老師填寫）: 蘇子航video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid
    AND a.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
    AND a.attendance_date = '2026-04-17'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid, '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, '2026-04-17'::date, '出席', '[2526出席CSV] 教學紀錄: Revised 2D ws | 請堂或補堂紀錄（老師填寫）: 蘇子航video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid
    AND a.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
    AND a.attendance_date = '2026-04-17'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '2026-04-18'::date, '出席', '[2526出席CSV] 教學紀錄: Revised 2D ws finished + DSE 題目'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid
    AND a.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND a.attendance_date = '2026-04-18'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '2026-04-18'::date, '出席', '[2526出席CSV] 教學紀錄: Revised 2D ws finished + DSE 題目'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid
    AND a.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND a.attendance_date = '2026-04-18'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '24331c17-871b-4e56-96ca-ad72058fb371'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '2026-04-18'::date, '出席', '[2526出席CSV] 教學紀錄: Revised 2D ws finished + DSE 題目'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '24331c17-871b-4e56-96ca-ad72058fb371'::uuid
    AND a.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND a.attendance_date = '2026-04-18'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '2026-04-18'::date, '出席', '[2526出席CSV] 教學紀錄: Revised 2D ws finished + DSE 題目'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid
    AND a.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND a.attendance_date = '2026-04-18'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'da86a454-fb29-4b1c-bd73-1230b7455b98'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '2026-04-18'::date, '出席', '[2526出席CSV] 教學紀錄: Revised 2D ws finished + DSE 題目'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'da86a454-fb29-4b1c-bd73-1230b7455b98'::uuid
    AND a.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND a.attendance_date = '2026-04-18'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b048d92b-aa05-487c-b0be-545ef6745e2d'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '2026-04-18'::date, '出席', '[2526出席CSV] 教學紀錄: Revised 2D ws finished + DSE 題目'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b048d92b-aa05-487c-b0be-545ef6745e2d'::uuid
    AND a.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND a.attendance_date = '2026-04-18'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'c0cc0734-be3f-4c35-a4a4-9e94914bfea5'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '2026-04-18'::date, '出席', '[2526出席CSV] 教學紀錄: 開新課Variation up to Q21'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'c0cc0734-be3f-4c35-a4a4-9e94914bfea5'::uuid
    AND a.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND a.attendance_date = '2026-04-18'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ffa0780b-5590-4ace-899e-91f343d78a81'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '2026-04-18'::date, '出席', '[2526出席CSV] 教學紀錄: 開新課Variation up to Q21'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ffa0780b-5590-4ace-899e-91f343d78a81'::uuid
    AND a.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND a.attendance_date = '2026-04-18'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '2026-04-18'::date, '出席', '[2526出席CSV] 教學紀錄: 開新課Variation up to Q21'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid
    AND a.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND a.attendance_date = '2026-04-18'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd78cdee9-fc3f-4ffa-ab33-68861dc36143'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '2026-04-18'::date, '出席', '[2526出席CSV] 教學紀錄: 開新課Variation up to Q21'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd78cdee9-fc3f-4ffa-ab33-68861dc36143'::uuid
    AND a.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND a.attendance_date = '2026-04-18'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'c3103566-5e93-4765-8b3d-d465306c97ba'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '2026-04-18'::date, '出席', '[2526出席CSV] 教學紀錄: 開新課Variation up to Q21'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'c3103566-5e93-4765-8b3d-d465306c97ba'::uuid
    AND a.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND a.attendance_date = '2026-04-18'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '98b38abc-55c5-41cb-8815-5ece90f15645'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '2026-04-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '98b38abc-55c5-41cb-8815-5ece90f15645'::uuid
    AND a.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND a.attendance_date = '2026-04-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '617dd2b5-bbad-412a-a3bf-b6b17f7dbd41'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '2026-04-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '617dd2b5-bbad-412a-a3bf-b6b17f7dbd41'::uuid
    AND a.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND a.attendance_date = '2026-04-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6023b53d-82b5-4544-86ff-1297c8664616'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '2026-04-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6023b53d-82b5-4544-86ff-1297c8664616'::uuid
    AND a.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND a.attendance_date = '2026-04-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6b2b2711-4d57-4db6-90aa-334b4fa98f10'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '2026-04-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6b2b2711-4d57-4db6-90aa-334b4fa98f10'::uuid
    AND a.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND a.attendance_date = '2026-04-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fee10737-293b-4abc-b861-cf90c12f49e9'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '2026-04-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fee10737-293b-4abc-b861-cf90c12f49e9'::uuid
    AND a.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND a.attendance_date = '2026-04-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fbb6b90a-2eda-4d65-84b7-f32c4c774c33'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '2026-04-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fbb6b90a-2eda-4d65-84b7-f32c4c774c33'::uuid
    AND a.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND a.attendance_date = '2026-04-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b71f8795-7d99-4204-bd9c-791bf1395ffc'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '2026-04-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b71f8795-7d99-4204-bd9c-791bf1395ffc'::uuid
    AND a.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND a.attendance_date = '2026-04-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ef0c9409-d389-47ac-9287-e4517bbe4b45'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '2026-04-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ef0c9409-d389-47ac-9287-e4517bbe4b45'::uuid
    AND a.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND a.attendance_date = '2026-04-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '89679223-91e9-4250-9c16-33c4382f1467'::uuid, '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid, '2026-04-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '89679223-91e9-4250-9c16-33c4382f1467'::uuid
    AND a.class_id = '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid
    AND a.attendance_date = '2026-04-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '495c1b7f-a4bf-42a3-a9ba-92c70d4202ea'::uuid, 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid, '2026-04-10'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '495c1b7f-a4bf-42a3-a9ba-92c70d4202ea'::uuid
    AND a.class_id = 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid
    AND a.attendance_date = '2026-04-10'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '495c1b7f-a4bf-42a3-a9ba-92c70d4202ea'::uuid, 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid, '2026-04-17'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '495c1b7f-a4bf-42a3-a9ba-92c70d4202ea'::uuid
    AND a.class_id = 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid
    AND a.attendance_date = '2026-04-17'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2026-04-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2026-04-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'c9d95382-dc26-44eb-9439-689cd9856022'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2026-04-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'c9d95382-dc26-44eb-9439-689cd9856022'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2026-04-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '771f28d9-790f-46e1-a803-ae64a635d68b'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2026-04-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '771f28d9-790f-46e1-a803-ae64a635d68b'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2026-04-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2026-04-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2026-04-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '7a3d4401-60e0-4022-b56a-618e1096a6eb'::uuid, '7702ea6f-bd18-506a-bee5-7605213bf5fa'::uuid, '2026-04-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '7a3d4401-60e0-4022-b56a-618e1096a6eb'::uuid
    AND a.class_id = '7702ea6f-bd18-506a-bee5-7605213bf5fa'::uuid
    AND a.attendance_date = '2026-04-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid, 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid, '2026-04-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid
    AND a.class_id = 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid
    AND a.attendance_date = '2026-04-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fc447e55-3829-4793-8a7a-51efaacb75c4'::uuid, 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid, '2026-04-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fc447e55-3829-4793-8a7a-51efaacb75c4'::uuid
    AND a.class_id = 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid
    AND a.attendance_date = '2026-04-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid, '2026-04-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid
    AND a.class_id = 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid
    AND a.attendance_date = '2026-04-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid, 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid, '2026-04-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid
    AND a.class_id = 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid
    AND a.attendance_date = '2026-04-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid, '2026-04-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid
    AND a.class_id = '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid
    AND a.attendance_date = '2026-04-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '56a2d62d-efe0-4954-b6b1-0e5b739985c8'::uuid, '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid, '2026-04-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '56a2d62d-efe0-4954-b6b1-0e5b739985c8'::uuid
    AND a.class_id = '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid
    AND a.attendance_date = '2026-04-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid, '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid, '2026-04-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid
    AND a.class_id = '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid
    AND a.attendance_date = '2026-04-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd9260dcb-e6b8-4dc7-a885-c72235135645'::uuid, '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid, '2026-04-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd9260dcb-e6b8-4dc7-a885-c72235135645'::uuid
    AND a.class_id = '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid
    AND a.attendance_date = '2026-04-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd6d91a52-7b94-4e15-b91f-fabeb6916e65'::uuid, '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid, '2026-04-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd6d91a52-7b94-4e15-b91f-fabeb6916e65'::uuid
    AND a.class_id = '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid
    AND a.attendance_date = '2026-04-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2026-04-23'::date, '出席', '[2526出席CSV] 教學紀錄: congurance test + exam practice'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2026-04-23'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5787d58f-5d75-4c5b-b1c1-fb7f223d150f'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2026-04-23'::date, '出席', '[2526出席CSV] 教學紀錄: congurance test + exam practice'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5787d58f-5d75-4c5b-b1c1-fb7f223d150f'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2026-04-23'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6d169f47-d3cb-42e0-b4bf-ed8e77ee7b99'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2026-04-23'::date, '出席', '[2526出席CSV] 教學紀錄: congurance test + exam practice'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6d169f47-d3cb-42e0-b4bf-ed8e77ee7b99'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2026-04-23'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '22fcad0f-8d89-48b1-abbd-9d0a52dc88ce'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2026-04-23'::date, '出席', '[2526出席CSV] 教學紀錄: congurance test + exam practice'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '22fcad0f-8d89-48b1-abbd-9d0a52dc88ce'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2026-04-23'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '05fa33c2-cd5c-49b0-b5c9-4cfdf83038cc'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2026-04-23'::date, '出席', '[2526出席CSV] 教學紀錄: congurance test + exam practice'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '05fa33c2-cd5c-49b0-b5c9-4cfdf83038cc'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2026-04-23'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '89679223-91e9-4250-9c16-33c4382f1467'::uuid, '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid, '2026-04-23'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '89679223-91e9-4250-9c16-33c4382f1467'::uuid
    AND a.class_id = '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid
    AND a.attendance_date = '2026-04-23'::date
);

COMMIT;