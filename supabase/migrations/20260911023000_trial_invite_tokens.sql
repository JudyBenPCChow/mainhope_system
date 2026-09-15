-- 試堂邀請：既有學生專屬連結 → 家長選班／堂次 → 職員核准寫入 trial_sessions

begin;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.trial_invite_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  student_id uuid not null references public.students (id) on delete cascade,
  status text not null default 'open'
    check (status in ('open', 'submitted', 'approved', 'expired', 'voided')),
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  approved_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days')
);

create index if not exists trial_invite_tokens_student_id_idx
  on public.trial_invite_tokens (student_id);
create index if not exists trial_invite_tokens_status_idx
  on public.trial_invite_tokens (status);
create index if not exists trial_invite_tokens_expires_at_idx
  on public.trial_invite_tokens (expires_at);

create unique index if not exists trial_invite_tokens_one_active_per_student
  on public.trial_invite_tokens (student_id)
  where status in ('open', 'submitted');

comment on table public.trial_invite_tokens is
  '試堂邀請：一人一進行中 token；家長提交後職員核准才建 trial_sessions。';

create table if not exists public.trial_invite_requests (
  id uuid primary key default gen_random_uuid(),
  token_id uuid not null references public.trial_invite_tokens (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  status text not null default 'submitted'
    check (status in ('submitted', 'approved', 'rejected', 'cancelled')),
  parent_note text,
  reject_reason text,
  trial_type text,
  counts_toward_headcount boolean,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists trial_invite_requests_token_id_idx
  on public.trial_invite_requests (token_id);
create index if not exists trial_invite_requests_student_id_idx
  on public.trial_invite_requests (student_id);
create index if not exists trial_invite_requests_status_idx
  on public.trial_invite_requests (status);

comment on table public.trial_invite_requests is
  '試堂邀請一次提交＝一張申請；核准後寫入 trial_sessions。';

create table if not exists public.trial_invite_request_lines (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.trial_invite_requests (id) on delete cascade,
  class_id uuid not null references public.classes (id),
  schedule_id uuid not null references public.schedules (id),
  class_label text not null default '',
  created_at timestamptz not null default now(),
  unique (request_id, class_id)
);

create index if not exists trial_invite_request_lines_request_id_idx
  on public.trial_invite_request_lines (request_id);

comment on table public.trial_invite_request_lines is
  '試堂邀請申請行：每科一堂（連堂於核准時展開）。';

alter table public.trial_invite_tokens enable row level security;
alter table public.trial_invite_requests enable row level security;
alter table public.trial_invite_request_lines enable row level security;

drop policy if exists trial_invite_tokens_mgmt_all on public.trial_invite_tokens;
create policy trial_invite_tokens_mgmt_all
on public.trial_invite_tokens
for all
to authenticated
using (public.is_mgmt_staff() and private.has_capability('students.enroll'))
with check (public.is_mgmt_staff() and private.has_capability('students.enroll'));

drop policy if exists trial_invite_tokens_mgmt_select on public.trial_invite_tokens;
create policy trial_invite_tokens_mgmt_select
on public.trial_invite_tokens
for select
to authenticated
using (public.is_mgmt_staff() and private.has_capability('students.read'));

drop policy if exists trial_invite_requests_mgmt_all on public.trial_invite_requests;
create policy trial_invite_requests_mgmt_all
on public.trial_invite_requests
for all
to authenticated
using (public.is_mgmt_staff() and private.has_capability('students.enroll'))
with check (public.is_mgmt_staff() and private.has_capability('students.enroll'));

drop policy if exists trial_invite_requests_mgmt_select on public.trial_invite_requests;
create policy trial_invite_requests_mgmt_select
on public.trial_invite_requests
for select
to authenticated
using (public.is_mgmt_staff() and private.has_capability('students.read'));

drop policy if exists trial_invite_request_lines_mgmt_all on public.trial_invite_request_lines;
create policy trial_invite_request_lines_mgmt_all
on public.trial_invite_request_lines
for all
to authenticated
using (public.is_mgmt_staff() and private.has_capability('students.enroll'))
with check (public.is_mgmt_staff() and private.has_capability('students.enroll'));

drop policy if exists trial_invite_request_lines_mgmt_select on public.trial_invite_request_lines;
create policy trial_invite_request_lines_mgmt_select
on public.trial_invite_request_lines
for select
to authenticated
using (public.is_mgmt_staff() and private.has_capability('students.read'));

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.trial_invite_require_enroll()
returns void
language plpgsql
stable
set search_path = public
as $$
begin
  if not private.has_capability('students.enroll') then
    raise exception '無權限（須 students.enroll）';
  end if;
end;
$$;

create or replace function public.trial_invite_class_matches_student(
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
    join public.students s on s.id = p_student_id
    cross join lateral (
      select public.grade_code_to_label(s.grade) as lbl
    ) g
    where c.id = p_class_id
      and g.lbl is not null
      and c.class_kind in ('group', 'homework')
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
        or (
          s.grade is not null
          and s.grade = any (coalesce(co.eligible_grade_codes, array[co.grade_code]::text[]))
        )
      )
  );
$$;

revoke all on function public.trial_invite_class_matches_student(uuid, uuid) from public;
revoke all on function public.trial_invite_class_matches_student(uuid, uuid) from anon;
grant execute on function public.trial_invite_class_matches_student(uuid, uuid) to authenticated;

create or replace function public.trial_invite_class_label(p_class_id uuid)
returns text
language sql
stable
set search_path = public
as $$
  select coalesce(
    nullif(btrim(co.course_name), ''),
    nullif(btrim(c.subject), ''),
    nullif(btrim(c.course_code_full), ''),
    '班別'
  )
  from public.classes c
  left join public.courses co on co.id = c.course_id
  where c.id = p_class_id;
$$;

-- ---------------------------------------------------------------------------
-- Staff: create / void
-- ---------------------------------------------------------------------------

create or replace function public.trial_invite_create(p_student_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sid uuid;
  v_token text;
  v_id uuid;
  v_expires timestamptz;
  v_out jsonb := '[]'::jsonb;
  v_row jsonb;
begin
  perform public.trial_invite_require_enroll();
  if p_student_ids is null or cardinality(p_student_ids) = 0 then
    raise exception '請指定學生';
  end if;

  foreach v_sid in array p_student_ids
  loop
    if v_sid is null then
      continue;
    end if;
    if not exists (select 1 from public.students where id = v_sid) then
      continue;
    end if;

    select jsonb_build_object(
      'id', t.id,
      'token', t.token,
      'student_id', t.student_id,
      'status', t.status,
      'expires_at', t.expires_at,
      'submitted_at', t.submitted_at,
      'approved_at', t.approved_at,
      'created_at', t.created_at,
      'reused', true
    )
    into v_row
    from public.trial_invite_tokens t
    where t.student_id = v_sid
      and t.status in ('open', 'submitted')
    limit 1;

    if v_row is not null then
      v_out := v_out || jsonb_build_array(v_row);
      v_row := null;
      continue;
    end if;

    v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
    v_expires := now() + interval '30 days';

    insert into public.trial_invite_tokens (token, student_id, status, expires_at)
    values (v_token, v_sid, 'open', v_expires)
    returning id into v_id;

    v_out := v_out || jsonb_build_array(jsonb_build_object(
      'id', v_id,
      'token', v_token,
      'student_id', v_sid,
      'status', 'open',
      'expires_at', v_expires,
      'submitted_at', null,
      'approved_at', null,
      'created_at', now(),
      'reused', false
    ));
  end loop;

  return v_out;
end;
$$;

create or replace function public.trial_invite_void(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.trial_invite_tokens%rowtype;
begin
  perform public.trial_invite_require_enroll();
  if p_token is null or length(trim(p_token)) < 8 then
    raise exception '連結無效';
  end if;

  select * into r
  from public.trial_invite_tokens
  where token = trim(p_token)
  for update;
  if not found then
    raise exception '找不到此邀請連結';
  end if;

  if r.status in ('approved', 'voided') then
    raise exception '此連結已無法作廢（狀態：%）', r.status;
  end if;

  update public.trial_invite_requests
  set status = 'cancelled', reviewed_at = now()
  where token_id = r.id
    and status = 'submitted';

  update public.trial_invite_tokens
  set status = 'voided'
  where id = r.id
  returning * into r;

  return jsonb_build_object(
    'id', r.id,
    'token', r.token,
    'student_id', r.student_id,
    'status', r.status,
    'expires_at', r.expires_at,
    'submitted_at', r.submitted_at,
    'approved_at', r.approved_at,
    'created_at', r.created_at
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Public: get / submit
-- ---------------------------------------------------------------------------

create or replace function public.trial_invite_get(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.trial_invite_tokens%rowtype;
  s public.students%rowtype;
  v_classes jsonb := '[]'::jsonb;
  v_req jsonb := null;
begin
  if p_token is null or length(trim(p_token)) < 8 then
    raise exception '連結無效';
  end if;

  select * into r
  from public.trial_invite_tokens
  where token = trim(p_token)
  limit 1;
  if not found then
    raise exception '找不到此邀請連結';
  end if;

  if r.expires_at < now() and r.status in ('open', 'submitted') then
    update public.trial_invite_tokens
    set status = 'expired'
    where id = r.id;
    r.status := 'expired';
  end if;

  select * into s from public.students where id = r.student_id;
  if not found then
    raise exception '找不到對應學生';
  end if;

  if r.status = 'open' then
    select coalesce(jsonb_agg(cls_row order by cls_row->>'sort_kind', cls_row->>'course_name'), '[]'::jsonb)
    into v_classes
    from (
      select jsonb_build_object(
        'id', c.id,
        'class_kind', c.class_kind,
        'subject', coalesce(c.subject, ''),
        'course_code_full', coalesce(c.course_code_full, ''),
        'course_name', coalesce(co.course_name, c.subject, ''),
        'teacher_name', coalesce(nullif(btrim(t.abbr), ''), t.full_name, ''),
        'sort_kind', case when c.class_kind = 'group' then 0 else 1 end,
        'schedules', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'id', s2.id,
              'scheduled_date', s2.scheduled_date,
              'start_time', s2.start_time::text,
              'end_time', s2.end_time::text,
              'session_number', s2.session_number
            )
            order by s2.scheduled_date, s2.start_time, s2.session_number nulls last
          )
          from (
            select s1.*
            from public.schedules s1
            where s1.class_id = c.id
              and s1.scheduled_date >= current_date
              and coalesce(s1.status, '') not ilike '%取消%'
            order by s1.scheduled_date, s1.start_time, s1.session_number nulls last
            limit 12
          ) s2
        ), '[]'::jsonb)
      ) as cls_row
      from public.classes c
      left join public.courses co on co.id = c.course_id
      left join public.teachers t on t.id = c.teacher_id
      where public.trial_invite_class_matches_student(c.id, r.student_id)
        and exists (
          select 1
          from public.schedules sx
          where sx.class_id = c.id
            and sx.scheduled_date >= current_date
            and coalesce(sx.status, '') not ilike '%取消%'
        )
    ) q;
  end if;

  select jsonb_build_object(
    'id', req.id,
    'status', req.status,
    'parent_note', req.parent_note,
    'created_at', req.created_at,
    'lines', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ln.id,
        'class_id', ln.class_id,
        'schedule_id', ln.schedule_id,
        'class_label', ln.class_label,
        'scheduled_date', sch.scheduled_date,
        'start_time', sch.start_time::text,
        'end_time', sch.end_time::text
      ) order by ln.created_at)
      from public.trial_invite_request_lines ln
      left join public.schedules sch on sch.id = ln.schedule_id
      where ln.request_id = req.id
    ), '[]'::jsonb)
  )
  into v_req
  from public.trial_invite_requests req
  where req.token_id = r.id
  order by req.created_at desc
  limit 1;

  return jsonb_build_object(
    'id', r.id,
    'token', r.token,
    'student_id', r.student_id,
    'status', r.status,
    'expires_at', r.expires_at,
    'submitted_at', r.submitted_at,
    'approved_at', r.approved_at,
    'created_at', r.created_at,
    'identity', jsonb_build_object(
      'full_name', s.full_name,
      'student_code', coalesce(s.student_code, ''),
      'grade', coalesce(s.grade, ''),
      'school', coalesce(s.school, '')
    ),
    'classes', coalesce(v_classes, '[]'::jsonb),
    'submitted_request', v_req
  );
