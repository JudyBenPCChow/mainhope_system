import { academicYearLabelFromStartDate } from "@/lib/courseCode"
import {
 buildClassCourseCodeFull,
 buildCourseCodeBase,
 clampCourseSeq,
 DEFAULT_COURSE_SEQ,
 normalizeGradeCode,
} from "@/lib/courseCode"
import { formatUnknownError } from "@/lib/formatUnknownError"
import {
 assertAcademicYearEditable,
 assertAcademicYearEditableForDate,
 assertClassRecordEditable,
} from "@/lib/academicYearEditGuard"
import { resolveClassKind, type ClassKind } from "@/lib/privateClassKind"
import { supabase } from "@/lib/supabaseClient"
import { gradeLabelsAlignedFromCourse, resolveClassGradeLabels, normalizeStoredClassGradeLabels } from "@/lib/classGrade"
import { formatClassLabel } from "@/lib/courseLabel"
import { logMgmtAuditAction } from "@/services/mgmtGodViewQueries"
import { cancelAllSchedulesForClass, fetchActiveScheduleDatesForClass, localYmd } from "@/services/scheduleQueries"
import {
 availabilityTimeSlotForStartTime,
 markAvailabilityForScheduleDates,
 releaseAvailabilityForClass,
 releaseAvailabilitySlotForSchedule,
} from "@/services/teacherAvailabilityQueries"
import { pickStudentContactFromDbRow } from "@/lib/whatsappReminder"
import type { EnrollmentFormValue, CourseMode } from "@/lib/enrollmentPeriod"
import {
 enrollmentCoversPeriod,
 enrollmentVisibleOnSchedule,
 fetchAcademicYearPeriods,
 fetchClassEnrollmentConfig,
 fetchClassEnrollmentConfigsByIds,
 formatEnrollmentFormLabel,
 isSingleSessionEnrollment,
 normalizeEnrollmentPeriod,
 resolvePeriodCodeFromDate,
 type AcademicYearPeriodRow,
} from "@/lib/enrollmentPeriod"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import { fetchRosterForRollCall, fetchTrialStudentsForSchedule } from "@/services/attendanceQueries"
import {
 fetchEnrolledScheduleIdsByEnrollmentIds,
 fetchSessionNumbersByEnrollmentIds,
 fetchSingleSessionNotOnSchedule,
} from "@/services/enrollmentSessionQueries"
import {
 consecutivePairFromFirstTimeSlot,
 isConsecutiveClass,
 newConsecutiveGroupId,
 resolveLessonReminderTimes,
} from "@/lib/consecutiveLesson"

export type ClassRecord = {
 id: string
 course_code_full: string | null
 course_id: string | null
 section_code: string | null
 subject: string
 /** group=小組課；private=一對一／單對單 */
 class_kind: ClassKind
 subject_id?: string | null
 subject_code?: string | null
 course_name?: string | null
 course_mode?: CourseMode | null
 grade: string[] | null
 grade_code?: string | null
 course_seq?: number | null
 academic_year_id?: string | null
 academic_year_label?: string | null
 day_of_week: string | null
 time_slot: string | null
 /** 每次上課占用格數：1=單堂；2=連堂 */
 lesson_slots_per_session: number
 teacher_id: string | null
 teacher_name: string | null
 classroom_id: string | null
 classroom_name: string | null
 capacity: number | null
 price_per_lesson: number | null
 start_date: string | null
 end_date: string | null
 status: string
 enrollment_notice: string | null
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
 const gradeCode = course?.grade_code != null ? String(course.grade_code) : null
 const resolvedGrade = resolveClassGradeLabels(
  Array.isArray(g) ? (g as string[]) : null,
  gradeCode
 )
 return {
  id: String(row.id),
  course_code_full: row.course_code_full != null ? String(row.course_code_full) : null,
  course_id: row.course_id != null ? String(row.course_id) : null,
  section_code: row.section_code != null ? String(row.section_code) : null,
  subject: String(row.subject ?? ""),
  class_kind: resolveClassKind(
   row.class_kind != null ? String(row.class_kind) : null,
   row.subject != null ? String(row.subject) : null
  ),
  subject_id: subject?.id != null ? String(subject.id) : null,
  subject_code: subject?.code != null ? String(subject.code) : null,
  course_name: course?.course_name != null ? String(course.course_name) : null,
  course_mode: course?.course_mode === "summer_two_period" ? "summer_two_period" : "regular",
  grade: resolvedGrade.length > 0 ? resolvedGrade : null,
  grade_code: gradeCode,
  course_seq: course?.course_seq != null ? Number(course.course_seq) : null,
  academic_year_id: year?.id != null ? String(year.id) : null,
  academic_year_label: year?.label != null ? String(year.label) : null,
  day_of_week: row.day_of_week != null ? String(row.day_of_week) : null,
  time_slot: row.time_slot != null ? String(row.time_slot) : null,
  lesson_slots_per_session:
   row.lesson_slots_per_session != null && Number(row.lesson_slots_per_session) === 2 ? 2 : 1,
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
  enrollment_notice:
   row.enrollment_notice != null ? String(row.enrollment_notice) : null,
  created_at: String(row.created_at ?? ""),
  updated_at: String(row.updated_at ?? ""),
 }
}

export async function fetchAllClasses(): Promise<ClassRecord[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("classes")
  .select("*, teachers ( id, full_name ), classrooms ( id, name ), academic_years ( id, label ), courses ( id, grade_code, course_seq, course_mode, price_per_lesson, price_per_lesson_period_2, price_per_lesson_both_periods, course_name, subjects ( id, code ) )")
  .order("course_code_full", { ascending: true, nullsFirst: false })
 if (error) throw error
 return (data ?? []).map((x) => mapClassRow(x as Record<string, unknown>))
}

