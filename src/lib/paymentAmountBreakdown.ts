import {
 applyDiscountToSubtotal,
 computeDiscountApplicationsForContext,
 discountRowFromApplication,
 type PaymentDiscountRow,
} from "@/services/paymentDiscountQueries"
import type { PaymentEligibilityContext } from "@/lib/paymentDiscountEligibility"
import type { PaymentDiscountApplicationRow, PaymentFull } from "@/services/paymentQueries"

export type PaymentAmountLine = {
 key: string
 label: string
 amount: number
 tone?: "normal" | "deduction" | "total"
}

export type PaymentAmountBreakdown = {
 subtotal: number
 discountSteps: PaymentDiscountApplicationRow[]
 total: number
 lines: PaymentAmountLine[]
}

export function paymentSubtotalFromDetails(p: PaymentFull): number {
 let s = 0
 for (const d of p.details) {
  const a = d.amount
  if (a != null && Number.isFinite(a) && a > 0) s += a
 }
 return Math.round(s * 100) / 100
}

export function resolvePaymentSubtotal(p: PaymentFull): number {
 if (p.subtotalAmount != null && Number.isFinite(p.subtotalAmount) && p.subtotalAmount > 0) {
  return Math.round(p.subtotalAmount * 100) / 100
 }
 return paymentSubtotalFromDetails(p)
}

function discountStepLabel(d: Pick<PaymentDiscountApplicationRow, "name" | "percentOff" | "amountOff">): string {
 const bits = [d.name]
 if (d.percentOff != null && d.percentOff > 0) bits.push(`-${d.percentOff}%`)
 if (d.amountOff != null && d.amountOff > 0) bits.push(`-$${d.amountOff}`)
 return bits.join(" ")
}

/** 依儲存序號重建各優惠扣減（舊單若無 amount_deducted 則即時計算） */
export function buildDiscountSteps(
 subtotal: number,
 apps: PaymentDiscountApplicationRow[]
): PaymentDiscountApplicationRow[] {
 const ordered = [...apps].sort((a, b) => a.sortOrder - b.sortOrder)
 let running = subtotal
 return ordered.map((app, idx) => {
  const before = running
  const row = discountRowFromApplication(app, idx)
  const deductedStored = app.amountDeducted
  const after =
   deductedStored != null && Number.isFinite(deductedStored)
    ? Math.round((before - deductedStored) * 100) / 100
    : applyDiscountToSubtotal(before, row)
  const deducted =
   deductedStored != null && Number.isFinite(deductedStored)
    ? Math.round(deductedStored * 100) / 100
    : Math.round((before - after) * 100) / 100
  running = Math.round((before - deducted) * 100) / 100
  return { ...app, sortOrder: idx, amountDeducted: deducted }
 })
}

export function buildPaymentAmountBreakdown(p: PaymentFull): PaymentAmountBreakdown {
 const subtotal = resolvePaymentSubtotal(p)
 const discountSteps = buildDiscountSteps(subtotal, p.discountApplications)
 const lateFees = (p.lateFeeItems ?? []).filter((lf) => !lf.waived && lf.amount > 0)
 const total = Math.round(p.totalAmount * 100) / 100

 const lines: PaymentAmountLine[] = [{ key: "subtotal", label: "項目小計", amount: subtotal }]
 for (const step of discountSteps) {
  if ((step.amountDeducted ?? 0) <= 0) continue
  lines.push({
   key: `disc-${step.discountId ?? "special"}-${step.sortOrder}`,
   label: `優惠：${discountStepLabel(step)}`,
   amount: -(step.amountDeducted ?? 0),
   tone: "deduction",
  })
 }
 for (const lf of lateFees) {
  lines.push({
   key: `late-${lf.id}`,
   label: `逾期罰款 · ${lf.classLabel}`,
   amount: lf.amount,
  })
 }
 lines.push({ key: "total", label: "應繳總額", amount: total, tone: "total" })

 return { subtotal, discountSteps, total, lines }
}

/** 表單建立時，依選取順序與資格上下文計算各項扣減 */
export function computeDiscountApplicationsForSave(
 subtotal: number,
 discounts: PaymentDiscountRow[],
 ctx?: PaymentEligibilityContext
): Array<{ discountId: string; sortOrder: number; amountDeducted: number }> {
 if (ctx) return computeDiscountApplicationsForContext(subtotal, discounts, ctx)
 let running = subtotal
 return discounts.map((d, sortOrder) => {
  const before = running
  const after = applyDiscountToSubtotal(before, d)
  const amountDeducted = Math.round((before - after) * 100) / 100
  running = after
  return { discountId: d.id, sortOrder, amountDeducted }
 })
}
