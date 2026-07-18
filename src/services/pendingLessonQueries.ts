import { supabase } from "@/lib/supabaseClient"
import { formatClassLabel } from "@/lib/courseLabel"
import {
 enrollmentCoversPeriod,
 fetchAcademicYearPeriods,
 fetchClassEnrollmentConfig,
 isSingleSessionEnrollment,
 resolvePeriodCodeFromDate,
 type EnrollmentFormValue,
} from "@/lib/enrollmentPeriod"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import { fetchEnrolledScheduleIdsByEnrollmentIds } from "@/services/enrollmentSessionQueries"
import { PAYMENT_STATUS } from "@/services/paymentQueries"

export const PENDING_LESSON_REASONS = ["遲報缺堂", "堂數差額", "其他"] as const
export type PendingLessonReason = (typeof PENDING_LESSON_REASONS)[number]

export const PENDING_LESSON_STATUSES = ["待補", "已安排", "已完成", "取消"] as const
export type PendingLessonStatus = (typeof PENDING_LESSON_STATUSES)[number]

export type PendingLessonRow = {
 id: string
 studentId: string
 classId: string
 enrollmentId: string | null
 owedCount: number
 reason: string
 status: string
 remarks: string | null
 resolvedScheduleId: string | null
 createdAt: string
}

export type LessonBalanceRow = {
 enrollmentId: string
 classId: string
 classLabel: string
 enrollDate: string | null
 enrollmentPeriod: EnrollmentFormValue | null
 /** 該班已收款繳費明細堂數加總 */
 paidLessons: number
 /** 已綁定／會出席的排程堂數（單堂＝選堂數；全期＝報讀日當日起非取消排程） */
 boundLessons: number
 /** 狀態為「待補」的尚欠堂數加總 */
 pendingLessons: number
 /** paid - bound - pending；>0 表示仍缺記錄／排程 */
 gap: number
 /** 已繳 > 0 且 gap === 0；或未繳費且無待補 */
 isAligned: boolean
 pendingRows: PendingLessonRow[]
}

/** 全站對帳列表列（已繳／排程／待補不一致） */
export type MisalignedLessonBalanceRow = LessonBalanceRow & {
 studentId: string
 studentCode: string | null
 studentName: string
 englishName: string | null
}

/** 需跟進：堂數不一致，或仍有待補堂 */
export function isLessonBalanceNeedsFollowUp(row: Pick<LessonBalanceRow, "isAligned" | "pendingLessons">): boolean {
 return !row.isAligned || row.pendingLessons > 0
}

function mapPendingRow(r: Record<string, unknown>): PendingLessonRow {
 return {
  id: String(r.id),
  studentId: String(r.student_id),
  classId: String(r.class_id),
  enrollmentId: r.enrollment_id != null ? String(r.enrollment_id) : null,
  owedCount: Math.max(0, Math.floor(Number(r.owed_count) || 0)),
  reason: String(r.reason ?? "遲報缺堂"),
  status: String(r.status ?? "待補"),
  remarks: r.remarks != null ? String(r.remarks) : null,
  resolvedScheduleId: r.resolved_schedule_id != null ? String(r.resolved_schedule_id) : null,
  createdAt: String(r.created_at ?? ""),
 }
}

export function isPendingLessonOpen(status: string): boolean {
 return status.trim() === "待補"
}

