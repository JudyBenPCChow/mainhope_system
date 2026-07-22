import {
 enrollmentCoversPeriod,
 enrollmentVisibleOnSchedule,
 fetchAcademicYearPeriods,
 fetchClassEnrollmentConfig,
 isSingleSessionEnrollment,
 normalizeEnrollmentPeriod,
 resolvePeriodCodeFromDate,
} from "@/lib/enrollmentPeriod"
import { formatClassLabel } from "@/lib/courseLabel"
import { assertAcademicYearEditableForDate } from "@/lib/academicYearEditGuard"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import { pickStudentContactFromDbRow } from "@/lib/whatsappReminder"
import { supabase } from "@/lib/supabaseClient"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import {
 fetchSchedulesInRangeWithRosterContext,
 localYmd,
 type ScheduleManageRow,
} from "@/services/scheduleQueries"
import {
 fetchEnrolledScheduleIdsByEnrollmentIds,
 fetchSingleSessionNotOnSchedule,
} from "@/services/enrollmentSessionQueries"
import {
 activeTrialsForSchedules,
 enrollmentsForSchedules,
 fetchScheduleRosterContext,
 leavesForSchedule,
 makeupsForSchedules,
 type ScheduleRosterContext,
} from "@/services/scheduleRosterQueries"
import { isBillableAttendanceStatus, prefillStatusFromLeave } from "@/lib/attendanceBilling"
import { isOnlineLeaveMakeup, isRecordLeaveMakeup } from "@/lib/scheduleDayViewTags"

export {
 ATTENDANCE_STATUS_OPTIONS,
 ATTENDANCE_BILLING_HELP_SHORT,
 isBillableAttendanceStatus,
} from "@/lib/attendanceBilling"
export type { AttendanceStatusLabel } from "@/lib/attendanceBilling"

export type RollCallStudentRow = {
 enrollmentId: string
 studentId: string
 fullName: string
 englishName: string | null
 grade: string | null
 school: string | null
 enrollDate: string | null
 status: string
 /** 來自 students.whatsapp / student_phone / parent_phone，供 wa.me 使用 */
 contactPhone: string | null
 /** 是否為單堂報讀（本堂有選） */
 isSingleSession: boolean
}

/** 點名表學生列（班內報讀 + 試堂等） */
export async function fetchRosterForRollCall(
 classId: string,
 scheduleDate?: string,
 scheduleIds?: string | string[],
 rosterContext?: ScheduleRosterContext
): Promise<RollCallStudentRow[]> {
 if (!supabase) return []
 const scheduleIdList = scheduleIds == null
  ? []
  : Array.isArray(scheduleIds)
    ? scheduleIds.filter(Boolean)
    : [scheduleIds]

 if (scheduleIdList.length > 0) {
  const context = rosterContext ?? await fetchScheduleRosterContext(scheduleIdList)
  return enrollmentsForSchedules(context, scheduleIdList)
   .filter((row) => row.classId === classId)
   .map((row) => ({
    enrollmentId: row.id,
    studentId: row.studentId,
    fullName: row.fullName,
    englishName: row.englishName,
    grade: row.grade,
    school: row.school,
    enrollDate: row.enrollDate,
    status: row.status,
    contactPhone: row.contactPhone,
    isSingleSession: isSingleSessionEnrollment(row.enrollmentPeriod),
   }))
 }

 const { data, error } = await supabase
  .from("student_class_enrollments")
  .select(
   "id, status, enroll_date, withdraw_effective_date, enrollment_period, student_id, students ( full_name, english_name, grade, school, whatsapp, student_phone, parent_phone )"
  )
  .eq("class_id", classId)
  .eq("status", "就讀中")
  .order("created_at", { ascending: true })
 if (error) throw error

 let periodCode: 1 | 2 | null = null
 if (scheduleDate) {
  const config = await fetchClassEnrollmentConfig(classId)
  if (config.courseMode === "summer_two_period" && config.academicYearId) {
   const periods = await fetchAcademicYearPeriods(config.academicYearId)
   periodCode = resolvePeriodCodeFromDate(scheduleDate, periods)
  }
 }

 const rows = (data ?? []).map((row) => {
  const r = row as Record<string, unknown>
  const st = r.students as Record<string, unknown> | null
  return {
   enrollmentId: String(r.id),
   studentId: String(r.student_id),
   fullName: st?.full_name != null ? String(st.full_name) : "—",
   englishName: st?.english_name != null ? String(st.english_name) : null,
   grade: st?.grade != null ? String(st.grade) : null,
   school: st?.school != null ? String(st.school) : null,
   enrollDate: r.enroll_date != null ? String(r.enroll_date) : null,
   status: String(r.status ?? "就讀中"),
   withdrawEffectiveDate:
    r.withdraw_effective_date != null
     ? String(r.withdraw_effective_date).slice(0, 10)
     : null,
   enrollmentPeriod: normalizeEnrollmentPeriod(
    r.enrollment_period != null ? String(r.enrollment_period) : null
   ),
   contactPhone: pickStudentContactFromDbRow(st),
  }
 })

 const singleIds = rows
  .filter((row) => isSingleSessionEnrollment(row.enrollmentPeriod))
  .map((row) => row.enrollmentId)
 const scheduleIdByEnrollment = await fetchEnrolledScheduleIdsByEnrollmentIds(singleIds)

 const filtered = rows.filter((row) => {
  if (scheduleDate && row.enrollDate && scheduleDate < row.enrollDate) return false
  if (
   scheduleDate &&
   row.withdrawEffectiveDate &&
   scheduleDate >= row.withdrawEffectiveDate
  ) {
   return false
  }
  if (isSingleSessionEnrollment(row.enrollmentPeriod)) {
   if (scheduleIdList.length === 0) return false
   const enrolled = scheduleIdByEnrollment.get(row.enrollmentId) ?? new Set<string>()
   return scheduleIdList.some((sid) =>
    enrollmentVisibleOnSchedule({
     enrollmentPeriod: row.enrollmentPeriod,
     periodCode,
     scheduleId: sid,
     enrolledScheduleIds: enrolled,
    })
   )
  }
  if (periodCode == null) return true
  return enrollmentCoversPeriod(row.enrollmentPeriod, periodCode)
 })

 return filtered.map(({ enrollmentPeriod, withdrawEffectiveDate: _withdrawEffectiveDate, ...rest }) => ({
  ...rest,
  isSingleSession: isSingleSessionEnrollment(enrollmentPeriod),
 }))
}

