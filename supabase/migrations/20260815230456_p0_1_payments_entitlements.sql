-- P0-1 domain 4–5：付款／作廢 command／堂數池。
-- 未喺 staging allow-deny 通過前，唔好套 production（禁 npm run db:apply --linked）。
--
-- 付款寫：payments.create／mark_received；作廢只准 void_payment_command
--   （>30 分再查帳戶 payments.void.approve；同一人可以）。
-- 財務：學費只讀；不可開單／作廢。
-- 堂數池：人工調動（G2 表）= entitlements.correct（alien）。
--   消耗／鑄池：attendance.take／students.enroll／payments.create。
-- 老師可改 remaining_lessons（點名消耗）；不可改其他池欄。
-- payment_discounts 目錄寫入維持 catalog.manage（alien）。

-- ---------------------------------------------------------------------------
-- 作廢：禁 Data API 直改 status='作廢'；command 設 GUC 先過
-- ---------------------------------------------------------------------------

create or replace function public.payments_prevent_void_revive()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = '作廢'
      and current_setting('app.payment_void_command', true) is distinct from '1'
    then
      raise exception 'VOID_VIA_COMMAND'
        using errcode = '42501',
          hint = '作廢必須經 void_payment_command';
    end if;
    return new;
  end if;

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

  if new.status = '作廢' and old.status is distinct from '作廢' then
    if current_setting('app.payment_void_command', true) is distinct from '1' then
      raise exception 'VOID_VIA_COMMAND'
        using errcode = '42501',
          hint = '作廢必須經 void_payment_command';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_payments_prevent_void_revive on public.payments;
create trigger trg_payments_prevent_void_revive
  before insert or update on public.payments
  for each row
  execute function public.payments_prevent_void_revive();

