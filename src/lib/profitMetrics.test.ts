import { describe, expect, it } from "vitest"

import {
 clampFromProfitWindow,
 computeMonthProfit,
 monthKeysInclusive,
 PROFIT_ANALYSIS_START,
 ratioPct,
} from "@/lib/profitMetrics"

describe("profitMetrics", () => {
 it("clamps analysis window to 2026-07-01", () => {
  expect(clampFromProfitWindow("2026-06-01")).toBe(PROFIT_ANALYSIS_START)
  expect(clampFromProfitWindow("2026-08-01")).toBe("2026-08-01")
 })

 it("lists month keys from July 2026", () => {
  expect(monthKeysInclusive("2026-06-01", "2026-08-23")).toEqual(["2026-07", "2026-08"])
 })

 it("gross is null when tutor labor not posted", () => {
  const p = computeMonthProfit({
   monthKey: "2026-08",
   consumedValue: 10000,
   tutorLabor: 0,
   tutorLaborPosted: false,
   totalExpenses: 3000,
  })
  expect(p.grossProfit).toBeNull()
  expect(p.grossMarginPct).toBeNull()
  expect(p.netProfit).toBe(7000)
  expect(p.netMarginPct).toBe(70)
 })

 it("gross and net when labor posted", () => {
  const p = computeMonthProfit({
   monthKey: "2026-07",
   consumedValue: 10000,
   tutorLabor: 4000,
   tutorLaborPosted: true,
   totalExpenses: 7000,
  })
  expect(p.grossProfit).toBe(6000)
  expect(p.grossMarginPct).toBe(60)
  expect(p.netProfit).toBe(3000)
  expect(ratioPct(p.netProfit, p.consumedValue)).toBe(30)
 })
})
