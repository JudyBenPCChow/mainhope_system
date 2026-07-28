import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { CalendarDays, GraduationCap, Plus, SlidersHorizontal, Sparkles } from "lucide-react"

<<<<<<< Updated upstream
import { TrialConvertDialog, type TrialConvertDialogTarget } from "@/components/trials/TrialConvertDialog"
import {
 TrialOutcomeDialog,
 formatOutcomeSummary,
 type TrialOutcomeDialogTarget,
} from "@/components/trials/TrialOutcomeDialog"
import {
 TRIAL_CONVERT_DEMO_TODAY,
 TRIAL_OUTCOME_LABELS,
 cloneTrialConvertDemoRows,
 demoCanConvert,
 demoCanRecordOutcome,
 demoConvertBlockedReason,
 demoHasClosedOutcome,
 outcomeTagTone,
 type TrialConvertDemoRow,
 type TrialOutcome,
} from "@/components/trials/trialConvertDemoData"
=======
import {
 TrialConvertDialog,
 type TrialConvertDialogTarget,
 type TrialConvertSessionOption,
} from "@/components/trials/TrialConvertDialog"
import {
 TrialOutcomeDialog,
 type TrialOutcomeDialogTarget,
} from "@/components/trials/TrialOutcomeDialog"
>>>>>>> Stashed changes
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tag } from "@/components/ui/tag"
import { Select } from "@/components/ui/select"
import { MobileFilterSheet } from "@/components/mobile/MobileFilterSheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { formatClassLabel } from "@/lib/courseLabel"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import {
 TRIAL_OUTCOME_LABELS,
 formatOutcomeSummary,
 outcomeTagTone,
 type TrialOutcome,
} from "@/lib/trialOutcome"
import { statusToTagTone } from "@/lib/statusTag"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import { fetchAllClasses, getClassById, type ClassRecord } from "@/services/classQueries"
import { fetchUpcomingSchedulesForClass } from "@/services/leaveQueries"
import { PAYMENT_METHOD_PRESETS } from "@/services/paymentQueries"
import { listStudents } from "@/services/queries"
import { localYmd } from "@/services/scheduleQueries"
import { fetchAllTeachers, type TeacherRecord } from "@/services/teacherQueries"
import {
 convertTrialToEnrollment,
 deleteTrialSession,
 fetchTrialDashboardStats,
 fetchTrialsWithRelations,
 insertPaidTrialSession,
 insertTrialSession,
 recordTrialOutcome,
 trialCanConvert,
 trialCanRecordOutcome,
 trialConvertBlockedReason,
 trialStatusCategory,
 trialTypeCategory,
 updateTrialSession,
 type TrialDashboardStats,
 type TrialManageRow,
} from "@/services/trialQueries"

type StatusTab = "all" | "booked" | "done" | "cancel"
type TypeTab = "all" | "free" | "half" | "full"
type OutcomeTab = "all" | TrialOutcome

function matchesStatusTab(r: TrialManageRow, tab: StatusTab): boolean {
 if (tab === "all") return true
 return trialStatusCategory(r.status) === tab
}

function matchesTypeTab(r: TrialManageRow, tab: TypeTab): boolean {
 if (tab === "all") return true
 return trialTypeCategory(r.trial_type) === tab
}

function demoRowToManage(r: TrialConvertDemoRow): TrialManageRow {
 return {
  id: r.id,
  student_id: r.student_id,
  class_id: r.class_id,
  schedule_id: r.schedule_id,
  trial_date: r.trial_date,
  trial_type: r.trial_type,
  status: r.status,
  remarks: r.remarks,
  payment_id: r.payment_id,
  receipt_number: r.receipt_number,
  student_name: r.student_name,
  student_grade: r.student_grade,
  class_subject: r.class_subject,
  course_code_full: r.course_code_full,
  teacher_id: r.teacher_id,
  teacher_name: r.teacher_name,
  sched_date: r.sched_date,
  sched_start: r.sched_start,
  sched_end: r.sched_end,
 }
}

