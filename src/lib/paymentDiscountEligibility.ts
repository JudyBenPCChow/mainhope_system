import type { EnrollmentPeriod } from "@/lib/enrollmentPeriod"
import type { CourseMode } from "@/lib/enrollmentPeriod"
import {
 isLessonTierKind,
 parseGroupEnrollmentRules,
 resolveLessonTierAmount,
 type GroupEnrollmentRules,
 type LessonTiersConfig,
} from "@/lib/paymentDiscountKinds"
import type { DiscountKind } from "@/lib/paymentDiscountKinds"
import type { PaymentDiscountRow } from "@/services/paymentDiscountQueries"
import { isDiscountInEffect } from "@/services/paymentDiscountQueries"

export type SubjectCategory = "main" | "junior_elective" | "senior_elective" | "other"

export type RequireOneFromGroupRule = {
 group?: string
 groups?: string[]
 label?: string
}

export type FamilyLessonPoolRule = {
 aggregateSiblingLessons: boolean
 relationshipTypes?: string[]
}

/** 儲存於 payment_discounts.eligibility_rules */
export type PaymentDiscountEligibilityRules = {
 minSubjectCount?: number | null
 minTotalLessons?: number | null
 requiredSubjectCodes?: string[] | null
 requireAnySubjectCodes?: string[] | null
 requireOneFromEachGroup?: RequireOneFromGroupRule[] | null
 /** 每列至少符合此期數（第一期／第二期／兩期全報皆可視為≥一期） */
 minEnrollmentPeriodPerLine?: EnrollmentPeriod | null
 requireNewStudent?: boolean
 familyLessonPool?: FamilyLessonPoolRule | null
}

export type PaymentEligibilityLine = {
 classId: string
 subjectCode: string
 subjectCategory: SubjectCategory | null
 enrollmentPeriod: EnrollmentPeriod | null
 courseMode: CourseMode
 teacherId: string | null
 timeSlot: string | null
 dayOfWeek: string | null
 lessons: number
}

export type PaymentEligibilityContext = {
 subjectCount: number
 totalLessons: number
 /** 階梯用：含兄弟姊妹合計堂數 */
 tierTotalLessons: number
 subjectCodes: string[]
 subjectCategories: SubjectCategory[]
 lines: PaymentEligibilityLine[]
 isNewStudent?: boolean
 /** 聯合收費：同 batch 學生數 */
 batchMemberCount?: number
 /** 聯合收費：同班 classId（若全員同一班） */
 batchSharedClassId?: string | null
 referrerStudentId?: string | null
}

export type DiscountAvailability = {
 eligible: boolean
 reason: string | null
 resolvedAmountOff?: number
}

function normalizeSubjectCode(code: string): string {
 return code.trim().toUpperCase()
}

function normalizeCodeList(codes: string[] | null | undefined): string[] {
 if (!codes?.length) return []
 return [...new Set(codes.map(normalizeSubjectCode).filter(Boolean))]
}

function parseSubjectCategory(raw: unknown): SubjectCategory | null {
 const s = String(raw ?? "").trim()
 if (s === "main" || s === "junior_elective" || s === "senior_elective" || s === "other") return s
 return null
}

function periodMeetsMinimum(
 period: EnrollmentPeriod | null,
 minimum: EnrollmentPeriod | null
): boolean {
 if (!minimum || minimum === "第一期") {
  return period === "第一期" || period === "第二期" || period === "兩期全報"
 }
 if (minimum === "第二期") {
  return period === "第二期" || period === "兩期全報"
 }
 return period === "兩期全報"
}

