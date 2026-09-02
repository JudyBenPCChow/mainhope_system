import { afterEach, describe, expect, it } from "vitest"

import { LIST_DATA_CACHE_TTL_MS } from "@/lib/listDataCache"
import { bumpRequestGeneration, isLiveKeyedRequest } from "@/lib/requestGeneration"
import type { ScheduleManageRow } from "@/services/scheduleQueries"

import {
 clearFutureCancelledScheduleCache,
 clearScheduleListDataCache,
 futureCancelledScheduleCacheKey,
 getFutureCancelledScheduleCache,
 getScheduleListDataCache,
 invalidateFutureCancelledScheduleCache,
 invalidateScheduleListDataCache,
 invalidateScheduleManageCaches,
 isFutureCancelledScheduleCacheFresh,
 isScheduleListCacheFresh,
 patchScheduleListDataCache,
 scheduleListCacheKey,
 scheduleListCacheKeysEqual,
 setFutureCancelledScheduleCache,
 setScheduleListDataCache,
 type ScheduleListDataCache,
} from "@/components/schedule/scheduleListState"

function row(id: string, date = "2026-09-03"): ScheduleManageRow {
 return { id, scheduled_date: date } as ScheduleManageRow
}

function cacheWith(partial: Partial<ScheduleListDataCache> = {}): ScheduleListDataCache {
 const key = partial.key ?? scheduleListCacheKey({
  teacherScopeId: null,
  displayStart: "2026-09-03",
  rangeEnd: "2026-09-16",
 })
 return {
  key,
  rows: [row("s1")],
  rooms: [],
  roomOptions: [],
  alerts: new Map(),
  rowSummaries: new Map(),
  complete: true,
  ...partial,
 }
}

afterEach(() => {
 clearScheduleListDataCache()
 clearFutureCancelledScheduleCache()
})

describe("scheduleListCacheKey", () => {
 it("日期、老師或 scope 任一不同即不相等", () => {
  const base = scheduleListCacheKey({
   teacherScopeId: null,
   displayStart: "2026-09-03",
   rangeEnd: "2026-09-16",
  })
  expect(
   scheduleListCacheKeysEqual(
    base,
    scheduleListCacheKey({ teacherScopeId: "t1", displayStart: "2026-09-03", rangeEnd: "2026-09-16" })
   )
  ).toBe(false)
  expect(
   scheduleListCacheKeysEqual(
    base,
    scheduleListCacheKey({ teacherScopeId: null, displayStart: "2026-09-04", rangeEnd: "2026-09-17" })
   )
  ).toBe(false)
  expect(base.scope).toBe("range")
  expect(futureCancelledScheduleCacheKey({ teacherScopeId: null, asOf: "2026-09-03" }).scope).toBe(
   "future-cancelled"
  )
 })
})

describe("schedule list cache freshness", () => {
 it("相同 key 且完成才 fresh", () => {
  const key = scheduleListCacheKey({
   teacherScopeId: null,
   displayStart: "2026-09-03",
   rangeEnd: "2026-09-16",
  })
  setScheduleListDataCache(cacheWith({ key }))
  expect(isScheduleListCacheFresh(key)).toBe(true)
 })

 it("老師或日期不同即不 fresh，也不得把該快取當可顯示列", () => {
  setScheduleListDataCache(
   cacheWith({
    key: scheduleListCacheKey({
     teacherScopeId: "t1",
     displayStart: "2026-09-03",
     rangeEnd: "2026-09-16",
    }),
   })
  )
  expect(
   isScheduleListCacheFresh(
    scheduleListCacheKey({
     teacherScopeId: "t2",
     displayStart: "2026-09-03",
     rangeEnd: "2026-09-16",
    })
   )
  ).toBe(false)
  expect(
   isScheduleListCacheFresh(
    scheduleListCacheKey({
     teacherScopeId: "t1",
     displayStart: "2026-09-10",
     rangeEnd: "2026-09-23",
    })
   )
  ).toBe(false)
 })

 it("基本列完成但摘要未完成時不 fresh", () => {
  const key = scheduleListCacheKey({
   teacherScopeId: null,
   displayStart: "2026-09-03",
   rangeEnd: "2026-09-16",
  })
  setScheduleListDataCache(cacheWith({ key, complete: false }))
  expect(isScheduleListCacheFresh(key)).toBe(false)
  expect(getScheduleListDataCache()?.rows).toHaveLength(1)
 })

 it("成功空結果可以短期快取", () => {
  const key = scheduleListCacheKey({
   teacherScopeId: null,
   displayStart: "2026-09-03",
   rangeEnd: "2026-09-16",
  })
  setScheduleListDataCache(cacheWith({ key, rows: [], complete: true }))
  expect(isScheduleListCacheFresh(key)).toBe(true)
  expect(getScheduleListDataCache()?.rows).toEqual([])
 })

 it("相同 key 過期時仍可讀列，但不 fresh", () => {
  const key = scheduleListCacheKey({
   teacherScopeId: null,
   displayStart: "2026-09-03",
   rangeEnd: "2026-09-16",
  })
  setScheduleListDataCache(cacheWith({ key }), Date.now() - LIST_DATA_CACHE_TTL_MS - 1)
  expect(getScheduleListDataCache()?.rows).toHaveLength(1)
  expect(isScheduleListCacheFresh(key)).toBe(false)
 })

 it("invalidate 保留列但下次必須重抓", () => {
  const key = scheduleListCacheKey({
   teacherScopeId: null,
   displayStart: "2026-09-03",
   rangeEnd: "2026-09-16",
  })
  setScheduleListDataCache(cacheWith({ key }))
  invalidateScheduleListDataCache()
  expect(getScheduleListDataCache()?.rows).toHaveLength(1)
  expect(isScheduleListCacheFresh(key)).toBe(false)
 })

 it("寫入可同時失效一般及未來取消堂快取", () => {
  const rangeKey = scheduleListCacheKey({
   teacherScopeId: null,
   displayStart: "2026-09-03",
   rangeEnd: "2026-09-16",
  })
  const cancelledKey = futureCancelledScheduleCacheKey({ teacherScopeId: null, asOf: "2026-09-03" })
  setScheduleListDataCache(cacheWith({ key: rangeKey }))
  setFutureCancelledScheduleCache({
   key: cancelledKey,
   rows: [row("c1")],
   rowSummaries: new Map(),
   rooms: [],
   roomOptions: [],
   alerts: new Map(),
   complete: true,
  })
  invalidateScheduleManageCaches({ futureCancelled: true })
  expect(isScheduleListCacheFresh(rangeKey)).toBe(false)
  expect(isFutureCancelledScheduleCacheFresh(cancelledKey)).toBe(false)
  expect(getScheduleListDataCache()?.rows).toHaveLength(1)
  expect(getFutureCancelledScheduleCache()?.rows).toHaveLength(1)
 })

 it("局部 patch 後仍保留已知新值", () => {
  const key = scheduleListCacheKey({
   teacherScopeId: null,
   displayStart: "2026-09-03",
   rangeEnd: "2026-09-16",
  })
  setScheduleListDataCache(cacheWith({ key, rows: [row("s1"), row("s2")] }))
  patchScheduleListDataCache((cur) => ({
   ...cur,
   rows: cur.rows.filter((r) => r.id !== "s1"),
  }))
  expect(getScheduleListDataCache()?.rows.map((r) => r.id)).toEqual(["s2"])
  expect(isScheduleListCacheFresh(key)).toBe(true)
 })
})

