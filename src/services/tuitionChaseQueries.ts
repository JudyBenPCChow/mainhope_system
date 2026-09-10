/**
 * 學費追收清單：在讀生按已繳堂數組別，以尚餘對本期還會扣／下期會扣算出要交堂數。
 * 期＝常規第 N 期（附件甲），不是曆月。
 * 專科計堂以 active 宣告為準（單堂／中途報讀／調堂）；私人課程無宣告則用該班排程。
 */
import { isBillableAttendanceStatus } from "@/lib/attendanceBilling"
import { classDisplayName } from "@/lib/courseLabel"
import {
 resolveEntitlementNamespace,
 type EntitlementNamespace,
} from "@/lib/entitlementNamespace"
import { listCurrentEnrollmentYearLabels } from "@/lib/enrollmentYearDisplay"
import { isHomeworkPaymentDetailSkipLessons } from "@/lib/homeworkTutoringFees"
import { isHomeworkClassKind } from "@/lib/privateClassKind"
import {
 getSpecialistTuitionPeriod,
 resolveSpecialistTuitionPeriods,
 specialistTuitionPeriodDateSet,
 type SpecialistTuitionPeriod,
} from "@/lib/specialistTuitionPeriods"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import { supabase } from "@/lib/supabaseClient"
import {
 chaseDeclarationAppliesToPool,
 classifyChaseSchedule,
 paymentDetailMatchesPool,
 type ChaseAttendanceMark,
 type ChaseDeclarationPoolRef,
} from "@/lib/tuitionChaseDetail"
import {
 indexEntitlementPoolRemainings,
 lookupTuitionChaseRemaining,
 tuitionChaseYearPoolKey,
 type EntitlementPoolRemainingRow,
} from "@/lib/tuitionChaseRemaining"
import {
 tuitionChaseDueFromInventory,
 tuitionChaseQueueStatus,
 type TuitionChaseQueueStatus,
} from "@/lib/tuitionChaseDue"
import {
 sortTuitionChaseEnrolledClasses,
 tuitionChasePoolLabel,
 type TuitionChaseEnrolledClass,
} from "@/lib/tuitionChaseLabels"
import { todayYmdLocal } from "@/lib/weekdayUtils"
import { PAYMENT_STATUS } from "@/services/paymentQueries"
import { isTrialPaymentDetailDescription } from "@/services/trialQueries"

export type TuitionChasePeriodRef = Pick<SpecialistTuitionPeriod, "index" | "label" | "from" | "to">

export type TuitionChasePoolRow = {
 poolKey: string
 studentId: string
 academicYearId: string
 namespace: EntitlementNamespace
 label: string
 classIds: string[]
 classes: TuitionChaseEnrolledClass[]
 remainingKnown: boolean
 remainingLessons: number
 thisPeriodPendingUnits: number
 thisPeriodDeductedUnits: number
 thisPeriodNondeductUnits: number
 thisPeriodDueLessons: number
 remainingAfterThisPeriod: number
 nextPeriodUnits: number
 nextPeriodDueLessons: number
 suggestedLessons: number
}

export type TuitionChaseStudentRow = {
 studentId: string
 studentCode: string | null
 studentName: string
 englishName: string | null
 grade: string | null
 pools: TuitionChasePoolRow[]
 remainingKnown: boolean
 remainingLessons: number
 thisPeriodPendingUnits: number
 thisPeriodDeductedUnits: number
 thisPeriodNondeductUnits: number
 thisPeriodDueLessons: number
 nextPeriodUnits: number
 nextPeriodDueLessons: number
 suggestedLessons: number
 status: TuitionChaseQueueStatus
}

export type TuitionChaseListResult = {
 rows: TuitionChaseStudentRow[]
 hiddenOlderCount: number
 opsYearLabels: string[]
 currentPeriod: TuitionChasePeriodRef | null
 nextPeriod: TuitionChasePeriodRef | null
}

function toPeriodRef(p: SpecialistTuitionPeriod | null): TuitionChasePeriodRef | null {
 if (!p) return null
 return { index: p.index, label: p.label, from: p.from, to: p.to }
}

export type TuitionChasePaymentLine = {
 paymentId: string
 receiptNumber: string | null
 paymentDate: string
 classLabel: string
 lessonCount: number
 amount: number | null
 description: string | null
}

export type TuitionChaseScheduleLine = {
 scheduleId: string
 classId: string
 classLabel: string
 scheduledDate: string
 startTime: string | null
 endTime: string | null
 units: number
 attendanceStatus: string | null
}

export type TuitionChasePoolDetail = {
 poolKey: string
 payments: TuitionChasePaymentLine[]
 deducted: TuitionChaseScheduleLine[]
 thisPeriodPending: TuitionChaseScheduleLine[]
 nextPeriod: TuitionChaseScheduleLine[]
 thisPeriodNondeduct: TuitionChaseScheduleLine[]
}

function lessonUnits(slots: number | null | undefined): number {
 return Number(slots) === 2 ? 2 : 1
}

/** PostgREST 預設每響應最多 1000 列；父層 `.in(id)` 分塊不夠。 */
const POSTGREST_PAGE_SIZE = 1000

 type ActiveEnrollment = {
 studentId: string
 classId: string
 academicYearId: string | null
 academicYearLabel: string | null
 studentCode: string | null
 studentName: string
 englishName: string | null
 grade: string | null
 classKind: string | null
 classLabel: string
 courseCode: string | null
 className: string
 namespace: EntitlementNamespace
}

