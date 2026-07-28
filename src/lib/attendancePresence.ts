/**
 * 實際出席／缺席判定（報表用）。
 * 勿與 isBillableAttendanceStatus 混用：no show 扣堂但不算實際來了。
 */

const PRESENT_EXACT = new Set([
  "現場",
  "錄影回放",
  "zoom實時網課",
  "出席",
  "網課",
  "補課",
  "線上",
  "即時直播",
])

/** 實際出席（含網課／錄影；不含 no show） */
export function isActualPresentStatus(status: string | null | undefined): boolean {
  const s = String(status ?? "").trim()
  if (!s) return false
  if (PRESENT_EXACT.has(s)) return true
  if (s.includes("網課") || (s.includes("線上") && !s.includes("假"))) return true
  return false
}

/** 缺席：no show 或狀態含「缺席」 */
export function isAbsentAttendanceStatus(status: string | null | undefined): boolean {
  const s = String(status ?? "").trim()
  if (!s) return false
  if (s === "no show") return true
  if (s.includes("缺席")) return true
  return false
}
