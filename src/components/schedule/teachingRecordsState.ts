import { createListDataCache } from "@/lib/listDataCache"
import type { TeachingNotesRow } from "@/services/teachingNotesQueries"

export type TeachingRecordsDataCache = {
 from: string
 to: string
 teacherTid: string | null
 rows: TeachingNotesRow[]
}

const cache = createListDataCache<TeachingRecordsDataCache>({
 isUsable: (d) => d.rows.length > 0,
})

export function getTeachingRecordsDataCache(): TeachingRecordsDataCache | null {
 return cache.get()
}

export function setTeachingRecordsDataCache(next: TeachingRecordsDataCache, fetchedAt?: number): void {
 cache.set(next, fetchedAt)
}

export function invalidateTeachingRecordsDataCache(): void {
 cache.invalidate()
}

export function isTeachingRecordsCacheFresh(
 from: string,
 to: string,
 teacherTid: string | null,
 now = Date.now()
): boolean {
 const data = cache.get()
 if (!data) return false
 if (data.from !== from) return false
 if (data.to !== to) return false
 if (data.teacherTid !== teacherTid) return false
 return cache.isFresh(now)
}
