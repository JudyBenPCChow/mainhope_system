import { describe, expect, it } from "vitest"

import {
 FORCE_GRADUATE_CONFIRM_TEXT,
 emptyGraduationBlockers,
 formatGraduationConfirmDescription,
 formatGraduationWarningItems,
 graduationHasWarnings,
 isOpenPendingLessonForGraduation,
} from "@/lib/graduationGuard"

describe("isOpenPendingLessonForGraduation", () => {
 it("待補與已安排視為未完成", () => {
  expect(isOpenPendingLessonForGraduation("待補")).toBe(true)
  expect(isOpenPendingLessonForGraduation("已安排")).toBe(true)
 })

 it("已完成／取消不算", () => {
  expect(isOpenPendingLessonForGraduation("已完成")).toBe(false)
  expect(isOpenPendingLessonForGraduation("取消")).toBe(false)
 })
})

describe("graduationHasWarnings", () => {
 it("全 0 無警示", () => {
  expect(graduationHasWarnings(emptyGraduationBlockers())).toBe(false)
 })

 it("任一項 > 0 即警示", () => {
  expect(graduationHasWarnings({ ...emptyGraduationBlockers(), pendingPaymentCount: 1 })).toBe(true)
  expect(graduationHasWarnings({ ...emptyGraduationBlockers(), openPendingLessonCount: 2 })).toBe(true)
  expect(graduationHasWarnings({ ...emptyGraduationBlockers(), leaveAwaitingMakeupCount: 1 })).toBe(true)
  expect(graduationHasWarnings({ ...emptyGraduationBlockers(), activeEnrollmentCount: 1 })).toBe(true)
 })
})

describe("formatGraduationConfirmDescription", () => {
 it("無警示只講隱藏名單", () => {
  const text = formatGraduationConfirmDescription("陳大文", emptyGraduationBlockers())
  expect(text).toContain("陳大文")
  expect(text).toContain("日常名單隱藏")
  expect(text).not.toContain(FORCE_GRADUATE_CONFIRM_TEXT)
 })

 it("有警示列出項目並要求輸入強制畢業", () => {
  const b = {
   pendingPaymentCount: 2,
   openPendingLessonCount: 1,
   leaveAwaitingMakeupCount: 3,
   activeEnrollmentCount: 1,
  }
  expect(formatGraduationWarningItems(b)).toEqual([
   "待繳費／待收款 2 筆",
   "待補堂 1 筆",
   "未處理請假 3 筆",
   "就讀中報讀 1 個",
  ])
  const text = formatGraduationConfirmDescription("陳大文", b)
  expect(text).toContain(FORCE_GRADUATE_CONFIRM_TEXT)
  expect(text).toContain("待繳費／待收款 2 筆")
 })
})