export { fetchSingleSessionNotOnSchedule }

export type ScheduleRosterStudent = {
 studentId: string
 fullName: string
 contactPhone: string | null
}

/** 本堂請假學生（已連結排程，或同班同日待連結） */
export async function fetchLeaveStudentsForSchedule(
 scheduleId: string,
 classId: string,
 lessonDate: string,
 rosterContext?: ScheduleRosterContext
): Promise<ScheduleRosterStudent[]> {
 if (!supabase) return []
 if (rosterContext) {
  return leavesForSchedule(rosterContext, scheduleId)
   .map((row) => ({
    studentId: row.studentId,
    fullName: row.fullName,
    contactPhone: row.contactPhone,
   }))
   .sort((a, b) => a.fullName.localeCompare(b.fullName, "zh-Hant"))
 }
 const orFilter = `schedule_id.eq.${scheduleId},and(class_id.eq.${classId},leave_date.eq.${lessonDate})`
 const { data, error } = await supabase
  .from("leave_makeup_records")
  .select("student_id, students ( full_name, whatsapp, student_phone, parent_phone )")
  .or(orFilter)
  .order("created_at", { ascending: true })
 if (error) throw error

 const seen = new Set<string>()
 const out: ScheduleRosterStudent[] = []
 for (const row of data ?? []) {
  const r = row as Record<string, unknown>
  const sid = String(r.student_id)
  if (seen.has(sid)) continue
  seen.add(sid)
  const st = r.students as Record<string, unknown> | null
  out.push({
   studentId: sid,
   fullName: st?.full_name != null ? String(st.full_name) : "—",
   contactPhone: pickStudentContactFromDbRow(st),
  })
 }
 return out.sort((a, b) => a.fullName.localeCompare(b.fullName, "zh-Hant"))
}

export async function fetchTrialStudentsForSchedule(
 scheduleId: string,
 rosterContext?: ScheduleRosterContext
): Promise<
 {
  studentId: string
  fullName: string
  englishName: string | null
  grade: string | null
  contactPhone: string | null
 }[]
> {
 if (!supabase) return []
 if (rosterContext) {
  return activeTrialsForSchedules(rosterContext, [scheduleId]).map((row) => ({
   studentId: row.studentId,
   fullName: row.fullName,
   englishName: row.englishName,
   grade: row.grade,
   contactPhone: row.contactPhone,
  }))
 }
 const { data, error } = await supabase
  .from("trial_sessions")
  .select("student_id, status, students ( full_name, english_name, grade, whatsapp, student_phone, parent_phone )")
  .eq("schedule_id", scheduleId)
 if (error) throw error
 return (data ?? [])
  .filter((row) => {
   const s = String((row as { status?: string }).status ?? "")
   return !s.includes("完成") && !s.includes("取消")
  })
  .map((row) => {
  const r = row as Record<string, unknown>
  const st = r.students as Record<string, unknown> | null
  return {
   studentId: String(r.student_id),
   fullName: st?.full_name != null ? String(st.full_name) : "—",
   englishName: st?.english_name != null ? String(st.english_name) : null,
   grade: st?.grade != null ? String(st.grade) : null,
   contactPhone: pickStudentContactFromDbRow(st),
  }
 })
}

