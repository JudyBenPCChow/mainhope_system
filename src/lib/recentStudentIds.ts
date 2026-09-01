/** 學生 combobox 空白時的最近名單上限（最近選過＋最近收款合併後）。 */
export const RECENT_STUDENT_ID_LIMIT = 12

/** 收款登記頁：本機記住最近選過的學生 */
export const PAYMENT_RECENT_STUDENT_STORAGE_KEY = "mgmt_recent_payment_students"

/** 班別詳情「增加學生」：本機記住最近選過的學生 */
export const CLASS_ADD_STUDENT_RECENT_STORAGE_KEY = "mgmt_recent_class_add_students"

export function parseRecentStudentIds(raw: string | null | undefined): string[] {
 if (raw == null || raw === "") return []
 try {
  const parsed: unknown = JSON.parse(raw)
  if (!Array.isArray(parsed)) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const item of parsed) {
   if (typeof item !== "string") continue
   const id = item.trim()
   if (!id || seen.has(id)) continue
   seen.add(id)
   out.push(id)
  }
  return out
 } catch {
  return []
 }
}

export function touchRecentStudentId(
 ids: readonly string[],
 nextId: string,
 limit = RECENT_STUDENT_ID_LIMIT
): string[] {
 const id = nextId.trim()
 if (!id) return [...ids]
 const take = Math.min(Math.max(limit, 1), 40)
 return [id, ...ids.filter((x) => x !== id)].slice(0, take)
}

/** 最近選過優先，再補最近收款；去重並截斷。 */
export function mergeRecentStudentIds(
 selectedIds: readonly string[],
 paidIds: readonly string[],
 limit = RECENT_STUDENT_ID_LIMIT
): string[] {
 const take = Math.min(Math.max(limit, 1), 40)
 const out: string[] = []
 const seen = new Set<string>()
 for (const raw of [...selectedIds, ...paidIds]) {
  const id = raw.trim()
  if (!id || seen.has(id)) continue
  seen.add(id)
  out.push(id)
  if (out.length >= take) break
 }
 return out
}

export function readRecentStudentIds(storageKey: string): string[] {
 try {
  if (typeof localStorage === "undefined") return []
  return parseRecentStudentIds(localStorage.getItem(storageKey))
 } catch {
  return []
 }
}

export function writeRecentStudentIds(storageKey: string, ids: readonly string[]): void {
 try {
  if (typeof localStorage === "undefined") return
  localStorage.setItem(storageKey, JSON.stringify([...ids]))
 } catch {
  /* 忽略寫入配額錯誤 */
 }
}
