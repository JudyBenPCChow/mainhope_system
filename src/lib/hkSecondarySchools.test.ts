import { describe, expect, it } from "vitest"

import { HK_SECONDARY_SCHOOLS, schoolNameMatchesQuery } from "@/lib/hkSecondarySchools"

describe("HK_SECONDARY_SCHOOLS", () => {
 it("為教育局全日本地中學名單，無重複", () => {
  expect(HK_SECONDARY_SCHOOLS.length).toBeGreaterThanOrEqual(440)
  expect(new Set(HK_SECONDARY_SCHOOLS).size).toBe(HK_SECONDARY_SCHOOLS.length)
 })

 it("包含常用官立／資助／直資中學的正式校名", () => {
  for (const name of [
   "英華書院",
   "聖保羅男女中學",
   "拔萃女書院",
   "喇沙書院",
   "香港華仁書院",
   "華仁書院(九龍)",
   "協恩中學",
   "伊利沙伯中學",
   "皇仁書院",
   "拔萃男書院",
   "聖若瑟書院",
   "弘立書院",
  ]) {
   expect(HK_SECONDARY_SCHOOLS).toContain(name)
  }
 })

 it("前台顯示救恩書院（大埔）與粉嶺聖芳濟各書院，以區分同名姊妹校／相近校名", () => {
  expect(HK_SECONDARY_SCHOOLS).toContain("救恩書院（大埔）")
  expect(HK_SECONDARY_SCHOOLS).toContain("粉嶺救恩書院")
  expect(HK_SECONDARY_SCHOOLS).toContain("粉嶺聖芳濟各書院")
  expect(HK_SECONDARY_SCHOOLS).not.toContain("救恩書院")
  expect(HK_SECONDARY_SCHOOLS).not.toContain("聖芳濟各書院")
 })

 it("不含郊野學園、夜校補習式私立書院", () => {
  expect(HK_SECONDARY_SCHOOLS.some((n) => n.includes("郊野學園"))).toBe(false)
  expect(HK_SECONDARY_SCHOOLS).not.toContain("遵理學校")
 })
})

describe("schoolNameMatchesQuery", () => {
 it("打救恩可命中粉嶺救恩書院與救恩書院（大埔）", () => {
  expect(schoolNameMatchesQuery("粉嶺救恩書院", "救恩")).toBe(true)
  expect(schoolNameMatchesQuery("救恩書院（大埔）", "救恩")).toBe(true)
  expect(schoolNameMatchesQuery("粉嶺救恩書院", "救恩書院")).toBe(true)
 })

 it("方／芳、語／雨等近形錯字仍命中正式校名", () => {
  expect(schoolNameMatchesQuery("粉嶺聖芳濟各書院", "聖方濟")).toBe(true)
  expect(schoolNameMatchesQuery("嘉諾撒聖方濟各書院", "聖芳濟")).toBe(true)
  expect(schoolNameMatchesQuery("迦密柏雨中學", "柏語")).toBe(true)
  expect(schoolNameMatchesQuery("迦密柏雨中學", "加密")).toBe(true)
  expect(schoolNameMatchesQuery("培僑中學", "培喬")).toBe(true)
  expect(schoolNameMatchesQuery("仁愛堂陳黃淑芳紀念中學", "淑芬")).toBe(true)
  expect(schoolNameMatchesQuery("鳳溪第一中學", "鳳傒")).toBe(true)
  expect(schoolNameMatchesQuery("香港道教聯合會圓玄學院第二中學", "玄圓")).toBe(true)
  expect(schoolNameMatchesQuery("東華三院黃鳳翎中學", "黃鋒令")).toBe(true)
 })
})
