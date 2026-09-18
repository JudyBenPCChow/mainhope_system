import { describe, expect, it } from "vitest"

import {
  addMonthsYmd,
  aggregateRecentTrialSubjects,
  formatRecentTrialSubjectsCaption,
  recentTrialSubjectCutoffYmd,
  type RecentTrialSessionInput,
} from "./trialInviteRecentSubjects"

function row(partial: Partial<RecentTrialSessionInput>): RecentTrialSessionInput {
  return {
    studentId: "s1",
    trialDate: "2026-09-12",
    status: "已預約",
    classKind: "group",
    subject: "中國語文",
    subjectId: "chi-id",
    subjectCode: "CHI",
    ...partial,
  }
}

describe("trialInviteRecentSubjects", () => {
  it("subtracts six calendar months and clamps end-of-month", () => {
    expect(addMonthsYmd("2026-09-19", -6)).toBe("2026-03-19")
    expect(addMonthsYmd("2026-08-31", -6)).toBe("2026-02-28")
    expect(recentTrialSubjectCutoffYmd("2026-09-19")).toBe("2026-03-19")
  })

  it("keeps uncancelled group subjects and drops cancelled / old / private", () => {
    const map = aggregateRecentTrialSubjects(
      [
        row({ status: "已完成", subject: "英國語文", subjectId: "eng-id", subjectCode: "ENG" }),
        row({ status: "取消", subject: "生物", subjectId: "bio-id", subjectCode: "BIO" }),
        row({
          trialDate: "2026-03-18",
          subject: "數學（必修部份）",
          subjectId: "math-id",
          subjectCode: "MATH",
        }),
        row({ classKind: "private", subject: "英國語文", subjectId: "eng-id" }),
      ],
      { cutoffYmd: "2026-03-19" }
    )
    expect(map.get("s1")).toEqual(["英國語文"])
  })

  it("dedupes same subject and splits 專科班／功課輔導班", () => {
    const map = aggregateRecentTrialSubjects(
      [
        row({ trialDate: "2026-07-22", subjectId: "chi-id" }),
        row({ trialDate: "2026-09-12", subjectId: "chi-id" }),
        row({
          classKind: "homework",
          subject: "中國語文",
          subjectId: "chi-id",
          subjectCode: "CHI",
        }),
      ],
      { cutoffYmd: "2026-03-19" }
    )
    expect(map.get("s1")).toEqual(["中國語文", "中國語文（功輔）"])
  })

  it("formats caption only when there are labels", () => {
    expect(formatRecentTrialSubjectsCaption([])).toBeNull()
    expect(formatRecentTrialSubjectsCaption(["中國語文", "生物"])).toBe(
      "曾試堂：中國語文、生物"
    )
  })
})
