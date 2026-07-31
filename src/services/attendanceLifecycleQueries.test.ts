import { describe, expect, it } from "vitest"

import {
 filterDeletableHits,
 formatAttendanceHitsDescription,
 hitsHaveBillable,
 shouldRetainOtherMakeupSchedule,
 type AttendanceLifecycleHit,
} from "@/services/attendanceLifecycleQueries"
import { writableStudentIdsFromRosterContext } from "@/services/attendanceQueries"
import type { ScheduleRosterContext } from "@/services/scheduleRosterQueries"

function hit(
 partial: Partial<AttendanceLifecycleHit> & Pick<AttendanceLifecycleHit, "id" | "scheduleId" | "status">
): AttendanceLifecycleHit {
 return {
  studentId: "stu-1",
  classId: "class-1",
  attendanceDate: "2026-07-25",
  updatedAt: "2026-07-25T12:00:00.000Z",
  studentName: "測試生",
  ...partial,
 }
}

describe("attendanceLifecycleQueries helpers", () => {
 it("可刪列＝候選 − 仍應到 schedule（eligibility）", () => {
  const candidates = [
   hit({ id: "a1", scheduleId: "s1", status: "現場" }),
   hit({ id: "a2", scheduleId: "s2", status: "現場" }),
   hit({ id: "a3", scheduleId: null, status: "現場" }),
  ]
  const retain = new Set(["s2"])
  const deletable = filterDeletableHits(candidates, retain)
  expect(deletable.map((h) => h.id)).toEqual(["a1"])
 })

 it("仍應到時可刪為空（取消請假但報讀仍在）", () => {
  const candidates = [
   hit({ id: "a1", scheduleId: "s1", status: "現場" }),
   hit({ id: "a2", scheduleId: "s2", status: "現場" }),
  ]
  const retain = new Set(["s1", "s2"])
  expect(filterDeletableHits(candidates, retain)).toEqual([])
 })

 it("文案僅在有計費列時強調已上堂數", () => {
  const billable = [hit({ id: "a1", scheduleId: "s1", status: "現場" })]
  const nonBillable = [hit({ id: "a1", scheduleId: "s1", status: "事假" })]
  expect(hitsHaveBillable(billable)).toBe(true)
  expect(hitsHaveBillable(nonBillable)).toBe(false)
  expect(formatAttendanceHitsDescription(billable)).toContain("計費出席")
  expect(formatAttendanceHitsDescription(nonBillable)).toContain("非計費")
 })

 it("GAP-P0-1：已取消／完成 schedule 唔因 otherMakeup retain", () => {
  expect(shouldRetainOtherMakeupSchedule("已排程")).toBe(true)
  expect(shouldRetainOtherMakeupSchedule("取消")).toBe(false)
  expect(shouldRetainOtherMakeupSchedule("已取消")).toBe(false)
  expect(shouldRetainOtherMakeupSchedule("完成")).toBe(false)
  expect(shouldRetainOtherMakeupSchedule(null)).toBe(true)
 })
})

describe("A2 rollcall roster filter helper", () => {
 it("writableStudentIdsFromRosterContext 合併報讀與試堂", () => {
  const ctx: ScheduleRosterContext = {
   schedules: [
    {
     id: "s1",
     classId: "c1",
     scheduledDate: "2026-08-01",
     sessionNumber: 1,
     academicYearId: null,
     academicYearLabel: null,
     courseMode: "regular",
     subject: null,
     classKind: null,
     courseCodeFull: null,
     courseName: null,
     dayOfWeek: null,
     timeSlot: null,
     lessonSlotsPerSession: 1,
    },
   ],
   periods: [],
   enrollments: [
    {
     id: "e1",
     classId: "c1",
     studentId: "stu-a",
     status: "就讀中",
     enrollDate: null,
     withdrawEffectiveDate: null,
     enrollmentPeriod: "both",
     createdAt: "",
     fullName: "甲",
     englishName: null,
     grade: null,
     school: null,
     contactPhone: null,
    },
   ],
   enrollmentScheduleIds: new Map(),
   enrollmentSessionNumbers: new Map(),
   trials: [
    {
     id: "t1",
     scheduleId: "s1",
     classId: "c1",
     studentId: "stu-b",
     status: "已預約",
     fullName: "乙",
     englishName: null,
     grade: null,
     contactPhone: null,
    },
   ],
   leaves: [],
   attendance: [],
  }
  const ids = writableStudentIdsFromRosterContext(ctx, ["s1"])
  expect(ids.has("stu-a")).toBe(true)
  expect(ids.has("stu-b")).toBe(true)
  expect(ids.has("stu-c")).toBe(false)
 })
})