export function parseEligibilityRules(raw: unknown): PaymentDiscountEligibilityRules | null {
 if (raw == null || typeof raw !== "object") return null
 const r = raw as Record<string, unknown>
 const rules: PaymentDiscountEligibilityRules = {}
 if (r.min_subject_count != null) {
  const n = Number(r.min_subject_count)
  if (Number.isFinite(n) && n > 0) rules.minSubjectCount = Math.trunc(n)
 }
 if (r.min_total_lessons != null) {
  const n = Number(r.min_total_lessons)
  if (Number.isFinite(n) && n > 0) rules.minTotalLessons = Math.trunc(n)
 }
 if (Array.isArray(r.required_subject_codes)) {
  rules.requiredSubjectCodes = normalizeCodeList(r.required_subject_codes.map((x) => String(x)))
 }
 if (Array.isArray(r.require_any_subject_codes)) {
  rules.requireAnySubjectCodes = normalizeCodeList(r.require_any_subject_codes.map((x) => String(x)))
 }
 if (Array.isArray(r.require_one_from_each_group)) {
  const groupRules: RequireOneFromGroupRule[] = []
  for (const row of r.require_one_from_each_group) {
   if (!row || typeof row !== "object") continue
   const g = row as Record<string, unknown>
   const groups = Array.isArray(g.groups) ? g.groups.map((x) => String(x)) : undefined
   groupRules.push({
    group: g.group != null ? String(g.group) : undefined,
    groups,
    label: g.label != null ? String(g.label) : undefined,
   })
  }
  if (groupRules.length > 0) rules.requireOneFromEachGroup = groupRules
 }
 if (r.min_enrollment_period_per_line != null) {
  const p = String(r.min_enrollment_period_per_line)
  if (p === "第一期" || p === "第二期" || p === "兩期全報") {
   rules.minEnrollmentPeriodPerLine = p
  }
 }
 if (r.require_new_student != null) {
  rules.requireNewStudent = Boolean(r.require_new_student)
 }
 const pool = r.family_lesson_pool
 if (pool && typeof pool === "object") {
  const p = pool as Record<string, unknown>
  rules.familyLessonPool = {
   aggregateSiblingLessons: Boolean(p.aggregate_sibling_lessons ?? p.aggregateSiblingLessons),
   relationshipTypes: Array.isArray(p.relationship_types)
    ? p.relationship_types.map((x) => String(x))
    : Array.isArray(p.relationshipTypes)
      ? p.relationshipTypes.map((x) => String(x))
      : undefined,
  }
 }
 const hasRule =
  rules.minSubjectCount != null ||
  rules.minTotalLessons != null ||
  (rules.requiredSubjectCodes?.length ?? 0) > 0 ||
  (rules.requireAnySubjectCodes?.length ?? 0) > 0 ||
  (rules.requireOneFromEachGroup?.length ?? 0) > 0 ||
  rules.minEnrollmentPeriodPerLine != null ||
  rules.requireNewStudent === true ||
  rules.familyLessonPool?.aggregateSiblingLessons === true
 return hasRule ? rules : null
}

export function eligibilityRulesToDb(
 rules: PaymentDiscountEligibilityRules | null | undefined
): Record<string, unknown> | null {
 if (!rules) return null
 const payload: Record<string, unknown> = {}
 if (rules.minSubjectCount != null && rules.minSubjectCount > 0) {
  payload.min_subject_count = rules.minSubjectCount
 }
 if (rules.minTotalLessons != null && rules.minTotalLessons > 0) {
  payload.min_total_lessons = rules.minTotalLessons
 }
 const required = normalizeCodeList(rules.requiredSubjectCodes ?? [])
 if (required.length > 0) payload.required_subject_codes = required
 const anyOf = normalizeCodeList(rules.requireAnySubjectCodes ?? [])
 if (anyOf.length > 0) payload.require_any_subject_codes = anyOf
 if (rules.requireOneFromEachGroup?.length) {
  payload.require_one_from_each_group = rules.requireOneFromEachGroup.map((g) => ({
   group: g.group,
   groups: g.groups,
   label: g.label,
  }))
 }
 if (rules.minEnrollmentPeriodPerLine) {
  payload.min_enrollment_period_per_line = rules.minEnrollmentPeriodPerLine
 }
 if (rules.requireNewStudent) payload.require_new_student = true
 if (rules.familyLessonPool?.aggregateSiblingLessons) {
  payload.family_lesson_pool = {
   aggregate_sibling_lessons: true,
   relationship_types: rules.familyLessonPool.relationshipTypes,
  }
 }
 return Object.keys(payload).length > 0 ? payload : null
}