async function fetchActiveNonHomeworkEnrollments(
 studentId?: string
): Promise<ActiveEnrollment[]> {
 if (!supabase) return []
 const pageSize = POSTGREST_PAGE_SIZE
 const raw: Record<string, unknown>[] = []
 for (let from = 0; ; from += pageSize) {
  let q = supabase
   .from("student_class_enrollments")
   .select(
    "id, student_id, class_id, students ( student_code, full_name, english_name, grade ), classes ( subject, class_kind, grade, academic_year_id, course_code_full, academic_years ( label ), courses ( course_name, grade_code ) )"
   )
   .eq("status", "就讀中")
   .order("id", { ascending: true })
   .range(from, from + pageSize - 1)
  if (studentId) q = q.eq("student_id", studentId)
  const { data, error } = await q
  if (error) throw error
  const chunk = (data ?? []) as Record<string, unknown>[]
  raw.push(...chunk)
  if (chunk.length < pageSize) break
 }

 const out: ActiveEnrollment[] = []
 for (const row of raw) {
  const cls = row.classes as Record<string, unknown> | null
  if (!cls) continue
  const classKind = cls.class_kind != null ? String(cls.class_kind) : null
  if (isHomeworkClassKind(classKind)) continue
  const course = cls.courses as Record<string, unknown> | null
  const year = cls.academic_years as Record<string, unknown> | null
  const classId = row.class_id != null ? String(row.class_id) : ""
  const studentId = row.student_id != null ? String(row.student_id) : ""
  if (!classId || !studentId) continue

  const gradeRaw = cls.grade
  const gradeArr = Array.isArray(gradeRaw) ? gradeRaw.map((g) => String(g)) : null
  const ns = resolveEntitlementNamespace({
   classId,
   classKind,
   subject: cls.subject != null ? String(cls.subject) : null,
   courseName: course?.course_name != null ? String(course.course_name) : null,
   grade: gradeArr,
   gradeCode: course?.grade_code != null ? String(course.grade_code) : null,
   isTrial: false,
  })
  if (ns.courseGroup === "homework" || ns.courseGroup === "trial") continue

  const st = row.students as Record<string, unknown> | null
  const studentName =
   st?.full_name != null && String(st.full_name).trim()
    ? String(st.full_name).trim()
    : st?.english_name != null && String(st.english_name).trim()
      ? String(st.english_name).trim()
      : "（未命名）"
  const subject = cls.subject != null ? String(cls.subject).trim() : ""
  const courseName =
   course?.course_name != null && String(course.course_name).trim()
    ? String(course.course_name).trim()
    : ""
  const courseCodeRaw = cls.course_code_full != null ? String(cls.course_code_full).trim() : ""

  out.push({
   studentId,
   classId,
   academicYearId: cls.academic_year_id != null ? String(cls.academic_year_id) : null,
   academicYearLabel: year?.label != null ? String(year.label).trim() || null : null,
   studentCode: st?.student_code != null ? String(st.student_code) : null,
   studentName,
   englishName: st?.english_name != null ? String(st.english_name) : null,
   grade: st?.grade != null ? String(st.grade) : null,
   classKind,
   classLabel: subject || courseName,
   courseCode: courseCodeRaw || null,
   className: classDisplayName({ subject, courseName }),
   namespace: ns,
  })
 }
 return out
}

async function fetchAcademicYearRows(): Promise<
 { id: string; label: string; start_date: string | null; end_date: string | null; is_current: boolean }[]
> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("academic_years")
  .select("id, label, start_date, end_date, is_current")
 if (error) throw error
 return (data ?? []).map((r) => {
  const row = r as Record<string, unknown>
  return {
   id: String(row.id ?? ""),
   label: String(row.label ?? "").trim(),
   start_date: row.start_date != null ? String(row.start_date).slice(0, 10) : null,
   end_date: row.end_date != null ? String(row.end_date).slice(0, 10) : null,
   is_current: Boolean(row.is_current),
  }
 })
}

function isMetricYearEnrollment(
 e: Pick<ActiveEnrollment, "classKind" | "academicYearLabel">,
 currentYearLabels: ReadonlySet<string>
): boolean {
 if (e.classKind === "private") return true
 const label = (e.academicYearLabel ?? "").trim()
 return Boolean(label) && currentYearLabels.has(label)
}

type ScheduleUnit = {
 id: string
 classId: string
 scheduledDate: string
 units: number
}

async function fetchClassLessonUnits(classIds: string[]): Promise<Map<string, number>> {
 const out = new Map<string, number>()
 if (!supabase || classIds.length === 0) return out
 await forEachIdChunk(classIds, DEFAULT_ID_CHUNK, async (slice) => {
  const { data, error } = await supabase!
   .from("classes")
   .select("id, lesson_slots_per_session")
   .in("id", slice)
  if (error) throw error
  for (const raw of data ?? []) {
   const row = raw as { id?: string; lesson_slots_per_session?: number | null }
   const id = String(row.id ?? "")
   if (!id) continue
   out.set(id, lessonUnits(row.lesson_slots_per_session))
  }
 })
 return out
}

async function fetchScheduleUnitsInRange(
 classIds: string[],
 from: string,
 to: string,
 unitsByClass: ReadonlyMap<string, number>
): Promise<ScheduleUnit[]> {
 const out: ScheduleUnit[] = []
 if (!supabase || classIds.length === 0) return out
 await forEachIdChunk(classIds, DEFAULT_ID_CHUNK, async (slice) => {
  const { data, error } = await supabase!
   .from("schedules")
   .select("id, class_id, scheduled_date, status")
   .in("class_id", slice)
   .gte("scheduled_date", from)
   .lte("scheduled_date", to)
  if (error) throw error
  for (const raw of data ?? []) {
   const row = raw as { id?: string; class_id?: string; scheduled_date?: string; status?: string }
   const id = String(row.id ?? "")
   const classId = String(row.class_id ?? "")
   if (!id || !classId) continue
   if (String(row.status ?? "").includes("取消")) continue
   out.push({
    id,
    classId,
    scheduledDate: String(row.scheduled_date ?? "").slice(0, 10),
    units: unitsByClass.get(classId) ?? 1,
   })
  }
 })
 return out
}

type AttendanceMark = ChaseAttendanceMark

type ChaseDeclarationUnit = {
 studentId: string
 scheduleId: string
 classId: string
 scheduledDate: string
 sourceEventType: string | null
 pool: ChaseDeclarationPoolRef | null
 startTime: string | null
 endTime: string | null
}

function embedOne(rel: unknown): Record<string, unknown> | null {
 if (rel == null) return null
 if (Array.isArray(rel)) {
  const first = rel[0]
  return first && typeof first === "object" ? (first as Record<string, unknown>) : null
 }
 if (typeof rel === "object") return rel as Record<string, unknown>
 return null
}

type ParsedChaseDeclaration = Omit<ChaseDeclarationUnit, "pool"> & { poolId: string | null }

