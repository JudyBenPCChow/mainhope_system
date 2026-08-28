import { formatClassLabel } from "@/lib/courseLabel"
import { normalizeEnrollmentPeriod } from "@/lib/enrollmentPeriod"
import {
  buildClassMatchBundles,
  buildStudentMatchBundles,
  isPromotionPriorYear,
  isPromotionSourceYear,
  isPromotionTargetYear,
  PROMOTION_PRIOR_YEAR_LABEL,
  type ClassMatchBundle,
  type PromotionClassRow,
  type PromotionEnrollmentRow,
  type PromotionHistoricalSubjectRow,
  type PromotionStudentRow,
  type StudentMatchBundle,
} from "@/lib/promotionMatch"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import { supabase } from "@/lib/supabaseClient"
import { formatStudentGrade, normalizeStudentGrade } from "@/lib/studentGrade"
import { pickStudentContactRaw } from "@/lib/whatsappReminder"
import { fetchAllClasses } from "@/services/classQueries"
import {
  fetchAllStudents,
  normalizeAcademicStage,
  normalizeRegistrationStatus,
} from "@/services/studentQueries"

/** 宣傳配對只納入已註冊、未畢業、且有有效年級的學生。 */
export function isPromotionMatchStudentCandidate(s: {
  registration_status: string | null | undefined
  academic_stage: string | null | undefined
  grade: string | null | undefined
}): boolean {
  if (normalizeRegistrationStatus(s.registration_status) !== "已註冊") return false
  if (normalizeAcademicStage(s.academic_stage) === "已畢業") return false
  if (normalizeStudentGrade(s.grade) === "GD") return false
  const gradeLabel = formatStudentGrade(s.grade)
  return Boolean(gradeLabel && gradeLabel !== "—")
}

export function isPromotableTargetGroupClass(c: {
  status: string
  class_kind: string
  academic_year_label?: string | null
}): boolean {
  if (c.class_kind !== "group") return false
  if (!isPromotionTargetYear(c.academic_year_label)) return false
  if (c.status.includes("已結束")) return false
  return c.status.includes("進行") || c.status.includes("招生")
}

export function buildStudentIdsEnrolledInSourceYear(
  enrollments: Array<{ studentId: string; academicYearLabel: string | null; status: string }>
): Set<string> {
  const out = new Set<string>()
  for (const row of enrollments) {
    if (row.status === "就讀中" && isPromotionSourceYear(row.academicYearLabel)) {
      out.add(row.studentId)
    }
  }
  return out
}

/** 2526 系統報讀：就讀中或已退讀皆算「有報讀」。 */
const PRIOR_YEAR_ENROLLMENT_STATUSES = new Set(["就讀中", "已退讀"])

export function buildStudentIdsEnrolledInPriorYear(
  enrollments: Array<{ studentId: string; academicYearLabel: string | null; status: string }>
): Set<string> {
  const out = new Set<string>()
  for (const row of enrollments) {
    if (
      PRIOR_YEAR_ENROLLMENT_STATUSES.has(row.status) &&
      isPromotionPriorYear(row.academicYearLabel)
    ) {
      out.add(row.studentId)
    }
  }
  return out
}

export function mergeStudentIdSets(...sets: Array<Set<string>>): Set<string> {
  const out = new Set<string>()
  for (const set of sets) {
    for (const id of set) out.add(id)
  }
  return out
}

export function buildHistoricalSubjectsFromSourceEnrollments(
  enrollments: Array<{
    studentId: string
    subjectId: string | null
    academicYearLabel: string | null
    status: string
  }>
): PromotionHistoricalSubjectRow[] {
  const unique = new Map<string, PromotionHistoricalSubjectRow>()
  for (const row of enrollments) {
    if (row.status !== "就讀中" || !isPromotionSourceYear(row.academicYearLabel)) continue
    if (!row.subjectId) continue
    const item = { studentId: row.studentId, subjectId: row.subjectId }
    unique.set(`${item.studentId}:${item.subjectId}`, item)
  }
  return [...unique.values()]
}

export type PromotionMatchSnapshot = {
  classes: PromotionClassRow[]
  students: PromotionStudentRow[]
  enrollments: PromotionEnrollmentRow[]
  historicalSubjects: PromotionHistoricalSubjectRow[]
  classBundles: ClassMatchBundle[]
  studentBundles: StudentMatchBundle[]
}

function nestedRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

async function fetchActiveEnrollmentsForStudents(
  studentIds: string[]
): Promise<PromotionEnrollmentRow[]> {
  if (!supabase || studentIds.length === 0) return []

  const select =
    "id, student_id, class_id, enrollment_period, status, classes ( subject, course_id, course_code_full, day_of_week, time_slot, lesson_slots_per_session, class_kind, academic_years ( label ), courses ( course_name, subject_id ) )"

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
      const cls = nestedRecord(r.classes)
      const course = nestedRecord(cls?.courses)
      const year = nestedRecord(cls?.academic_years)
      const subject = cls?.subject != null ? String(cls.subject) : ""
      const courseName = course?.course_name != null ? String(course.course_name) : null
      const courseCode =
        cls?.course_code_full != null ? String(cls.course_code_full) : null
      out.push({
        id: String(r.id),
        studentId: String(r.student_id),
        classId: String(r.class_id),
        courseId: cls?.course_id != null ? String(cls.course_id) : null,
        subjectId: course?.subject_id != null ? String(course.subject_id) : null,
        period: normalizeEnrollmentPeriod(
          r.enrollment_period != null ? String(r.enrollment_period) : null
        ),
        status: String(r.status ?? ""),
        classLabel: formatClassLabel({ subject, courseCode, courseName }),
        dayOfWeek: cls?.day_of_week != null ? String(cls.day_of_week) : null,
        timeSlot: cls?.time_slot != null ? String(cls.time_slot) : null,
        lessonSlotsPerSession: Number(cls?.lesson_slots_per_session ?? 1) || 1,
        academicYearLabel: year?.label != null ? String(year.label) : null,
      })
    }
  }
  return out
}

