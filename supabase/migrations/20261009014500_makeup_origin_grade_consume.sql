-- 跨年級調堂：扣請假原班已繳堂數，不跟點名紙宿主班年級。
-- 有調堂請假找不到原班那口 → 不改扣宿主班（外星人收件匣）。
-- 無請假 → 維持宿主班年級後備。
-- 調堂寫入（含直寫 SQL）以 trigger 補原班宣告。
-- 歷史：葉熙桐／蕭馥鎣 2026-09-13 MATHS5001-B 現場未扣，補中六數學 −1。
-- 套用：npm run db:apply -- supabase/migrations/20261009014500_makeup_origin_grade_consume.sql

begin;

create or replace function private.pool_id_for_makeup_origin(
  p_student_id uuid,
  p_makeup_schedule_id uuid
)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_origin_class uuid;
  v_leave_schedule uuid;
  v_year_id uuid;
  v_year_label text;
  v_pool uuid;
  v_ns_group text;
  v_ns_key text;
begin
  select lm.class_id, lm.schedule_id
    into v_origin_class, v_leave_schedule
  from public.leave_makeup_records lm
  where lm.student_id = p_student_id
    and lm.makeup_schedule_id = p_makeup_schedule_id
  order by lm.updated_at desc nulls last, lm.created_at desc nulls last
  limit 1;
  if v_origin_class is null then
    return null;
  end if;

  if v_leave_schedule is not null then
    select d.pool_id
      into v_pool
    from public.attendance_declarations d
    where d.student_id = p_student_id
      and d.schedule_id = v_leave_schedule
      and d.pool_id is not null
    order by (d.status = 'active') desc, d.created_at desc
    limit 1;
    if v_pool is not null then
      return v_pool;
    end if;
  end if;

  select c.academic_year_id, ay.label
    into v_year_id, v_year_label
  from public.classes c
  left join public.academic_years ay on ay.id = c.academic_year_id
  where c.id = v_origin_class;
  if v_year_id is null or not private.uses_entitlement_roster_label(v_year_label) then
    return null;
  end if;

  select n.course_group, n.namespace_key
    into v_ns_group, v_ns_key
  from private.entitlement_namespace_for_class(v_origin_class, false) n;
  return private.pool_id_for_namespace(
    p_student_id, v_year_id, v_ns_group, v_ns_key
  );
end;
$$;

comment on function private.pool_id_for_makeup_origin(uuid, uuid) is
  '調堂補回堂：已繳堂數跟請假原班（同學年同一級專科池），不是宿主班年級。';

revoke all on function private.pool_id_for_makeup_origin(uuid, uuid)
  from public, anon, authenticated;

create or replace function private.sync_leave_makeup_declaration()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pool uuid;
  v_prev uuid;
  v_next uuid;
begin
  if tg_op = 'UPDATE' then
    v_prev := old.makeup_schedule_id;
  else
    v_prev := null;
  end if;
  v_next := new.makeup_schedule_id;

  if v_prev is not null and v_prev is distinct from v_next then
    update public.attendance_declarations
    set status = 'void', updated_at = now()
    where student_id = new.student_id
      and schedule_id = v_prev
      and status = 'active';
  end if;

  if v_next is null then
    return new;
  end if;

  if exists (
    select 1
    from public.attendance_declarations d
    where d.student_id = new.student_id
      and d.schedule_id = v_next
      and d.status = 'active'
  ) then
    return new;
  end if;

  v_pool := private.pool_id_for_makeup_origin(new.student_id, v_next);
  if v_pool is null then
    return new;
  end if;

  insert into public.attendance_declarations (
    schedule_id,
    student_id,
    pool_id,
    status,
    source_event_type,
    source_event_id,
    updated_at
  ) values (
    v_next,
    new.student_id,
    v_pool,
    'active',
    'student_makeup',
    new.id,
    now()
  );
  return new;
exception
  when unique_violation then
    return new;
end;
$$;

comment on function private.sync_leave_makeup_declaration() is
  '請假綁／改／清 makeup_schedule_id 時，補或作廢原班已繳堂數宣告。直寫 SQL 亦生效。';

revoke all on function private.sync_leave_makeup_declaration()
  from public, anon, authenticated;

drop trigger if exists trg_leave_makeup_sync_declaration on public.leave_makeup_records;
create trigger trg_leave_makeup_sync_declaration
after insert or update of makeup_schedule_id
on public.leave_makeup_records
for each row
execute function private.sync_leave_makeup_declaration();

