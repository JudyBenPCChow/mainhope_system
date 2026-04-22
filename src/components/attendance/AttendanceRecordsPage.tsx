import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
 BarChart3,
 CalendarDays,
 ClipboardList,
 LayoutGrid,
 Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import { cn } from "@/lib/utils"
import { fetchAllClasses } from "@/services/classQueries"
import {
 aggregateAttendanceByDate,
 fetchAttendanceDashboardForDate,
 fetchAttendanceRecordsInRange,
 groupRecordsByClass,
 localYmd,
 type AttendanceRecordRow,
} from "@/services/attendanceQueries"
type ViewMode = "today" | "month" | "kanban"

function formatLoadError(e: unknown): string {
 if (e instanceof Error) return e.message
 if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message)
 return "載入失敗"
}

function monthRange(ym: string): { from: string; to: string } {
 const [y, m] = ym.split("-").map(Number)
 const last = new Date(y, m, 0)
 const from = `${y}-${String(m).padStart(2, "0")}-01`
 const to = localYmd(last)
 return { from, to }
}

function statusBadgeClass(status: string): string {
 if (status.includes("出席")) return "border-emerald-300 bg-emerald-50 text-emerald-900"
 if (status.includes("缺席")) return "border-red-300 bg-red-50 text-red-900"
 if (status.includes("請假") || status.includes("假")) return "border-amber-300 bg-amber-50 text-amber-900"
 if (status.includes("補")) return "border-sky-300 bg-sky-50 text-sky-900"
 if (status.includes("網課") || status.includes("線上")) return "border-sky-300 bg-sky-50 text-sky-900"
 return "border-border bg-muted text-foreground"
}

