-- 功課輔導班放假日：與專科 academic_calendar_closures 分開，不可互套。
-- 2627 放假 31 日已簽收（ACADEMIC_CALENDAR.md §3.3／ops-guide 附件乙）。

begin;

create table if not exists public.homework_tutoring_calendar_closures (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years (id) on delete cascade,
  closure_date date not null,
  name text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint homework_tutoring_calendar_closures_name_check
    check (char_length(trim(name)) > 0),
  constraint homework_tutoring_calendar_closures_unique
    unique (academic_year_id, closure_date)
);

create index if not exists homework_tutoring_calendar_closures_date_idx
  on public.homework_tutoring_calendar_closures (closure_date);

comment on table public.homework_tutoring_calendar_closures is
  '功課輔導班放假日（學生不用到本社）。與專科校舍假期分開；批量專科排程不可讀此表。';

alter table public.homework_tutoring_calendar_closures enable row level security;

drop policy if exists rls_cap_select_homework_tutoring_calendar_closures
  on public.homework_tutoring_calendar_closures;
drop policy if exists rls_cap_write_homework_tutoring_calendar_closures
  on public.homework_tutoring_calendar_closures;

create policy rls_cap_select_homework_tutoring_calendar_closures
on public.homework_tutoring_calendar_closures for select to authenticated
using (
  private.has_capability('calendar.manage')
  or public.is_teacher_role()
  or (private.has_capability('payments.read') and public.is_mgmt_staff())
);

create policy rls_cap_write_homework_tutoring_calendar_closures
on public.homework_tutoring_calendar_closures for all to authenticated
using (private.has_capability('calendar.manage'))
with check (private.has_capability('calendar.manage'));

grant select, insert, update, delete
  on public.homework_tutoring_calendar_closures
  to authenticated;

insert into public.homework_tutoring_calendar_closures (
  academic_year_id, closure_date, name, notes
)
select ay.id, d.closure_date, d.name, d.notes
from public.academic_years ay
cross join (
  values
    (date '2026-09-26', '中秋節翌日', null::text),
    (date '2026-10-01', '國慶節', null),
    (date '2026-10-18', '重陽節及翌日', '2026-10-18～2026-10-19'),
    (date '2026-10-19', '重陽節及翌日', '2026-10-18～2026-10-19'),
    (date '2026-12-22', '聖誕節假期', '2026-12-22～2026-12-31'),
    (date '2026-12-23', '聖誕節假期', '2026-12-22～2026-12-31'),
    (date '2026-12-24', '聖誕節假期', '2026-12-22～2026-12-31'),
    (date '2026-12-25', '聖誕節假期', '2026-12-22～2026-12-31'),
    (date '2026-12-26', '聖誕節假期', '2026-12-22～2026-12-31'),
    (date '2026-12-27', '聖誕節假期', '2026-12-22～2026-12-31'),
    (date '2026-12-28', '聖誕節假期', '2026-12-22～2026-12-31'),
    (date '2026-12-29', '聖誕節假期', '2026-12-22～2026-12-31'),
    (date '2026-12-30', '聖誕節假期', '2026-12-22～2026-12-31'),
    (date '2026-12-31', '聖誕節假期', '2026-12-22～2026-12-31'),
    (date '2027-01-01', '元旦', null),
    (date '2027-02-04', '農曆年假期', '2027-02-04～2027-02-10'),
    (date '2027-02-05', '農曆年假期', '2027-02-04～2027-02-10'),
    (date '2027-02-06', '農曆年假期', '2027-02-04～2027-02-10'),
    (date '2027-02-07', '農曆年假期', '2027-02-04～2027-02-10'),
    (date '2027-02-08', '農曆年假期', '2027-02-04～2027-02-10'),
    (date '2027-02-09', '農曆年假期', '2027-02-04～2027-02-10'),
    (date '2027-02-10', '農曆年假期', '2027-02-04～2027-02-10'),
    (date '2027-03-26', '復活節假期', '2027-03-26～2027-03-30'),
    (date '2027-03-27', '復活節假期', '2027-03-26～2027-03-30'),
    (date '2027-03-28', '復活節假期', '2027-03-26～2027-03-30'),
    (date '2027-03-29', '復活節假期', '2027-03-26～2027-03-30'),
    (date '2027-03-30', '復活節假期', '2027-03-26～2027-03-30'),
    (date '2027-04-05', '清明節', null),
    (date '2027-05-01', '勞動節', null),
    (date '2027-05-13', '佛誕', null),
    (date '2027-06-09', '端午節', null)
) as d(closure_date, name, notes)
where ay.label = '2627'
on conflict on constraint homework_tutoring_calendar_closures_unique do update
  set name = excluded.name,
      notes = excluded.notes,
      updated_at = now();

commit;
