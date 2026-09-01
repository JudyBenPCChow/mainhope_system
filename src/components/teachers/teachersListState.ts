import { createListDataCache } from "@/lib/listDataCache"
import type { TeacherRecord } from "@/services/teacherQueries"

export type TeachersListDataCache = {
 rows: TeacherRecord[]
}

const cache = createListDataCache<TeachersListDataCache>({
 isUsable: (d) => d.rows.length > 0,
})

export function getTeachersListDataCache(): TeachersListDataCache | null {
 return cache.get()
}

export function setTeachersListDataCache(next: TeachersListDataCache, fetchedAt?: number): void {
 cache.set(next, fetchedAt)
}

export function invalidateTeachersListDataCache(): void {
 cache.invalidate()
}

export function isTeachersListCacheFresh(now = Date.now()): boolean {
 return cache.isFresh(now)
}
