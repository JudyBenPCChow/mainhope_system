import { describe, expect, it } from "vitest"

import {
  catalogMatchesHeaderFilters,
  compareCatalogRows,
  EMPTY_CATALOG_HEADER_FILTERS,
  publicAutoHideReason,
  rowsMatchingCatalogHeaderFiltersExcept,
  studentCountBucket,
  uniqueCatalogHeaderFilterOptions,
  type CatalogListHeaderFilters,
  type CatalogRow,
} from "@/components/trialInvite/trialInviteCatalogColumns"
import type {
  TrialInviteCatalogClassControl,
  TrialInviteCatalogTeacherControl,
} from "@/services/trialInviteQueries"

function teacher(
  partial: Partial<TrialInviteCatalogTeacherControl> & Pick<TrialInviteCatalogTeacherControl, "name">
): TrialInviteCatalogTeacherControl {
  return {
    id: partial.id ?? "t1",
    participating: true,
    classes: [],
    ...partial,
  }
}

function cls(
  partial: Partial<TrialInviteCatalogClassControl> & Pick<TrialInviteCatalogClassControl, "id" | "label">
): TrialInviteCatalogClassControl {
  return {
    classKind: "group",
    subject: "中文",
    grades: ["中四"],
    courseCodeFull: "2627-CHIS4001-A",
    listed: true,
    teacherId: "t1",
    dayOfWeek: "星期二",
    timeSlot: "16:30-17:45",
    enrolledStudents: [],
    schedules: [],
    ...partial,
  }
}

function row(
  t: TrialInviteCatalogTeacherControl,
  c: TrialInviteCatalogClassControl
): CatalogRow {
  return { teacher: t, cls: c }
}

describe("studentCountBucket", () => {
  it("把人數分成公開頁可出現與自動隱藏", () => {
    expect(studentCountBucket(0)).toBe("0")
    expect(studentCountBucket(5)).toBe("1-5")
    expect(studentCountBucket(6)).toBe("6+")
  })
})

describe("publicAutoHideReason", () => {
  it("職員剔走不算公開頁自動隱藏", () => {
    expect(publicAutoHideReason(cls({ id: "1", label: "甲", listed: false }))).toBeNull()
  })

  it("就讀中超過 5 人標滿班", () => {
    expect(
      publicAutoHideReason(
        cls({
          id: "1",
          label: "甲",
          enrolledStudents: Array.from({ length: 6 }, (_, i) => ({
            id: String(i),
            fullName: `生${i}`,
            studentCode: "",
          })),
        })
      )
    ).toBe("full")
  })

  it("沒有未剔除且未佔用的未來堂則標無可選堂", () => {
    expect(
      publicAutoHideReason(
        cls({
          id: "1",
          label: "甲",
          schedules: [
            {
              id: "s1",
              scheduledDate: "2026-09-22",
              startTime: "16:30",
              endTime: "17:45",
              sessionNumber: null,
              excluded: true,
              trialCount: 0,
            },
            {
              id: "s2",
              scheduledDate: "2026-09-29",
              startTime: "16:30",
              endTime: "17:45",
              sessionNumber: null,
              excluded: false,
              trialCount: 1,
            },
          ],
        })
      )
    ).toBe("no_open_schedule")
  })
})

describe("catalogMatchesHeaderFilters", () => {
  const chan = teacher({ id: "t-chan", name: "陳老師" })
  const rows = [
    row(
      chan,
      cls({
        id: "c1",
        label: "中四級常規中文班（2627-CHIS4001-A）",
        subject: "中文",
        grades: ["中四"],
        enrolledStudents: [{ id: "s1", fullName: "陳大文", studentCode: "1" }],
      })
    ),
    row(
      teacher({ id: "t-lee", name: "李老師" }),
      cls({
        id: "c2",
        label: "中五級常規數學班（2627-MATHS5001-A）",
        subject: "數學",
        grades: ["中五"],
        classKind: "homework",
        enrolledStudents: Array.from({ length: 6 }, (_, i) => ({
          id: String(i),
          fullName: `生${i}`,
          studentCode: "",
        })),
      })
    ),
  ]

  it("依老師、年級、科目、人數區間篩選", () => {
    const filters: CatalogListHeaderFilters = {
      ...EMPTY_CATALOG_HEADER_FILTERS,
      teacher: "t-chan",
      grade: "中四",
      subject: "中文",
      count: "1-5",
    }
    expect(rows.filter((r) => catalogMatchesHeaderFilters(r, filters)).map((r) => r.cls.id)).toEqual([
      "c1",
    ])
  })
})

describe("rowsMatchingCatalogHeaderFiltersExcept", () => {
  it("忽略指定欄的篩選，仍套用其他表頭條件", () => {
    const chan = teacher({ id: "t-chan", name: "陳老師" })
    const rows = [
      row(chan, cls({ id: "c1", label: "中文 A", subject: "中文", grades: ["中四"] })),
      row(chan, cls({ id: "c2", label: "數學 A", subject: "數學", grades: ["中四"] })),
      row(
        teacher({ id: "t-lee", name: "李老師" }),
        cls({ id: "c3", label: "中文 B", subject: "中文", grades: ["中五"] })
      ),
    ]
    const filters: CatalogListHeaderFilters = {
      ...EMPTY_CATALOG_HEADER_FILTERS,
      teacher: "t-chan",
      subject: "中文",
    }
    expect(
      rowsMatchingCatalogHeaderFiltersExcept(rows, filters, "subject").map((r) => r.cls.id)
    ).toEqual(["c1", "c2"])
  })
})

describe("uniqueCatalogHeaderFilterOptions", () => {
  it("老師以 id 去重並用人名排序", () => {
    const rows = [
      row(teacher({ id: "t2", name: "李老師" }), cls({ id: "c1", label: "甲" })),
      row(teacher({ id: "t1", name: "陳老師" }), cls({ id: "c2", label: "乙" })),
      row(teacher({ id: "t1", name: "陳老師" }), cls({ id: "c3", label: "丙" })),
    ]
    expect(uniqueCatalogHeaderFilterOptions("teacher", rows)).toEqual([
      { value: "t2", label: "李老師" },
      { value: "t1", label: "陳老師" },
    ])
  })
})

describe("compareCatalogRows", () => {
  it("人數升序把較少人排前", () => {
    const t = teacher({ name: "陳老師" })
    const a = row(
      t,
      cls({
        id: "a",
        label: "甲",
        enrolledStudents: [
          { id: "1", fullName: "一", studentCode: "" },
          { id: "2", fullName: "二", studentCode: "" },
        ],
      })
    )
    const b = row(
      t,
      cls({
        id: "b",
        label: "乙",
        enrolledStudents: [{ id: "3", fullName: "三", studentCode: "" }],
      })
    )
    expect(compareCatalogRows(a, b, "count", "asc")).toBeGreaterThan(0)
  })
})
