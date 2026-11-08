-- void-payment Edge 在驗密碼、角色與第二人之後，不能再直接 update payments.status。
-- 觸發器只放行設了 app.payment_void_command 的同一筆交易。
-- 此函式只給 service_role：權限與第二人仍由 Edge 檢查，不開放給登入用戶直呼。

create or replace function public.void_payment_apply(
  p_payment_id uuid,
  p_reason text,
  p_actor_email text,
  p_actor_name text,
  p_second_email text default null,
  p_second_name text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pay public.payments%rowtype;
  v_now timestamptz := now();
  v_reason text := left(trim(coalesce(p_reason, '')), 500);
  v_actor_email text := nullif(lower(trim(coalesce(p_actor_email, ''))), '');
  v_actor_name text := nullif(trim(coalesce(p_actor_name, '')), '');
  v_second_email text := nullif(lower(trim(coalesce(p_second_email, ''))), '');
  v_second_name text := nullif(trim(coalesce(p_second_name, '')), '');
begin
  if p_payment_id is null then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_reason = '' then
    raise exception 'VOID_REASON_REQUIRED' using errcode = '22023';
  end if;
  if v_actor_email is null then
    raise exception 'ACTOR_REQUIRED' using errcode = '22023';
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

  perform set_config('app.payment_void_command', '1', true);

  update public.payments
  set
    status = '作廢',
    voided_at = v_now,
    voided_by_email = v_actor_email,
    voided_by_name = coalesce(v_actor_name, v_actor_email),
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

comment on function public.void_payment_apply(uuid, text, text, text, text, text) is
  'Edge void-payment 專用。設作廢標記後改狀態並取消待處理轉介。登入用戶不可直接呼叫。';

revoke all on function public.void_payment_apply(uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.void_payment_apply(uuid, text, text, text, text, text) to service_role;

notify pgrst, 'reload schema';
