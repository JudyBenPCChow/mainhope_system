import { academicYearLabelFromStartDate } from "@/lib/courseCode"
import {
 noteNonCurrentAcademicYearWrite,
} from "@/lib/academicYearSoftGuard"

export function academicYearLabelForClass(c: {
 academic_year_label?: string | null
 start_date?: string | null
}): string {
 const fromDb = (c.academic_year_label ?? "").trim()
 if (fromDb) return fromDb
 return academicYearLabelFromStartDate(c.start_date)
}

/**
 * @deprecated 硬鎖已撤銷；恒為可編輯。非當期防呆見 `confirmNonCurrentAcademicYearWrite`。
 */
export function canEditAcademicYear(
 _label: string | null | undefined,
 _endDate?: string | null
): boolean {
 return true
}

/** @deprecated 硬鎖已撤銷；恒為可編輯。 */
export function canEditAcademicYearForDate(_ymd: string | null | undefined): boolean {
 return true
}

/** @deprecated 硬鎖已撤；勿再用於擋寫入。 */
export function academicYearEditBlockedMessage(): string {
 return "此學年資料仍可修改；若非目前或下一學年，儲存前會要求確認。"
}

/** @deprecated 硬鎖已撤；恒回 null。 */
export function guardAcademicYearEdit(
 _label: string | null | undefined,
 _endDate?: string | null
): string | null {
 return null
}

/** @deprecated 硬鎖已撤；恒回 null。 */
export function guardAcademicYearEditForDate(_ymd: string | null | undefined): string | null {
 return null
}

export function guardClassRecordEdit(_c: {
 academic_year_label?: string | null
 start_date?: string | null
}): string | null {
 return null
}

/**
 * 服務層：不再拋錯。若屬非目前／下一學年，寫入稽核標記。
 */
export function assertAcademicYearEditable(
 label: string | null | undefined,
 _endDate?: string | null
): void {
 noteNonCurrentAcademicYearWrite({ label, source: "assertAcademicYearEditable" })
}

export function assertAcademicYearEditableForDate(ymd: string | null | undefined): void {
 noteNonCurrentAcademicYearWrite({
  dateYmd: ymd,
  source: "assertAcademicYearEditableForDate",
 })
}

export function assertClassRecordEditable(c: {
 academic_year_label?: string | null
 start_date?: string | null
}): void {
 noteNonCurrentAcademicYearWrite({
  label: academicYearLabelForClass(c),
  source: "assertClassRecordEditable",
 })
}
