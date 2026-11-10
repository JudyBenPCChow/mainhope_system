import { describe, expect, it } from "vitest"

import {
  homeworkAvailabilityPersistKey,
  homeworkAvailabilityRowsToPersist,
} from "@/lib/homeworkAvailabilityPersist"

describe("homeworkAvailabilityPersist", () => {
  const entries = {
    b: { "10/2": { kind: "full" as const } },
    a: {
      "10/3": { kind: "full" as const },
      "10/1": { kind: "custom" as const, start: "16:00", end: "18:00" },
    },
  }

  it("drops 未交 and sorts teachers and dates", () => {
    const rows = homeworkAvailabilityRowsToPersist(entries, {
      b: "已提交",
      c: "未交",
      a: "草稿",
    })
    expect(rows.map((row) => row.teacherId)).toEqual(["a", "b"])
    expect(Object.keys(rows[0]!.entries)).toEqual(["10/1", "10/3"])
  })

  it("uses the same key when date key order differs", () => {
    const flipped = {
      a: {
        "10/1": { kind: "custom" as const, start: "16:00", end: "18:00" },
        "10/3": { kind: "full" as const },
      },
      b: { "10/2": { kind: "full" as const } },
    }
    expect(
      homeworkAvailabilityPersistKey(entries, { a: "草稿", b: "已提交" }, "2026-11")
    ).toBe(homeworkAvailabilityPersistKey(flipped, { b: "已提交", a: "草稿" }, "2026-11"))
  })

  it("changes the key when status or month changes", () => {
    const base = homeworkAvailabilityPersistKey(entries, { a: "草稿", b: "已提交" }, "2026-11")
    expect(homeworkAvailabilityPersistKey(entries, { a: "已提交", b: "已提交" }, "2026-11")).not.toBe(
      base
    )
    expect(homeworkAvailabilityPersistKey(entries, { a: "草稿", b: "已提交" }, "2026-12")).not.toBe(
      base
    )
  })
})
