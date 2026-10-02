import { describe, expect, it } from "vitest"

import { buildSchoolSelectOptions } from "./hkSecondarySchools"
import { HK_PRIMARY_SCHOOLS } from "./hkPrimarySchools"

describe("HK_PRIMARY_SCHOOLS", () => {
  it("is the local primary list without duplicates", () => {
    expect(HK_PRIMARY_SCHOOLS.length).toBeGreaterThanOrEqual(450)
    expect(new Set(HK_PRIMARY_SCHOOLS).size).toBe(HK_PRIMARY_SCHOOLS.length)
    expect(HK_PRIMARY_SCHOOLS).toContain("基督教粉嶺神召會小學")
    expect(HK_PRIMARY_SCHOOLS.some((name) => name.includes("特殊"))).toBe(false)
  })

  it("builds a primary dropdown that still allows the current school name", () => {
    const options = buildSchoolSelectOptions([], "神召會小學", HK_PRIMARY_SCHOOLS)
    expect(options[0]).toEqual({ value: "", label: "請選擇學校" })
    expect(options.some((option) => option.value === "基督教粉嶺神召會小學")).toBe(true)
    expect(options.some((option) => option.value === "神召會小學")).toBe(true)
    expect(options.some((option) => option.value === "英華書院")).toBe(false)
  })
})
