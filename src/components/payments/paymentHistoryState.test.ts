import { afterEach, describe, expect, it } from "vitest"

import {
 resolvePaymentHistoryHydration,
 setPaymentHistoryDataCache,
 type PaymentHistoryDataCache,
} from "@/components/payments/paymentHistoryState"
import type { PaymentListRow } from "@/services/paymentQueries"

function cacheForStudent(studentId: string): PaymentHistoryDataCache {
 return {
  key: {
   histStatus: "all",
   histFrom: "",
   histTo: "",
   histSearch: "",
   filterStudentId: studentId,
   includeOlderYears: false,
  },
  historyRows: [{ id: `pay-${studentId}`, studentId, studentName: `學生${studentId}` } as PaymentListRow],
  histHasMore: false,
  hiddenOlderCount: 0,
  appliedFromYmd: null,
 }
}

afterEach(() => {
 setPaymentHistoryDataCache(
  {
   key: {
    histStatus: "all",
    histFrom: "",
    histTo: "",
    histSearch: "",
    filterStudentId: null,
    includeOlderYears: false,
   },
   historyRows: [],
   histHasMore: false,
   hiddenOlderCount: 0,
   appliedFromYmd: null,
  },
  0
 )
})

describe("resolvePaymentHistoryHydration", () => {
 it("快取學生 A 時深連結學生 B 不得 hydrate 舊列", () => {
  const cache = cacheForStudent("A")
  const params = new URLSearchParams("studentId=B")
  const next = resolvePaymentHistoryHydration(params, cache)
  expect(next.hydrated).toBe(false)
  expect(next.historyRows).toEqual([])
  expect(next.key.filterStudentId).toBe("B")
  expect(next.consumeStudentIdFromUrl).toBe(true)
 })

 it("無 URL 學生時可還原鍵相符快取", () => {
  const cache = cacheForStudent("A")
  const next = resolvePaymentHistoryHydration(new URLSearchParams(), cache)
  expect(next.hydrated).toBe(true)
  expect(next.historyRows).toHaveLength(1)
  expect(next.key.filterStudentId).toBe("A")
 })

 it("URL 狀態優先於快取狀態", () => {
  const cache = cacheForStudent("A")
  cache.key.histStatus = "received"
  const params = new URLSearchParams("histStatus=pending")
  const next = resolvePaymentHistoryHydration(params, cache)
  expect(next.key.histStatus).toBe("pending")
  expect(next.hydrated).toBe(false)
 })
})
