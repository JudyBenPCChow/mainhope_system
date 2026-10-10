import {
  CHRISTINE_HOMEWORK_COMMISSION_NAME,
  rosterHoursByTeacher,
  type HomeworkDutyShift,
} from "@/lib/payroll/homeworkHours"
import {
  homeworkMonthlyFeeHkd,
  isHomeworkDayPlan,
  monthFirstDay,
} from "@/lib/homeworkTutoringFees"
import { supabase } from "@/lib/supabaseClient"

function asRecord(v: unknown): Record<string, unknown> | null {
  return v != null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function hm(raw: unknown, fallback: string): string {
  const s = String(raw ?? "").slice(0, 5)
  return /^\d{2}:\d{2}$/.test(s) ? s : fallback
}

function monthEnd(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number)
  const last = new Date(y, m, 0).getDate()
  return `${monthKey}-${String(last).padStart(2, "0")}`
}

export type HomeworkHourlyRateRow = {
  teacherId: string
  hourlyRate: number
}

export type HomeworkHourOverrideRow = {
  teacherId: string
  hours: number
}

export async function fetchHomeworkHourlyRates(monthKey: string): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  if (!supabase) return out
  const monthStart = `${monthKey}-01`
  const { data, error } = await supabase
    .from("payroll_homework_rates")
    .select("teacher_id, hourly_rate, effective_from, effective_to")
    .lte("effective_from", monthStart)
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as Record<string, unknown>[]
  const best = new Map<string, { from: string; rate: number }>()
  for (const row of rows) {
    const to = row.effective_to != null ? String(row.effective_to).slice(0, 10) : null
    if (to != null && to < monthStart) continue
    const teacherId = String(row.teacher_id)
    const from = String(row.effective_from).slice(0, 10)
    const rate = Number(row.hourly_rate)
    if (!Number.isFinite(rate) || rate <= 0) continue
    const prev = best.get(teacherId)
    if (!prev || from > prev.from) best.set(teacherId, { from, rate })
  }
  for (const [id, v] of best) out.set(id, v.rate)
  return out
}

export async function fetchHomeworkHourOverrides(monthKey: string): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  if (!supabase) return out
  const { data, error } = await supabase
    .from("payroll_homework_hour_overrides")
    .select("teacher_id, hours")
    .eq("month_key", monthKey)
  if (error) throw new Error(error.message)
  for (const raw of data ?? []) {
    const row = raw as Record<string, unknown>
    const hours = Number(row.hours)
    if (!Number.isFinite(hours)) continue
    out.set(String(row.teacher_id), hours)
  }
  return out
}

export async function upsertHomeworkHourOverride(input: {
  monthKey: string
  teacherId: string
  hours: number
  actor: string
  note?: string | null
}): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { error } = await supabase.from("payroll_homework_hour_overrides").upsert(
    {
      month_key: input.monthKey,
      teacher_id: input.teacherId,
      hours: input.hours,
      note: input.note ?? null,
      updated_by: input.actor,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "month_key,teacher_id" }
  )
  if (error) throw new Error(error.message)
}

export async function clearHomeworkHourOverride(monthKey: string, teacherId: string): Promise<void> {
  if (!supabase) throw new Error("Supabase 未設定")
  const { error } = await supabase
    .from("payroll_homework_hour_overrides")
    .delete()
    .eq("month_key", monthKey)
    .eq("teacher_id", teacherId)
  if (error) throw new Error(error.message)
}

