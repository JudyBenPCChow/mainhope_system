import { describe, expect, it } from "vitest"

import { filterSearchableOptions, highlightedOptionIndex } from "@/components/ui/searchable-select"
import { normalizeSchoolSearchKey } from "@/lib/hkSecondarySchools"

const schools = [
 { value: "英華書院", label: "英華書院" },
 { value: "拔萃男書院", label: "拔萃男書院" },
 { value: "拔萃女書院", label: "拔萃女書院" },
 { value: "喇沙書院", label: "喇沙書院" },
]

describe("filterSearchableOptions", () => {
 it("空白搜尋顯示全部學校", () => {
  expect(filterSearchableOptions(schools, "").map((o) => o.value)).toEqual(schools.map((s) => s.value))
 })

 it("打字即時只顯示命中學校", () => {
  expect(filterSearchableOptions(schools, "拔萃").map((o) => o.value)).toEqual(["拔萃男書院", "拔萃女書院"])
 })

 it("combobox 剛開啟、搜尋框仍係已選校名時顯示全部", () => {
  expect(
   filterSearchableOptions(schools, "英華書院", {
    combobox: true,
    selectedText: "英華書院",
   }).map((o) => o.value)
  ).toEqual(schools.map((s) => s.value))
 })

 it("清單外校名可採用輸入文字", () => {
  const next = filterSearchableOptions(schools, "聖保羅書院", { allowCustomValue: true })
  expect(next.map((o) => o.value)).toContain("聖保羅書院")
  expect(next.at(-1)?.label).toBe("使用「聖保羅書院」")
 })

 it("可用 normalizeSearch 把近形錯字當同一字", () => {
  const opts = [
   { value: "粉嶺聖芳濟各書院", label: "粉嶺聖芳濟各書院" },
   { value: "粉嶺救恩書院", label: "粉嶺救恩書院" },
  ]
  expect(
   filterSearchableOptions(opts, "聖方濟", { normalizeSearch: normalizeSchoolSearchKey }).map((o) => o.value)
  ).toEqual(["粉嶺聖芳濟各書院"])
  expect(
   filterSearchableOptions(opts, "救恩", { normalizeSearch: normalizeSchoolSearchKey }).map((o) => o.value)
  ).toEqual(["粉嶺救恩書院"])
 })
})

describe("highlightedOptionIndex", () => {
 it("已選項在清單內時停喺該項，避免 Enter 誤改成第一個", () => {
  expect(highlightedOptionIndex(schools, "喇沙書院")).toBe(3)
 })

 it("已選項唔在篩選結果時回到第一項", () => {
  expect(highlightedOptionIndex(schools, "聖保羅書院")).toBe(0)
 })
})
