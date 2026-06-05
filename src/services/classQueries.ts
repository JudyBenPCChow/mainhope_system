import {
 academicYearLabelFromStartDate,
 coalesceCourseCodeForDb,
} from "@/lib/courseCode"
import {
 buildClassCourseCodeFull,
 buildCourseCodeBase,
 clampCourseSeq,
 DEFAULT_COURSE_SEQ,
 normalizeGradeCode,
 parseCourseSeqFromCodeSuffix,
} from "@/lib/courseCode"
import { supabase } from "@/lib/supabaseClient"
import { formatClassLabel } from "@/lib/courseLabel"
import { logMgmtAuditAction } from "@/services/mgmtGodViewQueries"
import { pickStudentContactRaw } from "@/lib/whatsappReminder"
import { fetchRosterForRollCall, fetchTrialStudentsForSchedule } from "@/services/attendanceQueries"

export type ClassRecord = {
 id: string
 course_code: string | null
 course_code_full: string | null
 course_id: string | null
 section_code: string | null
 subject: string
 subject_id?: string | null
 subject_code?: string | null
 course_name?: string | null
 grade: string[] | null
 grade_code?: string | null
 course_seq?: number | null
 academic_year_id?: string | null
 academic_year_label?: string | null
 day_of_week: string | null
 time_slot: string | null
 teacher_id: string | null
 teacher_name: string | null
 classroom_id: string | null
 classroom_name: string | null
 capacity: number | null
 price_per_lesson: number | null
 start_date: string | null
 end_date: string | null
 status: string
 created_at: string
 updated_at: string
}

function mapClassRow(row: Record<string, unknown>): ClassRecord {
 const t = row.teachers as { id?: string; full_name?: string } | null
 const r = row.classrooms as { id?: string; name?: string } | null
 const course = row.courses as Record<string, unknown> | null
 const subject = course?.subjects as Record<string, unknown> | null
 const year = row.academic_years as Record<string, unknown> | null
 const g = row.grade
 return {
  id: String(row.id),
  course_code: row.course_code != null ? String(row.course_code) : null,
  course_code_full: row.course_code_full != null ? String(row.course_code_full) : null,
  course_id: row.course_id != null ? String(row.course_id) : null,
  section_code: row.section_code != null ? String(row.section_code) : null,
  subject: String(row.subject ?? ""),
  subject_id: subject?.id != null ? String(subject.id) : null,
  subject_code: subject?.code != null ? String(subject.code) : null,
  course_name: course?.course_name != null ? String(course.course_name) : null,
  grade: Array.isArray(g) ? (g as string[]) : null,
  grade_code: course?.grade_code != null ? String(course.grade_code) : null,
  course_seq: course?.course_seq != null ? Number(course.course_seq) : null,
  academic_year_id: year?.id != null ? String(year.id) : null,
  academic_year_label: year?.label != null ? String(year.label) : null,
  day_of_week: row.day_of_week != null ? String(row.day_of_week) : null,
  time_slot: row.time_slot != null ? String(row.time_slot) : null,
  teacher_id: row.teacher_id != null ? String(row.teacher_id) : null,
  teacher_name: t?.full_name ?? null,
  classroom_id: row.classroom_id != null ? String(row.classroom_id) : null,
  classroom_name: r?.name ?? null,
  capacity: row.capacity != null ? Number(row.capacity) : null,
  price_per_lesson:
   course?.price_per_lesson != null
    ? Number(course.price_per_lesson)
    : row.price_per_lesson != null
      ? Number(row.price_per_lesson)
      : null,
  start_date: row.start_date != null ? String(row.start_date) : null,
  end_date: row.end_date != null ? String(row.end_date) : null,
  status: String(row.status ?? "進行中"),
  created_at: String(row.created_at ?? ""),
  updated_at: String(row.updated_at ?? ""),
 }
}

export async function fetchAllClasses(): Promise<ClassRecord[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("classes")
  .select("*, teachers ( id, full_name ), classrooms ( id, name ), academic_years ( id, label ), courses ( id, grade_code, course_seq, price_per_lesson, course_name, subjects ( id, code ) )")
  .order("course_code_full", { ascending: true, nullsFirst: false })
  .order("course_code", { ascending: true, nullsFirst: false })
 if (error) throw error
 return (data ?? []).map((x) => mapClassRow(x as Record<string, unknown>))
}