async function fetchPublishedDutyShifts(monthKey: string): Promise<{
  shifts: HomeworkDutyShift[]
  academicYearIds: string[]
}> {
  const shifts: HomeworkDutyShift[] = []
  const academicYearIds: string[] = []
  if (!supabase) return { shifts, academicYearIds }
  const month = monthFirstDay(monthKey)
  const { data: rosters, error: rosterErr } = await supabase
    .from("homework_tutoring_roster_months")
    .select("id, academic_year_id, status")
    .eq("roster_month", month)
    .eq("status", "已編更")
  if (rosterErr) throw new Error(rosterErr.message)
  const rosterRows = (rosters ?? []) as Record<string, unknown>[]
  if (rosterRows.length === 0) return { shifts, academicYearIds }

  const rosterIds = rosterRows.map((r) => String(r.id))
  academicYearIds.push(...rosterRows.map((r) => String(r.academic_year_id)).filter(Boolean))

  const { data: days, error: daysErr } = await supabase
    .from("homework_tutoring_duty_days")
    .select(
      "id, duty_date, session_start, session_end, holiday_label, primary_teacher_id, secondary_teacher_id"
    )
    .in("roster_month_id", rosterIds)
  if (daysErr) throw new Error(daysErr.message)
  const dayRows = (days ?? []) as Record<string, unknown>[]
  const dayById = new Map<string, Record<string, unknown>>()
  for (const d of dayRows) dayById.set(String(d.id), d)

  let assignmentRows: Record<string, unknown>[] = []
  const { data: assigns, error: assignErr } = await supabase
    .from("homework_tutoring_duty_assignments")
    .select("duty_day_id, teacher_id, session_start, session_end")
    .in(
      "duty_day_id",
      dayRows.map((d) => String(d.id))
    )
  if (assignErr) {
    const msg = assignErr.message ?? ""
    if (!/does not exist|schema cache|relation/i.test(msg)) throw new Error(assignErr.message)
  } else {
    assignmentRows = (assigns ?? []) as Record<string, unknown>[]
  }

  const daysWithAssignment = new Set<string>()
  for (const a of assignmentRows) {
    const dayId = String(a.duty_day_id)
    const day = dayById.get(dayId)
    if (!day) continue
    daysWithAssignment.add(dayId)
    const date = String(day.duty_date).slice(0, 10)
    const holiday = Boolean(day.holiday_label)
    shifts.push({
      teacherId: String(a.teacher_id),
      date,
      start: hm(a.session_start, hm(day.session_start, "15:30")),
      end: hm(a.session_end, hm(day.session_end, "19:30")),
      holiday,
    })
  }

  for (const day of dayRows) {
    const dayId = String(day.id)
    if (daysWithAssignment.has(dayId)) continue
    const date = String(day.duty_date).slice(0, 10)
    const holiday = Boolean(day.holiday_label)
    const start = hm(day.session_start, "15:30")
    const end = hm(day.session_end, "19:30")
    for (const key of ["primary_teacher_id", "secondary_teacher_id"] as const) {
      if (day[key] == null) continue
      shifts.push({
        teacherId: String(day[key]),
        date,
        start,
        end,
        holiday,
      })
    }
  }

  return { shifts, academicYearIds: [...new Set(academicYearIds)] }
}

async function fetchClosureDates(academicYearIds: string[], monthKey: string): Promise<Set<string>> {
  const out = new Set<string>()
  if (!supabase || academicYearIds.length === 0) return out
  const from = `${monthKey}-01`
  const to = monthEnd(monthKey)
  const { data, error } = await supabase
    .from("homework_tutoring_calendar_closures")
    .select("closure_date")
    .in("academic_year_id", academicYearIds)
    .gte("closure_date", from)
    .lte("closure_date", to)
  if (error) throw new Error(error.message)
  for (const raw of data ?? []) {
    const d = String((raw as Record<string, unknown>).closure_date ?? "").slice(0, 10)
    if (d) out.add(d)
  }
  return out
}

export async function fetchHomeworkRosterHoursByTeacher(monthKey: string): Promise<Map<string, number>> {
  const { shifts, academicYearIds } = await fetchPublishedDutyShifts(monthKey)
  const closures = await fetchClosureDates(academicYearIds, monthKey)
  return rosterHoursByTeacher(shifts, closures)
}

export type HomeworkClassCommissionInput = {
  /** 該班當月未作廢月費應收。有列則用列上金額，不用後備。 */
  charges: readonly { studentId: string; amountHkd: number }[]
  /** 沒有應收列時的後備人數與原價。日數檔計價由呼叫端負責。 */
  enrollmentFallback: { enrolledCount: number; originalPriceTotal: number }
}

/**
 * 沒有月費應收列時，就讀中報讀的後備人數與原價。
 * 每週日數檔不是三日、四日、五日、七日時不計入，不以四日計價。
 */
export function homeworkCommissionFallbackFromEnrollments(
  rows: readonly Record<string, unknown>[],
  monthKey: string
): { enrolledCount: number; originalPriceTotal: number } {
  const students = new Set<string>()
  let original = 0
  for (const row of rows) {
    const studentId = String(row.student_id)
    if (students.has(studentId)) continue
    const enrollDate = String(row.enroll_date ?? "").slice(0, 10)
    if (enrollDate && enrollDate.slice(0, 7) > monthKey) continue
    const stu = asRecord(row.students)
    const grade = stu?.grade != null ? String(stu.grade) : ""
    const planRaw = row.homework_day_plan
    if (!isHomeworkDayPlan(planRaw)) continue
    const fee = homeworkMonthlyFeeHkd(planRaw, grade, monthKey)
    if (fee == null) continue
    students.add(studentId)
    original += fee
  }
  return { enrolledCount: students.size, originalPriceTotal: original }
}

