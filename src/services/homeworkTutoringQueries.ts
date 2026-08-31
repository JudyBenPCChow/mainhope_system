import { supabase } from "@/lib/supabaseClient"
import {
  formatYearMonthLabel,
  homeworkMonthlyFeeHkd,
  homeworkPaymentCoversMonth,
  isHomeworkMonthlyFeeDescription,
  monthFirstDay,
  type HomeworkDayPlan,
  type HomeworkWeekday,
} from "@/lib/homeworkTutoringFees"
import {
  HOMEWORK_SCHEDULE_REMARKS,
  homeworkScheduleSlotsFromDutyDays,
  mdKeyToIso,
  monthDateRange,
} from "@/lib/homeworkTutoringSchedules"
import type { AvailEntry, HomeworkDutyAssignment } from "@/lib/homeworkTutoringUi"
import { fetchClassrooms } from "@/services/classroomQueries"
import { insertScheduleRow } from "@/services/scheduleWriteQueries"

export type HomeworkClassRef = {
  id: string
  subject: string
  academicYearId: string
  academicYearLabel: string
  classroomId: string | null
  classroomName: string | null
}

export type HomeworkEnrollmentRow = {
  enrollmentId: string
  studentId: string
  studentName: string
  studentCode: string
  grade: string
  plan: HomeworkDayPlan
  weekdays: HomeworkWeekday[]
  enrollDate: string
  status: "在籍" | "暫停" | "結束"
  effectiveMonth: string
}

export type HomeworkHoliday = {
  id: string
  date: string
  label: string
  notes: string | null
}

export type HomeworkFeeRow = {
  id: string
  studentId: string
  enrollmentId: string
  studentName: string
  studentCode: string
  grade: string
  plan: HomeworkDayPlan
  billingMonth: string
  amountHkd: number | null
  amountLabel: string
  status: "未收款" | "已收款" | "作廢"
  isQuarterRate: boolean
}

export type HomeworkAvailRow = {
  teacherId: string
  targetMonth: string
  status: "未交" | "草稿" | "已提交"
  entries: Record<string, AvailEntry>
}

export type HomeworkDutyDayRow = {
  id: string
  date: string
  weekday: string
  holiday?: string
  start: string
  end: string
  secondaryRoom: string | null
  primaryRoom: string | null
  secondaryTeacherId?: string
  primaryTeacherId?: string
  assignments: HomeworkDutyAssignment[]
}

export type HomeworkRosterMonth = {
  id: string
  yearMonth: string
  status: "未編更" | "已編更"
  days: HomeworkDutyDayRow[]
}

const WEEKDAY_CHARS = ["日", "一", "二", "三", "四", "五", "六"] as const

function mapEnrollStatus(raw: string): "在籍" | "暫停" | "結束" {
  if (raw === "就讀中") return "在籍"
  if (raw === "已退讀") return "結束"
  if (raw.includes("暫停")) return "暫停"
  return "在籍"
}

function asDayPlan(raw: unknown): HomeworkDayPlan {
  if (raw === "三日" || raw === "四日" || raw === "五日" || raw === "七日") return raw
  return "四日"
}

function asWeekdays(raw: unknown): HomeworkWeekday[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((d): d is HomeworkWeekday =>
    d === "一" || d === "二" || d === "三" || d === "四" || d === "五"
  )
}

function timeToHm(raw: string | null | undefined, fallback = "15:30"): string {
  const s = String(raw ?? "").slice(0, 5)
  return /^\d{2}:\d{2}$/.test(s) ? s : fallback
}

function mapAssignmentRows(raw: unknown): HomeworkDutyAssignment[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const r = item as Record<string, unknown>
      const teacherId = r.teacher_id != null ? String(r.teacher_id) : ""
      if (!teacherId) return null
      return {
        teacherId,
        start: timeToHm(r.session_start != null ? String(r.session_start) : null, "15:30"),
        end: timeToHm(r.session_end != null ? String(r.session_end) : null, "19:30"),
        room: String(r.room ?? "").trim() || "17D",
      } satisfies HomeworkDutyAssignment
    })
    .filter((a): a is HomeworkDutyAssignment => a != null)
}

