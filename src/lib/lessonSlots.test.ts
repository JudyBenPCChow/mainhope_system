import { describe, expect, it } from "vitest"

import {
  EARLIER_SLOT_INDICES,
  FROM_AFTERNOON_SLOT_INDICES,
  WEEKDAY_DEFAULT_FIRST_VISIBLE_SLOT_INDEX,
  formatMin,
  lessonSlotStartMinute,
  parseHm,
  standardSlotIndexForStartTime,
} from "@/lib/lessonSlots"
import { isStandardSchedulePlacement } from "@/lib/scheduleDayView"

describe("parseHm", () => {
  it("accepts HH:MM", () => {
    expect(parseHm("09:00")).toBe(9 * 60)
    expect(parseHm("15:15")).toBe(15 * 60 + 15)
  })

  it("accepts DB times with seconds", () => {
    expect(parseHm("09:00:00")).toBe(9 * 60)
    expect(parseHm("15:15:00")).toBe(15 * 60 + 15)
    expect(parseHm("9:00:00")).toBe(9 * 60)
    expect(parseHm("15:15:00.000")).toBe(15 * 60 + 15)
  })

  it("rejects empty or non-time strings", () => {
    expect(parseHm(null)).toBeNull()
    expect(parseHm("")).toBeNull()
    expect(parseHm("morning")).toBeNull()
  })
})

describe("standardSlotIndexForStartTime", () => {
  it("treats HH:MM:SS standard starts as aligned", () => {
    expect(standardSlotIndexForStartTime("09:00:00")).toBe(0)
    expect(standardSlotIndexForStartTime("10:15:00")).toBe(1)
    expect(standardSlotIndexForStartTime("15:15:00")).toBe(5)
    expect(standardSlotIndexForStartTime("17:45:00")).toBe(7)
    expect(standardSlotIndexForStartTime("20:15:00")).toBe(9)
  })

  it("rejects times that are not slot starts", () => {
    expect(standardSlotIndexForStartTime("15:30:00")).toBeNull()
    expect(standardSlotIndexForStartTime("08:00")).toBeNull()
    expect(standardSlotIndexForStartTime("18:00:00")).toBeNull()
  })
})

describe("isStandardSchedulePlacement", () => {
  it("does not dump HH:MM:SS standard times into 非標準時間", () => {
    expect(isStandardSchedulePlacement({ start_time: "09:00:00" })).toBe(true)
    expect(isStandardSchedulePlacement({ start_time: "14:00:00" })).toBe(true)
    expect(isStandardSchedulePlacement({ start_time: "09:00" })).toBe(true)
  })
})

describe("weekday day-view earlier slots", () => {
  it("defaults visible range from 14:00 (slot index 4)", () => {
    expect(WEEKDAY_DEFAULT_FIRST_VISIBLE_SLOT_INDEX).toBe(4)
    expect(formatMin(lessonSlotStartMinute(WEEKDAY_DEFAULT_FIRST_VISIBLE_SLOT_INDEX))).toBe("14:00")
    expect(EARLIER_SLOT_INDICES).toEqual([0, 1, 2, 3])
    expect(FROM_AFTERNOON_SLOT_INDICES[0]).toBe(4)
  })
})
