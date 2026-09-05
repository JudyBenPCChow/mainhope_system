import { supabase } from "@/lib/supabaseClient"
import { assertAcademicYearEditableForDate } from "@/lib/academicYearEditGuard"
import { classDisplayName, formatClassLabel } from "@/lib/courseLabel"
import { isSoftArchiveQueriesEnabled } from "@/lib/softArchiveFlag"
import { hiddenOlderCountFromParts } from "@/lib/softArchiveListScope"
import { fetchOpsAcademicYearWindow, headCountOrNull } from "@/services/softArchiveQueries"
import {
 enrollmentCoversPeriod,
 isSingleSessionEnrollment,
 normalizeEnrollmentPeriod,
 resolvePeriodCodeFromDate,
 type EnrollmentFormValue,
 type AcademicYearPeriodRow,
} from "@/lib/enrollmentPeriod"
import { fetchAcademicYearPeriods, fetchClassEnrollmentConfig, fetchClassEnrollmentConfigsByIds } from "@/services/enrollmentPeriodQueries"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import {
 LESSON_SLOT_DURATION_MIN,
 intervalsOverlapMinutes,
 parseHm,
} from "@/lib/lessonSlots"
import { fetchSchedulesInRange, localYmd, type ScheduleManageRow } from "@/services/scheduleQueries"
import { fetchConsecutiveScheduleIds } from "@/services/classQueries"
import { syncStudentMakeupDeclaration } from "@/services/entitlementQueries"
import { fetchEnrolledScheduleIdsByEnrollmentIds } from "@/services/enrollmentSessionQueries"
import { recordInboxEvent } from "@/services/inboxEventWrite"
import {
 deleteAttendanceHitsWithAuditOrThrow,
 scanDeletableAttendanceForMakeupSchedule,
 type AttendanceLifecycleHit,
} from "@/services/attendanceLifecycleQueries"
import {
 describeMakeupTimeConflicts,
 fetchStudentMustAttendScheduleSlots,
 findStudentConflictsWithScheduleSlot,
} from "@/services/studentQueries"
import { addDaysYmd } from "@/services/teacherQueries"

export { localYmd }

function throwPostgrest(err: unknown): never {
 if (err instanceof Error) throw err
 if (err && typeof err === "object") {
  const o = err as { message?: string; details?: string; hint?: string; code?: string }
  const parts = [o.message, o.details, o.hint].filter(
   (x): x is string => typeof x === "string" && x.trim().length > 0
  )
  if (parts.length) throw new Error(parts.join(" — "))
  if (o.code) throw new Error(`錯誤代碼 ${o.code}`)
 }
 throw new Error("操作失敗")
}

export const LEAVE_REASON_OPTIONS = ["病假", "事假", "老師請假"] as const
/** 學生主動請假表單用（不含老師請假） */
export const STUDENT_LEAVE_REASON_OPTIONS = ["病假", "事假"] as const
/** 老師請假精靈取消堂次時寫入 leave_makeup_records.leave_reason */
export const TEACHER_ABSENCE_LEAVE_REASON = "老師請假" as const
/**
 * 請假補課安排（對應點名預填見 attendanceBilling）。
 * 「待安排」＝確定要補但尚無補堂日，會進堂數對帳；錄影／不補回不需另排日；調堂須選補堂排程。
 */
export const LEAVE_MAKEUP_OPTIONS = ["待安排", "錄影", "調堂", "不補回"] as const
export const LEAVE_TUITION_DISPOSITION_OPTIONS = ["減收", "調堂", "錄影"] as const
export type LeaveTuitionDisposition = (typeof LEAVE_TUITION_DISPOSITION_OPTIONS)[number]

/** 請假是否仍缺實際補堂日期（應進堂數對帳） */
export function leaveNeedsMakeupDate(params: {
 makeupType: string | null | undefined
 makeupDate: string | null | undefined
 makeupScheduleId?: string | null | undefined
 status?: string | null | undefined
}): boolean {
 const status = String(params.status ?? "").trim()
 if (status && (isLeaveStatusDone(status) || isLeaveStatusAbandoned(status))) return false
 if (String(params.makeupDate ?? "").trim()) return false
 if (params.makeupScheduleId != null && String(params.makeupScheduleId).trim()) return false
 const t = String(params.makeupType ?? "").trim()
 if (t.includes("不補回")) return false
 if (t.includes("錄影") || t.includes("錄像") || t.includes("錄音")) return false
 // 待安排、空值、調堂未選日、或其他未定案類型
 return true
}

export type LeaveAwaitingMakeupRow = {
 id: string
 studentId: string
 classId: string
 leaveDate: string
 leaveReason: string | null
 makeupType: string | null
}

export type LeaveManageRow = {
 id: string
 student_id: string
 class_id: string
 schedule_id: string | null
 leave_date: string
 leave_reason: string | null
 makeup_type: string | null
 makeup_date: string | null
 makeup_schedule_id: string | null
 tuition_disposition: LeaveTuitionDisposition | null
 status: string
 remarks: string | null
 student_name: string | null
 student_grade: string | null
 class_subject: string | null
 course_code_full: string | null
 /** 班別負責老師 */
 teacher_name: string | null
 sched_date: string | null
 sched_start: string | null
 sched_end: string | null
}

function mapRow(r: Record<string, unknown>): LeaveManageRow {
 const st = r.students as Record<string, unknown> | null
 const cls = r.classes as Record<string, unknown> | null
 const tch = cls?.teachers as Record<string, unknown> | null
 const sc = r.schedules as Record<string, unknown> | null
 const sub = cls?.subject != null ? String(cls.subject) : "—"
 const course = cls?.courses as Record<string, unknown> | null
 const courseName = course?.course_name != null ? String(course.course_name) : null
 const code = cls?.course_code_full != null ? String(cls.course_code_full) : null
 return {
  id: String(r.id),
  student_id: String(r.student_id),
  class_id: String(r.class_id),
  schedule_id: r.schedule_id != null ? String(r.schedule_id) : null,
  leave_date: String(r.leave_date ?? ""),
  leave_reason: r.leave_reason != null ? String(r.leave_reason) : null,
  makeup_type: r.makeup_type != null ? String(r.makeup_type) : null,
  makeup_date: r.makeup_date != null ? String(r.makeup_date) : null,
  makeup_schedule_id: r.makeup_schedule_id != null ? String(r.makeup_schedule_id) : null,
  tuition_disposition:
   r.tuition_disposition != null
    ? (String(r.tuition_disposition) as LeaveTuitionDisposition)
    : null,
  status: String(r.status ?? ""),
  remarks: r.remarks != null ? String(r.remarks) : null,
  student_name: st?.full_name != null ? String(st.full_name) : null,
  student_grade: st?.grade != null ? String(st.grade) : null,
  class_subject: formatClassLabel({ subject: sub, courseCode: code, courseName }),
  course_code_full: code,
  teacher_name: tch?.full_name != null ? String(tch.full_name) : null,
  sched_date: sc?.scheduled_date != null ? String(sc.scheduled_date) : null,
  sched_start: sc?.start_time != null ? String(sc.start_time) : null,
  sched_end: sc?.end_time != null ? String(sc.end_time) : null,
 }
}

const LEAVE_LIST_COLUMNS =
 "id, student_id, class_id, schedule_id, leave_date, leave_reason, makeup_type, makeup_date, makeup_schedule_id, tuition_disposition, status, remarks, students ( full_name, grade ), classes ( subject, course_code_full, academic_year_id, courses ( course_name ), teacher_id, teachers ( full_name ) ), schedules!leave_makeup_records_schedule_id_fkey ( scheduled_date, start_time, end_time )"

