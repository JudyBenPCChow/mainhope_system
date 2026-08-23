import { describe, expect, it } from "vitest"

import { statusToTagTone } from "@/lib/statusTag"

describe("功課輔導班狀態字典", () => {
  it("報更／編更／入口走固定 tone", () => {
    expect(statusToTagTone("已提交")).toBe("success")
    expect(statusToTagTone("草稿")).toBe("warning")
    expect(statusToTagTone("未交")).toBe("default")
    expect(statusToTagTone("已編更")).toBe("success")
    expect(statusToTagTone("未編更")).toBe("warning")
    expect(statusToTagTone("已發布")).toBe("success")
    expect(statusToTagTone("已鎖定")).toBe("info")
    expect(statusToTagTone("側欄有功課輔導")).toBe("success")
    expect(statusToTagTone("無入口")).toBe("default")
    expect(statusToTagTone("功輔放假")).toBe("default")
  })

  it("報讀與月費用字典而非頁內硬編碼", () => {
    expect(statusToTagTone("在籍")).toBe("success")
    expect(statusToTagTone("暫停")).toBe("warning")
    expect(statusToTagTone("結束")).toBe("default")
    expect(statusToTagTone("未收款")).toBe("warning")
    expect(statusToTagTone("已收款")).toBe("success")
  })
})
