import { useCallback } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { useRecordPreview } from "@/components/recordPreview/recordPreviewContext"
import { useIsXl } from "@/hooks/use-xl"
import type { ScheduleListReturnState } from "@/components/schedule/scheduleManageDateState"

export const SCHEDULE_LIST_RETURN_STORAGE_KEY = "mgmt_schedule_list_return"

export function writeScheduleListReturnState(state: ScheduleListReturnState): void {
 try {
  sessionStorage.setItem(SCHEDULE_LIST_RETURN_STORAGE_KEY, JSON.stringify(state))
 } catch {
  /* ignore quota */
 }
}

export function readScheduleListReturnState(): ScheduleListReturnState | null {
 try {
  const raw = sessionStorage.getItem(SCHEDULE_LIST_RETURN_STORAGE_KEY)
  if (!raw) return null
  return JSON.parse(raw) as ScheduleListReturnState
 } catch {
  return null
 }
}

type OpenOpts = {
 listView: boolean
 returnState?: ScheduleListReturnState
}

/**
 * 排程紀錄入口：僅 xl 以上桌面列表的行政／外星人開右側預覽。
 * 不可使用通用 `useOpenRecord`，否則按日期／日視圖也會縮窄主欄。
 */
export function useOpenScheduleRecord() {
 const navigate = useNavigate()
 const location = useLocation()
 const isXl = useIsXl()
 const { enabled, openPreview } = useRecordPreview()

 return useCallback(
  (id: string, opts: OpenOpts) => {
   if (opts.returnState) writeScheduleListReturnState(opts.returnState)
   if (enabled && isXl && opts.listView) {
    openPreview({ kind: "schedule", id })
    return
   }
   navigate(`/Schedule/${id}`, {
    state: {
     from: `${location.pathname}${location.search}`,
     scheduleListReturn: opts.returnState ?? null,
    },
   })
  },
  [enabled, isXl, openPreview, navigate, location.pathname, location.search]
 )
}

export function useSchedulePreviewActive(listView: boolean): boolean {
 const isXl = useIsXl()
 const { enabled, preview } = useRecordPreview()
 return enabled && isXl && listView && preview?.kind === "schedule"
}
