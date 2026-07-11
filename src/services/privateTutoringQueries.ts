import { formatUnknownError } from "@/lib/formatUnknownError"
import { resolveClassKind } from "@/lib/privateClassKind"
import { forEachIdChunk } from "@/lib/supabaseInChunks"
import { supabase } from "@/lib/supabaseClient"
import {
 normalizeAcademicStage,
 normalizeActivityStatus,
 normalizeEnrollmentStatus,
 normalizeRegistrationStatus,
} from "@/services/studentQueries"

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
 teacherId: string | null
 teacherName: string | null
 pricePerLesson: number | null
 enrollDate: string | null
 upcomingLessonCount: number
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
  phone: student.phone != null ? String(student.phone) : null,
  classId: String(cls.id),
  classSubject: String(cls.subject ?? ""),
  classStatus: String(cls.status ?? ""),
  teacherId: cls.teacher_id != null ? String(cls.teacher_id) : null,
  teacherName: tch?.full_name != null ? String(tch.full_name) : null,
  pricePerLesson:
   cls.price_per_lesson != null && !Number.isNaN(Number(cls.price_per_lesson))
    ? Number(cls.price_per_lesson)
    : null,
  enrollDate: enrollment.enroll_date != null ? String(enrollment.enroll_date).slice(0, 10) : null,
  upcomingLessonCount: 0,
 }
}

/** 取得所有一對一／單對單在讀學生（依班別報讀） */
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
    "id, status, enroll_date, students ( id, student_code, full_name, grade, registration_status, enrollment_status, activity_status, academic_stage, phone ), classes ( id, subject, class_kind, status, teacher_id, price_per_lesson, teachers ( full_name ) )"
   )
   .in("class_id", slice)
   .eq("status", "就讀中")
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
 const upcomingByClass = new Map<string, number>()

 if (classIds.length > 0) {
  const schedChunks = await forEachIdChunk(classIds, 60, async (slice) => {
   const { data, error } = await db
    .from("schedules")
    .select("id, class_id, status, scheduled_date")
    .in("class_id", slice)
    .gte("scheduled_date", today)
   if (error) throw new Error(formatUnknownError(error))
   return data ?? []
  })
  for (const chunk of schedChunks) {
   for (const raw of chunk) {
    const s = raw as { class_id: string; status: string }
    if (s.status.includes("取消")) continue
    upcomingByClass.set(s.class_id, (upcomingByClass.get(s.class_id) ?? 0) + 1)
   }
  }
 }

 return rows
  .map((r) => ({ ...r, upcomingLessonCount: upcomingByClass.get(r.classId) ?? 0 }))
  .sort((a, b) => a.fullName.localeCompare(b.fullName, "zh-Hant") || a.classSubject.localeCompare(b.classSubject, "zh-Hant"))
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
   "id, class_id, scheduled_date, start_time, end_time, status, classroom_id, classrooms ( name ), teachers ( full_name )"
  )
  .eq("class_id", classId)
  .gte("scheduled_date", from)
  .order("scheduled_date", { ascending: true })
  .order("start_time", { ascending: true })
  .limit(20)
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
   teacherName: tch?.full_name != null ? String(tch.full_name) : null,
  }
 })
}
