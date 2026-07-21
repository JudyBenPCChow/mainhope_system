import { describe, expect, it } from "vitest"

import { buildPromotionMatchWhatsAppMessage } from "./promotionMatchWhatsApp"

describe("buildPromotionMatchWhatsAppMessage", () => {
  it("builds the summer phase-2 template for one class", () => {
    const message = buildPromotionMatchWhatsAppMessage({
      studentName: "關智博",
      gradeLabel: "中五",
      classes: [
        {
          label: "暑期升中五級中文班（26SM-CHIS5008-A）",
          subject: "中國語文",
          schedule: "星期一、星期四 11:30-12:45",
          teacherName: "Christine Fan",
        },
      ],
    })

    expect(message).toContain("關智博家長 ︰")
    expect(message).toContain("暑期課程第二期將於8月開始")
    expect(message).toContain("我們根據 關智博 目前的年級（中五），為您推介以下合適班別：")
    expect(message).toContain("1. 暑期升中五級中文班（26SM-CHIS5008-A）")
    expect(message).toContain("科目：中國語文")
    expect(message).toContain("凡經此訊息報名，更可享每科學費減 $100 優惠 🎉")
    expect(message).toContain("明學教育示")
  })

  it("numbers multiple classes and omits unavailable details", () => {
    const message = buildPromotionMatchWhatsAppMessage({
      studentName: "陳同學",
      classes: [
        { label: "中文班", subject: "中文", schedule: null, teacherName: null },
        { label: "英文班", subject: "英文", schedule: "星期三 17:45-19:00" },
      ],
    })

    expect(message).toContain("陳同學家長 ︰")
    expect(message).toContain("1. 中文班")
    expect(message).toContain("2. 英文班")
    expect(message).not.toContain("導師：")
    expect(message.match(/時間：/g)).toHaveLength(1)
  })

  it("shows a selection prompt when no class is selected", () => {
    const message = buildPromotionMatchWhatsAppMessage({
      studentName: "李同學",
      gradeLabel: "中三",
      classes: [],
    })

    expect(message).toContain("李同學家長 ︰")
    expect(message).toContain("我們根據 李同學 目前的年級（中三），為您推介以下合適班別：")
    expect(message).toContain("［請先從上方選擇推薦班別］")
    expect(message).not.toContain("1. ")
  })
})
