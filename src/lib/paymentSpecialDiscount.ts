/** 收款臨時減免定顯示名（行政不可自訂） */
export const SPECIAL_DISCOUNT_LABEL = "Special discount"

export function normalizeSpecialDiscountAmount(raw: unknown): number {
 const n = typeof raw === "number" ? raw : Number(raw)
 if (!Number.isFinite(n) || n <= 0) return 0
 return Math.round(n * 100) / 100
}