/** 報讀前預估將綁定堂數 */
export async function countBoundSchedulesForEnrollment(opts: {
 classId: string
 enrollmentPeriod: EnrollmentFormValue | null
 scheduleIds?: string[]
 enrollDate?: string
}): Promise<number> {
 if (!supabase) return 0
 if (isSingleSessionEnrollment(opts.enrollmentPeriod)) {
  return new Set((opts.scheduleIds ?? []).filter(Boolean)).size
 }

 const enrollDate = (opts.enrollDate ?? new Date().toISOString().slice(0, 10)).slice(0, 10)
 const config = await fetchClassEnrollmentConfig(opts.classId)
 const { data, error } = await supabase
  .from("schedules")
  .select("id, scheduled_date, status")
  .eq("class_id", opts.classId)
  .gte("scheduled_date", enrollDate)
 if (error) throw error

 let periods =
  config.courseMode === "summer_two_period" && config.academicYearId
   ? await fetchAcademicYearPeriods(config.academicYearId)
   : []

 let count = 0
 for (const row of data ?? []) {
  const r = row as { scheduled_date?: string; status?: string }
  const status = String(r.status ?? "")
  if (status.includes("取消")) continue
  const date = String(r.scheduled_date ?? "").slice(0, 10)
  if (!date) continue
  if (config.courseMode === "summer_two_period" && periods.length > 0) {
   const code = resolvePeriodCodeFromDate(date, periods)
   if (code != null && !enrollmentCoversPeriod(opts.enrollmentPeriod, code)) continue
  }
  count += 1
 }
 return count
}

/** 學生各班已收款堂數（依 payment_details.class_id） */
export async function fetchPaidLessonsByClassForStudent(
 studentId: string
): Promise<Map<string, number>> {
 const map = new Map<string, number>()
 if (!supabase) return map
 const { data: pays, error: e1 } = await supabase
  .from("payments")
  .select("id")
  .eq("student_id", studentId)
  .eq("status", PAYMENT_STATUS.received)
 if (e1) throw e1
 const pids = (pays ?? []).map((r) => String((r as { id: unknown }).id))
 if (pids.length === 0) return map
 const { data: det, error: e2 } = await supabase
  .from("payment_details")
  .select("class_id, lesson_count")
  .in("payment_id", pids)
 if (e2) throw e2
 for (const row of det ?? []) {
  const r = row as { class_id?: string | null; lesson_count?: unknown }
  const classId = r.class_id != null ? String(r.class_id) : ""
  if (!classId) continue
  const n = Number(r.lesson_count)
  if (!Number.isFinite(n) || n <= 0) continue
  map.set(classId, (map.get(classId) ?? 0) + n)
 }
 return map
}

export async function fetchPendingLessonsForStudent(
 studentId: string
): Promise<PendingLessonRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("student_pending_lessons")
  .select(
   "id, student_id, class_id, enrollment_id, owed_count, reason, status, remarks, resolved_schedule_id, created_at"
  )
  .eq("student_id", studentId)
  .order("created_at", { ascending: false })
 if (error) throw error
 return (data ?? []).map((r) => mapPendingRow(r as Record<string, unknown>))
}

export async function insertPendingLesson(row: {
 studentId: string
 classId: string
 enrollmentId?: string | null
 owedCount: number
 reason?: string
 remarks?: string | null
 status?: PendingLessonStatus
}): Promise<string> {
 if (!supabase) throw new Error("Supabase 未設定")
 const owed = Math.floor(Number(row.owedCount))
 if (!Number.isFinite(owed) || owed < 1) throw new Error("待補堂數至少為 1")
 const { data, error } = await supabase
  .from("student_pending_lessons")
  .insert({
   student_id: row.studentId,
   class_id: row.classId,
   enrollment_id: row.enrollmentId ?? null,
   owed_count: owed,
   reason: row.reason?.trim() || "遲報缺堂",
   remarks: row.remarks?.trim() || null,
   status: row.status ?? "待補",
  })
  .select("id")
  .single()
 if (error) throw error
 return String((data as { id: string }).id)
}

export async function updatePendingLessonStatus(
 id: string,
 status: PendingLessonStatus,
 opts?: { resolvedScheduleId?: string | null; remarks?: string | null }
): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const patch: Record<string, unknown> = {
  status,
  updated_at: new Date().toISOString(),
 }
 if (opts && "resolvedScheduleId" in opts) {
  patch.resolved_schedule_id = opts.resolvedScheduleId ?? null
 }
 if (opts && "remarks" in opts) {
  patch.remarks = opts.remarks ?? null
 }
 const { error } = await supabase.from("student_pending_lessons").update(patch).eq("id", id)
 if (error) throw error
}

