-- payment_discounts：管理層（admin／manager／alien）可讀目錄名稱
-- 先前只准 is_admin()／is_alien()；manager 讀到 applications 但 join 不到目錄名，
-- 前端會把有金額的目錄優惠誤顯示成 Special discount。

drop policy if exists rls_phase_c_admin_select_payment_discounts on public.payment_discounts;
drop policy if exists rls_mgmt_select_payment_discounts on public.payment_discounts;

create policy rls_mgmt_select_payment_discounts
on public.payment_discounts
for select
to authenticated
using (public.is_mgmt_staff());

comment on policy rls_mgmt_select_payment_discounts on public.payment_discounts is
  'admin／manager／alien 可讀優惠目錄（收款表單、歷史列表／收據顯示原名）；寫入仍僅 alien。';
