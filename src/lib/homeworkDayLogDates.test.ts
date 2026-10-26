import { describe, expect, it } from "vitest"

import {
  homeworkClosureYmdSet,
  homeworkDayLogPhase,
  nextHomeworkSchoolDay,
  nextUnwrittenStudentId,
} from "@/lib/homeworkDayLogDates"

describe("nextHomeworkSchoolDay", () => {
  it("returns tomorrow when not a closure", () => {
    expect(nextHomeworkSchoolDay("2026-09-26", new Set())).toBe("2026-09-27")
  })

  it("skips consecutive closures", () => {
    const closures = new Set(["2026-09-27", "2026-09-28"])
    expect(nextHomeworkSchoolDay("2026-09-26", closures)).toBe("2026-09-29")
  })
})

describe("homeworkClosureYmdSet", () => {
  it("keeps ISO dates", () => {
    expect([...homeworkClosureYmdSet([{ date: "2026-10-01" }], "2627")]).toEqual([
      "2026-10-01",
    ])
  })

  it("maps M/D into academic year", () => {
    const set = homeworkClosureYmdSet([{ date: "9/28" }, { date: "1/5" }], "2627")
    expect(set.has("2026-09-28")).toBe(true)
    expect(set.has("2027-01-05")).toBe(true)
  })
})

describe("nextUnwrittenStudentId", () => {
  const coming = [{ id: "a" }, { id: "b" }, { id: "c" }]

  it("picks the next unwritten after current", () => {
    expect(nextUnwrittenStudentId(coming, "a", new Set(["a"]))).toBe("b")
  })

  it("skips already written and wraps", () => {
    expect(nextUnwrittenStudentId(coming, "c", new Set(["a", "c"]))).toBe("b")
  })

  it("returns null when all others written", () => {
    expect(nextUnwrittenStudentId(coming, "b", new Set(["a", "b", "c"]))).toBe(null)
  })
})

describe("homeworkDayLogPhase", () => {
  it("none when no log", () => {
    expect(homeworkDayLogPhase(null)).toBe("none")
  })

  it("open when arrived or stub without left", () => {
    expect(homeworkDayLogPhase({ arrivedAt: "t", leftAt: null })).toBe("open")
    expect(homeworkDayLogPhase({ arrivedAt: null, leftAt: null })).toBe("open")
  })

  it("left when leftAt set", () => {
    expect(homeworkDayLogPhase({ arrivedAt: "t", leftAt: "u" })).toBe("left")
  })
})
