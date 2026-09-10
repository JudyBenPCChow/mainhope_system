import { describe, expect, it } from "vitest"

import {
 isHideableTuitionChasePrepaid,
 tuitionChaseDueFromInventory,
 tuitionChaseQueueStatus,
} from "@/lib/tuitionChaseDue"

describe("tuitionChaseDueFromInventory", () => {
 it("reserves remaining for this period before next-period due", () => {
  const due = tuitionChaseDueFromInventory({
   remainingLessons: 4,
   thisPeriodPendingUnits: 4,
   nextPeriodUnits: 4,
  })
  expect(due.thisPeriodDueLessons).toBe(0)
  expect(due.remainingAfterThisPeriod).toBe(0)
  expect(due.nextPeriodDueLessons).toBe(4)
  expect(due.suggestedLessons).toBe(4)
  expect(tuitionChaseQueueStatus(due)).toBe("next")
 })

 it("marks prepaid when remaining covers this and next period", () => {
  const due = tuitionChaseDueFromInventory({
   remainingLessons: 8,
   thisPeriodPendingUnits: 4,
   nextPeriodUnits: 4,
  })
  expect(due.thisPeriodDueLessons).toBe(0)
  expect(due.nextPeriodDueLessons).toBe(0)
  expect(due.suggestedLessons).toBe(0)
  expect(tuitionChaseQueueStatus(due)).toBe("prepaid")
 })

 it("chases both periods when remaining is 0", () => {
  const due = tuitionChaseDueFromInventory({
   remainingLessons: 0,
   thisPeriodPendingUnits: 4,
   nextPeriodUnits: 4,
  })
  expect(due.thisPeriodDueLessons).toBe(4)
  expect(due.nextPeriodDueLessons).toBe(4)
  expect(due.suggestedLessons).toBe(8)
  expect(tuitionChaseQueueStatus(due)).toBe("now")
 })

 it("treats negative remaining as this-period arrears", () => {
  const due = tuitionChaseDueFromInventory({
   remainingLessons: -2,
   thisPeriodPendingUnits: 0,
   nextPeriodUnits: 4,
  })
  expect(due.thisPeriodDueLessons).toBe(2)
  expect(due.nextPeriodDueLessons).toBe(4)
  expect(due.suggestedLessons).toBe(6)
  expect(tuitionChaseQueueStatus(due)).toBe("now")
 })

 it("does not let this-period shortfall reduce next-period units", () => {
  const due = tuitionChaseDueFromInventory({
   remainingLessons: 2,
   thisPeriodPendingUnits: 4,
   nextPeriodUnits: 4,
  })
  expect(due.thisPeriodDueLessons).toBe(2)
  expect(due.remainingAfterThisPeriod).toBe(-2)
  expect(due.nextPeriodDueLessons).toBe(4)
  expect(due.suggestedLessons).toBe(6)
 })

 it("does not label missing remaining as prepaid", () => {
  expect(
   tuitionChaseQueueStatus(
    { thisPeriodDueLessons: 0, nextPeriodDueLessons: 0 },
    false
   )
  ).toBe("unknown")
 })
})

describe("isHideableTuitionChasePrepaid", () => {
 it("keeps prepaid rows with a missing pool on the default list", () => {
  expect(
   isHideableTuitionChasePrepaid({
    status: "prepaid",
    pools: [{ remainingKnown: true }, { remainingKnown: false }],
   })
  ).toBe(false)
  expect(
   isHideableTuitionChasePrepaid({
    status: "prepaid",
    pools: [{ remainingKnown: true }],
   })
  ).toBe(true)
 })
})
