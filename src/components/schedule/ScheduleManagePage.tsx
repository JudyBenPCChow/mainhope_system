import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import {
 Bell,
 CalendarDays,
 Check,
 ChevronDown,
 ChevronUp,
 Download,
 GraduationCap,
 LayoutGrid,
 List,
 Plus,
 RefreshCw,
 Search,
 User,
 Users,
 Video,
 XCircle,
} from "lucide-react"

import { StudentWhatsAppReminderButton } from "@/components/reminders/StudentWhatsAppReminderButton"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { useAppConfirm } from "@/lib/appConfirm"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import {
 formatMin,
 lessonSlotLabel,
 lessonSlotStartMinute,
 LESSON_SLOT_DURATION_MIN,
 LESSON_SLOT_INDICES,
 parseHm,
 slotIndexForStartMin,
} from "@/lib/lessonSlots"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { academicYearLabelFromStartDate } from "@/lib/courseCode"
import { formatClassLabel } from "@/lib/courseLabel"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { isAcademicYearReadOnly } from "@/lib/mgmtRole"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import { getTeacherById } from "@/services/teacherQueries"
import {
 deleteSchedule,
 fetchAllClasses,
 fetchClassStudents,
 fetchClassroomOptions,
 getClassById,
 getScheduleById,
 insertScheduleForClass,
 updateSchedule,
 type ClassStudentRow,
 type ScheduleDetailRecord,
} from "@/services/classQueries"
import { fetchClassrooms, type RoomRecord } from "@/services/classroomQueries"
import {
 fetchScheduleAlerts,
 fetchSchedulesInRange,
 fetchScheduleStatsSnapshot,
 localYmd,
 scheduleRangeEnd,
 type ScheduleAlerts,
 type ScheduleManageRow,
 type ScheduleStatsSnapshot,
} from "@/services/scheduleQueries"

const RANGE_DAYS = 14

type ViewMode = "byDate" | "list" | "day"

function durationMin(row: ScheduleManageRow): number {
 const a = parseHm(row.start_time)
 const b = parseHm(row.end_time)
 if (a == null) return LESSON_SLOT_DURATION_MIN
 if (b == null) return LESSON_SLOT_DURATION_MIN
 return Math.max(LESSON_SLOT_DURATION_MIN, b - a)
}

function slotIndexForSchedule(row: ScheduleManageRow): number {
 const m = parseHm(row.start_time)
 return slotIndexForStartMin(m ?? lessonSlotStartMinute(0))
}

function alertSummary(a: ScheduleAlerts): string {
 const p: string[] = []
 if (a.trial) p.push("試堂")
 if (a.makeup) p.push("補堂")
 if (a.record) p.push("需錄影")
 if (a.leave) p.push("病／事假")
 return p.join("、")
}

function hasAnyAlert(a: ScheduleAlerts): boolean {
 return a.trial || a.makeup || a.record || a.leave
}

const ALERT_TIP_BELL =
 "排程提醒：本堂有需要留意的事項。將滑鼠移到右側小圖示可查看類別。"
const ALERT_TIP_TRIAL = "試堂：已有試堂紀錄連結至此排程。"
const ALERT_TIP_MAKEUP = "補堂／請假相關：有請假或補堂紀錄與本堂相關（含待補課）。"
const ALERT_TIP_RECORD = "錄影：排程備註含「錄影」「錄像」「錄音」等需錄製相關字樣。"
const ALERT_TIP_LEAVE =
 "請假：有學生請假與本堂相關（已連結此排程，或同班且請假日為上課日）。"

function ScheduleAlertIcons({ alerts }: { alerts: ScheduleAlerts }) {
 if (!hasAnyAlert(alerts)) return null
 return (
  <span
   className="inline-flex items-center gap-1 text-amber-600"
   role="group"
   aria-label={`排程提醒：${alertSummary(alerts)}`}
  >
   <span className="inline-flex cursor-help rounded-sm" title={ALERT_TIP_BELL}>
    <Bell className="h-4 w-4 shrink-0 drop-shadow-sm" aria-hidden />
   </span>
   {alerts.trial ? (
    <span className="inline-flex cursor-help rounded-sm" title={ALERT_TIP_TRIAL}>
     <GraduationCap className="h-4 w-4 opacity-90" aria-hidden />
    </span>
   ) : null}
   {alerts.makeup ? (
    <span className="inline-flex cursor-help rounded-sm" title={ALERT_TIP_MAKEUP}>
     <RefreshCw className="h-4 w-4 opacity-90" aria-hidden />
    </span>
   ) : null}
   {alerts.record ? (
    <span className="inline-flex cursor-help rounded-sm" title={ALERT_TIP_RECORD}>
     <Video className="h-4 w-4 opacity-90" aria-hidden />
    </span>
   ) : null}
   {alerts.leave ? (
    <span className="inline-flex cursor-help rounded-sm" title={ALERT_TIP_LEAVE}>
     <XCircle className="h-4 w-4 opacity-90" aria-hidden />
    </span>
   ) : null}
  </span>
 )
}

type PendingMove = {
 row: ScheduleManageRow
 newRoomId: string | null
 newStart: string
 newEnd: string
 roomLabel: string
}

