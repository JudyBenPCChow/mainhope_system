-- 高中試堂問卷選修寫入學生主檔，供學生詳細頁顯示／編輯

begin;

alter table public.students
  add column if not exists elected_subject_codes text[] not null default '{}'::text[];

comment on column public.students.elected_subject_codes is
  '高中目前選修科目 subjects.code；試堂邀請提交時寫入，職員可於學生詳細頁改。';

create or replace function public.trial_invite_sync_student_electives()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if cardinality(coalesce(NEW.elected_subject_codes, '{}'::text[])) = 0 then
    return NEW;
  end if;

  update public.students
  set
    elected_subject_codes = NEW.elected_subject_codes,
    updated_at = now()
  where id = NEW.student_id;

  return NEW;
end;
$$;

drop trigger if exists trial_invite_requests_sync_student_electives
  on public.trial_invite_requests;

create trigger trial_invite_requests_sync_student_electives
after insert or update of elected_subject_codes on public.trial_invite_requests
for each row
execute function public.trial_invite_sync_student_electives();

revoke all on function public.trial_invite_sync_student_electives() from public;
revoke all on function public.trial_invite_sync_student_electives() from anon;
revoke all on function public.trial_invite_sync_student_electives() from authenticated;

update public.students s
set elected_subject_codes = src.codes
from (
  select distinct on (r.student_id)
    r.student_id,
    r.elected_subject_codes as codes
  from public.trial_invite_requests r
  where cardinality(coalesce(r.elected_subject_codes, '{}'::text[])) > 0
  order by r.student_id, r.created_at desc
) src
where s.id = src.student_id
  and cardinality(coalesce(s.elected_subject_codes, '{}'::text[])) = 0;

notify pgrst, 'reload schema';

commit;
