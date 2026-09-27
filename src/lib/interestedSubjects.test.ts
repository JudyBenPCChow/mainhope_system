import { describe, expect, it } from "vitest"

import {
  formatInterestedSubjects,
  normalizeInterestedSubjects,
  parseInterestedSubjectsText,
} from "./interestedSubjects"

describe("normalizeInterestedSubjects", () => {
  it("trims and dedupes", () => {
    expect(normalizeInterestedSubjects([" 中文 ", "英文", "中文", ""])).toEqual(["中文", "英文"])
  })

  it("rejects non-arrays", () => {
    expect(normalizeInterestedSubjects(null)).toEqual([])
    expect(normalizeInterestedSubjects("中文")).toEqual([])
  })
})

describe("parseInterestedSubjectsText", () => {
  it("splits lines and顿号", () => {
    expect(parseInterestedSubjectsText("中文\n英文、數學")).toEqual(["中文", "英文", "數學"])
  })
})

describe("formatInterestedSubjects", () => {
  it("joins or dash", () => {
    expect(formatInterestedSubjects(["中文", "英文"])).toBe("中文、英文")
    expect(formatInterestedSubjects([])).toBe("—")
  })
})
