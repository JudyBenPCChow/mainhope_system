-- 家長報讀申請：目錄瀏覽、預算學費（無優惠）、提交／取消、職員核准（報讀＋待繳費）

begin;

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

create table if not exists public.portal_enrollment_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  status text not null default 'submitted'
    check (status in ('submitted', 'approved', 'rejected', 'cancelled')),
  estimated_subtotal numeric not null default 0,
  estimated_total numeric not null default 0,
  estimate_breakdown jsonb not null default '[]'::jsonb,
  parent_note text,
  staff_note text,
  payment_id uuid references public.payments (id) on delete set null,
  reviewed_by uuid references public.app_users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists portal_enrollment_requests_student_id_idx
  on public.portal_enrollment_requests (student_id);
create index if not exists portal_enrollment_requests_status_idx
  on public.portal_enrollment_requests (status);
create index if not exists portal_enrollment_requests_created_at_idx
  on public.portal_enrollment_requests (created_at desc);

comment on table public.portal_enrollment_requests is
  '家長 Portal 報讀申請；核准後建立報讀＋待繳費單。';

create table if not exists public.portal_enrollment_request_lines (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.portal_enrollment_requests (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete restrict,
  enrollment_period text
    check (
      enrollment_period is null
      or enrollment_period in ('第一期', '第二期', '兩期全報', '單堂')
    ),
  schedule_ids uuid[] not null default '{}',
  unit_price numeric,
  lesson_count integer not null default 0,
  line_subtotal numeric not null default 0,
  class_label text,
  created_at timestamptz not null default now()
);

create index if not exists portal_enrollment_request_lines_request_id_idx
  on public.portal_enrollment_request_lines (request_id);

comment on table public.portal_enrollment_request_lines is
  '家長報讀申請明細行（班別＋期數／單堂選堂）。';

alter table public.portal_enrollment_requests enable row level security;
alter table public.portal_enrollment_request_lines enable row level security;

drop policy if exists portal_enrollment_requests_mgmt_all on public.portal_enrollment_requests;
create policy portal_enrollment_requests_mgmt_all
on public.portal_enrollment_requests
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

drop policy if exists portal_enrollment_requests_portal_select on public.portal_enrollment_requests;
create policy portal_enrollment_requests_portal_select
on public.portal_enrollment_requests
for select
to authenticated
using (public.is_portal() and student_id = public.current_portal_student_id());

drop policy if exists portal_enrollment_request_lines_mgmt_all on public.portal_enrollment_request_lines;
create policy portal_enrollment_request_lines_mgmt_all
on public.portal_enrollment_request_lines
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

drop policy if exists portal_enrollment_request_lines_portal_select on public.portal_enrollment_request_lines;
create policy portal_enrollment_request_lines_portal_select
on public.portal_enrollment_request_lines
for select
to authenticated
using (
  public.is_portal()
  and exists (
    select 1 from public.portal_enrollment_requests r
    where r.id = request_id
      and r.student_id = public.current_portal_student_id()
  )
);

-- ---------------------------------------------------------------------------
-- 2. Grade match helpers + expand portal catalog RLS
-- ---------------------------------------------------------------------------

create or replace function public.portal_student_grade_label(p_student_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select public.grade_code_to_label(s.grade)
  from public.students s
  where s.id = p_student_id;
$$;

create or replace function public.portal_class_matches_student_grade(
  p_class_id uuid,
  p_student_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.classes c
    left join public.courses co on co.id = c.course_id
    cross join lateral (
      select public.portal_student_grade_label(p_student_id) as lbl
    ) g
    where c.id = p_class_id
      and g.lbl is not null
      and c.class_kind = 'group'
      and coalesce(c.status, '') not ilike '%已結束%'
      and (
        exists (
          select 1
          from unnest(coalesce(c.grade, '{}'::text[])) gr
          where public.normalize_class_grade_label(gr) = g.lbl
             or gr = g.lbl
             or gr like g.lbl || '%'
        )
        or public.grade_code_to_label(co.grade_code) = g.lbl
      )
  );
$$;

create or replace function public.portal_class_matches_current_student_grade(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.portal_class_matches_student_grade(
    p_class_id,
    public.current_portal_student_id()
  );
$$;

revoke all on function public.portal_student_grade_label(uuid) from public;
revoke all on function public.portal_student_grade_label(uuid) from anon;
grant execute on function public.portal_student_grade_label(uuid) to authenticated;

revoke all on function public.portal_class_matches_student_grade(uuid, uuid) from public;
revoke all on function public.portal_class_matches_student_grade(uuid, uuid) from anon;
grant execute on function public.portal_class_matches_student_grade(uuid, uuid) to authenticated;

revoke all on function public.portal_class_matches_current_student_grade(uuid) from public;
revoke all on function public.portal_class_matches_current_student_grade(uuid) from anon;
grant execute on function public.portal_class_matches_current_student_grade(uuid) to authenticated;

-- classes：已報讀 OR 級別相符小組班
drop policy if exists portal_select_classes on public.classes;
create policy portal_select_classes
on public.classes
for select
to authenticated
using (
  public.is_portal()
  and (
    public.portal_can_access_class(id)
    or public.portal_class_matches_current_student_grade(id)
  )
);

-- schedules：維持僅已報讀班別（避免時間表洩漏未報讀課堂）。
-- 報名單堂選堂改走 list_portal_class_schedules RPC。
drop policy if exists portal_select_schedules on public.schedules;
create policy portal_select_schedules
on public.schedules
for select
to authenticated
using (public.is_portal() and public.portal_can_access_class(class_id));

-- courses：級別相符或已報讀班別所用課程
drop policy if exists portal_select_courses on public.courses;
create policy portal_select_courses
on public.courses
for select
to authenticated
using (
  public.is_portal()
  and exists (
    select 1
    from public.classes c
    where c.course_id = courses.id
      and (
        public.portal_can_access_class(c.id)
        or public.portal_class_matches_current_student_grade(c.id)
      )
  )
);

-- academic_year_periods：學生可見班別所屬學年
drop policy if exists portal_select_academic_year_periods on public.academic_year_periods;
create policy portal_select_academic_year_periods
on public.academic_year_periods
for select
to authenticated
using (
  public.is_portal()
  and exists (
    select 1
    from public.classes c
    where c.academic_year_id = academic_year_periods.academic_year_id
      and (
        public.portal_can_access_class(c.id)
        or public.portal_class_matches_current_student_grade(c.id)
      )
  )
);

-- teachers / classrooms：擴及級別相符班別
drop policy if exists portal_select_teachers on public.teachers;
create policy portal_select_teachers
on public.teachers
for select
to authenticated
using (
  public.is_portal()
  and exists (
    select 1
    from public.classes c
    where c.teacher_id = teachers.id
      and (
        public.portal_can_access_class(c.id)
        or public.portal_class_matches_current_student_grade(c.id)
      )
  )
);

drop policy if exists portal_select_classrooms on public.classrooms;
create policy portal_select_classrooms
on public.classrooms
for select
to authenticated
using (
  public.is_portal()
  and exists (
    select 1
    from public.classes c
    where c.classroom_id = classrooms.id
      and (
        public.portal_can_access_class(c.id)
        or public.portal_class_matches_current_student_grade(c.id)
      )
  )
);

-- ---------------------------------------------------------------------------
-- 3. Quote helpers (no discounts)
-- ---------------------------------------------------------------------------

create or replace function public.portal_resolve_unit_price(
  p_enrollment_period text,
  p_class_price numeric,
  p_course_price numeric,
  p_course_price_p2 numeric,
  p_course_price_both numeric
)
returns numeric
language plpgsql
immutable
as $$
begin
  if p_class_price is not null then
    return p_class_price;
  end if;
  if p_enrollment_period = '第二期' then
    return coalesce(p_course_price_p2, p_course_price);
  end if;
  if p_enrollment_period = '兩期全報' then
    return coalesce(p_course_price_both, p_course_price);
  end if;
  return p_course_price;
end;
$$;

create or replace function public.portal_count_lessons_for_period(
  p_class_id uuid,
  p_enrollment_period text,
  p_schedule_ids uuid[]
)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_mode text;
  v_year_id uuid;
  v_count integer;
begin
  if p_enrollment_period = '單堂' then
    return coalesce(cardinality(p_schedule_ids), 0);
  end if;

  select coalesce(co.course_mode, 'regular'), c.academic_year_id
    into v_mode, v_year_id
  from public.classes c
  left join public.courses co on co.id = c.course_id
  where c.id = p_class_id;

  if v_mode is distinct from 'summer_two_period'
     or p_enrollment_period is null
     or p_enrollment_period = ''
     or v_year_id is null
  then
    select count(*)::integer into v_count
    from public.schedules s
    where s.class_id = p_class_id
      and coalesce(s.status, '') not ilike '%取消%';
    return coalesce(v_count, 0);
  end if;

  select count(*)::integer into v_count
  from public.schedules s
  where s.class_id = p_class_id
    and coalesce(s.status, '') not ilike '%取消%'
    and exists (
      select 1
      from public.academic_year_periods p
      where p.academic_year_id = v_year_id
        and s.scheduled_date between p.start_date and p.end_date
        and (
          p_enrollment_period = '兩期全報'
          or (p_enrollment_period = '第一期' and p.period_code = 1)
          or (p_enrollment_period = '第二期' and p.period_code = 2)
        )
    );
  return coalesce(v_count, 0);
end;
$$;

create or replace function public.portal_build_quote_from_lines(p_lines jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_student_id uuid := public.current_portal_student_id();
  v_line jsonb;
  v_class_id uuid;
  v_period text;
  v_schedule_ids uuid[];
  v_unit numeric;
  v_lessons integer;
  v_subtotal numeric;
  v_total numeric := 0;
  v_items jsonb := '[]'::jsonb;
  v_class record;
  v_label text;
  v_idx integer := 0;
begin
  if not public.is_portal() then
    raise exception '僅家長帳號可試算學費';
  end if;
  if v_student_id is null then
    raise exception '找不到綁定學生';
  end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception '請至少選擇一個班別';
  end if;

  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    v_idx := v_idx + 1;
    v_class_id := nullif(v_line->>'class_id', '')::uuid;
    v_period := nullif(trim(coalesce(v_line->>'enrollment_period', '')), '');
    v_schedule_ids := coalesce(
      (
        select array_agg(x::uuid)
        from jsonb_array_elements_text(coalesce(v_line->'schedule_ids', '[]'::jsonb)) t(x)
        where nullif(x, '') is not null
      ),
      '{}'::uuid[]
    );

    if v_class_id is null then
      raise exception '第 % 行缺少 class_id', v_idx;
    end if;
    if not public.portal_class_matches_student_grade(v_class_id, v_student_id)
       and not public.portal_can_access_class(v_class_id)
    then
      raise exception '第 % 行班別不在可報讀範圍', v_idx;
    end if;

    select
      c.id,
      c.subject,
      c.course_code_full,
      c.price_per_lesson as class_price,
      c.class_kind,
      coalesce(co.course_mode, 'regular') as course_mode,
      co.price_per_lesson as course_price,
      co.price_per_lesson_period_2 as course_price_p2,
      co.price_per_lesson_both_periods as course_price_both,
      coalesce(co.course_name, c.subject) as course_name
    into v_class
    from public.classes c
    left join public.courses co on co.id = c.course_id
    where c.id = v_class_id;

    if not found then
      raise exception '第 % 行班別不存在', v_idx;
    end if;
    if v_class.class_kind = 'private' then
      raise exception '一對一班別不可經家長申請報讀';
    end if;

    if v_class.course_mode = 'summer_two_period' then
      if v_period is null or v_period not in ('第一期', '第二期', '兩期全報', '單堂') then
        raise exception '暑期班請選擇報讀期數或單堂';
      end if;
      if v_period = '單堂' and coalesce(cardinality(v_schedule_ids), 0) = 0 then
        raise exception '單堂報讀請至少選擇一堂';
      end if;
      if v_period = '單堂' then
        if exists (
          select 1
          from unnest(v_schedule_ids) sid
          where not exists (
            select 1 from public.schedules s
            where s.id = sid
              and s.class_id = v_class_id
              and coalesce(s.status, '') not ilike '%取消%'
          )
        ) then
          raise exception '單堂選堂含無效或已取消排程';
        end if;
      end if;
    else
      -- 正規班：全期，不存期數
      v_period := null;
      v_schedule_ids := '{}'::uuid[];
    end if;

    v_unit := public.portal_resolve_unit_price(
      v_period,
      v_class.class_price,
      v_class.course_price,
      v_class.course_price_p2,
      v_class.course_price_both
    );
    v_lessons := public.portal_count_lessons_for_period(v_class_id, v_period, v_schedule_ids);
    if v_unit is null then
      raise exception '班別「%」尚未設定學費單價', coalesce(v_class.course_name, v_class.subject);
    end if;
    if v_lessons <= 0 then
      raise exception '班別「%」找不到可計費堂數', coalesce(v_class.course_name, v_class.subject);
    end if;

    v_subtotal := round((v_unit * v_lessons)::numeric, 2);
    v_total := v_total + v_subtotal;
    v_label := coalesce(nullif(v_class.course_code_full, ''), '') ||
      case when v_class.course_code_full is not null and v_class.course_code_full <> '' then ' ' else '' end ||
      coalesce(v_class.course_name, v_class.subject);

    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'class_id', v_class_id,
      'class_label', v_label,
      'enrollment_period', v_period,
      'schedule_ids', to_jsonb(v_schedule_ids),
      'unit_price', v_unit,
      'lesson_count', v_lessons,
      'line_subtotal', v_subtotal,
      'course_mode', v_class.course_mode
    ));
  end loop;

  return jsonb_build_object(
    'subtotal', round(v_total, 2),
    'total', round(v_total, 2),
    'discount', 0,
    'lines', v_items
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. RPCs: catalog schedules / preview / submit / cancel / review
-- ---------------------------------------------------------------------------

create or replace function public.list_portal_class_schedules(p_class_id uuid)
returns table (
  id uuid,
  class_id uuid,
  scheduled_date date,
  start_time time,
  end_time time,
  status text,
  session_number integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_portal() then
    raise exception '僅家長帳號可查詢';
  end if;
  if not public.portal_class_matches_current_student_grade(p_class_id)
     and not public.portal_can_access_class(p_class_id)
  then
    raise exception '無權查看此班排程';
  end if;

  return query
  select
    s.id,
    s.class_id,
    s.scheduled_date,
    s.start_time,
    s.end_time,
    s.status,
    s.session_number
  from public.schedules s
  where s.class_id = p_class_id
    and coalesce(s.status, '') not ilike '%取消%'
  order by s.scheduled_date, s.start_time, s.session_number nulls last;
end;
$$;

create or replace function public.preview_portal_enrollment_quote(p_lines jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return public.portal_build_quote_from_lines(p_lines);
end;
$$;

create or replace function public.submit_portal_enrollment_request(
  p_lines jsonb,
  p_parent_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid := public.current_portal_student_id();
  v_quote jsonb;
  v_request_id uuid;
  v_item jsonb;
begin
  if not public.is_portal() or v_student_id is null then
    raise exception '僅家長帳號可提交報讀申請';
  end if;

  v_quote := public.portal_build_quote_from_lines(p_lines);

  insert into public.portal_enrollment_requests (
    student_id,
    status,
    estimated_subtotal,
    estimated_total,
    estimate_breakdown,
    parent_note
  ) values (
    v_student_id,
    'submitted',
    (v_quote->>'subtotal')::numeric,
    (v_quote->>'total')::numeric,
    coalesce(v_quote->'lines', '[]'::jsonb),
    nullif(trim(coalesce(p_parent_note, '')), '')
  )
  returning id into v_request_id;

  for v_item in select * from jsonb_array_elements(coalesce(v_quote->'lines', '[]'::jsonb))
  loop
    insert into public.portal_enrollment_request_lines (
      request_id,
      class_id,
      enrollment_period,
      schedule_ids,
      unit_price,
      lesson_count,
      line_subtotal,
      class_label
    ) values (
      v_request_id,
      (v_item->>'class_id')::uuid,
      nullif(v_item->>'enrollment_period', ''),
      coalesce(
        (
          select array_agg(x::uuid)
          from jsonb_array_elements_text(coalesce(v_item->'schedule_ids', '[]'::jsonb)) t(x)
          where nullif(x, '') is not null
        ),
        '{}'::uuid[]
      ),
      (v_item->>'unit_price')::numeric,
      (v_item->>'lesson_count')::integer,
      (v_item->>'line_subtotal')::numeric,
      v_item->>'class_label'
    );
  end loop;

  return v_request_id;
end;
$$;

create or replace function public.cancel_portal_enrollment_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid := public.current_portal_student_id();
  v_status text;
begin
  if not public.is_portal() or v_student_id is null then
    raise exception '僅家長帳號可取消申請';
  end if;

  select status into v_status
  from public.portal_enrollment_requests
  where id = p_request_id
    and student_id = v_student_id
  for update;

  if not found then
    raise exception '找不到申請';
  end if;
  if v_status <> 'submitted' then
    raise exception '僅待審核的申請可取消';
  end if;

  update public.portal_enrollment_requests
  set status = 'cancelled',
      updated_at = now()
  where id = p_request_id;
end;
$$;

create or replace function public.portal_allocate_invoice_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text := 'MX-INV-' || to_char((timezone('Asia/Hong_Kong', now()))::date, 'YYYYMMDD') || '-';
  v_latest text;
  v_next integer := 1;
  v_n integer;
begin
  select receipt_number into v_latest
  from public.payments
  where receipt_number like v_prefix || '%'
  order by receipt_number desc
  limit 1;

  if v_latest is not null then
    begin
      v_n := substring(v_latest from length(v_prefix) + 1)::integer;
      if v_n >= 0 then
        v_next := v_n + 1;
      end if;
    exception when others then
      v_next := 1;
    end;
  end if;

  return v_prefix || lpad(v_next::text, 4, '0');
end;
$$;

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
  v_payment_id uuid;
  v_receipt text;
  v_attempt integer;
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

  -- Approve: enrollments then pending payment
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

  -- Create 待繳費 invoice
  for v_attempt in 1..8 loop
    begin
      v_receipt := public.portal_allocate_invoice_number();
      insert into public.payments (
        student_id,
        payment_date,
        total_amount,
        subtotal_amount,
        payment_method,
        status,
        remarks,
        receipt_number
      ) values (
        v_req.student_id,
        v_today,
        v_req.estimated_total,
        v_req.estimated_subtotal,
        '其他',
        '待繳費',
        coalesce('家長報讀申請 ' || p_request_id::text, '家長報讀申請'),
        v_receipt
      )
      returning id into v_payment_id;
      exit;
    exception when unique_violation then
      if v_attempt = 8 then
        raise;
      end if;
    end;
  end loop;

  if v_payment_id is null then
    raise exception '無法建立待繳費單';
  end if;

  insert into public.payment_details (
    payment_id, class_id, lesson_count, amount, description
  )
  select
    v_payment_id,
    l.class_id,
    l.lesson_count,
    l.line_subtotal,
    coalesce(l.class_label, '') ||
      case
        when l.enrollment_period is null then ''
        else '（' || l.enrollment_period || '）'
      end
  from public.portal_enrollment_request_lines l
  where l.request_id = p_request_id;

  update public.portal_enrollment_requests
  set status = 'approved',
      payment_id = v_payment_id,
      staff_note = nullif(trim(coalesce(p_staff_note, '')), ''),
      reviewed_by = v_reviewer,
      reviewed_at = now(),
      updated_at = now()
  where id = p_request_id;

  return p_request_id;
end;
$$;

revoke all on function public.portal_build_quote_from_lines(jsonb) from public;
revoke all on function public.portal_build_quote_from_lines(jsonb) from anon;

revoke all on function public.list_portal_class_schedules(uuid) from public;
revoke all on function public.list_portal_class_schedules(uuid) from anon;
grant execute on function public.list_portal_class_schedules(uuid) to authenticated;

revoke all on function public.preview_portal_enrollment_quote(jsonb) from public;
revoke all on function public.preview_portal_enrollment_quote(jsonb) from anon;
grant execute on function public.preview_portal_enrollment_quote(jsonb) to authenticated;

revoke all on function public.submit_portal_enrollment_request(jsonb, text) from public;
revoke all on function public.submit_portal_enrollment_request(jsonb, text) from anon;
grant execute on function public.submit_portal_enrollment_request(jsonb, text) to authenticated;

revoke all on function public.cancel_portal_enrollment_request(uuid) from public;
revoke all on function public.cancel_portal_enrollment_request(uuid) from anon;
grant execute on function public.cancel_portal_enrollment_request(uuid) to authenticated;

revoke all on function public.portal_allocate_invoice_number() from public;
revoke all on function public.portal_allocate_invoice_number() from anon;
-- only used internally by review; no grant to authenticated needed beyond security definer owner

revoke all on function public.review_portal_enrollment_request(uuid, boolean, text) from public;
revoke all on function public.review_portal_enrollment_request(uuid, boolean, text) from anon;
grant execute on function public.review_portal_enrollment_request(uuid, boolean, text) to authenticated;

revoke all on function public.portal_count_lessons_for_period(uuid, text, uuid[]) from public;
revoke all on function public.portal_count_lessons_for_period(uuid, text, uuid[]) from anon;

revoke all on function public.portal_resolve_unit_price(text, numeric, numeric, numeric, numeric) from public;
revoke all on function public.portal_resolve_unit_price(text, numeric, numeric, numeric, numeric) from anon;

comment on function public.preview_portal_enrollment_quote(jsonb) is
  '家長報讀預算學費試算（本波無優惠）。';
comment on function public.submit_portal_enrollment_request(jsonb, text) is
  '家長提交報讀申請；伺服器重算金額後寫入。';
comment on function public.cancel_portal_enrollment_request(uuid) is
  '家長取消待審核報讀申請。';
comment on function public.review_portal_enrollment_request(uuid, boolean, text) is
  '職員核准（建報讀＋待繳費）或拒絕家長報讀申請。';

commit;
