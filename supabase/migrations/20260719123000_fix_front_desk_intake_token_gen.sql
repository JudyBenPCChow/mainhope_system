-- 修正 front_desk_intake_create：避免依賴不存在的 gen_random_bytes

begin;

create or replace function public.front_desk_intake_create()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
  v_id uuid;
  v_expires timestamptz := now() + interval '4 hours';
begin
  if not public.is_mgmt_staff() then
    raise exception '無權限建立前台填表連結';
  end if;
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into public.front_desk_intake_sessions (token, status, expires_at)
  values (v_token, 'open', v_expires)
  returning id into v_id;
  return jsonb_build_object(
    'id', v_id,
    'token', v_token,
    'status', 'open',
    'expires_at', v_expires
  );
end;
$$;

revoke all on function public.front_desk_intake_create() from public;
revoke all on function public.front_desk_intake_create() from anon;
grant execute on function public.front_desk_intake_create() to authenticated;

commit;
