import { createListDataCache } from "@/lib/listDataCache"
import type { RecentClassEnrollment, StudentRecord } from "@/services/studentQueries"

export type StudentsListCacheKey = {
 isActiveScope: boolean
 showGraduated: boolean
}

export type StudentsListDataCache = {
 key: StudentsListCacheKey
 rows: StudentRecord[]
 tags: Map<string, string[]>
 recentEnrollments: RecentClassEnrollment[]
 hiddenGraduatedCount: number
}

const cache = createListDataCache<StudentsListDataCache>({
 isUsable: (d) => d.rows.length > 0,
})

export function getStudentsListDataCache(): StudentsListDataCache | null {
 return cache.get()
}

export function setStudentsListDataCache(next: StudentsListDataCache, fetchedAt?: number): void {
 cache.set(next, fetchedAt)
}

export function invalidateStudentsListDataCache(): void {
 cache.invalidate()
}

export function patchStudentsListDataCache(
 patch: (current: StudentsListDataCache) => StudentsListDataCache
): void {
 cache.patch(patch)
}

export function isStudentsListCacheFresh(key: StudentsListCacheKey, now = Date.now()): boolean {
 const data = cache.get()
 if (!data) return false
 if (data.key.isActiveScope !== key.isActiveScope) return false
 if (data.key.showGraduated !== key.showGraduated) return false
 return cache.isFresh(now)
}
