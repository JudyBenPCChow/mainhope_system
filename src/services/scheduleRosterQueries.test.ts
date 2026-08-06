import { describe, expect, it } from "vitest"

import {
 activeTrialsForSchedules,
 enrollmentIsVisibleOnRosterSchedule,
 enrollmentPassesDateGates,
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

 it("補回加堂跨期時沿用原取消堂日期判定期數（第一期生仍應出現）", () => {
  const ctx = context()
  ctx.schedules.push({
   id: "schedule-makeup-p2-date",
   classId: "class-a",
   scheduledDate: "2026-07-20",
   enrollmentEligibilityDate: "2026-07-10",
   sessionNumber: 13,
   academicYearId: "year-a",
   academicYearLabel: "2026 暑期",
   courseMode: "summer_two_period",
   subject: "數學",
   classKind: "group",
   courseCodeFull: "26SM-MATHS3008-A",
   courseName: "暑期中三數學班",
   dayOfWeek: "星期一",
   timeSlot: "14:00-15:15",
   lessonSlotsPerSession: 1,
  })
  expect(
   enrollmentsForSchedules(ctx, ["schedule-makeup-p2-date"]).map((row) => row.studentId)
  ).toEqual(["第一期生", "兩期生"])
  expect(
   enrollmentIsVisibleOnRosterSchedule(
    ctx,
    enrollment("enrollment-first", "第一期生", "第一期"),
    ctx.schedules.find((row) => row.id === "schedule-makeup-p2-date")!
   )
  ).toBe(true)
 })

 it("2627 宣告路徑：須有就讀＋宣告，並套退讀生效日閘", () => {
  const ctx = context()
  const schedule = {
   id: "schedule-2627",
   classId: "class-a",
   scheduledDate: "2026-09-15",
   sessionNumber: 1,
   academicYearId: "year-2627",
   academicYearLabel: "2627",
   courseMode: "regular" as const,
   subject: "數學",
   classKind: "group",
   courseCodeFull: "2627-MATHS-A",
   courseName: "正規數學",
   dayOfWeek: "星期一",
   timeSlot: "10:00-11:15",
   lessonSlotsPerSession: 1 as const,
  }
  ctx.schedules.push(schedule)
  const staying = enrollment("enrollment-stay", "仍就讀", null)
  staying.enrollDate = "2026-09-01"
  const leaving = enrollment("enrollment-leave", "將退讀", null)
  leaving.enrollDate = "2026-09-01"
  leaving.withdrawEffectiveDate = "2026-09-15"
  ctx.enrollments.push(staying, leaving)
  ctx.activeDeclarations = [
   {
    id: "d1",
    scheduleId: "schedule-2627",
    studentId: "仍就讀",
    poolId: "p1",
    status: "active",
    supersededBy: null,
    sourceEventType: "enrollment_auto",
    sourceEventId: null,
    manualReason: null,
    createdAt: "2026-09-01T00:00:00Z",
   },
   {
    id: "d2",
    scheduleId: "schedule-2627",
    studentId: "將退讀",
    poolId: "p2",
    status: "active",
    supersededBy: null,
    sourceEventType: "enrollment_auto",
    sourceEventId: null,
    manualReason: null,
    createdAt: "2026-09-01T00:00:00Z",
   },
   {
    id: "d3",
    scheduleId: "schedule-2627",
    studentId: "已退讀殘留",
    poolId: "p3",
    status: "active",
    supersededBy: null,
    sourceEventType: "enrollment_auto",
    sourceEventId: null,
    manualReason: null,
    createdAt: "2026-09-01T00:00:00Z",
   },
  ]
  expect(enrollmentPassesDateGates(leaving, schedule)).toBe(false)
  expect(rosterStudentsForSchedule(ctx, "schedule-2627").map((r) => r.studentId)).toEqual([
   "仍就讀",
  ])
 })

 it("Wave2 跟飛：2627 取消後補回繼承同 pool 宣告；無宣告則不上紙", () => {
  const cancelled = {
   id: "sched-cancelled",
   classId: "class-a",
   scheduledDate: "2026-09-10",
   sessionNumber: 1,
   academicYearId: "year-2627",
   academicYearLabel: "2627",
   courseMode: "regular" as const,
   subject: "數學",
   classKind: "group",
   courseCodeFull: "2627-MATHS-A",
   courseName: "正規數學",
   dayOfWeek: "星期四",
   timeSlot: "10:00-11:15",
   lessonSlotsPerSession: 1 as const,
  }
  const makeup = {
   ...cancelled,
   id: "sched-makeup",
   scheduledDate: "2026-10-01",
   sessionNumber: 20,
  }
  const student = enrollment("enrollment-full", "跟飛生", null)
  student.enrollDate = "2026-09-01"
  const ctx: ScheduleRosterContext = {
   schedules: [cancelled, makeup],
   periods: [],
   enrollments: [student],
   enrollmentScheduleIds: new Map(),
   enrollmentSessionNumbers: new Map(),
   trials: [],
   leaves: [],
   attendance: [],
   // 模擬取消後 void 原堂；補回繼承同一 pool_id
   activeDeclarations: [
    {
     id: "decl-void",
     scheduleId: "sched-cancelled",
     studentId: "跟飛生",
     poolId: "pool-regular",
     status: "void",
     supersededBy: null,
     sourceEventType: "class_cancel",
     sourceEventId: null,
     manualReason: null,
     createdAt: "2026-09-01T00:00:00Z",
    },
    {
     id: "decl-inherited",
     scheduleId: "sched-makeup",
     studentId: "跟飛生",
     poolId: "pool-regular",
     status: "active",
     supersededBy: null,
     sourceEventType: "class_reschedule",
     sourceEventId: null,
     manualReason: null,
     createdAt: "2026-09-11T00:00:00Z",
    },
   ],
  }
  expect(rosterStudentsForSchedule(ctx, "sched-cancelled").map((r) => r.studentId)).toEqual([])
  expect(rosterStudentsForSchedule(ctx, "sched-makeup").map((r) => r.studentId)).toEqual([
   "跟飛生",
  ])
  expect(ctx.activeDeclarations!.find((d) => d.scheduleId === "sched-makeup")!.poolId).toBe(
   "pool-regular"
  )

  // 無宣告：即使就讀中亦不應出現（禁止日期推期數）
  const noDecl = { ...ctx, activeDeclarations: [] }
  expect(rosterStudentsForSchedule(noDecl, "sched-makeup").map((r) => r.studentId)).toEqual([])
 })

 it("報讀日在排程之後：第二期生不應出現在第一期堂點名紙（計糧未點名勿誤判）", () => {
  const ctx = context()
  const late = enrollment("enrollment-p2-late", "朱俊賢", "第二期")
  late.enrollDate = "2026-08-02"
  ctx.enrollments = [late, enrollment("enrollment-both", "兩期生", "兩期全報")]
  ctx.trials = []
  ctx.leaves = []
  // schedule-1 = 2026-07-10（第一期）
  expect(enrollmentPassesDateGates(late, ctx.schedules[0]!)).toBe(false)
  expect(
   enrollmentIsVisibleOnRosterSchedule(ctx, late, ctx.schedules[0]!)
  ).toBe(false)
  expect(rosterStudentsForSchedule(ctx, "schedule-1").map((r) => r.studentId)).toEqual([
   "兩期生",
  ])
  expect(rosterHeadcountForSchedule(ctx, "schedule-1")).toBe(1)
 })
})

