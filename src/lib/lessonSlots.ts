/** 全應用預設：每日由 09:00 起，每格 75 分鐘（例：09:00–10:15、10:15–11:30） */

export const LESSON_FIRST_START_MIN = 9 * 60 // 09:00
export const LESSON_SLOT_DURATION_MIN = 75
/** 共 10 格：最後一格 20:15–21:30 */
export const LESSON_SLOT_COUNT = 10

export function parseHm(t: string | null): number | null {
 if (!t) return null
 const m = t.match(/^(\d{1,2}):(\d{2})$/)
 if (!m) return null
 const h = Number(m[1])
 const mm = Number(m[2])
 if (Number.isNaN(h) || Number.isNaN(mm)) return null
 return h * 60 + mm
}

export function formatMin(total: number): string {
 const h = Math.floor(total / 60)
 const mm = total % 60
 return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
}

export function lessonSlotStartMinute(index: number): number {
 return LESSON_FIRST_START_MIN + index * LESSON_SLOT_DURATION_MIN
}

export function lessonSlotEndMinute(index: number): number {
 return lessonSlotStartMinute(index) + LESSON_SLOT_DURATION_MIN
}

export function lessonSlotLabel(index: number): string {
 const a = lessonSlotStartMinute(index)
 const b = lessonSlotEndMinute(index)
 return `${formatMin(a)}–${formatMin(b)}`
}

/** 將開始時間對應到格索引（落在該格內或之後對齊用） */
export function slotIndexForStartMin(startMin: number): number {
 if (startMin < LESSON_FIRST_START_MIN) return 0
 const i = Math.floor((startMin - LESSON_FIRST_START_MIN) / LESSON_SLOT_DURATION_MIN)
 return Math.min(Math.max(0, i), LESSON_SLOT_COUNT - 1)
}

export function lessonLastSlotEndMinute(): number {
 return lessonSlotEndMinute(LESSON_SLOT_COUNT - 1)
}

/** 開始時間是否恰為標準格起點（09:00 起每 75 分鐘） */
export function standardSlotIndexForStartTime(startTime: string | null): number | null {
 const m = parseHm(startTime)
 if (m == null) return null
 for (let i = 0; i < LESSON_SLOT_COUNT; i++) {
  if (m === lessonSlotStartMinute(i)) return i
 }
 return null
}

/** 將任意開始分鐘對齊到最近的標準格起點 */
export function nearestStandardSlotIndex(startMin: number): number {
 if (startMin <= LESSON_FIRST_START_MIN) return 0
 const lastStart = lessonSlotStartMinute(LESSON_SLOT_COUNT - 1)
 if (startMin >= lastStart) return LESSON_SLOT_COUNT - 1
 const rel = startMin - LESSON_FIRST_START_MIN
 const idx = Math.round(rel / LESSON_SLOT_DURATION_MIN)
 return Math.min(Math.max(0, idx), LESSON_SLOT_COUNT - 1)
}

export function intervalsOverlapMinutes(a0: number, a1: number, b0: number, b1: number): boolean {
 return a0 < b1 && b0 < a1
}

export const LESSON_SLOT_INDICES = Array.from({ length: LESSON_SLOT_COUNT }, (_, i) => i)
