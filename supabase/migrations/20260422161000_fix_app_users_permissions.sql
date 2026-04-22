-- 修復 app_users 權限（用戶管理列表 permission denied 等）
-- 補齊 RLS 開發用政策與 anon、authenticated 表層級 grant

alter table public.app_users enable row level security;

drop policy if exists dev_anon_all_app_users on public.app_users;
drop policy if exists dev_auth_all_app_users on public.app_users;

create policy dev_anon_all_app_users
on public.app_users
for all
to anon
using (true)
with check (true);

create policy dev_auth_all_app_users
on public.app_users
for all
to authenticated
using (true)
with check (true);

grant select, insert, update, delete on table public.app_users to anon, authenticated;