const LEAVE_LIST_COLUMNS_INNER_CLASS =
 "id, student_id, class_id, schedule_id, leave_date, leave_reason, makeup_type, makeup_date, makeup_schedule_id, tuition_disposition, status, remarks, students ( full_name, grade ), classes!inner ( subject, course_code_full, academic_year_id, courses ( course_name ), teacher_id, teachers ( full_name ) ), schedules!leave_makeup_records_schedule_id_fkey ( scheduled_date, start_time, end_time )"

const LEAVE_COMPLETED_STATUS_OR =
 "status.ilike.%已補課%,status.ilike.%已完成%,status.ilike.%放棄%"

export type LeaveOpsListResult = {
 rows: LeaveManageRow[]
 hiddenOlderCount: number
}

function mergeLeaveRows(parts: LeaveManageRow[][]): LeaveManageRow[] {
 const byId = new Map<string, LeaveManageRow>()
 for (const part of parts) {
  for (const row of part) byId.set(row.id, row)
 }
 return [...byId.values()].sort((a, b) => {
  if (a.leave_date !== b.leave_date) return a.leave_date.localeCompare(b.leave_date)
  return a.id.localeCompare(b.id)
 })
}

async function mapLeaveListResult(result: {
 data: unknown
 error: unknown
}): Promise<LeaveManageRow[]> {
 if (result.error) throwPostgrest(result.error)
 return ((result.data as Record<string, unknown>[] | null) ?? []).map((x) => mapRow(x))
}

async function mapLeaveListResultOptional(
 result: { data: unknown; error: unknown },
 label: string
): Promise<LeaveManageRow[]> {
 if (result.error) {
  console.warn(`[fetchLeaveMakeupWithRelations] ${label}`, result.error)
  return []
 }
 return ((result.data as Record<string, unknown>[] | null) ?? []).map((x) => mapRow(x))
}

/**
 * 請假管理列表。預設：待處理／待補不限年；已完成／放棄跟日常營運窗。
 * 深連結以 extraIds／extraStudentIds bypass。唔改堂數對帳／學生詳情 fetch。
 */
export async function fetchLeaveMakeupWithRelations(opts?: {
 includeOlderYears?: boolean
 extraIds?: string[]
 extraStudentIds?: string[]
}): Promise<LeaveOpsListResult> {
 if (!supabase) return { rows: [], hiddenOlderCount: 0 }
 const includeOlder = Boolean(opts?.includeOlderYears) || !isSoftArchiveQueriesEnabled()
 const extraIds = (opts?.extraIds ?? []).map((id) => id.trim()).filter(Boolean)
 const extraStudentIds = (opts?.extraStudentIds ?? []).map((id) => id.trim()).filter(Boolean)

 const runFull = async () => {
  const { data, error } = await supabase!
   .from("leave_makeup_records")
   .select(LEAVE_LIST_COLUMNS)
   .order("leave_date", { ascending: true })
   .order("created_at", { ascending: true })
  return { rows: await mapLeaveListResult({ data, error }), hiddenOlderCount: 0 }
 }

 if (includeOlder) return runFull()

 const window = await fetchOpsAcademicYearWindow()
 if (!window || window.ids.length === 0) return runFull()

 const pendingQ = supabase
  .from("leave_makeup_records")
  .select(LEAVE_LIST_COLUMNS)
  .not("status", "ilike", "%已補課%")
  .not("status", "ilike", "%已完成%")
  .not("status", "ilike", "%放棄%")
 const completedInWindowQ = supabase
  .from("leave_makeup_records")
  .select(LEAVE_LIST_COLUMNS_INNER_CLASS)
  .or(LEAVE_COMPLETED_STATUS_OR)
  .in("classes.academic_year_id", window.ids)
 const completedNoClassQ = supabase
  .from("leave_makeup_records")
  .select(LEAVE_LIST_COLUMNS)
  .or(LEAVE_COMPLETED_STATUS_OR)
  .is("class_id", null)
 const completedNullYearQ = supabase
  .from("leave_makeup_records")
  .select(LEAVE_LIST_COLUMNS)
  .or(LEAVE_COMPLETED_STATUS_OR)
  .not("class_id", "is", null)
  .is("classes.academic_year_id", null)
 const extraByIdQ =
  extraIds.length > 0
   ? supabase.from("leave_makeup_records").select(LEAVE_LIST_COLUMNS).in("id", extraIds)
   : null
 const extraByStudentQ =
  extraStudentIds.length > 0
   ? supabase.from("leave_makeup_records").select(LEAVE_LIST_COLUMNS).in("student_id", extraStudentIds)
   : null
 const allClosedCountQ = supabase
  .from("leave_makeup_records")
  .select("id", { count: "exact", head: true })
  .or(LEAVE_COMPLETED_STATUS_OR)
 const inWindowCountQ = supabase
  .from("leave_makeup_records")
  .select("id, classes!inner(academic_year_id)", { count: "exact", head: true })
  .or(LEAVE_COMPLETED_STATUS_OR)
  .in("classes.academic_year_id", window.ids)
 const noClassCountQ = supabase
  .from("leave_makeup_records")
  .select("id", { count: "exact", head: true })
  .or(LEAVE_COMPLETED_STATUS_OR)
  .is("class_id", null)
 const nullYearCountQ = supabase
  .from("leave_makeup_records")
  .select("id, classes(academic_year_id)", { count: "exact", head: true })
  .or(LEAVE_COMPLETED_STATUS_OR)
  .not("class_id", "is", null)
  .is("classes.academic_year_id", null)

 const [
  pendingRes,
  completedInWindowRes,
  completedNoClassRes,
  completedNullYearRes,
  extraByIdRes,
  extraByStudentRes,
  allClosed,
  inWindowCount,
  noClassCount,
  nullYearCount,
 ] = await Promise.all([
  pendingQ,
  completedInWindowQ,
  completedNoClassQ,
  completedNullYearQ,
  extraByIdQ ?? Promise.resolve({ data: [], error: null }),
  extraByStudentQ ?? Promise.resolve({ data: [], error: null }),
  headCountOrNull(allClosedCountQ),
  headCountOrNull(inWindowCountQ),
  headCountOrNull(noClassCountQ),
  headCountOrNull(nullYearCountQ),
 ])

 const keptWithoutYear =
  noClassCount != null && nullYearCount != null ? noClassCount + nullYearCount : null

 const parts = await Promise.all([
  mapLeaveListResult(pendingRes),
  mapLeaveListResult(completedInWindowRes),
  mapLeaveListResultOptional(completedNoClassRes, "completedNoClass"),
  mapLeaveListResultOptional(completedNullYearRes, "completedNullYear"),
  mapLeaveListResult(extraByIdRes),
  mapLeaveListResult(extraByStudentRes),
 ])

 return {
  rows: mergeLeaveRows(parts),
  hiddenOlderCount: hiddenOlderCountFromParts(allClosed, inWindowCount, keptWithoutYear),
 }
}

export type LeaveTodayStats = {
 /** 今日請假紀錄涉及的不重複學生數 */
 leaveStudentCount: number
 /** 今日補堂日期（makeup_date）的不重複學生數 */
 makeupStudentCount: number
}

export async function fetchLeaveTodayStats(): Promise<LeaveTodayStats> {
 const empty: LeaveTodayStats = { leaveStudentCount: 0, makeupStudentCount: 0 }
 if (!supabase) return empty
 const today = localYmd()
 const [leaveRes, makeupRes] = await Promise.all([
  supabase.from("leave_makeup_records").select("student_id").eq("leave_date", today),
  supabase.from("leave_makeup_records").select("student_id").eq("makeup_date", today),
 ])
 if (leaveRes.error) throwPostgrest(leaveRes.error)
 if (makeupRes.error) throwPostgrest(makeupRes.error)
 const leaveIds = new Set((leaveRes.data ?? []).map((r) => String((r as { student_id: string }).student_id)))
 const makeupIds = new Set((makeupRes.data ?? []).map((r) => String((r as { student_id: string }).student_id)))
 return {
  leaveStudentCount: leaveIds.size,
  makeupStudentCount: makeupIds.size,
 }
}

