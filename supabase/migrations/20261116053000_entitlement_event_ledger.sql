-- 已繳堂數：流水是真源；尚餘只由 INSERT 投影。上線不重算歷史 22 口。
-- 套用：npm run db:apply -- supabase/migrations/20261116053000_entitlement_event_ledger.sql

begin;

alter table public.entitlement_consumption_events
  add column if not exists ending_remaining numeric(8, 2);

comment on column public.entitlement_consumption_events.ending_remaining is
  '此列入帳後該口尚餘（投影前讀 remaining + delta）。';

-- ---------------------------------------------------------------------------
-- 投影器與欄位閘
-- ---------------------------------------------------------------------------

create or replace function private.project_entitlement_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_end numeric;
  v_is_credit boolean;
begin
  perform set_config('app.entitlement_projecting', '1', true);

  if tg_table_name = 'entitlement_consumption_events' then
    v_is_credit := new.reason in ('entitlement_top_up', 'entitlement_clawback');
  else
    v_is_credit := false;
  end if;

  if v_is_credit then
    update public.student_entitlement_pools
    set
      remaining_lessons = remaining_lessons + new.delta_lessons,
      initial_lessons = initial_lessons + new.delta_lessons,
      updated_at = now()
    where id = new.pool_id
    returning remaining_lessons into v_end;
  else
    update public.student_entitlement_pools
    set
      remaining_lessons = remaining_lessons + new.delta_lessons,
      updated_at = now()
    where id = new.pool_id
    returning remaining_lessons into v_end;
  end if;

  if not found then
    raise exception 'POOL_MISSING' using errcode = 'P0002';
  end if;

  perform set_config('app.entitlement_projecting', '0', true);
  return new;
exception
  when others then
    perform set_config('app.entitlement_projecting', '0', true);
    raise;
end;
$$;

revoke all on function private.project_entitlement_balance() from public, anon, authenticated;

create or replace function private.trg_entitlement_event_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rem numeric;
begin
  if new.delta_lessons is null
    or new.delta_lessons = 0
    or new.delta_lessons <> trunc(new.delta_lessons)
  then
    raise exception 'ENTITLEMENT_DELTA_INVALID'
      using errcode = '22023', hint = '堂數差額須為非 0 整數';
  end if;

  if new.reason in ('entitlement_top_up', 'entitlement_clawback') then
    if new.payment_detail_id is null then
      raise exception 'ENTITLEMENT_PAYMENT_REQUIRED'
        using errcode = '22023', hint = '入帳／退堂必須有學費明細';
    end if;
    if new.reason = 'entitlement_top_up' and new.delta_lessons <= 0 then
      raise exception 'ENTITLEMENT_DELTA_INVALID' using errcode = '22023';
    end if;
    if new.reason = 'entitlement_clawback' and new.delta_lessons >= 0 then
      raise exception 'ENTITLEMENT_DELTA_INVALID' using errcode = '22023';
    end if;
  elsif new.reason in ('entitlement_consumed', 'entitlement_reinstated') then
    if new.schedule_id is null or new.attendance_detail_id is null then
      raise exception 'ENTITLEMENT_SCHEDULE_REQUIRED'
        using errcode = '22023', hint = '扣堂／退回必須有排程與出席列';
    end if;
    if new.reason = 'entitlement_consumed' and new.delta_lessons >= 0 then
      raise exception 'ENTITLEMENT_DELTA_INVALID' using errcode = '22023';
    end if;
    if new.reason = 'entitlement_reinstated' and new.delta_lessons <= 0 then
      raise exception 'ENTITLEMENT_DELTA_INVALID' using errcode = '22023';
    end if;
  else
    raise exception 'ENTITLEMENT_REASON_INVALID' using errcode = '22023';
  end if;

  if new.created_by is null then
    new.created_by := public.current_app_user_id();
  end if;

  select p.remaining_lessons
    into v_rem
  from public.student_entitlement_pools p
  where p.id = new.pool_id
  for update;
  if not found then
    raise exception 'POOL_MISSING' using errcode = 'P0002';
  end if;
  new.ending_remaining := coalesce(v_rem, 0) + new.delta_lessons;
  return new;
end;
$$;

revoke all on function private.trg_entitlement_event_before_insert() from public, anon, authenticated;

create or replace function private.trg_entitlement_adjustment_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rem numeric;
begin
  if new.delta_lessons is null
    or new.delta_lessons = 0
    or new.delta_lessons <> trunc(new.delta_lessons)
  then
    raise exception 'ENTITLEMENT_DELTA_INVALID'
      using errcode = '22023', hint = '堂數差額須為非 0 整數';
  end if;

  select p.remaining_lessons
    into v_rem
  from public.student_entitlement_pools p
  where p.id = new.pool_id
  for update;
  if not found then
    raise exception 'POOL_MISSING' using errcode = 'P0002';
  end if;
  new.before_remaining := coalesce(v_rem, 0);
  new.after_remaining := coalesce(v_rem, 0) + new.delta_lessons;
  return new;
end;
$$;

revoke all on function private.trg_entitlement_adjustment_before_insert() from public, anon, authenticated;

