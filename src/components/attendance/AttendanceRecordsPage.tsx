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
import { DateRangeInput, type DateRangeValue } from "@/components/ui/date-range-input"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { usePersistentState } from "@/hooks/usePersistentState"
import { useIsMobile } from "@/hooks/use-mobile"
import { MOBILE_BREAKPOINT } from "@/lib/layoutBreakpoint"
import { formatClassLabel } from "@/lib/courseLabel"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { statusToTagTone } from "@/lib/statusTag"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import { cn } from "@/lib/utils"
import { fetchAllClasses } from "@/services/classQueries"
import { fetchAllTeachers } from "@/services/teacherQueries"
import {
 aggregateAttendanceByDate,
 fetchAttendanceRecordsInRange,
 groupRecordsByClass,
 localYmd,
 type AttendanceRecordRow,
} from "@/services/attendanceQueries"
type ViewMode = "today" | "month" | "kanban"

function currentMonthRange(): DateRangeValue {
 const now = new Date()
 const y = now.getFullYear()
 const m = now.getMonth()
 const first = new Date(y, m, 1)
 const last = new Date(y, m + 1, 0)
 return { from: localYmd(first), to: localYmd(last) }
}

function statusCount(rows: AttendanceRecordRow[]) {
 const base = { total: rows.length, present: 0, absent: 0, leave: 0, makeup: 0, online: 0 }
 for (const r of rows) {
  if (r.status === "現場" || r.status.includes("出席")) base.present++
  else if (r.status === "no show" || r.status.includes("缺席")) base.absent++
  else if (
   r.status === "事假" ||
   r.status === "病假" ||
   r.status === "請假" ||
   (r.status.includes("假") && !r.status.includes("補"))
  )
   base.leave++
  else if (
   r.status === "請假而不需補回" ||
   r.status === "不用補回" ||
   r.status.includes("補")
  )
   base.makeup++
  else if (
   r.status === "錄影回放" ||
   r.status === "zoom實時網課" ||
   r.status === "即時直播" ||
   r.status.includes("網課") ||
   r.status.includes("線上")
  )
   base.online++
 }
 return base
}

function getInitialAttendanceViewMode(): ViewMode {
 try {
  const raw = sessionStorage.getItem("mgmt_attendance_records_viewMode")
  if (raw != null) return JSON.parse(raw) as ViewMode
 } catch {
  /* ignore */
 }
 return typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT ? "kanban" : "today"
}

