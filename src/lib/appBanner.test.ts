import { describe, expect, it } from "vitest"

import { bannerPersists } from "./appBanner"

const action = { pageLabel: "收款登記", to: "/Payments" }

describe("bannerPersists", () => {
  it("成功且沒有下一步時會自動關閉", () => {
    expect(bannerPersists({ tone: "success", title: "已儲存" })).toBe(false)
  })

  it("有下一步、警示或錯誤時留到關閉", () => {
    expect(bannerPersists({ tone: "success", title: "已增加報讀", actions: [action] })).toBe(true)
    expect(bannerPersists({ tone: "success", title: "已增加報讀", action })).toBe(true)
    expect(bannerPersists({ tone: "warning", title: "請選擇堂數" })).toBe(true)
    expect(bannerPersists({ tone: "error", title: "儲存失敗" })).toBe(true)
  })

  it("空的按鈕清單不算有下一步", () => {
    expect(bannerPersists({ tone: "info", title: "已複製", actions: [] })).toBe(false)
  })
})
