import { describe, expect, it } from "vitest"

import type { EntitlementNamespace } from "@/lib/entitlementNamespace"
import {
 resolveSpecialistTuitionPeriods,
 specialistTuitionPeriodDateSet,
} from "@/lib/specialistTuitionPeriods"
import {
 chaseDeclarationAppliesToPool,
 classifyChaseSchedule,
 defaultTuitionChasePoolKey,
 formatTuitionChaseSubjectSubtotals,
 paymentDetailMatchesPool,
} from "@/lib/tuitionChaseDetail"

const specialistS1: EntitlementNamespace = {
 courseGroup: "group_specialist",
 namespaceKey: "S1",
 sharesAcrossClasses: true,
}

const specialistS2: EntitlementNamespace = {
 courseGroup: "group_specialist",
 namespaceKey: "S2",
 sharesAcrossClasses: true,
}

const privateClass: EntitlementNamespace = {
 courseGroup: "private",
 namespaceKey: "class:priv-1",
 sharesAcrossClasses: false,
}

const { current, next } = resolveSpecialistTuitionPeriods({
 todayYmd: "2026-09-10",
 academicYearLabel: "2627",
})
const currentDates = specialistTuitionPeriodDateSet(current)
const nextDates = specialistTuitionPeriodDateSet(next)

describe("resolveSpecialistTuitionPeriods", () => {
 it("maps mid-September to 常規第一期 / 第二期", () => {
  expect(current?.label).toBe("常規第一期")
  expect(next?.label).toBe("常規第二期")
  expect(currentDates.has("2026-09-10")).toBe(true)
  expect(nextDates.has("2026-10-06")).toBe(true)
 })
})

describe("classifyChaseSchedule", () => {
 it("puts unmarked this-period lessons in pending", () => {
  expect(
   classifyChaseSchedule({
    scheduledDate: "2026-09-10",
    currentPeriodDates: currentDates,
    nextPeriodDates: nextDates,
   })
  ).toBe("thisPeriodPending")
 })

 it("puts billable this-period lessons in deducted", () => {
  expect(
   classifyChaseSchedule({
    scheduledDate: "2026-09-08",
    currentPeriodDates: currentDates,
    nextPeriodDates: nextDates,
    attendance: "billable",
   })
  ).toBe("deducted")
 })

 it("skips sick/personal leave so they are not still pending", () => {
  expect(
   classifyChaseSchedule({
    scheduledDate: "2026-09-09",
    currentPeriodDates: currentDates,
    nextPeriodDates: nextDates,
    attendance: "nondeduct",
   })
  ).toBe("skip")
 })

 it("puts next-period uncancelled lessons in nextPeriod regardless of attendance", () => {
  expect(
   classifyChaseSchedule({
    scheduledDate: "2026-10-06",
    currentPeriodDates: currentDates,
    nextPeriodDates: nextDates,
    attendance: "billable",
   })
  ).toBe("nextPeriod")
 })

 it("skips dates outside this and next period calendars", () => {
  expect(
   classifyChaseSchedule({
    scheduledDate: "2026-08-31",
    currentPeriodDates: currentDates,
    nextPeriodDates: nextDates,
    attendance: "billable",
   })
  ).toBe("skip")
 })
})

