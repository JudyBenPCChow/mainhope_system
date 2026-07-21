import { describe, expect, it } from "vitest"

import {
 addBillingMonths,
 billingMonthBounds,
 calculateMonthlyTuition,
 enumerateBillingMonths,
} from "@/lib/monthlyTuition"

describe("monthly tuition helpers", () => {
 it("handles leap-year and year-crossing month bounds", () => {
  expect(billingMonthBounds("2027-02")).toEqual({
   start: "2027-02-01",
   end: "2027-02-28",
  })
  expect(addBillingMonths("2026-12", 1)).toBe("2027-01")
 })

 it("enumerates up to twelve prepaid months", () => {
  expect(enumerateBillingMonths("2026-11", 3)).toEqual(["2026-11", "2026-12", "2027-01"])
  expect(enumerateBillingMonths("2026-09", 99)).toHaveLength(12)
 })

 it("deducts approved unpaid leave before applying credit", () => {
  expect(
   calculateMonthlyTuition({
    calendarLessonCount: 4,
    leaveDeductionCount: 1,
    unitPrice: 275,
    creditApplied: 275,
   })
  ).toEqual({
   chargeableLessonCount: 3,
   grossAmount: 825,
   creditApplied: 275,
   netAmount: 550,
  })
 })

 it("never creates negative lessons or amount", () => {
  expect(
   calculateMonthlyTuition({
    calendarLessonCount: 4,
    leaveDeductionCount: 8,
    unitPrice: 250,
    creditApplied: 500,
   })
  ).toEqual({
   chargeableLessonCount: 0,
   grossAmount: 0,
   creditApplied: 0,
   netAmount: 0,
  })
 })
})
