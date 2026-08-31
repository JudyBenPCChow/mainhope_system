import { useCallback, useEffect, useState } from "react"
import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SkeletonTimetableBlock } from "@/components/ui/skeleton"
import { downloadTeacherCalendarIcs } from "@/lib/teacherCalendarExport"
import {
 TeacherWeekTimetable,
 weekItemsFromManageRows,
} from "@/components/teachers/TeacherWeekTimetable"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { useAuth } from "@/lib/authBootstrap"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import { fetchSchedulesInRange, type ScheduleManageRow } from "@/services/scheduleQueries"
import { addDaysYmd, localYmd } from "@/services/teacherQueries"

/** 首屏近 14 天；翻週超出時再加載 */
const INITIAL_FUTURE_DAYS = 13
const INITIAL_PAST_DAYS = 14
const EXTEND_DAYS = 14

export default function TeacherTimetablePage() {
 const { profile } = useAuth()
 const teacherId = getTeacherScopeTeacherId(profile)
 const today = localYmd()

 const [rows, setRows] = useState<ScheduleManageRow[]>([])
 const [loading, setLoading] = useState(true)
 const [rangeExtending, setRangeExtending] = useState(false)
 const [loadedFromYmd, setLoadedFromYmd] = useState(() => addDaysYmd(today, -INITIAL_PAST_DAYS))
 const [loadedToYmd, setLoadedToYmd] = useState(() => addDaysYmd(today, INITIAL_FUTURE_DAYS))
 const [err, setErr] = useState<string | null>(null)
 const exportDisabled = loading || rows.length === 0

 const mergeSchedules = useCallback((prev: ScheduleManageRow[], next: ScheduleManageRow[]) => {
  const byId = new Map(prev.map((s) => [s.id, s]))
  for (const row of next) byId.set(row.id, row)
  return [...byId.values()].sort((a, b) => {
   const byDate = a.scheduled_date.localeCompare(b.scheduled_date)
   if (byDate !== 0) return byDate
   return String(a.start_time ?? "").localeCompare(String(b.start_time ?? ""))
  })
 }, [])

 const load = useCallback(async () => {
  if (!isSupabaseConfigured || !teacherId) {
   setLoading(false)
   return
  }
  setLoading(true)
  setErr(null)
  const fromYmd = addDaysYmd(today, -INITIAL_PAST_DAYS)
  const toYmd = addDaysYmd(today, INITIAL_FUTURE_DAYS)
  try {
   const todayRows = await fetchSchedulesInRange(today, today, { teacherId })
   setRows(todayRows)
   setLoading(false)

   const list = await fetchSchedulesInRange(fromYmd, toYmd, { teacherId })
   setRows(list)
   setLoadedFromYmd(fromYmd)
   setLoadedToYmd(toYmd)
  } catch (e) {
   reportUserFacingError(e, { source: "TeacherTimetable.load", setErr, userMessage: formatUnknownError(e) })
   setRows([])
  } finally {
   setLoading(false)
  }
 }, [teacherId, today])

 const extendLoadedRange = useCallback(
  async (direction: "earlier" | "later") => {
   if (!teacherId || rangeExtending) return
   setRangeExtending(true)
   try {
    if (direction === "earlier") {
     const newFrom = addDaysYmd(loadedFromYmd, -EXTEND_DAYS)
     const newTo = addDaysYmd(loadedFromYmd, -1)
     const more = await fetchSchedulesInRange(newFrom, newTo, { teacherId })
     setRows((prev) => mergeSchedules(prev, more))
     setLoadedFromYmd(newFrom)
    } else {
     const newFrom = addDaysYmd(loadedToYmd, 1)
     const newTo = addDaysYmd(loadedToYmd, EXTEND_DAYS)
     const more = await fetchSchedulesInRange(newFrom, newTo, { teacherId })
     setRows((prev) => mergeSchedules(prev, more))
     setLoadedToYmd(newTo)
    }
   } catch (e) {
    reportUserFacingError(e, { source: "TeacherTimetable.extendRange", setErr, userMessage: formatUnknownError(e) })
   } finally {
    setRangeExtending(false)
   }
  },
  [teacherId, rangeExtending, loadedFromYmd, loadedToYmd, mergeSchedules]
 )

 useEffect(() => {
  void load()
 }, [load])

 if (!teacherId) {
  return (
   <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
    <p className="font-medium">此頁僅供專班老師使用。請以老師身分登入。</p>
   </div>
  )
 }

 return (
  <div className="space-y-6">
   <header className="flex flex-wrap items-start justify-between gap-4">
    <div>
     <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">時間表</h1>
     <p className="mt-2 max-w-2xl text-muted-foreground">
      預設載入近 {INITIAL_PAST_DAYS + INITIAL_FUTURE_DAYS + 1}{" "}
      天；翻到已載入範圍外時會提示繼續載入。今日課堂會優先顯示。
     </p>
    </div>
    <div className="flex max-w-sm flex-col items-stretch gap-2">
     <Button
      type="button"
      variant="outline"
      className="gap-2"
      onClick={() => downloadTeacherCalendarIcs(rows, today)}
      disabled={exportDisabled}
     >
      <Download className="h-4 w-4" aria-hidden />
      下載 Apple/Google 行事曆檔
     </Button>
     <p className="text-xs text-muted-foreground">
      下載 `.ics` 後，可在 iPhone 以檔案或 Safari 開啟並加入 Apple Calendar。已取消課堂不會匯出。
     </p>
     <p className="text-xs text-muted-foreground">
      建議流程：下載檔案 → 以「檔案」App 或 Safari 開啟 → 點選「加入行事曆」。
     </p>
    </div>
   </header>
   {err ? (
    <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-destructive">{err}</div>
   ) : null}
   {loading && rows.length === 0 ? (
    <SkeletonTimetableBlock aria-label="載入中" />
   ) : (
    <TeacherWeekTimetable
     items={weekItemsFromManageRows(rows)}
     loadedFromYmd={loadedFromYmd}
     loadedToYmd={loadedToYmd}
     rangeExtending={rangeExtending}
     onRequestLoadEarlier={() => extendLoadedRange("earlier")}
     onRequestLoadLater={() => extendLoadedRange("later")}
    />
   )}
  </div>
 )
}
