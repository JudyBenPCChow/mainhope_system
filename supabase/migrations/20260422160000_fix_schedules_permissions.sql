-- 修復 schedules 權限（更新排程時 permission denied）
-- 補齊 RLS 開發用政策與 anon、authenticated 表層級 grant

alter table public.schedules enable row level security;

drop policy if exists dev_anon_all_schedules on public.schedules;
drop policy if exists dev_auth_all_schedules on public.schedules;

create policy dev_anon_all_schedules
on public.schedules
for all
to anon
using (true)
with check (true);

create policy dev_auth_all_schedules
on public.schedules
for all
to authenticated
using (true)
with check (true);

grant select, insert, update, delete on table public.schedules to anon, authenticated;
