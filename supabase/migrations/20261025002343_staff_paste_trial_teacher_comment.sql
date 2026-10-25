-- 行政／管理層／外星人代貼試堂評語。
-- current_teacher_id() 只在現用角色為老師時有值。有 students.enroll 的職員
-- （行政、管理層、外星人；財務沒有此能力）即使沒有老師編號也可寫。
-- 職員代貼時 teacher_comment_by／edited_by 留空；畫面署名「職員代貼」。

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
  if v_teacher_id is null and not v_is_enroll then
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
      'new_comment', v_comment,
      'staff_paste', v_teacher_id is null
    )::text
  );
end;
$$;

comment on function public.save_trial_teacher_comment(uuid, text) is
  '寫入試堂評語五欄。該堂實際授課老師可寫自己的評語。有 students.enroll 的職員（行政／管理層／外星人）可代貼，即使現用角色不是老師、帳戶未綁老師。';

revoke all on function public.save_trial_teacher_comment(uuid, text) from public, anon;
grant execute on function public.save_trial_teacher_comment(uuid, text) to authenticated;

notify pgrst, 'reload schema';
