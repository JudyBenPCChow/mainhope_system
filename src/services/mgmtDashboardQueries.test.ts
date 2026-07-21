import { describe, expect, it } from "vitest"

import {
 enrollmentCoversAttendanceDate,
 pickEnrollmentForAttendance,
 previousPeriod,
 unitPriceForConsumedLesson,
} from "@/services/mgmtDashboardQueries"

describe("previousPeriod", () => {
 it("returns same-length prior window", () => {
  // 7/1–7/31 = 31 天 → 上期 5/31–6/30
  expect(previousPeriod({ dateFrom: "2026-07-01", dateTo: "2026-07-31" })).toEqual({
   dateFrom: "2026-05-31",
   dateTo: "2026-06-30",
  })
 })

 it("handles short ranges", () => {
  expect(previousPeriod({ dateFrom: "2026-07-10", dateTo: "2026-07-12" })).toEqual({
   dateFrom: "2026-07-07",
   dateTo: "2026-07-09",
  })
 })
})

const coursePrices = {
 pricePerLesson: 250,
 pricePerLessonPeriod2: 275,
 pricePerLessonBothPeriods: 240,
}

describe("unitPriceForConsumedLesson", () => {
 it("uses period-specific course prices when no class override", () => {
  expect(
   unitPriceForConsumedLesson({
    enrollmentPeriod: "第一期",
    classPriceOverride: null,
    coursePrices,
   })
  ).toBe(250)
  expect(
   unitPriceForConsumedLesson({
    enrollmentPeriod: "第二期",
    classPriceOverride: null,
    coursePrices,
   })
  ).toBe(275)
  expect(
   unitPriceForConsumedLesson({
    enrollmentPeriod: "兩期全報",
    classPriceOverride: null,
    coursePrices,
   })
  ).toBe(240)
 })

 it("uses default／單堂 price for null or 單堂 period", () => {
  expect(
   unitPriceForConsumedLesson({
    enrollmentPeriod: null,
    classPriceOverride: null,
    coursePrices,
   })
  ).toBe(250)
  expect(
   unitPriceForConsumedLesson({
    enrollmentPeriod: "單堂",
    classPriceOverride: null,
    coursePrices,
   })
  ).toBe(250)
 })

 it("class override wins over period prices", () => {
  expect(
   unitPriceForConsumedLesson({
    enrollmentPeriod: "第二期",
    classPriceOverride: 300,
    coursePrices,
   })
  ).toBe(300)
 })

 it("falls back to paid unit when catalog missing", () => {
  expect(
   unitPriceForConsumedLesson({
    enrollmentPeriod: null,
    classPriceOverride: null,
    coursePrices: {
     pricePerLesson: null,
     pricePerLessonPeriod2: null,
     pricePerLessonBothPeriods: null,
    },
    paidUnitFallback: 825,
   })
  ).toBe(825)
 })

 it("ignores zero class override so paid／course can apply", () => {
  expect(
   unitPriceForConsumedLesson({
    enrollmentPeriod: null,
    classPriceOverride: 0,
    coursePrices,
    paidUnitFallback: 825,
   })
  ).toBe(250)
 })

 it("sums one unit price per consumed lesson", () => {
  const unit = unitPriceForConsumedLesson({
   enrollmentPeriod: "第一期",
   classPriceOverride: null,
   coursePrices,
  })
  expect(unit * 3).toBe(750)
 })
})

describe("pickEnrollmentForAttendance", () => {
 const base = {
  studentId: "s1",
  classId: "c1",
  enrollmentPeriod: "第一期" as const,
  enrollDate: "2026-06-01",
  withdrawEffectiveDate: null as string | null,
  status: "就讀中",
 }

 it("prefers covering 就讀中 enrollment", () => {
  const picked = pickEnrollmentForAttendance(
   [
    { ...base, status: "已退讀", withdrawEffectiveDate: "2026-06-15", enrollmentPeriod: "第二期" },
    { ...base, enrollmentPeriod: "第一期" },
   ],
   "2026-07-10"
  )
  expect(picked?.enrollmentPeriod).toBe("第一期")
 })

 it("excludes enrollments after withdraw date", () => {
  expect(
   enrollmentCoversAttendanceDate(
    { ...base, withdrawEffectiveDate: "2026-07-01", status: "已退讀" },
    "2026-07-10"
   )
  ).toBe(false)
 })
})
