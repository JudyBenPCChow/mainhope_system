import { describe, expect, it } from "vitest"

import {
 canOfferTransferClassTime,
 classifyTransferStartOption,
 formatTransferClassTimeReason,
 isTransferStartDateBlocked,
 pairStudentEnrollmentChangeLines,
 resolveNextTransferStartSchedule,
} from "@/lib/transferClassTime"

describe("canOfferTransferClassTime", () => {
 it("只准就讀中專科常規報讀", () => {
  expect(
   canOfferTransferClassTime({
    status: "就讀中",
    classKind: "group",
    courseMode: "regular",
    enrollmentPeriod: null,
   })
  ).toBe(true)
  expect(
   canOfferTransferClassTime({
    status: "已退讀",
    classKind: "group",
    courseMode: "regular",
    enrollmentPeriod: null,
   })
  ).toBe(false)
  expect(
   canOfferTransferClassTime({
    status: "就讀中",
    classKind: "homework",
    courseMode: "regular",
    enrollmentPeriod: null,
   })
  ).toBe(false)
  expect(
   canOfferTransferClassTime({
    status: "就讀中",
    classKind: "group",
    courseMode: "summer_two_period",
    enrollmentPeriod: null,
   })
  ).toBe(false)
  expect(
   canOfferTransferClassTime({
    status: "就讀中",
    classKind: "group",
    courseMode: "regular",
    enrollmentPeriod: "單堂",
   })
  ).toBe(false)
 })
})

describe("isTransferStartDateBlocked", () => {
 it("已調堂上過的堂不可作第一堂", () => {
  expect(
   isTransferStartDateBlocked({
    startYmd: "2026-09-03",
    attendedOnTargetYmds: ["2026-09-03"],
    arrangedOnTargetYmds: [],
   })
  ).toBe(true)
  expect(
   isTransferStartDateBlocked({
    startYmd: "2026-09-10",
    attendedOnTargetYmds: ["2026-09-03"],
    arrangedOnTargetYmds: [],
   })
  ).toBe(false)
 })

 it("已約在新班尚未上的補堂：報讀須晚於該日", () => {
  expect(
   isTransferStartDateBlocked({
    startYmd: "2026-09-10",
    attendedOnTargetYmds: [],
    arrangedOnTargetYmds: ["2026-09-10"],
   })
  ).toBe(true)
  expect(
   isTransferStartDateBlocked({
    startYmd: "2026-09-03",
    attendedOnTargetYmds: [],
    arrangedOnTargetYmds: ["2026-09-10"],
   })
  ).toBe(true)
  expect(
   isTransferStartDateBlocked({
    startYmd: "2026-09-17",
    attendedOnTargetYmds: [],
    arrangedOnTargetYmds: ["2026-09-10"],
   })
  ).toBe(false)
 })
})

describe("resolveNextTransferStartSchedule", () => {
 it("跳過已調堂與已約在新班的堂", () => {
  const rows = [
   { scheduled_date: "2026-09-03", status: "正常", start_time: "16:30" },
   { scheduled_date: "2026-09-10", status: "正常", start_time: "16:30" },
   { scheduled_date: "2026-09-17", status: "正常", start_time: "16:30" },
  ]
  const next = resolveNextTransferStartSchedule(rows, "2026-09-04", {
   attendedOnTargetYmds: ["2026-09-03"],
   arrangedOnTargetYmds: ["2026-09-10"],
  })
  expect(next?.scheduled_date).toBe("2026-09-17")
 })
})

describe("classifyTransferStartOption", () => {
 it("過去已調堂仍列出但標 attended", () => {
  expect(
   classifyTransferStartOption({
    scheduleYmd: "2026-09-03",
    todayYmd: "2026-09-05",
    attendedOnTargetYmds: ["2026-09-03"],
    arrangedOnTargetYmds: [],
   })
  ).toBe("attended_makeup")
 })

 it("過去普通堂不列出", () => {
  expect(
   classifyTransferStartOption({
    scheduleYmd: "2026-09-03",
    todayYmd: "2026-09-05",
    attendedOnTargetYmds: [],
    arrangedOnTargetYmds: [],
   })
  ).toBe("hidden")
 })
})

describe("pairStudentEnrollmentChangeLines", () => {
 it("同日同科轉時間配成一句", () => {
  const lines = pairStudentEnrollmentChangeLines([
   {
    id: "w",
    action: "withdraw",
    effectiveDate: "2026-09-04",
    reason: "轉時間：星期六 10:15–11:30 → 星期四 16:30–17:45",
    classId: "sat",
    subject: "數學（必修部份）",
    dayOfWeek: "星期六",
    timeSlot: "10:15–11:30",
    createdAt: "2026-09-04T09:16:00Z",
   },
   {
    id: "e",
    action: "enroll",
    effectiveDate: "2026-09-04",
    reason: "轉時間：星期六 10:15–11:30 → 星期四 16:30–17:45",
    classId: "thu",
    subject: "數學（必修部份）",
    dayOfWeek: "星期四",
    timeSlot: "16:30–17:45",
    createdAt: "2026-09-04T09:17:00Z",
   },
  ])
  expect(lines).toHaveLength(1)
  expect(lines[0]).toMatchObject({
   kind: "transfer",
   effectiveDate: "2026-09-04",
   fromSlot: "星期六 10:15–11:30",
   toSlot: "星期四 16:30–17:45",
  })
 })

 it("人手退讀原因無轉時間前綴則不配對", () => {
  const lines = pairStudentEnrollmentChangeLines([
   {
    id: "w",
    action: "withdraw",
    effectiveDate: "2026-09-04",
    reason: "時間無法配合，轉到逢星期四16:30上堂",
    classId: "sat",
    subject: "數學（必修部份）",
    dayOfWeek: "星期六",
    timeSlot: "10:15–11:30",
    createdAt: "2026-09-04T09:16:00Z",
   },
   {
    id: "e",
    action: "enroll",
    effectiveDate: "2026-09-04",
    reason: null,
    classId: "thu",
    subject: "數學（必修部份）",
    dayOfWeek: "星期四",
    timeSlot: "16:30–17:45",
    createdAt: "2026-09-04T09:17:00Z",
   },
  ])
  expect(lines.map((l) => l.kind)).toEqual(["enroll", "withdraw"])
 })
})

describe("formatTransferClassTimeReason", () => {
 it("原因以轉時間開頭", () => {
  expect(
   formatTransferClassTimeReason({
    fromSlot: "星期六 10:15–11:30",
    toSlot: "星期四 16:30–17:45",
    extra: "家長要求",
   })
  ).toBe("轉時間：星期六 10:15–11:30 → 星期四 16:30–17:45；家長要求")
 })
})