function parseAvailEntries(raw: unknown): Record<string, AvailEntry> {
  if (!raw || typeof raw !== "object") return {}
  const out: Record<string, AvailEntry> = {}
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!val || typeof val !== "object") continue
    const v = val as Record<string, unknown>
    if (v.kind === "full") out[key] = { kind: "full" }
    else if (v.kind === "custom" && typeof v.start === "string" && typeof v.end === "string") {
      out[key] = { kind: "custom", start: v.start, end: v.end }
    }
  }
  return out
}

/** 取 2627（或指定學年）功輔班；無則 null */
export async function fetchHomeworkClass(
  academicYearLabel = "2627"
): Promise<HomeworkClassRef | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from("classes")
    .select(
      "id, subject, academic_year_id, academic_year_label, classroom_id, classrooms ( id, name )"
    )
    .eq("class_kind", "homework")
    .eq("academic_year_label", academicYearLabel)
    .eq("status", "進行中")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const row = data as Record<string, unknown>
  const room = row.classrooms as { id?: string; name?: string } | null
  return {
    id: String(row.id),
    subject: String(row.subject ?? "功課輔導"),
    academicYearId: String(row.academic_year_id),
    academicYearLabel: String(row.academic_year_label ?? academicYearLabel),
    classroomId: row.classroom_id != null ? String(row.classroom_id) : null,
    classroomName: room?.name ?? null,
  }
}

export async function fetchHomeworkEnrollments(
  classId: string
): Promise<HomeworkEnrollmentRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("student_class_enrollments")
    .select(
      "id, status, enroll_date, homework_day_plan, homework_weekdays, student_id, students ( id, full_name, student_code, grade )"
    )
    .eq("class_id", classId)
    .order("enroll_date", { ascending: false })
  if (error) throw error
  return (data ?? []).map((raw) => {
    const r = raw as Record<string, unknown>
    const st = r.students as Record<string, unknown> | null
    const enrollDate = String(r.enroll_date ?? "").slice(0, 10)
    return {
      enrollmentId: String(r.id),
      studentId: String(r.student_id),
      studentName: st?.full_name != null ? String(st.full_name) : "—",
      studentCode: st?.student_code != null ? String(st.student_code) : "—",
      grade: st?.grade != null ? String(st.grade) : "—",
      plan: asDayPlan(r.homework_day_plan),
      weekdays: asWeekdays(r.homework_weekdays),
      enrollDate,
      status: mapEnrollStatus(String(r.status ?? "")),
      effectiveMonth: enrollDate.slice(0, 7) || "—",
    }
  })
}

export async function fetchHomeworkClosures(
  academicYearId: string
): Promise<HomeworkHoliday[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("homework_tutoring_calendar_closures")
    .select("id, closure_date, name, notes")
    .eq("academic_year_id", academicYearId)
    .order("closure_date", { ascending: true })
  if (error) throw error
  return (data ?? []).map((raw) => {
    const r = raw as Record<string, unknown>
    return {
      id: String(r.id),
      date: String(r.closure_date ?? "").slice(0, 10),
      label: String(r.name ?? ""),
      notes: r.notes != null ? String(r.notes) : null,
    }
  })
}

