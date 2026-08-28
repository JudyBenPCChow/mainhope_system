import {
 containsIgnoreCase,
 countActiveFilters,
 dirMul,
 emptyLast,
 uniqueSortedTexts,
} from "@/components/list/listFilterUtils"
import { GRADE_FILTER_PRIMARY_KEY } from "@/components/students/studentsListFilters"
import { isPrimaryStudentGrade, STUDENT_GRADE_CODES } from "@/lib/studentGrade"
import {
 normalizeAcademicStage,
 normalizeActivityStatus,
 normalizeEnrollmentStatus,
 normalizeRegistrationStatus,
 type StudentRecord,
} from "@/services/studentQueries"

export const STUDENT_LIST_DATA_COLUMNS = [
 "student_code",
 "name",
 "grade",
 "school",
 "student_phone",
 "parent_phone",
 "subjects",
 "status",
 "created_at",
] as const

export type StudentListColumnId = (typeof STUDENT_LIST_DATA_COLUMNS)[number]

export const STUDENT_LIST_COLUMN_LABEL: Record<StudentListColumnId, string> = {
 student_code: "學號",
 name: "姓名",
 grade: "年級",
 school: "學校",
 student_phone: "學生電話",
 parent_phone: "家長電話",
 subjects: "報讀班別",
 status: "狀態",
 created_at: "建立日",
}

export const DEFAULT_VISIBLE_COLUMNS: Record<StudentListColumnId, boolean> = {
 student_code: true,
 name: true,
 grade: true,
 school: false,
 student_phone: true,
 parent_phone: true,
 subjects: true,
 status: true,
 created_at: false,
}

export type StudentListHeaderFilters = Record<StudentListColumnId, string>

export const EMPTY_HEADER_FILTERS: StudentListHeaderFilters = {
 student_code: "",
 name: "",
 grade: "",
 school: "",
 student_phone: "",
 parent_phone: "",
 subjects: "",
 status: "",
 created_at: "",
}

export const STATUS_HEADER_FILTERS = [
 { key: "", label: "全部" },
 { key: "已註冊", label: "已註冊" },
 { key: "非注冊", label: "非註冊" },
 { key: "在讀", label: "在讀" },
 { key: "非在讀", label: "非在讀" },
 { key: "活躍生", label: "活躍生" },
 { key: "非活躍生", label: "非活躍生" },
 { key: "中學階段", label: "中學階段" },
 { key: "已畢業", label: "已畢業" },
] as const

export function mergeVisibleColumns(
 stored: Partial<Record<StudentListColumnId, boolean>> | null | undefined
): Record<StudentListColumnId, boolean> {
 return {
  ...DEFAULT_VISIBLE_COLUMNS,
  ...(stored ?? {}),
  name: true,
 }
}

export function studentCodeRank(code: string | null | undefined): number {
 const s = (code ?? "").trim()
 if (!s) return -1
 const m = s.match(/(\d+)(?!.*\d)/)
 if (!m) return -1
 return Number(m[1])
}

export function countActiveHeaderFilters(filters: StudentListHeaderFilters): number {
 return countActiveFilters(filters)
}

export function isPresetHeaderFilterColumn(column: StudentListColumnId): boolean {
 return column === "grade" || column === "status"
}

function nonemptyText(value: string | null | undefined): string[] {
 const t = (value ?? "").trim()
 return t ? [t] : []
}

export function headerFilterCellTexts(
 r: StudentRecord,
 column: StudentListColumnId,
 tags: Map<string, string[]>
): string[] {
 if (column === "student_code") return nonemptyText(r.student_code)
 if (column === "name") return [...nonemptyText(r.full_name), ...nonemptyText(r.english_name)]
 if (column === "grade") return nonemptyText(r.grade)
 if (column === "school") return nonemptyText(r.school)
 if (column === "student_phone") return nonemptyText(r.student_phone)
 if (column === "parent_phone") return nonemptyText(r.parent_phone)
 if (column === "subjects") return (tags.get(r.id) ?? []).map((t) => t.trim()).filter(Boolean)
 if (column === "status") return []
 return nonemptyText(createdAtLocalYmd(r.created_at))
}

