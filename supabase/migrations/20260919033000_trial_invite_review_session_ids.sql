-- 試堂邀請核准：回傳新建 trial_session ids；過去日期以香港日曆判斷
-- 套用：npm run db:apply -- supabase/migrations/20260919033000_trial_invite_review_session_ids.sql

begin;

create or replace function public.trial_invite_review(
  p_request_id uuid,
  p_action text,
  p_counts_toward_headcount boolean default null,
  p_trial_type text default '免費試堂',
  p_reject_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.trial_invite_requests%rowtype;
  tok public.trial_invite_tokens%rowtype;
  ln record;
  v_peer record;
  v_trial_type text;
  v_created int := 0;
  v_schedule_ids uuid[];
  v_new_id uuid;
  v_created_ids uuid[] := '{}';
  v_today date;
begin
  perform public.trial_invite_require_enroll();
  if p_request_id is null then
    raise exception '請指定申請';
  end if;
  if p_action not in ('approve', 'reject') then
    raise exception '動作無效';
  end if;

  v_today := (timezone('Asia/Hong_Kong', now()))::date;

  select * into req
  from public.trial_invite_requests
  where id = p_request_id
  for update;
  if not found then
    raise exception '找不到申請';
  end if;
  if req.status <> 'submitted' then
    raise exception '此申請已處理（狀態：%）', req.status;
  end if;

  select * into tok
  from public.trial_invite_tokens
  where id = req.token_id
  for update;
  if not found then
    raise exception '找不到對應邀請連結';
  end if;

  if p_action = 'reject' then
    update public.trial_invite_requests
    set
      status = 'rejected',
      reject_reason = nullif(btrim(coalesce(p_reject_reason, '')), ''),
      reviewed_at = now()
    where id = req.id;

    update public.trial_invite_tokens
    set status = 'voided'
    where id = tok.id;

    return jsonb_build_object('request_id', req.id, 'status', 'rejected');
  end if;

  if p_counts_toward_headcount is null then
    raise exception '核准時須選擇是否計人頭';
  end if;

  v_trial_type := coalesce(nullif(btrim(p_trial_type), ''), '免費試堂');
  if v_trial_type not in ('免費試堂', '半價試堂', '原價試堂', '體驗課') then
    raise exception '試堂類型無效';
  end if;

  for ln in
    select * from public.trial_invite_request_lines where request_id = req.id
  loop
    if exists (
      select 1
      from public.student_class_enrollments e
      where e.student_id = req.student_id
        and e.class_id = ln.class_id
        and e.status = '就讀中'
    ) then
      raise exception '學生已報讀「%」，無法核准試堂', ln.class_label;
    end if;

    select array_agg(peer.id order by peer.scheduled_date, peer.start_time)
    into v_schedule_ids
    from public.schedules anchor
    join public.schedules peer
      on peer.id = anchor.id
      or (
        anchor.consecutive_group_id is not null
        and peer.consecutive_group_id = anchor.consecutive_group_id
      )
    where anchor.id = ln.schedule_id;

    if v_schedule_ids is null or cardinality(v_schedule_ids) = 0 then
      raise exception '堂次不存在：%', ln.class_label;
    end if;

    for v_peer in
      select *
      from public.schedules
      where id = any (v_schedule_ids)
    loop
      if v_peer.class_id <> ln.class_id then
        raise exception '堂次與班別不符：%', ln.class_label;
      end if;
      if coalesce(v_peer.status, '') ilike '%取消%' then
        raise exception '堂次已取消：%', ln.class_label;
      end if;
      if v_peer.scheduled_date < v_today then
        raise exception '不可核准過去日期的試堂：%', ln.class_label;
      end if;
      if exists (
        select 1
        from public.trial_sessions ts
        where ts.student_id = req.student_id
          and ts.schedule_id = v_peer.id
          and coalesce(ts.status, '') not ilike '%取消%'
          and coalesce(ts.status, '') not ilike '%完成%'
      ) then
        raise exception '此學生對「%」該堂已有未結案試堂', ln.class_label;
      end if;

      insert into public.trial_sessions (
        student_id,
        schedule_id,
        class_id,
        trial_date,
        trial_type,
        status,
        remarks,
        payment_id,
        counts_toward_headcount
      ) values (
        req.student_id,
        v_peer.id,
        ln.class_id,
        v_peer.scheduled_date,
        v_trial_type,
        '已預約',
        '試堂邀請核准',
        null,
        p_counts_toward_headcount
      )
      returning id into v_new_id;
      v_created_ids := array_append(v_created_ids, v_new_id);
      v_created := v_created + 1;
    end loop;
  end loop;

  update public.trial_invite_requests
  set
    status = 'approved',
    trial_type = v_trial_type,
    counts_toward_headcount = p_counts_toward_headcount,
    reviewed_at = now()
  where id = req.id;

  update public.trial_invite_tokens
  set status = 'approved', approved_at = now()
  where id = tok.id;

  return jsonb_build_object(
    'request_id', req.id,
    'status', 'approved',
    'trial_sessions_created', v_created,
    'trial_session_ids', to_jsonb(v_created_ids)
  );
end;
$$;

revoke all on function public.trial_invite_review(uuid, text, boolean, text, text) from public;
revoke all on function public.trial_invite_review(uuid, text, boolean, text, text) from anon;
grant execute on function public.trial_invite_review(uuid, text, boolean, text, text) to authenticated;

notify pgrst, 'reload schema';

commit;