/** 點名頁標題徽章。本波維持全庫 `ilike("%待補%")`，唔加老師／日期篩選、唔對齊 pending enum。 */
export async function countPendingMakeupRecords(): Promise<number> {
 if (!supabase) throw new Error("尚未設定 Supabase")
 const { count, error } = await supabase
  .from("leave_makeup_records")
  .select("id", { count: "exact", head: true })
  .ilike("status", "%待補%")
 if (error) throwPostgrest(error)
 return count ?? 0
}

export function isLeaveStatusPending(status: string): boolean {
 const s = status.trim()
 if (s.includes("放棄")) return false
 if (s.includes("已補課") || s.includes("已完成")) return false
 return true
}

export function isLeaveStatusDone(status: string): boolean {
 const s = status.trim()
 return s.includes("已補課") || s.includes("已完成")
}

export function isLeaveStatusAbandoned(status: string): boolean {
 return status.includes("放棄")
}

export type LeaveAttendanceAction = "delete" | "keep"

export type LeaveAttendanceChangeOptions = {
 /** 有可刪出席時必填：一併刪或保留 */
 attendanceAction?: LeaveAttendanceAction
 /** attendanceAction=delete 時：只刪掃描結果內的這些 id */
 deleteAttendanceIds?: string[]
}

function formatLeaveOrphanGateError(hits: AttendanceLifecycleHit[], leaveId: string): string {
 const names = [...new Set(hits.map((h) => h.studentName).filter(Boolean))]
 const namePart = names.length > 0 ? names.join("、") : "學生"
 return (
  `此請假變更會使 ${hits.length} 筆補堂出席失去資格（${namePart}）。` +
  `請至請假管理確認一併刪除或保留出席。請假 id=${leaveId}`
 )
}

/** A1：取消請假／清／改調堂前掃描可刪出席（含 peers＋eligibility） */
export async function previewLeaveMakeupAttendanceImpact(
 id: string,
 opts?: { forDelete?: boolean; patch?: { makeup_schedule_id?: string | null; makeup_type?: string | null } }
): Promise<AttendanceLifecycleHit[]> {
 if (!supabase) return []
 const { data: existing, error } = await supabase
  .from("leave_makeup_records")
  .select("id, student_id, makeup_schedule_id, makeup_type")
  .eq("id", id)
  .maybeSingle()
 if (error) throwPostgrest(error)
 if (!existing) return []
 const row = existing as Record<string, unknown>
 const studentId = row.student_id != null ? String(row.student_id) : ""
 const prevMakeup = row.makeup_schedule_id != null ? String(row.makeup_schedule_id) : ""
 if (!studentId || !prevMakeup) return []

 if (opts?.forDelete) {
  return scanDeletableAttendanceForMakeupSchedule({
   studentId,
   leaveId: id,
   oldMakeupScheduleId: prevMakeup,
  })
 }

 const patch = opts?.patch
 if (!patch) return []

 const nextSched = patch.makeup_schedule_id
 // A1：只掃 makeup_schedule_id 清／改；type 離調堂未帶 schedule 清屬 A2（UI 路徑會帶 null）
 if (nextSched === undefined) return []
 if (nextSched === null) {
  return scanDeletableAttendanceForMakeupSchedule({
   studentId,
   leaveId: id,
   oldMakeupScheduleId: prevMakeup,
  })
 }
 if (String(nextSched) !== prevMakeup) {
  return scanDeletableAttendanceForMakeupSchedule({
   studentId,
   leaveId: id,
   oldMakeupScheduleId: prevMakeup,
  })
 }
 return []
}

async function applyLeaveAttendanceDeletes(
 leaveId: string,
 hits: AttendanceLifecycleHit[],
 options?: LeaveAttendanceChangeOptions,
 reason = "leave_cancel"
): Promise<void> {
 if (hits.length === 0) return
 const action = options?.attendanceAction
 if (action === "keep") return
 if (action !== "delete") {
  throw new Error(formatLeaveOrphanGateError(hits, leaveId))
 }
 const allow = new Set((options?.deleteAttendanceIds ?? []).filter(Boolean))
 if (allow.size === 0) {
  throw new Error(formatLeaveOrphanGateError(hits, leaveId))
 }
 const toDelete = hits.filter((h) => allow.has(h.id))
 if (toDelete.length === 0) {
  throw new Error(formatLeaveOrphanGateError(hits, leaveId))
 }
 await deleteAttendanceHitsWithAuditOrThrow(toDelete, reason)
}

/** A2 O1-type：disposition≠調堂且仍有 makeup schedule → 掃可刪出席 */
export async function previewLeaveDispositionAttendanceImpact(
 id: string,
 nextDisposition: LeaveTuitionDisposition
): Promise<AttendanceLifecycleHit[]> {
 if (!supabase) return []
 if (nextDisposition === "調堂") return []
 const { data: existing, error } = await supabase
  .from("leave_makeup_records")
  .select("id, student_id, makeup_schedule_id")
  .eq("id", id)
  .maybeSingle()
 if (error) throwPostgrest(error)
 if (!existing) return []
 const row = existing as Record<string, unknown>
 const studentId = row.student_id != null ? String(row.student_id) : ""
 const prevMakeup = row.makeup_schedule_id != null ? String(row.makeup_schedule_id) : ""
 if (!studentId || !prevMakeup) return []
 return scanDeletableAttendanceForMakeupSchedule({
  studentId,
  leaveId: id,
  oldMakeupScheduleId: prevMakeup,
 })
}

function mapLeaveAwaitingMakeupRow(r: Record<string, unknown>): LeaveAwaitingMakeupRow {
 return {
  id: String(r.id),
  studentId: String(r.student_id),
  classId: String(r.class_id),
  leaveDate: String(r.leave_date ?? "").slice(0, 10),
  leaveReason: r.leave_reason != null ? String(r.leave_reason) : null,
  makeupType: r.makeup_type != null ? String(r.makeup_type) : null,
 }
}

/** 學生請假尚無補堂日的紀錄（進堂數對帳） */
export async function fetchLeavesAwaitingMakeupDateForStudent(
 studentId: string
): Promise<LeaveAwaitingMakeupRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("leave_makeup_records")
  .select("id, student_id, class_id, leave_date, leave_reason, makeup_type, makeup_date, makeup_schedule_id, status")
  .eq("student_id", studentId)
  .order("leave_date", { ascending: true })
 if (error) throwPostgrest(error)
 return (data ?? [])
  .filter((row) => {
   const r = row as Record<string, unknown>
   return leaveNeedsMakeupDate({
    makeupType: r.makeup_type as string | null,
    makeupDate: r.makeup_date as string | null,
    makeupScheduleId: r.makeup_schedule_id as string | null,
    status: r.status as string | null,
   })
  })
  .map((row) => mapLeaveAwaitingMakeupRow(row as Record<string, unknown>))
}

/** 批次：多位學生請假尚無補堂日 */
export async function fetchLeavesAwaitingMakeupDateForStudents(
 studentIds: string[]
): Promise<Map<string, LeaveAwaitingMakeupRow[]>> {
 const byStudent = new Map<string, LeaveAwaitingMakeupRow[]>()
 if (!supabase || studentIds.length === 0) return byStudent
 await forEachIdChunk(studentIds, DEFAULT_ID_CHUNK, async (slice) => {
  const { data, error } = await supabase!
   .from("leave_makeup_records")
   .select(
    "id, student_id, class_id, leave_date, leave_reason, makeup_type, makeup_date, makeup_schedule_id, status"
   )
   .in("student_id", slice)
   .order("leave_date", { ascending: true })
  if (error) throwPostgrest(error)
  for (const row of data ?? []) {
   const r = row as Record<string, unknown>
   if (
    !leaveNeedsMakeupDate({
     makeupType: r.makeup_type as string | null,
     makeupDate: r.makeup_date as string | null,
     makeupScheduleId: r.makeup_schedule_id as string | null,
     status: r.status as string | null,
    })
   ) {
    continue
   }
   const mapped = mapLeaveAwaitingMakeupRow(r)
   const list = byStudent.get(mapped.studentId) ?? []
   list.push(mapped)
   byStudent.set(mapped.studentId, list)
  }
 })
 return byStudent
}

