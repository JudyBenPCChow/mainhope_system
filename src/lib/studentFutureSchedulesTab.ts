import { listLoadKind, type ListLoad } from "@/lib/listLoad"

export type FutureScheduleCsvRow = {
 session_number: number | null
 scheduled_date: string
 start_time: string | null
 end_time: string | null
 subject: string
 course_code_full: string | null
 teacher_name: string | null
 status: string
 source: "enrolled" | "makeup"
}

export function futureSchedulesTabKind<T>(load: ListLoad<T>) {
 return listLoadKind(load)
}

function csvEscape(s: string): string {
 return `"${s.replace(/"/g, '""')}"`
}

/** 匯出用 CSV（含 BOM）；失敗／載入中不應呼叫 */
export function buildFutureSchedulesCsv(rows: FutureScheduleCsvRow[]): string {
 const header = ["堂次", "日期", "開始", "結束", "科目", "課程編號", "老師", "狀態", "類型"]
 const body = rows.map((row) =>
  [
   row.session_number != null ? String(row.session_number) : "",
   row.scheduled_date,
   row.start_time ?? "",
   row.end_time ?? "",
   row.subject,
   row.course_code_full ?? "",
   row.teacher_name ?? "",
   row.status,
   row.source === "makeup" ? "補堂" : "就讀",
  ]
   .map((x) => csvEscape(x))
   .join(",")
 )
 return `\uFEFF${header.map(csvEscape).join(",")}\n${body.join("\n")}`
}
