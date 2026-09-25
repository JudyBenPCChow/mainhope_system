-- 家長連結自填新生資料：提交後寫入收件匣，供前台於學生管理核對建檔

begin;

alter table public.inbox_events
  drop constraint if exists inbox_events_event_type_check;

alter table public.inbox_events
  add constraint inbox_events_event_type_check check (
    event_type in (
      'schedule_created',
      'schedule_updated',
      'schedule_cancelled',
      'schedule_substitute',
      'class_updated',
      'class_teacher_changed',
      'leave_created',
      'system_update',
      'trial_confirmed',
      'attendance_reminder',
      'student_intake_submitted'
    )
  );

comment on constraint inbox_events_event_type_check on public.inbox_events is
  '含家長連結提交新生資料（student_intake_submitted；前台收件匣核對）。';

-- 家長提交：open→submitted 時寫一則營運收件匣（重交不重複寫）
create or replace function public.front_desk_intake_submit(p_token text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.front_desk_intake_sessions%rowtype;
  v_name text;
  v_prev_status text;
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

  v_prev_status := r.status;

  update public.front_desk_intake_sessions
  set
    status = 'submitted',
    payload = p_payload,
    submitted_at = now()
  where id = r.id
  returning * into r;

  if v_prev_status = 'open' then
    insert into public.inbox_events (
      event_type,
      category,
      title,
      body,
      action_path,
      audience_teacher_ids,
      audience_roles,
      payload
    )
    values (
      'student_intake_submitted',
      'ops',
      format('家長已提交新生資料：%s', v_name),
      '請於學生管理核對個人資料後建立學籍。',
      '/Students?intakeToken=' || r.token,
      '{}'::uuid[],
      '{}'::text[],
      jsonb_build_object(
        'intake_session_id', r.id,
        'intake_token', r.token,
        'full_name', v_name
      )
    );
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

revoke all on function public.front_desk_intake_submit(text, jsonb) from public;
grant execute on function public.front_desk_intake_submit(text, jsonb) to anon, authenticated;

notify pgrst, 'reload schema';

commit;