export async function getClassById(id: string): Promise<ClassRecord | null> {
 if (!supabase) return null
 const { data, error } = await supabase
  .from("classes")
  .select("*, teachers ( id, full_name ), classrooms ( id, name ), academic_years ( id, label ), courses ( id, grade_code, course_seq, price_per_lesson, course_name, subjects ( id, code ) )")
  .eq("id", id)
  .maybeSingle()
 if (error) throw error
 if (!data) return null
 return mapClassRow(data as Record<string, unknown>)
}

function sectionCodeFromOrdinal(ord: number): string {
 if (ord <= 26) return String.fromCharCode(64 + ord)
 const head = String.fromCharCode(64 + ((ord - 1) % 26) + 1)
 const suffix = Math.floor((ord - 1) / 26) + 1
 return `${head}${suffix}`
}

function parseLegacySeed(courseCode: string | null | undefined): number {
 return parseCourseSeqFromCodeSuffix(courseCode)
}

async function allocateSectionCode(courseId: string): Promise<string> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { data, error } = await supabase
  .from("classes")
  .select("section_code")
  .eq("course_id", courseId)
  .order("created_at", { ascending: true })
 if (error) throw error
 const used = new Set(
  (data ?? [])
   .map((r) => ((r as { section_code?: string | null }).section_code ?? "").trim())
   .filter((x) => x.length > 0)
 )
 let ord = 1
 while (used.has(sectionCodeFromOrdinal(ord))) ord += 1
 return sectionCodeFromOrdinal(ord)
}

async function resolveCurrentAcademicYearLabel(): Promise<string> {
 if (!supabase) return academicYearLabelFromStartDate(null)
 const { data, error } = await supabase
  .from("academic_years")
  .select("label")
  .eq("is_current", true)
  .maybeSingle()
 if (error) throw error
 if (data?.label) return String(data.label)
 return academicYearLabelFromStartDate(null)
}

async function resolveAcademicYearIdLabel(params: {
 academic_year_id?: string | null
 academic_year_label?: string | null
}): Promise<{ academic_year_id: string; academic_year_label: string }> {
 if (!supabase) throw new Error("Supabase 未設定")
 if (params.academic_year_id) {
  const { data, error } = await supabase
   .from("academic_years")
   .select("id, label")
   .eq("id", params.academic_year_id)
   .single()
  if (error) throw error
  return { academic_year_id: String(data.id), academic_year_label: String(data.label) }
 }
 const label = (params.academic_year_label ?? "").trim() || (await resolveCurrentAcademicYearLabel())
 const { data, error } = await supabase.from("academic_years").select("id, label").eq("label", label).single()
 if (error) throw error
 return { academic_year_id: String(data.id), academic_year_label: String(data.label) }
}

