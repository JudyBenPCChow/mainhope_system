-- 每月 1 日香港 10:00、10:10、10:30、11:00 觸發新報讀整體報告。
-- 只卸下本報告的同名工作，不碰星期二、五及其他自動信。

do $$
declare
  r record;
begin
  for r in
    select jobid from cron.job
    where jobname like 'scheduled-email-month-enrollment-%'
  loop
    perform cron.unschedule(r.jobid);
  end loop;
end;
$$;

select cron.schedule(
  'scheduled-email-month-enrollment-1000',
  '0 2 1 * *',
  $$select public.enqueue_scheduled_email_http(
      'monthly-new-enrollment-report',
      jsonb_build_object(
        'send_day', to_char((timezone('Asia/Hong_Kong', now()))::date, 'YYYY-MM-DD'),
        'scheduled', true
      )
    )$$
);

select cron.schedule(
  'scheduled-email-month-enrollment-1010',
  '10 2 1 * *',
  $$select public.enqueue_scheduled_email_http(
      'monthly-new-enrollment-report',
      jsonb_build_object(
        'send_day', to_char((timezone('Asia/Hong_Kong', now()))::date, 'YYYY-MM-DD'),
        'scheduled', true
      )
    )$$
);

select cron.schedule(
  'scheduled-email-month-enrollment-1030',
  '30 2 1 * *',
  $$select public.enqueue_scheduled_email_http(
      'monthly-new-enrollment-report',
      jsonb_build_object(
        'send_day', to_char((timezone('Asia/Hong_Kong', now()))::date, 'YYYY-MM-DD'),
        'scheduled', true
      )
    )$$
);

select cron.schedule(
  'scheduled-email-month-enrollment-1100',
  '0 3 1 * *',
  $$select public.enqueue_scheduled_email_http(
      'monthly-new-enrollment-report',
      jsonb_build_object(
        'send_day', to_char((timezone('Asia/Hong_Kong', now()))::date, 'YYYY-MM-DD'),
        'scheduled', true
      )
    )$$
);
