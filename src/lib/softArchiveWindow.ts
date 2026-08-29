import { academicYearLabelFromStartDate } from "@/lib/courseCode"
import { academicYearOrderKey } from "@/lib/academicYearAccess"

/** 日常營運窗須覆蓋的常規學年數（連帶其間及較舊常規之前的一個暑期）。 */
export const OPS_REGULAR_YEAR_SPAN = 2

export type SoftArchiveWindow = "ops" | "compliance"

export type AcademicYearWindowInput = {
 label: string
 is_current?: boolean | null
 start_date?: string | null
 end_date?: string | null
}

function localYmd(d = new Date()): string {
 const y = d.getFullYear()
 const m = String(d.getMonth() + 1).padStart(2, "0")
 const day = String(d.getDate()).padStart(2, "0")
 return `${y}-${m}-${day}`
}

export function isRegularAcademicYearLabel(label: string): boolean {
 return /^\d{4}$/.test(label.trim())
}

function normalizeLabel(label: string): string {
 return label.trim()
}

/**
 * 目前學年：優先「asOf 落在 start–end」，否則 `is_current`，再否則由日期推 label。
 */
export function resolveCurrentAcademicYearLabel(
 years: AcademicYearWindowInput[],
 asOfYmd?: string | null
): string | null {
 const ymd = (asOfYmd ?? "").trim().slice(0, 10) || localYmd()
 const inRange = years.find((y) => {
  const start = (y.start_date ?? "").slice(0, 10)
  const end = (y.end_date ?? "").slice(0, 10)
  return Boolean(start && end && start <= ymd && ymd <= end)
 })
 if (inRange) return normalizeLabel(inRange.label)
 const flagged = years.find((y) => y.is_current)
 if (flagged) return normalizeLabel(flagged.label)
 const inferred = academicYearLabelFromStartDate(ymd)
 const match = years.find((y) => normalizeLabel(y.label) === inferred)
 return match ? normalizeLabel(match.label) : null
}

/**
 * 保留窗內的學年 label（已排序）。
 *
 * - `ops`：目前學年往前覆蓋兩個常規學年，並納入較舊常規之前的一個暑期。
 *   例：目前 `2627` → `25SM`、`2526`、`26SM`、`2627`（不含更早、亦不含未來）。
 * - `compliance`：傳入清單的全部 label（庫內不刪；由呼叫端決定要撈幾多列）。
 */
export function listRetainedAcademicYearLabels(
 years: AcademicYearWindowInput[],
 window: SoftArchiveWindow = "ops",
 asOfYmd?: string | null
): string[] {
 const sorted = [...years]
  .map((y) => ({ ...y, label: normalizeLabel(y.label) }))
  .filter((y) => y.label.length > 0)
  .sort((a, b) => academicYearOrderKey(a.label) - academicYearOrderKey(b.label))

 if (window === "compliance") return sorted.map((y) => y.label)
 if (sorted.length === 0) return []

 const currentLabel = resolveCurrentAcademicYearLabel(sorted, asOfYmd)
 let currentIdx = currentLabel ? sorted.findIndex((y) => y.label === currentLabel) : -1
 if (currentIdx < 0) currentIdx = sorted.length - 1

 let regulars = 0
 let startIdx = currentIdx
 for (let i = currentIdx; i >= 0; i--) {
  startIdx = i
  if (isRegularAcademicYearLabel(sorted[i].label)) regulars += 1
  if (regulars >= OPS_REGULAR_YEAR_SPAN) break
 }
 if (startIdx > 0 && !isRegularAcademicYearLabel(sorted[startIdx - 1].label)) {
  startIdx -= 1
 }

 return sorted.slice(startIdx, currentIdx + 1).map((y) => y.label)
}