async function ensureCourseId(params: {
 course_id?: string | null
 subject_id?: string | null
 subject_code?: string | null
 grade_code?: string | null
 course_seq?: number | null
 price_per_lesson?: number | null
 subject_name?: string | null
 legacy_course_code?: string | null
}): Promise<{ course_id: string; subject_code: string; grade_code: string; course_seq: number }> {
 if (!supabase) throw new Error("Supabase 未設定")
 if (params.course_id) {
  const { data, error } = await supabase
   .from("courses")
   .select("id, grade_code, course_seq, subjects ( code )")
   .eq("id", params.course_id)
   .single()
  if (error) throw error
  const row = data as Record<string, unknown>
  const subject = row.subjects as Record<string, unknown> | null
  return {
   course_id: String(row.id),
   subject_code: String(subject?.code ?? ""),
   grade_code: String(row.grade_code ?? ""),
   course_seq: clampCourseSeq(Number(row.course_seq ?? DEFAULT_COURSE_SEQ)),
  }
 }

 const gradeCode = normalizeGradeCode(params.grade_code)
 const seq = clampCourseSeq(params.course_seq ?? parseLegacySeed(params.legacy_course_code))
 if (!gradeCode) throw new Error("請先選擇年級（grade_code）。")

 let subjectId = params.subject_id ?? null
 let subjectCode = (params.subject_code ?? "").trim().toUpperCase()
 if (!subjectId) {
  if (subjectCode) {
   const { data, error } = await supabase.from("subjects").select("id, code").eq("code", subjectCode).single()
   if (error) throw error
   subjectId = String(data.id)
   subjectCode = String(data.code)
  } else if (params.subject_name?.trim()) {
   const subjectName = params.subject_name.trim()
   const { data: byNameZh, error } = await supabase
    .from("subjects")
    .select("id, code")
    .eq("name_zh", subjectName)
    .maybeSingle()
   if (error) throw error
   let subjectRow = byNameZh
   if (!subjectRow) {
    const alt = await supabase.from("subjects").select("id, code").eq("short_name", subjectName).maybeSingle()
    if (alt.error) throw alt.error
    subjectRow = alt.data
   }
   if (!subjectRow) throw new Error(`找不到科目：${subjectName}`)
   subjectId = String(subjectRow.id)
   subjectCode = String(subjectRow.code)
  } else {
   throw new Error("請先選擇科目。")
  }
 }

 const { data: found, error: findErr } = await supabase
  .from("courses")
  .select("id")
  .eq("subject_id", subjectId)
  .eq("grade_code", gradeCode)
  .eq("course_seq", seq)
  .maybeSingle()
 if (findErr) throw findErr
 if (found?.id) {
  if (params.price_per_lesson != null && !Number.isNaN(params.price_per_lesson)) {
   await supabase
    .from("courses")
    .update({ price_per_lesson: Math.max(0, Number(params.price_per_lesson)), updated_at: new Date().toISOString() })
    .eq("id", String(found.id))
  }
  return { course_id: String(found.id), subject_code: subjectCode, grade_code: gradeCode, course_seq: seq }
 }

 const { data: inserted, error: insErr } = await supabase
  .from("courses")
  .insert({
   subject_id: subjectId,
   grade_code: gradeCode,
   course_seq: seq,
   course_code_base: buildCourseCodeBase(subjectCode, gradeCode, seq),
   price_per_lesson:
    params.price_per_lesson != null && !Number.isNaN(params.price_per_lesson)
     ? Math.max(0, Number(params.price_per_lesson))
     : null,
  })
  .select("id")
  .single()
 if (insErr) throw insErr
 return { course_id: String(inserted.id), subject_code: subjectCode, grade_code: gradeCode, course_seq: seq }
}

export async function insertClass(
 row: Partial<ClassRecord> & { subject: string }
): Promise<ClassRecord> {
 if (!supabase) throw new Error("Supabase 未設定")
 if (!row.course_id) {
  throw new Error("請先在「課程管理」建立課程模板，再於此選擇課程。")
 }
 const course = await ensureCourseId({
  course_id: row.course_id,
  subject_id: row.subject_id ?? null,
  subject_code: row.subject_code ?? null,
  grade_code: row.grade_code ?? row.grade?.[0] ?? null,
  course_seq: row.course_seq ?? null,
  price_per_lesson: row.price_per_lesson ?? null,
  subject_name: row.subject,
  legacy_course_code: row.course_code ?? null,
 })
 const year = await resolveAcademicYearIdLabel({
  academic_year_id: row.academic_year_id ?? null,
  academic_year_label: row.academic_year_label ?? null,
 })
 const section = row.section_code?.trim() || (await allocateSectionCode(course.course_id))
 const courseCodeFull = buildClassCourseCodeFull(
  year.academic_year_label,
  course.subject_code,
  course.grade_code,
  course.course_seq,
  section
 )
 const { data, error } = await supabase
  .from("classes")
  .insert({
   subject: row.subject,
   course_code: coalesceCourseCodeForDb(row.course_code ?? null),
   course_id: course.course_id,
   academic_year_id: year.academic_year_id,
   section_code: section,
   course_code_full: courseCodeFull,
   grade: row.grade ?? null,
   day_of_week: row.day_of_week ?? null,
   time_slot: row.time_slot ?? null,
   teacher_id: row.teacher_id ?? null,
   classroom_id: row.classroom_id ?? null,
   capacity: row.capacity ?? null,
   price_per_lesson: null,
   start_date: row.start_date ?? null,
   end_date: row.end_date ?? null,
   status: row.status ?? "進行中",
  })
  .select("*, teachers ( id, full_name ), classrooms ( id, name ), academic_years ( id, label ), courses ( id, grade_code, course_seq, price_per_lesson, subjects ( id, code ) )")
  .single()
 if (error) throw error
 return mapClassRow(data as Record<string, unknown>)
}

