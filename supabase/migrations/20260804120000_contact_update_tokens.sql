-- 聯絡資料自助更新：既有學生專屬連結 → 家長提交 → 職員審核寫入

begin;

create table if not exists public.contact_update_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  student_id uuid not null references public.students (id) on delete cascade,
  status text not null default 'open'
    check (status in ('open', 'submitted', 'approved', 'expired', 'voided')),
  baseline jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  approved_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days')
);

create index if not exists contact_update_tokens_student_id_idx
  on public.contact_update_tokens (student_id);
create index if not exists contact_update_tokens_status_idx
  on public.contact_update_tokens (status);
create index if not exists contact_update_tokens_expires_at_idx
  on public.contact_update_tokens (expires_at);

-- 每位學生最多一條進行中（open／submitted）
create unique index if not exists contact_update_tokens_one_active_per_student
  on public.contact_update_tokens (student_id)
  where status in ('open', 'submitted');

comment on table public.contact_update_tokens is
  '聯絡資料自助更新：專屬 token；家長提交後職員審核才寫入 students。';

alter table public.contact_update_tokens enable row level security;

drop policy if exists contact_update_tokens_mgmt_all on public.contact_update_tokens;
create policy contact_update_tokens_mgmt_all
on public.contact_update_tokens
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

-- 從 students 列組 baseline／聯絡快照
create or replace function public.contact_update_snapshot_from_student(s public.students)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'primary_contact_person', coalesce(s.primary_contact_person, '家長'),
    'student_phone', coalesce(s.student_phone, ''),
    'student_phone_country_code', coalesce(s.student_phone_country_code, '+852'),
    'student_preferred_contact_method', coalesce(s.student_preferred_contact_method, 'WhatsApp'),
    'student_wechat_id', coalesce(s.student_wechat_id, ''),
    'parent_phone', coalesce(s.parent_phone, ''),
    'parent_phone_country_code', coalesce(s.parent_phone_country_code, '+852'),
    'parent_preferred_contact_method', coalesce(s.parent_preferred_contact_method, 'WhatsApp'),
    'parent_wechat_id', coalesce(s.parent_wechat_id, '')
  );
$$;

create or replace function public.contact_update_require_admin_or_alien()
returns void
language plpgsql
stable
set search_path = public
as $$
begin
  if coalesce(public.current_app_role(), '') not in ('admin', 'alien') then
    raise exception '無權限（僅管理員／外星人）';
  end if;
end;
$$;

