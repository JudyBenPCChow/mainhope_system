import { supabase } from "@/lib/supabaseClient"
import { classDisplayName, formatClassLabel } from "@/lib/courseLabel"
import {
 enrollmentCoversPeriod,
 fetchAcademicYearPeriods,
 fetchClassEnrollmentConfig,
 normalizeEnrollmentPeriod,
 resolvePeriodCodeFromDate,
 type EnrollmentPeriod,
 type AcademicYearPeriodRow,
} from "@/lib/enrollmentPeriod"
import { fetchSchedulesInRange, localYmd, type ScheduleManageRow } from "@/services/scheduleQueries"
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

export const LEAVE_REASON_OPTIONS = ["病假", "事假"] as const
export const LEAVE_MAKEUP_OPTIONS = ["錄影", "調堂", "不補回", "其他"] as const

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
 status: string
 remarks: string | null
 student_name: string | null
 student_grade: string | null
 class_subject: string | null
 course_code: string | null
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
 const code =
  cls?.course_code_full != null
   ? String(cls.course_code_full)
   : cls?.course_code != null
     ? String(cls.course_code)
     : null
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
  status: String(r.status ?? ""),
  remarks: r.remarks != null ? String(r.remarks) : null,
  student_name: st?.full_name != null ? String(st.full_name) : null,
  student_grade: st?.grade != null ? String(st.grade) : null,
  class_subject: formatClassLabel({ subject: sub, courseCode: code, courseName }),
  course_code: code,
  teacher_name: tch?.full_name != null ? String(tch.full_name) : null,
  sched_date: sc?.scheduled_date != null ? String(sc.scheduled_date) : null,
  sched_start: sc?.start_time != null ? String(sc.start_time) : null,
  sched_end: sc?.end_time != null ? String(sc.end_time) : null,
 }
}

export async function fetchLeaveMakeupWithRelations(): Promise<LeaveManageRow[]> {
 if (!supabase) return []
 // schedules 有兩條 FK（schedule_id、makeup_schedule_id），嵌套時須指明 constraint，否則 PostgREST 回傳 300/PGRST201
 const { data, error } = await supabase
  .from("leave_makeup_records")
  .select(
   "id, student_id, class_id, schedule_id, leave_date, leave_reason, makeup_type, makeup_date, makeup_schedule_id, status, remarks, students ( full_name, grade ), classes ( subject, course_code, course_code_full, courses ( course_name ), teacher_id, teachers ( full_name ) ), schedules!leave_makeup_records_schedule_id_fkey ( scheduled_date, start_time, end_time )"
  )
  .order("leave_date", { ascending: true })
  .order("created_at", { ascending: true })
 if (error) throwPostgrest(error)
 return (data ?? []).map((x) => mapRow(x as Record<string, unknown>))
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

export async function updateLeaveMakeupRecord(
 id: string,
 patch: {
  status?: string
  makeup_type?: string | null
  makeup_date?: string | null
  leave_reason?: string | null
  remarks?: string | null
  makeup_schedule_id?: string | null
 }
): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase
  .from("leave_makeup_records")
  .update({ ...patch, updated_at: new Date().toISOString() })
  .eq("id", id)
 if (error) throwPostgrest(error)
}

export async function deleteLeaveMakeupRecord(id: string): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase.from("leave_makeup_records").delete().eq("id", id)
 if (error) throwPostgrest(error)
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
}): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase.from("leave_makeup_records").insert({
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
 })
 if (error) throwPostgrest(error)
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
 limit = 40
): Promise<TeacherPortalLeaveRow[]> {
 if (!supabase || classIds.length === 0) return []
 const { data, error } = await supabase
  .from("leave_makeup_records")
  .select(
   "id, leave_date, leave_reason, makeup_type, status, schedule_id, students ( full_name ), classes ( subject, course_code, course_code_full, courses ( course_name ) )"
  )
  .in("class_id", classIds)
  .order("leave_date", { ascending: false })
  .limit(limit)
 if (error) throwPostgrest(error)
 return (data ?? []).map((row) => {
  const r = row as Record<string, unknown>
  const st = r.students as Record<string, unknown> | null
  const cls = r.classes as Record<string, unknown> | null
  const sub = cls?.subject != null ? String(cls.subject) : "—"
  const code =
   cls?.course_code_full != null
    ? String(cls.course_code_full)
    : cls?.course_code != null
      ? String(cls.course_code)
      : ""
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
  }
 })
}

export type EnrolledClassOption = {
 id: string
 subject: string
 course_code: string | null
}

