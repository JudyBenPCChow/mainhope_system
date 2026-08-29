-- 日記帳附件：private Storage bucket + 路徑欄；RLS 跟 expense_entries 可見性。
-- 套用：npm run db:apply -- supabase/migrations/20260829070000_expense_journal_attachments.sql

begin;

alter table public.expense_entries
  add column if not exists attachment_path text,
  add column if not exists attachment_name text;

alter table public.expense_entries
  drop constraint if exists expense_entries_attachment_pair;

alter table public.expense_entries
  add constraint expense_entries_attachment_pair
  check (
    (attachment_path is null and attachment_name is null)
    or (
      attachment_path is not null
      and length(btrim(attachment_path)) > 0
      and attachment_name is not null
      and length(btrim(attachment_name)) > 0
    )
  );

comment on column public.expense_entries.attachment_path is
  'Storage object path in bucket expense-journal-attachments（{entry_id}/{file}）。';
comment on column public.expense_entries.attachment_name is
  '附件原檔名（畫面顯示）；物件檔名已淨化。';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'expense-journal-attachments',
  'expense-journal-attachments',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function private.can_access_expense_attachment(object_name text)
returns boolean
language sql
stable
security invoker
set search_path = public, storage, private
as $$
  select exists (
    select 1
    from public.expense_entries e
    where e.id::text = (storage.foldername(object_name))[1]
  );
$$;

comment on function private.can_access_expense_attachment(text) is
  '日記帳附件：能 SELECT 該 expense_entries 列即可讀／寫對應 Storage 物件。';

grant execute on function private.can_access_expense_attachment(text) to authenticated;

drop policy if exists expense_journal_attachments_select on storage.objects;
create policy expense_journal_attachments_select
on storage.objects for select to authenticated
using (
  bucket_id = 'expense-journal-attachments'
  and private.can_access_expense_attachment(name)
);

drop policy if exists expense_journal_attachments_insert on storage.objects;
create policy expense_journal_attachments_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'expense-journal-attachments'
  and private.has_capability('expenses.record')
  and private.can_access_expense_attachment(name)
);

drop policy if exists expense_journal_attachments_delete on storage.objects;
create policy expense_journal_attachments_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'expense-journal-attachments'
  and private.has_capability('expenses.record')
  and private.can_access_expense_attachment(name)
);

create or replace function public.expense_entries_guard_insert()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_code text;
begin
  if new.origin = 'manual' then
    if new.ledger_account_id is null then
      raise exception '請選擇費用類別'
        using errcode = '23514', hint = '人手日記帳必須選擇費用類別';
    end if;
    select a.code into v_code
    from public.expense_ledger_accounts a
    where a.id = new.ledger_account_id;
    if v_code in ('labor_tutor', 'labor_employer_mpf') then
      raise exception '導師薪酬／僱主強積金須由計糧結算過帳，不可人手入帳。'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

commit;