create or replace function private.trg_entitlement_ledger_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 出席／排程／宣告刪除時 FK ON DELETE SET NULL 會 UPDATE 流水；只准這三欄被清空。
  if tg_op = 'UPDATE'
    and tg_table_name = 'entitlement_consumption_events'
    and new.id is not distinct from old.id
    and new.pool_id is not distinct from old.pool_id
    and new.student_id is not distinct from old.student_id
    and new.delta_lessons is not distinct from old.delta_lessons
    and new.reason is not distinct from old.reason
    and new.payment_detail_id is not distinct from old.payment_detail_id
    and new.created_at is not distinct from old.created_at
    and new.created_by is not distinct from old.created_by
    and new.ending_remaining is not distinct from old.ending_remaining
    and (new.schedule_id is not distinct from old.schedule_id or new.schedule_id is null)
    and (
      new.attendance_detail_id is not distinct from old.attendance_detail_id
      or new.attendance_detail_id is null
    )
    and (new.declaration_id is not distinct from old.declaration_id or new.declaration_id is null)
  then
    return new;
  end if;

  raise exception 'ENTITLEMENT_LEDGER_IMMUTABLE'
    using errcode = '42501', hint = '已繳堂數流水不可改寫或刪除；請另插入更正事實';
end;
$$;

revoke all on function private.trg_entitlement_ledger_immutable() from public, anon, authenticated;

create or replace function private.trg_entitlement_pool_guard_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.remaining_lessons, 0) <> 0
    or coalesce(new.initial_lessons, 0) <> 0
  then
    raise exception 'ENTITLEMENT_POOL_INSERT_NONZERO'
      using errcode = '42501', hint = '鑄池時已繳／尚餘必須為 0';
  end if;
  return new;
end;
$$;

revoke all on function private.trg_entitlement_pool_guard_insert() from public, anon, authenticated;

create or replace function private.trg_entitlement_pool_guard_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.remaining_lessons is not distinct from old.remaining_lessons
    and new.initial_lessons is not distinct from old.initial_lessons
  then
    return new;
  end if;

  if current_setting('app.entitlement_recalculating', true) = '1' then
    return new;
  end if;

  if current_setting('app.entitlement_projecting', true) is distinct from '1'
    or pg_trigger_depth() < 2
  then
    raise exception 'ENTITLEMENT_BALANCE_READONLY'
      using errcode = '42501', hint = '尚餘／已收只能由流水投影更新';
  end if;
  return new;
end;
$$;

revoke all on function private.trg_entitlement_pool_guard_update() from public, anon, authenticated;

create or replace function private.trg_entitlement_pool_forbid_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'ENTITLEMENT_POOL_DELETE_DENIED'
    using errcode = '42501', hint = '不可刪已繳堂數紀錄';
end;
$$;

revoke all on function private.trg_entitlement_pool_forbid_delete() from public, anon, authenticated;

drop trigger if exists trg_entitlement_consumption_before_insert on public.entitlement_consumption_events;
create trigger trg_entitlement_consumption_before_insert
  before insert on public.entitlement_consumption_events
  for each row
  execute function private.trg_entitlement_event_before_insert();

drop trigger if exists trg_entitlement_consumption_project on public.entitlement_consumption_events;
create trigger trg_entitlement_consumption_project
  after insert on public.entitlement_consumption_events
  for each row
  execute function private.project_entitlement_balance();

drop trigger if exists trg_entitlement_consumption_immutable on public.entitlement_consumption_events;
create trigger trg_entitlement_consumption_immutable
  before update or delete on public.entitlement_consumption_events
  for each row
  execute function private.trg_entitlement_ledger_immutable();

alter table public.entitlement_consumption_events enable always trigger trg_entitlement_consumption_before_insert;
alter table public.entitlement_consumption_events enable always trigger trg_entitlement_consumption_project;
alter table public.entitlement_consumption_events enable always trigger trg_entitlement_consumption_immutable;

drop trigger if exists trg_entitlement_adjustment_before_insert on public.entitlement_pool_adjustments;
create trigger trg_entitlement_adjustment_before_insert
  before insert on public.entitlement_pool_adjustments
  for each row
  execute function private.trg_entitlement_adjustment_before_insert();

drop trigger if exists trg_entitlement_adjustment_project on public.entitlement_pool_adjustments;
create trigger trg_entitlement_adjustment_project
  after insert on public.entitlement_pool_adjustments
  for each row
  execute function private.project_entitlement_balance();

drop trigger if exists trg_entitlement_adjustment_immutable on public.entitlement_pool_adjustments;
create trigger trg_entitlement_adjustment_immutable
  before update or delete on public.entitlement_pool_adjustments
  for each row
  execute function private.trg_entitlement_ledger_immutable();

alter table public.entitlement_pool_adjustments enable always trigger trg_entitlement_adjustment_before_insert;
alter table public.entitlement_pool_adjustments enable always trigger trg_entitlement_adjustment_project;
alter table public.entitlement_pool_adjustments enable always trigger trg_entitlement_adjustment_immutable;

drop trigger if exists trg_entitlement_pool_guard_insert on public.student_entitlement_pools;
create trigger trg_entitlement_pool_guard_insert
  before insert on public.student_entitlement_pools
  for each row
  execute function private.trg_entitlement_pool_guard_insert();

