import { getMgmtRole, isSuperAdmin } from "@/lib/mgmtRole"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import { classDisplayName, formatClassLabel } from "@/lib/courseLabel"
import { supabase } from "@/lib/supabaseClient"

export type TeacherRecord = {
 id: string
 full_name: string
 english_name: string | null
 /** 內部簡稱／代碼（ABBR）；僅外星人可於前端修改 */
 abbr: string | null
 phone: string | null
 email: string | null
 status: string | null
 subject_speciality: string[] | null
 salary_per_lesson: number | null
 remarks: string | null
 created_at: string
 updated_at: string
}

/** 老師在職狀態：詳情／列表僅使用「在職」與「非在職」兩種；舊資料會收斂至此 */
export function normalizeTeacherEmploymentStatus(status: string | null): "在職" | "非在職" {
 const s = (status ?? "").trim()
 if (!s) return "在職"
 if (/非在職|離職|離任|停職|已離開|不再續|終止|離校/.test(s)) return "非在職"
 return "在職"
}

function asTeacher(row: Record<string, unknown>): TeacherRecord {
 const subj = row.subject_speciality
 return {
  id: String(row.id),
  full_name: String(row.full_name ?? ""),
  english_name: row.english_name != null ? String(row.english_name) : null,
  abbr: row.abbr != null && String(row.abbr).trim() !== "" ? String(row.abbr).trim() : null,
  phone: row.phone != null ? String(row.phone) : null,
  email: row.email != null ? String(row.email) : null,
  status: normalizeTeacherEmploymentStatus(row.status != null ? String(row.status) : null),
  subject_speciality: Array.isArray(subj) ? (subj as string[]) : null,
  salary_per_lesson:
   row.salary_per_lesson != null ? Number(row.salary_per_lesson) : null,
  remarks: row.remarks != null ? String(row.remarks) : null,
  created_at: String(row.created_at ?? ""),
  updated_at: String(row.updated_at ?? ""),
 }
}

function localYmd(d = new Date()): string {
 const y = d.getFullYear()
 const m = String(d.getMonth() + 1).padStart(2, "0")
 const day = String(d.getDate()).padStart(2, "0")
 return `${y}-${m}-${day}`
}

function addDaysYmd(ymd: string, days: number): string {
 const [y, mo, da] = ymd.split("-").map(Number)
 const dt = new Date(y, mo - 1, da)
 dt.setDate(dt.getDate() + days)
 return localYmd(dt)
}

export async function fetchAllTeachers(): Promise<TeacherRecord[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("teachers")
  .select("*")
  .order("full_name", { ascending: true })
 if (error) throw error
 return (data ?? []).map((r) => asTeacher(r as Record<string, unknown>))
}

export async function getTeacherById(id: string): Promise<TeacherRecord | null> {
 if (!supabase) return null
 const { data, error } = await supabase.from("teachers").select("*").eq("id", id).maybeSingle()
 if (error) throw error
 if (!data) return null
 return asTeacher(data as Record<string, unknown>)
}

export async function insertTeacher(
 row: Partial<TeacherRecord> & { full_name: string }
): Promise<TeacherRecord> {
 if (!supabase) throw new Error("Supabase 未設定")
 if (!isSuperAdmin()) {
  throw new Error("新增老師僅限外星人權限。")
 }
 const abbrRaw = row.abbr != null ? String(row.abbr).trim() : ""
 const abbrVal = abbrRaw === "" ? null : abbrRaw.slice(0, 64)
 const { data, error } = await supabase
  .from("teachers")
  .insert({
   full_name: row.full_name,
   english_name: row.english_name ?? null,
   abbr: abbrVal,
   phone: row.phone ?? null,
   email: row.email ?? null,
   status: normalizeTeacherEmploymentStatus(row.status != null ? String(row.status) : null),
   subject_speciality: row.subject_speciality ?? [],
  })
  .select("*")
  .single()
 if (error) throw error
 return asTeacher(data as Record<string, unknown>)
}

export async function updateTeacher(
 id: string,
 patch: Partial<Omit<TeacherRecord, "id" | "created_at">>
): Promise<TeacherRecord> {
 if (!supabase) throw new Error("Supabase 未設定")
 let payload: Record<string, unknown> = { ...patch, updated_at: new Date().toISOString() }
 const role = getMgmtRole()
 const selfTeacherId = getTeacherScopeTeacherId()
 if (role === "teacher" && selfTeacherId === id) {
  payload = {
   updated_at: payload.updated_at,
   phone: payload.phone,
   subject_speciality: payload.subject_speciality,
   remarks: payload.remarks,
  }
 } else if (!isSuperAdmin()) {
  if (Object.prototype.hasOwnProperty.call(payload, "abbr")) {
   delete payload.abbr
  }
 } else if (Object.prototype.hasOwnProperty.call(payload, "abbr")) {
  const a = payload.abbr
  if (a == null || String(a).trim() === "") {
   payload.abbr = null
  } else {
   payload.abbr = String(a).trim().slice(0, 64)
  }
 }
 const { data, error } = await supabase
  .from("teachers")
  .update(payload)
  .eq("id", id)
  .select("*")
  .single()
 if (error) throw error
 return asTeacher(data as Record<string, unknown>)
}

export async function deleteTeacher(id: string): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase.from("teachers").delete().eq("id", id)
 if (error) throw error
}

export type TeacherClassRow = {
 id: string
 subject: string
 courseCode: string | null
 dayOfWeek: string | null
 timeSlot: string | null
 grades: string[] | null
 pricePerLesson: number | null
 studentCount: number
}

