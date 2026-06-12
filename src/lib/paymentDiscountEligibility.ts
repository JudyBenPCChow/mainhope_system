import type { PaymentDiscountRow } from "@/services/paymentDiscountQueries"
import { isDiscountInEffect } from "@/services/paymentDiscountQueries"

/** 儲存於 payment_discounts.eligibility_rules */
export type PaymentDiscountEligibilityRules = {
 /** 至少幾科（依本次繳費明細不重複科目計） */
 minSubjectCount?: number | null
 /** 至少幾堂（各列 lesson 加總） */
 minTotalLessons?: number | null
 /** 必須全部包含的科目代碼（subjects.code，如 CHI） */
 requiredSubjectCodes?: string[] | null
 /** 除 required 外，至少再包含其中一科的科目代碼 */
 requireAnySubjectCodes?: string[] | null
}

export type PaymentEligibilityLine = {
 classId: string
 subjectCode: string
 lessons: number
}

export type PaymentEligibilityContext = {
 subjectCount: number
 totalLessons: number
 /** 不重複科目代碼（大寫） */
 subjectCodes: string[]
 lines: PaymentEligibilityLine[]
}

export type DiscountAvailability = {
 eligible: boolean
 reason: string | null
}

function normalizeSubjectCode(code: string): string {
 return code.trim().toUpperCase()
}

function normalizeCodeList(codes: string[] | null | undefined): string[] {
 if (!codes?.length) return []
 return [...new Set(codes.map(normalizeSubjectCode).filter(Boolean))]
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
  rules.requiredSubjectCodes = normalizeCodeList(
   r.required_subject_codes.map((x) => String(x))
  )
 }
 if (Array.isArray(r.require_any_subject_codes)) {
  rules.requireAnySubjectCodes = normalizeCodeList(
   r.require_any_subject_codes.map((x) => String(x))
  )
 }
 const hasRule =
  rules.minSubjectCount != null ||
  rules.minTotalLessons != null ||
  (rules.requiredSubjectCodes?.length ?? 0) > 0 ||
  (rules.requireAnySubjectCodes?.length ?? 0) > 0
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
 return Object.keys(payload).length > 0 ? payload : null
}

export function subjectCodesLabel(codes: string[]): string {
 return codes.join("、")
}

/** 由繳費表單 lines + 報讀資料建立資格上下文 */
export function buildPaymentEligibilityContext(
 lines: Array<{ classId: string; lessons: string | number }>,
 resolveSubjectCode: (classId: string) => string | null
): PaymentEligibilityContext {
 const paymentLines: PaymentEligibilityLine[] = []
 for (const line of lines) {
  const classId = line.classId?.trim()
  if (!classId) continue
  const lessonsN = Number(line.lessons)
  if (!Number.isFinite(lessonsN) || lessonsN <= 0) continue
  const subjectCode = resolveSubjectCode(classId)
  if (!subjectCode) continue
  paymentLines.push({
   classId,
   subjectCode: normalizeSubjectCode(subjectCode),
   lessons: lessonsN,
  })
 }
 const subjectCodes = [...new Set(paymentLines.map((l) => l.subjectCode))]
 const totalLessons = paymentLines.reduce((s, l) => s + l.lessons, 0)
 return {
  subjectCount: subjectCodes.length,
  totalLessons,
  subjectCodes,
  lines: paymentLines,
 }
}

export function evaluateEligibilityRules(
 rules: PaymentDiscountEligibilityRules | null | undefined,
 ctx: PaymentEligibilityContext
): DiscountAvailability {
 if (!rules) return { eligible: true, reason: null }

 if (rules.minSubjectCount != null && ctx.subjectCount < rules.minSubjectCount) {
  return {
   eligible: false,
   reason: `需至少 ${rules.minSubjectCount} 科（目前 ${ctx.subjectCount} 科）`,
  }
 }

 if (rules.minTotalLessons != null && ctx.totalLessons < rules.minTotalLessons) {
  return {
   eligible: false,
   reason: `需至少 ${rules.minTotalLessons} 堂（目前 ${ctx.totalLessons} 堂）`,
  }
 }

 const required = normalizeCodeList(rules.requiredSubjectCodes ?? [])
 const missing = required.filter((c) => !ctx.subjectCodes.includes(c))
 if (missing.length > 0) {
  return {
   eligible: false,
   reason: `需包含科目：${subjectCodesLabel(missing)}`,
  }
 }

 const anyOf = normalizeCodeList(rules.requireAnySubjectCodes ?? [])
 if (anyOf.length > 0) {
  const hasAny = anyOf.some((c) => ctx.subjectCodes.includes(c))
  if (!hasAny) {
   return {
    eligible: false,
    reason: `需另外包含以下其中一科：${subjectCodesLabel(anyOf)}`,
   }
  }
 }

 return { eligible: true, reason: null }
}

/** 管理列表用：簡述資格條件 */
export function summarizeEligibilityRules(
 rules: PaymentDiscountEligibilityRules | null | undefined
): string | null {
 if (!rules) return null
 const parts: string[] = []
 if (rules.minSubjectCount != null) parts.push(`≥${rules.minSubjectCount}科`)
 if (rules.minTotalLessons != null) parts.push(`≥${rules.minTotalLessons}堂`)
 if (rules.requiredSubjectCodes?.length) {
  parts.push(`含 ${subjectCodesLabel(rules.requiredSubjectCodes)}`)
 }
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
 if (!discount.isActive) {
  return { eligible: false, reason: "優惠已停用" }
 }
 if (
  !isDiscountInEffect(discount, {
   asOfDate: opts?.asOfDate,
   academicYear: opts?.academicYear ?? null,
  })
 ) {
  return { eligible: false, reason: "不在有效期或學年範圍內" }
 }
 return evaluateEligibilityRules(discount.eligibilityRules, ctx)
}
