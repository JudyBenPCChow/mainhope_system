import { describe, expect, it } from "vitest"

import {
  partitionSchedulesForClassTeacherSync,
  scheduleHasStarted,
} from "@/lib/classTeacherScheduleSync"

const today = "2026-09-06"
const now = "15:00"

function row(
  partial: Partial<{
    id: string
    status: string | null
    scheduledDate: string
    startTime: string | null
    teacherId: string | null
    originalTeacherId: string | null
    consecutiveGroupId: string | null
  }>
) {
  return {
    id: "s1",
    status: "已排程",
    scheduledDate: "2026-09-07",
    startTime: "16:00",
    teacherId: "old",
    originalTeacherId: null,
    consecutiveGroupId: null,
    ...partial,
  }
}

describe("scheduleHasStarted", () => {
  it("treats yesterday as started and tomorrow as not", () => {
    expect(scheduleHasStarted("2026-09-05", "16:00", today, now)).toBe(true)
    expect(scheduleHasStarted("2026-09-07", "08:00", today, now)).toBe(false)
  })

  it("uses start time on the same day", () => {
    expect(scheduleHasStarted(today, "14:00", today, now)).toBe(true)
    expect(scheduleHasStarted(today, "15:00", today, now)).toBe(true)
    expect(scheduleHasStarted(today, "15:01", today, now)).toBe(false)
  })

  it("treats same-day missing start time as started", () => {
    expect(scheduleHasStarted(today, null, today, now)).toBe(true)
  })
})

describe("partitionSchedulesForClassTeacherSync", () => {
  it("syncs future non-substitute lessons to the new teacher", () => {
    const { directIds, substituteIds } = partitionSchedulesForClassTeacherSync(
      [row({ id: "future", scheduledDate: "2026-09-08", teacherId: "old" })],
      "new",
      today,
      now
    )
    expect(directIds).toEqual(["future"])
    expect(substituteIds).toEqual([])
  })

  it("skips past, cancelled, and already-matching lessons", () => {
    const { directIds, substituteIds } = partitionSchedulesForClassTeacherSync(
      [
        row({ id: "past", scheduledDate: "2026-09-01", teacherId: "old" }),
        row({ id: "todayDone", scheduledDate: today, startTime: "10:00", teacherId: "old" }),
        row({ id: "cancel", status: "取消", scheduledDate: "2026-09-10", teacherId: "old" }),
        row({ id: "same", scheduledDate: "2026-09-10", teacherId: "new" }),
      ],
      "new",
      today,
      now
    )
    expect(directIds).toEqual([])
    expect(substituteIds).toEqual([])
  })

  it("fills blank teacher_id even on past or started lessons", () => {
    const { directIds, substituteIds } = partitionSchedulesForClassTeacherSync(
      [
        row({ id: "pastBlank", scheduledDate: "2026-09-01", teacherId: null, startTime: "10:00" }),
        row({ id: "todayBlank", scheduledDate: today, startTime: "10:00", teacherId: null }),
      ],
      "new",
      today,
      now
    )
    expect(directIds).toEqual(["pastBlank", "todayBlank"])
    expect(substituteIds).toEqual([])
  })

  it("updates original teacher on future substitutes only", () => {
    const { directIds, substituteIds } = partitionSchedulesForClassTeacherSync(
      [
        row({
          id: "subFuture",
          scheduledDate: "2026-09-10",
          teacherId: "sub",
          originalTeacherId: "old",
        }),
        row({
          id: "subPast",
          scheduledDate: "2026-09-01",
          teacherId: "sub",
          originalTeacherId: "old",
        }),
      ],
      "new",
      today,
      now
    )
    expect(directIds).toEqual([])
    expect(substituteIds).toEqual(["subFuture"])
  })

  it("skips the whole consecutive group when any slot has started", () => {
    const { directIds, substituteIds } = partitionSchedulesForClassTeacherSync(
      [
        row({
          id: "slot1",
          scheduledDate: today,
          startTime: "14:00",
          teacherId: "old",
          consecutiveGroupId: "g1",
        }),
        row({
          id: "slot2",
          scheduledDate: today,
          startTime: "15:15",
          teacherId: "old",
          consecutiveGroupId: "g1",
        }),
      ],
      "new",
      today,
      now
    )
    expect(directIds).toEqual([])
    expect(substituteIds).toEqual([])
  })
})
