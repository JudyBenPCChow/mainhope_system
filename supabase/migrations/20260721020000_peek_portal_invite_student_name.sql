-- 家長啟用頁：依邀請 token 公開讀取學生姓名（不暴露 student_id 或其他個資）
-- 供 MainHope_portal /activate 在登入前顯示「正在為○○開通」

begin;

create or replace function public.peek_portal_invite(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_token text := nullif(trim(coalesce(p_token, '')), '');
  v_invite public.student_portal_invites%rowtype;
  v_name text;
  v_status text;
begin
  if v_token is null or length(v_token) < 8 then
    return jsonb_build_object('status', 'not_found');
  end if;

  select * into v_invite
  from public.student_portal_invites
  where token = v_token
  limit 1;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  select nullif(trim(coalesce(s.full_name, '')), '') into v_name
  from public.students s
  where s.id = v_invite.student_id;

  if v_invite.used_at is not null then
    v_status := 'used';
  elsif v_invite.expires_at < now() then
    v_status := 'expired';
  else
    v_status := 'valid';
  end if;

  return jsonb_build_object(
    'status', v_status,
    'student_name', coalesce(v_name, '同學'),
    'expires_at', v_invite.expires_at
  );
end;
$$;

revoke all on function public.peek_portal_invite(text) from public;
grant execute on function public.peek_portal_invite(text) to anon, authenticated;

comment on function public.peek_portal_invite(text) is
  'Portal 啟用頁：以邀請 token 回傳學生姓名與連結狀態（valid/used/expired/not_found）；不回傳 student_id。';

commit;
