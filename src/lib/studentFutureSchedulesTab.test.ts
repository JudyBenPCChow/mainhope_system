import { describe, expect, it } from "vitest"

import {
 buildFutureSchedulesCsv,
 futureSchedulesTabKind,
 trialQualifiesForStudentUpcoming,
} from "@/lib/studentFutureSchedulesTab"

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

 it("試堂列匯出類型為試堂，未收款／已取消不計入未來排程", () => {
  expect(
   trialQualifiesForStudentUpcoming({
    trialStatus: "已預約",
    paymentId: "pay-1",
    paymentStatus: "已收款",
   })
  ).toBe(true)
  expect(
   trialQualifiesForStudentUpcoming({
    trialStatus: "已預約",
    paymentId: null,
    paymentStatus: null,
   })
  ).toBe(false)
  expect(
   trialQualifiesForStudentUpcoming({
    trialStatus: "已取消",
    paymentId: "pay-1",
    paymentStatus: "已收款",
   })
  ).toBe(false)

  const csv = buildFutureSchedulesCsv([
   {
    session_number: 42,
    scheduled_date: "2026-09-22",
    start_time: "16:30",
    end_time: "17:45",
    subject: "中四級常規物理班",
    course_code_full: "2627-PHYS4001-B",
    teacher_name: "老師",
    status: "正常",
    source: "trial",
   },
  ])
  expect(csv).toContain("試堂")
  expect(csv).not.toContain("就讀")
  expect(csv).not.toContain("補堂")
 })
})
