import { formatClassLabel } from "@/lib/courseLabel"
import { normalizeEnrollmentPeriod } from "@/lib/enrollmentPeriod"
import {
  buildClassMatchBundles,
  buildStudentMatchBundles,
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
  enrollmentEventYmd,
  fetchAllStudents,
  normalizeAcademicStage,
  normalizeRegistrationStatus,
} from "@/services/studentQueries"

/** 宣傳配對「活躍生」：日曆年內有報讀（非學年制）。 */
export const PROMOTION_MATCH_ACTIVE_CALENDAR_YEAR = 2026

export function isEnrollmentInCalendarYear(
  row: { enroll_date: string | null; created_at: string },
  year: number
): boolean {
  const ymd = enrollmentEventYmd(row)
  return ymd >= `${year}-01-01` && ymd <= `${year}-12-31`
}

export function isLegacyPeriodInCalendarYear(
  periodStart: string,
  periodEnd: string,
  year: number
): boolean {
  const start = periodStart.slice(0, 10)
  const end = periodEnd.slice(0, 10)
  return start <= `${year}-12-31` && end >= `${year}-01-01`
}

export function buildStudentIdsWithCalendarYearEnrollment(
  rows: Array<{ student_id: string; enroll_date: string | null; created_at: string }>,
  year: number
): Set<string> {
  const out = new Set<string>()
  for (const row of rows) {
    if (isEnrollmentInCalendarYear(row, year)) {
      out.add(String(row.student_id))
    }
  }
  return out
}

export function buildStudentIdsWithLegacyCalendarYearEnrollment(
  rows: Array<{ student_id: string; period_start: string; period_end: string }>,
  year: number
): Set<string> {
  const out = new Set<string>()
  for (const row of rows) {
    if (isLegacyPeriodInCalendarYear(row.period_start, row.period_end, year)) {
      out.add(String(row.student_id))
    }
  }
  return out
}

export function mergeStudentIdsActiveInCalendarYear(
  enrollmentRows: Array<{ student_id: string; enroll_date: string | null; created_at: string }>,
  legacyRows: Array<{ student_id: string; period_start: string; period_end: string }>,
  year: number
): Set<string> {
  const out = buildStudentIdsWithCalendarYearEnrollment(enrollmentRows, year)
  for (const id of buildStudentIdsWithLegacyCalendarYearEnrollment(legacyRows, year)) {
    out.add(id)
  }
  return out
}

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

export type PromotionMatchSnapshot = {
  classes: PromotionClassRow[]
  students: PromotionStudentRow[]
  enrollments: PromotionEnrollmentRow[]
  historicalSubjects: PromotionHistoricalSubjectRow[]
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
    "id, student_id, class_id, enrollment_period, status, classes ( subject, course_id, course_code_full, day_of_week, time_slot, lesson_slots_per_session, class_kind, courses ( course_name, subject_id ) )"

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
      })
    }
  }
  return out
}

async function fetchEnrollmentDatesForStudents(
  studentIds: string[]
): Promise<Array<{ student_id: string; enroll_date: string | null; created_at: string }>> {
  if (!supabase || studentIds.length === 0) return []

  const chunks = await forEachIdChunk(studentIds, DEFAULT_ID_CHUNK, async (slice) => {
    const { data, error } = await supabase!
      .from("student_class_enrollments")
      .select("student_id, enroll_date, created_at")
      .in("student_id", slice)
    if (error) throw error
    return data ?? []
  })

  const out: Array<{ student_id: string; enroll_date: string | null; created_at: string }> = []
  for (const data of chunks) {
    for (const row of data) {
      const r = row as Record<string, unknown>
      out.push({
        student_id: String(r.student_id),
        enroll_date: r.enroll_date != null ? String(r.enroll_date) : null,
        created_at: String(r.created_at ?? ""),
      })
    }
  }
  return out
}

async function fetchLegacyEnrollmentPeriodsForStudents(
  studentIds: string[]
): Promise<Array<{ student_id: string; period_start: string; period_end: string }>> {
  if (!supabase || studentIds.length === 0) return []

  const year = PROMOTION_MATCH_ACTIVE_CALENDAR_YEAR
  const chunks = await forEachIdChunk(studentIds, DEFAULT_ID_CHUNK, async (slice) => {
    const { data, error } = await supabase!
      .from("legacy_student_subject_enrollments")
      .select("student_id, period_start, period_end")
      .in("student_id", slice)
      .lte("period_start", `${year}-12-31`)
      .gte("period_end", `${year}-01-01`)
    if (error) throw error
    return data ?? []
  })

  const out: Array<{ student_id: string; period_start: string; period_end: string }> = []
  for (const data of chunks) {
    for (const row of data) {
      const r = row as Record<string, unknown>
      out.push({
        student_id: String(r.student_id),
        period_start: String(r.period_start),
        period_end: String(r.period_end),
      })
    }
  }
  return out
}

async function fetchHistoricalSubjectsForStudents(
  studentIds: string[]
): Promise<PromotionHistoricalSubjectRow[]> {
  if (!supabase || studentIds.length === 0) return []

  const chunks = await forEachIdChunk(studentIds, DEFAULT_ID_CHUNK, async (slice) => {
    const { data, error } = await supabase!
      .from("legacy_student_subject_enrollments")
      .select("student_id, subject_id")
      .in("student_id", slice)
      .lte("period_start", "2026-06-30")
      .gte("period_end", "2026-01-01")
    if (error) throw error
    return data ?? []
  })

  const unique = new Map<string, PromotionHistoricalSubjectRow>()
  for (const data of chunks) {
    for (const row of data) {
      const value = row as Record<string, unknown>
      const item = {
        studentId: String(value.student_id),
        subjectId: String(value.subject_id),
      }
      unique.set(`${item.studentId}:${item.subjectId}`, item)
    }
  }
  return [...unique.values()]
}

/** 載入宣傳配對所需快照（小組進行中班別 × 已註冊未畢業學生 × 就讀中報讀） */
export async function fetchPromotionMatchSnapshot(): Promise<PromotionMatchSnapshot> {
  const [allClasses, allStudents] = await Promise.all([fetchAllClasses(), fetchAllStudents()])

  const classes: PromotionClassRow[] = allClasses
    .filter((c) => isActiveGroupClass(c.status, c.class_kind))
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

  const studentIds = allStudents
    .filter((s) => isPromotionMatchStudentCandidate(s))
    .map((s) => s.id)

  const [enrollmentDateRows, legacyEnrollmentRows, enrollments, historicalSubjects] =
    await Promise.all([
      fetchEnrollmentDatesForStudents(studentIds),
      fetchLegacyEnrollmentPeriodsForStudents(studentIds),
      fetchActiveEnrollmentsForStudents(studentIds),
      fetchHistoricalSubjectsForStudents(studentIds),
    ])

  const activeIn2026Ids = mergeStudentIdsActiveInCalendarYear(
    enrollmentDateRows,
    legacyEnrollmentRows,
    PROMOTION_MATCH_ACTIVE_CALENDAR_YEAR
  )

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
      activeIn2026: activeIn2026Ids.has(s.id),
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
      minFullTerm: 1,
    }),
    studentBundles: buildStudentMatchBundles({
      classes,
      students,
      enrollments,
      minFullTermHot: 2,
    }),
  }
}
