import { describe, expect, it } from "vitest"

import { suggestedTuitionLessons } from "@/lib/tuitionPaymentSuggestion"

describe("suggestedTuitionLessons", () => {
 it("suggests difference when schedule exceeds remaining", () => {
  expect(
   suggestedTuitionLessons({ chargeableScheduleUnits: 4, remainingLessons: 1 })
  ).toBe(3)
 })

 it("suggests 0 when pool covers the month", () => {
  expect(
   suggestedTuitionLessons({ chargeableScheduleUnits: 4, remainingLessons: 4 })
  ).toBe(0)
  expect(
   suggestedTuitionLessons({ chargeableScheduleUnits: 4, remainingLessons: 6 })
  ).toBe(0)
 })

 it("suggests full chargeable when remaining negative", () => {
  expect(
   suggestedTuitionLessons({ chargeableScheduleUnits: 4, remainingLessons: -2 })
  ).toBe(6)
 })
})
