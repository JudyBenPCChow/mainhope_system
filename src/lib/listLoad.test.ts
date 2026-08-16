import { describe, expect, it } from "vitest"

import { listLoadCount, listLoadKind } from "@/lib/listLoad"

describe("listLoad", () => {
 it("失敗唔當真空／真 0", () => {
  expect(listLoadKind({ status: "error" })).toBe("error")
  expect(listLoadCount({ status: "error" })).toBeNull()
 })

 it("真 0 同真空係 ready", () => {
  expect(listLoadKind({ status: "ready", rows: [] })).toBe("empty")
  expect(listLoadCount({ status: "ready", rows: [] })).toBe(0)
 })

 it("成功有列", () => {
  expect(listLoadKind({ status: "ready", rows: [{ id: "1" }] })).toBe("rows")
  expect(listLoadCount({ status: "ready", rows: [{ id: "1" }, { id: "2" }] })).toBe(2)
 })
})
