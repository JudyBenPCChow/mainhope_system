import { useCallback, useEffect, useState } from "react"
import { CalendarClock } from "lucide-react"

import {
 TeacherWeekTimetable,
 weekItemsFromManageRows,
} from "@/components/teachers/TeacherWeekTimetable"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import { listCalendarEventsInRange, type CalendarEventRow } from "@/services/calendarQueries"
import { fetchSchedulesInRange, type ScheduleManageRow } from "@/services/scheduleQueries"
import { addDaysYmd, localYmd } from "@/services/teacherQueries"

/** 約 ±18 週，供週視圖前後翻頁不需再請求 */
const PAST_DAYS = 120
const FUTURE_DAYS = 120

export default function TeacherTimetablePage() {
 const teacherId = getTeacherScopeTeacherId()
 const today = localYmd()
 const fromYmd = addDaysYmd(today, -PAST_DAYS)
 const toYmd = addDaysYmd(today, FUTURE_DAYS)

 const [rows, setRows] = useState<ScheduleManageRow[]>([])
 const [calendarRows, setCalendarRows] = useState<CalendarEventRow[]>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)

 const load = useCallback(async () => {
  if (!isSupabaseConfigured || !teacherId) {
   setLoading(false)
   return
  }
  setLoading(true)
  setErr(null)
  try {
   const [list, calList] = await Promise.all([
    fetchSchedulesInRange(fromYmd, toYmd, { teacherId }),
    listCalendarEventsInRange(fromYmd, toYmd, { teacherId }),
   ])
   setRows(list)
   setCalendarRows(calList)
  } catch (e) {
   setErr(formatUnknownError(e))
   setRows([])
   setCalendarRows([])
  } finally {
   setLoading(false)
  }
 }, [teacherId, fromYmd, toYmd])

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
   <header>
    <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">時間表</h1>
    <p className="mt-2 max-w-2xl text-muted-foreground">
     週視圖與老師詳情頁相同；左右切換週次或使用日期跳轉。已載入約 {PAST_DAYS + FUTURE_DAYS} 日內的排程。
    </p>
   </header>
   {err ? (
    <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-destructive">{err}</div>
   ) : null}
   {loading ? (
    <p className="text-muted-foreground">載入中…</p>
   ) : (
    <TeacherWeekTimetable items={weekItemsFromManageRows(rows)} />
   )}
   <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
    <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
     <CalendarClock className="h-5 w-5 text-sky-600" aria-hidden />
     我的行政事件
    </h2>
    <p className="mt-1 text-sm text-muted-foreground">此區塊來自待辦事項，與課堂排程分開。</p>
    {loading ? (
     <p className="mt-3 text-muted-foreground">載入中…</p>
    ) : calendarRows.length === 0 ? (
     <p className="mt-3 text-sm text-muted-foreground">目前沒有與您相關的行政事件。</p>
    ) : (
     <ul className="mt-3 space-y-2">
      {calendarRows.map((e) => (
       <li key={e.id} className="rounded-lg border border-border/80 bg-muted/20 px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
         <p className="font-medium">{e.title}</p>
         <span className="text-xs text-muted-foreground">
          {e.allDay ? "全日" : `${e.startTime ?? "—"} - ${e.endTime ?? "—"}`}
         </span>
        </div>
        <p className="text-xs text-muted-foreground">{e.eventDate}</p>
        {e.description?.trim() ? <p className="mt-1 text-sm text-muted-foreground">{e.description}</p> : null}
       </li>
      ))}
     </ul>
    )}
   </section>
  </div>
 )
}
