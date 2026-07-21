import { isBillableAttendanceStatus } from "@/lib/attendanceBilling"
import { formatClassLabel } from "@/lib/courseLabel"
import {
 normalizeEnrollmentPeriod,
 resolvePriceForEnrollment,
 type CoursePriceFields,
 type EnrollmentFormValue,
} from "@/lib/enrollmentPeriod"
import { buildMgmtDashboardMock } from "@/lib/mgmtDashboardMock"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"
import type {
 KpiCardModel,
 MgmtDashboardFilters,
 MgmtDashboardPayload,
 NearFullClassRow,
 UnpaidAlertRow,
} from "@/components/mgmtDashboard/types"
import {
 fetchEnrollmentReport,
 fetchOverallStudentAnalysis,
 type ClassKindFilter,
} from "@/services/enrollmentReportQueries"
import { PAYMENT_STATUS } from "@/services/paymentQueries"
import {
 fetchMisalignedLessonBalances,
 isLessonBalanceNeedsFollowUp,
} from "@/services/pendingLessonQueries"

function localYmd(d = new Date()): string {
 const y = d.getFullYear()
 const m = String(d.getMonth() + 1).padStart(2, "0")
 const day = String(d.getDate()).padStart(2, "0")
 return `${y}-${m}-${day}`
}

function parseYmd(ymd: string): Date {
 const [y, m, d] = ymd.split("-").map(Number)
 return new Date(y, (m || 1) - 1, d || 1)
}

function addDaysYmd(ymd: string, days: number): string {
 const dt = parseYmd(ymd)
 dt.setDate(dt.getDate() + days)
 return localYmd(dt)
}

function daysInclusive(from: string, to: string): number {
 const a = parseYmd(from).getTime()
 const b = parseYmd(to).getTime()
 return Math.max(1, Math.round((b - a) / 86400000) + 1)
}

/** 上一同長度區間（不含本期起日） */
export function previousPeriod(filters: Pick<MgmtDashboardFilters, "dateFrom" | "dateTo">): {
 dateFrom: string
 dateTo: string
} {
 const len = daysInclusive(filters.dateFrom, filters.dateTo)
 const dateTo = addDaysYmd(filters.dateFrom, -1)
 const dateFrom = addDaysYmd(dateTo, -(len - 1))
 return { dateFrom, dateTo }
}

function deltaPct(current: number, previous: number): number | null {
 if (previous === 0) return current === 0 ? 0 : null
 return Math.round(((current - previous) / previous) * 1000) / 10
}

function monthLabel(ym: string): string {
 const [, m] = ym.split("-")
 return `${Number(m)}月`
}

function monthKeyFromYmd(ymd: string): string {
 return ymd.slice(0, 7)
}

