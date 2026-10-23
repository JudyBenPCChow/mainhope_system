import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Plus, SlidersHorizontal } from "lucide-react"

import { AdminPageHeader } from "@/components/detail/AdminPageHeader"
import { TrialConvertDialog, type TrialConvertDialogTarget, type TrialConvertClassOption, type TrialConvertSessionOption } from "@/components/trials/TrialConvertDialog"
import { TrialTeacherCommentBlock } from "@/components/trials/TrialTeacherCommentBlock"
import { TrialTeacherCommentForm } from "@/components/trials/TrialTeacherCommentForm"
import { SoftArchiveScopeBanner } from "@/components/softArchive/SoftArchiveScopeBanner"
import { StudentSearchableSelect } from "@/components/students/StudentSearchableSelect"
import {
 TrialOutcomeDialog,
 formatOutcomeSummary,
 type TrialOutcomeDialogTarget,
} from "@/components/trials/TrialOutcomeDialog"
import { Button } from "@/components/ui/button"
import { HintTooltip } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tag } from "@/components/ui/tag"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Select } from "@/components/ui/select"
import { MobileFilterSheet } from "@/components/mobile/MobileFilterSheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAppConfirm } from "@/lib/appConfirm"
import { useAuth } from "@/lib/authBootstrap"
import { isEndedClassStatus } from "@/lib/classOperatingStatus"
import { formatClassLabel, formatClassPickLabel, formatClassWhenLabel } from "@/lib/courseLabel"
import { confirmEnrollmentNoticeIfPresent } from "@/lib/enrollmentNoticeConfirm"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { paymentsReceiveHref } from "@/lib/paymentsReceiveHref"
import { WrittenSideEffectError } from "@/lib/writtenSideEffectError"
import { statusToTagTone } from "@/lib/statusTag"
import { isActualPresentStatus } from "@/lib/attendancePresence"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { isWrittenTrialComment } from "@/lib/trialTeacherComment"
import {
 TRIAL_OUTCOME_LABELS,
 outcomeTagTone,
} from "@/lib/trialOutcome"
import { classAllowedForNewTrial } from "@/lib/trialAddClasses"
import { classAllowedForTrialConvert } from "@/lib/trialConvertClasses"
import {
 displayTrialTypeLabel,
 TRIAL_AWAITING_RESCHEDULE_STATUS,
 trialFollowupKind,
 trialIsAwaitingReschedule,
 trialIsCancelled,
 trialIsOverdueOpen,
} from "@/lib/trialFollowupAction"
import {
 TRIAL_RECEIPT_GATE_LABEL,
 matchesReceiptTab,
 nextScheduleSelection,
 trialAddPrefill,
 trialMatchesPersonQuery,
 trialReceiptGate,
 type TrialReceiptGate,
} from "@/lib/trialReceiptGate"
import { TRIAL_ADD_STUDENT_RECENT_STORAGE_KEY } from "@/lib/recentStudentIds"
import { cn } from "@/lib/utils"
import { fetchClassesForOpsList, fetchClassSchedules, fetchClassStudents } from "@/services/classQueries"
import { fetchUpcomingSchedulesForClass } from "@/services/leaveQueries"
import {
 fetchEnrollmentsForStudent,
 fetchStudentPickerOptions,
 getStudentById,
 type StudentPickerOption,
} from "@/services/studentQueries"
import { formatScheduleOptionLabel } from "@/lib/weekdayUtils"
import { localYmd } from "@/services/scheduleQueries"
import { fetchAllTeachers, type TeacherRecord } from "@/services/teacherQueries"
import { useAppBanner } from "@/lib/appBanner"
import {
 getTrialSessionsDataCache,
 invalidateTrialSessionsDataCache,
 isTrialSessionsCacheFresh,
 setTrialSessionsDataCache,
} from "@/components/trials/trialSessionsState"
import {
 cancelAndRecordTrialLost,
 convertTrialToEnrollment,
 deleteTrialSession,
 fetchTrialsWithRelations,
 insertTrialSession,
 saveTrialTeacherComment,
 previewTrialAttendanceImpact,
 recordTrialOutcome,
 rescheduleTrialSession,
 trialCanConvert,
 trialCanRecordLost,
 trialCanRecordOutcome,
 trialConvertBlockedReason,
 trialConvertRollCallWarning,
 trialLostBlockedReason,
 trialLostWillCancel,
 trialStatusCategory,
 trialTypeCategory,
 updateTrialSession,
 type TrialManageRow,
} from "@/services/trialQueries"
import {
 formatAttendanceHitsDescription,
 hitsHaveBillable,
 type AttendanceLifecycleHit,
} from "@/services/attendanceLifecycleQueries"
import { usesSharedAppShell } from "@/lib/mgmtRole"

function weekBounds(now = new Date()): { from: string; to: string } {
 const day = now.getDay()
 const mondayOffset = day === 0 ? -6 : 1 - day
 const start = new Date(now)
 start.setHours(12, 0, 0, 0)
 start.setDate(start.getDate() + mondayOffset)
 const end = new Date(start)
 end.setDate(start.getDate() + 6)
 return { from: localYmd(start), to: localYmd(end) }
}

type StatusTab = "all" | "booked" | "done" | "cancel"
type TypeTab = "all" | "free" | "half" | "full"
type ListScope = "open" | "closed" | "all"

const ADD_TRIAL_TYPE_OPTIONS = ["免費試堂", "半價試堂", "原價試堂"] as const

function matchesStatusTab(r: TrialManageRow, tab: StatusTab): boolean {
 if (tab === "all") return true
 return trialStatusCategory(r.status) === tab
}

function matchesTypeTab(r: TrialManageRow, tab: TypeTab): boolean {
 if (tab === "all") return true
 return trialTypeCategory(r.trial_type) === tab
}

/** O1t：有可刪出席時强制一併刪（無保留路） */
async function resolveTrialAttendanceDelete(
 confirmDialog: (opts: {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  tone?: "default" | "warning" | "destructive"
  confirmInput?: { label: string; expected: string; placeholder?: string }
 }) => Promise<boolean | "alternate">,
 hits: AttendanceLifecycleHit[],
 title: string
): Promise<"delete" | "abort" | "none"> {
 if (hits.length === 0) return "none"
 const billable = hitsHaveBillable(hits)
 const studentName = hits.find((h) => h.studentName)?.studentName?.trim() ?? ""
 const surname = studentName.slice(0, 1)
 const ok = await confirmDialog({
  title,
  description: `${formatAttendanceHitsDescription(hits)}\n\n取消／刪除／改期試堂將一併刪除以上出席（無保留選項；要留出席請勿取消試堂）。`,
  confirmText: billable ? "⚠️ 刪除計費出席（影響已扣堂數）" : "一併刪除出席並繼續",
  cancelText: "取消操作",
  tone: "destructive",
  ...(billable && surname
   ? {
      confirmInput: {
       label: `請輸入學生姓氏「${surname}」以確認刪除計費出席`,
       expected: surname,
       placeholder: surname,
      },
     }
   : {}),
 })
 return ok === true ? "delete" : "abort"
}

function trialAttendanceOptionsFromHits(
 choice: "delete" | "none",
 hits: AttendanceLifecycleHit[]
): { attendanceAction: "delete"; deleteAttendanceIds: string[] } | undefined {
 if (choice === "none" || hits.length === 0) return undefined
 return {
  attendanceAction: "delete",
  deleteAttendanceIds: hits.map((h) => h.id),
 }
}

