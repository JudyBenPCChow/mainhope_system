import { describe, expect, it } from "vitest"

import { buildContactUpdateNotifyMessage } from "./contactUpdateNotifyMessage"

describe("buildContactUpdateNotifyMessage", () => {
  it("uses given name only and includes the public link", () => {
    const message = buildContactUpdateNotifyMessage({
      fullName: "陳大文",
      url: "https://example.test/u/abc",
    })
    expect(message).toBe(
      [
        "大文你好！",
        "為了方便我們進行上課通知及溝通，",
        "請開啟以下專屬連結，更新你最新的電話號碼及通訊偏好。",
        "如有任何填寫的問題，可以回覆此訊息",
        "",
        "https://example.test/u/abc",
        "",
        "*第一聯絡人＝ 如有任何通知，我們會優先發送至此電話。",
        "",
        "感謝你的配合！",
        "",
        "明學教育示",
      ].join("\n")
    )
    expect(message).not.toContain("陳大文")
  })
})
