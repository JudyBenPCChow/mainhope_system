import { getMgmtRole, isSuperAdmin } from "@/lib/mgmtRole"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import { classDisplayName, formatClassLabel } from "@/lib/courseLabel"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import { supabase } from "@/lib/supabaseClient"
import { addDaysYmd, todayYmdLocal as localYmd } from "@/lib/weekdayUtils"

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

type TeacherPrivateRow = {
 teacher_id: string
 phone: string | null
 email: string | null
 salary_per_lesson: number | null
 remarks: string | null
}

function asTeacher(
 row: Record<string, unknown>,
 priv?: TeacherPrivateRow | null
): TeacherRecord {
 const subj = row.subject_speciality
 return {
  id: String(row.id),
  full_name: String(row.full_name ?? ""),
  english_name: row.english_name != null ? String(row.english_name) : null,
  abbr: row.abbr != null && String(row.abbr).trim() !== "" ? String(row.abbr).trim() : null,
  phone: priv?.phone != null ? String(priv.phone) : null,
  email: priv?.email != null ? String(priv.email) : null,
  status: normalizeTeacherEmploymentStatus(row.status != null ? String(row.status) : null),
  subject_speciality: Array.isArray(subj) ? (subj as string[]) : null,
  salary_per_lesson: priv?.salary_per_lesson != null ? Number(priv.salary_per_lesson) : null,
  remarks: priv?.remarks != null ? String(priv.remarks) : null,
  created_at: String(row.created_at ?? ""),
  updated_at: String(row.updated_at ?? ""),
 }
}

function mapPrivateRow(r: Record<string, unknown>): TeacherPrivateRow {
 return {
  teacher_id: String(r.teacher_id),
  phone: r.phone != null ? String(r.phone) : null,
  email: r.email != null ? String(r.email) : null,
  salary_per_lesson: r.salary_per_lesson != null ? Number(r.salary_per_lesson) : null,
  remarks: r.remarks != null ? String(r.remarks) : null,
 }
}

/** RLS：行政可見全部；老師只得自己。無權限列不會出現在 map。 */
async function fetchTeachersPrivateByIds(
 ids: string[]
): Promise<Map<string, TeacherPrivateRow>> {
 const map = new Map<string, TeacherPrivateRow>()
 if (!supabase || ids.length === 0) return map
 const { data, error } = await supabase
  .from("teachers_private")
  .select("teacher_id, phone, email, salary_per_lesson, remarks")
  .in("teacher_id", ids)
 if (error) {
  console.warn("[fetchTeachersPrivateByIds]", error.message)
  return map
 }
 for (const row of data ?? []) {
  const p = mapPrivateRow(row as Record<string, unknown>)
  map.set(p.teacher_id, p)
 }
 return map
}

export async function fetchAllTeachers(): Promise<TeacherRecord[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("teachers")
  .select("id, full_name, english_name, abbr, status, subject_speciality, created_at, updated_at")
  .order("full_name", { ascending: true })
 if (error) throw error
 const rows = (data ?? []) as Record<string, unknown>[]
 const priv = await fetchTeachersPrivateByIds(rows.map((r) => String(r.id)))
 return rows.map((r) => asTeacher(r, priv.get(String(r.id)) ?? null))
}

