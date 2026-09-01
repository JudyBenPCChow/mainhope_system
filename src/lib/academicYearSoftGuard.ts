import { academicYearLabelFromStartDate } from "@/lib/courseCode"
import { getNextAcademicYearLabel } from "@/lib/academicYearAccess"
import type { ConfirmOptions, ConfirmResult } from "@/lib/appConfirm"
import { logMgmtAuditAction } from "@/services/mgmtGodViewQueries"

function normalizeLabel(label: string | null | undefined): string {
 return (label ?? "").trim().toUpperCase()
}

function uniqueYearLabels(labels: Array<string | null | undefined>): string[] {
 const seen = new Set<string>()
 const out: string[] = []
 for (const raw of labels) {
  const t = (raw ?? "").trim()
  if (!t) continue
  const key = normalizeLabel(t)
  if (seen.has(key)) continue
  seen.add(key)
  out.push(t)
 }
 return out
}

function labelsFromCoverageStartMonths(
 months: Array<string | null | undefined> | undefined
): string[] {
 const out: string[] = []
 for (const raw of months ?? []) {
  const ym = (raw ?? "").trim().slice(0, 7)
  if (!/^\d{4}-\d{2}$/.test(ym)) continue
  out.push(academicYearLabelFromStartDate(`${ym}-01`))
 }
 return uniqueYearLabels(out)
}

/** 由 label 或日期推算學年（供 soft guard） */
export function resolveAcademicYearLabelForSoftGuard(opts: {
 label?: string | null
 dateYmd?: string | null
}): string | null {
 const fromLabel = (opts.label ?? "").trim()
 if (fromLabel) return fromLabel
 const ymd = opts.dateYmd?.trim().slice(0, 10)
 if (ymd) return academicYearLabelFromStartDate(ymd)
 return null
}

/**
 * 繳費單據防呆學年：跟明細班別，其次功輔覆蓋月；有班別但無學年（私人課程）不靠收款日。
 * 只在完全沒有明細班別時，才用收款日推算。
 */
export function academicYearLabelsForPaymentGuard(opts: {
 classYearLabels?: Array<string | null | undefined>
 coverageStartMonths?: Array<string | null | undefined>
 paymentDateYmd?: string | null
 hasClassLines?: boolean
}): string[] {
 const fromClass = uniqueYearLabels(opts.classYearLabels ?? [])
 if (fromClass.length > 0) return fromClass
 const fromCoverage = labelsFromCoverageStartMonths(opts.coverageStartMonths)
 if (fromCoverage.length > 0) return fromCoverage
 const hasLines =
  opts.hasClassLines === true || (opts.classYearLabels?.length ?? 0) > 0
 if (hasLines) return []
 const fromDate = resolveAcademicYearLabelForSoftGuard({
  dateYmd: opts.paymentDateYmd,
 })
 return uniqueYearLabels([fromDate])
}

function resolveGuardLabels(opts: {
 label?: string | null
 labels?: string[] | null
 dateYmd?: string | null
}): string[] {
 if (opts.labels != null) return uniqueYearLabels(opts.labels)
 return uniqueYearLabels([
  resolveAcademicYearLabelForSoftGuard({
   label: opts.label,
   dateYmd: opts.dateYmd,
  }),
 ])
}

/**
 * 是否「非目前／非下一學年」——需 confirm＋audit。
 * 空 label 不當歷史（避免舊資料動輒彈窗）。
 */
export function isOutsideCurrentOrNextAcademicYear(label: string | null | undefined): boolean {
 const n = normalizeLabel(label)
 if (!n) return false
 const current = normalizeLabel(academicYearLabelFromStartDate(null))
 if (n === current) return false
 const next = getNextAcademicYearLabel(current)
 if (next && n === normalizeLabel(next)) return false
 return true
}

/** 服務層／UI：非當期寫入稽核標記（不擋主流程） */
export function noteNonCurrentAcademicYearWrite(opts: {
 label?: string | null
 labels?: string[] | null
 dateYmd?: string | null
 source: string
}): void {
 const outside = resolveGuardLabels(opts).filter(isOutsideCurrentOrNextAcademicYear)
 if (outside.length === 0) return
 const shown = outside.join("、")
 void logMgmtAuditAction({
  action: "non_current_academic_year_write",
  detail: JSON.stringify({
   academicYearLabel: shown,
   dateYmd: opts.dateYmd?.slice(0, 10) ?? null,
   source: opts.source,
  }),
 })
}

/**
 * UI：非目前／下一學年寫入前確認。
 * 傳 `labels`（即使空陣列）時以該組為準，不再用 `dateYmd` 推算。
 * @returns true＝可繼續；false＝使用者取消
 */
export async function confirmNonCurrentAcademicYearWrite(
 confirmDialog: (options: ConfirmOptions) => Promise<ConfirmResult>,
 opts: {
  label?: string | null
  labels?: string[] | null
  dateYmd?: string | null
  source: string
 }
): Promise<boolean> {
 const outside = resolveGuardLabels(opts).filter(isOutsideCurrentOrNextAcademicYear)
 if (outside.length === 0) return true
 const shown = outside.join("、")
 const result = await confirmDialog({
  title: "修改非當期學年資料",
  description: `你正在修改「${shown}」學年資料（非目前或下一學年）。確定繼續？`,
  confirmText: "確定修改",
  cancelText: "取消",
  tone: "warning",
 })
 if (result !== true) return false
 void logMgmtAuditAction({
  action: "non_current_academic_year_write_confirmed",
  detail: JSON.stringify({
   academicYearLabel: shown,
   dateYmd: opts.dateYmd?.slice(0, 10) ?? null,
   source: opts.source,
  }),
 })
 return true
}
