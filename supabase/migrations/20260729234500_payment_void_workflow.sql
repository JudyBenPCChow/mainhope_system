-- 收款單據作廢：軟狀態欄位、禁硬刪 RLS、禁止救回／改金額
-- 可重複執行（部分套用失敗後可再跑）

alter table public.payments
  add column if not exists voided_at timestamptz,
  add column if not exists voided_by_email text,
  add column if not exists voided_by_name text,
  add column if not exists void_reason text;

comment on column public.payments.voided_at is '作廢時間；NULL 表示未作廢';
comment on column public.payments.voided_by_email is '作廢操作者電郵';
comment on column public.payments.voided_by_name is '作廢操作者顯示名稱';
comment on column public.payments.void_reason is '作廢原因';

-- 已作廢列：禁止改回其他狀態或改金額／單號／日期等關鍵欄
create or replace function public.payments_prevent_void_revive()
returns trigger
language plpgsql
as $$
begin
  if old.status = '作廢' then
    if new.status is distinct from '作廢'
       or new.total_amount is distinct from old.total_amount
       or new.subtotal_amount is distinct from old.subtotal_amount
       or new.receipt_number is distinct from old.receipt_number
       or new.payment_date is distinct from old.payment_date
       or new.student_id is distinct from old.student_id
    then
      raise exception '已作廢單據不可修改狀態、金額或單號；請另開新單。';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_payments_prevent_void_revive on public.payments;
create trigger trg_payments_prevent_void_revive
  before update on public.payments
  for each row
  execute function public.payments_prevent_void_revive();

-- mgmt：保留 SELECT／INSERT／UPDATE，撤銷 DELETE（作廢改走 service role Edge Function）
drop policy if exists rls_phase_b_mgmt_all_payments on public.payments;
drop policy if exists rls_phase_b_mgmt_select_payments on public.payments;
drop policy if exists rls_phase_b_mgmt_insert_payments on public.payments;
drop policy if exists rls_phase_b_mgmt_update_payments on public.payments;

create policy rls_phase_b_mgmt_select_payments
  on public.payments
  for select
  to authenticated
  using (public.is_mgmt_staff());

create policy rls_phase_b_mgmt_insert_payments
  on public.payments
  for insert
  to authenticated
  with check (public.is_mgmt_staff());

create policy rls_phase_b_mgmt_update_payments
  on public.payments
  for update
  to authenticated
  using (public.is_mgmt_staff())
  with check (public.is_mgmt_staff());

-- 明細／優惠申請：同樣禁 DELETE，避免繞過作廢清掉痕跡
drop policy if exists rls_phase_b_mgmt_all_payment_details on public.payment_details;
drop policy if exists rls_phase_b_mgmt_select_payment_details on public.payment_details;
drop policy if exists rls_phase_b_mgmt_insert_payment_details on public.payment_details;
drop policy if exists rls_phase_b_mgmt_update_payment_details on public.payment_details;

create policy rls_phase_b_mgmt_select_payment_details
  on public.payment_details
  for select
  to authenticated
  using (public.is_mgmt_staff());

create policy rls_phase_b_mgmt_insert_payment_details
  on public.payment_details
  for insert
  to authenticated
  with check (public.is_mgmt_staff());

create policy rls_phase_b_mgmt_update_payment_details
  on public.payment_details
  for update
  to authenticated
  using (public.is_mgmt_staff())
  with check (public.is_mgmt_staff());

drop policy if exists rls_phase_b_mgmt_all_payment_discount_applications
  on public.payment_discount_applications;
drop policy if exists rls_phase_b_mgmt_select_payment_discount_applications
  on public.payment_discount_applications;
drop policy if exists rls_phase_b_mgmt_insert_payment_discount_applications
  on public.payment_discount_applications;
drop policy if exists rls_phase_b_mgmt_update_payment_discount_applications
  on public.payment_discount_applications;

create policy rls_phase_b_mgmt_select_payment_discount_applications
  on public.payment_discount_applications
  for select
  to authenticated
  using (public.is_mgmt_staff());

create policy rls_phase_b_mgmt_insert_payment_discount_applications
  on public.payment_discount_applications
  for insert
  to authenticated
  with check (public.is_mgmt_staff());

create policy rls_phase_b_mgmt_update_payment_discount_applications
  on public.payment_discount_applications
  for update
  to authenticated
  using (public.is_mgmt_staff())
  with check (public.is_mgmt_staff());
