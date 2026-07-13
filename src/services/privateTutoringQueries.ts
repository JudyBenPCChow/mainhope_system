import { formatUnknownError } from "@/lib/formatUnknownError"
import { normalizeStoredClassGradeLabel } from "@/lib/classGrade"
import {
 intervalsOverlapMinutes,
 LESSON_SLOT_DURATION_MIN,
 parseHm,
} from "@/lib/lessonSlots"
import { resolveClassKind } from "@/lib/privateClassKind"
import { formatStudentGrade } from "@/lib/studentGrade"
import { forEachIdChunk } from "@/lib/supabaseInChunks"
import { supabase } from "@/lib/supabaseClient"
import { updateSchedule, insertScheduleForClass } from "@/services/classQueries"
import { logMgmtAuditAction } from "@/services/mgmtGodViewQueries"
import { fetchTeacherScheduleConflicts } from "@/services/scheduleQueries"
import {
 getStudentById,
 insertEnrollment,
 normalizeAcademicStage,
 normalizeActivityStatus,
 normalizeEnrollmentStatus,
 normalizeRegistrationStatus,
 withdrawStudentFromClass,
} from "@/services/studentQueries"

export type CreatePrivateTutoringInput = {
 studentId: string
 /** 科目顯示名（如「英文」「數學」），會組成班名 */
 subjectName: string
 teacherId?: string | null
 pricePerLesson?: number | null
 academicYearId?: string | null
 /** 班別年級標籤（如「中一」）；省略則用學生年級 */
 gradeLabel?: string | null
 /** 覆寫完整班名；省略則自動產生「{學生名}{科目}一對一」 */
 customClassSubject?: string | null
 /** 允許覆寫「同科目已有一對一」防呆 */
 allowDuplicate?: boolean
}

export type CreatePrivateTutoringResult = {
 classId: string
 classSubject: string
 studentId: string
 studentName: string
}

export type PrivateNextLesson = {
 scheduleId: string
 scheduledDate: string
 startTime: string | null
 endTime: string | null
 classroomName: string | null
}

/** 一對一班名：確保含「一對一」以便辨識 */
export function buildPrivateClassSubject(studentName: string, subjectName: string): string {
 const name = studentName.trim()
 const sub = subjectName.trim().replace(/一對一|單對單/g, "").trim()
 if (!name) return sub ? `${sub}一對一` : "一對一"
 if (!sub) return `${name}一對一`
 return `${name}${sub}一對一`
}

/** 去掉學生名與一對一後綴，用於科目比對 */
export function normalizePrivateSubjectKey(subject: string, studentName?: string | null): string {
 let s = subject.trim()
 if (studentName?.trim()) {
  s = s.replace(studentName.trim(), "")
 }
 return s
  .replace(/一對一|單對單/g, "")
  .replace(/[／/\s]/g, "")
  .toLowerCase()
}

export type PrivateTutoringStudentRow = {
 enrollmentId: string
 studentId: string
 studentCode: string
 fullName: string
 grade: string | null
 registrationStatus: string
 enrollmentStatus: string
 activityStatus: string
 academicStage: string
 phone: string | null
 classId: string
 classSubject: string
 classStatus: string
 /** 報讀列狀態：就讀中／已退讀 */
 enrollmentRowStatus: string
 teacherId: string | null
 teacherName: string | null
 pricePerLesson: number | null
 enrollDate: string | null
 upcomingLessonCount: number
 nextLesson: PrivateNextLesson | null
}

export type PrivateClassScheduleRow = {
 id: string
 classId: string
 scheduledDate: string
 startTime: string | null
 endTime: string | null
 status: string
 classroomId: string | null
 classroomName: string | null
 teacherId: string | null
 teacherName: string | null
}

