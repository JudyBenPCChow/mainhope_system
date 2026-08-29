/** 軟封存查詢收窄。缺省開啟；設 `"0"` 即回滾為全量載入。畫面開關屬後續波次。 */
export const SOFT_ARCHIVE_QUERIES_LS = "mgmt_soft_archive_queries"

export function isSoftArchiveQueriesEnabled(): boolean {
 try {
  const raw = localStorage.getItem(SOFT_ARCHIVE_QUERIES_LS)
  if (raw == null || raw === "") return true
  return raw !== "0" && raw.toLowerCase() !== "false"
 } catch {
  return true
 }
}
