import { describe, expect, it } from "vitest"

import { createListDataCache, LIST_DATA_CACHE_TTL_MS } from "@/lib/listDataCache"

type RowCache = { rows: { id: string }[] }

describe("createListDataCache", () => {
 it("新鮮且有列則 isFresh", () => {
  const cache = createListDataCache<RowCache>({ isUsable: (d) => d.rows.length > 0 })
  cache.set({ rows: [{ id: "1" }] })
  expect(cache.isFresh()).toBe(true)
  expect(cache.get()?.rows).toHaveLength(1)
 })

 it("空列不當新鮮", () => {
  const cache = createListDataCache<RowCache>({ isUsable: (d) => d.rows.length > 0 })
  cache.set({ rows: [] })
  expect(cache.isFresh()).toBe(false)
 })

 it("invalidate 保留列但下次不算新鮮", () => {
  const cache = createListDataCache<RowCache>({ isUsable: (d) => d.rows.length > 0 })
  cache.set({ rows: [{ id: "1" }] })
  cache.invalidate()
  expect(cache.get()?.rows).toEqual([{ id: "1" }])
  expect(cache.isFresh()).toBe(false)
 })

 it("patch 改列並保留 freshness", () => {
  const cache = createListDataCache<RowCache>({ isUsable: (d) => d.rows.length > 0 })
  cache.set({ rows: [{ id: "1" }] })
  cache.patch((cur) => ({ rows: [...cur.rows, { id: "2" }] }))
  expect(cache.get()?.rows).toEqual([{ id: "1" }, { id: "2" }])
  expect(cache.isFresh()).toBe(true)
 })

 it("過期則不新鮮", () => {
  const cache = createListDataCache<RowCache>({
   ttlMs: LIST_DATA_CACHE_TTL_MS,
   isUsable: (d) => d.rows.length > 0,
  })
  cache.set({ rows: [{ id: "1" }] }, Date.now() - LIST_DATA_CACHE_TTL_MS - 1)
  expect(cache.isFresh()).toBe(false)
  expect(cache.get()?.rows).toHaveLength(1)
 })
})
