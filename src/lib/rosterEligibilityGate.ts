import { academicYearOrderKey } from "@/lib/academicYearAccess"

/** 正規學年自此 label（含）起走權益池＋宣告點名路徑 */
export const ENTITLEMENT_ROSTER_FROM_LABEL = "2627"

/**
 * 學年硬閘：是否使用權益池／到課宣告作正式點名資格。
 * - 暑期 `*SM`：一律舊路徑（本輪不切）
 * - 正規：orderKey >= 2627 → 新路徑
 * - 缺 label：舊路徑（安全預設）
 */
export function usesEntitlementRosterModel(
 academicYearLabel: string | null | undefined
): boolean {
 const label = (academicYearLabel ?? "").trim()
 if (!label) return false
 if (/^\d{2}SM$/i.test(label)) return false
 return academicYearOrderKey(label) >= academicYearOrderKey(ENTITLEMENT_ROSTER_FROM_LABEL)
}