function asRecord(v: unknown): Record<string, unknown> | null {
 return v != null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

async function sumPaidAmount(from: string, to: string): Promise<number> {
 if (!supabase) return 0
 const { data, error } = await supabase
  .from("payments")
  .select("total_amount")
  .eq("status", PAYMENT_STATUS.received)
  .gte("payment_date", from)
  .lte("payment_date", to)
 if (error) throw error
 let sum = 0
 for (const row of data ?? []) {
  const n = Number((row as { total_amount?: unknown }).total_amount ?? 0)
  if (!Number.isNaN(n)) sum += n
 }
 return sum
}

async function sumUnpaidAmount(): Promise<{ amount: number; count: number }> {
 if (!supabase) return { amount: 0, count: 0 }
 const { data, error } = await supabase
  .from("payments")
  .select("total_amount")
  .or(`status.eq.${PAYMENT_STATUS.pendingPay},status.eq.${PAYMENT_STATUS.pendingReceive}`)
 if (error) throw error
 let amount = 0
 for (const row of data ?? []) {
  const n = Number((row as { total_amount?: unknown }).total_amount ?? 0)
  if (!Number.isNaN(n)) amount += n
 }
 return { amount, count: (data ?? []).length }
}

async function countEnrollmentEvents(
 action: "enroll" | "withdraw",
 from: string,
 to: string,
 opts: { classKind: ClassKindFilter; teacherIds: string[] }
): Promise<number> {
 if (!supabase) return 0
 let q = supabase
  .from("enrollment_change_events")
  .select("id, class_id, classes!inner ( class_kind, teacher_id )", { count: "exact", head: true })
  .eq("action", action)
  .gte("effective_date", from)
  .lte("effective_date", to)

 if (opts.classKind === "group" || opts.classKind === "private") {
  q = q.eq("classes.class_kind", opts.classKind)
 }
 if (opts.teacherIds.length > 0) {
  q = q.in("classes.teacher_id", opts.teacherIds)
 }

 const { count, error } = await q
 if (error) {
  console.warn("[countEnrollmentEvents]", error.message)
  return 0
 }
 return count ?? 0
}

async function countTrials(from: string, to: string): Promise<number> {
 if (!supabase) return 0
 const { count, error } = await supabase
  .from("trial_sessions")
  .select("id", { count: "exact", head: true })
  .gte("trial_date", from)
  .lte("trial_date", to)
 if (error) {
  console.warn("[countTrials]", error.message)
  return 0
 }
 return count ?? 0
}

/**
 * 消堂價值：每一筆「扣堂」點名各算一次單堂價再加總。
 * 單價優先序：
 * 1) resolvePriceForEnrollment（班別 override＞報讀期課程價）
 * 2) 該生該班已收款明細有效單價（amount÷lesson_count）
 * 3) 該班任一已收款明細有效單價
 * （一對一常缺 course_id／目錄價，必須靠收款後備，否則會大量變 0。）
 */
export function coursePricesFromClassEmbed(cls: Record<string, unknown> | null): {
 classPriceOverride: number | null
 coursePrices: CoursePriceFields
} {
 if (!cls) {
  return {
   classPriceOverride: null,
   coursePrices: {
    pricePerLesson: null,
    pricePerLessonPeriod2: null,
    pricePerLessonBothPeriods: null,
   },
  }
 }
 const course = asRecord(cls.courses)
 const classRaw =
  cls.price_per_lesson != null && Number.isFinite(Number(cls.price_per_lesson))
   ? Number(cls.price_per_lesson)
   : null
 return {
  // 0 視為未設定，避免蓋住課程價／收款後備
  classPriceOverride: classRaw != null && classRaw > 0 ? classRaw : null,
  coursePrices: {
   pricePerLesson: positiveNumberOrNull(course?.price_per_lesson),
   pricePerLessonPeriod2: positiveNumberOrNull(course?.price_per_lesson_period_2),
   pricePerLessonBothPeriods: positiveNumberOrNull(course?.price_per_lesson_both_periods),
  },
 }
}

function positiveNumberOrNull(v: unknown): number | null {
 if (v == null || !Number.isFinite(Number(v))) return null
 const n = Number(v)
 return n > 0 ? n : null
}

export function unitPriceForConsumedLesson(opts: {
 enrollmentPeriod: EnrollmentFormValue | null
 classPriceOverride: number | null
 coursePrices: CoursePriceFields
 /** 目錄價缺失時：已收款推得之單堂價 */
 paidUnitFallback?: number | null
}): number {
 const override =
  opts.classPriceOverride != null &&
  Number.isFinite(opts.classPriceOverride) &&
  opts.classPriceOverride > 0
   ? opts.classPriceOverride
   : null
 const catalog = resolvePriceForEnrollment({
  enrollmentPeriod: opts.enrollmentPeriod,
  classPriceOverride: override,
  coursePrices: opts.coursePrices,
 })
 if (catalog != null && Number.isFinite(catalog) && catalog > 0) return catalog
 const paid = opts.paidUnitFallback
 if (paid != null && Number.isFinite(paid) && paid > 0) return paid
 return 0
}

type EnrollmentForConsumedPrice = {
 studentId: string
 classId: string
 enrollmentPeriod: EnrollmentFormValue | null
 enrollDate: string | null
 withdrawEffectiveDate: string | null
 status: string
}

export function enrollmentCoversAttendanceDate(
 enr: Pick<
  EnrollmentForConsumedPrice,
  "enrollDate" | "withdrawEffectiveDate" | "status"
 >,
 attendanceYmd: string
): boolean {
 const ymd = attendanceYmd.slice(0, 10)
 if (enr.status === "已退讀" && !enr.withdrawEffectiveDate) return false
 if (enr.enrollDate && enr.enrollDate > ymd) return false
 if (enr.withdrawEffectiveDate && enr.withdrawEffectiveDate <= ymd) return false
 return true
}

export function pickEnrollmentForAttendance(
 enrollments: EnrollmentForConsumedPrice[],
 attendanceYmd: string
): EnrollmentForConsumedPrice | null {
 const covering = enrollments.filter((e) => enrollmentCoversAttendanceDate(e, attendanceYmd))
 if (covering.length === 0) return null
 covering.sort((a, b) => {
  if (a.status === "就讀中" && b.status !== "就讀中") return -1
  if (b.status === "就讀中" && a.status !== "就讀中") return 1
  return (b.enrollDate ?? "").localeCompare(a.enrollDate ?? "")
 })
 return covering[0] ?? null
}

function enrollmentPairKey(studentId: string, classId: string): string {
 return `${studentId}::${classId}`
}

function mapEnrollmentRow(row: Record<string, unknown>): EnrollmentForConsumedPrice {
 return {
  studentId: String(row.student_id),
  classId: String(row.class_id),
  enrollmentPeriod: normalizeEnrollmentPeriod(
   row.enrollment_period != null ? String(row.enrollment_period) : null
  ),
  enrollDate: row.enroll_date != null ? String(row.enroll_date).slice(0, 10) : null,
  withdrawEffectiveDate:
   row.withdraw_effective_date != null
    ? String(row.withdraw_effective_date).slice(0, 10)
    : null,
  status: String(row.status ?? ""),
 }
}

async function fetchEnrollmentsForConsumedPricing(
 studentIds: string[],
 classIds: string[]
): Promise<Map<string, EnrollmentForConsumedPrice[]>> {
 const map = new Map<string, EnrollmentForConsumedPrice[]>()
 if (!supabase || studentIds.length === 0 || classIds.length === 0) return map

 const selectWithWithdraw =
  "student_id, class_id, enrollment_period, enroll_date, withdraw_effective_date, status"
 const selectWithoutWithdraw =
  "student_id, class_id, enrollment_period, enroll_date, status"

 await forEachIdChunk(studentIds, DEFAULT_ID_CHUNK, async (studentSlice) => {
  await forEachIdChunk(classIds, DEFAULT_ID_CHUNK, async (classSlice) => {
   let rows: Record<string, unknown>[] = []
   const first = await supabase!
    .from("student_class_enrollments")
    .select(selectWithWithdraw)
    .in("student_id", studentSlice)
    .in("class_id", classSlice)
   if (first.error) {
    // production 可能尚未上 withdraw_effective_date migration
    const second = await supabase!
     .from("student_class_enrollments")
     .select(selectWithoutWithdraw)
     .in("student_id", studentSlice)
     .in("class_id", classSlice)
    if (second.error) {
     console.warn("[fetchEnrollmentsForConsumedPricing]", second.error.message)
     return
    }
    rows = (second.data ?? []) as Record<string, unknown>[]
   } else {
    rows = (first.data ?? []) as Record<string, unknown>[]
   }
   for (const row of rows) {
    const mapped = mapEnrollmentRow(row)
    const key = enrollmentPairKey(mapped.studentId, mapped.classId)
    const list = map.get(key) ?? []
    list.push(mapped)
    map.set(key, list)
   }
  })
 })

 return map
}

/** 已收款明細 → 有效單堂價（amount ÷ lesson_count） */
export async function fetchPaidUnitPriceMaps(
 studentIds: string[],
 classIds: string[]
): Promise<{ byPair: Map<string, number>; byClass: Map<string, number> }> {
 const byPair = new Map<string, number>()
 const byClass = new Map<string, number>()
 if (!supabase || classIds.length === 0) return { byPair, byClass }

 const pairSum = new Map<string, { amount: number; lessons: number }>()
 const classSum = new Map<string, { amount: number; lessons: number }>()
 const studentAllow = new Set(studentIds)

 await forEachIdChunk(classIds, DEFAULT_ID_CHUNK, async (classSlice) => {
  const pageSize = 1000
  for (let from = 0; ; from += pageSize) {
   const { data, error } = await supabase!
    .from("payment_details")
    .select("class_id, lesson_count, amount, payments!inner ( student_id, status )")
    .in("class_id", classSlice)
    .eq("payments.status", PAYMENT_STATUS.received)
    .order("id", { ascending: true })
    .range(from, from + pageSize - 1)
   if (error) {
    console.warn("[fetchPaidUnitPriceMaps]", error.message)
    return
   }
   const chunk = (data ?? []) as Record<string, unknown>[]
   for (const row of chunk) {
    const classId = row.class_id != null ? String(row.class_id) : ""
    if (!classId) continue
    const lessons = Number(row.lesson_count ?? 0)
    const amount = Number(row.amount ?? 0)
    if (!(lessons > 0) || !(amount > 0) || !Number.isFinite(lessons) || !Number.isFinite(amount)) {
     continue
    }
    const pay = asRecord(row.payments)
    const studentId = pay?.student_id != null ? String(pay.student_id) : ""
    const cEntry = classSum.get(classId) ?? { amount: 0, lessons: 0 }
    cEntry.amount += amount
    cEntry.lessons += lessons
    classSum.set(classId, cEntry)
    if (studentId && studentAllow.has(studentId)) {
     const key = enrollmentPairKey(studentId, classId)
     const pEntry = pairSum.get(key) ?? { amount: 0, lessons: 0 }
     pEntry.amount += amount
     pEntry.lessons += lessons
     pairSum.set(key, pEntry)
    }
   }
   if (chunk.length < pageSize) break
  }
 })

 for (const [key, s] of pairSum) {
  if (s.lessons > 0) byPair.set(key, Math.round((s.amount / s.lessons) * 100) / 100)
 }
 for (const [classId, s] of classSum) {
  if (s.lessons > 0) byClass.set(classId, Math.round((s.amount / s.lessons) * 100) / 100)
 }
 return { byPair, byClass }
}

export async function sumConsumedLessonValue(
 from: string,
 to: string,
 opts: { classKind: ClassKindFilter; teacherIds: string[] }
): Promise<{ value: number; lessonCount: number; zeroPriceLessons: number }> {
 if (!supabase) return { value: 0, lessonCount: 0, zeroPriceLessons: 0 }

 let value = 0
 let lessonCount = 0
 let zeroPriceLessons = 0
 const pageSize = 1000
 for (let offset = 0; ; offset += pageSize) {
  let q = supabase
   .from("attendance_details")
   .select(
    "id, status, student_id, class_id, attendance_date, classes!inner ( class_kind, teacher_id, price_per_lesson, courses ( price_per_lesson, price_per_lesson_period_2, price_per_lesson_both_periods ) )"
   )
   .gte("attendance_date", from)
   .lte("attendance_date", to)
   .order("id", { ascending: true })
   .range(offset, offset + pageSize - 1)

  if (opts.classKind === "group" || opts.classKind === "private") {
   q = q.eq("classes.class_kind", opts.classKind)
  }
  if (opts.teacherIds.length > 0) {
   q = q.in("classes.teacher_id", opts.teacherIds)
  }

  const { data, error } = await q
  if (error) {
   console.warn("[sumConsumedLessonValue]", error.message)
   break
  }
  const chunk = (data ?? []) as Record<string, unknown>[]
  const billable = chunk.filter((row) => isBillableAttendanceStatus(String(row.status ?? "")))
  if (billable.length > 0) {
   const studentIds = [...new Set(billable.map((r) => String(r.student_id)))]
   const classIds = [...new Set(billable.map((r) => String(r.class_id)))]
   const [enrollmentsByPair, paidMaps] = await Promise.all([
    fetchEnrollmentsForConsumedPricing(studentIds, classIds),
    fetchPaidUnitPriceMaps(studentIds, classIds),
   ])

   for (const row of billable) {
    const studentId = String(row.student_id)
    const classId = String(row.class_id)
    const attendanceYmd = String(row.attendance_date ?? "").slice(0, 10)
    const enr = pickEnrollmentForAttendance(
     enrollmentsByPair.get(enrollmentPairKey(studentId, classId)) ?? [],
     attendanceYmd
    )
    const prices = coursePricesFromClassEmbed(asRecord(row.classes))
    const pairKey = enrollmentPairKey(studentId, classId)
    const paidUnitFallback =
     paidMaps.byPair.get(pairKey) ?? paidMaps.byClass.get(classId) ?? null
    const unit = unitPriceForConsumedLesson({
     enrollmentPeriod: enr?.enrollmentPeriod ?? null,
     classPriceOverride: prices.classPriceOverride,
     coursePrices: prices.coursePrices,
     paidUnitFallback,
    })
    value += unit
    lessonCount += 1
    if (unit <= 0) zeroPriceLessons += 1
   }
  }
  if (chunk.length < pageSize) break
 }

 return {
  value: Math.round(value * 100) / 100,
  lessonCount,
  zeroPriceLessons,
 }
}

async function fetchRevenueSeries(from: string, to: string): Promise<{ label: string; amount: number }[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("payments")
  .select("payment_date, total_amount")
  .eq("status", PAYMENT_STATUS.received)
  .gte("payment_date", from)
  .lte("payment_date", to)
  .limit(2000)
 if (error) throw error

 const map = new Map<string, number>()
 for (const row of data ?? []) {
  const ymd = String((row as { payment_date?: unknown }).payment_date ?? "").slice(0, 10)
  if (!ymd) continue
  const key = monthKeyFromYmd(ymd)
  const n = Number((row as { total_amount?: unknown }).total_amount ?? 0)
  map.set(key, (map.get(key) ?? 0) + (Number.isNaN(n) ? 0 : n))
 }

 const keys = [...map.keys()].sort()
 if (keys.length === 0) {
  // 至少填滿篩選區間內的月份軸
  const start = monthKeyFromYmd(from)
  const end = monthKeyFromYmd(to)
  const cursor = parseYmd(`${start}-01`)
  const endDt = parseYmd(`${end}-01`)
  const out: { label: string; amount: number }[] = []
  while (cursor <= endDt) {
   const ym = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`
   out.push({ label: monthLabel(ym), amount: 0 })
   cursor.setMonth(cursor.getMonth() + 1)
  }
  return out
 }
 return keys.map((ym) => ({ label: monthLabel(ym), amount: map.get(ym) ?? 0 }))
}

async function fetchUnpaidAlerts(limit = 30): Promise<UnpaidAlertRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("payments")
  .select("id, payment_date, total_amount, status, students ( full_name )")
  .or(`status.eq.${PAYMENT_STATUS.pendingPay},status.eq.${PAYMENT_STATUS.pendingReceive}`)
  .order("payment_date", { ascending: true })
  .limit(limit)
 if (error) throw error
 return (data ?? []).map((row) => {
  const r = row as Record<string, unknown>
  const st = asRecord(r.students)
  return {
   id: String(r.id),
   studentName: st?.full_name != null ? String(st.full_name) : "—",
   paymentDate: String(r.payment_date ?? "").slice(0, 10),
   amount: Number(r.total_amount ?? 0),
   status: String(r.status ?? ""),
  }
 })
}

type ClassFillMeta = {
 id: string
 label: string
 capacity: number | null
 teacherId: string | null
 classKind: string
}

async function fetchClassesWithCapacity(filters: MgmtDashboardFilters): Promise<ClassFillMeta[]> {
 if (!supabase) return []
 const pageSize = 1000
 const all: ClassFillMeta[] = []
 for (let from = 0; ; from += pageSize) {
  let q = supabase
   .from("classes")
   .select(
    "id, subject, course_code_full, capacity, teacher_id, class_kind, courses ( course_name )"
   )
   .order("id", { ascending: true })
   .range(from, from + pageSize - 1)
  if (filters.classKind === "group" || filters.classKind === "private") {
   q = q.eq("class_kind", filters.classKind)
  }
  if (filters.teacherIds.length > 0) {
   q = q.in("teacher_id", filters.teacherIds)
  }
  const { data, error } = await q
  if (error) throw error
  const chunk = (data ?? []) as Record<string, unknown>[]
  for (const row of chunk) {
   const course = asRecord(row.courses)
   all.push({
    id: String(row.id),
    label: formatClassLabel({
     subject: row.subject != null ? String(row.subject) : "",
     courseCode: row.course_code_full != null ? String(row.course_code_full) : "",
     courseName: course?.course_name != null ? String(course.course_name) : null,
    }),
    capacity: row.capacity != null ? Number(row.capacity) : null,
    teacherId: row.teacher_id != null ? String(row.teacher_id) : null,
    classKind: row.class_kind != null ? String(row.class_kind) : "group",
   })
  }
  if (chunk.length < pageSize) break
 }
 return all
}

async function fetchActiveEnrollmentCounts(
 classIds: string[]
): Promise<Map<string, number>> {
 const byClass = new Map<string, number>()
 if (!supabase || classIds.length === 0) return byClass
 await forEachIdChunk(classIds, DEFAULT_ID_CHUNK, async (slice) => {
  const pageSize = 1000
  for (let from = 0; ; from += pageSize) {
   const { data, error } = await supabase!
    .from("student_class_enrollments")
    .select("id, class_id")
    .eq("status", "就讀中")
    .in("class_id", slice)
    .order("id", { ascending: true })
    .range(from, from + pageSize - 1)
   if (error) throw error
   const chunk = (data ?? []) as Record<string, unknown>[]
   for (const row of chunk) {
    const classId = String(row.class_id)
    byClass.set(classId, (byClass.get(classId) ?? 0) + 1)
   }
   if (chunk.length < pageSize) break
  }
 })
 return byClass
}

function buildKpis(input: {
 revenue: number
 prevRevenue: number
 consumedValue: number
 prevConsumedValue: number
 consumedLessons: number
 zeroPriceLessons: number
 unpaidAmount: number
 enroll: number
 prevEnroll: number
 withdraw: number
 prevWithdraw: number
 enrolledStudents: number
 lessonGapCount: number
}): KpiCardModel[] {
 const consumedHint =
  input.zeroPriceLessons > 0
   ? `共 ${input.consumedLessons.toLocaleString("en-HK")} 堂（${input.zeroPriceLessons} 堂缺單價）`
   : `共 ${input.consumedLessons.toLocaleString("en-HK")} 堂`
 return [
  {
   id: "revenue",
   label: "已收款",
   value: input.revenue,
   format: "hkd",
   deltaPct: deltaPct(input.revenue, input.prevRevenue),
   tone: "success",
  },
  {
   id: "consumed",
   label: "消堂價值",
   value: input.consumedValue,
   format: "hkd",
   deltaPct: deltaPct(input.consumedValue, input.prevConsumedValue),
   tone: input.zeroPriceLessons > 0 ? "warning" : "default",
   hint: consumedHint,
  },
  {
   id: "receivable",
   label: "應收未收",
   value: input.unpaidAmount,
   format: "hkd",
   deltaPct: null,
   tone: input.unpaidAmount > 0 ? "warning" : "default",
  },
  {
   id: "enroll",
   label: "新報讀",
   value: input.enroll,
   format: "count",
   deltaPct: deltaPct(input.enroll, input.prevEnroll),
   tone: "success",
  },
  {
   id: "withdraw",
   label: "退讀",
   value: input.withdraw,
   format: "count",
   deltaPct: deltaPct(input.withdraw, input.prevWithdraw),
   tone: input.withdraw > 0 ? "destructive" : "default",
  },
  {
   id: "enrolled",
   label: "在讀學生",
   value: input.enrolledStudents,
   format: "count",
   deltaPct: null,
   tone: "default",
  },
  {
   id: "lessonGap",
   label: "堂數待跟進",
   value: input.lessonGapCount,
   format: "count",
   deltaPct: null,
   tone: input.lessonGapCount > 0 ? "warning" : "default",
  },
 ]
}

export function defaultMgmtDashboardFilters(): MgmtDashboardFilters {
 const now = new Date()
 const dateFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
 const dateTo = localYmd(now)
 return { dateFrom, dateTo, classKind: "all", teacherIds: [] }
}

export async function fetchMgmtDashboard(
 filters: MgmtDashboardFilters
): Promise<MgmtDashboardPayload> {
 if (!isSupabaseConfigured || !supabase) {
  return buildMgmtDashboardMock()
 }

 const prev = previousPeriod(filters)
 const eventFilter = { classKind: filters.classKind, teacherIds: filters.teacherIds }

 const [
  revenue,
  prevRevenue,
  consumed,
  prevConsumed,
  unpaid,
  enroll,
  prevEnroll,
  withdraw,
  prevWithdraw,
  trials,
  overall,
  enrollmentReport,
  revenueSeries,
  unpaidAlerts,
  lessonGapsRaw,
  classesMeta,
 ] = await Promise.all([
  sumPaidAmount(filters.dateFrom, filters.dateTo),
  sumPaidAmount(prev.dateFrom, prev.dateTo),
  sumConsumedLessonValue(filters.dateFrom, filters.dateTo, eventFilter),
  sumConsumedLessonValue(prev.dateFrom, prev.dateTo, eventFilter),
  sumUnpaidAmount(),
  countEnrollmentEvents("enroll", filters.dateFrom, filters.dateTo, eventFilter),
  countEnrollmentEvents("enroll", prev.dateFrom, prev.dateTo, eventFilter),
  countEnrollmentEvents("withdraw", filters.dateFrom, filters.dateTo, eventFilter),
  countEnrollmentEvents("withdraw", prev.dateFrom, prev.dateTo, eventFilter),
  countTrials(filters.dateFrom, filters.dateTo),
  fetchOverallStudentAnalysis(),
  fetchEnrollmentReport({ academicYearId: "", classKind: filters.classKind }),
  fetchRevenueSeries(filters.dateFrom, filters.dateTo),
  fetchUnpaidAlerts(),
  fetchMisalignedLessonBalances(),
  fetchClassesWithCapacity(filters),
 ])

 const lessonGaps = lessonGapsRaw.filter(isLessonBalanceNeedsFollowUp).slice(0, 40)
 const enrollCounts = await fetchActiveEnrollmentCounts(classesMeta.map((c) => c.id))

 const classFill = classesMeta
  .map((c) => {
   const enrolled = enrollCounts.get(c.id) ?? 0
   const fillPct =
    c.capacity != null && c.capacity > 0
     ? Math.round((enrolled / c.capacity) * 1000) / 10
     : null
   return {
    classId: c.id,
    label: c.label,
    enrolled,
    capacity: c.capacity,
    fillPct,
   }
  })
  .filter((c) => c.enrolled > 0 || (c.capacity != null && c.capacity > 0))
  .sort((a, b) => (b.fillPct ?? -1) - (a.fillPct ?? -1))
  .slice(0, 40)

 const nearFullClasses: NearFullClassRow[] = classFill
  .filter(
   (c): c is typeof c & { capacity: number; fillPct: number } =>
    c.capacity != null && c.capacity > 0 && c.fillPct != null && c.fillPct >= 90
  )
  .map((c) => ({
   classId: c.classId,
   label: c.label,
   enrolled: c.enrolled,
   capacity: c.capacity,
   fillPct: c.fillPct,
  }))
  .slice(0, 20)

 let byTeacher = enrollmentReport.teachers.map((t) => ({
  teacherId: t.teacherId ?? t.teacherName,
  name: t.teacherName,
  enrollmentCount: t.enrollmentCount,
 }))
 if (filters.teacherIds.length > 0) {
  const allow = new Set(filters.teacherIds)
  byTeacher = byTeacher.filter((t) => allow.has(t.teacherId))
 }

 const byClassKindMap = new Map<string, number>()
 for (const row of enrollmentReport.classes) {
  if (filters.teacherIds.length > 0) {
   const meta = classesMeta.find((c) => c.id === row.classId)
   if (!meta || !meta.teacherId || !filters.teacherIds.includes(meta.teacherId)) continue
  }
  const label = row.classKind === "private" ? "一對一" : "小組"
  byClassKindMap.set(label, (byClassKindMap.get(label) ?? 0) + row.studentCount)
 }

 const kpis = buildKpis({
  revenue,
  prevRevenue,
  consumedValue: consumed.value,
  prevConsumedValue: prevConsumed.value,
  consumedLessons: consumed.lessonCount,
  zeroPriceLessons: consumed.zeroPriceLessons,
  unpaidAmount: unpaid.amount,
  enroll,
  prevEnroll,
  withdraw,
  prevWithdraw,
  enrolledStudents: overall.enrolledStudents,
  lessonGapCount: lessonGapsRaw.filter(isLessonBalanceNeedsFollowUp).length,
 })

 return {
  kpis,
  revenueSeries,
  funnel: [
   { stage: "試堂", count: trials },
   { stage: "新報讀", count: enroll },
   { stage: "在讀", count: overall.enrolledStudents },
  ],
  distribution: {
   bySubject: enrollmentReport.subjects
    .map((s) => ({ label: s.subjectName, count: s.enrollmentCount }))
    .slice(0, 12),
   byClassKind: [...byClassKindMap.entries()].map(([label, count]) => ({ label, count })),
   statusBuckets: overall.buckets,
   classFill,
   byTeacher: byTeacher.slice(0, 20),
  },
  alerts: {
   unpaid: unpaidAlerts,
   lessonGaps,
   nearFullClasses,
  },
 }
}

export function exportMgmtDashboardCsv(payload: MgmtDashboardPayload, filters: MgmtDashboardFilters): string {
 const lines: string[] = []
 const cell = (v: string | number) => {
  const s = String(v)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
 }
 lines.push(["篩選起日", "篩選迄日", "課種", "導師數"].map(cell).join(","))
 lines.push(
  [
   filters.dateFrom,
   filters.dateTo,
   filters.classKind === "private" ? "一對一" : filters.classKind === "group" ? "小組" : "全部",
   filters.teacherIds.length,
  ]
   .map(cell)
   .join(",")
 )
 lines.push("")
 lines.push(["KPI", "數值", "環比%"].map(cell).join(","))
 for (const k of payload.kpis) {
  lines.push([k.label, k.value, k.deltaPct ?? ""].map(cell).join(","))
 }
 lines.push("")
 lines.push(["月份", "已收款"].map(cell).join(","))
 for (const r of payload.revenueSeries) {
  lines.push([r.label, r.amount].map(cell).join(","))
 }
 lines.push("")
 lines.push(["漏斗階段", "人數"].map(cell).join(","))
 for (const f of payload.funnel) {
  lines.push([f.stage, f.count].map(cell).join(","))
 }
 lines.push("")
 lines.push(["待繳費學生", "日期", "金額", "狀態"].map(cell).join(","))
 for (const u of payload.alerts.unpaid) {
  lines.push([u.studentName, u.paymentDate, u.amount, u.status].map(cell).join(","))
 }
 return lines.join("\n")
}

export function downloadMgmtDashboardCsv(filename: string, csvBody: string): void {
 const blob = new Blob([`\uFEFF${csvBody}`], { type: "text/csv;charset=utf-8" })
 const url = URL.createObjectURL(blob)
 const a = document.createElement("a")
 a.href = url
 a.download = filename
 a.click()
 URL.revokeObjectURL(url)
}