/** 依就讀中報讀，對帳：已繳 vs 已綁排程 vs 待補 */
export async function fetchLessonBalancesForStudent(
 studentId: string
): Promise<LessonBalanceRow[]> {
 if (!supabase) return []

 const { data: enrollments, error: enrErr } = await supabase
  .from("student_class_enrollments")
  .select(
   "id, class_id, enroll_date, enrollment_period, classes ( subject, course_code_full, academic_year_id, courses ( course_mode, course_name ) )"
  )
  .eq("student_id", studentId)
  .eq("status", "就讀中")
 if (enrErr) throw enrErr
 if (!enrollments?.length) return []

 const paidByClass = await fetchPaidLessonsByClassForStudent(studentId)
 const pendingAll = await fetchPendingLessonsForStudent(studentId)
 const pendingByEnrollment = new Map<string, PendingLessonRow[]>()
 for (const p of pendingAll) {
  if (!p.enrollmentId) continue
  const list = pendingByEnrollment.get(p.enrollmentId) ?? []
  list.push(p)
  pendingByEnrollment.set(p.enrollmentId, list)
 }

 const singleIds = (enrollments as Array<{ id?: string; enrollment_period?: string | null }>)
  .filter((e) => isSingleSessionEnrollment(e.enrollment_period))
  .map((e) => String(e.id))
 const singleMap = await fetchEnrolledScheduleIdsByEnrollmentIds(singleIds)

 const classIds = [
  ...new Set(
   (enrollments as Array<{ class_id?: string }>).map((e) => String(e.class_id ?? "")).filter(Boolean)
  ),
 ]
 const { data: schedData, error: schedErr } = await supabase
  .from("schedules")
  .select("id, class_id, scheduled_date, status")
  .in("class_id", classIds)
 if (schedErr) throw schedErr

 const schedulesByClass = new Map<
  string,
  Array<{ id: string; date: string; status: string }>
 >()
 for (const row of schedData ?? []) {
  const r = row as { id?: string; class_id?: string; scheduled_date?: string; status?: string }
  const cid = String(r.class_id ?? "")
  if (!cid) continue
  const list = schedulesByClass.get(cid) ?? []
  list.push({
   id: String(r.id ?? ""),
   date: String(r.scheduled_date ?? "").slice(0, 10),
   status: String(r.status ?? ""),
  })
  schedulesByClass.set(cid, list)
 }

 const yearIds = new Set<string>()
 for (const row of enrollments) {
  const r = row as Record<string, unknown>
  const cls = r.classes as Record<string, unknown> | null
  const course = cls?.courses as Record<string, unknown> | null
  if (course?.course_mode === "summer_two_period" && cls?.academic_year_id != null) {
   yearIds.add(String(cls.academic_year_id))
  }
 }
 const periodCache = new Map<string, Awaited<ReturnType<typeof fetchAcademicYearPeriods>>>()
 await Promise.all(
  [...yearIds].map(async (yearId) => {
   periodCache.set(yearId, await fetchAcademicYearPeriods(yearId))
  })
 )

 return (enrollments as Record<string, unknown>[]).map((r) => {
  const enrollmentId = String(r.id)
  const classId = String(r.class_id ?? "")
  const enrollDate =
   r.enroll_date != null ? String(r.enroll_date).slice(0, 10) : null
  const enrollmentPeriod = (r.enrollment_period as EnrollmentFormValue | null) ?? null
  const cls = r.classes as Record<string, unknown> | null
  const course = cls?.courses as Record<string, unknown> | null
  const subject = cls?.subject != null ? String(cls.subject) : "—"
  const courseCode = cls?.course_code_full != null ? String(cls.course_code_full) : null
  const courseName = course?.course_name != null ? String(course.course_name) : null
  const courseMode = course?.course_mode != null ? String(course.course_mode) : "regular"
  const academicYearId =
   cls?.academic_year_id != null ? String(cls.academic_year_id) : null

  let boundLessons = 0
  if (isSingleSessionEnrollment(enrollmentPeriod)) {
   boundLessons = (singleMap.get(enrollmentId) ?? new Set()).size
  } else {
   const fromDate = enrollDate ?? "0000-01-01"
   const periods =
    courseMode === "summer_two_period" && academicYearId
     ? (periodCache.get(academicYearId) ?? [])
     : []
   for (const s of schedulesByClass.get(classId) ?? []) {
    if (s.status.includes("取消")) continue
    if (s.date < fromDate) continue
    if (courseMode === "summer_two_period" && periods.length > 0) {
     const code = resolvePeriodCodeFromDate(s.date, periods)
     if (code != null && !enrollmentCoversPeriod(enrollmentPeriod, code)) continue
    }
    boundLessons += 1
   }
  }

  const pendingRows = [
   ...(pendingByEnrollment.get(enrollmentId) ?? []),
   ...pendingAll.filter((p) => p.classId === classId && !p.enrollmentId),
  ]
  // de-dupe by id
  const seen = new Set<string>()
  const uniquePending = pendingRows.filter((p) => {
   if (seen.has(p.id)) return false
   seen.add(p.id)
   return true
  })
  const openPending = uniquePending
   .filter((p) => isPendingLessonOpen(p.status))
   .reduce((sum, p) => sum + p.owedCount, 0)

  const paidLessons = paidByClass.get(classId) ?? 0
  const gap = paidLessons > 0 ? paidLessons - boundLessons - openPending : 0
  const isAligned = paidLessons > 0 ? gap === 0 : openPending === 0

  return {
   enrollmentId,
   classId,
   classLabel: formatClassLabel({ subject, courseCode, courseName }),
   enrollDate,
   enrollmentPeriod,
   paidLessons,
   boundLessons,
   pendingLessons: openPending,
   gap,
   isAligned,
   pendingRows: uniquePending,
  }
 })
}

