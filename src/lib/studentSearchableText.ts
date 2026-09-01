export type StudentSearchableTextSource = {
 full_name: string
 student_code?: string | null
 english_name?: string | null
 student_phone?: string | null
 parent_phone?: string | null
}

export function studentSearchText(s: StudentSearchableTextSource): string {
 return [
  s.full_name,
  s.student_code,
  s.english_name,
  s.student_phone,
  s.parent_phone,
 ]
  .map((part) => (part ?? "").trim())
  .filter(Boolean)
  .join(" ")
}

export function studentDisplayText(s: StudentSearchableTextSource): string {
 const code = s.student_code?.trim() ?? ""
 return code ? `${s.full_name}（${code}）` : s.full_name
}