/** Notion 匯入嘅 2526 舊科目事實（唔代表現行班別報讀）。 */
async function fetchLegacyPriorYearStudentIds(studentIds: string[]): Promise<Set<string>> {
  if (!supabase || studentIds.length === 0) return new Set()

  const chunks = await forEachIdChunk(studentIds, DEFAULT_ID_CHUNK, async (slice) => {
    const { data, error } = await supabase!
      .from("legacy_student_subject_enrollments")
      .select("student_id")
      .in("student_id", slice)
    if (error) throw error
    return data ?? []
  })

  const out = new Set<string>()
  for (const data of chunks) {
    for (const row of data) {
      const r = row as Record<string, unknown>
      out.add(String(r.student_id))
    }
  }
  return out
}

/** 系統仍掛 2526 班嘅報讀（就讀中／已退讀；多為私人課程殘留）。 */
async function fetchLivePriorYearEnrollmentRows(
  studentIds: string[],
  priorYearClassIds: string[]
): Promise<Array<{ studentId: string; academicYearLabel: string | null; status: string }>> {
  if (!supabase || studentIds.length === 0 || priorYearClassIds.length === 0) return []

  const chunks = await forEachIdChunk(studentIds, DEFAULT_ID_CHUNK, async (slice) => {
    const { data, error } = await supabase!
      .from("student_class_enrollments")
      .select("student_id, status")
      .in("student_id", slice)
      .in("class_id", priorYearClassIds)
      .in("status", [...PRIOR_YEAR_ENROLLMENT_STATUSES])
    if (error) throw error
    return data ?? []
  })

  const out: Array<{ studentId: string; academicYearLabel: string | null; status: string }> = []
  for (const data of chunks) {
    for (const row of data) {
      const r = row as Record<string, unknown>
      out.push({
        studentId: String(r.student_id),
        academicYearLabel: PROMOTION_PRIOR_YEAR_LABEL,
        status: String(r.status ?? ""),
      })
    }
  }
  return out
}

/** 載入宣傳配對所需快照（2627 專科班 × 已註冊未畢業學生 × 就讀中報讀） */
export async function fetchPromotionMatchSnapshot(): Promise<PromotionMatchSnapshot> {
  const [allClasses, allStudents] = await Promise.all([fetchAllClasses(), fetchAllStudents()])

  const classes: PromotionClassRow[] = allClasses
    .filter((c) => isPromotableTargetGroupClass(c))
    .map((c) => ({
      id: c.id,
      courseId: c.course_id,
      subjectId: c.subject_id ?? null,
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

  const priorYearClassIds = allClasses
    .filter((c) => isPromotionPriorYear(c.academic_year_label))
    .map((c) => c.id)

  const studentIds = allStudents
    .filter((s) => isPromotionMatchStudentCandidate(s))
    .map((s) => s.id)

  const [enrollments, legacyPriorYearIds, livePriorYearRows] = await Promise.all([
    fetchActiveEnrollmentsForStudents(studentIds),
    fetchLegacyPriorYearStudentIds(studentIds),
    fetchLivePriorYearEnrollmentRows(studentIds, priorYearClassIds),
  ])
  const activeIn26SMIds = buildStudentIdsEnrolledInSourceYear(enrollments)
  const enrolledIn2526Ids = mergeStudentIdSets(
    legacyPriorYearIds,
    buildStudentIdsEnrolledInPriorYear(livePriorYearRows)
  )
  const historicalSubjects = buildHistoricalSubjectsFromSourceEnrollments(enrollments)

  const students: PromotionStudentRow[] = allStudents
    .filter((s) => isPromotionMatchStudentCandidate(s))
    .map((s) => ({
      id: s.id,
      studentCode: s.student_code,
      fullName: s.full_name,
      englishName: s.english_name,
      gradeLabel: formatStudentGrade(s.grade),
      contactPhone: pickStudentContactRaw({
        student_phone: s.student_phone,
        parent_phone: s.parent_phone,
        primary_contact_person: s.primary_contact_person,
        student_preferred_contact_method: s.student_preferred_contact_method,
        parent_preferred_contact_method: s.parent_preferred_contact_method,
        student_phone_country_code: s.student_phone_country_code,
        parent_phone_country_code: s.parent_phone_country_code,
      }),
      registrationStatus: "已註冊" as const,
      activeIn26SM: activeIn26SMIds.has(s.id),
      enrolledIn2526: enrolledIn2526Ids.has(s.id),
    }))

  return {
    classes,
    students,
    enrollments,
    historicalSubjects,
    classBundles: buildClassMatchBundles({
      classes,
      students,
      enrollments,
      historicalSubjects,
      minFullTerm: 0,
    }),
    studentBundles: buildStudentMatchBundles({
      classes,
      students,
      enrollments,
      historicalSubjects,
      minFullTermHot: 2,
    }),
  }
}
