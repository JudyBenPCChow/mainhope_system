import { describe, expect, it } from "vitest"
import {
 pickOpenTrialIdsForPaymentLink,
 trialCanRecordLost,
 trialCanRecordOutcome,
 trialConfirmedInboxCopy,
 trialLostBlockedReason,
 trialLostWillCancel,
} from "@/services/trialQueries"

describe("trialConfirmedInboxCopy", () => {
 it("確認收款後上紙，並標計人頭", () => {
  expect(
   trialConfirmedInboxCopy({
    studentName: "陳大文",
    classLabel: "中一中文（C1CHI）",
    trialDate: "2026-09-07",
    startTime: "16:00:00",
    countsTowardHeadcount: true,
   })
  ).toEqual({
   title: "陳大文 試堂（中一中文（C1CHI））",
   body: "2026-09-07 16:00 · 計人頭。已確認收款並上點名紙。",
  })
 })

 it("唔計人頭", () => {
  const copy = trialConfirmedInboxCopy({
   studentName: "李小明",
   classLabel: "中二英文",
   trialDate: "2026-09-08",
   startTime: null,
   countsTowardHeadcount: false,
  })
  expect(copy.body).toContain("唔計人頭")
 })
})

describe("pickOpenTrialIdsForPaymentLink", () => {
 it("連堂同日兩筆一併掛", () => {
  expect(
   pickOpenTrialIdsForPaymentLink([
    { id: "a", trialDate: "2026-09-20" },
    { id: "b", trialDate: "2026-09-20" },
   ])
  ).toEqual({ trialIds: ["a", "b"], leftoverCount: 0 })
 })

 it("只掛最近試堂日，較早的留下", () => {
  expect(
   pickOpenTrialIdsForPaymentLink([
    { id: "old", trialDate: "2026-09-13" },
    { id: "new", trialDate: "2026-09-20" },
   ])
  ).toEqual({ trialIds: ["new"], leftoverCount: 1 })
 })

 it("沒有開著試堂", () => {
  expect(pickOpenTrialIdsForPaymentLink([])).toEqual({ trialIds: [], leftoverCount: 0 })
 })
})

describe("trial lost / outcome gates", () => {
 it("未取消亦可標流失，並標示會一併取消", () => {
  expect(trialCanRecordLost({ outcome: "open", status: "已預約" })).toBe(true)
  expect(trialLostBlockedReason({ outcome: "open", status: "已預約" })).toBeNull()
  expect(trialLostWillCancel({ outcome: "open", status: "已預約" })).toBe(true)
  expect(trialLostWillCancel({ outcome: "open", status: "取消" })).toBe(false)
 })

 it("已結案不可再標流失", () => {
  expect(trialCanRecordLost({ outcome: "converted", status: "已完成" })).toBe(false)
  expect(trialLostBlockedReason({ outcome: "lost", status: "取消" })).toBe("已流失")
 })

 it("其他結果須已點名或已取消", () => {
  expect(
   trialCanRecordOutcome({ outcome: "open", status: "已預約", roll_call_done: false })
  ).toBe(false)
  expect(
   trialCanRecordOutcome({ outcome: "open", status: "已預約", roll_call_done: true })
  ).toBe(true)
  expect(
   trialCanRecordOutcome({ outcome: "open", status: "取消", roll_call_done: false })
  ).toBe(true)
 })
})
