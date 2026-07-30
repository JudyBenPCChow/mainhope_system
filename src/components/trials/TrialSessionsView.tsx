import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { CalendarDays, GraduationCap, Plus, SlidersHorizontal, Sparkles } from "lucide-react"

import { TrialConvertDialog, type TrialConvertDialogTarget, type TrialConvertClassOption, type TrialConvertSessionOption } from "@/components/trials/TrialConvertDialog"
import {
 TrialOutcomeDialog,
 formatOutcomeSummary,
 type TrialOutcomeDialogTarget,
} from "@/components/trials/TrialOutcomeDialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tag } from "@/components/ui/tag"
import { Select } from "@/components/ui/select"
import { MobileFilterSheet } from "@/components/mobile/MobileFilterSheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAppConfirm } from "@/lib/appConfirm"
import { formatClassLabel } from "@/lib/courseLabel"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { statusToTagTone } from "@/lib/statusTag"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import {
 TRIAL_OUTCOME_LABELS,
 outcomeTagTone,
 type TrialOutcome,
} from "@/lib/trialOutcome"
import { cn } from "@/lib/utils"
import { fetchAllClasses, fetchClassSchedules, getClassById, type ClassRecord } from "@/services/classQueries"
import { fetchUpcomingSchedulesForClass } from "@/services/leaveQueries"
import { PAYMENT_METHOD_PRESETS } from "@/services/paymentQueries"
import { listStudents } from "@/services/queries"
import { localYmd } from "@/services/scheduleQueries"
import { fetchAllTeachers, type TeacherRecord } from "@/services/teacherQueries"
import { useAppBanner } from "@/lib/appBanner"
import {
 convertTrialToEnrollment,
 deleteTrialSession,
 fetchTrialDashboardStats,
 fetchTrialsWithRelations,
 insertPaidTrialSession,
 insertTrialSession,
 previewTrialAttendanceImpact,
 recordTrialOutcome,
 rescheduleTrialSession,
 trialCanConvert,
 trialCanRecordLost,
 trialConvertBlockedReason,
 trialConvertRollCallWarning,
 trialLostBlockedReason,
 trialStatusCategory,
 trialTypeCategory,
 trialTypeFromUnitPrice,
 updateTrialSession,
 type TrialDashboardStats,
 type TrialManageRow,
} from "@/services/trialQueries"
import {
 formatAttendanceHitsDescription,
} from "@/services/attendanceLifecycleQueries"

type StatusTab = "all" | "booked" | "done" | "cancel"
type TypeTab = "all" | "free" | "half" | "full"
type OutcomeTab = "all" | TrialOutcome
/** 試堂收費：預設金額或自訂 */
type PayAmountPreset = "0" | "250" | "275" | "300" | "custom"

const PAY_AMOUNT_PRESETS: { value: PayAmountPreset; label: string }[] = [
 { value: "0", label: "免費（$0）" },
 { value: "250", label: "$250" },
 { value: "275", label: "$275" },
 { value: "300", label: "$300" },
 { value: "custom", label: "其他金額" },
]

function matchesStatusTab(r: TrialManageRow, tab: StatusTab): boolean {
 if (tab === "all") return true
 return trialStatusCategory(r.status) === tab
}

function matchesTypeTab(r: TrialManageRow, tab: TypeTab): boolean {
 if (tab === "all") return true
 return trialTypeCategory(r.trial_type) === tab
}

