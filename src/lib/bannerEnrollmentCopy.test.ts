import { describe, expect, it } from "vitest"

import {
 enrollmentAddedTitle,
 enrollmentLeavePayMessage,
 formatDayMonth,
 homeworkDaysLabel,
 timeFromDatedLabel,
 trialRegisteredCountTitle,
 trialRegisteredTitle,
} from "@/lib/bannerEnrollmentCopy"

describe("bannerEnrollmentCopy", () => {
 it("專科報讀標題帶姓名、班名與逢星期", () => {
  expect(
   enrollmentAddedTitle({
    studentName: "陳大文",
    classLabel: "中一級數學A班",
    whenLabel: "逢星期四 17:45–19:00",
   })
  ).toBe("【已增加報讀】陳大文  中一級數學A班  逢星期四 17:45–19:00")
 })

 it("功輔標題用天數", () => {
  expect(homeworkDaysLabel("三日")).toBe("三天")
  expect(
   enrollmentAddedTitle({
    studentName: "陳大文",
    classLabel: "功課輔導班",
    whenLabel: "三天",
    homework: true,
   })
  ).toBe("【已增加報讀】陳大文 功課輔導班 三天")
 })

 it("有自動請假時第二句先寫堂數", () => {
  expect(enrollmentLeavePayMessage(2)).toBe(
   "已同步建立 2 堂請假；請到收款登記確認學費。確認收款後，已繳堂數才會增加。"
  )
 })

 it("試堂標題用日／月", () => {
  expect(formatDayMonth("2026-09-01")).toBe("1/9")
  expect(timeFromDatedLabel("2026-09-01", "2026-09-01 16:30–17:45")).toBe("16:30-17:45")
  expect(
   trialRegisteredTitle({
    studentName: "陳大文",
    dateYmd: "2026-09-01",
    classLabel: "中一級數學A班",
    timeLabel: "16:30-17:45",
   })
  ).toBe("【試堂登記成功】陳大文  已登記 1/9 中一級數學A班 16:30-17:45 試堂")
  expect(trialRegisteredCountTitle("陳大文", 3)).toBe("【已核准試堂登記】陳大文  已登記 3 筆試堂")
 })
})
