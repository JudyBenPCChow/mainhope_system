import { academicYearLabelFromStartDate } from "@/lib/courseCode"
import { academicYearReadOnlyHint, isAcademicYearReadOnly } from "@/lib/mgmtRole"

export function academicYearLabelForClass(c: {
 academic_year_label?: string | null
 start_date?: string | null
}): string {
 const fromDb = (c.academic_year_label ?? "").trim()
 if (fromDb) return fromDb
 return academicYearLabelFromStartDate(c.start_date)
}

/** 此學年是否允許寫入（依角色與學年 label／結束日） */
export function canEditAcademicYear(
 label: string | null | undefined,
 endDate?: string | null
): boolean {
 return !isAcademicYearReadOnly(endDate, label)
}

/** 此日期所屬學年是否允許寫入 */
export function canEditAcademicYearForDate(ymd: string | null | undefined): boolean {
 if (!ymd?.trim()) return true
 return canEditAcademicYear(academicYearLabelFromStartDate(ymd.slice(0, 10)))
}

export function academicYearEditBlockedMessage(): string {
 return academicYearReadOnlyHint()
}

/** 不可寫入時回傳提示文字；可寫入則回傳 null */
export function guardAcademicYearEdit(
 label: string | null | undefined,
 endDate?: string | null
): string | null {
 if (canEditAcademicYear(label, endDate)) return null
 return academicYearEditBlockedMessage()
}

export function guardAcademicYearEditForDate(ymd: string | null | undefined): string | null {
 if (!ymd?.trim()) return null
 return guardAcademicYearEdit(academicYearLabelFromStartDate(ymd.slice(0, 10)))
}

export function guardClassRecordEdit(c: {
 academic_year_label?: string | null
 start_date?: string | null
}): string | null {
 return guardAcademicYearEdit(academicYearLabelForClass(c))
}

/** 服務層：不可寫入時拋錯 */
export function assertAcademicYearEditable(
 label: string | null | undefined,
 endDate?: string | null
): void {
 const blocked = guardAcademicYearEdit(label, endDate)
 if (blocked) throw new Error(blocked)
}

export function assertAcademicYearEditableForDate(ymd: string | null | undefined): void {
 const blocked = guardAcademicYearEditForDate(ymd)
 if (blocked) throw new Error(blocked)
}

export function assertClassRecordEditable(c: {
 academic_year_label?: string | null
 start_date?: string | null
}): void {
 const blocked = guardClassRecordEdit(c)
 if (blocked) throw new Error(blocked)
}
