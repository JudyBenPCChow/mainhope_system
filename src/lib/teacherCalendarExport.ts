import type { CalendarEventRow } from "@/services/calendarQueries"
import type { ScheduleManageRow } from "@/services/scheduleQueries"

const CALENDAR_PROD_ID = "-//Mingxue//Teacher Calendar//zh-Hant"
const CALENDAR_NAME = "銘學老師排程"
const CALENDAR_TZID = "Asia/Hong_Kong"
const DEFAULT_SCHEDULE_DURATION_MIN = 75
const DEFAULT_EVENT_DURATION_MIN = 30

function pad(value: number): string {
 return String(value).padStart(2, "0")
}

function formatUtcTimestamp(date: Date): string {
 return [
  date.getUTCFullYear(),
  pad(date.getUTCMonth() + 1),
  pad(date.getUTCDate()),
 ].join("") + `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
}

function formatLocalDate(ymd: string): string {
 return ymd.replaceAll("-", "")
}

function formatLocalDateTime(ymd: string, hm: string): string {
 const [hourRaw, minuteRaw] = hm.split(":")
 const hour = Number(hourRaw)
 const minute = Number(minuteRaw)
 if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
  return `${formatLocalDate(ymd)}T000000`
 }
 return `${formatLocalDate(ymd)}T${pad(hour)}${pad(minute)}00`
}

function addMinutesToHm(hm: string, minutes: number): string {
 const [hourRaw, minuteRaw] = hm.split(":")
 const hour = Number(hourRaw)
 const minute = Number(minuteRaw)
 if (!Number.isFinite(hour) || !Number.isFinite(minute)) return hm
 const total = hour * 60 + minute + minutes
 const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60)
 return `${pad(Math.floor(normalized / 60))}:${pad(normalized % 60)}`
}

function addDaysYmd(ymd: string, days: number): string {
 const [y, m, d] = ymd.split("-").map(Number)
 const date = new Date(y, m - 1, d)
 date.setDate(date.getDate() + days)
 return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function escapeIcsText(value: string): string {
 return value
  .replaceAll("\\", "\\\\")
  .replaceAll(";", "\\;")
  .replaceAll(",", "\\,")
  .replaceAll("\r\n", "\\n")
  .replaceAll("\n", "\\n")
}

function foldIcsLine(line: string): string[] {
 const limit = 75
 if (line.length <= limit) return [line]
 const out: string[] = []
 let rest = line
 while (rest.length > limit) {
  out.push(rest.slice(0, limit))
  rest = ` ${rest.slice(limit)}`
 }
 out.push(rest)
 return out
}

function pushProp(lines: string[], key: string, value: string): void {
 for (const line of foldIcsLine(`${key}:${escapeIcsText(value)}`)) lines.push(line)
}

function pushRawProp(lines: string[], key: string, value: string): void {
 for (const line of foldIcsLine(`${key}:${value}`)) lines.push(line)
}

function buildScheduleSummary(row: ScheduleManageRow): string {
 const title = row.classLabel || row.subject || "課堂"
 if (!row.original_teacher_name || !row.teacher_name || row.original_teacher_name === row.teacher_name) {
  return title
 }
 return `${title}（代堂：${row.teacher_name}；原老師：${row.original_teacher_name}）`
}

function buildScheduleDescription(row: ScheduleManageRow): string {
 const parts = [
  row.course_code_full ? `課程編號：${row.course_code_full}` : null,
  row.teacher_name ? `授課老師：${row.teacher_name}` : null,
  row.original_teacher_name ? `原任老師：${row.original_teacher_name}` : null,
  row.classroom_name ? `課室：${row.classroom_name}` : null,
  row.remarks?.trim() ? `備註：${row.remarks.trim()}` : null,
  row.status ? `狀態：${row.status}` : null,
 ]
 return parts.filter((part): part is string => Boolean(part)).join("\n")
}

function scheduleEventLines(row: ScheduleManageRow, nowStamp: string): string[] {
 const lines = ["BEGIN:VEVENT"]
 pushRawProp(lines, "UID", `schedule-${row.id}@mingxue`)
 pushRawProp(lines, "DTSTAMP", nowStamp)
 pushProp(lines, "SUMMARY", buildScheduleSummary(row))
 pushProp(lines, "DESCRIPTION", buildScheduleDescription(row))
 if (row.classroom_name) pushProp(lines, "LOCATION", row.classroom_name)
 if (row.start_time) {
  pushRawProp(lines, `DTSTART;TZID=${CALENDAR_TZID}`, formatLocalDateTime(row.scheduled_date, row.start_time))
  const endTime = row.end_time ?? addMinutesToHm(row.start_time, DEFAULT_SCHEDULE_DURATION_MIN)
  pushRawProp(lines, `DTEND;TZID=${CALENDAR_TZID}`, formatLocalDateTime(row.scheduled_date, endTime))
 } else {
  pushRawProp(lines, "DTSTART;VALUE=DATE", formatLocalDate(row.scheduled_date))
  pushRawProp(lines, "DTEND;VALUE=DATE", formatLocalDate(addDaysYmd(row.scheduled_date, 1)))
 }
 lines.push("END:VEVENT")
 return lines
}

function buildCalendarEventDescription(row: CalendarEventRow): string {
 const parts = [
  row.description?.trim() ? row.description.trim() : null,
  row.tags.length > 0 ? `標籤：${row.tags.join("、")}` : null,
  row.latestUpdatePreview?.trim() ? `最新跟進：${row.latestUpdatePreview.trim()}` : null,
 ]
 return parts.filter((part): part is string => Boolean(part)).join("\n")
}

function calendarEventLines(row: CalendarEventRow, nowStamp: string): string[] {
 const lines = ["BEGIN:VEVENT"]
 pushRawProp(lines, "UID", `calendar-event-${row.id}@mingxue`)
 pushRawProp(lines, "DTSTAMP", nowStamp)
 pushProp(lines, "SUMMARY", row.title)
 const description = buildCalendarEventDescription(row)
 if (description) pushProp(lines, "DESCRIPTION", description)
 if (row.allDay) {
  pushRawProp(lines, "DTSTART;VALUE=DATE", formatLocalDate(row.eventDate))
  pushRawProp(lines, "DTEND;VALUE=DATE", formatLocalDate(addDaysYmd(row.eventDate, 1)))
 } else {
  const startTime = row.startTime ?? "00:00"
  const endTime = row.endTime ?? addMinutesToHm(startTime, DEFAULT_EVENT_DURATION_MIN)
  pushRawProp(lines, `DTSTART;TZID=${CALENDAR_TZID}`, formatLocalDateTime(row.eventDate, startTime))
  pushRawProp(lines, `DTEND;TZID=${CALENDAR_TZID}`, formatLocalDateTime(row.eventDate, endTime))
 }
 lines.push("END:VEVENT")
 return lines
}

export function buildTeacherCalendarIcs(
 schedules: ScheduleManageRow[],
 calendarEvents: CalendarEventRow[]
): string {
 const nowStamp = formatUtcTimestamp(new Date())
 const lines = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  `PRODID:${CALENDAR_PROD_ID}`,
  "CALSCALE:GREGORIAN",
  "METHOD:PUBLISH",
 ]
 pushProp(lines, "X-WR-CALNAME", CALENDAR_NAME)
 pushRawProp(lines, "X-WR-TIMEZONE", CALENDAR_TZID)

 for (const row of schedules) {
  if (row.status.includes("取消")) continue
  lines.push(...scheduleEventLines(row, nowStamp))
 }
 for (const row of calendarEvents) {
  lines.push(...calendarEventLines(row, nowStamp))
 }
 lines.push("END:VCALENDAR")
 return `${lines.join("\r\n")}\r\n`
}

export function downloadTeacherCalendarIcs(
 schedules: ScheduleManageRow[],
 calendarEvents: CalendarEventRow[],
 todayYmd: string
): void {
 const content = buildTeacherCalendarIcs(schedules, calendarEvents)
 const blob = new Blob([content], { type: "text/calendar;charset=utf-8" })
 const url = URL.createObjectURL(blob)
 const anchor = document.createElement("a")
 anchor.href = url
 anchor.download = `teacher-calendar-${todayYmd}.ics`
 anchor.click()
 URL.revokeObjectURL(url)
}
