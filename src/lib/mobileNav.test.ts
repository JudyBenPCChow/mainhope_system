import { describe, expect, it } from "vitest"

import { HW_PATH } from "@/lib/homeworkTutoringNav"
import { getMobileBottomTabs } from "@/lib/mobileNav"

describe("流動底欄", () => {
 it("行政／老師／外星人有收件匣捷徑", () => {
  expect(getMobileBottomTabs("admin").map((t) => t.path)).toContain("/Inbox")
  expect(getMobileBottomTabs("teacher").map((t) => t.path)).toContain("/Inbox")
  expect(getMobileBottomTabs("alien").map((t) => t.path)).toContain("/Inbox")
  expect(getMobileBottomTabs("manager").map((t) => t.path)).toContain("/Inbox")
 })

 it("老師底欄仍係時間表，排程唔佔一格", () => {
  expect(getMobileBottomTabs("teacher").map((t) => t.path)).toContain("/TeacherTimetable")
  expect(getMobileBottomTabs("teacher").map((t) => t.path)).not.toContain("/Schedule")
 })

 it("有功輔入口的老師底欄仍是時間表，沒有功課紀錄", () => {
  expect(
   getMobileBottomTabs("teacher", { homeworkTutoringNavVisible: true }).map((t) => t.path)
  ).toEqual(["/Home", "/Attendance", "/TeacherTimetable", "/Inbox", "/AllFeatures"])
 })

 it("純功輔導師底欄有報更與當值，無點名／時間表／功課紀錄", () => {
  const paths = getMobileBottomTabs("teacher", { homeworkTutorOnly: true }).map((t) => t.path)
  expect(paths).toEqual([
   "/Home",
   HW_PATH.submit,
   HW_PATH.myDuty,
   "/AllFeatures",
  ])
 })
})
