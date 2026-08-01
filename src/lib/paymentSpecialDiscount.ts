/**
 * 僅用於「目錄以外」的臨時減免顯示名（行政不可自訂）。
 * 優惠目錄內的規則優惠仍顯示各自原名，不可一律改為此字串。
 */
export const SPECIAL_DISCOUNT_LABEL = "Special discount"

export function normalizeSpecialDiscountAmount(raw: unknown): number {
 const n = typeof raw === "number" ? raw : Number(raw)
 if (!Number.isFinite(n) || n <= 0) return 0
 return Math.round(n * 100) / 100
}
