import { describe, expect, it } from "vitest"

import {
  aggregateTeacherDayLessons,
  teacherAddressName,
  teacherSubstituteNote,
  type TeacherDayLessonInput,
} from "./teacherDayReminders"
import { buildTeacherDayReminderMessage } from "./whatsappReminder"

function lesson(partial: Partial<TeacherDayLessonInput> & { scheduleId: string }): TeacherDayLessonInput {
  return {
    subject: "數學",
    courseCode: "MA101",
    courseName: "中一數學",
    startTime: "16:00",
    endTime: "17:00",
    classroomName: "17D",
    consecutiveGroupId: null,
    consecutiveSlotIndex: null,
    isExtraLesson: false,
    originalTeacherName: null,
    ...partial,
  }
}

describe("teacherAddressName", () => {
  it("appends 老師 when missing", () => {
    expect(teacherAddressName("王嘉琪")).toBe("王嘉琪老師")
  })

  it("does not double 老師", () => {
    expect(teacherAddressName("王老師")).toBe("王老師")
  })
})

describe("teacherSubstituteNote", () => {
  it("formats original teacher", () => {
    expect(teacherSubstituteNote("李老師")).toBe("代堂（原：李老師）")
  })

  it("returns null when empty", () => {
    expect(teacherSubstituteNote(null)).toBeNull()
    expect(teacherSubstituteNote("  ")).toBeNull()
  })
})

describe("aggregateTeacherDayLessons", () => {
  it("merges consecutive slots into one time range", () => {
    const out = aggregateTeacherDayLessons([
      lesson({
        scheduleId: "a",
        consecutiveGroupId: "g1",
        consecutiveSlotIndex: 0,
        startTime: "16:00",
        endTime: "17:00",
      }),
      lesson({
        scheduleId: "b",
        consecutiveGroupId: "g1",
        consecutiveSlotIndex: 1,
        startTime: "17:00",
        endTime: "18:00",
      }),
    ])
    expect(out).toHaveLength(1)
    expect(out[0]?.startTime).toBe("16:00")
    expect(out[0]?.endTime).toBe("18:00")
    expect(out[0]?.isConsecutive).toBe(true)
    expect(out[0]?.scheduleIds).toEqual(["a", "b"])
  })

  it("keeps substitute and extra-lesson flags", () => {
    const out = aggregateTeacherDayLessons([
      lesson({
        scheduleId: "x",
        isExtraLesson: true,
        originalTeacherName: "陳老師",
      }),
    ])
    expect(out[0]?.isExtraLesson).toBe(true)
    expect(out[0]?.originalTeacherName).toBe("陳老師")
  })

  it("sorts by start time", () => {
    const out = aggregateTeacherDayLessons([
      lesson({ scheduleId: "late", startTime: "19:00", endTime: "20:00" }),
      lesson({ scheduleId: "early", startTime: "15:00", endTime: "16:00" }),
    ])
    expect(out.map((l) => l.scheduleIds[0])).toEqual(["early", "late"])
  })
})

describe("buildTeacherDayReminderMessage", () => {
  it("builds a single-lesson schedule reminder", () => {
    const message = buildTeacherDayReminderMessage({
      teacherName: "王嘉琪",
      dateYmd: "2026-09-18",
      lessons: [
        {
          subject: "數學",
          courseCode: "MA101",
          courseName: "中一數學",
          startTime: "16:00",
          endTime: "17:00",
          classroomName: "17D",
        },
      ],
    })
    expect(message).toContain("王嘉琪老師 課堂排程：")
    expect(message).toContain("班別：中一數學（MA101）")
    expect(message).toContain("日期：2026-09-18")
    expect(message).toContain("時間：16:00-17:00")
    expect(message).toContain("課室：17D")
    expect(message).toContain("請準時到校")
    expect(message).not.toContain("請準時出席")
  })

  it("lists multiple lessons with substitute and extra notes", () => {
    const message = buildTeacherDayReminderMessage({
      teacherName: "李老師",
      dateYmd: "2026-09-18",
      lessons: [
        {
          subject: "英文",
          courseCode: "EN201",
          courseName: "中二英文",
          startTime: "16:00",
          endTime: "18:00",
          isConsecutive: true,
          classroomName: "17E",
          originalTeacherName: "陳老師",
        },
        {
          subject: "數學",
          courseCode: "MA101",
          courseName: "中一數學",
          startTime: "19:00",
          endTime: "20:00",
          classroomName: "17D",
          isExtraLesson: true,
        },
      ],
    })
    expect(message).toContain("李老師 課堂排程（共 2 堂）：")
    expect(message).toContain("時間：16:00-18:00 (兩堂連堂)")
    expect(message).toContain("備註：代堂（原：陳老師）")
    expect(message).toContain("備註：加堂")
  })
})
