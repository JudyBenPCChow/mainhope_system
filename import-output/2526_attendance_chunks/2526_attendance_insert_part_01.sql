-- 2526 attendance import chunk
-- part 1/13, inserts 1-300 of 3680
BEGIN;

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid, '91f31145-3842-400b-8009-8d0e7086c536'::uuid, '2025-09-01'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid
    AND a.class_id = '91f31145-3842-400b-8009-8d0e7086c536'::uuid
    AND a.attendance_date = '2025-09-01'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid, '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, '2025-09-01'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid
    AND a.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND a.attendance_date = '2025-09-01'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid, '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, '2025-09-01'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid
    AND a.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND a.attendance_date = '2025-09-01'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '9ff4db86-7b9e-463d-9127-51556940b038'::uuid, 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid, '2025-09-02'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '9ff4db86-7b9e-463d-9127-51556940b038'::uuid
    AND a.class_id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid
    AND a.attendance_date = '2025-09-02'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'f1c444db-4ae1-4cf1-89fe-bf5b316bf121'::uuid, 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid, '2025-09-02'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'f1c444db-4ae1-4cf1-89fe-bf5b316bf121'::uuid
    AND a.class_id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid
    AND a.attendance_date = '2025-09-02'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '19145380-aeb2-44f6-a27e-e2f263c7b35f'::uuid, '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, '2025-09-05'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '19145380-aeb2-44f6-a27e-e2f263c7b35f'::uuid
    AND a.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND a.attendance_date = '2025-09-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '01529c73-438d-4040-9c40-944d0b0d1af0'::uuid, '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, '2025-09-05'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '01529c73-438d-4040-9c40-944d0b0d1af0'::uuid
    AND a.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND a.attendance_date = '2025-09-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '37bd4518-13c0-47e0-8c45-30ac9f0a5507'::uuid, '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, '2025-09-05'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '37bd4518-13c0-47e0-8c45-30ac9f0a5507'::uuid
    AND a.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND a.attendance_date = '2025-09-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '3ab0dc4c-7eab-474a-8cff-f4e6ea4bc0c2'::uuid, '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, '2025-09-05'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '3ab0dc4c-7eab-474a-8cff-f4e6ea4bc0c2'::uuid
    AND a.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND a.attendance_date = '2025-09-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '98b38abc-55c5-41cb-8815-5ece90f15645'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '2025-09-07'::date, '出席', '[2526出席CSV] 教學紀錄: B/P four arithmetic operations, hw( all even numbers questions)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '98b38abc-55c5-41cb-8815-5ece90f15645'::uuid
    AND a.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND a.attendance_date = '2025-09-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '617dd2b5-bbad-412a-a3bf-b6b17f7dbd41'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '2025-09-07'::date, '出席', '[2526出席CSV] 教學紀錄: B/P four arithmetic operations, hw( all even numbers questions)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '617dd2b5-bbad-412a-a3bf-b6b17f7dbd41'::uuid
    AND a.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND a.attendance_date = '2025-09-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, 'a91bdded-21b2-49e5-9481-40938006062a'::uuid, '2025-09-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid
    AND a.class_id = 'a91bdded-21b2-49e5-9481-40938006062a'::uuid
    AND a.attendance_date = '2025-09-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ffa0780b-5590-4ace-899e-91f343d78a81'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '2025-09-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ffa0780b-5590-4ace-899e-91f343d78a81'::uuid
    AND a.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND a.attendance_date = '2025-09-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '373884c8-2e56-4019-a8e7-a9d292fa870b'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '2025-09-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '373884c8-2e56-4019-a8e7-a9d292fa870b'::uuid
    AND a.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND a.attendance_date = '2025-09-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '2025-09-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid
    AND a.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND a.attendance_date = '2025-09-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a84ea9f8-7c1d-4739-b347-058cee5a27e1'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '2025-09-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a84ea9f8-7c1d-4739-b347-058cee5a27e1'::uuid
    AND a.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND a.attendance_date = '2025-09-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid, '2025-09-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid
    AND a.class_id = '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid
    AND a.attendance_date = '2025-09-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'f1c444db-4ae1-4cf1-89fe-bf5b316bf121'::uuid, '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid, '2025-09-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'f1c444db-4ae1-4cf1-89fe-bf5b316bf121'::uuid
    AND a.class_id = '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid
    AND a.attendance_date = '2025-09-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6d169f47-d3cb-42e0-b4bf-ed8e77ee7b99'::uuid, '611974a7-8e91-494b-be09-3ceed9b14944'::uuid, '2025-09-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6d169f47-d3cb-42e0-b4bf-ed8e77ee7b99'::uuid
    AND a.class_id = '611974a7-8e91-494b-be09-3ceed9b14944'::uuid
    AND a.attendance_date = '2025-09-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid, '611974a7-8e91-494b-be09-3ceed9b14944'::uuid, '2025-09-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid
    AND a.class_id = '611974a7-8e91-494b-be09-3ceed9b14944'::uuid
    AND a.attendance_date = '2025-09-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '08a65222-0baf-47be-976d-73685070e38d'::uuid, '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, '2025-09-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '08a65222-0baf-47be-976d-73685070e38d'::uuid
    AND a.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND a.attendance_date = '2025-09-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5a0cdd32-30df-4acc-89ac-d954e07904c9'::uuid, '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, '2025-09-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5a0cdd32-30df-4acc-89ac-d954e07904c9'::uuid
    AND a.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND a.attendance_date = '2025-09-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid, 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid, '2025-09-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid
    AND a.class_id = 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid
    AND a.attendance_date = '2025-09-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '771f28d9-790f-46e1-a803-ae64a635d68b'::uuid, 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid, '2025-09-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '771f28d9-790f-46e1-a803-ae64a635d68b'::uuid
    AND a.class_id = 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid
    AND a.attendance_date = '2025-09-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b62fffd2-f2f9-4ce9-b9a8-e8e4b39c6304'::uuid, 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, '2025-09-07'::date, '出席', '[2526出席CSV] 教學紀錄: 山居秋暝背默 完成濠梁之辯'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b62fffd2-f2f9-4ce9-b9a8-e8e4b39c6304'::uuid
    AND a.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND a.attendance_date = '2025-09-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid, 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, '2025-09-07'::date, '出席', '[2526出席CSV] 教學紀錄: 山居秋暝背默 完成濠梁之辯'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid
    AND a.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND a.attendance_date = '2025-09-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'bd9c5612-0c8b-46c8-9fe3-1fb6f06b558b'::uuid, '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid, '2025-09-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'bd9c5612-0c8b-46c8-9fe3-1fb6f06b558b'::uuid
    AND a.class_id = '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid
    AND a.attendance_date = '2025-09-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a6d7e398-6053-4f3e-87e2-b28508728b8c'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2025-09-05'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 張傲姿請假，以影片補堂，已sd予學生'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a6d7e398-6053-4f3e-87e2-b28508728b8c'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2025-09-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fc447e55-3829-4793-8a7a-51efaacb75c4'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2025-09-05'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 張傲姿請假，以影片補堂，已sd予學生'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fc447e55-3829-4793-8a7a-51efaacb75c4'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2025-09-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6dcc2ca7-06be-4d97-a875-31b8aa348b46'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2025-09-05'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 張傲姿請假，以影片補堂，已sd予學生'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6dcc2ca7-06be-4d97-a875-31b8aa348b46'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2025-09-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '40bfa36c-585d-47cd-ba07-effbda547a51'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2025-09-05'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 張傲姿請假，以影片補堂，已sd予學生'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '40bfa36c-585d-47cd-ba07-effbda547a51'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2025-09-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2025-09-05'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 張傲姿請假，以影片補堂，已sd予學生'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2025-09-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '486dd132-f2b2-4c0e-b5e4-853e07434826'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2025-09-05'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 張傲姿請假，以影片補堂，已sd予學生'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '486dd132-f2b2-4c0e-b5e4-853e07434826'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2025-09-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fbb6b90a-2eda-4d65-84b7-f32c4c774c33'::uuid, '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid, '2025-09-06'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fbb6b90a-2eda-4d65-84b7-f32c4c774c33'::uuid
    AND a.class_id = '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b71f8795-7d99-4204-bd9c-791bf1395ffc'::uuid, '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid, '2025-09-06'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b71f8795-7d99-4204-bd9c-791bf1395ffc'::uuid
    AND a.class_id = '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'dd4893a5-f53a-4f0e-bdff-45353a7494dd'::uuid, '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid, '2025-09-06'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'dd4893a5-f53a-4f0e-bdff-45353a7494dd'::uuid
    AND a.class_id = '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '77d6c2c9-9a38-45e6-88c8-e7e744c6c5b9'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2025-09-06'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '77d6c2c9-9a38-45e6-88c8-e7e744c6c5b9'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a2655bb3-6f9c-4ef2-a885-c789669c4061'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2025-09-06'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a2655bb3-6f9c-4ef2-a885-c789669c4061'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '771f28d9-790f-46e1-a803-ae64a635d68b'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2025-09-06'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '771f28d9-790f-46e1-a803-ae64a635d68b'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6ad0329a-ad2d-4df1-b07a-b340ee9a5c23'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2025-09-06'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6ad0329a-ad2d-4df1-b07a-b340ee9a5c23'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2025-09-06'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5991bbd6-d744-46dd-a2db-30655bf3b150'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2025-09-06'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5991bbd6-d744-46dd-a2db-30655bf3b150'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '264e8911-ad63-49d9-a4b7-9356bd265ebd'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '2025-09-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '264e8911-ad63-49d9-a4b7-9356bd265ebd'::uuid
    AND a.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND a.attendance_date = '2025-09-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a5e577da-bf4f-4c97-aa15-e255a14374bf'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '2025-09-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a5e577da-bf4f-4c97-aa15-e255a14374bf'::uuid
    AND a.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND a.attendance_date = '2025-09-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '2025-09-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid
    AND a.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND a.attendance_date = '2025-09-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '2025-09-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid
    AND a.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND a.attendance_date = '2025-09-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '2025-09-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid
    AND a.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND a.attendance_date = '2025-09-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '51939e47-073b-4189-a5cc-588773fa40be'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '2025-09-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '51939e47-073b-4189-a5cc-588773fa40be'::uuid
    AND a.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND a.attendance_date = '2025-09-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid, '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, '2025-09-08'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid
    AND a.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND a.attendance_date = '2025-09-08'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid, '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, '2025-09-08'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid
    AND a.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND a.attendance_date = '2025-09-08'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '854ea905-3880-4c43-a34d-e9a08b319a15'::uuid, '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, '2025-09-08'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '854ea905-3880-4c43-a34d-e9a08b319a15'::uuid
    AND a.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND a.attendance_date = '2025-09-08'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid, '91f31145-3842-400b-8009-8d0e7086c536'::uuid, '2025-09-08'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid
    AND a.class_id = '91f31145-3842-400b-8009-8d0e7086c536'::uuid
    AND a.attendance_date = '2025-09-08'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid, '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid, '2025-09-06'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid
    AND a.class_id = '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '9ff4db86-7b9e-463d-9127-51556940b038'::uuid, 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid, '2025-09-09'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '9ff4db86-7b9e-463d-9127-51556940b038'::uuid
    AND a.class_id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid
    AND a.attendance_date = '2025-09-09'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'f1c444db-4ae1-4cf1-89fe-bf5b316bf121'::uuid, 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid, '2025-09-09'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'f1c444db-4ae1-4cf1-89fe-bf5b316bf121'::uuid
    AND a.class_id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid
    AND a.attendance_date = '2025-09-09'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, '2025-09-10'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid
    AND a.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND a.attendance_date = '2025-09-10'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '24331c17-871b-4e56-96ca-ad72058fb371'::uuid, '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, '2025-09-10'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '24331c17-871b-4e56-96ca-ad72058fb371'::uuid
    AND a.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND a.attendance_date = '2025-09-10'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '495c1b7f-a4bf-42a3-a9ba-92c70d4202ea'::uuid, '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, '2025-09-10'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '495c1b7f-a4bf-42a3-a9ba-92c70d4202ea'::uuid
    AND a.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND a.attendance_date = '2025-09-10'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a6d7e398-6053-4f3e-87e2-b28508728b8c'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2025-09-12'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 林靜、陳煒傑請假，以影片補堂'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a6d7e398-6053-4f3e-87e2-b28508728b8c'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2025-09-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fc447e55-3829-4793-8a7a-51efaacb75c4'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2025-09-12'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 林靜、陳煒傑請假，以影片補堂'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fc447e55-3829-4793-8a7a-51efaacb75c4'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2025-09-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '40bfa36c-585d-47cd-ba07-effbda547a51'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2025-09-12'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 林靜、陳煒傑請假，以影片補堂'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '40bfa36c-585d-47cd-ba07-effbda547a51'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2025-09-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2025-09-12'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 林靜、陳煒傑請假，以影片補堂'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2025-09-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '486dd132-f2b2-4c0e-b5e4-853e07434826'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2025-09-12'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 林靜、陳煒傑請假，以影片補堂'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '486dd132-f2b2-4c0e-b5e4-853e07434826'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2025-09-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6340373f-9c3e-42a3-85e2-672a73fd16ad'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2025-09-12'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 林靜、陳煒傑請假，以影片補堂'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6340373f-9c3e-42a3-85e2-672a73fd16ad'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2025-09-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2d28dd37-b19d-41d8-b220-a13fdf37041d'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2025-09-12'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 林靜、陳煒傑請假，以影片補堂'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2d28dd37-b19d-41d8-b220-a13fdf37041d'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2025-09-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid, '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid, '2025-09-13'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid
    AND a.class_id = '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid, '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid, '2025-09-13'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid
    AND a.class_id = '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fbb6b90a-2eda-4d65-84b7-f32c4c774c33'::uuid, '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid, '2025-09-13'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 梁展博請假，尚未處理補堂事宜'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fbb6b90a-2eda-4d65-84b7-f32c4c774c33'::uuid
    AND a.class_id = '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b71f8795-7d99-4204-bd9c-791bf1395ffc'::uuid, '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid, '2025-09-13'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 梁展博請假，尚未處理補堂事宜'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b71f8795-7d99-4204-bd9c-791bf1395ffc'::uuid
    AND a.class_id = '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'dd4893a5-f53a-4f0e-bdff-45353a7494dd'::uuid, '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid, '2025-09-13'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 梁展博請假，尚未處理補堂事宜'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'dd4893a5-f53a-4f0e-bdff-45353a7494dd'::uuid
    AND a.class_id = '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '77d6c2c9-9a38-45e6-88c8-e7e744c6c5b9'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2025-09-13'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '77d6c2c9-9a38-45e6-88c8-e7e744c6c5b9'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a2655bb3-6f9c-4ef2-a885-c789669c4061'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2025-09-13'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a2655bb3-6f9c-4ef2-a885-c789669c4061'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '771f28d9-790f-46e1-a803-ae64a635d68b'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2025-09-13'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '771f28d9-790f-46e1-a803-ae64a635d68b'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'c9d95382-dc26-44eb-9439-689cd9856022'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2025-09-13'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'c9d95382-dc26-44eb-9439-689cd9856022'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6ad0329a-ad2d-4df1-b07a-b340ee9a5c23'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2025-09-13'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6ad0329a-ad2d-4df1-b07a-b340ee9a5c23'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2025-09-13'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5991bbd6-d744-46dd-a2db-30655bf3b150'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2025-09-13'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5991bbd6-d744-46dd-a2db-30655bf3b150'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2025-09-13'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2025-09-13'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-13'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b79bc930-9d2f-412b-8069-84b75d61ad09'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-13'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b79bc930-9d2f-412b-8069-84b75d61ad09'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-13'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fef46182-4c68-4560-9d3f-99b5abc8ae8e'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-13'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fef46182-4c68-4560-9d3f-99b5abc8ae8e'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'da86a454-fb29-4b1c-bd73-1230b7455b98'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-13'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'da86a454-fb29-4b1c-bd73-1230b7455b98'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '51939e47-073b-4189-a5cc-588773fa40be'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-13'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '51939e47-073b-4189-a5cc-588773fa40be'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '745ddccd-f3cc-4f18-b409-5e62f513bfcd'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-13'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '745ddccd-f3cc-4f18-b409-5e62f513bfcd'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-13'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '32de9874-da52-43c8-8f13-c10a943c4618'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-13'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '32de9874-da52-43c8-8f13-c10a943c4618'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid, 'd23852cd-3827-4365-853d-00e23e093e83'::uuid, '2025-09-13'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid
    AND a.class_id = 'd23852cd-3827-4365-853d-00e23e093e83'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, 'd23852cd-3827-4365-853d-00e23e093e83'::uuid, '2025-09-13'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid
    AND a.class_id = 'd23852cd-3827-4365-853d-00e23e093e83'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '24331c17-871b-4e56-96ca-ad72058fb371'::uuid, 'd23852cd-3827-4365-853d-00e23e093e83'::uuid, '2025-09-13'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '24331c17-871b-4e56-96ca-ad72058fb371'::uuid
    AND a.class_id = 'd23852cd-3827-4365-853d-00e23e093e83'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '08a65222-0baf-47be-976d-73685070e38d'::uuid, '47ecae0c-df23-4449-bb25-f1835977d2a6'::uuid, '2025-09-13'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '08a65222-0baf-47be-976d-73685070e38d'::uuid
    AND a.class_id = '47ecae0c-df23-4449-bb25-f1835977d2a6'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'f1c444db-4ae1-4cf1-89fe-bf5b316bf121'::uuid, '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid, '2025-09-13'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'f1c444db-4ae1-4cf1-89fe-bf5b316bf121'::uuid
    AND a.class_id = '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-06'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b79bc930-9d2f-412b-8069-84b75d61ad09'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-06'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b79bc930-9d2f-412b-8069-84b75d61ad09'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-06'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fef46182-4c68-4560-9d3f-99b5abc8ae8e'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-06'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fef46182-4c68-4560-9d3f-99b5abc8ae8e'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'da86a454-fb29-4b1c-bd73-1230b7455b98'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-06'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'da86a454-fb29-4b1c-bd73-1230b7455b98'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '51939e47-073b-4189-a5cc-588773fa40be'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-06'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '51939e47-073b-4189-a5cc-588773fa40be'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '745ddccd-f3cc-4f18-b409-5e62f513bfcd'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-06'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '745ddccd-f3cc-4f18-b409-5e62f513bfcd'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-06'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '32de9874-da52-43c8-8f13-c10a943c4618'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-06'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '32de9874-da52-43c8-8f13-c10a943c4618'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2b18c20a-b985-4331-a232-eb31df0303ca'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-06'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2b18c20a-b985-4331-a232-eb31df0303ca'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '9ff4db86-7b9e-463d-9127-51556940b038'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2025-09-10'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '9ff4db86-7b9e-463d-9127-51556940b038'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2025-09-10'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '93f8aab8-3eb4-43cb-aebb-d07764819b00'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2025-09-10'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '93f8aab8-3eb4-43cb-aebb-d07764819b00'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2025-09-10'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fbb27277-2d26-4d3f-9fd4-a8f0fa5cddee'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2025-09-10'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fbb27277-2d26-4d3f-9fd4-a8f0fa5cddee'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2025-09-10'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2025-09-10'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2025-09-10'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '597c7280-53c9-4327-a05d-843c89046796'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2025-09-10'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '597c7280-53c9-4327-a05d-843c89046796'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2025-09-10'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2025-09-10'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2025-09-10'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '98b38abc-55c5-41cb-8815-5ece90f15645'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '2025-09-14'::date, '出席', '[2526出席CSV] 教學紀錄: Number line and +- numbers'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '98b38abc-55c5-41cb-8815-5ece90f15645'::uuid
    AND a.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND a.attendance_date = '2025-09-14'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '617dd2b5-bbad-412a-a3bf-b6b17f7dbd41'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '2025-09-14'::date, '出席', '[2526出席CSV] 教學紀錄: Number line and +- numbers'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '617dd2b5-bbad-412a-a3bf-b6b17f7dbd41'::uuid
    AND a.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND a.attendance_date = '2025-09-14'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, 'a91bdded-21b2-49e5-9481-40938006062a'::uuid, '2025-09-14'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid
    AND a.class_id = 'a91bdded-21b2-49e5-9481-40938006062a'::uuid
    AND a.attendance_date = '2025-09-14'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ffa0780b-5590-4ace-899e-91f343d78a81'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '2025-09-14'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ffa0780b-5590-4ace-899e-91f343d78a81'::uuid
    AND a.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND a.attendance_date = '2025-09-14'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '373884c8-2e56-4019-a8e7-a9d292fa870b'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '2025-09-14'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '373884c8-2e56-4019-a8e7-a9d292fa870b'::uuid
    AND a.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND a.attendance_date = '2025-09-14'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '2025-09-14'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid
    AND a.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND a.attendance_date = '2025-09-14'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a84ea9f8-7c1d-4739-b347-058cee5a27e1'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '2025-09-14'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a84ea9f8-7c1d-4739-b347-058cee5a27e1'::uuid
    AND a.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND a.attendance_date = '2025-09-14'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b9ec0998-36bc-4bc9-8b4b-6ad4e9000e98'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '2025-09-14'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b9ec0998-36bc-4bc9-8b4b-6ad4e9000e98'::uuid
    AND a.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND a.attendance_date = '2025-09-14'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '40bfa36c-585d-47cd-ba07-effbda547a51'::uuid, '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid, '2025-09-10'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '40bfa36c-585d-47cd-ba07-effbda547a51'::uuid
    AND a.class_id = '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid
    AND a.attendance_date = '2025-09-10'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid, '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid, '2025-09-10'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid
    AND a.class_id = '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid
    AND a.attendance_date = '2025-09-10'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '745ddccd-f3cc-4f18-b409-5e62f513bfcd'::uuid, '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid, '2025-09-10'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '745ddccd-f3cc-4f18-b409-5e62f513bfcd'::uuid
    AND a.class_id = '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid
    AND a.attendance_date = '2025-09-10'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid, '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid, '2025-09-10'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid
    AND a.class_id = '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid
    AND a.attendance_date = '2025-09-10'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '061dca0d-7523-405e-b10d-e4e2fc12b422'::uuid, '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid, '2025-09-10'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '061dca0d-7523-405e-b10d-e4e2fc12b422'::uuid
    AND a.class_id = '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid
    AND a.attendance_date = '2025-09-10'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b62fffd2-f2f9-4ce9-b9a8-e8e4b39c6304'::uuid, 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, '2025-09-14'::date, '出席', '[2526出席CSV] 教學紀錄: 蕭 補回星期三未上一節'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b62fffd2-f2f9-4ce9-b9a8-e8e4b39c6304'::uuid
    AND a.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND a.attendance_date = '2025-09-14'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid, 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, '2025-09-14'::date, '出席', '[2526出席CSV] 教學紀錄: 蕭 補回星期三未上一節'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid
    AND a.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND a.attendance_date = '2025-09-14'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid, 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, '2025-09-14'::date, '出席', '[2526出席CSV] 教學紀錄: 蕭 補回星期三未上一節'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid
    AND a.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND a.attendance_date = '2025-09-14'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, '2025-09-14'::date, '出席', '[2526出席CSV] 教學紀錄: 蕭 補回星期三未上一節'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid
    AND a.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND a.attendance_date = '2025-09-14'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'f1c444db-4ae1-4cf1-89fe-bf5b316bf121'::uuid, '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid, '2025-09-14'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'f1c444db-4ae1-4cf1-89fe-bf5b316bf121'::uuid
    AND a.class_id = '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid
    AND a.attendance_date = '2025-09-14'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'bd9c5612-0c8b-46c8-9fe3-1fb6f06b558b'::uuid, '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid, '2025-09-14'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'bd9c5612-0c8b-46c8-9fe3-1fb6f06b558b'::uuid
    AND a.class_id = '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid
    AND a.attendance_date = '2025-09-14'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '264e8911-ad63-49d9-a4b7-9356bd265ebd'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '2025-09-14'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 張朗志請假，17/9 補回'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '264e8911-ad63-49d9-a4b7-9356bd265ebd'::uuid
    AND a.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND a.attendance_date = '2025-09-14'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a5e577da-bf4f-4c97-aa15-e255a14374bf'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '2025-09-14'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 張朗志請假，17/9 補回'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a5e577da-bf4f-4c97-aa15-e255a14374bf'::uuid
    AND a.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND a.attendance_date = '2025-09-14'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '2025-09-14'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 張朗志請假，17/9 補回'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid
    AND a.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND a.attendance_date = '2025-09-14'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '51939e47-073b-4189-a5cc-588773fa40be'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '2025-09-14'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 張朗志請假，17/9 補回'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '51939e47-073b-4189-a5cc-588773fa40be'::uuid
    AND a.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND a.attendance_date = '2025-09-14'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '610d001f-ea5c-416b-88bc-4239498ff49a'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '2025-09-14'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 張朗志請假，17/9 補回'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '610d001f-ea5c-416b-88bc-4239498ff49a'::uuid
    AND a.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND a.attendance_date = '2025-09-14'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '19145380-aeb2-44f6-a27e-e2f263c7b35f'::uuid, '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, '2025-09-12'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '19145380-aeb2-44f6-a27e-e2f263c7b35f'::uuid
    AND a.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND a.attendance_date = '2025-09-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '01529c73-438d-4040-9c40-944d0b0d1af0'::uuid, '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, '2025-09-12'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '01529c73-438d-4040-9c40-944d0b0d1af0'::uuid
    AND a.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND a.attendance_date = '2025-09-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '37bd4518-13c0-47e0-8c45-30ac9f0a5507'::uuid, '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, '2025-09-12'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '37bd4518-13c0-47e0-8c45-30ac9f0a5507'::uuid
    AND a.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND a.attendance_date = '2025-09-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '3ab0dc4c-7eab-474a-8cff-f4e6ea4bc0c2'::uuid, '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, '2025-09-12'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '3ab0dc4c-7eab-474a-8cff-f4e6ea4bc0c2'::uuid
    AND a.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND a.attendance_date = '2025-09-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '08a65222-0baf-47be-976d-73685070e38d'::uuid, '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, '2025-09-14'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '08a65222-0baf-47be-976d-73685070e38d'::uuid
    AND a.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND a.attendance_date = '2025-09-14'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5a0cdd32-30df-4acc-89ac-d954e07904c9'::uuid, '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, '2025-09-14'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5a0cdd32-30df-4acc-89ac-d954e07904c9'::uuid
    AND a.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND a.attendance_date = '2025-09-14'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid, '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, '2025-09-14'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid
    AND a.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND a.attendance_date = '2025-09-14'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid, 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid, '2025-09-14'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid
    AND a.class_id = 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid
    AND a.attendance_date = '2025-09-14'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '771f28d9-790f-46e1-a803-ae64a635d68b'::uuid, 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid, '2025-09-14'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '771f28d9-790f-46e1-a803-ae64a635d68b'::uuid
    AND a.class_id = 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid
    AND a.attendance_date = '2025-09-14'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '9ff4db86-7b9e-463d-9127-51556940b038'::uuid, 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid, '2025-09-16'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '9ff4db86-7b9e-463d-9127-51556940b038'::uuid
    AND a.class_id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid
    AND a.attendance_date = '2025-09-16'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'f1c444db-4ae1-4cf1-89fe-bf5b316bf121'::uuid, 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid, '2025-09-16'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'f1c444db-4ae1-4cf1-89fe-bf5b316bf121'::uuid
    AND a.class_id = 'd4ef9fff-d444-4edb-b25a-a77d540824cd'::uuid
    AND a.attendance_date = '2025-09-16'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '9ff4db86-7b9e-463d-9127-51556940b038'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2025-09-17'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 梁顯民 林可欣 吳俊羲 看錄影'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '9ff4db86-7b9e-463d-9127-51556940b038'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2025-09-17'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '93f8aab8-3eb4-43cb-aebb-d07764819b00'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2025-09-17'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 梁顯民 林可欣 吳俊羲 看錄影'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '93f8aab8-3eb4-43cb-aebb-d07764819b00'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2025-09-17'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fbb27277-2d26-4d3f-9fd4-a8f0fa5cddee'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2025-09-17'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 梁顯民 林可欣 吳俊羲 看錄影'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fbb27277-2d26-4d3f-9fd4-a8f0fa5cddee'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2025-09-17'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2025-09-17'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 梁顯民 林可欣 吳俊羲 看錄影'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2025-09-17'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '597c7280-53c9-4327-a05d-843c89046796'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2025-09-17'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 梁顯民 林可欣 吳俊羲 看錄影'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '597c7280-53c9-4327-a05d-843c89046796'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2025-09-17'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2025-09-17'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 梁顯民 林可欣 吳俊羲 看錄影'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2025-09-17'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a6d7e398-6053-4f3e-87e2-b28508728b8c'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2025-09-19'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 巧悅改聽日補'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a6d7e398-6053-4f3e-87e2-b28508728b8c'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2025-09-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fc447e55-3829-4793-8a7a-51efaacb75c4'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2025-09-19'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 巧悅改聽日補'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fc447e55-3829-4793-8a7a-51efaacb75c4'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2025-09-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '40bfa36c-585d-47cd-ba07-effbda547a51'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2025-09-19'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 巧悅改聽日補'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '40bfa36c-585d-47cd-ba07-effbda547a51'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2025-09-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2025-09-19'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 巧悅改聽日補'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2025-09-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '486dd132-f2b2-4c0e-b5e4-853e07434826'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2025-09-19'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 巧悅改聽日補'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '486dd132-f2b2-4c0e-b5e4-853e07434826'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2025-09-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6340373f-9c3e-42a3-85e2-672a73fd16ad'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2025-09-19'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 巧悅改聽日補'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6340373f-9c3e-42a3-85e2-672a73fd16ad'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2025-09-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2d28dd37-b19d-41d8-b220-a13fdf37041d'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2025-09-19'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 巧悅改聽日補'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2d28dd37-b19d-41d8-b220-a13fdf37041d'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2025-09-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid, '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid, '2025-09-20'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid
    AND a.class_id = '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid, '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid, '2025-09-20'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid
    AND a.class_id = '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '08a65222-0baf-47be-976d-73685070e38d'::uuid, '47ecae0c-df23-4449-bb25-f1835977d2a6'::uuid, '2025-09-20'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '08a65222-0baf-47be-976d-73685070e38d'::uuid
    AND a.class_id = '47ecae0c-df23-4449-bb25-f1835977d2a6'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-20'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 陳卓賢 楊逸飛 影片補堂。陳俊鍇 葉熙桐網課'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b79bc930-9d2f-412b-8069-84b75d61ad09'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-20'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 陳卓賢 楊逸飛 影片補堂。陳俊鍇 葉熙桐網課'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b79bc930-9d2f-412b-8069-84b75d61ad09'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-20'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 陳卓賢 楊逸飛 影片補堂。陳俊鍇 葉熙桐網課'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fef46182-4c68-4560-9d3f-99b5abc8ae8e'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-20'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 陳卓賢 楊逸飛 影片補堂。陳俊鍇 葉熙桐網課'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fef46182-4c68-4560-9d3f-99b5abc8ae8e'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'da86a454-fb29-4b1c-bd73-1230b7455b98'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-20'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 陳卓賢 楊逸飛 影片補堂。陳俊鍇 葉熙桐網課'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'da86a454-fb29-4b1c-bd73-1230b7455b98'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '51939e47-073b-4189-a5cc-588773fa40be'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-20'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 陳卓賢 楊逸飛 影片補堂。陳俊鍇 葉熙桐網課'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '51939e47-073b-4189-a5cc-588773fa40be'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '745ddccd-f3cc-4f18-b409-5e62f513bfcd'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-20'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 陳卓賢 楊逸飛 影片補堂。陳俊鍇 葉熙桐網課'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '745ddccd-f3cc-4f18-b409-5e62f513bfcd'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-20'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 陳卓賢 楊逸飛 影片補堂。陳俊鍇 葉熙桐網課'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '32de9874-da52-43c8-8f13-c10a943c4618'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-20'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 陳卓賢 楊逸飛 影片補堂。陳俊鍇 葉熙桐網課'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '32de9874-da52-43c8-8f13-c10a943c4618'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid, 'd23852cd-3827-4365-853d-00e23e093e83'::uuid, '2025-09-20'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid
    AND a.class_id = 'd23852cd-3827-4365-853d-00e23e093e83'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, 'd23852cd-3827-4365-853d-00e23e093e83'::uuid, '2025-09-20'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid
    AND a.class_id = 'd23852cd-3827-4365-853d-00e23e093e83'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '24331c17-871b-4e56-96ca-ad72058fb371'::uuid, 'd23852cd-3827-4365-853d-00e23e093e83'::uuid, '2025-09-20'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '24331c17-871b-4e56-96ca-ad72058fb371'::uuid
    AND a.class_id = 'd23852cd-3827-4365-853d-00e23e093e83'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'f1c444db-4ae1-4cf1-89fe-bf5b316bf121'::uuid, '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid, '2025-09-20'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'f1c444db-4ae1-4cf1-89fe-bf5b316bf121'::uuid
    AND a.class_id = '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, 'a91bdded-21b2-49e5-9481-40938006062a'::uuid, '2025-09-21'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid
    AND a.class_id = 'a91bdded-21b2-49e5-9481-40938006062a'::uuid
    AND a.attendance_date = '2025-09-21'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ffa0780b-5590-4ace-899e-91f343d78a81'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '2025-09-21'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ffa0780b-5590-4ace-899e-91f343d78a81'::uuid
    AND a.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND a.attendance_date = '2025-09-21'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '373884c8-2e56-4019-a8e7-a9d292fa870b'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '2025-09-21'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '373884c8-2e56-4019-a8e7-a9d292fa870b'::uuid
    AND a.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND a.attendance_date = '2025-09-21'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '2025-09-21'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid
    AND a.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND a.attendance_date = '2025-09-21'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b9ec0998-36bc-4bc9-8b4b-6ad4e9000e98'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '2025-09-21'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b9ec0998-36bc-4bc9-8b4b-6ad4e9000e98'::uuid
    AND a.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND a.attendance_date = '2025-09-21'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6d169f47-d3cb-42e0-b4bf-ed8e77ee7b99'::uuid, '611974a7-8e91-494b-be09-3ceed9b14944'::uuid, '2025-09-21'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6d169f47-d3cb-42e0-b4bf-ed8e77ee7b99'::uuid
    AND a.class_id = '611974a7-8e91-494b-be09-3ceed9b14944'::uuid
    AND a.attendance_date = '2025-09-21'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid, '611974a7-8e91-494b-be09-3ceed9b14944'::uuid, '2025-09-21'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid
    AND a.class_id = '611974a7-8e91-494b-be09-3ceed9b14944'::uuid
    AND a.attendance_date = '2025-09-21'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b62fffd2-f2f9-4ce9-b9a8-e8e4b39c6304'::uuid, 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, '2025-09-21'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b62fffd2-f2f9-4ce9-b9a8-e8e4b39c6304'::uuid
    AND a.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND a.attendance_date = '2025-09-21'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid, 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, '2025-09-21'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid
    AND a.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND a.attendance_date = '2025-09-21'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid, 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, '2025-09-21'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid
    AND a.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND a.attendance_date = '2025-09-21'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '40bfa36c-585d-47cd-ba07-effbda547a51'::uuid, '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid, '2025-09-17'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 張朗志補堂'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '40bfa36c-585d-47cd-ba07-effbda547a51'::uuid
    AND a.class_id = '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid
    AND a.attendance_date = '2025-09-17'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid, '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid, '2025-09-17'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 張朗志補堂'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid
    AND a.class_id = '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid
    AND a.attendance_date = '2025-09-17'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '745ddccd-f3cc-4f18-b409-5e62f513bfcd'::uuid, '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid, '2025-09-17'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 張朗志補堂'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '745ddccd-f3cc-4f18-b409-5e62f513bfcd'::uuid
    AND a.class_id = '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid
    AND a.attendance_date = '2025-09-17'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid, '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid, '2025-09-17'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 張朗志補堂'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid
    AND a.class_id = '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid
    AND a.attendance_date = '2025-09-17'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '061dca0d-7523-405e-b10d-e4e2fc12b422'::uuid, '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid, '2025-09-17'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 張朗志補堂'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '061dca0d-7523-405e-b10d-e4e2fc12b422'::uuid
    AND a.class_id = '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid
    AND a.attendance_date = '2025-09-17'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '0ffa3f51-02b3-4bf8-a87e-f843b5bb038c'::uuid, '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid, '2025-09-17'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 張朗志補堂'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '0ffa3f51-02b3-4bf8-a87e-f843b5bb038c'::uuid
    AND a.class_id = '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid
    AND a.attendance_date = '2025-09-17'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid, '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid, '2025-09-17'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 張朗志補堂'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid
    AND a.class_id = '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid
    AND a.attendance_date = '2025-09-17'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, '2025-09-17'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 蔡汶軒請假'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid
    AND a.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND a.attendance_date = '2025-09-17'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '24331c17-871b-4e56-96ca-ad72058fb371'::uuid, '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, '2025-09-17'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 蔡汶軒請假'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '24331c17-871b-4e56-96ca-ad72058fb371'::uuid
    AND a.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND a.attendance_date = '2025-09-17'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '19145380-aeb2-44f6-a27e-e2f263c7b35f'::uuid, '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, '2025-09-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '19145380-aeb2-44f6-a27e-e2f263c7b35f'::uuid
    AND a.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND a.attendance_date = '2025-09-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '01529c73-438d-4040-9c40-944d0b0d1af0'::uuid, '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, '2025-09-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '01529c73-438d-4040-9c40-944d0b0d1af0'::uuid
    AND a.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND a.attendance_date = '2025-09-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '3ab0dc4c-7eab-474a-8cff-f4e6ea4bc0c2'::uuid, '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, '2025-09-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '3ab0dc4c-7eab-474a-8cff-f4e6ea4bc0c2'::uuid
    AND a.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND a.attendance_date = '2025-09-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '08a65222-0baf-47be-976d-73685070e38d'::uuid, '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, '2025-09-21'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '08a65222-0baf-47be-976d-73685070e38d'::uuid
    AND a.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND a.attendance_date = '2025-09-21'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5a0cdd32-30df-4acc-89ac-d954e07904c9'::uuid, '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, '2025-09-21'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5a0cdd32-30df-4acc-89ac-d954e07904c9'::uuid
    AND a.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND a.attendance_date = '2025-09-21'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid, '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, '2025-09-21'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid
    AND a.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND a.attendance_date = '2025-09-21'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid, 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid, '2025-09-21'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid
    AND a.class_id = 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid
    AND a.attendance_date = '2025-09-21'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '771f28d9-790f-46e1-a803-ae64a635d68b'::uuid, 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid, '2025-09-21'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '771f28d9-790f-46e1-a803-ae64a635d68b'::uuid
    AND a.class_id = 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid
    AND a.attendance_date = '2025-09-21'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid, '91f31145-3842-400b-8009-8d0e7086c536'::uuid, '2025-09-15'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid
    AND a.class_id = '91f31145-3842-400b-8009-8d0e7086c536'::uuid
    AND a.attendance_date = '2025-09-15'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'f1c444db-4ae1-4cf1-89fe-bf5b316bf121'::uuid, '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid, '2025-09-21'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'f1c444db-4ae1-4cf1-89fe-bf5b316bf121'::uuid
    AND a.class_id = '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid
    AND a.attendance_date = '2025-09-21'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'bd9c5612-0c8b-46c8-9fe3-1fb6f06b558b'::uuid, '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid, '2025-09-21'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'bd9c5612-0c8b-46c8-9fe3-1fb6f06b558b'::uuid
    AND a.class_id = '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid
    AND a.attendance_date = '2025-09-21'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fbb6b90a-2eda-4d65-84b7-f32c4c774c33'::uuid, '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid, '2025-09-20'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fbb6b90a-2eda-4d65-84b7-f32c4c774c33'::uuid
    AND a.class_id = '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b71f8795-7d99-4204-bd9c-791bf1395ffc'::uuid, '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid, '2025-09-20'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b71f8795-7d99-4204-bd9c-791bf1395ffc'::uuid
    AND a.class_id = '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'dd4893a5-f53a-4f0e-bdff-45353a7494dd'::uuid, '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid, '2025-09-20'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'dd4893a5-f53a-4f0e-bdff-45353a7494dd'::uuid
    AND a.class_id = '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '77d6c2c9-9a38-45e6-88c8-e7e744c6c5b9'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2025-09-20'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 周美君、陳梓慧請假，以影片補堂，已將影片傳予他們'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '77d6c2c9-9a38-45e6-88c8-e7e744c6c5b9'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a2655bb3-6f9c-4ef2-a885-c789669c4061'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2025-09-20'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 周美君、陳梓慧請假，以影片補堂，已將影片傳予他們'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a2655bb3-6f9c-4ef2-a885-c789669c4061'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '771f28d9-790f-46e1-a803-ae64a635d68b'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2025-09-20'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 周美君、陳梓慧請假，以影片補堂，已將影片傳予他們'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '771f28d9-790f-46e1-a803-ae64a635d68b'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'c9d95382-dc26-44eb-9439-689cd9856022'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2025-09-20'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 周美君、陳梓慧請假，以影片補堂，已將影片傳予他們'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'c9d95382-dc26-44eb-9439-689cd9856022'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6ad0329a-ad2d-4df1-b07a-b340ee9a5c23'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2025-09-20'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 周美君、陳梓慧請假，以影片補堂，已將影片傳予他們'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6ad0329a-ad2d-4df1-b07a-b340ee9a5c23'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2025-09-20'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 周美君、陳梓慧請假，以影片補堂，已將影片傳予他們'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5991bbd6-d744-46dd-a2db-30655bf3b150'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2025-09-20'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 周美君、陳梓慧請假，以影片補堂，已將影片傳予他們'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5991bbd6-d744-46dd-a2db-30655bf3b150'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2025-09-20'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 周美君、陳梓慧請假，以影片補堂，已將影片傳予他們'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2025-09-20'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 周美君、陳梓慧請假，以影片補堂，已將影片傳予他們'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2b18c20a-b985-4331-a232-eb31df0303ca'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2025-09-20'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 周美君、陳梓慧請假，以影片補堂，已將影片傳予他們'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2b18c20a-b985-4331-a232-eb31df0303ca'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2025-09-20'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'f1c444db-4ae1-4cf1-89fe-bf5b316bf121'::uuid, '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid, '2025-09-24'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'f1c444db-4ae1-4cf1-89fe-bf5b316bf121'::uuid
    AND a.class_id = '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid
    AND a.attendance_date = '2025-09-24'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '264e8911-ad63-49d9-a4b7-9356bd265ebd'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '2025-09-21'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '264e8911-ad63-49d9-a4b7-9356bd265ebd'::uuid
    AND a.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND a.attendance_date = '2025-09-21'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a5e577da-bf4f-4c97-aa15-e255a14374bf'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '2025-09-21'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a5e577da-bf4f-4c97-aa15-e255a14374bf'::uuid
    AND a.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND a.attendance_date = '2025-09-21'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '2025-09-21'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid
    AND a.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND a.attendance_date = '2025-09-21'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '2025-09-21'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid
    AND a.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND a.attendance_date = '2025-09-21'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '51939e47-073b-4189-a5cc-588773fa40be'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '2025-09-21'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '51939e47-073b-4189-a5cc-588773fa40be'::uuid
    AND a.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND a.attendance_date = '2025-09-21'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '610d001f-ea5c-416b-88bc-4239498ff49a'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '2025-09-21'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '610d001f-ea5c-416b-88bc-4239498ff49a'::uuid
    AND a.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND a.attendance_date = '2025-09-21'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '0ffa3f51-02b3-4bf8-a87e-f843b5bb038c'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '2025-09-21'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '0ffa3f51-02b3-4bf8-a87e-f843b5bb038c'::uuid
    AND a.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND a.attendance_date = '2025-09-21'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid, '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, '2025-09-22'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 陳藝菁請假'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid
    AND a.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND a.attendance_date = '2025-09-22'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid, '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, '2025-09-22'::date, '出席', '[2526出席CSV] 請堂或補堂紀錄（老師填寫）: 陳藝菁請假'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid
    AND a.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND a.attendance_date = '2025-09-22'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '9ff4db86-7b9e-463d-9127-51556940b038'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2025-09-24'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '9ff4db86-7b9e-463d-9127-51556940b038'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2025-09-24'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '93f8aab8-3eb4-43cb-aebb-d07764819b00'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2025-09-24'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '93f8aab8-3eb4-43cb-aebb-d07764819b00'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2025-09-24'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fbb27277-2d26-4d3f-9fd4-a8f0fa5cddee'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2025-09-24'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fbb27277-2d26-4d3f-9fd4-a8f0fa5cddee'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2025-09-24'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2025-09-24'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2025-09-24'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '597c7280-53c9-4327-a05d-843c89046796'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2025-09-24'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '597c7280-53c9-4327-a05d-843c89046796'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2025-09-24'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2025-09-24'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2025-09-24'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '0ffa3f51-02b3-4bf8-a87e-f843b5bb038c'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2025-09-24'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '0ffa3f51-02b3-4bf8-a87e-f843b5bb038c'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2025-09-24'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid, '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid, '2025-09-27'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid
    AND a.class_id = '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid
    AND a.attendance_date = '2025-09-27'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid, 'd23852cd-3827-4365-853d-00e23e093e83'::uuid, '2025-09-27'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid
    AND a.class_id = 'd23852cd-3827-4365-853d-00e23e093e83'::uuid
    AND a.attendance_date = '2025-09-27'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, 'd23852cd-3827-4365-853d-00e23e093e83'::uuid, '2025-09-27'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid
    AND a.class_id = 'd23852cd-3827-4365-853d-00e23e093e83'::uuid
    AND a.attendance_date = '2025-09-27'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '24331c17-871b-4e56-96ca-ad72058fb371'::uuid, 'd23852cd-3827-4365-853d-00e23e093e83'::uuid, '2025-09-27'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '24331c17-871b-4e56-96ca-ad72058fb371'::uuid
    AND a.class_id = 'd23852cd-3827-4365-853d-00e23e093e83'::uuid
    AND a.attendance_date = '2025-09-27'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'f1c444db-4ae1-4cf1-89fe-bf5b316bf121'::uuid, '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid, '2025-09-27'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'f1c444db-4ae1-4cf1-89fe-bf5b316bf121'::uuid
    AND a.class_id = '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid
    AND a.attendance_date = '2025-09-27'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-27'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-27'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b79bc930-9d2f-412b-8069-84b75d61ad09'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-27'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b79bc930-9d2f-412b-8069-84b75d61ad09'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-27'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-27'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-27'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fef46182-4c68-4560-9d3f-99b5abc8ae8e'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-27'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fef46182-4c68-4560-9d3f-99b5abc8ae8e'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-27'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'da86a454-fb29-4b1c-bd73-1230b7455b98'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-27'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'da86a454-fb29-4b1c-bd73-1230b7455b98'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-27'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '51939e47-073b-4189-a5cc-588773fa40be'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-27'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '51939e47-073b-4189-a5cc-588773fa40be'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-27'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '745ddccd-f3cc-4f18-b409-5e62f513bfcd'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-27'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '745ddccd-f3cc-4f18-b409-5e62f513bfcd'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-27'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-27'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-27'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '32de9874-da52-43c8-8f13-c10a943c4618'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-27'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '32de9874-da52-43c8-8f13-c10a943c4618'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-27'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '7ae2fc5c-ab2b-4dc5-80ad-328c43d53619'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2025-09-27'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '7ae2fc5c-ab2b-4dc5-80ad-328c43d53619'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2025-09-27'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2025-09-04'::date, '出席', '[2526出席CSV] 教學紀錄: assign identity notes up to p.14 hw: p.15-16'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2025-09-04'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6d169f47-d3cb-42e0-b4bf-ed8e77ee7b99'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2025-09-04'::date, '出席', '[2526出席CSV] 教學紀錄: assign identity notes up to p.14 hw: p.15-16'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6d169f47-d3cb-42e0-b4bf-ed8e77ee7b99'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2025-09-04'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '9ff4db86-7b9e-463d-9127-51556940b038'::uuid, '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, '2025-09-04'::date, '出席', '[2526出席CSV] 教學紀錄: complex no hard ws x兩份 hw: complex no. test LQ 1-7'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '9ff4db86-7b9e-463d-9127-51556940b038'::uuid
    AND a.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
    AND a.attendance_date = '2025-09-04'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a09da146-6195-4d68-a1f8-22a8202a1f3d'::uuid, '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, '2025-09-04'::date, '出席', '[2526出席CSV] 教學紀錄: complex no hard ws x兩份 hw: complex no. test LQ 1-7'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a09da146-6195-4d68-a1f8-22a8202a1f3d'::uuid
    AND a.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
    AND a.attendance_date = '2025-09-04'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '25c71966-a146-4aab-afa6-52dfeddf57fb'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '2025-09-05'::date, '出席', '[2526出席CSV] 教學紀錄: 學友社2016 P2 Q1-25'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '25c71966-a146-4aab-afa6-52dfeddf57fb'::uuid
    AND a.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
    AND a.attendance_date = '2025-09-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '2025-09-05'::date, '出席', '[2526出席CSV] 教學紀錄: 學友社2016 P2 Q1-25'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid
    AND a.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
    AND a.attendance_date = '2025-09-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '486dd132-f2b2-4c0e-b5e4-853e07434826'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '2025-09-05'::date, '出席', '[2526出席CSV] 教學紀錄: 學友社2016 P2 Q1-25'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '486dd132-f2b2-4c0e-b5e4-853e07434826'::uuid
    AND a.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
    AND a.attendance_date = '2025-09-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid, '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, '2025-09-05'::date, '出席', '[2526出席CSV] 教學紀錄: 曾穎Zoom Assign more about equation hw: p.9,18'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid
    AND a.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
    AND a.attendance_date = '2025-09-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fbb27277-2d26-4d3f-9fd4-a8f0fa5cddee'::uuid, '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, '2025-09-05'::date, '出席', '[2526出席CSV] 教學紀錄: 曾穎Zoom Assign more about equation hw: p.9,18'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fbb27277-2d26-4d3f-9fd4-a8f0fa5cddee'::uuid
    AND a.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
    AND a.attendance_date = '2025-09-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '93f8aab8-3eb4-43cb-aebb-d07764819b00'::uuid, '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, '2025-09-05'::date, '出席', '[2526出席CSV] 教學紀錄: 曾穎Zoom Assign more about equation hw: p.9,18'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '93f8aab8-3eb4-43cb-aebb-d07764819b00'::uuid
    AND a.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
    AND a.attendance_date = '2025-09-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid, '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, '2025-09-05'::date, '出席', '[2526出席CSV] 教學紀錄: 曾穎Zoom Assign more about equation hw: p.9,18'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid
    AND a.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
    AND a.attendance_date = '2025-09-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '2025-09-06'::date, '出席', '[2526出席CSV] 教學紀錄: 學友社2016 P2'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid
    AND a.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '2025-09-06'::date, '出席', '[2526出席CSV] 教學紀錄: 學友社2016 P2'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid
    AND a.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '40bfa36c-585d-47cd-ba07-effbda547a51'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '2025-09-06'::date, '出席', '[2526出席CSV] 教學紀錄: 學友社2016 P2'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '40bfa36c-585d-47cd-ba07-effbda547a51'::uuid
    AND a.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '2025-09-06'::date, '出席', '[2526出席CSV] 教學紀錄: Assign More About Equation hw p.18，21，22'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid
    AND a.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '2025-09-06'::date, '出席', '[2526出席CSV] 教學紀錄: Assign More About Equation hw p.18，21，22'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid
    AND a.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '24331c17-871b-4e56-96ca-ad72058fb371'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '2025-09-06'::date, '出席', '[2526出席CSV] 教學紀錄: Assign More About Equation hw p.18，21，22'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '24331c17-871b-4e56-96ca-ad72058fb371'::uuid
    AND a.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'c0cc0734-be3f-4c35-a4a4-9e94914bfea5'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '2025-09-06'::date, '出席', '[2526出席CSV] 教學紀錄: assign quadratic equation hw: p.7,9-10,12 | 請堂或補堂紀錄（老師填寫）: 李靖彤skip 吳晉銘調11/9'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'c0cc0734-be3f-4c35-a4a4-9e94914bfea5'::uuid
    AND a.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a84ea9f8-7c1d-4739-b347-058cee5a27e1'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '2025-09-06'::date, '出席', '[2526出席CSV] 教學紀錄: assign quadratic equation hw: p.7,9-10,12 | 請堂或補堂紀錄（老師填寫）: 李靖彤skip 吳晉銘調11/9'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a84ea9f8-7c1d-4739-b347-058cee5a27e1'::uuid
    AND a.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ffa0780b-5590-4ace-899e-91f343d78a81'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '2025-09-06'::date, '出席', '[2526出席CSV] 教學紀錄: assign quadratic equation hw: p.7,9-10,12 | 請堂或補堂紀錄（老師填寫）: 李靖彤skip 吳晉銘調11/9'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ffa0780b-5590-4ace-899e-91f343d78a81'::uuid
    AND a.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '2025-09-06'::date, '出席', '[2526出席CSV] 教學紀錄: assign quadratic equation hw: p.7,9-10,12 | 請堂或補堂紀錄（老師填寫）: 李靖彤skip 吳晉銘調11/9'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid
    AND a.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fef46182-4c68-4560-9d3f-99b5abc8ae8e'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '2025-09-06'::date, '出席', '[2526出席CSV] 教學紀錄: assign quadratic equation hw: p.7,9-10,12 | 請堂或補堂紀錄（老師填寫）: 李靖彤skip 吳晉銘調11/9'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fef46182-4c68-4560-9d3f-99b5abc8ae8e'::uuid
    AND a.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND a.attendance_date = '2025-09-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'e42d3ed1-6383-4856-9fd3-ad29e9084ed4'::uuid, '005e8d52-6109-522e-9478-2023cf91b100'::uuid, '2025-09-08'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'e42d3ed1-6383-4856-9fd3-ad29e9084ed4'::uuid
    AND a.class_id = '005e8d52-6109-522e-9478-2023cf91b100'::uuid
    AND a.attendance_date = '2025-09-08'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid, '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid, '2025-09-09'::date, '出席', '[2526出席CSV] 教學紀錄: finished inquality hw: chapter test1'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid
    AND a.class_id = '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid
    AND a.attendance_date = '2025-09-09'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid, '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid, '2025-09-09'::date, '出席', '[2526出席CSV] 教學紀錄: finished inquality hw: chapter test1'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid
    AND a.class_id = '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid
    AND a.attendance_date = '2025-09-09'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '854ea905-3880-4c43-a34d-e9a08b319a15'::uuid, '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid, '2025-09-09'::date, '出席', '[2526出席CSV] 教學紀錄: finished inquality hw: chapter test1'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '854ea905-3880-4c43-a34d-e9a08b319a15'::uuid
    AND a.class_id = '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid
    AND a.attendance_date = '2025-09-09'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2025-09-11'::date, '出席', '[2526出席CSV] 教學紀錄: Finished IDentity'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2025-09-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5787d58f-5d75-4c5b-b1c1-fb7f223d150f'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2025-09-11'::date, '出席', '[2526出席CSV] 教學紀錄: Finished IDentity'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5787d58f-5d75-4c5b-b1c1-fb7f223d150f'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2025-09-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'cb1e8d9c-f54d-4ae6-931c-200c3abfc6a6'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2025-09-11'::date, '出席', '[2526出席CSV] 教學紀錄: Finished IDentity'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'cb1e8d9c-f54d-4ae6-931c-200c3abfc6a6'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2025-09-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6d169f47-d3cb-42e0-b4bf-ed8e77ee7b99'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2025-09-11'::date, '出席', '[2526出席CSV] 教學紀錄: Finished IDentity'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6d169f47-d3cb-42e0-b4bf-ed8e77ee7b99'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2025-09-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '9ff4db86-7b9e-463d-9127-51556940b038'::uuid, '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, '2025-09-11'::date, '出席', '[2526出席CSV] 教學紀錄: assign quadratic equation up to p.18 hw: p.20-23 | 請堂或補堂紀錄（老師填寫）: 吳晉銘補6/9'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '9ff4db86-7b9e-463d-9127-51556940b038'::uuid
    AND a.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
    AND a.attendance_date = '2025-09-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a09da146-6195-4d68-a1f8-22a8202a1f3d'::uuid, '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, '2025-09-11'::date, '出席', '[2526出席CSV] 教學紀錄: assign quadratic equation up to p.18 hw: p.20-23 | 請堂或補堂紀錄（老師填寫）: 吳晉銘補6/9'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a09da146-6195-4d68-a1f8-22a8202a1f3d'::uuid
    AND a.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
    AND a.attendance_date = '2025-09-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6340373f-9c3e-42a3-85e2-672a73fd16ad'::uuid, '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, '2025-09-11'::date, '出席', '[2526出席CSV] 教學紀錄: assign quadratic equation up to p.18 hw: p.20-23 | 請堂或補堂紀錄（老師填寫）: 吳晉銘補6/9'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6340373f-9c3e-42a3-85e2-672a73fd16ad'::uuid
    AND a.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
    AND a.attendance_date = '2025-09-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd78cdee9-fc3f-4ffa-ab33-68861dc36143'::uuid, '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, '2025-09-11'::date, '出席', '[2526出席CSV] 教學紀錄: assign quadratic equation up to p.18 hw: p.20-23 | 請堂或補堂紀錄（老師填寫）: 吳晉銘補6/9'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd78cdee9-fc3f-4ffa-ab33-68861dc36143'::uuid
    AND a.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
    AND a.attendance_date = '2025-09-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b9ec0998-36bc-4bc9-8b4b-6ad4e9000e98'::uuid, '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, '2025-09-11'::date, '出席', '[2526出席CSV] 教學紀錄: assign quadratic equation up to p.18 hw: p.20-23 | 請堂或補堂紀錄（老師填寫）: 吳晉銘補6/9'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b9ec0998-36bc-4bc9-8b4b-6ad4e9000e98'::uuid
    AND a.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
    AND a.attendance_date = '2025-09-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '25c71966-a146-4aab-afa6-52dfeddf57fb'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '2025-09-12'::date, '出席', '[2526出席CSV] 教學紀錄: cont 學友社2016 P2 Q16-30'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '25c71966-a146-4aab-afa6-52dfeddf57fb'::uuid
    AND a.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
    AND a.attendance_date = '2025-09-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '2025-09-12'::date, '出席', '[2526出席CSV] 教學紀錄: cont 學友社2016 P2 Q16-30'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid
    AND a.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
    AND a.attendance_date = '2025-09-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '486dd132-f2b2-4c0e-b5e4-853e07434826'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '2025-09-12'::date, '出席', '[2526出席CSV] 教學紀錄: cont 學友社2016 P2 Q16-30'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '486dd132-f2b2-4c0e-b5e4-853e07434826'::uuid
    AND a.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
    AND a.attendance_date = '2025-09-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2d28dd37-b19d-41d8-b220-a13fdf37041d'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '2025-09-12'::date, '出席', '[2526出席CSV] 教學紀錄: cont 學友社2016 P2 Q16-30'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2d28dd37-b19d-41d8-b220-a13fdf37041d'::uuid
    AND a.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
    AND a.attendance_date = '2025-09-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid, '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, '2025-09-12'::date, '出席', '[2526出席CSV] 教學紀錄: cont more about equation hw:p.30-32 | 請堂或補堂紀錄（老師填寫）: 蘇子航video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid
    AND a.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
    AND a.attendance_date = '2025-09-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fbb27277-2d26-4d3f-9fd4-a8f0fa5cddee'::uuid, '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, '2025-09-12'::date, '出席', '[2526出席CSV] 教學紀錄: cont more about equation hw:p.30-32 | 請堂或補堂紀錄（老師填寫）: 蘇子航video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fbb27277-2d26-4d3f-9fd4-a8f0fa5cddee'::uuid
    AND a.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
    AND a.attendance_date = '2025-09-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '93f8aab8-3eb4-43cb-aebb-d07764819b00'::uuid, '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, '2025-09-12'::date, '出席', '[2526出席CSV] 教學紀錄: cont more about equation hw:p.30-32 | 請堂或補堂紀錄（老師填寫）: 蘇子航video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '93f8aab8-3eb4-43cb-aebb-d07764819b00'::uuid
    AND a.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
    AND a.attendance_date = '2025-09-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid, '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, '2025-09-12'::date, '出席', '[2526出席CSV] 教學紀錄: cont more about equation hw:p.30-32 | 請堂或補堂紀錄（老師填寫）: 蘇子航video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid
    AND a.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
    AND a.attendance_date = '2025-09-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '597c7280-53c9-4327-a05d-843c89046796'::uuid, '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, '2025-09-12'::date, '出席', '[2526出席CSV] 教學紀錄: cont more about equation hw:p.30-32 | 請堂或補堂紀錄（老師填寫）: 蘇子航video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '597c7280-53c9-4327-a05d-843c89046796'::uuid
    AND a.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
    AND a.attendance_date = '2025-09-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '2025-09-13'::date, '出席', '[2526出席CSV] 教學紀錄: cont 學友社2016 P2 約今天學生15/9 星期一 17:45-19:00補堂 對學友社2016 P2 assign 學友社 2017 P2'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid
    AND a.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '2025-09-13'::date, '出席', '[2526出席CSV] 教學紀錄: cont 學友社2016 P2 約今天學生15/9 星期一 17:45-19:00補堂 對學友社2016 P2 assign 學友社 2017 P2'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid
    AND a.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '40bfa36c-585d-47cd-ba07-effbda547a51'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '2025-09-13'::date, '出席', '[2526出席CSV] 教學紀錄: cont 學友社2016 P2 約今天學生15/9 星期一 17:45-19:00補堂 對學友社2016 P2 assign 學友社 2017 P2'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '40bfa36c-585d-47cd-ba07-effbda547a51'::uuid
    AND a.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '2025-09-13'::date, '出席', '[2526出席CSV] 教學紀錄: 約今天學生15/9 17:45-19:00補堂 cont more about equation'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid
    AND a.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '24331c17-871b-4e56-96ca-ad72058fb371'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '2025-09-13'::date, '出席', '[2526出席CSV] 教學紀錄: 約今天學生15/9 17:45-19:00補堂 cont more about equation'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '24331c17-871b-4e56-96ca-ad72058fb371'::uuid
    AND a.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '37650bf2-f0b2-4ae7-bf68-da963d4e5d1a'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '2025-09-13'::date, '出席', '[2526出席CSV] 教學紀錄: 約今天學生15/9 17:45-19:00補堂 cont more about equation'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '37650bf2-f0b2-4ae7-bf68-da963d4e5d1a'::uuid
    AND a.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '2025-09-13'::date, '出席', '[2526出席CSV] 教學紀錄: 約今天學生15/9 17:45-19:00補堂 cont more about equation'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid
    AND a.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '2025-09-13'::date, '出席', '[2526出席CSV] 教學紀錄: 約今天學生15/9 17:45-19:00補堂 cont more about equation'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid
    AND a.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND a.attendance_date = '2025-09-13'::date
);

COMMIT;