export type LeavePrefillInfo = {
 studentId: string
 leaveReason: string | null
 makeupType: string | null
}

/** 本堂請假（含理由／安排，供預填；連堂可傳多個 schedule id） */
export async function fetchLeavePrefillForLesson(
 scheduleIds: string | string[],
 classId: string,
 lessonDate: string,
 rosterContext?: ScheduleRosterContext
): Promise<Map<string, LeavePrefillInfo>> {
 const out = new Map<string, LeavePrefillInfo>()
 if (!supabase) return out
 const ids = Array.isArray(scheduleIds) ? scheduleIds : [scheduleIds]
 if (rosterContext) {
  const seen = new Set<string>()
  for (const scheduleId of ids) {
   for (const row of leavesForSchedule(rosterContext, scheduleId)) {
    if (seen.has(row.id)) continue
    seen.add(row.id)
    out.set(row.studentId, {
     studentId: row.studentId,
     leaveReason: row.leaveReason,
     makeupType: row.makeupType,
    })
   }
  }
  return out
 }
 const { data, error } = await supabase
  .from("leave_makeup_records")
  .select("student_id, schedule_id, class_id, leave_date, leave_reason, makeup_type")
  .eq("class_id", classId)
  .eq("leave_date", lessonDate)
 if (error) throw error
 const idSet = new Set(ids)
 for (const row of data ?? []) {
  const r = row as {
   student_id: string
   schedule_id: string | null
   leave_reason: string | null
   makeup_type: string | null
  }
  if (r.schedule_id != null && !idSet.has(r.schedule_id)) continue
  const studentId = String(r.student_id)
  if (out.has(studentId)) continue
  out.set(studentId, {
   studentId,
   leaveReason: r.leave_reason != null ? String(r.leave_reason) : null,
   makeupType: r.makeup_type != null ? String(r.makeup_type) : null,
  })
 }
 return out
}

export async function fetchLeaveStudentIdsForLesson(
 scheduleIds: string | string[],
 classId: string,
 lessonDate: string
): Promise<Set<string>> {
 const m = await fetchLeavePrefillForLesson(scheduleIds, classId, lessonDate)
 return new Set(m.keys())
}

/** 日視圖／批次用：本堂請假學生與補堂安排類型 */
export type ScheduleLeaveSnapshot = {
 studentIds: Set<string>
 /** 請假補堂安排含網課／線上／zoom 等 */
 hasOnlineMakeup: boolean
 /** 請假補堂安排含錄影／錄像／錄音 */
 hasRecordMakeup: boolean
}

function emptyLeaveSnapshot(): ScheduleLeaveSnapshot {
 return { studentIds: new Set(), hasOnlineMakeup: false, hasRecordMakeup: false }
}

/**
 * 批次：多個排程各自的「本堂請假」學生與補堂類型旗標。
 * 一筆請假紀錄套用到某排程的條件（與 fetchLeaveStudentsForSchedule 一致）：
 * 已連結該排程（schedule_id 相符），或同班同日（class_id + leave_date 相符）。
 * 主要用途：日視圖標籤（無人報讀／全員請假／網課生／要錄影）與灰卡。
 */
export async function fetchLeaveInfoForSchedules(
 schedules: { id: string; class_id: string | null; scheduled_date: string }[],
 rosterContext?: ScheduleRosterContext
): Promise<Map<string, ScheduleLeaveSnapshot>> {
 const map = new Map<string, ScheduleLeaveSnapshot>()
 for (const s of schedules) map.set(s.id, emptyLeaveSnapshot())
 if (!supabase || schedules.length === 0) return map
 const context = rosterContext ?? await fetchScheduleRosterContext(schedules.map((row) => row.id))
 for (const schedule of schedules) {
  const snapshot = map.get(schedule.id)
  if (!snapshot) continue
  for (const row of leavesForSchedule(context, schedule.id)) {
   snapshot.studentIds.add(row.studentId)
   if (isOnlineLeaveMakeup(row.makeupType)) snapshot.hasOnlineMakeup = true
   if (isRecordLeaveMakeup(row.makeupType)) snapshot.hasRecordMakeup = true
  }
 }
 return map
}

/** 批次：多個排程各自的「本堂請假」學生 id（包裝 fetchLeaveInfoForSchedules）。 */
export async function fetchLeaveStudentIdsForSchedules(
 schedules: { id: string; class_id: string | null; scheduled_date: string }[]
): Promise<Map<string, Set<string>>> {
 const info = await fetchLeaveInfoForSchedules(schedules)
 const map = new Map<string, Set<string>>()
 for (const [id, snap] of info) map.set(id, snap.studentIds)
 return map
}

