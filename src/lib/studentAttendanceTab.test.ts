import { describe, expect, it } from "vitest"

import {
 attendanceClassOptions,
 attendanceStatusCategory,
 attendanceTabKind,
 filterSortAttendance,
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
