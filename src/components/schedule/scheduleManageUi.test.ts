import { describe, expect, it } from "vitest"

import { kpiNumberDisplay } from "@/components/schedule/scheduleManageUi"

describe("kpiNumberDisplay", () => {
 it("載入或失敗顯示未知，成功空結果可為 0", () => {
  expect(kpiNumberDisplay("loading", 4)).toBe("—")
  expect(kpiNumberDisplay("error", 4)).toBe("—")
  expect(kpiNumberDisplay("ready", null)).toBe("—")
  expect(kpiNumberDisplay("ready", 0)).toBe("0")
  expect(kpiNumberDisplay("ready", 7)).toBe("7")
 })
})
