import { describe, expect, it } from "vitest"

import {
 classKindFilterLabel,
 enrollmentFilterLabel,
 kpiNumberDisplay,
 nextClassKindFilter,
 nextEnrollmentFilter,
} from "@/components/schedule/scheduleManageUi"

describe("kpiNumberDisplay", () => {
 it("載入或失敗顯示未知，成功空結果可為 0", () => {
  expect(kpiNumberDisplay("loading", 4)).toBe("—")
  expect(kpiNumberDisplay("error", 4)).toBe("—")
  expect(kpiNumberDisplay("ready", null)).toBe("—")
  expect(kpiNumberDisplay("ready", 0)).toBe("0")
  expect(kpiNumberDisplay("ready", 7)).toBe("7")
 })
})

describe("enrollment / classKind cycle filters", () => {
 it("報讀篩選：全部 → 有學生 → 未有學生 → 全部", () => {
  expect(nextEnrollmentFilter("all")).toBe("hasEnroll")
  expect(nextEnrollmentFilter("hasEnroll")).toBe("noEnroll")
  expect(nextEnrollmentFilter("noEnroll")).toBe("all")
 })

 it("班別類型篩選：全部 → 專科班 → 非專科班 → 全部", () => {
  expect(nextClassKindFilter("all")).toBe("group")
  expect(nextClassKindFilter("group")).toBe("nonGroup")
  expect(nextClassKindFilter("nonGroup")).toBe("all")
 })

 it("標籤隨模式變更", () => {
  expect(enrollmentFilterLabel("all")).toBe("學生報讀")
  expect(enrollmentFilterLabel("hasEnroll")).toBe("有學生報讀")
  expect(enrollmentFilterLabel("noEnroll")).toBe("未有學生報讀")
  expect(classKindFilterLabel("all")).toBe("班別類型")
  expect(classKindFilterLabel("group")).toBe("專科班")
  expect(classKindFilterLabel("nonGroup")).toBe("非專科班")
 })
})