function parseChaseDeclarationRow(
 raw: Record<string, unknown>,
 from: string,
 to: string
): ParsedChaseDeclaration | null {
 const studentId = String(raw.student_id ?? "")
 const sched = embedOne(raw.schedules)
 if (!studentId || !sched) return null
 if (String(sched.status ?? "").includes("取消")) return null
 const scheduledDate = String(sched.scheduled_date ?? "").slice(0, 10)
 if (!scheduledDate || scheduledDate < from || scheduledDate > to) return null
 const classId = String(sched.class_id ?? "")
 const scheduleId = String(sched.id ?? raw.schedule_id ?? "")
 if (!classId || !scheduleId) return null
 const start = sched.start_time != null ? String(sched.start_time).slice(0, 5) : null
 const end = sched.end_time != null ? String(sched.end_time).slice(0, 5) : null
 const poolId = raw.pool_id != null ? String(raw.pool_id) : ""
 return {
  studentId,
  scheduleId,
  classId,
  scheduledDate,
  sourceEventType: raw.source_event_type != null ? String(raw.source_event_type) : null,
  poolId: poolId || null,
  startTime: start && start !== "" ? start : null,
  endTime: end && end !== "" ? end : null,
 }
}

async function fetchChaseDeclarationPools(
 poolIds: string[]
): Promise<Map<string, ChaseDeclarationPoolRef>> {
 const out = new Map<string, ChaseDeclarationPoolRef>()
 const ids = [...new Set(poolIds.filter(Boolean))]
 if (!supabase || ids.length === 0) return out
 await forEachIdChunk(ids, DEFAULT_ID_CHUNK, async (slice) => {
  const { data, error } = await supabase!
   .from("student_entitlement_pools")
   .select("id, student_id, academic_year_id, course_group, namespace_key")
   .in("id", slice)
  if (error) throw error
  for (const raw of data ?? []) {
   const row = raw as Record<string, unknown>
   const id = String(row.id ?? "")
   if (!id) continue
   out.set(id, {
    studentId: row.student_id != null ? String(row.student_id) : "",
    academicYearId: row.academic_year_id != null ? String(row.academic_year_id) : null,
    courseGroup: String(row.course_group ?? ""),
    namespaceKey: String(row.namespace_key ?? ""),
   })
  }
 })
 return out
}

/**
 * 專科追收計堂用的 active 宣告。
 * 必須用 `schedules!inner` 把日期窗濾在 SQL：全年 active 約三千列，若只 `.in(student_id)`
 * 再嵌套排程／池，PostgREST＋RLS（has_capability）會 statement timeout。
 * 仍要 `.order(id)` + `.range`：兩期合計仍可能超過 1000 列。
 */
async function fetchActiveChaseDeclarations(
 studentIds: string[],
 from: string,
 to: string
): Promise<ChaseDeclarationUnit[]> {
 const parsed: ParsedChaseDeclaration[] = []
 if (!supabase || studentIds.length === 0) return []
 await forEachIdChunk(studentIds, DEFAULT_ID_CHUNK, async (slice) => {
  for (let start = 0; ; start += POSTGREST_PAGE_SIZE) {
   const { data, error } = await supabase!
    .from("attendance_declarations")
    .select(
     "student_id, schedule_id, source_event_type, pool_id, schedules!inner ( id, class_id, scheduled_date, start_time, end_time, status )"
    )
    .in("student_id", slice)
    .eq("status", "active")
    .gte("schedules.scheduled_date", from)
    .lte("schedules.scheduled_date", to)
    .order("id", { ascending: true })
    .range(start, start + POSTGREST_PAGE_SIZE - 1)
   if (error) throw error
   const chunk = (data ?? []) as Record<string, unknown>[]
   for (const raw of chunk) {
    const row = parseChaseDeclarationRow(raw, from, to)
    if (row) parsed.push(row)
   }
   if (chunk.length < POSTGREST_PAGE_SIZE) break
  }
 })
 const pools = await fetchChaseDeclarationPools(parsed.map((d) => d.poolId ?? ""))
 return parsed.map((d) => {
  const { poolId, ...rest } = d
  return {
   ...rest,
   pool: poolId ? pools.get(poolId) ?? null : null,
  }
 })
}

async function fetchAttendanceMarksByStudentSchedule(
 studentIds: string[],
 from: string,
 to: string
): Promise<Map<string, AttendanceMark>> {
 const out = new Map<string, AttendanceMark>()
 if (!supabase || studentIds.length === 0) return out
 await forEachIdChunk(studentIds, DEFAULT_ID_CHUNK, async (slice) => {
  const { data, error } = await supabase!
   .from("attendance_details")
   .select("student_id, schedule_id, status")
   .in("student_id", slice)
   .gte("attendance_date", from)
   .lte("attendance_date", to)
   .not("schedule_id", "is", null)
  if (error) throw error
  for (const raw of data ?? []) {
   const r = raw as { student_id?: string; schedule_id?: string; status?: string }
   const sid = String(r.student_id ?? "")
   const schId = String(r.schedule_id ?? "")
   if (!sid || !schId) continue
   const key = `${sid}|${schId}`
   const status = String(r.status ?? "").trim()
   if (!status) continue
   if (isBillableAttendanceStatus(status)) {
    out.set(key, "billable")
    continue
   }
   if (out.get(key) === "billable") continue
   out.set(key, "nondeduct")
  }
 })
 return out
}

async function fetchRemainingIndex(
 studentIds: string[],
 currentYearIds: ReadonlySet<string>
): Promise<ReturnType<typeof indexEntitlementPoolRemainings>> {
 const rows: EntitlementPoolRemainingRow[] = []
 if (!supabase || studentIds.length === 0) {
  return indexEntitlementPoolRemainings(rows, currentYearIds)
 }
 await forEachIdChunk(studentIds, DEFAULT_ID_CHUNK, async (slice) => {
  const { data, error } = await supabase!
   .from("student_entitlement_pools")
   .select("student_id, academic_year_id, course_group, namespace_key, remaining_lessons, class_id")
   .in("student_id", slice)
  if (error) throw error
  for (const raw of data ?? []) {
   const row = raw as Record<string, unknown>
   const courseGroup = String(row.course_group ?? "")
   if (courseGroup === "homework" || courseGroup === "trial") continue
   const sid = String(row.student_id ?? "")
   const namespaceKey =
    row.namespace_key != null && String(row.namespace_key) !== ""
     ? String(row.namespace_key)
     : row.class_id != null
       ? `class:${String(row.class_id)}`
       : ""
   if (!sid || !namespaceKey) continue
   rows.push({
    studentId: sid,
    academicYearId: row.academic_year_id != null ? String(row.academic_year_id) : null,
    courseGroup,
    namespaceKey,
    remainingLessons: Number(row.remaining_lessons ?? 0),
   })
  }
 })
 return indexEntitlementPoolRemainings(rows, currentYearIds)
}