/** 本堂為補堂目標排程的學生（可傳多個 schedule id） */
export async function fetchMakeupStudentIdsForSchedules(
 scheduleIds: string[],
 rosterContext?: ScheduleRosterContext
): Promise<Set<string>> {
 if (!supabase || scheduleIds.length === 0) return new Set()
 if (rosterContext) {
  return new Set(makeupsForSchedules(rosterContext, scheduleIds).map((row) => row.studentId))
 }
 const { data, error } = await supabase
  .from("leave_makeup_records")
  .select("student_id")
  .in("makeup_schedule_id", scheduleIds)
 if (error) throw error
 return new Set((data ?? []).map((r) => String((r as { student_id: string }).student_id)))
}

/** 本堂為補堂目標排程的學生明細（跨班補堂點名用；可傳多個 schedule id） */
export async function fetchMakeupStudentsForSchedules(
 scheduleIds: string[],
 rosterContext?: ScheduleRosterContext
): Promise<
 {
  studentId: string
  fullName: string
  englishName: string | null
  grade: string | null
  contactPhone: string | null
 }[]
> {
 if (!supabase || scheduleIds.length === 0) return []
 if (rosterContext) {
  const seen = new Set<string>()
  return makeupsForSchedules(rosterContext, scheduleIds)
   .filter((row) => {
    if (seen.has(row.studentId)) return false
    seen.add(row.studentId)
    return true
   })
   .map((row) => ({
    studentId: row.studentId,
    fullName: row.fullName,
    englishName: row.englishName,
    grade: row.grade,
    contactPhone: row.contactPhone,
   }))
 }
 const { data, error } = await supabase
  .from("leave_makeup_records")
  .select(
   "student_id, students ( full_name, english_name, grade, whatsapp, student_phone, parent_phone )"
  )
  .in("makeup_schedule_id", scheduleIds)
 if (error) throw error
 const seen = new Set<string>()
 const out: {
  studentId: string
  fullName: string
  englishName: string | null
  grade: string | null
  contactPhone: string | null
 }[] = []
 for (const row of data ?? []) {
  const r = row as Record<string, unknown>
  const studentId = String(r.student_id)
  if (seen.has(studentId)) continue
  seen.add(studentId)
  const st = r.students as Record<string, unknown> | null
  out.push({
   studentId,
   fullName: st?.full_name != null ? String(st.full_name) : "—",
   englishName: st?.english_name != null ? String(st.english_name) : null,
   grade: st?.grade != null ? String(st.grade) : null,
   contactPhone: pickStudentContactFromDbRow(st),
  })
 }
 return out
}

export async function fetchMakeupStudentsForSchedule(
 scheduleId: string,
 rosterContext?: ScheduleRosterContext
): Promise<ScheduleRosterStudent[]> {
 const rows = await fetchMakeupStudentsForSchedules([scheduleId], rosterContext)
 return rows
  .map((r) => ({
   studentId: r.studentId,
   fullName: r.fullName,
   contactPhone: r.contactPhone,
  }))
  .sort((a, b) => a.fullName.localeCompare(b.fullName, "zh-Hant"))
}

/** @deprecated 使用 fetchMakeupStudentIdsForSchedules */
export async function fetchMakeupStudentIdsForSchedule(
 scheduleId: string,
 rosterContext?: ScheduleRosterContext
): Promise<Set<string>> {
 return fetchMakeupStudentIdsForSchedules([scheduleId], rosterContext)
}

export async function fetchExistingAttendanceMap(
 classId: string,
 attendanceDate: string,
 scheduleIds?: string[]
): Promise<Map<string, { id: string; status: string; remarks: string | null }>> {
 if (!supabase) return new Map()
 if (scheduleIds != null && scheduleIds.length > 0) {
  const { data, error } = await supabase
   .from("attendance_details")
   .select("id, student_id, status, remarks, schedule_id")
   .eq("class_id", classId)
   .eq("attendance_date", attendanceDate)
   .in("schedule_id", scheduleIds)
  if (error) throw error
  const byStudent = new Map<string, { id: string; status: string; remarks: string | null }[]>()
  for (const row of data ?? []) {
   const r = row as {
    id: string
    student_id: string
    status: string
    remarks: string | null
   }
   const sid = String(r.student_id)
   const arr = byStudent.get(sid) ?? []
   arr.push({
    id: String(r.id),
    status: String(r.status ?? "現場"),
    remarks: r.remarks != null ? String(r.remarks) : null,
   })
   byStudent.set(sid, arr)
  }
  const m = new Map<string, { id: string; status: string; remarks: string | null }>()
  for (const [sid, rows] of byStudent) {
   if (rows.length < scheduleIds.length) continue
   const first = rows[0]!
   m.set(sid, {
    id: first.id,
    status: first.status,
    remarks: first.remarks,
   })
  }
  return m
 }

 const { data, error } = await supabase
  .from("attendance_details")
  .select("id, student_id, status, remarks")
  .eq("class_id", classId)
  .eq("attendance_date", attendanceDate)
  .is("schedule_id", null)
 if (error) throw error
 const m = new Map<string, { id: string; status: string; remarks: string | null }>()
 for (const row of data ?? []) {
  const r = row as { id: string; student_id: string; status: string; remarks: string | null }
  m.set(String(r.student_id), {
   id: String(r.id),
   status: String(r.status ?? "現場"),
   remarks: r.remarks != null ? String(r.remarks) : null,
  })
 }
 return m
}

