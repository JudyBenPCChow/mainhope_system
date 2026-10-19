import { describe, expect, it } from "vitest"

import { classAllowedForNewTrial } from "./trialAddClasses"

const asOf = "2026-10-20"

describe("classAllowedForNewTrial", () => {
  it("常規學年只留該學年專科班", () => {
    expect(
      classAllowedForNewTrial(
        {
          status: "進行中",
          classKind: "group",
          subject: "英國語文",
          academicYearLabel: "2627",
        },
        asOf
      )
    ).toBe(true)
    expect(
      classAllowedForNewTrial(
        {
          status: "進行中",
          classKind: "group",
          subject: "英國語文",
          academicYearLabel: "26SM",
        },
        asOf
      )
    ).toBe(false)
    expect(
      classAllowedForNewTrial(
        {
          status: "進行中",
          classKind: "group",
          subject: "英國語文",
          academicYearLabel: "2526",
        },
        asOf
      )
    ).toBe(false)
  })

  it("不列私人課程、已結束，以及沒有學年的班", () => {
    expect(
      classAllowedForNewTrial(
        {
          status: "進行中",
          classKind: "private",
          subject: "英國語文",
          academicYearLabel: "2627",
        },
        asOf
      )
    ).toBe(false)
    expect(
      classAllowedForNewTrial(
        {
          status: "進行中",
          classKind: null,
          subject: "英文一對一",
          academicYearLabel: "2627",
        },
        asOf
      )
    ).toBe(false)
    expect(
      classAllowedForNewTrial(
        {
          status: "已結束",
          classKind: "group",
          subject: "英國語文",
          academicYearLabel: "2627",
        },
        asOf
      )
    ).toBe(false)
    expect(
      classAllowedForNewTrial(
        {
          status: "進行中",
          classKind: "group",
          subject: "英國語文",
          academicYearLabel: null,
        },
        asOf
      )
    ).toBe(false)
  })

  it("暑期只留該暑期學年", () => {
    expect(
      classAllowedForNewTrial(
        {
          status: "進行中",
          classKind: "group",
          subject: "英國語文",
          academicYearLabel: "26SM",
        },
        "2026-07-15"
      )
    ).toBe(true)
    expect(
      classAllowedForNewTrial(
        {
          status: "進行中",
          classKind: "group",
          subject: "英國語文",
          academicYearLabel: "2627",
        },
        "2026-07-15"
      )
    ).toBe(false)
  })
})
