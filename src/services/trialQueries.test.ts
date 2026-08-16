import { describe, expect, it } from "vitest"
import { trialConfirmedInboxCopy } from "@/services/trialQueries"

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
   body: "2026-09-07 16:00 · 計人頭。確認收款後已上點名紙。",
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
