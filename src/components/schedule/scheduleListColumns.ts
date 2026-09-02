import {
 containsIgnoreCase,
 countActiveFilters,
 dirMul,
 emptyFiltersForKeys,
 emptyLast,
 uniqueSortedTexts,
 type SortDir,
} from "@/components/list/listFilterUtils"
import { scheduleTeacherDisplayName } from "@/lib/privateClassKind"
import type { ScheduleManageRow } from "@/services/scheduleQueries"

export const SCHEDULE_LIST_DATA_COLUMNS = [
 "date",
 "class",
 "time",
 "teacher",
 "room",
 "status",
 "enroll",
] as const

export type ScheduleListColumnId = (typeof SCHEDULE_LIST_DATA_COLUMNS)[number]

export const SCHEDULE_LIST_COLUMN_LABEL: Record<ScheduleListColumnId, string> = {
 date: "日期",
 class: "班別",
 time: "時間",
 teacher: "老師",
 room: "位置",
 status: "狀態",
 enroll: "點名冊人數",
}

export type ScheduleListHeaderFilters = Record<ScheduleListColumnId, string>

export const EMPTY_SCHEDULE_HEADER_FILTERS: ScheduleListHeaderFilters =
 emptyFiltersForKeys(SCHEDULE_LIST_DATA_COLUMNS)

export const SCHEDULE_STATUS_HEADER_FILTER_OPTIONS = [
 { value: "", label: "全部" },
 { value: "正常", label: "正常" },
 { value: "完成", label: "完成" },
 { value: "取消", label: "取消" },
]

export function countActiveScheduleHeaderFilters(filters: ScheduleListHeaderFilters): number {
 return countActiveFilters(filters)
}

export function isPresetScheduleHeaderFilterColumn(column: ScheduleListColumnId): boolean {
 return column === "status"
}

export function isScheduleListColumnId(value: string): value is ScheduleListColumnId {
 return (SCHEDULE_LIST_DATA_COLUMNS as readonly string[]).includes(value)
}

function timeLabel(row: ScheduleManageRow): string {
 if (!row.start_time && !row.end_time) return ""
 return `${row.start_time ?? "—"}–${row.end_time ?? "—"}`
}

function enrollLabel(row: ScheduleManageRow): string {
 return row.enrollCount == null ? "" : String(row.enrollCount)
}

function headerFilterCellTexts(row: ScheduleManageRow, column: ScheduleListColumnId): string[] {
 switch (column) {
  case "date":
   return [row.scheduled_date]
  case "class":
   return [row.classLabel, row.course_code_full ?? ""].filter(Boolean)
  case "time":
   return [timeLabel(row)].filter(Boolean)
  case "teacher":
   return [scheduleTeacherDisplayName(row, { warnIfUnassigned: false })].filter(Boolean)
  case "room":
   return [row.classroom_name?.trim() || "未編課室"]
  case "status":
   return [row.status]
  case "enroll":
   return [enrollLabel(row)].filter(Boolean)
 }
}

export function uniqueScheduleHeaderFilterValues(
 column: ScheduleListColumnId,
 rows: ScheduleManageRow[]
): string[] {
 const texts: string[] = []
 for (const row of rows) texts.push(...headerFilterCellTexts(row, column))
 return uniqueSortedTexts(texts)
}

export function scheduleMatchesHeaderFilters(
 row: ScheduleManageRow,
 filters: ScheduleListHeaderFilters
): boolean {
 const dateQ = filters.date.trim().toLowerCase()
 const classQ = filters.class.trim().toLowerCase()
 const timeQ = filters.time.trim().toLowerCase()
 const teacherQ = filters.teacher.trim().toLowerCase()
 const roomQ = filters.room.trim().toLowerCase()
 const statusKey = filters.status.trim()
 const enrollQ = filters.enroll.trim().toLowerCase()

 if (dateQ && !containsIgnoreCase(row.scheduled_date, dateQ)) return false
 if (classQ) {
  const hay = `${row.classLabel} ${row.course_code_full ?? ""}`.toLowerCase()
  if (!hay.includes(classQ)) return false
 }
 if (timeQ && !containsIgnoreCase(timeLabel(row), timeQ)) return false
 if (teacherQ && !containsIgnoreCase(scheduleTeacherDisplayName(row, { warnIfUnassigned: false }), teacherQ)) {
  return false
 }
 if (roomQ && !containsIgnoreCase(row.classroom_name?.trim() || "未編課室", roomQ)) return false
 if (statusKey && row.status.trim() !== statusKey) return false
 if (enrollQ) {
  if (row.enrollCount == null) return false
  if (!String(row.enrollCount).includes(enrollQ)) return false
 }
 return true
}

