/** 26SM 起（2026-07-01）前台可編輯；2526 及更早唯讀 */
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