type PeriodUnitBuckets = {
 pending: number
 deducted: number
 nondeduct: number
}

function emptyPeriodUnitBuckets(): PeriodUnitBuckets {
 return { pending: 0, deducted: 0, nondeduct: 0 }
}

function addPeriodUnit(
 buckets: PeriodUnitBuckets,
 units: number,
 mark: AttendanceMark | undefined,
 countAttendance: boolean
): void {
 if (countAttendance && mark === "billable") buckets.deducted += units
 else if (countAttendance && mark === "nondeduct") buckets.nondeduct += units
 else buckets.pending += units
}

function sumUnitsForClasses(
 schedules: ScheduleUnit[],
 classIds: ReadonlySet<string>
): number {
 let n = 0
 for (const s of schedules) {
  if (classIds.has(s.classId)) n += s.units
 }
 return n
}

function scheduleBucketsForStudent(
 studentId: string,
 schedules: ScheduleUnit[],
 classIds: ReadonlySet<string>,
 attendance: ReadonlyMap<string, AttendanceMark>
): PeriodUnitBuckets {
 const buckets = emptyPeriodUnitBuckets()
 for (const s of schedules) {
  if (!classIds.has(s.classId)) continue
  addPeriodUnit(buckets, s.units, attendance.get(`${studentId}|${s.id}`), true)
 }
 return buckets
}

function declarationBucketsForPool(
 studentId: string,
 declarations: readonly ChaseDeclarationUnit[],
 dateSet: ReadonlySet<string>,
 pool: {
  studentId: string
  academicYearId: string
  namespace: EntitlementNamespace
  classIds: ReadonlySet<string>
 },
 unitsByClass: ReadonlyMap<string, number>,
 attendance?: ReadonlyMap<string, AttendanceMark>
): PeriodUnitBuckets {
 const buckets = emptyPeriodUnitBuckets()
 const seen = new Set<string>()
 const countAttendance = Boolean(attendance)
 for (const d of declarations) {
  if (d.studentId !== studentId) continue
  if (!dateSet.has(d.scheduledDate)) continue
  if (
   !chaseDeclarationAppliesToPool({
    classId: d.classId,
    poolClassIds: pool.classIds,
    sourceEventType: d.sourceEventType,
    declarationPool: d.pool,
    pool,
   })
  ) {
   continue
  }
  if (seen.has(d.scheduleId)) continue
  seen.add(d.scheduleId)
  const mark = attendance?.get(`${studentId}|${d.scheduleId}`)
  addPeriodUnit(buckets, unitsByClass.get(d.classId) ?? 1, mark, countAttendance)
 }
 return buckets
}

/**
 * 在讀生學費追收清單（排除功輔）。
 * 預設名單與全部欄位只計本學年（日曆所屬；常規如 2627）。
 * 「顯示更舊」只擴大名單，不改變欄位學年窗。
 */
