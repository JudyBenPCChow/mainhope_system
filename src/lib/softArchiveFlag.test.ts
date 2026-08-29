import { afterEach, beforeAll, describe, expect, it } from "vitest"

import {
 SOFT_ARCHIVE_QUERIES_LS,
 isSoftArchiveQueriesEnabled,
 setSoftArchiveQueriesEnabled,
} from "@/lib/softArchiveFlag"

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

describe("isSoftArchiveQueriesEnabled", () => {
 afterEach(() => {
  localStorage.removeItem(SOFT_ARCHIVE_QUERIES_LS)
 })

 it("缺省／空字串＝開", () => {
  localStorage.removeItem(SOFT_ARCHIVE_QUERIES_LS)
  expect(isSoftArchiveQueriesEnabled()).toBe(true)
  localStorage.setItem(SOFT_ARCHIVE_QUERIES_LS, "")
  expect(isSoftArchiveQueriesEnabled()).toBe(true)
 })

 it("0／false＝關（全量）", () => {
  localStorage.setItem(SOFT_ARCHIVE_QUERIES_LS, "0")
  expect(isSoftArchiveQueriesEnabled()).toBe(false)
  localStorage.setItem(SOFT_ARCHIVE_QUERIES_LS, "false")
  expect(isSoftArchiveQueriesEnabled()).toBe(false)
 })

 it("1＝開", () => {
  localStorage.setItem(SOFT_ARCHIVE_QUERIES_LS, "1")
  expect(isSoftArchiveQueriesEnabled()).toBe(true)
 })

 it("setSoftArchiveQueriesEnabled 寫入 LS", () => {
  setSoftArchiveQueriesEnabled(false)
  expect(localStorage.getItem(SOFT_ARCHIVE_QUERIES_LS)).toBe("0")
  expect(isSoftArchiveQueriesEnabled()).toBe(false)
  setSoftArchiveQueriesEnabled(true)
  expect(localStorage.getItem(SOFT_ARCHIVE_QUERIES_LS)).toBe("1")
  expect(isSoftArchiveQueriesEnabled()).toBe(true)
 })
})
