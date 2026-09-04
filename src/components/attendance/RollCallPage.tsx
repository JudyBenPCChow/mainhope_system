import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { ClipboardCheck } from "lucide-react"

import { AdminPageHeader } from "@/components/detail/AdminPageHeader"
import {
 RollCallClassPanel,
 type RollCallPanelStats,
} from "@/components/attendance/RollCallClassPanel"
import { Button } from "@/components/ui/button"
import { DateStepper } from "@/components/ui/date-stepper"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { Tag } from "@/components/ui/tag"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/lib/authBootstrap"
import { buildRollCallScheduleEntries } from "@/lib/consecutiveLesson"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import {
 fetchSchedulesForRollCallDate,
 localYmd,
} from "@/services/attendanceQueries"
import { countPendingMakeupRecords } from "@/services/leaveQueries"
import type { ScheduleManageRow } from "@/services/scheduleQueries"
import { usesSharedAppShell } from "@/lib/mgmtRole"

function parseYmd(raw: string | null): string | null {
 const v = raw?.slice(0, 10) ?? ""
 return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null
}

export function RollCallPage() {
 const isMobile = useIsMobile()
 const { profile, role } = useAuth()
 const [searchParams] = useSearchParams()
 const urlScheduleId = searchParams.get("schedule_id")?.trim() || null
 const urlDate = parseYmd(searchParams.get("date"))
 const teacherTid = getTeacherScopeTeacherId(profile)
 const [dateYmd, setDateYmd] = useState(() => urlDate ?? localYmd())
 const [schedules, setSchedules] = useState<ScheduleManageRow[]>([])
 const [pendingMakeup, setPendingMakeup] = useState<number | null>(null)
 const [loadingList, setLoadingList] = useState(true)
 const [err, setErr] = useState<string | null>(null)
 const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set())
 const [panelStats, setPanelStats] = useState<Map<string, RollCallPanelStats>>(() => new Map())
 const dateEditable = true

 const rollCallEntries = useMemo(
  () =>
   buildRollCallScheduleEntries(
    schedules.map((s) => ({
     id: s.id,
     scheduled_date: s.scheduled_date,
     start_time: s.start_time,
     end_time: s.end_time,
     class_id: s.class_id,
     classLabel: s.classLabel,
     course_code_full: s.course_code_full,
     teacher_name: s.teacher_name,
     session_number: s.session_number ?? null,
     consecutive_group_id: s.consecutive_group_id ?? null,
     consecutive_slot_index: s.consecutive_slot_index ?? null,
    }))
   ),
  [schedules]
 )

 const scheduleMetaById = useMemo(() => {
  const m = new Map<string, ScheduleManageRow>()
  for (const s of schedules) m.set(s.id, s)
  return m
 }, [schedules])

 const reloadList = useCallback(async () => {
  if (!isSupabaseConfigured) return
  setLoadingList(true)
  setErr(null)
  setPendingMakeup(null)
  try {
   const list = await fetchSchedulesForRollCallDate(dateYmd, teacherTid)
   setSchedules(list)
   const entries = buildRollCallScheduleEntries(
    list.map((s) => ({
     id: s.id,
     scheduled_date: s.scheduled_date,
     start_time: s.start_time,
     end_time: s.end_time,
     class_id: s.class_id,
     classLabel: s.classLabel,
     course_code_full: s.course_code_full,
     teacher_name: s.teacher_name,
     session_number: s.session_number ?? null,
     consecutive_group_id: s.consecutive_group_id ?? null,
     consecutive_slot_index: s.consecutive_slot_index ?? null,
    }))
   )
   setPanelStats(new Map())
   setExpandedKeys(() => {
    const next = new Set<string>()
    if (urlScheduleId) {
     const entry = entries.find((e) => e.scheduleIds.includes(urlScheduleId))
     if (entry) {
      next.add(entry.key)
      return next
     }
    }
    if (entries[0]) next.add(entries[0].key)
    return next
   })
  } catch (e) {
   reportUserFacingError(e, { source: "RollCallPage.loadSchedules", setErr })
   setSchedules([])
   setExpandedKeys(new Set())
   setPanelStats(new Map())
  } finally {
   setLoadingList(false)
  }
  try {
   setPendingMakeup(await countPendingMakeupRecords())
  } catch {
   setPendingMakeup(null)
  }
 }, [dateYmd, teacherTid, urlScheduleId])

 useEffect(() => {
  if (urlDate && urlDate !== dateYmd) setDateYmd(urlDate)
 }, [urlDate, dateYmd])

 useEffect(() => {
  void reloadList()
 }, [reloadList])

 const handlePanelStats = useCallback((stats: RollCallPanelStats) => {
  setPanelStats((prev) => {
   const existing = prev.get(stats.key)
   if (
    existing &&
    existing.loaded === stats.loaded &&
    existing.savedFilled === stats.savedFilled &&
    existing.studentCount === stats.studentCount &&
    existing.rollCallSaved === stats.rollCallSaved &&
    existing.isDirty === stats.isDirty
   ) {
    return prev
   }
   return new Map(prev).set(stats.key, stats)
  })
 }, [])

 const setPanelOpen = useCallback((key: string, open: boolean) => {
  setExpandedKeys((prev) => {
   const next = new Set(prev)
   if (open) next.add(key)
   else next.delete(key)
   return next
  })
 }, [])

 const expandAll = () => {
  setExpandedKeys(new Set(rollCallEntries.map((e) => e.key)))
 }

 const collapseAll = () => {
  setExpandedKeys(new Set())
 }

 const savedFilledTotal = useMemo(() => {
  let n = 0
  for (const s of panelStats.values()) {
   if (s.loaded) n += s.savedFilled
  }
  return n
 }, [panelStats])

 const savedSessionCount = useMemo(() => {
  let n = 0
  for (const entry of rollCallEntries) {
   const s = panelStats.get(entry.key)
   if (s?.loaded && s.rollCallSaved) n++
  }
  return n
 }, [panelStats, rollCallEntries])

 const dirtyCount = useMemo(() => {
  let n = 0
  for (const s of panelStats.values()) {
   if (s.isDirty) n++
  }
  return n
 }, [panelStats])

 if (!isSupabaseConfigured) {
  return (
   <div role="alert" className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
    尚未設定 Supabase（請建立 <code className="rounded bg-white/60 px-1">.env</code>）。
   </div>
  )
 }

 return (
  <div className="space-y-4">
   {usesSharedAppShell(role) ? (
    <AdminPageHeader
     eyebrow="行政工作"
     title="點名"
     description="進入今日課堂並完成點名。"
     titleExtra={
      pendingMakeup != null && pendingMakeup > 0 ? (
       <Tag tone="warning" size="sm">
        {pendingMakeup} 待補課
       </Tag>
      ) : null
     }
    />
   ) : (
    <header className="flex flex-wrap items-start justify-between gap-3">
     <div>
      <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
       <ClipboardCheck className="h-7 w-7 text-success" aria-hidden />
       進行點名
       {pendingMakeup != null && pendingMakeup > 0 ? (
        <Tag tone="warning" size="sm">
         {pendingMakeup} 待補課
        </Tag>
       ) : null}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
       {teacherTid
        ? "僅見您指派的班別在該日的排程；展開摺疊面板即可點名。"
        : isMobile
          ? "列出當日班別，展開即可點名。"
          : "同時列出當日所有班別，展開摺疊面板即可點名。預填會合併班內名單、請假與補堂排程。"}
      </p>
     </div>
    </header>
   )}

   {teacherTid ? (
    <div className="rounded-lg border border-info bg-info/90 px-3 py-2 text-sm text-info-foreground">
     專班老師檢視：日期與排程清單僅含<strong>您指派的班別</strong>。
    </div>
   ) : null}

   {err ? (
    <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
     {err}
    </div>
   ) : null}

   <section className="grid grid-cols-2 gap-2 md:gap-3">
    <div className="rounded-xl border border-success bg-success p-2.5 text-success-foreground shadow-sm md:p-4">
     <div className="text-[11px] font-medium text-success-foreground/90 md:text-sm">已儲存人次</div>
     <p className="mt-1 text-xl font-bold tabular-nums md:mt-2 md:text-3xl">{savedFilledTotal}</p>
     <p className="mt-1 hidden text-xs text-success-foreground/85 md:block">
      當日已寫入資料庫的人次 · 已點名 {savedSessionCount} / {rollCallEntries.length} 堂
     </p>
    </div>
    <div className="rounded-xl border border-warning bg-warning p-2.5 text-warning-foreground shadow-sm md:p-4">
     <div className="text-[11px] font-medium text-warning-foreground/90 md:text-sm">今日堂數</div>
     <p className="mt-1 text-xl font-bold tabular-nums md:mt-2 md:text-3xl">{rollCallEntries.length}</p>
     <p className="mt-1 hidden text-xs text-warning-foreground/85 md:block">所選日期可點名項目（連堂已合併；已排除取消）</p>
    </div>
   </section>

   <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
    <div className="grid w-full gap-1 text-xs text-muted-foreground sm:w-auto">
     <span>日期</span>
     <DateStepper
      value={dateYmd}
      onChange={setDateYmd}
      className="w-full sm:w-auto"
      inputClassName="w-full min-w-0 sm:w-[12rem]"
     />
    </div>
    <Button
     type="button"
     variant="outline"
     className="h-10 border-amber-400/80"
     onClick={() => setDateYmd(localYmd())}
    >
     今天
    </Button>
    <div className="flex flex-wrap gap-2">
     <Button
      type="button"
      variant="outline"
      className="h-10"
      disabled={rollCallEntries.length === 0}
      onClick={expandAll}
     >
      全部展開
     </Button>
     <Button
      type="button"
      variant="outline"
      className="h-10"
      disabled={expandedKeys.size === 0}
      onClick={collapseAll}
     >
      全部收合
     </Button>
    </div>
    <div className="ml-auto flex flex-wrap items-center gap-2">
     {dirtyCount > 0 ? (
      <Tag tone="warning" size="sm">
       {dirtyCount} 堂未儲存變更
      </Tag>
     ) : null}
    </div>
   </div>

   {loadingList ? (
    <p className="text-sm text-muted-foreground">載入排程…</p>
   ) : rollCallEntries.length === 0 ? (
    <p className="py-12 text-center text-sm text-muted-foreground">此日期沒有可點名的排程</p>
   ) : (
    <StaggerList as="div" className="space-y-3">
     {rollCallEntries.map((entry) => {
      const firstId = entry.scheduleIds[0]
      const meta = firstId ? scheduleMetaById.get(firstId) ?? null : null
      return (
       <StaggerItem key={entry.key} as="div">
        <RollCallClassPanel
         entry={entry}
         scheduleMeta={meta}
         open={expandedKeys.has(entry.key)}
         onOpenChange={(open) => setPanelOpen(entry.key, open)}
         dateEditable={dateEditable}
         teacherTid={teacherTid}
         isMobile={isMobile}
         onStats={handlePanelStats}
        />
       </StaggerItem>
      )
     })}
    </StaggerList>
   )}
  </div>
 )
}
