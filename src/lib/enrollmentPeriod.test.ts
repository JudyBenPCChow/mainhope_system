import { describe, expect, it } from "vitest"

import {
 enrollmentCoversPeriod,
 enrollmentVisibleOnSchedule,
 resolvePeriodCodeFromDate,
 type AcademicYearPeriodRow,
} from "@/lib/enrollmentPeriod"

const SCHEDULE_A = "sched-a"
const SCHEDULE_B = "sched-b"

const PERIODS: AcademicYearPeriodRow[] = [
 {
  id: "p1",
  academicYearId: "ay",
  periodCode: 1,
  label: "第一期",
  startDate: "2026-07-06",
  endDate: "2026-07-31",
 },
 {
  id: "p2",
  academicYearId: "ay",
  periodCode: 2,
  label: "第二期",
  startDate: "2026-08-03",
  endDate: "2026-08-28",
 },
]

describe("enrollmentCoversPeriod", () => {
 it("第一期只涵蓋第一期", () => {
  expect(enrollmentCoversPeriod("第一期", 1)).toBe(true)
  expect(enrollmentCoversPeriod("第一期", 2)).toBe(false)
 })

 it("第二期只涵蓋第二期", () => {
  expect(enrollmentCoversPeriod("第二期", 1)).toBe(false)
  expect(enrollmentCoversPeriod("第二期", 2)).toBe(true)
 })

 it("兩期全報涵蓋兩期", () => {
  expect(enrollmentCoversPeriod("兩期全報", 1)).toBe(true)
  expect(enrollmentCoversPeriod("兩期全報", 2)).toBe(true)
 })

 it("單堂對期數一律 false", () => {
  expect(enrollmentCoversPeriod("單堂", 1)).toBe(false)
  expect(enrollmentCoversPeriod("單堂", 2)).toBe(false)
  expect(enrollmentCoversPeriod(" 單堂 ", 1)).toBe(false)
 })

 it("期數空白涵蓋兩期", () => {
  expect(enrollmentCoversPeriod(null, 1)).toBe(true)
  expect(enrollmentCoversPeriod(null, 2)).toBe(true)
  expect(enrollmentCoversPeriod(undefined, 1)).toBe(true)
  expect(enrollmentCoversPeriod(undefined, 2)).toBe(true)
 })
})

describe("enrollmentVisibleOnSchedule", () => {
 it("單堂只在已選堂次可見", () => {
  const enrolled = new Set([SCHEDULE_A])
  expect(
   enrollmentVisibleOnSchedule({
    enrollmentPeriod: "單堂",
    periodCode: 1,
    scheduleId: SCHEDULE_A,
    enrolledScheduleIds: enrolled,
   })
  ).toBe(true)
  expect(
   enrollmentVisibleOnSchedule({
    enrollmentPeriod: "單堂",
    periodCode: 1,
    scheduleId: SCHEDULE_B,
    enrolledScheduleIds: enrolled,
   })
  ).toBe(false)
 })

 it("單堂未選該堂時，期數空白也不見", () => {
  expect(
   enrollmentVisibleOnSchedule({
    enrollmentPeriod: "單堂",
    periodCode: null,
    scheduleId: SCHEDULE_B,
    enrolledScheduleIds: new Set([SCHEDULE_A]),
   })
  ).toBe(false)
 })

 it("非單堂沿用期數，不看出席堂次", () => {
  const enrolled = new Set([SCHEDULE_A])
  expect(
   enrollmentVisibleOnSchedule({
    enrollmentPeriod: "第一期",
    periodCode: 1,
    scheduleId: SCHEDULE_B,
    enrolledScheduleIds: enrolled,
   })
  ).toBe(true)
  expect(
   enrollmentVisibleOnSchedule({
    enrollmentPeriod: "第一期",
    periodCode: 2,
    scheduleId: SCHEDULE_A,
    enrolledScheduleIds: enrolled,
   })
  ).toBe(false)
  expect(
   enrollmentVisibleOnSchedule({
    enrollmentPeriod: "第二期",
    periodCode: 1,
    scheduleId: SCHEDULE_A,
    enrolledScheduleIds: enrolled,
   })
  ).toBe(false)
  expect(
   enrollmentVisibleOnSchedule({
    enrollmentPeriod: "第二期",
    periodCode: 2,
    scheduleId: SCHEDULE_B,
    enrolledScheduleIds: enrolled,
   })
  ).toBe(true)
  expect(
   enrollmentVisibleOnSchedule({
    enrollmentPeriod: "兩期全報",
    periodCode: 1,
    scheduleId: SCHEDULE_B,
    enrolledScheduleIds: enrolled,
   })
  ).toBe(true)
  expect(
   enrollmentVisibleOnSchedule({
    enrollmentPeriod: "兩期全報",
    periodCode: 2,
    scheduleId: SCHEDULE_B,
    enrolledScheduleIds: enrolled,
   })
  ).toBe(true)
 })

 it("非單堂在期數未知時可見", () => {
  expect(
   enrollmentVisibleOnSchedule({
    enrollmentPeriod: "第一期",
    periodCode: null,
    scheduleId: SCHEDULE_B,
    enrolledScheduleIds: new Set(),
   })
  ).toBe(true)
  expect(
   enrollmentVisibleOnSchedule({
    enrollmentPeriod: null,
    periodCode: 2,
    scheduleId: SCHEDULE_B,
    enrolledScheduleIds: new Set(),
   })
  ).toBe(true)
 })
})

describe("resolvePeriodCodeFromDate", () => {
 it("日期落在第一期或第二期", () => {
  expect(resolvePeriodCodeFromDate("2026-07-06", PERIODS)).toBe(1)
  expect(resolvePeriodCodeFromDate("2026-07-31", PERIODS)).toBe(1)
  expect(resolvePeriodCodeFromDate("2026-08-03", PERIODS)).toBe(2)
  expect(resolvePeriodCodeFromDate("2026-08-28", PERIODS)).toBe(2)
 })

 it("期間以外回 null", () => {
  expect(resolvePeriodCodeFromDate("2026-07-05", PERIODS)).toBe(null)
  expect(resolvePeriodCodeFromDate("2026-08-01", PERIODS)).toBe(null)
  expect(resolvePeriodCodeFromDate("2026-08-29", PERIODS)).toBe(null)
 })

 it("只取日期前十碼", () => {
  expect(resolvePeriodCodeFromDate("2026-07-20T16:00:00", PERIODS)).toBe(1)
 })
})