export function subjectCodesLabel(codes: string[]): string {
 return codes.join("、")
}

export type LineResolverInput = {
 classId: string
 lessons: string | number
 subjectCode?: string | null
 subjectCategory?: SubjectCategory | string | null
 enrollmentPeriod?: EnrollmentPeriod | null
 courseMode?: CourseMode | string | null
 teacherId?: string | null
 timeSlot?: string | null
 dayOfWeek?: string | null
}

/** 由繳費表單 lines + 報讀資料建立資格上下文 */
export function buildPaymentEligibilityContext(
 lines: LineResolverInput[],
 resolveLine?: (classId: string) => Partial<LineResolverInput> | null,
 opts?: { siblingExtraLessons?: number; isNewStudent?: boolean; batchMemberCount?: number; batchSharedClassId?: string | null; referrerStudentId?: string | null }
): PaymentEligibilityContext {
 const paymentLines: PaymentEligibilityLine[] = []
 for (const line of lines) {
  const classId = line.classId?.trim()
  if (!classId) continue
  const lessonsN = Number(line.lessons)
  if (!Number.isFinite(lessonsN) || lessonsN <= 0) continue
  const extra = resolveLine?.(classId) ?? {}
  const subjectCode = line.subjectCode ?? extra.subjectCode
  if (!subjectCode) continue
  const cat = parseSubjectCategory(line.subjectCategory ?? extra.subjectCategory)
  paymentLines.push({
   classId,
   subjectCode: normalizeSubjectCode(subjectCode),
   subjectCategory: cat,
   enrollmentPeriod: line.enrollmentPeriod ?? extra.enrollmentPeriod ?? null,
   courseMode:
    (line.courseMode ?? extra.courseMode) === "summer_two_period" ? "summer_two_period" : "regular",
   teacherId: line.teacherId ?? extra.teacherId ?? null,
   timeSlot: line.timeSlot ?? extra.timeSlot ?? null,
   dayOfWeek: line.dayOfWeek ?? extra.dayOfWeek ?? null,
   lessons: lessonsN,
  })
 }
 const subjectCodes = [...new Set(paymentLines.map((l) => l.subjectCode))]
 const subjectCategories = [...new Set(paymentLines.map((l) => l.subjectCategory).filter(Boolean))] as SubjectCategory[]
 const totalLessons = paymentLines.reduce((s, l) => s + l.lessons, 0)
 const siblingExtra = opts?.siblingExtraLessons ?? 0
 return {
  subjectCount: subjectCodes.length,
  totalLessons,
  tierTotalLessons: totalLessons + siblingExtra,
  subjectCodes,
  subjectCategories,
  lines: paymentLines,
  isNewStudent: opts?.isNewStudent,
  batchMemberCount: opts?.batchMemberCount,
  batchSharedClassId: opts?.batchSharedClassId ?? null,
  referrerStudentId: opts?.referrerStudentId ?? null,
 }
}

function lineMatchesCategoryGroup(line: PaymentEligibilityLine, rule: RequireOneFromGroupRule): boolean {
 const cats: string[] = []
 if (rule.group) cats.push(rule.group)
 if (rule.groups?.length) cats.push(...rule.groups)
 if (cats.length === 0) return false
 return line.subjectCategory != null && cats.includes(line.subjectCategory)
}

