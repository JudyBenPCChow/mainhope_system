-- 權益池＋到課宣告（報讀包裝與點名權益 Wave 1）
-- 營運語意：entitlement consumption ≠ accounting revenue recognition
-- 見 docs/plans/2026-08-04-enrollment-entitlement-roster.md、docs/backlog/summer-enrollment-roster-consistency.md

-- ---------------------------------------------------------------------------
-- student_entitlement_pools
-- ---------------------------------------------------------------------------
create table if not exists public.student_entitlement_pools (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  academic_year_id uuid not null references public.academic_years (id) on delete restrict,
  package_type text not null
    check (package_type in (
      'summer_phase_1',
      'summer_phase_2',
      'summer_full',
      'regular_full',
      'single_lesson'
    )),
  source_enrollment_id uuid not null references public.student_class_enrollments (id) on delete cascade,
  initial_lessons numeric(8, 2) not null default 0
    check (initial_lessons >= 0),
  remaining_lessons numeric(8, 2) not null default 0
    check (remaining_lessons >= 0),
  valid_from date,
  valid_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, class_id, academic_year_id, package_type, source_enrollment_id)
);

create index if not exists student_entitlement_pools_student_id_idx
  on public.student_entitlement_pools (student_id);

create index if not exists student_entitlement_pools_class_id_idx
  on public.student_entitlement_pools (class_id);

create index if not exists student_entitlement_pools_enrollment_id_idx
  on public.student_entitlement_pools (source_enrollment_id);

create index if not exists student_entitlement_pools_year_class_idx
  on public.student_entitlement_pools (academic_year_id, class_id);

comment on table public.student_entitlement_pools is
  '營運權益池：學生於某班／學年／包裝尚餘堂次。非收入認列帳。';

comment on column public.student_entitlement_pools.remaining_lessons is
  '營運剩餘堂次（entitlement）；不等於已認列收入。';

comment on column public.student_entitlement_pools.package_type is
  '包裝命名空間：summer_phase_1|summer_phase_2|summer_full|regular_full|single_lesson';

