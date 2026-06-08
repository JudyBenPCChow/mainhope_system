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

import { TeacherWeekTimetable, weekItemsFromManageRows } from "@/components/teachers/TeacherWeekTimetable"
import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { statusToTagTone } from "@/lib/statusTag"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import { cn } from "@/lib/utils"
import { formatClassLabel, classDisplayName } from "@/lib/courseLabel"
import { fetchAllClasses, type ClassRecord } from "@/services/classQueries"
import { fetchLeaveRowsForClassIds, type TeacherPortalLeaveRow } from "@/services/leaveQueries"
import { fetchSchedulesInRange, type ScheduleManageRow } from "@/services/scheduleQueries"
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
 trialIds: Set<string>
): { trial: boolean; makeup: boolean; leave: boolean; record: boolean } {
 let record = /錄影|錄像|錄音/.test(remarks ?? "")
 const trial = trialIds.has(scheduleId)
 let leave = false
 let makeup = false
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
 return { trial, makeup, leave, record }
}

export function TeacherHomeView() {
 const teacherId = getTeacherScopeTeacherId()
 const [teacherName, setTeacherName] = useState<string>("老師")
 const [classes, setClasses] = useState<ClassRecord[]>([])
 const [schedules, setSchedules] = useState<ScheduleManageRow[]>([])
 const [leaves, setLeaves] = useState<TeacherPortalLeaveRow[]>([])
 const [trials, setTrials] = useState<TrialBrief[]>([])
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

   const classIds = mine.map((c) => c.id)
   if (classIds.length === 0) {
    setLeaves([])
    setTrials([])
    return
   }

   // 次要資料（請假/試堂）失敗時不阻斷首頁主內容（課堂卡、週時間表、班別）
   let partialFailed = false

   try {
    const leaveList = await fetchLeaveRowsForClassIds(classIds, 50)
    setLeaves(leaveList)
   } catch (e) {
    reportUserFacingError(e, { source: "TeacherHomeView.loadLeaves" })
    partialFailed = true
    setLeaves([])
   }

   try {
    if (!supabase) {
      setTrials([])
    } else {
      const trialRes = await supabase
        .from("trial_sessions")
        .select(
          "id, trial_date, status, schedule_id, class_id, students ( full_name ), classes ( subject, course_code, courses ( course_name ) )"
        )
        .in("class_id", classIds)
        .gte("trial_date", today)
        .order("trial_date", { ascending: true })
      if (trialRes.error) throw trialRes.error
      setTrials(
        (trialRes.data ?? []).map((row) => {
          const r = row as Record<string, unknown>
          const st = r.students as Record<string, unknown> | null
          const cls = r.classes as Record<string, unknown> | null
          const sub = cls?.subject != null ? String(cls.subject) : "—"
          const code = cls?.course_code != null ? String(cls.course_code) : ""
          const course = cls?.courses as Record<string, unknown> | null
          const courseName = course?.course_name != null ? String(course.course_name) : null
          return {
            id: String(r.id),
            studentName: st?.full_name != null ? String(st.full_name) : "—",
            classLabel: formatClassLabel({ subject: sub, courseCode: code, courseName }),
            scheduleId: String(r.schedule_id ?? ""),
            trialDate: String(r.trial_date ?? ""),
            status: String(r.status ?? ""),
          }
        })
      )
    }
   } catch (e) {
    reportUserFacingError(e, { source: "TeacherHomeView.loadTrials" })
    partialFailed = true
    setTrials([])
   }

   if (partialFailed) {
    setErr("部分首頁資料暫時未能載入（請假／試堂），其餘資料已正常顯示。")
   }
  } catch (e) {
   reportUserFacingError(e, { source: "TeacherHomeView.load", setErr })
   setClasses([])
   setSchedules([])
   setLeaves([])
   setTrials([])
  } finally {
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

 if (!teacherId) {
  return (
   <div role="alert" className="rounded-xl border border-warning/40 bg-warning/10 p-6 text-warning">
    <p className="font-medium">未設定教師身分（缺少 teacher_id）。請由登入頁以「專班老師」重新進入。</p>
   </div>
  )
 }

 return (
  <div className="space-y-8 text-base leading-relaxed md:text-lg">
   <header className="rounded-2xl border border-info/30 bg-info/5 p-6 shadow-sm md:p-8">
    <p className="text-sm font-medium uppercase tracking-wide text-info">專班老師工作台</p>
    <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
     {loading ? "載入中…" : `您好，${teacherName}`}
    </h1>
    <p className="mt-3 max-w-3xl text-muted-foreground">
     此頁僅顯示<strong>指派給您</strong>的班別與排程。今日有 {todaySchedules.length} 堂課。
    </p>
    <div className="mt-6 flex flex-wrap gap-3">
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
    <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-destructive">{err}</div>
   ) : null}

   <section className="grid gap-4 md:grid-cols-3" aria-label="本日重點">
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
   </section>

   <section className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow duration-200 hover:shadow-md md:p-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
     <Link
      to="/TeacherTimetable"
      className={cn(
       "group flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1 pr-2 text-xl font-semibold outline-none transition-colors md:text-2xl",
       "hover:text-info focus-visible:ring-2 focus-visible:ring-info/40 focus-visible:ring-offset-2"
      )}
     >
      <CalendarRange className="h-6 w-6 shrink-0 text-info transition-transform group-hover:scale-105" />
      <span className="truncate underline-offset-4 group-hover:underline">本週時間表</span>
     </Link>
     <Button type="button" variant="outline" size="sm" asChild>
      <Link to="/TeacherTimetable">全螢幕檢視</Link>
     </Button>
    </div>
    {loading ? (
     <p className="text-muted-foreground">載入中…</p>
    ) : (
     <TeacherWeekTimetable items={weekItemsFromManageRows(schedules)} />
    )}
   </section>

   <section className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow duration-200 hover:shadow-md md:p-6">
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
       const a = alertTagsForSchedule(s.id, s.remarks ?? null, leaves, trialScheduleIds)
       const hasA = a.trial || a.makeup || a.leave || a.record
       return (
        <li
         key={s.id}
         className="rounded-xl border border-border/80 bg-muted/20 px-4 py-3 transition-colors hover:border-primary/30"
        >
         <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
           <div className="font-semibold text-foreground">
            {s.start_time ?? "—"}–{s.end_time ?? "—"} · {s.classLabel}
           </div>
           <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground md:text-base">
            <span className="inline-flex items-center gap-1">
             <User className="h-4 w-4" />
             {s.teacher_name ?? "—"}
            </span>
            <span>{s.classroom_name ?? "課室未定"}</span>
            <span>{s.enrollCount} 人報讀</span>
           </div>
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
          {c.course_code ? (
           <span className="ml-2 font-mono text-sm text-muted-foreground">{c.course_code}</span>
          ) : null}
          <div className="text-sm text-muted-foreground md:text-base">
           {(c.grade ?? []).join("、")} · {c.day_of_week} {c.time_slot}
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