export async function updateClass(
 id: string,
 patch: Partial<Omit<ClassRecord, "id" | "created_at" | "teacher_name" | "classroom_name">>
): Promise<ClassRecord> {
 if (!supabase) throw new Error("Supabase 未設定")
 const payload: Record<string, unknown> = {
  ...(patch as Record<string, unknown>),
  updated_at: new Date().toISOString(),
 }
 delete payload.teacher_name
 delete payload.classroom_name
 delete payload.id
 delete payload.created_at
 if ("course_code" in patch) {
  payload.course_code = coalesceCourseCodeForDb(patch.course_code ?? null)
 }
 if ("course_id" in patch || "section_code" in patch) {
  const targetCourseId = (patch.course_id as string | null | undefined) ?? null
  const section = typeof patch.section_code === "string" ? patch.section_code.trim() : null
  if (targetCourseId) {
   const resolvedSection = section && section.length > 0 ? section : await allocateSectionCode(targetCourseId)
   payload.section_code = resolvedSection
   const info = await ensureCourseId({ course_id: targetCourseId })
   const year = await resolveAcademicYearIdLabel({
    academic_year_id: (patch.academic_year_id as string | null | undefined) ?? (payload.academic_year_id as string | null | undefined),
    academic_year_label: (patch.academic_year_label as string | null | undefined) ?? null,
   })
   payload.academic_year_id = year.academic_year_id
   payload.course_code_full = buildClassCourseCodeFull(
    year.academic_year_label,
    info.subject_code,
    info.grade_code,
    info.course_seq,
    resolvedSection
   )
  }
 }
 const { data, error } = await supabase
  .from("classes")
  .update(payload)
  .eq("id", id)
  .select("*, teachers ( id, full_name ), classrooms ( id, name ), academic_years ( id, label ), courses ( id, grade_code, course_seq, price_per_lesson, subjects ( id, code ) )")
  .single()
 if (error) throw error
 return mapClassRow(data as Record<string, unknown>)
}

export async function deleteClass(id: string): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase.from("classes").delete().eq("id", id)
 if (error) throw error
}

export async function duplicateClass(id: string): Promise<ClassRecord> {
 const src = await getClassById(id)
 if (!src) throw new Error("找不到班別")
 return insertClass({
  subject: src.subject,
  course_code: src.course_code,
  course_id: src.course_id,
  academic_year_id: src.academic_year_id ?? null,
  academic_year_label: src.academic_year_label ?? null,
  grade: src.grade,
  day_of_week: src.day_of_week,
  time_slot: src.time_slot,
  teacher_id: src.teacher_id,
  classroom_id: src.classroom_id,
  capacity: src.capacity,
  price_per_lesson: src.price_per_lesson,
  start_date: src.start_date,
  end_date: src.end_date,
  status: src.status,
 })
}

export type ClassStudentRow = {
 enrollmentId: string
 studentId: string
 fullName: string
 grade: string | null
 school: string | null
 enrollDate: string | null
 status: string
 contactPhone: string | null
}

export async function fetchClassStudents(classId: string): Promise<ClassStudentRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("student_class_enrollments")
  .select("id, status, enroll_date, student_id, students ( full_name, grade, school, whatsapp, parent_phone )")
  .eq("class_id", classId)
  .order("created_at", { ascending: false })
 if (error) throw error
 return (data ?? []).map((row) => {
  const r = row as Record<string, unknown>
  const st = r.students as Record<string, unknown> | null
  return {
   enrollmentId: String(r.id),
   studentId: String(r.student_id),
   fullName: st?.full_name != null ? String(st.full_name) : "—",
   grade: st?.grade != null ? String(st.grade) : null,
   school: st?.school != null ? String(st.school) : null,
   enrollDate: r.enroll_date != null ? String(r.enroll_date) : null,
   status: String(r.status ?? "就讀中"),
   contactPhone: pickStudentContactRaw({
    whatsapp: st?.whatsapp != null ? String(st.whatsapp) : null,
    parent_phone: st?.parent_phone != null ? String(st.parent_phone) : null,
   }),
  }
 })
}

export type ClassScheduleRow = {
 id: string
 scheduled_date: string
 start_time: string | null
 end_time: string | null
 status: string
}

export async function fetchClassSchedules(classId: string): Promise<ClassScheduleRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("schedules")
  .select("id, scheduled_date, start_time, end_time, status")
  .eq("class_id", classId)
  .order("scheduled_date", { ascending: true })
  .order("start_time", { ascending: true })
 if (error) throw error
 return (data ?? []).map((r) => {
  const row = r as Record<string, unknown>
  return {
   id: String(row.id),
   scheduled_date: String(row.scheduled_date ?? ""),
   start_time: row.start_time != null ? String(row.start_time) : null,
   end_time: row.end_time != null ? String(row.end_time) : null,
   status: String(row.status ?? "預定"),
  }
 })
}

