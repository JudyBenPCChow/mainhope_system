import { useCallback, useEffect, useRef, useState } from "react"

import {
 futureCancelledScheduleCacheKey,
 futureCancelledScheduleCacheKeysEqual,
 getFutureCancelledScheduleCache,
 invalidateFutureCancelledScheduleCache,
 isFutureCancelledScheduleCacheFresh,
 setFutureCancelledScheduleCache,
 type FutureCancelledScheduleCache,
 type FutureCancelledScheduleCacheKey,
} from "@/components/schedule/scheduleListState"
import { bumpRequestGeneration, isLiveKeyedRequest } from "@/lib/requestGeneration"
import type { ScheduleManageRowSummary } from "@/lib/scheduleManageRowSummary"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { isYmd } from "@/lib/weekdayUtils"
import { fetchClassrooms, type RoomRecord } from "@/services/classroomQueries"
import {
 applyScheduleRowSummaries,
 fetchFutureCancelledSchedules,
 fetchScheduleManageRowSummaries,
 type ScheduleAlerts,
 type ScheduleManageRow,
} from "@/services/scheduleQueries"

export type UseFutureCancelledScheduleDataInput = {
 enabled: boolean
 teacherScopeId: string | null
 asOf: string
}

export type UseFutureCancelledScheduleDataResult = {
 rows: ScheduleManageRow[]
 rowSummaries: Map<string, ScheduleManageRowSummary>
 rooms: RoomRecord[]
 roomOptions: { id: string; label: string }[]
 alerts: Map<string, ScheduleAlerts>
 loading: boolean
 summaryLoading: boolean
 stale: boolean
 error: string | null
 reload: () => Promise<void>
 invalidateAndReload: () => Promise<void>
}

function cacheToState(cache: FutureCancelledScheduleCache): Pick<
 UseFutureCancelledScheduleDataResult,
 "rows" | "rowSummaries" | "rooms" | "roomOptions" | "alerts"
> {
 return {
  rows: cache.rows,
  rowSummaries: cache.rowSummaries,
  rooms: cache.rooms,
  roomOptions: cache.roomOptions,
  alerts: cache.alerts,
 }
}

export function useFutureCancelledScheduleData(
 input: UseFutureCancelledScheduleDataInput
): UseFutureCancelledScheduleDataResult {
 const key = futureCancelledScheduleCacheKey({
  teacherScopeId: input.teacherScopeId,
  asOf: input.asOf,
 })
 const initialCache = getFutureCancelledScheduleCache()
 const canHydrate =
  initialCache != null && futureCancelledScheduleCacheKeysEqual(initialCache.key, key)

 const [rows, setRows] = useState(() => (canHydrate ? initialCache.rows : []))
 const [rowSummaries, setRowSummaries] = useState(
  () => (canHydrate ? initialCache.rowSummaries : new Map<string, ScheduleManageRowSummary>())
 )
 const [rooms, setRooms] = useState(() => (canHydrate ? initialCache.rooms : []))
 const [roomOptions, setRoomOptions] = useState(
  () => (canHydrate ? initialCache.roomOptions : [])
 )
 const [alerts, setAlerts] = useState(
  () => (canHydrate ? initialCache.alerts : new Map<string, ScheduleAlerts>())
 )
 const [loading, setLoading] = useState(false)
 const [summaryLoading, setSummaryLoading] = useState(false)
 const [stale, setStale] = useState(false)
 const [error, setError] = useState<string | null>(null)
 const genRef = useRef({ current: 0 })
 const loadedKeyRef = useRef<FutureCancelledScheduleCacheKey | null>(canHydrate ? key : null)

 const reload = useCallback(async () => {
  if (!isSupabaseConfigured) return
  if (!isYmd(input.asOf)) return
  const requestKey = futureCancelledScheduleCacheKey({
   teacherScopeId: input.teacherScopeId,
   asOf: input.asOf,
  })
  const gen = bumpRequestGeneration(genRef.current)
  const sameKey =
   loadedKeyRef.current != null &&
   futureCancelledScheduleCacheKeysEqual(loadedKeyRef.current, requestKey)
  const isLive = () =>
   isLiveKeyedRequest(
    genRef.current,
    gen,
    futureCancelledScheduleCacheKey({
     teacherScopeId: input.teacherScopeId,
     asOf: input.asOf,
    }),
    requestKey,
    futureCancelledScheduleCacheKeysEqual
   )
  setLoading(!sameKey)
  setStale(sameKey)
  setSummaryLoading(true)
  setError(null)
  if (!sameKey) {
   setRows([])
   setRowSummaries(new Map())
   setAlerts(new Map())
  }
  try {
   const [list, rms] = await Promise.all([
    fetchFutureCancelledSchedules({
     asOf: input.asOf,
     teacherId: input.teacherScopeId,
    }),
    fetchClassrooms(),
   ])
   if (!isLive()) return
   loadedKeyRef.current = requestKey
   setRows(list)
   setStale(false)
   setLoading(false)
   setRooms(rms)
   const nextRoomOptions = [...rms]
    .map((r) => ({ id: r.id, label: r.name }))
    .sort((a, b) => a.label.localeCompare(b.label, "zh-Hant"))
   setRoomOptions(nextRoomOptions)

   const summaries = await fetchScheduleManageRowSummaries(list)
   if (!isLive()) return
   const applied = applyScheduleRowSummaries(list, summaries)
   setRows(applied.rows)
   setRowSummaries(summaries)
   setAlerts(applied.alerts)
   setFutureCancelledScheduleCache({
    key: requestKey,
    rows: applied.rows,
    rowSummaries: summaries,
    rooms: rms,
    roomOptions: nextRoomOptions,
    alerts: applied.alerts,
    complete: true,
   })
  } catch (e) {
   if (!isLive()) return
   reportUserFacingError(e, {
    source: "useFutureCancelledScheduleData.reload",
    setErr: setError,
   })
   if (!sameKey) {
    setRows([])
    setRowSummaries(new Map())
   }
  } finally {
   if (isLive()) {
    setLoading(false)
    setStale(false)
    setSummaryLoading(false)
   }
  }
 }, [input.asOf, input.teacherScopeId])

 const invalidateAndReload = useCallback(async () => {
  invalidateFutureCancelledScheduleCache()
  await reload()
 }, [reload])

 const keySignature = `${key.scope}:${key.teacherScopeId ?? ""}:${key.asOf}`

 useEffect(() => {
  if (!input.enabled) return
  const currentKey = futureCancelledScheduleCacheKey({
   teacherScopeId: input.teacherScopeId,
   asOf: input.asOf,
  })
  if (isFutureCancelledScheduleCacheFresh(currentKey)) {
   const cached = getFutureCancelledScheduleCache()
   if (cached && futureCancelledScheduleCacheKeysEqual(cached.key, currentKey)) {
    const state = cacheToState(cached)
    setRows(state.rows)
    setRowSummaries(state.rowSummaries)
    setRooms(state.rooms)
    setRoomOptions(state.roomOptions)
    setAlerts(state.alerts)
    loadedKeyRef.current = cached.key
   }
   return
  }
  void reload()
 }, [input.enabled, input.asOf, input.teacherScopeId, keySignature, reload])

 return {
  rows,
  rowSummaries,
  rooms,
  roomOptions,
  alerts,
  loading,
  summaryLoading,
  stale,
  error,
  reload,
  invalidateAndReload,
 }
}
