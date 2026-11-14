import { createListDataCache } from "@/lib/listDataCache"
import type { TeacherTrialRow, TeacherTrialSemester } from "@/services/trialQueries"

export type TeacherTrialStudentsCache = {
 teacherId: string
 rows: TeacherTrialRow[]
 semester: TeacherTrialSemester | null
}

const cache = createListDataCache<TeacherTrialStudentsCache>()

export function getTeacherTrialStudentsCache(): TeacherTrialStudentsCache | null {
 return cache.get()
}

export function setTeacherTrialStudentsCache(next: TeacherTrialStudentsCache, fetchedAt?: number): void {
 cache.set(next, fetchedAt)
}

export function invalidateTeacherTrialStudentsCache(): void {
 cache.invalidate()
}

export function isTeacherTrialStudentsCacheFresh(teacherId: string, now = Date.now()): boolean {
 const data = cache.get()
 if (!data) return false
 if (data.teacherId !== teacherId) return false
 return cache.isFresh(now)
}
