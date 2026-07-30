import { describe, expect, it } from "vitest"

import {
 activeTrialsForSchedules,
 enrollmentIsVisibleOnRosterSchedule,
 enrollmentsForSchedules,
 leavesForSchedule,
 makeupsForSchedules,
 rosterHeadcountForSchedule,
 rosterStudentsForSchedule,
 scheduleStudentHintsFromContext,
 singleSessionNotOnSchedule,
 type ScheduleRosterContext,
 type ScheduleRosterEnrollment,
} from "@/services/scheduleRosterQueries"

function enrollment(
 id: string,
 studentId: string,
 enrollmentPeriod: ScheduleRosterEnrollment["enrollmentPeriod"]
): ScheduleRosterEnrollment {
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
 }
}

function context(): ScheduleRosterContext {
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
    fullName: "試堂生",
    englishName: null,
    grade: "S3",
    contactPhone: null,
   },
   {
    id: "trial-completed",
    scheduleId: "schedule-2",
    classId: "class-a",
    studentId: "trial-completed-student",
    status: "已完成",
    fullName: "已完成試堂",
    englishName: null,
    grade: "S3",
    contactPhone: null,
   },
   {
    id: "trial-cancelled",
    scheduleId: "schedule-2",
    classId: "class-a",
    studentId: "trial-cancelled-student",
    status: "已取消",
    fullName: "已取消試堂",
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
    status: "已確認",
    createdAt: "2026-07-20T00:00:00Z",
    fullName: "已連結請假",
    englishName: null,
    grade: "S3",
    contactPhone: null,
   },
   {
    id: "leave-same-day",
    studentId: "same-day-student",
    classId: "class-a",
    scheduleId: null,
    leaveDate: "2026-07-24",
    leaveReason: "事假",
    makeupType: "補堂",
    makeupScheduleId: "schedule-1",
    status: "待處理",
    createdAt: "2026-07-20T00:00:00Z",
    fullName: "同班同日請假",
    englishName: null,
    grade: "S3",
    contactPhone: null,
   },
  ],
  attendance: [],
 }
}

describe("schedule roster selectors", () => {
 it("按暑期期數及單堂選堂過濾名單", () => {
  const ctx = context()
  expect(enrollmentsForSchedules(ctx, ["schedule-1"]).map((row) => row.studentId)).toEqual([
   "第一期生",
   "兩期生",
   "單堂未選",
  ])
  expect(enrollmentsForSchedules(ctx, ["schedule-2"]).map((row) => row.studentId)).toEqual([
   "第二期生",
   "兩期生",
   "單堂已選",
  ])
 })

 it("連堂多個 schedule 不會重複同一報讀", () => {
  const ctx = context()
  const rows = enrollmentsForSchedules(ctx, ["schedule-1", "schedule-2"])
  expect(new Set(rows.map((row) => row.id)).size).toBe(rows.length)
  expect(rows).toHaveLength(5)
 })

 it("單堂未選名單只列出本堂沒有選擇的學生", () => {
  const rows = singleSessionNotOnSchedule(context(), "schedule-2")
  expect(rows.map((row) => row.studentId)).toEqual(["單堂未選"])
 })

 it("試堂只保留未完成及未取消紀錄", () => {
  expect(activeTrialsForSchedules(context(), ["schedule-2"]).map((row) => row.id)).toEqual([
   "trial-active",
  ])
 })

 it("請假同時支援 schedule 連結及同班同日，補堂按目標排程", () => {
  const ctx = context()
  expect(leavesForSchedule(ctx, "schedule-2").map((row) => row.id)).toEqual([
   "leave-linked",
   "leave-same-day",
  ])
  expect(makeupsForSchedules(ctx, ["schedule-1"]).map((row) => row.id)).toEqual([
   "leave-same-day",
  ])
 })

 it("不會把其他班報讀視為本排程名單", () => {
  const ctx = context()
  const foreign = { ...enrollment("foreign", "其他班學生", null), classId: "class-b" }
  expect(enrollmentIsVisibleOnRosterSchedule(ctx, foreign, ctx.schedules[0]!)).toBe(false)
 })

 it("點名冊合併當堂可見報讀＋試堂＋補堂並去重", () => {
  const ctx = context()
  expect(rosterStudentsForSchedule(ctx, "schedule-1").map((row) => row.fullName).sort()).toEqual(
   ["同班同日請假", "兩期生", "單堂未選", "第一期生"].sort()
  )
  expect(rosterStudentsForSchedule(ctx, "schedule-2").map((row) => row.fullName).sort()).toEqual(
   ["兩期生", "單堂已選", "第二期生", "試堂生"].sort()
  )
  expect(rosterHeadcountForSchedule(ctx, "schedule-2")).toBe(4)
 })

 it("排程名單提示對齊點名冊並把請假生另列", () => {
  const hints = scheduleStudentHintsFromContext(context(), ["schedule-1", "schedule-2"])
  const s1 = hints.get("schedule-1")!
  expect([...s1.attendingNames].sort()).toEqual(
   ["同班同日請假", "兩期生", "單堂未選", "第一期生"].sort()
  )
  expect(s1.leaveNames).toEqual([])
  expect(s1.notEnrolledNames).toEqual(["單堂已選"])
  const s2 = hints.get("schedule-2")!
  expect([...s2.attendingNames].sort()).toEqual(
   ["兩期生", "單堂已選", "第二期生", "試堂生"].sort()
  )
  expect([...s2.leaveNames].sort()).toEqual(["同班同日請假", "已連結請假"].sort())
  expect(s2.notEnrolledNames).toEqual(["單堂未選"])
 })
})