export function TrialSessionsView() {
 const { confirmDialog } = useAppConfirm()
 const { pushBanner } = useAppBanner()
 const isMobile = useIsMobile()
<<<<<<< Updated upstream
 const [searchParams, setSearchParams] = useSearchParams()
 const isDemo = searchParams.get("demo") === "1"
=======
>>>>>>> Stashed changes

 const [rows, setRows] = useState<TrialManageRow[]>([])
 const [demoRows, setDemoRows] = useState<TrialConvertDemoRow[]>([])
 const [stats, setStats] = useState<TrialDashboardStats>({ todayCount: 0, weekCount: 0 })
 const [loading, setLoading] = useState(true)
 const [filtersOpen, setFiltersOpen] = useState(false)
 const [err, setErr] = useState<string | null>(null)
 const [convertId, setConvertId] = useState<string | null>(null)
 const [outcomeId, setOutcomeId] = useState<string | null>(null)
 const [outcomeDefault, setOutcomeDefault] = useState<"lost" | "other">("lost")
 const [outcomeTab, setOutcomeTab] = useState<OutcomeTab>("all")

 const [statusTab, setStatusTab] = useState<StatusTab>("all")
 const [typeTab, setTypeTab] = useState<TypeTab>("all")
 const [outcomeTab, setOutcomeTab] = useState<OutcomeTab>("all")
 const [filterDateFrom, setFilterDateFrom] = useState("")
 const [filterDateTo, setFilterDateTo] = useState("")
 const [filterSubject, setFilterSubject] = useState("all")
 const [filterTeacherId, setFilterTeacherId] = useState("all")
 const [filterGrade, setFilterGrade] = useState("all")

 const [teachers, setTeachers] = useState<TeacherRecord[]>([])

 const [addOpen, setAddOpen] = useState(false)
 const [studentSearch, setStudentSearch] = useState("")
 const [studentPickerOpen, setStudentPickerOpen] = useState(false)
 const [addStudentId, setAddStudentId] = useState("")
 const [classSearch, setClassSearch] = useState("")
 const [classPickerOpen, setClassPickerOpen] = useState(false)
 const [addClassId, setAddClassId] = useState("")
 const [addScheduleId, setAddScheduleId] = useState("")
 const [addTrialType, setAddTrialType] = useState("免費試堂")
 const [addRemarks, setAddRemarks] = useState("")
 const [addSaving, setAddSaving] = useState(false)
 const [addErr, setAddErr] = useState<string | null>(null)
 const [payOpen, setPayOpen] = useState(false)
 const [payMethod, setPayMethod] = useState<string>(PAYMENT_METHOD_PRESETS[0] ?? "現金")
 const [payUnitPreview, setPayUnitPreview] = useState<number | null>(null)
 const [payAmountPreview, setPayAmountPreview] = useState<number | null>(null)
 const [classPickList, setClassPickList] = useState<{ id: string; label: string }[]>([])
 const [studentPickList, setStudentPickList] = useState<{ id: string; label: string }[]>([])
 const [schedOptions, setSchedOptions] = useState<{ id: string; label: string; date: string }[]>([])

<<<<<<< Updated upstream
 const applyDemoRows = useCallback((list: TrialConvertDemoRow[]) => {
  setDemoRows(list)
  setRows(list.map(demoRowToManage))
  const today = list.filter((r) => r.trial_date === TRIAL_CONVERT_DEMO_TODAY).length
  setStats({ todayCount: today, weekCount: list.filter((r) => r.status !== "取消").length })
  setTeachers([])
 }, [])
=======
 const [convertId, setConvertId] = useState<string | null>(null)
 const [convertSessions, setConvertSessions] = useState<TrialConvertSessionOption[]>([])
 const [convertSessionsLoading, setConvertSessionsLoading] = useState(false)
 const [convertSaving, setConvertSaving] = useState(false)
 const [outcomeId, setOutcomeId] = useState<string | null>(null)
 const [outcomeDefault, setOutcomeDefault] = useState<"lost" | "other">("lost")
 const [outcomeSaving, setOutcomeSaving] = useState(false)
>>>>>>> Stashed changes

 const reload = useCallback(async () => {
  if (isDemo) {
   applyDemoRows(cloneTrialConvertDemoRows())
   setLoading(false)
   setErr(null)
   return
  }
  if (!isSupabaseConfigured) return
  setLoading(true)
  setErr(null)
  try {
   const [list, st, tch] = await Promise.all([
    fetchTrialsWithRelations(),
    fetchTrialDashboardStats(),
    fetchAllTeachers(),
   ])
   setRows(list)
   setDemoRows([])
   setStats(st)
   setTeachers(tch)
  } catch (e) {
   reportUserFacingError(e, { source: "TrialSessionsView.reload", setErr })
   setRows([])
  } finally {
   setLoading(false)
  }
 }, [applyDemoRows, isDemo])

 useEffect(() => {
  void reload()
 }, [reload])

 const setDemoMode = (on: boolean) => {
  const next = new URLSearchParams(searchParams)
  if (on) next.set("demo", "1")
  else next.delete("demo")
  setSearchParams(next, { replace: true })
 }

 const convertTarget: TrialConvertDialogTarget | null = useMemo(() => {
  if (!convertId || !isDemo) return null
  const d = demoRows.find((r) => r.id === convertId)
  if (!d) return null
  return {
   id: d.id,
   studentName: d.student_name ?? "—",
   studentGrade: d.student_grade,
   classLabel: d.class_subject ?? "—",
   trialDate: d.trial_date,
   schedStart: d.sched_start,
   schedEnd: d.sched_end,
   courseMode: d.courseMode,
   pricePerLesson: d.pricePerLesson,
  }
 }, [convertId, demoRows, isDemo])

 const outcomeTarget: TrialOutcomeDialogTarget | null = useMemo(() => {
  if (!outcomeId || !isDemo) return null
  const d = demoRows.find((r) => r.id === outcomeId)
  if (!d) return null
  return {
   id: d.id,
   studentName: d.student_name ?? "—",
   studentGrade: d.student_grade,
   classLabel: d.class_subject ?? "—",
   trialDate: d.trial_date,
  }
 }, [demoRows, isDemo, outcomeId])

 const openOutcome = (id: string, kind: "lost" | "other") => {
  setOutcomeDefault(kind)
  setOutcomeId(id)
 }

 const markDemoRollCall = (id: string) => {
  const next = demoRows.map((r) =>
   r.id === id ? { ...r, rollCallDone: true, status: "已完成" } : r
  )
  applyDemoRows(next)
  pushBanner({
   tone: "info",
   title: "預覽：模擬點名完成",
   message: "可轉正，或登記流失／其他結果。",
  })
 }

 const demoOutcomeStats = useMemo(() => {
  if (!isDemo) return null
  const open = demoRows.filter((r) => r.outcome === "open").length
  const converted = demoRows.filter((r) => r.outcome === "converted").length
  const lost = demoRows.filter((r) => r.outcome === "lost").length
  const other = demoRows.filter((r) => r.outcome === "other").length
  const closed = converted + lost + other
  const rate = closed > 0 ? Math.round((converted / closed) * 1000) / 10 : null
  return { open, converted, lost, other, closed, rate }
 }, [demoRows, isDemo])

 useEffect(() => {
  if (!addOpen) return
  setAddErr(null)
  setStudentSearch("")
  setStudentPickerOpen(false)
  setAddStudentId("")
  setClassSearch("")
  setClassPickerOpen(false)
  setAddClassId("")
  void fetchAllClasses().then((cls: ClassRecord[]) => {
   setClassPickList(
    cls.map((c) => ({
     id: c.id,
     label: formatClassLabel({
      subject: c.subject,
      courseCode: c.course_code_full,
      courseName: c.course_name,
     }),
    }))
   )
  })
  void listStudents().then((raw) => {
   const sl = (raw as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    label: `${String(r.full_name ?? "—")}（${String(r.grade ?? "—")}）`,
   }))
   setStudentPickList(sl)
  })
  setAddScheduleId("")
  setAddTrialType("免費試堂")
  setAddRemarks("")
 }, [addOpen])

 const studentsFiltered = useMemo(() => {
  const q = studentSearch.trim().toLowerCase()
  if (!q) return studentPickList.slice(0, 20)
  return studentPickList.filter((s) => s.label.toLowerCase().includes(q)).slice(0, 20)
 }, [studentPickList, studentSearch])

 const classesFiltered = useMemo(() => {
  const q = classSearch.trim().toLowerCase()
  if (!q) return classPickList.slice(0, 20)
  return classPickList.filter((c) => c.label.toLowerCase().includes(q)).slice(0, 20)
 }, [classPickList, classSearch])

 useEffect(() => {
  if (!addOpen || !addClassId) {
   setSchedOptions([])
   setAddScheduleId("")
   return
  }
  void fetchUpcomingSchedulesForClass(addClassId, localYmd()).then((sched) => {
   const opts = sched.slice(0, 10).map((s) => ({
    id: s.id,
    date: s.scheduled_date,
    label: `${s.scheduled_date} ${s.start_time ?? "—"}–${s.end_time ?? "—"}`,
   }))
   setSchedOptions(opts)
   setAddScheduleId((prev) => {
    if (prev && opts.some((o) => o.id === prev)) return prev
    return opts[0]?.id ?? ""
   })
  })
 }, [addOpen, addClassId])

 useEffect(() => {
  if (!convertId) {
   setConvertSessions([])
   return
  }
  const row = rows.find((r) => r.id === convertId)
  if (!row) return
  setConvertSessionsLoading(true)
  void fetchUpcomingSchedulesForClass(row.class_id, localYmd())
   .then((sched) => {
    setConvertSessions(
     sched.map((s) => ({
      id: s.id,
      sessionNumber: null,
      date: s.scheduled_date,
      start: (s.start_time ?? "—").slice(0, 5),
      end: (s.end_time ?? "—").slice(0, 5),
     }))
    )
   })
   .catch((e) => {
    reportUserFacingError(e, { source: "TrialSessionsView.convertSessions" })
    setConvertSessions([])
   })
   .finally(() => setConvertSessionsLoading(false))
 }, [convertId, rows])

 const subjectOptions = useMemo(() => {
  const s = new Set<string>()
  for (const r of rows) {
   if (r.class_subject) s.add(r.class_subject)
  }
  return [...s].sort((a, b) => a.localeCompare(b, "zh-Hant"))
 }, [rows])

 const gradeOptions = useMemo(() => {
  const g = new Set<string>()
  for (const r of rows) {
   if (r.student_grade) g.add(r.student_grade)
  }
  return [...g].sort((a, b) => a.localeCompare(b, "zh-Hant"))
 }, [rows])

 const statusCounts = useMemo(() => {
  let booked = 0
  let done = 0
  let cancel = 0
  for (const r of rows) {
   const c = trialStatusCategory(r.status)
   if (c === "cancel") cancel++
   else if (c === "done") done++
   else booked++
  }
  return { all: rows.length, booked, done, cancel }
 }, [rows])

 const typeCounts = useMemo(() => {
  let free = 0
  let half = 0
  let full = 0
  for (const r of rows) {
   const c = trialTypeCategory(r.trial_type)
   if (c === "free") free++
   else if (c === "half") half++
   else if (c === "full") full++
  }
  return { all: rows.length, free, half, full }
 }, [rows])

 const outcomeStats = useMemo(() => {
  const open = rows.filter((r) => r.outcome === "open").length
  const converted = rows.filter((r) => r.outcome === "converted").length
  const lost = rows.filter((r) => r.outcome === "lost").length
  const other = rows.filter((r) => r.outcome === "other").length
  const closed = converted + lost + other
  const rate = closed > 0 ? Math.round((converted / closed) * 1000) / 10 : null
  return { open, converted, lost, other, closed, rate }
 }, [rows])

 const filtered = useMemo(() => {
  return rows.filter((r) => {
   if (!matchesStatusTab(r, statusTab)) return false
   if (!matchesTypeTab(r, typeTab)) return false
<<<<<<< Updated upstream
   if (isDemo && outcomeTab !== "all") {
    const d = demoRows.find((x) => x.id === r.id)
    if ((d?.outcome ?? "open") !== outcomeTab) return false
   }
=======
   if (outcomeTab !== "all" && r.outcome !== outcomeTab) return false
>>>>>>> Stashed changes
   if (filterSubject !== "all" && (r.class_subject ?? "") !== filterSubject) return false
   if (filterTeacherId !== "all" && (r.teacher_id ?? "") !== filterTeacherId) return false
   if (filterGrade !== "all" && (r.student_grade ?? "") !== filterGrade) return false
   if (filterDateFrom && r.trial_date < filterDateFrom) return false
   if (filterDateTo && r.trial_date > filterDateTo) return false
   return true
  })
 }, [
  rows,
<<<<<<< Updated upstream
  demoRows,
  isDemo,
=======
>>>>>>> Stashed changes
  statusTab,
  typeTab,
  outcomeTab,
  filterSubject,
  filterTeacherId,
  filterGrade,
  filterDateFrom,
  filterDateTo,
 ])

 const activeFilterCount = useMemo(() => {
  let n = 0
  if (statusTab !== "all") n += 1
  if (typeTab !== "all") n += 1
<<<<<<< Updated upstream
  if (isDemo && outcomeTab !== "all") n += 1
=======
  if (outcomeTab !== "all") n += 1
>>>>>>> Stashed changes
  if (filterDateFrom) n += 1
  if (filterDateTo) n += 1
  if (filterSubject !== "all") n += 1
  if (filterTeacherId !== "all") n += 1
  if (filterGrade !== "all") n += 1
  return n
 }, [
  statusTab,
  typeTab,
  outcomeTab,
<<<<<<< Updated upstream
  isDemo,
=======
>>>>>>> Stashed changes
  filterDateFrom,
  filterDateTo,
  filterSubject,
  filterTeacherId,
  filterGrade,
 ])

 const resetFilters = useCallback(() => {
  setStatusTab("all")
  setTypeTab("all")
  setOutcomeTab("all")
  setFilterDateFrom("")
  setFilterDateTo("")
  setFilterSubject("all")
  setFilterTeacherId("all")
  setFilterGrade("all")
 }, [])

 const convertTarget: TrialConvertDialogTarget | null = useMemo(() => {
  if (!convertId) return null
  const r = rows.find((x) => x.id === convertId)
  if (!r) return null
  return {
   id: r.id,
   studentName: r.student_name ?? "—",
   studentGrade: r.student_grade,
   classLabel: r.class_subject ?? "—",
   trialDate: r.trial_date,
   schedStart: r.sched_start,
   schedEnd: r.sched_end,
   courseMode: r.course_mode,
   pricePerLesson: r.price_per_lesson != null && r.price_per_lesson > 0 ? r.price_per_lesson : 0,
  }
 }, [convertId, rows])

 const outcomeTarget: TrialOutcomeDialogTarget | null = useMemo(() => {
  if (!outcomeId) return null
  const r = rows.find((x) => x.id === outcomeId)
  if (!r) return null
  return {
   id: r.id,
   studentName: r.student_name ?? "—",
   studentGrade: r.student_grade,
   classLabel: r.class_subject ?? "—",
   trialDate: r.trial_date,
  }
 }, [outcomeId, rows])

 const openOutcome = (id: string, kind: "lost" | "other") => {
  setOutcomeDefault(kind)
  setOutcomeId(id)
 }

 const chipClass = (active: boolean) =>
  cn(
   "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
   active
    ? "border-info bg-info text-white shadow-sm"
    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
  )

 const renderTrialFilterPanel = () => (
  <div className="space-y-5">
   <div className="flex flex-col gap-2">
    <span className="text-xs font-medium text-muted-foreground">狀態</span>
    <div className="flex flex-wrap gap-2" role="tablist">
     {(
      [
       ["all", `全部 ${statusCounts.all}`],
       ["booked", `已預約 ${statusCounts.booked}`],
       ["done", `已完成 ${statusCounts.done}`],
       ["cancel", `取消 ${statusCounts.cancel}`],
      ] as const
     ).map(([id, label]) => (
      <button
       key={id}
       type="button"
       role="tab"
       aria-selected={statusTab === id}
       onClick={() => setStatusTab(id)}
       className={chipClass(statusTab === id)}
      >
       {label}
      </button>
     ))}
    </div>
   </div>
   <div className="flex flex-col gap-2">
    <span className="text-xs font-medium text-muted-foreground">結果（復盤）</span>
    <div className="flex flex-wrap gap-2" role="tablist">
     {(
      [
       ["all", `全部 ${rows.length}`],
       ["open", `${TRIAL_OUTCOME_LABELS.open} ${outcomeStats.open}`],
       ["converted", `${TRIAL_OUTCOME_LABELS.converted} ${outcomeStats.converted}`],
       ["lost", `${TRIAL_OUTCOME_LABELS.lost} ${outcomeStats.lost}`],
       ["other", `${TRIAL_OUTCOME_LABELS.other} ${outcomeStats.other}`],
      ] as const
     ).map(([id, label]) => (
      <button
       key={id}
       type="button"
       role="tab"
       aria-selected={outcomeTab === id}
       onClick={() => setOutcomeTab(id)}
       className={chipClass(outcomeTab === id)}
      >
       {label}
      </button>
     ))}
    </div>
   </div>
   {isDemo && demoOutcomeStats ? (
    <div className="flex flex-col gap-2">
     <span className="text-xs font-medium text-muted-foreground">結果（復盤）</span>
     <div className="flex flex-wrap gap-2" role="tablist">
      {(
       [
        ["all", `全部 ${demoRows.length}`],
        ["open", `${TRIAL_OUTCOME_LABELS.open} ${demoOutcomeStats.open}`],
        ["converted", `${TRIAL_OUTCOME_LABELS.converted} ${demoOutcomeStats.converted}`],
        ["lost", `${TRIAL_OUTCOME_LABELS.lost} ${demoOutcomeStats.lost}`],
        ["other", `${TRIAL_OUTCOME_LABELS.other} ${demoOutcomeStats.other}`],
       ] as const
      ).map(([id, label]) => (
       <button
        key={id}
        type="button"
        role="tab"
        aria-selected={outcomeTab === id}
        onClick={() => setOutcomeTab(id)}
        className={cn(
         "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
         outcomeTab === id
          ? "border-info bg-info text-white shadow-sm"
          : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
        )}
       >
        {label}
       </button>
      ))}
     </div>
    </div>
   ) : null}
   <div className="flex flex-col gap-2">
    <span className="text-xs font-medium text-muted-foreground">類型</span>
    <div className="flex flex-wrap gap-2" role="tablist">
     {(
      [
       ["all", `全部 ${typeCounts.all}`],
       ["free", `免費試堂 ${typeCounts.free}`],
       ["half", `半價試堂 ${typeCounts.half}`],
       ["full", `原價試堂 ${typeCounts.full}`],
      ] as const
     ).map(([id, label]) => (
      <button
       key={id}
       type="button"
       role="tab"
       aria-selected={typeTab === id}
       onClick={() => setTypeTab(id)}
       className={chipClass(typeTab === id)}
      >
       {label}
      </button>
     ))}
    </div>
   </div>
   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <label className="grid gap-1 text-xs">
     <span className="text-muted-foreground">試堂日起</span>
     <Input type="date" className="h-9" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
    </label>
    <label className="grid gap-1 text-xs">
     <span className="text-muted-foreground">試堂日迄</span>
     <Input type="date" className="h-9" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
    </label>
    <label className="grid gap-1 text-xs">
     <span className="text-muted-foreground">班別</span>
     <Select className="h-9" value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
      <option value="all">全部</option>
      {subjectOptions.map((s) => (
       <option key={s} value={s}>
        {s}
       </option>
      ))}
     </Select>
    </label>
    <label className="grid gap-1 text-xs">
     <span className="text-muted-foreground">老師</span>
     <Select className="h-9" value={filterTeacherId} onChange={(e) => setFilterTeacherId(e.target.value)}>
      <option value="all">全部</option>
      {teachers.map((t) => (
       <option key={t.id} value={t.id}>
        {t.full_name}
       </option>
      ))}
     </Select>
    </label>
    <label className="grid gap-1 text-xs">
     <span className="text-muted-foreground">年級</span>
     <Select className="h-9" value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)}>
      <option value="all">全部</option>
      {gradeOptions.map((g) => (
       <option key={g} value={g}>
        {g}
       </option>
      ))}
     </Select>
    </label>
   </div>
  </div>
 )

 const openAdd = () => setAddOpen(true)

 const submitAdd = async () => {
  const selectedSched = schedOptions.find((o) => o.id === addScheduleId)
  if (!addStudentId || !addClassId || !addScheduleId || !selectedSched) {
   setAddErr("請選擇學生、班別，並確認有可用的未來排程")
   return
  }
  const cat = trialTypeCategory(addTrialType)
  if (cat === "half" || cat === "full") {
   setAddErr(null)
   setAddSaving(true)
   try {
    const cls = await getClassById(addClassId)
    const base = cls?.price_per_lesson != null ? Number(cls.price_per_lesson) : 0
    if (!(base > 0)) {
     setAddErr("此班別／課程尚未設定每堂單價，無法建立半價／原價試堂收費")
     return
    }
    const unit = cat === "half" ? Math.round(base * 0.5 * 100) / 100 : base
    setPayUnitPreview(unit)
    setPayAmountPreview(unit)
    setPayMethod(PAYMENT_METHOD_PRESETS[0] ?? "現金")
    setPayOpen(true)
   } catch (e) {
    const msg = e instanceof Error ? e.message : "無法載入班別單價"
    reportUserFacingError(e, { source: "TrialSessionsView.preparePay", setErr: setAddErr, userMessage: msg })
   } finally {
    setAddSaving(false)
   }
   return
  }
  setAddSaving(true)
  setAddErr(null)
  try {
   await insertTrialSession({
    student_id: addStudentId,
    class_id: addClassId,
    schedule_id: addScheduleId,
    trial_date: selectedSched.date,
    trial_type: addTrialType,
    status: "已預約",
    remarks: addRemarks || null,
   })
   setAddOpen(false)
   await reload()
  } catch (e) {
   const msg = e instanceof Error ? e.message : "新增失敗"
   reportUserFacingError(e, { source: "TrialSessionsView.onAdd", setErr: setAddErr, userMessage: msg })
  } finally {
   setAddSaving(false)
  }
 }

 const confirmPaidTrial = async () => {
  const selectedSched = schedOptions.find((o) => o.id === addScheduleId)
  if (!addStudentId || !addClassId || !addScheduleId || !selectedSched || payUnitPreview == null) {
   setAddErr("付費資料不完整")
   return
  }
  setAddSaving(true)
  setAddErr(null)
  try {
   const { receiptNumber } = await insertPaidTrialSession({
    studentId: addStudentId,
    classId: addClassId,
    scheduleId: addScheduleId,
    trialDate: selectedSched.date,
    trialType: addTrialType,
    remarks: addRemarks || null,
    paymentMethod: payMethod,
    unitPrice: payUnitPreview,
   })
   setPayOpen(false)
   setAddOpen(false)
   pushBanner({
    tone: "success",
    title: "已建立試堂並入帳",
    message: receiptNumber ? `收據編號 ${receiptNumber}` : "已收款並建立試堂紀錄",
   })
   await reload()
  } catch (e) {
   const msg = e instanceof Error ? e.message : "收費並建立試堂失敗"
   reportUserFacingError(e, { source: "TrialSessionsView.confirmPaidTrial", setErr: setAddErr, userMessage: msg })
  } finally {
   setAddSaving(false)
  }
 }

 if (!isDemo && !isSupabaseConfigured) {
  return (
   <div role="alert" className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
    尚未設定 Supabase（請建立 <code className="rounded bg-white/60 px-1">.env</code>）。
    <div className="mt-2">
     <Button type="button" size="sm" variant="outline" onClick={() => setDemoMode(true)}>
      改以假資料預覽轉化 UI
     </Button>
    </div>
   </div>
  )
 }

 return (
  <div className="space-y-4">
   <header className="flex flex-wrap items-start justify-between gap-3">
    <div>
     <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
      <Sparkles className="h-7 w-7 text-info" aria-hidden />
      試堂紀錄
<<<<<<< Updated upstream
      <Tag tone="info" size="sm">{rows.length} 筆</Tag>
      {isDemo ? (
       <Tag tone="warning" size="sm">
        轉化 UI 預覽
       </Tag>
      ) : null}
     </h1>
     <p className="mt-1 hidden text-sm text-muted-foreground md:block">
      試堂資料與排程連結；點學生或班別可開啟詳情頁。
     </p>
    </div>
    <div className="flex flex-wrap gap-2">
     {isDemo ? (
      <Button type="button" variant="outline" onClick={() => setDemoMode(false)}>
       離開預覽
      </Button>
     ) : (
      <Button type="button" variant="outline" onClick={() => setDemoMode(true)}>
       預覽轉化 UI
      </Button>
     )}
     <Button
      type="button"
      className="gap-1 bg-info text-white hover:bg-info"
      onClick={openAdd}
      disabled={isDemo}
      title={isDemo ? "預覽模式不支援新增真實試堂" : undefined}
     >
      <Plus className="h-4 w-4" />
      新增試堂
     </Button>
=======
      <Tag tone="info" size="sm">
       {rows.length} 筆
      </Tag>
     </h1>
     <p className="mt-1 hidden text-sm text-muted-foreground md:block">
      試堂資料與排程連結；點名完成後可轉正式報讀，或登記流失／其他結果以便復盤。
     </p>
>>>>>>> Stashed changes
    </div>
   </header>

   {isDemo ? (
    <div
     role="status"
     className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning-foreground"
    >
     正在用假資料預覽試堂結果：轉正、流失、其他結果（復盤）。不會寫入資料庫。
    </div>
   ) : null}

   {isDemo && demoOutcomeStats ? (
    <section
     className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:gap-3"
     aria-label="結果復盤概覽"
    >
     <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm md:p-3">
      <div className="text-[11px] text-muted-foreground md:text-xs">已結案轉化率</div>
      <p className="mt-1 text-xl font-bold tabular-nums md:text-2xl">
       {demoOutcomeStats.rate != null ? `${demoOutcomeStats.rate}%` : "—"}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">轉化 ÷（轉化＋流失＋其他）</p>
     </div>
     <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm md:p-3">
      <div className="text-[11px] text-muted-foreground md:text-xs">已轉化</div>
      <p className="mt-1 text-xl font-bold tabular-nums text-success md:text-2xl">
       {demoOutcomeStats.converted}
      </p>
     </div>
     <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm md:p-3">
      <div className="text-[11px] text-muted-foreground md:text-xs">已流失</div>
      <p className="mt-1 text-xl font-bold tabular-nums text-destructive md:text-2xl">
       {demoOutcomeStats.lost}
      </p>
     </div>
     <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm md:p-3">
      <div className="text-[11px] text-muted-foreground md:text-xs">待跟進</div>
      <p className="mt-1 text-xl font-bold tabular-nums md:text-2xl">{demoOutcomeStats.open}</p>
     </div>
    </section>
   ) : null}

   {err ? (
    <div
     className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
     role="alert"
    >
     {err}
    </div>
   ) : null}

   <section className="grid grid-cols-2 gap-2 md:gap-3" aria-label="試堂概覽">
    <div className="rounded-xl border border-info bg-info p-2.5 text-info-foreground shadow-sm md:p-4">
     <div className="flex items-center gap-1 text-[11px] font-medium text-info-foreground/90 md:gap-2 md:text-sm">
      <CalendarDays className="h-3.5 w-3.5 md:h-4 md:w-4" aria-hidden />
      今天試堂
     </div>
     <p className="mt-1 text-xl font-bold tabular-nums md:mt-2 md:text-3xl">{stats.todayCount}</p>
     <p className="mt-1 hidden text-xs text-info-foreground/85 md:block">試堂日期為今天之筆數（含各狀態）</p>
    </div>
    <div className="rounded-xl border border-info bg-info p-2.5 text-info-foreground shadow-sm md:p-4">
     <div className="flex items-center gap-1 text-[11px] font-medium text-info-foreground/90 md:gap-2 md:text-sm">
      <GraduationCap className="h-3.5 w-3.5 md:h-4 md:w-4" aria-hidden />
      本星期試堂
     </div>
     <p className="mt-1 text-xl font-bold tabular-nums md:mt-2 md:text-3xl">{stats.weekCount}</p>
     <p className="mt-1 hidden text-xs text-info-foreground/85 md:block">本週一至週日（依試堂日期）之筆數</p>
    </div>
   </section>

   <section className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:gap-3" aria-label="結果復盤概覽">
    <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm md:p-3">
     <div className="text-[11px] text-muted-foreground md:text-xs">已結案轉化率</div>
     <p className="mt-1 text-xl font-bold tabular-nums md:text-2xl">
      {outcomeStats.rate != null ? `${outcomeStats.rate}%` : "—"}
     </p>
     <p className="mt-0.5 text-[11px] text-muted-foreground">轉化 ÷（轉化＋流失＋其他）</p>
    </div>
    <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm md:p-3">
     <div className="text-[11px] text-muted-foreground md:text-xs">已轉化</div>
     <p className="mt-1 text-xl font-bold tabular-nums text-success md:text-2xl">{outcomeStats.converted}</p>
    </div>
    <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm md:p-3">
     <div className="text-[11px] text-muted-foreground md:text-xs">已流失</div>
     <p className="mt-1 text-xl font-bold tabular-nums text-destructive md:text-2xl">{outcomeStats.lost}</p>
    </div>
    <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm md:p-3">
     <div className="text-[11px] text-muted-foreground md:text-xs">待跟進</div>
     <p className="mt-1 text-xl font-bold tabular-nums md:text-2xl">{outcomeStats.open}</p>
    </div>
   </section>

   {isMobile ? (
    <>
     <Button type="button" variant="outline" className="gap-2" onClick={() => setFiltersOpen(true)}>
      <SlidersHorizontal className="h-4 w-4" aria-hidden />
      篩選
      {activeFilterCount > 0 ? (
       <Tag tone="info" size="sm">
        {activeFilterCount}
       </Tag>
      ) : null}
     </Button>
     <MobileFilterSheet
      open={filtersOpen}
      onClose={() => setFiltersOpen(false)}
      title="篩選試堂"
      activeCount={activeFilterCount}
      onReset={resetFilters}
     >
      {renderTrialFilterPanel()}
     </MobileFilterSheet>
    </>
   ) : (
    <div className="space-y-3 rounded-xl border border-border bg-card p-3 shadow-sm">{renderTrialFilterPanel()}</div>
   )}

   {loading ? (
    <p className="text-sm text-muted-foreground">載入中…</p>
   ) : filtered.length === 0 ? (
    <p className="py-12 text-center text-sm text-muted-foreground">此條件下沒有紀錄</p>
   ) : (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
<<<<<<< Updated upstream
     <table className="w-full min-w-[960px] table-fixed border-collapse text-sm">
      <thead>
       <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
        <th className="w-[11%] px-3 py-2 font-medium">日期</th>
        <th className="w-[13%] px-3 py-2 font-medium">學生</th>
        <th className="w-[16%] px-3 py-2 font-medium">班別</th>
        <th className="w-[9%] px-3 py-2 font-medium">時間</th>
        <th className="w-[8%] px-3 py-2 font-medium">類型</th>
        <th className="w-[8%] px-3 py-2 font-medium">狀態</th>
        <th className="w-[14%] px-3 py-2 font-medium">{isDemo ? "結果" : "備註"}</th>
        <th className="w-[21%] px-3 py-2 font-medium">操作</th>
=======
     <table className="w-full min-w-[1000px] table-fixed border-collapse text-sm">
      <thead>
       <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
        <th className="w-[10%] px-3 py-2 font-medium">日期</th>
        <th className="w-[12%] px-3 py-2 font-medium">學生</th>
        <th className="w-[16%] px-3 py-2 font-medium">班別</th>
        <th className="w-[9%] px-3 py-2 font-medium">時間</th>
        <th className="w-[8%] px-3 py-2 font-medium">類型</th>
        <th className="w-[9%] px-3 py-2 font-medium">狀態</th>
        <th className="w-[14%] px-3 py-2 font-medium">結果</th>
        <th className="w-[22%] px-3 py-2 font-medium">操作</th>
>>>>>>> Stashed changes
       </tr>
      </thead>
      <tbody>
       {filtered.map((r) => {
<<<<<<< Updated upstream
        const demo = isDemo ? demoRows.find((d) => d.id === r.id) : undefined
        const canConvert = demo ? demoCanConvert(demo) : false
        const blocked = demo ? demoConvertBlockedReason(demo) : null
        const canOutcome = demo ? demoCanRecordOutcome(demo) : false
        const closed = demo ? demoHasClosedOutcome(demo) : false
        return (
        <tr key={r.id} className="border-b border-border last:border-0">
         <td className="px-3 py-2 align-top tabular-nums text-muted-foreground">{r.trial_date}</td>
         <td className="px-3 py-2 align-top">
          {isDemo ? (
           <span className="font-medium">{r.student_name ?? "—"}</span>
          ) : (
           <Link to={`/Students/${r.student_id}`} className="font-medium text-info hover:underline">
            {r.student_name ?? "—"}
           </Link>
          )}
          <div className="text-xs text-muted-foreground">{r.student_grade ?? "—"}</div>
         </td>
         <td className="px-3 py-2 align-top">
          {isDemo ? (
           <span className="font-medium">{r.class_subject ?? "—"}</span>
          ) : (
           <Link to={`/Classes/${r.class_id}`} className="font-medium text-info hover:underline">
            {r.class_subject ?? "—"}
           </Link>
          )}
          {r.course_code_full ? (
           <div className="font-mono text-xs text-muted-foreground">{r.course_code_full}</div>
          ) : null}
         </td>
         <td className="px-3 py-2 align-top tabular-nums text-muted-foreground">
          {r.sched_start && r.sched_end ? `${r.sched_start}–${r.sched_end}` : "—"}
         </td>
         <td className="px-3 py-2 align-top">
          <Tag tone={statusToTagTone(r.trial_type)} size="sm">
           {r.trial_type}
          </Tag>
         </td>
         <td className="px-3 py-2 align-top" onClick={(e) => e.stopPropagation()}>
          {isDemo ? (
           <Tag tone={statusToTagTone(r.status)} size="sm">
            {r.status}
           </Tag>
          ) : (
=======
        const canConvert = trialCanConvert(r)
        const blocked = trialConvertBlockedReason(r)
        const canOutcome = trialCanRecordOutcome(r)
        return (
         <tr key={r.id} className="border-b border-border last:border-0">
          <td className="px-3 py-2 align-top tabular-nums text-muted-foreground">{r.trial_date}</td>
          <td className="px-3 py-2 align-top">
           <Link to={`/Students/${r.student_id}`} className="font-medium text-info hover:underline">
            {r.student_name ?? "—"}
           </Link>
           <div className="text-xs text-muted-foreground">{r.student_grade ?? "—"}</div>
          </td>
          <td className="px-3 py-2 align-top">
           <Link to={`/Classes/${r.class_id}`} className="font-medium text-info hover:underline">
            {r.class_subject ?? "—"}
           </Link>
           {r.course_code_full ? (
            <div className="font-mono text-xs text-muted-foreground">{r.course_code_full}</div>
           ) : null}
          </td>
          <td className="px-3 py-2 align-top tabular-nums text-muted-foreground">
           {r.sched_start && r.sched_end ? `${r.sched_start}–${r.sched_end}` : "—"}
          </td>
          <td className="px-3 py-2 align-top">
           <Tag tone={statusToTagTone(r.trial_type)} size="sm">
            {r.trial_type}
           </Tag>
          </td>
          <td className="px-3 py-2 align-top" onClick={(e) => e.stopPropagation()}>
>>>>>>> Stashed changes
           <Select
            className="h-9 w-full min-w-[6.5rem] text-xs"
            value={r.status}
            onChange={async (e) => {
             await updateTrialSession(r.id, { status: e.target.value })
             await reload()
            }}
           >
            <option value="已預約">已預約</option>
            <option value="已完成">已完成</option>
            <option value="取消">取消</option>
           </Select>
<<<<<<< Updated upstream
          )}
         </td>
         <td className="px-3 py-2 align-top text-xs text-muted-foreground">
          {isDemo && demo ? (
           <div className="space-y-1">
            <Tag tone={outcomeTagTone(demo.outcome)} size="sm">
             {TRIAL_OUTCOME_LABELS[demo.outcome]}
            </Tag>
            {demo.outcomeReason ? <div>{demo.outcomeReason}</div> : null}
            {demo.outcomeNote ? <div className="text-[11px]">{demo.outcomeNote}</div> : null}
            {demo.outcomeAt ? (
             <div className="tabular-nums text-[11px]">{demo.outcomeAt}</div>
            ) : null}
            {r.receipt_number ? (
             <div className="font-mono text-[11px] text-foreground">收據 {r.receipt_number}</div>
            ) : null}
           </div>
          ) : (
           <>
            {r.receipt_number ? (
             <div className="font-mono text-[11px] text-foreground">收據 {r.receipt_number}</div>
            ) : null}
            {r.remarks ?? (r.receipt_number ? null : "—")}
           </>
          )}
         </td>
         <td className="px-3 py-2 align-top">
          <div className="flex flex-col items-start gap-1">
           {isDemo && demo ? (
            <>
             {closed ? null : (
              <>
               <Button
                type="button"
                size="sm"
                disabled={!canConvert}
                title={blocked ?? undefined}
                onClick={() => setConvertId(r.id)}
               >
                轉正式報讀
               </Button>
               {canOutcome ? (
                <div className="flex flex-wrap gap-2">
                 <button
                  type="button"
                  className="text-xs font-medium text-destructive hover:underline"
                  onClick={() => openOutcome(r.id, "lost")}
                 >
                  標流失
                 </button>
                 <button
                  type="button"
                  className="text-xs font-medium text-info hover:underline"
                  onClick={() => openOutcome(r.id, "other")}
                 >
                  其他結果
                 </button>
                </div>
               ) : null}
               {blocked && !canConvert ? (
                <span className="text-xs text-muted-foreground">{blocked}</span>
               ) : null}
               {!demo.rollCallDone && !String(demo.status).includes("取消") ? (
                <button
                 type="button"
                 className="text-xs font-medium text-info hover:underline"
                 onClick={() => markDemoRollCall(r.id)}
                >
                 模擬完成點名
                </button>
               ) : null}
              </>
             )}
            </>
           ) : (
=======
          </td>
          <td className="px-3 py-2 align-top text-xs text-muted-foreground">
           <div className="space-y-1">
            <Tag tone={outcomeTagTone(r.outcome)} size="sm">
             {TRIAL_OUTCOME_LABELS[r.outcome]}
            </Tag>
            {r.outcome_reason ? <div>{r.outcome_reason}</div> : null}
            {r.outcome_note ? <div className="text-[11px]">{r.outcome_note}</div> : null}
            {r.receipt_number ? (
             <div className="font-mono text-[11px] text-foreground">收據 {r.receipt_number}</div>
            ) : null}
            {!r.outcome_reason && !r.outcome_note && !r.receipt_number && r.remarks ? (
             <div>{r.remarks}</div>
            ) : null}
           </div>
          </td>
          <td className="px-3 py-2 align-top">
           <div className="flex flex-col items-start gap-1">
            {canConvert || canOutcome ? (
             <>
              {canConvert ? (
               <Button type="button" size="sm" onClick={() => setConvertId(r.id)}>
                轉正式報讀
               </Button>
              ) : blocked ? (
               <span className="text-xs text-muted-foreground">{blocked}</span>
              ) : null}
              {canOutcome ? (
               <div className="flex flex-wrap gap-2">
                <button
                 type="button"
                 className="text-xs font-medium text-destructive hover:underline"
                 onClick={() => openOutcome(r.id, "lost")}
                >
                 標流失
                </button>
                <button
                 type="button"
                 className="text-xs font-medium text-info hover:underline"
                 onClick={() => openOutcome(r.id, "other")}
                >
                 其他結果
                </button>
               </div>
              ) : null}
             </>
            ) : null}
>>>>>>> Stashed changes
            <button
             type="button"
             className="text-xs font-medium text-destructive hover:underline"
             onClick={async () => {
<<<<<<< Updated upstream
             if (!(await confirmDialog({ title: "刪除試堂紀錄", description: "確定刪除此筆試堂？", confirmText: "確認刪除", tone: "destructive" }))) return
=======
              if (
               !(await confirmDialog({
                title: "刪除試堂紀錄",
                description: "確定刪除此筆試堂？",
                confirmText: "確認刪除",
                tone: "destructive",
               }))
              )
               return
>>>>>>> Stashed changes
              await deleteTrialSession(r.id)
              await reload()
             }}
            >
             刪除
            </button>
<<<<<<< Updated upstream
           )}
          </div>
         </td>
        </tr>
=======
           </div>
          </td>
         </tr>
>>>>>>> Stashed changes
        )
       })}
      </tbody>
     </table>
     <div className="border-t border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
      共 {filtered.length} 筆試堂紀錄
      {filtered.length !== rows.length ? `（全部 ${rows.length} 筆）` : null}
     </div>
    </div>
   )}

   <Dialog open={addOpen} onOpenChange={setAddOpen}>
    <DialogContent className="max-w-md">
     <DialogHeader>
      <DialogTitle>新增試堂</DialogTitle>
     </DialogHeader>
     <div className="grid gap-3 text-sm">
      <label className="grid gap-1">
       <span className="text-muted-foreground">學生（可搜尋姓名／年級）</span>
       <div className="relative">
        <Input
         placeholder="輸入姓名或年級搜尋…"
         value={
          addStudentId
           ? (studentPickList.find((s) => s.id === addStudentId)?.label ?? "")
           : studentSearch
         }
         onChange={(e) => {
          setAddStudentId("")
          setStudentSearch(e.target.value)
          setStudentPickerOpen(true)
         }}
         onFocus={() => setStudentPickerOpen(true)}
         className="h-9"
        />
        {studentPickerOpen && !addStudentId && studentSearch.trim() ? (
         <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover shadow-md">
          {studentsFiltered.length === 0 ? (
           <div className="px-3 py-2 text-sm text-muted-foreground">找不到學生</div>
          ) : (
           studentsFiltered.map((s) => (
            <button
             key={s.id}
             type="button"
             className="flex w-full px-3 py-2 text-left text-sm hover:bg-muted"
             onClick={() => {
              setAddStudentId(s.id)
              setStudentSearch("")
              setStudentPickerOpen(false)
             }}
            >
             {s.label}
            </button>
           ))
          )}
         </div>
        ) : null}
       </div>
       {addStudentId ? (
        <button
         type="button"
         className="text-left text-xs text-primary underline-offset-4 hover:underline"
         onClick={() => {
          setAddStudentId("")
          setStudentSearch("")
         }}
        >
         清除選取
        </button>
       ) : null}
      </label>
      <label className="grid gap-1">
       <span className="text-muted-foreground">班別（可搜尋科目／課程代碼／名稱）</span>
       <div className="relative">
        <Input
         placeholder="輸入關鍵字搜尋班別…"
         value={addClassId ? (classPickList.find((c) => c.id === addClassId)?.label ?? "") : classSearch}
         onChange={(e) => {
          setAddClassId("")
          setClassSearch(e.target.value)
          setClassPickerOpen(true)
         }}
         onFocus={() => setClassPickerOpen(true)}
         className="h-9"
        />
        {classPickerOpen && !addClassId ? (
         <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover shadow-md">
          {classesFiltered.length === 0 ? (
           <div className="px-3 py-2 text-sm text-muted-foreground">找不到班別</div>
          ) : (
           classesFiltered.map((c) => (
            <button
             key={c.id}
             type="button"
             className="flex w-full px-3 py-2 text-left text-sm hover:bg-muted"
             onClick={() => {
              setAddClassId(c.id)
              setClassSearch("")
              setClassPickerOpen(false)
             }}
            >
             {c.label}
            </button>
           ))
          )}
         </div>
        ) : null}
       </div>
       {addClassId ? (
        <button
         type="button"
         className="text-left text-xs text-primary underline-offset-4 hover:underline"
         onClick={() => {
          setAddClassId("")
          setClassSearch("")
         }}
        >
         清除選取
        </button>
       ) : null}
      </label>
      <label className="grid gap-1">
       <span className="text-muted-foreground">對應排程（未來 10 堂）</span>
       <Select
        className="h-9 w-full rounded-md border border-input px-2"
        value={addScheduleId}
        onChange={(e) => setAddScheduleId(e.target.value)}
        disabled={!addClassId || schedOptions.length === 0}
       >
        {!addClassId ? (
         <option value="">請先選擇班別</option>
        ) : schedOptions.length === 0 ? (
         <option value="">該班暫無未來排程</option>
        ) : (
         schedOptions.map((o) => (
          <option key={o.id} value={o.id}>
           {o.label}
          </option>
         ))
        )}
       </Select>
      </label>
      <label className="grid gap-1">
       <span className="text-muted-foreground">試堂類型</span>
       <Select
        className="h-9 w-full rounded-md border border-input px-2"
        value={addTrialType}
        onChange={(e) => setAddTrialType(e.target.value)}
       >
        <option value="免費試堂">免費試堂</option>
        <option value="半價試堂">半價試堂</option>
        <option value="原價試堂">原價試堂</option>
        <option value="體驗課">體驗課</option>
       </Select>
      </label>
      <label className="grid gap-1">
       <span className="text-muted-foreground">備註（選填）</span>
       <Input value={addRemarks} onChange={(e) => setAddRemarks(e.target.value)} className="h-9" />
      </label>
      {trialTypeCategory(addTrialType) === "half" || trialTypeCategory(addTrialType) === "full" ? (
       <p className="rounded-md border border-info/30 bg-info/5 px-3 py-2 text-xs text-muted-foreground">
        半價／原價試堂須先完成收款（已付＋1 堂或連堂節數），再建立試堂並寫入收據編號。
       </p>
      ) : null}
      {addErr ? <p className="text-destructive">{addErr}</p> : null}
      <div className="flex justify-end gap-2 pt-2">
       <Button type="button" variant="outline" disabled={addSaving} onClick={() => setAddOpen(false)}>
        取消
       </Button>
       <Button type="button" disabled={addSaving} onClick={() => void submitAdd()}>
        {addSaving
         ? "處理中…"
         : trialTypeCategory(addTrialType) === "half" || trialTypeCategory(addTrialType) === "full"
           ? "下一步：收費"
           : "儲存"}
       </Button>
      </div>
     </div>
    </DialogContent>
   </Dialog>

   <Dialog open={payOpen} onOpenChange={setPayOpen}>
    <DialogContent className="max-w-md">
     <DialogHeader>
      <DialogTitle>試堂收費</DialogTitle>
     </DialogHeader>
     <div className="grid gap-3 text-sm">
      <p className="text-muted-foreground">
       類型：{addTrialType}
       {payUnitPreview != null ? (
        <>
         {" "}
         · 每堂 HKD {payUnitPreview}
         {payAmountPreview != null ? `（若連堂將按節數加總）` : null}
        </>
       ) : null}
      </p>
      <label className="grid gap-1">
       <span className="text-muted-foreground">付款方式</span>
       <Select
        className="h-9 w-full rounded-md border border-input px-2"
        value={payMethod}
        onChange={(e) => setPayMethod(e.target.value)}
       >
        {PAYMENT_METHOD_PRESETS.map((m) => (
         <option key={m} value={m}>
          {m}
         </option>
        ))}
       </Select>
      </label>
      {addErr ? <p className="text-destructive">{addErr}</p> : null}
      <div className="flex justify-end gap-2 pt-2">
       <Button type="button" variant="outline" disabled={addSaving} onClick={() => setPayOpen(false)}>
        返回
       </Button>
       <Button type="button" disabled={addSaving} onClick={() => void confirmPaidTrial()}>
        {addSaving ? "入帳中…" : "確認收款並建立試堂"}
       </Button>
      </div>
     </div>
    </DialogContent>
   </Dialog>

   <TrialConvertDialog
    open={convertId != null && convertTarget != null}
    target={convertTarget}
<<<<<<< Updated upstream
=======
    sessions={convertSessions}
    sessionsLoading={convertSessionsLoading}
    saving={convertSaving}
>>>>>>> Stashed changes
    onOpenChange={(open) => {
     if (!open) setConvertId(null)
    }}
    onSubmit={(payload) => {
     if (!convertId) return
<<<<<<< Updated upstream
     const next = demoRows.map((r) =>
      r.id === convertId
       ? {
          ...r,
          outcome: "converted" as const,
          outcomeReason: payload.formLabel,
          outcomeNote: payload.payLabel,
          outcomeAt: `${TRIAL_CONVERT_DEMO_TODAY} 16:45`,
          status: "已完成",
          remarks: `轉正式報讀：${payload.formLabel}；${payload.payLabel}`,
          receipt_number:
           payload.payMode === "receive"
            ? `RC-MOCK-${String(Math.floor(Math.random() * 900) + 100)}`
            : r.receipt_number,
         }
       : r
     )
     applyDemoRows(next)
     setConvertId(null)
     pushBanner({
      tone: "success",
      title: "預覽：已轉正式報讀（假資料）",
      message: `${payload.formLabel} · ${payload.payLabel}`,
     })
=======
     void (async () => {
      setConvertSaving(true)
      try {
       const { paymentId } = await convertTrialToEnrollment({
        trialId: convertId,
        enrollmentPeriod: payload.enrollmentPeriod,
        scheduleIds: payload.scheduleIds.length > 0 ? payload.scheduleIds : undefined,
        payment:
         payload.payMode === "skip"
          ? null
          : {
             lessonCount: payload.lessonCount,
             amount: payload.amount,
             paymentMethod: payload.paymentMethod,
             status: payload.paymentStatus,
            },
       })
       setConvertId(null)
       pushBanner({
        tone: "success",
        title: "已轉正式報讀",
        message: paymentId
         ? `${payload.formLabel}；已建立收費／待繳單`
         : `${payload.formLabel}；稍後再收費`,
       })
       await reload()
      } catch (e) {
       reportUserFacingError(e, { source: "TrialSessionsView.convert" })
       pushBanner({
        tone: "error",
        title: "轉正失敗",
        message: e instanceof Error ? e.message : "請稍後再試",
       })
      } finally {
       setConvertSaving(false)
      }
     })()
>>>>>>> Stashed changes
    }}
   />

   <TrialOutcomeDialog
    open={outcomeId != null && outcomeTarget != null}
    target={outcomeTarget}
    defaultOutcome={outcomeDefault}
<<<<<<< Updated upstream
=======
    saving={outcomeSaving}
>>>>>>> Stashed changes
    onOpenChange={(open) => {
     if (!open) setOutcomeId(null)
    }}
    onSubmit={(payload) => {
     if (!outcomeId) return
<<<<<<< Updated upstream
     const summary = formatOutcomeSummary({
      outcome: payload.outcome,
      reason: payload.reason,
      note: payload.note,
     })
     const next = demoRows.map((r) =>
      r.id === outcomeId
       ? {
          ...r,
          outcome: payload.outcome,
          outcomeReason: payload.reason,
          outcomeNote: payload.note,
          outcomeAt: `${TRIAL_CONVERT_DEMO_TODAY} 17:10`,
          status: r.status === "取消" ? r.status : "已完成",
          remarks: summary,
         }
       : r
     )
     applyDemoRows(next)
     setOutcomeId(null)
     pushBanner({
      tone: payload.outcome === "lost" ? "warning" : "info",
      title: `預覽：已登記${TRIAL_OUTCOME_LABELS[payload.outcome]}`,
      message: summary,
     })
=======
     void (async () => {
      setOutcomeSaving(true)
      try {
       await recordTrialOutcome({
        trialId: outcomeId,
        outcome: payload.outcome,
        reason: payload.reason,
        note: payload.note,
       })
       setOutcomeId(null)
       pushBanner({
        tone: payload.outcome === "lost" ? "warning" : "info",
        title: `已登記${TRIAL_OUTCOME_LABELS[payload.outcome]}`,
        message: formatOutcomeSummary({
         outcome: payload.outcome,
         reason: payload.reason,
         note: payload.note,
        }),
       })
       await reload()
      } catch (e) {
       reportUserFacingError(e, { source: "TrialSessionsView.outcome" })
       pushBanner({
        tone: "error",
        title: "登記失敗",
        message: e instanceof Error ? e.message : "請稍後再試",
       })
      } finally {
       setOutcomeSaving(false)
      }
     })()
>>>>>>> Stashed changes
    }}
   />
  </div>
 )
}