describe("paymentDetailMatchesPool", () => {
 const pool = { academicYearId: "year-2627", namespace: specialistS1 }

 it("matches same specialist namespace and year", () => {
  expect(
   paymentDetailMatchesPool({
    pool,
    detail: { academicYearId: "year-2627", namespace: specialistS1 },
   })
  ).toBe(true)
 })

 it("rejects another grade even in the same year", () => {
  expect(
   paymentDetailMatchesPool({
    pool,
    detail: { academicYearId: "year-2627", namespace: specialistS2 },
   })
  ).toBe(false)
 })

 it("rejects homework and trial details", () => {
  expect(
   paymentDetailMatchesPool({
    pool,
    detail: {
     academicYearId: "year-2627",
     namespace: { courseGroup: "homework", namespaceKey: "class:hw", sharesAcrossClasses: false },
    },
   })
  ).toBe(false)
  expect(
   paymentDetailMatchesPool({
    pool,
    detail: {
     academicYearId: "year-2627",
     namespace: { courseGroup: "trial", namespaceKey: "class:t", sharesAcrossClasses: false },
    },
   })
  ).toBe(false)
 })

 it("rejects monthly-fee rows marked skipLessons", () => {
  expect(
   paymentDetailMatchesPool({
    pool,
    detail: { academicYearId: "year-2627", namespace: specialistS1, skipLessons: true },
   })
  ).toBe(false)
 })

 it("rejects tuition lines with lesson_count below 1", () => {
  expect(
   paymentDetailMatchesPool({
    pool,
    detail: { academicYearId: "year-2627", namespace: specialistS1, lessonCount: 0 },
   })
  ).toBe(false)
 })

 it("matches private by class key; missing year still matches private pool", () => {
  const privPool = { academicYearId: "year-2627", namespace: privateClass }
  expect(
   paymentDetailMatchesPool({
    pool: privPool,
    detail: { academicYearId: "year-2627", namespace: privateClass },
   })
  ).toBe(true)
  expect(
   paymentDetailMatchesPool({
    pool: privPool,
    detail: { academicYearId: null, namespace: privateClass },
   })
  ).toBe(true)
  expect(
   paymentDetailMatchesPool({
    pool,
    detail: { academicYearId: null, namespace: privateClass },
   })
  ).toBe(false)
 })
})

describe("chaseDeclarationAppliesToPool", () => {
 const pool = {
  studentId: "stu",
  academicYearId: "year-2627",
  namespace: specialistS1,
 }
 const declPool = {
  studentId: "stu",
  academicYearId: "year-2627",
  courseGroup: "group_specialist" as const,
  namespaceKey: "S1",
 }

 it("counts a declaration on a currently enrolled class", () => {
  expect(
   chaseDeclarationAppliesToPool({
    classId: "class-a",
    poolClassIds: new Set(["class-a"]),
    sourceEventType: "enrollment_auto",
    declarationPool: declPool,
    pool,
   })
  ).toBe(true)
 })

 it("does not count leftover enrollment_auto on a withdrawn class of the same grade", () => {
  expect(
   chaseDeclarationAppliesToPool({
    classId: "class-old",
    poolClassIds: new Set(["class-new"]),
    sourceEventType: "enrollment_auto",
    declarationPool: declPool,
    pool,
   })
  ).toBe(false)
 })

 it("counts 調堂 / 改期補回 on another class when the pool matches", () => {
  expect(
   chaseDeclarationAppliesToPool({
    classId: "class-other",
    poolClassIds: new Set(["class-own"]),
    sourceEventType: "student_makeup",
    declarationPool: declPool,
    pool,
   })
  ).toBe(true)
  expect(
   chaseDeclarationAppliesToPool({
    classId: "class-other",
    poolClassIds: new Set(["class-own"]),
    sourceEventType: "class_reschedule",
    declarationPool: declPool,
    pool,
   })
  ).toBe(true)
 })

 it("rejects 調堂 bound to another grade pool", () => {
  expect(
   chaseDeclarationAppliesToPool({
    classId: "class-other",
    poolClassIds: new Set(["class-own"]),
    sourceEventType: "student_makeup",
    declarationPool: { ...declPool, namespaceKey: "S2" },
    pool,
   })
  ).toBe(false)
 })
})

describe("formatTuitionChaseSubjectSubtotals", () => {
 it("groups pending units by class label", () => {
  expect(
   formatTuitionChaseSubjectSubtotals([
    { classLabel: "英文", units: 2 },
    { classLabel: "數學", units: 4 },
    { classLabel: "英文", units: 2 },
   ])
  ).toBe("英文 4 堂、數學 4 堂")
 })
})

describe("defaultTuitionChasePoolKey", () => {
 it("prefers a pool that still needs collection", () => {
  expect(
   defaultTuitionChasePoolKey([
    { poolKey: "prepaid", suggestedLessons: 0 },
    { poolKey: "due", suggestedLessons: 4 },
   ])
  ).toBe("due")
 })

 it("falls back to the first pool when all prepaid", () => {
  expect(
   defaultTuitionChasePoolKey([{ poolKey: "a", suggestedLessons: 0 }])
  ).toBe("a")
 })

 it("opens the missing-remaining pool when nothing is due", () => {
  expect(
   defaultTuitionChasePoolKey([
    { poolKey: "prepaid", suggestedLessons: 0 },
    { poolKey: "missing", suggestedLessons: 0, remainingKnown: false },
   ])
  ).toBe("missing")
 })
})
