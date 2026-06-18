-- 家長/學生流動查閱系統 (Parent/Student Portal) — 基礎
-- 以「學生為主體，一帳號一學生」：app_users 加 student_id、角色加入 'student'。
-- 登入：行政產生邀請連結 → 家長以 email+password signUp → redeem_portal_invite() 綁定學生。
-- v1 純查閱：portal 角色僅有 SELECT 政策；不影響既有 admin/teacher/alien 政策。
--
-- 部署備註：邀請啟用流程依賴 supabase.auth.signUp 立即取得 session。
--   若專案開啟「Confirm email」，家長需先確認電郵才能完成綁定；建議首版關閉 email 確認，
--   或改用後續的 Edge Function 以 service role 建立帳號。

begin;

-- ---------------------------------------------------------------------------
-- 1. 帳號模型：app_users 連結 students
-- ---------------------------------------------------------------------------

alter table public.app_users
  add column if not exists student_id uuid references public.students (id) on delete set null;

create index if not exists app_users_student_id_idx on public.app_users (student_id);

-- 同一學生只綁定一個 portal 帳號（student 角色）
create unique index if not exists app_users_student_id_unique
  on public.app_users (student_id)
  where student_id is not null;

comment on column public.app_users.student_id is
  'Portal 帳號（role=student）對應的學生；teacher 角色用 teacher_id。';

-- 角色 check 約束加入 'student'（portal 帳號角色）；否則 redeem_portal_invite 寫入會違反約束。
alter table public.app_users drop constraint if exists app_users_role_check;
alter table public.app_users
  add constraint app_users_role_check
  check (role = any (array['admin', 'teacher', 'alien', 'student']));

-- ---------------------------------------------------------------------------
-- 2. 角色 helper（SECURITY DEFINER，避免 RLS 遞迴；沿用 Phase B/C 模式）
-- ---------------------------------------------------------------------------

create or replace function public.is_portal()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role(), '') = 'student';
$$;

create or replace function public.current_portal_student_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select au.student_id
  from public.app_users au
  where lower(coalesce(au.email, '')) = public.current_app_user_email()
    and au.role = 'student'
  limit 1;
$$;

create or replace function public.portal_can_access_class(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.student_class_enrollments e
    where e.class_id = p_class_id
      and e.student_id = public.current_portal_student_id()
  );
$$;

revoke all on function public.is_portal() from public;
revoke all on function public.is_portal() from anon;
grant execute on function public.is_portal() to authenticated;

revoke all on function public.current_portal_student_id() from public;
revoke all on function public.current_portal_student_id() from anon;
grant execute on function public.current_portal_student_id() to authenticated;

revoke all on function public.portal_can_access_class(uuid) from public;
revoke all on function public.portal_can_access_class(uuid) from anon;
grant execute on function public.portal_can_access_class(uuid) to authenticated;

comment on function public.is_portal() is 'Portal: app_users.role = student.';
comment on function public.current_portal_student_id() is 'Portal: JWT email → app_users.student_id (role=student).';
comment on function public.portal_can_access_class(uuid) is 'Portal: 目前學生是否報讀此班別。';

-- ---------------------------------------------------------------------------
-- 3. 邀請表 + 綁定 RPC
-- ---------------------------------------------------------------------------

