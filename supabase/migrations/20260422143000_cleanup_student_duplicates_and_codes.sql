-- 依管理指示：合併重複學生、修正重號學號（2026-04-22）
-- 1) 李婉筠、黃詩晗改新學號（黃詩怡保留 SNFNL0395、李苡澄保留 SNFNL0396）
-- 2) 刪除重複建檔之學生列（張以諾、陳冠錡、王晴怡、黃渲棋）

-- 新學號（當時資料庫未占用 SNFNL0459 / SNFNL0460）
update public.students
set student_code = 'SNFNL0459', updated_at = now()
where id = '3078de17-7201-4f7d-8798-6056f24e04cc'::uuid
  and full_name = '李婉筠'
  and student_code = 'SNFNL0395';

update public.students
set student_code = 'SNFNL0460', updated_at = now()
where id = '3f4d1ae9-3d5a-46d9-847e-0824350b7cc7'::uuid
  and full_name = '黃詩晗'
  and student_code = 'SNFNL0396';

-- 張以諾：保留「正式注冊」列，刪 active 重複
delete from public.students
where id = '97499b75-9aae-400d-a9cc-e3fafe9d55a5'::uuid
  and full_name = '張以諾';

-- 陳冠錡：刪一留一（保留 95b040a2…）
delete from public.students
where id = 'a62ec724-8ef9-4d57-8664-b99e4c5e64b1'::uuid
  and full_name = '陳冠錡';

-- 王晴怡：保留有學號 SNFNL0356
delete from public.students
where id = 'e21203db-e8a4-4aad-ae69-255845ea7111'::uuid
  and full_name = '王晴怡';

-- 黃渲棋：只保留 SNFNL0448
delete from public.students
where id = '94ec6eea-2937-41ee-8b8f-f4e97e500cac'::uuid
  and full_name = '黃渲棋';