export async function insertScheduleRow(opts: {
 class_id: string | null
 teacher_id: string | null
 scheduled_date: string
 start_time?: string | null
 end_time?: string | null
 status?: string
 classroom_id?: string | null
 remarks?: string | null
}): Promise<string> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { data, error } = await supabase
  .from("schedules")
  .insert({
   class_id: opts.class_id,
   teacher_id: opts.teacher_id,
   classroom_id: opts.classroom_id ?? null,
   scheduled_date: opts.scheduled_date,
   start_time: opts.start_time ?? null,
   end_time: opts.end_time ?? null,
   status: opts.status ?? "預定",
   remarks: opts.remarks ?? null,
  })
  .select("id")
  .single()
 if (error) throw error
 const id = String((data as { id: string }).id)
 void logMgmtAuditAction({
  action: "新增排程",
  detail: `schedule_id=${id}; class_id=${opts.class_id ?? "null"}; date=${opts.scheduled_date}`,
 })
 return id
}

export async function insertScheduleForClass(
 classId: string,
 teacherId: string | null,
 row: {
  scheduled_date: string
  start_time?: string | null
  end_time?: string | null
  status?: string
  classroom_id?: string | null
 }
): Promise<void> {
 await insertScheduleRow({
  class_id: classId,
  teacher_id: teacherId,
  scheduled_date: row.scheduled_date,
  start_time: row.start_time,
  end_time: row.end_time,
  status: row.status,
  classroom_id: row.classroom_id,
 })
}

export async function updateSchedule(
 id: string,
 patch: Partial<{
  status: string
  start_time: string | null
  end_time: string | null
  classroom_id: string | null
  remarks: string | null
 }>
): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase
  .from("schedules")
  .update({ ...patch, updated_at: new Date().toISOString() })
  .eq("id", id)
 if (error) throw error
 void logMgmtAuditAction({
  action: "更新排程",
  detail: `schedule_id=${id}; patch=${JSON.stringify(patch)}`,
 })
}

export async function deleteSchedule(id: string): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase.from("schedules").delete().eq("id", id)
 if (error) throw error
 void logMgmtAuditAction({
  action: "刪除排程",
  detail: `schedule_id=${id}`,
 })
}

export type ScheduleDetailRecord = {
 id: string
 scheduled_date: string
 start_time: string | null
 end_time: string | null
 status: string
 remarks: string | null
 class_id: string | null
 class_subject: string
 course_code: string | null
 teacher_id: string | null
 teacher_name: string | null
 classroom_id: string | null
 classroom_name: string | null
 /** 課室是否標為線上（網課） */
 classroom_is_online: boolean
}

export type ScheduleDetailStudent = {
 studentId: string
 fullName: string
 englishName: string | null
 /** 就讀中優先；其餘為當日紀錄中出現的學生 */
 source: "就讀" | "試堂" | "當日紀錄"
 contactPhone: string | null
}

export type ScheduleDetailLeaveRow = {
 id: string
 studentId: string
 studentName: string
 leaveReason: string | null
 makeupType: string | null
 makeupScheduleId: string | null
 status: string
 linkedToThisSchedule: boolean
}

export type ScheduleDetailMakeupHereRow = {
 leaveId: string
 studentId: string
 studentName: string
 leaveDate: string
 makeupType: string | null
 status: string
}

export type ScheduleDetailAttendanceRow = {
 studentId: string
 studentName: string
 status: string
 remarks: string | null
}

export type ScheduleDetailContext = {
 students: ScheduleDetailStudent[]
 leaves: ScheduleDetailLeaveRow[]
 makeupsHere: ScheduleDetailMakeupHereRow[]
 attendance: ScheduleDetailAttendanceRow[]
}

export const EMPTY_SCHEDULE_DETAIL_CONTEXT: ScheduleDetailContext = {
 students: [],
 leaves: [],
 makeupsHere: [],
 attendance: [],
}

