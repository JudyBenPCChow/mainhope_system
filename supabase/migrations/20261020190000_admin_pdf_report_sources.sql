-- 試堂名單與追收學費的查數。Edge Function 不能任意下 SQL，改由這支函式一次交出原始列。
-- 分類與金額仍跟 scripts/export_2627_*.py，不在這裡重算。

create or replace function public.admin_pdf_report_sources()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'trials', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.trial_date, t.start_time, t.student_name)
      from (
        select
          ts.trial_date::text as trial_date,
          coalesce(ts.trial_type, '') as trial_type,
          coalesce(ts.status, '') as status,
          coalesce(ts.outcome, 'open') as outcome,
          ts.outcome_reason,
          ts.outcome_note,
          s.full_name as student_name,
          s.grade as student_grade,
          s.parent_phone_country_code,
          s.parent_phone,
          s.whatsapp,
          s.student_phone,
          c.subject,
          c.course_code_full,
          co.course_name,
          coalesce(t.english_name, t.full_name, '') as teacher_name,
          sch.start_time::text as start_time,
          sch.end_time::text as end_time,
          pay.status as payment_status,
          exists (
            select 1
            from student_class_enrollments e
            where e.student_id = ts.student_id
              and e.class_id = ts.class_id
              and e.status = '就讀中'
          ) as enrolled_active,
          (
            select ad.status
            from attendance_details ad
            where ad.student_id = ts.student_id
              and ad.schedule_id = ts.schedule_id
            limit 1
          ) as attendance_status
        from trial_sessions ts
        join students s on s.id = ts.student_id
        join classes c on c.id = ts.class_id
        join academic_years y on y.id = c.academic_year_id
        left join courses co on co.id = c.course_id
        left join schedules sch on sch.id = ts.schedule_id
        left join teachers t on t.id = coalesce(sch.teacher_id, c.teacher_id)
        left join payments pay on pay.id = ts.payment_id
        where y.label = '2627'
          and coalesce(ts.outcome, 'open') <> 'converted'
          and coalesce(s.full_name, '') not ilike '%test%'
          and coalesce(c.course_code_full, '') not ilike '%test%'
          and coalesce(c.subject, '') not ilike '%test%'
      ) t
    ), '[]'::jsonb),
    'enrollments', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.full_name, t.subject)
      from (
        select
          e.student_id::text as student_id,
          s.student_code,
          s.full_name,
          s.english_name,
          s.grade as student_grade,
          e.class_id::text as class_id,
          c.subject,
          c.class_kind,
          c.course_code_full,
          to_jsonb(c.grade) as class_grade,
          c.lesson_slots_per_session,
          c.price_per_lesson as class_price,
          c.academic_year_id::text as academic_year_id,
          co.course_name,
          co.grade_code,
          to_jsonb(co.eligible_grade_codes) as eligible_grade_codes,
          co.price_per_lesson as course_price,
          co.price_per_lesson_period_2,
          co.price_per_lesson_both_periods
        from student_class_enrollments e
        join students s on s.id = e.student_id
        join classes c on c.id = e.class_id
        join academic_years y on y.id = c.academic_year_id
        left join courses co on co.id = c.course_id
        where e.status = '就讀中'
          and y.label = '2627'
          and coalesce(c.class_kind, '') <> 'homework'
      ) t
    ), '[]'::jsonb),
    'pools', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.student_id, t.namespace_key)
      from (
        select
          p.id::text as pool_id,
          p.student_id::text as student_id,
          p.academic_year_id::text as academic_year_id,
          p.course_group,
          p.namespace_key,
          p.class_id::text as class_id,
          p.remaining_lessons,
          p.initial_lessons
        from student_entitlement_pools p
        join academic_years y on y.id = p.academic_year_id
        where y.label = '2627'
          and coalesce(p.course_group, '') not in ('homework', 'trial')
      ) t
    ), '[]'::jsonb),
    'decls', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.student_id, t.scheduled_date, t.start_time)
      from (
        with p2 as (
          select unnest(array[
            '2026-09-29','2026-09-30','2026-10-02','2026-10-04','2026-10-05','2026-10-06','2026-10-07',
            '2026-10-08','2026-10-09','2026-10-10','2026-10-11','2026-10-12','2026-10-13','2026-10-14',
            '2026-10-15','2026-10-16','2026-10-17','2026-10-19','2026-10-20','2026-10-21','2026-10-22',
            '2026-10-23','2026-10-24','2026-10-25','2026-10-26','2026-10-29','2026-10-31','2026-11-01'
          ]::date[]) as d
        )
        select
          ad.student_id::text as student_id,
          ad.schedule_id::text as schedule_id,
          ad.pool_id::text as pool_id,
          ad.source_event_type,
          sch.class_id::text as class_id,
          sch.scheduled_date::text as scheduled_date,
          sch.start_time::text as start_time,
          sch.end_time::text as end_time,
          c.subject,
          c.lesson_slots_per_session,
          c.price_per_lesson as class_price,
          co.price_per_lesson as course_price,
          co.price_per_lesson_period_2,
          att.status as attendance_status
        from attendance_declarations ad
        join schedules sch on sch.id = ad.schedule_id
        join p2 on p2.d = sch.scheduled_date
        join classes c on c.id = sch.class_id
        left join courses co on co.id = c.course_id
        left join lateral (
          select ad2.status
          from attendance_details ad2
          where ad2.student_id = ad.student_id
            and ad2.schedule_id = ad.schedule_id
          order by case when ad2.status in (
            '現場','錄影回放','zoom實時網課','no show','請假而不需補回',
            '即時直播','不用補回','出席','網課','補課','線上'
          ) then 0 else 1 end
          limit 1
        ) att on true
        where ad.status = 'active'
          and sch.status not like '%取消%'
      ) t
    ), '[]'::jsonb),
    'payments', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.student_id, t.payment_date)
      from (
        select
          p.student_id::text as student_id,
          p.payment_date::text as payment_date,
          pd.class_id::text as class_id,
          pd.lesson_count,
          pd.amount,
          pd.description,
          c.academic_year_id::text as academic_year_id
        from payment_details pd
        join payments p on p.id = pd.payment_id
        left join classes c on c.id = pd.class_id
        where p.voided_at is null
          and p.status = '已收款'
          and p.student_id in (
            select e.student_id
            from student_class_enrollments e
            join classes c2 on c2.id = e.class_id
            join academic_years y on y.id = c2.academic_year_id
            where e.status = '就讀中' and y.label = '2627'
          )
      ) t
    ), '[]'::jsonb),
    'homework', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.full_name, t.payment_date nulls last)
      from (
        with hw_students as (
          select
            e.student_id,
            e.class_id,
            s.student_code,
            s.full_name,
            s.grade,
            e.homework_day_plan,
            c.course_code_full
          from student_class_enrollments e
          join students s on s.id = e.student_id
          join classes c on c.id = e.class_id
          join academic_years y on y.id = c.academic_year_id
          where y.label = '2627'
            and c.class_kind = 'homework'
            and e.status = '就讀中'
        ),
        pays as (
          select
            p.student_id,
            pd.class_id,
            pd.coverage_start_month::text as coverage_start_month,
            pd.lesson_count,
            pd.amount,
            pd.description,
            p.receipt_number,
            p.payment_date::text as payment_date
          from payment_details pd
          join payments p on p.id = pd.payment_id
          join classes c on c.id = pd.class_id
          where c.class_kind = 'homework'
            and p.status = '已收款'
            and p.voided_at is null
        )
        select
          hs.student_id::text as student_id,
          hs.student_code,
          hs.full_name,
          hs.grade,
          hs.homework_day_plan,
          hs.course_code_full,
          hs.class_id::text as class_id,
          py.coverage_start_month,
          py.lesson_count,
          py.amount,
          py.receipt_number,
          py.payment_date,
          py.description
        from hw_students hs
        left join pays py on py.student_id = hs.student_id and py.class_id = hs.class_id
      ) t
    ), '[]'::jsonb)
  );
$$;

comment on function public.admin_pdf_report_sources() is
  '試堂跟進與追收學費的原始列（2627）。只供排程函式使用；名單分類在 Edge Function。';

revoke all on function public.admin_pdf_report_sources() from public, anon, authenticated;
grant execute on function public.admin_pdf_report_sources() to service_role;

notify pgrst, 'reload schema';
