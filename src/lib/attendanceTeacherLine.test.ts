import { describe, expect, it } from "vitest"

import {
  attendanceIsSubstitute,
  formatAttendanceTeacherLine,
} from "@/lib/attendanceTeacherLine"

describe("formatAttendanceTeacherLine", () => {
  it("shows day teacher only when not a substitute", () => {
    expect(
      formatAttendanceTeacherLine({ teacherName: "Liam Lai", originalTeacherName: null })
    ).toBe("Liam Lai")
    expect(attendanceIsSubstitute({ originalTeacherId: null })).toBe(false)
  })

  it("marks substitute with original teacher", () => {
    expect(
      formatAttendanceTeacherLine({
        teacherName: "Liam Lai",
        originalTeacherName: "Kenneth Li",
      })
    ).toBe("Liam Lai（代 Kenneth Li）")
    expect(attendanceIsSubstitute({ originalTeacherId: "k1" })).toBe(true)
  })
})
