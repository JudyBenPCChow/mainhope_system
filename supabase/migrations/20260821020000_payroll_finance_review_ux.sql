-- 計糧財務核對：老師收件匣可收財務發出的補點名提醒；財務可標「已請補點、等重算」。

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
      'attendance_reminder'
    )
  );

comment on constraint inbox_events_event_type_check on public.inbox_events is
  '含財務由計糧頁發出的 attendance_reminder（老師收件匣「提醒點名」）。';

alter table public.payroll_teacher_states
  add column if not exists roll_call_waiting boolean not null default false;

comment on column public.payroll_teacher_states.roll_call_waiting is
  '財務已請補點、等重算。不解除未點名硬擋；排除該人其餘仍可交。';

create or replace function public.payroll_teacher_states_enforce_capabilities()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.finance_reviewed
      and not private.has_capability('payroll.review')
    then
      raise exception 'PAYROLL_REVIEW_DENIED' using errcode = '42501';
    end if;
    if new.excluded
      and not private.has_capability('payroll.exclude')
    then
      raise exception 'PAYROLL_EXCLUDE_DENIED' using errcode = '42501';
    end if;
    if new.submit_status in ('submitted', 'accepted')
      and not private.has_capability('payroll.submit')
    then
      raise exception 'PAYROLL_SUBMIT_DENIED' using errcode = '42501';
    end if;
    if new.submit_status = 'returned'
      and not private.has_capability('payroll.return')
    then
      raise exception 'PAYROLL_RETURN_DENIED' using errcode = '42501';
    end if;
    if new.manager_spot_checked
      and not private.has_capability('payroll.verify')
    then
      raise exception 'PAYROLL_VERIFY_DENIED' using errcode = '42501';
    end if;
    if new.roll_call_waiting
      and not private.has_capability('payroll.review')
    then
      raise exception 'PAYROLL_REVIEW_DENIED' using errcode = '42501';
    end if;
    if not new.finance_reviewed
      and not new.excluded
      and new.submit_status in ('none')
      and not new.manager_spot_checked
      and not new.roll_call_waiting
      and not (
        private.has_capability('payroll.prepare')
        or private.has_capability('payroll.review')
      )
    then
      raise exception 'PAYROLL_PREPARE_DENIED' using errcode = '42501';
    end if;
    return new;
  end if;

  if new.finance_reviewed is distinct from old.finance_reviewed
    and not private.has_capability('payroll.review')
  then
    raise exception 'PAYROLL_REVIEW_DENIED' using errcode = '42501';
  end if;
  if new.roll_call_waiting is distinct from old.roll_call_waiting
    and not private.has_capability('payroll.review')
  then
    raise exception 'PAYROLL_REVIEW_DENIED' using errcode = '42501';
  end if;
  if (new.excluded is distinct from old.excluded
      or new.exclude_reason is distinct from old.exclude_reason)
    and not private.has_capability('payroll.exclude')
  then
    raise exception 'PAYROLL_EXCLUDE_DENIED' using errcode = '42501';
  end if;
  if new.submit_status is distinct from old.submit_status then
    if new.submit_status in ('submitted', 'accepted')
      and not private.has_capability('payroll.submit')
    then
      raise exception 'PAYROLL_SUBMIT_DENIED' using errcode = '42501';
    end if;
    if new.submit_status = 'returned'
      and not private.has_capability('payroll.return')
    then
      raise exception 'PAYROLL_RETURN_DENIED' using errcode = '42501';
    end if;
    if new.submit_status = 'none'
      and not (
        private.has_capability('payroll.submit')
        or private.has_capability('payroll.return')
      )
    then
      raise exception 'PAYROLL_SUBMIT_DENIED' using errcode = '42501';
    end if;
  end if;
  if new.manager_spot_checked is distinct from old.manager_spot_checked
    and not private.has_capability('payroll.verify')
  then
    raise exception 'PAYROLL_VERIFY_DENIED' using errcode = '42501';
  end if;

  return new;
end;
$$;
