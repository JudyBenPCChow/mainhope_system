import { describe, expect, it } from "vitest"

import { classMatchesStatus } from "@/components/classes/classesUi"

describe("班別清單狀態篩選", () => {
 it("全部不列入已結束", () => {
  expect(classMatchesStatus({ status: "進行中" }, "全部")).toBe(true)
  expect(classMatchesStatus({ status: "招生中" }, "全部")).toBe(true)
  expect(classMatchesStatus({ status: "已滿班" }, "全部")).toBe(true)
  expect(classMatchesStatus({ status: "已結束" }, "全部")).toBe(false)
 })

 it("點已結束才列出該狀態", () => {
  expect(classMatchesStatus({ status: "已結束" }, "已結束")).toBe(true)
  expect(classMatchesStatus({ status: "進行中" }, "已結束")).toBe(false)
 })
})