export function TrialSessionsView() {
 const { confirmDialog } = useAppConfirm()
 const { pushBanner } = useAppBanner()
 const isMobile = useIsMobile()

 const [rows, setRows] = useState<TrialManageRow[]>([])
 const [stats, setStats] = useState<TrialDashboardStats>({ todayCount: 0, weekCount: 0 })
 const [loading, setLoading] = useState(true)
 const [filtersOpen, setFiltersOpen] = useState(false)
 const [err, setErr] = useState<string | null>(null)
 const [convertId, setConvertId] = useState<string | null>(null)
 const [convertSaving, setConvertSaving] = useState(false)
 const [convertClassOptions, setConvertClassOptions] = useState<TrialConvertClassOption[]>([])
 const [convertSessions, setConvertSessions] = useState<TrialConvertSessionOption[]>([])
 const [convertSessionsLoading, setConvertSessionsLoading] = useState(false)
 const [rescheduleId, setRescheduleId] = useState<string | null>(null)
 const [rescheduleScheduleId, setRescheduleScheduleId] = useState("")
 const [rescheduleOptions, setRescheduleOptions] = useState<
  { id: string; label: string }[]
 >([])
 const [rescheduleErr, setRescheduleErr] = useState<string | null>(null)
 const [rescheduleSaving, setRescheduleSaving] = useState(false)
 const [outcomeId, setOutcomeId] = useState<string | null>(null)
 const [outcomeDefault, setOutcomeDefault] = useState<"lost" | "other">("lost")
 const [outcomeTab, setOutcomeTab] = useState<OutcomeTab>("all")

 const [statusTab, setStatusTab] = useState<StatusTab>("all")
 const [typeTab, setTypeTab] = useState<TypeTab>("all")
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
 const [addRemarks, setAddRemarks] = useState("")
 const [addSaving, setAddSaving] = useState(false)
 const [addErr, setAddErr] = useState<string | null>(null)
 const [payOpen, setPayOpen] = useState(false)
 const [payMethod, setPayMethod] = useState<string>(PAYMENT_METHOD_PRESETS[0] ?? "現金")
 const [payAmountPreset, setPayAmountPreset] = useState<PayAmountPreset>("300")
 const [payCustomAmount, setPayCustomAmount] = useState("")
 const [classPickList, setClassPickList] = useState<{ id: string; label: string }[]>([])
 const [studentPickList, setStudentPickList] = useState<{ id: string; label: string }[]>([])
 const [schedOptions, setSchedOptions] = useState<{ id: string; label: string; date: string }[]>([])

 const resolvePayUnit = (): number | null => {
  if (payAmountPreset === "custom") {
   const raw = payCustomAmount.trim()
   if (!raw) return null
   const n = Number(raw)
   if (!Number.isFinite(n) || n < 0) return null
   return Math.round(n * 100) / 100
  }
  return Number(payAmountPreset)
 }
 const payUnit = resolvePayUnit()
 const isFreeCharge = payUnit != null && payUnit <= 0

 const reload = useCallback(async () => {
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
   setStats(st)
   setTeachers(tch)
  } catch (e) {
   reportUserFacingError(e, { source: "TrialSessionsView.reload", setErr })
   setRows([])
  } finally {
   setLoading(false)
  }
 }, [])

 useEffect(() => {
  void reload()
 }, [reload])

 const convertTarget: TrialConvertDialogTarget | null = useMemo(() => {
  if (!convertId) return null
  const r = rows.find((x) => x.id === convertId)
  if (!r) return null
  return {
   id: r.id,
   studentId: r.student_id,
   studentName: r.student_name ?? "—",
   studentGrade: r.student_grade,
   trialClassId: r.class_id,
   trialClassLabel: r.class_subject ?? "—",
   trialDate: r.trial_date,
   schedStart: r.sched_start,
   schedEnd: r.sched_end,
   rollCallDone: r.roll_call_done,
   courseMode: r.course_mode,
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

 const loadConvertSessions = useCallback(async (classId: string) => {
  if (!classId) {
   setConvertSessions([])
   return
  }
  setConvertSessionsLoading(true)
  try {
   const list = await fetchClassSchedules(classId)
   setConvertSessions(
    list
     .filter((s) => !String(s.status ?? "").includes("取消"))
     .map((s) => ({
      id: s.id,
      sessionNumber: s.session_number ?? 0,
      date: String(s.scheduled_date).slice(0, 10),
      start: String(s.start_time ?? "").slice(0, 5),
      end: String(s.end_time ?? "").slice(0, 5),
     }))
   )
  } catch {
   setConvertSessions([])
  } finally {
   setConvertSessionsLoading(false)
  }
 }, [])

 useEffect(() => {
  if (!convertId) return
  void fetchAllClasses().then((cls) => {
   setConvertClassOptions(
    cls.map((c) => ({
     id: c.id,
     label: formatClassLabel({
      subject: c.subject,
      courseCode: c.course_code_full,
      courseName: c.course_name,
     }),
     courseMode: c.course_mode === "summer_two_period" ? "summer_two_period" : "regular",
    }))
   )
  })
 }, [convertId])

 const openOutcome = (id: string, kind: "lost" | "other") => {
  const r = rows.find((x) => x.id === id)
  if (!r) return
  if (kind === "lost") {
   const blocked = trialLostBlockedReason(r)
   if (blocked) {
    pushBanner({ tone: "warning", title: "無法標流失", message: blocked })
    return
   }
  }
  setOutcomeDefault(kind)
  setOutcomeId(id)
 }

 const openConvert = async (id: string) => {
  const r = rows.find((x) => x.id === id)
  if (!r) return
  const blocked = trialConvertBlockedReason(r)
  if (blocked) {
   pushBanner({ tone: "warning", title: "無法轉正", message: blocked })
   return
  }
  const warn = trialConvertRollCallWarning(r)
  if (warn) {
   const ok = await confirmDialog({
    title: "尚未完成試堂點名",
    description: warn,
    confirmText: "仍要轉正",
    cancelText: "返回",
    tone: "warning",
   })
   if (!ok) return
  }
  setConvertId(id)
  void loadConvertSessions(r.class_id)
 }

 const openReschedule = async (id: string) => {
  const r = rows.find((x) => x.id === id)
  if (!r) return
  if (!trialCanConvert(r) && trialConvertBlockedReason(r)) {
   // allow reschedule only if outcome open and not cancelled — reuse convert cancelled check partially
  }
  if (String(r.status).includes("取消") || r.outcome !== "open") {
   pushBanner({
    tone: "warning",
    title: "無法改期",
    message: "僅待跟進且未取消的試堂可改期",
   })
   return
  }
  setRescheduleErr(null)
  setRescheduleScheduleId("")
  setRescheduleId(id)
  try {
   const list = await fetchUpcomingSchedulesForClass(r.class_id, localYmd(), r.student_id)
   setRescheduleOptions(
    list
     .filter((s) => s.id !== r.schedule_id)
     .map((s) => ({
      id: s.id,
      label: `${s.scheduled_date} ${String(s.start_time ?? "").slice(0, 5)}–${String(s.end_time ?? "").slice(0, 5)}`,
     }))
   )
  } catch (e) {
   setRescheduleOptions([])
   setRescheduleErr(e instanceof Error ? e.message : "載入排程失敗")
  }
 }

 const outcomeStats = useMemo(() => {
  const open = rows.filter((r) => r.outcome === "open").length
  const converted = rows.filter((r) => r.outcome === "converted").length
  const lost = rows.filter((r) => r.outcome === "lost").length
  const other = rows.filter((r) => r.outcome === "other").length
  const closed = converted + lost + other
  const rate = closed > 0 ? Math.round((converted / closed) * 1000) / 10 : null
  return { open, converted, lost, other, closed, rate }
 }, [rows])

 const paidTrialCount = useMemo(
  () => rows.filter((r) => Boolean(r.payment_id)).length,
  [rows]
 )

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
  setAddRemarks("")
  setPayAmountPreset("300")
  setPayCustomAmount("")
  setPayMethod(PAYMENT_METHOD_PRESETS[0] ?? "現金")
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
  const all = rows.length
  let booked = 0
  let done = 0
  let cancel = 0
  for (const r of rows) {
   const c = trialStatusCategory(r.status)
   if (c === "cancel") cancel++
   else if (c === "done") done++
   else booked++
  }
  return { all, booked, done, cancel }
 }, [rows])

 const typeCounts = useMemo(() => {
  const all = rows.length
  let free = 0
  let half = 0
  let full = 0
  for (const r of rows) {
   const c = trialTypeCategory(r.trial_type)
   if (c === "free") free++
   else if (c === "half") half++
   else if (c === "full") full++
  }
  return { all, free, half, full }
 }, [rows])

 const filtered = useMemo(() => {
  return rows.filter((r) => {
   if (!matchesStatusTab(r, statusTab)) return false
   if (!matchesTypeTab(r, typeTab)) return false
   if (outcomeTab !== "all" && r.outcome !== outcomeTab) return false
   if (filterSubject !== "all" && (r.class_subject ?? "") !== filterSubject) return false
   if (filterTeacherId !== "all" && (r.teacher_id ?? "") !== filterTeacherId) return false
   if (filterGrade !== "all" && (r.student_grade ?? "") !== filterGrade) return false
   if (filterDateFrom && r.trial_date < filterDateFrom) return false
   if (filterDateTo && r.trial_date > filterDateTo) return false
   return true
  })
 }, [
  rows,
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
  if (outcomeTab !== "all") n += 1
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
       className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
        statusTab === id
         ? "border-info bg-info text-white shadow-sm"
         : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
       )}
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
       className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
        typeTab === id
         ? "border-info bg-info text-white shadow-sm"
         : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
       )}
      >
       {label}
      </button>
     ))}
    </div>
   </div>
   <div className="grid gap-3 sm:grid-cols-2">
    <label className="grid gap-1 text-xs text-muted-foreground">
     <span>試堂日起</span>
     <Input
      type="date"
      value={filterDateFrom}
      onChange={(e) => setFilterDateFrom(e.target.value)}
      className="h-10 w-full"
     />
    </label>
    <label className="grid gap-1 text-xs text-muted-foreground">
     <span>試堂日迄</span>
     <Input
      type="date"
      value={filterDateTo}
      onChange={(e) => setFilterDateTo(e.target.value)}
      className="h-10 w-full"
     />
    </label>
    <label className="grid gap-1 text-xs text-muted-foreground">
     <span>科目</span>
     <Select
      className="h-10 min-h-10 w-full"
      value={filterSubject}
      onChange={(e) => setFilterSubject(e.target.value)}
     >
      <option value="all">全部科目</option>
      {subjectOptions.map((sub) => (
       <option key={sub} value={sub}>
        {sub}
       </option>
      ))}
     </Select>
    </label>
    <label className="grid gap-1 text-xs text-muted-foreground">
     <span>老師</span>
     <Select
      className="h-10 min-h-10 w-full"
      value={filterTeacherId}
      onChange={(e) => setFilterTeacherId(e.target.value)}
     >
      <option value="all">全部老師</option>
      {teachers.map((t) => (
       <option key={t.id} value={t.id}>
        {t.full_name}
       </option>
      ))}
     </Select>
    </label>
    <label className="grid gap-1 text-xs text-muted-foreground sm:col-span-2">
     <span>年級</span>
     <Select
      className="h-10 min-h-10 w-full"
      value={filterGrade}
      onChange={(e) => setFilterGrade(e.target.value)}
     >
      <option value="all">全部年級</option>
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

 const submitAdd = () => {
  const selectedSched = schedOptions.find((o) => o.id === addScheduleId)
  if (!addStudentId || !addClassId || !addScheduleId || !selectedSched) {
   setAddErr("請選擇學生、班別，並確認有可用的未來排程")
   return
  }
  setAddErr(null)
  setPayAmountPreset("300")
  setPayCustomAmount("")
  setPayMethod(PAYMENT_METHOD_PRESETS[0] ?? "現金")
  setPayOpen(true)
 }

 const confirmTrialCharge = async () => {
  const selectedSched = schedOptions.find((o) => o.id === addScheduleId)
  const unit = resolvePayUnit()
  if (!addStudentId || !addClassId || !addScheduleId || !selectedSched || unit == null) {
   setAddErr(payAmountPreset === "custom" ? "請輸入有效的收費金額（可為 0）" : "付費資料不完整")
   return
  }
  setAddSaving(true)
  setAddErr(null)
  try {
   if (unit <= 0) {
    await insertTrialSession({
     student_id: addStudentId,
     class_id: addClassId,
     schedule_id: addScheduleId,
     trial_date: selectedSched.date,
     trial_type: "免費試堂",
     status: "已預約",
     remarks: addRemarks || null,
    })
    setPayOpen(false)
    setAddOpen(false)
    pushBanner({
     tone: "success",
     title: "已建立免費試堂",
     message: "學生已加入該堂點名名單",
    })
    await reload()
    return
   }

   const cls = await getClassById(addClassId)
   const trialType = trialTypeFromUnitPrice(unit, cls?.price_per_lesson)
   const { receiptNumber } = await insertPaidTrialSession({
    studentId: addStudentId,
    classId: addClassId,
    scheduleId: addScheduleId,
    trialDate: selectedSched.date,
    trialType,
    remarks: addRemarks || null,
    paymentMethod: payMethod,
    unitPrice: unit,
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
   reportUserFacingError(e, { source: "TrialSessionsView.confirmTrialCharge", setErr: setAddErr, userMessage: msg })
  } finally {
   setAddSaving(false)
  }
 }

 if (!isSupabaseConfigured) {
  return (
   <div role="alert" className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
    尚未設定 Supabase（請建立 <code className="rounded bg-white/60 px-1">.env</code>）。
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
      <Tag tone="info" size="sm">{rows.length} 筆</Tag>
     </h1>
     <p className="mt-1 hidden text-sm text-muted-foreground md:block">
      試堂資料與排程連結；點學生或班別可開啟詳情頁。
     </p>
    </div>
    <div className="flex flex-wrap gap-2">
     <Button
      type="button"
      className="gap-1 bg-info text-white hover:bg-info"
      onClick={openAdd}
     >
      <Plus className="h-4 w-4" />
      新增試堂
     </Button>
    </div>
   </header>

   {err ? (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
     {err}
    </div>
   ) : null}

   <section className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:gap-3" aria-label="結果復盤概覽">
    <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm md:p-3">
     <div className="text-[11px] text-muted-foreground md:text-xs">轉化率</div>
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
     <div className="text-[11px] text-muted-foreground md:text-xs">流失</div>
     <p className="mt-1 text-xl font-bold tabular-nums text-destructive md:text-2xl">{outcomeStats.lost}</p>
    </div>
    <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm md:p-3">
     <div className="text-[11px] text-muted-foreground md:text-xs">待跟進</div>
     <p className="mt-1 text-xl font-bold tabular-nums md:text-2xl">{outcomeStats.open}</p>
    </div>
   </section>

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

   {!loading ? (
    <p className="text-xs text-muted-foreground">
     已關聯試堂收費單（payment_id）：{paidTrialCount}／{rows.length} 筆
     {paidTrialCount > 0 ? " · 列表收據欄可對收款頁" : " · 免費／體驗或未走試堂頁收費則為 0"}
    </p>
   ) : null}

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
    <div className="space-y-3 rounded-xl border border-border bg-card p-3 shadow-sm">
     {renderTrialFilterPanel()}
    </div>
   )}

   {loading ? (
    <p className="text-sm text-muted-foreground">載入中…</p>
   ) : filtered.length === 0 ? (
    <p className="py-12 text-center text-sm text-muted-foreground">此條件下沒有紀錄</p>
   ) : (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
     <table className="w-full min-w-[960px] table-fixed border-collapse text-sm">
      <thead>
       <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
        <th className="w-[11%] px-3 py-2 font-medium">日期</th>
        <th className="w-[13%] px-3 py-2 font-medium">學生</th>
        <th className="w-[16%] px-3 py-2 font-medium">班別</th>
        <th className="w-[9%] px-3 py-2 font-medium">時間</th>
        <th className="w-[8%] px-3 py-2 font-medium">類型</th>
        <th className="w-[8%] px-3 py-2 font-medium">狀態</th>
        <th className="w-[14%] px-3 py-2 font-medium">結果</th>
        <th className="w-[21%] px-3 py-2 font-medium">操作</th>
       </tr>
      </thead>
      <tbody>
       {filtered.map((r, idx) => {
        const canConvert = trialCanConvert(r)
        const blocked = trialConvertBlockedReason(r)
        const canLost = trialCanRecordLost(r)
        const canOther = r.outcome === "open"
        const closed = r.outcome !== "open"
        const canReschedule =
         r.outcome === "open" && !String(r.status).includes("取消") && !r.roll_call_done
        return (
        <tr
         key={r.id}
         className={cn(
          "border-b border-border last:border-0 transition-colors hover:bg-muted/60",
          idx % 2 === 1 ? "bg-muted/20" : ""
         )}
        >
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
          {r.teacher_name ? (
           <div className="text-xs text-muted-foreground">{r.teacher_name}</div>
          ) : null}
         </td>
         <td className="px-3 py-2 align-top">
          <Link
           to={`/Schedule/${r.schedule_id}`}
           className="font-medium tabular-nums text-info hover:underline"
          >
           {r.sched_start && r.sched_end ? `${r.sched_start}–${r.sched_end}` : "看排程"}
          </Link>
          <div className="mt-1">
           <Tag tone={statusToTagTone(r.roll_call_done ? "已點名" : "未點名")} size="sm">
            {r.roll_call_done ? "已點名" : "未點名"}
           </Tag>
          </div>
         </td>
         <td className="px-3 py-2 align-top">
          <Tag tone={statusToTagTone(r.trial_type)} size="sm">
           {r.trial_type}
          </Tag>
         </td>
         <td className="px-3 py-2 align-top" onClick={(e) => e.stopPropagation()}>
          <Select
           className="h-9 w-full min-w-[6.5rem] text-xs"
           value={r.status}
           onChange={async (e) => {
            const next = e.target.value
            if (String(next).includes("取消")) {
             const hits = await previewTrialAttendanceImpact(r.id)
             if (hits.length > 0) {
              const choice = await confirmDialog({
               title: "取消試堂",
               description: `${formatAttendanceHitsDescription(hits)}\n\n預設建議：若未真正上課可一併刪除。`,
               confirmText: "一併刪除出席",
               alternateText: "只取消試堂、保留出席",
               cancelText: "取消",
               tone: "destructive",
              })
              if (choice === false) return
              await updateTrialSession(
               r.id,
               { status: next },
               { deleteAttendanceIds: choice === true ? hits.map((h) => h.id) : undefined }
              )
             } else {
              await updateTrialSession(r.id, { status: next })
             }
            } else {
             await updateTrialSession(r.id, { status: next })
            }
            await reload()
           }}
          >
           <option value="已預約">已預約</option>
           <option value="已完成">已完成</option>
           <option value="取消">取消</option>
          </Select>
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
           {r.remarks && r.outcome === "open" ? <div className="line-clamp-2">{r.remarks}</div> : null}
          </div>
         </td>
         <td className="px-3 py-2 align-top">
          <div className="flex flex-col items-start gap-1">
           {closed ? (
            <span className="text-xs text-muted-foreground">—</span>
           ) : (
            <>
             <Button
              type="button"
              size="sm"
              disabled={!canConvert}
              title={blocked ?? undefined}
              onClick={() => void openConvert(r.id)}
             >
              正式報讀
             </Button>
             <div className="flex flex-wrap gap-2">
              {canLost ? (
               <button
                type="button"
                className="text-xs font-medium text-destructive hover:underline"
                onClick={() => openOutcome(r.id, "lost")}
               >
                標流失
               </button>
              ) : r.outcome === "open" && !String(r.status).includes("取消") ? (
               <span className="text-[11px] text-muted-foreground" title={trialLostBlockedReason(r) ?? undefined}>
                流失須先取消
               </span>
              ) : null}
              {canOther ? (
               <button
                type="button"
                className="text-xs font-medium text-info hover:underline"
                onClick={() => openOutcome(r.id, "other")}
               >
                其他結果
               </button>
              ) : null}
              {canReschedule ? (
               <button
                type="button"
                className="text-xs font-medium text-info hover:underline"
                onClick={() => void openReschedule(r.id)}
               >
                改期
               </button>
              ) : null}
             </div>
             {blocked && !canConvert ? (
              <span className="text-xs text-muted-foreground">{blocked}</span>
             ) : null}
             <button
              type="button"
              className="text-xs font-medium text-destructive hover:underline"
              onClick={async () => {
               const hits = await previewTrialAttendanceImpact(r.id)
               if (hits.length === 0) {
                if (
                 !(await confirmDialog({
                  title: "刪除試堂紀錄",
                  description: "確定刪除此筆試堂？",
                  confirmText: "確認刪除",
                  tone: "destructive",
                 }))
                )
                 return
                await deleteTrialSession(r.id)
               } else {
                const choice = await confirmDialog({
                 title: "刪除試堂紀錄",
                 description: `${formatAttendanceHitsDescription(hits)}\n\n確定刪除試堂？`,
                 confirmText: "一併刪除出席",
                 alternateText: "只刪試堂、保留出席",
                 cancelText: "取消",
                 tone: "destructive",
                })
                if (choice === false) return
                await deleteTrialSession(r.id, {
                 deleteAttendanceIds: choice === true ? hits.map((h) => h.id) : undefined,
                })
               }
               await reload()
              }}
             >
              刪除
             </button>
            </>
           )}
          </div>
         </td>
        </tr>
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
       <span className="text-muted-foreground">備註（選填）</span>
       <Input value={addRemarks} onChange={(e) => setAddRemarks(e.target.value)} className="h-9" />
      </label>
      <p className="rounded-md border border-info/30 bg-info/5 px-3 py-2 text-xs text-muted-foreground">
       下一步選擇收費金額（免費／$250／$275／$300／其他）。付費試堂會先完成收款再建立紀錄並寫入收據編號。
      </p>
      {addErr ? <p className="text-destructive">{addErr}</p> : null}
      <div className="flex justify-end gap-2 pt-2">
       <Button type="button" variant="outline" disabled={addSaving} onClick={() => setAddOpen(false)}>
        取消
       </Button>
       <Button type="button" disabled={addSaving} onClick={() => submitAdd()}>
        下一步：收費
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
      <label className="grid gap-1">
       <span className="text-muted-foreground">收費金額（每堂）</span>
       <Select
        className="h-9 w-full rounded-md border border-input px-2"
        value={payAmountPreset}
        onChange={(e) => setPayAmountPreset(e.target.value as PayAmountPreset)}
       >
        {PAY_AMOUNT_PRESETS.map((p) => (
         <option key={p.value} value={p.value}>
          {p.label}
         </option>
        ))}
       </Select>
      </label>
      {payAmountPreset === "custom" ? (
       <label className="grid gap-1">
        <span className="text-muted-foreground">其他金額（HKD）</span>
        <Input
         type="number"
         min={0}
         step="1"
         inputMode="decimal"
         placeholder="例如 200"
         value={payCustomAmount}
         onChange={(e) => setPayCustomAmount(e.target.value)}
         className="h-9"
        />
       </label>
      ) : null}
      <p className="text-xs text-muted-foreground">若為連堂，將按節數以每堂金額加總入帳。</p>
      {!isFreeCharge ? (
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
      ) : null}
      {addErr ? <p className="text-destructive">{addErr}</p> : null}
      <div className="flex justify-end gap-2 pt-2">
       <Button type="button" variant="outline" disabled={addSaving} onClick={() => setPayOpen(false)}>
        返回
       </Button>
       <Button type="button" disabled={addSaving || payUnit == null} onClick={() => void confirmTrialCharge()}>
        {addSaving ? "處理中…" : isFreeCharge ? "確認建立免費試堂" : "確認收款並建立試堂"}
       </Button>
      </div>
     </div>
    </DialogContent>
   </Dialog>

   <TrialConvertDialog
    open={convertId != null && convertTarget != null}
    target={convertTarget}
    classOptions={convertClassOptions}
    sessions={convertSessions}
    sessionsLoading={convertSessionsLoading}
    onTargetClassChange={(classId) => {
     void loadConvertSessions(classId)
    }}
    saving={convertSaving}
    onOpenChange={(open) => {
     if (!open) {
      setConvertId(null)
      setConvertSaving(false)
     }
    }}
    onSubmit={async (payload) => {
     if (!convertId || !convertTarget) return
     setConvertSaving(true)
     try {
      const result = await convertTrialToEnrollment({
       trialId: convertId,
       targetClassId: payload.targetClassId,
       enrollmentPeriod: payload.enrollmentPeriod,
       scheduleIds: payload.scheduleIds,
      })
      setConvertId(null)
      await reload()
      pushBanner({
       tone: "success",
       title: "已轉正式報讀",
       message: result.rollCallPending
        ? `${payload.formLabel}（轉正時尚未完成試堂點名）· 學費請到收款頁處理`
        : `${payload.formLabel} · 學費請到收款頁處理`,
      })
     } finally {
      setConvertSaving(false)
     }
    }}
   />

   <TrialOutcomeDialog
    open={outcomeId != null && outcomeTarget != null}
    target={outcomeTarget}
    defaultOutcome={outcomeDefault}
    onOpenChange={(open) => {
     if (!open) setOutcomeId(null)
    }}
    onSubmit={async (payload) => {
     if (!outcomeId) return
     const summary = formatOutcomeSummary({
      outcome: payload.outcome,
      reason: payload.reason,
      note: payload.note,
     })
     await recordTrialOutcome({
      trialId: outcomeId,
      outcome: payload.outcome === "lost" ? "lost" : "other",
      reason: payload.reason,
      note: payload.note,
     })
     setOutcomeId(null)
     await reload()
     pushBanner({
      tone: payload.outcome === "lost" ? "warning" : "info",
      title: "已登記結果",
      message: summary,
     })
    }}
   />

   <Dialog
    open={rescheduleId != null}
    onOpenChange={(open) => {
     if (!open) {
      setRescheduleId(null)
      setRescheduleErr(null)
     }
    }}
   >
    <DialogContent className="max-w-md">
     <DialogHeader>
      <DialogTitle>改期</DialogTitle>
     </DialogHeader>
     <div className="grid gap-3 text-sm">
      <p className="text-xs text-muted-foreground">
       只更換排程；狀態維持已預約。舊堂點名名單將不再出現此生。
      </p>
      {rescheduleErr ? (
       <div
        role="alert"
        className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive"
       >
        {rescheduleErr}
       </div>
      ) : null}
      <label className="grid gap-1 text-xs text-muted-foreground">
       <span>新排程 *</span>
       <Select
        className="h-10 min-h-10 w-full"
        value={rescheduleScheduleId}
        onChange={(e) => setRescheduleScheduleId(e.target.value)}
       >
        <option value="">請選擇</option>
        {rescheduleOptions.map((s) => (
         <option key={s.id} value={s.id}>
          {s.label}
         </option>
        ))}
       </Select>
      </label>
      <div className="flex justify-end gap-2">
       <Button
        type="button"
        variant="outline"
        disabled={rescheduleSaving}
        onClick={() => setRescheduleId(null)}
       >
        取消
       </Button>
       <Button
        type="button"
        disabled={rescheduleSaving || !rescheduleScheduleId}
        onClick={async () => {
         if (!rescheduleId || !rescheduleScheduleId) return
         setRescheduleSaving(true)
         setRescheduleErr(null)
         try {
          const hits = await previewTrialAttendanceImpact(rescheduleId)
          let deleteOldAttendanceIds: string[] | undefined
          if (hits.length > 0) {
           const choice = await confirmDialog({
            title: "試堂改期：舊堂出席",
            description: `${formatAttendanceHitsDescription(hits)}\n\n建議刪除舊堂出席，避免雙計。`,
            confirmText: "刪除舊堂出席",
            alternateText: "保留舊堂出席",
            cancelText: "取消改期",
            tone: "destructive",
           })
           if (choice === false) return
           if (choice === true) deleteOldAttendanceIds = hits.map((h) => h.id)
          }
          await rescheduleTrialSession({
           trialId: rescheduleId,
           newScheduleId: rescheduleScheduleId,
           deleteOldAttendanceIds,
          })
          setRescheduleId(null)
          await reload()
          pushBanner({ tone: "success", title: "已改期", message: "舊排程名單不再掛此生" })
         } catch (e) {
          setRescheduleErr(e instanceof Error ? e.message : "改期失敗")
         } finally {
          setRescheduleSaving(false)
         }
        }}
       >
        {rescheduleSaving ? "處理中…" : "確認改期"}
       </Button>
      </div>
     </div>
    </DialogContent>
   </Dialog>
  </div>
 )
}