create table if not exists public.student_portal_invites (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null default (now() + interval '14 days'),
  used_at timestamptz,
  used_by_email text,
  created_by uuid references public.app_users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists student_portal_invites_student_id_idx
  on public.student_portal_invites (student_id);

alter table public.student_portal_invites enable row level security;

-- 只有 admin/alien 可管理邀請；token 不對 portal/teacher 開放讀取
drop policy if exists portal_invites_mgmt_all on public.student_portal_invites;
create policy portal_invites_mgmt_all
on public.student_portal_invites
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

-- 綁定 RPC：以「目前登入者的 JWT email」為準（不信任 client 傳入），消耗有效邀請。
create or replace function public.redeem_portal_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := public.current_app_user_email();
  v_invite public.student_portal_invites;
  v_user_id uuid;
begin
  if v_email is null or v_email = '' then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select * into v_invite
  from public.student_portal_invites
  where token = p_token
  limit 1;

  if not found then
    raise exception 'INVITE_NOT_FOUND';
  end if;
  if v_invite.used_at is not null then
    raise exception 'INVITE_ALREADY_USED';
  end if;
  if v_invite.expires_at < now() then
    raise exception 'INVITE_EXPIRED';
  end if;

  -- 綁定：建立或更新 app_users（role=student, student_id）
  insert into public.app_users (email, display_name, role, student_id)
  values (
    v_email,
    (select coalesce(full_name, '家長') from public.students where id = v_invite.student_id),
    'student',
    v_invite.student_id
  )
  on conflict (email) do update
    set role = 'student',
        student_id = excluded.student_id,
        updated_at = now()
  returning id into v_user_id;

  update public.student_portal_invites
    set used_at = now(), used_by_email = v_email
    where id = v_invite.id;

  return v_invite.student_id;
end;
$$;

revoke all on function public.redeem_portal_invite(text) from public;
revoke all on function public.redeem_portal_invite(text) from anon;
grant execute on function public.redeem_portal_invite(text) to authenticated;

comment on function public.redeem_portal_invite(text) is
  'Portal 啟用：消耗邀請 token，將目前登入電郵綁定為該學生的 portal 帳號。';

-- app_users 需有 email 唯一鍵以支援上面的 on conflict (email)
create unique index if not exists app_users_email_unique
  on public.app_users (lower(email))
  where email is not null;

-- ---------------------------------------------------------------------------
-- 4. Portal 唯讀 RLS（每張表加 portal SELECT；不動既有 admin/teacher 政策）
-- ---------------------------------------------------------------------------

-- students：只讀自己
drop policy if exists portal_select_students on public.students;
create policy portal_select_students
on public.students
for select
to authenticated
using (public.is_portal() and id = public.current_portal_student_id());

-- student_class_enrollments
drop policy if exists portal_select_enrollments on public.student_class_enrollments;
create policy portal_select_enrollments
on public.student_class_enrollments
for select
to authenticated
using (public.is_portal() and student_id = public.current_portal_student_id());

-- classes（已報讀的班別）
drop policy if exists portal_select_classes on public.classes;
create policy portal_select_classes
on public.classes
for select
to authenticated
using (public.is_portal() and public.portal_can_access_class(id));

-- schedules（已報讀班別的課堂時段）
drop policy if exists portal_select_schedules on public.schedules;
create policy portal_select_schedules
on public.schedules
for select
to authenticated
using (public.is_portal() and public.portal_can_access_class(class_id));

-- attendance_details（出席紀錄）
drop policy if exists portal_select_attendance on public.attendance_details;
create policy portal_select_attendance
on public.attendance_details
for select
to authenticated
using (public.is_portal() and student_id = public.current_portal_student_id());

-- leave_makeup_records（請假/補課）
drop policy if exists portal_select_leave_makeup on public.leave_makeup_records;
create policy portal_select_leave_makeup
on public.leave_makeup_records
for select
to authenticated
using (public.is_portal() and student_id = public.current_portal_student_id());

-- payments（繳費）
drop policy if exists portal_select_payments on public.payments;
create policy portal_select_payments
on public.payments
for select
to authenticated
using (public.is_portal() and student_id = public.current_portal_student_id());

-- payment_details（繳費明細，經 payments 連結）
drop policy if exists portal_select_payment_details on public.payment_details;
create policy portal_select_payment_details
on public.payment_details
for select
to authenticated
using (
  public.is_portal()
  and exists (
    select 1 from public.payments p
    where p.id = payment_details.payment_id
      and p.student_id = public.current_portal_student_id()
  )
);

-- teachers（只露出所屬班別老師的姓名等）
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
    join public.student_class_enrollments e on e.class_id = c.id
    where c.teacher_id = teachers.id
      and e.student_id = public.current_portal_student_id()
  )
);

-- classrooms（課堂所在課室，供時間表顯示）
drop policy if exists portal_select_classrooms on public.classrooms;
create policy portal_select_classrooms
on public.classrooms
for select
to authenticated
using (
  public.is_portal()
  and exists (
    select 1
    from public.schedules s
    where s.classroom_id = classrooms.id
      and public.portal_can_access_class(s.class_id)
  )
);

-- ---------------------------------------------------------------------------
-- 5. 通告：calendar_events 加入 'parents' 廣播可見性 + portal 讀取
-- ---------------------------------------------------------------------------

alter table public.calendar_events
  drop constraint if exists calendar_events_visibility_check;
alter table public.calendar_events
  add constraint calendar_events_visibility_check
  check (visibility in ('private', 'teachers', 'parents'));

drop policy if exists portal_select_calendar_events on public.calendar_events;
create policy portal_select_calendar_events
on public.calendar_events
for select
to authenticated
using (
  public.is_portal()
  and (
    visibility = 'parents'
    or exists (
      select 1
      from public.calendar_event_students ces
      where ces.event_id = calendar_events.id
        and ces.student_id = public.current_portal_student_id()
    )
  )
);

drop policy if exists portal_select_calendar_event_students on public.calendar_event_students;
create policy portal_select_calendar_event_students
on public.calendar_event_students
for select
to authenticated
using (public.is_portal() and student_id = public.current_portal_student_id());

commit;
