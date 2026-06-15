import { normalizeGradeCode } from "@/lib/courseCode"
import { formatStudentGrade } from "@/lib/studentGrade"

/** 班別適用年級標準標籤（與表單選項一致，不含「其他」） */
export const CANONICAL_CLASS_GRADE_LABELS = [
 "小一",
 "小二",
 "小三",
 "小四",
 "小五",
 "小六",
 "中一",
 "中二",
 "中三",
 "中四",
 "中五",
 "中六",
] as const

const CANONICAL_GRADE_SET = new Set<string>(CANONICAL_CLASS_GRADE_LABELS)

/** 課程模板 grade_code（如 S1）→ 班別年級標籤（如「中一」） */
export function gradeLabelFromCourseCode(gradeCode: string | null | undefined): string | null {
 if (!gradeCode?.trim()) return null
 const label = formatStudentGrade(normalizeGradeCode(gradeCode))
 return label && label !== "—" ? label : null
}

/** 將年級字串標準化為小一–中六；無法辨識回傳 null */
export function normalizeStoredClassGradeLabel(raw: string | null | undefined): string | null {
 if (raw == null) return null
 const t = String(raw).trim()
 if (!t || t === "其他") return null
 if (CANONICAL_GRADE_SET.has(t)) return t
 const noSuffix = t.replace(/級$/, "").trim()
 if (CANONICAL_GRADE_SET.has(noSuffix)) return noSuffix
 const m = t.match(/^(小|中)([一二三四五六])/)
 if (m) {
  const mapped = `${m[1]}${m[2]}`
  if (CANONICAL_GRADE_SET.has(mapped)) return mapped
 }
 return gradeLabelFromCourseCode(t)
}

/** 班別 grade 陣列標準化（去重、排序） */
export function normalizeStoredClassGradeLabels(
 grades: string[] | null | undefined
): string[] {
 const out = [
  ...new Set(
   (grades ?? [])
    .map((g) => normalizeStoredClassGradeLabel(g))
    .filter((x): x is string => x != null)
  ),
 ]
 return out.sort((a, b) => a.localeCompare(b, "zh-Hant"))
}

/** 有 course_id 時：年級一律由課程模板決定 */
export function gradeLabelsAlignedFromCourse(gradeCode: string | null | undefined): string[] {
 const label = gradeLabelFromCourseCode(gradeCode)
 return label ? [label] : []
}

/** 班別年級：優先標準化已儲存 grade，否則由課程模板 grade_code 推導 */
export function resolveClassGradeLabels(
 grade: string[] | null | undefined,
 gradeCode: string | null | undefined
): string[] {
 const normalized = normalizeStoredClassGradeLabels(grade)
 if (normalized.length > 0) return normalized
 return gradeLabelsAlignedFromCourse(gradeCode)
}

export function classGradeDisplayText(
 grade: string[] | null | undefined,
 gradeCode: string | null | undefined
): string {
 const labels = resolveClassGradeLabels(grade, gradeCode)
 return labels.length > 0 ? labels.join("、") : "—"
}
