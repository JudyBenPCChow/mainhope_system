import { describe, expect, it } from "vitest"

import { teacherFilterOptionLabel } from "@/lib/teacherDisplaySort"

describe("teacherFilterOptionLabel", () => {
  it("uses the common name when it matches the English name", () => {
    expect(
      teacherFilterOptionLabel({ id: "1", name: "Annie Leung", englishName: "Annie Leung" })
    ).toBe("Annie Leung")
  })

  it("omits English name when it is already inside the common name", () => {
    expect(
      teacherFilterOptionLabel({ id: "1", name: "Phoebe Tam", englishName: "Phoebe" })
    ).toBe("Phoebe Tam")
  })

  it("shows both names when they differ", () => {
    expect(
      teacherFilterOptionLabel({
        id: "1",
        name: "Rafael Ling",
        englishName: "Ling Yat Sum",
      })
    ).toBe("Rafael Ling（Ling Yat Sum）")
  })

  it("falls back to the common name when English name is missing", () => {
    expect(teacherFilterOptionLabel({ id: "1", name: "Cheryl Ng", englishName: null })).toBe(
      "Cheryl Ng"
    )
  })
})
