import { describe, expect, it } from "vitest"

import {
  buildMonthDutyDays,
  findDutyDay,
  formatHomeworkDayPlanLabel,
  getAvailEntry,
  listRosterMonthDays,
  mapHomeworkEnrollStatus,
  summarizeOverview,
  type HomeworkDutyDay,
} from "@/lib/homeworkTutoringUi"

function duty(partial: Partial<HomeworkDutyDay> & Pick<HomeworkDutyDay, "date">): HomeworkDutyDay {
  return {
    weekday: "三",
    start: "15:30",
    end: "19:30",
    secondaryRoom: "17D",
    primaryRoom: null,
    assignments: [{ teacherId: "a", start: "15:30", end: "19:30", room: "17D" }],
    ...partial,
  }
}

describe("buildMonthDutyDays", () => {
  it("merges existing ISO dates onto M/D calendar keys", () => {
    const days = buildMonthDutyDays("2026-09", [
      {
        date: "2026-09-21",
        weekday: "一",
        start: "15:30",
        end: "19:30",
        secondaryRoom: "17D",
        primaryRoom: null,
        secondaryTeacherId: "katie",
        assignments: [
          { teacherId: "katie", start: "15:30", end: "19:30", room: "17D" },
        ],
      },
    ])
    const day21 = days.find((d) => d.date === "9/21")
    expect(day21?.secondaryTeacherId).toBe("katie")
    expect(day21?.assignments).toEqual([
      { teacherId: "katie", start: "15:30", end: "19:30", room: "17D" },
    ])
  })
})

describe("findDutyDay / getAvailEntry", () => {
  it("matches ISO and padded keys to M/D", () => {
    const days = [duty({ date: "2026-09-02", weekday: "三" })]
    expect(findDutyDay(days, "9/2")?.start).toBe("15:30")
    expect(findDutyDay(days, "09/02")?.weekday).toBe("三")
  })

  it("looks up availability regardless of date key format", () => {
    const avail = {
      t1: { "09/02": { kind: "full" as const } },
      t2: { "2026-09-02": { kind: "custom" as const, start: "16:00", end: "19:30" } },
    }
    expect(getAvailEntry(avail, "t1", "9/2")?.kind).toBe("full")
    expect(getAvailEntry(avail, "t2", "9/2")).toEqual({
      kind: "custom",
      start: "16:00",
      end: "19:30",
    })
  })
})

describe("listRosterMonthDays", () => {
  it("matches ISO holiday dates onto M/D keys", () => {
    const days = listRosterMonthDays("2026-09", [{ date: "2026-09-02", label: "放假" }])
    const day2 = days.find((d) => d.key === "9/2")
    expect(day2?.holidayLabel).toBe("放假")
    expect(day2?.selectable).toBe(false)
  })
})

describe("summarizeOverview", () => {
  it("finds today's duty even when stored as ISO", () => {
    const now = new Date(2026, 8, 2)
    const overview = summarizeOverview(
      [],
      [],
      [duty({ date: "2026-09-02", weekday: "三" })],
      now
    )
    expect(overview.todayDuty?.date).toBe("2026-09-02")
    expect(overview.todayWeekday).toBe("三")
  })

  it("does not treat another month's 9/2 as today", () => {
    const now = new Date(2026, 8, 2)
    const overview = summarizeOverview(
      [],
      [],
      [duty({ date: "10/2", weekday: "五" })],
      now
    )
    expect(overview.todayDuty).toBeNull()
  })
})

describe("mapHomeworkEnrollStatus / formatHomeworkDayPlanLabel", () => {
  it("maps 休學 to 暫停 and 就讀中 to 在籍", () => {
    expect(mapHomeworkEnrollStatus("就讀中")).toBe("在籍")
    expect(mapHomeworkEnrollStatus("休學")).toBe("暫停")
    expect(mapHomeworkEnrollStatus("已退讀")).toBe("結束")
    expect(mapHomeworkEnrollStatus("退選")).toBe("結束")
  })

  it("labels a missing day plan as 未設定", () => {
    expect(formatHomeworkDayPlanLabel(null)).toBe("未設定")
    expect(formatHomeworkDayPlanLabel("四日")).toBe("每週四日")
  })
})
