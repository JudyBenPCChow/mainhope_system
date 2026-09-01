import { createListDataCache } from "@/lib/listDataCache"
import type { PaymentListRow } from "@/services/paymentQueries"

export type PaymentHistoryCacheKey = {
 histStatus: string
 histFrom: string
 histTo: string
 histSearch: string
 filterStudentId: string | null
 includeOlderYears: boolean
}

export type PaymentHistoryDataCache = {
 key: PaymentHistoryCacheKey
 historyRows: PaymentListRow[]
 histHasMore: boolean
 hiddenOlderCount: number
 appliedFromYmd: string | null
}

const cache = createListDataCache<PaymentHistoryDataCache>({
 isUsable: (d) => d.historyRows.length > 0,
})

export function getPaymentHistoryDataCache(): PaymentHistoryDataCache | null {
 return cache.get()
}

export function setPaymentHistoryDataCache(next: PaymentHistoryDataCache, fetchedAt?: number): void {
 cache.set(next, fetchedAt)
}

export function invalidatePaymentHistoryDataCache(): void {
 cache.invalidate()
}

export function isPaymentHistoryCacheFresh(key: PaymentHistoryCacheKey, now = Date.now()): boolean {
 const data = cache.get()
 if (!data) return false
 if (data.key.histStatus !== key.histStatus) return false
 if (data.key.histFrom !== key.histFrom) return false
 if (data.key.histTo !== key.histTo) return false
 if (data.key.histSearch !== key.histSearch) return false
 if (data.key.filterStudentId !== key.filterStudentId) return false
 if (data.key.includeOlderYears !== key.includeOlderYears) return false
 return cache.isFresh(now)
}
