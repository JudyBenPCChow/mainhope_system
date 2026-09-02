import { describe, expect, it } from "vitest"

import {
 isCampusHolidayCancelReason,
 scheduleAlertsFromSummary,
 summarizeScheduleManageRows,
} from "@/lib/scheduleManageRowSummary"
import { rosterHeadcountForSchedule, type ScheduleRosterContext } from "@/services/scheduleRosterQueries"

function enrollment(
 id: string,
 studentId: string,
 enrollmentPeriod: "第一期" | "第二期" | "兩期全報" | "單堂"
) {
 return {
  id,
  classId: "class-a",
  studentId,
  status: "就讀中",
  enrollDate: "2026-06-01",
  withdrawEffectiveDate: null,
  enrollmentPeriod,
  createdAt: "2026-06-01T00:00:00Z",
  fullName: studentId,
  englishName: null,
  grade: "S3",
  school: null,
  contactPhone: null,
 } as const
}

function summerContext(): ScheduleRosterContext {
 return {
  schedules: [
   {
    id: "schedule-1",
    classId: "class-a",
    scheduledDate: "2026-07-10",
    sessionNumber: 1,
    academicYearId: "year-a",
    academicYearLabel: "2026 暑期",
    courseMode: "summer_two_period",
    subject: "數學",
    classKind: "group",
    courseCodeFull: "26SM-MATHS3008-A",
    courseName: "暑期中三數學班",
    dayOfWeek: "星期五",
    timeSlot: "10:00-11:15",
    lessonSlotsPerSession: 1,
   },
   {
    id: "schedule-2",
    classId: "class-a",
    scheduledDate: "2026-07-24",
    sessionNumber: 2,
    academicYearId: "year-a",
    academicYearLabel: "2026 暑期",
    courseMode: "summer_two_period",
    subject: "數學",
    classKind: "group",
    courseCodeFull: "26SM-MATHS3008-A",
    courseName: "暑期中三數學班",
    dayOfWeek: "星期五",
    timeSlot: "10:00-11:15",
    lessonSlotsPerSession: 1,
   },
  ],
  periods: [
   {
    id: "period-1",
    academicYearId: "year-a",
    periodCode: 1,
    label: "第一期",
    startDate: "2026-07-01",
    endDate: "2026-07-15",
   },
   {
    id: "period-2",
    academicYearId: "year-a",
    periodCode: 2,
    label: "第二期",
    startDate: "2026-07-16",
    endDate: "2026-07-31",
   },
  ],
  enrollments: [
   enrollment("enrollment-first", "第一期生", "第一期"),
   enrollment("enrollment-second", "第二期生", "第二期"),
   enrollment("enrollment-both", "兩期生", "兩期全報"),
   enrollment("enrollment-single-selected", "單堂已選", "單堂"),
   enrollment("enrollment-single-other", "單堂未選", "單堂"),
  ],
  enrollmentScheduleIds: new Map([
   ["enrollment-single-selected", new Set(["schedule-2"])],
   ["enrollment-single-other", new Set(["schedule-1"])],
  ]),
  enrollmentSessionNumbers: new Map([
   ["enrollment-single-selected", [2]],
   ["enrollment-single-other", [1]],
  ]),
  trials: [
   {
    id: "trial-active",
    scheduleId: "schedule-2",
    classId: "class-a",
    studentId: "trial-active-student",
    status: "已預約",
    paymentId: "pay-trial-1",
    countsTowardHeadcount: true,
    fullName: "試堂生",
    englishName: null,
    grade: "S3",
    contactPhone: null,
   },
  ],
  leaves: [
   {
    id: "leave-linked",
    studentId: "linked-student",
    classId: "class-a",
    scheduleId: "schedule-2",
    leaveDate: "2026-07-24",
    leaveReason: "病假",
    makeupType: null,
    makeupScheduleId: null,
    status: "已批核",
    createdAt: "2026-07-20T00:00:00Z",
    fullName: "請假生",
    englishName: null,
    grade: "S3",
    contactPhone: null,
   },
   {
    id: "makeup-here",
    studentId: "makeup-student",
    classId: "class-b",
    scheduleId: "other",
    leaveDate: "2026-07-20",
    leaveReason: "補堂",
    makeupType: "補堂",
    makeupScheduleId: "schedule-2",
    status: "已安排補堂",
    createdAt: "2026-07-20T00:00:00Z",
    fullName: "補堂生",
    englishName: null,
    grade: "S3",
    contactPhone: null,
   },
  ],
  attendance: [],
 }
}

describe("isCampusHolidayCancelReason", () => {
 it("校舍假期取消原因不計入未來取消堂", () => {
  expect(isCampusHolidayCancelReason("校舍假期：中秋")).toBe(true)
  expect(isCampusHolidayCancelReason("因地板工程取消")).toBe(false)
  expect(isCampusHolidayCancelReason(null)).toBe(false)
 })
})

describe("summarizeScheduleManageRows", () => {
 it("摘要人數與完整 roster 人頭一致，並標示試堂／請假／補堂", () => {
  const ctx = summerContext()
  const summaries = summarizeScheduleManageRows(ctx, ["schedule-1", "schedule-2"])
  expect(summaries.get("schedule-1")?.rosterCount).toBe(rosterHeadcountForSchedule(ctx, "schedule-1"))
  expect(summaries.get("schedule-2")?.rosterCount).toBe(rosterHeadcountForSchedule(ctx, "schedule-2"))
  expect(summaries.get("schedule-1")?.hasTrial).toBe(false)
  expect(summaries.get("schedule-2")?.hasTrial).toBe(true)
  expect(summaries.get("schedule-2")?.hasLeave).toBe(true)
  expect(summaries.get("schedule-2")?.hasMakeup).toBe(true)
  expect(summaries.get("schedule-1")?.canTakeAttendance).toBe(true)
  expect(summaries.get("schedule-2")?.canTakeAttendance).toBe(true)
 })

 it("連堂其中一節可點名則整組可點名", () => {
  const ctx = summerContext()
  const summaries = summarizeScheduleManageRows(ctx, ["schedule-1", "empty"], [
   { id: "schedule-1", consecutiveGroupId: "g1" },
   { id: "empty", consecutiveGroupId: "g1" },
  ])
  expect(summaries.get("empty")?.canTakeAttendance).toBe(true)
  expect(summaries.get("empty")?.rosterCount).toBe(0)
 })
})

describe("scheduleAlertsFromSummary", () => {
 it("錄影提示由基本列 remarks 判斷，不需 RPC", () => {
  const alerts = scheduleAlertsFromSummary(
   {
    scheduleId: "s1",
    rosterCount: 2,
    hasTrial: true,
    hasLeave: false,
    hasMakeup: false,
    canTakeAttendance: true,
   },
   "本堂錄影"
  )
  expect(alerts.trial).toBe(true)
  expect(alerts.leave).toBe(false)
  expect(alerts.record).toBe(true)
 })
})