export async function updateLeaveMakeupRecord(
 id: string,
 patch: {
  status?: string
  makeup_type?: string | null
  makeup_date?: string | null
  leave_reason?: string | null
  remarks?: string | null
  makeup_schedule_id?: string | null
  tuition_disposition?: LeaveTuitionDisposition | null
 },
 options?: LeaveAttendanceChangeOptions
): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { data: existing, error: fetchErr } = await supabase
  .from("leave_makeup_records")
  .select(
   "leave_date, class_id, student_id, schedule_id, makeup_date, makeup_schedule_id, students ( full_name ), classes ( teacher_id, subject, course_code_full, courses ( course_name ) )"
  )
  .eq("id", id)
  .maybeSingle()
 if (fetchErr) throwPostgrest(fetchErr)
 if (!existing) throw new Error("找不到請假紀錄")
 const prev = existing as Record<string, unknown>
 assertAcademicYearEditableForDate(String(prev.leave_date ?? ""))
 if (patch.makeup_date) assertAcademicYearEditableForDate(patch.makeup_date)

 const orphanHits = await previewLeaveMakeupAttendanceImpact(id, { patch })
 await applyLeaveAttendanceDeletes(id, orphanHits, options)

 const { error } = await supabase
  .from("leave_makeup_records")
  .update({ ...patch, updated_at: new Date().toISOString() })
  .eq("id", id)
 if (error) {
  if (orphanHits.length > 0 && options?.attendanceAction === "delete") {
   throw new Error(
    `出席已刪、請假未改，請重試清調堂／刪請假。原錯誤：${error.message}`
   )
  }
  throwPostgrest(error)
 }

 const prevMakeupDate = prev.makeup_date != null ? String(prev.makeup_date).slice(0, 10) : ""
 const prevMakeupSched =
  prev.makeup_schedule_id != null ? String(prev.makeup_schedule_id) : ""
 const nextMakeupDate =
  patch.makeup_date !== undefined
   ? patch.makeup_date
     ? String(patch.makeup_date).slice(0, 10)
     : ""
   : prevMakeupDate
 const nextMakeupSched =
  patch.makeup_schedule_id !== undefined
   ? patch.makeup_schedule_id
     ? String(patch.makeup_schedule_id)
     : ""
   : prevMakeupSched

 if (
  patch.makeup_schedule_id !== undefined
  && prev.student_id != null
  && prev.class_id != null
 ) {
  await syncStudentMakeupDeclaration({
   studentId: String(prev.student_id),
   classId: String(prev.class_id),
   leaveScheduleId: prev.schedule_id != null ? String(prev.schedule_id) : null,
   leaveRecordId: id,
   prevMakeupScheduleId: prevMakeupSched || null,
   nextMakeupScheduleId: nextMakeupSched || null,
  })
 }

 const arranged =
  (Boolean(nextMakeupDate) || Boolean(nextMakeupSched)) &&
  (nextMakeupDate !== prevMakeupDate || nextMakeupSched !== prevMakeupSched)
 if (arranged) {
  const st = prev.students as Record<string, unknown> | null
  const cls = prev.classes as Record<string, unknown> | null
  const course = cls?.courses as Record<string, unknown> | null
  const studentName = st?.full_name != null ? String(st.full_name) : "學生"
  const classLabel = formatClassLabel({
   subject: cls?.subject != null ? String(cls.subject) : "—",
   courseCode: cls?.course_code_full != null ? String(cls.course_code_full) : "",
   courseName: course?.course_name != null ? String(course.course_name) : null,
  })
  const classId = prev.class_id != null ? String(prev.class_id) : null
  const teacherId = cls?.teacher_id != null ? String(cls.teacher_id) : null
  const makeupScheduleId = nextMakeupSched || null
  void recordInboxEvent({
   eventType: "leave_created",
   title: `補堂已排定：${studentName}`,
   body: `${classLabel}${nextMakeupDate ? ` · 補堂日 ${nextMakeupDate}` : ""}`,
   actionPath: makeupScheduleId
    ? `/Schedule/${makeupScheduleId}`
    : prev.schedule_id
      ? `/Schedule/${String(prev.schedule_id)}`
      : "/LeaveManagement",
   classId,
   scheduleId: makeupScheduleId,
   studentId: prev.student_id != null ? String(prev.student_id) : null,
   audienceTeacherIds: [teacherId],
   payload: {
    leaveRecordId: id,
    makeupDate: nextMakeupDate || null,
    makeupScheduleId,
    arranged: true,
   },
  })
 }
}

export async function setLeaveTuitionDisposition(
 id: string,
 disposition: LeaveTuitionDisposition,
 options?: LeaveAttendanceChangeOptions
): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { data: leave, error: leaveErr } = await supabase
  .from("leave_makeup_records")
  .select("id, student_id, class_id, leave_date, makeup_schedule_id")
  .eq("id", id)
  .maybeSingle()
 if (leaveErr) throwPostgrest(leaveErr)
 if (!leave) throw new Error("找不到請假紀錄")
 const row = leave as Record<string, unknown>
 const leaveDate = String(row.leave_date).slice(0, 10)
 assertAcademicYearEditableForDate(leaveDate)
 const billingMonth = `${leaveDate.slice(0, 7)}-01`
 const { data: charge, error: chargeErr } = await supabase
  .from("monthly_tuition_charges")
  .select("id, unit_price, status")
  .eq("student_id", String(row.student_id))
  .eq("class_id", String(row.class_id))
  .eq("billing_month", billingMonth)
  .neq("status", "作廢")
  .maybeSingle()
 if (chargeErr) throwPostgrest(chargeErr)
 const chargeStatus = charge ? String((charge as Record<string, unknown>).status) : ""
 if ((disposition as string) === "轉結餘") {
  throw new Error(
   "已停用「轉結餘」：日常學費按已繳堂數扣堂。請假唔嚟請用調堂／錄影／不補回（唔扣堂）；退讀退款另案處理。"
  )
 }
 if (disposition === "減收" && ["已繳", "已抵扣"].includes(chargeStatus)) {
  throw new Error("此月份已收款，請改選調堂、錄影或不補回（已停用轉結餘）")
 }

 const { data: existingCredit, error: creditErr } = await supabase
  .from("tuition_credit_entries")
  .select("id, status")
  .eq("source_leave_id", id)
  .neq("status", "作廢")
  .maybeSingle()
 if (creditErr) throwPostgrest(creditErr)
 if (existingCredit && String((existingCredit as Record<string, unknown>).status) === "已抵扣") {
  throw new Error("此結餘已用於其他帳單，不能更改處理方式")
 }

 // A2：Confirm／刪出席 → 再寫／作廢 credit（禁止 Confirm 前寫 credit）
 const orphanHits = await previewLeaveDispositionAttendanceImpact(id, disposition)
 await applyLeaveAttendanceDeletes(id, orphanHits, options, "leave_disposition")

 if (existingCredit) {
  const { error } = await supabase
   .from("tuition_credit_entries")
   .update({ status: "作廢" })
   .eq("id", String((existingCredit as Record<string, unknown>).id))
   .eq("status", "可用")
  if (error) throwPostgrest(error)
 }

 const clearMakeupSchedule = disposition !== "調堂"
 const makeupType: string | null =
  disposition === "調堂" ? "調堂" : disposition === "錄影" ? "錄影" : null
 const prevMakeupSched =
  row.makeup_schedule_id != null ? String(row.makeup_schedule_id) : null
 const { error: updateErr } = await supabase
  .from("leave_makeup_records")
  .update({
   tuition_disposition: disposition,
   makeup_type: makeupType,
   ...(clearMakeupSchedule
    ? { makeup_schedule_id: null, makeup_date: null }
    : {}),
   updated_at: new Date().toISOString(),
  })
  .eq("id", id)
 if (updateErr) {
  if (orphanHits.length > 0 && options?.attendanceAction === "delete") {
   throw new Error(
    `出席已刪、學費處理未改，請重試。原錯誤：${updateErr.message}`
   )
  }
  throwPostgrest(updateErr)
 }

 if (clearMakeupSchedule && prevMakeupSched && row.student_id != null && row.class_id != null) {
  await syncStudentMakeupDeclaration({
   studentId: String(row.student_id),
   classId: String(row.class_id),
   leaveRecordId: id,
   prevMakeupScheduleId: prevMakeupSched,
   nextMakeupScheduleId: null,
  })
 }
}

