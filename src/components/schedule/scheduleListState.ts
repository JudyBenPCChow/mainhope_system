import { createListDataCache } from "@/lib/listDataCache"
import type { RoomRecord } from "@/services/classroomQueries"
import type { ScheduleRosterContext } from "@/services/scheduleRosterQueries"
import type { ScheduleAlerts, ScheduleManageRow } from "@/services/scheduleQueries"

export type ScheduleListDataCache = {
 displayStart: string
 rangeEnd: string
 teacherScopeId: string | null
 rows: ScheduleManageRow[]
 rooms: RoomRecord[]
 roomOptions: { id: string; label: string }[]
 rosterContext: ScheduleRosterContext | null
 alerts: Map<string, ScheduleAlerts>
}

const cache = createListDataCache<ScheduleListDataCache>({
 isUsable: (d) => d.rows.length > 0,
})

export function getScheduleListDataCache(): ScheduleListDataCache | null {
 return cache.get()
}

export function setScheduleListDataCache(next: ScheduleListDataCache, fetchedAt?: number): void {
 cache.set(next, fetchedAt)
}

export function invalidateScheduleListDataCache(): void {
 cache.invalidate()
}

export function isScheduleListCacheFresh(
 teacherScopeId: string | null,
 displayStart: string,
 rangeEnd: string,
 now = Date.now()
): boolean {
 const data = cache.get()
 if (!data) return false
 if (data.teacherScopeId !== teacherScopeId) return false
 if (data.displayStart !== displayStart) return false
 if (data.rangeEnd !== rangeEnd) return false
 return cache.isFresh(now)
}
