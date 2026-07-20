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
import { statusToTagTone } from "@/lib/statusTag"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import { cn } from "@/lib/utils"
import { formatClassLabel, classDisplayName } from "@/lib/courseLabel"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import { fetchAllClasses, type ClassRecord } from "@/services/classQueries"
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
import { addDaysYmd, getTeacherById, localYmd } from "@/services/teacherQueries"
import { supabase } from "@/lib/supabaseClient"

/** 向後／向前載入日數，供首頁週視圖翻週與今日列表 */
const SCHEDULE_PAST_DAYS = 28
const SCHEDULE_FUTURE_DAYS = 98

type TrialBrief = {
 id: string
 studentName: string
 classLabel: string
 scheduleId: string
 trialDate: string
 status: string
}

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
 const [teacherName, setTeacherName] = useState<string>("老師")
 const [classes, setClasses] = useState<ClassRecord[]>([])
 const [schedules, setSchedules] = useState<ScheduleManageRow[]>([])
 const [leaves, setLeaves] = useState<TeacherPortalLeaveRow[]>([])
 const [trials, setTrials] = useState<TrialBrief[]>([])
 const [scheduleAlerts, setScheduleAlerts] = useState<Map<string, ScheduleAlerts>>(new Map())
 const [pendingRollCalls, setPendingRollCalls] = useState<PendingRollCallReminder[]>([])
 const [pastPendingRollCalls, setPastPendingRollCalls] = useState<PendingRollCallReminder[]>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)

 const today = localYmd()
 const scheduleFrom = useMemo(() => addDaysYmd(today, -SCHEDULE_PAST_DAYS), [today])
 const scheduleTo = useMemo(() => addDaysYmd(today, SCHEDULE_FUTURE_DAYS), [today])

 const load = useCallback(async () => {
  if (!isSupabaseConfigured || !teacherId) {
   setLoading(false)
   return
  }
  setLoading(true)
  setErr(null)
  try {
   const [tch, allClasses, schedList] = await Promise.all([
    getTeacherById(teacherId),
    fetchAllClasses(),
    fetchSchedulesInRange(scheduleFrom, scheduleTo, { teacherId }),
   ])
   if (tch) setTeacherName(tch.full_name)
   const mine = allClasses.filter((c) => c.teacher_id === teacherId)
   setClasses(mine.sort((a, b) => a.subject.localeCompare(b.subject, "zh-Hant")))
   setSchedules(schedList)
   setLoading(false)

   const classIds = mine.map((c) => c.id)
   if (classIds.length === 0) {
    setLeaves([])
    setTrials([])
    setScheduleAlerts(new Map())
    setPendingRollCalls([])
    setPastPendingRollCalls([])
    return
   }

   // 次要資料（請假/試堂/未點名／排程警示）並行；失敗時不阻斷主內容
   const [leaveRes, trialRes, rollRes, pastRollRes, alertsRes] = await Promise.allSettled([
    fetchLeaveRowsForClassIds(classIds, 50),
    (async () => {
     if (!supabase) return [] as TrialBrief[]
     const chunks = await forEachIdChunk(classIds, DEFAULT_ID_CHUNK, async (slice) => {
      const { data, error } = await supabase!
       .from("trial_sessions")
       .select(
        "id, trial_date, status, schedule_id, class_id, students ( full_name ), classes ( subject, course_code_full, courses ( course_name ) )"
       )
       .in("class_id", slice)
       .gte("trial_date", today)
       .order("trial_date", { ascending: true })
      if (error) throw error
      return data ?? []
     })
     return chunks.flat().map((row) => {
      const r = row as Record<string, unknown>
      const st = r.students as Record<string, unknown> | null
      const cls = r.classes as Record<string, unknown> | null
      const sub = cls?.subject != null ? String(cls.subject) : "—"
      const code = cls?.course_code_full != null ? String(cls.course_code_full) : ""
      const course = cls?.courses as Record<string, unknown> | null
      const courseName = course?.course_name != null ? String(course.course_name) : null
      return {
       id: String(r.id),
       studentName: st?.full_name != null ? String(st.full_name) : "—",
       classLabel: formatClassLabel({ subject: sub, courseCode: code, courseName }),
       scheduleId: String(r.schedule_id ?? ""),
       trialDate: String(r.trial_date ?? ""),
       status: String(r.status ?? ""),
      } satisfies TrialBrief
     })
    })(),
    fetchPendingRollCallRemindersForTeacher(teacherId, today),
    findSchedulesMissingAttendance(
     schedList.filter((s) => s.scheduled_date < today && s.class_id != null)
    ),
    fetchScheduleAlerts(schedList),
   ])

   let partialFailed = false
   if (leaveRes.status === "fulfilled") {
    setLeaves(leaveRes.value)
   } else {
    reportUserFacingError(leaveRes.reason, { source: "TeacherHomeView.loadLeaves" })
    partialFailed = true
    setLeaves([])
   }
   if (trialRes.status === "fulfilled") {
    setTrials(trialRes.value)
   } else {
    reportUserFacingError(trialRes.reason, { source: "TeacherHomeView.loadTrials" })
    partialFailed = true
    setTrials([])
   }
   if (rollRes.status === "fulfilled") {
    setPendingRollCalls(rollRes.value)
   } else {
    reportUserFacingError(rollRes.reason, { source: "TeacherHomeView.loadRollCallReminders" })
    partialFailed = true
    setPendingRollCalls([])
   }
   if (pastRollRes.status === "fulfilled") {
    setPastPendingRollCalls(pastRollRes.value)
   } else {
    reportUserFacingError(pastRollRes.reason, { source: "TeacherHomeView.loadPastRollCallReminders" })
    partialFailed = true
    setPastPendingRollCalls([])
   }
   if (alertsRes.status === "fulfilled") {
    setScheduleAlerts(alertsRes.value)
   } else {
    reportUserFacingError(alertsRes.reason, { source: "TeacherHomeView.loadScheduleAlerts" })
    partialFailed = true
    setScheduleAlerts(new Map())
   }

   if (partialFailed) {
    setErr("部分首頁資料暫時未能載入（請假／試堂／點名提醒），其餘資料已正常顯示。")
   }
  } catch (e) {
   reportUserFacingError(e, { source: "TeacherHomeView.load", setErr })
   setClasses([])
   setSchedules([])
   setLeaves([])
   setTrials([])
   setScheduleAlerts(new Map())
   setPendingRollCalls([])
   setPastPendingRollCalls([])
   setLoading(false)
  }
 }, [teacherId, today, scheduleFrom, scheduleTo])

 useEffect(() => {
  void load()
 }, [load])

 const trialScheduleIds = useMemo(() => new Set(trials.map((t) => t.scheduleId).filter(Boolean)), [trials])

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
     {loading ? "載入中…" : `您好，${teacherName}`}
    </h1>
    <p className="mt-2 text-sm text-muted-foreground md:mt-3 md:max-w-3xl md:text-base">
     {isMobile ? (
      <>今日有 {todaySchedules.length} 堂課 · 僅顯示指派給您的班別</>
     ) : (
      <>
       此頁僅顯示<strong>指派給您</strong>的班別與排程。今日有 {todaySchedules.length} 堂課。
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
    <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-destructive">{err}</div>
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
      {leaves.filter((l) => l.status.includes("待")).length}
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
     <p className="mt-2 text-4xl font-bold tabular-nums text-warning">{pastPendingRollCalls.length}</p>
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
      <Link to="/TeacherTimetable">{isMobile ? "完整" : "全螢幕檢視"}</Link>
     </Button>
    </div>
    {loading ? (
     <p className="text-muted-foreground">載入中…</p>
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
              {s.teaching_notes?.trim() ? <Tag tone="info" size="sm">已有教學紀錄</Tag> : null}
              {a.trial ? <Tag tone="info" size="sm">試堂</Tag> : null}
              {a.leave ? <Tag tone="warning" size="sm">請假</Tag> : null}
              {a.makeup ? <Tag tone="warning" size="sm">補堂</Tag> : null}
              {a.record ? <Tag tone="default" size="sm">錄影</Tag> : null}
             </div>
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
     <TeacherWeekTimetable items={weekItemsFromManageRows(schedules)} />
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
            <span>{s.enrollCount} 人報讀</span>
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
           ) : (
            <span className="text-xs text-muted-foreground">無特別提醒</span>
           )}
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
      {loading ? (
       <p className="mt-3 text-sm text-muted-foreground">載入中…</p>
      ) : leaves.length === 0 ? (
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
     {loading ? (
      <p className="mt-3 text-muted-foreground">載入中…</p>
     ) : leaves.length === 0 ? (
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

   {trials.length > 0 ? (
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
