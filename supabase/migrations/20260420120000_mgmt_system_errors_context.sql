-- 報錯與問題：可選使用者／角色／路徑，供外星人篩選

alter table public.mgmt_system_errors
  add column if not exists actor_label text,
  add column if not exists role text,
  add column if not exists path text;
