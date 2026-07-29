-- Portal 核准：只建報讀，不再自動建立「待繳費」INV 單
-- 系統通知：欠費入口精簡（行政／外星人）

begin;

create or replace function public.review_portal_enrollment_request(
  p_request_id uuid,
  p_approve boolean,
  p_staff_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.portal_enrollment_requests%rowtype;
  v_line public.portal_enrollment_request_lines%rowtype;
  v_reviewer uuid;
  v_today date := (timezone('Asia/Hong_Kong', now()))::date;
  v_enrollment_id uuid;
  v_existing_id uuid;
  v_existing_status text;
begin
  if not public.is_mgmt_staff() then
    raise exception '僅職員可審核報讀申請';
  end if;

  select au.id into v_reviewer
  from public.app_users au
  where lower(coalesce(au.email, '')) = public.current_app_user_email()
  limit 1;

  select * into v_req
  from public.portal_enrollment_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception '找不到申請';
  end if;
  if v_req.status <> 'submitted' then
    raise exception '此申請已處理';
  end if;

  if not p_approve then
    update public.portal_enrollment_requests
    set status = 'rejected',
        staff_note = nullif(trim(coalesce(p_staff_note, '')), ''),
        reviewed_by = v_reviewer,
        reviewed_at = now(),
        updated_at = now()
    where id = p_request_id;
    return p_request_id;
  end if;

  for v_line in
    select * from public.portal_enrollment_request_lines
    where request_id = p_request_id
    order by created_at
  loop
    select id, status into v_existing_id, v_existing_status
    from public.student_class_enrollments
    where student_id = v_req.student_id
      and class_id = v_line.class_id
    limit 1;

    if v_existing_id is not null then
      if v_existing_status = '就讀中' then
        raise exception '學生已報讀「%」，請先處理既有報讀', coalesce(v_line.class_label, v_line.class_id::text);
      end if;
      update public.student_class_enrollments
      set status = '就讀中',
          enroll_date = v_today,
          enrollment_period = v_line.enrollment_period,
          updated_at = now()
      where id = v_existing_id;
      v_enrollment_id := v_existing_id;
      delete from public.student_enrollment_sessions where enrollment_id = v_enrollment_id;
    else
      insert into public.student_class_enrollments (
        student_id, class_id, status, enroll_date, enrollment_period
      ) values (
        v_req.student_id, v_line.class_id, '就讀中', v_today, v_line.enrollment_period
      )
      returning id into v_enrollment_id;
    end if;

    if v_line.enrollment_period = '單堂' then
      insert into public.student_enrollment_sessions (enrollment_id, schedule_id)
      select v_enrollment_id, sid
      from unnest(v_line.schedule_ids) sid
      on conflict do nothing;
    end if;

    insert into public.enrollment_change_events (
      student_id, class_id, enrollment_id, action, effective_date, reason, enrollment_period
    ) values (
      v_req.student_id,
      v_line.class_id,
      v_enrollment_id,
      'enroll',
      v_today,
      '家長報讀申請核准',
      v_line.enrollment_period
    );
  end loop;

  update public.portal_enrollment_requests
  set status = 'approved',
      payment_id = null,
      staff_note = nullif(trim(coalesce(p_staff_note, '')), ''),
      reviewed_by = v_reviewer,
      reviewed_at = now(),
      updated_at = now()
  where id = p_request_id;

  return p_request_id;
end;
$$;

comment on function public.review_portal_enrollment_request(uuid, boolean, text) is
  '職員核准（只建報讀，不自動開待繳費單）或拒絕家長報讀申請。';

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
select
  'system_update',
  'system',
  '欠費與收款入口已精簡（2026-07）',
  E'請行政／外星人注意以下變更：\n\n1. 學生管理列表已取消「追收學費」標籤（不再於成表即時運算欠費）。\n2. 已停用新建「待繳費」收據式通知單；日常請用「已收款」或「待收款」。下期學費改以文字／WhatsApp 提醒家長（收款登記可協助）。\n3. 「每月學費」頁已從側欄下線（舊網址會轉去收款登記）；相關資料表仍保留供請假結餘等使用。\n4. 家長 Portal 核准報讀後，不再自動開待繳費單，請職員於收款登記入帳。\n\n歷史「待繳費」單據仍可於繳費紀錄篩選並標記已收。',
  '/Payments',
  '{}'::uuid[],
  array['admin', 'alien']::text[],
  '{}'::jsonb
where not exists (
  select 1
  from public.inbox_events e
  where e.event_type = 'system_update'
    and e.title = '欠費與收款入口已精簡（2026-07）'
);

commit;
