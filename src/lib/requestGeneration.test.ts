import { describe, expect, it } from "vitest"

import { bumpRequestGeneration, isLiveRequestGeneration } from "@/lib/requestGeneration"

describe("requestGeneration", () => {
 it("後發請求令較早 generation 失效", () => {
  const box = { current: 0 }
  const first = bumpRequestGeneration(box)
  const second = bumpRequestGeneration(box)
  expect(isLiveRequestGeneration(box, first)).toBe(false)
  expect(isLiveRequestGeneration(box, second)).toBe(true)
 })

 it("兩請求逆序完成時只接受較新者", () => {
  const box = { current: 0 }
  const studentA = bumpRequestGeneration(box)
  const studentB = bumpRequestGeneration(box)
  const finished = { rows: [] as string[] }

  if (isLiveRequestGeneration(box, studentA)) finished.rows = ["A"]
  if (isLiveRequestGeneration(box, studentB)) finished.rows = ["B"]
  expect(finished.rows).toEqual(["B"])
 })
})