export function buildPrefillStatusMap(params: {
 rosterIds: string[]
 leaveByStudent: Map<string, LeavePrefillInfo>
 makeupIds: Set<string>
 trialIds: Set<string>
}): Map<string, string> {
 const { rosterIds, leaveByStudent, makeupIds, trialIds } = params
 const m = new Map<string, string>()
 const all = new Set([...rosterIds, ...trialIds, ...makeupIds, ...leaveByStudent.keys()])
 for (const sid of all) {
  const leave = leaveByStudent.get(sid)
  if (leave) {
   m.set(sid, prefillStatusFromLeave(leave))
  } else if (makeupIds.has(sid) || trialIds.has(sid)) {
   m.set(sid, "現場")
  } else {
   m.set(sid, "現場")
  }
 }
 return m
}

export async function saveAttendanceStatus(
 studentId: string,
 classId: string,
 attendanceDate: string,
 status: string,
 remarks?: string | null,
 scheduleId?: string | null
): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 assertAcademicYearEditableForDate(attendanceDate)
 let q = supabase
  .from("attendance_details")
  .select("id")
  .eq("student_id", studentId)
  .eq("class_id", classId)
  .eq("attendance_date", attendanceDate)
 if (scheduleId) {
  q = q.eq("schedule_id", scheduleId)
 } else {
  q = q.is("schedule_id", null)
 }
 const { data: existing, error: selErr } = await q.maybeSingle()
 if (selErr) throw selErr
 if (existing) {
  const { error } = await supabase
   .from("attendance_details")
   .update({
    status,
    remarks: remarks ?? null,
    updated_at: new Date().toISOString(),
   })
   .eq("id", (existing as { id: string }).id)
  if (error) throw error
 } else {
  const { error } = await supabase.from("attendance_details").insert({
   student_id: studentId,
   class_id: classId,
   attendance_date: attendanceDate,
   schedule_id: scheduleId ?? null,
   status,
   remarks: remarks ?? null,
  })
  if (error) throw error
 }
}

/** 一次點名寫入多個排程（連堂） */
export async function saveAttendanceStatusForSchedules(
 studentId: string,
 classId: string,
 attendanceDate: string,
 scheduleIds: string[],
 status: string,
 remarks?: string | null
): Promise<void> {
 for (const scheduleId of scheduleIds) {
  await saveAttendanceStatus(studentId, classId, attendanceDate, status, remarks, scheduleId)
 }
}

export async function fetchTrialStudentsForSchedules(
 scheduleIds: string[],
 rosterContext?: ScheduleRosterContext
): Promise<
 {
  studentId: string
  fullName: string
  englishName: string | null
  grade: string | null
  contactPhone: string | null
 }[]
> {
 if (!supabase || scheduleIds.length === 0) return []
 if (rosterContext) {
  const seen = new Set<string>()
  return activeTrialsForSchedules(rosterContext, scheduleIds)
   .filter((row) => {
    if (seen.has(row.studentId)) return false
    seen.add(row.studentId)
    return true
   })
   .map((row) => ({
    studentId: row.studentId,
    fullName: row.fullName,
    englishName: row.englishName,
    grade: row.grade,
    contactPhone: row.contactPhone,
   }))
 }
 const { data, error } = await supabase
  .from("trial_sessions")
  .select("student_id, status, students ( full_name, english_name, grade, whatsapp, student_phone, parent_phone )")
  .in("schedule_id", scheduleIds)
 if (error) throw error
 const seen = new Set<string>()
 const out: {
  studentId: string
  fullName: string
  englishName: string | null
  grade: string | null
  contactPhone: string | null
 }[] = []
 for (const row of data ?? []) {
  const r = row as Record<string, unknown>
  const status = String(r.status ?? "")
  if (status.includes("完成") || status.includes("取消")) continue
  const studentId = String(r.student_id)
  if (seen.has(studentId)) continue
  seen.add(studentId)
  const st = r.students as Record<string, unknown> | null
  out.push({
   studentId,
   fullName: st?.full_name != null ? String(st.full_name) : "—",
   englishName: st?.english_name != null ? String(st.english_name) : null,
   grade: st?.grade != null ? String(st.grade) : null,
   contactPhone: pickStudentContactFromDbRow(st),
  })
 }
 return out
}