export function AttendanceRecordsPage() {
 const teacherTid = getTeacherScopeTeacherId()
 const isMobile = useIsMobile()
 const [viewMode, setViewMode] = usePersistentState<ViewMode>(
  "mgmt_attendance_records_viewMode",
  getInitialAttendanceViewMode()
 )
 const [dateRange, setDateRange] = useState<DateRangeValue>(() => currentMonthRange())
 const [studentKeyword, setStudentKeyword] = useState("")
 const [classFilter, setClassFilter] = useState("all")
 const [teacherFilter, setTeacherFilter] = useState("all")

 const [rows, setRows] = useState<AttendanceRecordRow[]>([])
 const [classOptions, setClassOptions] = useState<Array<{ id: string; label: string; teacherId: string | null }>>([])
 const [teacherOptions, setTeacherOptions] = useState<Array<{ id: string; name: string }>>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)

 const reload = useCallback(async () => {
  if (!isSupabaseConfigured) return
  setLoading(true)
  setErr(null)
  try {
   const from = dateRange.from || localYmd()
   const to = dateRange.to || from
   const rec = await fetchAttendanceRecordsInRange(from, to)
   setRows(rec)
  } catch (e) {
   reportUserFacingError(e, { source: "AttendanceRecordsPage.reload", setErr })
   setRows([])
  } finally {
   setLoading(false)
  }
 }, [dateRange.from, dateRange.to])

 useEffect(() => {
  void reload()
 }, [reload])

 useEffect(() => {
  void (async () => {
   const all = await fetchAllClasses()
   setClassOptions(
    all.map((c) => ({
     id: c.id,
     label: formatClassLabel({
      subject: c.subject,
      courseCode: c.course_code_full,
      courseName: c.course_name,
     }),
     teacherId: c.teacher_id ?? null,
    }))
   )
  })()
 }, [])

 useEffect(() => {
  void fetchAllTeachers().then((all) => {
   setTeacherOptions(all.map((t) => ({ id: t.id, name: t.full_name })))
  })
 }, [])

 const displayRows = useMemo(() => {
  let next = rows
  if (teacherTid) {
   next = next.filter(
    (r) =>
     r.teacherId === teacherTid ||
     r.originalTeacherId === teacherTid ||
     r.classTeacherId === teacherTid
   )
  }
  const keyword = studentKeyword.trim().toLowerCase()
  if (keyword) {
   next = next.filter((r) => {
    const zh = (r.studentName ?? "").toLowerCase()
    const en = (r.studentEnglishName ?? "").toLowerCase()
    return zh.includes(keyword) || en.includes(keyword)
   })
  }
  if (classFilter !== "all") next = next.filter((r) => r.classId === classFilter)
  const activeTeacherId = teacherTid ?? teacherFilter
  if (activeTeacherId !== "all") {
   next = next.filter(
    (r) =>
     r.teacherId === activeTeacherId ||
     r.originalTeacherId === activeTeacherId ||
     r.classTeacherId === activeTeacherId
   )
  }
  return next
 }, [rows, studentKeyword, classFilter, teacherFilter, teacherTid])

 const monthAgg = useMemo(() => aggregateAttendanceByDate(displayRows), [displayRows])
 const s = useMemo(() => statusCount(displayRows), [displayRows])

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
   <div role="alert" className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
    尚未設定 Supabase（請建立 <code className="rounded bg-white/60 px-1">.env</code>）。
   </div>
  )
 }

 const rangeLabel = dateRange.to ? `${dateRange.from} ～ ${dateRange.to}` : dateRange.from
 const isSingleDay = !dateRange.to || dateRange.to === dateRange.from

 return (
  <div className="space-y-4">
   <header>
    <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight md:text-2xl">
     <ClipboardList className="h-6 w-6 text-primary md:h-7 md:w-7" aria-hidden />
     出席紀錄
    </h1>
    <p className="mt-1.5 hidden text-base leading-relaxed text-neutral-700 md:block">
     今日列表、月彙總與班別看板；預設顯示今天各班紀錄。
    </p>
   </header>

   {teacherTid && !isMobile ? (
   <div className="rounded-lg border border-info bg-info px-4 py-3 text-base leading-relaxed text-info-foreground">
    專班老師檢視：下方資料含<strong>您任教、代堂或原任被代堂</strong>的課堂；老師篩選已自動鎖定為您本人。
    </div>
   ) : null}

   {err ? (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
     {err}
    </div>
   ) : null}

   {isMobile ? (
    <section
     className="grid grid-cols-4 gap-2 rounded-xl border border-border bg-card p-3 text-center shadow-sm"
     aria-label="出席摘要"
    >
     <div>
      <p className="text-lg font-bold tabular-nums text-info">{s?.total ?? 0}</p>
      <p className="text-[11px] text-muted-foreground">總筆數</p>
     </div>
     <div>
      <p className="text-lg font-bold tabular-nums text-success">{s?.present ?? 0}</p>
      <p className="text-[11px] text-muted-foreground">出席</p>
     </div>
     <div>
      <p className="text-lg font-bold tabular-nums text-destructive">{s?.absent ?? 0}</p>
      <p className="text-[11px] text-muted-foreground">缺席</p>
     </div>
     <div>
      <p className="text-lg font-bold tabular-nums text-warning">
       {(s?.leave ?? 0) + (s?.makeup ?? 0) + (s?.online ?? 0)}
      </p>
      <p className="text-[11px] text-muted-foreground">假／補／網</p>
     </div>
    </section>
   ) : (
   <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="出席儀表板">
    <div className="rounded-xl border border-info bg-info p-4 text-info-foreground shadow-sm">
     <div className="flex items-center gap-2 text-sm font-medium text-info-foreground">
      <Users className="h-4 w-4" aria-hidden />
      今日紀錄總筆數
     </div>
     <p className="mt-2 text-2xl font-bold tabular-nums">{s?.total ?? 0}</p>
     <p className="mt-1 text-sm text-info-foreground/90">{rangeLabel || "未選擇日期"}</p>
    </div>
    <div className="rounded-xl border border-success bg-success p-4 text-success-foreground shadow-sm">
     <div className="text-sm font-medium text-success-foreground">出席</div>
     <p className="mt-2 text-2xl font-bold tabular-nums">{s?.present ?? 0}</p>
    </div>
    <div className="rounded-xl border border-destructive bg-destructive p-4 text-destructive-foreground shadow-sm">
     <div className="text-sm font-medium text-destructive-foreground">缺席</div>
     <p className="mt-2 text-2xl font-bold tabular-nums">{s?.absent ?? 0}</p>
    </div>
    <div className="rounded-xl border border-warning bg-warning p-4 text-warning-foreground shadow-sm">
     <div className="text-sm font-medium text-warning-foreground">請假 · 補課 · 網課</div>
     <p className="mt-2 text-lg font-bold tabular-nums">
      {(s?.leave ?? 0) + (s?.makeup ?? 0) + (s?.online ?? 0)}
     </p>
     <p className="mt-1 text-sm text-warning-foreground/90">
      假 {s?.leave ?? 0} / 補 {s?.makeup ?? 0} / 網 {s?.online ?? 0}
     </p>
    </div>
   </section>
   )}

   <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
    <div
     className="inline-flex w-full rounded-lg border border-border bg-muted/30 p-0.5 sm:w-auto"
     role="tablist"
     aria-label="紀錄檢視"
    >
     {(
      [
       ["today", "列表形式", CalendarDays],
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
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
    <DateRangeInput value={dateRange} onChange={setDateRange} className="w-full sm:w-[16rem]" />
    <Button
     type="button"
     variant="outline"
     size="sm"
     className="h-9"
     onClick={() => {
      setDateRange(currentMonthRange())
      setViewMode("month")
     }}
    >
     今月
    </Button>
    <Button
     type="button"
     variant="outline"
     size="sm"
     className="h-9"
     onClick={() => {
      const today = localYmd()
      setDateRange({ from: today, to: "" })
      setViewMode("today")
     }}
    >
     今天
    </Button>
    </div>
   </div>

   <section className="grid gap-2 rounded-xl border border-border bg-card p-3 shadow-sm md:grid-cols-2 xl:grid-cols-4">
    <label className="grid gap-1 text-xs text-muted-foreground">
     <span>學生（中/英）</span>
     <Input
      value={studentKeyword}
      onChange={(e) => setStudentKeyword(e.target.value)}
      placeholder="輸入學生姓名"
      className="h-9"
     />
    </label>
    <label className="grid gap-1 text-xs text-muted-foreground">
     <span>班別（課程名稱 + 代碼）</span>
     <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="h-9">
      <option value="all">全部班別</option>
      {classOptions.map((c) => (
       <option key={c.id} value={c.id}>
        {c.label}
       </option>
      ))}
     </Select>
    </label>
    <label className="grid gap-1 text-xs text-muted-foreground">
     <span>老師</span>
     <Select
      value={teacherTid ?? teacherFilter}
      onChange={(e) => setTeacherFilter(e.target.value)}
      className="h-9"
      disabled={Boolean(teacherTid)}
     >
      <option value="all">全部老師</option>
      {teacherOptions.map((t) => (
       <option key={t.id} value={t.id}>
        {t.name}
       </option>
      ))}
     </Select>
    </label>
    <div className="flex items-end">
     <Button
      type="button"
      variant="ghost"
      className="h-9 px-0 text-muted-foreground"
      onClick={() => {
       setStudentKeyword("")
       setClassFilter("all")
       setTeacherFilter("all")
      }}
     >
      清除篩選
     </Button>
    </div>
   </section>

   {loading ? (
    <p className="text-sm text-muted-foreground">載入中…</p>
   ) : viewMode === "month" ? (
    <div className="space-y-4">
     {isMobile ? (
      <div className="space-y-2">
       {monthAgg.length === 0 ? (
        <p className="rounded-xl border border-border bg-card px-3 py-12 text-center text-sm text-muted-foreground">
         此範圍尚無紀錄
        </p>
       ) : (
        monthAgg.map((d) => (
         <article key={d.date} className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="font-medium tabular-nums">{d.date}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
           <p>筆數 {d.total}</p>
           <p className="text-success">出席 {d.present}</p>
           <p className="text-destructive">缺席 {d.absent}</p>
           <p>請假 {d.leave}</p>
           <p>補課 {d.makeup}</p>
           <p>網課 {d.online}</p>
          </div>
         </article>
        ))
       )}
      </div>
     ) : (
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
           此範圍尚無紀錄
          </td>
         </tr>
        ) : (
         monthAgg.map((d) => (
          <tr key={d.date} className="border-b border-border last:border-0">
           <td className="px-3 py-2 font-medium tabular-nums">{d.date}</td>
           <td className="px-3 py-2 tabular-nums">{d.total}</td>
           <td className="px-3 py-2 tabular-nums text-success">{d.present}</td>
           <td className="px-3 py-2 tabular-nums text-destructive">{d.absent}</td>
           <td className="px-3 py-2 tabular-nums">{d.leave}</td>
           <td className="px-3 py-2 tabular-nums">{d.makeup}</td>
           <td className="px-3 py-2 tabular-nums">{d.online}</td>
          </tr>
         ))
        )}
       </tbody>
      </table>
     </div>
     )}
     <p className="text-xs text-muted-foreground">
      月視表以目前篩選結果彙總；可用「今月」快速切到本月範圍。
     </p>
    </div>
   ) : viewMode === "kanban" ? (
    <div className="space-y-3">
     <p className="text-sm text-muted-foreground">
      看板範圍：<span className="font-medium text-foreground">{rangeLabel}</span>（可於上方更改）
     </p>
     {kanbanMap.size === 0 ? (
      <p className="py-12 text-center text-sm text-muted-foreground">此日尚無出席紀錄</p>
     ) : (
      <div className={cn(isMobile ? "flex flex-col gap-3" : "flex gap-3 overflow-x-auto pb-2")}>
       {[...kanbanMap.entries()].map(([classId, list]) => {
        const meta = kanbanMeta.get(classId)
        return (
         <div
          key={classId}
          className={cn(
           "rounded-xl border border-border bg-muted/20 shadow-sm",
           isMobile ? "w-full" : "min-w-[16rem] max-w-[20rem] flex-shrink-0"
          )}
         >
          <div className="border-b border-border bg-card px-3 py-2">
           <Link
            to={`/Classes/${classId}`}
            className="text-sm font-semibold text-info hover:underline"
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
               className="font-medium text-info hover:underline"
              >
               {r.studentName ?? "—"}
              </Link>
              <Tag size="sm" tone={statusToTagTone(r.status)}>
               {r.status}
              </Tag>
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
   ) : isMobile ? (
    <div className="space-y-3">
     {displayRows.length === 0 ? (
      <p className="rounded-xl border border-border bg-card px-3 py-12 text-center text-sm text-muted-foreground">
       此日尚無紀錄
      </p>
     ) : (
      displayRows.map((r) => (
       <article key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
         <div className="min-w-0">
          <p className="text-xs tabular-nums text-muted-foreground">{r.attendanceDate}</p>
          <Link to={`/Students/${r.studentId}`} className="font-semibold text-info hover:underline">
           {r.studentName ?? "—"}
          </Link>
          <p className="text-sm text-muted-foreground">{r.studentGrade ?? "—"}</p>
         </div>
         <Tag size="sm" tone={statusToTagTone(r.status)}>
          {r.status}
         </Tag>
        </div>
        <div className="mt-3 space-y-1 text-sm">
         <Link to={`/Classes/${r.classId}`} className="font-medium text-info hover:underline">
          {r.classSubject ?? "—"}
         </Link>
         {r.courseCode ? <p className="font-mono text-xs text-muted-foreground">{r.courseCode}</p> : null}
         {r.remarks ? <p className="text-xs text-muted-foreground">備註：{r.remarks}</p> : null}
        </div>
       </article>
      ))
     )}
     <p className="text-xs text-muted-foreground">
      共 {displayRows.length} 筆（{isSingleDay ? `單日 ${dateRange.from}` : rangeLabel}）
     </p>
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
           <Link to={`/Students/${r.studentId}`} className="font-medium text-info hover:underline">
            {r.studentName ?? "—"}
           </Link>
           <div className="text-xs text-muted-foreground">{r.studentGrade ?? "—"}</div>
          </td>
          <td className="px-3 py-2">
           <Link to={`/Classes/${r.classId}`} className="font-medium text-info hover:underline">
            {r.classSubject ?? "—"}
           </Link>
           {r.courseCode ? (
            <div className="font-mono text-xs text-muted-foreground">{r.courseCode}</div>
           ) : null}
          </td>
          <td className="px-3 py-2">
           <Tag size="sm" tone={statusToTagTone(r.status)}>
            {r.status}
           </Tag>
          </td>
          <td className="px-3 py-2 text-xs text-muted-foreground">{r.remarks ?? "—"}</td>
         </tr>
        ))
       )}
      </tbody>
     </table>
     <div className="border-t border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
      共 {displayRows.length} 筆（{isSingleDay ? `單日 ${dateRange.from}` : rangeLabel}）
     </div>
    </div>
   )}
  </div>
 )
}