export function uniqueHeaderFilterValues(
 column: StudentListColumnId,
 rows: StudentRecord[],
 tags: Map<string, string[]>
): string[] {
 const texts: string[] = []
 for (const r of rows) {
  texts.push(...headerFilterCellTexts(r, column, tags))
 }
 return uniqueSortedTexts(texts)
}

export function rowsMatchingHeaderFiltersExcept(
 rows: StudentRecord[],
 filters: StudentListHeaderFilters,
 except: StudentListColumnId,
 tags: Map<string, string[]>
): StudentRecord[] {
 const rest: StudentListHeaderFilters = { ...filters, [except]: "" }
 return rows.filter((r) => studentMatchesHeaderFilters(r, rest, tags))
}

function gradeRank(grade: string | null | undefined): number {
 const code = (grade ?? "").trim().toUpperCase()
 const i = (STUDENT_GRADE_CODES as readonly string[]).indexOf(code)
 return i >= 0 ? i : STUDENT_GRADE_CODES.length + 1
}

function createdAtLocalYmd(createdAt: string | null | undefined): string {
 const s = (createdAt ?? "").trim()
 if (!s) return ""
 const d = new Date(s)
 if (Number.isNaN(d.getTime())) return s.slice(0, 10)
 const y = d.getFullYear()
 const m = String(d.getMonth() + 1).padStart(2, "0")
 const day = String(d.getDate()).padStart(2, "0")
 return `${y}-${m}-${day}`
}

export function formatStudentCreatedAt(createdAt: string | null | undefined): string {
 return createdAtLocalYmd(createdAt) || "—"
}

function statusSortKey(r: StudentRecord): string {
 return [
  normalizeEnrollmentStatus(r.enrollment_status),
  normalizeActivityStatus(r.activity_status),
  normalizeRegistrationStatus(r.registration_status),
  normalizeAcademicStage(r.academic_stage),
 ].join("|")
}

function matchesStatusHeader(r: StudentRecord, key: string): boolean {
 if (!key) return true
 if (key === "已註冊" || key === "非注冊") return normalizeRegistrationStatus(r.registration_status) === key
 if (key === "在讀" || key === "非在讀") return normalizeEnrollmentStatus(r.enrollment_status) === key
 if (key === "活躍生" || key === "非活躍生") return normalizeActivityStatus(r.activity_status) === key
 if (key === "中學階段" || key === "已畢業") return normalizeAcademicStage(r.academic_stage) === key
 return true
}

export function studentMatchesHeaderFilters(
 r: StudentRecord,
 filters: StudentListHeaderFilters,
 tags: Map<string, string[]>
): boolean {
 const codeQ = filters.student_code.trim().toLowerCase()
 const nameQ = filters.name.trim().toLowerCase()
 const phoneQ = filters.student_phone.trim().toLowerCase()
 const parentQ = filters.parent_phone.trim().toLowerCase()
 const schoolQ = filters.school.trim().toLowerCase()
 const subQ = filters.subjects.trim().toLowerCase()
 const createdQ = filters.created_at.trim().toLowerCase()
 const gradeKey = filters.grade.trim()

 if (codeQ && !containsIgnoreCase(r.student_code, codeQ)) return false
 if (nameQ) {
  const hay = `${r.full_name} ${r.english_name ?? ""}`.toLowerCase()
  if (!hay.includes(nameQ)) return false
 }
 if (phoneQ && !containsIgnoreCase(r.student_phone, phoneQ)) return false
 if (parentQ && !containsIgnoreCase(r.parent_phone, parentQ)) return false
 if (schoolQ && !containsIgnoreCase(r.school, schoolQ)) return false
 if (createdQ && !containsIgnoreCase(createdAtLocalYmd(r.created_at), createdQ)) return false
 if (subQ) {
  const joined = (tags.get(r.id) ?? []).join(" ").toLowerCase()
  if (!joined.includes(subQ)) return false
 }
 if (gradeKey) {
  if (gradeKey === GRADE_FILTER_PRIMARY_KEY) {
   if (!isPrimaryStudentGrade(r.grade)) return false
  } else if ((r.grade ?? "") !== gradeKey) {
   return false
  }
 }
 if (!matchesStatusHeader(r, filters.status.trim())) return false
 return true
}

