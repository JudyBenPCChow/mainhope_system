-- 2526 attendance import chunk
-- part 9/13, inserts 2401-2700 of 3680
BEGIN;

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ffa0780b-5590-4ace-899e-91f343d78a81'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '2026-01-24'::date, '出席', '[2526出席CSV] 教學紀錄: cont trigonometry finished | 請堂或補堂紀錄（老師填寫）: 關智博調22/1 吳晉銘補22/1'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ffa0780b-5590-4ace-899e-91f343d78a81'::uuid
    AND a.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND a.attendance_date = '2026-01-24'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '97f16885-242d-47f8-bc22-f80468c8fb70'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '2026-01-24'::date, '出席', '[2526出席CSV] 教學紀錄: cont trigonometry finished | 請堂或補堂紀錄（老師填寫）: 關智博調22/1 吳晉銘補22/1'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '97f16885-242d-47f8-bc22-f80468c8fb70'::uuid
    AND a.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND a.attendance_date = '2026-01-24'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '2026-01-24'::date, '出席', '[2526出席CSV] 教學紀錄: cont trigonometry finished | 請堂或補堂紀錄（老師填寫）: 關智博調22/1 吳晉銘補22/1'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid
    AND a.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND a.attendance_date = '2026-01-24'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd78cdee9-fc3f-4ffa-ab33-68861dc36143'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '2026-01-24'::date, '出席', '[2526出席CSV] 教學紀錄: cont trigonometry finished | 請堂或補堂紀錄（老師填寫）: 關智博調22/1 吳晉銘補22/1'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd78cdee9-fc3f-4ffa-ab33-68861dc36143'::uuid
    AND a.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND a.attendance_date = '2026-01-24'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '2026-01-24'::date, '出席', '[2526出席CSV] 教學紀錄: 對2025 P2 MCQ finished Assign 2025 P1 Q16, hw Q1-14'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid
    AND a.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
    AND a.attendance_date = '2026-01-24'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'f1934160-c64f-4e4d-be4e-c90a2027ad19'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '2026-01-24'::date, '出席', '[2526出席CSV] 教學紀錄: 對2025 P2 MCQ finished Assign 2025 P1 Q16, hw Q1-14'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'f1934160-c64f-4e4d-be4e-c90a2027ad19'::uuid
    AND a.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
    AND a.attendance_date = '2026-01-24'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '702b4bb3-159c-4835-92cf-be10ff810e50'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '2026-01-24'::date, '出席', '[2526出席CSV] 教學紀錄: 對2025 P2 MCQ finished Assign 2025 P1 Q16, hw Q1-14'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '702b4bb3-159c-4835-92cf-be10ff810e50'::uuid
    AND a.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
    AND a.attendance_date = '2026-01-24'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '15a85db9-eba7-4d60-9ed5-531dc68060d6'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '2026-01-24'::date, '出席', '[2526出席CSV] 教學紀錄: 對2025 P2 MCQ finished Assign 2025 P1 Q16, hw Q1-14'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '15a85db9-eba7-4d60-9ed5-531dc68060d6'::uuid
    AND a.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
    AND a.attendance_date = '2026-01-24'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ae885f95-aa43-4d19-883a-8cba99ae65b9'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '2026-01-24'::date, '出席', '[2526出席CSV] 教學紀錄: 對2025 P2 MCQ finished Assign 2025 P1 Q16, hw Q1-14'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ae885f95-aa43-4d19-883a-8cba99ae65b9'::uuid
    AND a.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
    AND a.attendance_date = '2026-01-24'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '805bda3f-ac9a-4acf-aca6-39f491c1b5c7'::uuid, 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid, '2026-01-24'::date, '出席', '[2526出席CSV] 教學紀錄: 對2025 P2 MCQ finished Assign 2025 P1 Q16, hw Q1-14'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '805bda3f-ac9a-4acf-aca6-39f491c1b5c7'::uuid
    AND a.class_id = 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid
    AND a.attendance_date = '2026-01-24'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '22fcad0f-8d89-48b1-abbd-9d0a52dc88ce'::uuid, 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid, '2026-01-18'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '22fcad0f-8d89-48b1-abbd-9d0a52dc88ce'::uuid
    AND a.class_id = 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid
    AND a.attendance_date = '2026-01-18'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'bd9c5612-0c8b-46c8-9fe3-1fb6f06b558b'::uuid, '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid, '2026-01-18'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'bd9c5612-0c8b-46c8-9fe3-1fb6f06b558b'::uuid
    AND a.class_id = '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid
    AND a.attendance_date = '2026-01-18'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '98b38abc-55c5-41cb-8815-5ece90f15645'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '2026-01-25'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '98b38abc-55c5-41cb-8815-5ece90f15645'::uuid
    AND a.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND a.attendance_date = '2026-01-25'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '617dd2b5-bbad-412a-a3bf-b6b17f7dbd41'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '2026-01-25'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '617dd2b5-bbad-412a-a3bf-b6b17f7dbd41'::uuid
    AND a.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND a.attendance_date = '2026-01-25'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6023b53d-82b5-4544-86ff-1297c8664616'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '2026-01-25'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6023b53d-82b5-4544-86ff-1297c8664616'::uuid
    AND a.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND a.attendance_date = '2026-01-25'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6b2b2711-4d57-4db6-90aa-334b4fa98f10'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '2026-01-25'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6b2b2711-4d57-4db6-90aa-334b4fa98f10'::uuid
    AND a.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND a.attendance_date = '2026-01-25'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid, '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid, '2026-01-25'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid
    AND a.class_id = '7c41cbba-adaf-413c-aa84-56273b269f28'::uuid
    AND a.attendance_date = '2026-01-25'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, 'a91bdded-21b2-49e5-9481-40938006062a'::uuid, '2026-01-25'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid
    AND a.class_id = 'a91bdded-21b2-49e5-9481-40938006062a'::uuid
    AND a.attendance_date = '2026-01-25'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '22fcad0f-8d89-48b1-abbd-9d0a52dc88ce'::uuid, 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid, '2026-01-25'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '22fcad0f-8d89-48b1-abbd-9d0a52dc88ce'::uuid
    AND a.class_id = 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid
    AND a.attendance_date = '2026-01-25'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'dd4893a5-f53a-4f0e-bdff-45353a7494dd'::uuid, '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, '2026-01-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'dd4893a5-f53a-4f0e-bdff-45353a7494dd'::uuid
    AND a.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND a.attendance_date = '2026-01-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'dd4893a5-f53a-4f0e-bdff-45353a7494dd'::uuid, '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, '2026-01-26'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'dd4893a5-f53a-4f0e-bdff-45353a7494dd'::uuid
    AND a.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND a.attendance_date = '2026-01-26'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6b2b2711-4d57-4db6-90aa-334b4fa98f10'::uuid, '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, '2026-01-26'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6b2b2711-4d57-4db6-90aa-334b4fa98f10'::uuid
    AND a.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND a.attendance_date = '2026-01-26'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid, '2026-01-25'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid
    AND a.class_id = '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid
    AND a.attendance_date = '2026-01-25'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '56a2d62d-efe0-4954-b6b1-0e5b739985c8'::uuid, '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid, '2026-01-25'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '56a2d62d-efe0-4954-b6b1-0e5b739985c8'::uuid
    AND a.class_id = '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid
    AND a.attendance_date = '2026-01-25'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd6d91a52-7b94-4e15-b91f-fabeb6916e65'::uuid, '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid, '2026-01-25'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd6d91a52-7b94-4e15-b91f-fabeb6916e65'::uuid
    AND a.class_id = '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid
    AND a.attendance_date = '2026-01-25'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd6d91a52-7b94-4e15-b91f-fabeb6916e65'::uuid, '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid, '2026-01-25'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd6d91a52-7b94-4e15-b91f-fabeb6916e65'::uuid
    AND a.class_id = '4afcd2a6-b089-4010-b02c-8d36924eaebb'::uuid
    AND a.attendance_date = '2026-01-25'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid, '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid, '2026-01-25'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid
    AND a.class_id = '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid
    AND a.attendance_date = '2026-01-25'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd9260dcb-e6b8-4dc7-a885-c72235135645'::uuid, '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid, '2026-01-25'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd9260dcb-e6b8-4dc7-a885-c72235135645'::uuid
    AND a.class_id = '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid
    AND a.attendance_date = '2026-01-25'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'f1934160-c64f-4e4d-be4e-c90a2027ad19'::uuid, '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid, '2026-01-25'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'f1934160-c64f-4e4d-be4e-c90a2027ad19'::uuid
    AND a.class_id = '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid
    AND a.attendance_date = '2026-01-25'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '08a65222-0baf-47be-976d-73685070e38d'::uuid, '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, '2026-01-25'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '08a65222-0baf-47be-976d-73685070e38d'::uuid
    AND a.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND a.attendance_date = '2026-01-25'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5a0cdd32-30df-4acc-89ac-d954e07904c9'::uuid, '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, '2026-01-25'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5a0cdd32-30df-4acc-89ac-d954e07904c9'::uuid
    AND a.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND a.attendance_date = '2026-01-25'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid, '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, '2026-01-25'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid
    AND a.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND a.attendance_date = '2026-01-25'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '51939e47-073b-4189-a5cc-588773fa40be'::uuid, '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, '2026-01-25'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '51939e47-073b-4189-a5cc-588773fa40be'::uuid
    AND a.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND a.attendance_date = '2026-01-25'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '771f28d9-790f-46e1-a803-ae64a635d68b'::uuid, 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid, '2026-01-25'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '771f28d9-790f-46e1-a803-ae64a635d68b'::uuid
    AND a.class_id = 'c01e4c64-a2c7-4b78-80d2-6383a4070ae9'::uuid
    AND a.attendance_date = '2026-01-25'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2026-01-28'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2026-01-28'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '0ffa3f51-02b3-4bf8-a87e-f843b5bb038c'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2026-01-28'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '0ffa3f51-02b3-4bf8-a87e-f843b5bb038c'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2026-01-28'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fef46182-4c68-4560-9d3f-99b5abc8ae8e'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2026-01-28'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fef46182-4c68-4560-9d3f-99b5abc8ae8e'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2026-01-28'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2026-01-28'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2026-01-28'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2026-01-24'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2026-01-24'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2026-01-24'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2026-01-24'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '51939e47-073b-4189-a5cc-588773fa40be'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2026-01-24'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '51939e47-073b-4189-a5cc-588773fa40be'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2026-01-24'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '745ddccd-f3cc-4f18-b409-5e62f513bfcd'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2026-01-24'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '745ddccd-f3cc-4f18-b409-5e62f513bfcd'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2026-01-24'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2026-01-24'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2026-01-24'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '32de9874-da52-43c8-8f13-c10a943c4618'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2026-01-24'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '32de9874-da52-43c8-8f13-c10a943c4618'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2026-01-24'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '7ae2fc5c-ab2b-4dc5-80ad-328c43d53619'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2026-01-24'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '7ae2fc5c-ab2b-4dc5-80ad-328c43d53619'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2026-01-24'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'f1934160-c64f-4e4d-be4e-c90a2027ad19'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2026-01-24'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'f1934160-c64f-4e4d-be4e-c90a2027ad19'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2026-01-24'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '90b1d98d-d7e7-4fab-ae37-ffbe64eb1eb1'::uuid, 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid, '2026-01-30'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '90b1d98d-d7e7-4fab-ae37-ffbe64eb1eb1'::uuid
    AND a.class_id = 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid
    AND a.attendance_date = '2026-01-30'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a67d1325-ab70-4a74-8aef-5a9d73ca9e12'::uuid, 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid, '2026-01-30'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a67d1325-ab70-4a74-8aef-5a9d73ca9e12'::uuid
    AND a.class_id = 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid
    AND a.attendance_date = '2026-01-30'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '19145380-aeb2-44f6-a27e-e2f263c7b35f'::uuid, '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, '2026-01-30'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '19145380-aeb2-44f6-a27e-e2f263c7b35f'::uuid
    AND a.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND a.attendance_date = '2026-01-30'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '01529c73-438d-4040-9c40-944d0b0d1af0'::uuid, '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, '2026-01-30'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '01529c73-438d-4040-9c40-944d0b0d1af0'::uuid
    AND a.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND a.attendance_date = '2026-01-30'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '37bd4518-13c0-47e0-8c45-30ac9f0a5507'::uuid, '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, '2026-01-30'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '37bd4518-13c0-47e0-8c45-30ac9f0a5507'::uuid
    AND a.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND a.attendance_date = '2026-01-30'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '3ab0dc4c-7eab-474a-8cff-f4e6ea4bc0c2'::uuid, '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, '2026-01-30'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '3ab0dc4c-7eab-474a-8cff-f4e6ea4bc0c2'::uuid
    AND a.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND a.attendance_date = '2026-01-30'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fc447e55-3829-4793-8a7a-51efaacb75c4'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2026-01-30'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fc447e55-3829-4793-8a7a-51efaacb75c4'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2026-01-30'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2026-01-30'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2026-01-30'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '486dd132-f2b2-4c0e-b5e4-853e07434826'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2026-01-30'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '486dd132-f2b2-4c0e-b5e4-853e07434826'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2026-01-30'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6340373f-9c3e-42a3-85e2-672a73fd16ad'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2026-01-30'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6340373f-9c3e-42a3-85e2-672a73fd16ad'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2026-01-30'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2026-01-30'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2026-01-30'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '77d6c2c9-9a38-45e6-88c8-e7e744c6c5b9'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '2026-01-30'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '77d6c2c9-9a38-45e6-88c8-e7e744c6c5b9'::uuid
    AND a.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
    AND a.attendance_date = '2026-01-30'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a2655bb3-6f9c-4ef2-a885-c789669c4061'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '2026-01-30'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a2655bb3-6f9c-4ef2-a885-c789669c4061'::uuid
    AND a.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
    AND a.attendance_date = '2026-01-30'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '7801ffd1-6991-4a37-9015-61d33320b215'::uuid, 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '7801ffd1-6991-4a37-9015-61d33320b215'::uuid
    AND a.class_id = 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid, '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid
    AND a.class_id = '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid, '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid
    AND a.class_id = '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6d169f47-d3cb-42e0-b4bf-ed8e77ee7b99'::uuid, '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6d169f47-d3cb-42e0-b4bf-ed8e77ee7b99'::uuid
    AND a.class_id = '21fae984-555b-4c0b-b63d-c7c067c18706'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '08a65222-0baf-47be-976d-73685070e38d'::uuid, '47ecae0c-df23-4449-bb25-f1835977d2a6'::uuid, '2026-01-31'::date, '出席', '[2526出席CSV] 教學紀錄: 2018, 2021'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '08a65222-0baf-47be-976d-73685070e38d'::uuid
    AND a.class_id = '47ecae0c-df23-4449-bb25-f1835977d2a6'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '32de9874-da52-43c8-8f13-c10a943c4618'::uuid, '47ecae0c-df23-4449-bb25-f1835977d2a6'::uuid, '2026-01-31'::date, '出席', '[2526出席CSV] 教學紀錄: 2018, 2021'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '32de9874-da52-43c8-8f13-c10a943c4618'::uuid
    AND a.class_id = '47ecae0c-df23-4449-bb25-f1835977d2a6'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd6d91a52-7b94-4e15-b91f-fabeb6916e65'::uuid, 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd6d91a52-7b94-4e15-b91f-fabeb6916e65'::uuid
    AND a.class_id = 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid, 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid
    AND a.class_id = 'd63b2d84-bc28-4406-8a98-a9872c67860f'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid, 'd23852cd-3827-4365-853d-00e23e093e83'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid
    AND a.class_id = 'd23852cd-3827-4365-853d-00e23e093e83'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, 'd23852cd-3827-4365-853d-00e23e093e83'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid
    AND a.class_id = 'd23852cd-3827-4365-853d-00e23e093e83'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '24331c17-871b-4e56-96ca-ad72058fb371'::uuid, 'd23852cd-3827-4365-853d-00e23e093e83'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '24331c17-871b-4e56-96ca-ad72058fb371'::uuid
    AND a.class_id = 'd23852cd-3827-4365-853d-00e23e093e83'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2026-01-29'::date, '出席', '[2526出席CSV] 教學紀錄: Cont Pyth thm finished + ws Video 提前錄影 | 請堂或補堂紀錄（老師填寫）: 梁展博video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2026-01-29'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5787d58f-5d75-4c5b-b1c1-fb7f223d150f'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2026-01-29'::date, '出席', '[2526出席CSV] 教學紀錄: Cont Pyth thm finished + ws Video 提前錄影 | 請堂或補堂紀錄（老師填寫）: 梁展博video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5787d58f-5d75-4c5b-b1c1-fb7f223d150f'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2026-01-29'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6d169f47-d3cb-42e0-b4bf-ed8e77ee7b99'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2026-01-29'::date, '出席', '[2526出席CSV] 教學紀錄: Cont Pyth thm finished + ws Video 提前錄影 | 請堂或補堂紀錄（老師填寫）: 梁展博video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6d169f47-d3cb-42e0-b4bf-ed8e77ee7b99'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2026-01-29'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '22fcad0f-8d89-48b1-abbd-9d0a52dc88ce'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2026-01-29'::date, '出席', '[2526出席CSV] 教學紀錄: Cont Pyth thm finished + ws Video 提前錄影 | 請堂或補堂紀錄（老師填寫）: 梁展博video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '22fcad0f-8d89-48b1-abbd-9d0a52dc88ce'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2026-01-29'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b71f8795-7d99-4204-bd9c-791bf1395ffc'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2026-01-29'::date, '出席', '[2526出席CSV] 教學紀錄: Cont Pyth thm finished + ws Video 提前錄影 | 請堂或補堂紀錄（老師填寫）: 梁展博video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b71f8795-7d99-4204-bd9c-791bf1395ffc'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2026-01-29'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '2026-01-30'::date, '出席', '[2526出席CSV] 教學紀錄: DSE P2 Q1-22 | 請堂或補堂紀錄（老師填寫）: 鐘永恆請假調27/1 李澄欣、李映進Zoom 陳宣穎Video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid
    AND a.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
    AND a.attendance_date = '2026-01-30'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '486dd132-f2b2-4c0e-b5e4-853e07434826'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '2026-01-30'::date, '出席', '[2526出席CSV] 教學紀錄: DSE P2 Q1-22 | 請堂或補堂紀錄（老師填寫）: 鐘永恆請假調27/1 李澄欣、李映進Zoom 陳宣穎Video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '486dd132-f2b2-4c0e-b5e4-853e07434826'::uuid
    AND a.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
    AND a.attendance_date = '2026-01-30'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '0ffa3f51-02b3-4bf8-a87e-f843b5bb038c'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '2026-01-30'::date, '出席', '[2526出席CSV] 教學紀錄: DSE P2 Q1-22 | 請堂或補堂紀錄（老師填寫）: 鐘永恆請假調27/1 李澄欣、李映進Zoom 陳宣穎Video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '0ffa3f51-02b3-4bf8-a87e-f843b5bb038c'::uuid
    AND a.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
    AND a.attendance_date = '2026-01-30'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a72586a0-ab9c-477b-b9c5-7231f1a23909'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '2026-01-30'::date, '出席', '[2526出席CSV] 教學紀錄: DSE P2 Q1-22 | 請堂或補堂紀錄（老師填寫）: 鐘永恆請假調27/1 李澄欣、李映進Zoom 陳宣穎Video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a72586a0-ab9c-477b-b9c5-7231f1a23909'::uuid
    AND a.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
    AND a.attendance_date = '2026-01-30'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '2026-01-30'::date, '出席', '[2526出席CSV] 教學紀錄: DSE P2 Q1-22 | 請堂或補堂紀錄（老師填寫）: 鐘永恆請假調27/1 李澄欣、李映進Zoom 陳宣穎Video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid
    AND a.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
    AND a.attendance_date = '2026-01-30'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2d28dd37-b19d-41d8-b220-a13fdf37041d'::uuid, 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid, '2026-01-31'::date, '出席', '[2526出席CSV] 教學紀錄: cont 2025 P2 MCQ Q7-25,then skip assign 2025 P1 Q1-8 | 請堂或補堂紀錄（老師填寫）: 補24/1'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2d28dd37-b19d-41d8-b220-a13fdf37041d'::uuid
    AND a.class_id = 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2d28dd37-b19d-41d8-b220-a13fdf37041d'::uuid, '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid, '2026-01-31'::date, '出席', '[2526出席CSV] 教學紀錄: cont 2025 P2 MCQ Q7-25,then skip assign 2025 P1 Q1-8'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2d28dd37-b19d-41d8-b220-a13fdf37041d'::uuid
    AND a.class_id = '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fbb6b90a-2eda-4d65-84b7-f32c4c774c33'::uuid, '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fbb6b90a-2eda-4d65-84b7-f32c4c774c33'::uuid
    AND a.class_id = '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b71f8795-7d99-4204-bd9c-791bf1395ffc'::uuid, '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b71f8795-7d99-4204-bd9c-791bf1395ffc'::uuid
    AND a.class_id = '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'dd4893a5-f53a-4f0e-bdff-45353a7494dd'::uuid, '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'dd4893a5-f53a-4f0e-bdff-45353a7494dd'::uuid
    AND a.class_id = '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fee10737-293b-4abc-b861-cf90c12f49e9'::uuid, '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fee10737-293b-4abc-b861-cf90c12f49e9'::uuid
    AND a.class_id = '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '771f28d9-790f-46e1-a803-ae64a635d68b'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '771f28d9-790f-46e1-a803-ae64a635d68b'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'c9d95382-dc26-44eb-9439-689cd9856022'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'c9d95382-dc26-44eb-9439-689cd9856022'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5991bbd6-d744-46dd-a2db-30655bf3b150'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5991bbd6-d744-46dd-a2db-30655bf3b150'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '51939e47-073b-4189-a5cc-588773fa40be'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '51939e47-073b-4189-a5cc-588773fa40be'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '745ddccd-f3cc-4f18-b409-5e62f513bfcd'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '745ddccd-f3cc-4f18-b409-5e62f513bfcd'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '32de9874-da52-43c8-8f13-c10a943c4618'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '32de9874-da52-43c8-8f13-c10a943c4618'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '7ae2fc5c-ab2b-4dc5-80ad-328c43d53619'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '7ae2fc5c-ab2b-4dc5-80ad-328c43d53619'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'f1934160-c64f-4e4d-be4e-c90a2027ad19'::uuid, '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'f1934160-c64f-4e4d-be4e-c90a2027ad19'::uuid
    AND a.class_id = '7098aa29-3066-4b46-82a8-b9d38ff2d4b3'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '98b38abc-55c5-41cb-8815-5ece90f15645'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '2026-02-01'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '98b38abc-55c5-41cb-8815-5ece90f15645'::uuid
    AND a.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND a.attendance_date = '2026-02-01'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '617dd2b5-bbad-412a-a3bf-b6b17f7dbd41'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '2026-02-01'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '617dd2b5-bbad-412a-a3bf-b6b17f7dbd41'::uuid
    AND a.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND a.attendance_date = '2026-02-01'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6023b53d-82b5-4544-86ff-1297c8664616'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '2026-02-01'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6023b53d-82b5-4544-86ff-1297c8664616'::uuid
    AND a.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND a.attendance_date = '2026-02-01'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6b2b2711-4d57-4db6-90aa-334b4fa98f10'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '2026-02-01'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6b2b2711-4d57-4db6-90aa-334b4fa98f10'::uuid
    AND a.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND a.attendance_date = '2026-02-01'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'bd9c5612-0c8b-46c8-9fe3-1fb6f06b558b'::uuid, '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid, '2026-01-25'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'bd9c5612-0c8b-46c8-9fe3-1fb6f06b558b'::uuid
    AND a.class_id = '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid
    AND a.attendance_date = '2026-01-25'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, 'a91bdded-21b2-49e5-9481-40938006062a'::uuid, '2026-02-01'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid
    AND a.class_id = 'a91bdded-21b2-49e5-9481-40938006062a'::uuid
    AND a.attendance_date = '2026-02-01'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid, '611974a7-8e91-494b-be09-3ceed9b14944'::uuid, '2026-02-01'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid
    AND a.class_id = '611974a7-8e91-494b-be09-3ceed9b14944'::uuid
    AND a.attendance_date = '2026-02-01'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd8423166-450c-4632-a18f-1da678532886'::uuid, '611974a7-8e91-494b-be09-3ceed9b14944'::uuid, '2026-02-01'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd8423166-450c-4632-a18f-1da678532886'::uuid
    AND a.class_id = '611974a7-8e91-494b-be09-3ceed9b14944'::uuid
    AND a.attendance_date = '2026-02-01'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, '2026-01-28'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid
    AND a.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND a.attendance_date = '2026-01-28'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '24331c17-871b-4e56-96ca-ad72058fb371'::uuid, '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, '2026-01-28'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '24331c17-871b-4e56-96ca-ad72058fb371'::uuid
    AND a.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND a.attendance_date = '2026-01-28'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '495c1b7f-a4bf-42a3-a9ba-92c70d4202ea'::uuid, '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, '2026-01-28'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '495c1b7f-a4bf-42a3-a9ba-92c70d4202ea'::uuid
    AND a.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND a.attendance_date = '2026-01-28'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a84ea9f8-7c1d-4739-b347-058cee5a27e1'::uuid, '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, '2026-01-28'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a84ea9f8-7c1d-4739-b347-058cee5a27e1'::uuid
    AND a.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND a.attendance_date = '2026-01-28'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid, '611974a7-8e91-494b-be09-3ceed9b14944'::uuid, '2026-01-25'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid
    AND a.class_id = '611974a7-8e91-494b-be09-3ceed9b14944'::uuid
    AND a.attendance_date = '2026-01-25'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd8423166-450c-4632-a18f-1da678532886'::uuid, '611974a7-8e91-494b-be09-3ceed9b14944'::uuid, '2026-01-25'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd8423166-450c-4632-a18f-1da678532886'::uuid
    AND a.class_id = '611974a7-8e91-494b-be09-3ceed9b14944'::uuid
    AND a.attendance_date = '2026-01-25'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid, '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, '2026-01-26'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid
    AND a.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND a.attendance_date = '2026-01-26'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid, '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, '2026-01-26'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid
    AND a.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND a.attendance_date = '2026-01-26'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd8423166-450c-4632-a18f-1da678532886'::uuid, '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, '2026-01-26'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd8423166-450c-4632-a18f-1da678532886'::uuid
    AND a.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND a.attendance_date = '2026-01-26'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid, '611974a7-8e91-494b-be09-3ceed9b14944'::uuid, '2026-01-18'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid
    AND a.class_id = '611974a7-8e91-494b-be09-3ceed9b14944'::uuid
    AND a.attendance_date = '2026-01-18'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd8423166-450c-4632-a18f-1da678532886'::uuid, '611974a7-8e91-494b-be09-3ceed9b14944'::uuid, '2026-01-18'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd8423166-450c-4632-a18f-1da678532886'::uuid
    AND a.class_id = '611974a7-8e91-494b-be09-3ceed9b14944'::uuid
    AND a.attendance_date = '2026-01-18'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid, '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, '2026-01-05'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid
    AND a.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND a.attendance_date = '2026-01-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid, '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, '2026-01-05'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid
    AND a.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND a.attendance_date = '2026-01-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd8423166-450c-4632-a18f-1da678532886'::uuid, '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, '2026-01-05'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd8423166-450c-4632-a18f-1da678532886'::uuid
    AND a.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND a.attendance_date = '2026-01-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid, '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, '2026-01-12'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid
    AND a.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND a.attendance_date = '2026-01-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid, '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, '2026-01-12'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid
    AND a.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND a.attendance_date = '2026-01-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd8423166-450c-4632-a18f-1da678532886'::uuid, '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, '2026-01-12'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd8423166-450c-4632-a18f-1da678532886'::uuid
    AND a.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND a.attendance_date = '2026-01-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ffa0780b-5590-4ace-899e-91f343d78a81'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '2026-01-04'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ffa0780b-5590-4ace-899e-91f343d78a81'::uuid
    AND a.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND a.attendance_date = '2026-01-04'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '373884c8-2e56-4019-a8e7-a9d292fa870b'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '2026-01-04'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '373884c8-2e56-4019-a8e7-a9d292fa870b'::uuid
    AND a.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND a.attendance_date = '2026-01-04'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '2026-01-04'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid
    AND a.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND a.attendance_date = '2026-01-04'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a84ea9f8-7c1d-4739-b347-058cee5a27e1'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '2026-01-04'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a84ea9f8-7c1d-4739-b347-058cee5a27e1'::uuid
    AND a.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND a.attendance_date = '2026-01-04'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b9ec0998-36bc-4bc9-8b4b-6ad4e9000e98'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '2026-01-04'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b9ec0998-36bc-4bc9-8b4b-6ad4e9000e98'::uuid
    AND a.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND a.attendance_date = '2026-01-04'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid, '611974a7-8e91-494b-be09-3ceed9b14944'::uuid, '2026-01-04'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid
    AND a.class_id = '611974a7-8e91-494b-be09-3ceed9b14944'::uuid
    AND a.attendance_date = '2026-01-04'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd8423166-450c-4632-a18f-1da678532886'::uuid, '611974a7-8e91-494b-be09-3ceed9b14944'::uuid, '2026-01-04'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd8423166-450c-4632-a18f-1da678532886'::uuid
    AND a.class_id = '611974a7-8e91-494b-be09-3ceed9b14944'::uuid
    AND a.attendance_date = '2026-01-04'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b62fffd2-f2f9-4ce9-b9a8-e8e4b39c6304'::uuid, 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, '2026-01-04'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b62fffd2-f2f9-4ce9-b9a8-e8e4b39c6304'::uuid
    AND a.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND a.attendance_date = '2026-01-04'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid, 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, '2026-01-04'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid
    AND a.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND a.attendance_date = '2026-01-04'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid, 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, '2026-01-04'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid
    AND a.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND a.attendance_date = '2026-01-04'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, '2026-01-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid
    AND a.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND a.attendance_date = '2026-01-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '24331c17-871b-4e56-96ca-ad72058fb371'::uuid, '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, '2026-01-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '24331c17-871b-4e56-96ca-ad72058fb371'::uuid
    AND a.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND a.attendance_date = '2026-01-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '495c1b7f-a4bf-42a3-a9ba-92c70d4202ea'::uuid, '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, '2026-01-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '495c1b7f-a4bf-42a3-a9ba-92c70d4202ea'::uuid
    AND a.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND a.attendance_date = '2026-01-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid, '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid, '2026-01-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid
    AND a.class_id = '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid
    AND a.attendance_date = '2026-01-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '745ddccd-f3cc-4f18-b409-5e62f513bfcd'::uuid, '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid, '2026-01-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '745ddccd-f3cc-4f18-b409-5e62f513bfcd'::uuid
    AND a.class_id = '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid
    AND a.attendance_date = '2026-01-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '061dca0d-7523-405e-b10d-e4e2fc12b422'::uuid, '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid, '2026-01-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '061dca0d-7523-405e-b10d-e4e2fc12b422'::uuid
    AND a.class_id = '752b1482-8ad9-4472-8a17-5aca10c45e32'::uuid
    AND a.attendance_date = '2026-01-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ffa0780b-5590-4ace-899e-91f343d78a81'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '2026-01-11'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ffa0780b-5590-4ace-899e-91f343d78a81'::uuid
    AND a.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND a.attendance_date = '2026-01-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '373884c8-2e56-4019-a8e7-a9d292fa870b'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '2026-01-11'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '373884c8-2e56-4019-a8e7-a9d292fa870b'::uuid
    AND a.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND a.attendance_date = '2026-01-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '2026-01-11'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid
    AND a.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND a.attendance_date = '2026-01-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a84ea9f8-7c1d-4739-b347-058cee5a27e1'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '2026-01-11'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a84ea9f8-7c1d-4739-b347-058cee5a27e1'::uuid
    AND a.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND a.attendance_date = '2026-01-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b9ec0998-36bc-4bc9-8b4b-6ad4e9000e98'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '2026-01-11'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b9ec0998-36bc-4bc9-8b4b-6ad4e9000e98'::uuid
    AND a.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND a.attendance_date = '2026-01-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid, '611974a7-8e91-494b-be09-3ceed9b14944'::uuid, '2026-01-11'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2ca7a777-d7cd-404d-b200-5d4e9d389123'::uuid
    AND a.class_id = '611974a7-8e91-494b-be09-3ceed9b14944'::uuid
    AND a.attendance_date = '2026-01-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd8423166-450c-4632-a18f-1da678532886'::uuid, '611974a7-8e91-494b-be09-3ceed9b14944'::uuid, '2026-01-11'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd8423166-450c-4632-a18f-1da678532886'::uuid
    AND a.class_id = '611974a7-8e91-494b-be09-3ceed9b14944'::uuid
    AND a.attendance_date = '2026-01-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b62fffd2-f2f9-4ce9-b9a8-e8e4b39c6304'::uuid, 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, '2026-01-11'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b62fffd2-f2f9-4ce9-b9a8-e8e4b39c6304'::uuid
    AND a.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND a.attendance_date = '2026-01-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid, 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, '2026-01-11'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid
    AND a.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND a.attendance_date = '2026-01-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid, 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, '2026-01-11'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid
    AND a.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND a.attendance_date = '2026-01-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '264e8911-ad63-49d9-a4b7-9356bd265ebd'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '2026-01-11'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '264e8911-ad63-49d9-a4b7-9356bd265ebd'::uuid
    AND a.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND a.attendance_date = '2026-01-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a5e577da-bf4f-4c97-aa15-e255a14374bf'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '2026-01-11'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a5e577da-bf4f-4c97-aa15-e255a14374bf'::uuid
    AND a.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND a.attendance_date = '2026-01-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '2026-01-11'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid
    AND a.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND a.attendance_date = '2026-01-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '2026-01-11'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid
    AND a.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND a.attendance_date = '2026-01-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '0ffa3f51-02b3-4bf8-a87e-f843b5bb038c'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '2026-01-11'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '0ffa3f51-02b3-4bf8-a87e-f843b5bb038c'::uuid
    AND a.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND a.attendance_date = '2026-01-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a72586a0-ab9c-477b-b9c5-7231f1a23909'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '2026-01-11'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a72586a0-ab9c-477b-b9c5-7231f1a23909'::uuid
    AND a.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND a.attendance_date = '2026-01-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd73ff8ba-fa6a-4cb0-b977-770cc04d87f4'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '2026-01-11'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd73ff8ba-fa6a-4cb0-b977-770cc04d87f4'::uuid
    AND a.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND a.attendance_date = '2026-01-11'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, '2026-01-14'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid
    AND a.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND a.attendance_date = '2026-01-14'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '24331c17-871b-4e56-96ca-ad72058fb371'::uuid, '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, '2026-01-14'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '24331c17-871b-4e56-96ca-ad72058fb371'::uuid
    AND a.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND a.attendance_date = '2026-01-14'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '495c1b7f-a4bf-42a3-a9ba-92c70d4202ea'::uuid, '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, '2026-01-14'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '495c1b7f-a4bf-42a3-a9ba-92c70d4202ea'::uuid
    AND a.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND a.attendance_date = '2026-01-14'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid, '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, '2026-01-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid
    AND a.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND a.attendance_date = '2026-01-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid, '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, '2026-01-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid
    AND a.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND a.attendance_date = '2026-01-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd8423166-450c-4632-a18f-1da678532886'::uuid, '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid, '2026-01-19'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd8423166-450c-4632-a18f-1da678532886'::uuid
    AND a.class_id = '81ef9480-cd8f-4d76-9745-7f4b9a04eaf6'::uuid
    AND a.attendance_date = '2026-01-19'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, '2026-01-21'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid
    AND a.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND a.attendance_date = '2026-01-21'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '24331c17-871b-4e56-96ca-ad72058fb371'::uuid, '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, '2026-01-21'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '24331c17-871b-4e56-96ca-ad72058fb371'::uuid
    AND a.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND a.attendance_date = '2026-01-21'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '495c1b7f-a4bf-42a3-a9ba-92c70d4202ea'::uuid, '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid, '2026-01-21'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '495c1b7f-a4bf-42a3-a9ba-92c70d4202ea'::uuid
    AND a.class_id = '3b001d4f-eddd-45be-a0c3-1a5dcc3bd54b'::uuid
    AND a.attendance_date = '2026-01-21'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b62fffd2-f2f9-4ce9-b9a8-e8e4b39c6304'::uuid, 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, '2026-01-25'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b62fffd2-f2f9-4ce9-b9a8-e8e4b39c6304'::uuid
    AND a.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND a.attendance_date = '2026-01-25'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid, 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, '2026-01-25'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid
    AND a.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND a.attendance_date = '2026-01-25'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid, 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid, '2026-01-25'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid
    AND a.class_id = 'ae56364b-fcea-4946-842c-9cc372a1291e'::uuid
    AND a.attendance_date = '2026-01-25'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ffa0780b-5590-4ace-899e-91f343d78a81'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '2026-02-01'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ffa0780b-5590-4ace-899e-91f343d78a81'::uuid
    AND a.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND a.attendance_date = '2026-02-01'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b9ec0998-36bc-4bc9-8b4b-6ad4e9000e98'::uuid, '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid, '2026-02-01'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b9ec0998-36bc-4bc9-8b4b-6ad4e9000e98'::uuid
    AND a.class_id = '8f980f3a-19ae-4f3a-800d-fc1867780729'::uuid
    AND a.attendance_date = '2026-02-01'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '8d0c77a0-b0cf-4903-9d4e-560ae3502250'::uuid, '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '8d0c77a0-b0cf-4903-9d4e-560ae3502250'::uuid
    AND a.class_id = '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '0bf2b340-46d8-4272-90e1-48a098d220f9'::uuid, '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '0bf2b340-46d8-4272-90e1-48a098d220f9'::uuid
    AND a.class_id = '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd985e2e0-e140-49cf-9070-5d5f22145ef9'::uuid, 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid, '2026-01-31'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd985e2e0-e140-49cf-9070-5d5f22145ef9'::uuid
    AND a.class_id = 'c91ce175-d827-595f-90c3-6196ded6c598'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '08a65222-0baf-47be-976d-73685070e38d'::uuid, '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, '2026-02-01'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '08a65222-0baf-47be-976d-73685070e38d'::uuid
    AND a.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND a.attendance_date = '2026-02-01'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5a0cdd32-30df-4acc-89ac-d954e07904c9'::uuid, '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, '2026-02-01'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5a0cdd32-30df-4acc-89ac-d954e07904c9'::uuid
    AND a.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND a.attendance_date = '2026-02-01'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid, '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, '2026-02-01'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid
    AND a.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND a.attendance_date = '2026-02-01'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '51939e47-073b-4189-a5cc-588773fa40be'::uuid, '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid, '2026-02-01'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '51939e47-073b-4189-a5cc-588773fa40be'::uuid
    AND a.class_id = '8d9dd312-aa7a-43b7-b271-d54b93cf9d57'::uuid
    AND a.attendance_date = '2026-02-01'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid, '2026-02-01'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid
    AND a.class_id = '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid
    AND a.attendance_date = '2026-02-01'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '56a2d62d-efe0-4954-b6b1-0e5b739985c8'::uuid, '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid, '2026-02-01'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '56a2d62d-efe0-4954-b6b1-0e5b739985c8'::uuid
    AND a.class_id = '9199979e-71c1-4bee-beb4-2ce47fe86573'::uuid
    AND a.attendance_date = '2026-02-01'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd6d91a52-7b94-4e15-b91f-fabeb6916e65'::uuid, '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid, '2026-02-01'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd6d91a52-7b94-4e15-b91f-fabeb6916e65'::uuid
    AND a.class_id = '8ea2a79b-fe9d-40eb-9342-5bb7ac700123'::uuid
    AND a.attendance_date = '2026-02-01'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd9260dcb-e6b8-4dc7-a885-c72235135645'::uuid, '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid, '2026-02-01'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd9260dcb-e6b8-4dc7-a885-c72235135645'::uuid
    AND a.class_id = '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid
    AND a.attendance_date = '2026-02-01'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'f1934160-c64f-4e4d-be4e-c90a2027ad19'::uuid, '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid, '2026-02-01'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'f1934160-c64f-4e4d-be4e-c90a2027ad19'::uuid
    AND a.class_id = '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid
    AND a.attendance_date = '2026-02-01'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'f1c444db-4ae1-4cf1-89fe-bf5b316bf121'::uuid, '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid, '2026-02-01'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'f1c444db-4ae1-4cf1-89fe-bf5b316bf121'::uuid
    AND a.class_id = '5c0ef4f3-df66-469f-b2c6-3a7abe11b1e3'::uuid
    AND a.attendance_date = '2026-02-01'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '22fcad0f-8d89-48b1-abbd-9d0a52dc88ce'::uuid, 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid, '2026-02-01'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '22fcad0f-8d89-48b1-abbd-9d0a52dc88ce'::uuid
    AND a.class_id = 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid
    AND a.attendance_date = '2026-02-01'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '495c1b7f-a4bf-42a3-a9ba-92c70d4202ea'::uuid, 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid, '2026-02-01'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '495c1b7f-a4bf-42a3-a9ba-92c70d4202ea'::uuid
    AND a.class_id = 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid
    AND a.attendance_date = '2026-02-01'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '2026-01-31'::date, '出席', '[2526出席CSV] 教學紀錄: finished Dispersion 葉熙桐Video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid
    AND a.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '2026-01-31'::date, '出席', '[2526出席CSV] 教學紀錄: finished Dispersion 葉熙桐Video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid
    AND a.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '24331c17-871b-4e56-96ca-ad72058fb371'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '2026-01-31'::date, '出席', '[2526出席CSV] 教學紀錄: finished Dispersion 葉熙桐Video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '24331c17-871b-4e56-96ca-ad72058fb371'::uuid
    AND a.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '2026-01-31'::date, '出席', '[2526出席CSV] 教學紀錄: finished Dispersion 葉熙桐Video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid
    AND a.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'da86a454-fb29-4b1c-bd73-1230b7455b98'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '2026-01-31'::date, '出席', '[2526出席CSV] 教學紀錄: finished Dispersion 葉熙桐Video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'da86a454-fb29-4b1c-bd73-1230b7455b98'::uuid
    AND a.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b048d92b-aa05-487c-b0be-545ef6745e2d'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '2026-01-31'::date, '出席', '[2526出席CSV] 教學紀錄: finished Dispersion 葉熙桐Video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b048d92b-aa05-487c-b0be-545ef6745e2d'::uuid
    AND a.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '3636de02-c540-483c-a724-0341ef029f44'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '2026-01-31'::date, '出席', '[2526出席CSV] 教學紀錄: finished Dispersion 葉熙桐Video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '3636de02-c540-483c-a724-0341ef029f44'::uuid
    AND a.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid, '280fb7c0-345c-422a-90ca-26489c918974'::uuid, '2026-01-31'::date, '出席', '[2526出席CSV] 教學紀錄: finished Dispersion 葉熙桐Video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid
    AND a.class_id = '280fb7c0-345c-422a-90ca-26489c918974'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd78cdee9-fc3f-4ffa-ab33-68861dc36143'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '2026-01-31'::date, '出席', '[2526出席CSV] 教學紀錄: assign expo | 請堂或補堂紀錄（老師填寫）: 梁天因調29/1 李靖彤調5/2補堂 范以喬順延 李承峰Video 邱浩傑skip 吳晉銘/陳偉傑video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd78cdee9-fc3f-4ffa-ab33-68861dc36143'::uuid
    AND a.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a09da146-6195-4d68-a1f8-22a8202a1f3d'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '2026-01-31'::date, '出席', '[2526出席CSV] 教學紀錄: assign expo | 請堂或補堂紀錄（老師填寫）: 梁天因調29/1 李靖彤調5/2補堂 范以喬順延 李承峰Video 邱浩傑skip 吳晉銘/陳偉傑video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a09da146-6195-4d68-a1f8-22a8202a1f3d'::uuid
    AND a.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6340373f-9c3e-42a3-85e2-672a73fd16ad'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '2026-01-31'::date, '出席', '[2526出席CSV] 教學紀錄: assign expo | 請堂或補堂紀錄（老師填寫）: 梁天因調29/1 李靖彤調5/2補堂 范以喬順延 李承峰Video 邱浩傑skip 吳晉銘/陳偉傑video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6340373f-9c3e-42a3-85e2-672a73fd16ad'::uuid
    AND a.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b9ec0998-36bc-4bc9-8b4b-6ad4e9000e98'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '2026-01-31'::date, '出席', '[2526出席CSV] 教學紀錄: assign expo | 請堂或補堂紀錄（老師填寫）: 梁天因調29/1 李靖彤調5/2補堂 范以喬順延 李承峰Video 邱浩傑skip 吳晉銘/陳偉傑video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b9ec0998-36bc-4bc9-8b4b-6ad4e9000e98'::uuid
    AND a.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'f1934160-c64f-4e4d-be4e-c90a2027ad19'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '2026-01-31'::date, '出席', '[2526出席CSV] 教學紀錄: 對Q1-14 2025 DSE P1 | 請堂或補堂紀錄（老師填寫）: Leo Video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'f1934160-c64f-4e4d-be4e-c90a2027ad19'::uuid
    AND a.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '702b4bb3-159c-4835-92cf-be10ff810e50'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '2026-01-31'::date, '出席', '[2526出席CSV] 教學紀錄: 對Q1-14 2025 DSE P1 | 請堂或補堂紀錄（老師填寫）: Leo Video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '702b4bb3-159c-4835-92cf-be10ff810e50'::uuid
    AND a.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '15a85db9-eba7-4d60-9ed5-531dc68060d6'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '2026-01-31'::date, '出席', '[2526出席CSV] 教學紀錄: 對Q1-14 2025 DSE P1 | 請堂或補堂紀錄（老師填寫）: Leo Video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '15a85db9-eba7-4d60-9ed5-531dc68060d6'::uuid
    AND a.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ae885f95-aa43-4d19-883a-8cba99ae65b9'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '2026-01-31'::date, '出席', '[2526出席CSV] 教學紀錄: 對Q1-14 2025 DSE P1 | 請堂或補堂紀錄（老師填寫）: Leo Video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ae885f95-aa43-4d19-883a-8cba99ae65b9'::uuid
    AND a.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '2026-01-31'::date, '出席', '[2526出席CSV] 教學紀錄: 對Q1-14 2025 DSE P1 | 請堂或補堂紀錄（老師填寫）: Leo Video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid
    AND a.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
    AND a.attendance_date = '2026-01-31'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2026-02-04'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2026-02-04'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fef46182-4c68-4560-9d3f-99b5abc8ae8e'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2026-02-04'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fef46182-4c68-4560-9d3f-99b5abc8ae8e'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2026-02-04'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2026-02-04'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6a2502d0-1c78-4f00-ba93-cfdea4e5294a'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2026-02-04'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b048d92b-aa05-487c-b0be-545ef6745e2d'::uuid, 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid, '2026-02-04'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b048d92b-aa05-487c-b0be-545ef6745e2d'::uuid
    AND a.class_id = 'a8018965-f273-5b4f-acb1-186af2767d6f'::uuid
    AND a.attendance_date = '2026-02-04'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '805bda3f-ac9a-4acf-aca6-39f491c1b5c7'::uuid, '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid, '2026-02-05'::date, '出席', '[2526出席CSV] 教學紀錄: 2024 P1 A2 Q10-13 | 請堂或補堂紀錄（老師填寫）: 加堂'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '805bda3f-ac9a-4acf-aca6-39f491c1b5c7'::uuid
    AND a.class_id = '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid
    AND a.attendance_date = '2026-02-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2026-02-05'::date, '出席', '[2526出席CSV] 教學紀錄: cont pyth thm ws'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2026-02-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5787d58f-5d75-4c5b-b1c1-fb7f223d150f'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2026-02-05'::date, '出席', '[2526出席CSV] 教學紀錄: cont pyth thm ws'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5787d58f-5d75-4c5b-b1c1-fb7f223d150f'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2026-02-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6d169f47-d3cb-42e0-b4bf-ed8e77ee7b99'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2026-02-05'::date, '出席', '[2526出席CSV] 教學紀錄: cont pyth thm ws'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6d169f47-d3cb-42e0-b4bf-ed8e77ee7b99'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2026-02-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '22fcad0f-8d89-48b1-abbd-9d0a52dc88ce'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2026-02-05'::date, '出席', '[2526出席CSV] 教學紀錄: cont pyth thm ws'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '22fcad0f-8d89-48b1-abbd-9d0a52dc88ce'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2026-02-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6340373f-9c3e-42a3-85e2-672a73fd16ad'::uuid, '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, '2026-02-05'::date, '出席', '[2526出席CSV] 教學紀錄: assign log up to solving equation. | 請堂或補堂紀錄（老師填寫）: 李靖彤補 31/1 Video sent （EXPO） 吳晉銘調7/2 陳偉傑video（log）'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6340373f-9c3e-42a3-85e2-672a73fd16ad'::uuid
    AND a.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
    AND a.attendance_date = '2026-02-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a09da146-6195-4d68-a1f8-22a8202a1f3d'::uuid, '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, '2026-02-05'::date, '出席', '[2526出席CSV] 教學紀錄: assign log up to solving equation. | 請堂或補堂紀錄（老師填寫）: 李靖彤補 31/1 Video sent （EXPO） 吳晉銘調7/2 陳偉傑video（log）'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a09da146-6195-4d68-a1f8-22a8202a1f3d'::uuid
    AND a.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
    AND a.attendance_date = '2026-02-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '97f16885-242d-47f8-bc22-f80468c8fb70'::uuid, '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, '2026-02-05'::date, '出席', '[2526出席CSV] 教學紀錄: assign log up to solving equation. | 請堂或補堂紀錄（老師填寫）: 李靖彤補 31/1 Video sent （EXPO） 吳晉銘調7/2 陳偉傑video（log）'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '97f16885-242d-47f8-bc22-f80468c8fb70'::uuid
    AND a.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
    AND a.attendance_date = '2026-02-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid, '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, '2026-02-06'::date, '出席', '[2526出席CSV] 教學紀錄: finished dispersion | 請堂或補堂紀錄（老師填寫）: finished dispersion 趙佳鑫、蕭馥鎣video 葉熙桐、羅兆斐、朱振軒、曾穎順延'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '2dfda27f-b6aa-453e-a2cc-f955cf3ef813'::uuid
    AND a.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
    AND a.attendance_date = '2026-02-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, '2026-02-06'::date, '出席', '[2526出席CSV] 教學紀錄: finished dispersion | 請堂或補堂紀錄（老師填寫）: finished dispersion 趙佳鑫、蕭馥鎣video 葉熙桐、羅兆斐、朱振軒、曾穎順延'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid
    AND a.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
    AND a.attendance_date = '2026-02-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid, '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, '2026-02-06'::date, '出席', '[2526出席CSV] 教學紀錄: finished dispersion | 請堂或補堂紀錄（老師填寫）: finished dispersion 趙佳鑫、蕭馥鎣video 葉熙桐、羅兆斐、朱振軒、曾穎順延'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid
    AND a.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
    AND a.attendance_date = '2026-02-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b048d92b-aa05-487c-b0be-545ef6745e2d'::uuid, '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid, '2026-02-06'::date, '出席', '[2526出席CSV] 教學紀錄: finished dispersion | 請堂或補堂紀錄（老師填寫）: finished dispersion 趙佳鑫、蕭馥鎣video 葉熙桐、羅兆斐、朱振軒、曾穎順延'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b048d92b-aa05-487c-b0be-545ef6745e2d'::uuid
    AND a.class_id = '1b0ca179-1c80-4c3f-99b0-bb9d6ff6f654'::uuid
    AND a.attendance_date = '2026-02-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '805bda3f-ac9a-4acf-aca6-39f491c1b5c7'::uuid, '2b8c7bb6-e76b-5816-9a9a-bfeaedf13561'::uuid, '2026-02-06'::date, '出席', '[2526出席CSV] 教學紀錄: 2025 DSE P1 cont up to Q16'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '805bda3f-ac9a-4acf-aca6-39f491c1b5c7'::uuid
    AND a.class_id = '2b8c7bb6-e76b-5816-9a9a-bfeaedf13561'::uuid
    AND a.attendance_date = '2026-02-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '25c71966-a146-4aab-afa6-52dfeddf57fb'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '2026-02-06'::date, '出席', '[2526出席CSV] 教學紀錄: 2025 P1 DSE Q7-14 | 請堂或補堂紀錄（老師填寫）: 李映進停，譚廣傑video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '25c71966-a146-4aab-afa6-52dfeddf57fb'::uuid
    AND a.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
    AND a.attendance_date = '2026-02-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '2026-02-06'::date, '出席', '[2526出席CSV] 教學紀錄: 2025 P1 DSE Q7-14 | 請堂或補堂紀錄（老師填寫）: 李映進停，譚廣傑video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid
    AND a.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
    AND a.attendance_date = '2026-02-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '486dd132-f2b2-4c0e-b5e4-853e07434826'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '2026-02-06'::date, '出席', '[2526出席CSV] 教學紀錄: 2025 P1 DSE Q7-14 | 請堂或補堂紀錄（老師填寫）: 李映進停，譚廣傑video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '486dd132-f2b2-4c0e-b5e4-853e07434826'::uuid
    AND a.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
    AND a.attendance_date = '2026-02-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a72586a0-ab9c-477b-b9c5-7231f1a23909'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '2026-02-06'::date, '出席', '[2526出席CSV] 教學紀錄: 2025 P1 DSE Q7-14 | 請堂或補堂紀錄（老師填寫）: 李映進停，譚廣傑video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a72586a0-ab9c-477b-b9c5-7231f1a23909'::uuid
    AND a.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
    AND a.attendance_date = '2026-02-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '2026-02-06'::date, '出席', '[2526出席CSV] 教學紀錄: 2025 P1 DSE Q7-14 | 請堂或補堂紀錄（老師填寫）: 李映進停，譚廣傑video'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid
    AND a.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
    AND a.attendance_date = '2026-02-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '495c1b7f-a4bf-42a3-a9ba-92c70d4202ea'::uuid, 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid, '2026-02-06'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '495c1b7f-a4bf-42a3-a9ba-92c70d4202ea'::uuid
    AND a.class_id = 'd777b136-87e2-4c33-b784-a94ba60a4e01'::uuid
    AND a.attendance_date = '2026-02-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd985e2e0-e140-49cf-9070-5d5f22145ef9'::uuid, '005e8d52-6109-522e-9478-2023cf91b100'::uuid, '2026-02-03'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd985e2e0-e140-49cf-9070-5d5f22145ef9'::uuid
    AND a.class_id = '005e8d52-6109-522e-9478-2023cf91b100'::uuid
    AND a.attendance_date = '2026-02-03'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '7801ffd1-6991-4a37-9015-61d33320b215'::uuid, 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid, '2026-02-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '7801ffd1-6991-4a37-9015-61d33320b215'::uuid
    AND a.class_id = 'f529b5f8-2eb9-4347-8f03-890f286b386b'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '8d0c77a0-b0cf-4903-9d4e-560ae3502250'::uuid, '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid, '2026-02-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '8d0c77a0-b0cf-4903-9d4e-560ae3502250'::uuid
    AND a.class_id = '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'cb245455-33e2-4a36-b948-d4f8e4e701bc'::uuid, '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid, '2026-02-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'cb245455-33e2-4a36-b948-d4f8e4e701bc'::uuid
    AND a.class_id = '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd70cb168-58f1-44bd-a4ee-6d5d803cf26e'::uuid, '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid, '2026-02-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd70cb168-58f1-44bd-a4ee-6d5d803cf26e'::uuid
    AND a.class_id = '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '80e22011-8207-4a75-87ee-02e7f2f5be4f'::uuid, '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid, '2026-02-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '80e22011-8207-4a75-87ee-02e7f2f5be4f'::uuid
    AND a.class_id = '92e2e1d0-28c6-4e99-a9e3-96fc6046e05d'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd70cb168-58f1-44bd-a4ee-6d5d803cf26e'::uuid, '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid, '2026-02-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd70cb168-58f1-44bd-a4ee-6d5d803cf26e'::uuid
    AND a.class_id = '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '80e22011-8207-4a75-87ee-02e7f2f5be4f'::uuid, '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid, '2026-02-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '80e22011-8207-4a75-87ee-02e7f2f5be4f'::uuid
    AND a.class_id = '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid, '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid, '2026-02-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid
    AND a.class_id = '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid, '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid, '2026-02-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd7b87430-5a48-4b93-a66e-6bce6d9bae5d'::uuid
    AND a.class_id = '3d0f0156-9fb3-4c4c-90b1-d4da8e9de784'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '19145380-aeb2-44f6-a27e-e2f263c7b35f'::uuid, '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, '2026-02-05'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '19145380-aeb2-44f6-a27e-e2f263c7b35f'::uuid
    AND a.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND a.attendance_date = '2026-02-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '01529c73-438d-4040-9c40-944d0b0d1af0'::uuid, '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, '2026-02-05'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '01529c73-438d-4040-9c40-944d0b0d1af0'::uuid
    AND a.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND a.attendance_date = '2026-02-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '37bd4518-13c0-47e0-8c45-30ac9f0a5507'::uuid, '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, '2026-02-05'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '37bd4518-13c0-47e0-8c45-30ac9f0a5507'::uuid
    AND a.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND a.attendance_date = '2026-02-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '3ab0dc4c-7eab-474a-8cff-f4e6ea4bc0c2'::uuid, '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid, '2026-02-05'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '3ab0dc4c-7eab-474a-8cff-f4e6ea4bc0c2'::uuid
    AND a.class_id = '41115026-61a7-4654-8ba5-e7c5b943bd42'::uuid
    AND a.attendance_date = '2026-02-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '90b1d98d-d7e7-4fab-ae37-ffbe64eb1eb1'::uuid, 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid, '2026-02-06'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '90b1d98d-d7e7-4fab-ae37-ffbe64eb1eb1'::uuid
    AND a.class_id = 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid
    AND a.attendance_date = '2026-02-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a67d1325-ab70-4a74-8aef-5a9d73ca9e12'::uuid, 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid, '2026-02-06'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a67d1325-ab70-4a74-8aef-5a9d73ca9e12'::uuid
    AND a.class_id = 'fabb2ef0-b023-486b-a76f-fae2ccbdc769'::uuid
    AND a.attendance_date = '2026-02-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2026-02-06'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '8fe641cb-a6e6-42a4-9b9a-6af7cc4b6acb'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2026-02-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '486dd132-f2b2-4c0e-b5e4-853e07434826'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2026-02-06'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '486dd132-f2b2-4c0e-b5e4-853e07434826'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2026-02-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid, '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid, '2026-02-06'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'aef03d05-ea19-428b-8ae4-f2b90f54e1e1'::uuid
    AND a.class_id = '499c272e-287d-428a-a6ce-baeb1c423bab'::uuid
    AND a.attendance_date = '2026-02-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fbb6b90a-2eda-4d65-84b7-f32c4c774c33'::uuid, '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid, '2026-02-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fbb6b90a-2eda-4d65-84b7-f32c4c774c33'::uuid
    AND a.class_id = '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b71f8795-7d99-4204-bd9c-791bf1395ffc'::uuid, '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid, '2026-02-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b71f8795-7d99-4204-bd9c-791bf1395ffc'::uuid
    AND a.class_id = '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'dd4893a5-f53a-4f0e-bdff-45353a7494dd'::uuid, '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid, '2026-02-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'dd4893a5-f53a-4f0e-bdff-45353a7494dd'::uuid
    AND a.class_id = '42cc9646-16f3-4913-8e5e-f666037f9458'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '771f28d9-790f-46e1-a803-ae64a635d68b'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2026-02-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '771f28d9-790f-46e1-a803-ae64a635d68b'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'c9d95382-dc26-44eb-9439-689cd9856022'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2026-02-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'c9d95382-dc26-44eb-9439-689cd9856022'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2026-02-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b2ed23a6-b41c-4c18-8623-0c1510616490'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5991bbd6-d744-46dd-a2db-30655bf3b150'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2026-02-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5991bbd6-d744-46dd-a2db-30655bf3b150'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2026-02-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ece2a51e-8095-40bf-8786-e0c7ff869d47'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fc447e55-3829-4793-8a7a-51efaacb75c4'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2026-02-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fc447e55-3829-4793-8a7a-51efaacb75c4'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid, '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid, '2026-02-07'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5f3684ea-1fd7-4bae-8627-940e39a5e626'::uuid
    AND a.class_id = '5c47a5e5-4aa2-4db2-b2a3-481cb0ad41f1'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6023b53d-82b5-4544-86ff-1297c8664616'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '2026-02-08'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6023b53d-82b5-4544-86ff-1297c8664616'::uuid
    AND a.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND a.attendance_date = '2026-02-08'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6b2b2711-4d57-4db6-90aa-334b4fa98f10'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '2026-02-08'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6b2b2711-4d57-4db6-90aa-334b4fa98f10'::uuid
    AND a.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND a.attendance_date = '2026-02-08'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ed1f7de2-d8dc-44b6-91c0-7c64d03c499d'::uuid, '16678e36-352e-4aef-abff-f32bcbefad26'::uuid, '2026-02-08'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ed1f7de2-d8dc-44b6-91c0-7c64d03c499d'::uuid
    AND a.class_id = '16678e36-352e-4aef-abff-f32bcbefad26'::uuid
    AND a.attendance_date = '2026-02-08'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '805bda3f-ac9a-4acf-aca6-39f491c1b5c7'::uuid, 'd4a698bf-e6e0-5b1c-a56a-dd8a7f311459'::uuid, '2026-02-07'::date, '出席', '[2526出席CSV] 教學紀錄: 複數、進制、多項式 Prog'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '805bda3f-ac9a-4acf-aca6-39f491c1b5c7'::uuid
    AND a.class_id = 'd4a698bf-e6e0-5b1c-a56a-dd8a7f311459'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '2026-02-07'::date, '出席', '[2526出席CSV] 教學紀錄: 複數、進制、多項式 Prog'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid
    AND a.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'f1934160-c64f-4e4d-be4e-c90a2027ad19'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '2026-02-07'::date, '出席', '[2526出席CSV] 教學紀錄: 複數、進制、多項式 Prog'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'f1934160-c64f-4e4d-be4e-c90a2027ad19'::uuid
    AND a.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '702b4bb3-159c-4835-92cf-be10ff810e50'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '2026-02-07'::date, '出席', '[2526出席CSV] 教學紀錄: 複數、進制、多項式 Prog'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '702b4bb3-159c-4835-92cf-be10ff810e50'::uuid
    AND a.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '15a85db9-eba7-4d60-9ed5-531dc68060d6'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '2026-02-07'::date, '出席', '[2526出席CSV] 教學紀錄: 複數、進制、多項式 Prog'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '15a85db9-eba7-4d60-9ed5-531dc68060d6'::uuid
    AND a.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ae885f95-aa43-4d19-883a-8cba99ae65b9'::uuid, 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid, '2026-02-07'::date, '出席', '[2526出席CSV] 教學紀錄: 複數、進制、多項式 Prog'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ae885f95-aa43-4d19-883a-8cba99ae65b9'::uuid
    AND a.class_id = 'eb4da7f9-2ba3-4853-8375-69a482b6d69a'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'c0cc0734-be3f-4c35-a4a4-9e94914bfea5'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '2026-02-07'::date, '出席', '[2526出席CSV] 教學紀錄: 吳晉銘補5/2 開log'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'c0cc0734-be3f-4c35-a4a4-9e94914bfea5'::uuid
    AND a.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ffa0780b-5590-4ace-899e-91f343d78a81'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '2026-02-07'::date, '出席', '[2526出席CSV] 教學紀錄: 吳晉銘補5/2 開log'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ffa0780b-5590-4ace-899e-91f343d78a81'::uuid
    AND a.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '2026-02-07'::date, '出席', '[2526出席CSV] 教學紀錄: 吳晉銘補5/2 開log'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '9b6d6ea6-2b17-42a7-8367-50e891c6897e'::uuid
    AND a.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'd78cdee9-fc3f-4ffa-ab33-68861dc36143'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '2026-02-07'::date, '出席', '[2526出席CSV] 教學紀錄: 吳晉銘補5/2 開log'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'd78cdee9-fc3f-4ffa-ab33-68861dc36143'::uuid
    AND a.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b9ec0998-36bc-4bc9-8b4b-6ad4e9000e98'::uuid, 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid, '2026-02-07'::date, '出席', '[2526出席CSV] 教學紀錄: 吳晉銘補5/2 開log'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b9ec0998-36bc-4bc9-8b4b-6ad4e9000e98'::uuid
    AND a.class_id = 'c76da435-6bb2-4369-bece-f3522d592a89'::uuid
    AND a.attendance_date = '2026-02-07'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '805bda3f-ac9a-4acf-aca6-39f491c1b5c7'::uuid, 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid, '2026-02-08'::date, '出席', '[2526出席CSV] 教學紀錄: 四線四心prog assigned 未講 assign cirlce + locus notes_N已講圓形未做練習'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '805bda3f-ac9a-4acf-aca6-39f491c1b5c7'::uuid
    AND a.class_id = 'a9c3c836-6d86-4cf4-9f99-63d01a302be4'::uuid
    AND a.attendance_date = '2026-02-08'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '805bda3f-ac9a-4acf-aca6-39f491c1b5c7'::uuid, '2b8c7bb6-e76b-5816-9a9a-bfeaedf13561'::uuid, '2026-02-09'::date, '出席', '[2526出席CSV] 教學紀錄: D notes 三角、幾何、座標Unfinished'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '805bda3f-ac9a-4acf-aca6-39f491c1b5c7'::uuid
    AND a.class_id = '2b8c7bb6-e76b-5816-9a9a-bfeaedf13561'::uuid
    AND a.attendance_date = '2026-02-09'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '77d6c2c9-9a38-45e6-88c8-e7e744c6c5b9'::uuid, 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid, '2026-02-08'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '77d6c2c9-9a38-45e6-88c8-e7e744c6c5b9'::uuid
    AND a.class_id = 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid
    AND a.attendance_date = '2026-02-08'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a2655bb3-6f9c-4ef2-a885-c789669c4061'::uuid, 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid, '2026-02-08'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a2655bb3-6f9c-4ef2-a885-c789669c4061'::uuid
    AND a.class_id = 'bc798b21-6476-5754-954e-edb5b4ba22f2'::uuid
    AND a.attendance_date = '2026-02-08'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '77d6c2c9-9a38-45e6-88c8-e7e744c6c5b9'::uuid, 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid, '2026-02-08'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '77d6c2c9-9a38-45e6-88c8-e7e744c6c5b9'::uuid
    AND a.class_id = 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid
    AND a.attendance_date = '2026-02-08'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a2655bb3-6f9c-4ef2-a885-c789669c4061'::uuid, 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid, '2026-02-08'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a2655bb3-6f9c-4ef2-a885-c789669c4061'::uuid
    AND a.class_id = 'a1d1feba-33f5-407a-94d0-df26cb4fd412'::uuid
    AND a.attendance_date = '2026-02-08'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '805bda3f-ac9a-4acf-aca6-39f491c1b5c7'::uuid, '1a00cbaf-079f-56f5-a8ec-c706ea085bd5'::uuid, '2026-02-05'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '805bda3f-ac9a-4acf-aca6-39f491c1b5c7'::uuid
    AND a.class_id = '1a00cbaf-079f-56f5-a8ec-c706ea085bd5'::uuid
    AND a.attendance_date = '2026-02-05'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '805bda3f-ac9a-4acf-aca6-39f491c1b5c7'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '2026-02-06'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '805bda3f-ac9a-4acf-aca6-39f491c1b5c7'::uuid
    AND a.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
    AND a.attendance_date = '2026-02-06'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid, '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid, '2026-02-10'::date, '出席', '[2526出席CSV] 教學紀錄: 開AVIII notes | 請堂或補堂紀錄（老師填寫）: 嚴宇婷 補Natalie課堂7/2'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'bbc35d66-91ff-4114-9366-a0dcd261a000'::uuid
    AND a.class_id = '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid
    AND a.attendance_date = '2026-02-10'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'fe2cae65-566c-42de-b757-d1807e84d9d5'::uuid, '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid, '2026-02-10'::date, '出席', '[2526出席CSV] 教學紀錄: 開AVIII notes | 請堂或補堂紀錄（老師填寫）: 嚴宇婷 補Natalie課堂7/2'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'fe2cae65-566c-42de-b757-d1807e84d9d5'::uuid
    AND a.class_id = '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid
    AND a.attendance_date = '2026-02-10'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '0bf2b340-46d8-4272-90e1-48a098d220f9'::uuid, '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid, '2026-02-10'::date, '出席', '[2526出席CSV] 教學紀錄: 開AVIII notes | 請堂或補堂紀錄（老師填寫）: 嚴宇婷 補Natalie課堂7/2'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '0bf2b340-46d8-4272-90e1-48a098d220f9'::uuid
    AND a.class_id = '7add54c5-1a1a-4dc1-acd2-0f9d8bf0a5dd'::uuid
    AND a.attendance_date = '2026-02-10'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '805bda3f-ac9a-4acf-aca6-39f491c1b5c7'::uuid, 'd4a698bf-e6e0-5b1c-a56a-dd8a7f311459'::uuid, '2026-02-10'::date, '出席', '[2526出席CSV] 教學紀錄: cont D notes 三角、幾何、座標 FINISHED'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '805bda3f-ac9a-4acf-aca6-39f491c1b5c7'::uuid
    AND a.class_id = 'd4a698bf-e6e0-5b1c-a56a-dd8a7f311459'::uuid
    AND a.attendance_date = '2026-02-10'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5defd314-7fff-4181-90a2-12dae25e21cf'::uuid, '0321e2d4-5ac7-5303-ba20-0f33e3126db2'::uuid, '2026-02-10'::date, '出席', '[2526出席CSV] 教學紀錄: Cont D_notes 率及比'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5defd314-7fff-4181-90a2-12dae25e21cf'::uuid
    AND a.class_id = '0321e2d4-5ac7-5303-ba20-0f33e3126db2'::uuid
    AND a.attendance_date = '2026-02-10'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'dd4893a5-f53a-4f0e-bdff-45353a7494dd'::uuid, '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, '2026-02-02'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'dd4893a5-f53a-4f0e-bdff-45353a7494dd'::uuid
    AND a.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND a.attendance_date = '2026-02-02'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6b2b2711-4d57-4db6-90aa-334b4fa98f10'::uuid, '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, '2026-02-02'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6b2b2711-4d57-4db6-90aa-334b4fa98f10'::uuid
    AND a.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND a.attendance_date = '2026-02-02'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'dd4893a5-f53a-4f0e-bdff-45353a7494dd'::uuid, '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, '2026-02-09'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'dd4893a5-f53a-4f0e-bdff-45353a7494dd'::uuid
    AND a.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND a.attendance_date = '2026-02-09'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6b2b2711-4d57-4db6-90aa-334b4fa98f10'::uuid, '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid, '2026-02-09'::date, '出席', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6b2b2711-4d57-4db6-90aa-334b4fa98f10'::uuid
    AND a.class_id = '58859fd8-187d-4c76-9e82-030529bb1ac9'::uuid
    AND a.attendance_date = '2026-02-09'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2026-02-12'::date, '出席', '[2526出席CSV] 教學紀錄: assign AVII'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ca740477-7f3d-42a6-8590-1c15144a0ef4'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2026-02-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '5787d58f-5d75-4c5b-b1c1-fb7f223d150f'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2026-02-12'::date, '出席', '[2526出席CSV] 教學紀錄: assign AVII'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '5787d58f-5d75-4c5b-b1c1-fb7f223d150f'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2026-02-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6d169f47-d3cb-42e0-b4bf-ed8e77ee7b99'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2026-02-12'::date, '出席', '[2526出席CSV] 教學紀錄: assign AVII'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6d169f47-d3cb-42e0-b4bf-ed8e77ee7b99'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2026-02-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '22fcad0f-8d89-48b1-abbd-9d0a52dc88ce'::uuid, '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid, '2026-02-12'::date, '出席', '[2526出席CSV] 教學紀錄: assign AVII'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '22fcad0f-8d89-48b1-abbd-9d0a52dc88ce'::uuid
    AND a.class_id = '72b0bb99-26f7-4a93-afad-f7462048385a'::uuid
    AND a.attendance_date = '2026-02-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b9ec0998-36bc-4bc9-8b4b-6ad4e9000e98'::uuid, '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, '2026-02-12'::date, '出席', '[2526出席CSV] 教學紀錄: Finished Log Assign log and expo ws 未做'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b9ec0998-36bc-4bc9-8b4b-6ad4e9000e98'::uuid
    AND a.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
    AND a.attendance_date = '2026-02-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a09da146-6195-4d68-a1f8-22a8202a1f3d'::uuid, '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, '2026-02-12'::date, '出席', '[2526出席CSV] 教學紀錄: Finished Log Assign log and expo ws 未做'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a09da146-6195-4d68-a1f8-22a8202a1f3d'::uuid
    AND a.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
    AND a.attendance_date = '2026-02-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '6340373f-9c3e-42a3-85e2-672a73fd16ad'::uuid, '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid, '2026-02-12'::date, '出席', '[2526出席CSV] 教學紀錄: Finished Log Assign log and expo ws 未做'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '6340373f-9c3e-42a3-85e2-672a73fd16ad'::uuid
    AND a.class_id = '1fc83776-2eca-4b97-ba3c-3467e2f1515d'::uuid
    AND a.attendance_date = '2026-02-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '805bda3f-ac9a-4acf-aca6-39f491c1b5c7'::uuid, '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid, '2026-02-12'::date, '出席', '[2526出席CSV] 教學紀錄: assign circle prog + cont circle eqt'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '805bda3f-ac9a-4acf-aca6-39f491c1b5c7'::uuid
    AND a.class_id = '89476ee2-0af4-407e-87f2-2db30ea0ad49'::uuid
    AND a.attendance_date = '2026-02-12'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '25c71966-a146-4aab-afa6-52dfeddf57fb'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '2026-02-13'::date, '出席', '[2526出席CSV] 教學紀錄: 四線四心 ws AV 比例 | 請堂或補堂紀錄（老師填寫）: 陳卓賢補14/2'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '25c71966-a146-4aab-afa6-52dfeddf57fb'::uuid
    AND a.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
    AND a.attendance_date = '2026-02-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '2026-02-13'::date, '出席', '[2526出席CSV] 教學紀錄: 四線四心 ws AV 比例 | 請堂或補堂紀錄（老師填寫）: 陳卓賢補14/2'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'b6cce945-8d14-439a-9457-53ce6b82111f'::uuid
    AND a.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
    AND a.attendance_date = '2026-02-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '486dd132-f2b2-4c0e-b5e4-853e07434826'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '2026-02-13'::date, '出席', '[2526出席CSV] 教學紀錄: 四線四心 ws AV 比例 | 請堂或補堂紀錄（老師填寫）: 陳卓賢補14/2'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '486dd132-f2b2-4c0e-b5e4-853e07434826'::uuid
    AND a.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
    AND a.attendance_date = '2026-02-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'a72586a0-ab9c-477b-b9c5-7231f1a23909'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '2026-02-13'::date, '出席', '[2526出席CSV] 教學紀錄: 四線四心 ws AV 比例 | 請堂或補堂紀錄（老師填寫）: 陳卓賢補14/2'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'a72586a0-ab9c-477b-b9c5-7231f1a23909'::uuid
    AND a.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
    AND a.attendance_date = '2026-02-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '2026-02-13'::date, '出席', '[2526出席CSV] 教學紀錄: 四線四心 ws AV 比例 | 請堂或補堂紀錄（老師填寫）: 陳卓賢補14/2'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = 'ce174b57-1108-453b-bc60-f397ea0aacab'::uuid
    AND a.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
    AND a.attendance_date = '2026-02-13'::date
);

INSERT INTO public.attendance_details (student_id, class_id, attendance_date, status, remarks)
SELECT '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid, '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid, '2026-02-13'::date, '出席', '[2526出席CSV] 教學紀錄: 四線四心 ws AV 比例 | 請堂或補堂紀錄（老師填寫）: 陳卓賢補14/2'
WHERE NOT EXISTS (
  SELECT 1 FROM public.attendance_details a
  WHERE a.student_id = '06f6ee6f-0723-49c9-9c95-fbe177b7b7bf'::uuid
    AND a.class_id = '1bbd5e77-00b4-402e-8549-dadc5eb7c455'::uuid
    AND a.attendance_date = '2026-02-13'::date
);

COMMIT;