import { describe, expect, it } from "vitest"

import { formatClassLabel, formatClassPickLabel } from "./courseLabel"

describe("formatClassPickLabel", () => {
  it("同名班附逢星期與時段，並保留課程代碼", () => {
    const saturday = formatClassPickLabel({
      subject: "英國語文",
      courseName: "高中常規英文班（中四至中六）",
      courseCode: "2627-ENGS4004-B",
      dayOfWeek: "星期六",
      timeSlot: "12:45–14:00",
    })
    const wednesday = formatClassPickLabel({
      subject: "英國語文",
      courseName: "高中常規英文班（中四至中六）",
      courseCode: "2627-ENGS5004-B",
      dayOfWeek: "星期三",
      timeSlot: "17:45–19:00",
    })
    expect(saturday).toBe(
      "高中常規英文班（中四至中六）（2627-ENGS4004-B） · 逢星期六 12:45–14:00"
    )
    expect(wednesday).toBe(
      "高中常規英文班（中四至中六）（2627-ENGS5004-B） · 逢星期三 17:45–19:00"
    )
    expect(saturday).not.toBe(wednesday)
  })

  it("沒有逢星期與時段時與 formatClassLabel 相同", () => {
    const params = {
      subject: "英國語文",
      courseName: "高中常規英文班（中四至中六）",
      courseCode: "2627-ENGS4004-B",
    }
    expect(formatClassPickLabel(params)).toBe(formatClassLabel(params))
    expect(formatClassLabel(params)).toBe("高中常規英文班（中四至中六）（2627-ENGS4004-B）")
  })
})
