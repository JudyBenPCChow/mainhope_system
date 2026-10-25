import { describe, expect, it } from "vitest"

import {
 attendanceAcademicYearLabel,
 attendanceClassOptions,
 attendanceStatusCategory,
 attendanceTabKind,
 filterSortAttendance,
 groupAttendanceByAcademicYear,
 planStudentAttendanceFetch,
 summarizeAttendanceStats,
 type AttendanceTabRow,
} from "@/lib/studentAttendanceTab"

const row = (
 over: Partial<AttendanceTabRow> & Pick<AttendanceTabRow, "id" | "status" | "attendance_date">
): AttendanceTabRow => ({
 classId: over.classId ?? "c1",
 classLabel: over.classLabel ?? "英文 A",
 ...over,
})

describe("studentAttendanceTab", () => {
 it("失敗／真空／成功三種畫面語意", () => {
  expect(attendanceTabKind({ status: "error", message: "timeout" })).toBe("error")
  expect(attendanceTabKind({ status: "ready", rows: [] })).toBe("empty")
  expect(
   attendanceTabKind({
    status: "ready",
    rows: [row({ id: "1", status: "出席", attendance_date: "2026-08-01" })],
   })
  ).toBe("rows")
 })

 it("真 0 統計唔當失敗", () => {
  expect(summarizeAttendanceStats([])).toEqual({ present: 0, absent: 0, makeup: 0 })
 })

 it("篩選無結果係真空，唔係失敗", () => {
  const rows = [row({ id: "1", status: "出席", attendance_date: "2026-08-01", classId: "c1" })]
  const filtered = filterSortAttendance(rows, {
   classFilter: "c2",
   statusFilter: "all",
   dateFrom: "",
   dateTo: "",
   sort: "dateDesc",
  })
  expect(filtered).toEqual([])
  expect(attendanceTabKind({ status: "ready", rows })).toBe("rows")
 })

 it("缺席／出席分類", () => {
  expect(attendanceStatusCategory("缺席")).toBe("absent")
  expect(attendanceStatusCategory("出席")).toBe("present")
  expect(attendanceStatusCategory("現場")).toBe("other")
 })

 it("非本學年按學年分組，私人跟出席日，未標學年排最後", () => {
  expect(
   attendanceAcademicYearLabel({
    attendance_date: "2026-08-15",
    classKind: "private",
    classSubject: "一對一英文",
    academicYearLabel: null,
   })
  ).toBe("26SM")
  expect(
   attendanceAcademicYearLabel({
    attendance_date: "2026-10-02",
    classKind: "group",
    classSubject: "數學",
    academicYearLabel: "2627",
   })
  ).toBe("2627")
  const groups = groupAttendanceByAcademicYear([
   row({
    id: "old",
    status: "出席",
    attendance_date: "2025-10-01",
    academicYearLabel: "2526",
    classKind: "group",
   }),
   row({
    id: "summer",
    status: "出席",
    attendance_date: "2026-08-01",
    academicYearLabel: "26SM",
    classKind: "group",
   }),
   row({
    id: "blank",
    status: "出席",
    attendance_date: "2024-09-01",
    academicYearLabel: null,
    classKind: "group",
    classSubject: "數學",
   }),
   row({
    id: "private-old",
    status: "出席",
    attendance_date: "2026-05-01",
    academicYearLabel: null,
    classKind: "private",
    classSubject: "一對一英文",
   }),
  ])
  expect(groups.map((g) => g.label)).toEqual(["26SM", "2526", "未標學年"])
  expect(groups[1]?.items.map((item) => item.id)).toEqual(["old", "private-old"])
  expect(groups[2]?.items.map((item) => item.id)).toEqual(["blank"])
 })

 it("10 月本學年只含 2627，私人窗跟該學年起迄", () => {
  const plan = planStudentAttendanceFetch(
   [
    { id: "y2526", label: "2526", start_date: "2025-09-01", end_date: "2026-06-30", is_current: false },
    { id: "y26sm", label: "26SM", start_date: "2026-07-01", end_date: "2026-08-31", is_current: false },
    { id: "y2627", label: "2627", start_date: "2026-09-01", end_date: "2027-06-30", is_current: true },
   ],
   "2026-10-25"
  )
  expect(plan.currentYearIds).toEqual(["y2627"])
  expect(plan.ctx.currentYearLabels).toEqual(["2627"])
  expect(plan.ctx.currentYearStart).toBe("2026-09-01")
  expect(plan.ctx.currentYearEnd).toBe("2027-06-30")
 })

 it("暑期本學年含暑期與下一常規，私人窗只跟當日所屬暑期", () => {
  const plan = planStudentAttendanceFetch(
   [
    { id: "y26sm", label: "26SM", start_date: "2026-07-01", end_date: "2026-08-31" },
    { id: "y2627", label: "2627", start_date: "2026-09-01", end_date: "2027-06-30" },
   ],
   "2026-07-20"
  )
  expect(plan.currentYearIds).toEqual(["y26sm", "y2627"])
  expect(plan.ctx.currentYearStart).toBe("2026-07-01")
  expect(plan.ctx.currentYearEnd).toBe("2026-08-31")
 })

 it("班別選項按名稱排序", () => {
  expect(
   attendanceClassOptions([
    row({ id: "1", status: "出席", attendance_date: "2026-08-01", classId: "b", classLabel: "數學" }),
    row({ id: "2", status: "出席", attendance_date: "2026-08-02", classId: "a", classLabel: "英文" }),
   ])
  ).toEqual([
   ["a", "英文"],
   ["b", "數學"],
  ])
 })
})