export async function deleteLeaveMakeupRecord(
 id: string,
 options?: LeaveAttendanceChangeOptions
): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { data: existing, error: fetchErr } = await supabase
  .from("leave_makeup_records")
  .select("leave_date")
  .eq("id", id)
  .maybeSingle()
 if (fetchErr) throwPostgrest(fetchErr)
 if (!existing) throw new Error("找不到請假紀錄")
 assertAcademicYearEditableForDate(String((existing as { leave_date?: string }).leave_date ?? ""))

 const orphanHits = await previewLeaveMakeupAttendanceImpact(id, { forDelete: true })
 await applyLeaveAttendanceDeletes(id, orphanHits, options)

 const { error } = await supabase.from("leave_makeup_records").delete().eq("id", id)
 if (error) {
  if (orphanHits.length > 0 && options?.attendanceAction === "delete") {
   throw new Error(
    `出席已刪、請假未改，請重試刪除請假。原錯誤：${error.message}`
   )
  }
  throwPostgrest(error)
 }
}

const LEAVE_DUPLICATE_MESSAGE = "此學生對該排程已有請假紀錄，不可重複新增"

export async function findLeaveRecordForStudentSchedule(
 studentId: string,
 scheduleId: string
): Promise<{ id: string } | null> {
 if (!supabase || !scheduleId.trim()) return null
 const { data, error } = await supabase
  .from("leave_makeup_records")
  .select("id")
  .eq("student_id", studentId)
  .eq("schedule_id", scheduleId)
  .maybeSingle()
 if (error) throwPostgrest(error)
 return data?.id != null ? { id: String(data.id) } : null
}

async function fetchLeaveScheduleIdsForStudent(
 studentId: string,
 scheduleIds: string[]
): Promise<Set<string>> {
 if (!supabase || scheduleIds.length === 0) return new Set()
 const { data, error } = await supabase
  .from("leave_makeup_records")
  .select("schedule_id")
  .eq("student_id", studentId)
  .in("schedule_id", scheduleIds)
 if (error) throwPostgrest(error)
 const out = new Set<string>()
 for (const row of data ?? []) {
  const sid = (row as { schedule_id?: string | null }).schedule_id
  if (sid) out.add(String(sid))
 }
 return out
}

export async function validateLeaveScheduleNotDuplicate(
 studentId: string,
 scheduleId: string
): Promise<string | null> {
 const existing = await findLeaveRecordForStudentSchedule(studentId, scheduleId)
 return existing ? LEAVE_DUPLICATE_MESSAGE : null
}

export async function insertLeaveMakeupRecord(row: {
 student_id: string
 class_id: string
 schedule_id?: string | null
 leave_date: string
 leave_reason?: string | null
 makeup_type?: string | null
 makeup_schedule_id?: string | null
 makeup_date?: string | null
 remarks?: string | null
 status?: string
 tuition_disposition?: LeaveTuitionDisposition | null
}): Promise<string> {
 if (!supabase) throw new Error("Supabase 未設定")
 assertAcademicYearEditableForDate(row.leave_date)
 if (row.schedule_id) {
  const dup = await validateLeaveScheduleNotDuplicate(row.student_id, row.schedule_id)
  if (dup) throw new Error(dup)
 }
 const { data: inserted, error } = await supabase
  .from("leave_makeup_records")
  .insert({
   student_id: row.student_id,
   class_id: row.class_id,
   schedule_id: row.schedule_id ?? null,
   leave_date: row.leave_date,
   leave_reason: row.leave_reason ?? null,
   makeup_type: row.makeup_type ?? null,
   makeup_schedule_id: row.makeup_schedule_id ?? null,
   makeup_date: row.makeup_date ?? null,
   remarks: row.remarks ?? null,
   status: row.status ?? "待補課",
   tuition_disposition: null,
  })
  .select("id")
  .single()
 if (error) {
  const code = (error as { code?: string }).code
  if (code === "23505") throw new Error(LEAVE_DUPLICATE_MESSAGE)
  throwPostgrest(error)
 }
 const insertedId = String((inserted as { id: string }).id)
 if (row.tuition_disposition) {
  try {
   await setLeaveTuitionDisposition(insertedId, row.tuition_disposition)
  } catch (dispositionError) {
   await supabase.from("leave_makeup_records").delete().eq("id", insertedId)
   throw dispositionError
  }
 }
 return insertedId
}

export const PAST_ENROLLMENT_START_LEAVE_REMARKS = "報讀首堂已過，系統自動請假"

/**
 * 過去首堂報讀：為區間內每堂建立請假（事假／待安排）。
 * 已有請假的排程略過。回傳第一筆新建請假 id（無則 null）。
 */
export async function insertPastEnrollmentStartLeaves(opts: {
 studentId: string
 classId: string
 schedules: Array<{ id: string; scheduled_date: string }>
 remarks?: string | null
}): Promise<{ firstLeaveId: string | null; createdCount: number }> {
 if (opts.schedules.length === 0) return { firstLeaveId: null, createdCount: 0 }
 const already = await fetchLeaveScheduleIdsForStudent(
  opts.studentId,
  opts.schedules.map((s) => s.id)
 )
 const remarks = opts.remarks?.trim() || PAST_ENROLLMENT_START_LEAVE_REMARKS
 let firstLeaveId: string | null = null
 let createdCount = 0
 for (const sched of opts.schedules) {
  if (already.has(sched.id)) continue
  const leaveDate = sched.scheduled_date.slice(0, 10)
  try {
   const id = await insertLeaveMakeupRecord({
    student_id: opts.studentId,
    class_id: opts.classId,
    schedule_id: sched.id,
    leave_date: leaveDate,
    leave_reason: "事假",
    makeup_type: "待安排",
    status: "待補課",
    remarks,
   })
   createdCount += 1
   if (!firstLeaveId) firstLeaveId = id
  } catch (e) {
   if (e instanceof Error && e.message === LEAVE_DUPLICATE_MESSAGE) continue
   throw e
  }
 }
 return { firstLeaveId, createdCount }
}

