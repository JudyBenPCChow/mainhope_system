/** 清單頁卸載後再進入時，TTL 內沿用記憶體快取，避免整表重抓。
 * 新開獨立詳情／分頁路由時必須接上。見 `docs/meta/UI_DESIGN_INSTRUCTIONS.md` §16.5。
 */

export const LIST_DATA_CACHE_TTL_MS = 5 * 60 * 1000

export type ListDataCache<T> = {
 get: () => T | null
 set: (next: T, fetchedAt?: number) => void
 /** 保留列以便返回即時顯示，但下次進頁會靜默重抓。 */
 invalidate: () => void
 clear: () => void
 isFresh: (now?: number) => boolean
 patch: (fn: (current: T) => T) => void
}

export function createListDataCache<T>(opts?: {
 ttlMs?: number
 isUsable?: (data: T) => boolean
}): ListDataCache<T> {
 let data: T | null = null
 let fetchedAt = 0
 const ttlMs = opts?.ttlMs ?? LIST_DATA_CACHE_TTL_MS
 const isUsable = opts?.isUsable

 return {
  get() {
   return data
  },
  set(next, at = Date.now()) {
   data = next
   fetchedAt = at
  },
  invalidate() {
   fetchedAt = 0
  },
  clear() {
   data = null
   fetchedAt = 0
  },
  isFresh(now = Date.now()) {
   if (data == null || fetchedAt <= 0) return false
   if (isUsable && !isUsable(data)) return false
   return now - fetchedAt < ttlMs
  },
  patch(fn) {
   if (data == null) return
   data = fn(data)
  },
 }
}
