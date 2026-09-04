import { isYmd } from "@/lib/weekdayUtils"
import { scheduleRangeEnd } from "@/services/scheduleQueries"

export const SCHEDULE_RANGE_DAYS = 1
export const FUTURE_CANCELLED_SCOPE = "future-cancelled"

export type ScheduleViewMode = "byDate" | "list" | "day"

export type ScheduleManageSearch = {
 view: ScheduleViewMode | null
 date: string | null
 scope: typeof FUTURE_CANCELLED_SCOPE | null
 scheduleId: string | null
 rollcall: boolean
}

export type ScheduleListReturnState = {
 search: string
 viewMode: ScheduleViewMode
 displayStart: string
 dayViewDate: string
 selectedScheduleId: string | null
 scrollY: number | null
}

export function parseValidScheduleYmd(value: string | null | undefined): string | null {
 const s = typeof value === "string" ? value.trim() : ""
 return isYmd(s) ? s : null
}

export function parseScheduleViewParam(value: string | null | undefined): ScheduleViewMode | null {
 if (value === "day" || value === "list" || value === "byDate") return value
 return null
}

export function parseScheduleManageSearch(params: URLSearchParams): ScheduleManageSearch {
 return {
  view: parseScheduleViewParam(params.get("view")),
  date: parseValidScheduleYmd(params.get("date")),
  scope: params.get("scope") === FUTURE_CANCELLED_SCOPE ? FUTURE_CANCELLED_SCOPE : null,
  scheduleId: params.get("schedule_id")?.trim() || null,
  rollcall: params.get("rollcall") === "1",
 }
}

/** 有效 URL 日期（含日視圖與點名深連結）永遠高於快取。 */
export function initialUrlDateFromSearch(search: ScheduleManageSearch): string | null {
 return search.date
}

export function scheduleRangeForStart(displayStart: string, days = SCHEDULE_RANGE_DAYS): string {
 return scheduleRangeEnd(displayStart, days)
}

export type ScheduleInitialDateDecision = {
 displayStart: string
 dayViewDate: string
 initialized: boolean
 hydrateCache: boolean
 source: "url" | "cache" | "today" | "pending-nearest"
}

export function decideInitialScheduleDates(input: {
 urlDate: string | null
 cacheDisplayStart: string | null
 cacheTeacherScopeId: string | null
 cacheHasData: boolean
 teacherScopeId: string | null
 todayYmd: string
}): ScheduleInitialDateDecision {
 if (input.urlDate) {
  return {
   displayStart: input.urlDate,
   dayViewDate: input.urlDate,
   initialized: true,
   hydrateCache:
    input.cacheHasData &&
    input.cacheDisplayStart === input.urlDate &&
    input.cacheTeacherScopeId === input.teacherScopeId,
   source: "url",
  }
 }
 if (input.cacheHasData && input.cacheDisplayStart && input.cacheTeacherScopeId === input.teacherScopeId) {
  return {
   displayStart: input.cacheDisplayStart,
   dayViewDate: input.cacheDisplayStart,
   initialized: true,
   hydrateCache: true,
   source: "cache",
  }
 }
 return {
  displayStart: input.todayYmd,
  dayViewDate: input.todayYmd,
  initialized: true,
  hydrateCache: false,
  source: "today",
 }
}

export function shouldFetchNearestScheduleDate(input: {
 urlDate: string | null
 cacheMatchesTeacherScope: boolean
}): boolean {
 if (input.urlDate) return false
 if (input.cacheMatchesTeacherScope) return false
 return false
}

export function shouldWriteDayViewUrl(startInitialized: boolean, viewMode: ScheduleViewMode): boolean {
 return startInitialized && viewMode === "day"
}

export function applyScheduleDayViewSearch(
 params: URLSearchParams,
 input: { viewMode: ScheduleViewMode; dayViewDate: string }
): { next: URLSearchParams; changed: boolean } {
 const next = new URLSearchParams(params)
 if (input.viewMode === "day") {
  const changed = next.get("view") !== "day" || next.get("date") !== input.dayViewDate
  next.set("view", "day")
  next.set("date", input.dayViewDate)
  return { next, changed }
 }
 const hadDayView = next.get("view") === "day"
 if (hadDayView) {
  next.delete("view")
  next.delete("date")
 }
 return { next, changed: hadDayView }
}

export function applyFutureCancelledSearch(params: URLSearchParams, on: boolean): URLSearchParams {
 const next = new URLSearchParams(params)
 if (on) next.set("scope", FUTURE_CANCELLED_SCOPE)
 else next.delete("scope")
 return next
}

export function captureScheduleListReturnState(input: {
 search: string
 viewMode: ScheduleViewMode
 displayStart: string
 dayViewDate: string
 selectedScheduleId: string | null
 scrollY: number | null
}): ScheduleListReturnState {
 return { ...input }
}

export function restoreScheduleListReturnState(
 saved: ScheduleListReturnState
): Pick<ScheduleListReturnState, "viewMode" | "displayStart" | "dayViewDate" | "selectedScheduleId" | "scrollY"> {
 return {
  viewMode: saved.viewMode,
  displayStart: saved.displayStart,
  dayViewDate: saved.dayViewDate,
  selectedScheduleId: saved.selectedScheduleId,
  scrollY: saved.scrollY,
 }
}

export function calendarDayChanged(prevTodayYmd: string, nextTodayYmd: string): boolean {
 return prevTodayYmd !== nextTodayYmd
}
