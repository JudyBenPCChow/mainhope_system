import { classDisplayName, formatClassLabel } from "@/lib/courseLabel"
import {
 billingMonthBounds,
 billingMonthDate,
 calculateMonthlyTuition,
 normalizeBillingMonth,
} from "@/lib/monthlyTuition"
import {
 normalizeEnrollmentPeriod,
 resolvePriceForEnrollment,
} from "@/lib/enrollmentPeriod"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import { supabase } from "@/lib/supabaseClient"
import { PAYMENT_STATUS } from "@/services/paymentQueries"

type CreditAllocation = {
 creditEntryId: string
 amount: number
 originalAmount: number
}

export type MonthlyTuitionPreviewLine = {
 key: string
 billingMonth: string
 enrollmentId: string
 classId: string
 classLabel: string
 calendarLessonCount: number
 leaveDeductionCount: number
 chargeableLessonCount: number
 unitPrice: number
 grossAmount: number
 creditApplied: number
 netAmount: number
 existingChargeId: string | null
 status: string
 warning: string | null
 creditAllocations: CreditAllocation[]
}

export type MonthlyTuitionPreview = {
 lines: MonthlyTuitionPreviewLine[]
 availableCreditBefore: number
 availableCreditAfter: number
}

type EnrollmentBillingRow = {
 id: string
 classId: string
 enrollDate: string
 withdrawEffectiveDate: string | null
 status: string
 classLabel: string
 unitPrice: number
}

type ScheduleBillingRow = {
 classId: string
 date: string
}

type CreditState = {
 id: string
 classId: string | null
 remaining: number
}

function monthKey(value: string): string {
 return normalizeBillingMonth(value)
}

function mapEnrollment(row: Record<string, unknown>): EnrollmentBillingRow {
 const cls = row.classes as Record<string, unknown> | null
 const course = cls?.courses as Record<string, unknown> | null
 const enrollmentPeriod = normalizeEnrollmentPeriod(
  row.enrollment_period != null ? String(row.enrollment_period) : null
 )
 const subject = cls?.subject != null ? String(cls.subject) : ""
 const courseName = course?.course_name != null ? String(course.course_name) : null
 const courseCode = cls?.course_code_full != null ? String(cls.course_code_full) : null
 const unitPrice =
  resolvePriceForEnrollment({
   enrollmentPeriod,
   classPriceOverride: cls?.price_per_lesson != null ? Number(cls.price_per_lesson) : null,
   coursePrices: {
    pricePerLesson: course?.price_per_lesson != null ? Number(course.price_per_lesson) : null,
    pricePerLessonPeriod2:
     course?.price_per_lesson_period_2 != null
      ? Number(course.price_per_lesson_period_2)
      : null,
    pricePerLessonBothPeriods:
     course?.price_per_lesson_both_periods != null
      ? Number(course.price_per_lesson_both_periods)
      : null,
   },
  }) ?? 0
 return {
  id: String(row.id),
  classId: String(row.class_id),
  enrollDate: String(row.enroll_date ?? row.created_at ?? "").slice(0, 10),
  withdrawEffectiveDate:
   row.withdraw_effective_date != null
    ? String(row.withdraw_effective_date).slice(0, 10)
    : null,
  status: String(row.status ?? "就讀中"),
  classLabel: formatClassLabel({
   subject: classDisplayName({ subject, courseName }),
   courseCode,
   courseName,
  }),
  unitPrice,
 }
}

function enrollmentMayCoverRange(
 enrollment: EnrollmentBillingRow,
 start: string,
 end: string
): boolean {
 if (enrollment.status === "已退讀" && !enrollment.withdrawEffectiveDate) return false
 if (enrollment.enrollDate && enrollment.enrollDate > end) return false
 if (enrollment.withdrawEffectiveDate && enrollment.withdrawEffectiveDate <= start) return false
 return true
}

function scheduleCoveredByEnrollment(
 schedule: ScheduleBillingRow,
 enrollment: EnrollmentBillingRow
): boolean {
 if (enrollment.enrollDate && schedule.date < enrollment.enrollDate) return false
 if (
  enrollment.withdrawEffectiveDate &&
  schedule.date >= enrollment.withdrawEffectiveDate
 ) {
  return false
 }
 return true
}

function allocateCredit(
 states: CreditState[],
 classId: string,
 grossAmount: number
): { amount: number; allocations: CreditAllocation[] } {
 let need = grossAmount
 const allocations: CreditAllocation[] = []
 const ordered = [
  ...states.filter((credit) => credit.classId === classId),
  ...states.filter((credit) => credit.classId == null),
 ]
 for (const credit of ordered) {
  if (need <= 0) break
  if (credit.remaining <= 0) continue
  const amount = Math.min(need, credit.remaining)
  const originalAmount = credit.remaining
  credit.remaining = Math.round((credit.remaining - amount) * 100) / 100
  need = Math.round((need - amount) * 100) / 100
  allocations.push({ creditEntryId: credit.id, amount, originalAmount })
 }
 return {
  amount: Math.round((grossAmount - need) * 100) / 100,
  allocations,
 }
}