export async function fetchTeacherClasses(teacherId: string): Promise<TeacherClassRow[]> {
 if (!supabase) return []
 const { data: classes, error } = await supabase
  .from("classes")
  .select("id, subject, course_code, day_of_week, time_slot, grade, price_per_lesson, courses ( course_name )")
  .eq("teacher_id", teacherId)
  .order("subject")
 if (error) throw error
 const cls = (classes ?? []) as Record<string, unknown>[]
 if (cls.length === 0) return []
 const ids = cls.map((c) => String(c.id))
 const { data: enr } = await supabase
  .from("student_class_enrollments")
  .select("class_id")
  .in("class_id", ids)
 const countMap = new Map<string, number>()
 for (const r of enr ?? []) {
  const id = String((r as { class_id: string }).class_id)
  countMap.set(id, (countMap.get(id) ?? 0) + 1)
 }
 return cls.map((c) => {
  const course = c.courses as Record<string, unknown> | null
  const courseName = course?.course_name != null ? String(course.course_name) : null
  const sub = String(c.subject ?? "")
  return {
   id: String(c.id),
   subject: classDisplayName({ subject: sub, courseName }),
   courseCode: c.course_code != null ? String(c.course_code) : null,
  dayOfWeek: c.day_of_week != null ? String(c.day_of_week) : null,
  timeSlot: c.time_slot != null ? String(c.time_slot) : null,
  grades: Array.isArray(c.grade) ? (c.grade as string[]) : null,
  pricePerLesson: c.price_per_lesson != null ? Number(c.price_per_lesson) : null,
   studentCount: countMap.get(String(c.id)) ?? 0,
  }
 })
}

export type ScheduleRow = {
 id: string
 classId: string
 scheduledDate: string
 startTime: string | null
 endTime: string | null
 status: string
 sessionNumber: number | null
 subject: string
 courseCode: string | null
}

export async function fetchTeacherSchedules(teacherId: string): Promise<ScheduleRow[]> {
 if (!supabase) return []
 const { data: sched, error } = await supabase
  .from("schedules")
  .select(
   "id, class_id, scheduled_date, start_time, end_time, status, session_number, classes ( subject, course_code, courses ( course_name ) )"
  )
  .eq("teacher_id", teacherId)
  .order("scheduled_date", { ascending: true })
  .order("start_time", { ascending: true })
 if (error) throw error
 const rows = (sched ?? []) as Record<string, unknown>[]
 return rows.map((r) => {
  const cls = r.classes as Record<string, unknown> | null
  const sub = cls?.subject != null ? String(cls.subject) : "—"
  const course = cls?.courses as Record<string, unknown> | null
  const courseName = course?.course_name != null ? String(course.course_name) : null
  const courseCode = cls?.course_code != null ? String(cls.course_code) : null
  return {
   id: String(r.id),
   classId: r.class_id != null ? String(r.class_id) : "",
   scheduledDate: String(r.scheduled_date ?? ""),
   startTime: r.start_time != null ? String(r.start_time) : null,
   endTime: r.end_time != null ? String(r.end_time) : null,
   status: String(r.status ?? "預定"),
   sessionNumber:
    r.session_number != null && !Number.isNaN(Number(r.session_number))
     ? Number(r.session_number)
     : null,
   subject: formatClassLabel({ subject: sub, courseCode, courseName }),
   courseCode,
  }
 })
}

export type TeacherAttendanceRow = {
 id: string
 date: string
 status: string
 remarks: string | null
 studentName: string
 studentGrade: string | null
 subject: string
 courseCode: string | null
}

export async function fetchTeacherAttendance(
 teacherId: string
): Promise<TeacherAttendanceRow[]> {
 if (!supabase) return []
 const { data: classes } = await supabase.from("classes").select("id").eq("teacher_id", teacherId)
 const classIds = (classes ?? []).map((c) => String((c as { id: string }).id))
 if (classIds.length === 0) return []
 const { data, error } = await supabase
  .from("attendance_details")
  .select(
   "id, attendance_date, status, remarks, classes ( subject, course_code, courses ( course_name ) ), students ( full_name, grade )"
  )
  .in("class_id", classIds)
  .order("attendance_date", { ascending: false })
 if (error) throw error
 return (data ?? []).map((row) => {
  const r = row as Record<string, unknown>
  const cls = r.classes as Record<string, unknown> | null
  const st = r.students as Record<string, unknown> | null
  const sub = cls?.subject != null ? String(cls.subject) : "—"
  const course = cls?.courses as Record<string, unknown> | null
  const courseName = course?.course_name != null ? String(course.course_name) : null
  const courseCode = cls?.course_code != null ? String(cls.course_code) : null
  return {
   id: String(r.id),
   date: String(r.attendance_date ?? ""),
   status: String(r.status ?? ""),
   remarks: r.remarks != null ? String(r.remarks) : null,
   studentName: st?.full_name != null ? String(st.full_name) : "—",
   studentGrade: st?.grade != null ? String(st.grade) : null,
   subject: formatClassLabel({ subject: sub, courseCode, courseName }),
   courseCode,
  }
 })
}

export { localYmd, addDaysYmd }

export function partitionSchedules(rows: ScheduleRow[], todayYmd: string) {
 const today = todayYmd
 const weekEnd = addDaysYmd(today, 7)
 let todayCount = 0
 let next7Count = 0
 let futureCount = 0
 let pastCount = 0
 let cancelledCount = 0
 for (const s of rows) {
  if (s.status.includes("取消")) {
   cancelledCount++
   continue
  }
  if (s.scheduledDate === today) todayCount++
  if (s.scheduledDate > today && s.scheduledDate <= weekEnd) next7Count++
  if (s.scheduledDate >= today) futureCount++
  else pastCount++
 }
 return { todayCount, next7Count, futureCount, pastCount, cancelledCount }
}