/** 進行中各功課輔導班各自計價後，人數與原價加總。 */
export function sumInProgressHomeworkCommission(
  classes: readonly HomeworkClassCommissionInput[]
): { enrolledCount: number; originalPriceTotal: number } {
  let enrolledCount = 0
  let originalPriceTotal = 0
  for (const cls of classes) {
    if (cls.charges.length > 0) {
      const students = new Set<string>()
      let original = 0
      for (const row of cls.charges) {
        students.add(row.studentId)
        original += Number(row.amountHkd) || 0
      }
      enrolledCount += students.size
      originalPriceTotal += original
      continue
    }
    enrolledCount += cls.enrollmentFallback.enrolledCount
    originalPriceTotal += cls.enrollmentFallback.originalPriceTotal
  }
  return { enrolledCount, originalPriceTotal }
}

export async function fetchHomeworkCommissionBase(monthKey: string): Promise<{
  teacherId: string
  enrolledCount: number
  originalPriceTotal: number
} | null> {
  if (!supabase) return null
  const { data: christine, error: tErr } = await supabase
    .from("teachers")
    .select("id")
    .eq("full_name", CHRISTINE_HOMEWORK_COMMISSION_NAME)
    .limit(1)
    .maybeSingle()
  if (tErr) throw new Error(tErr.message)
  const teacherId = christine?.id != null ? String(christine.id) : null
  if (!teacherId) return null

  const { data: hwClasses, error: cErr } = await supabase
    .from("classes")
    .select("id")
    .eq("class_kind", "homework")
    .eq("status", "進行中")
  if (cErr) throw new Error(cErr.message)
  const classIds = [
    ...new Set(
      ((hwClasses ?? []) as Record<string, unknown>[]).map((row) => String(row.id ?? "")).filter(Boolean)
    ),
  ]
  if (classIds.length === 0) return { teacherId, enrolledCount: 0, originalPriceTotal: 0 }
  const month = monthFirstDay(monthKey)
  const to = monthEnd(monthKey)

  const { data: charges, error: chErr } = await supabase
    .from("homework_tutoring_monthly_charges")
    .select("class_id, student_id, amount_hkd, status")
    .in("class_id", classIds)
    .eq("billing_month", month)
    .neq("status", "作廢")
  if (chErr) throw new Error(chErr.message)
  const chargesByClass = new Map<string, { studentId: string; amountHkd: number }[]>()
  for (const raw of charges ?? []) {
    const row = raw as Record<string, unknown>
    const classId = String(row.class_id ?? "")
    if (!classId) continue
    const list = chargesByClass.get(classId) ?? []
    list.push({ studentId: String(row.student_id), amountHkd: Number(row.amount_hkd) })
    chargesByClass.set(classId, list)
  }

  const classesWithoutCharges = classIds.filter((id) => (chargesByClass.get(id)?.length ?? 0) === 0)
  const fallbackByClass = new Map<string, { enrolledCount: number; originalPriceTotal: number }>()
  if (classesWithoutCharges.length > 0) {
    const { data: enrolls, error: eErr } = await supabase
      .from("student_class_enrollments")
      .select("class_id, student_id, status, enroll_date, homework_day_plan, students ( grade )")
      .in("class_id", classesWithoutCharges)
      .eq("status", "就讀中")
      .lte("enroll_date", to)
    if (eErr) throw new Error(eErr.message)
    const enrollsByClass = new Map<string, Record<string, unknown>[]>()
    for (const raw of enrolls ?? []) {
      const row = raw as Record<string, unknown>
      const classId = String(row.class_id ?? "")
      if (!classId) continue
      const list = enrollsByClass.get(classId) ?? []
      list.push(row)
      enrollsByClass.set(classId, list)
    }
    for (const classId of classesWithoutCharges) {
      fallbackByClass.set(
        classId,
        homeworkCommissionFallbackFromEnrollments(enrollsByClass.get(classId) ?? [], monthKey)
      )
    }
  }

  const totals = sumInProgressHomeworkCommission(
    classIds.map((classId) => ({
      charges: chargesByClass.get(classId) ?? [],
      enrollmentFallback: fallbackByClass.get(classId) ?? { enrolledCount: 0, originalPriceTotal: 0 },
    }))
  )
  return { teacherId, enrolledCount: totals.enrolledCount, originalPriceTotal: totals.originalPriceTotal }
}
