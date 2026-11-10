/** 試堂紀錄深連結。只用 trialId，避免 studentId 加 scheduleId 打開「新增試堂」。 */

export const TRIAL_RECORD_FOCUS_LABEL = "前往試堂紀錄，對到該列"

export function trialRecordFocusHref(trialId: string): string {
  const id = trialId.trim()
  if (!id) return "/TrialSessions"
  const q = new URLSearchParams()
  q.set("trialId", id)
  return `/TrialSessions?${q.toString()}`
}