end;
$$;

create or replace function public.trial_invite_submit(
  p_token text,
  p_lines jsonb,
  p_parent_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.trial_invite_tokens%rowtype;
  v_request_id uuid;
  v_item jsonb;
  v_class_id uuid;
  v_schedule_id uuid;
  v_seen uuid[] := '{}'::uuid[];
  v_count int := 0;
begin
  if p_token is null or length(trim(p_token)) < 8 then
    raise exception '連結無效';
  end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) < 1 then
    raise exception '請至少選一科試堂';
  end if;
  if jsonb_array_length(p_lines) > 20 then
    raise exception '一次最多選 20 科';
  end if;

  select * into r
  from public.trial_invite_tokens
  where token = trim(p_token)
  for update;
  if not found then
    raise exception '找不到此邀請連結';
  end if;

  if r.expires_at < now() then
    update public.trial_invite_tokens set status = 'expired' where id = r.id;
    raise exception '此連結已過期，請向職員索取新連結';
  end if;

  if r.status <> 'open' then
    raise exception '此連結已無法再提交（狀態：%）', r.status;
  end if;

  insert into public.trial_invite_requests (token_id, student_id, status, parent_note)
  values (r.id, r.student_id, 'submitted', nullif(btrim(coalesce(p_parent_note, '')), ''))
  returning id into v_request_id;

  for v_item in select * from jsonb_array_elements(p_lines)
  loop
    begin
      v_class_id := (v_item->>'class_id')::uuid;
      v_schedule_id := (v_item->>'schedule_id')::uuid;
    exception when others then
      raise exception '班別或堂次格式無效';
    end;

    if v_class_id = any (v_seen) then
      raise exception '同一科請只選一個堂次';
    end if;
    v_seen := array_append(v_seen, v_class_id);

    if not public.trial_invite_class_matches_student(v_class_id, r.student_id) then
      raise exception '所選班別不適用於此學生年級';
    end if;

    if not exists (
      select 1
      from public.schedules sch
      where sch.id = v_schedule_id
        and sch.class_id = v_class_id
        and sch.scheduled_date >= current_date
        and coalesce(sch.status, '') not ilike '%取消%'
    ) then
      raise exception '所選堂次無效或已取消';
    end if;

    if exists (
      select 1
      from public.student_class_enrollments e
      where e.student_id = r.student_id
        and e.class_id = v_class_id
        and e.status = '就讀中'
    ) then
      raise exception '已報讀「%」，無需再申請試堂', public.trial_invite_class_label(v_class_id);
    end if;

    insert into public.trial_invite_request_lines (
      request_id, class_id, schedule_id, class_label
    ) values (
      v_request_id,
      v_class_id,
      v_schedule_id,
      public.trial_invite_class_label(v_class_id)
    );
    v_count := v_count + 1;
  end loop;

  if v_count < 1 then
    raise exception '請至少選一科試堂';
  end if;

  update public.trial_invite_tokens
  set status = 'submitted', submitted_at = now()
  where id = r.id;

  return public.trial_invite_get(p_token);