/** 請假：預設只請本節；consecutiveScope=all 時連堂整組各建一筆 */
export async function insertLeaveMakeupForSchedule(row: {
 student_id: string
 class_id: string
 schedule_id: string
 leave_date: string
 leave_reason?: string | null
 makeup_type?: string | null
 makeup_schedule_id?: string | null
 makeup_date?: string | null
 remarks?: string | null
 status?: string
 tuition_disposition?: LeaveTuitionDisposition | null
 /** this_slot＝只請本節（預設）；all＝連堂兩節 */
 consecutiveScope?: ConsecutiveLeaveScope
}): Promise<void> {
 const scope = row.consecutiveScope ?? "this_slot"
 const scheduleIds =
  scope === "this_slot"
   ? [row.schedule_id]
   : await fetchConsecutiveScheduleIds(row.schedule_id)
 const multi = scheduleIds.length > 1
 for (let i = 0; i < scheduleIds.length; i++) {
  const scheduleId = scheduleIds[i]!
  const applyMakeupHere = !multi || i === 0
  await insertLeaveMakeupRecord({
   student_id: row.student_id,
   class_id: row.class_id,
   schedule_id: scheduleId,
   leave_date: row.leave_date,
   leave_reason: row.leave_reason,
   makeup_type:
    applyMakeupHere
     ? row.makeup_type
     : row.makeup_type === "調堂"
       ? "待安排"
       : row.makeup_type,
   makeup_schedule_id: applyMakeupHere ? row.makeup_schedule_id : null,
   makeup_date: applyMakeupHere ? row.makeup_date : null,
   remarks: row.remarks,
   status: row.status,
   tuition_disposition: row.tuition_disposition,
  })
 }
}

/** 請假排程選項顯示（含連堂節次） */
export function formatLeaveScheduleOptionLabel(s: {
 scheduled_date: string
 start_time: string | null
 end_time: string | null
 consecutive_group_id?: string | null
 consecutive_slot_index?: number | null
}): string {
 const time = `${s.start_time ?? ""}–${s.end_time ?? ""}`.trim()
 const base = `${s.scheduled_date} ${time}`.trim()
 if (s.consecutive_group_id && s.consecutive_slot_index != null) {
  return `${base}（連堂·第 ${s.consecutive_slot_index} 節）`
 }
 return base
}

/** 補堂候選顯示：連堂標第幾節，方便單項綁定 */
export function formatMakeupCandidateLabel(s: {
 scheduled_date: string
 start_time: string | null
 end_time: string | null
 classLabel?: string | null
 subject?: string | null
 course_code_full?: string | null
 teacher_name?: string | null
 consecutive_group_id?: string | null
 consecutive_slot_index?: number | null
}): string {
 const cls = s.classLabel || s.subject || "—"
 const code = s.course_code_full ? ` (${s.course_code_full})` : ""
 const teacher = s.teacher_name ?? "—"
 const slot =
  s.consecutive_group_id && s.consecutive_slot_index != null
   ? ` · 連堂第 ${s.consecutive_slot_index} 節`
   : ""
 return `${s.scheduled_date} ${s.start_time ?? ""}–${s.end_time ?? ""} · ${cls}${code} · ${teacher}${slot}`
}

/** 老師首頁：所屬班請假摘要 */
export type TeacherPortalLeaveRow = {
 id: string
 studentName: string
 classLabel: string
 leaveDate: string
 leaveReason: string | null
 makeupType: string | null
 status: string
 scheduleId: string | null
}

export async function fetchLeaveRowsForClassIds(
 classIds: string[],
 limit = 40,
 fromYmd?: string | null
): Promise<TeacherPortalLeaveRow[]> {
 if (!supabase || classIds.length === 0) return []
 const from = (fromYmd ?? "").trim().slice(0, 10)
 const chunks = await forEachIdChunk(classIds, DEFAULT_ID_CHUNK, async (slice) => {
  let q = supabase!
   .from("leave_makeup_records")
   .select(
    "id, leave_date, leave_reason, makeup_type, status, schedule_id, students ( full_name ), classes ( subject, course_code_full, courses ( course_name ) )"
   )
   .in("class_id", slice)
   .order("leave_date", { ascending: false })
   .limit(limit)
  if (from) q = q.gte("leave_date", from)
  const { data, error } = await q
  if (error) throwPostgrest(error)
  return data ?? []
 })
 const mapped = chunks.flat().map((row) => {
  const r = row as Record<string, unknown>
  const st = r.students as Record<string, unknown> | null
  const cls = r.classes as Record<string, unknown> | null
  const sub = cls?.subject != null ? String(cls.subject) : "—"
  const code = cls?.course_code_full != null ? String(cls.course_code_full) : ""
  const course = cls?.courses as Record<string, unknown> | null
  const courseName = course?.course_name != null ? String(course.course_name) : null
  return {
   id: String(r.id),
   studentName: st?.full_name != null ? String(st.full_name) : "—",
   classLabel: formatClassLabel({ subject: sub, courseCode: code, courseName }),
   leaveDate: String(r.leave_date ?? ""),
   leaveReason: r.leave_reason != null ? String(r.leave_reason) : null,
   makeupType: r.makeup_type != null ? String(r.makeup_type) : null,
   status: String(r.status ?? ""),
   scheduleId: r.schedule_id != null ? String(r.schedule_id) : null,
  } satisfies TeacherPortalLeaveRow
 })
 mapped.sort((a, b) => b.leaveDate.localeCompare(a.leaveDate))
 return mapped.slice(0, limit)
}

export type EnrolledClassOption = {
 id: string
 subject: string
 course_code_full: string | null
}

/** 學生「就讀中」班別（新增請假用） */
export async function fetchEnrolledClassesForStudent(studentId: string): Promise<EnrolledClassOption[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("student_class_enrollments")
  .select("class_id, classes ( id, subject, course_code_full, courses ( course_name ) )")
  .eq("student_id", studentId)
  .eq("status", "就讀中")
 if (error) throwPostgrest(error)
 const out: EnrolledClassOption[] = []
 for (const row of data ?? []) {
  const r = row as Record<string, unknown>
  const cls = r.classes as Record<string, unknown> | null
  if (!cls?.id) continue
  const course = cls.courses as Record<string, unknown> | null
  const courseName = course?.course_name != null ? String(course.course_name) : null
  const sub = cls.subject != null ? String(cls.subject) : "—"
  const code = cls.course_code_full != null ? String(cls.course_code_full) : null
  out.push({
   id: String(cls.id),
   subject: classDisplayName({ subject: sub, courseName }),
   course_code_full: code,
  })
 }
 out.sort((a, b) => a.subject.localeCompare(b.subject, "zh-Hant"))
 return out
}

export type ClassScheduleOption = {
 id: string
 scheduled_date: string
 start_time: string | null
 end_time: string | null
 status: string
 consecutive_group_id: string | null
 consecutive_slot_index: number | null
}

/** 連堂請假範圍：整組兩節，或只請所選那一節 */
export type ConsecutiveLeaveScope = "all" | "this_slot"

