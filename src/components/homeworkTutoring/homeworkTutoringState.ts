import { createListDataCache } from "@/lib/listDataCache"
import type {
 AllTeacherAvailability,
 AllTeacherSubmitStatus,
 HomeworkDutyDay,
 HomeworkFeeDisplay,
 HomeworkHoliday,
 HomeworkStudentRow,
 HomeworkTeacherRow,
 MonthRosterState,
} from "@/lib/homeworkTutoringUi"
import type { MgmtRole } from "@/lib/mgmtRole"
import type { HomeworkClassRef } from "@/services/homeworkTutoringQueries"

export type HomeworkTutoringDataCache = {
 role: MgmtRole
 hwClass: HomeworkClassRef | null
 students: HomeworkStudentRow[]
 fees: HomeworkFeeDisplay[]
 holidays: HomeworkHoliday[]
 avail: AllTeacherAvailability
 submitStatus: AllTeacherSubmitStatus
 dutyDays: HomeworkDutyDay[]
 rosterMonthId: string
 monthRosterStatus: Record<string, MonthRosterState>
 hwTeachers: HomeworkTeacherRow[]
 hwAccessIds: Set<string>
 loadedMonth: string
 sheetMonth: string
 teacherDutyMonth: string
}

const cache = createListDataCache<HomeworkTutoringDataCache>({
 isUsable: (d) => d.hwClass != null,
})

export function getHomeworkTutoringDataCache(): HomeworkTutoringDataCache | null {
 return cache.get()
}

export function setHomeworkTutoringDataCache(next: HomeworkTutoringDataCache, fetchedAt?: number): void {
 cache.set(next, fetchedAt)
}

export function invalidateHomeworkTutoringDataCache(): void {
 cache.invalidate()
}

export function patchHomeworkTutoringDataCache(
 patch: (current: HomeworkTutoringDataCache) => HomeworkTutoringDataCache
): void {
 cache.patch(patch)
}

export function isHomeworkTutoringCacheFresh(role: MgmtRole | null, now = Date.now()): boolean {
 if (!role) return false
 const data = cache.get()
 if (!data) return false
 if (data.role !== role) return false
 return cache.isFresh(now)
}