export type RollCallTargetScheduleRef = {
 id: string
 class_id: string | null
 scheduled_date: string
 consecutive_group_id?: string | null
}

/**
 * 哪些排程有「可點名對象」：可見就讀中報讀（含暑期／單堂）＋未完成試堂＋補堂目標。
 * 不把全員請假當成無對象（請假生仍在報讀名單內）。
 */
export async function fetchScheduleIdsWithRollCallTargets(
 schedules: RollCallTargetScheduleRef[],
 rosterContext?: ScheduleRosterContext
): Promise<Set<string>> {
 const out = new Set<string>()
 const eligible = schedules.filter(
  (s) => s.class_id != null && String(s.class_id).length > 0
 )
 if (!supabase || eligible.length === 0) return out

 const scheduleIds = eligible.map((s) => s.id)
 const context = rosterContext ?? await fetchScheduleRosterContext(scheduleIds)
 for (const trial of activeTrialsForSchedules(context, scheduleIds)) out.add(trial.scheduleId)
 for (const makeup of makeupsForSchedules(context, scheduleIds)) {
  if (makeup.makeupScheduleId) out.add(makeup.makeupScheduleId)
 }
 for (const schedule of context.schedules) {
  if (enrollmentsForSchedules(context, [schedule.id]).length > 0) out.add(schedule.id)
 }

 return expandRollCallTargetsWithConsecutivePeers(out, eligible)
}

/** 連堂組內任一堂有可點名對象時，整組都保留（避免拆開連堂點名紙） */
function expandRollCallTargetsWithConsecutivePeers(
 targetIds: Set<string>,
 schedules: RollCallTargetScheduleRef[]
): Set<string> {
 if (targetIds.size === 0) return targetIds
 const byGroup = new Map<string, string[]>()
 for (const s of schedules) {
  const gid = s.consecutive_group_id?.trim()
  if (!gid) continue
  const arr = byGroup.get(gid) ?? []
  arr.push(s.id)
  byGroup.set(gid, arr)
 }
 const out = new Set(targetIds)
 for (const peers of byGroup.values()) {
  if (peers.some((id) => out.has(id))) {
   for (const id of peers) out.add(id)
  }
 }
 return out
}

export async function fetchSchedulesForRollCallDate(ymd: string): Promise<ScheduleManageRow[]> {
 const tid = getTeacherScopeTeacherId()
 const { rows: list, rosterContext } = await fetchSchedulesInRangeWithRosterContext(
  ymd,
  ymd,
  tid ? { teacherId: tid } : undefined
 )
 const candidates = list.filter(
  (s) => !s.status.includes("取消") && s.class_id != null && String(s.class_id).length > 0
 )
 if (candidates.length === 0) return []
 const withTargets = await fetchScheduleIdsWithRollCallTargets(candidates, rosterContext)
 return candidates.filter((s) => withTargets.has(s.id))
}

export type AttendanceRecordRow = {
 id: string
 studentId: string
 classId: string
 scheduleId: string | null
 attendanceDate: string
 status: string
 remarks: string | null
 studentName: string | null
 studentEnglishName: string | null
 studentGrade: string | null
 classSubject: string | null
 courseCode: string | null
 /** 實際上課老師（有排程時取 schedules.teacher_id） */
 teacherId: string | null
 teacherName: string | null
 /** 代堂前原任老師 */
 originalTeacherId: string | null
 originalTeacherName: string | null
 /** 班別常任老師（篩選／權限用） */
 classTeacherId: string | null
}

