import { createListDataCache } from "@/lib/listDataCache"
import type { ScheduleManageRowSummary } from "@/lib/scheduleManageRowSummary"
import type { RoomRecord } from "@/services/classroomQueries"
import type { ScheduleAlerts, ScheduleManageRow } from "@/services/scheduleQueries"

import { SCHEDULE_RANGE_DAYS, scheduleRangeForStart } from "@/components/schedule/scheduleManageDateState"

export type ScheduleListCacheKey = {
 scope: "range"
 teacherScopeId: string | null
 displayStart: string
 rangeEnd: string
}

export type FutureCancelledScheduleCacheKey = {
 scope: "future-cancelled"
 teacherScopeId: string | null
 asOf: string
}

export type ScheduleListDataCache = {
 key: ScheduleListCacheKey
 rows: ScheduleManageRow[]
 rowSummaries: Map<string, ScheduleManageRowSummary>
 rooms: RoomRecord[]
 roomOptions: { id: string; label: string }[]
 alerts: Map<string, ScheduleAlerts>
 /** 基本列與摘要均完成才可標為 fresh；成功空結果亦為 true。 */
 complete: boolean
}

export type FutureCancelledScheduleCache = {
 key: FutureCancelledScheduleCacheKey
 rows: ScheduleManageRow[]
 rowSummaries: Map<string, ScheduleManageRowSummary>
 rooms: RoomRecord[]
 roomOptions: { id: string; label: string }[]
 alerts: Map<string, ScheduleAlerts>
 /** 基本列與摘要均完成才可標為 fresh；成功空結果亦為 true。 */
 complete: boolean
}

export function scheduleListCacheKey(input: {
 teacherScopeId: string | null
 displayStart: string
 rangeEnd?: string
}): ScheduleListCacheKey {
 return {
  scope: "range",
  teacherScopeId: input.teacherScopeId,
  displayStart: input.displayStart,
  rangeEnd: input.rangeEnd ?? scheduleRangeForStart(input.displayStart, SCHEDULE_RANGE_DAYS),
 }
}

export function futureCancelledScheduleCacheKey(input: {
 teacherScopeId: string | null
 asOf: string
}): FutureCancelledScheduleCacheKey {
 return {
  scope: "future-cancelled",
  teacherScopeId: input.teacherScopeId,
  asOf: input.asOf,
 }
}

export function scheduleListCacheKeysEqual(a: ScheduleListCacheKey, b: ScheduleListCacheKey): boolean {
 return (
  a.scope === b.scope &&
  a.teacherScopeId === b.teacherScopeId &&
  a.displayStart === b.displayStart &&
  a.rangeEnd === b.rangeEnd
 )
}

export function futureCancelledScheduleCacheKeysEqual(
 a: FutureCancelledScheduleCacheKey,
 b: FutureCancelledScheduleCacheKey
): boolean {
 return a.scope === b.scope && a.teacherScopeId === b.teacherScopeId && a.asOf === b.asOf
}

const rangeCache = createListDataCache<ScheduleListDataCache>({
 isUsable: (d) => d.complete,
})

const futureCancelledCache = createListDataCache<FutureCancelledScheduleCache>({
 isUsable: (d) => d.complete,
})

export function getScheduleListDataCache(): ScheduleListDataCache | null {
 return rangeCache.get()
}

export function setScheduleListDataCache(next: ScheduleListDataCache, fetchedAt?: number): void {
 rangeCache.set(next, fetchedAt)
}

export function clearScheduleListDataCache(): void {
 rangeCache.clear()
}

export function invalidateScheduleListDataCache(): void {
 rangeCache.invalidate()
}

export function patchScheduleListDataCache(
 patch: (current: ScheduleListDataCache) => ScheduleListDataCache
): void {
 rangeCache.patch(patch)
}

export function isScheduleListCacheFresh(key: ScheduleListCacheKey, now = Date.now()): boolean {
 const data = rangeCache.get()
 if (!data) return false
 if (!scheduleListCacheKeysEqual(data.key, key)) return false
 return rangeCache.isFresh(now)
}

export function getFutureCancelledScheduleCache(): FutureCancelledScheduleCache | null {
 return futureCancelledCache.get()
}

export function setFutureCancelledScheduleCache(
 next: FutureCancelledScheduleCache,
 fetchedAt?: number
): void {
 futureCancelledCache.set(next, fetchedAt)
}

export function clearFutureCancelledScheduleCache(): void {
 futureCancelledCache.clear()
}

export function invalidateFutureCancelledScheduleCache(): void {
 futureCancelledCache.invalidate()
}

export function isFutureCancelledScheduleCacheFresh(
 key: FutureCancelledScheduleCacheKey,
 now = Date.now()
): boolean {
 const data = futureCancelledCache.get()
 if (!data) return false
 if (!futureCancelledScheduleCacheKeysEqual(data.key, key)) return false
 return futureCancelledCache.isFresh(now)
}

export function invalidateScheduleManageCaches(opts?: { futureCancelled?: boolean }): void {
 invalidateScheduleListDataCache()
 if (opts?.futureCancelled) invalidateFutureCancelledScheduleCache()
}
