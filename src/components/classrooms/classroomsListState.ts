import { createListDataCache } from "@/lib/listDataCache"
import type { RoomRecord, RoomScheduleRow } from "@/services/classroomQueries"

export type ClassroomsListDataCache = {
 rooms: RoomRecord[]
 selectedRoomId: string
 weekStartYmd: string
 weekEndYmd: string
 schedules: RoomScheduleRow[]
}

const cache = createListDataCache<ClassroomsListDataCache>({
 isUsable: (d) => d.rooms.length > 0,
})

export function getClassroomsListDataCache(): ClassroomsListDataCache | null {
 return cache.get()
}

export function setClassroomsListDataCache(next: ClassroomsListDataCache, fetchedAt?: number): void {
 cache.set(next, fetchedAt)
}

export function invalidateClassroomsListDataCache(): void {
 cache.invalidate()
}

export function patchClassroomsListDataCache(
 patch: (current: ClassroomsListDataCache) => ClassroomsListDataCache
): void {
 cache.patch(patch)
}

export function isClassroomsRoomsCacheFresh(now = Date.now()): boolean {
 const data = cache.get()
 if (!data) return false
 return cache.isFresh(now)
}

export function isClassroomsSchedulesCacheFresh(
 selectedRoomId: string,
 weekStartYmd: string,
 weekEndYmd: string,
 now = Date.now()
): boolean {
 const data = cache.get()
 if (!data) return false
 if (data.selectedRoomId !== selectedRoomId) return false
 if (data.weekStartYmd !== weekStartYmd) return false
 if (data.weekEndYmd !== weekEndYmd) return false
 return cache.isFresh(now)
}