/** 該班「未上堂」排程：日期 ≥ fromYmd，且狀態非取消／非完成；暑期兩期依學生報讀期數過濾 */
export async function fetchUpcomingSchedulesForClass(
 classId: string,
 fromYmd: string,
 studentId?: string
): Promise<ClassScheduleOption[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("schedules")
  .select("id, scheduled_date, start_time, end_time, status, consecutive_group_id, consecutive_slot_index")
  .eq("class_id", classId)
  .gte("scheduled_date", fromYmd)
  .order("scheduled_date", { ascending: true })
  .order("start_time", { ascending: true })
 if (error) throwPostgrest(error)
 let rows = (data ?? [])
  .map((row) => {
   const r = row as Record<string, unknown>
   const slotIdx =
    r.consecutive_slot_index != null && !Number.isNaN(Number(r.consecutive_slot_index))
     ? Number(r.consecutive_slot_index)
     : null
   return {
    id: String(r.id),
    scheduled_date: String(r.scheduled_date ?? ""),
    start_time: r.start_time != null ? String(r.start_time) : null,
    end_time: r.end_time != null ? String(r.end_time) : null,
    status: String(r.status ?? ""),
    consecutive_group_id:
     r.consecutive_group_id != null ? String(r.consecutive_group_id) : null,
    consecutive_slot_index: slotIdx,
   }
  })
  .filter((s) => !s.status.includes("取消") && !s.status.includes("完成"))

 if (studentId) {
  const { data: enr, error: enrErr } = await supabase
   .from("student_class_enrollments")
   .select("id, enrollment_period")
   .eq("student_id", studentId)
   .eq("class_id", classId)
   .maybeSingle()
  if (enrErr) throwPostgrest(enrErr)
  const enrollmentPeriod = normalizeEnrollmentPeriod(
   enr?.enrollment_period != null ? String(enr.enrollment_period) : null
  )
  if (isSingleSessionEnrollment(enrollmentPeriod)) {
   const enrollmentId = enr?.id != null ? String(enr.id) : ""
   const scheduleMap = enrollmentId
    ? await fetchEnrolledScheduleIdsByEnrollmentIds([enrollmentId])
    : new Map<string, Set<string>>()
   const allowed = scheduleMap.get(enrollmentId) ?? new Set<string>()
   rows = rows.filter((s) => allowed.has(s.id))
  } else {
   const config = await fetchClassEnrollmentConfig(classId)
   if (config.courseMode === "summer_two_period" && config.academicYearId) {
    const periods = await fetchAcademicYearPeriods(config.academicYearId)
    rows = rows.filter((s) => {
     const code = resolvePeriodCodeFromDate(s.scheduled_date, periods)
     if (code == null) return true
     return enrollmentCoversPeriod(enrollmentPeriod, code)
    })
   }
  }
 }

 if (studentId && rows.length > 0) {
  const leaveTaken = await fetchLeaveScheduleIdsForStudent(
   studentId,
   rows.map((r) => r.id)
  )
  rows = rows.filter((r) => !leaveTaken.has(r.id))
 }

 return rows
}

export type StudentUpcomingScheduleRow = {
 id: string
 class_id: string
 scheduled_date: string
 start_time: string | null
 end_time: string | null
 status: string
 session_number: number | null
 subject: string
 course_code_full: string | null
 teacher_name: string | null
 /** enrolled＝就讀班；makeup＝請假調堂目標（可跨班） */
 source: "enrolled" | "makeup"
}

const UPCOMING_SCHEDULE_SELECT =
 "id, class_id, scheduled_date, start_time, end_time, status, session_number, classes ( subject, course_code_full, academic_year_id, courses ( course_mode, course_name ) ), teachers!schedules_teacher_id_fkey ( full_name )"

function mapUpcomingScheduleRow(
 row: Record<string, unknown>,
 source: "enrolled" | "makeup"
): StudentUpcomingScheduleRow & { courseMode: string; academicYearId: string | null } {
 const cls = row.classes as Record<string, unknown> | null
 const teacher = row.teachers as Record<string, unknown> | null
 const sub = cls?.subject != null ? String(cls.subject) : "—"
 const course = cls?.courses as Record<string, unknown> | null
 const courseName = course?.course_name != null ? String(course.course_name) : null
 const courseCode = cls?.course_code_full != null ? String(cls.course_code_full) : null
 return {
  id: String(row.id),
  class_id: String(row.class_id ?? ""),
  scheduled_date: String(row.scheduled_date ?? ""),
  start_time: row.start_time != null ? String(row.start_time) : null,
  end_time: row.end_time != null ? String(row.end_time) : null,
  status: String(row.status ?? ""),
  session_number:
   row.session_number != null && !Number.isNaN(Number(row.session_number))
    ? Number(row.session_number)
    : null,
  subject: formatClassLabel({ subject: sub, courseCode, courseName }),
  course_code_full: courseCode,
  teacher_name: teacher?.full_name != null ? String(teacher.full_name) : null,
  source,
  courseMode: course?.course_mode != null ? String(course.course_mode) : "regular",
  academicYearId: cls?.academic_year_id != null ? String(cls.academic_year_id) : null,
 }
}

function isActiveUpcomingScheduleStatus(status: string): boolean {
 return !status.includes("取消") && !status.includes("完成")
}

/** 學生未來排程：就讀中班別（暑期兩期依報讀期數過濾）＋已指定的調堂補堂排程（可跨班） */
export async function fetchUpcomingSchedulesForStudent(
 studentId: string,
 fromYmd: string
): Promise<StudentUpcomingScheduleRow[]> {
 if (!supabase) return []
 const { data: enrollments, error: enrollErr } = await supabase
  .from("student_class_enrollments")
  .select("id, class_id, enrollment_period")
  .eq("student_id", studentId)
  .eq("status", "就讀中")
 if (enrollErr) throwPostgrest(enrollErr)

 const enrollmentByClass = new Map<
  string,
  { enrollmentId: string; period: EnrollmentFormValue | null }
 >()
 for (const row of enrollments ?? []) {
  const r = row as { id?: string; class_id?: string; enrollment_period?: string | null }
  const cid = String(r.class_id ?? "")
  if (!cid) continue
  enrollmentByClass.set(cid, {
   enrollmentId: String(r.id ?? ""),
   period: normalizeEnrollmentPeriod(r.enrollment_period),
  })
 }

 const classIds = [...enrollmentByClass.keys()]

 const singleEnrollmentIds = [...enrollmentByClass.values()]
  .filter((e) => isSingleSessionEnrollment(e.period))
  .map((e) => e.enrollmentId)
 const [singleScheduleMap, makeupLeavesRes] = await Promise.all([
  fetchEnrolledScheduleIdsByEnrollmentIds(singleEnrollmentIds),
  supabase
   .from("leave_makeup_records")
   .select("makeup_schedule_id, status")
   .eq("student_id", studentId)
   .not("makeup_schedule_id", "is", null),
 ])
 if (makeupLeavesRes.error) throwPostgrest(makeupLeavesRes.error)

 const makeupScheduleIds = [
  ...new Set(
   (makeupLeavesRes.data ?? [])
    .filter((row) => !isLeaveStatusAbandoned(String((row as { status?: string }).status ?? "")))
    .map((row) => String((row as { makeup_schedule_id: string }).makeup_schedule_id))
    .filter(Boolean)
  ),
 ]

 let enrolledRaw: Record<string, unknown>[] = []
 if (classIds.length > 0) {
  const { data, error } = await supabase
   .from("schedules")
   .select(UPCOMING_SCHEDULE_SELECT)
   .in("class_id", classIds)
   .gte("scheduled_date", fromYmd)
   .order("scheduled_date", { ascending: true })
   .order("start_time", { ascending: true })
  if (error) throwPostgrest(error)
  enrolledRaw = (data ?? []) as Record<string, unknown>[]
 }

 const yearIds = new Set<string>()
 for (const row of enrolledRaw) {
  const cls = row.classes as Record<string, unknown> | null
  const course = cls?.courses as Record<string, unknown> | null
  if (course?.course_mode === "summer_two_period" && cls?.academic_year_id != null) {
   yearIds.add(String(cls.academic_year_id))
  }
 }
 const periodCache = new Map<string, AcademicYearPeriodRow[]>()
 await Promise.all(
  [...yearIds].map(async (yearId) => {
   periodCache.set(yearId, await fetchAcademicYearPeriods(yearId))
  })
 )

 const enrolled = enrolledRaw
  .map((row) => mapUpcomingScheduleRow(row, "enrolled"))
  .filter((s) => isActiveUpcomingScheduleStatus(s.status))
  .filter((s) => {
   const enr = enrollmentByClass.get(s.class_id)
   if (!enr) return false
   if (isSingleSessionEnrollment(enr.period)) {
    const allowed = singleScheduleMap.get(enr.enrollmentId) ?? new Set<string>()
    return allowed.has(s.id)
   }
   if (s.courseMode !== "summer_two_period" || !s.academicYearId) return true
   const periods = periodCache.get(s.academicYearId) ?? []
   const code = resolvePeriodCodeFromDate(s.scheduled_date, periods)
   if (code == null) return true
   return enrollmentCoversPeriod(enr.period, code)
  })
  .map(({ courseMode: _cm, academicYearId: _ay, ...rest }) => rest)

 const enrolledIds = new Set(enrolled.map((s) => s.id))
 const makeupIdsToFetch = makeupScheduleIds.filter((id) => !enrolledIds.has(id))
 let makeupRows: StudentUpcomingScheduleRow[] = []
 if (makeupIdsToFetch.length > 0) {
  const { data: makeupData, error: makeupErr } = await supabase
   .from("schedules")
   .select(UPCOMING_SCHEDULE_SELECT)
   .in("id", makeupIdsToFetch)
   .gte("scheduled_date", fromYmd)
  if (makeupErr) throwPostgrest(makeupErr)
  makeupRows = ((makeupData ?? []) as Record<string, unknown>[])
   .map((row) => mapUpcomingScheduleRow(row, "makeup"))
   .filter((s) => isActiveUpcomingScheduleStatus(s.status))
   .map(({ courseMode: _cm, academicYearId: _ay, ...rest }) => rest)
 }

 return [...enrolled, ...makeupRows].sort((a, b) => {
  if (a.scheduled_date !== b.scheduled_date) return a.scheduled_date.localeCompare(b.scheduled_date)
  return String(a.start_time ?? "").localeCompare(String(b.start_time ?? ""))
 })
}

