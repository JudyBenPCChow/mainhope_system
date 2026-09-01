import { createListDataCache } from "@/lib/listDataCache"
import type { LeaveManageRow, LeaveTodayStats } from "@/services/leaveQueries"

export type LeaveManagementDataCache = {
 includeOlderYears: boolean
 rows: LeaveManageRow[]
 hiddenOlderCount: number
 stats: LeaveTodayStats
}

const cache = createListDataCache<LeaveManagementDataCache>({
 isUsable: (d) => d.rows.length > 0,
})

export function getLeaveManagementDataCache(): LeaveManagementDataCache | null {
 return cache.get()
}

export function setLeaveManagementDataCache(next: LeaveManagementDataCache, fetchedAt?: number): void {
 cache.set(next, fetchedAt)
}

export function invalidateLeaveManagementDataCache(): void {
 cache.invalidate()
}

export function isLeaveManagementCacheFresh(includeOlderYears: boolean, now = Date.now()): boolean {
 const data = cache.get()
 if (!data) return false
 if (data.includeOlderYears !== includeOlderYears) return false
 return cache.isFresh(now)
}
