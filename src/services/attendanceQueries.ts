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
import { pickStudentContactFromDbRow } from "@/lib/whatsappReminder"
import { supabase } from "@/lib/supabaseClient"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import { fetchSchedulesInRange, localYmd, type ScheduleManageRow } from "@/services/scheduleQueries"
import {
 fetchEnrolledScheduleIdsByEnrollmentIds,
 fetchSingleSessionNotOnSchedule,
} from "@/services/enrollmentSessionQueries"

export const ATTENDANCE_STATUS_OPTIONS = ["出席", "缺席", "請假", "補課", "網課"] as const
export type AttendanceStatusLabel = (typeof ATTENDANCE_STATUS_OPTIONS)[number]

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
 scheduleIds?: string | string[]
): Promise<RollCallStudentRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("student_class_enrollments")
  .select(
   "id, status, enroll_date, enrollment_period, student_id, students ( full_name, english_name, grade, school, whatsapp, student_phone, parent_phone )"
  )
  .eq("class_id", classId)
  .eq("status", "就讀中")
  .order("created_at", { ascending: true })
 if (error) throw error

 const scheduleIdList = scheduleIds == null
  ? []
  : Array.isArray(scheduleIds)
    ? scheduleIds.filter(Boolean)
    : [scheduleIds]

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

 return filtered.map(({ enrollmentPeriod, ...rest }) => ({
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
 lessonDate: string
): Promise<ScheduleRosterStudent[]> {
 if (!supabase) return []
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

export async function fetchTrialStudentsForSchedule(scheduleId: string): Promise<
 {
  studentId: string
  fullName: string
  englishName: string | null
  grade: string | null
  contactPhone: string | null
 }[]
> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("trial_sessions")
  .select("student_id, students ( full_name, english_name, grade, whatsapp, student_phone, parent_phone )")
  .eq("schedule_id", scheduleId)
 if (error) throw error
 return (data ?? []).map((row) => {
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

/** 本堂請假（含已連結排程或僅班別+日期；連堂可傳多個 schedule id） */
export async function fetchLeaveStudentIdsForLesson(
 scheduleIds: string | string[],
 classId: string,
 lessonDate: string
): Promise<Set<string>> {
 if (!supabase) return new Set()
 const ids = Array.isArray(scheduleIds) ? scheduleIds : [scheduleIds]
 const { data, error } = await supabase
  .from("leave_makeup_records")
  .select("student_id, schedule_id, class_id, leave_date")
  .eq("class_id", classId)
  .eq("leave_date", lessonDate)
 if (error) throw error
 const idSet = new Set(ids)
 const out = new Set<string>()
 for (const row of data ?? []) {
  const r = row as { student_id: string; schedule_id: string | null }
  if (r.schedule_id == null || idSet.has(r.schedule_id)) {
   out.add(String(r.student_id))
  }
 }
 return out
}

/**
 * 批次：多個排程各自的「本堂請假」學生 id。
 * 一筆請假紀錄套用到某排程的條件（與 fetchLeaveStudentsForSchedule 一致）：
 * 已連結該排程（schedule_id 相符），或同班同日（class_id + leave_date 相符）。
 * 主要用途：日視圖判斷排程是否「全員請假／沒有學生」。
 */
export async function fetchLeaveStudentIdsForSchedules(
 schedules: { id: string; class_id: string | null; scheduled_date: string }[]
): Promise<Map<string, Set<string>>> {
 const map = new Map<string, Set<string>>()
 for (const s of schedules) map.set(s.id, new Set())
 if (!supabase || schedules.length === 0) return map

 const dates = [...new Set(schedules.map((s) => s.scheduled_date))]
 const classIds = [
  ...new Set(schedules.map((s) => s.class_id).filter((x): x is string => x != null && x !== "")),
 ]
 if (classIds.length === 0 || dates.length === 0) return map

 const { data, error } = await supabase
  .from("leave_makeup_records")
  .select("student_id, schedule_id, class_id, leave_date")
  .in("class_id", classIds)
  .in("leave_date", dates)
 if (error) throw error

 for (const row of data ?? []) {
  const r = row as {
   student_id: string
   schedule_id: string | null
   class_id: string
   leave_date: string
  }
  const sid = String(r.student_id)
  for (const s of schedules) {
   const linked = r.schedule_id != null && r.schedule_id === s.id
   const sameClassDate = s.class_id === r.class_id && s.scheduled_date === r.leave_date
   if (linked || sameClassDate) map.get(s.id)?.add(sid)
  }
 }
 return map
}

/** 本堂為補堂目標排程的學生（可傳多個 schedule id） */
export async function fetchMakeupStudentIdsForSchedules(scheduleIds: string[]): Promise<Set<string>> {
 if (!supabase || scheduleIds.length === 0) return new Set()
 const { data, error } = await supabase
  .from("leave_makeup_records")
  .select("student_id")
  .in("makeup_schedule_id", scheduleIds)
 if (error) throw error
 return new Set((data ?? []).map((r) => String((r as { student_id: string }).student_id)))
}

/** @deprecated 使用 fetchMakeupStudentIdsForSchedules */
export async function fetchMakeupStudentIdsForSchedule(scheduleId: string): Promise<Set<string>> {
 return fetchMakeupStudentIdsForSchedules([scheduleId])
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
    status: String(r.status ?? "出席"),
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
   status: String(r.status ?? "出席"),
   remarks: r.remarks != null ? String(r.remarks) : null,
  })
 }
 return m
}

export function buildPrefillStatusMap(params: {
 rosterIds: string[]
 leaveIds: Set<string>
 makeupIds: Set<string>
 trialIds: Set<string>
}): Map<string, string> {
 const { rosterIds, leaveIds, makeupIds, trialIds } = params
 const m = new Map<string, string>()
 const all = new Set([...rosterIds, ...trialIds])
 trialIds.forEach((id) => all.add(id))
 for (const sid of all) {
  if (leaveIds.has(sid)) m.set(sid, "請假")
  else if (makeupIds.has(sid) || trialIds.has(sid)) m.set(sid, "補課")
  else m.set(sid, "出席")
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

export async function fetchTrialStudentsForSchedules(scheduleIds: string[]): Promise<
 {
  studentId: string
  fullName: string
  englishName: string | null
  grade: string | null
  contactPhone: string | null
 }[]
> {
 if (!supabase || scheduleIds.length === 0) return []
 const { data, error } = await supabase
  .from("trial_sessions")
  .select("student_id, students ( full_name, english_name, grade, whatsapp, student_phone, parent_phone )")
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

export async function fetchSchedulesForRollCallDate(ymd: string): Promise<ScheduleManageRow[]> {
 const tid = getTeacherScopeTeacherId()
 const list = await fetchSchedulesInRange(ymd, ymd, tid ? { teacherId: tid } : undefined)
 return list.filter(
  (s) => !s.status.includes("取消") && s.class_id != null && String(s.class_id).length > 0
 )
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
 return (data ?? []).map((x) => mapAttendanceRecord(x as Record<string, unknown>))
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
  if (s.includes("出席")) present++
  else if (s.includes("缺席")) absent++
  else if (s.includes("請假") || s.includes("假")) leave++
  else if (s.includes("補")) makeup++
  else if (s.includes("網課") || s.includes("線上")) online++
  else present++
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

export { localYmd }
