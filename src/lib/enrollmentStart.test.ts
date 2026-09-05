import { describe, expect, it } from "vitest"

import {
 formatClassScheduleLabel,
 listEnrollmentStartScheduleOptions,
 listPastSchedulesNeedingAutoLeave,
 resolveEnrollmentStartDate,
 resolveNextClassSchedule,
} from "@/lib/enrollmentStart"

describe("resolveNextClassSchedule", () => {
 it("略過已取消與過去堂，取今天起最早一堂", () => {
  const next = resolveNextClassSchedule(
   [
    { scheduled_date: "2026-08-20", status: "正常", start_time: "16:00", session_number: 1 },
    { scheduled_date: "2026-08-24", status: "已取消", start_time: "16:00", session_number: 2 },
    { scheduled_date: "2026-08-31", status: "正常", start_time: "17:00", session_number: 4 },
    { scheduled_date: "2026-08-31", status: "正常", start_time: "16:00", session_number: 3 },
   ],
   "2026-08-24"
  )
  expect(next?.session_number).toBe(3)
 })

 it("沒有即將到來的課堂則回 null", () => {
  expect(
   resolveNextClassSchedule(
    [{ scheduled_date: "2026-08-01", status: "正常", start_time: "16:00" }],
    "2026-08-24"
   )
  ).toBeNull()
 })
})

describe("listEnrollmentStartScheduleOptions", () => {
 it("含過去堂、略過取消，並按日期時間排序", () => {
  const opts = listEnrollmentStartScheduleOptions(
   [
    { scheduled_date: "2026-09-07", status: "正常", start_time: "17:00", session_number: 3 },
    { scheduled_date: "2026-08-20", status: "正常", start_time: "16:00", session_number: 1 },
    { scheduled_date: "2026-08-24", status: "已取消", start_time: "16:00", session_number: 2 },
    { scheduled_date: "2026-09-07", status: "正常", start_time: "16:00", session_number: 2 },
   ],
   "2026-09-05"
  )
  expect(opts.map((r) => r.session_number)).toEqual([1, 2, 3])
 })
})

describe("listPastSchedulesNeedingAutoLeave", () => {
 it("含首堂日、不含今天，略過取消", () => {
  const past = listPastSchedulesNeedingAutoLeave(
   [
    { scheduled_date: "2026-08-20", status: "正常", start_time: "16:00", session_number: 1 },
    { scheduled_date: "2026-08-27", status: "正常", start_time: "16:00", session_number: 2 },
    { scheduled_date: "2026-08-27", status: "已取消", start_time: "17:00", session_number: 99 },
    { scheduled_date: "2026-09-05", status: "正常", start_time: "16:00", session_number: 3 },
    { scheduled_date: "2026-09-12", status: "正常", start_time: "16:00", session_number: 4 },
   ],
   "2026-08-27",
   "2026-09-05"
  )
  expect(past.map((r) => r.session_number)).toEqual([2])
 })

 it("首堂日已是今天或未來則空", () => {
  expect(
   listPastSchedulesNeedingAutoLeave(
    [{ scheduled_date: "2026-09-05", status: "正常", start_time: "16:00" }],
    "2026-09-05",
    "2026-09-05"
   )
  ).toEqual([])
  expect(
   listPastSchedulesNeedingAutoLeave(
    [{ scheduled_date: "2026-09-12", status: "正常", start_time: "16:00" }],
    "2026-09-12",
    "2026-09-05"
   )
  ).toEqual([])
 })
})

describe("resolveEnrollmentStartDate", () => {
 it("下一堂用下一堂日期，沒有則用今天", () => {
  expect(
   resolveEnrollmentStartDate({
    mode: "next",
    todayYmd: "2026-08-24",
    nextScheduleDate: "2026-09-07",
    specifiedScheduleDate: null,
   })
  ).toBe("2026-09-07")
  expect(
   resolveEnrollmentStartDate({
    mode: "next",
    todayYmd: "2026-08-24",
    nextScheduleDate: null,
    specifiedScheduleDate: null,
   })
  ).toBe("2026-08-24")
 })

 it("指定排程必須有日期", () => {
  expect(
   resolveEnrollmentStartDate({
    mode: "schedule",
    todayYmd: "2026-08-24",
    nextScheduleDate: "2026-09-07",
    specifiedScheduleDate: "2026-10-05",
   })
  ).toBe("2026-10-05")
  expect(() =>
   resolveEnrollmentStartDate({
    mode: "schedule",
    todayYmd: "2026-08-24",
    nextScheduleDate: "2026-09-07",
    specifiedScheduleDate: null,
   })
  ).toThrow("請選擇開始報讀的排程")
 })
})

describe("formatClassScheduleLabel", () => {
 it("組堂次、日期、時間", () => {
  expect(
   formatClassScheduleLabel({
    session_number: 3,
    scheduled_date: "2026-09-07",
    start_time: "16:00:00",
   })
  ).toBe("第3堂 · 2026-09-07 · 16:00")
 })
})