export async function fetchTuitionChaseList(opts?: {
 includeOlderYears?: boolean
 /** 只算指定學生（學生詳情／單人抽樣） */
 studentId?: string
 /** 測試用覆蓋「今日」 */
 todayYmd?: string
}): Promise<TuitionChaseListResult> {
 const todayYmd = opts?.todayYmd ?? todayYmdLocal()
 const currentYearLabels = listCurrentEnrollmentYearLabels(todayYmd)
 const primaryYearLabel = currentYearLabels[0] ?? ""
 const { current: currentPeriodFull, next: nextPeriodFull } = resolveSpecialistTuitionPeriods({
  todayYmd,
  academicYearLabel: primaryYearLabel,
 })
 const currentPeriod = toPeriodRef(currentPeriodFull)
 const nextPeriod = toPeriodRef(nextPeriodFull)
 const currentPeriodDates = specialistTuitionPeriodDateSet(currentPeriodFull)
 const nextPeriodDates = specialistTuitionPeriodDateSet(nextPeriodFull)
 const empty: TuitionChaseListResult = {
  rows: [],
  hiddenOlderCount: 0,
  opsYearLabels: [],
  currentPeriod,
  nextPeriod,
 }
 if (!supabase) return empty
 if (!currentPeriodFull && !nextPeriodFull) {
  return { ...empty, opsYearLabels: currentYearLabels }
 }

 const [enrollments, yearRows] = await Promise.all([
  fetchActiveNonHomeworkEnrollments(opts?.studentId?.trim() || undefined),
  fetchAcademicYearRows(),
 ])
 if (enrollments.length === 0) {
  return { ...empty, opsYearLabels: currentYearLabels, currentPeriod, nextPeriod }
 }

 const currentYearLabelSet = new Set(currentYearLabels)
 const currentYearIds = new Set(
  yearRows.filter((y) => currentYearLabelSet.has(y.label)).map((y) => y.id)
 )

 const includeOlder = Boolean(opts?.includeOlderYears)
 let listEnrollments = enrollments
 let hiddenOlderCount = 0

 if (!includeOlder) {
  const kept: ActiveEnrollment[] = []
  const keptStudents = new Set<string>()
  const allStudents = new Set(enrollments.map((e) => e.studentId))
  for (const e of enrollments) {
   const label = (e.academicYearLabel ?? "").trim()
   const inCurrentYear = Boolean(label) && currentYearLabelSet.has(label)
   if (!inCurrentYear && e.classKind !== "private") continue
   kept.push(e)
   keptStudents.add(e.studentId)
  }
  listEnrollments = kept
  hiddenOlderCount = Math.max(0, allStudents.size - keptStudents.size)
 }

 const metricEnrollments = listEnrollments.filter((e) =>
  isMetricYearEnrollment(e, currentYearLabelSet)
 )

 const studentMeta = new Map<
  string,
  Pick<
   TuitionChaseStudentRow,
   "studentId" | "studentCode" | "studentName" | "englishName" | "grade"
  >
 >()
 for (const e of listEnrollments) {
  if (studentMeta.has(e.studentId)) continue
  studentMeta.set(e.studentId, {
   studentId: e.studentId,
   studentCode: e.studentCode,
   studentName: e.studentName,
   englishName: e.englishName,
   grade: e.grade,
  })
 }
 const studentIds = [...studentMeta.keys()]
 if (studentIds.length === 0) {
  return {
   rows: [],
   hiddenOlderCount,
   opsYearLabels: currentYearLabels,
   currentPeriod,
   nextPeriod,
  }
 }

 type PoolAcc = {
  studentId: string
  academicYearId: string
  namespace: EntitlementNamespace
  classIds: string[]
  classLabels: string[]
  enrolledClasses: TuitionChaseEnrolledClass[]
 }
 const poolsByKey = new Map<string, PoolAcc>()
 for (const e of metricEnrollments) {
  const yearId =
   e.academicYearId && currentYearIds.has(e.academicYearId)
    ? e.academicYearId
    : e.classKind === "private" && currentYearIds.size === 1
      ? [...currentYearIds][0]!
      : e.academicYearId
  if (!yearId || !currentYearIds.has(yearId)) continue
  const key = tuitionChaseYearPoolKey(e.studentId, yearId, e.namespace)
  const enrolled: TuitionChaseEnrolledClass = {
   classId: e.classId,
   courseCode: e.courseCode,
   displayName: e.className,
  }
  const cur = poolsByKey.get(key)
  if (cur) {
   if (!cur.classIds.includes(e.classId)) {
    cur.classIds.push(e.classId)
    cur.enrolledClasses.push(enrolled)
   }
   if (e.classLabel && !cur.classLabels.includes(e.classLabel)) cur.classLabels.push(e.classLabel)
   continue
  }
  poolsByKey.set(key, {
   studentId: e.studentId,
   academicYearId: yearId,
   namespace: e.namespace,
   classIds: [e.classId],
   classLabels: e.classLabel ? [e.classLabel] : [],
   enrolledClasses: [enrolled],
  })
 }

 const allClassIds = [...new Set([...poolsByKey.values()].flatMap((p) => p.classIds))]
 const rangeFrom =
  currentPeriodFull && nextPeriodFull
   ? currentPeriodFull.from < nextPeriodFull.from
     ? currentPeriodFull.from
     : nextPeriodFull.from
   : (currentPeriodFull?.from ?? nextPeriodFull?.from ?? null)
 const rangeTo =
  currentPeriodFull && nextPeriodFull
   ? currentPeriodFull.to > nextPeriodFull.to
     ? currentPeriodFull.to
     : nextPeriodFull.to
   : (currentPeriodFull?.to ?? nextPeriodFull?.to ?? null)

 const privateClassIds = [
  ...new Set(
   [...poolsByKey.values()]
    .filter((p) => p.namespace.courseGroup === "private")
    .flatMap((p) => p.classIds)
  ),
 ]
 const [remainingIndex, declarations] = await Promise.all([
  fetchRemainingIndex(studentIds, currentYearIds),
  rangeFrom && rangeTo
   ? fetchActiveChaseDeclarations(studentIds, rangeFrom, rangeTo)
   : Promise.resolve([] as ChaseDeclarationUnit[]),
 ])
 const unitsByClass = await fetchClassLessonUnits([
  ...new Set([...allClassIds, ...declarations.map((d) => d.classId)]),
 ])
 const rangeSchedules =
  rangeFrom && rangeTo && privateClassIds.length > 0
   ? await fetchScheduleUnitsInRange(privateClassIds, rangeFrom, rangeTo, unitsByClass)
   : ([] as ScheduleUnit[])

 const thisAttendance =
  currentPeriodFull
   ? await fetchAttendanceMarksByStudentSchedule(
      studentIds,
      currentPeriodFull.from,
      currentPeriodFull.to
     )
   : new Map<string, AttendanceMark>()

 const thisPeriodSchedules = rangeSchedules.filter((s) => currentPeriodDates.has(s.scheduledDate))
 const nextPeriodSchedules = rangeSchedules.filter((s) => nextPeriodDates.has(s.scheduledDate))

 const poolsByStudent = new Map<string, TuitionChasePoolRow[]>()
 for (const [key, acc] of poolsByKey) {
  const classIdSet = new Set(acc.classIds)
  const remainingLookup = lookupTuitionChaseRemaining(remainingIndex, {
   studentId: acc.studentId,
   academicYearId: acc.academicYearId,
   namespace: acc.namespace,
  })
  const remainingKnown = remainingLookup !== undefined
  const remaining = remainingKnown ? remainingLookup : 0
  const useDeclarations = acc.namespace.courseGroup !== "private"
  const poolRef = {
   studentId: acc.studentId,
   academicYearId: acc.academicYearId,
   namespace: acc.namespace,
   classIds: classIdSet,
  }
  const thisBuckets = useDeclarations
   ? declarationBucketsForPool(
      acc.studentId,
      declarations,
      currentPeriodDates,
      poolRef,
      unitsByClass,
      thisAttendance
     )
   : scheduleBucketsForStudent(
      acc.studentId,
      thisPeriodSchedules,
      classIdSet,
      thisAttendance
     )
  const thisPending = thisBuckets.pending
  const nextUnits = useDeclarations
   ? declarationBucketsForPool(
      acc.studentId,
      declarations,
      nextPeriodDates,
      poolRef,
      unitsByClass
     ).pending
   : sumUnitsForClasses(nextPeriodSchedules, classIdSet)
  const due = remainingKnown
   ? tuitionChaseDueFromInventory({
     remainingLessons: remaining,
     thisPeriodPendingUnits: thisPending,
     nextPeriodUnits: nextUnits,
    })
   : {
     thisPeriodDueLessons: 0,
     remainingAfterThisPeriod: 0,
     nextPeriodDueLessons: 0,
     suggestedLessons: 0,
    }
  const pool: TuitionChasePoolRow = {
   poolKey: key,
   studentId: acc.studentId,
   academicYearId: acc.academicYearId,
   namespace: acc.namespace,
   label: tuitionChasePoolLabel(acc.namespace, acc.classLabels),
   classIds: acc.classIds,
   classes: sortTuitionChaseEnrolledClasses(acc.enrolledClasses),
   remainingKnown,
   remainingLessons: remaining,
   thisPeriodPendingUnits: thisPending,
   thisPeriodDeductedUnits: thisBuckets.deducted,
   thisPeriodNondeductUnits: thisBuckets.nondeduct,
   thisPeriodDueLessons: due.thisPeriodDueLessons,
   remainingAfterThisPeriod: due.remainingAfterThisPeriod,
   nextPeriodUnits: nextUnits,
   nextPeriodDueLessons: due.nextPeriodDueLessons,
   suggestedLessons: due.suggestedLessons,
  }
  const list = poolsByStudent.get(acc.studentId) ?? []
  list.push(pool)
  poolsByStudent.set(acc.studentId, list)
 }

 const rows: TuitionChaseStudentRow[] = []
 for (const meta of studentMeta.values()) {
  const pools = (poolsByStudent.get(meta.studentId) ?? []).sort((a, b) =>
   a.label.localeCompare(b.label, "zh-Hant")
  )
  const thisPeriodDueLessons = pools.reduce((n, p) => n + p.thisPeriodDueLessons, 0)
  const nextPeriodDueLessons = pools.reduce((n, p) => n + p.nextPeriodDueLessons, 0)
  const knownPools = pools.filter((p) => p.remainingKnown)
  const remainingKnown = knownPools.length > 0
  const remainingLessons = knownPools.reduce((n, p) => n + p.remainingLessons, 0)
  const inventoryPools = remainingKnown ? knownPools : pools
  const thisPeriodPendingUnits = inventoryPools.reduce((n, p) => n + p.thisPeriodPendingUnits, 0)
  const thisPeriodDeductedUnits = inventoryPools.reduce((n, p) => n + p.thisPeriodDeductedUnits, 0)
  const thisPeriodNondeductUnits = inventoryPools.reduce(
   (n, p) => n + p.thisPeriodNondeductUnits,
   0
  )
  const nextPeriodUnits = inventoryPools.reduce((n, p) => n + p.nextPeriodUnits, 0)
  const suggestedLessons = thisPeriodDueLessons + nextPeriodDueLessons
  rows.push({
   ...meta,
   pools,
   remainingKnown,
   remainingLessons,
   thisPeriodPendingUnits,
   thisPeriodDeductedUnits,
   thisPeriodNondeductUnits,
   thisPeriodDueLessons,
   nextPeriodUnits,
   nextPeriodDueLessons,
   suggestedLessons,
   status: tuitionChaseQueueStatus(
    { thisPeriodDueLessons, nextPeriodDueLessons },
    remainingKnown
   ),
  })
 }

 rows.sort((a, b) => {
  const rank = (s: TuitionChaseQueueStatus) =>
   s === "now" ? 0 : s === "next" ? 1 : s === "unknown" ? 2 : 3
  const rd = rank(a.status) - rank(b.status)
  if (rd !== 0) return rd
  const dueDiff = b.suggestedLessons - a.suggestedLessons
  if (dueDiff !== 0) return dueDiff
  return a.studentName.localeCompare(b.studentName, "zh-Hant")
 })

 return {
  rows,
  hiddenOlderCount,
  opsYearLabels: currentYearLabels,
  currentPeriod,
  nextPeriod,
 }
}

