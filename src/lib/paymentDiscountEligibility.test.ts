import { describe, expect, it } from "vitest"

import {
 buildPaymentEligibilityContext,
 evaluateEligibilityRules,
 resolveDiscountAmountOff,
 type PaymentDiscountEligibilityRules,
 type PaymentEligibilityContext,
} from "@/lib/paymentDiscountEligibility"
import {
 applyDiscountToSubtotal,
 computeDiscountApplicationsForContext,
 type PaymentDiscountRow,
} from "@/services/paymentDiscountQueries"

function discount(partial: Partial<PaymentDiscountRow> & Pick<PaymentDiscountRow, "id" | "name">): PaymentDiscountRow {
 return {
  description: null,
  discountKind: "fixed_amount",
  percentOff: null,
  amountOff: null,
  isActive: true,
  sortOrder: 0,
  validFrom: null,
  validTo: null,
  academicYear: null,
  stackGroup: null,
  maxStackCount: null,
  isLabelOnly: false,
  lessonTiers: null,
  groupEnrollmentRules: null,
  eligibilityRules: null,
  createdAt: "",
  updatedAt: "",
  ...partial,
 }
}

function contextFor(
 subjectCodes: string[],
 opts?: { isNewStudent?: boolean; lessonsEach?: number }
): PaymentEligibilityContext {
 const lessonsEach = opts?.lessonsEach ?? 8
 return buildPaymentEligibilityContext(
  subjectCodes.map((subjectCode, index) => ({
   classId: `class-${index}`,
   lessons: lessonsEach,
   subjectCode,
   enrollmentPeriod: "兩期全報",
   courseMode: "regular",
  })),
  undefined,
  { isNewStudent: opts?.isNewStudent }
 )
}

describe("evaluateEligibilityRules", () => {
 it("非新生不符合新生條件", () => {
  const rules: PaymentDiscountEligibilityRules = { requireNewStudent: true }
  const result = evaluateEligibilityRules(
   rules,
   contextFor(["CHI"], { isNewStudent: false }),
   discount({ id: "new", name: "新生優惠", amountOff: 200, eligibilityRules: rules })
  )
  expect(result.eligible).toBe(false)
  expect(result.reason).toBe("僅適用首次報讀明學之新生")
  expect(result.resolvedAmountOff).toBeUndefined()
 })

 it("尚未標明是否新生時，新生優惠不合格", () => {
  const rules: PaymentDiscountEligibilityRules = { requireNewStudent: true }
  const result = evaluateEligibilityRules(rules, contextFor(["CHI"]), discount({ id: "new", name: "新生優惠", amountOff: 200 }))
  expect(result.eligible).toBe(false)
  expect(result.reason).toBe("需為首次報讀明學之新生")
  expect(result.resolvedAmountOff).toBeUndefined()
 })

 it("科目數不足時不合格", () => {
  const rules: PaymentDiscountEligibilityRules = { minSubjectCount: 2 }
  const ctx = contextFor(["CHI"])
  expect(ctx.subjectCount).toBe(1)
  const result = evaluateEligibilityRules(rules, ctx, discount({ id: "two", name: "兩科優惠", amountOff: 200 }))
  expect(result.eligible).toBe(false)
  expect(result.reason).toBe("需至少 2 科（目前 1 科）")
  expect(result.resolvedAmountOff).toBeUndefined()
 })

 it("堂數不足時不合格", () => {
  const rules: PaymentDiscountEligibilityRules = { minTotalLessons: 16 }
  const ctx = contextFor(["CHI"], { lessonsEach: 8 })
  expect(ctx.totalLessons).toBe(8)
  const result = evaluateEligibilityRules(rules, ctx, discount({ id: "lessons", name: "堂數優惠", amountOff: 200 }))
  expect(result.eligible).toBe(false)
  expect(result.reason).toBe("需至少 16 堂（目前 8 堂）")
  expect(result.resolvedAmountOff).toBeUndefined()
 })

 it("新生與科目數只缺一項仍不合格", () => {
  const rules: PaymentDiscountEligibilityRules = { requireNewStudent: true, minSubjectCount: 2 }
  const notNew = evaluateEligibilityRules(
   rules,
   contextFor(["CHI", "ENG"], { isNewStudent: false }),
   discount({ id: "combo", name: "新生兩科", amountOff: 200 })
  )
  expect(notNew.eligible).toBe(false)
  expect(notNew.reason).toBe("僅適用首次報讀明學之新生")

  const oneSubject = evaluateEligibilityRules(
   rules,
   contextFor(["CHI"], { isNewStudent: true }),
   discount({ id: "combo", name: "新生兩科", amountOff: 200 })
  )
  expect(oneSubject.eligible).toBe(false)
  expect(oneSubject.reason).toBe("需至少 2 科（目前 1 科）")
 })

 it("新生且達科目數時合格，並帶出固定扣減額", () => {
  const rules: PaymentDiscountEligibilityRules = { requireNewStudent: true, minSubjectCount: 2 }
  const row = discount({ id: "combo", name: "新生兩科", amountOff: 200, eligibilityRules: rules })
  const ctx = contextFor(["CHI", "ENG"], { isNewStudent: true })
  const result = evaluateEligibilityRules(rules, ctx, row)
  expect(result).toEqual({ eligible: true, reason: null, resolvedAmountOff: 200 })
  expect(resolveDiscountAmountOff(row, ctx)).toBe(200)
 })
})

describe("優惠扣進小計", () => {
 it("符合資格的固定額會從小計扣減", () => {
  const rules: PaymentDiscountEligibilityRules = { requireNewStudent: true, minSubjectCount: 2 }
  const row = discount({ id: "combo", name: "新生兩科", amountOff: 200, eligibilityRules: rules })
  const ctx = contextFor(["CHI", "ENG"], { isNewStudent: true })
  expect(evaluateEligibilityRules(rules, ctx, row).eligible).toBe(true)

  expect(applyDiscountToSubtotal(1000, row, ctx)).toBe(800)
  expect(computeDiscountApplicationsForContext(1000, [row], ctx)).toEqual([
   { discountId: "combo", sortOrder: 0, amountDeducted: 200 },
  ])
 })

 it("只有百分比時按百分比扣，只有固定額時按金額扣", () => {
  const ctx = contextFor(["CHI"])
  const percentOnly = discount({ id: "pct", name: "百分比", percentOff: 20, amountOff: null })
  const fixedOnly = discount({ id: "fix", name: "固定額", percentOff: null, amountOff: 20 })

  expect(resolveDiscountAmountOff(percentOnly, ctx)).toBe(0)
  expect(applyDiscountToSubtotal(500, percentOnly, ctx)).toBe(400)
  expect(resolveDiscountAmountOff(fixedOnly, ctx)).toBe(20)
  expect(applyDiscountToSubtotal(500, fixedOnly, ctx)).toBe(480)
 })

 it("同一項優惠先百分比再固定額", () => {
  const ctx = contextFor(["CHI"])
  const row = discount({ id: "both", name: "百分比加固定額", percentOff: 10, amountOff: 100 })
  expect(resolveDiscountAmountOff(row, ctx)).toBe(100)
  // 1000 × 0.9 − 100 = 800。先減固定額再乘百分比會得到 810。
  expect(applyDiscountToSubtotal(1000, row, ctx)).toBe(800)
  expect(computeDiscountApplicationsForContext(1000, [row], ctx)).toEqual([
   { discountId: "both", sortOrder: 0, amountDeducted: 200 },
  ])
 })
})
