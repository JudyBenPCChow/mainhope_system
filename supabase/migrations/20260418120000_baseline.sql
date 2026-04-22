-- 明學管理 — 單一 baseline（合併原 001～007 schema；種子改見 ../seed.sql）
-- 開發用 RLS：允許 anon 讀寫全部。**正式上線前務必改為依 auth.uid()／profiles.role 的嚴格政策。**
-- 可重複執行：已存在的表／policy 不會報錯（IF NOT EXISTS／DROP POLICY IF EXISTS）。

-- 1. 無外向依賴
create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  english_name text,
  phone text,
  email text,
  status text default '在職',
  subject_speciality text[],
  salary_per_lesson numeric,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.classrooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  capacity integer,
  is_online boolean not null default false,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  student_code text,
  full_name text not null,
  english_name text,
  gender text,
  date_of_birth date,
  grade text,
  school text,
  status text default '就讀中',
  parent_name text,
  parent_relationship text,
  parent_phone text,
  whatsapp text,
  address text,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text,
  display_name text,
  role text not null default 'admin',
  teacher_id uuid references public.teachers (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. 依賴 teachers / classrooms
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  course_code text,
  subject text not null,
  grade text[],
  day_of_week text,
  time_slot text,
  teacher_id uuid references public.teachers (id) on delete set null,
  classroom_id uuid references public.classrooms (id) on delete set null,
  capacity integer,
  price_per_lesson numeric,
  start_date date,
  end_date date,
  status text default '進行中',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- class_id 可為 null：老師「其他」約房用（原 006）
-- 排程（本表 schedules）：預計會發生的課堂時段，用於日曆、課室預留與點名流程之對照；方便預先點名或準備，但本身不是正式的出席／點名紀錄。
-- 正式出勤紀錄見 attendance_details。排程亦有助管理課室在同一時段是否已被占用等供應問題。
create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.classes (id) on delete cascade,
  teacher_id uuid references public.teachers (id) on delete set null,
  classroom_id uuid references public.classrooms (id) on delete set null,
  scheduled_date date not null,
  start_time text,
  end_time text,
  status text default '預定',
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_class_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  status text default '就讀中',
  enroll_date date,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 學生層級之正式點名／出席紀錄（與 schedules 之「預定課堂時段」分開；後者見上表註解）。
create table if not exists public.attendance_details (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  attendance_date date not null,
  status text default '出席',
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_discounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  percent_off numeric,
  amount_off numeric,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  receipt_number text,
  student_id uuid not null references public.students (id) on delete cascade,
  payment_date date not null,
  total_amount numeric not null,
  payment_method text,
  status text default '已收款',
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments
  add column if not exists payment_discount_id uuid references public.payment_discounts (id) on delete set null;

create index if not exists payments_payment_discount_id_idx on public.payments (payment_discount_id);

create table if not exists public.payment_details (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id) on delete cascade,
  class_id uuid references public.classes (id) on delete set null,
  lesson_count integer,
  amount numeric,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_status_history (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_date date,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leave_makeup_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  schedule_id uuid references public.schedules (id) on delete set null,
  leave_date date not null,
  leave_reason text,
  makeup_type text,
  makeup_date date,
  makeup_schedule_id uuid references public.schedules (id) on delete set null,
  status text default '待補課',
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trial_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  schedule_id uuid not null references public.schedules (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  trial_date date not null,
  trial_type text not null,
  status text default '已預約',
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_todos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  notes text,
  due_date date not null default (now()::date),
  completed_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.enrollment_change_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  enrollment_id uuid,
  action text not null,
  effective_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint enrollment_change_events_action_check check (action in ('enroll', 'withdraw'))
);

create index if not exists enrollment_change_events_student_id_idx on public.enrollment_change_events (student_id);
create index if not exists enrollment_change_events_class_id_idx on public.enrollment_change_events (class_id);

create table if not exists public.student_relationships (
  id uuid primary key default gen_random_uuid(),
  student_a_id uuid not null references public.students (id) on delete cascade,
  student_b_id uuid not null references public.students (id) on delete cascade,
  relationship text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_relationships_order_check check (student_a_id::text < student_b_id::text),
  constraint student_relationships_distinct check (student_a_id <> student_b_id),
  constraint student_relationships_pair_unique unique (student_a_id, student_b_id)
);

create index if not exists student_relationships_student_a_id_idx on public.student_relationships (student_a_id);
create index if not exists student_relationships_student_b_id_idx on public.student_relationships (student_b_id);

create table if not exists public.classroom_booking_requests (
  id uuid primary key default gen_random_uuid(),
  requesting_teacher_id uuid not null references public.teachers (id) on delete cascade,
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  scheduled_date date not null,
  start_time text not null,
  end_time text not null,
  target_class_id uuid references public.classes (id) on delete set null,
  is_other boolean not null default false,
  reason text,
  status text not null default '待審批',
  created_schedule_id uuid references public.schedules (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_classroom_booking_requests_status on public.classroom_booking_requests (status);
create index if not exists idx_classroom_booking_requests_date on public.classroom_booking_requests (scheduled_date);

-- RLS（開發用：anon 全開；上線請刪除並改寫）
alter table public.teachers enable row level security;
alter table public.classrooms enable row level security;
alter table public.students enable row level security;
alter table public.app_users enable row level security;
alter table public.classes enable row level security;
alter table public.schedules enable row level security;
alter table public.student_class_enrollments enable row level security;
alter table public.attendance_details enable row level security;
alter table public.payment_discounts enable row level security;
alter table public.payments enable row level security;
alter table public.payment_details enable row level security;
alter table public.student_status_history enable row level security;
alter table public.leave_makeup_records enable row level security;
alter table public.trial_sessions enable row level security;
alter table public.admin_todos enable row level security;
alter table public.enrollment_change_events enable row level security;
alter table public.student_relationships enable row level security;
alter table public.classroom_booking_requests enable row level security;

do $$
declare
  t text;
  tables text[] := array[
    'teachers','classrooms','students','app_users','classes','schedules',
    'student_class_enrollments','attendance_details','payment_discounts',
    'payments','payment_details',
    'student_status_history','leave_makeup_records','trial_sessions',
    'admin_todos','enrollment_change_events','student_relationships',
    'classroom_booking_requests'
  ];
begin
  foreach t in array tables
  loop
    execute format('drop policy if exists dev_anon_all_%I on public.%I;', t, t);
    execute format('drop policy if exists dev_auth_all_%I on public.%I;', t, t);
    execute format('create policy dev_anon_all_%I on public.%I for all to anon using (true) with check (true);', t, t);
    execute format('create policy dev_auth_all_%I on public.%I for all to authenticated using (true) with check (true);', t, t);
  end loop;
end $$;

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
