-- 若未透過 migration 流程，可直接在 SQL Editor 執行本檔。
-- 修復 classroom_booking_requests 權限（約房審批 permission denied）

alter table public.classroom_booking_requests enable row level security;

drop policy if exists dev_anon_all_classroom_booking_requests on public.classroom_booking_requests;
drop policy if exists dev_auth_all_classroom_booking_requests on public.classroom_booking_requests;

create policy dev_anon_all_classroom_booking_requests
on public.classroom_booking_requests
for all
to anon
using (true)
with check (true);

create policy dev_auth_all_classroom_booking_requests
on public.classroom_booking_requests
for all
to authenticated
using (true)
with check (true);

grant select, insert, update, delete on table public.classroom_booking_requests to anon, authenticated;
