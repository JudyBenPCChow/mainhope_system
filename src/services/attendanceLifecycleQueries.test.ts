import { describe, expect, it } from "vitest"

import {
 filterDeletableHits,
 formatAttendanceHitsDescription,
 hitsHaveBillable,
 type AttendanceLifecycleHit,
} from "@/services/attendanceLifecycleQueries"

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

describe("attendanceLifecycleQueries A1 helpers", () => {
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
})
