import { describe, expect, it } from "vitest"

import {
  buildPromotionMatchWhatsAppMessage,
  givenNameForCopy,
} from "./promotionMatchWhatsApp"

const sampleClass = {
  label: "中五級英國語文班（2627-ENGS5009-A）",
  subject: "英國語文",
  schedule: "星期日 10:15-11:30",
  teacherName: "Emma Cai",
}

describe("givenNameForCopy", () => {
  it("strips a single-character Chinese surname", () => {
    expect(givenNameForCopy("關智博")).toBe("智博")
    expect(givenNameForCopy("陳大文")).toBe("大文")
    expect(givenNameForCopy("李明")).toBe("明")
  })

  it("strips common compound Chinese surnames", () => {
    expect(givenNameForCopy("歐陽娜娜")).toBe("娜娜")
    expect(givenNameForCopy("司徒嘉欣")).toBe("嘉欣")
  })

  it("takes the English given name and drops the surname", () => {
    expect(givenNameForCopy("Emma Cai")).toBe("Emma")
    expect(givenNameForCopy("CHAN Tai Man")).toBe("Tai Man")
    expect(givenNameForCopy("Alex")).toBe("Alex")
    expect(givenNameForCopy("Mr. Ng")).toBe("Mr. Ng")
  })
})

describe("buildPromotionMatchWhatsAppMessage", () => {
  it("builds the summer-student template with given names only", () => {
    const message = buildPromotionMatchWhatsAppMessage({
      studentName: "關智博",
      gradeLabel: "中五",
      studiedSummer: true,
      classes: [sampleClass],
    })

    expect(message).toContain("智博家長 ︰")
    expect(message).toContain("感謝 智博 於今個暑期選擇在明學學習")
    expect(message).toContain("將於九月開課")
    expect(message).toContain(
      "我們根據 智博暑期修讀的科目及目前年級（中五），為您推介以下合適班別，方便銜接常規學年："
    )
    expect(message).toContain("1. 中五級英國語文班（2627-ENGS5009-A）")
    expect(message).toContain("導師：Emma")
    expect(message).toContain("隨本訊息附上 2026–27 常規學年小冊子，歡迎參閱。")
    expect(message).toContain("如有興趣延續學習")
    expect(message).toContain("明學教育示")
    expect(message).not.toContain("關智博")
    expect(message).not.toContain("Emma Cai")
    expect(message).not.toContain("暑期第二期")
    expect(message).not.toContain("$200")
  })

  it("builds the non-summer template without mentioning 暑期", () => {
    const message = buildPromotionMatchWhatsAppMessage({
      studentName: "陳大文",
      gradeLabel: "中三",
      studiedSummer: false,
      classes: [{ label: "中文班", subject: "中文", schedule: null, teacherName: null }],
    })

    expect(message).toContain("大文家長 ︰")
    expect(message).toContain("明學教育 2026–27 常規學年專科班現已接受報讀，將於九月開課。")
    expect(message).toContain("我們根據 大文目前的年級（中三），為您推介以下合適班別：")
    expect(message).toContain("隨本訊息附上 2026–27 常規學年小冊子，歡迎參閱。")
    expect(message).toContain("如有興趣，歡迎回覆想了解的班別")
    expect(message).not.toContain("陳大文")
    expect(message).not.toContain("今個暑期")
    expect(message.replace("常規學年小冊子", "")).not.toContain("暑期")
  })

  it("numbers multiple classes and omits unavailable details", () => {
    const message = buildPromotionMatchWhatsAppMessage({
      studentName: "陳大文",
      studiedSummer: false,
      classes: [
        { label: "中文班", subject: "中文", schedule: null, teacherName: null },
        { label: "英文班", subject: "英文", schedule: "星期三 17:45-19:00" },
      ],
    })

    expect(message).toContain("大文家長 ︰")
    expect(message).toContain("1. 中文班")
    expect(message).toContain("2. 英文班")
    expect(message).not.toContain("導師：")
    expect(message.match(/時間：/g)).toHaveLength(1)
  })

  it("shows a selection prompt when no class is selected", () => {
    const message = buildPromotionMatchWhatsAppMessage({
      studentName: "李大文",
      gradeLabel: "中三",
      studiedSummer: false,
      classes: [],
    })

    expect(message).toContain("大文家長 ︰")
    expect(message).toContain("我們根據 大文目前的年級（中三），為您推介以下合適班別：")
    expect(message).toContain("［請先從上方選擇推薦班別］")
    expect(message).not.toContain("1. ")
    expect(message).not.toContain("李大文")
  })
})
