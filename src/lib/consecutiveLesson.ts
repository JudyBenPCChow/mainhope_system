import { timeSlotSelectValueFromStored } from "@/components/classes/classesUi"
import {
 formatMin,
 LESSON_SLOT_COUNT,
 LESSON_SLOT_INDICES,
 lessonSlotEndMinute,
 lessonSlotLabel,
 lessonSlotStartMinute,
} from "@/lib/lessonSlots"

export const MAX_LESSON_SLOTS_PER_SESSION = 2 as const

export function isConsecutiveClass(lessonSlotsPerSession: number | null | undefined): boolean {
 return Number(lessonSlotsPerSession) === MAX_LESSON_SLOTS_PER_SESSION
}

function timeSlotsEqual(a: string, b: string): boolean {
 return a === b || a.replace(/\u2013/g, "-") === b.replace(/\u2013/g, "-")
}

export function slotIndexFromTimeSlot(timeSlot: string): number | null {
 const normalized = timeSlotSelectValueFromStored(timeSlot) || timeSlot.trim()
 const idx = LESSON_SLOT_INDICES.find((i) => timeSlotsEqual(lessonSlotLabel(i), normalized))
 return idx != null && idx >= 0 ? idx : null
}

export function timeBoundsForSlotIndex(index: number): { start: string; end: string; label: string } {
 const a = lessonSlotStartMinute(index)
 const b = lessonSlotEndMinute(index)
 return { start: formatMin(a), end: formatMin(b), label: lessonSlotLabel(index) }
}

/** 第一格時段是否可設定連堂（需有下一格） */
export function canUseConsecutiveFromTimeSlot(timeSlot: string): boolean {
 const idx = slotIndexFromTimeSlot(timeSlot)
 return idx != null && idx >= 0 && idx < LESSON_SLOT_COUNT - 1
}

export type ConsecutiveSlotPair = {
 firstIndex: number
 slot1: { start: string; end: string; label: string; timeSlot: string }
 slot2: { start: string; end: string; label: string; timeSlot: string }
 displayRange: string
}

export function consecutivePairFromFirstTimeSlot(timeSlot: string): ConsecutiveSlotPair | null {
 const firstIndex = slotIndexFromTimeSlot(timeSlot)
 if (firstIndex == null || firstIndex < 0 || firstIndex >= LESSON_SLOT_COUNT - 1) return null
 const slot1 = timeBoundsForSlotIndex(firstIndex)
 const slot2 = timeBoundsForSlotIndex(firstIndex + 1)
 return {
  firstIndex,
  slot1: { ...slot1, timeSlot: slot1.label },
  slot2: { ...slot2, timeSlot: slot2.label },
  displayRange: `${slot1.start}–${slot2.end}`,
 }
}

export function formatClassTimeDisplay(params: {
 dayOfWeek: string | null | undefined
 timeSlot: string | null | undefined
 lessonSlotsPerSession?: number | null
}): string {
 const day = (params.dayOfWeek ?? "").trim()
 const slot = (params.timeSlot ?? "").trim()
 if (!slot) return day || "—"
 if (!isConsecutiveClass(params.lessonSlotsPerSession)) {
  return [day, slot].filter(Boolean).join(" ") || "—"
 }
 const pair = consecutivePairFromFirstTimeSlot(slot)
 if (!pair) return [day, slot].filter(Boolean).join(" ") || "—"
 const timePart = `${pair.displayRange}（連堂 · 150 分鐘 · 計 2 節）`
 return [day, timePart].filter(Boolean).join(" ") || "—"
}

export function formatConsecutiveSessionLabel(sessionNumbers: (number | null | undefined)[]): string {
 const nums = sessionNumbers.filter((n): n is number => n != null && !Number.isNaN(n))
 if (nums.length === 0) return "—"
 if (nums.length === 1) return `第 ${nums[0]} 堂`
 const lo = Math.min(...nums)
 const hi = Math.max(...nums)
 if (hi - lo === nums.length - 1 && nums.length > 1) {
  return `第 ${lo}–${hi} 堂（連堂）`
 }
 return nums.map((n) => `第 ${n} 堂`).join("、")
}

export type RollCallScheduleEntry = {
 key: string
 scheduleIds: string[]
 sessionNumbers: (number | null)[]
 class_id: string
 scheduled_date: string
 start_time: string | null
 end_time: string | null
 classLabel: string
 course_code_full: string | null
 teacher_name: string | null
 isConsecutive: boolean
}

export type ScheduleRollCallSource = {
 id: string
 scheduled_date: string
 start_time: string | null
 end_time: string | null
 class_id: string | null
 classLabel: string
 course_code_full: string | null
 teacher_name: string | null
 session_number?: number | null
 consecutive_group_id?: string | null
 consecutive_slot_index?: number | null
}

/** 連堂組在點名選單合併為一項 */
export function buildRollCallScheduleEntries(
 rows: ScheduleRollCallSource[]
): RollCallScheduleEntry[] {
 const byGroup = new Map<string, ScheduleRollCallSource[]>()
 const singles: ScheduleRollCallSource[] = []

 for (const row of rows) {
  const gid = row.consecutive_group_id?.trim()
  if (gid) {
   const arr = byGroup.get(gid) ?? []
   arr.push(row)
   byGroup.set(gid, arr)
  } else {
   singles.push(row)
  }
 }

 const out: RollCallScheduleEntry[] = []

 for (const row of singles) {
  if (!row.class_id) continue
  out.push({
   key: row.id,
   scheduleIds: [row.id],
   sessionNumbers: [row.session_number ?? null],
   class_id: row.class_id,
   scheduled_date: row.scheduled_date,
   start_time: row.start_time,
   end_time: row.end_time,
   classLabel: row.classLabel,
   course_code_full: row.course_code_full,
   teacher_name: row.teacher_name,
   isConsecutive: false,
  })
 }

 for (const [gid, groupRows] of byGroup) {
  const sorted = [...groupRows].sort(
   (a, b) => (a.consecutive_slot_index ?? 0) - (b.consecutive_slot_index ?? 0)
  )
  const head = sorted[0]
  if (!head?.class_id) continue
  const tail = sorted[sorted.length - 1]
  out.push({
   key: gid,
   scheduleIds: sorted.map((r) => r.id),
   sessionNumbers: sorted.map((r) => r.session_number ?? null),
   class_id: head.class_id,
   scheduled_date: head.scheduled_date,
   start_time: head.start_time,
   end_time: tail?.end_time ?? head.end_time,
   classLabel: head.classLabel,
   course_code_full: head.course_code_full,
   teacher_name: head.teacher_name,
   isConsecutive: sorted.length > 1,
  })
 }

 return out.sort((a, b) => {
  const d = a.scheduled_date.localeCompare(b.scheduled_date)
  if (d !== 0) return d
  return (a.start_time ?? "").localeCompare(b.start_time ?? "")
 })
}

export function newConsecutiveGroupId(): string {
 if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
  return crypto.randomUUID()
 }
 return `cg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
