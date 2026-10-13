import { describe, expect, it } from "vitest"

import {
  formatCatalogueTimeSlot,
  formatGradeSubjectCatalogue,
  parseGradeSubjectCatalogue,
  type CatalogueClassRow,
  type GradeSubjectRequest,
} from "../../supabase/functions/_shared/apoGradeSubjectCatalogue.ts"

function requestOf(text: string): GradeSubjectRequest[] {
  const parsed = parseGradeSubjectCatalogue(text)
  expect(parsed).not.toBeNull()
  return parsed as GradeSubjectRequest[]
}

describe("parseGradeSubjectCatalogue", () => {
  it("reads one grade and subject", () => {
    expect(requestOf("中四級中文")).toMatchObject([
      { gradeLabel: "中四", gradeCode: "S4", subjectCode: "CHI", subjectShort: "中文", sections: [] },
    ])
  })

  it("reads more than one grade and more than one class", () => {
    expect(requestOf("中四級中文、中三級中文")).toMatchObject([
      { gradeLabel: "中四", subjectShort: "中文" },
      { gradeLabel: "中三", subjectShort: "中文" },
    ])
    expect(requestOf("中三、中四中文")).toMatchObject([
      { gradeLabel: "中三", subjectCode: "CHI" },
      { gradeLabel: "中四", subjectCode: "CHI" },
    ])
    expect(requestOf("中四級中文A班、B班")[0]?.sections).toEqual(["A", "B"])
  })

  it("keeps maths separate from M2", () => {
    expect(requestOf("中四級數學")[0]?.subjectCode).toBe("MATH")
    expect(requestOf("中四級M2")[0]?.subjectCode).toBe("M2")
    expect(requestOf("中四級中史")[0]?.subjectCode).toBe("CHIS")
    expect(requestOf("中四級歷史")[0]?.subjectCode).toBe("HIST")
  })

  it("ignores roll-call and how-to questions", () => {
    expect(parseGradeSubjectCatalogue("中四級中文點名名單")).toBeNull()
    expect(parseGradeSubjectCatalogue("如何新增中四中文班")).toBeNull()
    expect(parseGradeSubjectCatalogue("中文")).toBeNull()
  })
})

describe("formatGradeSubjectCatalogue", () => {
  const requests = requestOf("中四級中文\n中三級中文")

  const classes: CatalogueClassRow[] = [
    {
      filter_index: 1,
      course_code_full: "2627-CHIS4001-B",
      section_code: "B",
      day_of_week: "星期三",
      time_slot: "16:30–17:45",
      teacher_name: "Christine Fan",
      enrolled_count: 2,
    },
    {
      filter_index: 1,
      course_code_full: "2627-CHIS4001-A",
      section_code: "A",
      day_of_week: "星期二",
      time_slot: "16:30–17:45",
      teacher_name: "Christine Fan",
      enrolled_count: 2,
    },
    {
      filter_index: 1,
      course_code_full: "2627-CHIS4001-C",
      section_code: "C",
      day_of_week: "星期三",
      time_slot: "16:30–17:45",
      teacher_name: "Christine Fan",
      enrolled_count: 2,
    },
    {
      filter_index: 2,
      course_code_full: "2627-CHIS3001-A",
      section_code: "A",
      day_of_week: "星期二",
      time_slot: "16:30–17:45",
      teacher_name: "Christine Fan",
      enrolled_count: 2,
    },
  ]

  it("prints the catalogue in grade order, then section order", () => {
    expect(formatGradeSubjectCatalogue(requests, classes)).toBe(
      [
        "中四級中文",
        "2627-CHIS4001",
        "A班 逢星期二 下午4:30-5:45 Christine Fan（2人）",
        "B班 逢星期三 下午4:30-5:45 Christine Fan（2人）",
        "C班 逢星期三 下午4:30-5:45 Christine Fan（2人）",
        "",
        "中三級中文",
        "2627-CHIS3001",
        "A班 逢星期二 下午4:30-5:45 Christine Fan（2人）",
      ].join("\n")
    )
  })

  it("formats morning and afternoon slots", () => {
    expect(formatCatalogueTimeSlot("10:15–11:30")).toBe("上午10:15-11:30")
    expect(formatCatalogueTimeSlot("12:45–14:00")).toBe("下午12:45-2:00")
  })

  it("says when the grade and subject have no current class", () => {
    expect(formatGradeSubjectCatalogue(requestOf("中六級化學"), [])).toBe(
      "中六級化學\n目前沒有進行中的班別。"
    )
  })
})
