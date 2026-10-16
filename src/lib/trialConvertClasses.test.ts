import { describe, expect, it } from "vitest"

import { classAllowedForTrialConvert } from "./trialConvertClasses"

describe("classAllowedForTrialConvert", () => {
  it("專科清單排除種類仍是小組的暑期功課班", () => {
    expect(
      classAllowedForTrialConvert("group", "math-a", {
        id: "sm-hw",
        classKind: "group",
        subject: "功課輔導",
        courseName: "暑期功課班",
        courseCode: "26SM-HWKP6001-A",
      })
    ).toBe(false)
  })

  it("專科清單保留其他專科班，並排除私人課程與已標功課輔導班", () => {
    expect(
      classAllowedForTrialConvert("group", "math-a", {
        id: "math-b",
        classKind: "group",
        subject: "數學",
        courseName: "中三級常規數學班",
        courseCode: "2627-MATHS3001-D",
      })
    ).toBe(true)
    expect(
      classAllowedForTrialConvert("group", "math-a", {
        id: "hw",
        classKind: "homework",
        subject: "功課輔導",
        courseName: "常規功課輔導班",
        courseCode: "2627-HWKS1099-A",
      })
    ).toBe(false)
    expect(
      classAllowedForTrialConvert("group", "math-a", {
        id: "priv",
        classKind: "private",
        subject: "英文 一對一",
        courseCode: "2627-EN-1",
      })
    ).toBe(false)
  })

  it("功課輔導班試堂只留種類為功課輔導班的列", () => {
    expect(
      classAllowedForTrialConvert("homework", "hw-sec", {
        id: "hw-pri",
        classKind: "homework",
        subject: "功課輔導",
        courseCode: "2627-HWKP1099-A",
      })
    ).toBe(true)
    expect(
      classAllowedForTrialConvert("homework", "hw-sec", {
        id: "sm-hw",
        classKind: "group",
        subject: "功課輔導",
        courseCode: "26SM-HWKP6001-A",
      })
    ).toBe(false)
  })

  it("私人課程只留試堂那一班", () => {
    expect(
      classAllowedForTrialConvert("private", "priv-a", {
        id: "priv-a",
        classKind: "private",
        subject: "英文 一對一",
      })
    ).toBe(true)
    expect(
      classAllowedForTrialConvert("private", "priv-a", {
        id: "priv-b",
        classKind: "private",
        subject: "英文 一對一",
      })
    ).toBe(false)
  })
})
