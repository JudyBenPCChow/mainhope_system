import { afterEach, describe, expect, it } from "vitest"

import {
 clearTuitionChaseListDataCache,
 getTuitionChaseListDataCache,
 invalidateTuitionChaseListDataCache,
 isTuitionChaseListCacheFresh,
 setTuitionChaseListDataCache,
 type TuitionChaseListDataCache,
} from "@/components/payments/tuitionChaseListState"
import type { TuitionChaseStudentRow } from "@/services/tuitionChaseQueries"

const TODAY = "2026-09-10"

function cacheWith(partial: Partial<TuitionChaseListDataCache> = {}): TuitionChaseListDataCache {
 return {
  includeOlderYears: false,
  todayYmd: TODAY,
  rows: [{ studentId: "s1", pools: [] } as unknown as TuitionChaseStudentRow],
  hiddenOlderCount: 0,
  opsYearLabels: ["2627"],
  currentPeriod: { index: 1, label: "常規第一期", from: "2026-09-01", to: "2026-10-03" },
  nextPeriod: { index: 2, label: "常規第二期", from: "2026-09-29", to: "2026-11-07" },
  ...partial,
 }
}

afterEach(() => {
 clearTuitionChaseListDataCache()
})

describe("tuitionChaseListState", () => {
 it("includeOlderYears 不符則不算新鮮", () => {
  setTuitionChaseListDataCache(cacheWith({ includeOlderYears: false }))
  expect(isTuitionChaseListCacheFresh(false, TODAY)).toBe(true)
  expect(isTuitionChaseListCacheFresh(true, TODAY)).toBe(false)
 })

 it("換日則不算新鮮（期數窗跟今日）", () => {
  setTuitionChaseListDataCache(cacheWith())
  expect(isTuitionChaseListCacheFresh(false, TODAY)).toBe(true)
  expect(isTuitionChaseListCacheFresh(false, "2026-09-11")).toBe(false)
 })

 it("invalidate 保留列但下次進頁須重抓", () => {
  setTuitionChaseListDataCache(cacheWith())
  invalidateTuitionChaseListDataCache()
  expect(getTuitionChaseListDataCache()?.rows).toHaveLength(1)
  expect(isTuitionChaseListCacheFresh(false, TODAY)).toBe(false)
 })

 it("空名單仍可當新鮮快取（學校可以沒有要追的人）", () => {
  setTuitionChaseListDataCache(cacheWith({ rows: [] }))
  expect(isTuitionChaseListCacheFresh(false, TODAY)).toBe(true)
 })

 it("舊列沒有報讀班別陣列則不算新鮮", () => {
  setTuitionChaseListDataCache(
   cacheWith({
    rows: [{ studentId: "s1", pools: [{ label: "專科班（中六）" }] } as unknown as TuitionChaseStudentRow],
   })
  )
  expect(isTuitionChaseListCacheFresh(false, TODAY)).toBe(false)
 })
})