export async function getTeacherById(id: string): Promise<TeacherRecord | null> {
 if (!supabase) return null
 const { data, error } = await supabase
  .from("teachers")
  .select("id, full_name, english_name, abbr, status, subject_speciality, created_at, updated_at")
  .eq("id", id)
  .maybeSingle()
 if (error) throw error
 if (!data) return null
 const priv = await fetchTeachersPrivateByIds([id])
 return asTeacher(data as Record<string, unknown>, priv.get(id) ?? null)
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
   status: normalizeTeacherEmploymentStatus(row.status != null ? String(row.status) : null),
   subject_speciality: row.subject_speciality ?? [],
  })
  .select("id, full_name, english_name, abbr, status, subject_speciality, created_at, updated_at")
  .single()
 if (error) throw error
 const id = String((data as { id: string }).id)
 const { error: privErr } = await supabase.from("teachers_private").upsert(
  {
   teacher_id: id,
   phone: row.phone ?? null,
   email: row.email ?? null,
   salary_per_lesson: row.salary_per_lesson ?? null,
   remarks: row.remarks ?? null,
   updated_at: new Date().toISOString(),
  },
  { onConflict: "teacher_id" }
 )
 if (privErr) throw privErr
 return asTeacher(data as Record<string, unknown>, {
  teacher_id: id,
  phone: row.phone ?? null,
  email: row.email ?? null,
  salary_per_lesson: row.salary_per_lesson ?? null,
  remarks: row.remarks ?? null,
 })
}

export async function updateTeacher(
 id: string,
 patch: Partial<Omit<TeacherRecord, "id" | "created_at">>
): Promise<TeacherRecord> {
 if (!supabase) throw new Error("Supabase 未設定")
 const role = getMgmtRole()
 const selfTeacherId = getTeacherScopeTeacherId()
 const isSelfTeacher = role === "teacher" && selfTeacherId === id

 const publicPatch: Record<string, unknown> = { updated_at: new Date().toISOString() }
 const privatePatch: Record<string, unknown> = { updated_at: new Date().toISOString() }

 if (isSelfTeacher) {
  if (Object.prototype.hasOwnProperty.call(patch, "subject_speciality")) {
   publicPatch.subject_speciality = patch.subject_speciality
  }
  if (Object.prototype.hasOwnProperty.call(patch, "phone")) privatePatch.phone = patch.phone
  if (Object.prototype.hasOwnProperty.call(patch, "remarks")) privatePatch.remarks = patch.remarks
 } else {
  if (Object.prototype.hasOwnProperty.call(patch, "full_name")) publicPatch.full_name = patch.full_name
  if (Object.prototype.hasOwnProperty.call(patch, "english_name")) {
   publicPatch.english_name = patch.english_name
  }
  if (Object.prototype.hasOwnProperty.call(patch, "status")) {
   publicPatch.status = normalizeTeacherEmploymentStatus(
    patch.status != null ? String(patch.status) : null
   )
  }
  if (Object.prototype.hasOwnProperty.call(patch, "subject_speciality")) {
   publicPatch.subject_speciality = patch.subject_speciality
  }
  if (Object.prototype.hasOwnProperty.call(patch, "abbr")) {
   if (isSuperAdmin()) {
    const a = patch.abbr
    publicPatch.abbr =
     a == null || String(a).trim() === "" ? null : String(a).trim().slice(0, 64)
   }
  }
  if (Object.prototype.hasOwnProperty.call(patch, "phone")) privatePatch.phone = patch.phone
  if (Object.prototype.hasOwnProperty.call(patch, "email")) privatePatch.email = patch.email
  if (Object.prototype.hasOwnProperty.call(patch, "salary_per_lesson")) {
   privatePatch.salary_per_lesson = patch.salary_per_lesson
  }
  if (Object.prototype.hasOwnProperty.call(patch, "remarks")) privatePatch.remarks = patch.remarks
 }

 const { data, error } = await supabase
  .from("teachers")
  .update(publicPatch)
  .eq("id", id)
  .select("id, full_name, english_name, abbr, status, subject_speciality, created_at, updated_at")
  .single()
 if (error) throw error

 const privateKeys = Object.keys(privatePatch).filter((k) => k !== "updated_at")
 if (privateKeys.length > 0) {
  if (isSelfTeacher) {
   const { error: privErr } = await supabase
    .from("teachers_private")
    .update(privatePatch)
    .eq("teacher_id", id)
   if (privErr) throw privErr
  } else {
   const { error: privErr } = await supabase.from("teachers_private").upsert(
    { teacher_id: id, ...privatePatch },
    { onConflict: "teacher_id" }
   )
   if (privErr) throw privErr
  }
 }

 const priv = await fetchTeachersPrivateByIds([id])
 return asTeacher(data as Record<string, unknown>, priv.get(id) ?? null)
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
  .select("id, subject, course_code_full, day_of_week, time_slot, grade, price_per_lesson, courses ( course_name )")
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
   courseCode: c.course_code_full != null ? String(c.course_code_full) : null,
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
 classroomName: string | null
 teachingNotes: string | null
}

