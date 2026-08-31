import { describe, expect, it } from "vitest"
import {
 canConvertExtraLessonToSelectedRoster,
 canPickEnrolledRoster,
 defaultRosterPolicyForNewSchedule,
 normalizeRosterPolicy,
} from "@/lib/scheduleRosterPolicy"

const MAKEUP_REMARK = "makeup_of=aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa；補回 2026-09-01"

describe("scheduleRosterPolicy", () => {
 it("正式堂與補回堂預設全體上紙", () => {
  expect(defaultRosterPolicyForNewSchedule({ isExtraLesson: false })).toBe("class_all")
  expect(
   defaultRosterPolicyForNewSchedule({ isExtraLesson: true, remarks: MAKEUP_REMARK })
  ).toBe("class_all")
 })

 it("其餘加堂預設挑選", () => {
  expect(defaultRosterPolicyForNewSchedule({ isExtraLesson: true })).toBe("selected")
  expect(defaultRosterPolicyForNewSchedule({ isExtraLesson: true, remarks: "追進度" })).toBe(
   "selected"
  )
 })

 it("缺值當 class_all", () => {
  expect(normalizeRosterPolicy(null)).toBe("class_all")
  expect(normalizeRosterPolicy("selected")).toBe("selected")
 })

 it("只有 selected 可剔人；makeup_of 即使誤標 selected 也不可剔", () => {
  expect(canPickEnrolledRoster({ rosterPolicy: "selected" })).toBe(true)
  expect(canPickEnrolledRoster({ rosterPolicy: "class_all", remarks: null })).toBe(false)
  expect(canPickEnrolledRoster({ rosterPolicy: "selected", remarks: MAKEUP_REMARK })).toBe(false)
 })

 it("既有加堂可改為挑選；正班與補回堂不可", () => {
  expect(
   canConvertExtraLessonToSelectedRoster({ isExtraLesson: true, rosterPolicy: "class_all" })
  ).toBe(true)
  expect(
   canConvertExtraLessonToSelectedRoster({ isExtraLesson: false, rosterPolicy: "class_all" })
  ).toBe(false)
  expect(
   canConvertExtraLessonToSelectedRoster({
    isExtraLesson: true,
    rosterPolicy: "class_all",
    remarks: MAKEUP_REMARK,
   })
  ).toBe(false)
  expect(
   canConvertExtraLessonToSelectedRoster({ isExtraLesson: true, rosterPolicy: "selected" })
  ).toBe(false)
 })
})