export function rowsMatchingScheduleHeaderFiltersExcept(
 rows: ScheduleManageRow[],
 filters: ScheduleListHeaderFilters,
 except: ScheduleListColumnId
): ScheduleManageRow[] {
 const rest: ScheduleListHeaderFilters = { ...filters, [except]: "" }
 return rows.filter((row) => scheduleMatchesHeaderFilters(row, rest))
}

export function compareScheduleListRows(
 a: ScheduleManageRow,
 b: ScheduleManageRow,
 column: ScheduleListColumnId,
 dir: SortDir
): number {
 const mul = dirMul(dir)
 switch (column) {
  case "date": {
   const empty = emptyLast(!a.scheduled_date, !b.scheduled_date)
   if (empty != null) return empty
   const byDate = a.scheduled_date.localeCompare(b.scheduled_date)
   if (byDate !== 0) return byDate * mul
   return timeLabel(a).localeCompare(timeLabel(b), "zh-Hant") * mul
  }
  case "class":
   return a.classLabel.localeCompare(b.classLabel, "zh-Hant") * mul
  case "time":
   return timeLabel(a).localeCompare(timeLabel(b), "zh-Hant") * mul
  case "teacher":
   return scheduleTeacherDisplayName(a, { warnIfUnassigned: false }).localeCompare(
    scheduleTeacherDisplayName(b, { warnIfUnassigned: false }),
    "zh-Hant"
   ) * mul
  case "room": {
   const aRoom = a.classroom_name?.trim() ?? ""
   const bRoom = b.classroom_name?.trim() ?? ""
   const empty = emptyLast(!aRoom, !bRoom)
   if (empty != null) return empty
   return aRoom.localeCompare(bRoom, "zh-Hant") * mul
  }
  case "status":
   return a.status.localeCompare(b.status, "zh-Hant") * mul
  case "enroll": {
   const empty = emptyLast(a.enrollCount == null, b.enrollCount == null)
   if (empty != null) return empty
   return ((a.enrollCount ?? 0) - (b.enrollCount ?? 0)) * mul
  }
 }
}

export function sortScheduleListRows(
 rows: ScheduleManageRow[],
 column: ScheduleListColumnId,
 dir: SortDir
): ScheduleManageRow[] {
 return [...rows].sort((a, b) => compareScheduleListRows(a, b, column, dir))
}

export type ScheduleCsvMeta = {
 rangeLabel: string
 filterLabel: string
 producedAt: string
}

export function buildScheduleCsv(
 rows: ScheduleManageRow[],
 meta: ScheduleCsvMeta
): string {
 const header = ["日期", "班別", "代碼", "開始", "結束", "老師", "位置", "狀態", "點名冊人數", "教學紀錄"]
 const comments = [
  `# 範圍: ${meta.rangeLabel}`,
  `# 篩選: ${meta.filterLabel}`,
  `# 產出時間: ${meta.producedAt}`,
 ]
 const lines = [
  ...comments,
  header.join(","),
  ...rows.map((r) =>
   [
    r.scheduled_date,
    `"${(r.classLabel ?? "").replace(/"/g, '""')}"`,
    r.course_code_full ?? "",
    r.start_time ?? "",
    r.end_time ?? "",
    `"${(r.teacher_name ?? "").replace(/"/g, '""')}"`,
    `"${(r.classroom_name ?? "").replace(/"/g, '""')}"`,
    r.status,
    String(r.enrollCount ?? ""),
    `"${(r.teaching_notes ?? "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
   ].join(",")
  ),
 ]
 return lines.join("\n")
}

export function downloadTextFile(filename: string, contents: string, mime = "text/csv;charset=utf-8"): void {
 const blob = new Blob([contents], { type: mime })
 const a = document.createElement("a")
 a.href = URL.createObjectURL(blob)
 a.download = filename
 a.click()
 URL.revokeObjectURL(a.href)
}
