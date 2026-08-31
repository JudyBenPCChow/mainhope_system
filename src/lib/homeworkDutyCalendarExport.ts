/** 老師「我的當值」一次性加入 iOS 月曆（.ics）。 */

import { mdKeyToIso } from "@/lib/homeworkTutoringSchedules"
import { myAssignments, myDutyDays, type HomeworkDutyDay } from "@/lib/homeworkTutoringUi"

const CALENDAR_PROD_ID = "-//MainHope//Homework Duty//zh-Hant"
const CALENDAR_NAME = "功輔當值"
const CALENDAR_TZID = "Asia/Hong_Kong"
const EVENT_SUMMARY = "【明學】功課輔導班"

/** 對齊收據／工資單校舍地址；中文補馬適路門牌方便地圖定位。 */
export const HOMEWORK_DUTY_CAMPUS_ADDRESS_ZH = "新界粉嶺馬適路 3 號綠悠軒商場 2 樓 11 號"
export const HOMEWORK_DUTY_CAMPUS_ADDRESS_EN =
  "Shop No.11, 2/F, Belair Monte, 3 Ma Sik Road, Fanling, N.T., HK"

export type HomeworkDutyCalendarEvent = {
  isoDate: string
  start: string
  end: string
  rooms: string[]
  slotLines: string[]
}

function pad(value: number): string {
  return String(value).padStart(2, "0")
}

function formatUtcTimestamp(date: Date): string {
  return (
    [date.getUTCFullYear(), pad(date.getUTCMonth() + 1), pad(date.getUTCDate())].join("") +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  )
}

function formatLocalDateTime(ymd: string, hm: string): string {
  const [hourRaw, minuteRaw] = hm.split(":")
  const hour = Number(hourRaw)
  const minute = Number(minuteRaw)
  const datePart = ymd.replaceAll("-", "")
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return `${datePart}T000000`
  }
  return `${datePart}T${pad(hour)}${pad(minute)}00`
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

function asHm(value: string): string {
  const sliced = value.slice(0, 5)
  return /^\d{2}:\d{2}$/.test(sliced) ? sliced : value
}

/** 該老師該月當值：一日多段合併為最早開始至最遲結束。 */
export function homeworkDutyCalendarEvents(
  teacherId: string,
  yearMonth: string,
  days: HomeworkDutyDay[]
): HomeworkDutyCalendarEvent[] {
  const out: HomeworkDutyCalendarEvent[] = []
  for (const day of myDutyDays(teacherId, days)) {
    const isoDate = mdKeyToIso(yearMonth, day.date)
    if (!isoDate) continue
    const mine = myAssignments(day, teacherId)
    if (mine.length === 0) continue
    const starts = mine.map((a) => asHm(a.start)).sort()
    const ends = mine.map((a) => asHm(a.end)).sort()
    const rooms = [...new Set(mine.map((a) => a.room.trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "zh-Hant")
    )
    out.push({
      isoDate,
      start: starts[0] ?? "15:30",
      end: ends[ends.length - 1] ?? "19:30",
      rooms,
      slotLines: mine.map((a) => `${a.room} ${asHm(a.start)}–${asHm(a.end)}`),
    })
  }
  return out
}

function eventDescription(event: HomeworkDutyCalendarEvent): string {
  const roomLabel = event.rooms.length > 0 ? event.rooms.join("／") : "—"
  return [
    "明學教育功課輔導班當值",
    `課室：${roomLabel}`,
    `時段：${event.start}–${event.end}`,
    event.slotLines.length > 1 ? `分時段：${event.slotLines.join("；")}` : null,
    `地址：${HOMEWORK_DUTY_CAMPUS_ADDRESS_ZH}`,
    HOMEWORK_DUTY_CAMPUS_ADDRESS_EN,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n")
}

function eventLines(event: HomeworkDutyCalendarEvent, teacherId: string, nowStamp: string): string[] {
  const lines = ["BEGIN:VEVENT"]
  pushRawProp(lines, "UID", `homework-duty-${teacherId}-${event.isoDate}@mainhope.edu.hk`)
  pushRawProp(lines, "DTSTAMP", nowStamp)
  pushProp(lines, "SUMMARY", EVENT_SUMMARY)
  pushProp(lines, "DESCRIPTION", eventDescription(event))
  pushProp(lines, "LOCATION", `${HOMEWORK_DUTY_CAMPUS_ADDRESS_ZH}, ${HOMEWORK_DUTY_CAMPUS_ADDRESS_EN}`)
  pushRawProp(
    lines,
    `DTSTART;TZID=${CALENDAR_TZID}`,
    formatLocalDateTime(event.isoDate, event.start)
  )
  pushRawProp(lines, `DTEND;TZID=${CALENDAR_TZID}`, formatLocalDateTime(event.isoDate, event.end))
  lines.push("BEGIN:VALARM")
  pushRawProp(lines, "ACTION", "DISPLAY")
  pushProp(lines, "DESCRIPTION", EVENT_SUMMARY)
  pushRawProp(lines, "TRIGGER", "-PT1H")
  lines.push("END:VALARM")
  lines.push("END:VEVENT")
  return lines
}

export function buildHomeworkDutyCalendarIcs(opts: {
  teacherId: string
  yearMonth: string
  days: HomeworkDutyDay[]
  now?: Date
}): string {
  const events = homeworkDutyCalendarEvents(opts.teacherId, opts.yearMonth, opts.days)
  const nowStamp = formatUtcTimestamp(opts.now ?? new Date())
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${CALENDAR_PROD_ID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ]
  pushProp(lines, "X-WR-CALNAME", CALENDAR_NAME)
  pushRawProp(lines, "X-WR-TIMEZONE", CALENDAR_TZID)

  for (const event of events) {
    lines.push(...eventLines(event, opts.teacherId, nowStamp))
  }
  lines.push("END:VCALENDAR")
  return `${lines.join("\r\n")}\r\n`
}

function isAppleTouchDevice(): boolean {
  if (typeof navigator === "undefined") return false
  return (
    /iP(ad|hone|od)/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}

function triggerIcsFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function downloadHomeworkDutyCalendarIcs(opts: {
  teacherId: string
  yearMonth: string
  days: HomeworkDutyDay[]
}): void {
  const events = homeworkDutyCalendarEvents(opts.teacherId, opts.yearMonth, opts.days)
  if (events.length === 0) {
    throw new Error("本月沒有可加入月曆的當值。")
  }
  const content = buildHomeworkDutyCalendarIcs(opts)
  const filename = `功輔當值-${opts.yearMonth}.ics`
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" })
  const file = new File([blob], filename, { type: "text/calendar;charset=utf-8" })
  if (
    isAppleTouchDevice() &&
    typeof navigator.share === "function" &&
    (!navigator.canShare || navigator.canShare({ files: [file] }))
  ) {
    void navigator.share({ files: [file], title: EVENT_SUMMARY }).catch((err) => {
      if (err instanceof Error && err.name === "AbortError") return
      triggerIcsFileDownload(blob, filename)
    })
    return
  }
  triggerIcsFileDownload(blob, filename)
}
