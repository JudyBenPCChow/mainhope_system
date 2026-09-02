import {
 containsIgnoreCase,
 countActiveFilters,
 dirMul,
 emptyFiltersForKeys,
 emptyLast,
 uniqueSortedTexts,
} from "@/components/list/listFilterUtils"
import {
 CLASS_GRADE_FORM_OPTIONS,
 formatWeekdaysDisplay,
} from "@/components/classes/classesUi"
import { classDisplayName } from "@/lib/courseLabel"
import type { ClassRecord } from "@/services/classQueries"
import type { ClassScheduleSummary } from "@/services/scheduleQueries"

export const CLASS_LIST_DATA_COLUMNS = [
 "course_code",
 "grade",
 "course_name",
 "time",
 "teacher",
 "student_count",
 "student_names",
] as const

export type ClassListColumnId = (typeof CLASS_LIST_DATA_COLUMNS)[number]

export const CLASS_LIST_COLUMN_LABEL: Record<ClassListColumnId, string> = {
 course_code: "課程編號",
 grade: "年級",
 course_name: "課程名稱",
 time: "上課時間",
 teacher: "老師",
 student_count: "學生人數",
 student_names: "學生名單",
}

export type ClassListHeaderFilters = Record<ClassListColumnId, string>

export const EMPTY_CLASS_HEADER_FILTERS: ClassListHeaderFilters = emptyFiltersForKeys(CLASS_LIST_DATA_COLUMNS)

export type ClassListExtras = {
 enrollRoster: Map<string, { count: number; names: string[] }>
 scheduleSummaries: Map<string, ClassScheduleSummary>
 timeLabel: (c: ClassRecord) => string
}

export const GRADE_HEADER_FILTER_OPTIONS = [
 { value: "", label: "全部" },
 ...CLASS_GRADE_FORM_OPTIONS.map((g) => ({ value: g, label: g })),
]

export function countActiveClassHeaderFilters(filters: ClassListHeaderFilters): number {
 return countActiveFilters(filters)
}

export function isPresetClassHeaderFilterColumn(column: ClassListColumnId): boolean {
 return column === "grade"
}

export function isClassListColumnId(value: string): value is ClassListColumnId {
 return (CLASS_LIST_DATA_COLUMNS as readonly string[]).includes(value)
}

function nonemptyText(value: string | null | undefined): string[] {
 const t = (value ?? "").trim()
 return t ? [t] : []
}

export function headerFilterCellTexts(
 c: ClassRecord,
 column: ClassListColumnId,
 extras: ClassListExtras
): string[] {
 if (column === "course_code") return nonemptyText(c.course_code_full)
 if (column === "grade") return (c.grade ?? []).map((g) => g.trim()).filter(Boolean)
 if (column === "course_name") {
  return nonemptyText(classDisplayName({ subject: c.subject, courseName: c.course_name }))
 }
 if (column === "time") return nonemptyText(extras.timeLabel(c))
 if (column === "teacher") return nonemptyText(c.teacher_name)
 if (column === "student_count") {
  const n = extras.enrollRoster.get(c.id)?.count ?? 0
  return [String(n)]
 }
 if (column === "student_names") return extras.enrollRoster.get(c.id)?.names ?? []
 return []
}

export function uniqueClassHeaderFilterValues(
 column: ClassListColumnId,
 rows: ClassRecord[],
 extras: ClassListExtras
): string[] {
 const texts: string[] = []
 for (const c of rows) {
  texts.push(...headerFilterCellTexts(c, column, extras))
 }
 return uniqueSortedTexts(texts)
}

export function classMatchesHeaderFilters(
 c: ClassRecord,
 filters: ClassListHeaderFilters,
 extras: ClassListExtras
): boolean {
 const codeQ = filters.course_code.trim().toLowerCase()
 const nameQ = filters.course_name.trim().toLowerCase()
 const timeQ = filters.time.trim().toLowerCase()
 const teacherQ = filters.teacher.trim().toLowerCase()
 const countQ = filters.student_count.trim().toLowerCase()
 const namesQ = filters.student_names.trim().toLowerCase()
 const gradeKey = filters.grade.trim()

 if (codeQ && !containsIgnoreCase(c.course_code_full, codeQ)) return false
 if (nameQ) {
  const hay = classDisplayName({ subject: c.subject, courseName: c.course_name }).toLowerCase()
  if (!hay.includes(nameQ)) return false
 }
 if (timeQ && !containsIgnoreCase(extras.timeLabel(c), timeQ)) return false
 if (teacherQ && !containsIgnoreCase(c.teacher_name, teacherQ)) return false
 if (countQ) {
  const n = String(extras.enrollRoster.get(c.id)?.count ?? 0)
  if (!n.includes(countQ)) return false
 }
 if (namesQ) {
  const joined = (extras.enrollRoster.get(c.id)?.names ?? []).join(" ").toLowerCase()
  if (!joined.includes(namesQ)) return false
 }
 if (gradeKey) {
  const grades = (c.grade ?? []).map((g) => g.trim())
  if (!grades.some((g) => g === gradeKey || g.includes(gradeKey))) return false
 }
 return true
}