function mapAttendanceRecord(r: Record<string, unknown>): AttendanceRecordRow {
 const st = r.students as Record<string, unknown> | null
 const cls = r.classes as (Record<string, unknown> & { teachers?: Record<string, unknown> | null }) | null
 const sched = r.schedules as
  | (Record<string, unknown> & {
     teachers?: Record<string, unknown> | null
     original_teacher?: Record<string, unknown> | null
    })
  | null
 const classTeacherObj = cls?.teachers ?? null
 const scheduleTeacherObj = sched?.teachers ?? null
 const originalTeacherObj = sched?.original_teacher ?? null
 const sub = cls?.subject != null ? String(cls.subject) : "—"
 const course = cls?.courses as Record<string, unknown> | null
 const courseName = course?.course_name != null ? String(course.course_name) : null
 const courseCode =
  cls?.course_code_full != null ? String(cls.course_code_full) : null
 const classTeacherId = cls?.teacher_id != null ? String(cls.teacher_id) : null
 const scheduleTeacherId = sched?.teacher_id != null ? String(sched.teacher_id) : null
 const teachingTeacherId = scheduleTeacherId ?? classTeacherId
 const teachingTeacherName =
  scheduleTeacherObj?.full_name != null
   ? String(scheduleTeacherObj.full_name)
   : classTeacherObj?.full_name != null
     ? String(classTeacherObj.full_name)
     : null
 return {
  id: String(r.id),
  studentId: String(r.student_id),
  classId: String(r.class_id),
  scheduleId: r.schedule_id != null ? String(r.schedule_id) : null,
  attendanceDate: String(r.attendance_date ?? ""),
  status: String(r.status ?? ""),
  remarks: r.remarks != null ? String(r.remarks) : null,
  studentName: st?.full_name != null ? String(st.full_name) : null,
  studentEnglishName: st?.english_name != null ? String(st.english_name) : null,
  studentGrade: st?.grade != null ? String(st.grade) : null,
  classSubject: formatClassLabel({ subject: sub, courseCode, courseName }),
  courseCode,
  teacherId: teachingTeacherId,
  teacherName: teachingTeacherName,
  originalTeacherId:
   sched?.original_teacher_id != null ? String(sched.original_teacher_id) : null,
  originalTeacherName:
   originalTeacherObj?.full_name != null ? String(originalTeacherObj.full_name) : null,
  classTeacherId,
 }
}

export async function fetchAttendanceRecordsInRange(
 fromYmd: string,
 toYmd: string
): Promise<AttendanceRecordRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("attendance_details")
  .select(
   "id, student_id, class_id, schedule_id, attendance_date, status, remarks, students ( full_name, english_name, grade ), classes ( subject, course_code_full, teacher_id, courses ( course_name ), teachers ( full_name ) ), schedules ( teacher_id, original_teacher_id, teachers!schedules_teacher_id_fkey ( full_name ), original_teacher:teachers!schedules_original_teacher_id_fkey ( full_name ) )"
  )
  .gte("attendance_date", fromYmd)
  .lte("attendance_date", toYmd)
  .order("attendance_date", { ascending: false })
  .order("created_at", { ascending: false })
 if (error) throw error
 const mapped = (data ?? []).map((x) => mapAttendanceRecord(x as Record<string, unknown>))
 const scheduleIds = [
  ...new Set(mapped.map((row) => row.scheduleId).filter((id): id is string => id != null)),
 ]
 if (scheduleIds.length === 0) return mapped
 const rosterContext = await fetchScheduleRosterContext(scheduleIds)
 const attendanceById = new Map(rosterContext.attendance.map((row) => [row.id, row]))
 const scheduleById = new Map(rosterContext.schedules.map((row) => [row.id, row]))
 return mapped.map((row) => {
  const attendance = attendanceById.get(row.id)
  const schedule = row.scheduleId ? scheduleById.get(row.scheduleId) : null
  if (!attendance && !schedule) return row
  const subject = schedule?.subject ?? row.classSubject ?? "—"
  return {
   ...row,
   studentName: attendance?.fullName ?? row.studentName,
   studentEnglishName: attendance?.englishName ?? row.studentEnglishName,
   classSubject: schedule
    ? formatClassLabel({
       subject,
       courseCode: schedule.courseCodeFull,
       courseName: schedule.courseName,
      })
    : row.classSubject,
   courseCode: schedule?.courseCodeFull ?? row.courseCode,
  }
 })
}

export type AttendanceDayStats = {
 date: string
 total: number
 present: number
 absent: number
 leave: number
 makeup: number
 online: number
}

function tallyStatuses(rows: AttendanceRecordRow[]): Omit<AttendanceDayStats, "date"> {
 let present = 0
 let absent = 0
 let leave = 0
 let makeup = 0
 let online = 0
 for (const r of rows) {
  const s = r.status
  if (s === "現場" || s === "出席") present++
  else if (s === "no show" || s.includes("缺席")) absent++
  else if (s === "事假" || s === "病假" || s === "請假") leave++
  else if (
   s === "請假而不需補回" ||
   s === "不用補回" ||
   s.includes("補課") ||
   s.includes("補堂")
  )
   makeup++
  else if (
   s === "錄影回放" ||
   s === "zoom實時網課" ||
   s === "即時直播" ||
   s.includes("網課") ||
   s.includes("線上")
  )
   online++
  else if (isBillableAttendanceStatus(s)) present++
  else leave++
 }
 return { total: rows.length, present, absent, leave, makeup, online }
}

export async function fetchAttendanceDashboardForDate(ymd: string): Promise<{
 stats: Omit<AttendanceDayStats, "date"> & { date: string }
 distinctClasses: number
}> {
 const rows = await fetchAttendanceRecordsInRange(ymd, ymd)
 const t = tallyStatuses(rows)
 const classes = new Set(rows.map((r) => r.classId))
 return {
  stats: { date: ymd, ...t },
  distinctClasses: classes.size,
 }
}