/** 排程詳情頁：學生、請假、來此補堂、當日出勤列 */
export async function fetchScheduleDetailContext(
 scheduleId: string,
 classId: string,
 lessonDate: string
): Promise<ScheduleDetailContext> {
 const empty: ScheduleDetailContext = {
  students: [],
  leaves: [],
  makeupsHere: [],
  attendance: [],
 }
 if (!supabase) return empty

 const orFilter = `schedule_id.eq.${scheduleId},and(class_id.eq.${classId},leave_date.eq.${lessonDate})`

 const [roster, trials, leavesRes, makeupsRes, attRes] = await Promise.all([
  fetchRosterForRollCall(classId),
  fetchTrialStudentsForSchedule(scheduleId),
  supabase
   .from("leave_makeup_records")
   .select(
    "id, student_id, schedule_id, leave_date, leave_reason, makeup_type, makeup_schedule_id, status, students ( full_name, english_name )"
   )
   .or(orFilter)
   .order("created_at", { ascending: true }),
  supabase
   .from("leave_makeup_records")
   .select(
    "id, student_id, leave_date, leave_reason, makeup_type, status, students ( full_name, english_name )"
   )
   .eq("makeup_schedule_id", scheduleId)
   .order("leave_date", { ascending: true }),
  supabase
   .from("attendance_details")
   .select("student_id, status, remarks, students ( full_name, english_name )")
   .eq("class_id", classId)
   .eq("attendance_date", lessonDate)
   .order("created_at", { ascending: true }),
 ])

 if (leavesRes.error) throw leavesRes.error
 if (makeupsRes.error) throw makeupsRes.error
 if (attRes.error) throw attRes.error

 type Src = ScheduleDetailStudent["source"]
 const rank = (s: Src) => (s === "就讀" ? 0 : s === "試堂" ? 1 : 2)

 const byId = new Map<string, ScheduleDetailStudent>()

 const upsertStudent = (
  studentId: string,
  fullName: string,
  englishName: string | null,
  source: Src,
  contactPhone: string | null = null
 ) => {
  const prev = byId.get(studentId)
  if (!prev) {
   byId.set(studentId, { studentId, fullName, englishName, source, contactPhone })
   return
  }
  const phone = contactPhone || prev.contactPhone || null
  if (rank(source) < rank(prev.source)) {
   byId.set(studentId, { studentId, fullName, englishName, source, contactPhone: phone })
  } else {
   byId.set(studentId, { ...prev, contactPhone: phone })
  }
 }

 for (const r of roster) {
  upsertStudent(r.studentId, r.fullName, r.englishName, "就讀", r.contactPhone)
 }
 for (const t of trials) {
  upsertStudent(t.studentId, t.fullName, t.englishName, "試堂", t.contactPhone)
 }

 const leaves = (leavesRes.data ?? []).map((row) => {
  const r = row as Record<string, unknown>
  const st = r.students as Record<string, unknown> | null
  const sid = String(r.student_id)
  const name = st?.full_name != null ? String(st.full_name) : "—"
  const en = st?.english_name != null ? String(st.english_name) : null
  upsertStudent(sid, name, en, "當日紀錄", null)
  return {
   id: String(r.id),
   studentId: sid,
   studentName: name,
   leaveReason: r.leave_reason != null ? String(r.leave_reason) : null,
   makeupType: r.makeup_type != null ? String(r.makeup_type) : null,
   makeupScheduleId: r.makeup_schedule_id != null ? String(r.makeup_schedule_id) : null,
   status: String(r.status ?? ""),
   linkedToThisSchedule: r.schedule_id != null ? String(r.schedule_id) === scheduleId : false,
  }
 })

 const makeupsHere = (makeupsRes.data ?? []).map((row) => {
  const r = row as Record<string, unknown>
  const st = r.students as Record<string, unknown> | null
  const sid = String(r.student_id)
  const name = st?.full_name != null ? String(st.full_name) : "—"
  const en = st?.english_name != null ? String(st.english_name) : null
  upsertStudent(sid, name, en, "當日紀錄", null)
  return {
   leaveId: String(r.id),
   studentId: sid,
   studentName: name,
   leaveDate: String(r.leave_date ?? ""),
   makeupType: r.makeup_type != null ? String(r.makeup_type) : null,
   status: String(r.status ?? ""),
  }
 })

 const attendance = (attRes.data ?? []).map((row) => {
  const r = row as Record<string, unknown>
  const st = r.students as Record<string, unknown> | null
  const sid = String(r.student_id)
  const name = st?.full_name != null ? String(st.full_name) : "—"
  const en = st?.english_name != null ? String(st.english_name) : null
  upsertStudent(sid, name, en, "當日紀錄", null)
  return {
   studentId: sid,
   studentName: name,
   status: String(r.status ?? ""),
   remarks: r.remarks != null ? String(r.remarks) : null,
  }
 })

 const students = [...byId.values()].sort((a, b) =>
  a.fullName.localeCompare(b.fullName, "zh-Hant")
 )

 return { students, leaves, makeupsHere, attendance }
}

