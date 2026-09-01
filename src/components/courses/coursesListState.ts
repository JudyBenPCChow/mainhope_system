import { createListDataCache } from "@/lib/listDataCache"
import type { CourseRecord } from "@/services/classQueries"

export type CoursesListDataCache = {
 rows: CourseRecord[]
 subjects: { id: string; code: string; name_zh: string }[]
}

const cache = createListDataCache<CoursesListDataCache>({
 isUsable: (d) => d.rows.length > 0,
})

export function getCoursesListDataCache(): CoursesListDataCache | null {
 return cache.get()
}

export function setCoursesListDataCache(next: CoursesListDataCache, fetchedAt?: number): void {
 cache.set(next, fetchedAt)
}

export function invalidateCoursesListDataCache(): void {
 cache.invalidate()
}

export function isCoursesListCacheFresh(now = Date.now()): boolean {
 return cache.isFresh(now)
}
