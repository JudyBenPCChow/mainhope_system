-- 功課輔導班公開頁：可選試堂日子最多未來 30 日。
-- 若當值編更尚未寫出佔室排程，目錄載入時補齊開放日（平日、非功輔放假、非校舍假期）。

begin;

create or replace function public.ad_homework_ensure_schedules_within_window()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_class_id uuid;
  v_room_id uuid;
  v_day date;
  v_end date := (timezone('Asia/Hong_Kong', now()))::date + 30;
  v_today date := (timezone('Asia/Hong_Kong', now()))::date;
begin
  perform pg_advisory_xact_lock(hashtext('ad_homework_ensure_schedules_within_window'));

  select id into v_room_id
  from public.classrooms
  where name = '17D'
  limit 1;

  for v_class_id in
    select c.id
    from public.classes c
    where public.ad_homework_catalog_allows_class(c.id)
  loop
    v_day := v_today;
    while v_day <= v_end loop
      if extract(isodow from v_day) between 1 and 5
        and not exists (
          select 1
          from public.homework_tutoring_calendar_closures hc
          where hc.closure_date = v_day
        )
        and not exists (
          select 1
          from public.academic_calendar_closures ac
          join public.classes c2 on c2.id = v_class_id
          where ac.academic_year_id = c2.academic_year_id
            and ac.closure_date = v_day
        )
        and not exists (
          select 1
          from public.schedules s
          where s.class_id = v_class_id
            and s.scheduled_date = v_day
            and coalesce(s.status, '') not ilike '%取消%'
        )
      then
        insert into public.schedules (
          class_id,
          teacher_id,
          classroom_id,
          scheduled_date,
          start_time,
          end_time,
          status,
          remarks,
          ad_trial_excluded
        ) values (
          v_class_id,
          null,
          v_room_id,
          v_day,
          time '15:15',
          time '19:30',
          '正常',
          '功輔佔室',
          false
        );
      end if;
      v_day := v_day + 1;
    end loop;
  end loop;
end;
$$;

comment on function public.ad_homework_ensure_schedules_within_window() is
  '功課輔導班公開頁：補齊未來 30 日內尚無佔室列的開放日（平日、非放假）。';

revoke all on function public.ad_homework_ensure_schedules_within_window() from public, anon, authenticated;

create or replace function public.ad_homework_catalog_get()
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_classes jsonb := '[]'::jsonb;
  v_today date := (timezone('Asia/Hong_Kong', now()))::date;
  v_end date := v_today + 30;
begin
  perform public.ad_public_assert_rate_limit('catalog');
  perform public.ad_homework_ensure_schedules_within_window();

  select coalesce(jsonb_agg(cls_row order by cls_row->>'course_name'), '[]'::jsonb)
  into v_classes
  from (
    select jsonb_build_object(
      'id', c.id,
      'class_kind', c.class_kind,
      'subject', coalesce(c.subject, ''),
      'subject_code', coalesce(subj.code, ''),
      'subject_category', coalesce(subj.category, 'other'),
      'course_code_full', coalesce(c.course_code_full, ''),
      'course_name', coalesce(co.course_name, c.subject, ''),
      'teacher_name', coalesce(nullif(btrim(t.full_name), ''), t.abbr, ''),
      'day_of_week', coalesce(c.day_of_week, ''),
      'time_slot', coalesce(c.time_slot, ''),
      'schedules', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', s2.id,
            'scheduled_date', s2.scheduled_date,
            'start_time', s2.start_time::text,
            'end_time', s2.end_time::text,
            'session_number', s2.session_number
          )
          order by s2.scheduled_date, s2.start_time, s2.session_number nulls last
        )
        from (
          select s1.*
          from public.schedules s1
          where s1.class_id = c.id
            and public.ad_trial_schedule_open(s1.id)
            and s1.scheduled_date <= v_end
          order by s1.scheduled_date, s1.start_time, s1.session_number nulls last
          limit 40
        ) s2
      ), '[]'::jsonb)
    ) as cls_row
    from public.classes c
    left join public.courses co on co.id = c.course_id
    left join public.subjects subj on subj.id = co.subject_id
    left join public.teachers t on t.id = c.teacher_id
    where public.ad_homework_catalog_allows_class(c.id)
      and exists (
        select 1
        from public.schedules sx
        where sx.class_id = c.id
          and public.ad_trial_schedule_open(sx.id)
          and sx.scheduled_date <= v_end
      )
  ) q;

  return jsonb_build_object('classes', coalesce(v_classes, '[]'::jsonb));
