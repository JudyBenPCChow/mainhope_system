import type { ClassRecord } from "@/services/classQueries"
import type { ClassScheduleSummary } from "@/services/scheduleQueries"

// 篩選 / 檢視狀態改用共用 hook `usePersistentState` 保留（sessionStorage）。
// 本檔負責「已載入資料」的記憶體快取：詳情返回可即時還原，TTL 內不重打網路。

/** 詳情來回視為同一工作階段；逾時才背景重抓。 */
export const CLASSES_LIST_CACHE_TTL_MS = 5 * 60 * 1000

export type ClassesListDataCache = {
 rows: ClassRecord[]
 yearOptions: { id: string; label: string; is_current: boolean }[]
 enrollRoster: Map<string, { count: number; names: string[] }>
 scheduleSummaries: Map<string, ClassScheduleSummary>
 hiddenOlderCount: number
 includeOlderYears: boolean
 opsYearLabels: string[]
 fetchedAt: number
}

let dataCache: ClassesListDataCache | null = null

export function getClassesListDataCache(): ClassesListDataCache | null {
 return dataCache
}

export function setClassesListDataCache(cache: ClassesListDataCache): void {
 dataCache = cache
}

export function clearClassesListDataCache(): void {
 dataCache = null
}

/** 保留列以便返回即時顯示，但下次進清單會靜默重抓。 */
export function invalidateClassesListDataCache(): void {
 if (!dataCache) return
 dataCache = { ...dataCache, fetchedAt: 0 }
}

export function isClassesListCacheFresh(includeOlderYears: boolean, now = Date.now()): boolean {
 if (!dataCache) return false
 if (dataCache.includeOlderYears !== includeOlderYears) return false
 if (dataCache.rows.length === 0) return false
 return now - dataCache.fetchedAt < CLASSES_LIST_CACHE_TTL_MS
}

export function patchClassesListDataCache(
 patch: (cache: ClassesListDataCache) => ClassesListDataCache
): void {
 if (!dataCache) return
 dataCache = patch(dataCache)
}
