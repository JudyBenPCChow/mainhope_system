import { describe, expect, it } from "vitest"

import {
 scheduleByDateActionsClass,
 scheduleByDateCardChromeClass,
 scheduleByDateTitleClass,
} from "@/components/schedule/ScheduleByDateList"

describe("ScheduleByDateList card chrome", () => {
 it("標題與操作維持上下堆疊，不以視口 sm 橫排", () => {
  expect(scheduleByDateCardChromeClass).toContain("flex-col")
  expect(scheduleByDateCardChromeClass).not.toMatch(/\bflex-row\b/)
  expect(scheduleByDateCardChromeClass).not.toMatch(/\bsm:flex-row\b/)
 })

 it("標題以詞為單位換行，禁止 break-all", () => {
  expect(scheduleByDateTitleClass).toContain("break-words")
  expect(scheduleByDateTitleClass).not.toContain("break-all")
 })

 it("操作列可 wrap，不與標題爭同一列", () => {
  expect(scheduleByDateActionsClass).toContain("flex-wrap")
  expect(scheduleByDateActionsClass).not.toMatch(/\bsm:border-0\b/)
 })
})
