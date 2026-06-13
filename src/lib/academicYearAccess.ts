import { academicYearLabelFromStartDate } from "@/lib/courseCode"

/** 26SM 起（2026-07-01）前台可編輯；2526 及更早唯讀（teacher 等角色） */
export const ACADEMIC_YEAR_EDITABLE_FROM_YMD = "2026-07-01"

const EDITABLE_ORDER_FROM = 26 * 1000 + 500

/** 學年 label 排序鍵（2526 < 26SM < 2627） */
export function academicYearOrderKey(label: string): number {
 const t = label.trim()
 if (/^\d{2}SM$/i.test(t)) {
  return parseInt(t.slice(0, 2), 10) * 1000 + 500
 }
 if (/^\d{4}$/.test(t)) {
  return parseInt(t.slice(0, 2), 10) * 1000 + 900
 }
 return 0
}

export function isAcademicYearLabelBeforeEditableCutoff(label: string | null | undefined): boolean {
 if (!label?.trim()) return false
 return academicYearOrderKey(label) < EDITABLE_ORDER_FROM
}

function normalizeYearLabel(label: string | null | undefined): string {
 return (label ?? "").trim().toUpperCase()
}

/** 2526 → 26SM；26SM → 2627 */
export function getNextAcademicYearLabel(label: string): string | null {
 const t = label.trim()
 if (/^\d{4}$/.test(t)) {
  const yy = parseInt(t.slice(0, 2), 10)
  if (!Number.isFinite(yy)) return null
  return `${String(yy).padStart(2, "0")}SM`
 }
 if (/^\d{2}SM$/i.test(t)) {
  const yy = parseInt(t.slice(0, 2), 10)
  if (!Number.isFinite(yy)) return null
  return `${String(yy).padStart(2, "0")}${String(yy + 1).padStart(2, "0")}`
 }
 return null
}

/** 管理員可編輯：以 referenceYmd 推算的目前學年，及其下一學年 */
export function isAdminEditableAcademicYearLabel(
 label: string | null | undefined,
 referenceYmd?: string | null
): boolean {
 if (!label?.trim()) return true
 const normalized = normalizeYearLabel(label)
 const current = normalizeYearLabel(academicYearLabelFromStartDate(referenceYmd ?? null))
 if (normalized === current) return true
 const next = getNextAcademicYearLabel(current)
 return !!next && normalized === normalizeYearLabel(next)
}

/** 依結束日或 label 判斷是否為已過、不可編輯的學年 */
export function isClosedAcademicYear(
 endDate: string | null | undefined,
 label?: string | null | undefined
): boolean {
 const end = endDate?.slice(0, 10)
 if (end) return end < ACADEMIC_YEAR_EDITABLE_FROM_YMD
 if (label) return isAcademicYearLabelBeforeEditableCutoff(label)
 return false
}