export async function fetchMonthlyTuitionPreview(
 studentId: string,
 billingMonths: string[]
): Promise<MonthlyTuitionPreview> {
 if (!supabase || billingMonths.length === 0) {
  return { lines: [], availableCreditBefore: 0, availableCreditAfter: 0 }
 }
 const months = [...new Set(billingMonths.map(monthKey))].sort()
 const first = billingMonthBounds(months[0]!).start
 const last = billingMonthBounds(months[months.length - 1]!).end

 const [enrollmentRes, closureRes, leaveRes, chargeRes, creditRes] = await Promise.all([
  supabase
   .from("student_class_enrollments")
   .select(
    "id, class_id, status, enroll_date, created_at, enrollment_period, withdraw_effective_date, classes ( subject, course_code_full, price_per_lesson, courses ( course_name, price_per_lesson, price_per_lesson_period_2, price_per_lesson_both_periods ) )"
   )
   .eq("student_id", studentId),
  supabase
   .from("academic_calendar_closures")
   .select("closure_date")
   .gte("closure_date", first)
   .lte("closure_date", last),
  supabase
   .from("leave_makeup_records")
   .select("id, class_id, schedule_id, leave_date, tuition_disposition")
   .eq("student_id", studentId)
   .eq("tuition_disposition", "減收")
   .gte("leave_date", first)
   .lte("leave_date", last),
  supabase
   .from("monthly_tuition_charges")
   .select(
    "id, class_id, billing_month, calendar_lesson_count, leave_deduction_count, chargeable_lesson_count, unit_price, gross_amount, credit_applied, net_amount, status"
   )
   .eq("student_id", studentId)
   .neq("status", "作廢")
   .gte("billing_month", `${months[0]}-01`)
   .lte("billing_month", `${months[months.length - 1]}-01`),
  supabase
   .from("tuition_credit_entries")
   .select("id, class_id, amount")
   .eq("student_id", studentId)
   .eq("status", "可用")
   .order("created_at", { ascending: true }),
 ])
 for (const result of [enrollmentRes, closureRes, leaveRes, chargeRes, creditRes]) {
  if (result.error) throw result.error
 }

 const enrollments = (enrollmentRes.data ?? []).map((row) =>
  mapEnrollment(row as Record<string, unknown>)
 )
 const classIds = [...new Set(enrollments.map((row) => row.classId))]
 const scheduleChunks = await forEachIdChunk(
  classIds,
  DEFAULT_ID_CHUNK,
  async (slice) => {
   const { data, error } = await supabase!
    .from("schedules")
    .select("class_id, scheduled_date, status")
    .in("class_id", slice)
    .gte("scheduled_date", first)
    .lte("scheduled_date", last)
    .order("scheduled_date", { ascending: true })
   if (error) throw error
   return data ?? []
  }
 )
 const closures = new Set(
  (closureRes.data ?? []).map((row) =>
   String((row as { closure_date: string }).closure_date).slice(0, 10)
  )
 )
 const schedules: ScheduleBillingRow[] = scheduleChunks
  .flat()
  .filter((row) => !String((row as { status?: string }).status ?? "").includes("取消"))
  .map((row) => ({
   classId: String((row as { class_id: string }).class_id),
   date: String((row as { scheduled_date: string }).scheduled_date).slice(0, 10),
  }))
  .filter((row) => !closures.has(row.date))

 const leaveDatesByClass = new Map<string, Set<string>>()
 for (const row of leaveRes.data ?? []) {
  const record = row as Record<string, unknown>
  const key = String(record.class_id)
  const dates = leaveDatesByClass.get(key) ?? new Set<string>()
  dates.add(String(record.leave_date).slice(0, 10))
  leaveDatesByClass.set(key, dates)
 }
 const existing = new Map<string, Record<string, unknown>>()
 for (const row of chargeRes.data ?? []) {
  const record = row as Record<string, unknown>
  existing.set(
   `${String(record.class_id)}:${String(record.billing_month).slice(0, 7)}`,
   record
  )
 }
 const creditStates: CreditState[] = (creditRes.data ?? []).map((row) => {
  const record = row as Record<string, unknown>
  return {
   id: String(record.id),
   classId: record.class_id != null ? String(record.class_id) : null,
   remaining: Number(record.amount ?? 0),
  }
 })
 const availableCreditBefore = creditStates.reduce((sum, row) => sum + row.remaining, 0)

 const lines: MonthlyTuitionPreviewLine[] = []
 for (const billingMonth of months) {
  const bounds = billingMonthBounds(billingMonth)
  for (const enrollment of enrollments) {
   if (!enrollmentMayCoverRange(enrollment, bounds.start, bounds.end)) continue
   const key = `${enrollment.classId}:${billingMonth}`
   const stored = existing.get(key)
   if (stored) {
    lines.push({
     key,
     billingMonth,
     enrollmentId: enrollment.id,
     classId: enrollment.classId,
     classLabel: enrollment.classLabel,
     calendarLessonCount: Number(stored.calendar_lesson_count ?? 0),
     leaveDeductionCount: Number(stored.leave_deduction_count ?? 0),
     chargeableLessonCount: Number(stored.chargeable_lesson_count ?? 0),
     unitPrice: Number(stored.unit_price ?? 0),
     grossAmount: Number(stored.gross_amount ?? 0),
     creditApplied: Number(stored.credit_applied ?? 0),
     netAmount: Number(stored.net_amount ?? 0),
     existingChargeId: String(stored.id),
     status: String(stored.status ?? "草稿"),
     warning: String(stored.status) === "已繳" ? "此帳期已收款" : null,
     creditAllocations: [],
    })
    continue
   }
   const monthSchedules = schedules.filter(
    (schedule) =>
     schedule.classId === enrollment.classId &&
     schedule.date >= bounds.start &&
     schedule.date <= bounds.end &&
     scheduleCoveredByEnrollment(schedule, enrollment)
   )
   const scheduledDates = new Set(monthSchedules.map((schedule) => schedule.date))
   const leaveDeductionCount = [...(leaveDatesByClass.get(enrollment.classId) ?? [])]
    .filter((date) => scheduledDates.has(date)).length
   const base = calculateMonthlyTuition({
    calendarLessonCount: monthSchedules.length,
    leaveDeductionCount,
    unitPrice: enrollment.unitPrice,
   })
   const credit = allocateCredit(
    creditStates,
    enrollment.classId,
    base.grossAmount
   )
   const amounts = calculateMonthlyTuition({
    calendarLessonCount: monthSchedules.length,
    leaveDeductionCount,
    unitPrice: enrollment.unitPrice,
    creditApplied: credit.amount,
   })
   const warnings: string[] = []
   if (monthSchedules.length !== 4) warnings.push(`校曆為 ${monthSchedules.length} 堂`)
   if (enrollment.unitPrice <= 0) warnings.push("未設定每堂價格")
   lines.push({
    key,
    billingMonth,
    enrollmentId: enrollment.id,
    classId: enrollment.classId,
    classLabel: enrollment.classLabel,
    calendarLessonCount: monthSchedules.length,
    leaveDeductionCount,
    ...amounts,
    unitPrice: enrollment.unitPrice,
    existingChargeId: null,
    status: "未出單",
    warning: warnings.join("；") || null,
    creditAllocations: credit.allocations,
   })
  }
 }
 return {
  lines,
  availableCreditBefore: Math.round(availableCreditBefore * 100) / 100,
  availableCreditAfter:
   Math.round(creditStates.reduce((sum, row) => sum + row.remaining, 0) * 100) /
   100,
 }
}

