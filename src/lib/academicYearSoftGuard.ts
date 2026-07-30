import { academicYearLabelFromStartDate } from "@/lib/courseCode"
import { getNextAcademicYearLabel } from "@/lib/academicYearAccess"
import type { ConfirmOptions, ConfirmResult } from "@/lib/appConfirm"
import { logMgmtAuditAction } from "@/services/mgmtGodViewQueries"

function normalizeLabel(label: string | null | undefined): string {
 return (label ?? "").trim().toUpperCase()
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
 dateYmd?: string | null
 source: string
}): void {
 const label = resolveAcademicYearLabelForSoftGuard(opts)
 if (!isOutsideCurrentOrNextAcademicYear(label)) return
 void logMgmtAuditAction({
  action: "non_current_academic_year_write",
  detail: JSON.stringify({
   academicYearLabel: label,
   dateYmd: opts.dateYmd?.slice(0, 10) ?? null,
   source: opts.source,
  }),
 })
}

/**
 * UI：非目前／下一學年寫入前確認。
 * @returns true＝可繼續；false＝使用者取消
 */
export async function confirmNonCurrentAcademicYearWrite(
 confirmDialog: (options: ConfirmOptions) => Promise<ConfirmResult>,
 opts: { label?: string | null; dateYmd?: string | null; source: string }
): Promise<boolean> {
 const label = resolveAcademicYearLabelForSoftGuard(opts)
 if (!isOutsideCurrentOrNextAcademicYear(label)) return true
 const result = await confirmDialog({
  title: "修改非當期學年資料",
  description: `你正在修改「${label}」學年資料（非目前或下一學年）。確定繼續？`,
  confirmText: "確定修改",
  cancelText: "取消",
  tone: "warning",
 })
 if (result !== true) return false
 void logMgmtAuditAction({
  action: "non_current_academic_year_write_confirmed",
  detail: JSON.stringify({
   academicYearLabel: label,
   dateYmd: opts.dateYmd?.slice(0, 10) ?? null,
   source: opts.source,
  }),
 })
 return true
}
