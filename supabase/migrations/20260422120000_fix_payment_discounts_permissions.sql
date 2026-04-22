-- 修復 payment_discounts 權限問題（避免 permission denied）
-- 針對目前專案的前端 anon/authenticated 角色，補齊 RLS 與表權限

alter table public.payment_discounts enable row level security;

drop policy if exists dev_anon_all_payment_discounts on public.payment_discounts;
drop policy if exists dev_auth_all_payment_discounts on public.payment_discounts;

create policy dev_anon_all_payment_discounts
on public.payment_discounts
for all
to anon
using (true)
with check (true);

create policy dev_auth_all_payment_discounts
on public.payment_discounts
for all
to authenticated
using (true)
with check (true);

grant select, insert, update, delete on table public.payment_discounts to anon, authenticated;
