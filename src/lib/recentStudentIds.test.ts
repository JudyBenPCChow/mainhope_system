import { afterEach, beforeAll, describe, expect, it } from "vitest"

import {
 mergeRecentStudentIds,
 parseRecentStudentIds,
 readRecentStudentIds,
 touchRecentStudentId,
 writeRecentStudentIds,
} from "@/lib/recentStudentIds"

beforeAll(() => {
 if (typeof localStorage !== "undefined") return
 const store = new Map<string, string>()
 Object.defineProperty(globalThis, "localStorage", {
  value: {
   getItem: (key: string) => store.get(key) ?? null,
   setItem: (key: string, value: string) => {
    store.set(key, value)
   },
   removeItem: (key: string) => {
    store.delete(key)
   },
   clear: () => store.clear(),
  },
  configurable: true,
 })
})

describe("parseRecentStudentIds", () => {
 it("空值回空陣列", () => {
  expect(parseRecentStudentIds(null)).toEqual([])
  expect(parseRecentStudentIds("")).toEqual([])
 })

 it("只保留非空字串並去重", () => {
  expect(parseRecentStudentIds(JSON.stringify(["a", " ", "a", 1, "b"]))).toEqual(["a", "b"])
 })

 it("壞 JSON 回空陣列", () => {
  expect(parseRecentStudentIds("{not-json")).toEqual([])
 })
})

describe("touchRecentStudentId", () => {
 it("把新選的學生放到最前並去掉重複", () => {
  expect(touchRecentStudentId(["b", "c"], "a")).toEqual(["a", "b", "c"])
  expect(touchRecentStudentId(["a", "b"], "b")).toEqual(["b", "a"])
 })

 it("空白 id 不改動", () => {
  expect(touchRecentStudentId(["a"], "  ")).toEqual(["a"])
 })
})

describe("mergeRecentStudentIds", () => {
 it("最近選過優先於最近收款", () => {
  expect(mergeRecentStudentIds(["s1", "s2"], ["s2", "s3", "s4"], 3)).toEqual(["s1", "s2", "s3"])
 })
})

describe("readRecentStudentIds / writeRecentStudentIds", () => {
 const key = "mgmt_recent_student_ids_test"

 afterEach(() => {
  localStorage.removeItem(key)
 })

 it("寫入後可讀回", () => {
  writeRecentStudentIds(key, ["a", "b"])
  expect(readRecentStudentIds(key)).toEqual(["a", "b"])
 })
})