export function ScheduleManagePage() {
 const { confirmDialog } = useAppConfirm()
 const todayYmd = localYmd()
 const [searchParams] = useSearchParams()

 const [viewMode, setViewMode] = useState<ViewMode>("byDate")
 const [displayStart, setDisplayStart] = useState(todayYmd)
 const [dayViewDate, setDayViewDate] = useState(todayYmd)
 const [quickFilter, setQuickFilter] = useState<null | "cancelled">(null)
 const [searchQ, setSearchQ] = useState("")
 const [classFilter, setClassFilter] = useState<string>("all")
 const [statusFilter, setStatusFilter] = useState<string>("all")
 const [academicYearFilter, setAcademicYearFilter] = useState<string>("current")

 const [rows, setRows] = useState<ScheduleManageRow[]>([])
 const [alerts, setAlerts] = useState<Map<string, ScheduleAlerts>>(new Map())
 const [stats, setStats] = useState<ScheduleStatsSnapshot>({
  todayLessonCount: 0,
  pendingCancelledCount: 0,
  todayStudentHeadcount: 0,
 })
 const [rooms, setRooms] = useState<RoomRecord[]>([])
 const [roomOptions, setRoomOptions] = useState<{ id: string; label: string }[]>([])
 const [loading, setLoading] = useState(false)
 const [pageErr, setPageErr] = useState<string | null>(null)

 const [detailId, setDetailId] = useState<string | null>(null)
 const [detailRow, setDetailRow] = useState<ScheduleDetailRecord | null>(null)
 const [detailLoading, setDetailLoading] = useState(false)

 const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(null)
 const [listStudents, setListStudents] = useState<ClassStudentRow[]>([])
 const [listStudentsLoading, setListStudentsLoading] = useState(false)

 const [pendingMove, setPendingMove] = useState<PendingMove | null>(null)
 const [moveSaving, setMoveSaving] = useState(false)
 const [moveErr, setMoveErr] = useState<string | null>(null)

 const [addOpen, setAddOpen] = useState(false)
 const [addClassId, setAddClassId] = useState("")
 const [addDate, setAddDate] = useState(todayYmd)
 const [addStart, setAddStart] = useState("")
 const [addEnd, setAddEnd] = useState("")
 const [addSaving, setAddSaving] = useState(false)
 const [addErr, setAddErr] = useState<string | null>(null)
 const [classPickList, setClassPickList] = useState<{ id: string; label: string }[]>([])

 const teacherScopeId = getTeacherScopeTeacherId()
const [teacherScopeName, setTeacherScopeName] = useState<string>("專班老師")
 const currentAcademicYear = useMemo(() => academicYearLabelFromStartDate(localYmd()), [])

 const rangeEnd = useMemo(() => scheduleRangeEnd(displayStart, RANGE_DAYS), [displayStart])

 const reloadStats = useCallback(async (teacherId?: string | null) => {
  try {
   setStats(await fetchScheduleStatsSnapshot(teacherId))
  } catch {
   /* ignore */
  }
 }, [])

 const reload = useCallback(async () => {
  if (!isSupabaseConfigured) return
  setLoading(true)
  setPageErr(null)
  try {
   const tid = getTeacherScopeTeacherId()
   const [list, rms, opts] = await Promise.all([
    fetchSchedulesInRange(displayStart, rangeEnd, tid ? { teacherId: tid } : undefined),
    fetchClassrooms(),
    fetchClassroomOptions(),
   ])
   setRows(list)
   setAlerts(await fetchScheduleAlerts(list))
   setRooms(rms)
   setRoomOptions(opts)
   await reloadStats(tid)
  } catch (e) {
   reportUserFacingError(e, { source: "ScheduleManagePage.reload", setErr: setPageErr })
   setRows([])
  } finally {
   setLoading(false)
  }
 }, [displayStart, rangeEnd, reloadStats])

 useEffect(() => {
  void reload()
 }, [reload])

 useEffect(() => {
  const view = searchParams.get("view")
  const date = searchParams.get("date")
  if (view === "day" && date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
   setViewMode("day")
   setDayViewDate(date)
   setDisplayStart(date)
  }
 }, [searchParams])

 useEffect(() => {
  if (!detailId) {
   setDetailRow(null)
   return
  }
  setDetailLoading(true)
  void getScheduleById(detailId)
   .then(setDetailRow)
   .finally(() => setDetailLoading(false))
 }, [detailId])

 useEffect(() => {
  if (!expandedScheduleId) {
   setListStudents([])
   return
  }
  const r = rows.find((x) => x.id === expandedScheduleId)
  if (!r) return
  if (!r.class_id) {
   setListStudents([])
   setListStudentsLoading(false)
   return
  }
  setListStudentsLoading(true)
  void fetchClassStudents(r.class_id, {
   scheduleDate: r.scheduled_date,
   activeOnly: true,
  })
   .then(setListStudents)
   .finally(() => setListStudentsLoading(false))
 }, [expandedScheduleId, rows])

 useEffect(() => {
  setExpandedScheduleId(null)
 }, [viewMode])

 useEffect(() => {
  if (!addOpen) return
  void fetchAllClasses().then((all) => {
   const scoped = teacherScopeId ? all.filter((c) => c.teacher_id === teacherScopeId) : all
   setClassPickList(
    scoped.map((c) => ({
     id: c.id,
     label: formatClassLabel({
      subject: c.subject,
      courseCode: c.course_code,
      courseName: c.course_name,
     }),
    }))
   )
   setAddClassId((prev) => {
    if (prev && scoped.some((c) => c.id === prev)) return prev
    return scoped[0]?.id || ""
   })
  })
 }, [addOpen, teacherScopeId])

useEffect(() => {
 if (!teacherScopeId) {
  setTeacherScopeName("專班老師")
  return
 }
 void getTeacherById(teacherScopeId)
  .then((t) => setTeacherScopeName(t?.full_name?.trim() || "專班老師"))
  .catch(() => setTeacherScopeName("專班老師"))
}, [teacherScopeId])

 const classFilterOptions = useMemo(() => {
  const m = new Map<string, string>()
  for (const r of rows) {
   if (!r.class_id) continue
   const label = r.classLabel
   m.set(r.class_id, label)
  }
  return [...m.entries()].map(([id, label]) => ({ id, label }))
 }, [rows])

 const academicYearOptions = useMemo(() => {
  const years = [...new Set(rows.map((r) => academicYearLabelFromStartDate(r.scheduled_date)))]
  return years.sort((a, b) => b.localeCompare(a))
 }, [rows])

 const scopedRows = useMemo(() => {
  const pick = academicYearFilter === "current" ? currentAcademicYear : academicYearFilter
  return rows.filter((r) => academicYearLabelFromStartDate(r.scheduled_date) === pick)
 }, [rows, academicYearFilter, currentAcademicYear])

 const selectedYearLabel = useMemo(
  () => (academicYearFilter === "current" ? currentAcademicYear : academicYearFilter),
  [academicYearFilter, currentAcademicYear]
 )

 const historyReadOnly = useMemo(
  () => isAcademicYearReadOnly(undefined, selectedYearLabel),
  [selectedYearLabel]
 )

 const filtered = useMemo(() => {
  const q = searchQ.trim().toLowerCase()
  return scopedRows.filter((r) => {
   if (quickFilter === "cancelled" && !r.status.includes("取消")) return false
   if (statusFilter !== "all" && r.status !== statusFilter) return false
   if (classFilter !== "all" && r.class_id !== classFilter) return false
   if (q) {
    const hay = `${r.classLabel} ${r.course_name ?? ""} ${r.subject} ${r.course_code ?? ""} ${r.teacher_name ?? ""}`.toLowerCase()
    if (!hay.includes(q)) return false
   }
   return true
  })
 }, [scopedRows, quickFilter, statusFilter, classFilter, searchQ])

 const byDateGroups = useMemo(() => {
  const m = new Map<string, ScheduleManageRow[]>()
  for (const r of filtered) {
   const arr = m.get(r.scheduled_date) ?? []
   arr.push(r)
   m.set(r.scheduled_date, arr)
  }
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]))
 }, [filtered])

 const dayFiltered = useMemo(
  () => filtered.filter((r) => r.scheduled_date === dayViewDate),
  [filtered, dayViewDate]
 )

 const roomColumns = useMemo(() => {
  const sorted = [...rooms].sort((a, b) => {
   if (a.is_online !== b.is_online) return a.is_online ? 1 : -1
   return a.name.localeCompare(b.name, "zh-Hant")
  })
  return sorted
 }, [rooms])

 /** 日視圖課室表：table-fixed 下均分課室欄寬 */
 const dayViewRoomColPct = useMemo(() => {
  const n = roomColumns.length + 1
  const timePct = 8
  const each = n > 0 ? (100 - timePct) / n : 46
  return { timePct, each }
 }, [roomColumns.length])

 const roomLabel = useCallback(
  (id: string | null) => {
   if (!id) return "未分配教室"
   return rooms.find((r) => r.id === id)?.name ?? roomOptions.find((r) => r.id === id)?.label ?? "—"
  },
  [rooms, roomOptions]
 )

 const exportCsv = () => {
  const header = ["日期", "班別", "代碼", "開始", "結束", "老師", "課室", "狀態", "報讀人數"]
  const lines = [
   header.join(","),
   ...filtered.map((r) =>
    [
     r.scheduled_date,
     `"${r.classLabel.replace(/"/g, '""')}"`,
     r.course_code ?? "",
     r.start_time ?? "",
     r.end_time ?? "",
     `"${(r.teacher_name ?? "").replace(/"/g, '""')}"`,
     `"${(r.classroom_name ?? "").replace(/"/g, '""')}"`,
     r.status,
     String(r.enrollCount),
    ].join(",")
   ),
  ]
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = `schedules-${displayStart}-${rangeEnd}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
 }

 const openAdd = () => {
  if (historyReadOnly) return
  setAddErr(null)
  setAddDate(displayStart)
  setAddStart("")
  setAddEnd("")
  setAddOpen(true)
 }

 const submitAdd = async () => {
  if (historyReadOnly) return
  if (!addClassId) {
   setAddErr("請選擇班別")
   return
  }
  setAddSaving(true)
  setAddErr(null)
  try {
   const cls = await getClassById(addClassId)
   await insertScheduleForClass(addClassId, cls?.teacher_id ?? null, {
    scheduled_date: addDate,
    start_time: addStart || null,
    end_time: addEnd || null,
    classroom_id: cls?.classroom_id ?? null,
   })
   setAddOpen(false)
   await reload()
  } catch (e) {
   reportUserFacingError(e, { source: "ScheduleManagePage.submitAdd", setErr: setAddErr })
  } finally {
   setAddSaving(false)
  }
 }

 const handleDropOnCell = (e: React.DragEvent, roomId: string | null, slotIndex: number) => {
  if (historyReadOnly) return
  e.preventDefault()
  const raw = e.dataTransfer.getData("application/json")
  if (!raw) return
  let parsed: { id?: string }
  try {
   parsed = JSON.parse(raw) as { id?: string }
  } catch {
   return
  }
  const id = parsed.id
  if (!id) return
  const row = scopedRows.find((x) => x.id === id)
  if (!row || row.scheduled_date !== dayViewDate) return
  const d = durationMin(row)
  const newStartMin = lessonSlotStartMinute(slotIndex)
  const newEndMin = newStartMin + d
  const newStart = formatMin(newStartMin)
  const newEnd = formatMin(newEndMin)
  const sameRoom = (row.classroom_id ?? null) === (roomId ?? null)
  const sameTime = row.start_time === newStart && row.end_time === newEnd
  if (sameRoom && sameTime) return
  setMoveErr(null)
  setPendingMove({
   row,
   newRoomId: roomId,
   newStart,
   newEnd,
   roomLabel: roomLabel(roomId),
  })
 }

 const confirmMove = async () => {
  if (historyReadOnly) return
  if (!pendingMove) return
  setMoveErr(null)
  setMoveSaving(true)
  try {
   await updateSchedule(pendingMove.row.id, {
    classroom_id: pendingMove.newRoomId,
    start_time: pendingMove.newStart,
    end_time: pendingMove.newEnd,
   })
   setPendingMove(null)
   await reload()
  } catch (e) {
   const msg = formatUnknownError(e)
   setMoveErr(msg)
   reportUserFacingError(e, {
    source: "ScheduleManagePage.confirmMove",
    setErr: setMoveErr,
    userMessage: msg,
   })
  } finally {
   setMoveSaving(false)
  }
 }

 const jumpToday = () => {
  setDisplayStart(todayYmd)
  setDayViewDate(todayYmd)
  setQuickFilter(null)
 }

 const onTodayCardClick = () => {
  setDisplayStart(todayYmd)
  setDayViewDate(todayYmd)
  setQuickFilter(null)
 }

 const onPendingCardClick = () => {
  setQuickFilter((q) => (q === "cancelled" ? null : "cancelled"))
 }

 if (!isSupabaseConfigured) {
  return (
   <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
    尚未設定 Supabase（請建立 <code className="rounded bg-white/60 px-1">.env</code>）。
   </div>
  )
 }

 return (
  <div className="space-y-5 text-sm leading-relaxed">
   <header className="flex flex-wrap items-start justify-between gap-3">
    <div>
     <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
      <CalendarDays className="h-6 w-6 shrink-0 text-info" aria-hidden />
      排程管理
      <Tag tone="info">{stats.todayLessonCount} 堂今日</Tag>
     </h1>
     <p className="mt-2 text-sm text-muted-foreground">
      按日期／列表可點擊卡片展開班內學生；日視圖可拖曳調整課室與時間（需確認）。日視圖以每格{" "}
      <strong>75 分鐘</strong>（09:00 起）對齊。
     </p>
    </div>
   </header>

   {teacherScopeId ? (
   <div className="rounded-xl border border-info bg-info/90 px-4 py-3 text-sm text-info-foreground">
     你正以<strong>{teacherScopeName}</strong>身分瀏覽：僅顯示指派給您的排程與統計。
    </div>
   ) : null}

   <div className="flex flex-wrap items-center gap-2">
    <span className="text-sm text-muted-foreground">學年</span>
    <Select
     className="h-9 min-w-[11rem] rounded-md border border-input bg-background px-2 text-sm"
     value={academicYearFilter}
     onChange={(e) => setAcademicYearFilter(e.target.value)}
    >
     <option value="current">目前學年（{currentAcademicYear}）</option>
     {academicYearOptions.map((y) => (
      <option key={y} value={y}>
       {y} 學年
      </option>
     ))}
    </Select>
   </div>

   {historyReadOnly ? (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
     2526 及更早學年僅供查閱：不可新增、修改、刪除或拖曳調整。
    </div>
   ) : null}

   {pageErr ? (
    <div
     role="alert"
     tabIndex={-1}
     className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
    >
     {pageErr}
    </div>
   ) : null}

   <section className="grid gap-4 sm:grid-cols-3" aria-label="排程概覽">
    <button
     type="button"
     onClick={onTodayCardClick}
     className={cn(
      "rounded-xl border bg-card p-5 text-left shadow-sm transition-all duration-200 md:p-6",
      "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
      displayStart === todayYmd && quickFilter == null ? "ring-2 ring-info/50" : "border-border"
     )}
    >
     <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <CalendarDays className="h-5 w-5 shrink-0 text-info" />
      今日課堂
     </div>
     <p className="mt-2 text-2xl font-bold tabular-nums text-info">{stats.todayLessonCount}</p>
     <p className="mt-2 text-sm text-muted-foreground">點擊將列表起始日設為今天</p>
    </button>

    <button
     type="button"
     onClick={onPendingCardClick}
     className={cn(
      "rounded-xl border bg-card p-5 text-left shadow-sm transition-all duration-200 md:p-6",
      "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40",
      quickFilter === "cancelled" ? "ring-2 ring-destructive/60" : "border-border"
     )}
    >
     <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <XCircle className="h-5 w-5 shrink-0 text-destructive" />
      待處理（取消）
     </div>
     <p className="mt-2 text-2xl font-bold tabular-nums text-destructive">{stats.pendingCancelledCount}</p>
     <p className="mt-2 text-sm text-muted-foreground">點擊篩選「已取消」排程（再點一次還原）</p>
    </button>

    <button
     type="button"
     onClick={onTodayCardClick}
     className={cn(
      "rounded-xl border bg-card p-5 text-left shadow-sm transition-all duration-200 md:p-6",
      "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success/40",
      "border-border"
     )}
    >
     <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <Users className="h-5 w-5 shrink-0 text-success" />
      今日上堂學生
     </div>
     <p className="mt-2 text-2xl font-bold tabular-nums text-success">{stats.todayStudentHeadcount}</p>
     <p className="mt-2 text-sm text-muted-foreground">依今天課表班別加總報讀人數</p>
    </button>
   </section>

   <p className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
    <span className="font-medium">提醒圖示：</span>
    鈴鐺為總覽；學士帽＝試堂、循環箭頭＝請假／補堂、攝影機＝備註需錄影、叉圈＝請假。各圖示可將滑鼠停在上面查看說明。
   </p>

   <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm lg:flex-row lg:flex-wrap lg:items-center lg:justify-between md:p-5">
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
     <div className="relative min-w-[12rem] flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <Input
       placeholder="搜尋班別 / 老師…"
       value={searchQ}
       onChange={(e) => setSearchQ(e.target.value)}
       className="h-10 pl-10 text-sm transition-colors hover:border-info/60"
      />
     </div>
     <Select
      className="h-10 rounded-md border border-input bg-background px-3 text-sm transition-colors hover:border-info/60"
      value={classFilter}
      onChange={(e) => setClassFilter(e.target.value)}
     >
      <option value="all">全部班別</option>
      {classFilterOptions.map((o) => (
       <option key={o.id} value={o.id}>
        {o.label}
       </option>
      ))}
     </Select>
     <Select
      className="h-10 rounded-md border border-input bg-background px-3 text-sm transition-colors hover:border-info/60"
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
     >
      <option value="all">全部狀態</option>
      <option value="預定">預定</option>
      <option value="完成">完成</option>
      <option value="取消">取消</option>
     </Select>
    </div>

    <div className="flex flex-wrap items-center gap-2">
     <div
      className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5"
      role="tablist"
      aria-label="檢視模式"
     >
      {(
       [
        { id: "byDate" as const, label: "按日期", icon: LayoutGrid },
        { id: "list" as const, label: "列表", icon: List },
        { id: "day" as const, label: "日視圖", icon: CalendarDays },
       ] as const
      ).map(({ id, label, icon: Icon }) => (
       <button
        key={id}
        type="button"
        role="tab"
        aria-selected={viewMode === id}
        onClick={() => setViewMode(id)}
        className={cn(
         "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all",
         viewMode === id
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-background hover:text-foreground"
        )}
       >
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        {label}
       </button>
      ))}
     </div>
     <Button
      type="button"
      variant="outline"
      size="default"
      className="gap-1.5 text-sm transition-all hover:bg-muted"
      onClick={exportCsv}
     >
      <Download className="h-4 w-4" />
      匯出
     </Button>
     <Button
      type="button"
      size="default"
      className="gap-1.5 bg-info text-sm text-white shadow-sm hover:bg-info"
      disabled={historyReadOnly}
      onClick={openAdd}
     >
      <Plus className="h-4 w-4" />
      新增排程
     </Button>
    </div>
   </div>

   <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-sm">
    <div className="flex flex-wrap items-center gap-2">
     <span className="text-muted-foreground">顯示起始日期：</span>
     <Input
      type="date"
      value={displayStart}
      onChange={(e) => setDisplayStart(e.target.value)}
      className="h-10 w-[12rem] cursor-pointer text-sm"
     />
     <Button
      type="button"
      variant="outline"
      size="default"
      className="border-amber-400/80 text-sm text-amber-900 hover:bg-amber-50"
      onClick={jumpToday}
     >
      回到今天
     </Button>
    </div>
    <span className="tabular-nums text-muted-foreground">
     {loading ? "載入中…" : `顯示 ${filtered.length} 個排程`}
    </span>
   </div>

   {viewMode === "byDate" ? (
    <div className="space-y-6">
     {byDateGroups.map(([dateYmd, list]) => {
      const isToday = dateYmd === todayYmd
      const isRangeStart = dateYmd === displayStart
      const isHighlightDay = isToday || isRangeStart
      return (
       <section
        key={dateYmd}
        className={cn(
         "space-y-3 rounded-xl p-3 shadow-sm",
         isHighlightDay
          ? "border-2 border-amber-400 bg-amber-50/50"
          : "border border-border bg-card"
        )}
       >
        <div
         className={cn(
          "flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2",
          isHighlightDay
           ? "border-amber-300/90 bg-amber-100/60"
           : "border-border bg-muted/30"
         )}
        >
         <CalendarDays
          className={cn("h-4 w-4 shrink-0", isHighlightDay ? "text-amber-800" : "text-muted-foreground")}
          aria-hidden
         />
         <span className="text-lg font-semibold tabular-nums text-foreground md:text-xl">{dateYmd}</span>
         {isToday ? (
          <Tag tone="warning" size="sm">今天</Tag>
         ) : isRangeStart ? (
          <Tag tone="warning" size="sm">起始日</Tag>
         ) : null}
         <span className="text-base text-muted-foreground">{list.length} 堂</span>
        </div>
        <ul className="space-y-2">
         {list.map((s) => {
          const a = alerts.get(s.id) ?? {
           trial: false,
           makeup: false,
           leave: false,
           record: false,
          }
          const open = expandedScheduleId === s.id
          const classMetaParts = [s.class_day_of_week, s.class_time_slot].filter(Boolean)
          return (
           <li
            key={s.id}
            className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
           >
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between md:p-5">
             <button
              type="button"
              className="min-w-0 flex-1 rounded-lg text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info/50"
              aria-expanded={open}
              onClick={() =>
               setExpandedScheduleId((id) => (id === s.id ? null : s.id))
              }
             >
              <div className="flex flex-wrap items-center gap-2">
               <span className="text-lg font-semibold text-foreground md:text-xl">
                {s.classLabel}
                {s.course_code ? (
                 <span className="font-mono text-sm text-muted-foreground">
                  {" "}
                  ({s.course_code})
                 </span>
                ) : null}
               </span>
               <ScheduleAlertIcons alerts={a} />
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
               <span className="tabular-nums">
                {s.start_time ?? "—"}–{s.end_time ?? "—"}
               </span>
               <span className="inline-flex items-center gap-1">
                <User className="h-4 w-4 shrink-0" aria-hidden />
                {s.teacher_name ?? "—"}
               </span>
               <span className="inline-flex items-center gap-1 text-info">
                <Users className="h-4 w-4 opacity-70" aria-hidden />
                {s.enrollCount} 人報讀
               </span>
              </div>
             </button>
             <div
              className="flex flex-wrap items-center gap-2 border-t border-border pt-3 sm:border-0 sm:pt-0"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
             >
              <Select
               className="h-11 max-w-[10rem] rounded-md border border-input bg-background px-2 text-sm transition-colors hover:border-info/50"
               value={s.classroom_id ?? ""}
               disabled={historyReadOnly}
               onChange={async (e) => {
                if (historyReadOnly) return
                const v = e.target.value || null
                await updateSchedule(s.id, { classroom_id: v })
                await reload()
               }}
              >
               <option value="">課室未定</option>
               {roomOptions.map((o) => (
                <option key={o.id} value={o.id}>
                 {o.label}
                </option>
               ))}
              </Select>
              <Select
               className="h-11 rounded-md border border-input bg-background px-2 text-sm font-medium text-info transition-colors hover:border-info/50"
               value={s.status}
               disabled={historyReadOnly}
               onChange={async (e) => {
                if (historyReadOnly) return
                await updateSchedule(s.id, { status: e.target.value })
                await reload()
               }}
              >
               <option value="預定">預定</option>
               <option value="完成">完成</option>
               <option value="取消">取消</option>
              </Select>
              <Link
               to="/LeaveManagement"
              className="rounded-md border border-warning px-3 py-2 text-sm font-medium text-warning transition-colors hover:bg-warning hover:text-warning-foreground"
               onClick={(e) => e.stopPropagation()}
              >
               +請假
              </Link>
              <Link
               to="/TrialSessions"
              className="rounded-md border border-info px-3 py-2 text-sm font-medium text-info transition-colors hover:bg-info hover:text-info-foreground"
               onClick={(e) => e.stopPropagation()}
              >
               +補堂試堂
              </Link>
              <Button
               type="button"
               size="default"
               className="h-11 gap-1.5 bg-success px-3 text-base text-white hover:bg-success"
               asChild
              >
               <Link to="/Attendance" onClick={(e) => e.stopPropagation()}>
                <Check className="h-4 w-4" aria-hidden />
                確定點名
               </Link>
              </Button>
              <Button
               type="button"
               variant="ghost"
               size="icon"
               className="h-11 w-11 text-destructive hover:bg-destructive/10"
               disabled={historyReadOnly}
               aria-label="刪除排程"
               onClick={async () => {
               if (historyReadOnly) return
               if (!(await confirmDialog({ title: "刪除排程", description: "確定刪除此排程？", confirmText: "確認刪除", tone: "destructive" }))) return
                await deleteSchedule(s.id)
                await reload()
               }}
              >
               ×
              </Button>
              <Button
               type="button"
               variant="ghost"
               size="icon"
               className="h-11 w-11 shrink-0 text-muted-foreground hover:bg-muted"
               aria-expanded={open}
               aria-label={open ? "收合詳情" : "展開詳情"}
               onClick={() =>
                setExpandedScheduleId((id) => (id === s.id ? null : s.id))
               }
              >
               {open ? (
                <ChevronUp className="h-5 w-5" aria-hidden />
               ) : (
                <ChevronDown className="h-5 w-5" aria-hidden />
               )}
              </Button>
             </div>
            </div>
            {open ? (
             <div className="border-t border-border bg-success/25 px-4 py-4 md:px-5">
              <p className="text-sm font-medium text-info">
               班別：{s.classLabel}
               {s.course_code ? `（${s.course_code}）` : ""}
               {classMetaParts.length > 0 ? ` · ${classMetaParts.join(" ")}` : ""}
              </p>
              <p className="mb-2 mt-3 text-sm font-medium text-success">
               班內學生（{listStudentsLoading ? "…" : listStudents.length}）
              </p>
              {listStudentsLoading ? (
               <p className="text-sm text-muted-foreground">載入名單…</p>
              ) : (
               <div className="flex flex-wrap gap-2">
                {listStudents.map((st) => (
                <Tag key={st.studentId} tone="success" size="sm" className="gap-1 py-0.5 pl-2 pr-1">
                  <Link
                   to={`/Students/${st.studentId}`}
                   className="text-sm font-medium text-success hover:underline"
                   onClick={(e) => e.stopPropagation()}
                  >
                   {st.fullName}
                  </Link>
                  <StudentWhatsAppReminderButton
                   compact
                   className="h-7 w-7 border-success/60"
                   contactPhone={st.contactPhone}
                   payload={{
                    studentName: st.fullName,
                    subject: s.subject,
                    courseName: s.course_name,
                    courseCode: s.course_code,
                    dateYmd: s.scheduled_date,
                    startTime: s.start_time,
                    endTime: s.end_time,
                    classroomName: s.classroom_name,
                    attendanceStatus: null,
                    isTrial: false,
                   }}
                  />
                 </Tag>
                ))}
               </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-3">
               <Button
                type="button"
                variant="outline"
                size="default"
                className="text-base"
                onClick={() => setDetailId(s.id)}
               >
                快速檢視
               </Button>
               <Button type="button" variant="outline" size="default" className="text-base" asChild>
                <Link to={`/Schedule/${s.id}`}>完整排程頁</Link>
               </Button>
               {s.class_id ? (
                <Button type="button" variant="outline" size="default" className="text-base" asChild>
                 <Link to={`/Classes/${s.class_id}`}>班別詳情</Link>
                </Button>
               ) : null}
              </div>
             </div>
            ) : null}
           </li>
          )
         })}
        </ul>
       </section>
      )
     })}
     {byDateGroups.length === 0 ? (
      <p className="py-12 text-center text-sm text-muted-foreground">此條件下沒有排程</p>
     ) : null}
    </div>
   ) : null}

   {viewMode === "list" ? (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
     <table className="w-full min-w-[800px] table-fixed border-collapse text-sm">
      <thead>
       <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
        <th className="w-[11%] px-4 py-3 font-medium">日期</th>
        <th className="w-[26%] px-4 py-3 font-medium">班別</th>
        <th className="w-[11%] px-4 py-3 font-medium">時間</th>
        <th className="w-[14%] px-4 py-3 font-medium">老師</th>
        <th className="w-[14%] px-4 py-3 font-medium">課室</th>
        <th className="w-[12%] px-4 py-3 font-medium">狀態</th>
        <th className="w-[12%] px-4 py-3 font-medium">操作</th>
       </tr>
      </thead>
      <tbody>
       {filtered.map((s) => {
        const a = alerts.get(s.id) ?? {
         trial: false,
         makeup: false,
         leave: false,
         record: false,
        }
        const open = expandedScheduleId === s.id
        return (
         <Fragment key={s.id}>
          <tr
           className={cn(
            "cursor-pointer border-b border-border transition-colors hover:bg-info/40",
            open && "bg-info/30"
           )}
           onClick={() => setExpandedScheduleId((id) => (id === s.id ? null : s.id))}
          >
           <td className="min-w-0 align-top px-4 py-3 tabular-nums">
            <div className="flex flex-wrap items-center gap-1.5">
             {s.scheduled_date}
             {s.scheduled_date === todayYmd ? (
              <span className="rounded bg-amber-200 px-1.5 text-xs font-medium text-amber-950">
               今天
              </span>
             ) : null}
             <ScheduleAlertIcons alerts={a} />
            </div>
           </td>
           <td className="min-w-0 align-top px-4 py-3 font-medium">
            <span className="block break-words">{s.classLabel}</span>
            {s.course_code ? (
             <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
              ({s.course_code})
             </span>
            ) : null}
           </td>
           <td className="min-w-0 align-top px-4 py-3 tabular-nums text-muted-foreground">
            {s.start_time ?? "—"}–{s.end_time ?? "—"}
           </td>
           <td className="min-w-0 align-top px-4 py-3">
            <span className="block break-words">{s.teacher_name ?? "—"}</span>
           </td>
           <td className="min-w-0 align-top px-4 py-3 text-muted-foreground">
            <span className="block break-words">{s.classroom_name ?? "—"}</span>
           </td>
           <td className="align-top px-4 py-3" onClick={(e) => e.stopPropagation()}>
            <Select
             className="h-10 rounded-md border border-input bg-background px-2 text-sm"
             value={s.status}
             disabled={historyReadOnly}
             onChange={async (e) => {
              if (historyReadOnly) return
              await updateSchedule(s.id, { status: e.target.value })
              await reload()
             }}
            >
             <option value="預定">預定</option>
             <option value="完成">完成</option>
             <option value="取消">取消</option>
            </Select>
           </td>
           <td className="min-w-0 align-top px-4 py-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-wrap items-center gap-2">
             <Link
              to="/LeaveManagement"
              className="text-sm font-medium text-warning hover:underline"
              onClick={(e) => e.stopPropagation()}
             >
              +請假
             </Link>
             <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-sm text-destructive"
              disabled={historyReadOnly}
              onClick={async (e) => {
               if (historyReadOnly) return
               e.stopPropagation()
              if (!(await confirmDialog({ title: "刪除排程", description: "確定刪除？", confirmText: "確認刪除", tone: "destructive" }))) return
               await deleteSchedule(s.id)
               await reload()
              }}
             >
              刪除
             </Button>
             {open ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" aria-hidden />
             ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden />
             )}
            </div>
           </td>
          </tr>
          {open ? (
           <tr className="border-b border-border bg-success/30">
            <td colSpan={7} className="px-4 py-4">
             <p className="mb-2 text-sm font-medium text-success">
              班內學生（{listStudentsLoading ? "…" : listStudents.length}）
             </p>
             {listStudentsLoading ? (
              <p className="text-sm text-muted-foreground">載入名單…</p>
             ) : (
              <div className="flex flex-wrap gap-2">
               {listStudents.map((st) => (
               <Tag key={st.studentId} tone="success" size="sm" className="gap-1 py-0.5 pl-2 pr-1">
                 <Link
                  to={`/Students/${st.studentId}`}
                  className="text-sm font-medium text-success hover:underline"
                  onClick={(e) => e.stopPropagation()}
                 >
                  {st.fullName}
                 </Link>
                 <StudentWhatsAppReminderButton
                  compact
                  className="h-7 w-7 border-success/60"
                  contactPhone={st.contactPhone}
                  payload={{
                   studentName: st.fullName,
                   subject: s.subject,
                   courseName: s.course_name,
                   courseCode: s.course_code,
                   dateYmd: s.scheduled_date,
                   startTime: s.start_time,
                   endTime: s.end_time,
                   classroomName: s.classroom_name,
                   attendanceStatus: null,
                   isTrial: false,
                  }}
                 />
                </Tag>
               ))}
              </div>
             )}
            </td>
           </tr>
          ) : null}
         </Fragment>
        )
       })}
      </tbody>
     </table>
     {filtered.length === 0 ? (
      <p className="py-12 text-center text-sm text-muted-foreground">此條件下沒有排程</p>
     ) : null}
    </div>
   ) : null}

   {viewMode === "day" ? (
    <div className="space-y-4">
     <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">日視圖日期</span>
      <Input
       type="date"
       value={dayViewDate}
       onChange={(e) => setDayViewDate(e.target.value)}
       className="h-11 w-[12rem] text-base"
      />
     </div>
     <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <p className="border-b border-border bg-muted/30 px-4 py-3 text-sm font-medium">
       {dayViewDate} · 日視圖（依課室）· 每格 75 分鐘 · 拖曳卡片可調整課室或時段
      </p>
      <table className="w-full min-w-[900px] table-fixed border-collapse text-sm">
       <colgroup>
        <col style={{ width: `${dayViewRoomColPct.timePct}%` }} />
        {roomColumns.map((r) => (
         <col key={r.id} style={{ width: `${dayViewRoomColPct.each}%` }} />
        ))}
        <col style={{ width: `${dayViewRoomColPct.each}%` }} />
       </colgroup>
       <thead>
        <tr className="bg-muted/40">
         <th className="sticky left-0 z-[1] border border-border bg-muted/50 px-2 py-3">
          時間
         </th>
         {roomColumns.map((r) => (
          <th key={r.id} className="min-w-0 border border-border px-2 py-3 font-medium">
           <span className="block break-words">{r.name}</span>
          </th>
         ))}
         <th className="min-w-0 border border-border bg-amber-50/50 px-2 py-3 font-medium text-amber-900">
          未分配教室
         </th>
        </tr>
       </thead>
       <tbody>
        {LESSON_SLOT_INDICES.map((slotIdx) => (
         <tr key={slotIdx}>
          <td className="sticky left-0 z-[1] border border-border bg-card px-2 py-2 tabular-nums text-muted-foreground">
           {lessonSlotLabel(slotIdx)}
          </td>
          {roomColumns.map((r) => (
           <td
            key={r.id}
            className="align-top border border-border p-1 transition-colors hover:bg-teal-50/30"
            data-room-id={r.id}
            onDragOver={(e) => {
             e.preventDefault()
             e.dataTransfer.dropEffect = "move"
            }}
            onDrop={(e) => handleDropOnCell(e, r.id, slotIdx)}
           >
            <div className="flex min-h-[4rem] flex-col gap-1">
             {dayFiltered
              .filter((s) => s.classroom_id === r.id && slotIndexForSchedule(s) === slotIdx)
              .map((s) => (
               <div
                key={s.id}
                draggable
               aria-disabled={historyReadOnly}
                onDragStart={(e) => {
                 if (historyReadOnly) {
                  e.preventDefault()
                  return
                 }
                 e.dataTransfer.setData("application/json", JSON.stringify({ id: s.id }))
                 e.dataTransfer.effectAllowed = "move"
                }}
                className="cursor-grab rounded-md border border-teal-300 bg-teal-50 px-2 py-1.5 text-sm font-medium text-teal-900 shadow-sm active:cursor-grabbing"
               >
                <div className="flex items-start justify-between gap-1">
                 <span className="line-clamp-2">{s.classLabel}</span>
                 <ScheduleAlertIcons alerts={alerts.get(s.id) ?? { trial: false, makeup: false, leave: false, record: false }} />
                </div>
                <div className="mt-0.5 tabular-nums text-xs text-teal-800/90 md:text-sm">
                 {s.start_time ?? ""}–{s.end_time ?? ""}
                </div>
               </div>
              ))}
            </div>
           </td>
          ))}
          <td
           className="align-top border border-border bg-amber-50/20 p-1 transition-colors hover:bg-amber-100/40"
           data-room-id="__none__"
           onDragOver={(e) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = "move"
           }}
           onDrop={(e) => handleDropOnCell(e, null, slotIdx)}
          >
           <div className="flex min-h-[4rem] flex-col gap-1">
            {dayFiltered
             .filter((s) => !s.classroom_id && slotIndexForSchedule(s) === slotIdx)
             .map((s) => (
              <div
               key={s.id}
               draggable
               aria-disabled={historyReadOnly}
               onDragStart={(e) => {
                if (historyReadOnly) {
                 e.preventDefault()
                 return
                }
                e.dataTransfer.setData("application/json", JSON.stringify({ id: s.id }))
                e.dataTransfer.effectAllowed = "move"
               }}
               className="cursor-grab rounded-md border border-amber-400 bg-amber-100 px-2 py-1.5 text-sm font-medium text-amber-950 active:cursor-grabbing"
              >
               <div className="flex items-start justify-between gap-1">
                <span className="line-clamp-2">{s.classLabel}</span>
                <ScheduleAlertIcons alerts={alerts.get(s.id) ?? { trial: false, makeup: false, leave: false, record: false }} />
               </div>
               <div className="mt-0.5 tabular-nums text-xs md:text-sm">
                {s.start_time ?? ""}–{s.end_time ?? ""}
               </div>
              </div>
             ))}
           </div>
          </td>
         </tr>
        ))}
       </tbody>
      </table>
     </div>
    </div>
   ) : null}

   <Dialog open={detailId != null} onOpenChange={(o) => !o && setDetailId(null)}>
    <DialogContent className="max-w-md border-info text-sm">
     <DialogHeader>
      <DialogTitle className="text-lg font-semibold">排程詳細資料</DialogTitle>
     </DialogHeader>
     {detailLoading || !detailRow ? (
      <p className="text-base text-muted-foreground">載入中…</p>
     ) : (
      <div className="space-y-3 text-sm">
       <p className="text-xl font-semibold tabular-nums md:text-2xl">
        {detailRow.scheduled_date}{" "}
        {detailRow.start_time && detailRow.end_time
         ? `${detailRow.start_time}–${detailRow.end_time}`
         : ""}
       </p>
       <p>
        {detailRow.class_subject}{" "}
        <span className="font-mono text-muted-foreground">{detailRow.course_code ?? ""}</span>
       </p>
       <p className="text-muted-foreground">老師：{detailRow.teacher_name ?? "—"}</p>
       <p className="text-muted-foreground">課室：{detailRow.classroom_name ?? "未分配"}</p>
      <Tag tone={statusToTagTone(detailRow.status)} size="sm">{detailRow.status}</Tag>
       {detailRow.remarks ? (
        <p className="text-muted-foreground">備註：{detailRow.remarks}</p>
       ) : null}
       <div className="flex flex-wrap gap-2 pt-2">
        <Button type="button" variant="outline" size="default" className="text-base" asChild>
         <Link to={`/Schedule/${detailRow.id}`}>開啟完整頁面</Link>
        </Button>
        {detailRow.class_id ? (
         <Button type="button" variant="outline" size="default" className="text-base" asChild>
          <Link to={`/Classes/${detailRow.class_id}`}>班別詳情</Link>
         </Button>
        ) : null}
       </div>
      </div>
     )}
    </DialogContent>
   </Dialog>

   <Dialog
    open={pendingMove != null}
    onOpenChange={(o) => {
     if (!o && !moveSaving) {
      setPendingMove(null)
      setMoveErr(null)
     }
    }}
   >
    <DialogContent className="max-w-md border-amber-100 text-sm">
     <DialogHeader>
      <DialogTitle className="text-lg font-semibold">確認變更排程</DialogTitle>
     </DialogHeader>
     {pendingMove ? (
      <div className="space-y-3 text-sm">
       <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
        即將調整「{pendingMove.row.classLabel}
        {pendingMove.row.course_code ? `（${pendingMove.row.course_code}）` : ""}」：
        <br />
        課室 → <strong>{pendingMove.roomLabel}</strong>
        <br />
        時間 → <strong className="tabular-nums">
         {pendingMove.newStart}–{pendingMove.newEnd}
        </strong>
       </p>
       <p className="text-muted-foreground">請確認無課室衝突後再儲存。</p>
       {moveErr ? (
        <div
         role="alert"
         className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
         {moveErr}
        </div>
       ) : null}
       <div className="flex justify-end gap-2">
        <Button
         type="button"
         variant="outline"
         disabled={moveSaving}
         onClick={() => {
          setMoveErr(null)
          setPendingMove(null)
         }}
        >
         取消
        </Button>
        <Button
         type="button"
         className="bg-amber-600 text-white hover:bg-amber-700"
         disabled={moveSaving}
         onClick={() => void confirmMove()}
        >
         {moveSaving ? "儲存中…" : "確定變更"}
        </Button>
       </div>
      </div>
     ) : null}
    </DialogContent>
   </Dialog>

   <Dialog open={addOpen} onOpenChange={setAddOpen}>
    <DialogContent className="text-sm">
     <DialogHeader>
      <DialogTitle className="text-lg font-semibold">新增排程</DialogTitle>
     </DialogHeader>
     <div className="grid gap-4 text-sm">
      <label className="grid gap-1.5">
       <span className="text-muted-foreground">班別</span>
       <Select
        className="h-11 w-full rounded-md border border-input px-3"
        value={addClassId}
        onChange={(e) => setAddClassId(e.target.value)}
       >
        {classPickList.map((c) => (
         <option key={c.id} value={c.id}>
          {c.label}
         </option>
        ))}
       </Select>
      </label>
      <label className="grid gap-1.5">
       <span className="text-muted-foreground">日期</span>
       <Input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} className="h-11 text-base" />
      </label>
      <div className="grid grid-cols-2 gap-3">
       <label className="grid gap-1.5">
        <span className="text-muted-foreground">開始</span>
        <Input type="time" value={addStart} onChange={(e) => setAddStart(e.target.value)} className="h-11 text-base" />
       </label>
       <label className="grid gap-1.5">
        <span className="text-muted-foreground">結束</span>
        <Input type="time" value={addEnd} onChange={(e) => setAddEnd(e.target.value)} className="h-11 text-base" />
       </label>
      </div>
      {addErr ? <p className="text-destructive">{addErr}</p> : null}
      <div className="flex justify-end gap-2">
       <Button type="button" variant="outline" disabled={addSaving} onClick={() => setAddOpen(false)}>
        取消
       </Button>
       <Button type="button" disabled={addSaving} onClick={() => void submitAdd()}>
        {addSaving ? "儲存中…" : "儲存"}
       </Button>
      </div>
     </div>
    </DialogContent>
   </Dialog>
  </div>
 )
}
