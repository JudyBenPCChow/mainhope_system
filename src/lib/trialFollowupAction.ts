import { trialReceiptGate } from "@/lib/trialReceiptGate"
import { trialOutcomeClosed, type TrialOutcome } from "@/lib/trialOutcome"

/** 只拿掉這一次排程，試堂仍待跟進，可再選日子。 */
export const TRIAL_AWAITING_RESCHEDULE_STATUS = "待改期"

export const TRIAL_BOOKED_STATUS = "已預約"

export function trialIsCancelled(status: string): boolean {
  return String(status).includes("取消")
}

export function trialIsAwaitingReschedule(status: string): boolean {
  return String(status).includes(TRIAL_AWAITING_RESCHEDULE_STATUS)
}

/** 待改期選了新日子後回復已預約；其餘狀態維持不變。 */
export function trialStatusAfterReschedule(status: string): string {
  return trialIsAwaitingReschedule(status) ? TRIAL_BOOKED_STATUS : status
}

export type TrialFollowupKind =
  | "closed"
  | "collect"
  | "wait_class"
  | "convert"
  | "mark_lost"
  | "reschedule"

export type TrialFollowupRow = {
  outcome: TrialOutcome
  status: string
  payment_id: string | null
  payment_status: string | null
  roll_call_done: boolean
  trial_date: string
}

/** 待跟進列上該出現的主動作。上課前已可上紙不催報讀。 */
export function trialFollowupKind(row: TrialFollowupRow, todayYmd: string): TrialFollowupKind {
  if (trialOutcomeClosed(row.outcome)) return "closed"
  if (trialIsAwaitingReschedule(row.status)) return "reschedule"
  if (trialIsCancelled(row.status)) return "mark_lost"
  const gate = trialReceiptGate({
    paymentId: row.payment_id,
    paymentStatus: row.payment_status,
  })
  if (gate !== "received") return "collect"
  const date = String(row.trial_date ?? "").slice(0, 10)
  const attendedOrPast = row.roll_call_done || (date !== "" && date < todayYmd)
  if (!attendedOrPast) return "wait_class"
  return "convert"
}

/** 試堂日已過、結果仍待跟進、未取消。 */
export function trialIsOverdueOpen(row: TrialFollowupRow, todayYmd: string): boolean {
  if (row.outcome !== "open") return false
  if (trialIsCancelled(row.status) || trialIsAwaitingReschedule(row.status)) return false
  return String(row.trial_date ?? "").slice(0, 10) < todayYmd
}

export function displayTrialTypeLabel(trialType: string): string {
  const t = trialType.trim()
  if (t.includes("體驗")) return "免費試堂"
  return t || "—"
}
