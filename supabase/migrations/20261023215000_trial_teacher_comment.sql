-- 試堂老師評語：五欄 + 寫入 RPC + 代堂老師可讀該列。
-- 老師不可整表 UPDATE trial_sessions；只經 SECURITY DEFINER RPC 改評語欄。

alter table public.trial_sessions
  add column if not exists teacher_comment text,
  add column if not exists teacher_comment_at timestamptz,
  add column if not exists teacher_comment_by uuid references public.teachers (id),
  add column if not exists teacher_comment_edited_at timestamptz,
  add column if not exists teacher_comment_edited_by uuid references public.teachers (id);

alter table public.trial_sessions
  drop constraint if exists trial_sessions_teacher_comment_len_chk;

alter table public.trial_sessions
  add constraint trial_sessions_teacher_comment_len_chk
  check (
    teacher_comment is null
    or (
      char_length(btrim(teacher_comment)) > 0
      and char_length(teacher_comment) <= 80
    )
  );

comment on column public.trial_sessions.teacher_comment is
  '試堂評語最新全文；未寫為 NULL。前台回訪家長用，不是教學紀錄或結果備註。';
comment on column public.trial_sessions.teacher_comment_at is
  '評語首次寫入時間；其後不變。';
comment on column public.trial_sessions.teacher_comment_by is
  '評語首次寫入人（teachers.id）；其後不變。';
comment on column public.trial_sessions.teacher_comment_edited_at is
  '首次之後若有修改，最後編輯時間；否則 NULL。';
comment on column public.trial_sessions.teacher_comment_edited_by is
  '最後編輯人（teachers.id）；否則 NULL。';

create or replace function public.save_trial_teacher_comment(
  p_trial_id uuid,
  p_comment text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_comment text := btrim(coalesce(p_comment, ''));
  v_teacher_id uuid := public.current_teacher_id();
  v_is_enroll boolean := private.has_capability('students.enroll');
  v_schedule_teacher uuid;
  v_row public.trial_sessions%rowtype;
  v_now timestamptz := clock_timestamp();
begin
  if p_trial_id is null then
    raise exception '缺少試堂編號';
  end if;
  if char_length(v_comment) = 0 then
    raise exception '評語不可空白';
  end if;
  if char_length(v_comment) > 80 then
    raise exception '評語不可超過 80 字';
  end if;
  if v_teacher_id is null then
    raise exception '此帳戶未綁定老師資料，無法寫入評語';
  end if;

  select * into v_row
  from public.trial_sessions
  where id = p_trial_id
  for update;

  if not found then
    raise exception '找不到該筆試堂';
  end if;

  select s.teacher_id into v_schedule_teacher
  from public.schedules s
  where s.id = v_row.schedule_id;

  if not v_is_enroll then
    if v_schedule_teacher is distinct from v_teacher_id then
      raise exception '只有該堂實際授課老師可以撰寫評語';
    end if;
    if v_row.teacher_comment_by is not null
       and v_row.teacher_comment_by is distinct from v_teacher_id then
      raise exception '不可改寫其他老師的評語';
    end if;
  end if;

  if v_row.teacher_comment_at is null then
    update public.trial_sessions
    set
      teacher_comment = v_comment,
      teacher_comment_at = v_now,
      teacher_comment_by = v_teacher_id,
      teacher_comment_edited_at = null,
      teacher_comment_edited_by = null,
      updated_at = v_now
    where id = p_trial_id;
  else
    update public.trial_sessions
    set
      teacher_comment = v_comment,
      teacher_comment_edited_at = v_now,
      teacher_comment_edited_by = v_teacher_id,
      updated_at = v_now
    where id = p_trial_id;
  end if;

  insert into public.mgmt_audit_log (actor_label, role, action, path, detail)
  values (
    coalesce(private.stamp_actor_label(), '系統'),
    coalesce(public.current_app_role(), 'unknown'),
    'trial_teacher_comment_saved',
    '/TrialSessions',
    jsonb_build_object(
      'trial_id', v_row.id,
      'student_id', v_row.student_id,
      'class_id', v_row.class_id,
      'schedule_id', v_row.schedule_id,
      'old_comment', v_row.teacher_comment,
      'new_comment', v_comment
    )::text
  );
end;
$$;

comment on function public.save_trial_teacher_comment(uuid, text) is
  '寫入試堂評語五欄。該堂 schedules.teacher_id 或有 students.enroll 的職員可寫；老師不可改別人的評語。';

revoke all on function public.save_trial_teacher_comment(uuid, text) from public, anon;
grant execute on function public.save_trial_teacher_comment(uuid, text) to authenticated;

drop policy if exists rls_phase_b_teacher_select_trial_sessions on public.trial_sessions;
create policy rls_phase_b_teacher_select_trial_sessions
on public.trial_sessions
for select
to authenticated
using (
  public.is_teacher_role()
  and (
    public.teacher_can_access_class(class_id)
    or public.teacher_can_access_schedule(schedule_id)
  )
);

notify pgrst, 'reload schema';
