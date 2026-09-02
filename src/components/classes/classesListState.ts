import { createListDataCache, LIST_DATA_CACHE_TTL_MS } from "@/lib/listDataCache"
import type { ClassRecord } from "@/services/classQueries"
import type { ClassScheduleSummary } from "@/services/scheduleQueries"

// 篩選 / 檢視狀態改用共用 hook `usePersistentState` 保留（sessionStorage）。
// 本檔負責「已載入資料」的記憶體快取：詳情返回可即時還原，TTL 內不重打網路。

/** 詳情來回視為同一工作階段；逾時才背景重抓。 */
export const CLASSES_LIST_CACHE_TTL_MS = LIST_DATA_CACHE_TTL_MS

export type ClassesListDataCache = {
 rows: ClassRecord[]
 yearOptions: { id: string; label: string; is_current: boolean }[]
 enrollRoster: Map<string, { count: number; names: string[] }>
 scheduleSummaries: Map<string, ClassScheduleSummary>
 hiddenOlderCount: number
 includeOlderYears: boolean
 opsYearLabels: string[]
}

const cache = createListDataCache<ClassesListDataCache>({
 isUsable: (d) => d.rows.length > 0,
})

export function getClassesListDataCache(): ClassesListDataCache | null {
 return cache.get()
}

export function setClassesListDataCache(next: ClassesListDataCache, fetchedAt?: number): void {
 cache.set(next, fetchedAt)
}

export function clearClassesListDataCache(): void {
 cache.clear()
}

/** 保留列以便返回即時顯示，但下次進清單會靜默重抓。 */
export function invalidateClassesListDataCache(): void {
 cache.invalidate()
}

export function isClassesListCacheFresh(includeOlderYears: boolean, now = Date.now()): boolean {
 const data = cache.get()
 if (!data) return false
 if (data.includeOlderYears !== includeOlderYears) return false
 return cache.isFresh(now)
}

export function patchClassesListDataCache(
 patch: (current: ClassesListDataCache) => ClassesListDataCache
): void {
 cache.patch(patch)
}
