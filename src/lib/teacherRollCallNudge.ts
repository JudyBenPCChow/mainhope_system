/** 昨天或更早仍有未點名（至少一日）即彈出雞先生提醒 */
export const PAST_PENDING_ROLLCALL_NUDGE_MIN_DAYS = 1

/** 往回看幾日的過去排程（含週末空日） */
export const PAST_PENDING_ROLLCALL_NUDGE_LOOKBACK_DAYS = 28

const DISMISS_STORAGE_PREFIX = "chicken_gentleman_nudge_dismissed_v2"

export function countUniqueScheduledDates(rows: { scheduledDate: string }[]): number {
 return new Set(rows.map((row) => row.scheduledDate)).size
}

export function shouldShowChickenGentlemanNudge(uniquePastPendingDays: number): boolean {
 return uniquePastPendingDays >= PAST_PENDING_ROLLCALL_NUDGE_MIN_DAYS
}

function dismissStorageKey(teacherId: string, todayYmd: string): string {
 return `${DISMISS_STORAGE_PREFIX}:${teacherId}:${todayYmd}`
}

export function isChickenGentlemanNudgeDismissed(teacherId: string, todayYmd: string): boolean {
 if (typeof localStorage === "undefined") return false
 try {
  return localStorage.getItem(dismissStorageKey(teacherId, todayYmd)) === "1"
 } catch {
  return false
 }
}

export function dismissChickenGentlemanNudge(teacherId: string, todayYmd: string): void {
 if (typeof localStorage === "undefined") return
 try {
  localStorage.setItem(dismissStorageKey(teacherId, todayYmd), "1")
 } catch {
  /* quota / private mode */
 }
}
