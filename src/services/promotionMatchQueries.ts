import { formatClassLabel } from "@/lib/courseLabel"
import { normalizeEnrollmentPeriod } from "@/lib/enrollmentPeriod"
import {
  buildClassMatchBundles,
  buildStudentMatchBundles,
  type ClassMatchBundle,
  type PromotionClassRow,
  type PromotionEnrollmentRow,
  type PromotionStudentRow,
  type StudentMatchBundle,
} from "@/lib/promotionMatch"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import { supabase } from "@/lib/supabaseClient"
import { formatStudentGrade } from "@/lib/studentGrade"
import { pickStudentContactRaw } from "@/lib/whatsappReminder"
import { fetchAllClasses } from "@/services/classQueries"
import {
  fetchAllStudents,
  normalizeRegistrationStatus,
} from "@/services/studentQueries"

export type PromotionMatchSnapshot = {
  classes: PromotionClassRow[]
  students: PromotionStudentRow[]
  enrollments: PromotionEnrollmentRow[]
  classBundles: ClassMatchBundle[]
  studentBundles: StudentMatchBundle[]
}

function isActiveGroupClass(status: string, classKind: string): boolean {
  return classKind === "group" && status.includes("進行")
}

async function fetchActiveEnrollmentsForStudents(
  studentIds: string[]
): Promise<PromotionEnrollmentRow[]> {
  if (!supabase || studentIds.length === 0) return []

  const select =
    "id, student_id, class_id, enrollment_period, status, classes ( subject, course_code_full, day_of_week, time_slot, lesson_slots_per_session, class_kind, courses ( course_name ) )"

  const chunks = await forEachIdChunk(studentIds, DEFAULT_ID_CHUNK, async (slice) => {
    const { data, error } = await supabase!
      .from("student_class_enrollments")
      .select(select)
      .in("student_id", slice)
      .eq("status", "就讀中")
    if (error) throw error
    return data ?? []
  })

  const out: PromotionEnrollmentRow[] = []
  for (const data of chunks) {
    for (const row of data) {
      const r = row as Record<string, unknown>
      const cls = r.classes as Record<string, unknown> | null
      const course = cls?.courses as Record<string, unknown> | null
      const subject = cls?.subject != null ? String(cls.subject) : ""
      const courseName = course?.course_name != null ? String(course.course_name) : null
      const courseCode =
        cls?.course_code_full != null ? String(cls.course_code_full) : null
      out.push({
        id: String(r.id),
        studentId: String(r.student_id),
        classId: String(r.class_id),
        period: normalizeEnrollmentPeriod(
          r.enrollment_period != null ? String(r.enrollment_period) : null
        ),
        status: String(r.status ?? ""),
        classLabel: formatClassLabel({ subject, courseCode, courseName }),
        dayOfWeek: cls?.day_of_week != null ? String(cls.day_of_week) : null,
        timeSlot: cls?.time_slot != null ? String(cls.time_slot) : null,
        lessonSlotsPerSession: Number(cls?.lesson_slots_per_session ?? 1) || 1,
      })
    }
  }
  return out
}

/** 載入宣傳配對所需快照（小組進行中班別 × 已註冊學生 × 就讀中報讀） */
export async function fetchPromotionMatchSnapshot(): Promise<PromotionMatchSnapshot> {
  const [allClasses, allStudents] = await Promise.all([fetchAllClasses(), fetchAllStudents()])

  const classes: PromotionClassRow[] = allClasses
    .filter((c) => isActiveGroupClass(c.status, c.class_kind))
    .map((c) => ({
      id: c.id,
      label: formatClassLabel({
        subject: c.subject,
        courseCode: c.course_code_full,
        courseName: c.course_name,
      }),
      subject: c.subject,
      grades: c.grade ?? [],
      dayOfWeek: c.day_of_week,
      timeSlot: c.time_slot,
      lessonSlotsPerSession: c.lesson_slots_per_session ?? 1,
      teacherName: c.teacher_name,
      capacity: c.capacity,
      status: c.status,
    }))

  const students: PromotionStudentRow[] = allStudents
    .filter((s) => normalizeRegistrationStatus(s.registration_status) === "已註冊")
    .map((s) => ({
      id: s.id,
      studentCode: s.student_code,
      fullName: s.full_name,
      englishName: s.english_name,
      gradeLabel: formatStudentGrade(s.grade),
      contactPhone: pickStudentContactRaw({
        whatsapp: s.whatsapp,
        student_phone: s.student_phone,
        parent_phone: s.parent_phone,
      }),
      registrationStatus: "已註冊" as const,
    }))
    .filter((s) => s.gradeLabel && s.gradeLabel !== "—")

  const enrollments = await fetchActiveEnrollmentsForStudents(students.map((s) => s.id))

  return {
    classes,
    students,
    enrollments,
    classBundles: buildClassMatchBundles({ classes, students, enrollments, minFullTerm: 1 }),
    studentBundles: buildStudentMatchBundles({
      classes,
      students,
      enrollments,
      minFullTermHot: 2,
    }),
  }
}
