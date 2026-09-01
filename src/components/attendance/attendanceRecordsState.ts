import { createListDataCache } from "@/lib/listDataCache"
import type { AttendanceRecordRow } from "@/services/attendanceQueries"

export type AttendanceRecordsDataCache = {
 from: string
 to: string
 rows: AttendanceRecordRow[]
}

const cache = createListDataCache<AttendanceRecordsDataCache>({
 isUsable: (d) => d.rows.length > 0,
})

export function getAttendanceRecordsDataCache(): AttendanceRecordsDataCache | null {
 return cache.get()
}

export function setAttendanceRecordsDataCache(
 next: AttendanceRecordsDataCache,
 fetchedAt?: number
): void {
 cache.set(next, fetchedAt)
}

export function invalidateAttendanceRecordsDataCache(): void {
 cache.invalidate()
}

export function isAttendanceRecordsCacheFresh(from: string, to: string, now = Date.now()): boolean {
 const data = cache.get()
 if (!data) return false
 if (data.from !== from) return false
 if (data.to !== to) return false
 return cache.isFresh(now)
}