create or replace function public.void_payment_command(
  p_payment_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pay public.payments%rowtype;
  v_email text;
  v_name text;
  v_now timestamptz := now();
  v_reason text := left(trim(coalesce(p_reason, '')), 500);
  v_second_email text;
  v_second_name text;
begin
  if p_payment_id is null then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  if not private.has_capability('payments.void') then
    raise exception 'NOT_AUTHORIZED'
      using errcode = '42501', hint = '需要 payments.void';
  end if;
  if v_reason = '' then
    raise exception 'VOID_REASON_REQUIRED' using errcode = '22023';
  end if;

  select * into v_pay
  from public.payments
  where id = p_payment_id
  for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_pay.status = '作廢' then
    return jsonb_build_object(
      'ok', true,
      'alreadyVoided', true,
      'payment_id', v_pay.id
    );
  end if;

  v_email := public.current_app_user_email();
  select coalesce(nullif(trim(au.display_name), ''), v_email)
  into v_name
  from public.app_users au
  where au.id = public.current_app_user_id();
  v_name := coalesce(v_name, v_email);

  if v_pay.created_at < v_now - interval '30 minutes' then
    if not private.has_account_capability('payments.void.approve') then
      raise exception 'VOID_APPROVE_REQUIRED'
        using errcode = '42501',
          hint = '開單超過 30 分鐘須帳戶已獲授 manager／alien';
    end if;
    v_second_email := v_email;
    v_second_name := v_name;
  end if;

  perform set_config('app.payment_void_command', '1', true);

  update public.payments
  set
    status = '作廢',
    voided_at = v_now,
    voided_by_email = v_email,
    voided_by_name = v_name,
    void_reason = v_reason,
    void_second_confirmer_email = v_second_email,
    void_second_confirmer_name = v_second_name,
    updated_at = v_now
  where id = p_payment_id
    and status is distinct from '作廢';

  update public.referral_records
  set rebate_status = 'cancelled'
  where payment_id = p_payment_id
    and rebate_status = 'pending';

  perform set_config('app.payment_void_command', '0', true);

  return jsonb_build_object(
    'ok', true,
    'alreadyVoided', false,
    'payment_id', p_payment_id
  );
end;
$$;

comment on function public.void_payment_command(uuid, text) is
  'P0-1 作廢 command。>30 分查 has_account_capability(payments.void.approve)；同一人可以。';

revoke all on function public.void_payment_command(uuid, text) from public, anon;
grant execute on function public.void_payment_command(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------

drop policy if exists rls_phase_b_mgmt_select_payments on public.payments;
drop policy if exists rls_phase_b_mgmt_insert_payments on public.payments;
drop policy if exists rls_phase_b_mgmt_update_payments on public.payments;
drop policy if exists rls_cap_select_payments on public.payments;
drop policy if exists rls_cap_insert_payments on public.payments;
drop policy if exists rls_cap_update_payments on public.payments;

create policy rls_cap_select_payments
on public.payments for select to authenticated
using (private.has_capability('payments.read') and public.is_mgmt_staff());

create policy rls_cap_insert_payments
on public.payments for insert to authenticated
with check (private.has_capability('payments.create'));

create policy rls_cap_update_payments
on public.payments for update to authenticated
using (
  private.has_capability('payments.create')
  or private.has_capability('payments.mark_received')
  or private.has_capability('payments.void')
)
with check (
  private.has_capability('payments.create')
  or private.has_capability('payments.mark_received')
  or private.has_capability('payments.void')
);

-- portal_select_payments 保留

-- ---------------------------------------------------------------------------
-- payment_details／late_fee／discount applications／batches／referrals
-- ---------------------------------------------------------------------------

drop policy if exists rls_phase_b_mgmt_select_payment_details on public.payment_details;
drop policy if exists rls_phase_b_mgmt_insert_payment_details on public.payment_details;
drop policy if exists rls_phase_b_mgmt_update_payment_details on public.payment_details;
drop policy if exists rls_cap_select_payment_details on public.payment_details;
drop policy if exists rls_cap_write_payment_details on public.payment_details;

create policy rls_cap_select_payment_details
on public.payment_details for select to authenticated
using (private.has_capability('payments.read') and public.is_mgmt_staff());

create policy rls_cap_write_payment_details
on public.payment_details for all to authenticated
using (
  private.has_capability('payments.create')
  or private.has_capability('payments.mark_received')
)
with check (
  private.has_capability('payments.create')
  or private.has_capability('payments.mark_received')
);

drop policy if exists rls_phase_b_mgmt_select_payment_late_fee_items
  on public.payment_late_fee_items;
drop policy if exists rls_phase_b_mgmt_insert_payment_late_fee_items
  on public.payment_late_fee_items;
drop policy if exists rls_phase_b_mgmt_update_payment_late_fee_items
  on public.payment_late_fee_items;
drop policy if exists rls_cap_select_payment_late_fee_items
  on public.payment_late_fee_items;
drop policy if exists rls_cap_write_payment_late_fee_items
  on public.payment_late_fee_items;

create policy rls_cap_select_payment_late_fee_items
on public.payment_late_fee_items for select to authenticated
using (private.has_capability('payments.read') and public.is_mgmt_staff());

create policy rls_cap_write_payment_late_fee_items
on public.payment_late_fee_items for all to authenticated
using (private.has_capability('payments.create'))
with check (private.has_capability('payments.create'));

drop policy if exists rls_mgmt_all_payment_discount_applications
  on public.payment_discount_applications;
drop policy if exists rls_phase_b_mgmt_select_payment_discount_applications
  on public.payment_discount_applications;
drop policy if exists rls_phase_b_mgmt_insert_payment_discount_applications
  on public.payment_discount_applications;
drop policy if exists rls_phase_b_mgmt_update_payment_discount_applications
  on public.payment_discount_applications;
drop policy if exists rls_cap_select_payment_discount_applications
  on public.payment_discount_applications;
drop policy if exists rls_cap_write_payment_discount_applications
  on public.payment_discount_applications;

create policy rls_cap_select_payment_discount_applications
on public.payment_discount_applications for select to authenticated
using (private.has_capability('payments.read') and public.is_mgmt_staff());

create policy rls_cap_write_payment_discount_applications
on public.payment_discount_applications for all to authenticated
using (private.has_capability('payments.create'))
with check (private.has_capability('payments.create'));

drop policy if exists rls_phase_b_mgmt_all_payment_batches on public.payment_batches;
drop policy if exists rls_cap_select_payment_batches on public.payment_batches;
drop policy if exists rls_cap_write_payment_batches on public.payment_batches;

create policy rls_cap_select_payment_batches
on public.payment_batches for select to authenticated
using (private.has_capability('payments.read') and public.is_mgmt_staff());

create policy rls_cap_write_payment_batches
on public.payment_batches for all to authenticated
using (private.has_capability('payments.create'))
with check (private.has_capability('payments.create'));

drop policy if exists rls_phase_b_mgmt_all_referral_records on public.referral_records;
drop policy if exists rls_cap_select_referral_records on public.referral_records;
drop policy if exists rls_cap_write_referral_records on public.referral_records;

create policy rls_cap_select_referral_records
on public.referral_records for select to authenticated
using (private.has_capability('payments.read') and public.is_mgmt_staff());

create policy rls_cap_write_referral_records
on public.referral_records for all to authenticated
using (private.has_capability('payments.create'))
with check (private.has_capability('payments.create'));

drop policy if exists rls_mgmt_select_payment_discounts on public.payment_discounts;
drop policy if exists rls_cap_select_payment_discounts on public.payment_discounts;

create policy rls_cap_select_payment_discounts
on public.payment_discounts for select to authenticated
using (private.has_capability('payments.read') and public.is_mgmt_staff());

-- rls_phase_c_alien_all_payment_discounts 寫入保留

drop policy if exists monthly_tuition_calendar_mgmt_charges
  on public.monthly_tuition_charges;
drop policy if exists rls_cap_select_monthly_tuition_charges
  on public.monthly_tuition_charges;
drop policy if exists rls_cap_write_monthly_tuition_charges
  on public.monthly_tuition_charges;

create policy rls_cap_select_monthly_tuition_charges
on public.monthly_tuition_charges for select to authenticated
using (private.has_capability('payments.read') and public.is_mgmt_staff());

create policy rls_cap_write_monthly_tuition_charges
on public.monthly_tuition_charges for all to authenticated
using (private.has_capability('payments.create'))
with check (private.has_capability('payments.create'));

drop policy if exists monthly_tuition_calendar_mgmt_credits
  on public.tuition_credit_entries;
drop policy if exists rls_cap_select_tuition_credit_entries
  on public.tuition_credit_entries;
drop policy if exists rls_cap_write_tuition_credit_entries
  on public.tuition_credit_entries;

create policy rls_cap_select_tuition_credit_entries
on public.tuition_credit_entries for select to authenticated
using (private.has_capability('payments.read') and public.is_mgmt_staff());

create policy rls_cap_write_tuition_credit_entries
on public.tuition_credit_entries for all to authenticated
using (private.has_capability('payments.create'))
with check (private.has_capability('payments.create'));

-- ---------------------------------------------------------------------------
-- 老師改池：只許 remaining_lessons、updated_at
-- ---------------------------------------------------------------------------

create or replace function public.entitlement_pools_enforce_teacher_update_columns()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if public.is_teacher_role() then
    if new.student_id is distinct from old.student_id
      or new.class_id is distinct from old.class_id
      or new.academic_year_id is distinct from old.academic_year_id
      or new.package_type is distinct from old.package_type
      or new.source_enrollment_id is distinct from old.source_enrollment_id
      or new.initial_lessons is distinct from old.initial_lessons
      or new.valid_from is distinct from old.valid_from
      or new.valid_to is distinct from old.valid_to
      or new.id is distinct from old.id
      or new.created_at is distinct from old.created_at
    then
      raise exception 'TEACHER_POOL_UPDATE_DENIED'
        using errcode = '42501',
          hint = '老師僅可更新 remaining_lessons（點名消耗）';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_entitlement_pools_teacher_columns
  on public.student_entitlement_pools;
create trigger trg_entitlement_pools_teacher_columns
  before update on public.student_entitlement_pools
  for each row
  execute function public.entitlement_pools_enforce_teacher_update_columns();

-- ---------------------------------------------------------------------------
-- student_entitlement_pools
-- ---------------------------------------------------------------------------

drop policy if exists rls_mgmt_all_student_entitlement_pools
  on public.student_entitlement_pools;
drop policy if exists rls_cap_select_student_entitlement_pools
  on public.student_entitlement_pools;
drop policy if exists rls_cap_insert_student_entitlement_pools
  on public.student_entitlement_pools;
drop policy if exists rls_cap_update_student_entitlement_pools
  on public.student_entitlement_pools;
drop policy if exists rls_cap_delete_student_entitlement_pools
  on public.student_entitlement_pools;
drop policy if exists rls_teacher_update_student_entitlement_pools
  on public.student_entitlement_pools;

create policy rls_cap_select_student_entitlement_pools
on public.student_entitlement_pools for select to authenticated
using (private.has_capability('entitlements.read') and public.is_mgmt_staff());

create policy rls_cap_insert_student_entitlement_pools
on public.student_entitlement_pools for insert to authenticated
with check (
  private.has_capability('students.enroll')
  or private.has_capability('payments.create')
  or private.has_capability('entitlements.correct')
);

create policy rls_cap_update_student_entitlement_pools
on public.student_entitlement_pools for update to authenticated
using (
  public.is_mgmt_staff()
  and (
    private.has_capability('attendance.take')
    or private.has_capability('students.enroll')
    or private.has_capability('payments.create')
    or private.has_capability('entitlements.correct')
  )
)
with check (
  public.is_mgmt_staff()
  and (
    private.has_capability('attendance.take')
    or private.has_capability('students.enroll')
    or private.has_capability('payments.create')
    or private.has_capability('entitlements.correct')
  )
);

create policy rls_cap_delete_student_entitlement_pools
on public.student_entitlement_pools for delete to authenticated
using (private.has_capability('entitlements.correct'));

create policy rls_teacher_update_student_entitlement_pools
on public.student_entitlement_pools for update to authenticated
using (
  public.is_teacher_role()
  and private.has_capability('attendance.take')
  and public.teacher_can_access_class(class_id)
)
with check (
  public.is_teacher_role()
  and private.has_capability('attendance.take')
  and public.teacher_can_access_class(class_id)
);

-- rls_teacher_select_student_entitlement_pools 保留

-- ---------------------------------------------------------------------------
-- entitlement_pool_adjustments（G2 人工調池）
-- ---------------------------------------------------------------------------

drop policy if exists rls_mgmt_all_entitlement_pool_adjustments
  on public.entitlement_pool_adjustments;
drop policy if exists rls_cap_select_entitlement_pool_adjustments
  on public.entitlement_pool_adjustments;
drop policy if exists rls_cap_write_entitlement_pool_adjustments
  on public.entitlement_pool_adjustments;

create policy rls_cap_select_entitlement_pool_adjustments
on public.entitlement_pool_adjustments for select to authenticated
using (private.has_capability('entitlements.read') and public.is_mgmt_staff());

create policy rls_cap_write_entitlement_pool_adjustments
on public.entitlement_pool_adjustments for all to authenticated
using (private.has_capability('entitlements.correct'))
with check (private.has_capability('entitlements.correct'));

-- ---------------------------------------------------------------------------
-- entitlement_consumption_events
-- ---------------------------------------------------------------------------

drop policy if exists rls_mgmt_all_entitlement_consumption_events
  on public.entitlement_consumption_events;
drop policy if exists rls_cap_select_entitlement_consumption_events
  on public.entitlement_consumption_events;
drop policy if exists rls_cap_insert_entitlement_consumption_events
  on public.entitlement_consumption_events;
drop policy if exists rls_teacher_insert_entitlement_consumption_events
  on public.entitlement_consumption_events;

create policy rls_cap_select_entitlement_consumption_events
on public.entitlement_consumption_events for select to authenticated
using (private.has_capability('entitlements.read') and public.is_mgmt_staff());

create policy rls_cap_insert_entitlement_consumption_events
on public.entitlement_consumption_events for insert to authenticated
with check (
  public.is_mgmt_staff()
  and (
    private.has_capability('attendance.take')
    or private.has_capability('entitlements.correct')
  )
);

create policy rls_teacher_insert_entitlement_consumption_events
on public.entitlement_consumption_events for insert to authenticated
with check (
  public.is_teacher_role()
  and private.has_capability('attendance.take')
  and (
    schedule_id is null
    or public.teacher_can_access_schedule(schedule_id)
  )
);

-- rls_teacher_select_entitlement_consumption_events 保留

-- ---------------------------------------------------------------------------
-- attendance_declarations／exceptions
-- ---------------------------------------------------------------------------

drop policy if exists rls_mgmt_all_attendance_declarations
  on public.attendance_declarations;
drop policy if exists rls_cap_select_attendance_declarations
  on public.attendance_declarations;
drop policy if exists rls_cap_write_attendance_declarations
  on public.attendance_declarations;

create policy rls_cap_select_attendance_declarations
on public.attendance_declarations for select to authenticated
using (
  public.is_mgmt_staff()
  and (
    private.has_capability('entitlements.read')
    or private.has_capability('students.read')
  )
);

create policy rls_cap_write_attendance_declarations
on public.attendance_declarations for all to authenticated
using (
  private.has_capability('students.enroll')
  or private.has_capability('attendance.take')
  or private.has_capability('entitlements.correct')
)
with check (
  private.has_capability('students.enroll')
  or private.has_capability('attendance.take')
  or private.has_capability('entitlements.correct')
);

-- rls_teacher_select_attendance_declarations 保留

drop policy if exists rls_mgmt_all_attendance_declaration_exceptions
  on public.attendance_declaration_exceptions;
drop policy if exists rls_cap_select_attendance_declaration_exceptions
  on public.attendance_declaration_exceptions;
drop policy if exists rls_cap_write_attendance_declaration_exceptions
  on public.attendance_declaration_exceptions;

create policy rls_cap_select_attendance_declaration_exceptions
on public.attendance_declaration_exceptions for select to authenticated
using (
  public.is_mgmt_staff()
  and (
    private.has_capability('entitlements.read')
    or private.has_capability('students.read')
  )
);

create policy rls_cap_write_attendance_declaration_exceptions
on public.attendance_declaration_exceptions for all to authenticated
using (
  private.has_capability('students.enroll')
  or private.has_capability('entitlements.correct')
)
with check (
  private.has_capability('students.enroll')
  or private.has_capability('entitlements.correct')
);

-- rls_teacher_select_attendance_declaration_exceptions 保留

update private.authz_meta
set authz_version = 5,
    updated_at = now()
where id = 1;
