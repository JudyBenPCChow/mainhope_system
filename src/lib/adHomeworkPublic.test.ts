import { describe, expect, it } from "vitest"

import type { TrialInviteClassOption } from "@/services/trialInviteQueries"

import { homeworkDateChoices } from "./adHomeworkPublic"

function cls(opts: {
  id: string
  kind?: string
  schedules: { id: string; date: string; start?: string }[]
}): TrialInviteClassOption {
  return {
    id: opts.id,
    class_kind: opts.kind ?? "homework",
    subject: "功課輔導",
    subject_code: "",
    subject_category: "other",
    course_code_full: "2627-HW",
    course_name: "常規功課輔導班",
    teacher_name: "",
    day_of_week: "一至五",
    time_slot: "15:30-19:30",
    schedules: opts.schedules.map((s) => ({
      id: s.id,
      scheduled_date: s.date,
      start_time: s.start ?? "15:15",
      end_time: "19:30",
      session_number: null,
    })),
  }
}

describe("homeworkDateChoices", () => {
  it("只留功課輔導班，並按日期排序", () => {
    const rows = homeworkDateChoices([
      cls({
        id: "hw",
        schedules: [
          { id: "b", date: "2026-09-30" },
          { id: "a", date: "2026-09-28" },
        ],
      }),
      cls({
        id: "math",
        kind: "group",
        schedules: [{ id: "g", date: "2026-09-28" }],
      }),
    ])
    expect(rows.map((row) => row.scheduleId)).toEqual(["a", "b"])
    expect(rows[0]?.line).toContain("2026-09-28")
  })

  it("同一堂次只出現一次", () => {
    const rows = homeworkDateChoices([
      cls({ id: "hw", schedules: [{ id: "a", date: "2026-09-28" }] }),
      cls({ id: "hw-dup", schedules: [{ id: "a", date: "2026-09-29" }] }),
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0]?.date).toBe("2026-09-28")
  })
})