function mapPrivateStudentRow(
 enrollment: Record<string, unknown>,
 student: Record<string, unknown>,
 cls: Record<string, unknown>
): PrivateTutoringStudentRow | null {
 const kind = resolveClassKind(
  cls.class_kind != null ? String(cls.class_kind) : null,
  cls.subject != null ? String(cls.subject) : null
 )
 if (kind !== "private") return null

 const tch = cls.teachers as Record<string, unknown> | null
 const gradeRaw = student.grade
 const grade =
  gradeRaw == null
   ? null
   : Array.isArray(gradeRaw)
     ? gradeRaw.map(String).join("、") || null
     : String(gradeRaw)

 return {
  enrollmentId: String(enrollment.id),
  studentId: String(student.id),
  studentCode: String(student.student_code ?? ""),
  fullName: String(student.full_name ?? ""),
  grade,
  registrationStatus: normalizeRegistrationStatus(
   student.registration_status != null ? String(student.registration_status) : null
  ),
  enrollmentStatus: normalizeEnrollmentStatus(
   student.enrollment_status != null ? String(student.enrollment_status) : null
  ),
  activityStatus: normalizeActivityStatus(
   student.activity_status != null ? String(student.activity_status) : null
  ),
  academicStage: normalizeAcademicStage(
   student.academic_stage != null ? String(student.academic_stage) : null
  ),
  phone: student.student_phone != null ? String(student.student_phone) : null,
  classId: String(cls.id),
  classSubject: String(cls.subject ?? ""),
  classStatus: String(cls.status ?? ""),
  enrollmentRowStatus: String(enrollment.status ?? "就讀中"),
  teacherId: cls.teacher_id != null ? String(cls.teacher_id) : null,
  teacherName: tch?.full_name != null ? String(tch.full_name) : null,
  pricePerLesson:
   cls.price_per_lesson != null && !Number.isNaN(Number(cls.price_per_lesson))
    ? Number(cls.price_per_lesson)
    : null,
  enrollDate: enrollment.enroll_date != null ? String(enrollment.enroll_date).slice(0, 10) : null,
  upcomingLessonCount: 0,
  nextLesson: null,
 }
}

/** 同生是否已有同科目進行中一對一 */
export async function findDuplicatePrivateEnrollment(
 studentId: string,
 subjectName: string,
 studentName?: string | null
): Promise<{ classId: string; classSubject: string; enrollmentId: string } | null> {
 if (!supabase) return null
 const key = normalizePrivateSubjectKey(subjectName, studentName)
 if (!key) return null

 const { data, error } = await supabase
  .from("student_class_enrollments")
  .select("id, class_id, classes ( id, subject, class_kind, status )")
  .eq("student_id", studentId)
  .eq("status", "就讀中")
 if (error) throw new Error(formatUnknownError(error))

 for (const raw of data ?? []) {
  const enr = raw as Record<string, unknown>
  const cls = enr.classes as Record<string, unknown> | null
  if (!cls) continue
  const kind = resolveClassKind(
   cls.class_kind != null ? String(cls.class_kind) : null,
   cls.subject != null ? String(cls.subject) : null
  )
  if (kind !== "private") continue
  if (String(cls.status ?? "").includes("結束") || String(cls.status ?? "").includes("取消")) continue
  const sub = String(cls.subject ?? "")
  if (normalizePrivateSubjectKey(sub, studentName) === key) {
   return {
    classId: String(cls.id),
    classSubject: sub,
    enrollmentId: String(enr.id),
   }
  }
 }
 return null
}