export function TrialSessionsView() {
 const { confirmDialog } = useAppConfirm()
 const { pushBanner } = useAppBanner()
 const { role } = useAuth()
 const navigate = useNavigate()
 const isMobile = useIsMobile()

 const [rows, setRows] = useState<TrialManageRow[]>(() => getTrialSessionsDataCache()?.rows ?? [])
 const [hiddenOlderCount, setHiddenOlderCount] = useState(
  () => getTrialSessionsDataCache()?.hiddenOlderCount ?? 0
 )
 const [includeOlderYears, setIncludeOlderYears] = useState(
  () => getTrialSessionsDataCache()?.includeOlderYears ?? false
 )
 const [loading, setLoading] = useState(() => getTrialSessionsDataCache() == null)
 const [filtersOpen, setFiltersOpen] = useState(false)
 const [err, setErr] = useState<string | null>(null)
 const [convertId, setConvertId] = useState<string | null>(null)
 const [convertSaving, setConvertSaving] = useState(false)
 const [convertClassOptions, setConvertClassOptions] = useState<TrialConvertClassOption[]>([])
 const [convertClassOptionsLoading, setConvertClassOptionsLoading] = useState(false)
 const [convertSessions, setConvertSessions] = useState<TrialConvertSessionOption[]>([])
 const [convertSessionsLoading, setConvertSessionsLoading] = useState(false)
 const [convertSessionsError, setConvertSessionsError] = useState<string | null>(null)
 const [convertSessionsClassId, setConvertSessionsClassId] = useState<string | null>(null)
 const convertSessionsReqRef = useRef(0)
 const convertClassOptsReqRef = useRef(0)
 const [rescheduleId, setRescheduleId] = useState<string | null>(null)
 const [rescheduleScheduleId, setRescheduleScheduleId] = useState("")
 const [rescheduleOptions, setRescheduleOptions] = useState<
  { id: string; label: string }[]
 >([])
 const [rescheduleErr, setRescheduleErr] = useState<string | null>(null)
 const [rescheduleSaving, setRescheduleSaving] = useState(false)
 const [releaseScheduleId, setReleaseScheduleId] = useState<string | null>(null)
 const [releaseSaving, setReleaseSaving] = useState(false)
 const [outcomeId, setOutcomeId] = useState<string | null>(null)
 const [outcomeDefault, setOutcomeDefault] = useState<"lost" | "other">("lost")
 const [listScope, setListScope] = useState<ListScope>("open")
 const [overdueOpen, setOverdueOpen] = useState(false)
 const [urlStudentId, setUrlStudentId] = useState("")
 const [remarkId, setRemarkId] = useState<string | null>(null)
 const [remarkDraft, setRemarkDraft] = useState("")
 const [remarkSaving, setRemarkSaving] = useState(false)

 const [statusTab, setStatusTab] = useState<StatusTab>("all")
 const [typeTab, setTypeTab] = useState<TypeTab>("all")
 const [filterDateFrom, setFilterDateFrom] = useState("")
 const [filterDateTo, setFilterDateTo] = useState("")
 const [filterSubject, setFilterSubject] = useState("all")
 const [filterTeacherId, setFilterTeacherId] = useState("all")
 const [filterGrade, setFilterGrade] = useState("all")
 const [registrationTab, setRegistrationTab] = useState<"all" | "registered" | "unregistered">("all")
 const [personQuery, setPersonQuery] = useState("")
 const [receiptTab, setReceiptTab] = useState<"all" | "unpaid" | TrialReceiptGate>("all")
 const [intentHint, setIntentHint] = useState<string | null>(null)
 const [moreRowId, setMoreRowId] = useState<string | null>(null)
 const [pasteId, setPasteId] = useState<string | null>(null)
 const [pasteSaving, setPasteSaving] = useState(false)
 const [pasteErr, setPasteErr] = useState<string | null>(null)

 const [teachers, setTeachers] = useState<TeacherRecord[]>(
  () => getTrialSessionsDataCache()?.teachers ?? []
 )

 const [addOpen, setAddOpen] = useState(false)
 const [addStudentId, setAddStudentId] = useState("")
 const [prefillName, setPrefillName] = useState("")
 const [searchParams] = useSearchParams()
 useEffect(() => {
  const studentId = searchParams.get("studentId")?.trim() ?? ""
  const classId = searchParams.get("classId")?.trim() ?? ""
  const scheduleId = searchParams.get("scheduleId")?.trim() ?? ""
  setUrlStudentId(studentId)
  if (studentId && (classId || scheduleId)) {
   setAddOpen(true)
   return
  }
  setAddOpen(false)
 }, [searchParams])
 const [addClassId, setAddClassId] = useState("")
 const [addScheduleId, setAddScheduleId] = useState("")
 const [addRemarks, setAddRemarks] = useState("")
 const [addTrialType, setAddTrialType] = useState<string>("免費試堂")
 /** ""＝未選；"1"＝計；"0"＝不計 */
 const [addCountsHeadcount, setAddCountsHeadcount] = useState<"" | "1" | "0">("")
 const [addSaving, setAddSaving] = useState(false)
 const [addErr, setAddErr] = useState<string | null>(null)
 const [classPickList, setClassPickList] = useState<
  {
   id: string
   label: string
   classLabel: string
   teacherName: string
   timeLabel: string
  }[]
 >([])
 const [studentPickList, setStudentPickList] = useState<StudentPickerOption[]>([])
 const [schedOptions, setSchedOptions] = useState<{ id: string; label: string; date: string }[]>([])
 const [addClassRoster, setAddClassRoster] = useState<{ id: string; label: string }[]>([])
 const [addClassRosterLoading, setAddClassRosterLoading] = useState(false)
 const [addClassRosterError, setAddClassRosterError] = useState(false)


 const reload = useCallback(async (opts?: { silent?: boolean }) => {
  if (!isSupabaseConfigured) return
  if (!opts?.silent) invalidateTrialSessionsDataCache()
  const cached = getTrialSessionsDataCache()
  if (!opts?.silent && !cached) setLoading(true)
  setErr(null)
  try {
   const [list, tch] = await Promise.all([
    fetchTrialsWithRelations({ includeOlderYears }),
    fetchAllTeachers(),
   ])
   setRows(list.rows)
   setHiddenOlderCount(list.hiddenOlderCount)
   setTeachers(tch)
   setTrialSessionsDataCache({
    includeOlderYears,
    rows: list.rows,
    hiddenOlderCount: list.hiddenOlderCount,
    teachers: tch,
   })
  } catch (e) {
   reportUserFacingError(e, { source: "TrialSessionsView.reload", setErr })
   setRows([])
   setHiddenOlderCount(0)
  } finally {
   setLoading(false)
  }
 }, [includeOlderYears])

 useEffect(() => {
  if (isTrialSessionsCacheFresh(includeOlderYears)) return
  const cached = getTrialSessionsDataCache()
  void reload({ silent: cached != null && cached.includeOlderYears === includeOlderYears })
 }, [reload, includeOlderYears])

 useEffect(() => {
  const onVis = () => {
   if (document.visibilityState === "visible") void reload({ silent: true })
  }
  const onFocus = () => {
   void reload({ silent: true })
  }
  document.addEventListener("visibilitychange", onVis)
  window.addEventListener("focus", onFocus)
  return () => {
   document.removeEventListener("visibilitychange", onVis)
   window.removeEventListener("focus", onFocus)
  }
 }, [reload])

 const pasteTarget = useMemo(() => {
  if (!pasteId) return null
  return rows.find((x) => x.id === pasteId) ?? null
 }, [pasteId, rows])

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
   trialScheduleId: r.schedule_id,
   rollCallDone: r.roll_call_done,
   teacherComment: r.teacher_comment,
   teacherCommentAt: r.teacher_comment_at,
   teacherCommentByName: r.teacher_comment_by_name,
   teacherCommentEditedAt: r.teacher_comment_edited_at,
   attendanceStatus: r.attendance_status,
   courseMode: r.course_mode,
   classKind: r.class_kind ?? "group",
   courseCode: r.course_code_full,
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

 const resetConvertSessionState = useCallback(() => {
  convertSessionsReqRef.current += 1
  setConvertSessions([])
  setConvertSessionsLoading(false)
  setConvertSessionsError(null)
  setConvertSessionsClassId(null)
 }, [])

 const loadConvertSessions = useCallback(async (classId: string) => {
  const req = ++convertSessionsReqRef.current
  if (!classId) {
   setConvertSessions([])
   setConvertSessionsError(null)
   setConvertSessionsClassId(null)
   setConvertSessionsLoading(false)
   return
  }
  setConvertSessions([])
  setConvertSessionsClassId(null)
  setConvertSessionsError(null)
  setConvertSessionsLoading(true)
  try {
   const list = await fetchClassSchedules(classId)
   if (req !== convertSessionsReqRef.current) return
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
   setConvertSessionsClassId(classId)
  } catch (e) {
   if (req !== convertSessionsReqRef.current) return
   setConvertSessions([])
   setConvertSessionsClassId(null)
   setConvertSessionsError(e instanceof Error ? e.message : "無法載入排程")
  } finally {
   if (req === convertSessionsReqRef.current) setConvertSessionsLoading(false)
  }
 }, [])

 useEffect(() => {
  if (!convertId) return
  const trial = rows.find((x) => x.id === convertId)
  const req = ++convertClassOptsReqRef.current
  setConvertClassOptions([])
  setConvertClassOptionsLoading(true)
  void (async () => {
   try {
    const enrollments = trial ? await fetchEnrollmentsForStudent(trial.student_id) : []
    if (req !== convertClassOptsReqRef.current) return
    const active = enrollments.filter((e) => e.status === "就讀中")
    const occupied = new Set(active.map((e) => e.classId))
    const extraIds = [...(trial ? [trial.class_id] : []), ...active.map((e) => e.classId)]
    const result = await fetchClassesForOpsList({ extraIds })
    if (req !== convertClassOptsReqRef.current) return
    const trialKind = trial?.class_kind ?? "group"
    const mapped: TrialConvertClassOption[] = result.classes
     .filter((c) => !isEndedClassStatus(c.status) || c.id === trial?.class_id)
     .filter((c) =>
      classAllowedForTrialConvert(trialKind, trial?.class_id, {
       id: c.id,
       classKind: c.class_kind,
       subject: c.subject,
       courseName: c.course_name,
       courseCode: c.course_code_full,
      })
     )
     .map((c) => ({
      id: c.id,
      label: formatClassLabel({
       subject: c.subject,
       courseCode: c.course_code_full,
       courseName: c.course_name,
      }),
      courseMode: c.course_mode === "summer_two_period" ? "summer_two_period" : "regular",
      enrollmentNotice: c.enrollment_notice,
      classKind: c.class_kind,
      courseCode: c.course_code_full,
      existingEnrollment: occupied.has(c.id),
     }))
    setConvertClassOptions(mapped)
   } catch (e) {
    if (req !== convertClassOptsReqRef.current) return
    setConvertClassOptions([])
    reportUserFacingError(e, { source: "TrialSessionsView.convertClasses" })
   } finally {
    if (req === convertClassOptsReqRef.current) setConvertClassOptionsLoading(false)
   }
  })()
 }, [convertId, rows])

 const openOutcome = (id: string, kind: "lost" | "other") => {
  const r = rows.find((x) => x.id === id)
  if (!r) return
  if (kind === "lost") {
   const blocked = trialLostBlockedReason(r)
   if (blocked) {
    pushBanner({ tone: "warning", title: "無法標流失", message: blocked })
    return
   }
  } else if (!trialCanRecordOutcome(r)) {
   pushBanner({
    tone: "warning",
    title: "無法登記其他結果",
    message: "請先完成試堂點名，或先取消試堂後再登記。",
   })
   return
  }
  setOutcomeDefault(kind)
  setOutcomeId(id)
 }

 const openConvert = async (id: string) => {
  const r = rows.find((x) => x.id === id)
  if (!r) return
  const blocked = trialConvertBlockedReason(r)
  if (blocked) {
   pushBanner({ tone: "warning", title: "無法正式報讀", message: blocked })
   return
  }
  const warn = trialConvertRollCallWarning(r)
  if (warn) {
   const ok = await confirmDialog({
    title: "尚未完成試堂點名",
    description: warn,
    confirmText: "仍要正式報讀",
    cancelText: "返回",
    tone: "warning",
   })
   if (!ok) return
  }
  resetConvertSessionState()
  setConvertId(id)
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

 const holdTrialSchedule = async (id: string) => {
  setReleaseSaving(true)
  try {
   const hits = await previewTrialAttendanceImpact(id)
   const choice = await resolveTrialAttendanceDelete(
    confirmDialog,
    hits,
    "取消這次排程會刪除出席"
   )
   if (choice === "abort") return
   await updateTrialSession(
    id,
    { status: TRIAL_AWAITING_RESCHEDULE_STATUS },
    trialAttendanceOptionsFromHits(choice, hits)
   )
   setReleaseScheduleId(null)
   await reload()
   pushBanner({
    tone: "success",
    title: "已取消這次排程",
    message: "試堂仍待跟進。可即時改期，或之後再選日子。",
   })
  } catch (err) {
   reportUserFacingError(err, { source: "TrialSessionsView.releaseSchedule", setErr })
  } finally {
   setReleaseSaving(false)
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

 const receivedCount = useMemo(
  () =>
   rows.filter(
    (r) => trialReceiptGate({ paymentId: r.payment_id, paymentStatus: r.payment_status }) === "received"
   ).length,
  [rows]
 )

 const todayYmd = localYmd()
 const thisWeek = weekBounds()
 const loadedTodayCount = useMemo(
  () => rows.filter((r) => r.trial_date === todayYmd).length,
  [rows, todayYmd]
 )
 const loadedWeekCount = useMemo(
  () => rows.filter((r) => r.trial_date >= thisWeek.from && r.trial_date <= thisWeek.to).length,
  [rows, thisWeek.from, thisWeek.to]
 )

 useEffect(() => {
  if (!addOpen) return
  const prefill = trialAddPrefill(searchParams)
  setIntentHint(prefill.hint)
  setAddErr(null)
  setAddStudentId(prefill.studentId)
  setAddClassId(prefill.classId)
  setAddScheduleId(prefill.scheduleId)
  if (prefill.studentId) {
   void getStudentById(prefill.studentId).then((student) => {
    if (!student) return
    setPrefillName(`${student.full_name || "—"}（${student.grade ?? "—"}）`)
   })
  } else {
   setPrefillName("")
  }
  const today = localYmd()
  void fetchClassesForOpsList().then((result) => {
   const picks = result.classes
    .filter((c) =>
     classAllowedForNewTrial(
      {
       status: c.status,
       classKind: c.class_kind,
       subject: c.subject,
       academicYearLabel: c.academic_year_label,
      },
      today
     )
    )
    .map((c) => ({
     id: c.id,
     label: formatClassPickLabel({
      subject: c.subject,
      courseCode: c.course_code_full,
      courseName: c.course_name,
      dayOfWeek: c.day_of_week,
      timeSlot: c.time_slot,
     }),
     classLabel: formatClassLabel({
      subject: c.subject,
      courseCode: c.course_code_full,
      courseName: c.course_name,
     }),
     teacherName: (c.teacher_name ?? "").trim(),
     timeLabel: formatClassWhenLabel(c.day_of_week, c.time_slot),
    }))
   setClassPickList(picks)
   if (prefill.classId && !picks.some((c) => c.id === prefill.classId)) {
    setIntentHint("原先指定的班別不在可選清單。新增試堂只列目前學年，不含私人課程。")
    setAddClassId("")
    setAddScheduleId("")
   }
  })
  void fetchStudentPickerOptions()
   .then((rows) => {
    setStudentPickList(rows)
   })
   .catch((e) => {
    reportUserFacingError(e, { source: "TrialSessionsView.studentPicker", setErr: setAddErr })
   })
  setAddRemarks("")
  setAddTrialType("免費試堂")
  setAddCountsHeadcount("")
 }, [addOpen, searchParams])

 useEffect(() => {
  if (!addOpen || !addClassId) {
   setAddClassRoster([])
   setAddClassRosterLoading(false)
   setAddClassRosterError(false)
   return
  }
  let cancelled = false
  setAddClassRosterLoading(true)
  setAddClassRosterError(false)
  void fetchClassStudents(addClassId, { activeOnly: true })
   .then((rows) => {
    if (cancelled) return
    const names = rows
     .map((s) => {
      const name = s.fullName.trim() || "—"
      const grade = (s.grade ?? "").trim()
      return { id: s.enrollmentId, label: grade ? `${name}（${grade}）` : name }
     })
     .sort((a, b) => a.label.localeCompare(b.label, "zh-Hant"))
    setAddClassRoster(names)
   })
   .catch((e) => {
    if (cancelled) return
    setAddClassRoster([])
    setAddClassRosterError(true)
    reportUserFacingError(e, { source: "TrialSessionsView.addClassRoster" })
   })
   .finally(() => {
    if (!cancelled) setAddClassRosterLoading(false)
   })
  return () => {
   cancelled = true
  }
 }, [addOpen, addClassId])

 useEffect(() => {
  if (!addOpen) {
   setSchedOptions([])
   return
  }
  if (!addClassId) return
  let cancelled = false
  void fetchUpcomingSchedulesForClass(addClassId, localYmd()).then((sched) => {
   if (cancelled) return
   const opts = sched.slice(0, 10).map((s) => ({
    id: s.id,
    date: s.scheduled_date,
    label: formatScheduleOptionLabel(s.scheduled_date, s.start_time, s.end_time),
   }))
   setSchedOptions(opts)
   const ids = opts.map((o) => o.id)
   const wanted = searchParams.get("scheduleId")?.trim() ?? ""
   if (wanted && !ids.includes(wanted)) {
    setIntentHint("原先想試的堂次不在可選列表，已改為最近堂次，請核對。")
   }
   setAddScheduleId((prev) => nextScheduleSelection(prev, ids).id)
  })
  return () => {
   cancelled = true
  }
 }, [addOpen, addClassId, searchParams])

 const selectedAddClass = useMemo(
  () => classPickList.find((c) => c.id === addClassId) ?? null,
  [classPickList, addClassId]
 )

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
   if (urlStudentId && r.student_id !== urlStudentId) return false
   if (listScope === "open" && r.outcome !== "open") return false
   if (listScope === "closed" && r.outcome === "open") return false
   if (overdueOpen && !trialIsOverdueOpen(r, todayYmd)) return false
   if (!matchesStatusTab(r, statusTab)) return false
   if (!matchesTypeTab(r, typeTab)) return false
   if (filterSubject !== "all" && (r.class_subject ?? "") !== filterSubject) return false
   if (filterTeacherId !== "all" && (r.teacher_id ?? "") !== filterTeacherId) return false
   if (filterGrade !== "all" && (r.student_grade ?? "") !== filterGrade) return false
   if (registrationTab === "registered" && r.student_registration !== "已註冊") return false
   if (registrationTab === "unregistered" && r.student_registration !== "非注冊") return false
   if (!matchesReceiptTab(trialReceiptGate({ paymentId: r.payment_id, paymentStatus: r.payment_status }), receiptTab)) {
    return false
   }
   if (!trialMatchesPersonQuery(r, personQuery)) return false
   if (filterDateFrom && r.trial_date < filterDateFrom) return false
   if (filterDateTo && r.trial_date > filterDateTo) return false
   return true
  })
 }, [
  rows,
  urlStudentId,
  listScope,
  overdueOpen,
  todayYmd,
  statusTab,
  typeTab,
  filterSubject,
  filterTeacherId,
  filterGrade,
  filterDateFrom,
  filterDateTo,
  registrationTab,
  receiptTab,
  personQuery,
 ])

 const activeFilterCount = useMemo(() => {
  let n = 0
  if (statusTab !== "all") n += 1
  if (typeTab !== "all") n += 1
  if (filterDateFrom) n += 1
  if (filterDateTo) n += 1
  if (filterSubject !== "all") n += 1
  if (filterTeacherId !== "all") n += 1
  if (filterGrade !== "all") n += 1
  if (registrationTab !== "all") n += 1
  if (receiptTab !== "all") n += 1
  if (personQuery.trim()) n += 1
  return n
 }, [
  statusTab,
  typeTab,
  filterDateFrom,
  filterDateTo,
  filterSubject,
  filterTeacherId,
  filterGrade,
  registrationTab,
  receiptTab,
  personQuery,
 ])

 const resetFilters = useCallback(() => {
  setStatusTab("all")
  setTypeTab("all")
  setListScope("open")
  setOverdueOpen(false)
  setFilterDateFrom("")
  setFilterDateTo("")
  setFilterSubject("all")
  setFilterTeacherId("all")
  setFilterGrade("all")
  setRegistrationTab("all")
  setReceiptTab("all")
  setPersonQuery("")
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
    <span className="text-xs font-medium text-muted-foreground">註冊</span>
    <div className="flex flex-wrap gap-2" role="tablist">
     {(
      [
       ["all", "全部"],
       ["unregistered", "非註冊"],
       ["registered", "已註冊"],
      ] as const
     ).map(([id, label]) => (
      <button
       key={id}
       type="button"
       role="tab"
       aria-selected={registrationTab === id}
       onClick={() => setRegistrationTab(id)}
       className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
        registrationTab === id
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
   <div className="flex flex-col gap-2">
    <span className="text-xs font-medium text-muted-foreground">收款／上紙</span>
    <div className="flex flex-wrap gap-2" role="tablist">
     {(
      [
       ["all", "全部"],
       ["unissued", TRIAL_RECEIPT_GATE_LABEL.unissued],
       ["pending", TRIAL_RECEIPT_GATE_LABEL.pending],
       ["received", TRIAL_RECEIPT_GATE_LABEL.received],
      ] as const
     ).map(([id, label]) => (
      <button
       key={id}
       type="button"
       role="tab"
       aria-selected={receiptTab === id}
       onClick={() => setReceiptTab(id)}
       className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
        receiptTab === id
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

 const todayOn = filterDateFrom === todayYmd && filterDateTo === todayYmd

 const toggleToday = () => {
  if (todayOn) {
   setFilterDateFrom("")
   setFilterDateTo("")
   return
  }
  setFilterDateFrom(todayYmd)
  setFilterDateTo(todayYmd)
 }
 const goCollect = (row: TrialManageRow) => {
  navigate(
   paymentsReceiveHref({
    studentId: row.student_id,
    trials: [{ classId: row.class_id, trialType: row.trial_type }],
   })
  )
 }

 const submitAdd = async () => {
  const selectedSched = schedOptions.find((o) => o.id === addScheduleId)
  if (!addStudentId || !addClassId || !addScheduleId || !selectedSched) {
   setAddErr("請選擇學生、班別，並確認有可用的未來排程")
   return
  }
  if (addCountsHeadcount !== "1" && addCountsHeadcount !== "0") {
   setAddErr("請選擇是否計老師人頭（無預設，須手選）")
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
    counts_toward_headcount: addCountsHeadcount === "1",
   })
   setAddOpen(false)
   pushBanner({
    tone: "success",
    title: "已建立試堂",
    message:
     "請到收款登記出單並確認收款後，學生才會出現在點名紙（含 $0 免費試堂）。連堂請核對堂數。",
   })
   await reload()
   navigate(
    paymentsReceiveHref({
     studentId: addStudentId,
     trials: [{ classId: addClassId, trialType: addTrialType }],
    })
   )
  } catch (e) {
   const msg = e instanceof Error ? e.message : "建立試堂失敗"
   reportUserFacingError(e, { source: "TrialSessionsView.submitAdd", setErr: setAddErr, userMessage: msg })
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
   {usesSharedAppShell(role) ? (
    <AdminPageHeader
     eyebrow="行政工作"
     title="試堂紀錄"
     description="預設待跟進。下一手看整列狀態。"
     titleExtra={<Tag tone="info" size="sm">{rows.length} 筆</Tag>}
     actions={
      <Button
       type="button"
       className="gap-1 bg-info text-white hover:bg-info"
       onClick={openAdd}
      >
       <Plus className="h-4 w-4" />
       新增試堂
      </Button>
     }
    />
   ) : (
   <header className="flex flex-wrap items-start justify-between gap-3">
    <div>
     <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
      試堂紀錄
      <Tag tone="info" size="sm">{rows.length} 筆</Tag>
     </h1>
     <p className="mt-1 hidden text-sm text-muted-foreground md:block">
      預設待跟進。下一手看整列狀態。
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
   )}

   {err ? (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
     {err}
    </div>
   ) : null}

   <SoftArchiveScopeBanner
    hiddenCount={hiddenOlderCount}
    description={`已隱藏 ${hiddenOlderCount} 筆更舊學年已完成／取消試堂（未完成仍顯示；資料仍在，並非刪除）`}
    onShow={() => setIncludeOlderYears(true)}
   />

   <div className="flex flex-wrap gap-2" role="tablist" aria-label="檢視">
    {(
     [
      ["open", "待跟進", outcomeStats.open],
      ["closed", "已結束", outcomeStats.closed],
      ["all", "全部", rows.length],
     ] as const
    ).map(([id, label, count]) => (
     <button
      key={id}
      type="button"
      role="tab"
      aria-selected={listScope === id}
      onClick={() => {
       setListScope(id)
       if (id !== "open") setOverdueOpen(false)
      }}
      className={cn(
       "rounded-full border px-3 py-1.5 text-sm",
       listScope === id ? "border-primary bg-primary text-primary-foreground" : "border-border"
      )}
     >
      {label} {count}
     </button>
    ))}
   </div>

   {listScope === "closed" ? (
    <section className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:gap-3" aria-label="已結束復盤">
     <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm md:p-3">
      <div className="text-[11px] text-muted-foreground md:text-xs">轉化率</div>
      <p className="mt-1 text-xl font-bold tabular-nums md:text-2xl">
       {outcomeStats.rate != null ? `${outcomeStats.rate}%` : "—"}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">已正式報讀 ÷（已正式報讀＋已流失＋其他）</p>
     </div>
     {(
      [
       [TRIAL_OUTCOME_LABELS.converted, outcomeStats.converted, "text-success"],
       [TRIAL_OUTCOME_LABELS.lost, outcomeStats.lost, "text-destructive"],
       [TRIAL_OUTCOME_LABELS.other, outcomeStats.other, ""],
      ] as const
     ).map(([label, count, tone]) => (
      <div key={label} className="rounded-xl border border-border bg-card p-2.5 shadow-sm md:p-3">
       <div className="text-[11px] text-muted-foreground md:text-xs">{label}</div>
       <p className={cn("mt-1 text-xl font-bold tabular-nums md:text-2xl", tone)}>{count}</p>
      </div>
     ))}
    </section>
   ) : null}

   {!loading ? (
    <p className="text-xs text-muted-foreground">
     已可上紙 {receivedCount}／{rows.length}
     {" · "}
     今天 {loadedTodayCount} · 本星期 {loadedWeekCount}（以本頁已載入列計算，含已取消）
     {" · 完整金額對帳請以繳費紀錄為準"}
    </p>
   ) : null}

   <label className="grid gap-1 text-sm">
    <span className="text-xs font-medium text-muted-foreground">搜尋學生</span>
    <Input
     value={personQuery}
     placeholder="姓名或電話"
     aria-label="搜尋姓名或電話"
     onChange={(e) => setPersonQuery(e.target.value)}
    />
   </label>

   {urlStudentId ? (
    <p className="text-xs text-muted-foreground">
     已篩此學生。
     <button
      type="button"
      className="ml-2 text-info hover:underline"
      onClick={() => {
       setUrlStudentId("")
       navigate("/TrialSessions")
      }}
     >
      清除
     </button>
    </p>
   ) : null}

   <div className="flex flex-wrap items-center gap-2">
    {(
     [
      ["unpaid", "未可上紙", receiptTab === "unpaid"],
      ["today", "今天", todayOn],
      ["overdue", "試堂日已過仍待跟進", overdueOpen],
     ] as const
    ).map(([id, label, on]) => (
     <button
      key={id}
      type="button"
      aria-pressed={on}
      className={cn(
       "rounded-full border px-3 py-1.5 text-sm",
       on ? "border-primary bg-primary text-primary-foreground" : "border-border"
      )}
      onClick={() => {
       if (id === "today") toggleToday()
       else if (id === "overdue") {
        setOverdueOpen((current) => !current)
        setListScope("open")
       } else setReceiptTab((current) => (current === "unpaid" ? "all" : "unpaid"))
      }}
     >
      {label}
     </button>
    ))}
    <Button type="button" variant="outline" className="gap-2" onClick={() => setFiltersOpen((open) => !open)}>
     <SlidersHorizontal className="h-4 w-4" aria-hidden />
     更多篩選
     {activeFilterCount > 0 ? (
      <Tag tone="info" size="sm">
       {activeFilterCount}
      </Tag>
     ) : null}
    </Button>
   </div>

   {isMobile ? (
    <MobileFilterSheet
     open={filtersOpen}
     onClose={() => setFiltersOpen(false)}
     title="篩選試堂"
     activeCount={activeFilterCount}
     onReset={resetFilters}
    >
     {renderTrialFilterPanel()}
    </MobileFilterSheet>
   ) : filtersOpen ? (
    <div className="space-y-3 rounded-xl border border-border bg-card p-3 shadow-sm">
     {renderTrialFilterPanel()}
    </div>
   ) : null}

   {loading ? (
    <p className="text-sm text-muted-foreground">載入中…</p>
   ) : filtered.length === 0 ? (
    <div className="space-y-3 py-12 text-center">
     <p className="text-sm text-muted-foreground">
      {rows.length === 0 ? "尚未有試堂紀錄" : "此條件下沒有紀錄"}
     </p>
     {rows.length === 0 ? (
      <Button type="button" onClick={openAdd}>新增試堂</Button>
     ) : (
      <div className="flex flex-wrap justify-center gap-2">
       <Button type="button" variant="outline" onClick={resetFilters}>清除篩選</Button>
       {listScope === "open" && outcomeStats.closed > 0 ? (
        <Button type="button" variant="outline" onClick={() => setListScope("closed")}>
         查看已結束
        </Button>
       ) : null}
      </div>
     )}
    </div>
   ) : (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
     <table className="w-full min-w-[720px] table-fixed border-collapse text-sm">
      <thead>
       <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
        <th className="w-[18%] px-3 py-2 font-medium">日期與時間</th>
        <th className="w-[16%] px-3 py-2 font-medium">學生</th>
        <th className="w-[22%] px-3 py-2 font-medium">班別</th>
        <th className="w-[12%] px-3 py-2 font-medium">類型</th>
        <th className="w-[32%] px-3 py-2 font-medium">下一步</th>
       </tr>
      </thead>
      <StaggerList as="tbody">
       {filtered.map((r, idx) => {
        const canConvert = trialCanConvert(r)
        const blocked = trialConvertBlockedReason(r)
        const canLost = trialCanRecordLost(r)
        const canOther = trialCanRecordOutcome(r)
        const followup = trialFollowupKind(r, todayYmd)
        const awaitingReschedule = trialIsAwaitingReschedule(r.status)
        const canReschedule =
         r.outcome === "open" &&
         !trialIsCancelled(r.status) &&
         (awaitingReschedule || !r.roll_call_done)
        const receiptGate = trialReceiptGate({ paymentId: r.payment_id, paymentStatus: r.payment_status })
        const receiptLabel = TRIAL_RECEIPT_GATE_LABEL[receiptGate]
        const timeLabel =
         r.sched_start && r.sched_end
          ? `${String(r.sched_start).slice(0, 5)}–${String(r.sched_end).slice(0, 5)}`
          : "看排程"
        return (
        <StaggerItem
         key={r.id}
         as="tr"
         className={cn(
          "border-b border-border last:border-0 transition-colors hover:bg-muted/60",
          idx % 2 === 1 ? "bg-muted/20" : ""
         )}
        >
         <td className="px-3 py-2 align-top">
          {awaitingReschedule ? (
           <>
            <div className="font-medium">待改期</div>
            <div className="text-xs text-muted-foreground">
             原訂{" "}
             <Link
              to={`/Schedule/${r.schedule_id}`}
              className="tabular-nums text-info hover:underline"
             >
              {r.trial_date}
              {timeLabel !== "看排程" ? ` ${timeLabel}` : ""}
             </Link>
            </div>
           </>
          ) : (
           <>
            <Link
             to={`/Schedule/${r.schedule_id}`}
             className="font-medium tabular-nums text-info hover:underline"
            >
             {r.trial_date}
            </Link>
            <div className="text-xs tabular-nums text-muted-foreground">{timeLabel}</div>
           </>
          )}
          <div className="mt-1 flex flex-wrap gap-1">
           <Tag tone={statusToTagTone(r.status)} size="sm">{r.status}</Tag>
           <Tag tone={statusToTagTone(r.roll_call_done ? "已點名" : "未點名")} size="sm">
            {r.roll_call_done ? "已點名" : "未點名"}
           </Tag>
          </div>
         </td>
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
          <Tag tone={statusToTagTone(displayTrialTypeLabel(r.trial_type))} size="sm">
           {displayTrialTypeLabel(r.trial_type)}
          </Tag>
         </td>
         <td className="px-3 py-2 align-top">
          <div className="flex flex-col items-start gap-1">
           {followup === "closed" ? (
            <div className="space-y-1 text-xs text-muted-foreground">
             <Tag tone={outcomeTagTone(r.outcome)} size="sm">
              {TRIAL_OUTCOME_LABELS[r.outcome]}
             </Tag>
             {r.outcome_reason ? <div>{r.outcome_reason}</div> : null}
             {r.outcome_note ? <div className="text-[11px]">{r.outcome_note}</div> : null}
            </div>
           ) : (
            <>
             {followup === "collect" ? (
              <Button type="button" size="sm" onClick={() => goCollect(r)}>
               前往收款
              </Button>
             ) : null}
             {followup === "wait_class" ? (
              <p className="text-xs text-muted-foreground">上課日 {r.trial_date}，先等試堂</p>
             ) : null}
             {followup === "convert" ? (
              <div className="flex flex-col items-start gap-2">
               <TrialTeacherCommentBlock followup={followup} row={r} />
               <div className="flex flex-wrap items-center gap-2">
               <Button type="button" size="sm" onClick={() => void openConvert(r.id)}>
                正式報讀
               </Button>
               {canLost ? (
                <Button
                 type="button"
                 size="sm"
                 variant="outline"
                 onClick={() => openOutcome(r.id, "lost")}
                >
                 標流失
                </Button>
               ) : null}
               </div>
              </div>
             ) : null}
             {followup === "mark_lost" ? (
              canLost ? (
               <Button type="button" size="sm" onClick={() => openOutcome(r.id, "lost")}>
                標流失
               </Button>
              ) : (
               <span className="text-xs text-muted-foreground">{blocked}</span>
              )
             ) : null}
             {followup === "reschedule" ? (
              <div className="flex flex-wrap items-center gap-2">
               <Button type="button" size="sm" onClick={() => void openReschedule(r.id)}>
                改期
               </Button>
               {receiptGate !== "received" ? (
                <Button type="button" size="sm" variant="outline" onClick={() => goCollect(r)}>
                 前往收款
                </Button>
               ) : null}
              </div>
             ) : null}
             <div className="flex flex-wrap gap-1">
              <Tag tone={statusToTagTone(receiptLabel)} size="sm">{receiptLabel}</Tag>
              {r.counts_toward_headcount === true ? (
               <Tag tone="info" size="sm">計人頭</Tag>
              ) : r.counts_toward_headcount === false ? (
               <Tag tone="default" size="sm">不計人頭</Tag>
              ) : null}
             </div>
             {r.receipt_number ? (
              <div className="font-mono text-[11px] text-muted-foreground">收據 {r.receipt_number}</div>
             ) : null}
             {r.remarks ? <div className="line-clamp-2 text-[11px] text-muted-foreground">{r.remarks}</div> : null}
             <button
              type="button"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setMoreRowId((current) => (current === r.id ? null : r.id))}
             >
              {moreRowId === r.id ? "收起" : "更多"}
             </button>
             {moreRowId === r.id ? (
             <div className="flex flex-wrap gap-2">
              {(followup === "wait_class" || followup === "reschedule") && canConvert ? (
               <button
                type="button"
                className="text-xs font-medium text-info hover:underline"
                onClick={() => void openConvert(r.id)}
               >
                正式報讀
               </button>
              ) : null}
              {followup !== "convert" && followup !== "mark_lost" && canLost ? (
               <button
                type="button"
                className="text-xs font-medium text-destructive hover:underline"
                onClick={() => openOutcome(r.id, "lost")}
               >
                標流失
               </button>
              ) : null}
              {canOther ? (
               <button
                type="button"
                className="text-xs font-medium text-info hover:underline"
                onClick={() => openOutcome(r.id, "other")}
               >
                其他結果
               </button>
              ) : r.outcome === "open" && !trialIsCancelled(r.status) && !r.roll_call_done ? (
               <HintTooltip hint="請先完成試堂點名，或先取消試堂後再登記其他結果">
                <span className="text-[11px] text-muted-foreground">其他結果須已點名</span>
               </HintTooltip>
              ) : null}
              {canReschedule && followup !== "reschedule" ? (
               <button
                type="button"
                className="text-xs font-medium text-info hover:underline"
                onClick={() => void openReschedule(r.id)}
               >
                改期
               </button>
              ) : null}
              {!trialIsCancelled(r.status) && !awaitingReschedule ? (
               <button
                type="button"
                className="text-xs font-medium text-destructive hover:underline"
                onClick={() => {
                 setMoreRowId(null)
                 setReleaseScheduleId(r.id)
                }}
               >
                取消這次排程
               </button>
              ) : null}
              <button
               type="button"
               className="text-xs font-medium text-info hover:underline"
               onClick={() => {
                setRemarkDraft(r.remarks ?? "")
                setRemarkId(r.id)
               }}
              >
               寫備註
              </button>
              {isActualPresentStatus(r.attendance_status) ? (
               <button
                type="button"
                className="text-xs font-medium text-info hover:underline"
                onClick={async () => {
                 if (isWrittenTrialComment(r.teacher_comment_at) && r.teacher_comment?.trim()) {
                  const ok = await confirmDialog({
                   title: "覆寫老師評語？",
                   description: "已有評語。貼上後會保留首次撰寫紀錄，並記為其後改過。",
                   confirmText: "覆寫",
                   cancelText: "取消",
                  })
                  if (!ok) return
                 }
                 setPasteErr(null)
                 setPasteId(r.id)
                }}
               >
                貼上老師評語
               </button>
              ) : null}
             <button
              type="button"
              className="text-xs font-medium text-destructive hover:underline"
              onClick={async () => {
               try {
                const hits = await previewTrialAttendanceImpact(r.id)
                const receiptWarn = r.receipt_number
                 ? `此試堂有關聯收據（${r.receipt_number}），刪除後收據仍在繳費紀錄，但無法從試堂列表對帳。\n\n`
                 : r.payment_id
                   ? "此試堂有關聯收據，刪除後收據仍在繳費紀錄，但無法從試堂列表對帳。\n\n"
                   : ""
                if (hits.length > 0) {
                 const choice = await resolveTrialAttendanceDelete(
                  confirmDialog,
                  hits,
                  receiptWarn ? "刪除試堂（有收據＋出席）" : "刪除試堂會一併刪除出席"
                 )
                 if (choice === "abort") return
                 if (receiptWarn) {
                  const okReceipt = await confirmDialog({
                   title: "刪除試堂紀錄",
                   description: `${receiptWarn}並將一併刪除相關出席。確定刪除？`,
                   confirmText: "確認刪除",
                   tone: "destructive",
                  })
                  if (!okReceipt) return
                 }
                 await deleteTrialSession(r.id, trialAttendanceOptionsFromHits(choice, hits))
                } else {
                 if (
                  !(await confirmDialog({
                   title: "刪除試堂紀錄",
                   description: `${receiptWarn}確定刪除此筆試堂？`,
                   confirmText: "確認刪除",
                   tone: "destructive",
                  }))
                 ) {
                  return
                 }
                 await deleteTrialSession(r.id)
                }
                await reload()
               } catch (err) {
                reportUserFacingError(err, { source: "TrialSessionsView.delete", setErr })
               }
              }}
             >
              刪除
             </button>
             </div>
             ) : null}
            </>
           )}
          </div>
         </td>
        </StaggerItem>
        )
       })}
      </StaggerList>
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
     {intentHint ? <p className="text-sm text-warning">{intentHint}</p> : null}
     <div className="grid gap-3 text-sm">
      <label className="grid gap-1">
       <span className="text-muted-foreground">學生（可搜尋姓名／學號／年級）</span>
       <StudentSearchableSelect
        students={studentPickList}
        value={addStudentId}
        rememberKey={TRIAL_ADD_STUDENT_RECENT_STORAGE_KEY}
        placeholder={prefillName || "請選擇學生"}
        searchPlaceholder="輸入姓名、學號或年級搜尋…"
        aria-label="學生"
        onChange={setAddStudentId}
       />
      </label>
      <label className="grid gap-1">
       <span className="text-muted-foreground">班別（只列目前學年，不含私人課程）</span>
       <SearchableSelect
        combobox
        className="min-h-10 w-full"
        value={addClassId}
        options={classPickList.map((c) => ({
         value: c.id,
         label: c.label,
         searchText: c.label,
         displayText: c.label,
        }))}
        placeholder="搜尋班別名稱、代碼或星期…"
        searchPlaceholder="搜尋班別名稱、代碼或星期…"
        emptyMessage="找不到班別"
        aria-label="班別"
        onChange={(id) => {
         setAddClassId(id)
         setAddScheduleId("")
        }}
       />
      </label>
      {selectedAddClass ? (
       <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-md border border-border bg-muted/40 px-3 py-2">
        <dt className="text-muted-foreground">班別</dt>
        <dd className="min-w-0 break-words">{selectedAddClass.classLabel}</dd>
        <dt className="text-muted-foreground">任教老師</dt>
        <dd className="min-w-0 break-words">{selectedAddClass.teacherName || "—"}</dd>
        <dt className="text-muted-foreground">時間</dt>
        <dd className="min-w-0 break-words">{selectedAddClass.timeLabel || "—"}</dd>
        <dt className="text-muted-foreground">學生名單（目前）</dt>
        <dd className="min-w-0 break-words">
         {addClassRosterLoading ? (
          "載入中…"
         ) : addClassRosterError ? (
          "學生名單未能載入"
         ) : addClassRoster.length === 0 ? (
          "目前沒有就讀中學生"
         ) : (
          <div>
           <p className="text-muted-foreground">{addClassRoster.length} 人</p>
           <ul className="mt-0.5">
            {addClassRoster.map((s) => (
             <li key={s.id}>{s.label}</li>
            ))}
           </ul>
          </div>
         )}
        </dd>
       </dl>
      ) : null}
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
        {ADD_TRIAL_TYPE_OPTIONS.map((t) => (
         <option key={t} value={t}>
          {t}
         </option>
        ))}
       </Select>
      </label>
      <label className="grid gap-1">
       <span className="text-muted-foreground">計老師人頭 *</span>
       <Select
        className="h-9 w-full rounded-md border border-input px-2"
        value={addCountsHeadcount}
        onChange={(e) => setAddCountsHeadcount(e.target.value as "" | "1" | "0")}
       >
        <option value="">請選擇（無預設）</option>
        <option value="1">計入老師人頭</option>
        <option value="0">不計入老師人頭</option>
       </Select>
      </label>
      <label className="grid gap-1">
       <span className="text-muted-foreground">備註（選填）</span>
       <Input value={addRemarks} onChange={(e) => setAddRemarks(e.target.value)} className="h-9" />
      </label>
      <p className="rounded-md border border-info/30 bg-info/5 px-3 py-2 text-xs text-muted-foreground">
       試堂頁只登記試堂。建立後會前往收款登記出單（免費亦出 $0 單）；確認收款後才上點名紙。對帳請以繳費紀錄為準。
      </p>
      {addErr ? <p role="alert" className="text-destructive">{addErr}</p> : null}
      <div className="flex justify-end gap-2 pt-2">
       <Button type="button" variant="outline" disabled={addSaving} onClick={() => setAddOpen(false)}>
        取消
       </Button>
       <Button type="button" disabled={addSaving} onClick={() => void submitAdd()}>
        {addSaving ? "處理中…" : "確認建立試堂"}
       </Button>
      </div>
     </div>
    </DialogContent>
   </Dialog>

   <Dialog
    open={remarkId != null}
    onOpenChange={(open) => {
     if (!open && !remarkSaving) setRemarkId(null)
    }}
   >
    <DialogContent className="max-w-md">
     <DialogHeader>
      <DialogTitle>寫備註</DialogTitle>
     </DialogHeader>
     <p className="text-xs text-muted-foreground">結果維持待跟進。家長考慮中、下次聯絡等可寫在這裡。</p>
     <Input
      className="h-9"
      value={remarkDraft}
      onChange={(e) => setRemarkDraft(e.target.value)}
      placeholder="例如家長考慮中、下星期一再聯絡"
     />
     <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" disabled={remarkSaving} onClick={() => setRemarkId(null)}>
       取消
      </Button>
      <Button
       type="button"
       disabled={remarkSaving}
       onClick={async () => {
        if (!remarkId) return
        setRemarkSaving(true)
        try {
         await updateTrialSession(remarkId, { remarks: remarkDraft.trim() || null })
         setRemarkId(null)
         await reload()
        } catch (err) {
         reportUserFacingError(err, { source: "TrialSessionsView.remarks", setErr })
        } finally {
         setRemarkSaving(false)
        }
       }}
      >
       {remarkSaving ? "儲存中…" : "儲存"}
      </Button>
     </div>
    </DialogContent>
   </Dialog>

   <Dialog
    open={pasteTarget != null}
    onOpenChange={(open) => {
     if (!open && !pasteSaving) {
      setPasteId(null)
      setPasteErr(null)
     }
    }}
   >
    <DialogContent className="max-w-lg">
     <DialogHeader>
      <DialogTitle>貼上老師評語</DialogTitle>
     </DialogHeader>
     <p className="text-sm text-muted-foreground">
      這是老師評語，給前台回訪家長用，不是備註，也不是本堂教學紀錄。
     </p>
     {pasteTarget ? (
      <TrialTeacherCommentForm
       key={pasteTarget.id}
       targets={[
        {
         trialId: pasteTarget.id,
         studentName: pasteTarget.student_name ?? "—",
         studentGrade: pasteTarget.student_grade,
         classLabel: pasteTarget.class_subject ?? "—",
         trialDate: pasteTarget.trial_date,
         timeLabel: null,
         initialComment: pasteTarget.teacher_comment ?? "",
        },
       ]}
       saving={pasteSaving}
       error={pasteErr}
       onLater={() => {
        if (pasteSaving) return
        setPasteId(null)
        setPasteErr(null)
       }}
       onSave={async (entries) => {
        setPasteSaving(true)
        setPasteErr(null)
        try {
         for (const entry of entries) {
          await saveTrialTeacherComment(entry.trialId, entry.comment)
         }
         invalidateTrialSessionsDataCache()
         setPasteId(null)
         await reload({ silent: true })
        } catch (err) {
         reportUserFacingError(err, { source: "TrialSessionsView.pasteTeacherComment", setErr: setPasteErr })
        } finally {
         setPasteSaving(false)
        }
       }}
      />
     ) : null}
    </DialogContent>
   </Dialog>

   <TrialConvertDialog
    open={convertId != null && convertTarget != null}
    target={convertTarget}
    classOptions={convertClassOptions}
    classOptionsLoading={convertClassOptionsLoading}
    sessions={convertSessions}
    sessionsLoading={convertSessionsLoading}
    sessionsError={convertSessionsError}
    sessionsForClassId={convertSessionsClassId}
    onTargetClassChange={(classId) => {
     if (convertTarget?.classKind !== "group") return
     void loadConvertSessions(classId)
    }}
    saving={convertSaving}
    onOpenChange={(open) => {
     if (!open) {
      setConvertId(null)
      setConvertSaving(false)
      setConvertClassOptions([])
      resetConvertSessionState()
     }
    }}
    onSubmit={async (payload) => {
     if (!convertId || !convertTarget) return
     const targetOpt = convertClassOptions.find((c) => c.id === payload.targetClassId)
     const noticeOk = await confirmEnrollmentNoticeIfPresent(confirmDialog, [
      {
       notice: targetOpt?.enrollmentNotice,
       classLabel: targetOpt?.label ?? convertTarget.trialClassLabel,
      },
     ])
     if (!noticeOk) return
     setConvertSaving(true)
     try {
      const result = await convertTrialToEnrollment({
       trialId: convertId,
       targetClassId: payload.targetClassId,
       enrollmentPeriod: payload.enrollmentPeriod,
       scheduleIds: payload.scheduleIds,
       note: payload.note,
       enrollDate: payload.enrollDate,
       homeworkDayPlan: payload.homeworkDayPlan,
      })
      setConvertId(null)
      await reload()
      pushBanner({
       tone: "success",
       title: "已正式報讀",
       message: [
        targetOpt?.label ? `${targetOpt.label} · ${payload.formLabel}` : payload.formLabel,
        payload.note ? `備註：${payload.note}` : null,
        result.rollCallPending ? "正式報讀時尚未完成試堂點名" : null,
        "學費請到收款登記處理。",
       ]
        .filter(Boolean)
        .join("。"),
       action: convertTarget.studentId
        ? {
           pageLabel: "收款登記",
           to: paymentsReceiveHref({
            studentId: convertTarget.studentId,
            enrollmentClassIds: [payload.targetClassId],
           }),
          }
        : undefined,
      })
     } catch (e) {
      if (e instanceof WrittenSideEffectError) {
       const studentId = convertTarget?.studentId
       setConvertId(null)
       await reload()
       pushBanner({
        tone: "warning",
        title: e.headline,
        message: [
         e.message,
         "報讀已建立；若試堂仍待跟進，可再開正式報讀只補結結果。到課宣告請到學生詳情跟進。",
        ]
         .filter(Boolean)
         .join(" "),
        action: studentId
         ? {
            pageLabel: "學生詳情",
            to: `/Students/${encodeURIComponent(studentId)}`,
           }
         : undefined,
       })
       return
      }
      reportUserFacingError(e, { source: "TrialSessionsView.convert", setErr })
      pushBanner({
       tone: "error",
       title: "正式報讀未完成",
       message: e instanceof Error ? e.message : String(e),
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
    lostWillCancel={
     outcomeId != null
      ? (() => {
         const row = rows.find((x) => x.id === outcomeId)
         return row ? trialLostWillCancel(row) : false
        })()
      : false
    }
    onOpenChange={(open) => {
     if (!open) setOutcomeId(null)
    }}
    onSubmit={async (payload) => {
     if (!outcomeId) return
     const row = rows.find((x) => x.id === outcomeId)
     if (!row) throw new Error("找不到試堂紀錄")
     const summary = formatOutcomeSummary({
      outcome: payload.outcome,
      reason: payload.reason,
      note: payload.note,
     })
     if (payload.outcome === "lost") {
      const hits = trialLostWillCancel(row)
       ? await previewTrialAttendanceImpact(outcomeId)
       : []
      if (hits.length > 0) {
       const choice = await resolveTrialAttendanceDelete(
        confirmDialog,
        hits,
        "標流失會取消試堂並刪除出席"
       )
       if (choice === "abort") throw new Error("已取消操作")
       await cancelAndRecordTrialLost({
        trialId: outcomeId,
        reason: payload.reason,
        note: payload.note,
        ...trialAttendanceOptionsFromHits(choice, hits),
       })
      } else {
       await cancelAndRecordTrialLost({
        trialId: outcomeId,
        reason: payload.reason,
        note: payload.note,
       })
      }
     } else {
      await recordTrialOutcome({
       trialId: outcomeId,
       outcome: "other",
       reason: payload.reason,
       note: payload.note,
      })
     }
     setOutcomeId(null)
     await reload()
     pushBanner({
      tone: payload.outcome === "lost" ? "warning" : "info",
      title: payload.outcome === "lost" ? "已流失" : "已登記其他結果",
      message: summary,
     })
    }}
   />

   <Dialog
    open={releaseScheduleId != null}
    onOpenChange={(open) => {
     if (!open && !releaseSaving) setReleaseScheduleId(null)
    }}
   >
    <DialogContent className="max-w-md">
     <DialogHeader>
      <DialogTitle>取消這次排程</DialogTitle>
     </DialogHeader>
     <div className="grid gap-3 text-sm">
      <p className="text-muted-foreground">
       只拿掉這一次上課，試堂仍待跟進。可即時改另一天，或先不排、之後再選。若已點名，確認離開這堂時會刪除該堂出席。這不是標流失。
      </p>
      <div className="flex flex-wrap justify-end gap-2">
       <Button
        type="button"
        variant="outline"
        disabled={releaseSaving}
        onClick={() => setReleaseScheduleId(null)}
       >
        返回
       </Button>
       <Button
        type="button"
        variant="outline"
        disabled={releaseSaving || !releaseScheduleId}
        onClick={() => {
         if (!releaseScheduleId) return
         void holdTrialSchedule(releaseScheduleId)
        }}
       >
        {releaseSaving ? "處理中…" : "稍後再排"}
       </Button>
       <Button
        type="button"
        disabled={releaseSaving || !releaseScheduleId}
        onClick={() => {
         const id = releaseScheduleId
         if (!id) return
         setReleaseScheduleId(null)
         void openReschedule(id)
        }}
       >
        改到另一天
       </Button>
      </div>
     </div>
    </DialogContent>
   </Dialog>

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
       {rows.some((row) => row.id === rescheduleId && trialIsAwaitingReschedule(row.status))
        ? "選新日子後回復已預約。舊堂點名名單不再出現此生。"
        : "只更換排程；狀態維持已預約。舊堂點名名單將不再出現此生。"}
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
          const choice = await resolveTrialAttendanceDelete(
           confirmDialog,
           hits,
           "改期會刪除舊堂出席"
          )
          if (choice === "abort") return
          await rescheduleTrialSession({
           trialId: rescheduleId,
           newScheduleId: rescheduleScheduleId,
           ...trialAttendanceOptionsFromHits(choice, hits),
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
