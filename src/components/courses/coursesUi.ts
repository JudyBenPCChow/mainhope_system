import { ALL_GRADE_CODES } from "@/lib/courseCode"
import type { CourseRecord } from "@/services/classQueries"

export const COURSE_MODE_FILTER_CHIPS = [
 { key: "全部", label: "全部" },
 { key: "regular", label: "正規學年" },
 { key: "summer_two_period", label: "暑期兩期" },
] as const

export type CourseModeFilterKey = (typeof COURSE_MODE_FILTER_CHIPS)[number]["key"]

export function buildCourseSubjectFilterChips(
 rows: CourseRecord[],
 subjects: { id: string; name_zh: string }[]
): { key: string; label: string }[] {
 const present = new Set(rows.map((r) => r.subject_id))
 const chips: { key: string; label: string }[] = [{ key: "全部", label: "全部" }]
 for (const s of subjects) {
  if (present.has(s.id)) chips.push({ key: s.id, label: s.name_zh })
 }
 for (const r of rows) {
  if (chips.some((c) => c.key === r.subject_id)) continue
  const label = r.subject_name_zh.trim()
  if (label) chips.push({ key: r.subject_id, label })
 }
 return chips
}

export function buildCourseGradeFilterChips(rows: CourseRecord[]): string[] {
 const present = new Set(rows.map((r) => r.grade_code.trim()).filter(Boolean))
 const ordered = ["全部"]
 for (const g of ALL_GRADE_CODES) {
  if (present.has(g)) ordered.push(g)
 }
 for (const g of [...present].sort()) {
  if (!ordered.includes(g)) ordered.push(g)
 }
 return ordered
}

export function courseMatchesSubject(c: CourseRecord, key: string): boolean {
 if (key === "全部") return true
 return c.subject_id === key
}

export function courseMatchesGrade(c: CourseRecord, key: string): boolean {
 if (key === "全部") return true
 return c.grade_code.trim() === key
}

export function courseMatchesMode(c: CourseRecord, key: CourseModeFilterKey): boolean {
 if (key === "全部") return true
 return c.course_mode === key
}

export function courseMatchesSearch(
 c: CourseRecord,
 query: string,
 subjectLabel: string
): boolean {
 const q = query.trim().toLowerCase()
 if (!q) return true
 const hay = [
  c.course_code_base,
  c.course_name ?? "",
  c.subject_name_zh,
  c.subject_code,
  subjectLabel,
  c.grade_code,
  String(c.course_seq),
  c.course_mode === "summer_two_period" ? "暑期兩期" : "正規",
 ].join(" ")
 return hay.toLowerCase().includes(q)
}
