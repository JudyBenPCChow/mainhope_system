-- 修復 teachers 權限（儲存老師資料時 permission denied for table teachers）
-- 補齊 RLS 開發用政策與 anon、authenticated 表層級 grant

alter table public.teachers enable row level security;

drop policy if exists dev_anon_all_teachers on public.teachers;
drop policy if exists dev_auth_all_teachers on public.teachers;

create policy dev_anon_all_teachers
on public.teachers
for all
to anon
using (true)
with check (true);

create policy dev_auth_all_teachers
on public.teachers
for all
to authenticated
using (true)
with check (true);

grant select, insert, update, delete on table public.teachers to anon, authenticated;
