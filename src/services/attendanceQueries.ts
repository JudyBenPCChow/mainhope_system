import {
 enrollmentCoversPeriod,
 fetchAcademicYearPeriods,
 fetchClassEnrollmentConfig,
 normalizeEnrollmentPeriod,
 resolvePeriodCodeFromDate,
} from "@/lib/enrollmentPeriod"
import { formatClassLabel } from "@/lib/courseLabel"
import { pickStudentContactRaw } from "@/lib/whatsappReminder"
import { supabase } from "@/lib/supabaseClient"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import { fetchSchedulesInRange, localYmd, type ScheduleManageRow } from "@/services/scheduleQueries"

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
 /** 來自 students.whatsapp / parent_phone，供 wa.me 使用 */
 contactPhone: string | null
}

/** 點名表學生列（班內報讀 + 試堂等） */
export async function fetchRosterForRollCall(
 classId: string,
 scheduleDate?: string
): Promise<RollCallStudentRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("student_class_enrollments")
  .select(
   "id, status, enroll_date, enrollment_period, student_id, students ( full_name, english_name, grade, school, whatsapp, parent_phone )"
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
   enrollmentPeriod: normalizeEnrollmentPeriod(
    r.enrollment_period != null ? String(r.enrollment_period) : null
   ),
   contactPhone: pickStudentContactRaw({
    whatsapp: st?.whatsapp != null ? String(st.whatsapp) : null,
    parent_phone: st?.parent_phone != null ? String(st.parent_phone) : null,
   }),
  }
 })

 if (periodCode == null) {
  return rows.map(({ enrollmentPeriod: _ep, ...rest }) => rest)
 }

 return rows
  .filter((row) => enrollmentCoversPeriod(row.enrollmentPeriod, periodCode!))
  .map(({ enrollmentPeriod: _ep, ...rest }) => rest)
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
  .select("student_id, students ( full_name, english_name, grade, whatsapp, parent_phone )")
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
   contactPhone: pickStudentContactRaw({
    whatsapp: st?.whatsapp != null ? String(st.whatsapp) : null,
    parent_phone: st?.parent_phone != null ? String(st.parent_phone) : null,
   }),
  }
 })
}

/** 本堂請假（含已連結排程或僅班別+日期） */
export async function fetchLeaveStudentIdsForLesson(
 scheduleId: string,
 classId: string,
 lessonDate: string
): Promise<Set<string>> {
 if (!supabase) return new Set()
 const { data, error } = await supabase
  .from("leave_makeup_records")
  .select("student_id, schedule_id, class_id, leave_date")
  .eq("class_id", classId)
  .eq("leave_date", lessonDate)
 if (error) throw error
 const ids = new Set<string>()
 for (const row of data ?? []) {
  const r = row as { student_id: string; schedule_id: string | null }
  if (r.schedule_id == null || r.schedule_id === scheduleId) {
   ids.add(String(r.student_id))
  }
 }
 return ids
}

/** 本堂為補堂目標排程的學生 */
export async function fetchMakeupStudentIdsForSchedule(scheduleId: string): Promise<Set<string>> {
 if (!supabase) return new Set()
 const { data, error } = await supabase
  .from("leave_makeup_records")
  .select("student_id")
  .eq("makeup_schedule_id", scheduleId)
 if (error) throw error
 return new Set((data ?? []).map((r) => String((r as { student_id: string }).student_id)))
}

export async function fetchExistingAttendanceMap(
 classId: string,
 attendanceDate: string
): Promise<Map<string, { id: string; status: string; remarks: string | null }>> {
 if (!supabase) return new Map()
 const { data, error } = await supabase
  .from("attendance_details")
  .select("id, student_id, status, remarks")
  .eq("class_id", classId)
  .eq("attendance_date", attendanceDate)
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
 remarks?: string | null
): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { data: existing, error: selErr } = await supabase
  .from("attendance_details")
  .select("id")
  .eq("student_id", studentId)
  .eq("class_id", classId)
  .eq("attendance_date", attendanceDate)
  .maybeSingle()
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
   status,
   remarks: remarks ?? null,
  })
  if (error) throw error
 }
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
 attendanceDate: string
 status: string
 remarks: string | null
 studentName: string | null
 studentEnglishName: string | null
 studentGrade: string | null
 classSubject: string | null
 courseCode: string | null
 teacherId: string | null
 teacherName: string | null
}

function mapAttendanceRecord(r: Record<string, unknown>): AttendanceRecordRow {
 const st = r.students as Record<string, unknown> | null
 const cls = r.classes as (Record<string, unknown> & { teachers?: Record<string, unknown> | null }) | null
 const teacherObj = cls?.teachers ?? null
 const sub = cls?.subject != null ? String(cls.subject) : "—"
 const course = cls?.courses as Record<string, unknown> | null
 const courseName = course?.course_name != null ? String(course.course_name) : null
 const courseCode =
  cls?.course_code_full != null
   ? String(cls.course_code_full)
   : cls?.course_code != null
     ? String(cls.course_code)
     : null
 return {
  id: String(r.id),
  studentId: String(r.student_id),
  classId: String(r.class_id),
  attendanceDate: String(r.attendance_date ?? ""),
  status: String(r.status ?? ""),
  remarks: r.remarks != null ? String(r.remarks) : null,
  studentName: st?.full_name != null ? String(st.full_name) : null,
  studentEnglishName: st?.english_name != null ? String(st.english_name) : null,
  studentGrade: st?.grade != null ? String(st.grade) : null,
  classSubject: formatClassLabel({ subject: sub, courseCode, courseName }),
  courseCode,
  teacherId: cls?.teacher_id != null ? String(cls.teacher_id) : null,
  teacherName: teacherObj?.full_name != null ? String(teacherObj.full_name) : null,
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
   "id, student_id, class_id, attendance_date, status, remarks, students ( full_name, english_name, grade ), classes ( subject, course_code, course_code_full, teacher_id, courses ( course_name ), teachers ( full_name ) )"
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