/** 開頁寫入應收列。月費頁已改讀繳費紀錄，唔再呼叫；8 月暑期實收列保留勿改。 */
export async function ensureHomeworkMonthlyCharges(opts: {
  academicYearId: string
  classId: string
  billingMonth: string
  enrollments: HomeworkEnrollmentRow[]
}): Promise<HomeworkFeeRow[]> {
  if (!supabase) return []
  const billingMonth = monthFirstDay(opts.billingMonth)
  const active = opts.enrollments.filter((e) => e.status === "在籍")
  for (const e of active) {
    const amount = homeworkMonthlyFeeHkd(e.plan, e.grade, billingMonth)
    if (amount == null) continue
    const { error } = await supabase.from("homework_tutoring_monthly_charges").upsert(
      {
        academic_year_id: opts.academicYearId,
        class_id: opts.classId,
        enrollment_id: e.enrollmentId,
        student_id: e.studentId,
        billing_month: billingMonth,
        day_plan: e.plan,
        grade_label: e.grade,
        amount_hkd: amount,
        is_quarter_rate: billingMonth.endsWith("-12-01") || billingMonth.endsWith("-02-01"),
        status: "未收款",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "enrollment_id,billing_month", ignoreDuplicates: true }
    )
    if (error) throw error
  }
  return fetchHomeworkMonthlyCharges(opts.classId, billingMonth)
}

/** 該月功輔班已繳：繳費紀錄覆蓋該曆月（已收款、未作廢、明細掛本班）。唔改既有單據。 */
export async function fetchHomeworkPaidByStudentFromPayments(
  classId: string,
  billingMonth: string
): Promise<Map<string, { receiptNumber: string; paymentId: string }>> {
  const out = new Map<string, { receiptNumber: string; paymentId: string }>()
  if (!supabase) return out
  const ym = billingMonth.slice(0, 7)
  const { data, error } = await supabase
    .from("payment_details")
    .select(
      "payment_id, lesson_count, coverage_start_month, description, payments ( id, student_id, receipt_number, status, voided_at, payment_date )"
    )
    .eq("class_id", classId)
  if (error) throw error
  for (const raw of data ?? []) {
    const row = raw as Record<string, unknown>
    const pay = row.payments as Record<string, unknown> | null
    if (!pay) continue
    if (String(pay.status ?? "") !== "已收款") continue
    if (pay.voided_at != null) continue
    const studentId = pay.student_id != null ? String(pay.student_id) : ""
    if (!studentId || out.has(studentId)) continue
    const paymentDate = String(pay.payment_date ?? "").slice(0, 10)
    const coverageStart =
      row.coverage_start_month != null
        ? String(row.coverage_start_month).slice(0, 7)
        : isHomeworkMonthlyFeeDescription(
            row.description != null ? String(row.description) : null
          )
          ? paymentDate.slice(0, 7)
          : ""
    const monthCount = Number(row.lesson_count ?? 1)
    if (
      !homeworkPaymentCoversMonth({
        coverageStartMonth: coverageStart,
        monthCount: Number.isFinite(monthCount) && monthCount > 0 ? monthCount : 1,
        billingMonth: ym,
      })
    ) {
      continue
    }
    out.set(studentId, {
      receiptNumber: pay.receipt_number != null ? String(pay.receipt_number) : "",
      paymentId: String(pay.id ?? row.payment_id ?? ""),
    })
  }
  return out
}

export async function fetchHomeworkMonthlyCharges(
  classId: string,
  billingMonth: string
): Promise<HomeworkFeeRow[]> {
  if (!supabase) return []
  const month = monthFirstDay(billingMonth)
  const { data, error } = await supabase
    .from("homework_tutoring_monthly_charges")
    .select(
      "id, student_id, enrollment_id, billing_month, day_plan, grade_label, amount_hkd, status, is_quarter_rate, students ( full_name, student_code )"
    )
    .eq("class_id", classId)
    .eq("billing_month", month)
    .neq("status", "作廢")
    .order("created_at", { ascending: true })
  if (error) throw error
  return (data ?? []).map((raw) => {
    const r = raw as Record<string, unknown>
    const st = r.students as Record<string, unknown> | null
    const amount =
      r.amount_hkd != null && Number.isFinite(Number(r.amount_hkd)) ? Number(r.amount_hkd) : null
    const statusRaw = String(r.status ?? "未收款")
    const status: HomeworkFeeRow["status"] =
      statusRaw === "已收款" ? "已收款" : statusRaw === "作廢" ? "作廢" : "未收款"
    return {
      id: String(r.id),
      studentId: String(r.student_id),
      enrollmentId: String(r.enrollment_id),
      studentName: st?.full_name != null ? String(st.full_name) : "—",
      studentCode: st?.student_code != null ? String(st.student_code) : "—",
      grade: String(r.grade_label ?? "—"),
      plan: asDayPlan(r.day_plan),
      billingMonth: String(r.billing_month ?? "").slice(0, 7),
      amountHkd: amount,
      amountLabel: amount != null ? `$${amount.toLocaleString("en-HK")}` : "—",
      status,
      isQuarterRate: Boolean(r.is_quarter_rate),
    }
  })
}

