import { supabase } from "@/lib/supabaseClient"

export type CourseMode = "regular" | "summer_two_period"

export const ENROLLMENT_PERIOD_OPTIONS = ["第一期", "第二期", "兩期全報"] as const
export type EnrollmentPeriod = (typeof ENROLLMENT_PERIOD_OPTIONS)[number]

export type AcademicYearPeriodRow = {
 id: string
 academicYearId: string
 periodCode: 1 | 2
 label: string
 startDate: string
 endDate: string
}

export type CoursePriceFields = {
 pricePerLesson: number | null
 pricePerLessonPeriod2: number | null
 pricePerLessonBothPeriods: number | null
}

/** 報讀期數是否涵蓋指定 period_code（1 或 2） */
export function enrollmentCoversPeriod(
 enrollmentPeriod: EnrollmentPeriod | null | undefined,
 periodCode: 1 | 2
): boolean {
 if (enrollmentPeriod == null) return true
 if (enrollmentPeriod === "兩期全報") return true
 if (periodCode === 1) return enrollmentPeriod === "第一期"
 return enrollmentPeriod === "第二期"
}

/** 依日期對照學年期數字典，回傳 1、2 或 null（不在任何期間內） */
export function resolvePeriodCodeFromDate(
 ymd: string,
 periods: AcademicYearPeriodRow[]
): 1 | 2 | null {
 const d = ymd.slice(0, 10)
 for (const p of periods) {
  if (d >= p.startDate && d <= p.endDate) return p.periodCode
 }
 return null
}

export function isSummerTwoPeriodMode(mode: string | null | undefined): boolean {
 return mode === "summer_two_period"
}

export function normalizeEnrollmentPeriod(
 value: string | null | undefined
): EnrollmentPeriod | null {
 const s = (value ?? "").trim()
 if (s === "第一期" || s === "第二期" || s === "兩期全報") return s
 return null
}

/** 解析報讀應使用的每堂單價；班別 override 優先於課程模板 */
export function resolvePriceForEnrollment(opts: {
 enrollmentPeriod: EnrollmentPeriod | null
 classPriceOverride: number | null | undefined
 coursePrices: CoursePriceFields
}): number | null {
 const classPrice = opts.classPriceOverride
 if (classPrice != null && Number.isFinite(Number(classPrice))) {
  return Number(classPrice)
 }
 const { pricePerLesson, pricePerLessonPeriod2, pricePerLessonBothPeriods } = opts.coursePrices
 const p = opts.enrollmentPeriod
 if (p === "第二期") {
  const v = pricePerLessonPeriod2 ?? pricePerLesson
  return v != null && Number.isFinite(Number(v)) ? Number(v) : null
 }
 if (p === "兩期全報") {
  const v = pricePerLessonBothPeriods ?? pricePerLesson
  return v != null && Number.isFinite(Number(v)) ? Number(v) : null
 }
 const v = pricePerLesson
 return v != null && Number.isFinite(Number(v)) ? Number(v) : null
}

function mapPeriodRow(row: Record<string, unknown>): AcademicYearPeriodRow {
 return {
  id: String(row.id),
  academicYearId: String(row.academic_year_id),
  periodCode: Number(row.period_code) as 1 | 2,
  label: String(row.label ?? ""),
  startDate: String(row.start_date ?? "").slice(0, 10),
  endDate: String(row.end_date ?? "").slice(0, 10),
 }
}

export async function fetchAcademicYearPeriods(
 academicYearId: string
): Promise<AcademicYearPeriodRow[]> {
 if (!supabase) return []
 const { data, error } = await supabase
  .from("academic_year_periods")
  .select("id, academic_year_id, period_code, label, start_date, end_date")
  .eq("academic_year_id", academicYearId)
  .order("period_code", { ascending: true })
 if (error) throw error
 return (data ?? []).map((r) => mapPeriodRow(r as Record<string, unknown>))
}

export type ClassEnrollmentConfig = {
 courseMode: CourseMode
 academicYearId: string | null
 academicYearLabel: string | null
}

export async function fetchClassEnrollmentConfig(classId: string): Promise<ClassEnrollmentConfig> {
 if (!supabase) {
  return { courseMode: "regular", academicYearId: null, academicYearLabel: null }
 }
 const { data, error } = await supabase
  .from("classes")
  .select("academic_year_id, academic_years ( label ), courses ( course_mode )")
  .eq("id", classId)
  .maybeSingle()
 if (error) throw error
 if (!data) {
  return { courseMode: "regular", academicYearId: null, academicYearLabel: null }
 }
 const row = data as Record<string, unknown>
 const course = row.courses as Record<string, unknown> | null
 const year = row.academic_years as Record<string, unknown> | null
 const mode = course?.course_mode != null ? String(course.course_mode) : "regular"
 return {
  courseMode: mode === "summer_two_period" ? "summer_two_period" : "regular",
  academicYearId: row.academic_year_id != null ? String(row.academic_year_id) : null,
  academicYearLabel: year?.label != null ? String(year.label) : null,
 }
}

/** 依排程日期判斷學生是否應出現在 roster */
export async function enrollmentVisibleOnScheduleDate(opts: {
 classId: string
 scheduleDate: string
 enrollmentPeriod: EnrollmentPeriod | null
}): Promise<boolean> {
 const config = await fetchClassEnrollmentConfig(opts.classId)
 if (!isSummerTwoPeriodMode(config.courseMode) || !config.academicYearId) {
  return true
 }
 const periods = await fetchAcademicYearPeriods(config.academicYearId)
 const code = resolvePeriodCodeFromDate(opts.scheduleDate, periods)
 if (code == null) return true
 return enrollmentCoversPeriod(opts.enrollmentPeriod, code)
}