type MakeupCandidateOpts = {
 /** 排除該生本來就需出席的排程（同班就讀中、含暑期期數） */
 studentId?: string
 /** 不可選為補堂的排程 id（例如請假當堂） */
 excludeScheduleIds?: string[]
}

async function buildStudentRegularAttendanceChecker(
 studentId: string
): Promise<(row: ScheduleManageRow) => boolean> {
 if (!supabase) return () => false

 const { data: enrollments, error } = await supabase
  .from("student_class_enrollments")
  .select("id, class_id, enrollment_period")
  .eq("student_id", studentId)
  .eq("status", "就讀中")
 if (error) throwPostgrest(error)

 const enrollmentByClass = new Map<
  string,
  { enrollmentId: string; period: EnrollmentFormValue | null }
 >()
 for (const row of enrollments ?? []) {
  const r = row as { id?: string; class_id?: string; enrollment_period?: string | null }
  const cid = String(r.class_id ?? "")
  if (!cid) continue
  enrollmentByClass.set(cid, {
   enrollmentId: String(r.id ?? ""),
   period: normalizeEnrollmentPeriod(r.enrollment_period),
  })
 }

 if (enrollmentByClass.size === 0) return () => false

 const singleEnrollmentIds = [...enrollmentByClass.values()]
  .filter((e) => isSingleSessionEnrollment(e.period))
  .map((e) => e.enrollmentId)
 const singleScheduleMap = await fetchEnrolledScheduleIdsByEnrollmentIds(singleEnrollmentIds)

 const classIds = [...enrollmentByClass.keys()]
 const configCache = await fetchClassEnrollmentConfigsByIds(classIds)
 const periodCache = new Map<string, AcademicYearPeriodRow[]>()

 const yearIds = [
  ...new Set(
   [...configCache.values()]
    .filter((c) => c.courseMode === "summer_two_period" && c.academicYearId)
    .map((c) => c.academicYearId as string)
  ),
 ]
 await Promise.all(
  yearIds.map(async (yid) => {
   periodCache.set(yid, await fetchAcademicYearPeriods(yid))
  })
 )

 return (row: ScheduleManageRow) => {
  if (!row.class_id) return false
  const enr = enrollmentByClass.get(row.class_id)
  if (!enr) return false

  if (isSingleSessionEnrollment(enr.period)) {
   const allowed = singleScheduleMap.get(enr.enrollmentId) ?? new Set<string>()
   return allowed.has(row.id)
  }

  const config = configCache.get(row.class_id)
  if (!config || config.courseMode !== "summer_two_period" || !config.academicYearId) {
   return true
  }
  const periods = periodCache.get(config.academicYearId) ?? []
  const code = resolvePeriodCodeFromDate(row.scheduled_date, periods)
  if (code == null) return true
  return enrollmentCoversPeriod(enr.period, code)
 }
}

/** 是否為該生就讀班別中、依期數本來就需出席的排程（不可作補堂） */
export async function isRegularAttendanceScheduleForStudent(
 studentId: string,
 schedule: Pick<ScheduleManageRow, "class_id" | "scheduled_date">
): Promise<boolean> {
 const checker = await buildStudentRegularAttendanceChecker(studentId)
 return checker(schedule as ScheduleManageRow)
}

export async function validateMakeupScheduleForStudent(
 studentId: string,
 makeupSchedule: ScheduleManageRow,
 leaveScheduleId?: string | null
): Promise<string | null> {
 if (leaveScheduleId && makeupSchedule.id === leaveScheduleId) {
  return "補堂排程不可與請假排程相同"
 }
 if (await isRegularAttendanceScheduleForStudent(studentId, makeupSchedule)) {
  return "不可選擇該生本來就需出席的課堂作為補堂"
 }
 const timeConflicts = await findStudentConflictsWithScheduleSlot({
  studentId,
  scheduleId: makeupSchedule.id,
  scheduledDate: makeupSchedule.scheduled_date,
  startTime: makeupSchedule.start_time,
  endTime: makeupSchedule.end_time,
  classLabel: makeupSchedule.classLabel || makeupSchedule.subject,
  excludeScheduleIds: leaveScheduleId ? [leaveScheduleId] : undefined,
 })
 if (timeConflicts.length > 0) {
  return describeMakeupTimeConflicts(timeConflicts)
 }
 return null
}

function parseScheduleHmLoose(raw: string | null | undefined): number | null {
 if (!raw) return null
 return parseHm(String(raw).slice(0, 5))
}

function scheduleBoundsLoose(
 startRaw: string | null,
 endRaw: string | null
): { a: number; b: number } | null {
 const a = parseScheduleHmLoose(startRaw)
 if (a == null) return null
 const end = parseScheduleHmLoose(endRaw)
 const b = end == null || end <= a ? a + LESSON_SLOT_DURATION_MIN : end
 return { a, b }
}

/** 未來一個月內可選補堂排程（跨班；排除就讀中本來需出席的堂次與時段衝突） */
export async function fetchMakeupCandidateSchedules(
 opts?: MakeupCandidateOpts
): Promise<ScheduleManageRow[]> {
 const from = localYmd()
 const to = addDaysYmd(from, 30)
 const rows = await fetchSchedulesInRange(from, to)
 const excludeIds = new Set((opts?.excludeScheduleIds ?? []).filter(Boolean))
 let candidates = rows.filter(
  (s) =>
   !s.status.includes("取消") &&
   !s.status.includes("完成") &&
   !excludeIds.has(s.id)
 )

 const studentId = opts?.studentId?.trim()
 if (!studentId) return candidates

 const isRegularAttendance = await buildStudentRegularAttendanceChecker(studentId)
 candidates = candidates.filter((s) => !isRegularAttendance(s))

 const mustAttend = await fetchStudentMustAttendScheduleSlots(studentId)
 const mustByDate = new Map<string, typeof mustAttend>()
 for (const slot of mustAttend) {
  if (excludeIds.has(slot.id)) continue
  const list = mustByDate.get(slot.scheduled_date) ?? []
  list.push(slot)
  mustByDate.set(slot.scheduled_date, list)
 }

 return candidates.filter((s) => {
  const nb = scheduleBoundsLoose(s.start_time, s.end_time)
  if (!nb) return true
  const peers = mustByDate.get(s.scheduled_date.slice(0, 10)) ?? []
  for (const ex of peers) {
   if (ex.id === s.id) continue
   const eb = scheduleBoundsLoose(ex.start_time, ex.end_time)
   if (!eb) continue
   if (intervalsOverlapMinutes(nb.a, nb.b, eb.a, eb.b)) return false
  }
  return true
 })
}
