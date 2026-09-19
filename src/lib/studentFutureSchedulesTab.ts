import { listLoadKind, type ListLoad } from "@/lib/listLoad"

export type UpcomingScheduleSource = "enrolled" | "makeup" | "trial"

export type FutureScheduleCsvRow = {
 session_number: number | null
 scheduled_date: string
 start_time: string | null
 end_time: string | null
 subject: string
 course_code_full: string | null
 teacher_name: string | null
 status: string
 source: UpcomingScheduleSource
}

/** 與點名紙試堂閘一致：未取消、已確認收款才算未來會出席的試堂。 */
export function trialQualifiesForStudentUpcoming(params: {
 trialStatus: string
 paymentId: string | null | undefined
 paymentStatus: string | null | undefined
}): boolean {
 const status = String(params.trialStatus ?? "")
 if (status.includes("取消") || status.includes("完成")) return false
 if (!String(params.paymentId ?? "").trim()) return false
 return String(params.paymentStatus ?? "").trim() === "已收款"
}

export function upcomingScheduleSourceLabel(source: UpcomingScheduleSource): string {
 if (source === "makeup") return "補堂"
 if (source === "trial") return "試堂"
 return "就讀"
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
   upcomingScheduleSourceLabel(row.source),
  ]
   .map((x) => csvEscape(x))
   .join(",")
 )
 return `\uFEFF${header.map(csvEscape).join(",")}\n${body.join("\n")}`
}
