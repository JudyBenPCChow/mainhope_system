-- 修復 students 權限（刪除／寫入時 permission denied）
-- 補齊 RLS 開發用政策與 anon、authenticated 表層級 grant

alter table public.students enable row level security;

drop policy if exists dev_anon_all_students on public.students;
drop policy if exists dev_auth_all_students on public.students;

create policy dev_anon_all_students
on public.students
for all
to anon
using (true)
with check (true);

create policy dev_auth_all_students
on public.students
for all
to authenticated
using (true)
with check (true);

grant select, insert, update, delete on table public.students to anon, authenticated;