-- 批量建立／重用進行中連結
create or replace function public.contact_update_create(p_student_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sid uuid;
  v_token text;
  v_id uuid;
  v_expires timestamptz := now() + interval '30 days';
  v_baseline jsonb;
  s public.students%rowtype;
  v_out jsonb := '[]'::jsonb;
  v_row jsonb;
begin
  perform public.contact_update_require_admin_or_alien();
  if p_student_ids is null or cardinality(p_student_ids) = 0 then
    raise exception '請指定學生';
  end if;

  foreach v_sid in array p_student_ids
  loop
    if v_sid is null then
      continue;
    end if;

    select * into s from public.students where id = v_sid;
    if not found then
      continue;
    end if;

    -- 已有進行中：回傳現有
    select jsonb_build_object(
      'id', t.id,
      'token', t.token,
      'student_id', t.student_id,
      'status', t.status,
      'baseline', t.baseline,
      'payload', t.payload,
      'expires_at', t.expires_at,
      'submitted_at', t.submitted_at,
      'approved_at', t.approved_at,
      'created_at', t.created_at,
      'reused', true
    )
    into v_row
    from public.contact_update_tokens t
    where t.student_id = v_sid
      and t.status in ('open', 'submitted')
    limit 1;

    if v_row is not null then
      v_out := v_out || jsonb_build_array(v_row);
      v_row := null;
      continue;
    end if;

    v_baseline := public.contact_update_snapshot_from_student(s);
    v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
    v_expires := now() + interval '30 days';

    insert into public.contact_update_tokens (
      token, student_id, status, baseline, payload, expires_at
    )
    values (v_token, v_sid, 'open', v_baseline, '{}'::jsonb, v_expires)
    returning id into v_id;

    v_out := v_out || jsonb_build_array(jsonb_build_object(
      'id', v_id,
      'token', v_token,
      'student_id', v_sid,
      'status', 'open',
      'baseline', v_baseline,
      'payload', '{}'::jsonb,
      'expires_at', v_expires,
      'submitted_at', null,
      'approved_at', null,
      'created_at', now(),
      'reused', false
    ));
  end loop;

  return v_out;
end;
$$;

-- 公開讀取
create or replace function public.contact_update_get(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.contact_update_tokens%rowtype;
  s public.students%rowtype;
begin
  if p_token is null or length(trim(p_token)) < 8 then
    raise exception '連結無效';
  end if;

  select * into r
  from public.contact_update_tokens
  where token = trim(p_token)
  limit 1;
  if not found then
    raise exception '找不到此更新連結';
  end if;

  if r.expires_at < now() and r.status in ('open', 'submitted') then
    update public.contact_update_tokens
    set status = 'expired'
    where id = r.id;
    r.status := 'expired';
  end if;

  select * into s from public.students where id = r.student_id;
  if not found then
    raise exception '找不到對應學生';
  end if;

  return jsonb_build_object(
    'id', r.id,
    'token', r.token,
    'student_id', r.student_id,
    'status', r.status,
    'baseline', r.baseline,
    'payload', r.payload,
    'expires_at', r.expires_at,
    'submitted_at', r.submitted_at,
    'approved_at', r.approved_at,
    'identity', jsonb_build_object(
      'full_name', s.full_name,
      'student_code', coalesce(s.student_code, ''),
      'grade', coalesce(s.grade, ''),
      'school', coalesce(s.school, '')
    ),
    -- 預填：open 用 baseline；已提交用 payload
    'form', case
      when r.status = 'submitted' and r.payload <> '{}'::jsonb then r.payload
      else r.baseline
    end
  );
end;
$$;

-- 家長提交（提交後鎖定）
create or replace function public.contact_update_submit(p_token text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.contact_update_tokens%rowtype;
  v_student_phone text;
  v_parent_phone text;
  v_student_method text;
  v_parent_method text;
  v_student_wx text;
  v_parent_wx text;
  v_primary text;
begin
  if p_token is null or length(trim(p_token)) < 8 then
    raise exception '連結無效';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception '表單內容無效';
  end if;

  v_student_phone := nullif(trim(coalesce(p_payload->>'student_phone', '')), '');
  v_parent_phone := nullif(trim(coalesce(p_payload->>'parent_phone', '')), '');
  if v_student_phone is null and v_parent_phone is null then
    raise exception '請至少填寫學生電話或家長電話';
  end if;

  v_student_method := coalesce(nullif(trim(p_payload->>'student_preferred_contact_method'), ''), 'WhatsApp');
  v_parent_method := coalesce(nullif(trim(p_payload->>'parent_preferred_contact_method'), ''), 'WhatsApp');
  if v_student_method not in ('WhatsApp', 'WeChat') or v_parent_method not in ('WhatsApp', 'WeChat') then
    raise exception '通訊偏好無效';
  end if;

  v_student_wx := nullif(trim(coalesce(p_payload->>'student_wechat_id', '')), '');
  v_parent_wx := nullif(trim(coalesce(p_payload->>'parent_wechat_id', '')), '');
  if v_student_method = 'WeChat' and v_student_wx is null then
    raise exception '學生偏好 WeChat，請填寫學生 WeChat ID';
  end if;
  if v_parent_method = 'WeChat' and v_parent_wx is null then
    raise exception '家長偏好 WeChat，請填寫家長 WeChat ID';
  end if;

  v_primary := coalesce(nullif(trim(p_payload->>'primary_contact_person'), ''), '家長');
  if v_primary not in ('學生', '家長') then
    raise exception '第一聯絡人無效';
  end if;

  select * into r
  from public.contact_update_tokens
  where token = trim(p_token)
  for update;
  if not found then
    raise exception '找不到此更新連結';
  end if;

  if r.expires_at < now() then
    update public.contact_update_tokens set status = 'expired' where id = r.id;
    raise exception '此連結已過期，請向職員索取新連結';
  end if;

  if r.status <> 'open' then
    raise exception '此連結已無法再提交（狀態：%）', r.status;
  end if;

  update public.contact_update_tokens
  set
    status = 'submitted',
    payload = jsonb_build_object(
      'primary_contact_person', v_primary,
      'student_phone', coalesce(v_student_phone, ''),
      'student_phone_country_code', case
        when coalesce(p_payload->>'student_phone_country_code', '') = '+86' then '+86'
        else '+852'
      end,
      'student_preferred_contact_method', v_student_method,
      'student_wechat_id', coalesce(v_student_wx, ''),
      'parent_phone', coalesce(v_parent_phone, ''),
      'parent_phone_country_code', case
        when coalesce(p_payload->>'parent_phone_country_code', '') = '+86' then '+86'
        else '+852'
      end,
      'parent_preferred_contact_method', v_parent_method,
      'parent_wechat_id', coalesce(v_parent_wx, '')
    ),
    submitted_at = now()
  where id = r.id
  returning * into r;

  return jsonb_build_object(
    'id', r.id,
    'token', r.token,
    'student_id', r.student_id,
    'status', r.status,
    'payload', r.payload,
    'submitted_at', r.submitted_at
  );
end;
$$;

-- 職員核准：寫入 students
create or replace function public.contact_update_approve(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.contact_update_tokens%rowtype;
  p jsonb;
begin
  perform public.contact_update_require_admin_or_alien();

  select * into r
  from public.contact_update_tokens
  where token = trim(p_token)
  for update;
  if not found then
    raise exception '找不到此更新連結';
  end if;
  if r.status <> 'submitted' then
    raise exception '僅可核准待審核提交（狀態：%）', r.status;
  end if;

  p := r.payload;

  update public.students
  set
    primary_contact_person = nullif(trim(coalesce(p->>'primary_contact_person', '')), ''),
    student_phone = nullif(trim(coalesce(p->>'student_phone', '')), ''),
    student_phone_country_code = case
      when coalesce(p->>'student_phone_country_code', '') = '+86' then '+86'
      else '+852'
    end,
    student_preferred_contact_method = nullif(trim(coalesce(p->>'student_preferred_contact_method', '')), ''),
    student_wechat_id = nullif(trim(coalesce(p->>'student_wechat_id', '')), ''),
    parent_phone = nullif(trim(coalesce(p->>'parent_phone', '')), ''),
    parent_phone_country_code = case
      when coalesce(p->>'parent_phone_country_code', '') = '+86' then '+86'
      else '+852'
    end,
    parent_preferred_contact_method = nullif(trim(coalesce(p->>'parent_preferred_contact_method', '')), ''),
    parent_wechat_id = nullif(trim(coalesce(p->>'parent_wechat_id', '')), ''),
    preferred_contact_method = coalesce(
      nullif(trim(coalesce(p->>'parent_preferred_contact_method', '')), ''),
      nullif(trim(coalesce(p->>'student_preferred_contact_method', '')), '')
    ),
    updated_at = now()
  where id = r.student_id;

  update public.contact_update_tokens
  set status = 'approved', approved_at = now()
  where id = r.id
  returning * into r;

  return jsonb_build_object(
    'id', r.id,
    'token', r.token,
    'student_id', r.student_id,
    'status', r.status,
    'approved_at', r.approved_at
  );
end;
$$;

-- 職員作廢／退回（submitted → voided；亦允許 void open）
create or replace function public.contact_update_void(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.contact_update_tokens%rowtype;
begin
  perform public.contact_update_require_admin_or_alien();

  select * into r
  from public.contact_update_tokens
  where token = trim(p_token)
  for update;
  if not found then
    raise exception '找不到此更新連結';
  end if;
  if r.status not in ('open', 'submitted') then
    raise exception '此狀態不可作廢（%）', r.status;
  end if;

  update public.contact_update_tokens
  set status = 'voided'
  where id = r.id
  returning * into r;

  return jsonb_build_object(
    'id', r.id,
    'token', r.token,
    'student_id', r.student_id,
    'status', r.status
  );
end;
$$;

revoke all on function public.contact_update_snapshot_from_student(public.students) from public;
grant execute on function public.contact_update_snapshot_from_student(public.students) to authenticated;

revoke all on function public.contact_update_require_admin_or_alien() from public;
revoke all on function public.contact_update_require_admin_or_alien() from anon;
grant execute on function public.contact_update_require_admin_or_alien() to authenticated;

revoke all on function public.contact_update_create(uuid[]) from public;
revoke all on function public.contact_update_create(uuid[]) from anon;
grant execute on function public.contact_update_create(uuid[]) to authenticated;

revoke all on function public.contact_update_get(text) from public;
grant execute on function public.contact_update_get(text) to anon, authenticated;

revoke all on function public.contact_update_submit(text, jsonb) from public;
grant execute on function public.contact_update_submit(text, jsonb) to anon, authenticated;

revoke all on function public.contact_update_approve(text) from public;
revoke all on function public.contact_update_approve(text) from anon;
grant execute on function public.contact_update_approve(text) to authenticated;

revoke all on function public.contact_update_void(text) from public;
revoke all on function public.contact_update_void(text) from anon;
grant execute on function public.contact_update_void(text) to authenticated;

commit;
