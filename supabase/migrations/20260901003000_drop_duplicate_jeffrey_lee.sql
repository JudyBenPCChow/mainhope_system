-- 2026-08-29 連續建咗兩個 Jeffrey Lee。保留有登入／功輔側欄嗰個。
-- 套用：npm run db:apply -- supabase/migrations/20260901003000_drop_duplicate_jeffrey_lee.sql

begin;

-- keep: 2e37b7d1-096f-4b76-abeb-d1d0d2e883c5（jlee@mainhope.edu.hk、homework_tutoring_nav）
delete from public.teachers t
where t.id = 'adcfed4a-19bf-40d4-89ea-d38aa57fbd7e'
  and t.full_name = 'Jeffrey Lee'
  and not exists (select 1 from public.classes c where c.teacher_id = t.id)
  and not exists (select 1 from public.schedules s where s.teacher_id = t.id)
  and not exists (select 1 from public.app_users au where au.teacher_id = t.id);

commit;
