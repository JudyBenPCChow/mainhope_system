/**
 * 從 production 即時計算某月工資單 PDF（不寫 payroll_runs）。
 * 用法：node scripts/export_payroll_month_payslips.mjs 2026-10
 */
import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import { mkdir, mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { createServer } from "vite"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const monthKey = process.argv[2] ?? "2026-10"
if (!/^\d{4}-\d{2}$/.test(monthKey)) {
  console.error("月份須為 YYYY-MM")
  process.exit(1)
}

const [year, month] = monthKey.split("-").map(Number)
const from = `${monthKey}-01`
const to = `${monthKey}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`
const prev = new Date(year, month - 2, 1)
const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`

function sqlDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("bad date")
  return value
}

const fromSql = sqlDate(from)
const toSql = sqlDate(to)

function supabaseBin() {
  const home = process.env.HOME ?? ""
  const candidates = [join(home, ".local/bin/supabase"), "/tmp/supabase-cli/supabase"]
  return candidates.find((path) => existsSync(path)) ?? "supabase"
}

function query(sql) {
  return new Promise((resolve, reject) => {
    mkdtemp(join(tmpdir(), "payroll-sql-"))
      .then(async (dir) => {
        const file = join(dir, "q.sql")
        await writeFile(file, sql)
        execFile(
          supabaseBin(),
          ["db", "query", "--linked", "-o", "json", "-f", file],
          { cwd: root, maxBuffer: 80 * 1024 * 1024, timeout: 300000 },
          (error, stdout, stderr) => {
            if (error) {
              const detail = `${stderr || ""}\n${stdout || ""}\n${error.message}`
              reject(new Error(detail.slice(-3000)))
              return
            }
            const start = stdout.indexOf("{")
            if (start < 0) {
              reject(new Error(`查詢沒有 JSON：${stdout.slice(0, 400)}`))
              return
            }
            const parsed = JSON.parse(stdout.slice(start))
            const row = parsed.rows?.[0]
            const payload = row?.payload
            resolve(typeof payload === "string" ? JSON.parse(payload) : payload)
          }
        )
      })
      .catch(reject)
  })
}

const metaSql = `
select jsonb_build_object(
  'runStatus', (select status from public.payroll_runs where month_key = '${monthKey}' limit 1),
  'calcVersion', (select calc_version from public.payroll_runs where month_key = '${monthKey}' limit 1),
  'teachers', coalesce((
    select jsonb_agg(jsonb_build_object('id', id, 'full_name', full_name, 'status', status))
    from public.teachers
  ), '[]'::jsonb),
  'rates', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', id, 'teacher_id', teacher_id, 'mode', mode,
      'effective_from', effective_from, 'effective_to', effective_to,
      'config', config, 'notes', notes
    ))
    from public.payroll_rates
  ), '[]'::jsonb),
  'manualHours', coalesce((
    select jsonb_agg(jsonb_build_object('teacher_id', teacher_id, 'hours', hours, 'status', status, 'note', note))
    from public.payroll_manual_hours where month_key = '${monthKey}'
  ), '[]'::jsonb),
  'homeworkRates', coalesce((
    select jsonb_agg(jsonb_build_object(
      'teacher_id', teacher_id, 'hourly_rate', hourly_rate,
      'effective_from', effective_from, 'effective_to', effective_to
    ))
    from public.payroll_homework_rates
  ), '[]'::jsonb),
  'homeworkOverrides', coalesce((
    select jsonb_agg(jsonb_build_object('teacher_id', teacher_id, 'hours', hours))
    from public.payroll_homework_hour_overrides where month_key = '${monthKey}'
  ), '[]'::jsonb),
  'homeworkRosters', coalesce((
    select jsonb_agg(jsonb_build_object('id', id, 'academic_year_id', academic_year_id, 'status', status, 'roster_month', roster_month))
    from public.homework_tutoring_roster_months
    where roster_month = date '${fromSql}'
  ), '[]'::jsonb),
  'homeworkDays', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', d.id, 'roster_month_id', d.roster_month_id, 'duty_date', d.duty_date,
      'session_start', d.session_start, 'session_end', d.session_end,
      'holiday_label', d.holiday_label,
      'primary_teacher_id', d.primary_teacher_id, 'secondary_teacher_id', d.secondary_teacher_id
    ))
    from public.homework_tutoring_duty_days d
    join public.homework_tutoring_roster_months m on m.id = d.roster_month_id
    where m.roster_month = date '${fromSql}'
  ), '[]'::jsonb),
  'homeworkAssignments', coalesce((
    select jsonb_agg(jsonb_build_object(
      'duty_day_id', a.duty_day_id, 'teacher_id', a.teacher_id,
      'session_start', a.session_start, 'session_end', a.session_end
    ))
    from public.homework_tutoring_duty_assignments a
    join public.homework_tutoring_duty_days d on d.id = a.duty_day_id
    join public.homework_tutoring_roster_months m on m.id = d.roster_month_id
    where m.roster_month = date '${fromSql}'
  ), '[]'::jsonb),
  'homeworkClosures', coalesce((
    select jsonb_agg(jsonb_build_object('academic_year_id', academic_year_id, 'closure_date', closure_date))
    from public.homework_tutoring_calendar_closures
    where closure_date between date '${fromSql}' and date '${toSql}'
  ), '[]'::jsonb),
  'homeworkClasses', coalesce((
    select jsonb_agg(jsonb_build_object('id', id))
    from public.classes
    where class_kind = 'homework' and status = '進行中'
  ), '[]'::jsonb),
  'homeworkCharges', coalesce((
    select jsonb_agg(jsonb_build_object('class_id', c.class_id, 'student_id', c.student_id, 'amount_hkd', c.amount_hkd))
    from public.homework_tutoring_monthly_charges c
    join public.classes cls on cls.id = c.class_id
    where cls.class_kind = 'homework' and cls.status = '進行中'
      and c.billing_month = date '${fromSql}'
      and c.status is distinct from '作廢'
  ), '[]'::jsonb),
  'homeworkEnrollments', coalesce((
    select jsonb_agg(jsonb_build_object(
      'class_id', e.class_id, 'student_id', e.student_id, 'enroll_date', e.enroll_date,
      'homework_day_plan', e.homework_day_plan, 'grade', st.grade
    ))
    from public.student_class_enrollments e
    join public.classes cls on cls.id = e.class_id
    join public.students st on st.id = e.student_id
    where cls.class_kind = 'homework' and cls.status = '進行中'
      and e.status = '就讀中'
      and e.enroll_date <= date '${toSql}'
  ), '[]'::jsonb),
  'adjustments', coalesce((
    select jsonb_agg(jsonb_build_object(
      'teacher_id', a.teacher_id, 'from_amount', a.from_amount, 'to_amount', a.to_amount,
      'reason', a.reason, 'status', a.status, 'created_at', a.created_at
    ))
    from public.payroll_adjustments a
    join public.payroll_runs r on r.id = a.run_id
    where r.month_key = '${monthKey}'
  ), '[]'::jsonb),
  'teacherStates', coalesce((
    select jsonb_agg(jsonb_build_object(
      'teacher_id', s.teacher_id, 'excluded', s.excluded, 'exclude_reason', s.exclude_reason
    ))
    from public.payroll_teacher_states s
    join public.payroll_runs r on r.id = s.run_id
    where r.month_key = '${monthKey}'
  ), '[]'::jsonb),
  'previousGross', coalesce((
    select jsonb_agg(jsonb_build_object('id', t->>'id', 'gross', t->'gross'))
    from public.payroll_runs r
    cross join lateral jsonb_array_elements(coalesce(r.snapshot->'teachers', '[]'::jsonb)) t
    where r.month_key = '${prevKey}'
  ), '[]'::jsonb)
) as payload
`

const lessonSql = `
select jsonb_build_object(
  'schedules', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', s.id,
      'class_id', s.class_id,
      'scheduled_date', s.scheduled_date,
      'start_time', left(s.start_time::text, 5),
      'end_time', left(s.end_time::text, 5),
      'status', s.status,
      'teacher_id', s.teacher_id,
      'teacher_name', t.full_name,
      'original_teacher_id', s.original_teacher_id,
      'original_teacher_name', ot.full_name,
      'class_owner_teacher_id', c.teacher_id,
      'subject', c.subject,
      'class_kind', c.class_kind,
      'grade', c.grade,
      'course_code_full', c.course_code_full,
      'course_name', co.course_name,
      'grade_code', co.grade_code,
      'subject_code', sub.code,
      'class_price', c.price_per_lesson,
      'price_per_lesson', co.price_per_lesson,
      'price_per_lesson_period_2', co.price_per_lesson_period_2,
      'price_per_lesson_both_periods', co.price_per_lesson_both_periods
    ))
    from public.schedules s
    left join public.teachers t on t.id = s.teacher_id
    left join public.teachers ot on ot.id = s.original_teacher_id
    left join public.classes c on c.id = s.class_id
    left join public.courses co on co.id = c.course_id
    left join public.subjects sub on sub.id = co.subject_id
    where s.scheduled_date between date '${fromSql}' and date '${toSql}'
  ), '[]'::jsonb),
  'attendance', coalesce((
    select jsonb_agg(jsonb_build_object(
      'student_id', a.student_id,
      'student_name', coalesce(nullif(btrim(st.full_name), ''), nullif(btrim(st.english_name), ''), '—'),
      'schedule_id', a.schedule_id,
      'class_id', a.class_id,
      'status', a.status,
      'attendance_date', a.attendance_date
    ))
    from public.attendance_details a
    join public.students st on st.id = a.student_id
    where a.attendance_date between date '${fromSql}' and date '${toSql}'
  ), '[]'::jsonb),
  'enrollmentPeriods', coalesce((
    select jsonb_agg(jsonb_build_object(
      'student_id', e.student_id, 'class_id', e.class_id, 'enrollment_period', e.enrollment_period
    ))
    from (
      select distinct on (e.student_id, e.class_id)
        e.student_id, e.class_id, e.enrollment_period
      from public.student_class_enrollments e
      where (e.student_id, e.class_id) in (
        select a.student_id, a.class_id
        from public.attendance_details a
        where a.attendance_date between date '${fromSql}' and date '${toSql}'
      )
      order by e.student_id, e.class_id,
        case when e.status = '就讀中' then 0 else 1 end,
        e.created_at
    ) e
  ), '[]'::jsonb)
) as payload
`

const rosterSql = `
with v_ids as (
  select s.id
  from public.schedules s
  where s.scheduled_date between date '${fromSql}' and date '${toSql}'
),
requested_schedules as (
  select
    s.id, s.class_id, s.scheduled_date, s.session_number, s.remarks,
    c.academic_year_id, ay.label as academic_year_label, c.subject, c.class_kind,
    c.course_code_full, c.day_of_week, c.time_slot, c.lesson_slots_per_session, co.course_name,
    case when co.course_mode = 'summer_two_period' then 'summer_two_period' else 'regular' end as course_mode
  from public.schedules s
  left join public.classes c on c.id = s.class_id
  left join public.courses co on co.id = c.course_id
  left join public.academic_years ay on ay.id = c.academic_year_id
  where s.id in (select id from v_ids)
),
requested_classes as (
  select distinct class_id from requested_schedules where class_id is not null
),
requested_years as (
  select distinct academic_year_id from requested_schedules where academic_year_id is not null
),
enrollment_rows as (
  select e.id, e.class_id, e.student_id, e.status, e.enroll_date, e.withdraw_effective_date,
    e.enrollment_period, e.created_at, st.full_name
  from public.student_class_enrollments e
  join requested_classes rc on rc.class_id = e.class_id
  join public.students st on st.id = e.student_id
  where e.status = '就讀中'
),
relevant_leaves as (
  select distinct l.id, l.student_id, l.class_id, l.schedule_id, l.leave_date, l.makeup_type,
    l.makeup_schedule_id, l.status, l.created_at, st.full_name
  from public.leave_makeup_records l
  join public.students st on st.id = l.student_id
  where l.schedule_id in (select id from v_ids)
     or l.makeup_schedule_id in (select id from v_ids)
     or exists (
       select 1 from requested_schedules rs
       where rs.class_id = l.class_id and rs.scheduled_date = l.leave_date
     )
)
select jsonb_build_object(
  'roster', jsonb_build_object(
    'schedules', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', rs.id, 'class_id', rs.class_id, 'scheduled_date', rs.scheduled_date,
        'session_number', rs.session_number, 'academic_year_id', rs.academic_year_id,
        'academic_year_label', rs.academic_year_label, 'subject', rs.subject,
        'class_kind', rs.class_kind, 'course_code_full', rs.course_code_full,
        'course_name', rs.course_name, 'day_of_week', rs.day_of_week, 'time_slot', rs.time_slot,
        'lesson_slots_per_session', rs.lesson_slots_per_session, 'course_mode', rs.course_mode
      ))
      from requested_schedules rs
    ), '[]'::jsonb),
    'periods', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'academic_year_id', p.academic_year_id, 'period_code', p.period_code,
        'label', p.label, 'start_date', p.start_date, 'end_date', p.end_date
      ))
      from public.academic_year_periods p
      join requested_years ry on ry.academic_year_id = p.academic_year_id
    ), '[]'::jsonb),
    'enrollments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', e.id, 'class_id', e.class_id, 'student_id', e.student_id, 'status', e.status,
        'enroll_date', e.enroll_date, 'withdraw_effective_date', e.withdraw_effective_date,
        'enrollment_period', e.enrollment_period, 'created_at', e.created_at, 'full_name', e.full_name
      ))
      from enrollment_rows e
    ), '[]'::jsonb),
    'enrollment_sessions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'enrollment_id', es.enrollment_id, 'schedule_id', es.schedule_id, 'session_number', s.session_number
      ))
      from public.student_enrollment_sessions es
      join enrollment_rows e on e.id = es.enrollment_id
      join public.schedules s on s.id = es.schedule_id
    ), '[]'::jsonb),
    'trials', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'schedule_id', t.schedule_id, 'class_id', t.class_id, 'student_id', t.student_id,
        'status', t.status, 'payment_id', t.payment_id, 'counts_toward_headcount', t.counts_toward_headcount,
        'full_name', st.full_name
      ))
      from public.trial_sessions t
      join public.students st on st.id = t.student_id
      join public.payments pay on pay.id = t.payment_id
      where t.schedule_id in (select id from v_ids)
        and t.payment_id is not null
        and pay.status = '已收款'
    ), '[]'::jsonb),
    'leaves', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', l.id, 'student_id', l.student_id, 'class_id', l.class_id, 'schedule_id', l.schedule_id,
        'leave_date', l.leave_date, 'makeup_type', l.makeup_type, 'makeup_schedule_id', l.makeup_schedule_id,
        'status', l.status, 'created_at', l.created_at, 'full_name', l.full_name
      ))
      from relevant_leaves l
    ), '[]'::jsonb),
    'attendance', '[]'::jsonb
  ),
  'declarations', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', d.id, 'schedule_id', d.schedule_id, 'student_id', d.student_id, 'pool_id', d.pool_id,
      'status', d.status, 'superseded_by', d.superseded_by, 'source_event_type', d.source_event_type,
      'source_event_id', d.source_event_id, 'manual_reason', d.manual_reason, 'created_at', d.created_at
    ))
    from public.attendance_declarations d
    where d.status = 'active' and d.schedule_id in (select id from v_ids)
  ), '[]'::jsonb),
  'remarks', coalesce((
    select jsonb_agg(jsonb_build_object('id', id, 'remarks', remarks))
    from requested_schedules
    where remarks is not null and btrim(remarks) <> ''
  ), '[]'::jsonb),
  'originalDates', coalesce((
    select jsonb_agg(jsonb_build_object('id', s.id, 'scheduled_date', s.scheduled_date))
    from public.schedules s
    where s.id in (
      select distinct substring(rs.remarks from 'makeup_of=([0-9a-fA-F-]{36})')::uuid
      from requested_schedules rs
      where rs.remarks ~ 'makeup_of=[0-9a-fA-F-]{36}'
    )
  ), '[]'::jsonb)
) as payload
`

console.log(`讀取 ${monthKey} production（${from} 至 ${to}）…`)
async function timed(label, sql) {
  const started = Date.now()
  console.log(`查詢 ${label}…`)
  const payload = await query(sql)
  console.log(`${label} 完成（${Math.round((Date.now() - started) / 1000)} 秒）`)
  return payload
}
const meta = await timed("同事與費率", metaSql)
const lessons = await timed("排程與點名", lessonSql)
const roster = await timed("點名冊", rosterSql)
const dump = {
  monthKey,
  generatedAt: new Date().toISOString(),
  ...meta,
  ...lessons,
  ...roster,
}
console.log(
  `排程 ${dump.schedules?.length ?? 0}、點名 ${dump.attendance?.length ?? 0}、宣告 ${dump.declarations?.length ?? 0}`
)

console.log("計算中…")
const server = await createServer({
  configFile: join(root, "vite.config.ts"),
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
})
try {
  const mod = await server.ssrLoadModule("/scripts/payroll_month_payslip_compute.ts")
  const pack = mod.buildPayslipPack(dump)
  const outDir = join(root, "docs", "generated", "payroll", monthKey)
  await mkdir(outDir, { recursive: true })
  const jsonPath = join(outDir, `${monthKey}_工資單.json`)
  await writeFile(jsonPath, JSON.stringify(pack))
  console.log(`人數 ${pack.teachers.length}，總薪酬 ${pack.totals.gross}，實收 ${pack.totals.net}`)
  for (const teacher of pack.teachers) {
    const flag = teacher.hardBlock ? "　須先處理" : ""
    console.log(`- ${teacher.name}　${teacher.mode}　總薪酬 ${teacher.gross}　實收 ${teacher.net}${flag}`)
  }
  if (pack.excluded.length > 0) {
    console.log(`已排除 ${pack.excluded.length} 人，不納入工資單`)
  }
  if (process.argv.includes("--json-only")) {
    console.log(jsonPath)
  } else {
  const extra = process.argv.slice(3).filter((arg) => arg !== "--json-only")
  await new Promise((resolve, reject) => {
    execFile(
      "node",
      ["scripts/render_payroll_payslip_pdfs.mjs", jsonPath, ...extra],
      { cwd: root },
      (error, stdout, stderr) => {
        if (stdout) process.stdout.write(stdout)
        if (error) reject(new Error(stderr || error.message))
        else resolve()
      }
    )
  })
  }
} finally {
  await server.close()
}
