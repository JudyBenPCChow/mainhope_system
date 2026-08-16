export type AttendanceTabRow = {
 id: string
 classId: string
 attendance_date: string
 status: string
 classLabel: string
}

export type AttendanceStatusFilter = "all" | "present" | "absent" | "other"
export type AttendanceSort =
 | "dateDesc"
 | "dateAsc"
 | "classAsc"
 | "classDesc"
 | "statusAsc"

export type AttendanceTabLoad<T> =
 | { status: "loading" }
 | { status: "ready"; rows: T[] }
 | { status: "error"; message: string }

export function attendanceTabKind<T>(
 load: AttendanceTabLoad<T>
): "loading" | "error" | "empty" | "rows" {
 if (load.status === "loading") return "loading"
 if (load.status === "error") return "error"
 return load.rows.length === 0 ? "empty" : "rows"
}

export function attendanceStatusCategory(status: string): "present" | "absent" | "other" {
 const s = status.trim()
 if (s.includes("缺席")) return "absent"
 if (s.includes("出席")) return "present"
 return "other"
}

export function summarizeAttendanceStats(rows: AttendanceTabRow[]): {
 present: number
 absent: number
 makeup: number
} {
 return {
  present: rows.filter(
   (x) =>
    x.status === "現場" ||
    x.status.includes("出席") ||
    x.status === "zoom實時網課" ||
    x.status === "即時直播" ||
    x.status === "錄影回放"
  ).length,
  absent: rows.filter((x) => x.status === "no show" || x.status.includes("缺席")).length,
  makeup: rows.filter(
   (x) =>
    x.status === "請假而不需補回" ||
    x.status === "不用補回" ||
    x.status.includes("補") ||
    x.status.includes("待")
  ).length,
 }
}

export function attendanceClassOptions(rows: AttendanceTabRow[]): [string, string][] {
 const m = new Map<string, string>()
 for (const a of rows) {
  if (a.classId) m.set(a.classId, a.classLabel)
 }
 return [...m.entries()].sort((x, y) => x[1].localeCompare(y[1], "zh-Hant"))
}

export function filterSortAttendance<T extends AttendanceTabRow>(
 rows: T[],
 opts: {
  classFilter: string
  statusFilter: AttendanceStatusFilter
  dateFrom: string
  dateTo: string
  sort: AttendanceSort
 }
): T[] {
 let list = rows.filter((a) => {
  if (opts.classFilter !== "all" && a.classId !== opts.classFilter) return false
  const cat = attendanceStatusCategory(a.status)
  if (opts.statusFilter !== "all" && cat !== opts.statusFilter) return false
  if (opts.dateFrom && a.attendance_date < opts.dateFrom) return false
  if (opts.dateTo && a.attendance_date > opts.dateTo) return false
  return true
 })
 list = [...list]
 const cmpDate = (da: string, db: string) => da.localeCompare(db)
 const cmpClass = (a: AttendanceTabRow, b: AttendanceTabRow) =>
  a.classLabel.localeCompare(b.classLabel, "zh-Hant")
 list.sort((a, b) => {
  switch (opts.sort) {
   case "dateAsc":
    return cmpDate(a.attendance_date, b.attendance_date)
   case "dateDesc":
    return cmpDate(b.attendance_date, a.attendance_date)
   case "classAsc":
    return cmpClass(a, b) || cmpDate(b.attendance_date, a.attendance_date)
   case "classDesc":
    return cmpClass(b, a) || cmpDate(b.attendance_date, a.attendance_date)
   case "statusAsc":
    return a.status.localeCompare(b.status, "zh-Hant") || cmpDate(b.attendance_date, a.attendance_date)
   default:
    return cmpDate(b.attendance_date, a.attendance_date)
  }
 })
 return list
}
