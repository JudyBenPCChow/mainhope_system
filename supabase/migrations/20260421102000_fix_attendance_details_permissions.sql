-- 修復 attendance_details 權限問題（避免 permission denied）
-- 針對目前專案的前端 anon/authenticated 角色，補齊 RLS 與表權限

alter table public.attendance_details enable row level security;

drop policy if exists dev_anon_all_attendance_details on public.attendance_details;
drop policy if exists dev_auth_all_attendance_details on public.attendance_details;

create policy dev_anon_all_attendance_details
on public.attendance_details
for all
to anon
using (true)
with check (true);

create policy dev_auth_all_attendance_details
on public.attendance_details
for all
to authenticated
using (true)
with check (true);

grant select, insert, update, delete on table public.attendance_details to anon, authenticated;