async function fetchAllActiveEnrollmentsForBalance(): Promise<Record<string, unknown>[]> {
 if (!supabase) return []
 const pageSize = 1000
 const all: Record<string, unknown>[] = []
 for (let from = 0; ; from += pageSize) {
  const { data, error } = await supabase
   .from("student_class_enrollments")
   .select(
    "id, student_id, class_id, enroll_date, enrollment_period, students ( student_code, full_name, english_name ), classes ( subject, course_code_full, academic_year_id, courses ( course_mode, course_name ) )"
   )
   .eq("status", "就讀中")
   .order("id", { ascending: true })
   .range(from, from + pageSize - 1)
  if (error) throw error
  const chunk = (data ?? []) as Record<string, unknown>[]
  all.push(...chunk)
  if (chunk.length < pageSize) break
 }
 return all
}

/** 批次：多位學生各班已收款堂數（studentId → classId → lessons） */
async function fetchPaidLessonsByStudentAndClass(
 studentIds: string[]
): Promise<Map<string, Map<string, number>>> {
 const byStudent = new Map<string, Map<string, number>>()
 if (!supabase || studentIds.length === 0) return byStudent

 const paymentRows: Array<{ id: string; studentId: string }> = []
 await forEachIdChunk(studentIds, DEFAULT_ID_CHUNK, async (slice) => {
  const { data, error } = await supabase!
   .from("payments")
   .select("id, student_id")
   .in("student_id", slice)
   .eq("status", PAYMENT_STATUS.received)
  if (error) throw error
  for (const row of data ?? []) {
   const r = row as { id?: unknown; student_id?: unknown }
   paymentRows.push({ id: String(r.id), studentId: String(r.student_id) })
  }
 })
 if (paymentRows.length === 0) return byStudent

 const paymentStudent = new Map(paymentRows.map((p) => [p.id, p.studentId]))
 const paymentIds = paymentRows.map((p) => p.id)
 await forEachIdChunk(paymentIds, DEFAULT_ID_CHUNK, async (slice) => {
  const { data, error } = await supabase!
   .from("payment_details")
   .select("payment_id, class_id, lesson_count")
   .in("payment_id", slice)
  if (error) throw error
  for (const row of data ?? []) {
   const r = row as { payment_id?: unknown; class_id?: unknown; lesson_count?: unknown }
   const pid = String(r.payment_id ?? "")
   const studentId = paymentStudent.get(pid)
   if (!studentId) continue
   const classId = r.class_id != null ? String(r.class_id) : ""
   if (!classId) continue
   const n = Number(r.lesson_count)
   if (!Number.isFinite(n) || n <= 0) continue
   const byClass = byStudent.get(studentId) ?? new Map<string, number>()
   byClass.set(classId, (byClass.get(classId) ?? 0) + n)
   byStudent.set(studentId, byClass)
  }
 })
 return byStudent
}

