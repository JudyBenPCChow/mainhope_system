import { normalizeGradeCode } from "@/lib/courseCode"
import { formatStudentGrade } from "@/lib/studentGrade"

/** 課程模板 grade_code（如 S1）→ 班別年級標籤（如「中一」） */
export function gradeLabelFromCourseCode(gradeCode: string | null | undefined): string | null {
 if (!gradeCode?.trim()) return null
 const label = formatStudentGrade(normalizeGradeCode(gradeCode))
 return label && label !== "—" ? label : null
}

/** 班別年級：優先使用已儲存 grade，否則由課程模板 grade_code 推導 */
export function resolveClassGradeLabels(
 grade: string[] | null | undefined,
 gradeCode: string | null | undefined
): string[] {
 const stored = [...new Set((grade ?? []).map((g) => String(g).trim()).filter(Boolean))]
 if (stored.length > 0) return stored
 const fromCourse = gradeLabelFromCourseCode(gradeCode)
 return fromCourse ? [fromCourse] : []
}

export function classGradeDisplayText(
 grade: string[] | null | undefined,
 gradeCode: string | null | undefined
): string {
 const labels = resolveClassGradeLabels(grade, gradeCode)
 return labels.length > 0 ? labels.join("、") : "—"
}