export function AttendanceRecordsPage() {
 const teacherTid = getTeacherScopeTeacherId()
 const [viewMode, setViewMode] = useState<ViewMode>("today")
 const [focusDay, setFocusDay] = useState(() => localYmd())
 const [monthYm, setMonthYm] = useState(() => localYmd().slice(0, 7))

 const [rows, setRows] = useState<AttendanceRecordRow[]>([])
 const [scopeClassIds, setScopeClassIds] = useState<Set<string> | null>(null)
 const [dayBoard, setDayBoard] = useState<Awaited<ReturnType<typeof fetchAttendanceDashboardForDate>> | null>(null)
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)

 const reload = useCallback(async () => {
  if (!isSupabaseConfigured) return
  setLoading(true)
  setErr(null)
  try {
   if (viewMode === "today") {
    const [rec, d] = await Promise.all([
     fetchAttendanceRecordsInRange(focusDay, focusDay),
     fetchAttendanceDashboardForDate(focusDay),
    ])
    setRows(rec)
    setDayBoard(d)
   } else if (viewMode === "month") {
    const { from, to } = monthRange(monthYm)
    const rec = await fetchAttendanceRecordsInRange(from, to)
    setRows(rec)
    const d = await fetchAttendanceDashboardForDate(focusDay)
    setDayBoard(d)
   } else {
    const rec = await fetchAttendanceRecordsInRange(focusDay, focusDay)
    setRows(rec)
    const d = await fetchAttendanceDashboardForDate(focusDay)
    setDayBoard(d)
   }
  } catch (e) {
   setErr(formatLoadError(e))
   setRows([])
   setDayBoard(null)
  } finally {
   setLoading(false)
  }
 }, [viewMode, focusDay, monthYm])

 useEffect(() => {
  void reload()
 }, [reload])

 useEffect(() => {
  if (!teacherTid) {
   setScopeClassIds(null)
   return
  }
  void fetchAllClasses().then((all) => {
   setScopeClassIds(new Set(all.filter((c) => c.teacher_id === teacherTid).map((c) => c.id)))
  })
 }, [teacherTid])

 const displayRows = useMemo(() => {
  if (!scopeClassIds) return rows
  return rows.filter((r) => scopeClassIds.has(r.classId))
 }, [rows, scopeClassIds])

 const monthAgg = useMemo(() => aggregateAttendanceByDate(displayRows, monthYm), [displayRows, monthYm])

 const kanbanMap = useMemo(() => groupRecordsByClass(displayRows), [displayRows])

 const kanbanMeta = useMemo(() => {
  const meta = new Map<string, { subject: string; code: string | null }>()
  for (const r of displayRows) {
   if (!meta.has(r.classId)) {
    meta.set(r.classId, { subject: r.classSubject ?? "—", code: r.courseCode })
   }
  }
  return meta
 }, [displayRows])

 if (!isSupabaseConfigured) {
  return (
   <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
    尚未設定 Supabase（請建立 <code className="rounded bg-white/60 px-1">.env</code>）。
   </div>
  )
 }

 const s = dayBoard?.stats

 return (
  <div className="space-y-4">
   <header>
    <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
     <ClipboardList className="h-7 w-7 text-teal-600" aria-hidden />
     出席紀錄
    </h1>
    <p className="mt-1 text-sm text-muted-foreground">今日列表、月彙總與班別看板；預設顯示今天各班紀錄。</p>
   </header>

   {teacherTid ? (
    <div className="rounded-lg border border-sky-200 bg-sky-50/90 px-3 py-2 text-sm text-sky-950">
     專班老師檢視：下方列表、月視表與班別看板僅含<strong>您指派的班別</strong>。頂部四格統計仍為該日<strong>全系統</strong>加總。
    </div>
   ) : null}

   {err ? (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
     {err}
    </div>
   ) : null}

   <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="出席儀表板">
    <div className="rounded-xl border border-teal-200/80 bg-teal-50/50 p-4 shadow-sm">
     <div className="flex items-center gap-2 text-xs font-medium text-teal-900/90">
      <Users className="h-4 w-4" />
      今日紀錄總筆數
     </div>
     <p className="mt-2 text-2xl font-bold tabular-nums text-teal-800">{s?.total ?? 0}</p>
     <p className="mt-1 text-[11px] text-muted-foreground">以「檢視日」{focusDay}</p>
    </div>
    <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4 shadow-sm">
     <div className="text-xs font-medium text-emerald-900/90">出席</div>
     <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-800">{s?.present ?? 0}</p>
    </div>
    <div className="rounded-xl border border-red-200/80 bg-red-50/40 p-4 shadow-sm">
     <div className="text-xs font-medium text-red-900/90">缺席</div>
     <p className="mt-2 text-2xl font-bold tabular-nums text-red-800">{s?.absent ?? 0}</p>
    </div>
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 shadow-sm">
     <div className="text-xs font-medium text-amber-900/90">請假 · 補課 · 網課</div>
     <p className="mt-2 text-lg font-bold tabular-nums text-amber-900">
      {(s?.leave ?? 0) + (s?.makeup ?? 0) + (s?.online ?? 0)}
     </p>
     <p className="mt-1 text-[11px] text-muted-foreground">
      假 {s?.leave ?? 0} / 補 {s?.makeup ?? 0} / 網 {s?.online ?? 0}
     </p>
    </div>
   </section>

   <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
    <div
     className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5"
     role="tablist"
     aria-label="紀錄檢視"
    >
     {(
      [
       ["today", "今日", CalendarDays],
       ["month", "月視表", BarChart3],
       ["kanban", "班別看板", LayoutGrid],
      ] as const
     ).map(([id, label, Icon]) => (
      <button
       key={id}
       type="button"
       role="tab"
       aria-selected={viewMode === id}
       onClick={() => setViewMode(id)}
       className={cn(
        "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium sm:text-sm",
        viewMode === id
         ? "bg-primary text-primary-foreground shadow-sm"
         : "text-muted-foreground hover:bg-background"
       )}
      >
       <Icon className="h-3.5 w-3.5" />
       {label}
      </button>
     ))}
    </div>
    <div className="flex flex-wrap items-center gap-2">
     {viewMode === "month" ? (
      <label className="grid gap-1 text-xs text-muted-foreground">
       <span>月份</span>
       <Input
        type="month"
        value={monthYm}
        onChange={(e) => setMonthYm(e.target.value)}
        className="h-9 w-[11rem]"
       />
      </label>
     ) : null}
     <label className="grid gap-1 text-xs text-muted-foreground">
      <span>{viewMode === "month" ? "對照日（儀表板）" : "日期"}</span>
      <div className="flex gap-2">
       <Input type="date" value={focusDay} onChange={(e) => setFocusDay(e.target.value)} className="h-9 w-[11rem]" />
       <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => setFocusDay(localYmd())}>
        今天
       </Button>
      </div>
     </label>
    </div>
   </div>

   {loading ? (
    <p className="text-sm text-muted-foreground">載入中…</p>
   ) : viewMode === "month" ? (
    <div className="space-y-4">
     <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full min-w-[640px] table-fixed border-collapse text-sm">
       <thead>
        <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
         <th className="w-[18%] px-3 py-2 font-medium">日期</th>
         <th className="w-[12%] px-3 py-2 font-medium">筆數</th>
         <th className="w-[14%] px-3 py-2 font-medium">出席</th>
         <th className="w-[14%] px-3 py-2 font-medium">缺席</th>
         <th className="w-[14%] px-3 py-2 font-medium">請假</th>
         <th className="w-[14%] px-3 py-2 font-medium">補課</th>
         <th className="w-[14%] px-3 py-2 font-medium">網課</th>
        </tr>
       </thead>
       <tbody>
        {monthAgg.length === 0 ? (
         <tr>
          <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
           此月份尚無紀錄
          </td>
         </tr>
        ) : (
         monthAgg.map((d) => (
          <tr key={d.date} className="border-b border-border last:border-0">
           <td className="px-3 py-2 font-medium tabular-nums">{d.date}</td>
           <td className="px-3 py-2 tabular-nums">{d.total}</td>
           <td className="px-3 py-2 tabular-nums text-emerald-800">{d.present}</td>
           <td className="px-3 py-2 tabular-nums text-red-800">{d.absent}</td>
           <td className="px-3 py-2 tabular-nums">{d.leave}</td>
           <td className="px-3 py-2 tabular-nums">{d.makeup}</td>
           <td className="px-3 py-2 tabular-nums">{d.online}</td>
          </tr>
         ))
        )}
       </tbody>
      </table>
     </div>
     <p className="text-xs text-muted-foreground">
      月視表統計涵蓋 {monthRange(monthYm).from} ～ {monthRange(monthYm).to}；點「今天」可快速回到本日對照。
     </p>
    </div>
   ) : viewMode === "kanban" ? (
    <div className="space-y-3">
     <p className="text-sm text-muted-foreground">
      看板日期：<span className="font-medium text-foreground">{focusDay}</span>（可於上方更改）
     </p>
     {kanbanMap.size === 0 ? (
      <p className="py-12 text-center text-sm text-muted-foreground">此日尚無出席紀錄</p>
     ) : (
      <div className="flex gap-3 overflow-x-auto pb-2">
       {[...kanbanMap.entries()].map(([classId, list]) => {
        const meta = kanbanMeta.get(classId)
        return (
         <div
          key={classId}
          className="min-w-[16rem] max-w-[20rem] flex-shrink-0 rounded-xl border border-border bg-muted/20 shadow-sm"
         >
          <div className="border-b border-border bg-card px-3 py-2">
           <Link
            to={`/Classes/${classId}`}
            className="text-sm font-semibold text-sky-700 hover:underline"
           >
            {meta?.subject ?? "班別"}
           </Link>
           {meta?.code ? (
            <div className="font-mono text-xs text-muted-foreground">{meta.code}</div>
           ) : null}
           <div className="text-xs text-muted-foreground">{list.length} 筆</div>
          </div>
          <ul className="max-h-[28rem] space-y-2 overflow-y-auto p-2">
           {list.map((r) => (
            <li
             key={r.id}
             className="rounded-lg border border-border bg-card p-2 text-xs shadow-sm"
            >
             <div className="flex items-start justify-between gap-2">
              <Link
               to={`/Students/${r.studentId}`}
               className="font-medium text-sky-700 hover:underline"
              >
               {r.studentName ?? "—"}
              </Link>
              <span
               className={cn(
                "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                statusBadgeClass(r.status)
               )}
              >
               {r.status}
              </span>
             </div>
             <div className="mt-1 text-muted-foreground">{r.studentGrade ?? "—"}</div>
            </li>
           ))}
          </ul>
         </div>
        )
       })}
      </div>
     )}
    </div>
   ) : (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
     <table className="w-full min-w-[800px] table-fixed border-collapse text-sm">
      <thead>
       <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
        <th className="w-[14%] px-3 py-2 font-medium">日期</th>
        <th className="w-[22%] px-3 py-2 font-medium">學生</th>
        <th className="w-[24%] px-3 py-2 font-medium">班別</th>
        <th className="w-[18%] px-3 py-2 font-medium">狀態</th>
        <th className="w-[22%] px-3 py-2 font-medium">備註</th>
       </tr>
      </thead>
      <tbody>
       {displayRows.length === 0 ? (
        <tr>
         <td colSpan={5} className="px-3 py-12 text-center text-muted-foreground">
          此日尚無紀錄
         </td>
        </tr>
       ) : (
        displayRows.map((r) => (
         <tr key={r.id} className="border-b border-border last:border-0">
          <td className="px-3 py-2 tabular-nums text-muted-foreground">{r.attendanceDate}</td>
          <td className="px-3 py-2">
           <Link to={`/Students/${r.studentId}`} className="font-medium text-sky-700 hover:underline">
            {r.studentName ?? "—"}
           </Link>
           <div className="text-xs text-muted-foreground">{r.studentGrade ?? "—"}</div>
          </td>
          <td className="px-3 py-2">
           <Link to={`/Classes/${r.classId}`} className="font-medium text-sky-700 hover:underline">
            {r.classSubject ?? "—"}
           </Link>
           {r.courseCode ? (
            <div className="font-mono text-xs text-muted-foreground">{r.courseCode}</div>
           ) : null}
          </td>
          <td className="px-3 py-2">
           <span
            className={cn(
             "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
             statusBadgeClass(r.status)
            )}
           >
            {r.status}
           </span>
          </td>
          <td className="px-3 py-2 text-xs text-muted-foreground">{r.remarks ?? "—"}</td>
         </tr>
        ))
       )}
      </tbody>
     </table>
     <div className="border-t border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
      共 {displayRows.length} 筆（{focusDay}）
     </div>
    </div>
   )}
  </div>
 )
}
