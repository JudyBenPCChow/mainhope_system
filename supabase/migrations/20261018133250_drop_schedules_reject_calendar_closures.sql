-- 校舍假期改為可人手排程（補堂／加堂／調堂）；批量仍預設跳過。
-- 拿掉 20260902040000 的硬擋；「假期 ≠ 取消堂」定義不變。
-- 套用：npm run db:apply -- supabase/migrations/20261018133250_drop_schedules_reject_calendar_closures.sql

begin;

drop trigger if exists trg_schedules_reject_academic_calendar_closures on public.schedules;
drop function if exists public.schedules_reject_academic_calendar_closures();

commit;
