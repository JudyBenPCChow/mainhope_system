-- 常用功能預設捷徑可按帳戶移走（換裝置仍保留）

begin;

alter table public.app_user_pinned_pages
  add column if not exists hidden_defaults text[] not null default '{}'::text[];

alter table public.app_user_pinned_pages
  drop constraint if exists app_user_pinned_pages_hidden_defaults_len;

alter table public.app_user_pinned_pages
  add constraint app_user_pinned_pages_hidden_defaults_len
  check (cardinality(hidden_defaults) <= 12);

comment on column public.app_user_pinned_pages.hidden_defaults is
  '從常用功能移走的預設捷徑路徑。僅本人可讀寫。';

commit;