function evaluateGroupClassRules(
 rules: GroupEnrollmentRules | null,
 ctx: PaymentEligibilityContext,
 discount: PaymentDiscountRow
): DiscountAvailability {
 if (!rules) return { eligible: false, reason: "未設定自組規則" }
 const count = ctx.batchMemberCount ?? 1
 if (count < rules.minGroupSize) {
  return { eligible: false, reason: `需至少 ${rules.minGroupSize} 人同時報讀（目前 ${count} 人）` }
 }
 if (rules.requireJointPayment && count < rules.minGroupSize) {
  return { eligible: false, reason: "需聯合收費同時付款" }
 }
 for (const line of ctx.lines) {
  if (rules.requireEnrollmentPeriod && !periodMeetsMinimum(line.enrollmentPeriod, rules.requireEnrollmentPeriod as EnrollmentPeriod)) {
   return { eligible: false, reason: `需報讀「${rules.requireEnrollmentPeriod}」` }
  }
  if (rules.requireCourseMode && line.courseMode !== rules.requireCourseMode) {
   return { eligible: false, reason: "僅適用暑期兩期課程" }
  }
 }
 if (rules.requireSameClassId) {
  const classIds = [...new Set(ctx.lines.map((l) => l.classId))]
  if (ctx.batchSharedClassId) {
   if (classIds.length !== 1 || classIds[0] !== ctx.batchSharedClassId) {
    return { eligible: false, reason: "聯合收費需全員同一班" }
   }
  } else if (classIds.length !== 1) {
   return { eligible: false, reason: "需全員報讀同一班" }
  }
 }
 const amount = rules.amountOffPerStudent > 0 ? rules.amountOffPerStudent : discount.amountOff ?? 0
 return { eligible: true, reason: null, resolvedAmountOff: amount }
}

export function resolveDiscountAmountOff(
 discount: PaymentDiscountRow,
 ctx: PaymentEligibilityContext
): number {
 if (isLessonTierKind(discount.discountKind)) {
  const tier = resolveLessonTierAmount(discount.lessonTiers, ctx.tierTotalLessons)
  return tier.amountOff
 }
 if (discount.discountKind === "group_class") {
  const g = parseGroupEnrollmentRules(discount.groupEnrollmentRules)
  const amt = g?.amountOffPerStudent ?? discount.amountOff ?? 0
  return amt > 0 ? amt : 0
 }
 if (discount.isLabelOnly) return 0
 return discount.amountOff ?? 0
}

export function evaluateEligibilityRules(
 rules: PaymentDiscountEligibilityRules | null | undefined,
 ctx: PaymentEligibilityContext,
 discount?: PaymentDiscountRow
): DiscountAvailability {
 if (rules?.requireNewStudent && ctx.isNewStudent === false) {
  return { eligible: false, reason: "僅適用首次報讀明學之新生" }
 }
 if (rules?.requireNewStudent && ctx.isNewStudent !== true) {
  return { eligible: false, reason: "需為首次報讀明學之新生" }
 }

 if (rules?.minSubjectCount != null && ctx.subjectCount < rules.minSubjectCount) {
  return {
   eligible: false,
   reason: `需至少 ${rules.minSubjectCount} 科（目前 ${ctx.subjectCount} 科）`,
  }
 }

 const lessonsForMin = rules?.familyLessonPool?.aggregateSiblingLessons
  ? ctx.tierTotalLessons
  : ctx.totalLessons

 if (rules?.minTotalLessons != null && lessonsForMin < rules.minTotalLessons) {
  return {
   eligible: false,
   reason: `需至少 ${rules.minTotalLessons} 堂（目前 ${lessonsForMin} 堂）`,
  }
 }

 if (rules?.minEnrollmentPeriodPerLine) {
  for (const line of ctx.lines) {
   if (!periodMeetsMinimum(line.enrollmentPeriod, rules.minEnrollmentPeriodPerLine)) {
    return { eligible: false, reason: `每科需至少報讀一期` }
   }
  }
 }

 if (rules?.requireOneFromEachGroup?.length) {
  for (const groupRule of rules.requireOneFromEachGroup) {
   const has = ctx.lines.some((line) => lineMatchesCategoryGroup(line, groupRule))
   if (!has) {
    return {
     eligible: false,
     reason: `需包含${groupRule.label ? `「${groupRule.label}」` : "指定分組"}科目`,
    }
   }
  }
 }

 const required = normalizeCodeList(rules?.requiredSubjectCodes ?? [])
 const missing = required.filter((c) => !ctx.subjectCodes.includes(c))
 if (missing.length > 0) {
  return { eligible: false, reason: `需包含科目：${subjectCodesLabel(missing)}` }
 }

 const anyOf = normalizeCodeList(rules?.requireAnySubjectCodes ?? [])
 if (anyOf.length > 0 && !anyOf.some((c) => ctx.subjectCodes.includes(c))) {
  return { eligible: false, reason: `需另外包含以下其中一科：${subjectCodesLabel(anyOf)}` }
 }

 if (discount && isLessonTierKind(discount.discountKind)) {
  const tier = resolveLessonTierAmount(discount.lessonTiers, ctx.tierTotalLessons)
  if (!tier.eligible) return { eligible: false, reason: tier.reason }
  return { eligible: true, reason: null, resolvedAmountOff: tier.amountOff }
 }

 return { eligible: true, reason: null, resolvedAmountOff: discount ? resolveDiscountAmountOff(discount, ctx) : undefined }
}

