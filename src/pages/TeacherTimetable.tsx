import { useCallback, useEffect, useState } from "react"

import {
 TeacherWeekTimetable,
 weekItemsFromManageRows,
} from "@/components/teachers/TeacherWeekTimetable"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
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
   const list = await fetchSchedulesInRange(fromYmd, toYmd, { teacherId })
   setRows(list)
  } catch (e) {
   setErr(e instanceof Error ? e.message : String(e))
   setRows([])
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
  </div>
 )
}
