import { createListDataCache } from "@/lib/listDataCache"
import type { PrivateTutoringStudentRow } from "@/services/privateTutoringQueries"

export type PrivateTutoringDataCache = {
 teacherTid: string | null
 rows: PrivateTutoringStudentRow[]
}

const cache = createListDataCache<PrivateTutoringDataCache>({
 isUsable: (d) => d.rows.length > 0,
})

export function getPrivateTutoringDataCache(): PrivateTutoringDataCache | null {
 return cache.get()
}

export function setPrivateTutoringDataCache(next: PrivateTutoringDataCache, fetchedAt?: number): void {
 cache.set(next, fetchedAt)
}

export function invalidatePrivateTutoringDataCache(): void {
 cache.invalidate()
}

export function isPrivateTutoringCacheFresh(teacherTid: string | null, now = Date.now()): boolean {
 const data = cache.get()
 if (!data) return false
 if (data.teacherTid !== teacherTid) return false
 return cache.isFresh(now)
}