export type TuitionChaseStudentResult = {
 row: TuitionChaseStudentRow | null
 currentPeriod: TuitionChasePeriodRef | null
 nextPeriod: TuitionChasePeriodRef | null
 opsYearLabels: string[]
}

/** 單一學生之本學年追收摘要（與名單同一口徑）。 */
export async function fetchTuitionChaseForStudent(
 studentId: string,
 opts?: { todayYmd?: string }
): Promise<TuitionChaseStudentResult> {
 const sid = studentId.trim()
 const result = await fetchTuitionChaseList({
  studentId: sid || undefined,
  todayYmd: opts?.todayYmd,
 })
 return {
  row: result.rows.find((r) => r.studentId === sid) ?? null,
  currentPeriod: result.currentPeriod,
  nextPeriod: result.nextPeriod,
  opsYearLabels: result.opsYearLabels,
 }
}

function classGradeArr(gradeRaw: unknown): string[] | null {
 if (Array.isArray(gradeRaw)) return gradeRaw.map((g) => String(g))
 if (typeof gradeRaw === "string" && gradeRaw.trim()) return [gradeRaw]
 return null
}

function classDisplayLabel(cls: Record<string, unknown> | null, fallback = ""): string {
 if (!cls) return fallback
 const subject = cls.subject != null ? String(cls.subject).trim() : ""
 if (subject) return subject
 const course = embedOne(cls.courses)
 const courseName = course?.course_name != null ? String(course.course_name).trim() : ""
 return courseName || fallback
}

type ClassMeta = { units: number; label: string }

async function fetchClassMeta(classIds: string[]): Promise<Map<string, ClassMeta>> {
 const out = new Map<string, ClassMeta>()
 if (!supabase || classIds.length === 0) return out
 await forEachIdChunk(classIds, DEFAULT_ID_CHUNK, async (slice) => {
  const { data, error } = await supabase!
   .from("classes")
   .select("id, lesson_slots_per_session, subject, courses ( course_name )")
   .in("id", slice)
  if (error) throw error
  for (const raw of data ?? []) {
   const row = raw as Record<string, unknown>
   const id = String(row.id ?? "")
   if (!id) continue
   out.set(id, {
    units: lessonUnits(row.lesson_slots_per_session as number | null),
    label: classDisplayLabel(row, id),
   })
  }
 })
 return out
}

type DetailSchedule = ScheduleUnit & {
 startTime: string | null
 endTime: string | null
}

