import { describe, expect, it } from "vitest"

import { formatElectedSubjectLabels, normalizeElectedSubjectCodes } from "./studentElectives"

describe("normalizeElectedSubjectCodes", () => {
  it("uppercases, trims, and dedupes", () => {
    expect(normalizeElectedSubjectCodes([" bio ", "PHY", "BIO", ""])).toEqual(["BIO", "PHY"])
  })

  it("returns empty for non-arrays", () => {
    expect(normalizeElectedSubjectCodes(null)).toEqual([])
    expect(normalizeElectedSubjectCodes("BIO")).toEqual([])
  })
})

describe("formatElectedSubjectLabels", () => {
  it("joins Chinese names and falls back to code", () => {
    expect(
      formatElectedSubjectLabels(["BIO", "M2"], [
        { code: "BIO", name_zh: "生物" },
        { code: "PHY", name_zh: "物理" },
      ])
    ).toBe("生物、M2")
  })

  it("shows an em dash when empty", () => {
    expect(formatElectedSubjectLabels([], [{ code: "BIO", name_zh: "生物" }])).toBe("—")
  })
})