/** 學生「就讀中」班別（新增請假用） */
export async function fetchEnrolledClassesForStudent(studentId: string): Promise<EnrolledClassOption[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("student_class_enrollments")
  .select("class_id, classes ( id, subject, course_code, course_code_full, courses ( course_name ) )")
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
  const code =
   cls.course_code_full != null
    ? String(cls.course_code_full)
    : cls.course_code != null
      ? String(cls.course_code)
      : null
  out.push({
   id: String(cls.id),
   subject: classDisplayName({ subject: sub, courseName }),
   course_code: code,
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
}

/** 該班「未上堂」排程：日期 ≥ fromYmd，且狀態非取消／非完成；暑期兩期依學生報讀期數過濾 */
export async function fetchUpcomingSchedulesForClass(
 classId: string,
 fromYmd: string,
 studentId?: string
): Promise<ClassScheduleOption[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("schedules")
  .select("id, scheduled_date, start_time, end_time, status")
  .eq("class_id", classId)
  .gte("scheduled_date", fromYmd)
  .order("scheduled_date", { ascending: true })
  .order("start_time", { ascending: true })
 if (error) throwPostgrest(error)
 let rows = (data ?? [])
  .map((row) => {
   const r = row as Record<string, unknown>
   return {
    id: String(r.id),
    scheduled_date: String(r.scheduled_date ?? ""),
    start_time: r.start_time != null ? String(r.start_time) : null,
    end_time: r.end_time != null ? String(r.end_time) : null,
    status: String(r.status ?? ""),
   }
  })
  .filter((s) => !s.status.includes("取消") && !s.status.includes("完成"))

 if (studentId) {
  const config = await fetchClassEnrollmentConfig(classId)
  if (config.courseMode === "summer_two_period" && config.academicYearId) {
   const { data: enr, error: enrErr } = await supabase
    .from("student_class_enrollments")
    .select("enrollment_period")
    .eq("student_id", studentId)
    .eq("class_id", classId)
    .maybeSingle()
   if (enrErr) throwPostgrest(enrErr)
   const enrollmentPeriod = normalizeEnrollmentPeriod(
    enr?.enrollment_period != null ? String(enr.enrollment_period) : null
   )
   const periods = await fetchAcademicYearPeriods(config.academicYearId)
   rows = rows.filter((s) => {
    const code = resolvePeriodCodeFromDate(s.scheduled_date, periods)
    if (code == null) return true
    return enrollmentCoversPeriod(enrollmentPeriod, code)
   })
  }
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
 course_code: string | null
 teacher_name: string | null
}

/** 學生未來排程（僅限就讀中班別；暑期兩期依報讀期數過濾） */
export async function fetchUpcomingSchedulesForStudent(
 studentId: string,
 fromYmd: string
): Promise<StudentUpcomingScheduleRow[]> {
 if (!supabase) return []
 const { data: enrollments, error: enrollErr } = await supabase
  .from("student_class_enrollments")
  .select("class_id, enrollment_period")
  .eq("student_id", studentId)
  .eq("status", "就讀中")
 if (enrollErr) throwPostgrest(enrollErr)

 const enrollmentByClass = new Map<string, EnrollmentPeriod | null>()
 for (const row of enrollments ?? []) {
  const r = row as { class_id?: string; enrollment_period?: string | null }
  const cid = String(r.class_id ?? "")
  if (!cid) continue
  enrollmentByClass.set(cid, normalizeEnrollmentPeriod(r.enrollment_period))
 }

 const classIds = [...enrollmentByClass.keys()]
 if (classIds.length === 0) return []

 const { data, error } = await supabase
  .from("schedules")
  .select(
   "id, class_id, scheduled_date, start_time, end_time, status, session_number, classes ( subject, course_code, course_code_full, academic_year_id, courses ( course_mode, course_name ) ), teachers ( full_name )"
  )
  .in("class_id", classIds)
  .gte("scheduled_date", fromYmd)
  .order("scheduled_date", { ascending: true })
  .order("start_time", { ascending: true })
 if (error) throwPostgrest(error)

 const yearIds = new Set<string>()
 for (const row of data ?? []) {
  const r = row as Record<string, unknown>
  const cls = r.classes as Record<string, unknown> | null
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

 return (data ?? [])
  .map((row) => {
   const r = row as Record<string, unknown>
   const cls = r.classes as Record<string, unknown> | null
   const teacher = r.teachers as Record<string, unknown> | null
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
    class_id: String(r.class_id ?? ""),
    scheduled_date: String(r.scheduled_date ?? ""),
    start_time: r.start_time != null ? String(r.start_time) : null,
    end_time: r.end_time != null ? String(r.end_time) : null,
    status: String(r.status ?? ""),
    session_number:
     r.session_number != null && !Number.isNaN(Number(r.session_number))
      ? Number(r.session_number)
      : null,
    subject: formatClassLabel({ subject: sub, courseCode, courseName }),
    course_code: courseCode,
    teacher_name: teacher?.full_name != null ? String(teacher.full_name) : null,
    courseMode: course?.course_mode != null ? String(course.course_mode) : "regular",
    academicYearId: cls?.academic_year_id != null ? String(cls.academic_year_id) : null,
   }
  })
  .filter((s) => !s.status.includes("取消") && !s.status.includes("完成"))
  .filter((s) => {
   if (s.courseMode !== "summer_two_period" || !s.academicYearId) return true
   const enrollmentPeriod = enrollmentByClass.get(s.class_id) ?? null
   const periods = periodCache.get(s.academicYearId) ?? []
   const code = resolvePeriodCodeFromDate(s.scheduled_date, periods)
   if (code == null) return true
   return enrollmentCoversPeriod(enrollmentPeriod, code)
  })
  .map(({ courseMode: _cm, academicYearId: _ay, ...rest }) => rest)
}

/** 未來一個月內可選補堂排程（跨班） */
export async function fetchMakeupCandidateSchedules(): Promise<ScheduleManageRow[]> {
 const from = localYmd()
 const to = addDaysYmd(from, 30)
 const rows = await fetchSchedulesInRange(from, to)
 return rows.filter((s) => !s.status.includes("取消") && !s.status.includes("完成"))
}