export async function getScheduleById(id: string): Promise<ScheduleDetailRecord | null> {
 if (!supabase) return null
 const { data, error } = await supabase
  .from("schedules")
  .select(
   "id, scheduled_date, start_time, end_time, status, remarks, class_id, teacher_id, classroom_id, classes ( subject, course_code ), teachers ( full_name ), classrooms ( id, name, is_online )"
  )
  .eq("id", id)
  .maybeSingle()
 if (error) throw error
 if (!data) return null
 const r = data as Record<string, unknown>
 const cls = r.classes as Record<string, unknown> | null
 const tch = r.teachers as Record<string, unknown> | null
 const crm = r.classrooms as Record<string, unknown> | null
 const cid = r.class_id != null ? String(r.class_id) : null
 return {
  id: String(r.id),
  scheduled_date: String(r.scheduled_date ?? ""),
  start_time: r.start_time != null ? String(r.start_time) : null,
  end_time: r.end_time != null ? String(r.end_time) : null,
  status: String(r.status ?? ""),
  remarks: r.remarks != null ? String(r.remarks) : null,
  class_id: cid,
  class_subject: cls?.subject != null ? String(cls.subject) : "—",
  course_code: cls?.course_code != null ? String(cls.course_code) : null,
  teacher_id: r.teacher_id != null ? String(r.teacher_id) : null,
  teacher_name: tch?.full_name != null ? String(tch.full_name) : null,
  classroom_id: r.classroom_id != null ? String(r.classroom_id) : null,
  classroom_name: crm?.name != null ? String(crm.name) : null,
  classroom_is_online: Boolean(crm?.is_online),
 }
}

export type TeacherOption = {
 id: string
 /** `teachers.full_name`，供下拉與列表顯示 */
 label: string
 /** `teachers.abbr`，內部簡稱；可為 null */
 abbr: string | null
}

export type SubjectOption = { id: string; code: string; name_zh: string }
export type AcademicYearOption = { id: string; label: string; is_current: boolean }
export type CourseOption = {
 id: string
 subject_id: string
 grade_code: string
 course_seq: number
 price_per_lesson: number | null
 course_name: string | null
 label: string
}

export type CourseRecord = {
 id: string
 subject_id: string
 subject_code: string
 subject_name_zh: string
 grade_code: string
 course_seq: number
 course_code_base: string
 price_per_lesson: number | null
 course_name: string | null
}

export async function fetchSubjectOptions(): Promise<SubjectOption[]> {
 if (!supabase) return []
 const { data, error } = await supabase.from("subjects").select("id, code, name_zh").order("code")
 if (error) throw error
 return (data ?? []).map((r) => ({
  id: String((r as { id: string }).id),
  code: String((r as { code: string }).code),
  name_zh: String((r as { name_zh: string }).name_zh),
 }))
}

export async function fetchAcademicYearOptions(): Promise<AcademicYearOption[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("academic_years")
  .select("id, label, is_current")
  .order("start_date", { ascending: false })
 if (error) throw error
 return (data ?? []).map((r) => ({
  id: String((r as { id: string }).id),
  label: String((r as { label: string }).label),
  is_current: Boolean((r as { is_current?: boolean }).is_current),
 }))
}

export async function fetchCourseOptions(params: {
 subject_id: string
 grade_code: string
}): Promise<CourseOption[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("courses")
  .select("id, subject_id, grade_code, course_seq, price_per_lesson, course_name, subjects ( code )")
  .eq("subject_id", params.subject_id)
  .eq("grade_code", params.grade_code)
  .order("course_seq", { ascending: true })
 if (error) throw error
 return (data ?? []).map((r) => {
  const row = r as Record<string, unknown>
  const sb = row.subjects as Record<string, unknown> | null
  const code = String(sb?.code ?? "")
  const seq = clampCourseSeq(Number(row.course_seq ?? DEFAULT_COURSE_SEQ))
  return {
   id: String(row.id),
   subject_id: String(row.subject_id),
   grade_code: String(row.grade_code ?? ""),
   course_seq: seq,
   price_per_lesson: row.price_per_lesson != null ? Number(row.price_per_lesson) : null,
   course_name: row.course_name != null ? String(row.course_name) : null,
   label: formatClassLabel({
    subject: code || "課程",
    courseCode: buildCourseCodeBase(code, String(row.grade_code ?? ""), seq),
    courseName: row.course_name != null ? String(row.course_name) : null,
   }),
  }
 })
}

