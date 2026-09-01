import { createListDataCache } from "@/lib/listDataCache"
import type { EnrollmentChangeListRow } from "@/services/enrollmentEventQueries"

export type EnrollmentChangesCacheKey = {
 action: string
 fromYmd: string
 toYmd: string
 search: string
 includeOlderYears: boolean
}

export type EnrollmentChangesDataCache = {
 key: EnrollmentChangesCacheKey
 rows: EnrollmentChangeListRow[]
 hiddenOlderCount: number
}

const cache = createListDataCache<EnrollmentChangesDataCache>({
 isUsable: (d) => d.rows.length > 0,
})

export function getEnrollmentChangesDataCache(): EnrollmentChangesDataCache | null {
 return cache.get()
}

export function setEnrollmentChangesDataCache(
 next: EnrollmentChangesDataCache,
 fetchedAt?: number
): void {
 cache.set(next, fetchedAt)
}

export function isEnrollmentChangesCacheFresh(
 key: EnrollmentChangesCacheKey,
 now = Date.now()
): boolean {
 const data = cache.get()
 if (!data) return false
 if (data.key.action !== key.action) return false
 if (data.key.fromYmd !== key.fromYmd) return false
 if (data.key.toYmd !== key.toYmd) return false
 if (data.key.search !== key.search) return false
 if (data.key.includeOlderYears !== key.includeOlderYears) return false
 return cache.isFresh(now)
}
