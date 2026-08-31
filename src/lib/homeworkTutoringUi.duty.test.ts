import { describe, expect, it } from "vitest"

import {
  academicYearMonthBounds,
  availWindow,
  clampYearMonth,
  dutyAssignments,
  formatCalendarAssignmentLine,
  formatDutyPeople,
  homeworkDutyRoomCards,
  homeworkDutyRoomIdleLabel,
  makeAssignmentFromAvail,
  myDutyDays,
  myDutyRoomLabel,
  myDutyRoomShort,
  myDutyTimeLabel,
  teacherName,
  openSecondHomeworkRoom,
  closeSecondHomeworkRoom,
  applyHomeworkOccupancyClassroomMoveToDuty,
  defaultRoomForNextAssignment,
  isSecondRoomOpen,
  withSyncedLegacyTeachers,
  type HomeworkDutyAssignment,
  type HomeworkDutyDay,
} from "@/lib/homeworkTutoringUi"

const TEACHERS = [
  { id: "a", name: "Amy", subject: "—" },
  { id: "b", name: "Ben", subject: "—" },
]

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

describe("availWindow", () => {
  it("maps full and empty to the session window", () => {
    expect(availWindow(null)).toEqual({ start: "15:30", end: "19:30" })
    expect(availWindow({ kind: "full" })).toEqual({ start: "15:30", end: "19:30" })
  })

  it("keeps custom times", () => {
    expect(availWindow({ kind: "custom", start: "16:15", end: "19:30" })).toEqual({
      start: "16:15",
      end: "19:30",
    })
  })
})

describe("makeAssignmentFromAvail", () => {
  it("defaults a custom report onto the given room", () => {
    expect(
      makeAssignmentFromAvail("t1", { kind: "custom", start: "16:30", end: "19:30" }, "17D")
    ).toEqual({
      teacherId: "t1",
      start: "16:30",
      end: "19:30",
      room: "17D",
    })
  })
})

describe("dutyAssignments / formatDutyPeople", () => {
  it("falls back to legacy columns when assignments is omitted", () => {
    const legacy = day({ date: "9/8", secondaryTeacherId: "a" })
    delete (legacy as { assignments?: HomeworkDutyDay["assignments"] }).assignments
    expect(dutyAssignments(legacy)).toEqual([
      { teacherId: "a", start: "15:30", end: "19:30", room: "17D" },
    ])
  })

  it("lists multiple people with their hours", () => {
    const d = day({
      date: "9/8",
      assignments: [
        { teacherId: "b", start: "17:00", end: "19:30", room: "17E" },
        { teacherId: "a", start: "16:15", end: "19:30", room: "17D" },
      ],
    })
    expect(formatDutyPeople(d, TEACHERS)).toBe("Amy 16:15–19:30、Ben 17:00–19:30")
  })

  it("treats an empty assignments array as no one on duty", () => {
    const d = day({ date: "9/1", secondaryTeacherId: "a", assignments: [] })
    expect(dutyAssignments(d)).toEqual([])
    expect(formatDutyPeople(d, TEACHERS)).toBe("—")
  })
})

describe("open / close second room", () => {
  it("defaults new days to one room", () => {
    const d = day({ date: "9/1" })
    expect(isSecondRoomOpen(d)).toBe(false)
    expect(defaultRoomForNextAssignment(d)).toBe("17D")
  })

  it("opens 17E and closes by moving people back to 17D", () => {
    const opened = openSecondHomeworkRoom(day({ date: "9/1" }))
    expect(isSecondRoomOpen(opened)).toBe(true)
    expect(opened.primaryRoom).toBe("17E")
    const withPeople = {
      ...opened,
      assignments: [
        { teacherId: "a", start: "15:30", end: "19:30", room: "17D" },
        { teacherId: "b", start: "15:30", end: "19:30", room: "17E" },
      ],
    }
    const closed = closeSecondHomeworkRoom(withPeople)
    expect(isSecondRoomOpen(closed)).toBe(false)
    expect(closed.assignments.every((a) => a.room === "17D")).toBe(true)
    expect(closed.primaryTeacherId).toBeUndefined()
  })
})