/** 取得所有一對一／單對單報讀（含已退讀；由 UI 篩選） */
export async function fetchPrivateTutoringStudents(): Promise<PrivateTutoringStudentRow[]> {
 if (!supabase) return []

 const { data: privateClasses, error: classErr } = await supabase
  .from("classes")
  .select("id, subject, class_kind")
  .or("class_kind.eq.private,subject.ilike.%一對一%,subject.ilike.%單對單%")
 if (classErr) throw new Error(formatUnknownError(classErr))

 const privateClassIds = (privateClasses ?? [])
  .filter((row) => {
   const r = row as Record<string, unknown>
   return (
    resolveClassKind(
     r.class_kind != null ? String(r.class_kind) : null,
     r.subject != null ? String(r.subject) : null
    ) === "private"
   )
  })
  .map((row) => String((row as { id: string }).id))

 if (privateClassIds.length === 0) return []

 const db = supabase
 const chunkResults = await forEachIdChunk(privateClassIds, 60, async (slice) => {
  const { data, error } = await db
   .from("student_class_enrollments")
   .select(
    "id, status, enroll_date, students ( id, student_code, full_name, grade, registration_status, enrollment_status, activity_status, academic_stage, student_phone ), classes ( id, subject, class_kind, status, teacher_id, price_per_lesson, teachers ( full_name ) )"
   )
   .in("class_id", slice)
   .in("status", ["就讀中", "已退讀"])
  if (error) throw new Error(formatUnknownError(error))
  return data ?? []
 })

 const rows: PrivateTutoringStudentRow[] = []
 for (const chunk of chunkResults) {
  for (const raw of chunk) {
   const enrollment = raw as Record<string, unknown>
   const student = enrollment.students as Record<string, unknown> | null
   const cls = enrollment.classes as Record<string, unknown> | null
   if (!student || !cls) continue
   const mapped = mapPrivateStudentRow(enrollment, student, cls)
   if (mapped) rows.push(mapped)
  }
 }

 const today = new Date().toISOString().slice(0, 10)
 const classIds = [...new Set(rows.map((r) => r.classId))]
 const upcomingByClass = new Map<string, { count: number; next: PrivateNextLesson | null }>()

 if (classIds.length > 0) {
  const schedChunks = await forEachIdChunk(classIds, 60, async (slice) => {
   const { data, error } = await db
    .from("schedules")
    .select("id, class_id, status, scheduled_date, start_time, end_time, classrooms ( name )")
    .in("class_id", slice)
    .gte("scheduled_date", today)
    .order("scheduled_date", { ascending: true })
    .order("start_time", { ascending: true })
   if (error) throw new Error(formatUnknownError(error))
   return data ?? []
  })
  for (const chunk of schedChunks) {
   for (const raw of chunk) {
    const s = raw as Record<string, unknown>
    if (String(s.status ?? "").includes("取消")) continue
    const classId = String(s.class_id)
    const room = s.classrooms as Record<string, unknown> | null
    const lesson: PrivateNextLesson = {
     scheduleId: String(s.id),
     scheduledDate: String(s.scheduled_date ?? "").slice(0, 10),
     startTime: s.start_time != null ? String(s.start_time) : null,
     endTime: s.end_time != null ? String(s.end_time) : null,
     classroomName: room?.name != null ? String(room.name) : null,
    }
    const prev = upcomingByClass.get(classId)
    if (!prev) {
     upcomingByClass.set(classId, { count: 1, next: lesson })
    } else {
     upcomingByClass.set(classId, { count: prev.count + 1, next: prev.next })
    }
   }
  }
 }

 return rows
  .map((r) => {
   const u = upcomingByClass.get(r.classId)
   return {
    ...r,
    upcomingLessonCount: u?.count ?? 0,
    nextLesson: u?.next ?? null,
   }
  })
  .sort(
   (a, b) =>
    a.fullName.localeCompare(b.fullName, "zh-Hant") ||
    a.classSubject.localeCompare(b.classSubject, "zh-Hant")
  )
}

/**
 * 為已註冊學生建立一對一班別並報讀。
 * 不綁課程模板、不設固定星期／時段／課室；之後按次約堂寫入 schedules。
 */
