-- 前台指引精靈：家長連結自填新生資料（暫時稿），職員審核後才建立 students

begin;

create table if not exists public.front_desk_intake_sessions (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  status text not null default 'open'
    check (status in ('open', 'submitted', 'consumed', 'expired', 'cancelled')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  consumed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '4 hours')
);

create index if not exists front_desk_intake_sessions_status_idx
  on public.front_desk_intake_sessions (status);
create index if not exists front_desk_intake_sessions_expires_at_idx
  on public.front_desk_intake_sessions (expires_at);

comment on table public.front_desk_intake_sessions is
  '前台精靈家長連結填表暫存；職員確認後建立學生並標記 consumed。';

alter table public.front_desk_intake_sessions enable row level security;

drop policy if exists front_desk_intake_sessions_mgmt_all on public.front_desk_intake_sessions;
create policy front_desk_intake_sessions_mgmt_all
on public.front_desk_intake_sessions
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

-- 職員建立填表連結
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
  -- 不依賴 pgcrypto.gen_random_bytes（部分專案未啟用）
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

-- 家長／前台依 token 讀取（anon + authenticated）
create or replace function public.front_desk_intake_get(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.front_desk_intake_sessions%rowtype;
begin
  if p_token is null or length(trim(p_token)) < 8 then
    raise exception '連結無效';
  end if;
  select * into r
  from public.front_desk_intake_sessions
  where token = trim(p_token)
  limit 1;
  if not found then
    raise exception '找不到此填表連結';
  end if;
  if r.expires_at < now() and r.status = 'open' then
    update public.front_desk_intake_sessions
    set status = 'expired'
    where id = r.id;
    r.status := 'expired';
  end if;
  return jsonb_build_object(
    'id', r.id,
    'token', r.token,
    'status', r.status,
    'payload', r.payload,
    'expires_at', r.expires_at,
    'submitted_at', r.submitted_at
  );
end;
$$;

-- 家長提交表單
create or replace function public.front_desk_intake_submit(p_token text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.front_desk_intake_sessions%rowtype;
  v_name text;
begin
  if p_token is null or length(trim(p_token)) < 8 then
    raise exception '連結無效';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception '表單內容無效';
  end if;
  v_name := nullif(trim(coalesce(p_payload->>'full_name', '')), '');
  if v_name is null then
    raise exception '請填寫中文姓名';
  end if;

  select * into r
  from public.front_desk_intake_sessions
  where token = trim(p_token)
  for update;
  if not found then
    raise exception '找不到此填表連結';
  end if;
  if r.expires_at < now() then
    update public.front_desk_intake_sessions set status = 'expired' where id = r.id;
    raise exception '此連結已過期，請向職員索取新連結';
  end if;
  if r.status <> 'open' and r.status <> 'submitted' then
    raise exception '此連結已無法再提交（狀態：%）', r.status;
  end if;

  update public.front_desk_intake_sessions
  set
    status = 'submitted',
    payload = p_payload,
    submitted_at = now()
  where id = r.id
  returning * into r;

  return jsonb_build_object(
    'id', r.id,
    'token', r.token,
    'status', r.status,
    'payload', r.payload,
    'submitted_at', r.submitted_at
  );
end;
$$;

-- 職員確認後標記已使用
create or replace function public.front_desk_intake_consume(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_mgmt_staff() then
    raise exception '無權限';
  end if;
  update public.front_desk_intake_sessions
  set status = 'consumed', consumed_at = now()
  where token = trim(p_token)
    and status = 'submitted';
end;
$$;

revoke all on function public.front_desk_intake_create() from public;
revoke all on function public.front_desk_intake_create() from anon;
grant execute on function public.front_desk_intake_create() to authenticated;

revoke all on function public.front_desk_intake_get(text) from public;
grant execute on function public.front_desk_intake_get(text) to anon, authenticated;

revoke all on function public.front_desk_intake_submit(text, jsonb) from public;
grant execute on function public.front_desk_intake_submit(text, jsonb) to anon, authenticated;

revoke all on function public.front_desk_intake_consume(text) from public;
revoke all on function public.front_desk_intake_consume(text) from anon;
grant execute on function public.front_desk_intake_consume(text) to authenticated;

commit;
