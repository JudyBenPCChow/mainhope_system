import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
 Bell,
 BookOpen,
 CalendarDays,
 CalendarRange,
 CircleUser,
 ClipboardCheck,
 GraduationCap,
 Loader2,
 RefreshCw,
 Sparkles,
 User,
 Video,
 XCircle,
} from "lucide-react"

import { formatWeekdaysDisplay } from "@/components/classes/classesUi"
import { TeacherWeekTimetable, weekItemsFromManageRows } from "@/components/teachers/TeacherWeekTimetable"
import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { useIsMobile } from "@/hooks/use-mobile"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { listLoadCount, listLoadKind, type ListLoad } from "@/lib/listLoad"
import { statusToTagTone } from "@/lib/statusTag"
import { classDisplayName } from "@/lib/courseLabel"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import { cn } from "@/lib/utils"
import { fetchClassesByTeacherId, type ClassRecord } from "@/services/classQueries"
import {
 fetchPendingRollCallRemindersForTeacher,
 findSchedulesMissingAttendance,
 type PendingRollCallReminder,
} from "@/services/attendanceQueries"
import { fetchLeaveRowsForClassIds, type TeacherPortalLeaveRow } from "@/services/leaveQueries"
import {
 fetchScheduleAlerts,
 fetchSchedulesInRange,
 type ScheduleAlerts,
 type ScheduleManageRow,
} from "@/services/scheduleQueries"
import { fetchScheduleRosterContext } from "@/services/scheduleRosterQueries"
import { addDaysYmd, getTeacherById, localYmd } from "@/services/teacherQueries"
import {
 fetchUpcomingTrialsForClassIds,
 type UpcomingTrialBrief,
} from "@/services/trialQueries"

/** 首屏近 14 天；更遠由週視圖邊界加載 */
const INITIAL_FUTURE_DAYS = 13
const EXTEND_DAYS = 14
const PAST_ROLLCALL_LOOKBACK_DAYS = 14

type TrialBrief = UpcomingTrialBrief

function alertTagsForSchedule(
 scheduleId: string,
 remarks: string | null,
 leaveRows: TeacherPortalLeaveRow[],
 trialIds: Set<string>,
 scheduleAlerts?: ScheduleAlerts | null
): { trial: boolean; makeup: boolean; leave: boolean; record: boolean } {
 let record = /錄影|錄像|錄音/.test(remarks ?? "")
 const trial = trialIds.has(scheduleId) || (scheduleAlerts?.trial ?? false)
 let leave = scheduleAlerts?.leave ?? false
 let makeup = scheduleAlerts?.makeup ?? false
 for (const r of leaveRows) {
  if (r.scheduleId !== scheduleId) continue
  leave = true
  const t = r.makeupType ?? ""
  if (t.includes("調堂") || t.includes("補") || t.includes("調")) makeup = true
  if (t.includes("錄影") || t.includes("錄像")) {
   record = true
   makeup = true
  }
 }
 if (scheduleAlerts?.record) record = true
 return { trial, makeup, leave, record }
}

