import { CLASS_GRADE_FORM_OPTIONS } from "@/components/classes/classesUi"
import {
  containsIgnoreCase,
  countActiveFilters,
  dirMul,
  emptyFiltersForKeys,
  emptyLast,
  uniqueSortedTexts,
  type HeaderFilterOption,
  type SortDir,
} from "@/components/list/listFilterUtils"
import { formatWeekdaysDisplay } from "@/lib/weekdayUtils"
import {
  type TrialInviteCatalogClassControl,
  type TrialInviteCatalogScheduleControl,
  type TrialInviteCatalogTeacherControl,
} from "@/services/trialInviteQueries"

export const CATALOG_UNASSIGNED_TEACHER = "__none__"

export const CATALOG_LIST_DATA_COLUMNS = [
  "teacher",
  "grade",
  "subject",
  "class",
  "count",
  "students",
  "time",
  "listed",
] as const

export type CatalogListColumnId = (typeof CATALOG_LIST_DATA_COLUMNS)[number]

export const CATALOG_LIST_COLUMN_LABEL: Record<CatalogListColumnId, string> = {
  teacher: "老師",
  grade: "年級",
  subject: "科目",
  class: "班別",
  count: "人數",
  students: "學生名單",
  time: "時間日期",
  listed: "納入",
}

export type CatalogListHeaderFilters = Record<CatalogListColumnId, string>

export const EMPTY_CATALOG_HEADER_FILTERS: CatalogListHeaderFilters =
  emptyFiltersForKeys(CATALOG_LIST_DATA_COLUMNS)

export type CatalogClassKindFilter = "all" | "group" | "homework"

export type CatalogRow = {
  teacher: TrialInviteCatalogTeacherControl
  cls: TrialInviteCatalogClassControl
}

export const COUNT_BUCKET_OPTIONS: HeaderFilterOption[] = [
  { value: "", label: "全部" },
  { value: "0", label: "0 人" },
  { value: "1-5", label: "1–5 人（公開頁可出現）" },
  { value: "6+", label: "6 人以上（公開頁自動隱藏）" },
]

export const LISTED_FILTER_OPTIONS: HeaderFilterOption[] = [
  { value: "", label: "全部" },
  { value: "listed", label: "已納入" },
  { value: "unlisted", label: "已剔走" },
]

export const GRADE_HEADER_FILTER_OPTIONS: HeaderFilterOption[] = [
  { value: "", label: "全部" },
  ...CLASS_GRADE_FORM_OPTIONS.map((g) => ({ value: g, label: g })),
]

export function catalogClassKindLabel(kind: string): string {
  if (kind === "homework") return "功課輔導班"
  if (kind === "group") return "專科班"
  return kind || "班別"
}

export function catalogScheduleLabel(s: {
  scheduledDate: string
  startTime: string
  endTime: string
  sessionNumber: number | null
}): string {
  const time =
    s.startTime && s.endTime
      ? `${s.startTime}–${s.endTime}`
      : s.startTime || "—"
  const session =
    s.sessionNumber != null && Number.isFinite(s.sessionNumber)
      ? ` · 第${s.sessionNumber}節`
      : ""
  return `${s.scheduledDate || "—"} ${time}${session}`
}

export function catalogClassTimeLabel(cls: TrialInviteCatalogClassControl): string {
  const days = formatWeekdaysDisplay(cls.dayOfWeek)
  const weekly = [days, cls.timeSlot].filter(Boolean).join(" ")
  if (weekly) return weekly
  const first = cls.schedules[0]
  if (!first) return ""
  return catalogScheduleLabel(first)
}

export function studentCountBucket(n: number): "0" | "1-5" | "6+" {
  if (n <= 0) return "0"
  if (n <= 5) return "1-5"
  return "6+"
}

export function isScheduleParentOpen(s: TrialInviteCatalogScheduleControl): boolean {
  return !s.excluded && s.trialCount === 0
}

export function publicAutoHideReason(
  cls: TrialInviteCatalogClassControl
): "full" | "no_open_schedule" | null {
  if (!cls.listed) return null
  if (cls.enrolledStudents.length > 5) return "full"
  if (!cls.schedules.some(isScheduleParentOpen)) return "no_open_schedule"
  return null
}