export function aggregateAttendanceByDate(rows: AttendanceRecordRow[]): AttendanceDayStats[] {
 const byDate = new Map<string, AttendanceRecordRow[]>()
 for (const r of rows) {
  const arr = byDate.get(r.attendanceDate) ?? []
  arr.push(r)
  byDate.set(r.attendanceDate, arr)
 }
 return [...byDate.entries()]
  .sort((a, b) => b[0].localeCompare(a[0]))
  .map(([date, list]) => ({
   date,
   ...tallyStatuses(list),
  }))
}

export function groupRecordsByClass(rows: AttendanceRecordRow[]): Map<string, AttendanceRecordRow[]> {
 const m = new Map<string, AttendanceRecordRow[]>()
 for (const r of rows) {
  const label = r.classId
  const arr = m.get(label) ?? []
  arr.push(r)
  m.set(label, arr)
 }
 return m
}

export type PendingRollCallReminder = {
 scheduleId: string
 classId: string | null
 classLabel: string
 scheduledDate: string
 startTime: string | null
 endTime: string | null
}

async function fetchScheduleIdsWithAttendance(scheduleIds: string[]): Promise<Set<string>> {
 if (!supabase || scheduleIds.length === 0) return new Set()
 const chunks = await forEachIdChunk(scheduleIds, DEFAULT_ID_CHUNK, async (slice) => {
  const { data, error } = await supabase!
   .from("attendance_details")
   .select("schedule_id")
   .in("schedule_id", slice)
  if (error) throw error
  return data ?? []
 })
 const done = new Set<string>()
 for (const rows of chunks) {
  for (const r of rows) {
   const sid = (r as { schedule_id: string | null }).schedule_id
   if (sid) done.add(sid)
  }
 }
 return done
}

/**
 * 從既有排程列篩出尚未有任何 attendance_details 者（催點名；不自動銷堂）。
 * 呼叫端自行篩老師／日期範圍；此函式會排除已取消、未綁班別、無可點名對象。
 */
export async function findSchedulesMissingAttendance(
 schedules: Pick<
  ScheduleManageRow,
  | "id"
  | "class_id"
  | "classLabel"
  | "scheduled_date"
  | "start_time"
  | "end_time"
  | "status"
  | "consecutive_group_id"
 >[],
 rosterContext?: ScheduleRosterContext
): Promise<PendingRollCallReminder[]> {
 const mine = schedules.filter((s) => {
  if (String(s.status ?? "").includes("取消")) return false
  return s.class_id != null && String(s.class_id).length > 0
 })
 if (mine.length === 0) return []
 const withTargets = await fetchScheduleIdsWithRollCallTargets(mine, rosterContext)
 const candidates = mine.filter((s) => withTargets.has(s.id))
 if (candidates.length === 0) return []
 const done = await fetchScheduleIdsWithAttendance(candidates.map((s) => s.id))
 return candidates
  .filter((s) => !done.has(s.id))
  .map((s) => ({
   scheduleId: s.id,
   classId: s.class_id,
   classLabel: s.classLabel,
   scheduledDate: s.scheduled_date,
   startTime: s.start_time,
   endTime: s.end_time,
  }))
  .sort((a, b) => {
   const byDate = b.scheduledDate.localeCompare(a.scheduledDate)
   if (byDate !== 0) return byDate
   return String(a.startTime ?? "").localeCompare(String(b.startTime ?? ""))
  })
}

/**
 * 老師當日尚未有任何點名列的排程（催點名；不自動銷堂）。
 * 條件：今日、未取消、已綁班別、有可點名對象，且該 schedule_id 尚無 attendance_details。
 */
export async function fetchPendingRollCallRemindersForTeacher(
 teacherId: string,
 ymd: string = localYmd()
): Promise<PendingRollCallReminder[]> {
 if (!supabase || !teacherId) return []
 // fetchSchedulesForRollCallDate 已篩過可點名對象
 const schedules = await fetchSchedulesForRollCallDate(ymd)
 const mine = schedules.filter((s) => {
  if (!s.class_id) return false
  const tid = s.teacher_id ?? s.original_teacher_id
  return tid === teacherId
 })
 if (mine.length === 0) return []
 const done = await fetchScheduleIdsWithAttendance(mine.map((s) => s.id))
 return mine
  .filter((s) => !done.has(s.id))
  .map((s) => ({
   scheduleId: s.id,
   classId: s.class_id,
   classLabel: s.classLabel,
   scheduledDate: s.scheduled_date,
   startTime: s.start_time,
   endTime: s.end_time,
  }))
  .sort((a, b) => {
   const byDate = b.scheduledDate.localeCompare(a.scheduledDate)
   if (byDate !== 0) return byDate
   return String(a.startTime ?? "").localeCompare(String(b.startTime ?? ""))
  })
}

export { localYmd }