export async function fetchHomeworkAvailabilityForMonth(
  targetMonth: string
): Promise<HomeworkAvailRow[]> {
  if (!supabase) return []
  const month = monthFirstDay(targetMonth)
  const { data, error } = await supabase
    .from("homework_tutoring_availability")
    .select("teacher_id, target_month, status, entries")
    .eq("target_month", month)
  if (error) throw error
  return (data ?? []).map((raw) => {
    const r = raw as Record<string, unknown>
    const statusRaw = String(r.status ?? "未交")
    const status: HomeworkAvailRow["status"] =
      statusRaw === "已提交" ? "已提交" : statusRaw === "草稿" ? "草稿" : "未交"
    return {
      teacherId: String(r.teacher_id),
      targetMonth: String(r.target_month ?? "").slice(0, 7),
      status,
      entries: parseAvailEntries(r.entries),
    }
  })
}

export async function upsertHomeworkAvailability(input: {
  teacherId: string
  targetMonth: string
  status: "草稿" | "已提交"
  entries: Record<string, AvailEntry>
}): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const month = monthFirstDay(input.targetMonth)
  const { error } = await supabase.from("homework_tutoring_availability").upsert(
    {
      teacher_id: input.teacherId,
      target_month: month,
      status: input.status,
      entries: input.entries,
      submitted_at: input.status === "已提交" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "teacher_id,target_month" }
  )
  if (error) throw error
}