drop trigger if exists trg_entitlement_pool_guard_update on public.student_entitlement_pools;
create trigger trg_entitlement_pool_guard_update
  before update on public.student_entitlement_pools
  for each row
  execute function private.trg_entitlement_pool_guard_update();

alter table public.student_entitlement_pools enable always trigger trg_entitlement_pool_guard_update;
alter table public.student_entitlement_pools enable always trigger trg_entitlement_pool_guard_insert;

drop trigger if exists trg_entitlement_pool_forbid_delete on public.student_entitlement_pools;
create trigger trg_entitlement_pool_forbid_delete
  before delete on public.student_entitlement_pools
  for each row
  execute function private.trg_entitlement_pool_forbid_delete();

alter table public.student_entitlement_pools enable always trigger trg_entitlement_pool_forbid_delete;

-- ---------------------------------------------------------------------------
-- 鑄池、加堂、退堂
-- ---------------------------------------------------------------------------

create or replace function private.ensure_entitlement_pool(
  p_student_id uuid,
  p_class_id uuid,
  p_academic_year_id uuid,
  p_course_group text,
  p_namespace_key text,
  p_source_enrollment_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  v_id := private.pool_id_for_namespace(
    p_student_id, p_academic_year_id, p_course_group, p_namespace_key
  );
  if v_id is not null then
    return v_id;
  end if;

  insert into public.student_entitlement_pools (
    student_id,
    class_id,
    academic_year_id,
    package_type,
    source_enrollment_id,
    course_group,
    namespace_key,
    initial_lessons,
    remaining_lessons,
    updated_at
  ) values (
    p_student_id,
    p_class_id,
    p_academic_year_id,
    'regular_full',
    p_source_enrollment_id,
    p_course_group,
    p_namespace_key,
    0,
    0,
    now()
  )
  returning id into v_id;
  return v_id;
exception
  when unique_violation then
    return private.pool_id_for_namespace(
      p_student_id, p_academic_year_id, p_course_group, p_namespace_key
    );
end;
$$;

revoke all on function private.ensure_entitlement_pool(uuid, uuid, uuid, text, text, uuid)
  from public, anon, authenticated;

create or replace function private.top_up_entitlements_for_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid;
  v_status text;
  r record;
  v_year_id uuid;
  v_year_label text;
  v_group text;
  v_ns text;
  v_is_trial boolean;
  v_enr uuid;
  v_pool uuid;
begin
  select student_id, status
    into v_student, v_status
  from public.payments
  where id = p_payment_id
  for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_status is distinct from '已收款' then
    raise exception 'PAYMENT_NOT_RECEIVED'
      using errcode = '22023', hint = '只可為已收款單據入帳堂數';
  end if;

  for r in
    select d.id, d.class_id, d.lesson_count, d.description
    from public.payment_details d
    where d.payment_id = p_payment_id
  loop
    if r.class_id is null or coalesce(r.lesson_count, 0) <= 0 then
      continue;
    end if;

    select c.academic_year_id, ay.label
      into v_year_id, v_year_label
    from public.classes c
    left join public.academic_years ay on ay.id = c.academic_year_id
    where c.id = r.class_id;

    if v_year_id is null or not private.uses_entitlement_roster_label(v_year_label) then
      continue;
    end if;

    v_is_trial := coalesce(r.description, '') like '%試堂%';
    select n.course_group, n.namespace_key
      into v_group, v_ns
    from private.entitlement_namespace_for_class(r.class_id, v_is_trial) n;

    if v_group is null or v_group = 'homework' then
      continue;
    end if;

    v_enr := null;
    if not v_is_trial then
      select e.id
        into v_enr
      from public.student_class_enrollments e
      where e.student_id = v_student
        and e.class_id = r.class_id
        and e.status = '就讀中'
      limit 1;
      if v_enr is null then
        raise exception 'ENTITLEMENT_NO_ENROLLMENT'
          using errcode = 'P0002',
            hint = '已收款但沒有就讀中報讀，無法入帳堂數';
      end if;
    end if;

    v_pool := private.ensure_entitlement_pool(
      v_student, r.class_id, v_year_id, v_group, v_ns, v_enr
    );
    if v_pool is null then
      raise exception 'ENTITLEMENT_NO_POOL'
        using errcode = 'P0002', hint = '無法鑄已繳堂數紀錄';
    end if;

    insert into public.entitlement_consumption_events (
      pool_id,
      student_id,
      schedule_id,
      attendance_detail_id,
      declaration_id,
      payment_detail_id,
      delta_lessons,
      reason
    ) values (
      v_pool,
      v_student,
      null,
      null,
      null,
      r.id,
      trunc(r.lesson_count),
      'entitlement_top_up'
    )
    on conflict (payment_detail_id, reason)
      where payment_detail_id is not null
        and reason in ('entitlement_top_up', 'entitlement_clawback')
    do nothing;
  end loop;
end;
$$;

revoke all on function private.top_up_entitlements_for_payment(uuid) from public, anon, authenticated;

create or replace function private.clawback_entitlements_for_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student uuid;
  r record;
begin
  select student_id into v_student
  from public.payments
  where id = p_payment_id;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  for r in
    select e.pool_id, e.payment_detail_id, e.delta_lessons, e.student_id
    from public.entitlement_consumption_events e
    join public.payment_details d on d.id = e.payment_detail_id
    where d.payment_id = p_payment_id
      and e.reason = 'entitlement_top_up'
    order by e.pool_id
  loop
    insert into public.entitlement_consumption_events (
      pool_id,
      student_id,
      schedule_id,
      attendance_detail_id,
      declaration_id,
      payment_detail_id,
      delta_lessons,
      reason
    ) values (
      r.pool_id,
      coalesce(r.student_id, v_student),
      null,
      null,
      null,
      r.payment_detail_id,
      -abs(r.delta_lessons),
      'entitlement_clawback'
    )
    on conflict (payment_detail_id, reason)
      where payment_detail_id is not null
        and reason in ('entitlement_top_up', 'entitlement_clawback')
    do nothing;
  end loop;
end;
$$;

revoke all on function private.clawback_entitlements_for_payment(uuid) from public, anon, authenticated;

create or replace function private.recalculate_entitlement_pool(p_pool_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ledger numeric;
  v_initial numeric;
begin
  if p_pool_id is null then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.student_entitlement_pools where id = p_pool_id) then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  select coalesce(sum(delta_lessons), 0) into v_ledger
  from (
    select delta_lessons from public.entitlement_consumption_events where pool_id = p_pool_id
    union all
    select delta_lessons from public.entitlement_pool_adjustments where pool_id = p_pool_id
  ) s;

  select coalesce(sum(delta_lessons), 0) into v_initial
  from public.entitlement_consumption_events
  where pool_id = p_pool_id
    and reason in ('entitlement_top_up', 'entitlement_clawback');

  perform set_config('app.entitlement_recalculating', '1', true);
  update public.student_entitlement_pools
  set
    remaining_lessons = v_ledger,
    initial_lessons = v_initial,
    updated_at = now()
  where id = p_pool_id;
  perform set_config('app.entitlement_recalculating', '0', true);

  insert into public.mgmt_audit_log (actor_label, role, action, path, detail)
  values (
    coalesce(private.stamp_actor_label(), '系統'),
    coalesce(public.current_app_role(), 'unknown'),
    'entitlement_pool_recalculated',
    '/PaymentCorrection',
    jsonb_build_object(
      'pool_id', p_pool_id,
      'remaining_lessons', v_ledger,
      'initial_lessons', v_initial
    )::text
  );
exception
  when others then
    perform set_config('app.entitlement_recalculating', '0', true);
    raise;
end;
$$;

revoke all on function private.recalculate_entitlement_pool(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 確認收款 command
-- ---------------------------------------------------------------------------

create or replace function public.mark_payment_received_command(
  p_payment_id uuid,
  p_payment_method text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pay public.payments%rowtype;
  v_now timestamptz := now();
  v_method text := nullif(trim(coalesce(p_payment_method, '')), '');
  v_prefix text;
  v_latest text;
  v_next int;
  v_receipt text;
  v_width int;
  v_attempt int;
begin
  if p_payment_id is null then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  if coalesce(current_setting('request.jwt.claim.role', true), '') is distinct from 'service_role'
    and current_user not in ('postgres', 'supabase_admin')
    and not (
      private.has_capability('payments.mark_received')
      or private.has_capability('payments.create')
    )
  then
    raise exception 'NOT_AUTHORIZED'
      using errcode = '42501', hint = '需要 payments.mark_received';
  end if;

  select * into v_pay
  from public.payments
  where id = p_payment_id
  for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_pay.status = '作廢' then
    raise exception 'PAYMENT_VOIDED'
      using errcode = '22023', hint = '已作廢單據不可標記為已收款';
  end if;

  if v_pay.status is distinct from '已收款' then
    if v_pay.status not in ('待繳費', '待收款') then
      raise exception 'PAYMENT_STATUS_INVALID'
        using errcode = '22023', hint = '僅待繳費／待收款單據可標記為已收款';
    end if;

    perform set_config('app.payment_mark_received', '1', true);
    v_receipt := nullif(btrim(coalesce(v_pay.receipt_number, '')), '');
    if v_receipt is not null then
      update public.payments
      set
        status = '已收款',
        payment_method = coalesce(v_method, payment_method),
        updated_at = v_now
      where id = p_payment_id
        and status in ('待繳費', '待收款');
    else
      v_prefix := 'MX-RC-' || to_char((v_now at time zone 'Asia/Hong_Kong'), 'YYYYMMDD') || '-';
      for v_attempt in 1..8 loop
        select p.receipt_number into v_latest
        from public.payments p
        where p.receipt_number like v_prefix || '%'
        order by p.receipt_number desc
        limit 1;
        v_next := 1;
        if v_latest is not null then
          begin
            v_next := greatest(1, substring(v_latest from length(v_prefix) + 1)::int + 1);
          exception when others then
            v_next := 1;
          end;
        end if;
        v_width := case when v_next > 9999 then 5 else 4 end;
        v_receipt := v_prefix || lpad(v_next::text, v_width, '0');
        begin
          update public.payments
          set
            status = '已收款',
            receipt_number = v_receipt,
            payment_method = coalesce(v_method, payment_method),
            updated_at = v_now
          where id = p_payment_id
            and status in ('待繳費', '待收款');
          exit;
        exception
          when unique_violation then
            if v_attempt = 8 then
              raise;
            end if;
        end;
      end loop;
    end if;
    perform set_config('app.payment_mark_received', '0', true);
  elsif v_method is not null then
    update public.payments
    set
      payment_method = v_method,
      updated_at = v_now
    where id = p_payment_id
      and status = '已收款';
  end if;

  perform private.top_up_entitlements_for_payment(p_payment_id);

  return jsonb_build_object(
    'ok', true,
    'payment_id', p_payment_id
  );
exception
  when others then
    perform set_config('app.payment_mark_received', '0', true);
    raise;
end;
$$;

comment on function public.mark_payment_received_command(uuid, text) is
  '待收款→已收款與入帳堂數同一交易。已收款則只冪等補入帳。';

revoke all on function public.mark_payment_received_command(uuid, text)
  from public, anon;
grant execute on function public.mark_payment_received_command(uuid, text)
  to authenticated, service_role;

create or replace function private.trg_payment_mark_received_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;
  if new.status = '已收款' and old.status is distinct from '已收款' then
    if current_setting('app.payment_mark_received', true) is distinct from '1' then
      raise exception 'PAYMENT_MARK_RECEIVED_COMMAND'
        using errcode = '42501',
          hint = '請使用確認收款流程（狀態與入帳堂數同一交易）';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.trg_payment_mark_received_guard() from public, anon, authenticated;

drop trigger if exists trg_payment_mark_received_guard on public.payments;
create trigger trg_payment_mark_received_guard
  before update on public.payments
  for each row
  execute function private.trg_payment_mark_received_guard();

alter table public.payments enable always trigger trg_payment_mark_received_guard;

-- ---------------------------------------------------------------------------
-- 點名淨額
-- ---------------------------------------------------------------------------

drop function if exists public.apply_attendance_entitlement_delta(uuid, uuid, uuid, uuid, text, text, numeric);

create or replace function public.apply_attendance_entitlement_delta(
  p_student_id uuid,
  p_schedule_id uuid,
  p_class_id uuid,
  p_attendance_detail_id uuid default null,
  p_previous_status text default null,
  p_next_status text default null,
  p_lesson_units numeric default 1,
  p_force_unbillable boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sched_class uuid;
  v_year_id uuid;
  v_year_label text;
  v_pool_id uuid;
  v_decl_id uuid;
  v_decl_pool uuid;
  v_ns_group text;
  v_ns_key text;
  v_att_id uuid := p_attendance_detail_id;
  v_att_exists boolean := false;
  v_has_makeup_leave boolean := false;
  v_status text;
  v_target numeric;
  v_net numeric;
  v_delta numeric;
  v_service boolean := coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role'
    or current_user in ('postgres', 'supabase_admin');
begin
  if p_student_id is null or p_schedule_id is null or p_class_id is null then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if not v_service and not private.has_capability('attendance.take') then
    raise exception 'NOT_AUTHORIZED'
      using errcode = '42501', hint = '需要 attendance.take';
  end if;

  if v_service or public.is_mgmt_staff() then
    null;
  elsif public.is_teacher_role()
    and public.teacher_can_write_attendance(p_class_id, p_schedule_id)
  then
    null;
  else
    raise exception 'NOT_AUTHORIZED'
      using errcode = '42501', hint = '不可為該堂記帳';
  end if;

  select s.class_id into v_sched_class
  from public.schedules s
  where s.id = p_schedule_id;
  if not found or v_sched_class is distinct from p_class_id then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  select c.academic_year_id, ay.label
    into v_year_id, v_year_label
  from public.classes c
  left join public.academic_years ay on ay.id = c.academic_year_id
  where c.id = p_class_id;
  if v_year_id is null or not private.uses_entitlement_roster_label(v_year_label) then
    return;
  end if;

  if v_att_id is not null then
    select ad.status into v_status
    from public.attendance_details ad
    where ad.id = v_att_id
    for update;
    v_att_exists := found;
    if not v_att_exists then
      v_status := null;
    end if;
  end if;

  if p_force_unbillable or not v_att_exists then
    v_target := 0;
  elsif private.is_billable_attendance_status(v_status) then
    v_target := -1;
  else
    v_target := 0;
  end if;

  if v_att_id is null then
    return;
  end if;

  select coalesce(sum(e.delta_lessons), 0) into v_net
  from public.entitlement_consumption_events e
  where e.attendance_detail_id = v_att_id
    and e.reason in ('entitlement_consumed', 'entitlement_reinstated');

  v_delta := v_target - v_net;
  if v_delta = 0 then
    return;
  end if;

  if not v_att_exists then
    if v_delta < 0 then
      perform private.notify_alien_attendance_unconsumed(
        p_student_id, p_schedule_id, p_class_id, v_att_id, 'attendance_missing'
      );
    end if;
    return;
  end if;

  if v_att_id is not null then
    select ece.pool_id
      into v_pool_id
    from public.entitlement_consumption_events ece
    where ece.attendance_detail_id = v_att_id
      and ece.reason in ('entitlement_consumed', 'entitlement_reinstated')
    order by ece.created_at asc
    limit 1;
  end if;

  if v_pool_id is null
    and private.student_has_paid_trial_on_schedule(p_student_id, p_schedule_id)
  then
    select n.course_group, n.namespace_key
      into v_ns_group, v_ns_key
    from private.entitlement_namespace_for_class(p_class_id, true) n;
    v_pool_id := private.pool_id_for_namespace(
      p_student_id, v_year_id, v_ns_group, v_ns_key
    );
  end if;

  if v_pool_id is null then
    select d.id, d.pool_id
      into v_decl_id, v_decl_pool
    from public.attendance_declarations d
    where d.student_id = p_student_id
      and d.schedule_id = p_schedule_id
      and d.status = 'active'
    order by d.created_at desc
    limit 1;
    v_pool_id := v_decl_pool;
  end if;

  if v_pool_id is null then
    select d.pool_id
      into v_pool_id
    from public.attendance_declarations d
    where d.student_id = p_student_id
      and d.schedule_id = p_schedule_id
      and d.pool_id is not null
    order by d.created_at desc
    limit 1;
  end if;

  if v_pool_id is null
    and private.student_has_paid_trial_on_schedule(p_student_id, p_schedule_id)
  then
    select n.course_group, n.namespace_key
      into v_ns_group, v_ns_key
    from private.entitlement_namespace_for_class(p_class_id, true) n;
    v_pool_id := private.pool_id_for_namespace(
      p_student_id, v_year_id, v_ns_group, v_ns_key
    );
  end if;

  if v_pool_id is null then
    v_has_makeup_leave := exists (
      select 1
      from public.leave_makeup_records lm
      where lm.student_id = p_student_id
        and lm.makeup_schedule_id = p_schedule_id
    );
    if v_has_makeup_leave then
      v_pool_id := private.pool_id_for_makeup_origin(
        p_student_id, p_schedule_id
      );
    else
      select n.course_group, n.namespace_key
        into v_ns_group, v_ns_key
      from private.entitlement_namespace_for_class(p_class_id, false) n;
      v_pool_id := private.pool_id_for_namespace(
        p_student_id, v_year_id, v_ns_group, v_ns_key
      );
    end if;
  end if;

  if v_pool_id is null then
    if v_delta < 0 then
      perform private.notify_alien_attendance_unconsumed(
        p_student_id, p_schedule_id, p_class_id, v_att_id, 'no_pool'
      );
    end if;
    return;
  end if;

  insert into public.entitlement_consumption_events (
    pool_id,
    student_id,
    schedule_id,
    attendance_detail_id,
    declaration_id,
    delta_lessons,
    reason
  ) values (
    v_pool_id,
    p_student_id,
    p_schedule_id,
    v_att_id,
    case when v_decl_id is not null then v_decl_id else null end,
    v_delta,
    case when v_delta < 0 then 'entitlement_consumed' else 'entitlement_reinstated' end
  );
end;
$$;

comment on function public.apply_attendance_entitlement_delta(uuid, uuid, uuid, uuid, text, text, numeric, boolean) is
  '點名計費淨額對帳。忽略客戶端堂數單位；寫入失敗上拋。';

revoke all on function public.apply_attendance_entitlement_delta(uuid, uuid, uuid, uuid, text, text, numeric, boolean)
  from public, anon;
grant execute on function public.apply_attendance_entitlement_delta(uuid, uuid, uuid, uuid, text, text, numeric, boolean)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 作廢含退堂
-- ---------------------------------------------------------------------------

create or replace function public.void_payment_apply(
  p_payment_id uuid,
  p_reason text,
  p_actor_email text,
  p_actor_name text,
  p_second_email text default null,
  p_second_name text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pay public.payments%rowtype;
  v_now timestamptz := now();
  v_reason text := left(trim(coalesce(p_reason, '')), 500);
  v_actor_email text := nullif(lower(trim(coalesce(p_actor_email, ''))), '');
  v_actor_name text := nullif(trim(coalesce(p_actor_name, '')), '');
  v_second_email text := nullif(lower(trim(coalesce(p_second_email, ''))), '');
  v_second_name text := nullif(trim(coalesce(p_second_name, '')), '');
  v_already boolean := false;
begin
  if p_payment_id is null then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_reason = '' then
    raise exception 'VOID_REASON_REQUIRED' using errcode = '22023';
  end if;
  if v_actor_email is null then
    raise exception 'ACTOR_REQUIRED' using errcode = '22023';
  end if;

  select * into v_pay
  from public.payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_pay.status = '作廢' then
    v_already := true;
  else
    perform set_config('app.payment_void_command', '1', true);

    update public.payments
    set
      status = '作廢',
      voided_at = v_now,
      voided_by_email = v_actor_email,
      voided_by_name = coalesce(v_actor_name, v_actor_email),
      void_reason = v_reason,
      void_second_confirmer_email = v_second_email,
      void_second_confirmer_name = v_second_name,
      updated_at = v_now
    where id = p_payment_id
      and status is distinct from '作廢';

    update public.referral_records
    set rebate_status = 'cancelled'
    where payment_id = p_payment_id
      and rebate_status = 'pending';

    perform set_config('app.payment_void_command', '0', true);
  end if;

  perform private.clawback_entitlements_for_payment(p_payment_id);

  return jsonb_build_object(
    'ok', true,
    'alreadyVoided', v_already,
    'payment_id', p_payment_id
  );
end;
$$;

comment on function public.void_payment_apply(uuid, text, text, text, text, text) is
  'Edge void-payment 專用。作廢與退堂同一交易；alreadyVoided 仍冪等退堂。';

revoke all on function public.void_payment_apply(uuid, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.void_payment_apply(uuid, text, text, text, text, text)
  to service_role;

create or replace function public.void_payment_command(
  p_payment_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pay public.payments%rowtype;
  v_email text;
  v_name text;
  v_now timestamptz := now();
  v_reason text := left(trim(coalesce(p_reason, '')), 500);
  v_second_email text;
  v_second_name text;
  v_already boolean := false;
begin
  if p_payment_id is null then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  if not private.has_capability('payments.void') then
    raise exception 'NOT_AUTHORIZED'
      using errcode = '42501', hint = '需要 payments.void';
  end if;
  if v_reason = '' then
    raise exception 'VOID_REASON_REQUIRED' using errcode = '22023';
  end if;

  select * into v_pay
  from public.payments
  where id = p_payment_id
  for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_pay.status = '作廢' then
    v_already := true;
  else
    v_email := public.current_app_user_email();
    select coalesce(nullif(trim(au.display_name), ''), v_email)
      into v_name
    from public.app_users au
    where au.id = public.current_app_user_id();
    v_name := coalesce(v_name, v_email);

    if v_pay.created_at < v_now - interval '30 minutes' then
      if not private.has_account_capability('payments.void.approve') then
        raise exception 'VOID_APPROVE_REQUIRED'
          using errcode = '42501',
            hint = '開單超過 30 分鐘須帳戶已獲授 manager／alien';
      end if;
      v_second_email := v_email;
      v_second_name := v_name;
    end if;

    perform set_config('app.payment_void_command', '1', true);

    update public.payments
    set
      status = '作廢',
      voided_at = v_now,
      voided_by_email = v_email,
      voided_by_name = v_name,
      void_reason = v_reason,
      void_second_confirmer_email = v_second_email,
      void_second_confirmer_name = v_second_name,
      updated_at = v_now
    where id = p_payment_id
      and status is distinct from '作廢';

    update public.referral_records
    set rebate_status = 'cancelled'
    where payment_id = p_payment_id
      and rebate_status = 'pending';

    perform set_config('app.payment_void_command', '0', true);
  end if;

  perform private.clawback_entitlements_for_payment(p_payment_id);

  return jsonb_build_object(
    'ok', true,
    'alreadyVoided', v_already,
    'payment_id', v_pay.id
  );
end;
$$;

comment on function public.void_payment_command(uuid, text) is
  'P0-1 作廢 command。與退堂同一交易；alreadyVoided 仍冪等退堂。';

revoke all on function public.void_payment_command(uuid, text) from public, anon;
grant execute on function public.void_payment_command(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- G2：僅 entitlements.correct
-- ---------------------------------------------------------------------------

create or replace function public.adjust_entitlement_pool(
  p_pool_id uuid,
  p_delta_lessons numeric,
  p_reason_code text,
  p_notes text,
  p_related_payment_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pool public.student_entitlement_pools%rowtype;
  v_notes text := btrim(coalesce(p_notes, ''));
  v_delta numeric := p_delta_lessons;
  v_batch uuid := gen_random_uuid();
  v_email text;
  v_name text;
begin
  if not private.has_capability('entitlements.correct') then
    raise exception 'NOT_AUTHORIZED'
      using errcode = '42501', hint = '需要 entitlements.correct';
  end if;
  if p_reason_code is null or p_reason_code not in (
    'g2a_lesson_count_fix',
    'g2b_wrong_class_move',
    'g2c_transfer_friend',
    'transfer_subject',
    'manual_other'
  ) then
    raise exception 'ENTITLEMENT_REASON_INVALID' using errcode = '22023';
  end if;
  if v_notes = '' or char_length(v_notes) < 2 then
    raise exception 'NOTES_REQUIRED' using errcode = '22023', hint = '請填寫調動原因備註（至少 2 字）';
  end if;
  if v_delta is null or v_delta = 0 or v_delta <> trunc(v_delta) then
    raise exception 'ENTITLEMENT_DELTA_INVALID' using errcode = '22023';
  end if;

  select * into v_pool
  from public.student_entitlement_pools
  where id = p_pool_id
  for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_pool.class_id is null then
    raise exception 'POOL_NO_CLASS' using errcode = '22023', hint = '此池未掛班，無法寫入調動紀錄';
  end if;

  v_email := public.current_app_user_email();
  select coalesce(nullif(trim(au.display_name), ''), v_email)
    into v_name
  from public.app_users au
  where au.id = public.current_app_user_id();

  insert into public.entitlement_pool_adjustments (
    adjustment_batch_id,
    pool_id,
    student_id,
    class_id,
    delta_lessons,
    reason_code,
    notes,
    related_payment_id,
    before_remaining,
    after_remaining,
    created_by_email,
    created_by_name
  ) values (
    v_batch,
    v_pool.id,
    v_pool.student_id,
    v_pool.class_id,
    trunc(v_delta),
    p_reason_code,
    v_notes,
    p_related_payment_id,
    v_pool.remaining_lessons,
    v_pool.remaining_lessons + trunc(v_delta),
    v_email,
    v_name
  );

  return jsonb_build_object('ok', true, 'pool_id', v_pool.id);
end;
$$;

revoke all on function public.adjust_entitlement_pool(uuid, numeric, text, text, uuid)
  from public, anon;
grant execute on function public.adjust_entitlement_pool(uuid, numeric, text, text, uuid)
  to authenticated;

create or replace function public.transfer_entitlement_lessons(
  p_from_pool_id uuid,
  p_to_pool_id uuid,
  p_lessons numeric,
  p_reason_code text,
  p_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from public.student_entitlement_pools%rowtype;
  v_to public.student_entitlement_pools%rowtype;
  v_notes text := btrim(coalesce(p_notes, ''));
  v_n numeric := p_lessons;
  v_batch uuid := gen_random_uuid();
  v_email text;
  v_name text;
  v_first uuid;
  v_second uuid;
begin
  if not private.has_capability('entitlements.correct') then
    raise exception 'NOT_AUTHORIZED'
      using errcode = '42501', hint = '需要 entitlements.correct';
  end if;
  if p_reason_code is null or p_reason_code not in (
    'g2a_lesson_count_fix',
    'g2b_wrong_class_move',
    'g2c_transfer_friend',
    'transfer_subject',
    'manual_other'
  ) then
    raise exception 'ENTITLEMENT_REASON_INVALID' using errcode = '22023';
  end if;
  if v_notes = '' or char_length(v_notes) < 2 then
    raise exception 'NOTES_REQUIRED' using errcode = '22023', hint = '請填寫搬堂原因備註（至少 2 字）';
  end if;
  if v_n is null or v_n <= 0 or v_n <> trunc(v_n) then
    raise exception 'ENTITLEMENT_DELTA_INVALID' using errcode = '22023';
  end if;
  if p_from_pool_id is null or p_to_pool_id is null or p_from_pool_id = p_to_pool_id then
    raise exception 'TRANSFER_POOLS_INVALID' using errcode = '22023';
  end if;

  if p_from_pool_id < p_to_pool_id then
    v_first := p_from_pool_id;
    v_second := p_to_pool_id;
  else
    v_first := p_to_pool_id;
    v_second := p_from_pool_id;
  end if;

  perform 1 from public.student_entitlement_pools where id = v_first for update;
  perform 1 from public.student_entitlement_pools where id = v_second for update;

  select * into v_from from public.student_entitlement_pools where id = p_from_pool_id;
  select * into v_to from public.student_entitlement_pools where id = p_to_pool_id;
  if v_from.id is null or v_to.id is null then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_from.class_id is null or v_to.class_id is null then
    raise exception 'POOL_NO_CLASS' using errcode = '22023', hint = '此池未掛班，無法寫入調動紀錄';
  end if;

  v_email := public.current_app_user_email();
  select coalesce(nullif(trim(au.display_name), ''), v_email)
    into v_name
  from public.app_users au
  where au.id = public.current_app_user_id();

  insert into public.entitlement_pool_adjustments (
    adjustment_batch_id, pool_id, student_id, class_id, delta_lessons,
    reason_code, notes, related_pool_id, before_remaining, after_remaining,
    created_by_email, created_by_name
  ) values
    (
      v_batch, v_from.id, v_from.student_id, v_from.class_id, -trunc(v_n),
      p_reason_code, v_notes, v_to.id, v_from.remaining_lessons,
      v_from.remaining_lessons - trunc(v_n), v_email, v_name
    ),
    (
      v_batch, v_to.id, v_to.student_id, v_to.class_id, trunc(v_n),
      p_reason_code, v_notes, v_from.id, v_to.remaining_lessons,
      v_to.remaining_lessons + trunc(v_n), v_email, v_name
    );

  return jsonb_build_object('ok', true, 'from_pool_id', v_from.id, 'to_pool_id', v_to.id);
end;
$$;

revoke all on function public.transfer_entitlement_lessons(uuid, uuid, numeric, text, text)
  from public, anon;
grant execute on function public.transfer_entitlement_lessons(uuid, uuid, numeric, text, text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Data API：收回流水寫入與尚餘欄
-- ---------------------------------------------------------------------------

drop policy if exists rls_teacher_update_student_entitlement_pools
  on public.student_entitlement_pools;
drop policy if exists rls_cap_delete_student_entitlement_pools
  on public.student_entitlement_pools;

drop policy if exists rls_teacher_insert_entitlement_consumption_events
  on public.entitlement_consumption_events;
drop policy if exists rls_cap_insert_entitlement_consumption_events
  on public.entitlement_consumption_events;

revoke insert, update, delete on public.entitlement_consumption_events
  from public, anon, authenticated, service_role;
grant select on public.entitlement_consumption_events to authenticated, service_role;

revoke insert, update, delete on public.entitlement_pool_adjustments
  from public, anon, authenticated, service_role;
grant select on public.entitlement_pool_adjustments to authenticated, service_role;

revoke update (remaining_lessons, initial_lessons) on public.student_entitlement_pools
  from public, anon, authenticated, service_role;
revoke delete on public.student_entitlement_pools
  from public, anon, authenticated, service_role;
revoke truncate on public.entitlement_consumption_events
  from public, anon, authenticated, service_role;
revoke truncate on public.entitlement_pool_adjustments
  from public, anon, authenticated, service_role;
revoke truncate on public.student_entitlement_pools
  from public, anon, authenticated, service_role;

notify pgrst, 'reload schema';

commit;
