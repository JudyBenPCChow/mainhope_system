-- 功輔當值：一日可多人、每人獨立時段（默認跟報更；行政可改）。
-- 舊欄 secondary_teacher_id／primary_teacher_id 仍寫入（每室第一人），佔室時間仍全日 15:15–19:30。

begin;

create table if not exists public.homework_tutoring_duty_assignments (
  id uuid primary key default gen_random_uuid(),
  duty_day_id uuid not null
    references public.homework_tutoring_duty_days (id) on delete cascade,
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  session_start time not null,
  session_end time not null,
  room text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint homework_tutoring_duty_assignments_unique
    unique (duty_day_id, teacher_id, room),
  constraint homework_tutoring_duty_assignments_time_chk
    check (session_end > session_start)
);

create index if not exists homework_tutoring_duty_assignments_day_idx
  on public.homework_tutoring_duty_assignments (duty_day_id, sort_order);

create index if not exists homework_tutoring_duty_assignments_teacher_idx
  on public.homework_tutoring_duty_assignments (teacher_id, duty_day_id);

comment on table public.homework_tutoring_duty_assignments is
  '功輔當值指派：一日可多人；時段默認跟報更，行政可改。唔要求全日都有人。';

alter table public.homework_tutoring_duty_assignments enable row level security;

drop policy if exists rls_cap_select_homework_tutoring_duty_assignments
  on public.homework_tutoring_duty_assignments;
drop policy if exists rls_cap_write_homework_tutoring_duty_assignments
  on public.homework_tutoring_duty_assignments;

create policy rls_cap_select_homework_tutoring_duty_assignments
on public.homework_tutoring_duty_assignments for select to authenticated
using (
  private.has_capability('classes.read')
  or private.has_capability('schedule.read')
  or public.is_mgmt_staff()
  or public.is_teacher_role()
);

create policy rls_cap_write_homework_tutoring_duty_assignments
on public.homework_tutoring_duty_assignments for all to authenticated
using (
  private.has_capability('classes.update')
  or private.has_capability('schedule.write')
)
with check (
  private.has_capability('classes.update')
  or private.has_capability('schedule.write')
);

grant select, insert, update, delete
  on public.homework_tutoring_duty_assignments
  to authenticated;

-- 由舊「每室一人全日」欄回填；有自訂報更則用報更時段
insert into public.homework_tutoring_duty_assignments (
  duty_day_id, teacher_id, session_start, session_end, room, sort_order
)
select
  d.id,
  x.teacher_id,
  coalesce(
    case
      when jsonb_typeof(ent.e) = 'object'
        and ent.e->>'kind' = 'custom'
        and (ent.e->>'start') ~ '^\d{2}:\d{2}'
      then (ent.e->>'start')::time
    end,
    d.session_start
  ),
  coalesce(
    case
      when jsonb_typeof(ent.e) = 'object'
        and ent.e->>'kind' = 'custom'
        and (ent.e->>'end') ~ '^\d{2}:\d{2}'
      then (ent.e->>'end')::time
    end,
    d.session_end
  ),
  x.room,
  x.sort_order
from public.homework_tutoring_duty_days d
join public.homework_tutoring_roster_months rm on rm.id = d.roster_month_id
cross join lateral (
  values
    (
      d.secondary_teacher_id,
      coalesce(nullif(btrim(d.secondary_room), ''), '17D'),
      0
    ),
    (
      d.primary_teacher_id,
      coalesce(nullif(btrim(d.primary_room), ''), '17E'),
      1
    )
) as x(teacher_id, room, sort_order)
left join public.homework_tutoring_availability a
  on a.teacher_id = x.teacher_id
  and a.target_month = rm.roster_month
left join lateral (
  select a.entries -> (
    (extract(month from d.duty_date)::int)::text
    || '/'
    || (extract(day from d.duty_date)::int)::text
  ) as e
) ent on true
where x.teacher_id is not null
  and d.holiday_label is null
  and coalesce(
    case
      when jsonb_typeof(ent.e) = 'object'
        and ent.e->>'kind' = 'custom'
        and (ent.e->>'end') ~ '^\d{2}:\d{2}'
      then (ent.e->>'end')::time
    end,
    d.session_end
  ) > coalesce(
    case
      when jsonb_typeof(ent.e) = 'object'
        and ent.e->>'kind' = 'custom'
        and (ent.e->>'start') ~ '^\d{2}:\d{2}'
      then (ent.e->>'start')::time
    end,
    d.session_start
  )
on conflict (duty_day_id, teacher_id, room) do nothing;

commit;