export async function createPrivateTutoringEnrollment(
 input: CreatePrivateTutoringInput
): Promise<CreatePrivateTutoringResult> {
 if (!supabase) throw new Error("Supabase 未設定")

 const student = await getStudentById(input.studentId)
 if (!student) throw new Error("找不到學生")

 const subjectName = (input.subjectName ?? "").trim()
 if (!subjectName && !(input.customClassSubject ?? "").trim()) {
  throw new Error("請選擇或輸入科目")
 }

 const classSubject =
  (input.customClassSubject ?? "").trim() ||
  buildPrivateClassSubject(student.full_name, subjectName)
 if (!/一對一|單對單/.test(classSubject)) {
  throw new Error("班名須包含「一對一」或「單對單」")
 }

 const subjectKeySource = (input.customClassSubject ?? "").trim() || subjectName
 if (!input.allowDuplicate) {
  const dup = await findDuplicatePrivateEnrollment(student.id, subjectKeySource, student.full_name)
  if (dup) {
   throw new Error(`此學生已有同科目一對一報讀：${dup.classSubject}`)
  }
 }

 let academicYearId = input.academicYearId?.trim() || null
 let startDate: string | null = null
 let endDate: string | null = null
 if (academicYearId) {
  const { data: yearRow, error: yearErr } = await supabase
   .from("academic_years")
   .select("id, start_date, end_date")
   .eq("id", academicYearId)
   .maybeSingle()
  if (yearErr) throw new Error(formatUnknownError(yearErr))
  if (!yearRow) throw new Error("找不到學年")
  startDate = yearRow.start_date != null ? String(yearRow.start_date).slice(0, 10) : null
  endDate = yearRow.end_date != null ? String(yearRow.end_date).slice(0, 10) : null
 } else {
  const { data: currentYear, error: curErr } = await supabase
   .from("academic_years")
   .select("id, start_date, end_date")
   .eq("is_current", true)
   .maybeSingle()
  if (curErr) throw new Error(formatUnknownError(curErr))
  if (currentYear) {
   academicYearId = String(currentYear.id)
   startDate = currentYear.start_date != null ? String(currentYear.start_date).slice(0, 10) : null
   endDate = currentYear.end_date != null ? String(currentYear.end_date).slice(0, 10) : null
  }
 }

 const gradeFromInput = normalizeStoredClassGradeLabel(input.gradeLabel)
 const gradeFromStudent = normalizeStoredClassGradeLabel(formatStudentGrade(student.grade))
 const gradeLabel = gradeFromInput ?? gradeFromStudent
 const gradeArr = gradeLabel ? [gradeLabel] : null

 const price =
  input.pricePerLesson != null && !Number.isNaN(Number(input.pricePerLesson))
   ? Math.max(0, Number(input.pricePerLesson))
   : null

 const { data: classRow, error: classErr } = await supabase
  .from("classes")
  .insert({
   subject: classSubject,
   class_kind: "private",
   course_id: null,
   academic_year_id: academicYearId,
   section_code: null,
   course_code_full: null,
   grade: gradeArr,
   day_of_week: null,
   time_slot: null,
   lesson_slots_per_session: 1,
   teacher_id: input.teacherId?.trim() || null,
   classroom_id: null,
   capacity: 1,
   price_per_lesson: price,
   start_date: startDate,
   end_date: endDate,
   status: "進行中",
   enrollment_notice: null,
  })
  .select("id")
  .single()
 if (classErr) throw new Error(formatUnknownError(classErr))

 const classId = String((classRow as { id: string }).id)
 try {
  await insertEnrollment(student.id, classId)
 } catch (e) {
  await supabase.from("classes").delete().eq("id", classId)
  throw e
 }

 void logMgmtAuditAction({
  action: "新增一對一報讀",
  detail: `student_id=${student.id}; class_id=${classId}; subject=${classSubject}`,
 })

 return {
  classId,
  classSubject,
  studentId: student.id,
  studentName: student.full_name,
 }
}

export async function updatePrivateClassSettings(
 classId: string,
 patch: {
  teacherId?: string | null
  pricePerLesson?: number | null
  subject?: string | null
 }
): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
 if ("teacherId" in patch) payload.teacher_id = patch.teacherId?.trim() || null
 if ("pricePerLesson" in patch) {
  payload.price_per_lesson =
   patch.pricePerLesson != null && !Number.isNaN(Number(patch.pricePerLesson))
    ? Math.max(0, Number(patch.pricePerLesson))
    : null
 }
 if ("subject" in patch && patch.subject != null) {
  const sub = patch.subject.trim()
  if (!sub) throw new Error("班名不可為空")
  if (!/一對一|單對單/.test(sub)) throw new Error("班名須包含「一對一」或「單對單」")
  payload.subject = sub
 }
 const { error } = await supabase.from("classes").update(payload).eq("id", classId)
 if (error) throw new Error(formatUnknownError(error))
 void logMgmtAuditAction({
  action: "更新一對一班別",
  detail: `class_id=${classId}; patch=${JSON.stringify(patch)}`,
 })
}

