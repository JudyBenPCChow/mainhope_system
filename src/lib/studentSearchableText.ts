import { formatStudentGrade, formatStudentGradeCode } from "@/lib/studentGrade"

export type StudentSearchableTextSource = {
 full_name: string
 student_code?: string | null
 english_name?: string | null
 student_phone?: string | null
 parent_phone?: string | null
 grade?: string | null
}

function pushUnique(parts: string[], value: string) {
 const next = value.trim()
 if (!next || next === "—" || parts.includes(next)) return
 parts.push(next)
}

/** 年級搜尋：中文標籤（中一）與代碼（S1）都可命中。 */
export function studentGradeSearchText(grade: string | null | undefined): string {
 const parts: string[] = []
 pushUnique(parts, formatStudentGrade(grade))
 pushUnique(parts, formatStudentGradeCode(grade))
 pushUnique(parts, grade ?? "")
 return parts.join(" ")
}

export function studentSearchText(s: StudentSearchableTextSource): string {
 return [
  s.full_name,
  s.student_code,
  s.english_name,
  s.student_phone,
  s.parent_phone,
  studentGradeSearchText(s.grade),
 ]
  .map((part) => (part ?? "").trim())
  .filter(Boolean)
  .join(" ")
}

export function studentDisplayText(s: StudentSearchableTextSource): string {
 const code = s.student_code?.trim() ?? ""
 return code ? `${s.full_name}（${code}）` : s.full_name
}