export function isCatalogPresetColumn(column: CatalogListColumnId): boolean {
  return (
    column === "teacher" ||
    column === "grade" ||
    column === "subject" ||
    column === "count" ||
    column === "listed"
  )
}

export function isCatalogListColumnId(value: string): value is CatalogListColumnId {
  return (CATALOG_LIST_DATA_COLUMNS as readonly string[]).includes(value)
}

export function countActiveCatalogHeaderFilters(filters: CatalogListHeaderFilters): number {
  return countActiveFilters(filters)
}

function nonemptyText(value: string | null | undefined): string[] {
  const t = (value ?? "").trim()
  return t ? [t] : []
}

export function catalogHeaderFilterCellTexts(
  row: CatalogRow,
  column: CatalogListColumnId
): string[] {
  if (column === "teacher") return nonemptyText(row.teacher.name)
  if (column === "grade") return row.cls.grades.map((g) => g.trim()).filter(Boolean)
  if (column === "subject") return nonemptyText(row.cls.subject || "未分類")
  if (column === "class") {
    return nonemptyText([row.cls.label, row.cls.courseCodeFull].filter(Boolean).join(" "))
  }
  if (column === "count") return [studentCountBucket(row.cls.enrolledStudents.length)]
  if (column === "students") return row.cls.enrolledStudents.map((s) => s.fullName)
  if (column === "time") return nonemptyText(catalogClassTimeLabel(row.cls))
  return [row.cls.listed ? "listed" : "unlisted"]
}

export function uniqueCatalogHeaderFilterOptions(
  column: CatalogListColumnId,
  rows: CatalogRow[]
): HeaderFilterOption[] {
  if (column === "count") return COUNT_BUCKET_OPTIONS.filter((o) => o.value)
  if (column === "listed") return LISTED_FILTER_OPTIONS.filter((o) => o.value)
  if (column === "grade") {
    return uniqueSortedTexts(rows.flatMap((r) => catalogHeaderFilterCellTexts(r, "grade"))).map(
      (v) => ({ value: v, label: v })
    )
  }
  if (column === "teacher") {
    const seen = new Set<string>()
    const opts: HeaderFilterOption[] = []
    for (const row of rows) {
      const value = row.teacher.id ?? CATALOG_UNASSIGNED_TEACHER
      if (seen.has(value)) continue
      seen.add(value)
      opts.push({ value, label: row.teacher.name })
    }
    return opts.sort((a, b) => a.label.localeCompare(b.label, "zh-Hant"))
  }
  return uniqueSortedTexts(rows.flatMap((r) => catalogHeaderFilterCellTexts(r, column))).map(
    (v) => ({ value: v, label: v })
  )
}

export function catalogMatchesHeaderFilters(
  row: CatalogRow,
  filters: CatalogListHeaderFilters
): boolean {
  const teacherKey = filters.teacher.trim()
  const gradeKey = filters.grade.trim()
  const subjectQ = filters.subject.trim()
  const classQ = filters.class.trim().toLowerCase()
  const countKey = filters.count.trim()
  const namesQ = filters.students.trim().toLowerCase()
  const timeQ = filters.time.trim().toLowerCase()
  const listedKey = filters.listed.trim()

  if (teacherKey) {
    const id = row.teacher.id ?? CATALOG_UNASSIGNED_TEACHER
    if (id !== teacherKey) return false
  }
  if (gradeKey) {
    const grades = row.cls.grades.map((g) => g.trim())
    if (!grades.some((g) => g === gradeKey || g.includes(gradeKey))) return false
  }
  if (subjectQ) {
    const subject = (row.cls.subject || "未分類").trim()
    if (subject !== subjectQ && !containsIgnoreCase(subject, subjectQ)) return false
  }
  if (classQ) {
    const hay = `${row.cls.label} ${row.cls.courseCodeFull}`.toLowerCase()
    if (!hay.includes(classQ)) return false
  }
  if (countKey && studentCountBucket(row.cls.enrolledStudents.length) !== countKey) {
    return false
  }
  if (namesQ) {
    const joined = row.cls.enrolledStudents.map((s) => s.fullName).join(" ").toLowerCase()
    if (!joined.includes(namesQ)) return false
  }
  if (timeQ && !containsIgnoreCase(catalogClassTimeLabel(row.cls), timeQ)) return false
  if (listedKey === "listed" && !row.cls.listed) return false
  if (listedKey === "unlisted" && row.cls.listed) return false
  return true
}

