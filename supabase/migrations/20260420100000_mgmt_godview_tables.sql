-- 外星人「上帝視角」：管理後台稽核與系統錯誤紀錄（開發用 RLS 與 baseline 一致）

create table if not exists public.mgmt_audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_label text not null,
  role text not null,
  action text not null,
  path text,
  detail text
);

create index if not exists mgmt_audit_log_created_at_idx on public.mgmt_audit_log (created_at desc);

create table if not exists public.mgmt_system_errors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  severity text not null default 'error',
  source text not null,
  message text not null,
  detail text,
  resolved_at timestamptz
);

create index if not exists mgmt_system_errors_created_at_idx on public.mgmt_system_errors (created_at desc);

alter table public.mgmt_audit_log enable row level security;
alter table public.mgmt_system_errors enable row level security;

drop policy if exists dev_anon_all_mgmt_audit_log on public.mgmt_audit_log;
drop policy if exists dev_auth_all_mgmt_audit_log on public.mgmt_audit_log;
create policy dev_anon_all_mgmt_audit_log on public.mgmt_audit_log for all to anon using (true) with check (true);
create policy dev_auth_all_mgmt_audit_log on public.mgmt_audit_log for all to authenticated using (true) with check (true);

drop policy if exists dev_anon_all_mgmt_system_errors on public.mgmt_system_errors;
drop policy if exists dev_auth_all_mgmt_system_errors on public.mgmt_system_errors;
create policy dev_anon_all_mgmt_system_errors on public.mgmt_system_errors for all to anon using (true) with check (true);
create policy dev_auth_all_mgmt_system_errors on public.mgmt_system_errors for all to authenticated using (true) with check (true);

grant all on table public.mgmt_audit_log to anon, authenticated;
grant all on table public.mgmt_system_errors to anon, authenticated;
