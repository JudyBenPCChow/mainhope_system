import { summarizeEligibilityRules } from "@/lib/paymentDiscountEligibility"
import { stackGroupsFromDiscount, type PaymentDiscountRow } from "@/services/paymentDiscountQueries"

/** 前台唯讀說明用短摘要（無資料時回傳 null，由 UI 顯示退路文案） */
export function summarizePaymentDiscountForAdmin(d: PaymentDiscountRow): {
 kindLabel: string
 eligibilityText: string | null
 stackText: string
 validityText: string
 descriptionText: string | null
} {
 const kindLabel =
  d.percentOff != null
   ? `${d.percentOff}% 折扣`
   : d.amountOff != null
    ? `減免 HKD ${d.amountOff}`
    : d.isLabelOnly
     ? "僅標示（不加價減）"
     : "見規則詳情"

 const groups = stackGroupsFromDiscount(d)
 const stackText =
  groups.length === 0
   ? "未設定互斥群組（是否可併用請向主管確認）"
   : `互斥群組：${groups.join("、")}${d.maxStackCount != null ? `；每單最多 ${d.maxStackCount} 項` : ""}`

 const validityParts: string[] = []
 if (d.validFrom || d.validTo) {
  validityParts.push(`有效期 ${d.validFrom ?? "—"} ～ ${d.validTo ?? "—"}`)
 }
 if (d.academicYear) validityParts.push(`學年：${d.academicYear}`)
 if (!d.isActive) validityParts.push("目前停用")
 const validityText = validityParts.length > 0 ? validityParts.join("；") : "未限定日期／學年"

 return {
  kindLabel,
  eligibilityText: summarizeEligibilityRules(d.eligibilityRules),
  stackText,
  validityText,
  descriptionText: d.description?.trim() || null,
 }
}
