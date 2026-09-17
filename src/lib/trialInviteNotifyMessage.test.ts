import { describe, expect, it } from "vitest"

import { buildTrialInviteNotifyMessage } from "./trialInviteNotifyMessage"

describe("buildTrialInviteNotifyMessage", () => {
  it("uses given-name greeting and campaign copy", () => {
    const url = "https://example.com/TrialInvite/abc"
    const message = buildTrialInviteNotifyMessage({
      fullName: "陳大文",
      url,
      trialType: "免費試堂",
    })
    expect(message).toBe(
      [
        "大文／大文家長你好！",
        "",
        "明學教育正舉辦「免費試堂」！",
        "只要click入以下專屬連結，便可以馬上登記各科試堂",
        "仲可以即時見到可預約的日期時間！",
        "完成試堂內三天內登記報讀，仲可享額外HKD100元即時學費減免優惠",
        "",
        url,
        "",
        "如有任何疑問，可回覆此訊息與職員聯絡",
        "",
        "明學教育",
      ].join("\n"),
    )
    expect(message).not.toContain("功課班")
    expect(message).not.toMatch(/\p{Extended_Pictographic}/u)
  })

  it("uses the selected trial type in the headline", () => {
    const message = buildTrialInviteNotifyMessage({
      fullName: "陳大文",
      url: "https://example.com/TrialInvite/abc",
      trialType: "半價試堂",
    })
    expect(message).toContain("明學教育正舉辦「半價試堂」！")
    expect(message).not.toContain("免費試堂")
  })
})
