-- 功課輔導班公開頁：第一頁先寫潛在客戶並回傳 lead_id；第二頁可補一個試堂日子。

begin;

create or replace function public.ad_homework_details_submit(
  p_full_name text,
  p_school text,
  p_grade text,
  p_phone text,
  p_note text default null,
  p_company text default null,
  p_contact_method text default 'WhatsApp',
  p_wechat_id text default null,
  p_phone_country_code text default '+852',
  p_rate_client_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grade text;
  v_phone text;
  v_cc text;
  v_method text;
  v_wechat text;
  v_name text;
  v_school text;
  v_note text;
  v_lead_id uuid;
  v_rate_key text := nullif(btrim(coalesce(p_rate_client_key, '')), '');
begin
  perform public.ad_public_assert_rate_limit('submit', v_rate_key);

  if nullif(btrim(coalesce(p_company, '')), '') is not null then
    return jsonb_build_object('accepted', true);
  end if;

  v_name := btrim(coalesce(p_full_name, ''));
  v_school := btrim(coalesce(p_school, ''));
  v_note := nullif(btrim(coalesce(p_note, '')), '');
  v_grade := public.ad_trial_normalize_grade(p_grade);
  v_method := case when btrim(coalesce(p_contact_method, '')) = 'WeChat' then 'WeChat' else 'WhatsApp' end;
  v_wechat := nullif(btrim(coalesce(p_wechat_id, '')), '');
  v_cc := case
    when btrim(coalesce(p_phone_country_code, '')) in ('+86', '86') then '+86'
    else '+852'
  end;
  v_phone := public.ad_trial_normalize_phone(p_phone, v_cc);

  if v_name = '' or char_length(v_name) > 80 then
    raise exception '請填寫姓名';
  end if;
  if v_school = '' or char_length(v_school) > 120 then
    raise exception '請填寫學校';
  end if;
  if v_grade is null then
    raise exception '請選擇年級';
  end if;
  if v_method = 'WeChat' then
    v_phone := null;
    v_cc := '+852';
    if v_wechat is null or char_length(v_wechat) > 40 then
      raise exception '請填寫 WeChat ID';
    end if;
  else
    v_wechat := null;
    if v_phone is null then
      if v_cc = '+86' then
        raise exception '請填寫 11 位聯絡電話';
      end if;
      raise exception '請填寫 8 位聯絡電話';
    end if;
  end if;
  if v_note is not null and char_length(v_note) > 500 then
    raise exception '備註過長';
  end if;

  if v_phone is not null then
    select l.id into v_lead_id
    from public.leads l
    where l.phone_normalized = v_phone
      and l.phone_country_code = v_cc
      and l.source = 'ad_trial'
      and l.interested_subjects = array['功課輔導']::text[]
      and l.created_at > now() - interval '24 hours'
    order by l.created_at desc
    limit 1;
  elsif v_wechat is not null then
    select l.id into v_lead_id
    from public.leads l
    where lower(l.wechat_id) = lower(v_wechat)
      and l.source = 'ad_trial'
      and l.interested_subjects = array['功課輔導']::text[]
      and l.created_at > now() - interval '24 hours'
    order by l.created_at desc
    limit 1;
  end if;

  if v_lead_id is not null then
    return jsonb_build_object('accepted', true, 'lead_id', v_lead_id);
  end if;

  insert into public.leads (
    full_name, school, grade, phone, phone_normalized, phone_country_code, note, source, status,
    contact_method, wechat_id, interested_subjects
  ) values (
    v_name, v_school, v_grade, v_phone, v_phone, v_cc, v_note, 'ad_trial', 'new',
    v_method, v_wechat, array['功課輔導']::text[]
  )
  returning id into v_lead_id;

  perform public.ad_public_mark_submit_accepted(v_rate_key);
  return jsonb_build_object('accepted', true, 'lead_id', v_lead_id);
end;
$$;

comment on function public.ad_homework_details_submit(text, text, text, text, text, text, text, text, text, text) is
  '功課輔導班公開頁第一頁：只寫潛在客戶。24 小時內同一聯絡重交則回傳原 lead_id。';

revoke all on function public.ad_homework_details_submit(text, text, text, text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.ad_homework_details_submit(text, text, text, text, text, text, text, text, text, text) to service_role;

create or replace function public.ad_homework_attach_date(
  p_lead_id uuid,
  p_class_id uuid,
  p_schedule_id uuid,
  p_company text default null,
  p_rate_client_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kind text;
  v_label text;
  v_date date;
  v_start time;
  v_end time;
  v_rate_key text := nullif(btrim(coalesce(p_rate_client_key, '')), '');
begin
  perform public.ad_public_assert_rate_limit('submit', v_rate_key);

  if nullif(btrim(coalesce(p_company, '')), '') is not null then
    return jsonb_build_object('accepted', true);
  end if;

  if p_lead_id is null or p_class_id is null or p_schedule_id is null then
    raise exception '請選擇一個試堂日子';
  end if;

  if not exists (
    select 1
    from public.leads l
    where l.id = p_lead_id
      and l.source = 'ad_trial'
      and l.interested_subjects = array['功課輔導']::text[]
      and l.created_at > now() - interval '6 hours'
      and l.status in ('new', 'contacted')
  ) then
    raise exception '找不到剛提交的資料，請重新填寫';
  end if;

  if not public.ad_homework_catalog_allows_class(p_class_id) then
    raise exception '所選功課輔導班目前未開放';
  end if;
  if not public.ad_trial_schedule_open(p_schedule_id) then
    raise exception '所選堂次無效、已取消或未開放';
  end if;
  if not exists (
    select 1 from public.schedules sch
    where sch.id = p_schedule_id and sch.class_id = p_class_id
  ) then
    raise exception '所選堂次不屬於該班';
  end if;

  select c.class_kind into v_kind
  from public.classes c
  where c.id = p_class_id;

  if v_kind is distinct from 'homework' then
    raise exception '只可選擇功課輔導班';
  end if;

  select
    coalesce(nullif(btrim(co.course_name), ''), nullif(btrim(c.subject), ''), nullif(btrim(c.course_code_full), ''), '功課輔導班'),
    sch.scheduled_date, sch.start_time, sch.end_time
  into v_label, v_date, v_start, v_end
  from public.schedules sch
  join public.classes c on c.id = sch.class_id
  left join public.courses co on co.id = c.course_id
  where sch.id = p_schedule_id;

  delete from public.lead_trial_intentions
  where lead_id = p_lead_id;

  insert into public.lead_trial_intentions (
    lead_id, class_id, schedule_id, class_label, scheduled_date, start_time, end_time
  ) values (
    p_lead_id, p_class_id, p_schedule_id, v_label, v_date, v_start, v_end
  );

  perform public.ad_public_mark_submit_accepted(v_rate_key);
  return jsonb_build_object('accepted', true);
end;
$$;

comment on function public.ad_homework_attach_date(uuid, uuid, uuid, text, text) is
  '功課輔導班公開頁第二頁：把一個試堂日子補到剛提交的潛在客戶。不另開一筆。';

revoke all on function public.ad_homework_attach_date(uuid, uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.ad_homework_attach_date(uuid, uuid, uuid, text, text) to service_role;

notify pgrst, 'reload schema';

commit;