export async function withdrawPrivateEnrollment(opts: {
 enrollmentId: string
 studentId: string
 classId: string
 reason?: string | null
}): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const today = new Date().toISOString().slice(0, 10)

 const { data: futureScheds, error: schedErr } = await supabase
  .from("schedules")
  .select("id, status")
  .eq("class_id", opts.classId)
  .gte("scheduled_date", today)
 if (schedErr) throw new Error(formatUnknownError(schedErr))

 for (const row of futureScheds ?? []) {
  const s = row as { id: string; status: string }
  if (String(s.status ?? "").includes("取消")) continue
  await updateSchedule(s.id, {
   status: "取消",
   cancel_reason: "一對一退讀，取消未來課堂",
  })
 }

 await withdrawStudentFromClass({
  enrollmentId: opts.enrollmentId,
  studentId: opts.studentId,
  classId: opts.classId,
  effectiveDate: today,
  reason: opts.reason?.trim() || "一對一頁退讀",
 })
}

/** 某班別的近期／未來排程 */
export async function fetchPrivateClassSchedules(
 classId: string,
 fromYmd?: string
): Promise<PrivateClassScheduleRow[]> {
 if (!supabase) return []
 const from = fromYmd ?? new Date().toISOString().slice(0, 10)
 const { data, error } = await supabase
  .from("schedules")
  .select(
   "id, class_id, scheduled_date, start_time, end_time, status, classroom_id, teacher_id, classrooms ( name ), teachers ( full_name )"
  )
  .eq("class_id", classId)
  .gte("scheduled_date", from)
  .order("scheduled_date", { ascending: true })
  .order("start_time", { ascending: true })
  .limit(30)
 if (error) throw new Error(formatUnknownError(error))

 return (data ?? []).map((row) => {
  const r = row as Record<string, unknown>
  const room = r.classrooms as Record<string, unknown> | null
  const tch = r.teachers as Record<string, unknown> | null
  return {
   id: String(r.id),
   classId: String(r.class_id),
   scheduledDate: String(r.scheduled_date ?? "").slice(0, 10),
   startTime: r.start_time != null ? String(r.start_time) : null,
   endTime: r.end_time != null ? String(r.end_time) : null,
   status: String(r.status ?? ""),
   classroomId: r.classroom_id != null ? String(r.classroom_id) : null,
   classroomName: room?.name != null ? String(room.name) : null,
   teacherId: r.teacher_id != null ? String(r.teacher_id) : null,
   teacherName: tch?.full_name != null ? String(tch.full_name) : null,
  }
 })
}

export async function cancelPrivateLesson(scheduleId: string, reason?: string | null): Promise<void> {
 await updateSchedule(scheduleId, {
  status: "取消",
  cancel_reason: reason?.trim() || "一對一預約取消",
 })
}

export async function reschedulePrivateLesson(opts: {
 scheduleId: string
 scheduledDate: string
 startTime: string
 endTime: string
 classroomId: string | null
 teacherId?: string | null
}): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { data: sched, error: fetchErr } = await supabase
  .from("schedules")
  .select("id, status")
  .eq("id", opts.scheduleId)
  .maybeSingle()
 if (fetchErr) throw new Error(formatUnknownError(fetchErr))
 if (!sched) throw new Error("找不到排程")
 if (String((sched as { status?: string }).status ?? "").includes("取消")) {
  throw new Error("已取消的課堂不可改約")
 }

 const patch: {
  scheduled_date: string
  start_time: string
  end_time: string
  classroom_id: string | null
  teacher_id?: string | null
 } = {
  scheduled_date: opts.scheduledDate.slice(0, 10),
  start_time: opts.startTime,
  end_time: opts.endTime,
  classroom_id: opts.classroomId?.trim() || null,
 }
 if (opts.teacherId !== undefined) {
  patch.teacher_id = opts.teacherId?.trim() || null
 }
 await updateSchedule(opts.scheduleId, patch)

 void logMgmtAuditAction({
  action: "一對一改約",
  detail: `schedule_id=${opts.scheduleId}; date=${opts.scheduledDate}; ${opts.startTime}-${opts.endTime}`,
 })
}