export function rowsMatchingClassHeaderFiltersExcept(
 rows: ClassRecord[],
 filters: ClassListHeaderFilters,
 except: ClassListColumnId,
 extras: ClassListExtras
): ClassRecord[] {
 const rest: ClassListHeaderFilters = { ...filters, [except]: "" }
 return rows.filter((c) => classMatchesHeaderFilters(c, rest, extras))
}

function approxTimeSortKey(c: ClassRecord): string {
 return [formatWeekdaysDisplay(c.day_of_week), c.time_slot ?? ""].filter(Boolean).join(" ")
}

export function compareClasses(
 a: ClassRecord,
 b: ClassRecord,
 sortKey: ClassListColumnId,
 dir: "asc" | "desc",
 extras: ClassListExtras
): number {
 const m = dirMul(dir)
 if (sortKey === "course_code") {
  const ca = (a.course_code_full ?? "").trim()
  const cb = (b.course_code_full ?? "").trim()
  const empty = emptyLast(!ca, !cb)
  if (empty != null && empty !== 0) return empty
  const n = ca.localeCompare(cb, "zh-Hant")
  return n !== 0 ? n * m : (a.subject ?? "").localeCompare(b.subject ?? "", "zh-Hant")
 }
 if (sortKey === "grade") {
  const ga = (a.grade ?? []).join("、")
  const gb = (b.grade ?? []).join("、")
  const empty = emptyLast(!ga, !gb)
  if (empty != null && empty !== 0) return empty
  const n = ga.localeCompare(gb, "zh-Hant")
  return n !== 0 ? n * m : (a.course_code_full ?? "").localeCompare(b.course_code_full ?? "", "zh-Hant")
 }
 if (sortKey === "course_name") {
  const na = classDisplayName({ subject: a.subject, courseName: a.course_name })
  const nb = classDisplayName({ subject: b.subject, courseName: b.course_name })
  const n = na.localeCompare(nb, "zh-Hant")
  return n !== 0 ? n * m : (a.course_code_full ?? "").localeCompare(b.course_code_full ?? "", "zh-Hant")
 }
 if (sortKey === "time") {
  const ta = approxTimeSortKey(a)
  const tb = approxTimeSortKey(b)
  const empty = emptyLast(!ta, !tb)
  if (empty != null && empty !== 0) return empty
  return ta.localeCompare(tb, "zh-Hant") * m
 }
 if (sortKey === "teacher") {
  const empty = emptyLast(!(a.teacher_name ?? "").trim(), !(b.teacher_name ?? "").trim())
  if (empty != null && empty !== 0) return empty
  const n = (a.teacher_name ?? "").localeCompare(b.teacher_name ?? "", "zh-Hant")
  return n !== 0 ? n * m : (a.course_code_full ?? "").localeCompare(b.course_code_full ?? "", "zh-Hant")
 }
 if (sortKey === "student_count") {
  const ca = extras.enrollRoster.get(a.id)?.count ?? 0
  const cb = extras.enrollRoster.get(b.id)?.count ?? 0
  if (ca !== cb) return (ca - cb) * m
  return (a.course_code_full ?? "").localeCompare(b.course_code_full ?? "", "zh-Hant")
 }
 const sa = (extras.enrollRoster.get(a.id)?.names ?? []).join("、")
 const sb = (extras.enrollRoster.get(b.id)?.names ?? []).join("、")
 const empty = emptyLast(!sa, !sb)
 if (empty != null && empty !== 0) return empty
 return sa.localeCompare(sb, "zh-Hant") * m
}

export function classSortLabel(sortKey: ClassListColumnId, dir: "asc" | "desc"): string {
 const name = CLASS_LIST_COLUMN_LABEL[sortKey]
 return dir === "asc" ? `${name}（升序）` : `${name}（降序）`
}
