import { describe, expect, it } from "vitest"

import {
 countPendingLeaveRows,
 filterMakeupCandidates,
 leaveTabKind,
 partitionLeaveByAcademicYear,
 type MakeupCandidateRow,
} from "@/lib/studentLeaveTab"

const cand = (over: Partial<MakeupCandidateRow> & Pick<MakeupCandidateRow, "id">): MakeupCandidateRow => ({
 classLabel: "英文 A",
 course_name: null,
 subject: "英文",
 course_code_full: "ENG-1A",
 teacher_name: "陳老師",
 scheduled_date: "2026-08-20",
 ...over,
})

describe("studentLeaveTab", () => {
 it("失敗／真空／成功三種畫面語意", () => {
  expect(leaveTabKind({ status: "error", message: "timeout" })).toBe("error")
  expect(leaveTabKind({ status: "ready", rows: [] })).toBe("empty")
  expect(leaveTabKind({ status: "ready", rows: [{ id: "1", status: "待補課" }] })).toBe("rows")
 })

 it("真 0 待補唔當失敗", () => {
  expect(countPendingLeaveRows([])).toBe(0)
  expect(countPendingLeaveRows([{ id: "1", status: "已補課" }])).toBe(0)
 })

 it("待補只數 status 含「待」", () => {
  expect(
   countPendingLeaveRows([
    { id: "1", status: "待補課" },
    { id: "2", status: "已安排" },
   ])
  ).toBe(1)
 })

 it("常規學年期間把暑期請假列為過往學年", () => {
  const { current, past } = partitionLeaveByAcademicYear(
   [
    { academicYearLabel: "2627" },
    { academicYearLabel: "26SM" },
    { academicYearLabel: "2526" },
   ],
   "2026-09-05"
  )
  expect(current.map((r) => r.academicYearLabel)).toEqual(["2627"])
  expect(past.map((r) => r.academicYearLabel)).toEqual(["26SM", "2526"])
 })

 it("補堂搜尋無結果係真空", () => {
  const rows = [cand({ id: "s1" })]
  expect(filterMakeupCandidates(rows, "數學")).toEqual([])
  expect(filterMakeupCandidates(rows, "英文")).toHaveLength(1)
  expect(filterMakeupCandidates(rows, "")).toHaveLength(1)
 })
})
