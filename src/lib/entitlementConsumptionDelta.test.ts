import { describe, expect, it } from "vitest"

import { isBillableAttendanceStatus } from "@/lib/attendanceBilling"

/** 對齊 applyEntitlementConsumptionDelta 的 delta 語意（純函式跟飛） */
function entitlementDeltaLessons(
 previousStatus: string | null | undefined,
 nextStatus: string | null | undefined,
 lessonUnits = 1
): number | null {
 const wasBillable = isBillableAttendanceStatus(previousStatus)
 const isBillable = isBillableAttendanceStatus(nextStatus)
 if (wasBillable === isBillable) return null
 const units = lessonUnits > 0 ? lessonUnits : 1
 return isBillable && !wasBillable ? -units : units
}

describe("entitlement consumption / reinstate delta", () => {
 it("consumes when marking billable from empty", () => {
  expect(entitlementDeltaLessons(null, "出席")).toBe(-1)
  expect(entitlementDeltaLessons(null, "錄影回放")).toBe(-1)
  expect(entitlementDeltaLessons(null, "出席", 2)).toBe(-2)
 })

 it("reinstates when changing billable → leave", () => {
  expect(entitlementDeltaLessons("出席", "病假")).toBe(1)
  expect(entitlementDeltaLessons("出席", "事假")).toBe(1)
  expect(entitlementDeltaLessons("錄影回放", "病假", 2)).toBe(2)
 })

 it("no-ops when billability unchanged", () => {
  expect(entitlementDeltaLessons("出席", "網課")).toBeNull()
  expect(entitlementDeltaLessons("病假", "事假")).toBeNull()
  expect(entitlementDeltaLessons(null, "病假")).toBeNull()
  expect(entitlementDeltaLessons(null, null)).toBeNull()
 })

 it("consumes leave-without-makeup (billable)", () => {
  expect(entitlementDeltaLessons(null, "請假而不需補回")).toBe(-1)
 })
})