create or replace function public.apply_attendance_entitlement_delta(
  p_student_id uuid,
  p_schedule_id uuid,
  p_class_id uuid,
  p_attendance_detail_id uuid default null,
  p_previous_status text default null,
  p_next_status text default null,
  p_lesson_units numeric default 1
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
  v_was boolean;
  v_is boolean;
  v_units numeric;
  v_delta numeric;
  v_pool_id uuid;
  v_decl_id uuid;
  v_decl_pool uuid;
  v_ns_group text;
  v_ns_key text;
  v_remaining numeric;
  v_att_id uuid := p_attendance_detail_id;
  v_has_makeup_leave boolean := false;
begin
  if p_student_id is null or p_schedule_id is null or p_class_id is null then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if not private.has_capability('attendance.take') then
    raise exception 'NOT_AUTHORIZED'
      using errcode = '42501', hint = '需要 attendance.take';
  end if;

  if public.is_mgmt_staff() then
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

  v_was := private.is_billable_attendance_status(p_previous_status);
  v_is := private.is_billable_attendance_status(p_next_status);
  if v_was = v_is then
    return;
  end if;

  v_units := case when coalesce(p_lesson_units, 0) > 0 then p_lesson_units else 1 end;
  v_delta := case when v_is and not v_was then -v_units else v_units end;

  begin
    if v_att_id is not null
      and not exists (
        select 1 from public.attendance_details ad where ad.id = v_att_id
      )
    then
      v_att_id := null;
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
      if v_pool_id is null then
        if v_delta < 0 then
          perform private.notify_alien_attendance_unconsumed(
            p_student_id, p_schedule_id, p_class_id, v_att_id, 'no_trial_pool'
          );
        end if;
        return;
      end if;
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
      if v_pool_id is null then
        if v_delta < 0 then
          perform private.notify_alien_attendance_unconsumed(
            p_student_id, p_schedule_id, p_class_id, v_att_id, 'no_trial_pool'
          );
        end if;
        return;
      end if;
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

    select p.remaining_lessons
      into v_remaining
    from public.student_entitlement_pools p
    where p.id = v_pool_id
    for update;
    if not found then
      if v_delta < 0 then
        perform private.notify_alien_attendance_unconsumed(
          p_student_id, p_schedule_id, p_class_id, v_att_id, 'pool_missing'
        );
      end if;
      return;
    end if;

    update public.student_entitlement_pools
    set
      remaining_lessons = coalesce(v_remaining, 0) + v_delta,
      updated_at = now()
    where id = v_pool_id;

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
  exception
    when others then
      if v_delta < 0 then
        perform private.notify_alien_attendance_unconsumed(
          p_student_id, p_schedule_id, p_class_id, v_att_id, 'exception', SQLERRM
        );
      end if;
  end;
end;
$$;

comment on function public.apply_attendance_entitlement_delta(uuid, uuid, uuid, uuid, text, text, numeric) is
  '點名計費狀態轉換時由系統扣／退已繳堂數。調堂有請假則跟原班池；無請假才用宿主班年級。找不到池或例外時通知外星人收件匣。';

-- 既有調堂缺宣告：補 student_makeup（已有 active 宣告則略過）
insert into public.attendance_declarations (
  schedule_id,
  student_id,
  pool_id,
  status,
  source_event_type,
  source_event_id,
  updated_at
)
select
  s.makeup_schedule_id,
  s.student_id,
  s.pool_id,
  'active',
  'student_makeup',
  s.leave_id,
  now()
from (
  select distinct on (lm.student_id, lm.makeup_schedule_id)
    lm.makeup_schedule_id,
    lm.student_id,
    lm.id as leave_id,
    private.pool_id_for_makeup_origin(lm.student_id, lm.makeup_schedule_id) as pool_id
  from public.leave_makeup_records lm
  join public.classes oc on oc.id = lm.class_id
  join public.academic_years ay on ay.id = oc.academic_year_id
  where lm.makeup_schedule_id is not null
    and private.uses_entitlement_roster_label(ay.label)
  order by lm.student_id, lm.makeup_schedule_id, lm.updated_at desc nulls last
) s
where s.pool_id is not null
  and not exists (
    select 1
    from public.attendance_declarations d
    where d.student_id = s.student_id
      and d.schedule_id = s.makeup_schedule_id
      and d.status = 'active'
  );

-- 葉熙桐／蕭馥鎣 9/13 中五宿主現場未扣：補中六數學 −1（已有消耗則略過）
do $$
declare
  r record;
  v_pool uuid;
  v_remaining numeric;
  v_decl uuid;
begin
  for r in
    select ad.id as att_id, ad.student_id, ad.schedule_id
    from public.students st
    join public.attendance_details ad
      on ad.student_id = st.id
    join public.schedules sch
      on sch.id = ad.schedule_id
    join public.classes hc
      on hc.id = sch.class_id
    where st.full_name in ('葉熙桐', '蕭馥鎣')
      and sch.scheduled_date = date '2026-09-13'
      and hc.course_code_full = '2627-MATHS5001-B'
      and ad.status = '現場'
      and not exists (
        select 1
        from public.entitlement_consumption_events e
        where e.student_id = ad.student_id
          and e.schedule_id = ad.schedule_id
          and e.reason in ('entitlement_consumed', 'entitlement_reinstated')
      )
  loop
    v_pool := private.pool_id_for_makeup_origin(r.student_id, r.schedule_id);
    if v_pool is null then
      raise exception 'makeup origin pool missing for student % schedule %',
        r.student_id, r.schedule_id;
    end if;
    select d.id
      into v_decl
    from public.attendance_declarations d
    where d.student_id = r.student_id
      and d.schedule_id = r.schedule_id
      and d.status = 'active'
    limit 1;
    select p.remaining_lessons
      into v_remaining
    from public.student_entitlement_pools p
    where p.id = v_pool
    for update;
    update public.student_entitlement_pools
    set remaining_lessons = coalesce(v_remaining, 0) - 1,
        updated_at = now()
    where id = v_pool;
    insert into public.entitlement_consumption_events (
      pool_id,
      student_id,
      schedule_id,
      attendance_detail_id,
      declaration_id,
      delta_lessons,
      reason
    ) values (
      v_pool,
      r.student_id,
      r.schedule_id,
      r.att_id,
      v_decl,
      -1,
      'entitlement_consumed'
    );
  end loop;
end;
$$;

notify pgrst, 'reload schema';

commit;