export function summarizeEligibilityRules(
 rules: PaymentDiscountEligibilityRules | null | undefined
): string | null {
 if (!rules) return null
 const parts: string[] = []
 if (rules.minSubjectCount != null) parts.push(`≥${rules.minSubjectCount}科`)
 if (rules.minTotalLessons != null) parts.push(`≥${rules.minTotalLessons}堂`)
 if (rules.requireOneFromEachGroup?.length) {
  parts.push(rules.requireOneFromEachGroup.map((g) => g.label ?? g.group ?? "分組").join("+"))
 }
 if (rules.minEnrollmentPeriodPerLine) parts.push(`每科≥${rules.minEnrollmentPeriodPerLine}`)
 if (rules.requireNewStudent) parts.push("新生")
 if (rules.familyLessonPool?.aggregateSiblingLessons) parts.push("可合計兄弟姊妹堂數")
 if (rules.requiredSubjectCodes?.length) parts.push(`含 ${subjectCodesLabel(rules.requiredSubjectCodes)}`)
 if (rules.requireAnySubjectCodes?.length) {
  parts.push(`另含 ${subjectCodesLabel(rules.requireAnySubjectCodes)} 之一`)
 }
 return parts.length > 0 ? parts.join("；") : null
}

export function evaluateDiscountAvailability(
 discount: PaymentDiscountRow,
 ctx: PaymentEligibilityContext,
 opts?: { asOfDate?: string; academicYear?: string | null }
): DiscountAvailability {
 if (!discount.isActive) return { eligible: false, reason: "優惠已停用" }
 if (
  !isDiscountInEffect(discount, {
   asOfDate: opts?.asOfDate,
   academicYear: opts?.academicYear ?? null,
  })
 ) {
  return { eligible: false, reason: "不在有效期或學年範圍內" }
 }

 if (discount.discountKind === "group_class") {
  const base = evaluateEligibilityRules(discount.eligibilityRules, ctx, discount)
  if (!base.eligible) return base
  const gRules = parseGroupEnrollmentRules(discount.groupEnrollmentRules)
  return evaluateGroupClassRules(gRules, ctx, discount)
 }

 if (discount.discountKind === "referral_referee" || discount.discountKind === "referral_referrer_cash") {
  if (!ctx.referrerStudentId) {
   return { eligible: false, reason: "請選擇推薦人" }
  }
 }

 const result = evaluateEligibilityRules(discount.eligibilityRules, ctx, discount)
 if (!result.eligible) return result

 const amount = resolveDiscountAmountOff(discount, ctx)
 if (discount.discountKind === "referral_referrer_cash") {
  return { eligible: true, reason: null, resolvedAmountOff: discount.amountOff ?? 100 }
 }
 if (!discount.isLabelOnly && amount <= 0 && !isLessonTierKind(discount.discountKind)) {
  return { eligible: false, reason: "減免金額為 0" }
 }
 return { ...result, resolvedAmountOff: amount }
}

export type { DiscountKind, GroupEnrollmentRules, LessonTiersConfig }
