import { createListDataCache } from "@/lib/listDataCache"
import type {
 TuitionChasePeriodRef,
 TuitionChaseStudentRow,
} from "@/services/tuitionChaseQueries"

export type TuitionChaseListDataCache = {
 includeOlderYears: boolean
 todayYmd: string
 rows: TuitionChaseStudentRow[]
 hiddenOlderCount: number
 opsYearLabels: string[]
 currentPeriod: TuitionChasePeriodRef | null
 nextPeriod: TuitionChasePeriodRef | null
}

function cacheHasEnrolledClasses(data: TuitionChaseListDataCache): boolean {
 return data.rows.every(
  (row) =>
   Array.isArray(row.pools) &&
   row.pools.every(
    (p) =>
     Array.isArray(p.classes) &&
     typeof p.thisPeriodDeductedUnits === "number" &&
     typeof p.thisPeriodNondeductUnits === "number"
   )
 )
}

const cache = createListDataCache<TuitionChaseListDataCache>({
 isUsable: cacheHasEnrolledClasses,
})

export function getTuitionChaseListDataCache(): TuitionChaseListDataCache | null {
 return cache.get()
}

export function setTuitionChaseListDataCache(
 next: TuitionChaseListDataCache,
 fetchedAt?: number
): void {
 cache.set(next, fetchedAt)
}

export function clearTuitionChaseListDataCache(): void {
 cache.clear()
}

/** 保留列以便返回即時顯示，但下次進清單會靜默重抓。 */
export function invalidateTuitionChaseListDataCache(): void {
 cache.invalidate()
}

export function isTuitionChaseListCacheFresh(
 includeOlderYears: boolean,
 todayYmd: string,
 now = Date.now()
): boolean {
 const data = cache.get()
 if (!data) return false
 if (data.includeOlderYears !== includeOlderYears) return false
 if (data.todayYmd !== todayYmd) return false
 return cache.isFresh(now)
}
