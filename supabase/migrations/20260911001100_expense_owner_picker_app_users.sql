-- 日記帳「負責人」下拉：有 expenses.record 可讀行政／管理層／財務的 app_users 顯示名
-- （老師名單仍走 teachers 表；本政策只補非老師職員。）
-- 套用：npm run db:apply -- supabase/migrations/20260911001100_expense_owner_picker_app_users.sql

begin;

drop policy if exists rls_expense_owner_picker_app_users on public.app_users;

create policy rls_expense_owner_picker_app_users
on public.app_users
for select
to authenticated
using (
  private.has_capability('expenses.record')
  and role in ('admin', 'manager', 'finance')
);

comment on policy rls_expense_owner_picker_app_users on public.app_users is
  '日記帳負責人選單：expenses.record 可讀行政／管理層／財務列（顯示名）。';

commit;
