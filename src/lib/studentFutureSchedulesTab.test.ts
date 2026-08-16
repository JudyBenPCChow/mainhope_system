import { describe, expect, it } from "vitest"

import { buildFutureSchedulesCsv, futureSchedulesTabKind } from "@/lib/studentFutureSchedulesTab"

describe("studentFutureSchedulesTab", () => {
 it("失敗／真空／成功三種畫面語意", () => {
  expect(futureSchedulesTabKind({ status: "error" })).toBe("error")
  expect(futureSchedulesTabKind({ status: "ready", rows: [] })).toBe("empty")
  expect(
   futureSchedulesTabKind({
    status: "ready",
    rows: [{ id: "1" }],
   })
  ).toBe("rows")
 })

 it("真 0 列輸出空表，類型欄補堂／就讀分開", () => {
  const empty = buildFutureSchedulesCsv([])
  expect(empty).toContain("堂次")
  expect(empty.split("\n").length).toBe(2)

  const csv = buildFutureSchedulesCsv([
   {
    session_number: 1,
    scheduled_date: "2026-09-01",
    start_time: "16:00",
    end_time: "17:30",
    subject: "英文",
    course_code_full: "ENG-1A",
    teacher_name: "陳老師",
    status: "已安排",
    source: "enrolled",
   },
   {
    session_number: null,
    scheduled_date: "2026-09-02",
    start_time: null,
    end_time: null,
    subject: "數學",
    course_code_full: null,
    teacher_name: null,
    status: "已安排",
    source: "makeup",
   },
  ])
  expect(csv).toContain("就讀")
  expect(csv).toContain("補堂")
  expect(csv).not.toMatch(/(^|,)0(,|$)/)
 })
})