export async function createMonthlyTuitionPayment(input: {
 studentId: string
 selectedKeys: string[]
 billingMonths: string[]
 paymentDate: string
 paymentMethod: string
 paymentStatus: typeof PAYMENT_STATUS.received | typeof PAYMENT_STATUS.pendingPay | typeof PAYMENT_STATUS.pendingReceive
 remarks?: string | null
}): Promise<string> {
 void input
 throw new Error(
  "月費獨立收款路徑已退役。請改用「收款登記」：按班填堂數（建議＝本月排程−池餘），確認收款後會抬權益池。"
 )
}

export async function fetchMonthlyTuitionCharges(input: {
 fromMonth: string
 toMonth: string
 studentId?: string
}): Promise<Array<{
 id: string
 billingMonth: string
 studentName: string
 classLabel: string
 chargeableLessonCount: number
 netAmount: number
 status: string
}>> {
 if (!supabase) return []
 let query = supabase
  .from("monthly_tuition_charges")
  .select(
   "id, billing_month, chargeable_lesson_count, net_amount, status, students ( full_name ), classes ( subject, course_code_full, courses ( course_name ) )"
  )
  .gte("billing_month", billingMonthDate(input.fromMonth))
  .lte("billing_month", billingMonthDate(input.toMonth))
  .neq("status", "作廢")
  .order("billing_month", { ascending: false })
 if (input.studentId) query = query.eq("student_id", input.studentId)
 const { data, error } = await query
 if (error) throw error
 return (data ?? []).map((row) => {
  const record = row as Record<string, unknown>
  const student = record.students as Record<string, unknown> | null
  const cls = record.classes as Record<string, unknown> | null
  const course = cls?.courses as Record<string, unknown> | null
  return {
   id: String(record.id),
   billingMonth: String(record.billing_month).slice(0, 7),
   studentName: student?.full_name != null ? String(student.full_name) : "—",
   classLabel: formatClassLabel({
    subject: cls?.subject != null ? String(cls.subject) : "",
    courseCode: cls?.course_code_full != null ? String(cls.course_code_full) : null,
    courseName: course?.course_name != null ? String(course.course_name) : null,
   }),
   chargeableLessonCount: Number(record.chargeable_lesson_count ?? 0),
   netAmount: Number(record.net_amount ?? 0),
   status: String(record.status ?? ""),
  }
 })
}
