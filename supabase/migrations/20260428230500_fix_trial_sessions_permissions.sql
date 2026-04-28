-- 修復 trial_sessions 權限（點名頁讀取試堂名單 permission denied）

alter table public.trial_sessions enable row level security;

drop policy if exists dev_anon_all_trial_sessions on public.trial_sessions;
drop policy if exists dev_auth_all_trial_sessions on public.trial_sessions;

create policy dev_anon_all_trial_sessions
on public.trial_sessions
for all
to anon
using (true)
with check (true);

create policy dev_auth_all_trial_sessions
on public.trial_sessions
for all
to authenticated
using (true)
with check (true);

grant select, insert, update, delete on table public.trial_sessions to anon, authenticated;
