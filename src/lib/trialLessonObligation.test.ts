import { describe, expect, it } from "vitest"

import {
 paidTrialObligesSchedule,
 resolveConsumptionPoolId,
} from "@/lib/trialLessonObligation"

describe("paidTrialObligesSchedule", () => {
 it("已收款的已完成試堂仍算該堂", () => {
  expect(paidTrialObligesSchedule("已完成", true)).toBe(true)
  expect(paidTrialObligesSchedule("已預約", true)).toBe(true)
 })

 it("取消或未確認收款不算", () => {
  expect(paidTrialObligesSchedule("已取消", true)).toBe(false)
  expect(paidTrialObligesSchedule("已完成", false)).toBe(false)
  expect(paidTrialObligesSchedule("已預約", false)).toBe(false)
 })
})

describe("resolveConsumptionPoolId", () => {
 it("已有消耗紀錄時退回原池，不改跟報讀宣告", () => {
  expect(
   resolveConsumptionPoolId({
    pinnedPoolId: "trial-pool",
    paidTrialPoolId: "trial-pool",
    declarationPoolId: "specialist-pool",
   })
  ).toBe("trial-pool")
 })

 it("該堂有試堂票時不扣專科池", () => {
  expect(
   resolveConsumptionPoolId({
    paidTrialPoolId: "trial-pool",
    declarationPoolId: "specialist-pool",
    fallbackPoolId: "specialist-pool",
   })
  ).toBe("trial-pool")
 })

 it("沒有試堂票時跟宣告", () => {
  expect(
   resolveConsumptionPoolId({
    declarationPoolId: "specialist-pool",
    fallbackPoolId: "other",
   })
  ).toBe("specialist-pool")
 })
})
