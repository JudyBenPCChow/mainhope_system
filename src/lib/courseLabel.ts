import { formatWeekdaysDisplay } from "@/lib/weekdayUtils"

/** 班別顯示名稱：優先課程名稱，其次科目 */
export function classDisplayName(params: {
 subject?: string | null
 courseName?: string | null
}): string {
 const name = (params.courseName ?? "").trim()
 if (name !== "") return name
 return (params.subject ?? "").trim() || "—"
}

export function formatClassLabel(params: {
 subject: string
 courseCode: string | null | undefined
 courseName?: string | null | undefined
}): string {
 const head = classDisplayName(params)
 const code = (params.courseCode ?? "").trim()
 return code !== "" ? `${head}（${code}）` : head
}

/** 逢星期與時段，例如「逢星期六 12:45–14:00」。沒有則空字串。 */
export function formatClassWhenLabel(
 dayOfWeek?: string | null,
 timeSlot?: string | null
): string {
 const day = formatWeekdaysDisplay(dayOfWeek)
 const weekday = day ? (day.startsWith("逢") ? day : `逢${day}`) : ""
 const time = (timeSlot ?? "").trim()
 return [weekday, time].filter(Boolean).join(" ")
}

/** 選班下拉：課程名（代碼）之後附逢星期與時段。不改 {@link formatClassLabel}。 */
export function formatClassPickLabel(params: {
 subject: string
 courseCode: string | null | undefined
 courseName?: string | null | undefined
 dayOfWeek?: string | null
 timeSlot?: string | null
}): string {
 const head = formatClassLabel(params)
 const when = formatClassWhenLabel(params.dayOfWeek, params.timeSlot)
 return when ? `${head} · ${when}` : head
}

