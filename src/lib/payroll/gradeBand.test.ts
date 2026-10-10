import { describe, expect, it } from "vitest"

import { gradeBandFromLabels, resolvePrivateSlotKind } from "@/lib/payroll/gradeBand"

describe("gradeBandFromLabels", () => {
  it("prefers senior when both senior and junior labels are present", () => {
    expect(gradeBandFromLabels(["中四", "中一"])).toBe("senior")
    expect(gradeBandFromLabels(["中三", "中六", "小一"])).toBe("senior")
  })

  it("returns junior when only junior labels are present", () => {
    expect(gradeBandFromLabels(["中二"])).toBe("junior")
    expect(gradeBandFromLabels(["中一", "中三"])).toBe("junior")
  })

  it("returns junior over primary when no senior label is present", () => {
    expect(gradeBandFromLabels(["中二", "小四"])).toBe("junior")
  })

  it("returns primary when only primary labels are present", () => {
    expect(gradeBandFromLabels(["小三"])).toBe("primary")
    expect(gradeBandFromLabels(["小一", "小六"])).toBe("primary")
  })

  it("returns unknown for an empty list or unrecognized labels", () => {
    expect(gradeBandFromLabels([])).toBe("unknown")
    expect(gradeBandFromLabels(["K1", ""])).toBe("unknown")
  })
})

describe("resolvePrivateSlotKind", () => {
  it("does not treat a non-private class as one-to-one", () => {
    expect(resolvePrivateSlotKind("group", "數學一對一")).toBe("group")
    expect(resolvePrivateSlotKind("group", "英文一對二")).toBe("group")
    expect(resolvePrivateSlotKind("homework", "一對一")).toBe("group")
  })

  it("maps a private class whose subject names 一對二 to one_to_two", () => {
    expect(resolvePrivateSlotKind("private", "中文一對二")).toBe("one_to_two")
  })

  it("maps an unlabeled private class to one_to_one", () => {
    expect(resolvePrivateSlotKind("private", "數學")).toBe("one_to_one")
    expect(resolvePrivateSlotKind("private", null)).toBe("one_to_one")
    expect(resolvePrivateSlotKind("private", "")).toBe("one_to_one")
  })

  it("maps an explicitly labeled private one-to-one subject to one_to_one", () => {
    expect(resolvePrivateSlotKind("private", "物理一對一")).toBe("one_to_one")
    expect(resolvePrivateSlotKind("private", "化學單對單")).toBe("one_to_one")
  })
})