export type PrivateBookingConflict = {
 kind: "room" | "teacher" | "student"
 label: string
}

/** 預約前檢查課室／老師／學生時段衝突（未指定課室時略過課室衝突） */
export async function checkPrivateBookingConflicts(params: {
 classroomId?: string | null
 scheduledDate: string
 startTime: string
 endTime: string
 teacherId?: string | null
 studentId?: string | null
 excludeScheduleId?: string | null
}): Promise<PrivateBookingConflict[]> {
 if (!supabase) return []
 const conflicts: PrivateBookingConflict[] = []
 const dateYmd = params.scheduledDate.slice(0, 10)
 const slotA = parseHm(params.startTime) ?? 0
 const slotB = parseHm(params.endTime) ?? slotA + LESSON_SLOT_DURATION_MIN
 const classroomId = params.classroomId?.trim() || null

 if (classroomId) {
  const { data: roomSched } = await supabase
   .from("schedules")
   .select("id, start_time, end_time, status, classes ( subject )")
   .eq("classroom_id", classroomId)
   .eq("scheduled_date", dateYmd)
  for (const row of roomSched ?? []) {
   const s = row as Record<string, unknown>
   if (params.excludeScheduleId && String(s.id) === params.excludeScheduleId) continue
   if (String(s.status ?? "").includes("取消")) continue
   const a = parseHm(s.start_time != null ? String(s.start_time) : null)
   const b = parseHm(s.end_time != null ? String(s.end_time) : null)
   if (a == null) continue
   const bEff = b == null || b <= a ? a + LESSON_SLOT_DURATION_MIN : b
   if (!intervalsOverlapMinutes(slotA, slotB, a, bEff)) continue
   const cls = s.classes as Record<string, unknown> | null
   conflicts.push({
    kind: "room",
    label: `課室已被佔用：${cls?.subject != null ? String(cls.subject) : "其他排程"}`,
   })
  }

  const { data: pend } = await supabase
   .from("classroom_booking_requests")
   .select("id, start_time, end_time")
   .eq("classroom_id", classroomId)
   .eq("scheduled_date", dateYmd)
   .eq("status", "待審批")
  for (const row of pend ?? []) {
   const p = row as { start_time: string; end_time: string }
   const a = parseHm(p.start_time)
   const b = parseHm(p.end_time)
   if (a == null || b == null) continue
   const bEff = b <= a ? a + LESSON_SLOT_DURATION_MIN : b
   if (intervalsOverlapMinutes(slotA, slotB, a, bEff)) {
    conflicts.push({ kind: "room", label: "課室有待審批約房" })
   }
  }
 }

 if (params.teacherId) {
  const teacherConflicts = await fetchTeacherScheduleConflicts({
   teacherId: params.teacherId,
   scheduledDate: dateYmd,
   startTime: params.startTime,
   endTime: params.endTime,
   excludeScheduleId: params.excludeScheduleId,
  })
  for (const c of teacherConflicts) {
   conflicts.push({
    kind: "teacher",
    label: `老師時段衝突：${c.classLabel}${c.startTime ? `（${c.startTime}）` : ""}`,
   })
  }
 }

 if (params.studentId) {
  const { data: enrs } = await supabase
   .from("student_class_enrollments")
   .select("class_id")
   .eq("student_id", params.studentId)
   .eq("status", "就讀中")
  const classIds = (enrs ?? []).map((e) => String((e as { class_id: string }).class_id)).filter(Boolean)
  if (classIds.length > 0) {
   const chunks = await forEachIdChunk(classIds, 60, async (slice) => {
    const { data, error } = await supabase!
     .from("schedules")
     .select("id, start_time, end_time, status, classes ( subject )")
     .in("class_id", slice)
     .eq("scheduled_date", dateYmd)
    if (error) throw new Error(formatUnknownError(error))
    return data ?? []
   })
   for (const chunk of chunks) {
    for (const raw of chunk) {
     const s = raw as Record<string, unknown>
     if (params.excludeScheduleId && String(s.id) === params.excludeScheduleId) continue
     if (String(s.status ?? "").includes("取消")) continue
     const a = parseHm(s.start_time != null ? String(s.start_time) : null)
     const b = parseHm(s.end_time != null ? String(s.end_time) : null)
     if (a == null) continue
     const bEff = b == null || b <= a ? a + LESSON_SLOT_DURATION_MIN : b
     if (!intervalsOverlapMinutes(slotA, slotB, a, bEff)) continue
     const cls = s.classes as Record<string, unknown> | null
     conflicts.push({
      kind: "student",
      label: `學生時段衝突：${cls?.subject != null ? String(cls.subject) : "其他課堂"}`,
     })
    }
   }
  }
 }

 return conflicts
}

