/** 試堂結果（復盤）：與 trial_sessions.status（已預約／已完成／取消）分開 */

export type TrialOutcome = "open" | "converted" | "lost" | "other"

export const TRIAL_OUTCOME_LABELS: Record<TrialOutcome, string> = {
 open: "待跟進",
 converted: "已轉化",
 lost: "已流失",
 other: "其他結果",
}

export const TRIAL_LOST_REASON_OPTIONS = [
 "時間不合",
 "學費偏高",
 "選其他補習社",
 "程度不合",
 "沒興趣／不需要",
 "聯絡不上",
 "試堂體驗不佳",
 "其他",
] as const

export const TRIAL_OTHER_RESULT_OPTIONS = [
 "改期再試",
 "轉介其他班／科目",
 "家長考慮中（暫掛）",
 "只試不報（明確）",
 "其他",
] as const

export function normalizeTrialOutcome(raw: string | null | undefined): TrialOutcome {
 const s = String(raw ?? "open").trim()
 if (s === "converted" || s === "lost" || s === "other" || s === "open") return s
 return "open"
}

export function trialOutcomeClosed(outcome: TrialOutcome): boolean {
 return outcome === "converted" || outcome === "lost" || outcome === "other"
}

export function outcomeTagTone(
 outcome: TrialOutcome
): "default" | "info" | "success" | "warning" | "error" {
 if (outcome === "converted") return "success"
 if (outcome === "lost") return "error"
 if (outcome === "other") return "warning"
 return "info"
}

export function formatOutcomeSummary(opts: {
 outcome: TrialOutcome
 reason: string | null
 note: string | null
}): string {
 const label = TRIAL_OUTCOME_LABELS[opts.outcome]
 const bits = [label]
 if (opts.reason) bits.push(opts.reason)
 if (opts.note) bits.push(opts.note)
 return bits.join(" · ")
}
