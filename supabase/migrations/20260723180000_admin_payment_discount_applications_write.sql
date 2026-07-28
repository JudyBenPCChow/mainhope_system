-- Fix: admin must INSERT payment_discount_applications when collecting payments with discounts.
-- Catalog (payment_discounts) stays alien-write / admin-read; applications follow is_mgmt_staff().

drop policy if exists rls_phase_c_alien_all_payment_discount_applications on public.payment_discount_applications;
drop policy if exists rls_phase_c_admin_select_payment_discount_applications on public.payment_discount_applications;
drop policy if exists rls_mgmt_all_payment_discount_applications on public.payment_discount_applications;

create policy rls_mgmt_all_payment_discount_applications
on public.payment_discount_applications
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());
