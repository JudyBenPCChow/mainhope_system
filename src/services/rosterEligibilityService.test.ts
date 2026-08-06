import { describe, expect, it } from "vitest"

import {
 compareRosterShadow,
 resolveRosterStudentsForSchedule,
} from "@/services/rosterEligibilityService"
import type { ScheduleRosterContext, ScheduleRosterEnrollment } from "@/services/scheduleRosterQueries"

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
  enrollDate: "2026-09-01",
  withdrawEffectiveDate: null,
  enrollmentPeriod,
  createdAt: "2026-09-01T00:00:00Z",
  fullName: studentId,
  englishName: null,
  grade: "S3",
  school: null,
  contactPhone: null,
 }
}

function gatedContext(withDeclaration: boolean): ScheduleRosterContext {
 const schedule = {
  id: "sched-1",
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
 return {
  schedules: [schedule],
  periods: [],
  enrollments: [enrollment("e1", "跟飛生", null)],
  enrollmentScheduleIds: new Map(),
  enrollmentSessionNumbers: new Map(),
  trials: [],
  leaves: [],
  attendance: [],
  activeDeclarations: withDeclaration
   ? [
      {
       id: "d1",
       scheduleId: "sched-1",
       studentId: "跟飛生",
       poolId: "pool-1",
       status: "active",
       supersededBy: null,
       sourceEventType: "enrollment_auto",
       sourceEventId: null,
       manualReason: null,
       createdAt: "2026-09-01T00:00:00Z",
      },
     ]
   : [],
 }
}

describe("compareRosterShadow / resolveRoster (Wave2)", () => {
 it("2627 正式路徑只吃宣告；shadow 可顯示缺宣告", async () => {
  const missing = gatedContext(false)
  expect(resolveRosterStudentsForSchedule(missing, "sched-1").map((r) => r.studentId)).toEqual([])

  const shadow = await compareRosterShadow(missing, "sched-1")
  expect(shadow.usesNewModel).toBe(true)
  expect(shadow.missingInNew.map((r) => r.studentId)).toEqual(["跟飛生"])
  expect(shadow.extraInNew).toEqual([])

  const ok = gatedContext(true)
  expect(resolveRosterStudentsForSchedule(ok, "sched-1").map((r) => r.studentId)).toEqual([
   "跟飛生",
  ])
  const shadowOk = await compareRosterShadow(ok, "sched-1")
  expect(shadowOk.missingInNew).toEqual([])
  expect(shadowOk.extraInNew).toEqual([])
 })
})