end;
$$;

-- ---------------------------------------------------------------------------
-- Staff: review → create trial_sessions
-- ---------------------------------------------------------------------------

create or replace function public.trial_invite_review(
  p_request_id uuid,
  p_action text,
  p_counts_toward_headcount boolean default null,
  p_trial_type text default '免費試堂',
  p_reject_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.trial_invite_requests%rowtype;
  tok public.trial_invite_tokens%rowtype;
  ln record;
  v_peer record;
  v_trial_type text;
  v_created int := 0;
  v_schedule_ids uuid[];
begin
  perform public.trial_invite_require_enroll();
  if p_request_id is null then
    raise exception '請指定申請';
  end if;
  if p_action not in ('approve', 'reject') then
    raise exception '動作無效';
  end if;

  select * into req
  from public.trial_invite_requests
  where id = p_request_id
  for update;
  if not found then
    raise exception '找不到申請';
  end if;
  if req.status <> 'submitted' then
    raise exception '此申請已處理（狀態：%）', req.status;
  end if;

  select * into tok
  from public.trial_invite_tokens
  where id = req.token_id
  for update;
  if not found then
    raise exception '找不到對應邀請連結';
  end if;

  if p_action = 'reject' then
    update public.trial_invite_requests
    set
      status = 'rejected',
      reject_reason = nullif(btrim(coalesce(p_reject_reason, '')), ''),
      reviewed_at = now()
    where id = req.id;

    update public.trial_invite_tokens
    set status = 'voided'
    where id = tok.id;

    return jsonb_build_object('request_id', req.id, 'status', 'rejected');
  end if;

  if p_counts_toward_headcount is null then
    raise exception '核准時須選擇是否計人頭';
  end if;

  v_trial_type := coalesce(nullif(btrim(p_trial_type), ''), '免費試堂');
  if v_trial_type not in ('免費試堂', '半價試堂', '原價試堂', '體驗課') then
    raise exception '試堂類型無效';
  end if;

  for ln in
    select * from public.trial_invite_request_lines where request_id = req.id
  loop
    if exists (
      select 1
      from public.student_class_enrollments e
      where e.student_id = req.student_id
        and e.class_id = ln.class_id
        and e.status = '就讀中'
    ) then
      raise exception '學生已報讀「%」，無法核准試堂', ln.class_label;
    end if;

    select array_agg(peer.id order by peer.scheduled_date, peer.start_time)
    into v_schedule_ids
    from public.schedules anchor
    join public.schedules peer
      on peer.id = anchor.id
      or (
        anchor.consecutive_group_id is not null
        and peer.consecutive_group_id = anchor.consecutive_group_id
      )
    where anchor.id = ln.schedule_id;

    if v_schedule_ids is null or cardinality(v_schedule_ids) = 0 then
      raise exception '堂次不存在：%', ln.class_label;
    end if;

    for v_peer in
      select *
      from public.schedules
      where id = any (v_schedule_ids)
    loop
      if v_peer.class_id <> ln.class_id then
        raise exception '堂次與班別不符：%', ln.class_label;
      end if;
      if coalesce(v_peer.status, '') ilike '%取消%' then
        raise exception '堂次已取消：%', ln.class_label;
      end if;
      if v_peer.scheduled_date < current_date then
        raise exception '不可核准過去日期的試堂：%', ln.class_label;
      end if;
      if exists (
        select 1
        from public.trial_sessions ts
        where ts.student_id = req.student_id
          and ts.schedule_id = v_peer.id
          and coalesce(ts.status, '') not ilike '%取消%'
          and coalesce(ts.status, '') not ilike '%完成%'
      ) then
        raise exception '此學生對「%」該堂已有未結案試堂', ln.class_label;
      end if;

      insert into public.trial_sessions (
        student_id,
        schedule_id,
        class_id,
        trial_date,
        trial_type,
        status,
        remarks,
        payment_id,
        counts_toward_headcount
      ) values (
        req.student_id,
        v_peer.id,
        ln.class_id,
        v_peer.scheduled_date,
        v_trial_type,
        '已預約',
        '試堂邀請核准',
        null,
        p_counts_toward_headcount
      );
      v_created := v_created + 1;
    end loop;
  end loop;

  update public.trial_invite_requests
  set
    status = 'approved',
    trial_type = v_trial_type,
    counts_toward_headcount = p_counts_toward_headcount,
    reviewed_at = now()
  where id = req.id;

  update public.trial_invite_tokens
  set status = 'approved', approved_at = now()
  where id = tok.id;

  return jsonb_build_object(
    'request_id', req.id,
    'status', 'approved',
    'trial_sessions_created', v_created
  );
end;
$$;

revoke all on function public.trial_invite_create(uuid[]) from public;
revoke all on function public.trial_invite_create(uuid[]) from anon;
grant execute on function public.trial_invite_create(uuid[]) to authenticated;

revoke all on function public.trial_invite_void(text) from public;
revoke all on function public.trial_invite_void(text) from anon;
grant execute on function public.trial_invite_void(text) to authenticated;

revoke all on function public.trial_invite_get(text) from public;
grant execute on function public.trial_invite_get(text) to anon, authenticated;

revoke all on function public.trial_invite_submit(text, jsonb, text) from public;
grant execute on function public.trial_invite_submit(text, jsonb, text) to anon, authenticated;

revoke all on function public.trial_invite_review(uuid, text, boolean, text, text) from public;
revoke all on function public.trial_invite_review(uuid, text, boolean, text, text) from anon;
grant execute on function public.trial_invite_review(uuid, text, boolean, text, text) to authenticated;

revoke all on function public.trial_invite_require_enroll() from public;
revoke all on function public.trial_invite_require_enroll() from anon;
grant execute on function public.trial_invite_require_enroll() to authenticated;

revoke all on function public.trial_invite_class_label(uuid) from public;
revoke all on function public.trial_invite_class_label(uuid) from anon;

notify pgrst, 'reload schema';

commit;
