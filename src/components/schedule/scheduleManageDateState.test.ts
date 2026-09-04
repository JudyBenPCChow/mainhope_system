import { describe, expect, it } from "vitest"

import {
 applyFutureCancelledSearch,
 applyScheduleDayViewSearch,
 calendarDayChanged,
 captureScheduleListReturnState,
 decideInitialScheduleDates,
 FUTURE_CANCELLED_SCOPE,
 initialUrlDateFromSearch,
 parseScheduleManageSearch,
 restoreScheduleListReturnState,
 shouldFetchNearestScheduleDate,
 shouldWriteDayViewUrl,
} from "@/components/schedule/scheduleManageDateState"

function params(search: string): URLSearchParams {
 return new URLSearchParams(search)
}

describe("parseScheduleManageSearch", () => {
 it("解析日視圖、未來取消堂與點名深連結", () => {
  const parsed = parseScheduleManageSearch(
   params("view=day&date=2026-09-10&scope=future-cancelled&schedule_id=abc&rollcall=1")
  )
  expect(parsed).toEqual({
   view: "day",
   date: "2026-09-10",
   scope: FUTURE_CANCELLED_SCOPE,
   scheduleId: "abc",
   rollcall: true,
  })
 })

 it("無效日期與未知 view 當成沒有", () => {
  const parsed = parseScheduleManageSearch(params("view=week&date=09/10"))
  expect(parsed.view).toBeNull()
  expect(parsed.date).toBeNull()
  expect(parsed.scope).toBeNull()
  expect(parsed.rollcall).toBe(false)
 })
})

describe("decideInitialScheduleDates", () => {
 it("有效 URL 日期優先於快取", () => {
  const decided = decideInitialScheduleDates({
   urlDate: "2026-09-10",
   cacheDisplayStart: "2026-09-01",
   cacheTeacherScopeId: null,
   cacheHasData: true,
   teacherScopeId: null,
   todayYmd: "2026-09-03",
  })
  expect(decided.source).toBe("url")
  expect(decided.displayStart).toBe("2026-09-10")
  expect(decided.initialized).toBe(true)
  expect(decided.hydrateCache).toBe(false)
 })

 it("URL 日期與快取日期不符時不 hydrate", () => {
  const decided = decideInitialScheduleDates({
   urlDate: "2026-09-10",
   cacheDisplayStart: "2026-09-01",
   cacheTeacherScopeId: null,
   cacheHasData: true,
   teacherScopeId: null,
   todayYmd: "2026-09-03",
  })
  expect(decided.hydrateCache).toBe(false)
 })

 it("無 URL 且快取老師範圍相符時 hydrate，即使過期仍用快取日期", () => {
  const decided = decideInitialScheduleDates({
   urlDate: null,
   cacheDisplayStart: "2026-09-08",
   cacheTeacherScopeId: "t1",
   cacheHasData: true,
   teacherScopeId: "t1",
   todayYmd: "2026-09-03",
  })
  expect(decided.source).toBe("cache")
  expect(decided.displayStart).toBe("2026-09-08")
  expect(decided.hydrateCache).toBe(true)
  expect(decided.initialized).toBe(true)
 })

 it("快取老師範圍不符時不 hydrate，改以今天", () => {
  const decided = decideInitialScheduleDates({
   urlDate: null,
   cacheDisplayStart: "2026-09-08",
   cacheTeacherScopeId: "t1",
   cacheHasData: true,
   teacherScopeId: "t2",
   todayYmd: "2026-09-03",
  })
  expect(decided.source).toBe("today")
  expect(decided.hydrateCache).toBe(false)
  expect(decided.initialized).toBe(true)
  expect(decided.displayStart).toBe("2026-09-03")
 })

 it("無 URL 亦無快取時以今天為顯示日", () => {
  const decided = decideInitialScheduleDates({
   urlDate: null,
   cacheDisplayStart: null,
   cacheTeacherScopeId: null,
   cacheHasData: false,
   teacherScopeId: null,
   todayYmd: "2026-09-03",
  })
  expect(decided.source).toBe("today")
  expect(decided.initialized).toBe(true)
  expect(decided.displayStart).toBe("2026-09-03")
 })
})

