import { createListDataCache } from "@/lib/listDataCache"
import type { PaymentListRow } from "@/services/paymentQueries"

export const PAYMENT_HISTORY_STATUS_VALUES = [
 "all",
 "received",
 "pending",
 "pendingPay",
 "pendingReceive",
 "voided",
] as const

export type PaymentHistoryStatusFilter = (typeof PAYMENT_HISTORY_STATUS_VALUES)[number]

export type PaymentHistoryCacheKey = {
 histStatus: PaymentHistoryStatusFilter
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

export function parsePaymentHistoryStatus(raw: string | null): PaymentHistoryStatusFilter | null {
 if (raw && (PAYMENT_HISTORY_STATUS_VALUES as readonly string[]).includes(raw)) {
  return raw as PaymentHistoryStatusFilter
 }
 return null
}

export function paymentHistoryCacheKeysEqual(
 a: PaymentHistoryCacheKey,
 b: PaymentHistoryCacheKey
): boolean {
 return (
  a.histStatus === b.histStatus &&
  a.histFrom === b.histFrom &&
  a.histTo === b.histTo &&
  a.histSearch === b.histSearch &&
  a.filterStudentId === b.filterStudentId &&
  a.includeOlderYears === b.includeOlderYears
 )
}

export type PaymentHistoryHydration = {
 key: PaymentHistoryCacheKey
 historyRows: PaymentListRow[]
 histHasMore: boolean
 hiddenOlderCount: number
 appliedFromYmd: string | null
 hydrated: boolean
 consumeStudentIdFromUrl: boolean
}

/** URL 深連結優先於快取；鍵不符不得 hydrate 上一訪列。 */
export function resolvePaymentHistoryHydration(
 searchParams: { get: (key: string) => string | null },
 cache: PaymentHistoryDataCache | null
): PaymentHistoryHydration {
 const urlStudentId = searchParams.get("studentId")?.trim() ?? ""
 const urlStatus = parsePaymentHistoryStatus(searchParams.get("histStatus"))
 const key: PaymentHistoryCacheKey = {
  histStatus: urlStatus ?? cache?.key.histStatus ?? "all",
  histFrom: cache?.key.histFrom ?? "",
  histTo: cache?.key.histTo ?? "",
  histSearch: cache?.key.histSearch ?? "",
  filterStudentId: urlStudentId || cache?.key.filterStudentId || null,
  includeOlderYears: cache?.key.includeOlderYears ?? false,
 }
 const hydrated = Boolean(
  cache && cache.historyRows.length > 0 && paymentHistoryCacheKeysEqual(cache.key, key)
 )
 return {
  key,
  historyRows: hydrated && cache ? cache.historyRows : [],
  histHasMore: hydrated && cache ? cache.histHasMore : false,
  hiddenOlderCount: hydrated && cache ? cache.hiddenOlderCount : 0,
  appliedFromYmd: hydrated && cache ? cache.appliedFromYmd : null,
  hydrated,
  consumeStudentIdFromUrl: Boolean(urlStudentId),
 }
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
