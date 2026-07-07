/** 與 src/lib/lessonSlots.ts 對齊的時段標籤（Edge 用） */

const LESSON_FIRST_START_MIN = 9 * 60
const LESSON_SLOT_DURATION_MIN = 75
const LESSON_SLOT_COUNT = 10

function formatMin(total: number): string {
  const h = Math.floor(total / 60)
  const mm = total % 60
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
}

function lessonSlotLabel(index: number): string {
  const a = LESSON_FIRST_START_MIN + index * LESSON_SLOT_DURATION_MIN
  const b = a + LESSON_SLOT_DURATION_MIN
  return `${formatMin(a)}–${formatMin(b)}`
}

export const APO_PO_TIME_SLOTS = Array.from({ length: LESSON_SLOT_COUNT }, (_, i) =>
  lessonSlotLabel(i)
)

export const APO_PO_WEEKDAYS = [
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
  "星期日",
] as const

export const APO_PO_GRADE_LABELS = [
  "小一",
  "小二",
  "小三",
  "小四",
  "小五",
  "小六",
  "中一",
  "中二",
  "中三",
  "中四",
  "中五",
  "中六",
] as const

export const GRADE_LABEL_TO_CODE: Record<string, string> = {
  小一: "P1",
  小二: "P2",
  小三: "P3",
  小四: "P4",
  小五: "P5",
  小六: "P6",
  中一: "S1",
  中二: "S2",
  中三: "S3",
  中四: "S4",
  中五: "S5",
  中六: "S6",
}

export function gradeLabelToCourseCode(label: string): string | null {
  return GRADE_LABEL_TO_CODE[label.trim()] ?? null
}