async function fetchPendingLessonsForStudents(
 studentIds: string[]
): Promise<Map<string, PendingLessonRow[]>> {
 const byStudent = new Map<string, PendingLessonRow[]>()
 if (!supabase || studentIds.length === 0) return byStudent
 await forEachIdChunk(studentIds, DEFAULT_ID_CHUNK, async (slice) => {
  const { data, error } = await supabase!
   .from("student_pending_lessons")
   .select(
    "id, student_id, class_id, enrollment_id, owed_count, reason, status, remarks, resolved_schedule_id, created_at"
   )
   .in("student_id", slice)
   .order("created_at", { ascending: false })
  if (error) throw error
  for (const row of data ?? []) {
   const mapped = mapPendingRow(row as Record<string, unknown>)
   const list = byStudent.get(mapped.studentId) ?? []
   list.push(mapped)
   byStudent.set(mapped.studentId, list)
  }
 })
 return byStudent
}

/**
 * 全站就讀中報讀對帳：僅回傳已繳／排程／待補不一致，或仍有待補堂的列。
 * 邏輯與 {@link fetchLessonBalancesForStudent} 一致。
 */
export async function fetchMisalignedLessonBalances(): Promise<MisalignedLessonBalanceRow[]> {
 if (!supabase) return []

 const enrollments = await fetchAllActiveEnrollmentsForBalance()
 if (enrollments.length === 0) return []

 const studentIds = [
  ...new Set(enrollments.map((r) => String(r.student_id ?? "")).filter(Boolean)),
 ]
 const classIds = [
  ...new Set(enrollments.map((r) => String(r.class_id ?? "")).filter(Boolean)),
 ]

 const [paidByStudent, pendingByStudent] = await Promise.all([
  fetchPaidLessonsByStudentAndClass(studentIds),
  fetchPendingLessonsForStudents(studentIds),
 ])

 const singleIds = enrollments
  .filter((e) => isSingleSessionEnrollment(e.enrollment_period as string | null))
  .map((e) => String(e.id))
 const singleMap = await fetchEnrolledScheduleIdsByEnrollmentIds(singleIds)

 const schedulesByClass = new Map<string, Array<{ id: string; date: string; status: string }>>()
 await forEachIdChunk(classIds, DEFAULT_ID_CHUNK, async (slice) => {
  const { data, error } = await supabase!
   .from("schedules")
   .select("id, class_id, scheduled_date, status")
   .in("class_id", slice)
  if (error) throw error
  for (const row of data ?? []) {
   const r = row as { id?: string; class_id?: string; scheduled_date?: string; status?: string }
   const cid = String(r.class_id ?? "")
   if (!cid) continue
   const list = schedulesByClass.get(cid) ?? []
   list.push({
    id: String(r.id ?? ""),
    date: String(r.scheduled_date ?? "").slice(0, 10),
    status: String(r.status ?? ""),
   })
   schedulesByClass.set(cid, list)
  }
 })

 const yearIds = new Set<string>()
 for (const row of enrollments) {
  const cls = row.classes as Record<string, unknown> | null
  const course = cls?.courses as Record<string, unknown> | null
  if (course?.course_mode === "summer_two_period" && cls?.academic_year_id != null) {
   yearIds.add(String(cls.academic_year_id))
  }
 }
 const periodCache = new Map<string, Awaited<ReturnType<typeof fetchAcademicYearPeriods>>>()
 await Promise.all(
  [...yearIds].map(async (yearId) => {
   periodCache.set(yearId, await fetchAcademicYearPeriods(yearId))
  })
 )

 const out: MisalignedLessonBalanceRow[] = []
 for (const r of enrollments) {
  const enrollmentId = String(r.id)
  const studentId = String(r.student_id ?? "")
  const classId = String(r.class_id ?? "")
  if (!studentId || !classId) continue

  const st = r.students as Record<string, unknown> | null
  const studentName =
   st?.full_name != null && String(st.full_name).trim()
    ? String(st.full_name).trim()
    : st?.english_name != null && String(st.english_name).trim()
      ? String(st.english_name).trim()
      : "（未命名）"
  const studentCode = st?.student_code != null ? String(st.student_code) : null
  const englishName = st?.english_name != null ? String(st.english_name) : null

  const enrollDate = r.enroll_date != null ? String(r.enroll_date).slice(0, 10) : null
  const enrollmentPeriod = (r.enrollment_period as EnrollmentFormValue | null) ?? null
  const cls = r.classes as Record<string, unknown> | null
  const course = cls?.courses as Record<string, unknown> | null
  const subject = cls?.subject != null ? String(cls.subject) : "—"
  const courseCode = cls?.course_code_full != null ? String(cls.course_code_full) : null
  const courseName = course?.course_name != null ? String(course.course_name) : null
  const courseMode = course?.course_mode != null ? String(course.course_mode) : "regular"
  const academicYearId =
   cls?.academic_year_id != null ? String(cls.academic_year_id) : null

  let boundLessons = 0
  if (isSingleSessionEnrollment(enrollmentPeriod)) {
   boundLessons = (singleMap.get(enrollmentId) ?? new Set()).size
  } else {
   const fromDate = enrollDate ?? "0000-01-01"
   const periods =
    courseMode === "summer_two_period" && academicYearId
     ? (periodCache.get(academicYearId) ?? [])
     : []
   for (const s of schedulesByClass.get(classId) ?? []) {
    if (s.status.includes("取消")) continue
    if (s.date < fromDate) continue
    if (courseMode === "summer_two_period" && periods.length > 0) {
     const code = resolvePeriodCodeFromDate(s.date, periods)
     if (code != null && !enrollmentCoversPeriod(enrollmentPeriod, code)) continue
    }
    boundLessons += 1
   }
  }

  const pendingAll = pendingByStudent.get(studentId) ?? []
  const pendingByEnrollment = pendingAll.filter((p) => p.enrollmentId === enrollmentId)
  const pendingByClassOnly = pendingAll.filter((p) => p.classId === classId && !p.enrollmentId)
  const pendingRows = [...pendingByEnrollment, ...pendingByClassOnly]
  const seen = new Set<string>()
  const uniquePending = pendingRows.filter((p) => {
   if (seen.has(p.id)) return false
   seen.add(p.id)
   return true
  })
  const openPending = uniquePending
   .filter((p) => isPendingLessonOpen(p.status))
   .reduce((sum, p) => sum + p.owedCount, 0)

  const paidLessons = paidByStudent.get(studentId)?.get(classId) ?? 0
  const gap = paidLessons > 0 ? paidLessons - boundLessons - openPending : 0
  const isAligned = paidLessons > 0 ? gap === 0 : openPending === 0

  const row: MisalignedLessonBalanceRow = {
   enrollmentId,
   classId,
   classLabel: formatClassLabel({ subject, courseCode, courseName }),
   enrollDate,
   enrollmentPeriod,
   paidLessons,
   boundLessons,
   pendingLessons: openPending,
   gap,
   isAligned,
   pendingRows: uniquePending,
   studentId,
   studentCode,
   studentName,
   englishName,
  }
  if (isLessonBalanceNeedsFollowUp(row)) out.push(row)
 }

 out.sort((a, b) => {
  const gapDiff = Math.abs(b.gap) - Math.abs(a.gap)
  if (gapDiff !== 0) return gapDiff
  const pendingDiff = b.pendingLessons - a.pendingLessons
  if (pendingDiff !== 0) return pendingDiff
  return a.studentName.localeCompare(b.studentName, "zh-Hant")
 })
 return out
}
