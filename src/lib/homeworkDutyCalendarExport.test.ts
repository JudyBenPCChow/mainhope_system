import { describe, expect, it } from "vitest"

import {
  HOMEWORK_DUTY_CAMPUS_ADDRESS_EN,
  HOMEWORK_DUTY_CAMPUS_ADDRESS_ZH,
  buildHomeworkDutyCalendarIcs,
  homeworkDutyCalendarEvents,
} from "@/lib/homeworkDutyCalendarExport"
import type { HomeworkDutyDay } from "@/lib/homeworkTutoringUi"

function day(partial: Partial<HomeworkDutyDay> & Pick<HomeworkDutyDay, "date">): HomeworkDutyDay {
  return {
    weekday: "一",
    start: "15:30",
    end: "19:30",
    secondaryRoom: "17D",
    primaryRoom: null,
    assignments: [],
    ...partial,
  }
}

const DAYS: HomeworkDutyDay[] = [
  day({
    date: "9/1",
    assignments: [
      { teacherId: "a", start: "15:30", end: "17:00", room: "17D" },
      { teacherId: "a", start: "17:00", end: "19:30", room: "17E" },
      { teacherId: "b", start: "15:30", end: "19:30", room: "17D" },
    ],
  }),
  day({
    date: "9/2",
    holiday: "中秋",
    assignments: [{ teacherId: "a", start: "15:30", end: "19:30", room: "17D" }],
  }),
  day({
    date: "9/3",
    assignments: [{ teacherId: "b", start: "15:30", end: "19:30", room: "17D" }],
  }),
  day({
    date: "9/8",
    assignments: [{ teacherId: "a", start: "16:15", end: "19:30", room: "17D" }],
  }),
]

describe("homeworkDutyCalendarEvents", () => {
  it("keeps only the logged-in teacher and merges same-day slots", () => {
    const events = homeworkDutyCalendarEvents("a", "2026-09", DAYS)
    expect(events).toEqual([
      {
        isoDate: "2026-09-01",
        start: "15:30",
        end: "19:30",
        rooms: ["17D", "17E"],
        slotLines: ["17D 15:30–17:00", "17E 17:00–19:30"],
      },
      {
        isoDate: "2026-09-08",
        start: "16:15",
        end: "19:30",
        rooms: ["17D"],
        slotLines: ["17D 16:15–19:30"],
      },
    ])
  })

  it("drops dates that do not belong to the displayed month", () => {
    expect(homeworkDutyCalendarEvents("a", "2026-10", DAYS)).toEqual([])
  })
})

describe("buildHomeworkDutyCalendarIcs", () => {
  it("writes title, campus address, timezone, and a one-hour alarm", () => {
    const ics = buildHomeworkDutyCalendarIcs({
      teacherId: "a",
      yearMonth: "2026-09",
      days: DAYS,
      now: new Date("2026-08-31T15:00:00Z"),
    })
    const unfolded = ics.replace(/\r\n /g, "")

    expect(unfolded).toContain("SUMMARY:【明學】功課輔導班")
    expect(unfolded).toContain(
      `LOCATION:${HOMEWORK_DUTY_CAMPUS_ADDRESS_ZH}\\, ${HOMEWORK_DUTY_CAMPUS_ADDRESS_EN.replaceAll(",", "\\,")}`
    )
    expect(unfolded).toContain(`地址：${HOMEWORK_DUTY_CAMPUS_ADDRESS_ZH}`)
    expect(unfolded).toContain("DTSTART;TZID=Asia/Hong_Kong:20260901T153000")
    expect(unfolded).toContain("DTEND;TZID=Asia/Hong_Kong:20260901T193000")
    expect(unfolded).toContain("DTSTART;TZID=Asia/Hong_Kong:20260908T161500")
    expect(unfolded).toContain("TRIGGER:-PT1H")
    expect(unfolded).toContain("UID:homework-duty-a-2026-09-01@mainhope.edu.hk")
    expect(unfolded).not.toContain("homework-duty-b-")
    expect(unfolded).not.toContain("20260903T")
    expect(unfolded).not.toContain("20260902T")
  })
})