export function formatNextLessonLabel(lesson: PrivateNextLesson | null): string {
 if (!lesson) return "—"
 const time = lesson.startTime ? String(lesson.startTime).slice(0, 5) : ""
 const room = lesson.classroomName ? ` · ${lesson.classroomName}` : ""
 return `${lesson.scheduledDate}${time ? ` ${time}` : ""}${room}`
}

/** 由起始日每週加 7 天，產生共 N 個日期（含首日） */
export function buildWeeklyDates(startYmd: string, count: number): string[] {
 const n = Math.max(1, Math.min(52, Math.floor(count)))
 const [y0, m0, d0] = startYmd.split("-").map(Number)
 if (!y0 || !m0 || !d0) return []
 const out: string[] = []
 for (let i = 0; i < n; i++) {
  const dt = new Date(y0, m0 - 1, d0 + i * 7)
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, "0")
  const d = String(dt.getDate()).padStart(2, "0")
  out.push(`${y}-${m}-${d}`)
 }
 return out
}

export type PrivateRecurringPreviewItem = {
 date: string
 conflicts: PrivateBookingConflict[]
}

/** 預覽每週 N 堂的衝突（不寫入） */
export async function previewPrivateRecurringBookings(params: {
 dates: string[]
 classroomId?: string | null
 startTime: string
 endTime: string
 teacherId?: string | null
 studentId: string
}): Promise<PrivateRecurringPreviewItem[]> {
 const items: PrivateRecurringPreviewItem[] = []
 for (const date of params.dates) {
  const conflicts = await checkPrivateBookingConflicts({
   classroomId: params.classroomId,
   scheduledDate: date,
   startTime: params.startTime,
   endTime: params.endTime,
   teacherId: params.teacherId,
   studentId: params.studentId,
  })
  items.push({ date, conflicts })
 }
 return items
}

/** 批次建立每週預約；skipConflictDates=true 時略過有衝突的日期；ignoreConflicts=true 時不檢查衝突直接建立 */
export async function createPrivateRecurringBookings(params: {
 classId: string
 studentId: string
 dates: string[]
 classroomId?: string | null
 startTime: string
 endTime: string
 teacherId?: string | null
 skipConflictDates: boolean
 ignoreConflicts?: boolean
}): Promise<{ created: number; skipped: string[] }> {
 const skipped: string[] = []
 let created = 0
 for (const date of params.dates) {
  if (!params.ignoreConflicts) {
   const conflicts = await checkPrivateBookingConflicts({
    classroomId: params.classroomId,
    scheduledDate: date,
    startTime: params.startTime,
    endTime: params.endTime,
    teacherId: params.teacherId,
    studentId: params.studentId,
   })
   if (conflicts.length > 0) {
    if (params.skipConflictDates) {
     skipped.push(date)
     continue
    }
    throw new Error(
     `${date} 有衝突：${conflicts.map((c) => c.label).join("；")}`
    )
   }
  }
  await insertScheduleForClass(params.classId, params.teacherId ?? null, {
   scheduled_date: date,
   start_time: params.startTime,
   end_time: params.endTime,
   classroom_id: params.classroomId ?? null,
   status: "正常",
  })
  created += 1
 }
 return { created, skipped }
}