async function fetchDetailSchedulesInRange(
 classIds: string[],
 from: string,
 to: string,
 metaByClass: ReadonlyMap<string, ClassMeta>
): Promise<DetailSchedule[]> {
 const out: DetailSchedule[] = []
 if (!supabase || classIds.length === 0) return out
 await forEachIdChunk(classIds, DEFAULT_ID_CHUNK, async (slice) => {
  const { data, error } = await supabase!
   .from("schedules")
   .select("id, class_id, scheduled_date, start_time, end_time, status")
   .in("class_id", slice)
   .gte("scheduled_date", from)
   .lte("scheduled_date", to)
  if (error) throw error
  for (const raw of data ?? []) {
   const row = raw as Record<string, unknown>
   const id = String(row.id ?? "")
   const classId = String(row.class_id ?? "")
   if (!id || !classId) continue
   if (String(row.status ?? "").includes("取消")) continue
   const start = row.start_time != null ? String(row.start_time).slice(0, 5) : null
   const end = row.end_time != null ? String(row.end_time).slice(0, 5) : null
   out.push({
    id,
    classId,
    scheduledDate: String(row.scheduled_date ?? "").slice(0, 10),
    startTime: start && start !== "" ? start : null,
    endTime: end && end !== "" ? end : null,
    units: metaByClass.get(classId)?.units ?? 1,
   })
  }
 })
 out.sort((a, b) => {
  const d = a.scheduledDate.localeCompare(b.scheduledDate)
  if (d !== 0) return d
  return (a.startTime ?? "").localeCompare(b.startTime ?? "")
 })
 return out
}

type AttendanceInfo = { mark: AttendanceMark; status: string }

async function fetchAttendanceInfoForStudent(
 studentId: string,
 from: string,
 to: string
): Promise<Map<string, AttendanceInfo>> {
 const out = new Map<string, AttendanceInfo>()
 if (!supabase || !studentId) return out
 const { data, error } = await supabase
  .from("attendance_details")
  .select("schedule_id, status")
  .eq("student_id", studentId)
  .gte("attendance_date", from)
  .lte("attendance_date", to)
  .not("schedule_id", "is", null)
 if (error) throw error
 for (const raw of data ?? []) {
  const r = raw as { schedule_id?: string; status?: string }
  const schId = String(r.schedule_id ?? "")
  const status = String(r.status ?? "").trim()
  if (!schId || !status) continue
  const mark: AttendanceMark = isBillableAttendanceStatus(status) ? "billable" : "nondeduct"
  const prev = out.get(schId)
  if (prev?.mark === "billable") continue
  out.set(schId, { mark, status })
 }
 return out
}

function toScheduleLine(
 s: DetailSchedule,
 meta: ClassMeta | undefined,
 attendanceStatus: string | null
): TuitionChaseScheduleLine {
 return {
  scheduleId: s.id,
  classId: s.classId,
  classLabel: meta?.label || s.classId,
  scheduledDate: s.scheduledDate,
  startTime: s.startTime,
  endTime: s.endTime,
  units: s.units,
  attendanceStatus,
 }
}

type PaymentCandidate = {
 line: TuitionChasePaymentLine
 academicYearId: string | null
 namespace: EntitlementNamespace
 skipLessons: boolean
}

async function fetchReceivedPaymentCandidates(studentId: string): Promise<PaymentCandidate[]> {
 const out: PaymentCandidate[] = []
 if (!supabase || !studentId) return out
 const { data, error } = await supabase
  .from("payments")
  .select(
   "id, receipt_number, payment_date, status, payment_details ( id, class_id, lesson_count, amount, description, coverage_start_month, classes ( subject, class_kind, grade, academic_year_id, academic_years ( label ), courses ( course_name, grade_code ) ) )"
  )
  .eq("student_id", studentId)
  .eq("status", PAYMENT_STATUS.received)
  .order("payment_date", { ascending: false })
 if (error) throw error

 for (const raw of data ?? []) {
  const pay = raw as Record<string, unknown>
  const paymentId = String(pay.id ?? "")
  if (!paymentId) continue
  const detailsRaw = pay.payment_details
  const details = Array.isArray(detailsRaw)
   ? detailsRaw
   : detailsRaw && typeof detailsRaw === "object"
     ? [detailsRaw]
     : []
  for (const dUnknown of details) {
   const d = dUnknown as Record<string, unknown>
   const classId = d.class_id != null ? String(d.class_id) : ""
   if (!classId) continue
   const cls = embedOne(d.classes)
   const course = cls ? embedOne(cls.courses) : null
   const description = d.description != null ? String(d.description) : null
   const isTrial = isTrialPaymentDetailDescription(description)
   const ns = resolveEntitlementNamespace({
    classId,
    classKind: cls?.class_kind != null ? String(cls.class_kind) : null,
    subject: cls?.subject != null ? String(cls.subject) : null,
    courseName: course?.course_name != null ? String(course.course_name) : null,
    grade: classGradeArr(cls?.grade),
    gradeCode: course?.grade_code != null ? String(course.grade_code) : null,
    isTrial,
   })
   const lessonN = d.lesson_count != null ? Number(d.lesson_count) : NaN
   const amountN = d.amount != null ? Number(d.amount) : NaN
   out.push({
    academicYearId: cls?.academic_year_id != null ? String(cls.academic_year_id) : null,
    namespace: ns,
    skipLessons: isHomeworkPaymentDetailSkipLessons({
     coverageStartMonth:
      d.coverage_start_month != null ? String(d.coverage_start_month).slice(0, 7) : null,
     description,
     classKind: cls?.class_kind != null ? String(cls.class_kind) : null,
    }),
    line: {
     paymentId,
     receiptNumber: pay.receipt_number != null ? String(pay.receipt_number) : null,
     paymentDate: String(pay.payment_date ?? "").slice(0, 10),
     classLabel: classDisplayLabel(cls, ns.courseGroup === "private" ? "私人課程" : "專科班"),
     lessonCount: Number.isFinite(lessonN) ? lessonN : 0,
     amount: Number.isFinite(amountN) ? amountN : null,
     description,
    },
   })
  }
 }
 return out
}

/**
 * 單一學生各已繳堂數組別：已收款學費明細，以及本期已扣／還會扣、下期會扣排程。
 */
