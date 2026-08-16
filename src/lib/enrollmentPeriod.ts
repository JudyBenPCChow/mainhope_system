export type CourseMode = "regular" | "summer_two_period"

export const ENROLLMENT_PERIOD_OPTIONS = ["第一期", "第二期", "兩期全報"] as const
export type EnrollmentPeriod = (typeof ENROLLMENT_PERIOD_OPTIONS)[number]

export const SINGLE_SESSION_ENROLLMENT = "單堂" as const
export type EnrollmentFormValue = EnrollmentPeriod | typeof SINGLE_SESSION_ENROLLMENT

export const SUMMER_ENROLLMENT_FORM_OPTIONS = [
 ...ENROLLMENT_PERIOD_OPTIONS,
 SINGLE_SESSION_ENROLLMENT,
] as const

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

export function isSingleSessionEnrollment(
 value: string | null | undefined
): boolean {
 return (value ?? "").trim() === SINGLE_SESSION_ENROLLMENT
}

/** 報讀期數是否涵蓋指定 period_code（1 或 2）；單堂一律 false（改看選堂） */
export function enrollmentCoversPeriod(
 enrollmentPeriod: EnrollmentFormValue | null | undefined,
 periodCode: 1 | 2
): boolean {
 if (isSingleSessionEnrollment(enrollmentPeriod)) return false
 if (enrollmentPeriod == null) return true
 if (enrollmentPeriod === "兩期全報") return true
 if (periodCode === 1) return enrollmentPeriod === "第一期"
 return enrollmentPeriod === "第二期"
}

/**
 * 該報讀是否應出現在指定排程名單。
 * - 單堂：schedule_id 必須在 enrolledScheduleIds
 * - 其餘：沿用暑期期數過濾（periodCode null 則全可見）
 */
export function enrollmentVisibleOnSchedule(opts: {
 enrollmentPeriod: EnrollmentFormValue | null | undefined
 periodCode: 1 | 2 | null
 scheduleId: string
 enrolledScheduleIds: ReadonlySet<string>
}): boolean {
 if (isSingleSessionEnrollment(opts.enrollmentPeriod)) {
  return opts.enrolledScheduleIds.has(opts.scheduleId)
 }
 if (opts.periodCode == null) return true
 return enrollmentCoversPeriod(opts.enrollmentPeriod, opts.periodCode)
}

/** 班別／學生詳情用：暑期第一期／單堂（第3、7堂）等 */
export function formatEnrollmentFormLabel(
 enrollmentPeriod: EnrollmentFormValue | null | undefined,
 sessionNumbers?: Array<number | null | undefined>
): string {
 if (isSingleSessionEnrollment(enrollmentPeriod)) {
  const nums = [...(sessionNumbers ?? [])]
   .filter((n): n is number => n != null && Number.isFinite(n))
   .sort((a, b) => a - b)
  if (nums.length === 0) return "單堂"
  return `單堂（第${nums.join("、")}堂）`
 }
 if (enrollmentPeriod === "第一期") return "暑期第一期"
 if (enrollmentPeriod === "第二期") return "暑期第二期"
 if (enrollmentPeriod === "兩期全報") return "暑期兩期全報"
 return "報讀"
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
): EnrollmentFormValue | null {
 const s = (value ?? "").trim()
 if (s === "第一期" || s === "第二期" || s === "兩期全報" || s === "單堂") return s
 return null
}

/** 解析報讀應使用的每堂單價；班別 override 優先於課程模板；單堂用第一期／預設價 */
export function resolvePriceForEnrollment(opts: {
 enrollmentPeriod: EnrollmentFormValue | null
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

export type ClassEnrollmentConfig = {
 courseMode: CourseMode
 academicYearId: string | null
 academicYearLabel: string | null
}
