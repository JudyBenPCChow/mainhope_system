import { describe, expect, it } from "vitest"

import {
 indexEntitlementPoolRemainings,
 lookupTuitionChaseRemaining,
} from "@/lib/tuitionChaseRemaining"

const year2627 = "year-2627"
const currentYears = new Set([year2627])
const specialist = { courseGroup: "group_specialist" as const, namespaceKey: "S1" }
const privateNs = { courseGroup: "private" as const, namespaceKey: "class:priv-1" }

describe("lookupTuitionChaseRemaining", () => {
 it("returns known 0 instead of missing", () => {
  const index = indexEntitlementPoolRemainings(
   [
    {
     studentId: "stu",
     academicYearId: year2627,
     courseGroup: "group_specialist",
     namespaceKey: "S1",
     remainingLessons: 0,
    },
   ],
   currentYears
  )
  expect(
   lookupTuitionChaseRemaining(index, {
    studentId: "stu",
    academicYearId: year2627,
    namespace: specialist,
   })
  ).toBe(0)
 })

 it("does not treat a missing specialist pool as remaining 0", () => {
  const index = indexEntitlementPoolRemainings([], currentYears)
  expect(
   lookupTuitionChaseRemaining(index, {
    studentId: "stu",
    academicYearId: year2627,
    namespace: specialist,
   })
  ).toBeUndefined()
 })

 it("matches private remaining even when the pool has no academic year", () => {
  const index = indexEntitlementPoolRemainings(
   [
    {
     studentId: "stu",
     academicYearId: null,
     courseGroup: "private",
     namespaceKey: "class:priv-1",
     remainingLessons: 6,
    },
   ],
   currentYears
  )
  expect(
   lookupTuitionChaseRemaining(index, {
    studentId: "stu",
    academicYearId: year2627,
    namespace: privateNs,
   })
  ).toBe(6)
 })

 it("ignores specialist pools outside the current year set", () => {
  const index = indexEntitlementPoolRemainings(
   [
    {
     studentId: "stu",
     academicYearId: "year-old",
     courseGroup: "group_specialist",
     namespaceKey: "S1",
     remainingLessons: 12,
    },
   ],
   currentYears
  )
  expect(
   lookupTuitionChaseRemaining(index, {
    studentId: "stu",
    academicYearId: year2627,
    namespace: specialist,
   })
  ).toBeUndefined()
 })
})
