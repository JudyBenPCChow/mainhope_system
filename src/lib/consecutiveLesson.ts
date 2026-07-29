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

/** 第一格時段索引是否可設定連堂（需有下一格） */
export function canUseConsecutiveFromSlotIndex(index: number): boolean {
 return Number.isInteger(index) && index >= 0 && index < LESSON_SLOT_COUNT - 1
}

/** 第一格時段是否可設定連堂（需有下一格） */
export function canUseConsecutiveFromTimeSlot(timeSlot: string): boolean {
 const idx = slotIndexFromTimeSlot(timeSlot)
 return idx != null && canUseConsecutiveFromSlotIndex(idx)
}

export type ConsecutiveSlotPair = {
 firstIndex: number
 slot1: { start: string; end: string; label: string; timeSlot: string }
 slot2: { start: string; end: string; label: string; timeSlot: string }
 displayRange: string
}

/** 由第一格索引取得連堂兩節（與 time_slot 字串版同等） */
export function consecutivePairFromFirstSlotIndex(index: number): ConsecutiveSlotPair | null {
 if (!canUseConsecutiveFromSlotIndex(index)) return null
 const slot1 = timeBoundsForSlotIndex(index)
 const slot2 = timeBoundsForSlotIndex(index + 1)
 return {
  firstIndex: index,
  slot1: { ...slot1, timeSlot: slot1.label },
  slot2: { ...slot2, timeSlot: slot2.label },
  displayRange: `${slot1.start}–${slot2.end}`,
 }
}

export function consecutivePairFromFirstTimeSlot(timeSlot: string): ConsecutiveSlotPair | null {
 const firstIndex = slotIndexFromTimeSlot(timeSlot)
 if (firstIndex == null) return null
 return consecutivePairFromFirstSlotIndex(firstIndex)
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

export type RollCallSlotDetail = {
 id: string
 start_time: string | null
 end_time: string | null
 consecutive_slot_index: number | null
 session_number: number | null
}

export type RollCallScheduleEntry = {
 key: string
 scheduleIds: string[]
 /** 與 scheduleIds 對應的各節時間（連堂單項補堂提醒／標籤用） */
 slotDetails: RollCallSlotDetail[]
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

/** 連堂節次標籤：第 1／第 2 節（資料庫 consecutive_slot_index 為 1|2） */
export function formatConsecutiveSlotOnlyLabel(
 slotIndex: number | null | undefined
): string {
 if (slotIndex == null || Number.isNaN(Number(slotIndex))) return "僅一節"
 return `僅第 ${Number(slotIndex)} 節`
}

export function rollCallSlotDetailForSchedule(
 entry: RollCallScheduleEntry,
 scheduleId: string
): RollCallSlotDetail | null {
 return entry.slotDetails.find((s) => s.id === scheduleId) ?? null
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
   slotDetails: [
    {
     id: row.id,
     start_time: row.start_time,
     end_time: row.end_time,
     consecutive_slot_index: row.consecutive_slot_index ?? null,
     session_number: row.session_number ?? null,
    },
   ],
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
   slotDetails: sorted.map((r) => ({
    id: r.id,
    start_time: r.start_time,
    end_time: r.end_time,
    consecutive_slot_index: r.consecutive_slot_index ?? null,
    session_number: r.session_number ?? null,
   })),
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

export type ScheduleTimeRow = {
 start_time: string | null
 end_time: string | null
 consecutive_group_id?: string | null
 consecutive_slot_index?: number | null
}

/** 將 DB 時間（如 15:15:00）裁成 HH:MM */
export function trimTimeHm(time: string | null | undefined): string | null {
 if (!time?.trim()) return null
 const m = time.trim().match(/^(\d{1,2}:\d{2})/)
 return m ? m[1] : time.trim().slice(0, 5)
}

/** 解析 WhatsApp 提醒用時間：連堂取首節開始至末節結束 */
export function resolveLessonReminderTimes(
 schedule: ScheduleTimeRow,
 peers?: Iterable<ScheduleTimeRow>
): { startTime: string | null; endTime: string | null; isConsecutive: boolean } {
 const gid = schedule.consecutive_group_id?.trim()
 if (!gid) {
  return {
   startTime: trimTimeHm(schedule.start_time),
   endTime: trimTimeHm(schedule.end_time),
   isConsecutive: false,
  }
 }

 const group: ScheduleTimeRow[] = []
 if (peers) {
  for (const p of peers) {
   if (p.consecutive_group_id?.trim() === gid) group.push(p)
  }
 }
 if (!group.some((p) => p === schedule)) group.push(schedule)

 const sorted = [...group].sort(
  (a, b) => (a.consecutive_slot_index ?? 0) - (b.consecutive_slot_index ?? 0)
 )

 if (sorted.length <= 1) {
  return {
   startTime: trimTimeHm(schedule.start_time),
   endTime: trimTimeHm(schedule.end_time),
   isConsecutive: false,
  }
 }

 const head = sorted[0]
 const tail = sorted[sorted.length - 1]
 return {
  startTime: trimTimeHm(head.start_time),
  endTime: trimTimeHm(tail?.end_time ?? head.end_time),
  isConsecutive: true,
 }
}
