import { describe, expect, it } from "vitest"

import {
  availWindow,
  dutyAssignments,
  formatCalendarAssignmentLine,
  formatDutyPeople,
  makeAssignmentFromAvail,
  myDutyDays,
  myDutyRoomLabel,
  myDutyRoomShort,
  myDutyTimeLabel,
  teacherName,
  openSecondHomeworkRoom,
  closeSecondHomeworkRoom,
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