describe("request race against cache keys", () => {
 it("快速切換日期時舊基本列不能覆蓋新日期", () => {
  const box = { current: 0 }
  const firstKey = scheduleListCacheKey({
   teacherScopeId: null,
   displayStart: "2026-09-03",
   rangeEnd: "2026-09-16",
  })
  const secondKey = scheduleListCacheKey({
   teacherScopeId: null,
   displayStart: "2026-09-10",
   rangeEnd: "2026-09-23",
  })
  const firstGen = bumpRequestGeneration(box)
  const secondGen = bumpRequestGeneration(box)
  const applied: string[] = []
  if (isLiveKeyedRequest(box, firstGen, secondKey, firstKey, scheduleListCacheKeysEqual)) {
   applied.push("first")
  }
  if (isLiveKeyedRequest(box, secondGen, secondKey, secondKey, scheduleListCacheKeysEqual)) {
   applied.push("second")
  }
  expect(applied).toEqual(["second"])
 })

 it("快速切換老師範圍時舊摘要不能覆蓋新 scope", () => {
  const box = { current: 0 }
  const oldKey = scheduleListCacheKey({
   teacherScopeId: "t1",
   displayStart: "2026-09-03",
   rangeEnd: "2026-09-16",
  })
  const newKey = scheduleListCacheKey({
   teacherScopeId: "t2",
   displayStart: "2026-09-03",
   rangeEnd: "2026-09-16",
  })
  const oldGen = bumpRequestGeneration(box)
  const newGen = bumpRequestGeneration(box)
  expect(isLiveKeyedRequest(box, oldGen, newKey, oldKey, scheduleListCacheKeysEqual)).toBe(false)
  expect(isLiveKeyedRequest(box, newGen, newKey, newKey, scheduleListCacheKeysEqual)).toBe(true)
 })

 it("只靠 generation 不足以擋住 key 已變但 gen 未 bump 的錯誤套用", () => {
  const box = { current: 0 }
  const gen = bumpRequestGeneration(box)
  const currentKey = scheduleListCacheKey({
   teacherScopeId: null,
   displayStart: "2026-09-10",
   rangeEnd: "2026-09-23",
  })
  const staleKey = scheduleListCacheKey({
   teacherScopeId: null,
   displayStart: "2026-09-03",
   rangeEnd: "2026-09-16",
  })
  expect(isLiveKeyedRequest(box, gen, currentKey, staleKey, scheduleListCacheKeysEqual)).toBe(false)
 })
})

describe("future cancelled cache asOf", () => {
 it("asOf 不同即不 fresh", () => {
  setFutureCancelledScheduleCache({
   key: futureCancelledScheduleCacheKey({ teacherScopeId: null, asOf: "2026-09-03" }),
   rows: [],
   rowSummaries: new Map(),
   rooms: [],
   roomOptions: [],
   alerts: new Map(),
   complete: true,
  })
  expect(
   isFutureCancelledScheduleCacheFresh(
    futureCancelledScheduleCacheKey({ teacherScopeId: null, asOf: "2026-09-03" })
   )
  ).toBe(true)
  expect(
   isFutureCancelledScheduleCacheFresh(
    futureCancelledScheduleCacheKey({ teacherScopeId: null, asOf: "2026-09-04" })
   )
  ).toBe(false)
  invalidateFutureCancelledScheduleCache()
  expect(
   isFutureCancelledScheduleCacheFresh(
    futureCancelledScheduleCacheKey({ teacherScopeId: null, asOf: "2026-09-03" })
   )
  ).toBe(false)
 })
})
