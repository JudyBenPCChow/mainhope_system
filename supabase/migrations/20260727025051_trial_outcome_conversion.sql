-- 試堂結果追蹤：轉化／流失／其他（與 status 已預約／已完成／取消分開）

alter table public.trial_sessions
  add column if not exists outcome text not null default 'open',
  add column if not exists outcome_reason text,
  add column if not exists outcome_note text,
  add column if not exists outcome_at timestamptz,
  add column if not exists converted_enrollment_id uuid references public.student_class_enrollments (id) on delete set null,
  add column if not exists converted_payment_id uuid references public.payments (id) on delete set null;

alter table public.trial_sessions
  drop constraint if exists trial_sessions_outcome_check;

alter table public.trial_sessions
  add constraint trial_sessions_outcome_check
  check (outcome in ('open', 'converted', 'lost', 'other'));

comment on column public.trial_sessions.outcome is
  '試堂結果：open 待跟進／converted 已轉化／lost 已流失／other 其他（復盤用）';
comment on column public.trial_sessions.outcome_reason is
  '結果原因（流失原因或「其他結果」說明）';
comment on column public.trial_sessions.outcome_note is
  '結果補充備註';
comment on column public.trial_sessions.outcome_at is
  '結果登記時間';
comment on column public.trial_sessions.converted_enrollment_id is
  '轉正式報讀後關聯的 student_class_enrollments.id';
comment on column public.trial_sessions.converted_payment_id is
  '轉正式報讀時一併建立的 payments.id（可空）';

create index if not exists trial_sessions_outcome_idx
  on public.trial_sessions (outcome);

create index if not exists trial_sessions_outcome_at_idx
  on public.trial_sessions (outcome_at);

create index if not exists trial_sessions_converted_enrollment_id_idx
  on public.trial_sessions (converted_enrollment_id);

-- 歷史：同班已就讀中且試堂未標取消 → 補轉化結果（盡力而為）
update public.trial_sessions t
set
  outcome = 'converted',
  outcome_reason = coalesce(nullif(btrim(t.outcome_reason), ''), '報讀後自動結案'),
  outcome_at = coalesce(t.outcome_at, t.updated_at, now()),
  converted_enrollment_id = coalesce(
    t.converted_enrollment_id,
    (
      select e.id
      from public.student_class_enrollments e
      where e.student_id = t.student_id
        and e.class_id = t.class_id
        and e.status = '就讀中'
      order by e.updated_at desc nulls last
      limit 1
    )
  ),
  status = case
    when coalesce(t.status, '') like '%取消%' then t.status
    when coalesce(t.status, '') like '%完成%' then t.status
    else '已完成'
  end,
  updated_at = now()
where exists (
  select 1
  from public.student_class_enrollments e
  where e.student_id = t.student_id
    and e.class_id = t.class_id
    and e.status = '就讀中'
)
  and coalesce(t.outcome, 'open') = 'open'
  and coalesce(t.status, '') not like '%取消%';
