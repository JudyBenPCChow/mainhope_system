-- 話術庫：常見客戶問答，供 admin／alien 維護與一鍵複製

begin;

create table if not exists public.script_library_entries (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  tags text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by_label text,
  constraint script_library_question_nonempty check (char_length(trim(question)) > 0),
  constraint script_library_answer_nonempty check (char_length(trim(answer)) > 0)
);

create index if not exists script_library_entries_tags_gin_idx
  on public.script_library_entries using gin (tags);

create index if not exists script_library_entries_sort_order_idx
  on public.script_library_entries (sort_order asc, created_at desc);

comment on table public.script_library_entries is
  '話術庫：常見客戶問題與建議回答；僅 admin／alien 可讀寫。';

alter table public.script_library_entries enable row level security;

drop policy if exists script_library_entries_mgmt_all on public.script_library_entries;
create policy script_library_entries_mgmt_all
on public.script_library_entries
for all
to authenticated
using (public.is_mgmt_staff())
with check (public.is_mgmt_staff());

revoke all on table public.script_library_entries from anon;
grant select, insert, update, delete on table public.script_library_entries to authenticated;

commit;
