import { describe, expect, it } from "vitest"

import {
  TRIAL_TEACHER_COMMENT_LIVE_DATE,
  clampTrialTeacherComment,
  commentCharCount,
  commentCountLabel,
  commentCountTone,
  hasNonBlankTrialComment,
  isTeacherCommentNudgeInScope,
  isWrittenTrialComment,
  newPendingTrialCommentIds,
  trialCommentWhatsappDraft,
} from "./trialTeacherComment"

describe("commentCharCount", () => {
  it("中文一字計一字", () => {
    expect(commentCharCount("代數基礎弱")).toBe(5)
  })

  it("空白也計入畫面字數", () => {
    expect(commentCharCount("  ")).toBe(2)
  })

  it("30／80 邊界", () => {
    expect(commentCharCount("一".repeat(30))).toBe(30)
    expect(commentCharCount("一".repeat(80))).toBe(80)
    expect(commentCharCount("一".repeat(81))).toBe(81)
  })
})

describe("hasNonBlankTrialComment / isWrittenTrialComment", () => {
  it("空白不算已寫", () => {
    expect(hasNonBlankTrialComment("")).toBe(false)
    expect(hasNonBlankTrialComment("   ")).toBe(false)
    expect(isWrittenTrialComment(null)).toBe(false)
    expect(isWrittenTrialComment("")).toBe(false)
  })

  it("「。」算有內容，但未寫入時間仍不算已寫", () => {
    expect(hasNonBlankTrialComment("。")).toBe(true)
    expect(commentCharCount("。")).toBe(1)
    expect(isWrittenTrialComment("2026-10-24T02:00:00.000Z")).toBe(true)
  })
})

describe("commentCountTone", () => {
  it("1–30 中性，31–80 警示色", () => {
    expect(commentCountTone(0)).toBe("muted")
    expect(commentCountTone(30)).toBe("muted")
    expect(commentCountTone(31)).toBe("warning")
    expect(commentCountTone(80)).toBe("warning")
  })

  it("計數文案", () => {
    expect(commentCountLabel(12)).toBe("12／約 30 · 上限 80")
  })
})

describe("clampTrialTeacherComment", () => {
  it("81 字截到 80", () => {
    const raw = "一".repeat(81)
    expect(commentCharCount(clampTrialTeacherComment(raw))).toBe(80)
  })
})

describe("isTeacherCommentNudgeInScope", () => {
  it("上線日當日及以前不催老師，仍可代貼", () => {
    expect(isTeacherCommentNudgeInScope(TRIAL_TEACHER_COMMENT_LIVE_DATE)).toBe(false)
    expect(isTeacherCommentNudgeInScope("2026-10-22")).toBe(false)
    expect(isTeacherCommentNudgeInScope("2026-10-10")).toBe(false)
  })

  it("上線日之後才催老師", () => {
    expect(isTeacherCommentNudgeInScope("2026-10-24")).toBe(true)
  })
})

describe("trialCommentWhatsappDraft", () => {
  it("填入學生、年級、日期與班別", () => {
    expect(
      trialCommentWhatsappDraft({
        studentName: "陳大文",
        gradeLabel: "中五",
        trialDate: "2026-11-14",
        subject: "中五生物（2627-BIOS5001-B）",
      })
    ).toBe(
      "陳大文（中五） 2026-11-14 中五生物（2627-BIOS5001-B）試堂已出席，請撰寫約 30 字評語，說明學習情況，以及補習如何幫到這位學生。謝謝。"
    )
  })

  it("缺姓名與年級時仍成句", () => {
    expect(
      trialCommentWhatsappDraft({
        studentName: "  ",
        gradeLabel: "—",
        trialDate: "2026-11-14",
        subject: "—",
      })
    ).toBe("學生 2026-11-14試堂已出席，請撰寫約 30 字評語，說明學習情況，以及補習如何幫到這位學生。謝謝。")
  })
})

describe("newPendingTrialCommentIds", () => {
  it("只回傳這次新產生的待寫 id", () => {
    expect(newPendingTrialCommentIds(["a"], ["a", "b"])).toEqual(["b"])
    expect(newPendingTrialCommentIds(["a"], ["a"])).toEqual([])
    expect(newPendingTrialCommentIds([], ["x", "y"])).toEqual(["x", "y"])
  })
})