export async function fetchTeacherSchedules(teacherId: string): Promise<ScheduleRow[]> {
 if (!supabase) return []
 const { data: sched, error } = await supabase
  .from("schedules")
  .select(
   "id, class_id, scheduled_date, start_time, end_time, status, session_number, teaching_notes, classes ( subject, course_code_full, courses ( course_name ) ), classrooms ( name )"
  )
  .eq("teacher_id", teacherId)
  .order("scheduled_date", { ascending: true })
  .order("start_time", { ascending: true })
 if (error) throw error
 const rows = (sched ?? []) as Record<string, unknown>[]
 return rows.map((r) => {
  const cls = r.classes as Record<string, unknown> | null
  const rm = r.classrooms as Record<string, unknown> | null
  const sub = cls?.subject != null ? String(cls.subject) : "—"
  const course = cls?.courses as Record<string, unknown> | null
  const courseName = course?.course_name != null ? String(course.course_name) : null
  const courseCode = cls?.course_code_full != null ? String(cls.course_code_full) : null
  return {
   id: String(r.id),
   classId: r.class_id != null ? String(r.class_id) : "",
   scheduledDate: String(r.scheduled_date ?? ""),
   startTime: r.start_time != null ? String(r.start_time) : null,
   endTime: r.end_time != null ? String(r.end_time) : null,
   status: String(r.status ?? "正常"),
   sessionNumber:
    r.session_number != null && !Number.isNaN(Number(r.session_number))
     ? Number(r.session_number)
     : null,
   subject: formatClassLabel({ subject: sub, courseCode, courseName }),
   courseCode,
   classroomName: rm?.name != null ? String(rm.name) : null,
   teachingNotes: r.teaching_notes != null ? String(r.teaching_notes) : null,
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

/** 老師詳情出勤：以 schedules.teacher_id（當日實際）歸屬，勿用 classes.teacher_id（主責） */
export async function fetchTeacherAttendance(
 teacherId: string
): Promise<TeacherAttendanceRow[]> {
 if (!supabase) return []
 const { data: sched, error: schedErr } = await supabase
  .from("schedules")
  .select("id")
  .eq("teacher_id", teacherId)
 if (schedErr) throw schedErr
 const scheduleIds = (sched ?? []).map((r) => String((r as { id: string }).id))
 if (scheduleIds.length === 0) return []

 const chunks = await forEachIdChunk(scheduleIds, DEFAULT_ID_CHUNK, async (slice) => {
  const { data, error } = await supabase!
   .from("attendance_details")
   .select(
    "id, attendance_date, status, remarks, classes ( subject, course_code_full, courses ( course_name ) ), students ( full_name, grade )"
   )
   .in("schedule_id", slice)
  if (error) throw error
  return (data ?? []) as Record<string, unknown>[]
 })

 return chunks
  .flat()
  .map((r) => {
   const cls = r.classes as Record<string, unknown> | null
   const st = r.students as Record<string, unknown> | null
   const sub = cls?.subject != null ? String(cls.subject) : "—"
   const course = cls?.courses as Record<string, unknown> | null
   const courseName = course?.course_name != null ? String(course.course_name) : null
   const courseCode = cls?.course_code_full != null ? String(cls.course_code_full) : null
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
  .sort((a, b) => b.date.localeCompare(a.date))
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
