-- 老師可任教檔期（全學年；date-specific + time_slot）

create table if not exists public.teacher_availability_slots (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  academic_year_id uuid not null references public.academic_years (id) on delete cascade,
  available_date date not null,
  time_slot text not null,
  notes text,
  status text not null default '可分配',
  assigned_class_id uuid references public.classes (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (teacher_id, available_date, time_slot)
);

create index if not exists idx_teacher_availability_slots_year on public.teacher_availability_slots (academic_year_id);
create index if not exists idx_teacher_availability_slots_teacher on public.teacher_availability_slots (teacher_id);
create index if not exists idx_teacher_availability_slots_date on public.teacher_availability_slots (available_date);
create index if not exists idx_teacher_availability_slots_status on public.teacher_availability_slots (status);

alter table public.teacher_availability_slots enable row level security;

drop policy if exists dev_anon_all_teacher_availability_slots on public.teacher_availability_slots;
drop policy if exists dev_auth_all_teacher_availability_slots on public.teacher_availability_slots;

create policy dev_anon_all_teacher_availability_slots
on public.teacher_availability_slots
for all
to anon
using (true)
with check (true);

create policy dev_auth_all_teacher_availability_slots
on public.teacher_availability_slots
for all
to authenticated
using (true)
with check (true);

grant select, insert, update, delete on table public.teacher_availability_slots to anon, authenticated;
