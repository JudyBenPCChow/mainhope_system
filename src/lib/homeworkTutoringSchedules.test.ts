import { describe, expect, it } from "vitest"

import {
  HOMEWORK_OCCUPANCY_START,
  homeworkScheduleSlotsFromDutyDay,
  mdKeyToIso,
  monthDateRange,
} from "@/lib/homeworkTutoringSchedules"

describe("homeworkTutoringSchedules", () => {
  it("mdKeyToIso maps M/D within yearMonth", () => {
    expect(mdKeyToIso("2026-10", "10/2")).toBe("2026-10-02")
    expect(mdKeyToIso("2026-10", "9/2")).toBeNull()
  })

  it("monthDateRange returns first and last day", () => {
    expect(monthDateRange("2026-10")).toEqual({ from: "2026-10-01", to: "2026-10-31" })
  })

  it("skips holiday days", () => {
    const slots = homeworkScheduleSlotsFromDutyDay(
      {
        date: "10/2",
        holiday: "放假",
        start: "15:30",
        end: "19:30",
        secondaryRoom: "17D",
        primaryRoom: "17E",
      },
      "2026-10",
      new Map([
        ["17D", "d-id"],
        ["17E", "e-id"],
      ])
    )
    expect(slots).toHaveLength(0)
  })

  it("creates two room slots from 15:15", () => {
    const roomMap = new Map([
      ["17D", "d-id"],
      ["17E", "e-id"],
    ])
    const slots = homeworkScheduleSlotsFromDutyDay(
      {
        date: "10/6",
        start: "15:30",
        end: "19:30",
        secondaryRoom: "17D",
        primaryRoom: "17E",
        secondaryTeacherId: "t1",
        primaryTeacherId: "t2",
      },
      "2026-10",
      roomMap
    )
    expect(slots).toHaveLength(2)
    expect(slots[0]).toMatchObject({
      scheduled_date: "2026-10-06",
      start_time: HOMEWORK_OCCUPANCY_START,
      end_time: "19:30",
      classroom_id: "d-id",
      teacher_id: "t1",
      roomName: "17D",
    })
    expect(slots[1]?.classroom_id).toBe("e-id")
    expect(slots[1]?.teacher_id).toBe("t2")
  })
})
