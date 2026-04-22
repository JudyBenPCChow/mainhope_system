-- 修復 student_relationships 權限（新增親友時 permission denied）
-- 補齊 RLS 開發用政策與 anon、authenticated 表層級 grant

alter table public.student_relationships enable row level security;

drop policy if exists dev_anon_all_student_relationships on public.student_relationships;
drop policy if exists dev_auth_all_student_relationships on public.student_relationships;

create policy dev_anon_all_student_relationships
on public.student_relationships
for all
to anon
using (true)
with check (true);

create policy dev_auth_all_student_relationships
on public.student_relationships
for all
to authenticated
using (true)
with check (true);

grant select, insert, update, delete on table public.student_relationships to anon, authenticated;
