import { describe, expect, it } from "vitest"

import { SPECIALIST_LAST_LESSON_YMD_2627 } from "@/lib/adminOpsAssistant/config"
import { batchScheduleEndYmd } from "@/lib/adminOpsAssistant/rules"
import { listCandidateDatesForClass } from "@/services/batchScheduleHelpers"
import type { AcademicYearRange } from "@/services/teacherAvailabilityQueries"

const ALL_WEEKDAYS = "星期一,星期二,星期三,星期四,星期五,星期六,星期日"

const year2627: AcademicYearRange = {
  id: "ay-2627",
  label: "2627",
  start_date: "2026-09-01",
  end_date: "2027-06-30",
  is_current: true,
}

describe("listCandidateDatesForClass 2627 結束日", () => {
  it("專科班候選日停在專科最後上課日，不含 6 月 29、30 日", () => {
    const dates = listCandidateDatesForClass(
      {
        class_kind: "group",
        academic_year_label: "2627",
        day_of_week: ALL_WEEKDAYS,
        start_date: "2027-06-21",
        end_date: "2027-06-30",
      },
      year2627
    )
    expect(dates.at(-1)).toBe(SPECIALIST_LAST_LESSON_YMD_2627)
    expect(dates).toContain("2027-06-28")
    expect(dates.some((d) => d > SPECIALIST_LAST_LESSON_YMD_2627)).toBe(false)
  })

  it("功課輔導班仍排到學年結束日", () => {
    const dates = listCandidateDatesForClass(
      {
        class_kind: "homework",
        academic_year_label: "2627",
        day_of_week: ALL_WEEKDAYS,
        start_date: "2027-06-21",
        end_date: "2027-06-30",
      },
      year2627
    )
    expect(dates).toContain("2027-06-28")
    expect(dates).toContain("2027-06-29")
    expect(dates).toContain("2027-06-30")
    expect(dates.at(-1)).toBe("2027-06-30")
  })

  it("私人課程不套專科上限", () => {
    const dates = listCandidateDatesForClass(
      {
        class_kind: "private",
        academic_year_label: "2627",
        day_of_week: ALL_WEEKDAYS,
        start_date: "2027-06-21",
        end_date: "2027-06-30",
      },
      year2627
    )
    expect(dates.at(-1)).toBe("2027-06-30")
  })

  it("專科班結束日早於最後上課日時，不把候選日拉長", () => {
    const dates = listCandidateDatesForClass(
      {
        class_kind: "group",
        academic_year_label: "2627",
        day_of_week: ALL_WEEKDAYS,
        start_date: "2027-06-01",
        end_date: "2027-06-20",
      },
      year2627
    )
    expect(dates.at(-1)).toBe("2027-06-20")
  })

  it("專科班未填結束日時，不以學年 6 月 30 日為準", () => {
    const dates = listCandidateDatesForClass(
      {
        class_kind: "group",
        academic_year_label: null,
        day_of_week: ALL_WEEKDAYS,
        start_date: "2027-06-21",
        end_date: null,
      },
      year2627
    )
    expect(dates.at(-1)).toBe(SPECIALIST_LAST_LESSON_YMD_2627)
    expect(dates).not.toContain("2027-06-30")
  })
})

describe("batchScheduleEndYmd", () => {
  it("新增專科班預設結束日用最後上課日，功課輔導班維持學年結束日", () => {
    expect(
      batchScheduleEndYmd({
        classKind: "group",
        academicYearLabel: "2627",
        yearEndYmd: "2027-06-30",
      })
    ).toBe(SPECIALIST_LAST_LESSON_YMD_2627)
    expect(
      batchScheduleEndYmd({
        classKind: "homework",
        academicYearLabel: "2627",
        yearEndYmd: "2027-06-30",
      })
    ).toBe("2027-06-30")
  })
})