export async function fetchTuitionChaseStudentDetail(opts: {
 studentId: string
 pools: Array<
  Pick<TuitionChasePoolRow, "poolKey" | "academicYearId" | "namespace" | "classIds">
 >
 currentPeriod: TuitionChasePeriodRef | null
 nextPeriod: TuitionChasePeriodRef | null
 academicYearLabel?: string
}): Promise<TuitionChasePoolDetail[]> {
 const empty = opts.pools.map((p) => ({
  poolKey: p.poolKey,
  payments: [] as TuitionChasePaymentLine[],
  deducted: [] as TuitionChaseScheduleLine[],
  thisPeriodPending: [] as TuitionChaseScheduleLine[],
  nextPeriod: [] as TuitionChaseScheduleLine[],
  thisPeriodNondeduct: [] as TuitionChaseScheduleLine[],
 }))
 if (!supabase || opts.pools.length === 0) return empty

 const yearLabel =
  opts.academicYearLabel?.trim() ||
  listCurrentEnrollmentYearLabels(opts.currentPeriod?.from ?? todayYmdLocal())[0] ||
  "2627"
 const currentPeriodDates = specialistTuitionPeriodDateSet(
  opts.currentPeriod
   ? getSpecialistTuitionPeriod(yearLabel, opts.currentPeriod.index)
   : null
 )
 const nextPeriodDates = specialistTuitionPeriodDateSet(
  opts.nextPeriod ? getSpecialistTuitionPeriod(yearLabel, opts.nextPeriod.index) : null
 )

 const enrolledClassIds = [...new Set(opts.pools.flatMap((p) => p.classIds))]
 const fromCandidates = [opts.currentPeriod?.from, opts.nextPeriod?.from].filter(Boolean) as string[]
 const toCandidates = [opts.currentPeriod?.to, opts.nextPeriod?.to].filter(Boolean) as string[]
 const from = fromCandidates.length ? fromCandidates.reduce((a, b) => (a < b ? a : b)) : ""
 const to = toCandidates.length ? toCandidates.reduce((a, b) => (a > b ? a : b)) : ""
 const hasPrivate = opts.pools.some((p) => p.namespace.courseGroup === "private")
 const hasSpecialist = opts.pools.some((p) => p.namespace.courseGroup !== "private")

 const [payments, declarations] = await Promise.all([
  fetchReceivedPaymentCandidates(opts.studentId),
  hasSpecialist && from && to
   ? fetchActiveChaseDeclarations([opts.studentId], from, to)
   : Promise.resolve([] as ChaseDeclarationUnit[]),
 ])
 const metaByClass = await fetchClassMeta([
  ...new Set([...enrolledClassIds, ...declarations.map((d) => d.classId)]),
 ])
 const privateClassIds = [
  ...new Set(
   opts.pools.filter((p) => p.namespace.courseGroup === "private").flatMap((p) => p.classIds)
  ),
 ]
 const schedules =
  hasPrivate && from && to
   ? await fetchDetailSchedulesInRange(privateClassIds, from, to, metaByClass)
   : []
 const attendance =
  from && to
   ? await fetchAttendanceInfoForStudent(opts.studentId, from, to)
   : new Map<string, AttendanceInfo>()

 return opts.pools.map((pool) => {
  const classIdSet = new Set(pool.classIds)
  const deducted: TuitionChaseScheduleLine[] = []
  const thisPeriodPending: TuitionChaseScheduleLine[] = []
  const nextPeriodLines: TuitionChaseScheduleLine[] = []
  const thisPeriodNondeduct: TuitionChaseScheduleLine[] = []
  const useDeclarations = pool.namespace.courseGroup !== "private"
  const seen = new Set<string>()
  const pushBucket = (s: DetailSchedule, att: AttendanceInfo | undefined) => {
   if (seen.has(s.id)) return
   seen.add(s.id)
   const bucket = classifyChaseSchedule({
    scheduledDate: s.scheduledDate,
    currentPeriodDates,
    nextPeriodDates,
    attendance: att?.mark,
   })
   const line = toScheduleLine(s, metaByClass.get(s.classId), att?.status ?? null)
   if (bucket === "deducted") deducted.push(line)
   else if (bucket === "thisPeriodPending") thisPeriodPending.push(line)
   else if (bucket === "nextPeriod") nextPeriodLines.push(line)
   else if (att?.mark === "nondeduct" && currentPeriodDates.has(s.scheduledDate)) {
    thisPeriodNondeduct.push(line)
   }
  }
  if (useDeclarations) {
   for (const d of declarations) {
    if (d.studentId !== opts.studentId) continue
    if (
     !chaseDeclarationAppliesToPool({
      classId: d.classId,
      poolClassIds: classIdSet,
      sourceEventType: d.sourceEventType,
      declarationPool: d.pool,
      pool: {
       studentId: opts.studentId,
       academicYearId: pool.academicYearId,
       namespace: pool.namespace,
      },
     })
    ) {
     continue
    }
    pushBucket(
     {
      id: d.scheduleId,
      classId: d.classId,
      scheduledDate: d.scheduledDate,
      startTime: d.startTime,
      endTime: d.endTime,
      units: metaByClass.get(d.classId)?.units ?? 1,
     },
     attendance.get(d.scheduleId)
    )
   }
  } else {
   for (const s of schedules) {
    if (!classIdSet.has(s.classId)) continue
    pushBucket(s, attendance.get(s.id))
   }
  }
  const byDate = (a: TuitionChaseScheduleLine, b: TuitionChaseScheduleLine) => {
   const d = a.scheduledDate.localeCompare(b.scheduledDate)
   if (d !== 0) return d
   return (a.startTime ?? "").localeCompare(b.startTime ?? "")
  }
  deducted.sort(byDate)
  thisPeriodPending.sort(byDate)
  nextPeriodLines.sort(byDate)
  thisPeriodNondeduct.sort(byDate)
  const matched = payments.filter((p) =>
   paymentDetailMatchesPool({
    pool: { academicYearId: pool.academicYearId, namespace: pool.namespace },
    detail: {
     academicYearId: p.academicYearId,
     namespace: p.namespace,
     skipLessons: p.skipLessons,
     lessonCount: p.line.lessonCount,
    },
   })
  )
  return {
   poolKey: pool.poolKey,
   payments: matched.map((p) => p.line),
   deducted,
   thisPeriodPending,
   nextPeriod: nextPeriodLines,
   thisPeriodNondeduct,
  }
 })
}