export async function fetchHomeworkRosterMonth(opts: {
  classId: string
  academicYearId: string
  yearMonth: string
}): Promise<HomeworkRosterMonth> {
  if (!supabase) {
    return { id: "", yearMonth: opts.yearMonth, status: "未編更", days: [] }
  }
  const month = monthFirstDay(opts.yearMonth)
  const existing = await supabase
    .from("homework_tutoring_roster_months")
    .select("id, roster_month, status")
    .eq("class_id", opts.classId)
    .eq("roster_month", month)
    .maybeSingle()
  if (existing.error) throw existing.error
  let roster = existing.data
  if (!roster) {
    const inserted = await supabase
      .from("homework_tutoring_roster_months")
      .insert({
        academic_year_id: opts.academicYearId,
        class_id: opts.classId,
        roster_month: month,
        status: "未編更",
      })
      .select("id, roster_month, status")
      .single()
    // 老師無寫入權；行政尚未開該月工作表時回空，唔阻報更
    if (inserted.error) {
      const code = (inserted.error as { code?: string }).code
      if (code === "42501" || /permission|policy|RLS/i.test(inserted.error.message)) {
        return { id: "", yearMonth: opts.yearMonth, status: "未編更", days: [] }
      }
      throw inserted.error
    }
    roster = inserted.data
  }
  const rosterId = String((roster as { id: string }).id)
  const statusRaw = String((roster as { status?: string }).status ?? "未編更")
  const { data: days, error: daysErr } = await supabase
    .from("homework_tutoring_duty_days")
    .select(
      "id, duty_date, session_start, session_end, holiday_label, secondary_room, primary_room, secondary_teacher_id, primary_teacher_id, homework_tutoring_duty_assignments ( teacher_id, session_start, session_end, room, sort_order )"
    )
    .eq("roster_month_id", rosterId)
    .order("duty_date", { ascending: true })
  if (daysErr) throw daysErr
  return {
    id: rosterId,
    yearMonth: opts.yearMonth.slice(0, 7),
    status: statusRaw === "已編更" ? "已編更" : "未編更",
    days: (days ?? []).map((raw) => {
      const r = raw as Record<string, unknown>
      const date = String(r.duty_date ?? "").slice(0, 10)
      const d = new Date(`${date}T12:00:00`)
      const weekday = WEEKDAY_CHARS[d.getDay()] ?? ""
      const start = timeToHm(r.session_start != null ? String(r.session_start) : null)
      const end = timeToHm(r.session_end != null ? String(r.session_end) : null, "19:30")
      const secondaryTeacherId =
        r.secondary_teacher_id != null ? String(r.secondary_teacher_id) : undefined
      const primaryTeacherId =
        r.primary_teacher_id != null ? String(r.primary_teacher_id) : undefined
      const nested = mapAssignmentRows(r.homework_tutoring_duty_assignments)
      const secondaryRoom = r.secondary_room != null ? String(r.secondary_room) : null
      const primaryRoom = r.primary_room != null ? String(r.primary_room) : null
      const assignments =
        nested.length > 0
          ? nested
          : [
              ...(secondaryTeacherId
                ? [
                    {
                      teacherId: secondaryTeacherId,
                      start,
                      end,
                      room: secondaryRoom?.trim() || "17D",
                    } satisfies HomeworkDutyAssignment,
                  ]
                : []),
              ...(primaryTeacherId
                ? [
                    {
                      teacherId: primaryTeacherId,
                      start,
                      end,
                      room: primaryRoom?.trim() || "17E",
                    } satisfies HomeworkDutyAssignment,
                  ]
                : []),
            ]
      return {
        id: String(r.id),
        date,
        weekday,
        holiday: r.holiday_label != null ? String(r.holiday_label) : undefined,
        start,
        end,
        secondaryRoom,
        primaryRoom,
        secondaryTeacherId,
        primaryTeacherId,
        assignments,
      }
    }),
  }
}

export async function setHomeworkRosterMonthStatus(
  rosterMonthId: string,
  status: "未編更" | "已編更"
): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { error } = await supabase
    .from("homework_tutoring_roster_months")
    .update({
      status,
      published_at: status === "已編更" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", rosterMonthId)
  if (error) throw error
}

export async function upsertHomeworkDutyDay(input: {
  rosterMonthId: string
  date: string
  start: string
  end: string
  holidayLabel?: string | null
  secondaryRoom?: string | null
  primaryRoom?: string | null
  secondaryTeacherId?: string | null
  primaryTeacherId?: string | null
}): Promise<string> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { data, error } = await supabase
    .from("homework_tutoring_duty_days")
    .upsert(
      {
        roster_month_id: input.rosterMonthId,
        duty_date: input.date.slice(0, 10),
        session_start: input.start,
        session_end: input.end,
        holiday_label: input.holidayLabel?.trim() || null,
        secondary_room: input.secondaryRoom ?? null,
        primary_room: input.primaryRoom ?? null,
        secondary_teacher_id: input.secondaryTeacherId || null,
        primary_teacher_id: input.primaryTeacherId || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "roster_month_id,duty_date" }
    )
    .select("id")
    .single()
  if (error) throw error
  return String((data as { id: string }).id)
}

export async function replaceHomeworkDutyAssignments(
  dutyDayId: string,
  assignments: HomeworkDutyAssignment[]
): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { error: delErr } = await supabase
    .from("homework_tutoring_duty_assignments")
    .delete()
    .eq("duty_day_id", dutyDayId)
  if (delErr) throw delErr
  if (assignments.length === 0) return
  const { error } = await supabase.from("homework_tutoring_duty_assignments").insert(
    assignments.map((a, index) => ({
      duty_day_id: dutyDayId,
      teacher_id: a.teacherId,
      session_start: a.start,
      session_end: a.end,
      room: a.room,
      sort_order: index,
      updated_at: new Date().toISOString(),
    }))
  )
  if (error) throw error
}

