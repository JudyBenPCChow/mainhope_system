-- 自動電郵寄出紀錄：同一 job、同一目標日、同一收件人只成功寄一次。
-- 排程可在時段內多次呼叫；已成功則跳過，失敗或逾時的「寄出中」才補寄。

create table if not exists public.scheduled_email_sends (
  job_key text not null,
  target_date date not null,
  recipient text not null,
  status text not null,
  resend_id text,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  constraint scheduled_email_sends_pkey primary key (job_key, target_date, recipient),
  constraint scheduled_email_sends_status_check check (status in ('sending', 'sent', 'failed'))
);

comment on table public.scheduled_email_sends is
  '自動電郵寄出紀錄。job_key 例：tomorrow-lesson、missing-roll-call、trial-followup-pdf、tuition-chase-pdf。';

alter table public.scheduled_email_sends enable row level security;

drop policy if exists rls_cap_select_scheduled_email_sends on public.scheduled_email_sends;
create policy rls_cap_select_scheduled_email_sends
on public.scheduled_email_sends
for select
to authenticated
using (public.is_mgmt_staff());

grant select on public.scheduled_email_sends to authenticated;
grant select, insert, update, delete on public.scheduled_email_sends to service_role;

create or replace function public.claim_scheduled_email_send(
  p_job_key text,
  p_target_date date,
  p_recipient text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient text := lower(trim(p_recipient));
  v_status text;
  v_started timestamptz;
begin
  if p_job_key is null or length(trim(p_job_key)) = 0 then
    raise exception 'job_key 空白';
  end if;
  if v_recipient is null or position('@' in v_recipient) = 0 then
    raise exception '收件空白';
  end if;

  insert into public.scheduled_email_sends (job_key, target_date, recipient, status)
  values (trim(p_job_key), p_target_date, v_recipient, 'sending')
  on conflict (job_key, target_date, recipient) do nothing;

  if found then
    return 'send';
  end if;

  select status, started_at
  into v_status, v_started
  from public.scheduled_email_sends
  where job_key = trim(p_job_key)
    and target_date = p_target_date
    and recipient = v_recipient;

  if v_status = 'sent' then
    return 'skip';
  end if;

  if v_status = 'sending' and v_started > now() - interval '3 minutes' then
    return 'skip';
  end if;

  update public.scheduled_email_sends
  set status = 'sending',
      started_at = now(),
      finished_at = null,
      error = null,
      resend_id = null
  where job_key = trim(p_job_key)
    and target_date = p_target_date
    and recipient = v_recipient
    and status <> 'sent';

  if found then
    return 'send';
  end if;

  return 'skip';
end;
$$;

create or replace function public.finish_scheduled_email_send(
  p_job_key text,
  p_target_date date,
  p_recipient text,
  p_ok boolean,
  p_resend_id text default null,
  p_error text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient text := lower(trim(p_recipient));
begin
  if p_job_key is null or length(trim(p_job_key)) = 0 then
    raise exception 'job_key 空白';
  end if;
  if v_recipient is null or position('@' in v_recipient) = 0 then
    raise exception '收件空白';
  end if;

  insert into public.scheduled_email_sends (
    job_key, target_date, recipient, status, resend_id, error, started_at, finished_at
  ) values (
    trim(p_job_key),
    p_target_date,
    v_recipient,
    case when p_ok then 'sent' else 'failed' end,
    nullif(trim(coalesce(p_resend_id, '')), ''),
    nullif(left(coalesce(p_error, ''), 500), ''),
    now(),
    now()
  )
  on conflict (job_key, target_date, recipient) do update
  set status = excluded.status,
      resend_id = excluded.resend_id,
      error = excluded.error,
      finished_at = now();
end;
$$;

revoke all on function public.claim_scheduled_email_send(text, date, text) from public, anon, authenticated;
revoke all on function public.finish_scheduled_email_send(text, date, text, boolean, text, text) from public, anon, authenticated;
grant execute on function public.claim_scheduled_email_send(text, date, text) to service_role;
grant execute on function public.finish_scheduled_email_send(text, date, text, boolean, text, text) to service_role;

create or replace function public.enqueue_scheduled_email_http(
  p_function text,
  p_body jsonb
) returns bigint
language plpgsql
security definer
set search_path = public, vault, net
as $$
declare
  v_url text;
  v_secret text;
  v_id bigint;
begin
  select decrypted_secret into v_url
  from vault.decrypted_secrets
  where name = 'project_url';
  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'scheduled_email_cron_secret';
  if v_url is null or v_secret is null then
    raise exception '缺少 vault：project_url 或 scheduled_email_cron_secret';
  end if;

  select net.http_post(
    url := v_url || '/functions/v1/' || p_function,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_secret
    ),
    body := p_body,
    timeout_milliseconds := 120000
  ) into v_id;
  return v_id;
end;
$$;

revoke all on function public.enqueue_scheduled_email_http(text, jsonb) from public, anon, authenticated, service_role;

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 重新登記前先卸下同名工作，方便這份 migration 重跑時不疊加。
do $$
declare
  r record;
begin
  for r in
    select jobid from cron.job
    where jobname like 'scheduled-email-%'
  loop
    perform cron.unschedule(r.jobid);
  end loop;
end;
$$;

-- 明日課堂：香港 17:37、17:47、18:07、19:00（UTC+8）
select cron.schedule(
  'scheduled-email-tomorrow-1737',
  '37 9 * * *',
  $$select public.enqueue_scheduled_email_http(
      'tomorrow-teacher-lesson-reminder',
      jsonb_build_object(
        'slot', '1737',
        'send_day', to_char((timezone('Asia/Hong_Kong', now()))::date, 'YYYY-MM-DD'),
        'target_date', to_char((timezone('Asia/Hong_Kong', now()))::date + 1, 'YYYY-MM-DD')
      )
    )$$
);
select cron.schedule(
  'scheduled-email-tomorrow-1747',
  '47 9 * * *',
  $$select public.enqueue_scheduled_email_http(
      'tomorrow-teacher-lesson-reminder',
      jsonb_build_object(
        'slot', '1737',
        'send_day', to_char((timezone('Asia/Hong_Kong', now()))::date, 'YYYY-MM-DD'),
        'target_date', to_char((timezone('Asia/Hong_Kong', now()))::date + 1, 'YYYY-MM-DD')
      )
    )$$
);
select cron.schedule(
  'scheduled-email-tomorrow-1807',
  '7 10 * * *',
  $$select public.enqueue_scheduled_email_http(
      'tomorrow-teacher-lesson-reminder',
      jsonb_build_object(
        'slot', '1737',
        'send_day', to_char((timezone('Asia/Hong_Kong', now()))::date, 'YYYY-MM-DD'),
        'target_date', to_char((timezone('Asia/Hong_Kong', now()))::date + 1, 'YYYY-MM-DD')
      )
    )$$
);
select cron.schedule(
  'scheduled-email-tomorrow-1900',
  '0 11 * * *',
  $$select public.enqueue_scheduled_email_http(
      'tomorrow-teacher-lesson-reminder',
      jsonb_build_object(
        'slot', '1737',
        'send_day', to_char((timezone('Asia/Hong_Kong', now()))::date, 'YYYY-MM-DD'),
        'target_date', to_char((timezone('Asia/Hong_Kong', now()))::date + 1, 'YYYY-MM-DD')
      )
    )$$
);

-- 尚未點名：香港 08:00、08:10、08:30、09:00
select cron.schedule(
  'scheduled-email-rollcall-0800',
  '0 0 * * *',
  $$select public.enqueue_scheduled_email_http(
      'missing-roll-call-admin-report',
      jsonb_build_object(
        'send_day', to_char((timezone('Asia/Hong_Kong', now()))::date, 'YYYY-MM-DD')
      )
    )$$
);
select cron.schedule(
  'scheduled-email-rollcall-0810',
  '10 0 * * *',
  $$select public.enqueue_scheduled_email_http(
      'missing-roll-call-admin-report',
      jsonb_build_object(
        'send_day', to_char((timezone('Asia/Hong_Kong', now()))::date, 'YYYY-MM-DD')
      )
    )$$
);
select cron.schedule(
  'scheduled-email-rollcall-0830',
  '30 0 * * *',
  $$select public.enqueue_scheduled_email_http(
      'missing-roll-call-admin-report',
      jsonb_build_object(
        'send_day', to_char((timezone('Asia/Hong_Kong', now()))::date, 'YYYY-MM-DD')
      )
    )$$
);
select cron.schedule(
  'scheduled-email-rollcall-0900',
  '0 1 * * *',
  $$select public.enqueue_scheduled_email_http(
      'missing-roll-call-admin-report',
      jsonb_build_object(
        'send_day', to_char((timezone('Asia/Hong_Kong', now()))::date, 'YYYY-MM-DD')
      )
    )$$
);

-- 試堂及追收 PDF：香港星期二、五 10:00、10:10、10:30、11:00
select cron.schedule(
  'scheduled-email-pdf-1000',
  '0 2 * * 2,5',
  $$select public.enqueue_scheduled_email_http(
      'admin-pdf-reports',
      jsonb_build_object(
        'send_day', to_char((timezone('Asia/Hong_Kong', now()))::date, 'YYYY-MM-DD'),
        'scheduled', true
      )
    )$$
);
select cron.schedule(
  'scheduled-email-pdf-1010',
  '10 2 * * 2,5',
  $$select public.enqueue_scheduled_email_http(
      'admin-pdf-reports',
      jsonb_build_object(
        'send_day', to_char((timezone('Asia/Hong_Kong', now()))::date, 'YYYY-MM-DD'),
        'scheduled', true
      )
    )$$
);
select cron.schedule(
  'scheduled-email-pdf-1030',
  '30 2 * * 2,5',
  $$select public.enqueue_scheduled_email_http(
      'admin-pdf-reports',
      jsonb_build_object(
        'send_day', to_char((timezone('Asia/Hong_Kong', now()))::date, 'YYYY-MM-DD'),
        'scheduled', true
      )
    )$$
);
select cron.schedule(
  'scheduled-email-pdf-1100',
  '0 3 * * 2,5',
  $$select public.enqueue_scheduled_email_http(
      'admin-pdf-reports',
      jsonb_build_object(
        'send_day', to_char((timezone('Asia/Hong_Kong', now()))::date, 'YYYY-MM-DD'),
        'scheduled', true
      )
    )$$
);