export function compareStudents(
 a: StudentRecord,
 b: StudentRecord,
 sortKey: StudentListColumnId,
 dir: "asc" | "desc",
 tags: Map<string, string[]>
): number {
 const m = dirMul(dir)
 if (sortKey === "student_code") {
  const ra = studentCodeRank(a.student_code)
  const rb = studentCodeRank(b.student_code)
  const empty = emptyLast(ra < 0, rb < 0)
  if (empty != null && empty !== 0) return empty
  if (ra !== rb) return (ra - rb) * m
  return a.full_name.localeCompare(b.full_name, "zh-Hant")
 }
 if (sortKey === "name") {
  const n = a.full_name.localeCompare(b.full_name, "zh-Hant")
  if (n !== 0) return n * m
  return (a.english_name ?? "").localeCompare(b.english_name ?? "", "zh-Hant") * m
 }
 if (sortKey === "grade") {
  const ga = gradeRank(a.grade)
  const gb = gradeRank(b.grade)
  if (ga !== gb) return (ga - gb) * m
  return a.full_name.localeCompare(b.full_name, "zh-Hant")
 }
 if (sortKey === "school") {
  const empty = emptyLast(!(a.school ?? "").trim(), !(b.school ?? "").trim())
  if (empty != null && empty !== 0) return empty
  const n = (a.school ?? "").localeCompare(b.school ?? "", "zh-Hant")
  return n !== 0 ? n * m : a.full_name.localeCompare(b.full_name, "zh-Hant")
 }
 if (sortKey === "student_phone") {
  const empty = emptyLast(!(a.student_phone ?? "").trim(), !(b.student_phone ?? "").trim())
  if (empty != null && empty !== 0) return empty
  return (a.student_phone ?? "").localeCompare(b.student_phone ?? "", "zh-Hant") * m
 }
 if (sortKey === "parent_phone") {
  const empty = emptyLast(!(a.parent_phone ?? "").trim(), !(b.parent_phone ?? "").trim())
  if (empty != null && empty !== 0) return empty
  return (a.parent_phone ?? "").localeCompare(b.parent_phone ?? "", "zh-Hant") * m
 }
 if (sortKey === "subjects") {
  const sa = (tags.get(a.id) ?? []).join("、")
  const sb = (tags.get(b.id) ?? []).join("、")
  const empty = emptyLast(!sa, !sb)
  if (empty != null && empty !== 0) return empty
  const n = sa.localeCompare(sb, "zh-Hant")
  return n !== 0 ? n * m : a.full_name.localeCompare(b.full_name, "zh-Hant")
 }
 if (sortKey === "status") {
  const n = statusSortKey(a).localeCompare(statusSortKey(b), "zh-Hant")
  return n !== 0 ? n * m : a.full_name.localeCompare(b.full_name, "zh-Hant")
 }
 const ca = createdAtLocalYmd(a.created_at)
 const cb = createdAtLocalYmd(b.created_at)
 const empty = emptyLast(!ca, !cb)
 if (empty != null && empty !== 0) return empty
 if (ca !== cb) return ca.localeCompare(cb) * m
 return a.full_name.localeCompare(b.full_name, "zh-Hant")
}

export function sortLabel(sortKey: StudentListColumnId, dir: "asc" | "desc"): string {
 const name = STUDENT_LIST_COLUMN_LABEL[sortKey]
 if (sortKey === "student_code") return dir === "desc" ? "按學號（最新）" : "按學號（小→大）"
 return dir === "asc" ? `${name}（升序）` : `${name}（降序）`
}

export function isStudentListColumnId(value: string): value is StudentListColumnId {
 return (STUDENT_LIST_DATA_COLUMNS as readonly string[]).includes(value)
}
