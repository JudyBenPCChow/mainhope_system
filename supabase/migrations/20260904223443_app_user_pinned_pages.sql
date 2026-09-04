-- 各 app_users 帳戶自己的釘選頁面（換裝置仍保留）

begin;

create table if not exists public.app_user_pinned_pages (
  app_user_id uuid primary key references public.app_users (id) on delete cascade,
  paths text[] not null default '{}'::text[],
  updated_at timestamptz not null default now(),
  constraint app_user_pinned_pages_paths_len check (cardinality(paths) <= 12)
);

comment on table public.app_user_pinned_pages is
  '後台用戶釘選頁路徑（最多 12）。僅本人可讀寫。';

alter table public.app_user_pinned_pages enable row level security;

drop policy if exists app_user_pinned_pages_own_select on public.app_user_pinned_pages;
drop policy if exists app_user_pinned_pages_own_insert on public.app_user_pinned_pages;
drop policy if exists app_user_pinned_pages_own_update on public.app_user_pinned_pages;
drop policy if exists app_user_pinned_pages_own_delete on public.app_user_pinned_pages;

create policy app_user_pinned_pages_own_select
on public.app_user_pinned_pages
for select
to authenticated
using (app_user_id = public.current_app_user_id());

create policy app_user_pinned_pages_own_insert
on public.app_user_pinned_pages
for insert
to authenticated
with check (app_user_id = public.current_app_user_id());

create policy app_user_pinned_pages_own_update
on public.app_user_pinned_pages
for update
to authenticated
using (app_user_id = public.current_app_user_id())
with check (app_user_id = public.current_app_user_id());

create policy app_user_pinned_pages_own_delete
on public.app_user_pinned_pages
for delete
to authenticated
using (app_user_id = public.current_app_user_id());

revoke all on table public.app_user_pinned_pages from public, anon;
grant select, insert, update, delete on table public.app_user_pinned_pages to authenticated;

commit;
