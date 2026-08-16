import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { AlertTriangle, BookOpen, Copy, Images, LayoutGrid, List, Plus, SlidersHorizontal } from "lucide-react"

import { isSuperAdmin } from "@/lib/mgmtRole"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { MobileFilterSheet } from "@/components/mobile/MobileFilterSheet"
import { statusToTagTone } from "@/lib/statusTag"
import { classKindLabel } from "@/lib/privateClassKind"
import {
 DAY_FILTER_CHIPS,
 GRADE_CHIPS,
 KANBAN_DAY_COLUMNS,
 STATUS_CHIPS,
 academicYearLabelsMatch,
 buildSubjectFilterChips,
 classAcademicYearLabel,
 classMatchesDay,
 classMatchesGrade,
 classMatchesStatus,
 classMatchesSubject,
 classMatchesTeacher,
 formatWeekdaysDisplay,
 isPrimaryGradeLabel,
 weekdaysFromStored,
} from "@/components/classes/classesUi"
import {
 getClassesListDataCache,
 setClassesListDataCache,
} from "@/components/classes/classesListState"
import { usePersistentState } from "@/hooks/usePersistentState"
import { useIsMobile } from "@/hooks/use-mobile"
import { MOBILE_BREAKPOINT } from "@/lib/layoutBreakpoint"
import { classDisplayName } from "@/lib/courseLabel"
import { academicYearLabelFromStartDate } from "@/lib/courseCode"
import { confirmNonCurrentAcademicYearWrite } from "@/lib/academicYearSoftGuard"
import { formatScheduleDateShort } from "@/lib/weekdayUtils"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import {
 deleteClassCascade,
 duplicateClass,
 fetchAcademicYearOptions,
 fetchAllClasses,
 fetchTeacherOptions,
 previewClassDeletionSchedules,
 type ClassRecord,
 updateClass,
} from "@/services/classQueries"
import { fetchEnrollmentRosterByClassIds, fetchScheduleSummariesByClassIds, type ClassScheduleSummary } from "@/services/scheduleQueries"

const cardInteractive =
 "cursor-pointer rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"

const rowInteractive =
 "cursor-pointer transition-colors duration-150 hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"

const GALLERY_COVERS = [
 "bg-gradient-to-br from-sky-500 via-cyan-600 to-slate-800",
 "bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-800",
 "bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600",
 "bg-gradient-to-br from-sky-400 via-blue-500 to-slate-800",
 "bg-gradient-to-br from-pink-400 via-rose-500 to-slate-700",
 "bg-gradient-to-br from-lime-400 via-green-500 to-emerald-800",
 "bg-gradient-to-br from-orange-400 to-red-700",
 "bg-gradient-to-br from-cyan-400 to-teal-800",
] as const

function galleryCoverClass(subject: string): string {
 let h = 0
 for (let i = 0; i < subject.length; i++) {
  h = (h * 31 + subject.charCodeAt(i)) >>> 0
 }
 return GALLERY_COVERS[h % GALLERY_COVERS.length]
}

type ClassesViewMode = "list" | "kanban" | "gallery" | "cards"

function getInitialClassesView(): ClassesViewMode {
 try {
  const raw = sessionStorage.getItem("mgmt_classes_view")
  if (raw != null) return JSON.parse(raw) as ClassesViewMode
 } catch {
  /* ignore */
 }
 return typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT ? "cards" : "list"
}

