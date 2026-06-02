-- Seed canonical weekday alias dictionary for import normalization

create table if not exists public.weekday_aliases (
  alias text primary key,
  iso_dow integer not null check (iso_dow between 1 and 7),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.weekday_aliases (alias, iso_dow, is_active)
values
  ('星期一', 1, true), ('週一', 1, true), ('一', 1, true), ('星期一組', 1, true),
  ('星期二', 2, true), ('週二', 2, true), ('二', 2, true), ('星期二組', 2, true),
  ('星期三', 3, true), ('週三', 3, true), ('三', 3, true), ('星期三組', 3, true),
  ('星期四', 4, true), ('週四', 4, true), ('四', 4, true), ('星期四組', 4, true),
  ('星期五', 5, true), ('週五', 5, true), ('五', 5, true), ('星期五組', 5, true),
  ('星期六', 6, true), ('週六', 6, true), ('六', 6, true), ('星期六組', 6, true),
  ('星期日', 7, true), ('週日', 7, true), ('日', 7, true), ('星期日組', 7, true)
on conflict (alias) do update
set
  iso_dow = excluded.iso_dow,
  is_active = true,
  updated_at = now();