describe("applyHomeworkOccupancyClassroomMoveToDuty", () => {
  it("relocates the default room when the second room is closed", () => {
    const moved = applyHomeworkOccupancyClassroomMoveToDuty(
      day({
        date: "9/1",
        assignments: [{ teacherId: "a", start: "15:30", end: "19:30", room: "17D" }],
      }),
      "17D",
      "山案座"
    )
    expect(moved.secondaryRoom).toBe("山案座")
    expect(isSecondRoomOpen(moved)).toBe(false)
    expect(moved.assignments[0]?.room).toBe("山案座")
  })

  it("renames an opened second room without closing it", () => {
    const opened = openSecondHomeworkRoom(
      day({
        date: "9/1",
        assignments: [
          { teacherId: "a", start: "15:30", end: "19:30", room: "17D" },
          { teacherId: "b", start: "15:30", end: "19:30", room: "17E" },
        ],
      })
    )
    const moved = applyHomeworkOccupancyClassroomMoveToDuty(opened, "17E", "矩尺座")
    expect(moved.secondaryRoom).toBe("17D")
    expect(moved.primaryRoom).toBe("矩尺座")
    expect(moved.assignments.map((x) => x.room).sort()).toEqual(["17D", "矩尺座"])
  })

  it("swaps the two opened rooms", () => {
    const opened = openSecondHomeworkRoom(
      day({
        date: "9/1",
        assignments: [
          { teacherId: "a", start: "15:30", end: "19:30", room: "17D" },
          { teacherId: "b", start: "15:30", end: "19:30", room: "17E" },
        ],
      })
    )
    const swapped = applyHomeworkOccupancyClassroomMoveToDuty(opened, "17D", "17E")
    expect(swapped.secondaryRoom).toBe("17E")
    expect(swapped.primaryRoom).toBe("17D")
    expect(swapped.secondaryTeacherId).toBe("a")
    expect(swapped.primaryTeacherId).toBe("b")
  })
})

describe("withSyncedLegacyTeachers", () => {
  it("copies first person per room into the occupancy columns", () => {
    const synced = withSyncedLegacyTeachers(
      day({
        date: "9/8",
        assignments: [
          { teacherId: "a", start: "16:15", end: "19:30", room: "17D" },
          { teacherId: "b", start: "15:30", end: "17:00", room: "17D" },
        ],
      })
    )
    expect(synced.secondaryTeacherId).toBe("b")
    expect(synced.primaryTeacherId).toBeUndefined()
  })
})

describe("myDutyDays", () => {
  it("keeps days assigned to the teacher and skips holidays", () => {
    const days = [
      day({ date: "9/1", assignments: [{ teacherId: "a", start: "15:30", end: "19:30", room: "17D" }] }),
      day({ date: "9/2", assignments: [{ teacherId: "a", start: "16:15", end: "19:30", room: "17E" }] }),
      day({ date: "9/3", assignments: [{ teacherId: "b", start: "15:30", end: "19:30", room: "17D" }] }),
      day({
        date: "9/26",
        holiday: "中秋節翌日",
        assignments: [{ teacherId: "a", start: "15:30", end: "19:30", room: "17D" }],
      }),
    ]
    expect(myDutyDays("a", days).map((d) => d.date)).toEqual(["9/1", "9/2"])
  })
})

describe("myDutyRoomLabel / myDutyRoomShort", () => {
  it("labels both rooms when the same teacher covers two", () => {
    const both = day({
      date: "9/11",
      assignments: [
        { teacherId: "a", start: "15:30", end: "17:00", room: "17D" },
        { teacherId: "a", start: "17:00", end: "19:30", room: "17E" },
      ],
    })
    expect(myDutyRoomLabel(both, "a")).toBe("課室 17D 15:30–17:00；課室 17E 17:00–19:30")
    expect(myDutyRoomShort(both, "a")).toBe("17D／17E")
    expect(myDutyTimeLabel(both, "a")).toBe("15:30–17:00、17:00–19:30")
  })

  it("uses the assigned room and reported time", () => {
    const onlyB = day({
      date: "9/4",
      assignments: [{ teacherId: "a", start: "15:45", end: "19:30", room: "17E" }],
    })
    expect(myDutyRoomLabel(onlyB, "a")).toBe("課室 17E 15:45–19:30")
    expect(myDutyRoomShort(onlyB, "a")).toBe("17E")
  })
})

