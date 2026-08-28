import type { ClassRecord } from "@/services/classQueries"
import type { ClassScheduleSummary } from "@/services/scheduleQueries"

// 篩選 / 檢視狀態改用共用 hook `usePersistentState` 保留（sessionStorage）。
// 本檔僅負責「已載入資料」的記憶體快取。

/** 已載入資料的記憶體快取：返回列表時可即時還原、背景靜默更新，不再閃「載入中」。 */
export type ClassesListDataCache = {
 rows: ClassRecord[]
 yearOptions: { id: string; label: string; is_current: boolean }[]
 enrollRoster: Map<string, { count: number; names: string[] }>
 scheduleSummaries: Map<string, ClassScheduleSummary>
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