export async function fetchAllCourses(): Promise<CourseRecord[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("courses")
  .select("id, subject_id, grade_code, course_seq, course_code_base, price_per_lesson, course_name, subjects ( code, name_zh )")
  .order("course_code_base", { ascending: true })
 if (error) throw error
 return (data ?? []).map((r) => {
  const row = r as Record<string, unknown>
  const sb = row.subjects as Record<string, unknown> | null
  return {
   id: String(row.id),
   subject_id: String(row.subject_id),
   subject_code: String(sb?.code ?? ""),
   subject_name_zh: String(sb?.name_zh ?? ""),
   grade_code: String(row.grade_code ?? ""),
   course_seq: clampCourseSeq(Number(row.course_seq ?? DEFAULT_COURSE_SEQ)),
   course_code_base: String(row.course_code_base ?? ""),
   price_per_lesson: row.price_per_lesson != null ? Number(row.price_per_lesson) : null,
   course_name: row.course_name != null ? String(row.course_name) : null,
  }
 })
}

export async function insertCourse(input: {
 subject_id: string
 grade_code: string
 course_seq: number
 price_per_lesson: number | null
 course_name?: string | null
}): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const g = normalizeGradeCode(input.grade_code)
 const seq = clampCourseSeq(input.course_seq)
 const { data: sb, error: sErr } = await supabase.from("subjects").select("code").eq("id", input.subject_id).single()
 if (sErr) throw sErr
 const code = String((sb as { code: string }).code)
 const courseNameRaw = input.course_name != null ? String(input.course_name).trim() : ""
 const payload = {
  subject_id: input.subject_id,
  grade_code: g,
  course_seq: seq,
  course_code_base: buildCourseCodeBase(code, g, seq),
  course_name: courseNameRaw !== "" ? courseNameRaw : null,
  price_per_lesson:
   input.price_per_lesson != null && !Number.isNaN(input.price_per_lesson)
    ? Math.max(0, Number(input.price_per_lesson))
    : null,
 }
 const { error } = await supabase.from("courses").insert(payload)
 if (error) throw error
}

export async function updateCourse(
 id: string,
 patch: {
  subject_id: string
  grade_code: string
  course_seq: number
  price_per_lesson: number | null
  course_name?: string | null
 }
): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const g = normalizeGradeCode(patch.grade_code)
 const seq = clampCourseSeq(patch.course_seq)
 const { data: sb, error: sErr } = await supabase.from("subjects").select("code").eq("id", patch.subject_id).single()
 if (sErr) throw sErr
 const code = String((sb as { code: string }).code)
 const courseNameRaw = patch.course_name != null ? String(patch.course_name).trim() : ""
 const payload = {
  subject_id: patch.subject_id,
  grade_code: g,
  course_seq: seq,
  course_code_base: buildCourseCodeBase(code, g, seq),
  course_name: courseNameRaw !== "" ? courseNameRaw : null,
  price_per_lesson:
   patch.price_per_lesson != null && !Number.isNaN(patch.price_per_lesson)
    ? Math.max(0, Number(patch.price_per_lesson))
    : null,
  updated_at: new Date().toISOString(),
 }
 const { error } = await supabase.from("courses").update(payload).eq("id", id)
 if (error) throw error
}

export async function fetchTeacherOptions(): Promise<TeacherOption[]> {
 if (!supabase) return []
 const { data, error } = await supabase.from("teachers").select("id, full_name, abbr").order("full_name")
 if (error) throw error
 return (data ?? []).map((r) => {
  const row = r as { id: string; full_name: string | null; abbr: string | null }
  const abbrRaw = row.abbr != null ? String(row.abbr).trim() : ""
  return {
   id: String(row.id),
   label: String(row.full_name ?? ""),
   abbr: abbrRaw !== "" ? abbrRaw : null,
  }
 })
}

export async function fetchClassroomOptions(): Promise<{ id: string; label: string }[]> {
 if (!supabase) return []
 const { data, error } = await supabase.from("classrooms").select("id, name").order("name")
 if (error) throw error
 return (data ?? []).map((r) => ({
  id: String((r as { id: string }).id),
  label: String((r as { name: string }).name),
 }))
}