export async function getClassById(id: string): Promise<ClassRecord | null> {
 if (!supabase) return null
 const { data, error } = await supabase
  .from("classes")
  .select("*, teachers ( id, full_name ), classrooms ( id, name ), academic_years ( id, label ), courses ( id, grade_code, course_seq, course_mode, price_per_lesson, price_per_lesson_period_2, price_per_lesson_both_periods, course_name, subjects ( id, code ) )")
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

function isPgUniqueViolation(error: unknown): boolean {
 if (!error || typeof error !== "object") return false
 const e = error as { code?: string; message?: string }
 return e.code === "23505" || /duplicate key|unique constraint/i.test(String(e.message ?? ""))
}

function isCourseTupleDuplicate(error: unknown): boolean {
 if (!isPgUniqueViolation(error)) return false
 const msg = formatUnknownError(error)
 return /courses_unique_tuple/i.test(msg)
}

function courseTupleDuplicateMessage(
 subjectCode?: string | null,
 gradeCode?: string | null,
 seq?: number | null
): string {
 const parts = [
  subjectCode?.trim() || null,
  gradeCode?.trim() || null,
  seq != null ? String(seq) : null,
 ].filter(Boolean)
 if (parts.length > 0) {
  return `此課程模板已存在（${parts.join(" · ")}），請改用其他課程序號或編輯既有課程。`
 }
 return "此科目、年級與課程序號的組合已存在，請改用其他課程序號或編輯既有課程。"
}

async function findCourseIdByTuple(
 subjectId: string,
 gradeCode: string,
 seq: number
): Promise<string | null> {
 if (!supabase) throw new Error("Supabase 未設定")
 const g = normalizeGradeCode(gradeCode)
 const { data, error } = await supabase
  .from("courses")
  .select("id")
  .eq("subject_id", subjectId)
  .eq("grade_code", g)
  .eq("course_seq", seq)
  .maybeSingle()
 if (error) throw error
 return data?.id ? String(data.id) : null
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
}): Promise<{
 course_id: string
 subject_code: string
 subject_name_zh: string | null
 grade_code: string
 course_seq: number
}> {
 if (!supabase) throw new Error("Supabase 未設定")
 if (params.course_id) {
  const { data, error } = await supabase
   .from("courses")
   .select("id, grade_code, course_seq, subjects ( code, name_zh )")
   .eq("id", params.course_id)
   .single()
  if (error) throw error
  const row = data as Record<string, unknown>
  const subject = row.subjects as Record<string, unknown> | null
  return {
   course_id: String(row.id),
   subject_code: String(subject?.code ?? ""),
   subject_name_zh: subject?.name_zh != null ? String(subject.name_zh) : null,
   grade_code: String(row.grade_code ?? ""),
   course_seq: clampCourseSeq(Number(row.course_seq ?? DEFAULT_COURSE_SEQ)),
  }
 }

 const gradeCode = normalizeGradeCode(params.grade_code)
 const seq = clampCourseSeq(params.course_seq ?? DEFAULT_COURSE_SEQ)
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

 let subjectNameZh: string | null = params.subject_name?.trim() || null
 if (subjectId) {
  const { data: sbRow, error: sbErr } = await supabase
   .from("subjects")
   .select("name_zh")
   .eq("id", subjectId)
   .maybeSingle()
  if (sbErr) throw sbErr
  if (sbRow?.name_zh) subjectNameZh = String(sbRow.name_zh)
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
  return {
   course_id: String(found.id),
   subject_code: subjectCode,
   subject_name_zh: subjectNameZh,
   grade_code: gradeCode,
   course_seq: seq,
  }
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
 if (insErr) {
  if (isCourseTupleDuplicate(insErr)) {
   const existingId = await findCourseIdByTuple(subjectId, gradeCode, seq)
   if (existingId) {
    if (params.price_per_lesson != null && !Number.isNaN(params.price_per_lesson)) {
     await supabase
      .from("courses")
      .update({ price_per_lesson: Math.max(0, Number(params.price_per_lesson)), updated_at: new Date().toISOString() })
      .eq("id", existingId)
    }
    return {
     course_id: existingId,
     subject_code: subjectCode,
     subject_name_zh: subjectNameZh,
     grade_code: gradeCode,
     course_seq: seq,
    }
   }
  }
  throw insErr
 }
 return {
  course_id: String(inserted.id),
  subject_code: subjectCode,
  subject_name_zh: subjectNameZh,
  grade_code: gradeCode,
  course_seq: seq,
 }
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
 })
 const year = await resolveAcademicYearIdLabel({
  academic_year_id: row.academic_year_id ?? null,
  academic_year_label: row.academic_year_label ?? null,
 })
 assertAcademicYearEditable(year.academic_year_label)
 const section = row.section_code?.trim() || (await allocateSectionCode(course.course_id))
 const courseCodeFull = buildClassCourseCodeFull(
  year.academic_year_label,
  course.subject_code,
  course.grade_code,
  course.course_seq,
  section
 )
 const alignedGrade = gradeLabelsAlignedFromCourse(course.grade_code)
 const subjectName = (course.subject_name_zh ?? row.subject).trim()
 const { data, error } = await supabase
  .from("classes")
  .insert({
   subject: subjectName,
   course_id: course.course_id,
   academic_year_id: year.academic_year_id,
   section_code: section,
   course_code_full: courseCodeFull,
   grade: alignedGrade.length > 0 ? alignedGrade : null,
   day_of_week: row.day_of_week ?? null,
   time_slot: row.time_slot ?? null,
   lesson_slots_per_session:
    row.lesson_slots_per_session === 2 ? 2 : 1,
   teacher_id: row.teacher_id ?? null,
   classroom_id: row.classroom_id ?? null,
   capacity: row.capacity ?? null,
   price_per_lesson: null,
   start_date: row.start_date ?? null,
   end_date: row.end_date ?? null,
   status: row.status ?? "進行中",
   enrollment_notice: row.enrollment_notice?.trim() || null,
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
 const existing = await getClassById(id)
 if (!existing) throw new Error("找不到班別")
 assertClassRecordEditable(existing)
 let existingForSection: ClassRecord | null = null
 if ("section_code" in patch && !("course_id" in patch)) {
  existingForSection = await getClassById(id)
 }
 const payload: Record<string, unknown> = {
  ...(patch as Record<string, unknown>),
  updated_at: new Date().toISOString(),
 }
 delete payload.teacher_name
 delete payload.classroom_name
 delete payload.id
 delete payload.created_at
 if ("course_id" in patch || "section_code" in patch) {
  const targetCourseId =
   (patch.course_id as string | null | undefined) ?? existingForSection?.course_id ?? null
  const section = typeof patch.section_code === "string" ? patch.section_code.trim() : null
  if (targetCourseId) {
   const resolvedSection = section && section.length > 0 ? section : await allocateSectionCode(targetCourseId)
   payload.section_code = resolvedSection
   const info = await ensureCourseId({ course_id: targetCourseId })
   const year = await resolveAcademicYearIdLabel({
    academic_year_id:
     (patch.academic_year_id as string | null | undefined) ??
     (payload.academic_year_id as string | null | undefined) ??
     existingForSection?.academic_year_id ??
     null,
    academic_year_label:
     (patch.academic_year_label as string | null | undefined) ??
     existingForSection?.academic_year_label ??
     null,
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
 const activeCourseId =
  (typeof payload.course_id === "string" ? payload.course_id : null) ?? existing.course_id
 if (activeCourseId) {
  const info = await ensureCourseId({ course_id: activeCourseId })
  if (info.subject_name_zh) payload.subject = info.subject_name_zh
  const grades = gradeLabelsAlignedFromCourse(info.grade_code)
  if (grades.length > 0) payload.grade = grades
 } else if ("grade" in patch) {
  const normalized = normalizeStoredClassGradeLabels(patch.grade ?? null)
  payload.grade = normalized.length > 0 ? normalized : null
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

/** 刪除班別前預覽：非取消排程日期列表 */
export async function previewClassDeletionSchedules(classId: string): Promise<string[]> {
 return fetchActiveScheduleDatesForClass(classId)
}

/** 取消所有排程、釋放檔期後刪除班別 */
export async function deleteClassCascade(classId: string): Promise<{ cancelledSchedules: number }> {
 const existing = await getClassById(classId)
 if (!existing) throw new Error("找不到班別")
 assertClassRecordEditable(existing)
 const cancelledSchedules = await cancelAllSchedulesForClass(classId)
 await releaseAvailabilityForClass(classId)
 await deleteClass(classId)
 return { cancelledSchedules }
}

export async function duplicateClass(id: string): Promise<ClassRecord> {
 const src = await getClassById(id)
 if (!src) throw new Error("找不到班別")
 return insertClass({
  subject: src.subject,
  course_id: src.course_id,
  academic_year_id: src.academic_year_id ?? null,
  academic_year_label: src.academic_year_label ?? null,
  grade: src.grade,
  day_of_week: src.day_of_week,
  time_slot: src.time_slot,
  lesson_slots_per_session: src.lesson_slots_per_session,
  teacher_id: src.teacher_id,
  classroom_id: src.classroom_id,
  capacity: src.capacity,
  price_per_lesson: src.price_per_lesson,
  start_date: src.start_date,
  end_date: src.end_date,
  status: src.status,
  enrollment_notice: src.enrollment_notice,
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
 enrollmentPeriod: EnrollmentFormValue | null
 sessionNumbers: number[]
 enrollmentFormLabel: string
 contactPhone: string | null
}

export async function fetchClassStudents(
 classId: string,
 opts?: { scheduleDate?: string; scheduleId?: string; activeOnly?: boolean }
): Promise<ClassStudentRow[]> {
 if (!supabase) return []
 let q = supabase
  .from("student_class_enrollments")
  .select("id, status, enroll_date, enrollment_period, student_id, students ( full_name, grade, school, whatsapp, student_phone, parent_phone )")
  .eq("class_id", classId)
 if (opts?.activeOnly) q = q.eq("status", "就讀中")
 const { data, error } = await q.order("created_at", { ascending: false })
 if (error) throw error

 let periodCode: 1 | 2 | null = null
 if (opts?.scheduleDate) {
  const config = await fetchClassEnrollmentConfig(classId)
  if (config.courseMode === "summer_two_period" && config.academicYearId) {
   const periods = await fetchAcademicYearPeriods(config.academicYearId)
   periodCode = resolvePeriodCodeFromDate(opts.scheduleDate, periods)
  }
 }

 const mapped = (data ?? []).map((row) => {
  const r = row as Record<string, unknown>
  const st = r.students as Record<string, unknown> | null
  const enrollmentPeriod = normalizeEnrollmentPeriod(
   r.enrollment_period != null ? String(r.enrollment_period) : null
  )
  return {
   enrollmentId: String(r.id),
   studentId: String(r.student_id),
   fullName: st?.full_name != null ? String(st.full_name) : "—",
   grade: st?.grade != null ? String(st.grade) : null,
   school: st?.school != null ? String(st.school) : null,
   enrollDate: r.enroll_date != null ? String(r.enroll_date) : null,
   status: String(r.status ?? "就讀中"),
   enrollmentPeriod,
   sessionNumbers: [] as number[],
   enrollmentFormLabel: formatEnrollmentFormLabel(enrollmentPeriod),
   contactPhone: pickStudentContactFromDbRow(st),
  }
 })

 const singleIds = mapped
  .filter((row) => isSingleSessionEnrollment(row.enrollmentPeriod))
  .map((row) => row.enrollmentId)
 const [scheduleIdByEnrollment, sessionNumbersByEnrollment] = await Promise.all([
  fetchEnrolledScheduleIdsByEnrollmentIds(singleIds),
  fetchSessionNumbersByEnrollmentIds(singleIds),
 ])

 const withSessions = mapped.map((row) => {
  if (!isSingleSessionEnrollment(row.enrollmentPeriod)) return row
  const sessionNumbers = sessionNumbersByEnrollment.get(row.enrollmentId) ?? []
  return {
   ...row,
   sessionNumbers,
   enrollmentFormLabel: formatEnrollmentFormLabel(row.enrollmentPeriod, sessionNumbers),
  }
 })

 return withSessions.filter((row) => {
  if (isSingleSessionEnrollment(row.enrollmentPeriod)) {
   // 班別詳情（無指定堂／日）仍顯示全部單堂生
   if (!opts?.scheduleId) return !opts?.scheduleDate
   const enrolled = scheduleIdByEnrollment.get(row.enrollmentId) ?? new Set<string>()
   return enrollmentVisibleOnSchedule({
    enrollmentPeriod: row.enrollmentPeriod,
    periodCode,
    scheduleId: opts.scheduleId,
    enrolledScheduleIds: enrolled,
   })
  }
  if (periodCode == null) return true
  return enrollmentCoversPeriod(row.enrollmentPeriod, periodCode)
 })
}

export type ClassScheduleRow = {
 id: string
 scheduled_date: string
 start_time: string | null
 end_time: string | null
 status: string
 session_number: number | null
 consecutive_group_id: string | null
 consecutive_slot_index: number | null
 teacher_id: string | null
 teacher_name: string | null
 original_teacher_id: string | null
 original_teacher_name: string | null
}

export async function fetchClassSchedules(classId: string): Promise<ClassScheduleRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("schedules")
  .select(
   "id, scheduled_date, start_time, end_time, status, session_number, consecutive_group_id, consecutive_slot_index, teacher_id, original_teacher_id, teachers!schedules_teacher_id_fkey ( full_name ), original_teacher:teachers!schedules_original_teacher_id_fkey ( full_name )"
  )
  .eq("class_id", classId)
  .order("scheduled_date", { ascending: true })
  .order("start_time", { ascending: true })
 if (error) throw error
 return (data ?? []).map((r) => {
  const row = r as Record<string, unknown>
  const tch = row.teachers as Record<string, unknown> | null
  const orig = row.original_teacher as Record<string, unknown> | null
  return {
   id: String(row.id),
   scheduled_date: String(row.scheduled_date ?? ""),
   start_time: row.start_time != null ? String(row.start_time) : null,
   end_time: row.end_time != null ? String(row.end_time) : null,
   status: String(row.status ?? "正常"),
   session_number:
    row.session_number != null && !Number.isNaN(Number(row.session_number))
     ? Number(row.session_number)
     : null,
   consecutive_group_id:
    row.consecutive_group_id != null ? String(row.consecutive_group_id) : null,
   consecutive_slot_index:
    row.consecutive_slot_index != null && !Number.isNaN(Number(row.consecutive_slot_index))
     ? Number(row.consecutive_slot_index)
     : null,
   teacher_id: row.teacher_id != null ? String(row.teacher_id) : null,
   teacher_name: tch?.full_name != null ? String(tch.full_name) : null,
   original_teacher_id:
    row.original_teacher_id != null ? String(row.original_teacher_id) : null,
   original_teacher_name: orig?.full_name != null ? String(orig.full_name) : null,
  }
 })
}

/** 連堂配對：取得同組所有排程 id（含自身） */
export async function fetchConsecutiveScheduleIds(scheduleId: string): Promise<string[]> {
 if (!supabase) return [scheduleId]
 const { data: row, error: e1 } = await supabase
  .from("schedules")
  .select("id, consecutive_group_id")
  .eq("id", scheduleId)
  .maybeSingle()
 if (e1) throw e1
 const gid = (row as { consecutive_group_id?: string | null } | null)?.consecutive_group_id
 if (!gid) return [scheduleId]
 const { data, error: e2 } = await supabase
  .from("schedules")
  .select("id, consecutive_slot_index")
  .eq("consecutive_group_id", gid)
  .order("consecutive_slot_index", { ascending: true })
 if (e2) throw e2
 const ids = (data ?? []).map((r) => String((r as { id: string }).id))
 return ids.length > 0 ? ids : [scheduleId]
}

/** 班別下一個堂次編號（含取消課堂） */
export async function nextSessionNumberForClass(classId: string): Promise<number> {
 if (!supabase) return 1
 const { data, error } = await supabase
  .from("schedules")
  .select("session_number")
  .eq("class_id", classId)
  .order("session_number", { ascending: false })
  .limit(1)
 if (error) throw error
 const max = (data ?? [])[0] as { session_number?: number | null } | undefined
 return (max?.session_number != null ? Number(max.session_number) : 0) + 1
}

function compareSchedulesForSessionOrder(a: ClassScheduleRow, b: ClassScheduleRow): number {
 const byDate = a.scheduled_date.localeCompare(b.scheduled_date)
 if (byDate !== 0) return byDate
 const byStart = (a.start_time ?? "").localeCompare(b.start_time ?? "")
 if (byStart !== 0) return byStart
 const slotA = a.consecutive_slot_index ?? Number.MAX_SAFE_INTEGER
 const slotB = b.consecutive_slot_index ?? Number.MAX_SAFE_INTEGER
 if (slotA !== slotB) return slotA - slotB
 return a.id.localeCompare(b.id)
}

/** 依上課日期（及時間、連堂順序）重新編排此班所有排程的堂次編號（含取消課堂） */
export async function reorderClassScheduleSessionNumbers(
 classId: string
): Promise<{ updated: number; total: number }> {
 const existing = await getClassById(classId)
 if (!existing) throw new Error("找不到班別")
 assertClassRecordEditable(existing)
 const rows = await fetchClassSchedules(classId)
 const sorted = [...rows].sort(compareSchedulesForSessionOrder)
 const updates: { id: string; session_number: number }[] = []
 let next = 1
 for (const row of sorted) {
  if (row.session_number !== next) {
   updates.push({ id: row.id, session_number: next })
  }
  next += 1
 }
 if (updates.length > 0) {
  await Promise.all(updates.map((u) => updateSchedule(u.id, { session_number: u.session_number })))
 }
 return { updated: updates.length, total: sorted.length }
}

export type ScheduleStudentHints = {
 attendingNames: string[]
 leaveNames: string[]
 /** 單堂報讀但本堂未選（非請假） */
 notEnrolledNames: string[]
}

function sortNames(names: string[]): string[] {
 return [...new Set(names)].sort((a, b) => a.localeCompare(b, "zh-Hant"))
}

type HistEnrollmentEvent = {
 studentId: string
 fullName: string
 action: "enroll" | "withdraw" | "period_change" | "session_change"
 effectiveDate: string
 enrollmentPeriod: EnrollmentFormValue | null
 createdAt: string
}

/** 依增退紀錄還原某日班內就讀學生（含已退班者） */
function resolveEnrolledStudentsOnDate(
 events: HistEnrollmentEvent[],
 date: string
): EnrolledStudent[] {
 const byStudent = new Map<string, HistEnrollmentEvent[]>()
 for (const e of events) {
  const arr = byStudent.get(e.studentId) ?? []
  arr.push(e)
  byStudent.set(e.studentId, arr)
 }

 const out: EnrolledStudent[] = []
 for (const [studentId, evs] of byStudent) {
  const prior = evs
   .filter((e) => e.effectiveDate <= date)
   .sort(
    (a, b) =>
     a.effectiveDate.localeCompare(b.effectiveDate) || a.createdAt.localeCompare(b.createdAt)
   )
  if (prior.length === 0) continue

  let enrolled = false
  let period: EnrollmentFormValue | null = null
  let fullName = "—"
  for (const e of prior) {
   fullName = e.fullName
   if (e.action === "enroll" || e.action === "period_change" || e.action === "session_change") {
    enrolled = true
    if (e.enrollmentPeriod) period = e.enrollmentPeriod
   } else if (e.action === "withdraw") {
    enrolled = false
   }
  }
  if (enrolled) out.push({ studentId, fullName, enrollmentPeriod: period })
 }
 return out
}

type EnrolledStudent = {
 studentId: string
 fullName: string
 enrollmentPeriod: EnrollmentFormValue | null
 enrollmentId?: string
}

/** 批次取得班別各堂排程的預定出席／請假學生名單（單班入口） */
export async function fetchScheduleStudentHintsForClass(
 classId: string,
 schedules: { id: string; scheduled_date: string }[]
): Promise<Map<string, ScheduleStudentHints>> {
 return fetchScheduleStudentHintsByClass(new Map([[classId, schedules]]))
}

/**
 * 多班別批次取得排程學生提示。
 * schedule_id 鍵查詢跨班 chunk；class 範圍查詢批量後依 class_id 分組（避免同日他班誤掛）。
 */
export async function fetchScheduleStudentHintsByClass(
 schedulesByClass: Map<string, { id: string; scheduled_date: string }[]>
): Promise<Map<string, ScheduleStudentHints>> {
 const merged = new Map<string, ScheduleStudentHints>()
 const classIds = [...schedulesByClass.keys()].filter(Boolean)
 for (const [classId, scheds] of schedulesByClass) {
  for (const s of scheds) {
   merged.set(s.id, { attendingNames: [], leaveNames: [], notEnrolledNames: [] })
  }
  if (!classId) continue
 }
 if (!supabase || classIds.length === 0) return merged

 const allSchedules: { id: string; scheduled_date: string; class_id: string }[] = []
 for (const [classId, scheds] of schedulesByClass) {
  if (!classId) continue
  for (const s of scheds) {
   allSchedules.push({ id: s.id, scheduled_date: s.scheduled_date, class_id: classId })
  }
 }
 if (allSchedules.length === 0) return merged

 const scheduleIds = allSchedules.map((s) => s.id)
 const dates = [...new Set(allSchedules.map((s) => s.scheduled_date))]

 const configByClass = await fetchClassEnrollmentConfigsByIds(classIds)
 const yearIds = [
  ...new Set(
   [...configByClass.values()]
    .filter((c) => c.courseMode === "summer_two_period" && c.academicYearId)
    .map((c) => c.academicYearId as string)
  ),
 ]
 const periodsByYear = new Map<string, AcademicYearPeriodRow[]>()
 await Promise.all(
  yearIds.map(async (yid) => {
   periodsByYear.set(yid, await fetchAcademicYearPeriods(yid))
  })
 )

 const enrollmentChunks = await forEachIdChunk(classIds, DEFAULT_ID_CHUNK, async (slice) => {
  const { data, error } = await supabase!
   .from("student_class_enrollments")
   .select("id, class_id, student_id, enrollment_period, students ( full_name )")
   .in("class_id", slice)
   .eq("status", "就讀中")
  if (error) throw error
  return data ?? []
 })

 const enrolledByClass = new Map<string, EnrolledStudent[]>()
 for (const id of classIds) enrolledByClass.set(id, [])
 for (const data of enrollmentChunks) {
  for (const row of data) {
   const r = row as Record<string, unknown>
   const cid = String(r.class_id ?? "")
   if (!cid) continue
   const st = r.students as Record<string, unknown> | null
   const list = enrolledByClass.get(cid) ?? []
   list.push({
    enrollmentId: String(r.id),
    studentId: String(r.student_id),
    fullName: st?.full_name != null ? String(st.full_name) : "—",
    enrollmentPeriod: normalizeEnrollmentPeriod(
     r.enrollment_period != null ? String(r.enrollment_period) : null
    ),
   })
   enrolledByClass.set(cid, list)
  }
 }

 const allSingleIds = [...enrolledByClass.values()]
  .flat()
  .filter((e) => isSingleSessionEnrollment(e.enrollmentPeriod))
  .map((e) => e.enrollmentId!)
 const scheduleIdByEnrollment = await fetchEnrolledScheduleIdsByEnrollmentIds(allSingleIds)

 const [
  leavesLinkedChunks,
  leavesOrphanChunks,
  trialChunks,
  makeupChunks,
  attChunks,
  histChunks,
 ] = await Promise.all([
  forEachIdChunk(scheduleIds, DEFAULT_ID_CHUNK, async (slice) => {
   const { data, error } = await supabase!
    .from("leave_makeup_records")
    .select("student_id, schedule_id, leave_date, class_id, students ( full_name )")
    .in("schedule_id", slice)
   if (error) throw error
   return data ?? []
  }),
  forEachIdChunk(classIds, DEFAULT_ID_CHUNK, async (slice) => {
   const { data, error } = await supabase!
    .from("leave_makeup_records")
    .select("student_id, schedule_id, leave_date, class_id, students ( full_name )")
    .in("class_id", slice)
    .in("leave_date", dates)
    .is("schedule_id", null)
   if (error) throw error
   return data ?? []
  }),
  forEachIdChunk(scheduleIds, DEFAULT_ID_CHUNK, async (slice) => {
   const { data, error } = await supabase!
    .from("trial_sessions")
    .select("schedule_id, student_id, status, students ( full_name )")
    .in("schedule_id", slice)
   if (error) throw error
   return data ?? []
  }),
  forEachIdChunk(scheduleIds, DEFAULT_ID_CHUNK, async (slice) => {
   const { data, error } = await supabase!
    .from("leave_makeup_records")
    .select("makeup_schedule_id, student_id, students ( full_name )")
    .in("makeup_schedule_id", slice)
   if (error) throw error
   return data ?? []
  }),
  forEachIdChunk(classIds, DEFAULT_ID_CHUNK, async (slice) => {
   const { data, error } = await supabase!
    .from("attendance_details")
    .select("student_id, attendance_date, class_id, students ( full_name )")
    .in("class_id", slice)
    .in("attendance_date", dates)
   if (error) throw error
   return data ?? []
  }),
  forEachIdChunk(classIds, DEFAULT_ID_CHUNK, async (slice) => {
   const { data, error } = await supabase!
    .from("enrollment_change_events")
    .select(
     "class_id, student_id, action, effective_date, enrollment_period, created_at, students ( full_name )"
    )
    .in("class_id", slice)
    .order("effective_date", { ascending: true })
    .order("created_at", { ascending: true })
   if (error) throw error
   return data ?? []
  }),
 ])

 type LeaveRow = {
  studentId: string
  fullName: string
  scheduleId: string | null
  leaveDate: string
  classId: string | null
 }
 const allLeaves: LeaveRow[] = []
 for (const data of leavesLinkedChunks) {
  for (const row of data) {
   const r = row as Record<string, unknown>
   const st = r.students as Record<string, unknown> | null
   allLeaves.push({
    studentId: String(r.student_id),
    fullName: st?.full_name != null ? String(st.full_name) : "—",
    scheduleId: r.schedule_id != null ? String(r.schedule_id) : null,
    leaveDate: String(r.leave_date ?? ""),
    classId: r.class_id != null ? String(r.class_id) : null,
   })
  }
 }
 for (const data of leavesOrphanChunks) {
  for (const row of data) {
   const r = row as Record<string, unknown>
   const st = r.students as Record<string, unknown> | null
   allLeaves.push({
    studentId: String(r.student_id),
    fullName: st?.full_name != null ? String(st.full_name) : "—",
    scheduleId: null,
    leaveDate: String(r.leave_date ?? ""),
    classId: r.class_id != null ? String(r.class_id) : null,
   })
  }
 }

 type TrialRow = { scheduleId: string; studentId: string; fullName: string }
 const trials: TrialRow[] = []
 for (const data of trialChunks) {
  for (const row of data) {
   const s = String((row as { status?: string }).status ?? "")
   if (s.includes("完成") || s.includes("取消")) continue
   const r = row as Record<string, unknown>
   const st = r.students as Record<string, unknown> | null
   trials.push({
    scheduleId: String(r.schedule_id),
    studentId: String(r.student_id),
    fullName: st?.full_name != null ? String(st.full_name) : "—",
   })
  }
 }

 type MakeupRow = { makeupScheduleId: string; studentId: string; fullName: string }
 const makeups: MakeupRow[] = []
 for (const data of makeupChunks) {
  for (const row of data) {
   const r = row as Record<string, unknown>
   const st = r.students as Record<string, unknown> | null
   makeups.push({
    makeupScheduleId: String(r.makeup_schedule_id),
    studentId: String(r.student_id),
    fullName: st?.full_name != null ? String(st.full_name) : "—",
   })
  }
 }

 type AttendanceByDateRow = { studentId: string; fullName: string }
 const attendanceByClassDate = new Map<string, AttendanceByDateRow[]>()
 for (const data of attChunks) {
  for (const row of data) {
   const r = row as Record<string, unknown>
   const st = r.students as Record<string, unknown> | null
   const cid = String(r.class_id ?? "")
   const date = String(r.attendance_date ?? "").slice(0, 10)
   const key = `${cid}\0${date}`
   const item: AttendanceByDateRow = {
    studentId: String(r.student_id),
    fullName: st?.full_name != null ? String(st.full_name) : "—",
   }
   const arr = attendanceByClassDate.get(key) ?? []
   arr.push(item)
   attendanceByClassDate.set(key, arr)
  }
 }

 const histByClass = new Map<string, HistEnrollmentEvent[]>()
 for (const id of classIds) histByClass.set(id, [])
 for (const data of histChunks) {
  for (const row of data) {
   const r = row as Record<string, unknown>
   const cid = String(r.class_id ?? "")
   if (!cid) continue
   const st = r.students as Record<string, unknown> | null
   const actionRaw = String(r.action ?? "enroll")
   const action: HistEnrollmentEvent["action"] =
    actionRaw === "withdraw"
     ? "withdraw"
     : actionRaw === "period_change"
      ? "period_change"
      : actionRaw === "session_change"
       ? "session_change"
       : "enroll"
   const list = histByClass.get(cid) ?? []
   list.push({
    studentId: String(r.student_id),
    fullName: st?.full_name != null ? String(st.full_name) : "—",
    action,
    effectiveDate: String(r.effective_date ?? "").slice(0, 10),
    enrollmentPeriod: normalizeEnrollmentPeriod(
     r.enrollment_period != null ? String(r.enrollment_period) : null
    ),
    createdAt: String(r.created_at ?? ""),
   })
   histByClass.set(cid, list)
  }
 }

 const today = localYmd()

 for (const sched of allSchedules) {
  const config = configByClass.get(sched.class_id)
  const periods =
   config?.courseMode === "summer_two_period" && config.academicYearId
    ? (periodsByYear.get(config.academicYearId) ?? [])
    : []
  const periodCode =
   config?.courseMode === "summer_two_period" && periods.length > 0
    ? resolvePeriodCodeFromDate(sched.scheduled_date, periods)
    : null

  const leaveStudentIds = new Set<string>()
  const leaveNames: string[] = []
  for (const lv of allLeaves) {
   const matchesLinked = lv.scheduleId === sched.id
   const matchesOrphan =
    lv.scheduleId == null &&
    lv.classId === sched.class_id &&
    lv.leaveDate === sched.scheduled_date
   if (!matchesLinked && !matchesOrphan) continue
   if (!leaveStudentIds.has(lv.studentId)) {
    leaveStudentIds.add(lv.studentId)
    leaveNames.push(lv.fullName)
   }
  }

  const attendingIds = new Set<string>()
  const attendingNames: string[] = []
  const addAttending = (studentId: string, fullName: string) => {
   if (leaveStudentIds.has(studentId) || attendingIds.has(studentId)) return
   attendingIds.add(studentId)
   attendingNames.push(fullName)
  }

  const isPast = sched.scheduled_date < today
  const notEnrolledNames: string[] = []
  const enrolled = enrolledByClass.get(sched.class_id) ?? []
  const histEvents = histByClass.get(sched.class_id) ?? []

  const enrollmentCoversThisSchedule = (e: EnrolledStudent) => {
   if (isSingleSessionEnrollment(e.enrollmentPeriod)) {
    const enrolledIds =
     e.enrollmentId != null
      ? (scheduleIdByEnrollment.get(e.enrollmentId) ?? new Set<string>())
      : new Set<string>()
    return enrollmentVisibleOnSchedule({
     enrollmentPeriod: e.enrollmentPeriod,
     periodCode,
     scheduleId: sched.id,
     enrolledScheduleIds: enrolledIds,
    })
   }
   if (periodCode != null && !enrollmentCoversPeriod(e.enrollmentPeriod, periodCode)) {
    return false
   }
   return true
  }

  if (isPast) {
   for (const e of resolveEnrolledStudentsOnDate(histEvents, sched.scheduled_date)) {
    if (!enrollmentCoversThisSchedule(e)) continue
    addAttending(e.studentId, e.fullName)
   }
   for (const a of attendanceByClassDate.get(`${sched.class_id}\0${sched.scheduled_date}`) ?? []) {
    addAttending(a.studentId, a.fullName)
   }
  } else {
   for (const e of enrolled) {
    if (isSingleSessionEnrollment(e.enrollmentPeriod)) {
     if (!enrollmentCoversThisSchedule(e)) {
      notEnrolledNames.push(e.fullName)
      continue
     }
    } else if (periodCode != null && !enrollmentCoversPeriod(e.enrollmentPeriod, periodCode)) {
     continue
    }
    addAttending(e.studentId, e.fullName)
   }
  }

  for (const t of trials) {
   if (t.scheduleId !== sched.id) continue
   addAttending(t.studentId, t.fullName)
  }

  for (const m of makeups) {
   if (m.makeupScheduleId !== sched.id) continue
   addAttending(m.studentId, m.fullName)
  }

  merged.set(sched.id, {
   attendingNames: sortNames(attendingNames),
   leaveNames: sortNames(leaveNames),
   notEnrolledNames: sortNames(notEnrolledNames),
  })
 }

 return merged
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
 is_extra_lesson?: boolean
 session_number?: number | null
 consecutive_group_id?: string | null
 consecutive_slot_index?: number | null
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
   status: opts.status ?? "正常",
   remarks: opts.remarks ?? null,
   is_extra_lesson: opts.is_extra_lesson ?? false,
   session_number: opts.session_number ?? null,
   consecutive_group_id: opts.consecutive_group_id ?? null,
   consecutive_slot_index: opts.consecutive_slot_index ?? null,
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
  is_extra_lesson?: boolean
  session_number?: number | null
 }
): Promise<void> {
 assertAcademicYearEditableForDate(row.scheduled_date)
 await insertScheduleRow({
  class_id: classId,
  teacher_id: teacherId,
  scheduled_date: row.scheduled_date,
  start_time: row.start_time,
  end_time: row.end_time,
  status: row.status,
  classroom_id: row.classroom_id,
  is_extra_lesson: row.is_extra_lesson,
  session_number: row.session_number,
 })
}

/** 依班別設定建立單堂或連堂（2 筆）排程，回傳建立的 schedule id */
export async function insertSchedulesForClassSession(
 classId: string,
 cls: Pick<
  ClassRecord,
  "teacher_id" | "time_slot" | "lesson_slots_per_session" | "classroom_id"
 >,
 row: {
  scheduled_date: string
  start_time?: string | null
  end_time?: string | null
  status?: string
  classroom_id?: string | null
  session_number?: number | null
 }
): Promise<string[]> {
 assertAcademicYearEditableForDate(row.scheduled_date)
 const classroomId = row.classroom_id ?? cls.classroom_id ?? null
 const teacherId = cls.teacher_id

 if (!isConsecutiveClass(cls.lesson_slots_per_session)) {
  const id = await insertScheduleRow({
   class_id: classId,
   teacher_id: teacherId,
   scheduled_date: row.scheduled_date,
   start_time: row.start_time,
   end_time: row.end_time,
   status: row.status,
   classroom_id: classroomId,
   session_number: row.session_number ?? null,
  })
  return [id]
 }

 const pair = consecutivePairFromFirstTimeSlot(cls.time_slot ?? row.start_time ?? "")
 if (!pair) {
  throw new Error("連堂班別需選擇可連續兩格的起始時段。")
 }

 let sessionStart = row.session_number ?? null
 if (sessionStart == null) {
  sessionStart = await nextSessionNumberForClass(classId)
 }

 const groupId = newConsecutiveGroupId()
 const id1 = await insertScheduleRow({
  class_id: classId,
  teacher_id: teacherId,
  scheduled_date: row.scheduled_date,
  start_time: pair.slot1.start,
  end_time: pair.slot1.end,
  status: row.status,
  classroom_id: classroomId,
  session_number: sessionStart,
  consecutive_group_id: groupId,
  consecutive_slot_index: 1,
 })
 const id2 = await insertScheduleRow({
  class_id: classId,
  teacher_id: teacherId,
  scheduled_date: row.scheduled_date,
  start_time: pair.slot2.start,
  end_time: pair.slot2.end,
  status: row.status,
  classroom_id: classroomId,
  session_number: sessionStart + 1,
  consecutive_group_id: groupId,
  consecutive_slot_index: 2,
 })
 return [id1, id2]
}

export async function updateSchedule(
 id: string,
 patch: Partial<{
  status: string
  cancel_reason: string | null
  is_extra_lesson: boolean
  start_time: string | null
  end_time: string | null
  classroom_id: string | null
  remarks: string | null
  teaching_notes: string | null
  session_number: number | null
  scheduled_date: string
  teacher_id: string | null
 }>
): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { data: sched, error: fetchErr } = await supabase
  .from("schedules")
  .select("scheduled_date, teacher_id, start_time, class_id, status")
  .eq("id", id)
  .maybeSingle()
 if (fetchErr) throw fetchErr
 if (!sched) throw new Error("找不到排程")
 const prev = sched as {
  scheduled_date?: string
  teacher_id?: string | null
  start_time?: string | null
  class_id?: string | null
  status?: string | null
 }
 const dateForGuard =
  patch.scheduled_date != null
   ? String(patch.scheduled_date).slice(0, 10)
   : String(prev.scheduled_date ?? "")
 assertAcademicYearEditableForDate(dateForGuard)
 if (patch.scheduled_date != null) {
  assertAcademicYearEditableForDate(String(prev.scheduled_date ?? ""))
 }
 const { error } = await supabase
  .from("schedules")
  .update({ ...patch, updated_at: new Date().toISOString() })
  .eq("id", id)
 if (error) throw error

 if (patch.status !== undefined && patch.status !== prev.status) {
  const nowCancelled = patch.status.includes("取消")
  const wasCancelled = String(prev.status ?? "").includes("取消")
  if (nowCancelled && !wasCancelled) {
   await releaseAvailabilitySlotForSchedule({
    teacherId: prev.teacher_id ?? null,
    scheduledDate: String(prev.scheduled_date ?? ""),
    startTime: prev.start_time ?? null,
   })
  } else if (!nowCancelled && wasCancelled && prev.teacher_id && prev.class_id) {
   const timeSlot = availabilityTimeSlotForStartTime(prev.start_time ?? null)
   if (timeSlot) {
    await markAvailabilityForScheduleDates({
     classId: prev.class_id,
     teacherId: prev.teacher_id,
     timeSlot,
     dates: [String(prev.scheduled_date ?? "").slice(0, 10)],
    })
   }
  }
 }

 void logMgmtAuditAction({
  action: "更新排程",
  detail: `schedule_id=${id}; patch=${JSON.stringify(patch)}`,
 })
}

export async function deleteSchedule(id: string): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { data: sched, error: fetchErr } = await supabase
  .from("schedules")
  .select("scheduled_date, teacher_id, start_time")
  .eq("id", id)
  .maybeSingle()
 if (fetchErr) throw fetchErr
 if (!sched) throw new Error("找不到排程")
 const prev = sched as {
  scheduled_date?: string
  teacher_id?: string | null
  start_time?: string | null
 }
 assertAcademicYearEditableForDate(String(prev.scheduled_date ?? ""))
 const { error } = await supabase.from("schedules").delete().eq("id", id)
 if (error) throw error
 await releaseAvailabilitySlotForSchedule({
  teacherId: prev.teacher_id ?? null,
  scheduledDate: String(prev.scheduled_date ?? ""),
  startTime: prev.start_time ?? null,
 })
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
 cancel_reason: string | null
 is_extra_lesson: boolean
 remarks: string | null
 /** 老師填寫的教學紀錄 */
 teaching_notes: string | null
 class_id: string | null
 class_subject: string
 course_code_full: string | null
 teacher_id: string | null
 teacher_name: string | null
 original_teacher_id: string | null
 original_teacher_name: string | null
 consecutive_group_id: string | null
 classroom_id: string | null
 classroom_name: string | null
 /** 課室是否標為線上（網課） */
 classroom_is_online: boolean
 /** WhatsApp 提醒用（連堂已合併首末節時間） */
 reminder_start_time: string | null
 reminder_end_time: string | null
 is_consecutive_lesson: boolean
}

export type ScheduleDetailStudent = {
 studentId: string
 fullName: string
 englishName: string | null
 /** 就讀中優先；其餘為當日紀錄中出現的學生 */
 source: "就讀" | "試堂" | "當日紀錄"
 contactPhone: string | null
 /** 班內就讀且為單堂報讀（本堂有選） */
 isSingleSession?: boolean
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

export type ScheduleDetailNotEnrolledRow = {
 studentId: string
 fullName: string
}

export type ScheduleDetailContext = {
 students: ScheduleDetailStudent[]
 leaves: ScheduleDetailLeaveRow[]
 makeupsHere: ScheduleDetailMakeupHereRow[]
 attendance: ScheduleDetailAttendanceRow[]
 /** 單堂報讀但本堂未選（提醒用，非請假） */
 notEnrolledSingleSession: ScheduleDetailNotEnrolledRow[]
}

export const EMPTY_SCHEDULE_DETAIL_CONTEXT: ScheduleDetailContext = {
 students: [],
 leaves: [],
 makeupsHere: [],
 attendance: [],
 notEnrolledSingleSession: [],
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
  notEnrolledSingleSession: [],
 }
 if (!supabase) return empty

 const orFilter = `schedule_id.eq.${scheduleId},and(class_id.eq.${classId},leave_date.eq.${lessonDate})`

 const [roster, trials, leavesRes, makeupsRes, attRes, notEnrolledSingle] = await Promise.all([
  fetchRosterForRollCall(classId, lessonDate, scheduleId),
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
  fetchSingleSessionNotOnSchedule(classId, scheduleId),
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
  contactPhone: string | null = null,
  isSingleSession = false
 ) => {
  const prev = byId.get(studentId)
  if (!prev) {
   byId.set(studentId, {
    studentId,
    fullName,
    englishName,
    source,
    contactPhone,
    isSingleSession,
   })
   return
  }
  const phone = contactPhone || prev.contactPhone || null
  if (rank(source) < rank(prev.source)) {
   byId.set(studentId, {
    studentId,
    fullName,
    englishName,
    source,
    contactPhone: phone,
    isSingleSession: source === "就讀" ? isSingleSession : prev.isSingleSession,
   })
  } else {
   byId.set(studentId, {
    ...prev,
    contactPhone: phone,
    isSingleSession: prev.isSingleSession || isSingleSession,
   })
  }
 }

 for (const r of roster) {
  upsertStudent(
   r.studentId,
   r.fullName,
   r.englishName,
   "就讀",
   r.contactPhone,
   r.isSingleSession
  )
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

 return {
  students,
  leaves,
  makeupsHere,
  attendance,
  notEnrolledSingleSession: notEnrolledSingle.map((r) => ({
   studentId: r.studentId,
   fullName: r.fullName,
  })),
 }
}

export async function getScheduleById(id: string): Promise<ScheduleDetailRecord | null> {
 if (!supabase) return null
 const { data, error } = await supabase
  .from("schedules")
  .select(
   "id, scheduled_date, start_time, end_time, status, cancel_reason, is_extra_lesson, remarks, teaching_notes, consecutive_group_id, consecutive_slot_index, class_id, teacher_id, original_teacher_id, classroom_id, classes ( subject, course_code_full, courses ( course_name ) ), teachers!schedules_teacher_id_fkey ( full_name ), original_teacher:teachers!schedules_original_teacher_id_fkey ( full_name ), classrooms ( id, name, is_online )"
  )
  .eq("id", id)
  .maybeSingle()
 if (error) throw error
 if (!data) return null
 const r = data as Record<string, unknown>
 const cls = r.classes as Record<string, unknown> | null
 const tch = r.teachers as Record<string, unknown> | null
 const origTch = r.original_teacher as Record<string, unknown> | null
 const crm = r.classrooms as Record<string, unknown> | null
 const cid = r.class_id != null ? String(r.class_id) : null
 const sub = cls?.subject != null ? String(cls.subject) : "—"
 const course = cls?.courses as Record<string, unknown> | null
 const courseName = course?.course_name != null ? String(course.course_name) : null
 const code = cls?.course_code_full != null ? String(cls.course_code_full) : null
 const consecutiveGroupId =
  r.consecutive_group_id != null ? String(r.consecutive_group_id) : null
 const scheduleTimeRow = {
  start_time: r.start_time != null ? String(r.start_time) : null,
  end_time: r.end_time != null ? String(r.end_time) : null,
  consecutive_group_id: consecutiveGroupId,
  consecutive_slot_index:
   r.consecutive_slot_index != null && !Number.isNaN(Number(r.consecutive_slot_index))
    ? Number(r.consecutive_slot_index)
    : null,
 }
 let reminderPeers: typeof scheduleTimeRow[] = [scheduleTimeRow]
 if (consecutiveGroupId) {
  const { data: siblings, error: sibErr } = await supabase
   .from("schedules")
   .select("start_time, end_time, consecutive_group_id, consecutive_slot_index")
   .eq("consecutive_group_id", consecutiveGroupId)
   .order("consecutive_slot_index", { ascending: true })
  if (sibErr) throw sibErr
  if (siblings && siblings.length > 0) {
   reminderPeers = siblings.map((row) => {
    const s = row as Record<string, unknown>
    return {
     start_time: s.start_time != null ? String(s.start_time) : null,
     end_time: s.end_time != null ? String(s.end_time) : null,
     consecutive_group_id: consecutiveGroupId,
     consecutive_slot_index:
      s.consecutive_slot_index != null && !Number.isNaN(Number(s.consecutive_slot_index))
       ? Number(s.consecutive_slot_index)
       : null,
    }
   })
  }
 }
 const reminderTimes = resolveLessonReminderTimes(scheduleTimeRow, reminderPeers)
 return {
  id: String(r.id),
  scheduled_date: String(r.scheduled_date ?? ""),
  start_time: scheduleTimeRow.start_time,
  end_time: scheduleTimeRow.end_time,
  status: String(r.status ?? ""),
  cancel_reason: r.cancel_reason != null ? String(r.cancel_reason) : null,
  is_extra_lesson: r.is_extra_lesson === true,
  remarks: r.remarks != null ? String(r.remarks) : null,
  teaching_notes: r.teaching_notes != null ? String(r.teaching_notes) : null,
  class_id: cid,
  class_subject: formatClassLabel({ subject: sub, courseCode: code, courseName }),
  course_code_full: code,
  teacher_id: r.teacher_id != null ? String(r.teacher_id) : null,
  teacher_name: tch?.full_name != null ? String(tch.full_name) : null,
  original_teacher_id:
   r.original_teacher_id != null ? String(r.original_teacher_id) : null,
  original_teacher_name:
   origTch?.full_name != null ? String(origTch.full_name) : null,
  consecutive_group_id: consecutiveGroupId,
  classroom_id: r.classroom_id != null ? String(r.classroom_id) : null,
  classroom_name: crm?.name != null ? String(crm.name) : null,
  classroom_is_online: Boolean(crm?.is_online),
  reminder_start_time: reminderTimes.startTime,
  reminder_end_time: reminderTimes.endTime,
  is_consecutive_lesson: reminderTimes.isConsecutive,
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
 course_mode: CourseMode
 price_per_lesson: number | null
 price_per_lesson_period_2: number | null
 price_per_lesson_both_periods: number | null
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
 const gradeCode = normalizeGradeCode(params.grade_code)
 const { data, error } = await supabase
  .from("courses")
  .select("id, subject_id, grade_code, course_seq, price_per_lesson, course_name, subjects ( code )")
  .eq("subject_id", params.subject_id)
  .eq("grade_code", gradeCode)
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
  .select("id, subject_id, grade_code, course_seq, course_code_base, course_mode, price_per_lesson, price_per_lesson_period_2, price_per_lesson_both_periods, course_name, subjects ( code, name_zh )")
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
   course_mode: row.course_mode === "summer_two_period" ? "summer_two_period" : "regular",
   price_per_lesson: row.price_per_lesson != null ? Number(row.price_per_lesson) : null,
   price_per_lesson_period_2:
    row.price_per_lesson_period_2 != null ? Number(row.price_per_lesson_period_2) : null,
   price_per_lesson_both_periods:
    row.price_per_lesson_both_periods != null ? Number(row.price_per_lesson_both_periods) : null,
   course_name: row.course_name != null ? String(row.course_name) : null,
  }
 })
}

export async function insertCourse(input: {
 subject_id: string
 grade_code: string
 course_seq: number
 course_mode?: CourseMode
 price_per_lesson: number | null
 price_per_lesson_period_2?: number | null
 price_per_lesson_both_periods?: number | null
 course_name?: string | null
}): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const g = normalizeGradeCode(input.grade_code)
 const seq = clampCourseSeq(input.course_seq)
 const { data: sb, error: sErr } = await supabase.from("subjects").select("code").eq("id", input.subject_id).single()
 if (sErr) throw sErr
 const code = String((sb as { code: string }).code)
 const courseNameRaw = input.course_name != null ? String(input.course_name).trim() : ""
 const mode = input.course_mode === "summer_two_period" ? "summer_two_period" : "regular"
 const payload = {
  subject_id: input.subject_id,
  grade_code: g,
  course_seq: seq,
  course_code_base: buildCourseCodeBase(code, g, seq),
  course_name: courseNameRaw !== "" ? courseNameRaw : null,
  course_mode: mode,
  price_per_lesson:
   input.price_per_lesson != null && !Number.isNaN(input.price_per_lesson)
    ? Math.max(0, Number(input.price_per_lesson))
    : null,
  price_per_lesson_period_2:
   input.price_per_lesson_period_2 != null && !Number.isNaN(input.price_per_lesson_period_2)
    ? Math.max(0, Number(input.price_per_lesson_period_2))
    : null,
  price_per_lesson_both_periods:
   input.price_per_lesson_both_periods != null && !Number.isNaN(input.price_per_lesson_both_periods)
    ? Math.max(0, Number(input.price_per_lesson_both_periods))
    : null,
 }
 const existingId = await findCourseIdByTuple(input.subject_id, g, seq)
 if (existingId) {
  throw new Error(courseTupleDuplicateMessage(code, g, seq))
 }
 const { error } = await supabase.from("courses").insert(payload)
 if (error) {
  if (isCourseTupleDuplicate(error)) {
   throw new Error(courseTupleDuplicateMessage(code, g, seq))
  }
  throw error
 }
}

export async function updateCourse(
 id: string,
 patch: {
  subject_id: string
  grade_code: string
  course_seq: number
  course_mode?: CourseMode
  price_per_lesson: number | null
  price_per_lesson_period_2?: number | null
  price_per_lesson_both_periods?: number | null
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
 const mode = patch.course_mode === "summer_two_period" ? "summer_two_period" : "regular"
 const payload = {
  subject_id: patch.subject_id,
  grade_code: g,
  course_seq: seq,
  course_code_base: buildCourseCodeBase(code, g, seq),
  course_name: courseNameRaw !== "" ? courseNameRaw : null,
  course_mode: mode,
  price_per_lesson:
   patch.price_per_lesson != null && !Number.isNaN(patch.price_per_lesson)
    ? Math.max(0, Number(patch.price_per_lesson))
    : null,
  price_per_lesson_period_2:
   patch.price_per_lesson_period_2 != null && !Number.isNaN(patch.price_per_lesson_period_2)
    ? Math.max(0, Number(patch.price_per_lesson_period_2))
    : null,
  price_per_lesson_both_periods:
   patch.price_per_lesson_both_periods != null && !Number.isNaN(patch.price_per_lesson_both_periods)
    ? Math.max(0, Number(patch.price_per_lesson_both_periods))
    : null,
  updated_at: new Date().toISOString(),
 }
 const existingId = await findCourseIdByTuple(patch.subject_id, g, seq)
 if (existingId && existingId !== id) {
  throw new Error(courseTupleDuplicateMessage(code, g, seq))
 }
 const { error } = await supabase.from("courses").update(payload).eq("id", id)
 if (error) {
  if (isCourseTupleDuplicate(error)) {
   throw new Error(courseTupleDuplicateMessage(code, g, seq))
  }
  throw error
 }
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