export function rowsMatchingCatalogHeaderFiltersExcept(
  rows: CatalogRow[],
  filters: CatalogListHeaderFilters,
  except: CatalogListColumnId
): CatalogRow[] {
  const rest: CatalogListHeaderFilters = { ...filters, [except]: "" }
  return rows.filter((row) => catalogMatchesHeaderFilters(row, rest))
}

export function catalogMatchesSearch(row: CatalogRow, needle: string): boolean {
  if (!needle) return true
  if (row.teacher.name.toLowerCase().includes(needle)) return true
  if (row.cls.label.toLowerCase().includes(needle)) return true
  if (row.cls.courseCodeFull.toLowerCase().includes(needle)) return true
  if (row.cls.subject.toLowerCase().includes(needle)) return true
  if (catalogClassTimeLabel(row.cls).toLowerCase().includes(needle)) return true
  return row.cls.enrolledStudents.some(
    (s) =>
      s.fullName.toLowerCase().includes(needle) ||
      s.studentCode.toLowerCase().includes(needle)
  )
}

export function compareCatalogRows(
  a: CatalogRow,
  b: CatalogRow,
  sortKey: CatalogListColumnId,
  dir: SortDir
): number {
  const mul = dirMul(dir)
  if (sortKey === "count") {
    const byCount = a.cls.enrolledStudents.length - b.cls.enrolledStudents.length
    if (byCount !== 0) return byCount * mul
  } else if (sortKey === "time") {
    const ta = catalogClassTimeLabel(a.cls)
    const tb = catalogClassTimeLabel(b.cls)
    const empty = emptyLast(!ta, !tb)
    if (empty != null) return empty
    const byTime = ta.localeCompare(tb, "zh-Hant")
    if (byTime !== 0) return byTime * mul
  } else if (sortKey === "class") {
    const byClass = a.cls.label.localeCompare(b.cls.label, "zh-Hant")
    if (byClass !== 0) return byClass * mul
  } else if (sortKey === "grade") {
    const ga = a.cls.grades.join("、")
    const gb = b.cls.grades.join("、")
    const empty = emptyLast(!ga, !gb)
    if (empty != null) return empty
    const byGrade = ga.localeCompare(gb, "zh-Hant")
    if (byGrade !== 0) return byGrade * mul
  } else if (sortKey === "subject") {
    const sa = (a.cls.subject || "未分類").trim()
    const sb = (b.cls.subject || "未分類").trim()
    const empty = emptyLast(!sa || sa === "未分類", !sb || sb === "未分類")
    if (empty != null) return empty
    const bySubject = sa.localeCompare(sb, "zh-Hant")
    if (bySubject !== 0) return bySubject * mul
  } else if (sortKey === "students") {
    const sa = a.cls.enrolledStudents.map((s) => s.fullName).join("、")
    const sb = b.cls.enrolledStudents.map((s) => s.fullName).join("、")
    const empty = emptyLast(!sa, !sb)
    if (empty != null) return empty
    const byNames = sa.localeCompare(sb, "zh-Hant")
    if (byNames !== 0) return byNames * mul
  } else if (sortKey === "listed") {
    const la = a.cls.listed ? 0 : 1
    const lb = b.cls.listed ? 0 : 1
    if (la !== lb) return (la - lb) * mul
  } else {
    const empty = emptyLast(!a.teacher.name.trim(), !b.teacher.name.trim())
    if (empty != null) return empty
    const byTeacher = a.teacher.name.localeCompare(b.teacher.name, "zh-Hant")
    if (byTeacher !== 0) return byTeacher * mul
  }
  return a.cls.label.localeCompare(b.cls.label, "zh-Hant")
}

export function catalogSortLabel(sortKey: CatalogListColumnId, dir: SortDir): string {
  const name = CATALOG_LIST_COLUMN_LABEL[sortKey]
  return dir === "asc" ? `${name}（升序）` : `${name}（降序）`
}

export function nearestScheduleSplit(
  schedules: TrialInviteCatalogScheduleControl[],
  limit: number
): { keep: TrialInviteCatalogScheduleControl[]; drop: TrialInviteCatalogScheduleControl[] } {
  return {
    keep: schedules.slice(0, limit),
    drop: schedules.slice(limit),
  }
}
