-- 試堂邀請：產生連結時選定免費／半價／原價；產生新連結會作廢未提交的舊連結

begin;

alter table public.trial_invite_tokens
  add column if not exists trial_type text not null default '免費試堂';

alter table public.trial_invite_tokens
  drop constraint if exists trial_invite_tokens_trial_type_check;

alter table public.trial_invite_tokens
  add constraint trial_invite_tokens_trial_type_check
  check (trial_type in ('免費試堂', '半價試堂', '原價試堂'));

comment on column public.trial_invite_tokens.trial_type is
  '職員產生連結時選定：免費試堂／半價試堂／原價試堂；核准時可再改。';

drop function if exists public.trial_invite_create(uuid[]);

create or replace function public.trial_invite_create(
  p_student_ids uuid[],
  p_trial_type text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sid uuid;
  v_token text;
  v_id uuid;
  v_expires timestamptz;
  v_trial_type text;
  v_out jsonb := '[]'::jsonb;
  v_existing public.trial_invite_tokens%rowtype;
begin
  perform public.trial_invite_require_enroll();
  if p_student_ids is null or cardinality(p_student_ids) = 0 then
    raise exception '請指定學生';
  end if;

  v_trial_type := coalesce(nullif(btrim(p_trial_type), ''), '');
  if v_trial_type not in ('免費試堂', '半價試堂', '原價試堂') then
    raise exception '請選擇免費、半價或原價試堂';
  end if;

  foreach v_sid in array p_student_ids
  loop
    if v_sid is null then
      continue;
    end if;
    if not exists (select 1 from public.students where id = v_sid) then
      continue;
    end if;

    v_existing := null;
    select * into v_existing
    from public.trial_invite_tokens
    where student_id = v_sid
      and status in ('open', 'submitted')
    for update;

    if found then
      if v_existing.status = 'submitted' then
        raise exception '此學生已有待審核申請，請先作廢現有連結';
      end if;

      update public.trial_invite_requests
      set status = 'cancelled', reviewed_at = now()
      where token_id = v_existing.id
        and status = 'submitted';

      update public.trial_invite_tokens
      set status = 'voided'
      where id = v_existing.id;
    end if;

    v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
    v_expires := now() + interval '30 days';

    insert into public.trial_invite_tokens (
      token, student_id, status, expires_at, trial_type
    )
    values (v_token, v_sid, 'open', v_expires, v_trial_type)
    returning id into v_id;

    v_out := v_out || jsonb_build_array(jsonb_build_object(
      'id', v_id,
      'token', v_token,
      'student_id', v_sid,
      'status', 'open',
      'trial_type', v_trial_type,
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

create or replace function public.trial_invite_void(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.trial_invite_tokens%rowtype;
begin
  perform public.trial_invite_require_enroll();
  if p_token is null or length(trim(p_token)) < 8 then
    raise exception '連結無效';
  end if;

  select * into r
  from public.trial_invite_tokens
  where token = trim(p_token)
  for update;
  if not found then
    raise exception '找不到此邀請連結';
  end if;

  if r.status in ('approved', 'voided') then
    raise exception '此連結已無法作廢（狀態：%）', r.status;
  end if;

  update public.trial_invite_requests
  set status = 'cancelled', reviewed_at = now()
  where token_id = r.id
    and status = 'submitted';

  update public.trial_invite_tokens
  set status = 'voided'
  where id = r.id
  returning * into r;

  return jsonb_build_object(
    'id', r.id,
    'token', r.token,
    'student_id', r.student_id,
    'status', r.status,
    'trial_type', r.trial_type,
    'expires_at', r.expires_at,
    'submitted_at', r.submitted_at,
    'approved_at', r.approved_at,
    'created_at', r.created_at
  );
end;
$$;

revoke all on function public.trial_invite_create(uuid[], text) from public;
revoke all on function public.trial_invite_create(uuid[], text) from anon;
grant execute on function public.trial_invite_create(uuid[], text) to authenticated;

revoke all on function public.trial_invite_void(text) from public;
revoke all on function public.trial_invite_void(text) from anon;
grant execute on function public.trial_invite_void(text) to authenticated;

notify pgrst, 'reload schema';

commit;
