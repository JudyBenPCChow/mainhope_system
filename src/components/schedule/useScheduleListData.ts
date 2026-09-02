import { useCallback, useEffect, useRef, useState } from "react"

import {
 getScheduleListDataCache,
 invalidateScheduleListDataCache,
 isScheduleListCacheFresh,
 scheduleListCacheKey,
 scheduleListCacheKeysEqual,
 setScheduleListDataCache,
 type ScheduleListCacheKey,
 type ScheduleListDataCache,
} from "@/components/schedule/scheduleListState"
import { bumpRequestGeneration, isLiveKeyedRequest } from "@/lib/requestGeneration"
import type { ScheduleManageRowSummary } from "@/lib/scheduleManageRowSummary"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { fetchClassrooms, type RoomRecord } from "@/services/classroomQueries"
import {
 applyScheduleRowSummaries,
 fetchScheduleManageRowSummaries,
 fetchSchedulesInRange,
 type ScheduleAlerts,
 type ScheduleManageRow,
} from "@/services/scheduleQueries"
import { isYmd } from "@/lib/weekdayUtils"

export type UseScheduleListDataInput = {
 enabled: boolean
 teacherScopeId: string | null
 displayStart: string
 rangeEnd: string
}

export type UseScheduleListDataResult = {
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

function cacheToState(cache: ScheduleListDataCache): Pick<
 UseScheduleListDataResult,
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

export function useScheduleListData(input: UseScheduleListDataInput): UseScheduleListDataResult {
 const key = scheduleListCacheKey({
  teacherScopeId: input.teacherScopeId,
  displayStart: input.displayStart,
  rangeEnd: input.rangeEnd,
 })
 const initialCache = getScheduleListDataCache()
 const canHydrate =
  initialCache != null && scheduleListCacheKeysEqual(initialCache.key, key)

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
 const loadedKeyRef = useRef<ScheduleListCacheKey | null>(canHydrate ? key : null)

 const reload = useCallback(async () => {
  if (!isSupabaseConfigured) return
  if (!isYmd(input.displayStart) || !isYmd(input.rangeEnd)) return
  const requestKey = scheduleListCacheKey({
   teacherScopeId: input.teacherScopeId,
   displayStart: input.displayStart,
   rangeEnd: input.rangeEnd,
  })
  const gen = bumpRequestGeneration(genRef.current)
  const sameKey =
   loadedKeyRef.current != null && scheduleListCacheKeysEqual(loadedKeyRef.current, requestKey)
  const isLive = () =>
   isLiveKeyedRequest(
    genRef.current,
    gen,
    scheduleListCacheKey({
     teacherScopeId: input.teacherScopeId,
     displayStart: input.displayStart,
     rangeEnd: input.rangeEnd,
    }),
    requestKey,
    scheduleListCacheKeysEqual
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
    fetchSchedulesInRange(
     input.displayStart,
     input.rangeEnd,
     input.teacherScopeId ? { teacherId: input.teacherScopeId } : undefined
    ),
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
   setScheduleListDataCache({
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
    source: "useScheduleListData.reload",
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
 }, [input.displayStart, input.rangeEnd, input.teacherScopeId])

 const invalidateAndReload = useCallback(async () => {
  invalidateScheduleListDataCache()
  await reload()
 }, [reload])

 const keySignature = `${key.scope}:${key.teacherScopeId ?? ""}:${key.displayStart}:${key.rangeEnd}`

 useEffect(() => {
  if (!input.enabled) return
  const currentKey = scheduleListCacheKey({
   teacherScopeId: input.teacherScopeId,
   displayStart: input.displayStart,
   rangeEnd: input.rangeEnd,
  })
  if (isScheduleListCacheFresh(currentKey)) {
   const cached = getScheduleListDataCache()
   if (cached && scheduleListCacheKeysEqual(cached.key, currentKey)) {
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
 }, [input.enabled, input.displayStart, input.rangeEnd, input.teacherScopeId, keySignature, reload])

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
