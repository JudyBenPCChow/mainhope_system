import { describe, expect, it } from "vitest"

import {
  AD_PUBLIC_CAMPUS_ADDRESS,
  AD_PUBLIC_COLLECTION_NOTICE,
  AD_PUBLIC_ENQUIRY_PHONE,
} from "./adPublicCollectionNotice"

describe("ad public collection notice", () => {
  it("uses the published campus address and enquiry phone", () => {
    expect(AD_PUBLIC_CAMPUS_ADDRESS).toContain("綠悠軒商場")
    expect(AD_PUBLIC_CAMPUS_ADDRESS).toContain("馬適路")
    expect(AD_PUBLIC_ENQUIRY_PHONE).toBe("3705-5140")
  })

  it("covers purpose, required fields, recipients, and access", () => {
    const text = AD_PUBLIC_COLLECTION_NOTICE.join("\n")
    expect(text).toContain("查詢或試堂登記")
    expect(text).toContain("必須填寫")
    expect(text).toContain("不會把資料售予他人")
    expect(text).toContain("查閱及改正")
    expect(text).toContain("40 日")
    expect(text).toContain(AD_PUBLIC_CAMPUS_ADDRESS)
    expect(text).not.toContain("本校")
    expect(text).not.toContain("直銷")
  })
})