describe("formatCalendarAssignmentLine", () => {
  it("shows room, name and hours", () => {
    expect(
      formatCalendarAssignmentLine(
        { teacherId: "a", start: "16:15", end: "19:30", room: "17D" },
        TEACHERS
      )
    ).toBe("17D Amy 16:15–19:30")
  })

  it("does not stringify leftover objects as [object Object]", () => {
    const messy = {
      teacherId: "a",
      start: { kind: "custom", start: "16:15", end: "19:30" },
      end: "19:30",
      room: "17D",
    } as unknown as HomeworkDutyAssignment
    const line = formatCalendarAssignmentLine(messy, TEACHERS)
    expect(line).not.toContain("[object Object]")
    expect(line).toBe("17D Amy 16:15–19:30")
  })

  it("reads nested full_name when the name field is an object", () => {
    expect(
      teacherName("x", [{ id: "x", name: { full_name: "Katie Lee" } as unknown as string, subject: "—" }])
    ).toBe("Katie Lee")
  })
})

describe("homeworkDutyRoomCards", () => {
  it("shows 17D in use and 17E as not enabled", () => {
    const d = day({
      date: "9/3",
      assignments: [{ teacherId: "a", start: "15:30", end: "19:30", room: "17D" }],
    })
    const cards = homeworkDutyRoomCards(d)
    expect(cards.map((c) => c.room)).toEqual(["17D", "17E"])
    expect(cards[0]?.assignments).toHaveLength(1)
    expect(cards[1]?.assignments).toHaveLength(0)
    expect(homeworkDutyRoomIdleLabel(d, "17D")).toBe("暫時空缺")
    expect(homeworkDutyRoomIdleLabel(d, "17E")).toBe("不啟用此課室")
  })

  it("still says 17E is not enabled when occupancy left primary_room set", () => {
    const d = day({
      date: "9/4",
      primaryRoom: "17E",
      assignments: [{ teacherId: "a", start: "15:30", end: "19:30", room: "17D" }],
    })
    expect(isSecondRoomOpen(d)).toBe(true)
    expect(homeworkDutyRoomIdleLabel(d, "17E")).toBe("不啟用此課室")
  })

  it("opens two cards when the second room is open", () => {
    const cards = homeworkDutyRoomCards(
      openSecondHomeworkRoom(
        day({
          date: "9/8",
          assignments: [
            { teacherId: "a", start: "15:30", end: "19:30", room: "17D" },
            { teacherId: "b", start: "16:15", end: "19:30", room: "17E" },
          ],
        })
      )
    )
    expect(cards.map((c) => c.room)).toEqual(["17D", "17E"])
  })

  it("keeps same-room handover on the 17D card, earliest first", () => {
    const cards = homeworkDutyRoomCards(
      day({
        date: "9/10",
        assignments: [
          { teacherId: "b", start: "17:00", end: "19:30", room: "17D" },
          { teacherId: "a", start: "15:30", end: "17:00", room: "17D" },
        ],
      })
    )
    expect(cards.map((c) => c.room)).toEqual(["17D", "17E"])
    expect(cards[0]?.assignments.map((a) => a.teacherId)).toEqual(["a", "b"])
  })
})

describe("academicYearMonthBounds / clampYearMonth", () => {
  it("uses Sep–Jun for a regular year", () => {
    expect(academicYearMonthBounds("2627")).toEqual({ min: "2026-09", max: "2027-06" })
  })

  it("uses Jul–Aug for a summer year", () => {
    expect(academicYearMonthBounds("26SM")).toEqual({ min: "2026-07", max: "2026-08" })
  })

  it("clamps the current month into the year range", () => {
    expect(clampYearMonth("2026-08", "2026-09", "2027-06")).toBe("2026-09")
    expect(clampYearMonth("2026-09", "2026-09", "2027-06")).toBe("2026-09")
    expect(clampYearMonth("2027-07", "2026-09", "2027-06")).toBe("2027-06")
  })
})
