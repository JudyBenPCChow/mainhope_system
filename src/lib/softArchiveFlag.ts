/** 軟封存查詢收窄。缺省開啟；設 `"0"` 即回滾為全量載入。畫面開關在設定頁。 */
export const SOFT_ARCHIVE_QUERIES_LS = "mgmt_soft_archive_queries"

export const SOFT_ARCHIVE_QUERIES_CHANGED_EVENT = "mgmt:soft-archive-queries"

export function isSoftArchiveQueriesEnabled(): boolean {
 try {
  const raw = localStorage.getItem(SOFT_ARCHIVE_QUERIES_LS)
  if (raw == null || raw === "") return true
  return raw !== "0" && raw.toLowerCase() !== "false"
 } catch {
  return true
 }
}

/** 本機開關。關閉後列表／picker 改全量載入（緊急回滾）。 */
export function setSoftArchiveQueriesEnabled(enabled: boolean): void {
 try {
  localStorage.setItem(SOFT_ARCHIVE_QUERIES_LS, enabled ? "1" : "0")
  window.dispatchEvent(new Event(SOFT_ARCHIVE_QUERIES_CHANGED_EVENT))
 } catch {
  /* ignore quota / private mode */
 }
}
