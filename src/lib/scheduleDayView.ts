import {
 formatMin,
 intervalsOverlapMinutes,
 LESSON_SLOT_COUNT,
 LESSON_SLOT_DURATION_MIN,
 lessonLastSlotEndMinute,
 lessonSlotStartMinute,
 parseHm,
 standardSlotIndexForStartTime,
} from "@/lib/lessonSlots"
import type { ScheduleManageRow } from "@/services/scheduleQueries"

export function durationMinForSchedule(row: {
 start_time: string | null
 end_time: string | null
}): number {
 const a = parseHm(row.start_time)
 const b = parseHm(row.end_time)
 if (a == null) return LESSON_SLOT_DURATION_MIN
 if (b == null) return LESSON_SLOT_DURATION_MIN
 return Math.max(LESSON_SLOT_DURATION_MIN, b - a)
}

export function isStandardSchedulePlacement(row: { start_time: string | null }): boolean {
 return standardSlotIndexForStartTime(row.start_time) != null
}

export function standardSlotIndexForSchedule(row: { start_time: string | null }): number | null {
 return standardSlotIndexForStartTime(row.start_time)
}

/** 非標準時間說明；標準格則回傳 null */
export function nonStandardTimeHint(row: {
 start_time: string | null
 end_time: string | null
}): string | null {
 if (!row.start_time?.trim()) return "未設定開始時間"
 if (standardSlotIndexForStartTime(row.start_time) == null) {
  return "開始時間未對齊標準格（09:00 起每 75 分鐘）"
 }
 const end = parseHm(row.end_time)
 const lastEnd = lessonLastSlotEndMinute()
 if (end != null && end > lastEnd) return "結束時間超出標準格範圍（最遲 21:30）"
 return null
}

/** 標準格排程佔用列數（用於 rowSpan） */
export function slotSpanForStandardSchedule(row: {
 start_time: string | null
 end_time: string | null
}): number {
 const startIdx = standardSlotIndexForStartTime(row.start_time)
 if (startIdx == null) return 1
 const dur = durationMinForSchedule(row)
 const span = Math.ceil(dur / LESSON_SLOT_DURATION_MIN)
 return Math.min(Math.max(1, span), LESSON_SLOT_COUNT - startIdx)
}

export function scheduleIntervalMinutes(row: {
 start_time: string | null
 end_time: string | null
}): { start: number; end: number } | null {
 const a = parseHm(row.start_time)
 if (a == null) return null
 const b = parseHm(row.end_time)
 const end = b == null || b <= a ? a + LESSON_SLOT_DURATION_MIN : b
 return { start: a, end }
}

export function findScheduleRoomConflicts(
 schedules: ScheduleManageRow[],
 params: {
  excludeId: string
  scheduledDate: string
  roomId: string | null
  startTime: string
  endTime: string
 }
): ScheduleManageRow[] {
 const slotA = parseHm(params.startTime) ?? 0
 const slotB = parseHm(params.endTime) ?? slotA + LESSON_SLOT_DURATION_MIN
 return schedules.filter((s) => {
  if (s.id === params.excludeId) return false
  if (s.scheduled_date !== params.scheduledDate) return false
  if (s.status.includes("取消")) return false
  if ((s.classroom_id ?? null) !== params.roomId) return false
  const iv = scheduleIntervalMinutes(s)
  if (!iv) return false
  return intervalsOverlapMinutes(slotA, slotB, iv.start, iv.end)
 })
}

export function isDateInInclusiveRange(ymd: string, from: string, to: string): boolean {
 return ymd >= from && ymd <= to
}

export function snapTimesToStandardSlot(
 slotIndex: number,
 durationMinutes: number
): { start: string; end: string } {
 const startMin = lessonSlotStartMinute(slotIndex)
 const endMin = startMin + durationMinutes
 return { start: formatMin(startMin), end: formatMin(endMin) }
}