end;
$$;

comment on function public.ad_homework_catalog_get() is
  '功課輔導班公開頁目錄：不按年級、不按就讀人數過濾。只列未來最多 30 日、未取消、未剔除的堂次。';

revoke all on function public.ad_homework_catalog_get() from public;
grant execute on function public.ad_homework_catalog_get() to anon, authenticated, service_role;

create or replace function public.ad_homework_attach_date(
  p_lead_id uuid,
  p_class_id uuid,
  p_schedule_id uuid,
  p_company text default null,
  p_rate_client_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kind text;
  v_label text;
  v_date date;
  v_start time;
  v_end time;
  v_rate_key text := nullif(btrim(coalesce(p_rate_client_key, '')), '');
  v_today date := (timezone('Asia/Hong_Kong', now()))::date;
begin
  perform public.ad_public_assert_rate_limit('submit', v_rate_key);

  if nullif(btrim(coalesce(p_company, '')), '') is not null then
    return jsonb_build_object('accepted', true);
  end if;

  if p_lead_id is null or p_class_id is null or p_schedule_id is null then
    raise exception '請選擇一個試堂日子';
  end if;

  if not exists (
    select 1
    from public.leads l
    where l.id = p_lead_id
      and l.source = 'ad_trial'
      and l.interested_subjects = array['功課輔導']::text[]
      and l.created_at > now() - interval '6 hours'
      and l.status in ('new', 'contacted')
  ) then
    raise exception '找不到剛提交的資料，請重新填寫';
  end if;

  if not public.ad_homework_catalog_allows_class(p_class_id) then
    raise exception '所選功課輔導班目前未開放';
  end if;
  if not public.ad_trial_schedule_open(p_schedule_id) then
    raise exception '所選堂次無效、已取消或未開放';
  end if;
  if not exists (
    select 1 from public.schedules sch
    where sch.id = p_schedule_id
      and sch.class_id = p_class_id
      and sch.scheduled_date <= v_today + 30
  ) then
    raise exception '所選日子超出可預約範圍（最多未來 30 日）';
  end if;

  select c.class_kind into v_kind
  from public.classes c
  where c.id = p_class_id;

  if v_kind is distinct from 'homework' then
    raise exception '只可選擇功課輔導班';
  end if;

  select
    coalesce(nullif(btrim(co.course_name), ''), nullif(btrim(c.subject), ''), nullif(btrim(c.course_code_full), ''), '功課輔導班'),
    sch.scheduled_date, sch.start_time, sch.end_time
  into v_label, v_date, v_start, v_end
  from public.schedules sch
  join public.classes c on c.id = sch.class_id
  left join public.courses co on co.id = c.course_id
  where sch.id = p_schedule_id;

  delete from public.lead_trial_intentions
  where lead_id = p_lead_id;

  insert into public.lead_trial_intentions (
    lead_id, class_id, schedule_id, class_label, scheduled_date, start_time, end_time
  ) values (
    p_lead_id, p_class_id, p_schedule_id, v_label, v_date, v_start, v_end
  );

  perform public.ad_public_mark_submit_accepted(v_rate_key);
  return jsonb_build_object('accepted', true);
end;
$$;

comment on function public.ad_homework_attach_date(uuid, uuid, uuid, text, text) is
  '功課輔導班公開頁第二頁：把一個試堂日子補到剛提交的潛在客戶。只接受未來最多 30 日。';

revoke all on function public.ad_homework_attach_date(uuid, uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.ad_homework_attach_date(uuid, uuid, uuid, text, text) to service_role;

notify pgrst, 'reload schema';

commit;
