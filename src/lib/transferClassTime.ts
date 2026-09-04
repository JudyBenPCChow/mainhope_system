import { isSingleSessionEnrollment, type EnrollmentFormValue } from "@/lib/enrollmentPeriod"
import {
 isCancelledScheduleStatus,
 type EnrollmentStartScheduleLike,
} from "@/lib/enrollmentStart"

export const TRANSFER_CLASS_TIME_REASON_PREFIX = "轉時間"

export function isTransferClassTimeReason(reason: string | null | undefined): boolean {
 return String(reason ?? "").trim().startsWith(TRANSFER_CLASS_TIME_REASON_PREFIX)
}

export function formatClassTimeSlot(
 dayOfWeek: string | null | undefined,
 timeSlot: string | null | undefined
): string {
 return [dayOfWeek, timeSlot].map((x) => String(x ?? "").trim()).filter(Boolean).join(" ") || "—"
}

export function formatTransferClassTimeReason(opts: {
 fromSlot: string
 toSlot: string
 extra?: string | null
}): string {
 const extra = (opts.extra ?? "").trim()
 const base = `${TRANSFER_CLASS_TIME_REASON_PREFIX}：${opts.fromSlot} → ${opts.toSlot}`
 return extra ? `${base}；${extra}` : base
}

export function canOfferTransferClassTime(row: {
 status: string
 classKind: string | null | undefined
 courseMode: string | null | undefined
 enrollmentPeriod: EnrollmentFormValue | null
}): boolean {
 if (row.status !== "就讀中") return false
 if (row.classKind !== "group") return false
 if (row.courseMode === "summer_two_period") return false
 if (isSingleSessionEnrollment(row.enrollmentPeriod)) return false
 return true
}

export function isTransferStartDateBlocked(opts: {
 startYmd: string
 attendedOnTargetYmds: readonly string[]
 arrangedOnTargetYmds: readonly string[]
}): boolean {
 const start = opts.startYmd.slice(0, 10)
 if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return true
 if (opts.attendedOnTargetYmds.some((d) => d.slice(0, 10) === start)) return true
 return opts.arrangedOnTargetYmds.some((d) => start <= d.slice(0, 10))
}

export function resolveNextTransferStartSchedule<T extends EnrollmentStartScheduleLike>(
 rows: T[],
 todayYmd: string,
 blocked: {
  attendedOnTargetYmds: readonly string[]
  arrangedOnTargetYmds: readonly string[]
 }
): T | null {
 const today = todayYmd.slice(0, 10)
 const eligible = rows.filter((row) => {
  if (isCancelledScheduleStatus(row.status)) return false
  const ymd = row.scheduled_date.slice(0, 10)
  if (ymd < today) return false
  return !isTransferStartDateBlocked({
   startYmd: ymd,
   attendedOnTargetYmds: blocked.attendedOnTargetYmds,
   arrangedOnTargetYmds: blocked.arrangedOnTargetYmds,
  })
 })
 eligible.sort((a, b) => {
  const byDate = a.scheduled_date.slice(0, 10).localeCompare(b.scheduled_date.slice(0, 10))
  if (byDate !== 0) return byDate
  return String(a.start_time ?? "").localeCompare(String(b.start_time ?? ""))
 })
 return eligible[0] ?? null
}

export type TransferStartOptionKind = "selectable" | "attended_makeup" | "arranged_makeup"

export function classifyTransferStartOption(opts: {
 scheduleYmd: string
 todayYmd: string
 attendedOnTargetYmds: readonly string[]
 arrangedOnTargetYmds: readonly string[]
}): TransferStartOptionKind | "hidden" {
 const ymd = opts.scheduleYmd.slice(0, 10)
 const today = opts.todayYmd.slice(0, 10)
 if (opts.attendedOnTargetYmds.some((d) => d.slice(0, 10) === ymd)) return "attended_makeup"
 if (opts.arrangedOnTargetYmds.some((d) => d.slice(0, 10) === ymd)) return "arranged_makeup"
 if (ymd < today) return "hidden"
 return "selectable"
}

export type EnrollmentChangeTimelineInput = {
 id: string
 action: string
 effectiveDate: string
 reason: string | null
 classId: string
 subject: string
 dayOfWeek: string | null
 timeSlot: string | null
 createdAt: string
}

export type StudentEnrollmentChangeLine =
 | {
    kind: "transfer"
    id: string
    effectiveDate: string
    fromSlot: string
    toSlot: string
    reason: string | null
   }
 | {
    kind: "enroll" | "withdraw" | "other"
    id: string
    action: string
    effectiveDate: string
    slot: string
    reason: string | null
   }

export function pairStudentEnrollmentChangeLines(
 events: EnrollmentChangeTimelineInput[]
): StudentEnrollmentChangeLine[] {
 const sorted = [...events].sort((a, b) => {
  if (a.effectiveDate !== b.effectiveDate) return b.effectiveDate.localeCompare(a.effectiveDate)
  return b.createdAt.localeCompare(a.createdAt)
 })
 const used = new Set<string>()
 const lines: StudentEnrollmentChangeLine[] = []

 for (const ev of sorted) {
  if (ev.action !== "withdraw" || !isTransferClassTimeReason(ev.reason) || used.has(ev.id)) continue
  const pair = sorted.find(
   (other) =>
    !used.has(other.id) &&
    other.id !== ev.id &&
    other.action === "enroll" &&
    other.effectiveDate === ev.effectiveDate &&
    other.subject === ev.subject &&
    isTransferClassTimeReason(other.reason)
  )
  if (!pair) continue
  used.add(ev.id)
  used.add(pair.id)
  lines.push({
   kind: "transfer",
   id: `${ev.id}+${pair.id}`,
   effectiveDate: ev.effectiveDate,
   fromSlot: formatClassTimeSlot(ev.dayOfWeek, ev.timeSlot),
   toSlot: formatClassTimeSlot(pair.dayOfWeek, pair.timeSlot),
   reason: ev.reason,
  })
 }

 for (const ev of sorted) {
  if (used.has(ev.id)) continue
  used.add(ev.id)
  const kind = ev.action === "enroll" ? "enroll" : ev.action === "withdraw" ? "withdraw" : "other"
  lines.push({
   kind,
   id: ev.id,
   action: ev.action,
   effectiveDate: ev.effectiveDate,
   slot: formatClassTimeSlot(ev.dayOfWeek, ev.timeSlot),
   reason: ev.reason,
  })
 }

 return lines.sort((a, b) => {
  if (a.effectiveDate !== b.effectiveDate) return b.effectiveDate.localeCompare(a.effectiveDate)
  return a.id.localeCompare(b.id)
 })
}