export function TeacherHomeView() {
 const teacherId = getTeacherScopeTeacherId()
 const isMobile = useIsMobile()
 const today = localYmd()
 const [teacherName, setTeacherName] = useState<string>("老師")
 const [classes, setClasses] = useState<ClassRecord[]>([])
 const [schedules, setSchedules] = useState<ScheduleManageRow[]>([])
 const [leavesLoad, setLeavesLoad] = useState<ListLoad<TeacherPortalLeaveRow>>({ status: "loading" })
 const [trialsLoad, setTrialsLoad] = useState<ListLoad<TrialBrief>>({ status: "loading" })
 const [scheduleAlerts, setScheduleAlerts] = useState<Map<string, ScheduleAlerts>>(new Map())
 const [scheduleAlertsState, setScheduleAlertsState] = useState<"loading" | "ready" | "error">(
  "loading"
 )
 const [pendingRollCallsLoad, setPendingRollCallsLoad] = useState<ListLoad<PendingRollCallReminder>>({
  status: "loading",
 })
 const [pastPendingRollCallsLoad, setPastPendingRollCallsLoad] = useState<
  ListLoad<PendingRollCallReminder>
 >({ status: "loading" })
 const [loading, setLoading] = useState(true)
 const [metaLoading, setMetaLoading] = useState(false)
 const [rangeExtending, setRangeExtending] = useState(false)
 const [loadedFromYmd, setLoadedFromYmd] = useState(today)
 const [loadedToYmd, setLoadedToYmd] = useState(() => addDaysYmd(today, INITIAL_FUTURE_DAYS))
 const [err, setErr] = useState<string | null>(null)

 const mergeSchedules = useCallback((prev: ScheduleManageRow[], next: ScheduleManageRow[]) => {
  const byId = new Map(prev.map((s) => [s.id, s]))
  for (const row of next) byId.set(row.id, row)
  return [...byId.values()].sort((a, b) => {
   const byDate = a.scheduled_date.localeCompare(b.scheduled_date)
   if (byDate !== 0) return byDate
   return String(a.start_time ?? "").localeCompare(String(b.start_time ?? ""))
  })
 }, [])

 const loadMetaForSchedules = useCallback(
  async (schedList: ScheduleManageRow[], classIds: string[]) => {
   if (!teacherId) return
   setMetaLoading(true)
   try {
    const todayIds = schedList.filter((s) => s.scheduled_date === today).map((s) => s.id)
    const pastCandidates = schedList.filter(
     (s) => s.scheduled_date < today && s.scheduled_date >= addDaysYmd(today, -PAST_ROLLCALL_LOOKBACK_DAYS)
    )
    const rosterIds = [
     ...todayIds,
     ...pastCandidates.map((s) => s.id),
    ]
    const rosterContext = await fetchScheduleRosterContext([...new Set(rosterIds)])

    setLeavesLoad({ status: "loading" })
    setTrialsLoad({ status: "loading" })
    setPendingRollCallsLoad({ status: "loading" })
    setPastPendingRollCallsLoad({ status: "loading" })
    setScheduleAlertsState("loading")

    const [leaveRes, trialRes, rollRes, pastRollRes, alertsRes] = await Promise.allSettled([
     classIds.length ? fetchLeaveRowsForClassIds(classIds, 50) : Promise.resolve([]),
     fetchUpcomingTrialsForClassIds(classIds, today),
     fetchPendingRollCallRemindersForTeacher(teacherId, today),
     findSchedulesMissingAttendance(pastCandidates, rosterContext),
     fetchScheduleAlerts(
      schedList.filter((s) => s.scheduled_date >= today && s.scheduled_date <= addDaysYmd(today, 2)),
      rosterContext
     ),
    ])

    let partialFailed = false
    if (leaveRes.status === "fulfilled") setLeavesLoad({ status: "ready", rows: leaveRes.value })
    else {
     reportUserFacingError(leaveRes.reason, { source: "TeacherHomeView.loadLeaves" })
     partialFailed = true
     setLeavesLoad({ status: "error" })
    }
    if (trialRes.status === "fulfilled") setTrialsLoad({ status: "ready", rows: trialRes.value })
    else {
     reportUserFacingError(trialRes.reason, { source: "TeacherHomeView.loadTrials" })
     partialFailed = true
     setTrialsLoad({ status: "error" })
    }
    if (rollRes.status === "fulfilled") setPendingRollCallsLoad({ status: "ready", rows: rollRes.value })
    else {
     reportUserFacingError(rollRes.reason, { source: "TeacherHomeView.loadRollCallReminders" })
     partialFailed = true
     setPendingRollCallsLoad({ status: "error" })
    }
    if (pastRollRes.status === "fulfilled") setPastPendingRollCallsLoad({ status: "ready", rows: pastRollRes.value })
    else {
     reportUserFacingError(pastRollRes.reason, { source: "TeacherHomeView.loadPastRollCallReminders" })
     partialFailed = true
     setPastPendingRollCallsLoad({ status: "error" })
    }
    if (alertsRes.status === "fulfilled") {
     setScheduleAlerts(alertsRes.value)
     setScheduleAlertsState("ready")
    } else {
     reportUserFacingError(alertsRes.reason, { source: "TeacherHomeView.loadScheduleAlerts" })
     partialFailed = true
     setScheduleAlertsState("error")
    }
    if (partialFailed) {
     setErr("部分首頁資料暫時未能載入（請假／試堂／點名提醒），其餘資料已正常顯示。")
    }
   } catch (e) {
    reportUserFacingError(e, { source: "TeacherHomeView.loadMeta" })
    setLeavesLoad({ status: "error" })
    setTrialsLoad({ status: "error" })
    setPendingRollCallsLoad({ status: "error" })
    setPastPendingRollCallsLoad({ status: "error" })
    setScheduleAlertsState("error")
    setErr("部分首頁資料暫時未能載入（請假／試堂／點名提醒），其餘資料已正常顯示。")
   } finally {
    setMetaLoading(false)
   }
  },
  [teacherId, today]
 )

 const load = useCallback(async () => {
  if (!isSupabaseConfigured || !teacherId) {
   setLoading(false)
   return
  }
  setLoading(true)
  setErr(null)
  const toYmd = addDaysYmd(today, INITIAL_FUTURE_DAYS)
  try {
   const [tch, mine, todayRows] = await Promise.all([
    getTeacherById(teacherId),
    fetchClassesByTeacherId(teacherId),
    fetchSchedulesInRange(today, today, { teacherId }),
   ])
   if (tch) setTeacherName(tch.full_name)
   setClasses(mine.sort((a, b) => a.subject.localeCompare(b.subject, "zh-Hant")))
   setSchedules(todayRows)
   setLoadedFromYmd(today)
   setLoadedToYmd(today)
   setLoading(false)

   const restFuture =
    toYmd > today ? await fetchSchedulesInRange(addDaysYmd(today, 1), toYmd, { teacherId }) : []
   const pastForRoll =
    PAST_ROLLCALL_LOOKBACK_DAYS > 0
     ? await fetchSchedulesInRange(
        addDaysYmd(today, -PAST_ROLLCALL_LOOKBACK_DAYS),
        addDaysYmd(today, -1),
        { teacherId }
       )
     : []
   const merged = mergeSchedules(mergeSchedules(todayRows, restFuture), pastForRoll)
   setSchedules(merged)
   setLoadedFromYmd(addDaysYmd(today, -PAST_ROLLCALL_LOOKBACK_DAYS))
   setLoadedToYmd(toYmd)

   void loadMetaForSchedules(merged, mine.map((c) => c.id))
  } catch (e) {
   reportUserFacingError(e, { source: "TeacherHomeView.load", setErr })
   setClasses([])
   setSchedules([])
   setLeavesLoad({ status: "error" })
   setTrialsLoad({ status: "error" })
   setScheduleAlertsState("error")
   setPendingRollCallsLoad({ status: "error" })
   setPastPendingRollCallsLoad({ status: "error" })
   setLoading(false)
  }
 }, [teacherId, today, mergeSchedules, loadMetaForSchedules])

 const extendLoadedRange = useCallback(
  async (direction: "earlier" | "later") => {
   if (!teacherId || rangeExtending) return
   setRangeExtending(true)
   try {
    if (direction === "earlier") {
     const newFrom = addDaysYmd(loadedFromYmd, -EXTEND_DAYS)
     const newTo = addDaysYmd(loadedFromYmd, -1)
     if (newTo < newFrom) return
     const more = await fetchSchedulesInRange(newFrom, newTo, { teacherId })
     setSchedules((prev) => mergeSchedules(prev, more))
     setLoadedFromYmd(newFrom)
    } else {
     const newFrom = addDaysYmd(loadedToYmd, 1)
     const newTo = addDaysYmd(loadedToYmd, EXTEND_DAYS)
     const more = await fetchSchedulesInRange(newFrom, newTo, { teacherId })
     setSchedules((prev) => mergeSchedules(prev, more))
     setLoadedToYmd(newTo)
    }
   } catch (e) {
    reportUserFacingError(e, { source: "TeacherHomeView.extendLoadedRange", setErr })
   } finally {
    setRangeExtending(false)
   }
  },
  [teacherId, rangeExtending, loadedFromYmd, loadedToYmd, mergeSchedules]
 )

 useEffect(() => {
  void load()
 }, [load])

 const leaves = leavesLoad.status === "ready" ? leavesLoad.rows : []
 const trials = trialsLoad.status === "ready" ? trialsLoad.rows : []
 const pendingRollCalls = pendingRollCallsLoad.status === "ready" ? pendingRollCallsLoad.rows : []
 const pastPendingRollCalls =
  pastPendingRollCallsLoad.status === "ready" ? pastPendingRollCallsLoad.rows : []
 const pendingLeaveCount = listLoadCount(leavesLoad, (rows) =>
  rows.filter((l) => l.status.includes("待")).length
 )
 const pastPendingCount = listLoadCount(pastPendingRollCallsLoad)
 const leavesKind = listLoadKind(leavesLoad)
 const trialsKind = listLoadKind(trialsLoad)

 const trialScheduleIds = useMemo(() => {
  if (trialsLoad.status !== "ready") return new Set<string>()
  return new Set(trialsLoad.rows.map((t) => t.scheduleId).filter(Boolean))
 }, [trialsLoad])

 const todaySchedules = useMemo(
  () => schedules.filter((s) => s.scheduled_date === today && !s.status.includes("取消")),
  [schedules, today]
 )

 const upcomingDayGroups = useMemo(() => {
  const dayKeys = [0, 1, 2].map((offset) => addDaysYmd(today, offset))
  return dayKeys.map((ymd) => ({
   ymd,
   label: ymd === today ? "今日" : ymd === addDaysYmd(today, 1) ? "明日" : "後日",
   items: schedules
    .filter((s) => s.scheduled_date === ymd && !s.status.includes("取消"))
    .sort((a, b) => (a.start_time ?? "").localeCompare(b.start_time ?? "")),
  }))
 }, [schedules, today])

 if (!teacherId) {
  return (
   <div role="alert" className="rounded-xl border border-warning/40 bg-warning/10 p-6 text-warning">
    <p className="font-medium">未設定教師身分（缺少 teacher_id）。請由登入頁以「專班老師」重新進入。</p>
   </div>
  )
 }

 return (
  <div className="space-y-5 text-base leading-relaxed md:space-y-8 md:text-lg">
   <header className="rounded-2xl border border-info/30 bg-info/5 p-4 shadow-sm md:p-8">
    <p className="text-sm font-medium uppercase tracking-wide text-info">專班老師工作台</p>
    <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:mt-2 md:text-4xl">
     {loading && teacherName === "老師" ? (
      <span className="inline-block h-9 w-48 animate-pulse rounded-md bg-muted" aria-label="載入中" />
     ) : (
      `您好，${teacherName}`
     )}
    </h1>
    <p className="mt-2 text-sm text-muted-foreground md:mt-3 md:max-w-3xl md:text-base">
     {isMobile ? (
      <>
       今日有 {loading ? "…" : todaySchedules.length} 堂課
       {metaLoading ? " · 標記載入中…" : null}
      </>
     ) : (
      <>
       此頁僅顯示<strong>指派給您</strong>的班別與排程。今日有{" "}
       {loading ? "…" : todaySchedules.length} 堂課
       {metaLoading ? " · 試堂／請假標記載入中…" : null}
       。預設載入近 14 天，更遠課堂請在時間表用箭咀繼續載入。
      </>
     )}
    </p>
    {/* 手機底部導覽已涵蓋點名／時間表／更多，免重複 CTA */}
    <div className="mt-4 hidden flex-wrap gap-3 md:mt-6 md:flex">
     <Button type="button" size="lg" className="gap-2" asChild>
      <Link to="/Schedule">
       <CalendarDays className="h-5 w-5" />
       我的排程
      </Link>
     </Button>
     <Button type="button" size="lg" variant="outline" className="gap-2" asChild>
      <Link to="/Attendance">
       <ClipboardCheck className="h-5 w-5" />
       進行點名
      </Link>
     </Button>
     <Button type="button" size="lg" variant="outline" className="gap-2" asChild>
      <Link to="/Schedule">
       <CalendarDays className="h-5 w-5" />
       排程點名
      </Link>
     </Button>
     <Button type="button" size="lg" variant="outline" className="gap-2" asChild>
      <Link to="/TeacherTimetable">
       <CalendarRange className="h-5 w-5" />
       時間表
      </Link>
     </Button>
     <Button type="button" size="lg" variant="outline" className="gap-2" asChild>
      <Link to="/Classes">
       <BookOpen className="h-5 w-5" />
       我的班別
      </Link>
     </Button>
     <Button type="button" size="lg" variant="outline" className="gap-2" asChild>
      <Link to="/TeacherProfile">
       <CircleUser className="h-5 w-5" />
       個人資料
      </Link>
     </Button>
     <Button type="button" size="lg" variant="outline" className="gap-2" asChild>
      <Link to="/AttendanceRecords">
       <GraduationCap className="h-5 w-5" />
       出席紀錄
      </Link>
     </Button>
    </div>
   </header>

   {!isSupabaseConfigured ? (
    <div role="alert" className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-warning">
     尚未設定 Supabase，無法載入班別。請設定 <code className="rounded px-1">.env</code> 後執行{" "}
     <code className="rounded px-1">supabase db reset</code> 以載入 Judy Chu 演示資料。
    </div>
   ) : null}

   {err ? (
    <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-destructive">
     <p>{err}</p>
     <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => void load()}>
      重新整理
     </Button>
    </div>
   ) : null}

   {pendingRollCalls.length > 0 ? (
    <section
     className="rounded-xl border border-warning/40 bg-warning/10 p-4 shadow-sm"
     aria-label="今日點名提醒"
    >
     <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
       <p className="flex items-center gap-2 text-sm font-semibold text-warning">
        <ClipboardCheck className="h-5 w-5 shrink-0" />
        請盡快完成今日點名（{pendingRollCalls.length} 堂尚未點名）
       </p>
       <p className="mt-1 text-xs text-muted-foreground">
        未點名不會自動扣堂；請假單只影響預填，請打開點名表確認後儲存。
       </p>
       <ul className="mt-2 space-y-1 text-sm text-foreground">
        {pendingRollCalls.slice(0, 5).map((r) => (
         <li key={r.scheduleId}>
          <Link
           to={`/Schedule?date=${encodeURIComponent(r.scheduledDate)}&schedule_id=${encodeURIComponent(r.scheduleId)}&rollcall=1`}
           className="font-medium text-info underline-offset-2 hover:underline"
          >
           {r.startTime ?? "—"} · {r.classLabel}
          </Link>
         </li>
        ))}
       </ul>
       {pendingRollCalls.length > 5 ? (
        <p className="mt-1 text-xs text-muted-foreground">另有 {pendingRollCalls.length - 5} 堂…</p>
       ) : null}
      </div>
      <Button type="button" size="sm" variant="outline" asChild>
       <Link to={`/Schedule?date=${encodeURIComponent(today)}&view=day`}>前往排程點名</Link>
      </Button>
     </div>
    </section>
   ) : null}

   {pastPendingRollCalls.length > 0 ? (
    <section
     className="rounded-xl border border-warning/40 bg-warning/10 p-4 shadow-sm"
     aria-label="過去未點名提醒"
    >
     <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
       <p className="flex items-center gap-2 text-sm font-semibold text-warning">
        <ClipboardCheck className="h-5 w-5 shrink-0" />
        過去課堂尚未點名（{pastPendingRollCalls.length} 堂）
       </p>
       <p className="mt-1 text-xs text-muted-foreground">
        昨天或更早的排程仍未寫入點名；請盡快補點，否則不會扣堂。
       </p>
       <ul className="mt-2 space-y-1 text-sm text-foreground">
        {pastPendingRollCalls.slice(0, 5).map((r) => (
         <li key={r.scheduleId}>
          <Link
           to={`/Attendance?date=${encodeURIComponent(r.scheduledDate)}&schedule_id=${encodeURIComponent(r.scheduleId)}`}
           className="font-medium text-info underline-offset-2 hover:underline"
          >
           {r.scheduledDate} {r.startTime ?? "—"} · {r.classLabel}
          </Link>
         </li>
        ))}
       </ul>
       {pastPendingRollCalls.length > 5 ? (
        <p className="mt-1 text-xs text-muted-foreground">另有 {pastPendingRollCalls.length - 5} 堂…</p>
       ) : null}
      </div>
      <Button type="button" size="sm" variant="outline" asChild>
       <Link
        to={
         pastPendingRollCalls[0]
          ? `/Attendance?date=${encodeURIComponent(pastPendingRollCalls[0].scheduledDate)}`
          : "/Attendance"
        }
       >
        前往補點名
       </Link>
      </Button>
     </div>
    </section>
   ) : null}

   {/* 手機以行程列表為主，略過與底部導覽重複的 KPI 卡片 */}
   <section className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-4" aria-label="本日重點">
    <Link
     to={`/Schedule?view=day&date=${encodeURIComponent(today)}`}
     className={cn(
      "block rounded-xl border border-border bg-card p-5 shadow-sm outline-none transition-all duration-200",
      "hover:border-info/40 hover:bg-info/10 hover:shadow-md focus-visible:ring-2 focus-visible:ring-info/40 focus-visible:ring-offset-2"
     )}
    >
     <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground md:text-base">
      <CalendarDays className="h-5 w-5 text-info" />
      今日課堂
     </div>
     <p className="mt-2 text-4xl font-bold tabular-nums text-info">{todaySchedules.length}</p>
     <p className="mt-1 text-sm text-muted-foreground md:text-base">不含已取消排程 · 前往今日排程</p>
    </Link>
    <Link
     to="/Classes"
     className={cn(
      "block rounded-xl border border-border bg-card p-5 shadow-sm outline-none transition-all duration-200",
      "hover:border-info/70 hover:bg-info/50 hover:shadow-md focus-visible:ring-2 focus-visible:ring-info/40 focus-visible:ring-offset-2"
     )}
    >
     <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground md:text-base">
      <BookOpen className="h-5 w-5 text-info" />
      我的班別
     </div>
     <p className="mt-2 text-4xl font-bold tabular-nums text-info">{classes.length}</p>
     <p className="mt-1 text-sm text-muted-foreground md:text-base">僅計指派給您的班級 · 前往班別</p>
    </Link>
    <Link
     to="/Schedule"
     className={cn(
      "block rounded-xl border border-border bg-card p-5 shadow-sm outline-none transition-all duration-200",
      "hover:border-warning/40 hover:bg-warning/10 hover:shadow-md focus-visible:ring-2 focus-visible:ring-warning/40 focus-visible:ring-offset-2"
     )}
    >
     <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground md:text-base">
      <Bell className="h-5 w-5 text-warning" />
      待留意請假
     </div>
     <p className="mt-2 text-4xl font-bold tabular-nums text-warning">
      {pendingLeaveCount == null ? "—" : pendingLeaveCount}
     </p>
     <p className="mt-1 text-sm text-muted-foreground md:text-base">狀態含「待」之請假／補堂 · 前往排程</p>
    </Link>
    <Link
     to={
      pastPendingRollCalls[0]
       ? `/Attendance?date=${encodeURIComponent(pastPendingRollCalls[0].scheduledDate)}`
       : "/Attendance"
     }
     className={cn(
      "block rounded-xl border border-border bg-card p-5 shadow-sm outline-none transition-all duration-200",
      "hover:border-warning/40 hover:bg-warning/10 hover:shadow-md focus-visible:ring-2 focus-visible:ring-warning/40 focus-visible:ring-offset-2"
     )}
    >
     <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground md:text-base">
      <ClipboardCheck className="h-5 w-5 text-warning" />
      過去未點名
     </div>
     <p className="mt-2 text-4xl font-bold tabular-nums text-warning">
      {pastPendingCount == null ? "—" : pastPendingCount}
     </p>
     <p className="mt-1 text-sm text-muted-foreground md:text-base">
      昨天或更早尚未點名 · 前往補點名
     </p>
    </Link>
   </section>

   <section className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow duration-200 hover:shadow-md md:p-6">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 md:mb-4">
     <Link
      to="/TeacherTimetable"
      className={cn(
       "group flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1 pr-2 text-lg font-semibold outline-none transition-colors md:text-2xl",
       "hover:text-info focus-visible:ring-2 focus-visible:ring-info/40 focus-visible:ring-offset-2"
      )}
     >
      <CalendarRange className="h-5 w-5 shrink-0 text-info transition-transform group-hover:scale-105 md:h-6 md:w-6" />
      <span className="truncate underline-offset-4 group-hover:underline">
       {isMobile ? "近三日行程" : "本週時間表"}
      </span>
     </Link>
     <Button type="button" variant="outline" size="sm" asChild>
      <Link to="/TeachingRecords">教學紀錄</Link>
     </Button>
     <Button type="button" variant="outline" size="sm" asChild>
      <Link to="/TeacherTimetable">{isMobile ? "完整" : "全螢幕檢視"}</Link>
     </Button>
    </div>
    {loading ? (
     <div className="space-y-3" aria-label="載入中">
      <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
      <div className="h-48 animate-pulse rounded-xl bg-muted/70" />
     </div>
    ) : isMobile ? (
     <div className="space-y-5">
      {upcomingDayGroups.map((group) => (
       <div key={group.ymd}>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
         {group.label}
         <span className="ml-2 font-normal tabular-nums">{group.ymd}</span>
        </h3>
        {group.items.length === 0 ? (
         <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
          沒有排程
         </p>
        ) : (
         <ul className="space-y-2">
          {group.items.map((s) => {
           const a = alertTagsForSchedule(
            s.id,
            s.remarks ?? null,
            leaves,
            trialScheduleIds,
            scheduleAlerts.get(s.id)
           )
           return (
            <li key={s.id}>
             <Link
              to={`/Schedule/${s.id}`}
              className="block rounded-xl border border-border/80 bg-muted/20 px-4 py-3 transition-colors hover:border-primary/30"
             >
             <div className="font-semibold text-foreground">
              {s.start_time ?? "—"}–{s.end_time ?? "—"} · {s.classLabel}
             </div>
             <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span>位置：{s.classroom_name ?? "課室未定"}</span>
              {s.teaching_notes?.trim() ? (
               <Tag tone="info" size="sm">已有教學紀錄</Tag>
              ) : null}
              {a.trial ? <Tag tone="info" size="sm">試堂</Tag> : null}
              {a.leave ? <Tag tone="warning" size="sm">請假</Tag> : null}
              {a.makeup ? <Tag tone="warning" size="sm">補堂</Tag> : null}
              {a.record ? <Tag tone="default" size="sm">錄影</Tag> : null}
             </div>
             {s.teaching_notes?.trim() ? (
              <p className="mt-2 line-clamp-2 text-sm text-foreground">
               {s.teaching_notes.replace(/\s+/g, " ").trim()}
              </p>
             ) : null}
             </Link>
            </li>
           )
          })}
         </ul>
        )}
       </div>
      ))}
     </div>
    ) : (
     <TeacherWeekTimetable
      items={weekItemsFromManageRows(schedules)}
      loadedFromYmd={loadedFromYmd}
      loadedToYmd={loadedToYmd}
      rangeExtending={rangeExtending}
      onRequestLoadEarlier={() => extendLoadedRange("earlier")}
      onRequestLoadLater={() => extendLoadedRange("later")}
     />
    )}
   </section>

   {/* 手機「近三日」已含今日，略過桌面用的詳細今日列表 */}
   <section className="hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow duration-200 hover:shadow-md md:block md:p-6">
    <Link
     to={`/Schedule?view=day&date=${encodeURIComponent(today)}`}
     className={cn(
      "group mb-1 flex w-fit max-w-full items-center gap-2 rounded-lg py-1 text-xl font-semibold outline-none transition-colors md:text-2xl",
      "hover:text-primary/90 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
     )}
    >
     <CalendarDays className="h-6 w-6 shrink-0 text-primary transition-transform group-hover:scale-105" />
     <span className="underline-offset-4 group-hover:underline">今日行程與提醒</span>
    </Link>
    <p className="mt-1 text-sm text-muted-foreground md:text-base">
     圖示：試堂 <GraduationCap className="inline h-4 w-4" /> · 請假／補堂{" "}
     <RefreshCw className="inline h-4 w-4" /> · 錄影 <Video className="inline h-4 w-4" /> · 請假{" "}
     <XCircle className="inline h-4 w-4" />
    </p>
    {loading ? (
     <p className="mt-4 text-muted-foreground">載入中…</p>
    ) : todaySchedules.length === 0 ? (
     <p className="mt-4 text-muted-foreground">今日沒有您的排程。</p>
    ) : (
     <ul className="mt-4 space-y-3">
      {todaySchedules.map((s) => {
       const a = alertTagsForSchedule(
        s.id,
        s.remarks ?? null,
        leaves,
        trialScheduleIds,
        scheduleAlerts.get(s.id)
       )
       const hasA = a.trial || a.makeup || a.leave || a.record
       return (
        <li
         key={s.id}
         className="rounded-xl border border-border/80 bg-muted/20 px-4 py-3 transition-colors hover:border-primary/30"
        >
         <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
           <Link
            to={`/Schedule/${s.id}`}
            className="font-semibold text-foreground hover:text-primary hover:underline"
           >
            {s.start_time ?? "—"}–{s.end_time ?? "—"} · {s.classLabel}
           </Link>
           <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground md:text-base">
            <span className="inline-flex items-center gap-1">
             <User className="h-4 w-4" />
             {s.teacher_name ?? "—"}
            </span>
            <span>位置：{s.classroom_name ?? "課室未定"}</span>
            <span>
             {s.enrollCount == null ? (
              <span className="inline-block h-4 w-14 animate-pulse rounded bg-muted align-middle" />
             ) : (
              `${s.enrollCount} 人`
             )}
            </span>
            {s.teaching_notes?.trim() ? (
             <Tag tone="info" size="sm">已有教學紀錄</Tag>
            ) : null}
           </div>
           {s.teaching_notes?.trim() ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground md:text-base">
             教學紀錄：{s.teaching_notes}
            </p>
           ) : null}
           {s.remarks ? (
            <p className="mt-2 text-sm text-info md:text-base">備註：{s.remarks}</p>
           ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
           {hasA ? (
            <span className="inline-flex items-center gap-1 text-warning" title="排程提醒">
             <Bell className="h-4 w-4" aria-hidden />
             {a.trial ? (
              <span title="試堂" className="inline-flex">
               <GraduationCap className="h-4 w-4" aria-hidden />
              </span>
             ) : null}
             {a.makeup ? (
              <span title="請假／補堂" className="inline-flex">
               <RefreshCw className="h-4 w-4" aria-hidden />
              </span>
             ) : null}
             {a.record ? (
              <span title="錄影" className="inline-flex">
               <Video className="h-4 w-4" aria-hidden />
              </span>
             ) : null}
             {a.leave ? (
              <span title="請假" className="inline-flex">
               <XCircle className="h-4 w-4" aria-hidden />
              </span>
             ) : null}
            </span>
           ) : scheduleAlertsState === "error" ? (
            <span className="text-xs text-destructive">提醒未能載入</span>
           ) : scheduleAlertsState === "ready" ? (
            <span className="text-xs text-muted-foreground">無特別提醒</span>
           ) : null}
           <Button variant="outline" size="sm" className="text-sm" asChild>
            <Link to={`/Schedule/${s.id}`}>排程詳情</Link>
           </Button>
          </div>
         </div>
        </li>
       )
      })}
     </ul>
    )}
   </section>

   {/* 手機僅保留請假提醒；班別列表改為捷徑（完整列表在班別頁） */}
   {isMobile ? (
    <div className="space-y-4">
     <Link
      to="/Classes"
      className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
     >
      <span className="flex items-center gap-2 font-semibold text-foreground">
       <BookOpen className="h-5 w-5 text-info" />
       我的班別
      </span>
      <span className="text-sm text-muted-foreground">{classes.length} 班 →</span>
     </Link>
     <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <Link
       to="/Schedule"
       className="inline-flex items-center gap-2 text-lg font-semibold text-foreground"
      >
       <Bell className="h-5 w-5 text-warning" />
       近日請假與補堂
      </Link>
      {loading || leavesKind === "loading" ? (
       <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        載入中…
       </p>
      ) : leavesKind === "error" ? (
       <p className="mt-3 text-sm text-destructive" role="alert">請假資料未能載入。</p>
      ) : leavesKind === "empty" ? (
       <p className="mt-3 text-sm text-muted-foreground">沒有相關紀錄。</p>
      ) : (
       <ul className="mt-3 space-y-2">
        {leaves.slice(0, 5).map((r) => (
         <li key={r.id} className="rounded-lg border border-border/80 bg-background/80 px-3 py-2 text-sm">
          <div className="font-medium text-foreground">{r.studentName}</div>
          <div className="text-muted-foreground">
           {r.classLabel} · {r.leaveDate} · {r.status}
          </div>
         </li>
        ))}
       </ul>
      )}
     </section>
    </div>
   ) : (
   <div className="grid gap-6 lg:grid-cols-2">
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow duration-200 hover:shadow-md md:p-6">
     <Link
      to="/Classes"
      className={cn(
       "group inline-flex items-center rounded-lg text-xl font-semibold outline-none transition-colors md:text-2xl",
       "hover:text-info focus-visible:ring-2 focus-visible:ring-info/40 focus-visible:ring-offset-2"
      )}
     >
      <span className="underline-offset-4 group-hover:underline">我的班別</span>
     </Link>
     {loading ? (
      <p className="mt-3 text-muted-foreground">載入中…</p>
     ) : classes.length === 0 ? (
      <p className="mt-3 text-muted-foreground">尚無指派班別。</p>
     ) : (
      <ul className="mt-4 divide-y divide-border">
       {classes.map((c) => (
        <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
         <div>
          <Link to={`/Classes/${c.id}`} className="font-semibold text-primary hover:underline">
           {classDisplayName({ subject: c.subject, courseName: c.course_name })}
          </Link>
          {c.course_code_full ? (
           <span className="ml-2 font-mono text-sm text-muted-foreground">{c.course_code_full}</span>
          ) : null}
          <div className="text-sm text-muted-foreground md:text-base">
           {(c.grade ?? []).join("、")} · {formatWeekdaysDisplay(c.day_of_week)} {c.time_slot}
          </div>
         </div>
         <Button variant="ghost" size="sm" asChild>
          <Link to={`/Classes/${c.id}`}>開啟</Link>
         </Button>
        </li>
       ))}
      </ul>
     )}
    </section>

    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow duration-200 hover:shadow-md md:p-6">
     <Link
      to="/Schedule"
      className={cn(
       "group inline-flex items-center rounded-lg text-xl font-semibold outline-none transition-colors md:text-2xl",
       "hover:text-warning focus-visible:ring-2 focus-visible:ring-warning/40 focus-visible:ring-offset-2"
      )}
     >
      <span className="underline-offset-4 group-hover:underline">近日請假與補堂</span>
     </Link>
     {loading || leavesKind === "loading" ? (
      <p className="mt-3 flex items-center gap-2 text-muted-foreground">
       <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
       載入中…
      </p>
     ) : leavesKind === "error" ? (
      <p className="mt-3 text-destructive" role="alert">請假資料未能載入。</p>
     ) : leavesKind === "empty" ? (
      <p className="mt-3 text-muted-foreground">沒有相關紀錄。</p>
     ) : (
      <ul className="mt-4 space-y-3">
       {leaves.slice(0, 8).map((r) => (
        <li key={r.id} className="rounded-lg border border-border/80 bg-background/80 px-3 py-2 text-sm md:text-base">
         <div className="font-medium text-foreground">{r.studentName}</div>
         <div className="text-muted-foreground">
          {r.classLabel} · {r.leaveDate} · {r.leaveReason ?? "—"} · 補課：{r.makeupType ?? "—"} ·{" "}
          {r.status}
         </div>
         {r.scheduleId ? (
          <Link to={`/Schedule/${r.scheduleId}`} className="mt-1 inline-block text-sm font-medium text-primary hover:underline">
           對應排程
          </Link>
         ) : null}
        </li>
       ))}
      </ul>
     )}
    </section>
   </div>
   )}

   {trialsKind === "error" ? (
    <section className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5 shadow-sm md:p-6" role="alert">
     <h2 className="flex items-center gap-2 text-xl font-semibold md:text-2xl">
      <Sparkles className="h-6 w-6 text-info" />
      即將試堂（我的班）
     </h2>
     <p className="mt-3 text-sm text-destructive">試堂資料未能載入。</p>
    </section>
   ) : trialsKind === "rows" ? (
    <section className="rounded-2xl border border-info/30 bg-info/5 p-5 shadow-sm md:p-6">
     <h2 className="flex items-center gap-2 text-xl font-semibold md:text-2xl">
      <Sparkles className="h-6 w-6 text-info" />
      即將試堂（我的班）
     </h2>
     <ul className="mt-4 space-y-2">
      {trials.map((t) => (
       <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <span>
         <span className="font-medium">{t.studentName}</span>
         <span className="text-muted-foreground"> · {t.classLabel} · {t.trialDate}</span>
        </span>
        <Tag tone={statusToTagTone(t.status)} size="sm">
         {t.status}
        </Tag>
       </li>
      ))}
     </ul>
    </section>
   ) : null}

  </div>
 )
}
