export const DISCOUNT_KINDS = [
 "fixed_amount",
 "lesson_tier",
 "lesson_tier_early_bird",
 "group_class",
 "referral_referee",
 "referral_referrer_cash",
] as const

export type DiscountKind = (typeof DISCOUNT_KINDS)[number]

export const DISCOUNT_KIND_LABELS: Record<DiscountKind, string> = {
 fixed_amount: "固定減免",
 lesson_tier: "堂數階梯（取最高級）",
 lesson_tier_early_bird: "早鳥階梯額外（取最高級）",
 group_class: "自組同班（按人）",
 referral_referee: "被推薦人學費減免",
 referral_referrer_cash: "推薦人現金回贈（不計學費）",
}

export type LessonTierRow = {
 minLessons: number
 amountOff: number
}

export type LessonTiersConfig = {
 selection: "highest_only"
 tiers: LessonTierRow[]
}

export type GroupEnrollmentRules = {
 minGroupSize: number
 requireSameClassId: boolean
 requireEnrollmentPeriod: string | null
 requireCourseMode: string | null
 requireJointPayment: boolean
 amountOffPerStudent: number
}

export function parseDiscountKind(raw: unknown): DiscountKind {
 const s = String(raw ?? "fixed_amount")
 return DISCOUNT_KINDS.includes(s as DiscountKind) ? (s as DiscountKind) : "fixed_amount"
}

export function isTuitionDiscountKind(kind: DiscountKind): boolean {
 return kind !== "referral_referrer_cash"
}

export function isLessonTierKind(kind: DiscountKind): boolean {
 return kind === "lesson_tier" || kind === "lesson_tier_early_bird"
}

export function parseLessonTiers(raw: unknown): LessonTiersConfig | null {
 if (raw == null || typeof raw !== "object") return null
 const r = raw as Record<string, unknown>
 if (!Array.isArray(r.tiers)) return null
 const tiers: LessonTierRow[] = []
 for (const row of r.tiers) {
  if (!row || typeof row !== "object") continue
  const t = row as Record<string, unknown>
  const minLessons = Number(t.min_lessons ?? t.minLessons)
  const amountOff = Number(t.amount_off ?? t.amountOff)
  if (Number.isFinite(minLessons) && minLessons > 0 && Number.isFinite(amountOff) && amountOff >= 0) {
   tiers.push({ minLessons: Math.trunc(minLessons), amountOff })
  }
 }
 if (tiers.length === 0) return null
 tiers.sort((a, b) => a.minLessons - b.minLessons)
 return { selection: "highest_only", tiers }
}

export function lessonTiersToDb(config: LessonTiersConfig | null | undefined): Record<string, unknown> | null {
 if (!config?.tiers.length) return null
 return {
  selection: config.selection,
  tiers: config.tiers.map((t) => ({
   min_lessons: t.minLessons,
   amount_off: t.amountOff,
  })),
 }
}

export function parseGroupEnrollmentRules(raw: unknown): GroupEnrollmentRules | null {
 if (raw == null || typeof raw !== "object") return null
 const r = raw as Record<string, unknown>
 const minGroupSize = Number(r.min_group_size ?? r.minGroupSize ?? 3)
 const amountOffPerStudent = Number(r.amount_off_per_student ?? r.amountOffPerStudent ?? 0)
 if (!Number.isFinite(minGroupSize) || minGroupSize < 2) return null
 return {
  minGroupSize: Math.trunc(minGroupSize),
  requireSameClassId: Boolean(r.require_same_class_id ?? r.requireSameClassId ?? true),
  requireEnrollmentPeriod:
   r.require_enrollment_period != null
    ? String(r.require_enrollment_period)
    : r.requireEnrollmentPeriod != null
      ? String(r.requireEnrollmentPeriod)
      : null,
  requireCourseMode:
   r.require_course_mode != null
    ? String(r.require_course_mode)
    : r.requireCourseMode != null
      ? String(r.requireCourseMode)
      : null,
  requireJointPayment: Boolean(r.require_joint_payment ?? r.requireJointPayment ?? true),
  amountOffPerStudent: Number.isFinite(amountOffPerStudent) ? amountOffPerStudent : 0,
 }
}

export function groupEnrollmentRulesToDb(
 rules: GroupEnrollmentRules | null | undefined
): Record<string, unknown> | null {
 if (!rules) return null
 return {
  min_group_size: rules.minGroupSize,
  require_same_class_id: rules.requireSameClassId,
  require_enrollment_period: rules.requireEnrollmentPeriod,
  require_course_mode: rules.requireCourseMode,
  require_joint_payment: rules.requireJointPayment,
  amount_off_per_student: rules.amountOffPerStudent,
 }
}

/** 依總堂數取最高符合階梯 */
export function resolveLessonTierAmount(
 config: LessonTiersConfig | null | undefined,
 totalLessons: number
): { eligible: boolean; amountOff: number; matchedMinLessons: number | null; reason: string | null } {
 if (!config?.tiers.length) {
  return { eligible: false, amountOff: 0, matchedMinLessons: null, reason: "未設定階梯" }
 }
 let matched: LessonTierRow | null = null
 for (const tier of config.tiers) {
  if (totalLessons >= tier.minLessons) matched = tier
 }
 if (!matched) {
  const minNeeded = config.tiers[0]!.minLessons
  return {
   eligible: false,
   amountOff: 0,
   matchedMinLessons: null,
   reason: `需至少 ${minNeeded} 堂（目前 ${totalLessons} 堂）`,
  }
 }
 return {
  eligible: true,
  amountOff: matched.amountOff,
  matchedMinLessons: matched.minLessons,
  reason: null,
 }
}
