-- 建檔掛 converted_student_id 時，若學生有興趣科目仍空，從 lead 補入。
-- 即使舊前端未傳 interested_subjects，建檔後仍會帶入。

begin;

create or replace function public.leads_sync_interested_subjects_on_convert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.converted_student_id is null then
    return new;
  end if;
  if cardinality(coalesce(new.interested_subjects, '{}'::text[])) = 0 then
    return new;
  end if;

  update public.students s
  set
    interested_subjects = new.interested_subjects,
    updated_at = now()
  where s.id = new.converted_student_id
    and cardinality(coalesce(s.interested_subjects, '{}'::text[])) = 0;

  return new;
end;
$$;

drop trigger if exists leads_sync_interested_subjects_on_convert on public.leads;

create trigger leads_sync_interested_subjects_on_convert
after insert or update of converted_student_id, interested_subjects
on public.leads
for each row
execute function public.leads_sync_interested_subjects_on_convert();

comment on function public.leads_sync_interested_subjects_on_convert() is
  '潛在客戶建檔後，把 interested_subjects 補入學生主檔（僅填空）。';

commit;