export type PublishHomeworkDutyDayInput = {
  date: string
  weekday: string
  holiday?: string
  start: string
  end: string
  secondaryRoom: string | null
  primaryRoom: string | null
  secondaryTeacherId?: string
  primaryTeacherId?: string
  assignments: HomeworkDutyAssignment[]
}

/** 清除該月功輔佔室 schedules（remarks 標記） */
export async function clearHomeworkOccupancySchedules(
  classId: string,
  yearMonth: string
): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const range = monthDateRange(yearMonth)
  if (!range) throw new Error("月份格式不正確")
  const { error } = await supabase
    .from("schedules")
    .delete()
    .eq("class_id", classId)
    .eq("remarks", HOMEWORK_SCHEDULE_REMARKS)
    .gte("scheduled_date", range.from)
    .lte("scheduled_date", range.to)
  if (error) throw error
}

/** 依當值日寫入 schedules 佔室（15:15 起；兩室） */
export async function syncHomeworkOccupancySchedules(opts: {
  classId: string
  yearMonth: string
  dutyDays: PublishHomeworkDutyDayInput[]
}): Promise<number> {
  if (!supabase) throw new Error("Supabase 未設定")
  const rooms = await fetchClassrooms()
  const roomIdByName = new Map(rooms.map((r) => [r.name.trim(), r.id]))
  const slots = homeworkScheduleSlotsFromDutyDays(opts.dutyDays, opts.yearMonth, roomIdByName)

  await clearHomeworkOccupancySchedules(opts.classId, opts.yearMonth)

  let count = 0
  for (const slot of slots) {
    await insertScheduleRow(
      {
        class_id: opts.classId,
        teacher_id: slot.teacher_id,
        classroom_id: slot.classroom_id,
        scheduled_date: slot.scheduled_date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        status: "正常",
        remarks: HOMEWORK_SCHEDULE_REMARKS,
      },
      { skipInboxEvent: true, skipDeclarationSync: true }
    )
    count += 1
  }
  return count
}

/**
 * 確定本月編更：持久化當值日 → 標記已編更 → 寫入 schedules 佔室。
 */
export async function publishHomeworkRosterMonth(opts: {
  classId: string
  academicYearId: string
  yearMonth: string
  dutyDays: PublishHomeworkDutyDayInput[]
}): Promise<{ scheduleCount: number }> {
  const roster = await fetchHomeworkRosterMonth({
    classId: opts.classId,
    academicYearId: opts.academicYearId,
    yearMonth: opts.yearMonth,
  })

  for (const day of opts.dutyDays) {
    const iso = mdKeyToIso(opts.yearMonth, day.date)
    if (!iso) continue
    const dutyDayId = await upsertHomeworkDutyDay({
      rosterMonthId: roster.id,
      date: iso,
      start: day.start,
      end: day.end,
      holidayLabel: day.holiday ?? null,
      secondaryRoom: day.secondaryRoom,
      primaryRoom: day.primaryRoom,
      secondaryTeacherId: day.secondaryTeacherId ?? null,
      primaryTeacherId: day.primaryTeacherId ?? null,
    })
    await replaceHomeworkDutyAssignments(dutyDayId, day.holiday ? [] : day.assignments)
  }

  await setHomeworkRosterMonthStatus(roster.id, "已編更")
  const scheduleCount = await syncHomeworkOccupancySchedules({
    classId: opts.classId,
    yearMonth: opts.yearMonth,
    dutyDays: opts.dutyDays,
  })

  return { scheduleCount }
}

export { formatYearMonthLabel }
