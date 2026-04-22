-- 2526 課程及班別匯入（由 scripts/import_2526_roster.py 產生）
-- 請於 Supabase SQL Editor 以具寫入權限身分執行（會繞過 RLS）。
-- 若學生姓名已在 public.students 存在，可能產生重複姓名資料列，執行前請先備份或改寫本檔。
BEGIN;

INSERT INTO public.students (
  id, full_name, student_code, grade, school, status, registration_status, enrollment_status, academic_stage
) VALUES
  ('b09a62d4-58b0-4ba8-a413-6263a03eec8c'::uuid, '伍可恩', 'S-2526-IMP-00000', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('50d43ef7-b5a2-46a4-9925-2073ddb055f9'::uuid, '俞逸軒', 'S-2526-IMP-00001', '中六', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('a50f0a8f-6112-4444-9d65-f1eb29b6968f'::uuid, '傅嘉琳', 'S-2526-IMP-00002', '中六', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('e850f4ce-0e20-4280-9d14-b5f85b39dcdc'::uuid, '凌巧悅', 'S-2526-IMP-00003', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('0390c81e-b8b3-4d1e-a0f0-b2cdaae2c6a9'::uuid, '劉子軒', 'S-2526-IMP-00004', '中一', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('b1d2933b-0459-4f85-9e0c-dd9eb0bc403a'::uuid, '劉展', 'S-2526-IMP-00005', '中二', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('8fd4f614-b322-4785-967c-daa035605150'::uuid, '劉沛琋', 'S-2526-IMP-00006', '中一', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('2f2cbe75-b1a6-4235-b2f5-05fc3a752aa6'::uuid, '劉穎潼', 'S-2526-IMP-00007', '中六', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('95574867-771a-4264-a7b3-d58a31247b08'::uuid, '劉雨彤', 'S-2526-IMP-00008', '中四', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('63893559-39a1-48ab-8a11-8279e1a57b2d'::uuid, '區智林', 'S-2526-IMP-00009', '小一', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('6858d8f8-e32f-4637-ab46-a88cef82ac45'::uuid, '區智珩', 'S-2526-IMP-00010', '中一', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('96136915-084f-427b-9937-7beb74bf35f4'::uuid, '吳昶覦', 'S-2526-IMP-00011', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('dde027ee-458a-48b6-88d9-f1ec6d819698'::uuid, '吳晉輝', 'S-2526-IMP-00012', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('65443d7d-dd95-4dcf-8ab3-287e19edbf76'::uuid, '吳晉銘', 'S-2526-IMP-00013', '中四', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('bdf4ef17-29f2-4d92-8ea9-ab06b9e47f1d'::uuid, '周美君', 'S-2526-IMP-00014', '中六', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('4ddd2ba1-1d17-46e8-b9c3-11c38a584254'::uuid, '嚴宇婷', 'S-2526-IMP-00015', '中三', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('754fdd71-0513-4200-a1f4-b5051fb183c6'::uuid, '屈卓衡', 'S-2526-IMP-00016', '中一', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('058ed296-1bba-4bd0-8e6e-482d585fabdd'::uuid, '廖俊粼', 'S-2526-IMP-00017', '中六', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('2fb1a637-1683-469b-849d-94ccd0a10e9f'::uuid, '張以諾', 'S-2526-IMP-00018', '中二', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('b08ea99a-47d4-42c4-b689-d88150ac29ad'::uuid, '張善愉', 'S-2526-IMP-00019', '小一', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('108c284f-4f70-4689-a6c3-4af894eb74b4'::uuid, '張展榮', 'S-2526-IMP-00020', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('0ae337c5-615d-476e-9cb9-1544bbb8c439'::uuid, '張朗志', 'S-2526-IMP-00021', '中六', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('025a1e5d-1af3-4ca9-bb2e-42e636b03ffb'::uuid, '張聖汶', 'S-2526-IMP-00022', '中一', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('d86901d2-1e2e-46b6-9f09-6f770bc683cb'::uuid, '張鍏澄', 'S-2526-IMP-00023', '中六', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('b0107d72-413c-4e5b-94e0-0a4de1d14f6f'::uuid, '徐思思', 'S-2526-IMP-00024', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('86d25c49-66d0-406b-a725-5b4973f21df3'::uuid, '文覺熲', 'S-2526-IMP-00025', '中二', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('02bb5dac-c1fd-43a6-aa6b-0544929c0672'::uuid, '文覺瑩f', 'S-2526-IMP-00026', '中一', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('ba7d09f2-5167-4418-b5ad-a83d20c67c63'::uuid, '文覺稼', 'S-2526-IMP-00027', '中一', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('0eca10e9-ab38-41a0-8d11-c9468f5afddb'::uuid, '施柔羽', 'S-2526-IMP-00028', '中三', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('6febe4d0-557d-48a2-b283-07963139d5c3'::uuid, '曾穎', 'S-2526-IMP-00029', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('2bf676ec-00e5-42b2-bd4f-26c93580c406'::uuid, '朱俊賢', 'S-2526-IMP-00030', '中一', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('aeaa29b9-9ca0-43c5-954c-ee4757266a3c'::uuid, '朱震軒', 'S-2526-IMP-00031', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('46751600-8619-4cbd-a752-13b9b81f1984'::uuid, '李兆洪', 'S-2526-IMP-00032', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('a61d62aa-44b1-4477-98be-8d7fc007f6a1'::uuid, '李婉筠', 'S-2526-IMP-00033', '小一', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('40740569-ed26-4b9c-9bca-1afb6eb920ab'::uuid, '李承鋒', 'S-2526-IMP-00034', '中四', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('2d75a8f3-7d21-49e3-985c-6b7defb351fc'::uuid, '李昭儀', 'S-2526-IMP-00035', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('4f9e4c16-0f95-4adf-b383-593811de4c13'::uuid, '李柏熙', 'S-2526-IMP-00036', '中六', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('667ead37-34fc-4be7-bf70-fd4eda66ca8d'::uuid, '李柚君', 'S-2526-IMP-00037', '中二', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('f98aacc3-3dcb-477c-be80-50e4286a8c4a'::uuid, '李穎諭', 'S-2526-IMP-00038', '中六', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('c21d45bc-fd44-4c45-a764-2cea83e7ff57'::uuid, '林冠廷', 'S-2526-IMP-00039', '中四', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('6e060632-9bd7-4a69-9aa7-e4d9dea292a7'::uuid, '林家如', 'S-2526-IMP-00040', '中四', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('5eaf6c4a-eb16-4992-948d-641652fe639f'::uuid, '林家綺', 'S-2526-IMP-00041', '中四', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('879205e4-a499-445f-86ab-ff56f3569438'::uuid, '林曉柔', 'S-2526-IMP-00042', '中三', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('50be3ef2-b35a-464c-8e1b-08b68658d419'::uuid, '林玳伊', 'S-2526-IMP-00043', '中一', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('3e419707-1d86-4a23-b369-46e34f95957f'::uuid, '林芍延', 'S-2526-IMP-00044', '中三', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('96cd39e1-d5c1-4994-b5a9-58e9cddfe5bf'::uuid, '梁天因', 'S-2526-IMP-00045', '中四', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('bb8803c5-0b02-47ee-afc6-af3d0240705c'::uuid, '梁展博', 'S-2526-IMP-00046', '中一', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('63bbd1bc-5be3-4535-b317-b27c183d649f'::uuid, '梁景維', 'S-2526-IMP-00047', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('99d984ce-1e92-4741-9d2a-f6b588082de4'::uuid, '梁柏熹', 'S-2526-IMP-00048', '中六', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('cc09b6ef-d2b0-437b-9d42-c2f65d9b0959'::uuid, '梁楚悠', 'S-2526-IMP-00049', '中六', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('35893dd5-f77e-4ef4-b6b2-4baabb14f357'::uuid, '楊俊熙', 'S-2526-IMP-00050', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('5707f4fb-4f63-4098-86d8-8682033e5859'::uuid, '楊逸飛', 'S-2526-IMP-00051', '中六', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('f7c8f44b-990d-4d06-b80b-3e050aec614c'::uuid, '楊𧘲佳', 'S-2526-IMP-00052', '中六', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('789a19a5-0423-4a3c-86a4-a080aae7b952'::uuid, '溫珏禧', 'S-2526-IMP-00053', NULL, NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('3a22fc95-e268-4a8c-abbb-4bd43ac9194d'::uuid, '潘子翹', 'S-2526-IMP-00054', '中二', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('7be42e31-ace8-44a4-a871-77d528f341f2'::uuid, '潘柏希', 'S-2526-IMP-00055', '中一', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('db303f37-2f92-4c35-8a7d-dd8773d1507a'::uuid, '王以靈', 'S-2526-IMP-00056', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('401580ab-61ee-4843-b86d-10bd847449b4'::uuid, '王晴怡', 'S-2526-IMP-00057', '中四', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('e937c6a5-9116-44f3-a203-318c48fa6aec'::uuid, '田興宇', 'S-2526-IMP-00058', '中三', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('f93c9942-8f06-4354-9f95-30c01fd6b58d'::uuid, '羅兆斐', 'S-2526-IMP-00059', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('f9d50fe3-6546-46ff-9f67-630bfda1d63f'::uuid, '羅善瀧', 'S-2526-IMP-00060', '中一', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('e2ff6f4b-ce16-4dca-8a01-82d69a552a68'::uuid, '羅希文', 'S-2526-IMP-00061', '中六', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('1ceb6453-02b0-4104-a9f0-8b6cabe31206'::uuid, '羅茗心', 'S-2526-IMP-00062', '中一', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('1a034fbe-7be1-4a3a-954a-0e6e371cd52f'::uuid, '翁頌怡', 'S-2526-IMP-00063', '中三', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('3bf0758e-7f75-403c-82eb-a995ef71f447'::uuid, '艾語涵', 'S-2526-IMP-00064', '中四', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('3e92f8a4-49ab-42e9-9687-e6735b26411e'::uuid, '范以喬', 'S-2526-IMP-00065', '中四', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('4bc8b385-a109-4479-844d-1c2b72e690c8'::uuid, '莊凱茵', 'S-2526-IMP-00066', '中一', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('47b7153c-1393-4bdf-bed2-47640213ec5e'::uuid, '莊靖思', 'S-2526-IMP-00067', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('5cad8567-6932-437f-8488-65af68420a02'::uuid, '莫凱傑', 'S-2526-IMP-00068', '中四', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('ce8c4982-bf08-4213-86f7-99292a8f70ff'::uuid, '莫凱晴', 'S-2526-IMP-00069', '中三', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('fc090614-5e34-4daf-b367-62b79b3ecb57'::uuid, '葉善甯', 'S-2526-IMP-00070', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('5214a841-39c8-4805-8720-c20a7f202d98'::uuid, '葉梓軒', 'S-2526-IMP-00071', '中三', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('3f44050b-d295-4ed4-ae90-6f58eafdcccd'::uuid, '葉熙桐', 'S-2526-IMP-00072', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('082ae102-2471-45f5-b1c7-676e2743dca3'::uuid, '董籽均', 'S-2526-IMP-00073', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('28396f5a-c066-43bf-bcc6-cfd4fee72e92'::uuid, '蔡曉朗', 'S-2526-IMP-00074', '中三', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('065d4b56-88e3-4063-91f1-4a4792add0c0'::uuid, '蔡汶軒', 'S-2526-IMP-00075', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('a1522691-c771-4b9b-b6e5-9a3c55dcbe97'::uuid, '蕭樂瑩', 'S-2526-IMP-00076', '中一', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('813935d3-09f3-4f8c-b633-6a3be4692649'::uuid, '蕭馥鎣', 'S-2526-IMP-00077', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('e9d49e58-14b5-4e81-9630-234f2b0b6596'::uuid, '蘇婉容', 'S-2526-IMP-00078', '中一', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('20361dec-731e-4c2f-bf0b-0b8f474361ff'::uuid, '蘇子航', 'S-2526-IMP-00079', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('395e0b9d-acc1-4ef8-97ea-5c3ab4eb1ac8'::uuid, '袁焯楠', 'S-2526-IMP-00080', '中六', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('b98e410e-09c5-45e7-a18d-d120ffc95867'::uuid, '謝瑋翹', 'S-2526-IMP-00081', '中一', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('b173bc1e-153d-4ef7-9ed6-a36be060319c'::uuid, '譚仟渝', 'S-2526-IMP-00082', '中四', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('411f1dad-c0d2-4205-b84e-3f342ee5c54c'::uuid, '譚仲景', 'S-2526-IMP-00083', '中六', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('a44e6718-427b-43d1-93de-1e34ba3c4535'::uuid, '譚廣傑', 'S-2526-IMP-00084', '中六', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('550ef8fa-8579-42a7-904c-e634a697ae5c'::uuid, '譚銳妍', 'S-2526-IMP-00085', '中二', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('c5ca6855-9331-4e61-af32-2d5dd9cd75cc'::uuid, '趙佳鑫', 'S-2526-IMP-00086', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('fa7e5572-9889-486d-9ea6-29d17ce33e4f'::uuid, '趙樂怡', 'S-2526-IMP-00087', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('f4317920-332c-445a-930d-7a5c230051e8'::uuid, '邱浩傑', 'S-2526-IMP-00088', '中四', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('17575f59-9a5a-4d56-8e46-b75c6c2ae37c'::uuid, '鄧宇童', 'S-2526-IMP-00089', '中二', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('d9b18c83-41c2-4e39-94f9-95513e096c39'::uuid, '鄭恩祈', 'S-2526-IMP-00090', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('130450c8-769f-4a59-8eda-62ba44d3de40'::uuid, '鍾以澄', 'S-2526-IMP-00091', '小一', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('301a4b5e-c55d-4b4d-91d7-0bc05aada67d'::uuid, '鍾永恒', 'S-2526-IMP-00092', '中六', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('f13c6165-aeeb-4791-ba10-a2de49b58f49'::uuid, '關智博', 'S-2526-IMP-00093', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('9587f3e7-7016-49a3-841c-cf384c884c30'::uuid, '阮心兒', 'S-2526-IMP-00094', '中一', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('915602a6-c807-465f-9d8f-f66f5f070ce9'::uuid, '陳俊鍇', 'S-2526-IMP-00095', '中六', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('154bec19-0f58-47ee-9a40-1d33ff0e0f2a'::uuid, '陳卓賢', 'S-2526-IMP-00096', '中六', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('7a68bb12-3c7e-4a6e-918d-99caa4f3427a'::uuid, '陳宏熙', 'S-2526-IMP-00097', '中一', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('174c983e-7ecf-432d-acc7-c60d0fa48623'::uuid, '陳宣穎', 'S-2526-IMP-00098', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('0b656f33-268d-4d21-a49f-a37818134fa2'::uuid, '陳弘燁', 'S-2526-IMP-00099', '中一', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('0d708d45-f2c3-4edc-bf6e-f11f4f37abc0'::uuid, '陳柏朗', 'S-2526-IMP-00100', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('f11cc305-e7d8-4296-a524-421d7d53212f'::uuid, '陳梓慧', 'S-2526-IMP-00101', '中六', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('db2d4d1b-7b41-461f-bd22-8b86e0e27014'::uuid, '陳煒傑', 'S-2526-IMP-00102', '中四', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('c73ff545-d4b8-4b06-9972-a076406b406a'::uuid, '陳煒杰', 'S-2526-IMP-00103', NULL, NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('a09f0716-e546-4db0-aa69-30ff70ae6fb1'::uuid, '陳紫晴', 'S-2526-IMP-00104', '中六', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('b81410b2-eb80-4af4-8d00-528ce073d5bd'::uuid, '陳肇希', 'S-2526-IMP-00105', '中六', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('a644ff5a-3115-47f4-ade3-7a2fca30897e'::uuid, '陳采妍', 'S-2526-IMP-00106', '中六', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('c6cdae79-baa1-425e-8345-976e45c84315'::uuid, '陸玉瓏', 'S-2526-IMP-00107', '中二', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('521bdfcb-74ff-4166-9e6f-5721ac1650f4'::uuid, '雷洛驊', 'S-2526-IMP-00108', '中一', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('029ff376-ea0b-466e-8d78-6b71a4ca6e0e'::uuid, '霍健一', 'S-2526-IMP-00109', '中四', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('7ffd3cb4-45b3-4a6b-bde3-2e9a7b5c37a0'::uuid, '馮國璇', 'S-2526-IMP-00110', '中二', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('d199899c-a7a1-4ee7-a4b8-7138f702a1b2'::uuid, '馮記昰', 'S-2526-IMP-00111', '中二', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('05fbd9a6-0a16-48b0-81d1-df45293e23ec'::uuid, '駱詠', 'S-2526-IMP-00112', '中六', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('223038a1-164b-482a-9408-1007dc373467'::uuid, '高梓軒', 'S-2526-IMP-00113', '中六', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('5174ab4c-3cf9-4640-97c8-78dd6f83c44e'::uuid, '黃慧淇', 'S-2526-IMP-00114', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('15b93f72-82ce-4fbe-920c-ca0c96931b6a'::uuid, '黃永健', 'S-2526-IMP-00115', '中六', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('bea1805a-fa1b-43bd-80b5-935d20535990'::uuid, '黃渲棋', 'S-2526-IMP-00116', '中五', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('d0490601-ab06-4b2f-b3e3-6e06007665c9'::uuid, '黃瑋霆', 'S-2526-IMP-00117', '中一', NULL, '在讀', '已註冊', '在讀', '中學中'),
  ('8b67097c-4edf-4e5a-b370-a2972e4322ef'::uuid, '黃艾琳', 'S-2526-IMP-00118', '中五', NULL, '在讀', '已註冊', '在讀', '中學中');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid, '中文', NULL, ARRAY['中四']::text[], '星期日', '11:30-12:45', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('96cd39e1-d5c1-4994-b5a9-58e9cddfe5bf'::uuid, '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級中文科B班CFAN');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('3e92f8a4-49ab-42e9-9687-e6735b26411e'::uuid, '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級中文科B班CFAN');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('029ff376-ea0b-466e-8d78-6b71a4ca6e0e'::uuid, '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級中文科B班CFAN');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('65443d7d-dd95-4dcf-8ab3-287e19edbf76'::uuid, '20f8b798-8513-4df7-85f4-bcc36d3e3169'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級中文科B班CFAN');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('1c46b037-f332-4eb0-9540-5f04a052570b'::uuid, '數學', NULL, ARRAY['中四']::text[], '星期四', '17:45-19:00', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('401580ab-61ee-4843-b86d-10bd847449b4'::uuid, '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科A班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('db2d4d1b-7b41-461f-bd22-8b86e0e27014'::uuid, '1c46b037-f332-4eb0-9540-5f04a052570b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科A班MYU');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid, '數學', NULL, ARRAY['中四']::text[], '星期六', '15:15-16:30', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('b173bc1e-153d-4ef7-9ed6-a36be060319c'::uuid, '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科B班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('96cd39e1-d5c1-4994-b5a9-58e9cddfe5bf'::uuid, '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科B班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('3e92f8a4-49ab-42e9-9687-e6735b26411e'::uuid, '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科B班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('40740569-ed26-4b9c-9bca-1afb6eb920ab'::uuid, '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科B班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('5cad8567-6932-437f-8488-65af68420a02'::uuid, '94194de7-9fd3-4c44-9b29-0030c7616f08'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科B班MYU');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('43aab94a-c3d2-4647-abbb-244d9ae970aa'::uuid, '英文', NULL, ARRAY['中五','中四']::text[], NULL, '11:30-12:45', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('5174ab4c-3cf9-4640-97c8-78dd6f83c44e'::uuid, '43aab94a-c3d2-4647-abbb-244d9ae970aa'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科B班');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('2d75a8f3-7d21-49e3-985c-6b7defb351fc'::uuid, '43aab94a-c3d2-4647-abbb-244d9ae970aa'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科B班');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('c5ca6855-9331-4e61-af32-2d5dd9cd75cc'::uuid, '43aab94a-c3d2-4647-abbb-244d9ae970aa'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科B班');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('d9b18c83-41c2-4e39-94f9-95513e096c39'::uuid, '43aab94a-c3d2-4647-abbb-244d9ae970aa'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科B班');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('f93c9942-8f06-4354-9f95-30c01fd6b58d'::uuid, '43aab94a-c3d2-4647-abbb-244d9ae970aa'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科B班');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('e850f4ce-0e20-4280-9d14-b5f85b39dcdc'::uuid, '43aab94a-c3d2-4647-abbb-244d9ae970aa'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科B班');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('813935d3-09f3-4f8c-b633-6a3be4692649'::uuid, '43aab94a-c3d2-4647-abbb-244d9ae970aa'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科B班');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid, '數學延伸', NULL, ARRAY['中四']::text[], '星期日', '14:00-15:15', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('3bf0758e-7f75-403c-82eb-a995ef71f447'::uuid, '72f4a923-5ac0-4183-bb70-bc64349ff3af'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級M2科A班TIMC');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('69e7dc3c-49b6-4faf-9bc1-e1334be66844'::uuid, '物理', NULL, ARRAY['中四']::text[], '星期日', '12:45-14:00', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid, '中文', NULL, ARRAY['中五']::text[], '星期三', '17:45-19:00', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('813935d3-09f3-4f8c-b633-6a3be4692649'::uuid, 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級中文科A班CFAN');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('aeaa29b9-9ca0-43c5-954c-ee4757266a3c'::uuid, 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級中文科A班CFAN');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('065d4b56-88e3-4063-91f1-4a4792add0c0'::uuid, 'e78ac7ea-67f8-4b15-86c4-445a29635b1f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級中文科A班CFAN');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid, '中文', NULL, ARRAY['中五']::text[], '星期日', '15:15-16:30', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('108c284f-4f70-4689-a6c3-4af894eb74b4'::uuid, 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級中文科B班CFAN');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('c5ca6855-9331-4e61-af32-2d5dd9cd75cc'::uuid, 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級中文科B班CFAN');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('f93c9942-8f06-4354-9f95-30c01fd6b58d'::uuid, 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級中文科B班CFAN');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('b0107d72-413c-4e5b-94e0-0a4de1d14f6f'::uuid, 'ca098a4d-5d95-4846-9598-d76f112dd6ea'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級中文科B班CFAN');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid, '數學', NULL, ARRAY['中五']::text[], NULL, '16:45-18:00', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('6febe4d0-557d-48a2-b283-07963139d5c3'::uuid, '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科A班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('20361dec-731e-4c2f-bf0b-0b8f474361ff'::uuid, '0fc0070f-98b1-49af-869d-4a5ce0776428'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科A班MYU');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('167607d0-b816-4485-9030-ff617f8b4382'::uuid, '數學', NULL, ARRAY['中五']::text[], '星期六', '14:00-15:15', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('813935d3-09f3-4f8c-b633-6a3be4692649'::uuid, '167607d0-b816-4485-9030-ff617f8b4382'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科B班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('c5ca6855-9331-4e61-af32-2d5dd9cd75cc'::uuid, '167607d0-b816-4485-9030-ff617f8b4382'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科B班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('aeaa29b9-9ca0-43c5-954c-ee4757266a3c'::uuid, '167607d0-b816-4485-9030-ff617f8b4382'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科B班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('f93c9942-8f06-4354-9f95-30c01fd6b58d'::uuid, '167607d0-b816-4485-9030-ff617f8b4382'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科B班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('3f44050b-d295-4ed4-ae90-6f58eafdcccd'::uuid, '167607d0-b816-4485-9030-ff617f8b4382'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科B班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('b0107d72-413c-4e5b-94e0-0a4de1d14f6f'::uuid, '167607d0-b816-4485-9030-ff617f8b4382'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科B班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('6febe4d0-557d-48a2-b283-07963139d5c3'::uuid, '167607d0-b816-4485-9030-ff617f8b4382'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科B班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('20361dec-731e-4c2f-bf0b-0b8f474361ff'::uuid, '167607d0-b816-4485-9030-ff617f8b4382'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科B班MYU');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid, '數學延伸', NULL, ARRAY['中五']::text[], '星期日', '11:30-12:45', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('813935d3-09f3-4f8c-b633-6a3be4692649'::uuid, '4f7902da-2259-40bf-af6a-87f3aaa40d68'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級M2科A班TIMC');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('8e8dfabf-f571-4230-987a-53e717e9614a'::uuid, '物理', NULL, ARRAY['中五']::text[], '星期日', '14:00-15:15', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('813935d3-09f3-4f8c-b633-6a3be4692649'::uuid, '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級物理科A班THOM');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('dde027ee-458a-48b6-88d9-f1ec6d819698'::uuid, '8e8dfabf-f571-4230-987a-53e717e9614a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級物理科A班THOM');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid, '化學', NULL, ARRAY['中五']::text[], NULL, '15:15-16:30', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('20361dec-731e-4c2f-bf0b-0b8f474361ff'::uuid, 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級化學科A班SBLA');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('813935d3-09f3-4f8c-b633-6a3be4692649'::uuid, 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級化學科A班SBLA');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('aeaa29b9-9ca0-43c5-954c-ee4757266a3c'::uuid, 'eb9d88d8-cb5c-4ea5-aae2-ada9dd4a99ba'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級化學科A班SBLA');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid, '生物', NULL, ARRAY['中五']::text[], '星期五', '17:45-19:00', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('fa7e5572-9889-486d-9ea6-29d17ce33e4f'::uuid, 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級生物科A班JCHU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('b09a62d4-58b0-4ba8-a413-6263a03eec8c'::uuid, 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級生物科A班JCHU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('8b67097c-4edf-4e5a-b370-a2972e4322ef'::uuid, 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級生物科A班JCHU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('fc090614-5e34-4daf-b367-62b79b3ecb57'::uuid, 'cf2ed201-b3bf-45cc-ac38-011bd14d1c57'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級生物科A班JCHU');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('9d18b4f6-a4f5-4029-abb0-5c8926e16d19'::uuid, '中文', NULL, ARRAY['中六']::text[], NULL, '19:00-20:15', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('915602a6-c807-465f-9d8f-f66f5f070ce9'::uuid, '9d18b4f6-a4f5-4029-abb0-5c8926e16d19'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科A班CFAN');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('f98aacc3-3dcb-477c-be80-50e4286a8c4a'::uuid, '9d18b4f6-a4f5-4029-abb0-5c8926e16d19'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科A班CFAN');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('a44e6718-427b-43d1-93de-1e34ba3c4535'::uuid, '9d18b4f6-a4f5-4029-abb0-5c8926e16d19'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科A班CFAN');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('4f9e4c16-0f95-4adf-b383-593811de4c13'::uuid, '9d18b4f6-a4f5-4029-abb0-5c8926e16d19'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科A班CFAN');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid, '中文', NULL, ARRAY['中六']::text[], '星期日', '16:30-17:45', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('15b93f72-82ce-4fbe-920c-ca0c96931b6a'::uuid, '2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科B班CFAN');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('b81410b2-eb80-4af4-8d00-528ce073d5bd'::uuid, '2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科B班CFAN');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('0ae337c5-615d-476e-9cb9-1544bbb8c439'::uuid, '2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科B班CFAN');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('d86901d2-1e2e-46b6-9f09-6f770bc683cb'::uuid, '2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科B班CFAN');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('395e0b9d-acc1-4ef8-97ea-5c3ab4eb1ac8'::uuid, '2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科B班CFAN');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('99d984ce-1e92-4741-9d2a-f6b588082de4'::uuid, '2e46f56e-0265-4fae-84ff-5679015d5dba'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科B班CFAN');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('5563dfc9-cbb2-4dfb-8cc5-f3709ce0cb76'::uuid, '數學', NULL, ARRAY['中六']::text[], '星期五', '19:00-20:15', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('301a4b5e-c55d-4b4d-91d7-0bc05aada67d'::uuid, '5563dfc9-cbb2-4dfb-8cc5-f3709ce0cb76'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科A班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('395e0b9d-acc1-4ef8-97ea-5c3ab4eb1ac8'::uuid, '5563dfc9-cbb2-4dfb-8cc5-f3709ce0cb76'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科A班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('a44e6718-427b-43d1-93de-1e34ba3c4535'::uuid, '5563dfc9-cbb2-4dfb-8cc5-f3709ce0cb76'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科A班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('e2ff6f4b-ce16-4dca-8a01-82d69a552a68'::uuid, '5563dfc9-cbb2-4dfb-8cc5-f3709ce0cb76'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科A班MYU');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('370475e2-9a1e-4778-84b1-d097b4133f93'::uuid, '數學', NULL, ARRAY['中六']::text[], NULL, '16:30-17:45', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('154bec19-0f58-47ee-9a40-1d33ff0e0f2a'::uuid, '370475e2-9a1e-4778-84b1-d097b4133f93'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科B班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('411f1dad-c0d2-4205-b84e-3f342ee5c54c'::uuid, '370475e2-9a1e-4778-84b1-d097b4133f93'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科B班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('a09f0716-e546-4db0-aa69-30ff70ae6fb1'::uuid, '370475e2-9a1e-4778-84b1-d097b4133f93'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科B班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('a50f0a8f-6112-4444-9d65-f1eb29b6968f'::uuid, '370475e2-9a1e-4778-84b1-d097b4133f93'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科B班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('cc09b6ef-d2b0-437b-9d42-c2f65d9b0959'::uuid, '370475e2-9a1e-4778-84b1-d097b4133f93'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科B班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('e2ff6f4b-ce16-4dca-8a01-82d69a552a68'::uuid, '370475e2-9a1e-4778-84b1-d097b4133f93'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科B班MYU');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid, '英文', NULL, ARRAY['中五','中六']::text[], NULL, '17:45-19:00', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('915602a6-c807-465f-9d8f-f66f5f070ce9'::uuid, 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科A班CYNG');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('174c983e-7ecf-432d-acc7-c60d0fa48623'::uuid, 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科A班CYNG');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('db2d4d1b-7b41-461f-bd22-8b86e0e27014'::uuid, 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科A班CYNG');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('6febe4d0-557d-48a2-b283-07963139d5c3'::uuid, 'aaa3f0f8-bb13-4442-8e4f-27a4327f9f75'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科A班CYNG');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('1c610853-1733-40ad-90ed-5085baaea561'::uuid, '物理', NULL, ARRAY['中六']::text[], '星期日', '15:15-16:30', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('154bec19-0f58-47ee-9a40-1d33ff0e0f2a'::uuid, '1c610853-1733-40ad-90ed-5085baaea561'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級物理科A班THOM');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('05fbd9a6-0a16-48b0-81d1-df45293e23ec'::uuid, '1c610853-1733-40ad-90ed-5085baaea561'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級物理科A班THOM');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('411f1dad-c0d2-4205-b84e-3f342ee5c54c'::uuid, '1c610853-1733-40ad-90ed-5085baaea561'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級物理科A班THOM');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('36de22e8-74e0-41e0-af01-a6cfaf72651f'::uuid, '化學', NULL, ARRAY['中六']::text[], NULL, '12:45-14:00', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('2f2cbe75-b1a6-4235-b2f5-05fc3a752aa6'::uuid, '36de22e8-74e0-41e0-af01-a6cfaf72651f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級化學科A班SBLA');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('5707f4fb-4f63-4098-86d8-8682033e5859'::uuid, '36de22e8-74e0-41e0-af01-a6cfaf72651f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級化學科A班SBLA');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, '生物', NULL, ARRAY['中六']::text[], NULL, '10:15-11:30, 12:45-14:00', NULL, NULL, NULL, 440.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('2f2cbe75-b1a6-4235-b2f5-05fc3a752aa6'::uuid, '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級生物科A班JCHU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('a644ff5a-3115-47f4-ade3-7a2fca30897e'::uuid, '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級生物科A班JCHU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('0ae337c5-615d-476e-9cb9-1544bbb8c439'::uuid, '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級生物科A班JCHU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('d86901d2-1e2e-46b6-9f09-6f770bc683cb'::uuid, '1aad19f0-38ce-4787-9fbf-fa92d4774e0f'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級生物科A班JCHU');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('f1f6e81c-886e-4fa4-bf4c-7a00ed017975'::uuid, '數學', NULL, ARRAY['中一']::text[], '星期二', '16:30-17:45', NULL, NULL, NULL, 250.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid, '數學', NULL, ARRAY['中一']::text[], '星期六', '10:15-11:30', NULL, NULL, NULL, 250.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('025a1e5d-1af3-4ca9-bb2e-42e636b03ffb'::uuid, '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科B班NKWO');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('1ceb6453-02b0-4104-a9f0-8b6cabe31206'::uuid, '0ad6a2f9-a31f-4e3b-a04a-d23c3cd1e405'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科B班NKWO');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('977fb8ae-eab1-4d2e-82bd-48e6d5367aec'::uuid, '英文', NULL, ARRAY['中一','中二']::text[], '星期五', '16:30-17:45', NULL, NULL, NULL, 250.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('4669cf9a-0d02-450a-a0be-3b8907764d56'::uuid, '英文', NULL, ARRAY['中一','中二']::text[], NULL, '10:15-11:30', NULL, NULL, NULL, 250.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('0b656f33-268d-4d21-a49f-a37818134fa2'::uuid, '4669cf9a-0d02-450a-a0be-3b8907764d56'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英文科B班CYNG');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('bb8803c5-0b02-47ee-afc6-af3d0240705c'::uuid, '4669cf9a-0d02-450a-a0be-3b8907764d56'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英文科B班CYNG');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('7a68bb12-3c7e-4a6e-918d-99caa4f3427a'::uuid, '4669cf9a-0d02-450a-a0be-3b8907764d56'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英文科B班CYNG');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid, '英文', NULL, ARRAY['中一','中二']::text[], '星期日', '15:15-16:30', NULL, NULL, NULL, 250.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('0390c81e-b8b3-4d1e-a0f0-b2cdaae2c6a9'::uuid, '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英文科C班TIMC');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('2bf676ec-00e5-42b2-bd4f-26c93580c406'::uuid, '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英文科C班TIMC');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('9587f3e7-7016-49a3-841c-cf384c884c30'::uuid, '5142c9f1-a369-4ed4-a1bf-042d0f49b65b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英文科C班TIMC');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('92de0980-f7de-4766-9643-06f134cd40f1'::uuid, '科學', NULL, ARRAY['中一']::text[], '星期六', '17:45-19:00', NULL, NULL, NULL, 250.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('592bd4c6-0f2d-45e8-91fe-4d651a65130d'::uuid, '中文', NULL, ARRAY['中二']::text[], '星期一', '17:45-19:00', NULL, NULL, NULL, 250.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid, '中文', NULL, ARRAY['中二']::text[], '星期日', '14:00-15:15', NULL, NULL, NULL, 250.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('b1d2933b-0459-4f85-9e0c-dd9eb0bc403a'::uuid, '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級中文科B班CFAN');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('2fb1a637-1683-469b-849d-94ccd0a10e9f'::uuid, '43c054d8-e240-48f5-b386-c597ae30ca7d'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級中文科B班CFAN');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, '數學', NULL, ARRAY['中二']::text[], '星期四', '16:30-17:45', NULL, NULL, NULL, 250.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('c6cdae79-baa1-425e-8345-976e45c84315'::uuid, '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科A班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('86d25c49-66d0-406b-a725-5b4973f21df3'::uuid, '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科A班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('17575f59-9a5a-4d56-8e46-b75c6c2ae37c'::uuid, '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科A班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('0390c81e-b8b3-4d1e-a0f0-b2cdaae2c6a9'::uuid, '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科A班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('9587f3e7-7016-49a3-841c-cf384c884c30'::uuid, '717fc491-c5c3-4e59-a48a-ecaf23d168b5'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科A班MYU');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid, '數學', NULL, ARRAY['中二']::text[], '星期六', '11:30-12:45', NULL, NULL, NULL, 250.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('550ef8fa-8579-42a7-904c-e634a697ae5c'::uuid, 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科B班NKWO');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('7ffd3cb4-45b3-4a6b-bde3-2e9a7b5c37a0'::uuid, 'e4aa21ce-1d5e-4e6a-b13a-6e274a27a1d2'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科B班NKWO');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid, '中文', NULL, ARRAY['中三']::text[], '星期一', '19:00-20:15', NULL, NULL, NULL, 250.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('ce8c4982-bf08-4213-86f7-99292a8f70ff'::uuid, '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級中文科A班CFAN');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('2fb1a637-1683-469b-849d-94ccd0a10e9f'::uuid, '934f3f3a-5ba0-47a0-879a-3158e92416b8'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級中文科A班CFAN');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid, '數學', NULL, ARRAY['中三']::text[], '星期二', '17:45-19:00', NULL, NULL, NULL, 250.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('ce8c4982-bf08-4213-86f7-99292a8f70ff'::uuid, '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級數學科A班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('879205e4-a499-445f-86ab-ff56f3569438'::uuid, '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級數學科A班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('3e419707-1d86-4a23-b369-46e34f95957f'::uuid, '1db99818-f7fe-4e73-b8d5-c306ae33b0d2'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級數學科A班MYU');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid, '數學', NULL, ARRAY['中三']::text[], '星期六', '12:45-14:00', NULL, NULL, NULL, 250.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('28396f5a-c066-43bf-bcc6-cfd4fee72e92'::uuid, 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級數學科B班NKWO');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('5214a841-39c8-4805-8720-c20a7f202d98'::uuid, 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級數學科B班NKWO');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('4ddd2ba1-1d17-46e8-b9c3-11c38a584254'::uuid, 'e45bc7fb-1ce4-4f71-b50b-601791a48a9a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級數學科B班NKWO');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid, '英文', NULL, ARRAY['中三','中四']::text[], '星期日', '16:30-17:45', NULL, NULL, NULL, 250.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('e937c6a5-9116-44f3-a203-318c48fa6aec'::uuid, 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級英文科A班TIMC');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('ce8c4982-bf08-4213-86f7-99292a8f70ff'::uuid, 'f3f6f42a-90e4-4bf2-b92b-3f12416db9f3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級英文科A班TIMC');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid, '科學', NULL, ARRAY['中三']::text[], NULL, '14:00-15:15', NULL, NULL, NULL, 250.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('1a034fbe-7be1-4a3a-954a-0e6e371cd52f'::uuid, '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級科學科A班SBLA');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('879205e4-a499-445f-86ab-ff56f3569438'::uuid, '6e0c9d6f-029a-4966-9612-6a580ba54aeb'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級科學科A班SBLA');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('1d6c45f2-9121-47b3-af9e-db9d1b1a7d42'::uuid, '科學', NULL, ARRAY['中三']::text[], '星期日', '16:30-17:45', NULL, NULL, NULL, 250.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('1a034fbe-7be1-4a3a-954a-0e6e371cd52f'::uuid, '1d6c45f2-9121-47b3-af9e-db9d1b1a7d42'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級科學科B班THOM');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('f12744ff-26e9-4d4e-aaed-ff331c533cc3'::uuid, '功課輔導', NULL, ARRAY['中一','中三','中二','中五','中六','中四']::text[], '星期五, 星期一, 星期四, 星期二, 星期三', '15:15-16:30, 16:30-17:45, 17:45-19:00, 19:00-20:15', NULL, NULL, NULL, 1.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('a1522691-c771-4b9b-b6e5-9a3c55dcbe97'::uuid, 'f12744ff-26e9-4d4e-aaed-ff331c533cc3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（中學）');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('6858d8f8-e32f-4637-ab46-a88cef82ac45'::uuid, 'f12744ff-26e9-4d4e-aaed-ff331c533cc3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（中學）');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('e9d49e58-14b5-4e81-9630-234f2b0b6596'::uuid, 'f12744ff-26e9-4d4e-aaed-ff331c533cc3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（中學）');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('4bc8b385-a109-4479-844d-1c2b72e690c8'::uuid, 'f12744ff-26e9-4d4e-aaed-ff331c533cc3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（中學）');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('2bf676ec-00e5-42b2-bd4f-26c93580c406'::uuid, 'f12744ff-26e9-4d4e-aaed-ff331c533cc3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（中學）');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('50be3ef2-b35a-464c-8e1b-08b68658d419'::uuid, 'f12744ff-26e9-4d4e-aaed-ff331c533cc3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（中學）');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('7be42e31-ace8-44a4-a871-77d528f341f2'::uuid, 'f12744ff-26e9-4d4e-aaed-ff331c533cc3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（中學）');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('710c6327-6b24-488b-a183-11ed5b676286'::uuid, '功課輔導', NULL, ARRAY['小一','小三','小二','小五','小六','小四']::text[], '星期五, 星期一, 星期四, 星期二, 星期三', '14:15-17:45, 15:15-16:30, 16:30-17:45, 17:45-19:00', NULL, NULL, NULL, 1.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('63893559-39a1-48ab-8a11-8279e1a57b2d'::uuid, '710c6327-6b24-488b-a183-11ed5b676286'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（小學）');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('a61d62aa-44b1-4477-98be-8d7fc007f6a1'::uuid, '710c6327-6b24-488b-a183-11ed5b676286'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（小學）');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('130450c8-769f-4a59-8eda-62ba44d3de40'::uuid, '710c6327-6b24-488b-a183-11ed5b676286'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（小學）');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('b08ea99a-47d4-42c4-b689-d88150ac29ad'::uuid, '710c6327-6b24-488b-a183-11ed5b676286'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 功課輔導班（小學）');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid, '英文', NULL, ARRAY['中五','中六','中四']::text[], '星期三', '19:00-20:15', NULL, NULL, NULL, 950.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('f13c6165-aeeb-4791-ba10-a2de49b58f49'::uuid, '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 北區百人英文科星期三組');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('b0107d72-413c-4e5b-94e0-0a4de1d14f6f'::uuid, '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 北區百人英文科星期三組');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('6febe4d0-557d-48a2-b283-07963139d5c3'::uuid, '51696dbe-1d38-4112-9859-29ecb25d5a6d'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 北區百人英文科星期三組');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('730ca500-137f-4c89-86d1-c835bd0c0273'::uuid, '生物', NULL, ARRAY['中五']::text[], '星期日', '12:45-14:00', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('5174ab4c-3cf9-4640-97c8-78dd6f83c44e'::uuid, '730ca500-137f-4c89-86d1-c835bd0c0273'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級生物科B班JCHU');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('efba129c-bbfc-4ddf-ae87-7aea17ef4ac1'::uuid, '一對一', NULL, NULL, '星期二', '20:15-22:15', NULL, NULL, NULL, 825.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('789a19a5-0423-4a3c-86a4-a080aae7b952'::uuid, 'efba129c-bbfc-4ddf-ae87-7aea17ef4ac1'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 溫珏禧/中六數學一對一');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid, '英文', NULL, ARRAY['中五','中六','中四']::text[], '星期六', '14:00-15:15', NULL, NULL, NULL, 950.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('46751600-8619-4cbd-a752-13b9b81f1984'::uuid, '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 北區百人英文科星期六組');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('63bbd1bc-5be3-4535-b317-b27c183d649f'::uuid, '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 北區百人英文科星期六組');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('96136915-084f-427b-9937-7beb74bf35f4'::uuid, '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 北區百人英文科星期六組');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('bea1805a-fa1b-43bd-80b5-935d20535990'::uuid, '68e5db0d-0d0d-4b30-8b5c-24f9b3f56f73'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 北區百人英文科星期六組');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('8ad9ef5c-d638-44ad-9de0-e7e1c99b1785'::uuid, '數學', NULL, ARRAY['小五']::text[], NULL, '12:45-14:00', NULL, NULL, NULL, 200.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('57e98987-70dd-488c-9d61-44b8ac9f07e6'::uuid, '數學', NULL, ARRAY['小六']::text[], NULL, '14:00-15:15', NULL, NULL, NULL, 200.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid, '數學', NULL, ARRAY['中一']::text[], '星期日', '10:15-11:30', NULL, NULL, NULL, 250.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('ba7d09f2-5167-4418-b5ad-a83d20c67c63'::uuid, '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科C班LIAM');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('02bb5dac-c1fd-43a6-aa6b-0544929c0672'::uuid, '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科C班LIAM');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('8fd4f614-b322-4785-967c-daa035605150'::uuid, '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科C班LIAM');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('754fdd71-0513-4200-a1f4-b5051fb183c6'::uuid, '529c3dc8-81dd-44e2-a849-061c93f73d0b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科C班LIAM');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('807945d5-5ceb-4343-a937-48c34478341a'::uuid, '英文', NULL, ARRAY['中四']::text[], '星期三', '16:30-17:45, 17:45-19:00', NULL, NULL, NULL, 825.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('5eaf6c4a-eb16-4992-948d-641652fe639f'::uuid, '807945d5-5ceb-4343-a937-48c34478341a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級英文科單對單JLAU');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('53e9f56f-6e7c-4823-9cd0-387a0bb938cf'::uuid, '英文', NULL, ARRAY['中四']::text[], '星期四', '16:30-17:45, 17:45-19:00', NULL, NULL, NULL, 1100.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('6e060632-9bd7-4a69-9aa7-e4d9dea292a7'::uuid, '53e9f56f-6e7c-4823-9cd0-387a0bb938cf'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級英文科一對二JLAU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('c21d45bc-fd44-4c45-a764-2cea83e7ff57'::uuid, '53e9f56f-6e7c-4823-9cd0-387a0bb938cf'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級英文科一對二JLAU');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('8b99a415-b9fd-4602-a0b3-1b17dbb3889b'::uuid, '數學延伸', NULL, ARRAY['中四']::text[], NULL, '10:15-11:30', NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('5eaf6c4a-eb16-4992-948d-641652fe639f'::uuid, '8b99a415-b9fd-4602-a0b3-1b17dbb3889b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級M2科單對單NKWO');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('d3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, '中文', NULL, ARRAY['中一']::text[], '星期六', '12:45-14:00', NULL, NULL, NULL, 250.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('754fdd71-0513-4200-a1f4-b5051fb183c6'::uuid, 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級中文科A班SHEK');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('521bdfcb-74ff-4166-9e6f-5721ac1650f4'::uuid, 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級中文科A班SHEK');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('f9d50fe3-6546-46ff-9f67-630bfda1d63f'::uuid, 'd3bbaf3f-9465-443a-8507-19456e2e86c0'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級中文科A班SHEK');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('8d5bb98b-cccb-4806-94b3-50b2967f9fbb'::uuid, '數學', NULL, ARRAY['中三']::text[], '星期日', '17:45-19:00', NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('47694f9f-70c5-455d-aaa8-98c382ca44bd'::uuid, '英文', NULL, ARRAY['中五','中六','中四']::text[], '星期四', '19:00-20:15', NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('93560085-b304-4169-b604-0cc96af25cc8'::uuid, '企會財', NULL, ARRAY['中五']::text[], '星期五', '19:15-20:30', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('065d4b56-88e3-4063-91f1-4a4792add0c0'::uuid, '93560085-b304-4169-b604-0cc96af25cc8'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級BAFS科A班RALI');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid, '數學', NULL, ARRAY['中一']::text[], '星期六', '15:15-16:30', NULL, NULL, NULL, 625.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('d0490601-ab06-4b2f-b3e3-6e06007665c9'::uuid, 'acc8f2a0-e390-4569-bd1c-494cc176fb84'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科單對單NKWO');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('0c65c543-9ae3-4466-8847-a7ad9e079b26'::uuid, '英文', NULL, ARRAY['中四']::text[], NULL, '17:45-19:00', NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('c21d45bc-fd44-4c45-a764-2cea83e7ff57'::uuid, '0c65c543-9ae3-4466-8847-a7ad9e079b26'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級英文科一對一JLAU');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid, '生物', NULL, ARRAY['中五']::text[], '星期五', '16:30-17:45', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('0d708d45-f2c3-4edc-bf6e-f11f4f37abc0'::uuid, '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級生物科C班JCHU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('db303f37-2f92-4c35-8a7d-dd8773d1507a'::uuid, '4b932585-aee6-4d85-8d4f-53045a4ffdb5'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級生物科C班JCHU');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('2fc57346-c51f-4597-839f-9c30a8b9b65e'::uuid, '企會財', NULL, ARRAY['中五']::text[], '星期三', '14:15-17:45', NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('47b7153c-1393-4bdf-bed2-47640213ec5e'::uuid, '2fc57346-c51f-4597-839f-9c30a8b9b65e'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級BAFS科單對單RALI');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('db4b8fea-9f4a-4c76-ab83-197d9dc001d3'::uuid, '中文', NULL, ARRAY['中三']::text[], NULL, '11:30-12:45, 12:45-14:00', NULL, NULL, NULL, 250.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('ce8c4982-bf08-4213-86f7-99292a8f70ff'::uuid, 'db4b8fea-9f4a-4c76-ab83-197d9dc001d3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級聖誕中文科範文班CFAN');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('2fb1a637-1683-469b-849d-94ccd0a10e9f'::uuid, 'db4b8fea-9f4a-4c76-ab83-197d9dc001d3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級聖誕中文科範文班CFAN');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('879205e4-a499-445f-86ab-ff56f3569438'::uuid, 'db4b8fea-9f4a-4c76-ab83-197d9dc001d3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級聖誕中文科範文班CFAN');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('3dc598a6-1b70-40b1-b12f-3078e769a8d3'::uuid, '中文', NULL, ARRAY['中四']::text[], NULL, '15:15-16:30, 16:30-17:45', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('029ff376-ea0b-466e-8d78-6b71a4ca6e0e'::uuid, '3dc598a6-1b70-40b1-b12f-3078e769a8d3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級聖誕中文科範文班CFAN');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('3e92f8a4-49ab-42e9-9687-e6735b26411e'::uuid, '3dc598a6-1b70-40b1-b12f-3078e769a8d3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級聖誕中文科範文班CFAN');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('65443d7d-dd95-4dcf-8ab3-287e19edbf76'::uuid, '3dc598a6-1b70-40b1-b12f-3078e769a8d3'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級聖誕中文科範文班CFAN');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('3ee16b58-0cb7-42ea-b535-65aaa2062120'::uuid, '中文', NULL, ARRAY['中五']::text[], NULL, '11:30-12:45, 12:45-14:00', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('065d4b56-88e3-4063-91f1-4a4792add0c0'::uuid, '3ee16b58-0cb7-42ea-b535-65aaa2062120'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級聖誕中文科範文班CFAN');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('813935d3-09f3-4f8c-b633-6a3be4692649'::uuid, '3ee16b58-0cb7-42ea-b535-65aaa2062120'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級聖誕中文科範文班CFAN');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('b0107d72-413c-4e5b-94e0-0a4de1d14f6f'::uuid, '3ee16b58-0cb7-42ea-b535-65aaa2062120'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級聖誕中文科範文班CFAN');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('f415bd88-2478-4fdd-bf80-9fc70d367ad6'::uuid, '中文', NULL, ARRAY['中六']::text[], NULL, '15:15-16:30, 16:30-17:45', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('0cdc3a84-c82e-4973-9a31-73fdda276108'::uuid, '英文', NULL, ARRAY['中四']::text[], NULL, '11:30-12:45, 12:45-14:00', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('3e92f8a4-49ab-42e9-9687-e6735b26411e'::uuid, '0cdc3a84-c82e-4973-9a31-73fdda276108'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級聖誕英文科操卷班JLAU');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('ea2ce06d-6289-49d0-a377-16d3b71c9a75'::uuid, '英文', NULL, ARRAY['中五']::text[], NULL, '11:30-12:45, 12:45-14:00', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('b0107d72-413c-4e5b-94e0-0a4de1d14f6f'::uuid, 'ea2ce06d-6289-49d0-a377-16d3b71c9a75'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級聖誕英文科操卷班JLAU');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('ba53e99f-e854-49ca-8b20-d4d443ad7dbc'::uuid, '英文', NULL, ARRAY['中六']::text[], NULL, '15:15-16:30, 16:30-17:45', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('cbbb004d-eb13-43bb-84f2-27d0e931af4b'::uuid, '數學', NULL, ARRAY['中四']::text[], NULL, '11:30-12:45, 12:45-14:00', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('40740569-ed26-4b9c-9bca-1afb6eb920ab'::uuid, 'cbbb004d-eb13-43bb-84f2-27d0e931af4b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科操卷班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('029ff376-ea0b-466e-8d78-6b71a4ca6e0e'::uuid, 'cbbb004d-eb13-43bb-84f2-27d0e931af4b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科操卷班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('401580ab-61ee-4843-b86d-10bd847449b4'::uuid, 'cbbb004d-eb13-43bb-84f2-27d0e931af4b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科操卷班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('65443d7d-dd95-4dcf-8ab3-287e19edbf76'::uuid, 'cbbb004d-eb13-43bb-84f2-27d0e931af4b'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級數學科操卷班MYU');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('73dfedfd-4fe1-4b10-b9b6-aba11c4d3e89'::uuid, '數學', NULL, ARRAY['中五']::text[], NULL, '15:15-16:30, 16:30-17:45', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('813935d3-09f3-4f8c-b633-6a3be4692649'::uuid, '73dfedfd-4fe1-4b10-b9b6-aba11c4d3e89'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科操卷班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('c5ca6855-9331-4e61-af32-2d5dd9cd75cc'::uuid, '73dfedfd-4fe1-4b10-b9b6-aba11c4d3e89'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科操卷班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('35893dd5-f77e-4ef4-b6b2-4baabb14f357'::uuid, '73dfedfd-4fe1-4b10-b9b6-aba11c4d3e89'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科操卷班MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('b0107d72-413c-4e5b-94e0-0a4de1d14f6f'::uuid, '73dfedfd-4fe1-4b10-b9b6-aba11c4d3e89'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級數學科操卷班MYU');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('a4581150-905b-402b-a347-da5ca395552f'::uuid, '數學', NULL, ARRAY['中六']::text[], NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('ede15113-4017-4806-9109-3f5bee9a35d0'::uuid, '數學', NULL, ARRAY['中一']::text[], NULL, '11:30-12:45, 12:45-14:00', NULL, NULL, NULL, 250.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('025a1e5d-1af3-4ca9-bb2e-42e636b03ffb'::uuid, 'ede15113-4017-4806-9109-3f5bee9a35d0'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科操卷班NKWO');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('02bb5dac-c1fd-43a6-aa6b-0544929c0672'::uuid, 'ede15113-4017-4806-9109-3f5bee9a35d0'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科操卷班NKWO');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('ba7d09f2-5167-4418-b5ad-a83d20c67c63'::uuid, 'ede15113-4017-4806-9109-3f5bee9a35d0'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科操卷班NKWO');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('65b3e841-898a-4782-86b0-d91556a2bd15'::uuid, '數學', NULL, ARRAY['中二']::text[], NULL, '15:15-16:30, 16:30-17:45', NULL, NULL, NULL, 250.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('17575f59-9a5a-4d56-8e46-b75c6c2ae37c'::uuid, '65b3e841-898a-4782-86b0-d91556a2bd15'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科操卷班NKWO');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('bb8803c5-0b02-47ee-afc6-af3d0240705c'::uuid, '65b3e841-898a-4782-86b0-d91556a2bd15'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科操卷班NKWO');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('86d25c49-66d0-406b-a725-5b4973f21df3'::uuid, '65b3e841-898a-4782-86b0-d91556a2bd15'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科操卷班NKWO');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('d71ffd4c-b736-44b3-b346-a3250c08e445'::uuid, '數學', NULL, ARRAY['中三']::text[], NULL, '17:45-19:00, 19:00-20:15', NULL, NULL, NULL, 250.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('ce8c4982-bf08-4213-86f7-99292a8f70ff'::uuid, 'd71ffd4c-b736-44b3-b346-a3250c08e445'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級數學科操卷班NKWO');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('2fb1a637-1683-469b-849d-94ccd0a10e9f'::uuid, 'd71ffd4c-b736-44b3-b346-a3250c08e445'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級數學科操卷班NKWO');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('879205e4-a499-445f-86ab-ff56f3569438'::uuid, 'd71ffd4c-b736-44b3-b346-a3250c08e445'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級數學科操卷班NKWO');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('92db74e0-d474-44a9-a828-a157327a4262'::uuid, '其他', NULL, ARRAY['中四']::text[], NULL, '10:15-11:30, 11:30-12:45', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('3e92f8a4-49ab-42e9-9687-e6735b26411e'::uuid, '92db74e0-d474-44a9-a828-a157327a4262'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級會計理財操卷班LING');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('d0a97649-fedd-4935-a385-d798d66bbcac'::uuid, '其他', NULL, ARRAY['中五']::text[], NULL, '17:45-19:00, 19:00-20:15', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('065d4b56-88e3-4063-91f1-4a4792add0c0'::uuid, 'd0a97649-fedd-4935-a385-d798d66bbcac'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級會計理財操卷班LING');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('68ea7b56-365a-4814-9287-9e3a73596832'::uuid, '其他', NULL, ARRAY['中六']::text[], NULL, '14:00-15:15, 15:15-16:30', NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('dbdc70bd-3489-45f5-bb5c-618c378bfec4'::uuid, '英文', NULL, ARRAY['中六']::text[], NULL, '15:15-16:30', NULL, NULL, NULL, 825.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('058ed296-1bba-4bd0-8e6e-482d585fabdd'::uuid, 'dbdc70bd-3489-45f5-bb5c-618c378bfec4'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級英文科一對一JLAU');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('156e4f4b-99d6-41ea-b6c6-b17eb7d97bd5'::uuid, '數學', NULL, ARRAY['中六']::text[], NULL, '17:45-19:00', NULL, NULL, NULL, 825.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('058ed296-1bba-4bd0-8e6e-482d585fabdd'::uuid, '156e4f4b-99d6-41ea-b6c6-b17eb7d97bd5'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科一對一MYU');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('910c4b0e-0bfd-420f-a51c-523efa2d6c6a'::uuid, '英文', NULL, ARRAY['中六']::text[], NULL, '14:00-15:15', NULL, NULL, NULL, 550.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('bdf4ef17-29f2-4d92-8ea9-ab06b9e47f1d'::uuid, '910c4b0e-0bfd-420f-a51c-523efa2d6c6a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級英文科一對二CYNG');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('f11cc305-e7d8-4296-a524-421d7d53212f'::uuid, '910c4b0e-0bfd-420f-a51c-523efa2d6c6a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級英文科一對二CYNG');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('cee13d56-4e2b-4db3-900f-de73fc6d55e9'::uuid, '化學', NULL, ARRAY['中四']::text[], NULL, '16:30-17:45', NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('f4317920-332c-445a-930d-7a5c230051e8'::uuid, 'cee13d56-4e2b-4db3-900f-de73fc6d55e9'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] （試）中四級化學科一對一SBLA');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('fead5fb9-d4db-4fc3-8127-ec9bce4db378'::uuid, '物理', NULL, ARRAY['中五','中六']::text[], NULL, '17:45-19:00', NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('dde027ee-458a-48b6-88d9-f1ec6d819698'::uuid, 'fead5fb9-d4db-4fc3-8127-ec9bce4db378'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級物理科A班THOM');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('813935d3-09f3-4f8c-b633-6a3be4692649'::uuid, 'fead5fb9-d4db-4fc3-8127-ec9bce4db378'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級物理科A班THOM');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('154bec19-0f58-47ee-9a40-1d33ff0e0f2a'::uuid, 'fead5fb9-d4db-4fc3-8127-ec9bce4db378'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級物理科A班THOM');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('082ae102-2471-45f5-b1c7-676e2743dca3'::uuid, 'fead5fb9-d4db-4fc3-8127-ec9bce4db378'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級物理科A班THOM');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('d8c9bf2f-94d2-4093-b0d6-4467b6862e0e'::uuid, '中文', NULL, ARRAY['中五']::text[], NULL, '15:15-16:30', NULL, NULL, NULL, 825.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('47b7153c-1393-4bdf-bed2-47640213ec5e'::uuid, 'd8c9bf2f-94d2-4093-b0d6-4467b6862e0e'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五莊靖思中文科單對單');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('79750fc8-881b-4c96-a193-5d9f86e48841'::uuid, '生物', NULL, NULL, NULL, '17:45-19:00', NULL, NULL, NULL, 825.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('47b7153c-1393-4bdf-bed2-47640213ec5e'::uuid, '79750fc8-881b-4c96-a193-5d9f86e48841'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五莊靖思生物科單對單');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('0b4faead-d8e5-47e1-9279-47b05db9c510'::uuid, '物理', NULL, ARRAY['中五']::text[], NULL, '16:30-17:45, 17:45-19:00', NULL, NULL, NULL, 825.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('47b7153c-1393-4bdf-bed2-47640213ec5e'::uuid, '0b4faead-d8e5-47e1-9279-47b05db9c510'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五莊靖思物理科單對單');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('cde0c431-6fac-4f56-9fa6-0c54232018dd'::uuid, '企會財', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 825.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('47b7153c-1393-4bdf-bed2-47640213ec5e'::uuid, 'cde0c431-6fac-4f56-9fa6-0c54232018dd'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五莊靖思BAFS科單對單');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('7e2fb4b6-2491-4559-81bb-b9225386d10c'::uuid, '數學', NULL, ARRAY['中一']::text[], NULL, '11:30-12:45', NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('02bb5dac-c1fd-43a6-aa6b-0544929c0672'::uuid, '7e2fb4b6-2491-4559-81bb-b9225386d10c'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科加堂Liam');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('ba7d09f2-5167-4418-b5ad-a83d20c67c63'::uuid, '7e2fb4b6-2491-4559-81bb-b9225386d10c'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科加堂Liam');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('e91efcb2-38b5-4fb2-8365-0819538c3f12'::uuid, '數學', NULL, ARRAY['中二']::text[], '星期二', '16:30-17:45', NULL, NULL, NULL, 250.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('3a22fc95-e268-4a8c-abbb-4bd43ac9194d'::uuid, 'e91efcb2-38b5-4fb2-8365-0819538c3f12'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科C班LIAM');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('667ead37-34fc-4be7-bf70-fd4eda66ca8d'::uuid, 'e91efcb2-38b5-4fb2-8365-0819538c3f12'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級數學科C班LIAM');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('aa37bed4-d043-46d2-9436-4026a5fed3c4'::uuid, '數學', NULL, ARRAY['中一']::text[], '星期四', '18:00-19:15', NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('d0490601-ab06-4b2f-b3e3-6e06007665c9'::uuid, 'aa37bed4-d043-46d2-9436-4026a5fed3c4'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一級數學科單對單NKWO');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('dd7efe15-8367-48f1-a974-1a06828c1369'::uuid, '中文', NULL, ARRAY['中四']::text[], NULL, '15:15-16:30', NULL, NULL, NULL, 825.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('5eaf6c4a-eb16-4992-948d-641652fe639f'::uuid, 'dd7efe15-8367-48f1-a974-1a06828c1369'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 林家綺中文科單對單 CFAN');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('649fcde3-4df4-424d-a957-9f26f4ded592'::uuid, '一對一', NULL, ARRAY['中六']::text[], '星期二', '19:00-20:15', NULL, NULL, NULL, 825.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('50d43ef7-b5a2-46a4-9925-2073ddb055f9'::uuid, '649fcde3-4df4-424d-a957-9f26f4ded592'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 俞逸軒一對一 MYU');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('b5c60417-3f1d-4000-8299-f6680f9a2944'::uuid, '英文', NULL, ARRAY['中五','中四']::text[], '星期日', '11:30-12:45', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('f93c9942-8f06-4354-9f95-30c01fd6b58d'::uuid, 'b5c60417-3f1d-4000-8299-f6680f9a2944'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科A班CYNG');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('2d75a8f3-7d21-49e3-985c-6b7defb351fc'::uuid, 'b5c60417-3f1d-4000-8299-f6680f9a2944'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科A班CYNG');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('5174ab4c-3cf9-4640-97c8-78dd6f83c44e'::uuid, 'b5c60417-3f1d-4000-8299-f6680f9a2944'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科A班CYNG');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('c5ca6855-9331-4e61-af32-2d5dd9cd75cc'::uuid, 'b5c60417-3f1d-4000-8299-f6680f9a2944'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文科A班CYNG');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('deb57e70-77f2-4c4c-a928-f1b4476fc9bd'::uuid, '英文', NULL, ARRAY['中五','中四']::text[], '星期日', '15:15-16:30', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('e850f4ce-0e20-4280-9d14-b5f85b39dcdc'::uuid, 'deb57e70-77f2-4c4c-a928-f1b4476fc9bd'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文B班CYNG');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('813935d3-09f3-4f8c-b633-6a3be4692649'::uuid, 'deb57e70-77f2-4c4c-a928-f1b4476fc9bd'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文B班CYNG');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('6febe4d0-557d-48a2-b283-07963139d5c3'::uuid, 'deb57e70-77f2-4c4c-a928-f1b4476fc9bd'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四五級英文B班CYNG');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('a6c8ad0f-ca36-43cd-86af-5e37b883d8da'::uuid, '英文', NULL, ARRAY['中一','中二']::text[], '星期日', '10:15-11:30', NULL, NULL, NULL, 250.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('7a68bb12-3c7e-4a6e-918d-99caa4f3427a'::uuid, 'a6c8ad0f-ca36-43cd-86af-5e37b883d8da'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英B班CYNG');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('0b656f33-268d-4d21-a49f-a37818134fa2'::uuid, 'a6c8ad0f-ca36-43cd-86af-5e37b883d8da'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英B班CYNG');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('bb8803c5-0b02-47ee-afc6-af3d0240705c'::uuid, 'a6c8ad0f-ca36-43cd-86af-5e37b883d8da'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英B班CYNG');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('f9d50fe3-6546-46ff-9f67-630bfda1d63f'::uuid, 'a6c8ad0f-ca36-43cd-86af-5e37b883d8da'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英B班CYNG');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('b98e410e-09c5-45e7-a18d-d120ffc95867'::uuid, 'a6c8ad0f-ca36-43cd-86af-5e37b883d8da'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中一二級英B班CYNG');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid, '一對一', NULL, NULL, '星期日', '12:45-14:00', NULL, NULL, NULL, 825.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('c73ff545-d4b8-4b06-9972-a076406b406a'::uuid, 'ccb0e36e-a62e-405b-ad5d-5d227e49e63e'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 陳煒傑一對一CYND');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('6a0ea666-8d20-4ea2-8b27-8d2ae34d6291'::uuid, '其他', NULL, ARRAY['中一']::text[], NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('7ad272a3-df88-42c9-bbac-0cbfdb4e9b60'::uuid, '中文', NULL, ARRAY['中六']::text[], '星期五, 星期一', '15:15-16:30', NULL, NULL, NULL, 825.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('f7c8f44b-990d-4d06-b80b-3e050aec614c'::uuid, '7ad272a3-df88-42c9-bbac-0cbfdb4e9b60'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科一對一CFAN');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('0b5604fb-34d8-4640-bc38-2b4612f9127a'::uuid, '數學', NULL, ARRAY['中六']::text[], NULL, '11:30-12:45', NULL, NULL, NULL, 550.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('223038a1-164b-482a-9408-1007dc373467'::uuid, '0b5604fb-34d8-4640-bc38-2b4612f9127a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科一對二 MYU');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('174c983e-7ecf-432d-acc7-c60d0fa48623'::uuid, '0b5604fb-34d8-4640-bc38-2b4612f9127a'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級數學科一對二 MYU');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('acc7a821-d638-4f4c-a038-67537315d407'::uuid, '中文', NULL, ARRAY['中二']::text[], NULL, '16:30-17:45', NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('6858d8f8-e32f-4637-ab46-a88cef82ac45'::uuid, 'acc7a821-d638-4f4c-a038-67537315d407'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 智珩功課班 Rain');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('6306a7c6-0a03-4ec4-80be-38defa69d83c'::uuid, '化學', NULL, ARRAY['中六']::text[], '星期六', '12:45-14:00', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('2b90d95e-123b-461f-84ed-e4a30f0e8e63'::uuid, '化學', NULL, ARRAY['中五']::text[], '星期六', '15:15-16:30', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('20361dec-731e-4c2f-bf0b-0b8f474361ff'::uuid, '2b90d95e-123b-461f-84ed-e4a30f0e8e63'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級化學科A班PHBE');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('813935d3-09f3-4f8c-b633-6a3be4692649'::uuid, '2b90d95e-123b-461f-84ed-e4a30f0e8e63'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級化學科A班PHBE');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('aeaa29b9-9ca0-43c5-954c-ee4757266a3c'::uuid, '2b90d95e-123b-461f-84ed-e4a30f0e8e63'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級化學科A班PHBE');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('ab9da3b1-2632-44fe-8a88-d90c8c62e741'::uuid, '化學', NULL, ARRAY['中四']::text[], '星期六', '11:30-12:45', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('21627141-68b0-4be0-a072-8cc7c4878654'::uuid, '科學', NULL, ARRAY['中二']::text[], '星期六', '10:15-11:30', NULL, NULL, NULL, 250.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('b1d2933b-0459-4f85-9e0c-dd9eb0bc403a'::uuid, '21627141-68b0-4be0-a072-8cc7c4878654'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級科學A班 PHEB');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('c6cdae79-baa1-425e-8345-976e45c84315'::uuid, '21627141-68b0-4be0-a072-8cc7c4878654'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級科學A班 PHEB');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('17575f59-9a5a-4d56-8e46-b75c6c2ae37c'::uuid, '21627141-68b0-4be0-a072-8cc7c4878654'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級科學A班 PHEB');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('b6fca624-1e15-4dc1-9799-d711ee6b97d9'::uuid, '科學', NULL, ARRAY['中三']::text[], '星期六', '14:00-15:15', NULL, NULL, NULL, 250.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('1a034fbe-7be1-4a3a-954a-0e6e371cd52f'::uuid, 'b6fca624-1e15-4dc1-9799-d711ee6b97d9'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級科學科A班PHEB');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('210ee57a-12af-415e-8543-73862201a136'::uuid, '中文', NULL, ARRAY['中二']::text[], '星期一', '16:30-17:45', NULL, NULL, NULL, 250.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('86d25c49-66d0-406b-a725-5b4973f21df3'::uuid, '210ee57a-12af-415e-8543-73862201a136'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中二級中文科A班 SHEK');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid, '企會財', NULL, ARRAY['中四']::text[], '星期日', '10:15-11:30', NULL, NULL, NULL, 275.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('95574867-771a-4264-a7b3-d58a31247b08'::uuid, '6ee1adfc-32ce-4d14-80e8-71421fbc1692'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中四級BAFS科A班 Rafael');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('38bdec8b-3b0e-4318-939e-cbe0d477aa61'::uuid, '其他', NULL, ARRAY['中二']::text[], NULL, '19:00-20:15', NULL, NULL, NULL, 825.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('d199899c-a7a1-4ee7-a4b8-7138f702a1b2'::uuid, '38bdec8b-3b0e-4318-939e-cbe0d477aa61'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 馮記昰一對一Kenneth');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('45df6f39-9f7d-4313-a86e-7d56f6d1cf54'::uuid, '物理', NULL, ARRAY['中三']::text[], '星期一', '20:00-21:15', NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('0eca10e9-ab38-41a0-8d11-c9468f5afddb'::uuid, '45df6f39-9f7d-4313-a86e-7d56f6d1cf54'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中三級物理科單對單THOM');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('555a62d7-edc1-4e19-83b1-7a52b6048a88'::uuid, '中文', NULL, ARRAY['中六']::text[], NULL, '16:15-17:30, 17:30-18:45', NULL, NULL, NULL, 825.0, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('058ed296-1bba-4bd0-8e6e-482d585fabdd'::uuid, '555a62d7-edc1-4e19-83b1-7a52b6048a88'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中六級中文科一對一 CFAN');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid, '英文', NULL, ARRAY['中五']::text[], '星期日', '14:00-15:15', NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');
INSERT INTO public.student_class_enrollments (student_id, class_id, status, enroll_date, remarks) VALUES ('6febe4d0-557d-48a2-b283-07963139d5c3'::uuid, '6945a843-c440-44e5-a5c7-9fa0435ab410'::uuid, '就讀中', '2025-09-01'::date, '[2526匯入] 中五級英文科一對一 CYNG');

INSERT INTO public.classes (id, subject, course_code, grade, day_of_week, time_slot, teacher_id, classroom_id, capacity, price_per_lesson, start_date, end_date, status) VALUES ('de8fd3fa-595d-40e2-8428-19be5ad62e50'::uuid, '英文', NULL, ARRAY['中五']::text[], NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-01'::date, '2026-08-31'::date, '進行中');

COMMIT;