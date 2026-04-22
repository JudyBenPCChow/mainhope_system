-- 若未經 migration 流程，可直接於 SQL Editor 執行本檔。
-- 修復 student_relationships 權限（新增親友時 permission denied）

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
