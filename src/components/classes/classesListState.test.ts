import { afterEach, describe, expect, it } from "vitest"

import {
 clearClassesListDataCache,
 getClassesListDataCache,
 invalidateClassesListDataCache,
 isClassesListCacheFresh,
 patchClassesListDataCache,
 setClassesListDataCache,
 type ClassesListDataCache,
} from "@/components/classes/classesListState"
import type { ClassRecord } from "@/services/classQueries"

function cacheWith(partial: Partial<ClassesListDataCache> = {}): ClassesListDataCache {
 return {
  rows: [{ id: "c1" } as ClassRecord],
  yearOptions: [],
  enrollRoster: new Map(),
  scheduleSummaries: new Map(),
  hiddenOlderCount: 0,
  includeOlderYears: false,
  opsYearLabels: ["2627"],
  ...partial,
 }
}

afterEach(() => {
 clearClassesListDataCache()
})

describe("classesListState", () => {
 it("includeOlderYears 不符則不算新鮮", () => {
  setClassesListDataCache(cacheWith({ includeOlderYears: false }))
  expect(isClassesListCacheFresh(false)).toBe(true)
  expect(isClassesListCacheFresh(true)).toBe(false)
 })

 it("invalidate 保留列但下次進頁須重抓", () => {
  setClassesListDataCache(cacheWith())
  invalidateClassesListDataCache()
  expect(getClassesListDataCache()?.rows).toHaveLength(1)
  expect(isClassesListCacheFresh(false)).toBe(false)
 })

 it("分階段 set：fetchedAt=0 時不新鮮，補齊後才新鮮", () => {
  setClassesListDataCache(cacheWith({ yearOptions: [] }), 0)
  expect(isClassesListCacheFresh(false)).toBe(false)
  setClassesListDataCache(
   cacheWith({
    yearOptions: [{ id: "y1", label: "2627", is_current: true }],
   })
  )
  expect(isClassesListCacheFresh(false)).toBe(true)
 })

 it("patch 可刪列並沿用 includeOlderYears 鍵", () => {
  setClassesListDataCache(cacheWith({ rows: [{ id: "c1" } as ClassRecord, { id: "c2" } as ClassRecord] }))
  patchClassesListDataCache((cur) => ({
   ...cur,
   rows: cur.rows.filter((r) => r.id !== "c1"),
  }))
  expect(getClassesListDataCache()?.rows.map((r) => r.id)).toEqual(["c2"])
  expect(isClassesListCacheFresh(false)).toBe(true)
 })
})
