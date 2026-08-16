import { LESSON_SLOT_INDICES, lessonSlotLabel } from "@/lib/lessonSlots"

/** 班別固定時段選項（與課表／課室 75 分鐘格一致） */
export const CLASS_TIME_SLOT_OPTIONS = LESSON_SLOT_INDICES.map((i) => lessonSlotLabel(i))

function timeSlotsEqual(a: string, b: string): boolean {
 return a === b || a.replace(/\u2013/g, "-") === b.replace(/\u2013/g, "-")
}

/** 表單下拉：對齊標準選項；舊資料（連字號等）保留原值供選取 */
export function timeSlotSelectValueFromStored(raw: string | null | undefined): string {
 if (!raw?.trim()) return ""
 const t = raw.trim()
 const hit = CLASS_TIME_SLOT_OPTIONS.find((opt) => timeSlotsEqual(opt, t))
 return hit ?? t
}

export function isKnownClassTimeSlot(raw: string | null | undefined): boolean {
 if (!raw?.trim()) return true
 return CLASS_TIME_SLOT_OPTIONS.some((opt) => timeSlotsEqual(opt, raw.trim()))
}
