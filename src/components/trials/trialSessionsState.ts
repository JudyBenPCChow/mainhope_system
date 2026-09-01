import { createListDataCache } from "@/lib/listDataCache"
import type { TeacherRecord } from "@/services/teacherQueries"
import type { TrialDashboardStats, TrialManageRow } from "@/services/trialQueries"

export type TrialSessionsDataCache = {
 includeOlderYears: boolean
 rows: TrialManageRow[]
 hiddenOlderCount: number
 stats: TrialDashboardStats
 teachers: TeacherRecord[]
}

const cache = createListDataCache<TrialSessionsDataCache>({
 isUsable: (d) => d.rows.length > 0,
})

export function getTrialSessionsDataCache(): TrialSessionsDataCache | null {
 return cache.get()
}

export function setTrialSessionsDataCache(next: TrialSessionsDataCache, fetchedAt?: number): void {
 cache.set(next, fetchedAt)
}

export function invalidateTrialSessionsDataCache(): void {
 cache.invalidate()
}

export function isTrialSessionsCacheFresh(includeOlderYears: boolean, now = Date.now()): boolean {
 const data = cache.get()
 if (!data) return false
 if (data.includeOlderYears !== includeOlderYears) return false
 return cache.isFresh(now)
}
