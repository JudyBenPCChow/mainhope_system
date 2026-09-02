import { describe, expect, it } from "vitest"

import {
 bumpRequestGeneration,
 isLiveKeyedRequest,
 isLiveRequestGeneration,
} from "@/lib/requestGeneration"

describe("requestGeneration", () => {
 it("後發請求令較早 generation 失效", () => {
  const box = { current: 0 }
  const first = bumpRequestGeneration(box)
  const second = bumpRequestGeneration(box)
  expect(isLiveRequestGeneration(box, first)).toBe(false)
  expect(isLiveRequestGeneration(box, second)).toBe(true)
 })

 it("KPI 與清單用不同 generation box 互不覆蓋", () => {
  const listBox = { current: 0 }
  const kpiBox = { current: 0 }
  const listGen = bumpRequestGeneration(listBox)
  const kpiGen = bumpRequestGeneration(kpiBox)
  expect(isLiveRequestGeneration(listBox, listGen)).toBe(true)
  expect(isLiveRequestGeneration(kpiBox, kpiGen)).toBe(true)
  bumpRequestGeneration(listBox)
  expect(isLiveRequestGeneration(listBox, listGen)).toBe(false)
  expect(isLiveRequestGeneration(kpiBox, kpiGen)).toBe(true)
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

 it("generation 相符但 key 不符則不套用", () => {
  const box = { current: 0 }
  const gen = bumpRequestGeneration(box)
  expect(
   isLiveKeyedRequest(box, gen, "2026-09-03", "2026-09-02", (a, b) => a === b)
  ).toBe(false)
  expect(
   isLiveKeyedRequest(box, gen, "2026-09-03", "2026-09-03", (a, b) => a === b)
  ).toBe(true)
 })
})