-- ---------------------------------------------------------------------------
-- attendance_declarations
-- ---------------------------------------------------------------------------
create table if not exists public.attendance_declarations (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedules (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  pool_id uuid not null references public.student_entitlement_pools (id) on delete restrict,
  status text not null default 'active'
    check (status in ('active', 'void', 'superseded')),
  superseded_by uuid references public.attendance_declarations (id) on delete set null,
  source_event_type text,
  source_event_id uuid,
  manual_reason text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists attendance_declarations_active_schedule_student_uidx
  on public.attendance_declarations (schedule_id, student_id)
  where status = 'active';

create index if not exists attendance_declarations_schedule_id_idx
  on public.attendance_declarations (schedule_id);

create index if not exists attendance_declarations_student_id_idx
  on public.attendance_declarations (student_id);

create index if not exists attendance_declarations_pool_id_idx
  on public.attendance_declarations (pool_id);

create index if not exists attendance_declarations_status_idx
  on public.attendance_declarations (status);

comment on table public.attendance_declarations is
  '到課宣告：某次排程點名紙應出現誰；必須指向 entitlement pool。';

comment on column public.attendance_declarations.status is
  'active=點名紙應顯示；void=作廢；superseded=被取代';

-- ---------------------------------------------------------------------------
-- entitlement_consumption_events（營運消耗／返還；≠ 收入認列）
-- ---------------------------------------------------------------------------
create table if not exists public.entitlement_consumption_events (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.student_entitlement_pools (id) on delete restrict,
  student_id uuid not null references public.students (id) on delete cascade,
  schedule_id uuid references public.schedules (id) on delete set null,
  attendance_detail_id uuid references public.attendance_details (id) on delete set null,
  declaration_id uuid references public.attendance_declarations (id) on delete set null,
  delta_lessons numeric(8, 2) not null,
  reason text not null
    check (reason in ('entitlement_consumed', 'entitlement_reinstated')),
  created_at timestamptz not null default now(),
  created_by uuid
);

create index if not exists entitlement_consumption_events_pool_id_idx
  on public.entitlement_consumption_events (pool_id);

create index if not exists entitlement_consumption_events_schedule_id_idx
  on public.entitlement_consumption_events (schedule_id);

create index if not exists entitlement_consumption_events_attendance_detail_id_idx
  on public.entitlement_consumption_events (attendance_detail_id);

comment on table public.entitlement_consumption_events is
  'Operational entitlement consumption / reinstatement only — not accounting revenue recognition.';

comment on column public.entitlement_consumption_events.delta_lessons is
  '負數＝消耗；正數＝返還（entitlement_reinstated）';

comment on column public.entitlement_consumption_events.reason is
  'entitlement_consumed | entitlement_reinstated（禁用 revenue_recognized 等會計語義）';

-- ---------------------------------------------------------------------------
-- attendance_declaration_exceptions（手動加名 pending；UI 後做）
-- ---------------------------------------------------------------------------
create table if not exists public.attendance_declaration_exceptions (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedules (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  academic_year_id uuid references public.academic_years (id) on delete set null,
  status text not null default 'manual_added_pending'
    check (status in (
      'manual_added_pending',
      'manual_added_approved',
      'manual_added_rejected'
    )),
  reason text,
  resolution_note text,
  created_by uuid,
  resolved_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists attendance_declaration_exceptions_schedule_id_idx
  on public.attendance_declaration_exceptions (schedule_id);

create index if not exists attendance_declaration_exceptions_status_idx
  on public.attendance_declaration_exceptions (status);

comment on table public.attendance_declaration_exceptions is
  '手動加名例外：無池時 pending；審批後轉正式宣告或駁回收口。';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.student_entitlement_pools enable row level security;
alter table public.attendance_declarations enable row level security;
alter table public.entitlement_consumption_events enable row level security;
alter table public.attendance_declaration_exceptions enable row level security;

drop policy if exists rls_mgmt_all_student_entitlement_pools on public.student_entitlement_pools;
create policy rls_mgmt_all_student_entitlement_pools
on public.student_entitlement_pools
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

drop policy if exists rls_teacher_select_student_entitlement_pools on public.student_entitlement_pools;
create policy rls_teacher_select_student_entitlement_pools
on public.student_entitlement_pools
for select
to authenticated
using (
  public.is_teacher_role()
  and public.teacher_can_access_class(class_id)
);

drop policy if exists rls_mgmt_all_attendance_declarations on public.attendance_declarations;
create policy rls_mgmt_all_attendance_declarations
on public.attendance_declarations
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

drop policy if exists rls_teacher_select_attendance_declarations on public.attendance_declarations;
create policy rls_teacher_select_attendance_declarations
on public.attendance_declarations
for select
to authenticated
using (
  public.is_teacher_role()
  and public.teacher_can_access_schedule(schedule_id)
);

drop policy if exists rls_mgmt_all_entitlement_consumption_events on public.entitlement_consumption_events;
create policy rls_mgmt_all_entitlement_consumption_events
on public.entitlement_consumption_events
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

drop policy if exists rls_teacher_select_entitlement_consumption_events on public.entitlement_consumption_events;
create policy rls_teacher_select_entitlement_consumption_events
on public.entitlement_consumption_events
for select
to authenticated
using (
  public.is_teacher_role()
  and (
    schedule_id is not null and public.teacher_can_access_schedule(schedule_id)
  )
);

drop policy if exists rls_mgmt_all_attendance_declaration_exceptions on public.attendance_declaration_exceptions;
create policy rls_mgmt_all_attendance_declaration_exceptions
on public.attendance_declaration_exceptions
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

drop policy if exists rls_teacher_select_attendance_declaration_exceptions on public.attendance_declaration_exceptions;
create policy rls_teacher_select_attendance_declaration_exceptions
on public.attendance_declaration_exceptions
for select
to authenticated
using (
  public.is_teacher_role()
  and public.teacher_can_access_class(class_id)
);

grant select, insert, update, delete on public.student_entitlement_pools to authenticated;
grant select, insert, update, delete on public.attendance_declarations to authenticated;
grant select, insert, update, delete on public.entitlement_consumption_events to authenticated;
grant select, insert, update, delete on public.attendance_declaration_exceptions to authenticated;