export function ClassesListPage() {
 const navigate = useNavigate()
 const location = useLocation()
 const { confirmDialog } = useAppConfirm()
 const { pushBanner } = useAppBanner()
 const teacherTid = getTeacherScopeTeacherId()
 const isMobile = useIsMobile()
 const initialCache = useMemo(() => getClassesListDataCache(), [])
 const [rows, setRows] = useState<ClassRecord[]>(() => initialCache?.rows ?? [])
 const [enrollRoster, setEnrollRoster] = useState<Map<string, { count: number; names: string[] }>>(
  () => initialCache?.enrollRoster ?? new Map()
 )
 const [scheduleSummaries, setScheduleSummaries] = useState<Map<string, ClassScheduleSummary>>(
  () => initialCache?.scheduleSummaries ?? new Map()
 )
 const [teachers, setTeachers] = useState<{ id: string; label: string }[]>(
  () => initialCache?.teachers ?? []
 )
 const [yearOptions, setYearOptions] = useState<{ id: string; label: string; is_current: boolean }[]>(
  () => initialCache?.yearOptions ?? []
 )
 const [loading, setLoading] = useState(() => initialCache == null)
 const [err, setErr] = useState<string | null>(null)
 const [view, setView] = usePersistentState<ClassesViewMode>("mgmt_classes_view", getInitialClassesView())
 const displayView: ClassesViewMode = isMobile && view === "list" ? "cards" : view
 const [kanbanGroup, setKanbanGroup] = usePersistentState<"day" | "teacher" | "grade">(
  "mgmt_classes_kanbanGroup",
  "day"
 )
 const [gradeKey, setGradeKey] = usePersistentState<string>("mgmt_classes_gradeKey", "全部")
 const [subjectKey, setSubjectKey] = usePersistentState<string>("mgmt_classes_subjectKey", "全部")
 const [teacherKey, setTeacherKey] = usePersistentState<string>("mgmt_classes_teacherKey", "全部")
 const [dayKey, setDayKey] = usePersistentState<string>("mgmt_classes_dayKey", "全部")
 const [statusKey, setStatusKey] = usePersistentState<string>("mgmt_classes_statusKey", "全部")
 const [kindKey, setKindKey] = usePersistentState<string>("mgmt_classes_kindKey", "小組")
 /** 僅班別頁有效（session），不再跨頁同步 */
 const [academicYearFilter, setAcademicYearFilter] = usePersistentState<string>(
  "mgmt_classes_academicYearFilter",
  "current"
 )
 const [filtersOpen, setFiltersOpen] = useState(false)

 useEffect(() => {
  try {
   localStorage.removeItem("mgmt_academic_year_filter")
  } catch {
   /* ignore */
  }
 }, [])

 const activeFilterCount = useMemo(() => {
  let n = 0
  if (subjectKey !== "全部") n += 1
  if (gradeKey !== "全部") n += 1
  if (!teacherTid && teacherKey !== "全部") n += 1
  if (dayKey !== "全部") n += 1
  if (kindKey !== "小組") n += 1
  if (statusKey !== "全部") n += 1
  return n
 }, [subjectKey, gradeKey, teacherKey, dayKey, kindKey, statusKey, teacherTid])

 const resetFilters = useCallback(() => {
  setSubjectKey("全部")
  setGradeKey("全部")
  setTeacherKey("全部")
  setDayKey("全部")
  setKindKey("小組")
  setStatusKey("全部")
 }, [setSubjectKey, setGradeKey, setTeacherKey, setDayKey, setKindKey, setStatusKey])

 const load = useCallback(async (opts?: { silent?: boolean }) => {
  if (!opts?.silent) setLoading(true)
  setErr(null)
  try {
   const list = await fetchAllClasses()
   const classIds = list.map((c) => c.id)
   const [teacherOpts, yearOpts, roster, summaries] = await Promise.all([
    fetchTeacherOptions(),
    fetchAcademicYearOptions(),
    fetchEnrollmentRosterByClassIds(classIds),
    fetchScheduleSummariesByClassIds(classIds),
   ])
   setRows(list)
   setTeachers(teacherOpts)
   setYearOptions(yearOpts)
   setEnrollRoster(roster)
   setScheduleSummaries(summaries)
   setClassesListDataCache({
    rows: list,
    teachers: teacherOpts,
    yearOptions: yearOpts,
    enrollRoster: roster,
    scheduleSummaries: summaries,
   })
  } catch (e) {
   reportUserFacingError(e, { source: "ClassesListPage.load", setErr })
  } finally {
   if (!opts?.silent) setLoading(false)
  }
 }, [])

 const removeClassFromLocalState = useCallback((id: string) => {
  setRows((prev) => prev.filter((c) => c.id !== id))
  setEnrollRoster((prev) => {
   const next = new Map(prev)
   next.delete(id)
   return next
  })
  setScheduleSummaries((prev) => {
   const next = new Map(prev)
   next.delete(id)
   return next
  })
 }, [])

 useEffect(() => {
  // 已有快取（例如自班別詳情返回）時靜默更新，避免閃「載入中」並保留篩選；
  // 首次進入才顯示載入狀態。
  void load({ silent: getClassesListDataCache() != null })
 }, [location.key, load])

 useEffect(() => {
  if (!teacherTid && view === "gallery") setView("list")
 }, [teacherTid, view])

 const currentAcademicYear = useMemo(() => academicYearLabelFromStartDate(null), [])

 const baseRows = useMemo(() => {
  if (!teacherTid) return rows
  return rows.filter((c) => c.teacher_id === teacherTid)
 }, [rows, teacherTid])

 const academicYearSelectOptions = useMemo(() => {
  if (yearOptions.length > 0) {
   return yearOptions.map((y) => ({
    value: y.label,
    label: y.is_current ? `${y.label}（目前學年）` : `${y.label} 學年`,
   }))
  }
  const fromRows = [
   ...new Set(
    rows
     .map((c) => c.academic_year_label ?? academicYearLabelFromStartDate(c.start_date))
     .filter((x) => /^\d{4}$/.test(x) || /^\d{2}SM$/i.test(x))
   ),
  ].sort((a, b) => b.localeCompare(a))
  return fromRows.map((y) => ({ value: y, label: `${y} 學年` }))
 }, [yearOptions, rows])

 const selectedYearLabel = useMemo(
  () => (academicYearFilter === "current" ? currentAcademicYear : academicYearFilter),
  [academicYearFilter, currentAcademicYear]
 )

 const yearScopedRows = useMemo(() => {
  const pick = selectedYearLabel
  return baseRows.filter((c) => {
   if (!pick || pick === "all") return true
   return academicYearLabelsMatch(classAcademicYearLabel(c), pick)
  })
 }, [baseRows, selectedYearLabel])

 const filtered = useMemo(() => {
  return yearScopedRows.filter((c) => {
   if (kindKey === "小組" && c.class_kind !== "group") return false
   if (kindKey === "一對一" && c.class_kind !== "private") return false
   return (
    classMatchesGrade(c, gradeKey) &&
    classMatchesSubject(c, subjectKey) &&
    classMatchesTeacher(c, teacherKey) &&
    classMatchesDay(c, dayKey) &&
    classMatchesStatus(c, statusKey)
   )
  })
 }, [yearScopedRows, gradeKey, subjectKey, teacherKey, dayKey, statusKey, kindKey])

 const subjectChips = useMemo(
  () => buildSubjectFilterChips(yearScopedRows, { includeCommonWhenEmpty: !teacherTid }),
  [teacherTid, yearScopedRows]
 )

 const gradeChips = useMemo(() => {
  if (!teacherTid) return [...GRADE_CHIPS]
  const uniq = [
   ...new Set(
    yearScopedRows
     .flatMap((c) => (c.grade ?? []).map((g) => g.trim()))
     .filter((g) => g && !isPrimaryGradeLabel(g))
   ),
  ]
  return ["全部", ...uniq.sort((a, b) => a.localeCompare(b, "zh-Hant"))]
 }, [teacherTid, yearScopedRows])

 const teacherChips = useMemo((): string[] => {
  if (teacherTid) return ["全部"]
  const names = new Map<string, string>()
  for (const c of yearScopedRows) {
   const name = (c.teacher_name ?? "").trim()
   if (name) names.set(name, name)
  }
  for (const t of teachers) {
   const name = t.label.trim()
   if (name) names.set(name, name)
  }
  return ["全部", ...[...names.keys()].sort((a, b) => a.localeCompare(b, "zh-Hant"))]
 }, [teacherTid, yearScopedRows, teachers])

 const dayChips = useMemo(() => {
  if (!teacherTid) return [...DAY_FILTER_CHIPS]
  const present = new Set(yearScopedRows.flatMap((c) => weekdaysFromStored(c.day_of_week)))
  const ordered = KANBAN_DAY_COLUMNS.filter((d) => present.has(d))
  return ["全部", ...ordered]
 }, [teacherTid, yearScopedRows])

 const statusChips = useMemo(() => {
  if (!teacherTid) return [...STATUS_CHIPS]
  const uniq = [...new Set(yearScopedRows.map((c) => c.status.trim()).filter(Boolean))]
  return ["全部", ...uniq.sort((a, b) => a.localeCompare(b, "zh-Hant"))]
 }, [teacherTid, yearScopedRows])

 useEffect(() => {
  if (!subjectChips.includes(subjectKey)) setSubjectKey("全部")
 }, [subjectChips, subjectKey])

 useEffect(() => {
  if (!gradeChips.includes(gradeKey)) setGradeKey("全部")
 }, [gradeChips, gradeKey])

 useEffect(() => {
  if (!teacherChips.includes(teacherKey)) setTeacherKey("全部")
 }, [teacherChips, teacherKey])

 useEffect(() => {
  if (!dayChips.includes(dayKey)) setDayKey("全部")
 }, [dayChips, dayKey])

 useEffect(() => {
  if (!statusChips.includes(statusKey)) setStatusKey("全部")
 }, [statusChips, statusKey])

 const stats = useMemo(() => {
  const total = yearScopedRows.length
  const inProg = yearScopedRows.filter((c) => c.status.includes("進行")).length
  return { total, inProg, filtered: filtered.length }
 }, [yearScopedRows, filtered])

 const kanbanColumns = useMemo(() => {
  if (kanbanGroup === "day") {
   const m = new Map<string, ClassRecord[]>()
   for (const d of [...KANBAN_DAY_COLUMNS, "其他" as const]) {
    m.set(d, [])
   }
   for (const c of filtered) {
    const days = weekdaysFromStored(c.day_of_week)
    if (days.length === 0) {
     m.get("其他")!.push(c)
     continue
    }
    for (const day of days) {
     const col = m.get(day) ?? m.get("其他")!
     col.push(c)
    }
   }
   return [...KANBAN_DAY_COLUMNS, "其他"].map((title) => ({
    title,
    items: m.get(title) ?? [],
   }))
  }
  if (kanbanGroup === "teacher") {
   const m = new Map<string, ClassRecord[]>()
   for (const c of filtered) {
    const t = c.teacher_name ?? "未指派"
    if (!m.has(t)) m.set(t, [])
    m.get(t)!.push(c)
   }
   return [...m.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "zh-Hant"))
    .map(([title, items]) => ({ title, items }))
  }
  const m = new Map<string, ClassRecord[]>()
  for (const c of filtered) {
   const g = (c.grade ?? []).join("、") || "未標示"
   if (!m.has(g)) m.set(g, [])
   m.get(g)!.push(c)
  }
  return [...m.entries()]
   .sort((a, b) => a[0].localeCompare(b[0], "zh-Hant"))
   .map(([title, items]) => ({ title, items }))
 }, [filtered, kanbanGroup])

 const onDelete = async (e: React.MouseEvent, id: string) => {
  e.stopPropagation()
  const target = rows.find((c) => c.id === id)
  if (
   target &&
   !(await confirmNonCurrentAcademicYearWrite(confirmDialog, {
    label: classAcademicYearLabel(target),
    source: "ClassesListPage.onDelete",
   }))
  ) {
   return
  }
  const previewDates = await previewClassDeletionSchedules(id)
  const dateHint =
   previewDates.length > 0
    ? `將同時取消 ${previewDates.length} 筆排程：${previewDates
       .slice(0, 8)
       .map(formatScheduleDateShort)
       .join("、")}${previewDates.length > 8 ? "…" : ""}`
    : "此班別目前沒有進行中的排程。"
  if (
   !(await confirmDialog({
    title: "刪除班別",
    description: `確定刪除此班別？${dateHint}`,
    confirmText: "確認刪除",
    tone: "destructive",
   }))
  )
   return
  try {
   await deleteClassCascade(id)
   removeClassFromLocalState(id)
   pushBanner({ tone: "info", title: "已刪除班別" })
   void load({ silent: true })
  } catch (er) {
   reportUserFacingError(er, { source: "ClassesListPage.onDelete", setErr })
  }
 }

 const onCopy = async (e: React.MouseEvent, id: string) => {
  e.stopPropagation()
  const target = rows.find((c) => c.id === id)
  if (
   target &&
   !(await confirmNonCurrentAcademicYearWrite(confirmDialog, {
    label: classAcademicYearLabel(target),
    source: "ClassesListPage.onCopy",
   }))
  ) {
   return
  }
  try {
   await duplicateClass(id)
   await load()
  } catch (er) {
   reportUserFacingError(er, { source: "ClassesListPage.onCopy", setErr })
  }
 }

 const onStatusChange = async (id: string, status: string) => {
  const target = rows.find((c) => c.id === id)
  if (
   target &&
   !(await confirmNonCurrentAcademicYearWrite(confirmDialog, {
    label: classAcademicYearLabel(target),
    source: "ClassesListPage.onStatusChange",
   }))
  ) {
   return
  }
  try {
   await updateClass(id, { status })
   await load()
  } catch (er) {
   reportUserFacingError(er, { source: "ClassesListPage.onStatusChange", setErr })
  }
 }

 const timeLabel = (c: ClassRecord) => {
  const approx = [formatWeekdaysDisplay(c.day_of_week), c.time_slot].filter(Boolean).join(" ")
  const sum = scheduleSummaries.get(c.id)
  const dates = sum?.dates.map(formatScheduleDateShort).join("、") ?? ""
  if (approx && dates) return `${approx} · ${dates}`
  if (dates) return dates
  return approx || "—"
 }

 const hasNoActiveSchedule = (c: ClassRecord) => !scheduleSummaries.get(c.id)?.hasActive

 const renderClassFilterPanel = () => (
  <div className="space-y-5">
   <div className="space-y-2">
    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">科目</div>
    <div className="flex flex-wrap gap-2">
     {subjectChips.map((s) => (
      <button
       key={s}
       type="button"
       onClick={() => setSubjectKey(s)}
       className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-all active:scale-95",
        subjectKey === s
         ? "border-primary bg-primary text-primary-foreground shadow-sm"
         : "border-border bg-card hover:border-primary/30 hover:bg-muted/60"
       )}
      >
       {s}
      </button>
     ))}
    </div>
   </div>

   <div className="space-y-2">
    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">年級</div>
    <div className="flex flex-wrap gap-2">
     {gradeChips.map((g) => (
      <button
       key={g}
       type="button"
       onClick={() => setGradeKey(g)}
       className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-all active:scale-95",
        gradeKey === g
         ? "border-primary bg-primary text-primary-foreground shadow-sm"
         : "border-border bg-card hover:border-primary/30 hover:bg-muted/60"
       )}
      >
       {g}
      </button>
     ))}
    </div>
   </div>

   {!teacherTid ? (
    <div className="space-y-2">
     <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">任教老師</div>
     <div className="flex flex-wrap gap-2">
      {teacherChips.map((t) => (
       <button
        key={t}
        type="button"
        onClick={() => setTeacherKey(t)}
        className={cn(
         "rounded-full border px-3 py-1.5 text-sm font-medium transition-all active:scale-95",
         teacherKey === t
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-card hover:border-primary/30 hover:bg-muted/60"
        )}
       >
        {t}
       </button>
      ))}
     </div>
    </div>
   ) : null}

   <div className="space-y-2">
    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">逢星期</div>
    <div className="flex flex-wrap gap-2">
     {dayChips.map((d) => (
      <button
       key={d}
       type="button"
       onClick={() => setDayKey(d)}
       className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-all active:scale-95",
        dayKey === d
         ? "border-primary bg-primary text-primary-foreground shadow-sm"
         : "border-border bg-card hover:border-primary/30 hover:bg-muted/60"
       )}
      >
       {d}
      </button>
     ))}
    </div>
   </div>

   <div className="space-y-2">
    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">班別類型</div>
    <div className="flex flex-wrap gap-2">
     {([
      { value: "小組", label: "專科班" },
      { value: "一對一", label: "私人課程" },
      { value: "全部", label: "全部" },
     ] as const).map((option) => (
      <button
       key={option.value}
       type="button"
       onClick={() => setKindKey(option.value)}
       className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-all active:scale-95",
        kindKey === option.value
         ? "border-primary bg-primary text-primary-foreground shadow-sm"
         : "border-border bg-card hover:border-primary/30 hover:bg-muted/60"
       )}
      >
       {option.label}
      </button>
     ))}
    </div>
    <p className="text-xs text-muted-foreground">
     此頁預設顯示專科班。如要管理私人課程，請前往「私人課程」；亦可於此篩選檢視私人課程班別。
    </p>
   </div>

   <div className="space-y-2">
    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">狀態</div>
    <div className="flex flex-wrap gap-2">
     {statusChips.map((s) => (
      <button
       key={s}
       type="button"
       onClick={() => setStatusKey(s)}
       className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-all active:scale-95",
        statusKey === s
         ? s === "進行中"
          ? "border-success bg-success text-white shadow-sm"
          : "border-primary bg-primary text-primary-foreground shadow-sm"
         : "border-border bg-card hover:border-primary/30 hover:bg-muted/60"
       )}
      >
       {s}
      </button>
     ))}
    </div>
   </div>
  </div>
 )

 return (
  <div className="space-y-5 py-4 md:p-6">
   {!isSupabaseConfigured ? (
    <div role="alert" className="rounded-lg border border-warning/50 bg-warning/10 px-3 py-2 text-sm text-warning">
     請設定 <code className="rounded bg-muted px-1">.env</code> 後重啟 dev。
    </div>
   ) : null}
   {err ? (
    <div
     role="alert"
     tabIndex={-1}
     className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
    >
     {err}
    </div>
   ) : null}

   <div className="flex flex-wrap items-center justify-between gap-4">
    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
     <BookOpen className="h-7 w-7 shrink-0 text-primary" aria-hidden />
     {teacherTid ? "我的班別" : "班別管理"}
     <Tag tone="info" size="sm">{loading ? "…" : `${stats.total} 班`}</Tag>
    </h1>
    <div className="flex flex-wrap items-center gap-2">
     <Select
      className="h-9 min-w-[10rem] rounded-md border border-input bg-background px-2 text-sm"
      value={academicYearFilter}
      onChange={(e) => setAcademicYearFilter(e.target.value)}
     >
      <option value="current">目前學年（{currentAcademicYear}）</option>
      {academicYearSelectOptions.map((y) => (
       <option key={y.value} value={y.value}>
        {y.label}
       </option>
      ))}
     </Select>
     <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
      <button
       type="button"
       onClick={() => setView(isMobile ? "cards" : "list")}
       className={cn(
        "flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
        (isMobile ? displayView === "cards" : view === "list")
         ? "bg-primary text-primary-foreground shadow-sm"
         : "text-muted-foreground hover:text-foreground"
       )}
      >
       <List className="h-4 w-4" />
       {isMobile ? "卡片" : "列表"}
      </button>
      <button
       type="button"
       onClick={() => setView("kanban")}
       className={cn(
        "flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
        view === "kanban"
         ? "bg-primary text-primary-foreground shadow-sm"
         : "text-muted-foreground hover:text-foreground"
       )}
      >
       <LayoutGrid className="h-4 w-4" />
       看板
      </button>
      {teacherTid ? (
       <button
        type="button"
        onClick={() => setView("gallery")}
        className={cn(
         "flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
         view === "gallery"
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
        )}
       >
        <Images className="h-4 w-4" />
        圖庫
       </button>
      ) : null}
     </div>
    </div>
   </div>

   <div className="grid grid-cols-3 gap-2 md:gap-3">
    <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm transition-shadow hover:shadow-md md:p-4">
     <div className="text-xl font-bold md:text-2xl">{loading ? "…" : stats.total}</div>
     <div className="text-[11px] text-muted-foreground md:text-sm">班級總數</div>
    </div>
    <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm transition-shadow hover:shadow-md md:p-4">
     <div className="text-xl font-bold text-success md:text-2xl">{loading ? "…" : stats.inProg}</div>
     <div className="text-[11px] text-muted-foreground md:text-sm">進行中</div>
    </div>
    <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm transition-shadow hover:shadow-md md:p-4">
     <div className="text-xl font-bold text-info md:text-2xl">{loading ? "…" : stats.filtered}</div>
     <div className="text-[11px] text-muted-foreground md:text-sm">篩選結果</div>
    </div>
   </div>

  <div className="space-y-2">
   {isMobile ? (
    <div className="flex flex-wrap items-center gap-2">
     <Button type="button" variant="outline" className="gap-2" onClick={() => setFiltersOpen(true)}>
      <SlidersHorizontal className="h-4 w-4" aria-hidden />
      篩選
      {activeFilterCount > 0 ? (
       <Tag tone="info" size="sm">
        {activeFilterCount}
       </Tag>
      ) : null}
     </Button>
    </div>
   ) : null}
   {isMobile ? (
    <MobileFilterSheet
     open={filtersOpen}
     onClose={() => setFiltersOpen(false)}
     title="篩選班別"
     activeCount={activeFilterCount}
     onReset={resetFilters}
    >
     {renderClassFilterPanel()}
    </MobileFilterSheet>
   ) : (
    renderClassFilterPanel()
   )}
  </div>

   <div className="flex flex-wrap items-center justify-between gap-3">
    {view === "kanban" ? (
     <div className="flex flex-wrap gap-2">
      {(
       [
        ["day", "依星期"],
        ["teacher", "依老師"],
        ["grade", "依年級"],
       ] as const
      ).map(([key, label]) => (
       <button
        key={key}
        type="button"
        onClick={() => setKanbanGroup(key)}
        className={cn(
         "rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
         kanbanGroup === key
          ? "border-info bg-info text-white shadow-sm"
          : "border-border bg-muted/50 hover:bg-muted"
        )}
       >
        {label}
       </button>
      ))}
     </div>
    ) : (
     <span />
    )}
    {!teacherTid ? (
     <Button
      type="button"
      className="bg-info text-white shadow-sm transition-all hover:bg-info hover:shadow active:scale-[0.98]"
      onClick={() => navigate("/Classes/New")}
     >
      <Plus className="h-4 w-4" />
      新增班別
     </Button>
    ) : (
     <p className="text-sm text-muted-foreground">
      專班老師僅可檢視指派班別，無法新增。
     </p>
    )}
   </div>

   {displayView === "cards" ? (
    <div className="space-y-3">
     {loading ? (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
       載入中…
      </div>
     ) : filtered.length === 0 ? (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
       {yearScopedRows.length === 0 && baseRows.length > 0
        ? `所選學年（${selectedYearLabel}）沒有班別，請切換學年後再篩選。`
        : "沒有符合條件的班別"}
      </div>
     ) : (
      filtered.map((c) => (
       <article
        key={c.id}
        role="button"
        tabIndex={0}
        onClick={() => navigate(`/Classes/${c.id}`)}
        onKeyDown={(e) => {
         if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          navigate(`/Classes/${c.id}`)
         }
        }}
        className={cn("flex flex-col gap-3 p-4", cardInteractive)}
       >
        <div className="flex items-start justify-between gap-3">
         <div className="min-w-0">
          <div className="flex items-center gap-1.5">
           {hasNoActiveSchedule(c) ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-label="尚無排程" />
           ) : null}
           <span className="truncate font-mono text-xs text-muted-foreground">{c.course_code_full ?? "—"}</span>
          </div>
          <h3 className="mt-1 text-base font-semibold leading-snug">
           {classDisplayName({ subject: c.subject, courseName: c.course_name })}
          </h3>
         </div>
         <div className="flex shrink-0 flex-col items-end gap-1">
          {c.class_kind === "private" ? (
           <Tag tone="info" size="sm">
            {classKindLabel("private")}
           </Tag>
          ) : null}
          <Tag tone={statusToTagTone(c.status)} size="sm">
           {c.status}
          </Tag>
         </div>
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
         <p>{timeLabel(c)}</p>
         <p>年級：{(c.grade ?? []).join("、") || "—"}</p>
         <p>
          老師：
          {c.teacher_id ? (
           <Link
            to={`/Teachers/${c.teacher_id}`}
            onClick={(e) => e.stopPropagation()}
            className="ml-1 font-medium text-primary hover:underline"
           >
            {c.teacher_name ?? "—"}
           </Link>
          ) : (
           "—"
          )}
         </p>
         <p>就讀中學生：{enrollRoster.get(c.id)?.count ?? 0} 人</p>
        </div>
        {(enrollRoster.get(c.id)?.names ?? []).length > 0 ? (
         <p className="line-clamp-2 text-xs text-muted-foreground">
          {(enrollRoster.get(c.id)?.names ?? []).join("、")}
         </p>
        ) : null}
       </article>
      ))
     )}
     <p className="text-xs text-muted-foreground">共 {filtered.length} 班</p>
    </div>
   ) : displayView === "list" ? (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
     <div className="overflow-x-auto">
      <table className="w-full min-w-[104rem] table-fixed border-collapse text-sm">
       <thead>
        <tr className="border-b border-border bg-muted/50 text-left">
         <th className="min-w-[7.5rem] whitespace-nowrap px-4 py-3 pr-2 font-medium">
          課程編號
         </th>
         <th className="min-w-[5.5rem] whitespace-nowrap px-3 py-3 pr-2 font-medium">年級</th>
         <th className="min-w-[9rem] whitespace-nowrap px-3 py-3 pr-2 font-medium">課程名稱</th>
         <th className="min-w-[9.5rem] whitespace-nowrap px-3 py-3 pr-2 font-medium">上課時間</th>
         <th className="min-w-[7rem] whitespace-nowrap px-3 py-3 pr-2 font-medium">老師</th>
         <th className="min-w-[4.5rem] whitespace-nowrap px-3 py-3 pr-2 text-center font-medium">
          學生人數
         </th>
         <th className="min-w-[20rem] px-3 py-3 pr-4 font-medium">學生名單</th>
         <th className="min-w-[12rem] px-3 py-3 pr-2 font-medium">報讀須知</th>
         <th className="min-w-[7.5rem] whitespace-nowrap px-3 py-3 pr-2 font-medium">狀態</th>
         <th className="min-w-[6.5rem] whitespace-nowrap px-3 py-3 pl-2 font-medium">操作</th>
        </tr>
       </thead>
       <tbody>
        {loading ? (
         <tr>
          <td colSpan={10} className="px-3 py-8 text-center text-muted-foreground">
           載入中…
          </td>
         </tr>
        ) : filtered.length === 0 ? (
         <tr>
          <td colSpan={10} className="px-3 py-8 text-center text-muted-foreground">
           {yearScopedRows.length === 0 && baseRows.length > 0
            ? `所選學年（${selectedYearLabel}）沒有班別，請切換學年後再篩選。`
            : "沒有符合條件的專科班。若要管理私人課程，請前往「私人課程」。"}
          </td>
         </tr>
        ) : (
         filtered.map((c, idx) => (
          <tr
           key={c.id}
           onClick={() => navigate(`/Classes/${c.id}`)}
           className={cn(
            "border-b border-border",
            rowInteractive,
            idx % 2 === 1 ? "bg-muted/15" : ""
           )}
          >
           <td className="min-w-0 align-top px-4 py-3 pr-2 text-muted-foreground">
            <span className="flex items-start gap-1" title={hasNoActiveSchedule(c) ? "此班別尚無進行中的排程" : undefined}>
             {hasNoActiveSchedule(c) ? (
              <AlertTriangle
               className="mt-0.5 h-4 w-4 shrink-0 text-warning"
               aria-label="尚無排程"
              />
             ) : null}
             <span className="block truncate font-mono text-xs" title={c.course_code_full ?? undefined}>
              {c.course_code_full ?? "—"}
             </span>
            </span>
           </td>
           <td className="min-w-0 align-top px-3 py-3 pr-2">
            <span className="block break-words leading-relaxed">{(c.grade ?? []).join("、") || "—"}</span>
           </td>
           <td className="min-w-0 align-top px-3 py-3 pr-2">
            <span className="block break-words leading-relaxed font-medium">
             {classDisplayName({ subject: c.subject, courseName: c.course_name })}
             {c.class_kind === "private" ? (
              <Tag tone="info" size="sm" className="ml-1.5 align-middle">
               {classKindLabel("private")}
              </Tag>
             ) : null}
            </span>
           </td>
           <td className="min-w-0 align-top px-3 py-3 pr-2 text-muted-foreground">
            <span className="block break-words leading-relaxed">{timeLabel(c)}</span>
           </td>
           <td className="min-w-0 align-top px-3 py-3 pr-2" onClick={(e) => e.stopPropagation()}>
            {c.teacher_id ? (
             <Link
              to={`/Teachers/${c.teacher_id}`}
              className="font-medium text-primary underline-offset-4 hover:underline"
             >
              {c.teacher_name ?? "—"}
             </Link>
            ) : (
             "—"
            )}
           </td>
           <td
            className="align-top px-3 py-3 pr-2 text-center tabular-nums text-muted-foreground"
            onClick={(e) => e.stopPropagation()}
            title="僅統計狀態為「就讀中」的選課"
           >
            {enrollRoster.get(c.id)?.count ?? 0}
           </td>
           <td
            className="min-w-[20rem] max-w-[28rem] align-top px-3 py-3 pr-4 text-xs text-muted-foreground"
            onClick={(e) => e.stopPropagation()}
            title={
             (enrollRoster.get(c.id)?.names ?? []).length > 0
              ? (enrollRoster.get(c.id)?.names ?? []).join("、")
              : undefined
            }
           >
            {(enrollRoster.get(c.id)?.names ?? []).length > 0 ? (
             <span className="line-clamp-2 break-words leading-relaxed [overflow-wrap:anywhere]">
              {(enrollRoster.get(c.id)?.names ?? []).join("、")}
             </span>
            ) : (
             "—"
            )}
           </td>
           <td
            className="min-w-[12rem] max-w-[16rem] align-top px-3 py-3 pr-2 text-xs text-muted-foreground"
            title={c.enrollment_notice?.trim() || undefined}
           >
            {c.enrollment_notice?.trim() ? (
             <span className="line-clamp-2 break-words leading-relaxed [overflow-wrap:anywhere]">
              {c.enrollment_notice}
             </span>
            ) : (
             "—"
            )}
           </td>
           <td className="align-top px-3 py-3 pr-2" onClick={(e) => e.stopPropagation()}>
            <Select
             className="h-8 w-full min-w-0 max-w-full rounded-md border border-input bg-background px-2 text-xs transition-colors hover:border-primary/50"
             value={c.status}
             disabled={Boolean(teacherTid)}
             onChange={(e) => void onStatusChange(c.id, e.target.value)}
            >
             {STATUS_CHIPS.filter((s) => s !== "全部").map((s) => (
              <option key={s} value={s}>
               {s}
              </option>
             ))}
            </Select>
           </td>
           <td className="align-top px-3 py-3 pl-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex min-w-0 flex-col items-start gap-y-1.5 leading-none">
             <button
              type="button"
              className="text-left text-primary hover:underline"
              onClick={() => navigate(`/Classes/${c.id}`)}
             >
              {teacherTid ? "查看" : "編輯"}
             </button>
             {!teacherTid ? (
             <button
              type="button"
              className="text-left text-muted-foreground hover:text-foreground hover:underline"
              onClick={(e) => void onCopy(e, c.id)}
             >
              <Copy className="mr-0.5 inline h-3.5 w-3.5" />
              複製
             </button>
             ) : null}
             {isSuperAdmin() ? (
              <button
               type="button"
               className="text-left text-destructive hover:underline"
               onClick={(e) => void onDelete(e, c.id)}
              >
               刪除
              </button>
             ) : null}
            </div>
           </td>
          </tr>
         ))
        )}
       </tbody>
      </table>
     </div>
     <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
      共 {filtered.length} 班
     </div>
    </div>
   ) : displayView === "gallery" && teacherTid ? (
    <div className="rounded-xl border border-border bg-muted/20 p-4 shadow-sm md:p-6">
     {loading ? (
      <p className="py-12 text-center text-muted-foreground">載入中…</p>
     ) : filtered.length === 0 ? (
      <p className="py-12 text-center text-muted-foreground">沒有符合條件的班別</p>
     ) : (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
       {filtered.map((c) => (
        <Link
         key={c.id}
         to={`/Classes/${c.id}`}
         className="group overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
        >
         <div className={cn("relative aspect-[5/3] w-full overflow-hidden", galleryCoverClass(c.subject))}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.22),transparent_55%)] opacity-90 transition group-hover:opacity-100" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-4 pb-4 pt-14 text-white">
           <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/75">班別</p>
           <p className="line-clamp-2 text-lg font-bold leading-snug">
            {classDisplayName({ subject: c.subject, courseName: c.course_name })}
           </p>
          </div>
         </div>
         <div className="space-y-2 px-4 py-3">
          {c.course_code_full ? (
           <p className="font-mono text-xs text-muted-foreground">{c.course_code_full}</p>
          ) : null}
          <p className="text-sm text-muted-foreground">{timeLabel(c)}</p>
          <p className="text-sm text-muted-foreground">{(c.grade ?? []).join("、") || "—"}</p>
          <div className="flex flex-wrap items-center gap-1">
           {c.class_kind === "private" ? (
            <Tag tone="info" size="sm">
             {classKindLabel("private")}
            </Tag>
           ) : null}
           <Tag tone={statusToTagTone(c.status)} size="sm">{c.status}</Tag>
          </div>
         </div>
        </Link>
       ))}
      </div>
     )}
    </div>
   ) : (
    <div className="flex gap-3 overflow-x-auto pb-2">
     {kanbanColumns.map((col) => (
      <div
       key={col.title}
       className="flex w-64 min-w-[14rem] shrink-0 flex-col rounded-xl border border-border bg-muted/20 p-2"
      >
       <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-sm font-semibold">{col.title}</span>
        <span className="text-xs text-muted-foreground">{col.items.length}</span>
       </div>
       <div className="flex flex-1 flex-col gap-2">
        {col.items.length === 0 ? (
         <div className="rounded-lg border border-dashed border-border/80 bg-card/50 py-8 text-center text-xs text-muted-foreground">
          暫無班別
         </div>
        ) : (
         col.items.map((c) => (
          <div
           key={c.id}
           role="button"
           tabIndex={0}
           onClick={() => navigate(`/Classes/${c.id}`)}
           onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
             e.preventDefault()
             navigate(`/Classes/${c.id}`)
            }
           }}
           className={cn("flex flex-col gap-2 p-3", cardInteractive)}
          >
           <div className="flex items-start justify-between gap-2">
            <span className="font-mono text-xs text-muted-foreground">
             {c.course_code_full ?? "—"}
            </span>
            <div className="flex flex-col items-end gap-0.5">
             {c.class_kind === "private" ? (
              <Tag tone="info" size="sm" className="text-[10px]">
               {classKindLabel("private")}
              </Tag>
             ) : null}
             <Tag tone={statusToTagTone(c.status)} size="sm" className="text-[10px]">
              {c.status}
             </Tag>
            </div>
           </div>
           <div className="text-base font-bold">
            {classDisplayName({ subject: c.subject, courseName: c.course_name })}
           </div>
           <div className="text-xs text-muted-foreground">{timeLabel(c)}</div>
           {c.teacher_id ? (
            <Link
             to={`/Teachers/${c.teacher_id}`}
             onClick={(e) => e.stopPropagation()}
             className="text-sm font-medium text-primary hover:underline"
            >
             {c.teacher_name}
            </Link>
           ) : (
            <span className="text-sm text-muted-foreground">未指派</span>
           )}
           <div className="text-sm font-semibold text-info">
            {c.price_per_lesson != null
             ? `HKD $${c.price_per_lesson}/節`
             : ""}
           </div>
           <div
            className="mt-1 flex justify-between border-t border-border pt-2 text-xs"
            onClick={(e) => e.stopPropagation()}
           >
            <button
             type="button"
             className="text-primary hover:underline"
             onClick={() => navigate(`/Classes/${c.id}`)}
            >
             查看
            </button>
           </div>
          </div>
         ))
        )}
       </div>
      </div>
     ))}
    </div>
   )}

   <p className="text-xs text-muted-foreground">
    點列表列、看板卡片或圖庫卡片進入班別詳情；老師姓名可連至老師頁。
   </p>
  </div>
 )
}