describe("shouldFetchNearestScheduleDate", () => {
 it("有 URL 日期就不查最近排程", () => {
  expect(shouldFetchNearestScheduleDate({ urlDate: "2026-09-10", cacheMatchesTeacherScope: false })).toBe(false)
 })

 it("無 URL 但有相符快取時不改跳最近日期", () => {
  expect(shouldFetchNearestScheduleDate({ urlDate: null, cacheMatchesTeacherScope: true })).toBe(false)
 })

 it("無 URL 且無相符快取也不再跳最近有課日", () => {
  expect(shouldFetchNearestScheduleDate({ urlDate: null, cacheMatchesTeacherScope: false })).toBe(false)
 })
})

describe("day view URL writeback", () => {
 it("初始化前不寫回 URL", () => {
  expect(shouldWriteDayViewUrl(false, "day")).toBe(false)
  expect(shouldWriteDayViewUrl(true, "day")).toBe(true)
  expect(shouldWriteDayViewUrl(true, "byDate")).toBe(false)
 })

 it("日視圖切換日期只在 view/date 變更時才算 changed", () => {
  const first = applyScheduleDayViewSearch(params(""), { viewMode: "day", dayViewDate: "2026-09-04" })
  expect(first.changed).toBe(true)
  expect(first.next.get("view")).toBe("day")
  expect(first.next.get("date")).toBe("2026-09-04")
  const second = applyScheduleDayViewSearch(first.next, { viewMode: "day", dayViewDate: "2026-09-04" })
  expect(second.changed).toBe(false)
 })

 it("離開日視圖時清掉 view 與 date，保留其他 query", () => {
  const next = applyScheduleDayViewSearch(params("view=day&date=2026-09-04&foo=1"), {
   viewMode: "list",
   dayViewDate: "2026-09-04",
  })
  expect(next.changed).toBe(true)
  expect(next.next.get("view")).toBeNull()
  expect(next.next.get("date")).toBeNull()
  expect(next.next.get("foo")).toBe("1")
 })
})

describe("future cancelled return contract", () => {
 it("進入專用模式寫入 scope，離開時恢復原 search", () => {
  const original = params("view=day&date=2026-09-04")
  const entered = applyFutureCancelledSearch(original, true)
  expect(entered.get("scope")).toBe(FUTURE_CANCELLED_SCOPE)
  const saved = captureScheduleListReturnState({
   search: original.toString(),
   viewMode: "day",
   displayStart: "2026-09-04",
   dayViewDate: "2026-09-04",
   selectedScheduleId: "s1",
   scrollY: 120,
  })
  const restored = restoreScheduleListReturnState(saved)
  expect(restored).toEqual({
   viewMode: "day",
   displayStart: "2026-09-04",
   dayViewDate: "2026-09-04",
   selectedScheduleId: "s1",
   scrollY: 120,
  })
  expect(saved.search).toBe("view=day&date=2026-09-04")
 })
})

describe("calendarDayChanged", () => {
 it("跨午夜才需要刷新 today／KPI／asOf", () => {
  expect(calendarDayChanged("2026-09-03", "2026-09-03")).toBe(false)
  expect(calendarDayChanged("2026-09-03", "2026-09-04")).toBe(true)
 })
})

describe("initialUrlDateFromSearch", () => {
 it("有效 date 即為 URL 日期，不要求必須 view=day", () => {
  expect(initialUrlDateFromSearch(parseScheduleManageSearch(params("date=2026-09-12")))).toBe(
   "2026-09-12"
  )
  expect(initialUrlDateFromSearch(parseScheduleManageSearch(params("view=day")))).toBeNull()
 })
})
