/** G2 權益池調動原因碼（前線可選） */
export const ENTITLEMENT_ADJUSTMENT_REASON_CODES = [
  "g2a_lesson_count_fix",
  "g2b_wrong_class_move",
  "g2c_transfer_friend",
  "transfer_subject",
  "manual_other",
] as const

export type EntitlementAdjustmentReasonCode =
 (typeof ENTITLEMENT_ADJUSTMENT_REASON_CODES)[number]

export const ENTITLEMENT_ADJUSTMENT_REASON_LABELS: Record<
 EntitlementAdjustmentReasonCode,
 string
> = {
 g2a_lesson_count_fix: "G2a 堂數填錯（調未耗堂）",
 g2b_wrong_class_move: "G2b 科目／班收錯（搬堂）",
 g2c_transfer_friend: "堂數送親友／轉讓",
 transfer_subject: "轉科搬堂",
 manual_other: "其他（請寫明備註）",
}

/** 開單後幾多毫秒內可單人作廢（密碼＋原因） */
export const VOID_SINGLE_OPERATOR_WINDOW_MS = 30 * 60 * 1000

export function voidRequiresSecondConfirmer(
 createdAtIso: string | null | undefined,
 nowMs = Date.now()
): boolean {
 const raw = String(createdAtIso ?? "").trim()
 if (!raw) return true
 const t = Date.parse(raw)
 if (!Number.isFinite(t)) return true
 return nowMs - t > VOID_SINGLE_OPERATOR_WINDOW_MS
}
