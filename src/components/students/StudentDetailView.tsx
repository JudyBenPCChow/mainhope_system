import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams, useLocation, useSearchParams } from "react-router-dom"
import {
 ArrowLeft,
 Banknote,
 BookOpen,
 CalendarClock,
 ClipboardList,
 GraduationCap,
 History,
 ListTodo,
 Plus,
 Printer,
 Umbrella,
 User,
 UserRound,
} from "lucide-react"

import { DetailLayerShell } from "@/components/detail/DetailLayerShell"
import { ParentPortalInvitePanel } from "@/components/students/ParentPortalInvitePanel"
import { ScheduleListCard } from "@/components/schedules/ScheduleListCard"
import { Button } from "@/components/ui/button"
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { Textarea } from "@/components/ui/textarea"
import { useIsMobile } from "@/hooks/use-mobile"
import { ChoiceChips, GENDER_CHIPS, ParentRelationshipChips, StatusToggle, StudentClassificationTags, StudentGradeChips } from "@/components/students/studentsUi"
import { todoStatusLabel, TodoTagList } from "@/components/todos/todoUi"
import { formatStudentGrade } from "@/lib/studentGrade"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { resolveStudentDetailExitPath } from "@/lib/studentDetailNav"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import { formatClassLabel } from "@/lib/courseLabel"
import { listCalendarEventsForStudent, type CalendarEventRow } from "@/services/calendarQueries"
import { printPaymentForStatus } from "@/lib/paymentPrint"
import {
 fetchPaymentFull,
 fetchTotalPaidLessonsForStudent,
 PAYMENT_STATUS,
} from "@/services/paymentQueries"
import {
 deletePayment,
 fetchAllStudents,
 fetchAttendanceForStudent,
 fetchClassOptions,
 fetchEnrollmentsForStudent,
 fetchLeaveForStudent,
 fetchPaymentsForStudent,
 fetchStudentActivity,
 getStudentById,
 insertEnrollment,
 normalizeAcademicStage,
 normalizeRegistrationStatus,
 PHONE_COUNTRY_CODES,
 PREFERRED_CONTACT_METHODS,
 purgeMistakenEnrollment,
 type AttendanceRow,
 type ClassOption,
 type EnrollmentWithClass,
 type HistoryRow,
 type LeaveRow,
 type PaymentRow,
 type StudentRecord,
 updateEnrollment,
 updateEnrollmentPeriod,
 updateEnrollmentSessions,
 updateStudent,
 withdrawStudentFromClass,
} from "@/services/studentQueries"
import { fetchEnrolledScheduleIdsByEnrollmentIds } from "@/services/enrollmentSessionQueries"
import {
 deleteStudentRelationship,
 fetchRelativesForStudent,
 RELATIONSHIP_PRESETS,
 saveStudentRelationship,
 updateStudentRelationshipLabel,
 type StudentRelativeRow,
} from "@/services/studentRelationshipQueries"
import {
 fetchEnrolledClassesForStudent,
 fetchMakeupCandidateSchedules,
 validateMakeupScheduleForStudent,
 fetchUpcomingSchedulesForStudent,
 fetchUpcomingSchedulesForClass,
 insertLeaveMakeupForSchedule,
 LEAVE_MAKEUP_OPTIONS,
 LEAVE_REASON_OPTIONS,
 type ClassScheduleOption,
 type EnrolledClassOption,
 type StudentUpcomingScheduleRow,
} from "@/services/leaveQueries"
 import {
 ENROLLMENT_PERIOD_OPTIONS,
 SINGLE_SESSION_ENROLLMENT,
 SUMMER_ENROLLMENT_FORM_OPTIONS,
 formatEnrollmentFormLabel,
 isSingleSessionEnrollment,
 type EnrollmentFormValue,
 type EnrollmentPeriod,
} from "@/lib/enrollmentPeriod"
import { EnrollmentSessionPicker } from "@/components/enrollment/EnrollmentSessionPicker"
import {
 fetchScheduleStudentHintsByClass,
 type ScheduleStudentHints,
} from "@/services/classQueries"
import type { ScheduleManageRow } from "@/services/scheduleQueries"
import {
 countBoundSchedulesForEnrollment,
 fetchLessonBalancesForStudent,
 insertPendingLesson,
 isLessonBalanceNeedsFollowUp,
 PENDING_LESSON_REASONS,
 updatePendingLessonStatus,
 type LessonBalanceRow,
} from "@/services/pendingLessonQueries"

function formatLeaveError(e: unknown): string {
 if (e instanceof Error) return e.message
 if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message)
 return "操作失敗"
}

type TabId =
 | "basic"
 | "enrollments"
 | "payments"
 | "attendance"
 | "leave"
 | "futureSchedules"
 | "history"
 | "relatedTodos"

const TABS: { id: TabId; label: string; icon: typeof User }[] = [
 { id: "basic", label: "基本資料", icon: User },
 { id: "enrollments", label: "報讀班別", icon: BookOpen },
 { id: "payments", label: "繳費紀錄", icon: Banknote },
 { id: "attendance", label: "上課紀錄", icon: ClipboardList },
 { id: "leave", label: "請假紀錄", icon: Umbrella },
 { id: "futureSchedules", label: "未來排程", icon: CalendarClock },
 { id: "history", label: "更動紀錄", icon: History },
 { id: "relatedTodos", label: "相關事項", icon: ListTodo },
]

function money(n: number) {
 return `HKD $${n.toLocaleString("zh-Hant-TW")}`
}

function localTodayYmd() {
 const d = new Date()
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

const BASIC_FORM_KEYS = [
 "full_name",
 "english_name",
 "gender",
 "grade",
 "school",
 "registration_status",
 "academic_stage",
 "date_of_birth",
 "parent_name",
 "parent_relationship",
 "student_phone",
 "student_phone_country_code",
 "parent_phone",
 "parent_phone_country_code",
 "whatsapp",
 "preferred_contact_method",
 "address",
 "remarks",
] as const satisfies readonly (keyof StudentRecord)[]

function formFieldNorm(value: unknown): string | null {
 if (value == null) return null
 const s = String(value).trim()
 return s === "" ? null : s
}

function isStudentBasicFormDirty(student: StudentRecord, form: Partial<StudentRecord>): boolean {
 return BASIC_FORM_KEYS.some((key) => formFieldNorm(student[key]) !== formFieldNorm(form[key]))
}

type UnsavedLeaveChoice = "save" | "discard" | "cancel"

export function StudentDetailView() {
 const { studentId } = useParams<{ studentId: string }>()
 const navigate = useNavigate()
 const location = useLocation()
 const [searchParams, setSearchParams] = useSearchParams()
 const isMobile = useIsMobile()
 const exitPath = useMemo(() => resolveStudentDetailExitPath(location), [location])
 const { pushBanner } = useAppBanner()
 const { confirmDialog } = useAppConfirm()
 const [tab, setTab] = useState<TabId>("basic")
 const [enrollKindOpen, setEnrollKindOpen] = useState(false)

 useEffect(() => {
  const t = searchParams.get("tab")?.trim()
  if (!t) return
  if (!TABS.some((x) => x.id === t)) return
  setTab(t as TabId)
  setSearchParams(
   (prev) => {
    const next = new URLSearchParams(prev)
    next.delete("tab")
    return next
   },
   { replace: true }
  )
 }, [searchParams, setSearchParams])
 const [student, setStudent] = useState<StudentRecord | null>(null)
 const [loading, setLoading] = useState(true)
 const [enrollments, setEnrollments] = useState<EnrollmentWithClass[]>([])
 const [payments, setPayments] = useState<PaymentRow[]>([])
 const [attendance, setAttendance] = useState<AttendanceRow[]>([])
 const [leaves, setLeaves] = useState<LeaveRow[]>([])
const [futureSchedules, setFutureSchedules] = useState<StudentUpcomingScheduleRow[]>([])
 const [futureScheduleHints, setFutureScheduleHints] = useState<
  Map<string, ScheduleStudentHints>
 >(new Map())
 const [hintsLoading, setHintsLoading] = useState(false)
 const hintsRequestIdRef = useRef(0)
 const [history, setHistory] = useState<HistoryRow[]>([])
 const [relatedTodos, setRelatedTodos] = useState<CalendarEventRow[]>([])
 const [relatedTodosLoading, setRelatedTodosLoading] = useState(false)
 const [classOptions, setClassOptions] = useState<ClassOption[]>([])
 const [pickClass, setPickClass] = useState("")
 /** 暑期：期數或單堂；正規：full | 單堂 */
 const [pickForm, setPickForm] = useState<string>("兩期全報")
 const [pickScheduleIds, setPickScheduleIds] = useState<string[]>([])
 /** 報讀時填寫的應享／繳費堂數；多於綁定排程則自動記待補 */
 const [pickEntitledCount, setPickEntitledCount] = useState("")
 const [pickBoundPreview, setPickBoundPreview] = useState<number | null>(null)
 const [totalPaidLessons, setTotalPaidLessons] = useState<number | null>(null)
 const [lessonBalances, setLessonBalances] = useState<LessonBalanceRow[]>([])
 const [pendingDialogOpen, setPendingDialogOpen] = useState(false)
 const [pendingTarget, setPendingTarget] = useState<EnrollmentWithClass | null>(null)
 const [pendingOwedInput, setPendingOwedInput] = useState("1")
 const [pendingReason, setPendingReason] = useState<string>(PENDING_LESSON_REASONS[0])
 const [pendingRemarks, setPendingRemarks] = useState("")
 const [pendingSaving, setPendingSaving] = useState(false)
 const [withdrawOpen, setWithdrawOpen] = useState(false)
 const [withdrawTarget, setWithdrawTarget] = useState<EnrollmentWithClass | null>(null)
 const [withdrawReason, setWithdrawReason] = useState("")
 const [withdrawSaving, setWithdrawSaving] = useState(false)

 const [editFormOpen, setEditFormOpen] = useState(false)
 const [editFormTarget, setEditFormTarget] = useState<EnrollmentWithClass | null>(null)
 const [editFormValue, setEditFormValue] = useState<string>("full")
 const [editFormScheduleIds, setEditFormScheduleIds] = useState<string[]>([])
 const [editFormSaving, setEditFormSaving] = useState(false)
 const [editFormLoadingSessions, setEditFormLoadingSessions] = useState(false)

 const [relatives, setRelatives] = useState<StudentRelativeRow[]>([])
 const [relativeDialogOpen, setRelativeDialogOpen] = useState(false)
 const [allStudentsForPick, setAllStudentsForPick] = useState<StudentRecord[]>([])
 const [relativeQuery, setRelativeQuery] = useState("")
 const [relativePick, setRelativePick] = useState<StudentRecord | null>(null)
 const [relativePreset, setRelativePreset] = useState<string>(RELATIONSHIP_PRESETS[0])
 const [relativeCustom, setRelativeCustom] = useState("")
 const [relativeSaving, setRelativeSaving] = useState(false)

 const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
 const [leaveClasses, setLeaveClasses] = useState<EnrolledClassOption[]>([])
 const [leaveClassId, setLeaveClassId] = useState("")
 const [leaveScheduleOptions, setLeaveScheduleOptions] = useState<ClassScheduleOption[]>([])
 const [leaveScheduleId, setLeaveScheduleId] = useState("")
 const [leaveReasonPick, setLeaveReasonPick] = useState<(typeof LEAVE_REASON_OPTIONS)[number]>("病假")
 const [leaveMakeup, setLeaveMakeup] = useState<(typeof LEAVE_MAKEUP_OPTIONS)[number]>("待安排")
 const [leaveMakeupScheduleId, setLeaveMakeupScheduleId] = useState("")
 const [leaveMakeupSearch, setLeaveMakeupSearch] = useState("")
 const [leaveMakeupCandidates, setLeaveMakeupCandidates] = useState<ScheduleManageRow[]>([])
 const [leaveRemarks, setLeaveRemarks] = useState("")
 const [leaveSaving, setLeaveSaving] = useState(false)
 const [leaveErr, setLeaveErr] = useState<string | null>(null)

 const [attClassFilter, setAttClassFilter] = useState<string>("all")
 const [attStatusFilter, setAttStatusFilter] = useState<"all" | "present" | "absent" | "other">("all")
 const [attDateFrom, setAttDateFrom] = useState("")
 const [attDateTo, setAttDateTo] = useState("")
 const [attSort, setAttSort] = useState<
  "dateDesc" | "dateAsc" | "classAsc" | "classDesc" | "statusAsc"
 >("dateDesc")

 const sid = studentId ?? ""

 const reloadStudent = useCallback(async () => {
  if (!sid) return
  const s = await getStudentById(sid)
  setStudent(s)
 }, [sid])

 const reloadSubs = useCallback(async () => {
  if (!sid) return
  const settled = await Promise.allSettled([
   fetchEnrollmentsForStudent(sid),
   fetchPaymentsForStudent(sid),
   fetchAttendanceForStudent(sid),
   fetchLeaveForStudent(sid),
   fetchUpcomingSchedulesForStudent(sid, localTodayYmd()),
   fetchStudentActivity(sid),
   fetchRelativesForStudent(sid),
   fetchTotalPaidLessonsForStudent(sid),
   fetchLessonBalancesForStudent(sid),
  ])
  const pick = <T,>(i: number, fallback: T): T =>
   settled[i].status === "fulfilled" ? (settled[i] as PromiseFulfilledResult<T>).value : fallback

  if (settled[0].status === "rejected") {
   console.error("[StudentDetailView] enrollments", settled[0].reason)
  }
  if (settled[8].status === "rejected") {
   console.error("[StudentDetailView] lessonBalances", settled[8].reason)
  }
  setEnrollments(pick(0, []))
  setPayments(pick(1, []))
  setTotalPaidLessons(pick(7, null))
  setLessonBalances(pick(8, []))
  setAttendance(pick(2, []))
  setLeaves(pick(3, []))
  const fs = pick(4, [] as StudentUpcomingScheduleRow[])
  setFutureSchedules(fs)
  setHistory(pick(5, []))
  setRelatives(pick(6, []))

  const byClass = new Map<string, { id: string; scheduled_date: string }[]>()
  for (const row of fs) {
   const arr = byClass.get(row.class_id) ?? []
   arr.push({ id: row.id, scheduled_date: row.scheduled_date })
   byClass.set(row.class_id, arr)
  }
  const reqId = ++hintsRequestIdRef.current
  setHintsLoading(true)
  void fetchScheduleStudentHintsByClass(byClass)
   .then((hints) => {
    if (reqId !== hintsRequestIdRef.current) return
    setFutureScheduleHints(hints)
   })
   .catch((e) => {
    console.error("[StudentDetailView] schedule hints", e)
    // 保留上一輪名單，避免失敗時顯示成「無人」
   })
   .finally(() => {
    if (reqId === hintsRequestIdRef.current) setHintsLoading(false)
   })
  await reloadStudent()
 }, [sid, reloadStudent])

 const loadAll = useCallback(async () => {
  if (!sid) return
  setLoading(true)
  try {
   await reloadStudent()
   // 主資料與選項先就緒後解鎖頁面；hints 在 reloadSubs 內二次載入
   const [, opts] = await Promise.all([reloadSubs(), fetchClassOptions()])
   setClassOptions(opts)
  } finally {
   setLoading(false)
  }
 }, [sid, reloadStudent, reloadSubs])

 useEffect(() => {
  void loadAll()
 }, [loadAll])

 const [form, setForm] = useState<Partial<StudentRecord>>({})

 useEffect(() => {
  if (student) setForm(student)
 }, [student])

 useEffect(() => {
  if (tab !== "relatedTodos" || !sid) return
  let cancelled = false
  setRelatedTodosLoading(true)
  void listCalendarEventsForStudent(sid)
   .then((rows) => {
    if (!cancelled) setRelatedTodos(rows)
   })
   .catch(() => {
    if (!cancelled) setRelatedTodos([])
   })
   .finally(() => {
    if (!cancelled) setRelatedTodosLoading(false)
   })
  return () => {
   cancelled = true
  }
 }, [tab, sid])

 const saveBasic = useCallback(async (): Promise<boolean> => {
  if (!sid || !student) return false
  try {
   const updated = await updateStudent(sid, {
    full_name: form.full_name ?? student.full_name,
    english_name: form.english_name,
    gender: form.gender,
    grade: form.grade,
    school: form.school,
    registration_status: form.registration_status,
    academic_stage: form.academic_stage,
    date_of_birth: form.date_of_birth,
    parent_name: form.parent_name,
    parent_relationship: form.parent_relationship,
    student_phone: form.student_phone,
    student_phone_country_code: form.student_phone_country_code ?? "+852",
    parent_phone: form.parent_phone,
    parent_phone_country_code: form.parent_phone_country_code ?? "+852",
    whatsapp: form.whatsapp,
    preferred_contact_method: form.preferred_contact_method || null,
    address: form.address,
    remarks: form.remarks,
   })
   setStudent(updated)
   setForm(updated)
   pushBanner({ tone: "success", title: "已儲存學生資料", message: "學生基本資料已更新。" })
   return true
  } catch (e) {
   reportUserFacingError(e, { source: "StudentDetailView.saveBasic" })
   pushBanner({ tone: "error", title: "儲存失敗", message: e instanceof Error ? e.message : String(e) })
   return false
  }
 }, [sid, student, form, pushBanner])

 const [unsavedLeaveOpen, setUnsavedLeaveOpen] = useState(false)
 const unsavedLeaveResolverRef = useRef<((choice: UnsavedLeaveChoice) => void) | null>(null)

 const promptUnsavedLeave = useCallback(
  () =>
   new Promise<UnsavedLeaveChoice>((resolve) => {
    unsavedLeaveResolverRef.current = resolve
    setUnsavedLeaveOpen(true)
   }),
  []
 )

 const finishUnsavedLeave = useCallback((choice: UnsavedLeaveChoice) => {
  setUnsavedLeaveOpen(false)
  unsavedLeaveResolverRef.current?.(choice)
  unsavedLeaveResolverRef.current = null
 }, [])

 const requestLeave = useCallback(async () => {
  if (student && isStudentBasicFormDirty(student, form)) {
   const choice = await promptUnsavedLeave()
   if (choice === "cancel") return
   if (choice === "save") {
    const ok = await saveBasic()
    if (!ok) return
   }
  }
  navigate(exitPath)
 }, [student, form, promptUnsavedLeave, navigate, saveBasic, exitPath])

 const addEnrollment = async () => {
  if (!pickClass) return
  const picked = classOptions.find((o) => o.id === pickClass)
  const isSummer = picked?.courseMode === "summer_two_period"
  const isSingle = pickForm === SINGLE_SESSION_ENROLLMENT
  if (isSingle && pickScheduleIds.length === 0) {
   pushBanner({ tone: "error", title: "請選擇堂數", message: "單堂報讀請至少勾選一堂" })
   return
  }
  let period: EnrollmentFormValue | null = null
  if (isSingle) period = SINGLE_SESSION_ENROLLMENT
  else if (isSummer && ENROLLMENT_PERIOD_OPTIONS.includes(pickForm as EnrollmentPeriod)) {
   period = pickForm as EnrollmentPeriod
  }
  const entitledRaw = pickEntitledCount.trim()
  const entitled = entitledRaw === "" ? null : Math.floor(Number(entitledRaw))
  if (entitledRaw !== "" && (!Number.isFinite(entitled) || (entitled ?? 0) < 1)) {
   pushBanner({ tone: "error", title: "應享堂數無效", message: "請輸入正整數，或留空" })
   return
  }
  let bound = pickBoundPreview
  if (bound == null) {
   try {
    bound = await countBoundSchedulesForEnrollment({
     classId: pickClass,
     enrollmentPeriod: period,
     scheduleIds: isSingle ? pickScheduleIds : undefined,
    })
   } catch {
    bound = isSingle ? pickScheduleIds.length : 0
   }
  }
  const owed =
   entitled != null && bound != null && entitled > bound ? entitled - bound : 0
  if (owed > 0) {
   const ok = await confirmDialog({
    title: "將記錄待補堂",
    description: `應享 ${entitled} 堂，目前只會綁定 ${bound} 堂，將同時記錄待補 ${owed} 堂，方便同事跟進。`,
    confirmText: "確認加入並記待補",
   })
   if (!ok) return
  }
  try {
   await insertEnrollment(
    sid,
    pickClass,
    period,
    isSingle ? pickScheduleIds : undefined,
    owed > 0
     ? { owedCount: owed, reason: "遲報缺堂", remarks: `應享 ${entitled}／綁定 ${bound}` }
     : null
   )
   setPickClass("")
   setPickForm(isSummer ? "兩期全報" : "full")
   setPickScheduleIds([])
   setPickEntitledCount("")
   setPickBoundPreview(null)
   pushBanner({
    tone: "success",
    title: "已加入班別",
    message: owed > 0 ? `已記錄待補 ${owed} 堂。可前往收款／出單。` : "可前往收款／出單。",
    action: {
     pageLabel: "收款／出單",
     to: `/Payments?studentId=${encodeURIComponent(sid)}&mode=receive`,
    },
   })
   await reloadSubs()
  } catch (e) {
   reportUserFacingError(e, { source: "StudentDetailView.addEnrollment" })
   pushBanner({
    tone: "error",
    title: "加入失敗",
    message: e instanceof Error ? e.message : String(e),
   })
  }
 }

 const submitWithdraw = async () => {
  if (!withdrawTarget || !sid) return
  setWithdrawSaving(true)
  try {
   await withdrawStudentFromClass({
    enrollmentId: withdrawTarget.id,
    studentId: sid,
    classId: withdrawTarget.classId,
    effectiveDate: localTodayYmd(),
    reason: withdrawReason.trim() || null,
   })
   setWithdrawOpen(false)
   setWithdrawTarget(null)
   setWithdrawReason("")
   await reloadSubs()
  } catch (e) {
   reportUserFacingError(e, { source: "StudentDetailView.withdrawEnrollment" })
   pushBanner({ tone: "error", title: "退班失敗", message: e instanceof Error ? e.message : String(e) })
  } finally {
   setWithdrawSaving(false)
  }
 }

 /** 非「已退讀」皆佔用該班（就讀中／休學／退選），不可再從下拉重複加入 */
 const activeEnrollments = enrollments.filter((e) => e.status !== "已退讀")
 const withdrawnEnrollments = enrollments.filter((e) => e.status === "已退讀")
 const occupiedClassIds = new Set(activeEnrollments.map((e) => e.classId))
 const groupActiveCount = activeEnrollments.filter((e) => e.classKind !== "private").length
 const privateActiveCount = activeEnrollments.filter((e) => e.classKind === "private").length
 const classSelectOptions = classOptions.filter((o) => !occupiedClassIds.has(o.id))
 const pickedClassOption = classOptions.find((o) => o.id === pickClass)
 const isSummerPick = pickedClassOption?.courseMode === "summer_two_period"
 const showSessionPicker = Boolean(pickClass) && pickForm === SINGLE_SESSION_ENROLLMENT
 const balanceByEnrollment = useMemo(() => {
  const map = new Map<string, LessonBalanceRow>()
  for (const row of lessonBalances) map.set(row.enrollmentId, row)
  return map
 }, [lessonBalances])
 const misalignedCount = useMemo(
  () => lessonBalances.filter((b) => isLessonBalanceNeedsFollowUp(b)).length,
  [lessonBalances]
 )
 const pickEntitledNum = pickEntitledCount.trim() === "" ? null : Math.floor(Number(pickEntitledCount))
 const pickPendingPreview =
  pickEntitledNum != null &&
  Number.isFinite(pickEntitledNum) &&
  pickBoundPreview != null &&
  pickEntitledNum > pickBoundPreview
   ? pickEntitledNum - pickBoundPreview
   : 0

 useEffect(() => {
  if (!pickClass) {
   setPickBoundPreview(null)
   return
  }
  let cancelled = false
  const isSingle = pickForm === SINGLE_SESSION_ENROLLMENT
  let period: EnrollmentFormValue | null = null
  if (isSingle) period = SINGLE_SESSION_ENROLLMENT
  else if (isSummerPick && ENROLLMENT_PERIOD_OPTIONS.includes(pickForm as EnrollmentPeriod)) {
   period = pickForm as EnrollmentPeriod
  }
  void countBoundSchedulesForEnrollment({
   classId: pickClass,
   enrollmentPeriod: period,
   scheduleIds: isSingle ? pickScheduleIds : undefined,
  })
   .then((n) => {
    if (!cancelled) setPickBoundPreview(n)
   })
   .catch(() => {
    if (!cancelled) setPickBoundPreview(isSingle ? pickScheduleIds.length : null)
   })
  return () => {
   cancelled = true
  }
 }, [pickClass, pickForm, pickScheduleIds, isSummerPick])

 const openPendingDialog = (e: EnrollmentWithClass) => {
  const bal = balanceByEnrollment.get(e.id)
  const suggest =
   bal && bal.paidLessons > 0 && bal.gap > 0 ? String(bal.gap) : "1"
  setPendingTarget(e)
  setPendingOwedInput(suggest)
  setPendingReason(PENDING_LESSON_REASONS[0])
  setPendingRemarks("")
  setPendingDialogOpen(true)
 }

 const submitPendingLesson = async () => {
  if (!pendingTarget || !sid) return
  const owed = Math.floor(Number(pendingOwedInput))
  if (!Number.isFinite(owed) || owed < 1) {
   pushBanner({ tone: "error", title: "待補堂數無效", message: "請輸入至少 1 堂" })
   return
  }
  setPendingSaving(true)
  try {
   await insertPendingLesson({
    studentId: sid,
    classId: pendingTarget.classId,
    enrollmentId: pendingTarget.id,
    owedCount: owed,
    reason: pendingReason,
    remarks: pendingRemarks.trim() || null,
   })
   setPendingDialogOpen(false)
   setPendingTarget(null)
   pushBanner({ tone: "success", title: "已記錄待補堂", message: `待補 ${owed} 堂` })
   await reloadSubs()
  } catch (e) {
   reportUserFacingError(e, { source: "StudentDetailView.submitPendingLesson" })
   pushBanner({
    tone: "error",
    title: "記錄失敗",
    message: e instanceof Error ? e.message : String(e),
   })
  } finally {
   setPendingSaving(false)
  }
 }

 const openEditEnrollmentForm = async (e: EnrollmentWithClass) => {
  setEditFormTarget(e)
  setEditFormOpen(true)
  const isSummer = e.courseMode === "summer_two_period"
  if (isSingleSessionEnrollment(e.enrollmentPeriod)) {
   setEditFormValue(SINGLE_SESSION_ENROLLMENT)
   setEditFormLoadingSessions(true)
   try {
    const map = await fetchEnrolledScheduleIdsByEnrollmentIds([e.id])
    setEditFormScheduleIds([...(map.get(e.id) ?? new Set())])
   } catch {
    setEditFormScheduleIds([])
   } finally {
    setEditFormLoadingSessions(false)
   }
  } else if (isSummer && e.enrollmentPeriod) {
   setEditFormValue(e.enrollmentPeriod)
   setEditFormScheduleIds([])
  } else {
   setEditFormValue("full")
   setEditFormScheduleIds([])
  }
 }

 const submitEditEnrollmentForm = async () => {
  if (!editFormTarget || !sid) return
  const isSummer = editFormTarget.courseMode === "summer_two_period"
  const isSingle = editFormValue === SINGLE_SESSION_ENROLLMENT
  if (isSingle && editFormScheduleIds.length === 0) {
   pushBanner({ tone: "error", title: "請選擇堂數", message: "單堂報讀請至少勾選一堂" })
   return
  }
  setEditFormSaving(true)
  try {
   const prev = editFormTarget.enrollmentPeriod
   const stayingSingle =
    isSingle && isSingleSessionEnrollment(prev)
   if (stayingSingle) {
    await updateEnrollmentSessions(editFormTarget.id, editFormScheduleIds, {
     studentId: sid,
     classId: editFormTarget.classId,
    })
   } else {
    let next: EnrollmentFormValue | null = null
    if (isSingle) next = SINGLE_SESSION_ENROLLMENT
    else if (isSummer && ENROLLMENT_PERIOD_OPTIONS.includes(editFormValue as EnrollmentPeriod)) {
     next = editFormValue as EnrollmentPeriod
    } else {
     next = null
    }
    await updateEnrollmentPeriod(editFormTarget.id, next, {
     studentId: sid,
     classId: editFormTarget.classId,
     previousPeriod: prev,
     scheduleIds: isSingle ? editFormScheduleIds : undefined,
    })
   }
   setEditFormOpen(false)
   setEditFormTarget(null)
   pushBanner({
    tone: "success",
    title: "已更新報讀形式",
    message: formatEnrollmentFormLabel(
     isSingle
      ? SINGLE_SESSION_ENROLLMENT
      : isSummer && ENROLLMENT_PERIOD_OPTIONS.includes(editFormValue as EnrollmentPeriod)
        ? (editFormValue as EnrollmentPeriod)
        : null
    ),
   })
   await reloadSubs()
  } catch (e) {
   reportUserFacingError(e, { source: "StudentDetailView.editEnrollmentForm" })
   pushBanner({
    tone: "error",
    title: "更新失敗",
    message: e instanceof Error ? e.message : String(e),
   })
  } finally {
   setEditFormSaving(false)
  }
 }

 const onPurgeMistakenEnrollment = async (e: EnrollmentWithClass) => {
  const studentName = (student?.full_name ?? form.full_name ?? "").trim()
  if (!studentName) {
   pushBanner({ tone: "error", title: "無法清除", message: "缺少學生姓名，請重新載入頁面後再試。" })
   return
  }
  if (
   !(await confirmDialog({
    title: "手誤清除報讀",
    description: `確定清除「${formatClassLabel({
     subject: e.subject,
     courseCode: e.courseCode,
     courseName: e.courseName,
    })}」的報讀？會刪除該筆報讀及相關增退紀錄，不留下任何痕跡。若要保留紀錄請改用「退讀」。`,
    confirmText: "確認清除",
    tone: "destructive",
    confirmInput: {
     label: `請輸入學生姓名以確認：${studentName}`,
     expected: studentName,
     placeholder: studentName,
    },
   }))
  ) {
   return
  }
  try {
   await purgeMistakenEnrollment({ enrollmentId: e.id, studentId: sid })
   pushBanner({ tone: "success", title: "已清除手誤報讀" })
   await reloadSubs()
  } catch (err) {
   reportUserFacingError(err, { source: "StudentDetailView.purgeMistakenEnrollment" })
   pushBanner({
    tone: "error",
    title: "清除失敗",
    message: err instanceof Error ? err.message : String(err),
   })
  }
 }

 const relatedIds = useMemo(() => new Set(relatives.map((r) => r.relatedStudentId)), [relatives])

 const relativePickerOptions = useMemo(() => {
  const q = relativeQuery.trim().toLowerCase()
  return allStudentsForPick
   .filter((s) => s.id !== sid && !relatedIds.has(s.id))
   .filter((s) => {
    if (!q) return true
    const hay = `${s.full_name} ${s.student_code ?? ""} ${s.english_name ?? ""}`.toLowerCase()
    return hay.includes(q)
   })
   .slice(0, 24)
 }, [allStudentsForPick, sid, relatedIds, relativeQuery])

 const openAddRelative = () => {
  setRelativePick(null)
  setRelativeQuery("")
  setRelativePreset(RELATIONSHIP_PRESETS[0])
  setRelativeCustom("")
  setRelativeDialogOpen(true)
  void fetchAllStudents()
   .then(setAllStudentsForPick)
   .catch(() => setAllStudentsForPick([]))
 }

 const submitAddRelative = async () => {
  if (!relativePick || !sid) {
   pushBanner({ tone: "warning", title: "請先選擇學生" })
   return
  }
  const label =
   relativePreset === "其他（自訂）" ? relativeCustom.trim() : relativePreset
  if (!label) {
   pushBanner({ tone: "warning", title: "請填寫關係" })
   return
  }
  setRelativeSaving(true)
  try {
   await saveStudentRelationship(sid, relativePick.id, label)
   setRelativeDialogOpen(false)
   await reloadSubs()
  } catch (e) {
   reportUserFacingError(e, { source: "StudentDetailView.addRelative" })
   pushBanner({ tone: "error", title: "新增親友失敗", message: e instanceof Error ? e.message : String(e) })
  } finally {
   setRelativeSaving(false)
  }
 }

 const leaveMakeupFiltered = useMemo(() => {
  const q = leaveMakeupSearch.trim().toLowerCase()
  return leaveMakeupCandidates.filter((s) => {
   if (!q) return true
   const hay = `${s.classLabel} ${s.course_name ?? ""} ${s.subject} ${s.course_code_full ?? ""} ${s.teacher_name ?? ""} ${s.scheduled_date}`.toLowerCase()
   return hay.includes(q)
  })
 }, [leaveMakeupCandidates, leaveMakeupSearch])

 const openLeaveDialog = async () => {
  if (!sid) return
  setLeaveErr(null)
  setLeaveClassId("")
  setLeaveScheduleId("")
  setLeaveScheduleOptions([])
  setLeaveReasonPick("病假")
  setLeaveMakeup("待安排")
  setLeaveMakeupScheduleId("")
  setLeaveMakeupSearch("")
  setLeaveRemarks("")
  setLeaveDialogOpen(true)
  try {
   const classes = await fetchEnrolledClassesForStudent(sid)
   setLeaveClasses(classes)
   setLeaveMakeupCandidates([])
  } catch (e) {
   reportUserFacingError(e, { source: "StudentDetailView.openLeaveDialog", setErr: setLeaveErr })
   setLeaveClasses([])
   setLeaveMakeupCandidates([])
  }
 }

 useEffect(() => {
  if (!leaveDialogOpen || leaveMakeup !== "調堂" || !sid) {
   if (!leaveDialogOpen || leaveMakeup !== "調堂") {
    setLeaveMakeupCandidates([])
    setLeaveMakeupScheduleId("")
   }
   return
  }
  void fetchMakeupCandidateSchedules({
   studentId: sid,
   excludeScheduleIds: leaveScheduleId ? [leaveScheduleId] : undefined,
  })
   .then((list) => {
    setLeaveMakeupCandidates(list)
    setLeaveMakeupScheduleId((prev) => (prev && list.some((s) => s.id === prev) ? prev : ""))
   })
   .catch((e) => {
    reportUserFacingError(e, { source: "StudentDetailView.loadMakeupCandidates", setErr: setLeaveErr })
    setLeaveMakeupCandidates([])
   })
 }, [leaveDialogOpen, leaveMakeup, sid, leaveScheduleId])

 useEffect(() => {
  if (!leaveDialogOpen || !leaveClassId) {
   setLeaveScheduleOptions([])
   setLeaveScheduleId("")
   return
  }
  void fetchUpcomingSchedulesForClass(leaveClassId, localTodayYmd(), sid).then((opts) => {
   setLeaveScheduleOptions(opts)
   setLeaveScheduleId("")
  })
 }, [leaveDialogOpen, leaveClassId, sid])

 const submitStudentLeave = async () => {
  if (!sid || !leaveClassId || !leaveScheduleId) {
   setLeaveErr("請選擇班別與請假排程")
   return
  }
  if (leaveMakeup === "調堂" && !leaveMakeupScheduleId) {
   setLeaveErr("補課安排為「調堂」時請選擇補堂排程")
   return
  }
  const sched = leaveScheduleOptions.find((s) => s.id === leaveScheduleId)
  if (!sched) {
   setLeaveErr("請假排程無效")
   return
  }
  const makeupRow =
   leaveMakeup === "調堂" ? leaveMakeupCandidates.find((s) => s.id === leaveMakeupScheduleId) : undefined
  if (makeupRow) {
   const makeupErr = await validateMakeupScheduleForStudent(sid, makeupRow, leaveScheduleId)
   if (makeupErr) {
    setLeaveErr(makeupErr)
    return
   }
  }
  setLeaveSaving(true)
  setLeaveErr(null)
  try {
   await insertLeaveMakeupForSchedule({
    student_id: sid,
    class_id: leaveClassId,
    schedule_id: leaveScheduleId,
    leave_date: sched.scheduled_date,
    leave_reason: leaveReasonPick,
    makeup_type: leaveMakeup,
    makeup_schedule_id: leaveMakeup === "調堂" ? leaveMakeupScheduleId : null,
    makeup_date: makeupRow?.scheduled_date ?? null,
    remarks: leaveRemarks.trim() || null,
    status: "待補課",
   })
   setLeaveDialogOpen(false)
   await reloadSubs()
   pushBanner({ tone: "success", title: "已新增請假", message: "請假紀錄已建立。" })
  } catch (e) {
   reportUserFacingError(e, { source: "StudentDetailView.submitLeave", setErr: setLeaveErr })
  } finally {
   setLeaveSaving(false)
  }
 }

 const attStats = {
  present: attendance.filter(
   (x) =>
    x.status === "現場" ||
    x.status.includes("出席") ||
    x.status === "zoom實時網課" ||
    x.status === "即時直播" ||
    x.status === "錄影回放"
  ).length,
  absent: attendance.filter((x) => x.status === "no show" || x.status.includes("缺席")).length,
  makeup: attendance.filter(
   (x) =>
    x.status === "請假而不需補回" ||
    x.status === "不用補回" ||
    x.status.includes("補") ||
    x.status.includes("待")
  ).length,
 }

const csvEscape = (s: string) => `"${s.replace(/"/g, '""')}"`

const exportFutureSchedulesCsv = () => {
 const header = ["堂次", "日期", "開始", "結束", "科目", "課程編號", "老師", "狀態"]
 const rows = futureSchedules.map((row) =>
  [
   row.session_number != null ? String(row.session_number) : "",
   row.scheduled_date,
   row.start_time ?? "",
   row.end_time ?? "",
   row.subject,
   row.course_code_full ?? "",
   row.teacher_name ?? "",
   row.status,
  ]
   .map((x) => csvEscape(x))
   .join(",")
 )
 const csv = `\uFEFF${header.map(csvEscape).join(",")}\n${rows.join("\n")}`
 const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
 const a = document.createElement("a")
 a.href = URL.createObjectURL(blob)
 a.download = `student-upcoming-schedules-${sid}-${localTodayYmd()}.csv`
 a.click()
 URL.revokeObjectURL(a.href)
}

 function attendanceStatusCategory(status: string): "present" | "absent" | "other" {
  const s = status.trim()
  if (s.includes("缺席")) return "absent"
  if (s.includes("出席")) return "present"
  return "other"
 }

 const attendanceClassOptions = useMemo(() => {
  const m = new Map<string, string>()
  for (const a of attendance) {
   if (a.classId) m.set(a.classId, a.classLabel)
  }
  return [...m.entries()].sort((x, y) => x[1].localeCompare(y[1], "zh-Hant"))
 }, [attendance])

 const filteredSortedAttendance = useMemo(() => {
  let list = attendance.filter((a) => {
   if (attClassFilter !== "all" && a.classId !== attClassFilter) return false
   const cat = attendanceStatusCategory(a.status)
   if (attStatusFilter !== "all" && cat !== attStatusFilter) return false
   if (attDateFrom && a.attendance_date < attDateFrom) return false
   if (attDateTo && a.attendance_date > attDateTo) return false
   return true
  })
  list = [...list]
  const cmpDate = (da: string, db: string) => da.localeCompare(db)
  const cmpClass = (a: (typeof attendance)[0], b: (typeof attendance)[0]) =>
   a.classLabel.localeCompare(b.classLabel, "zh-Hant")
  list.sort((a, b) => {
   switch (attSort) {
    case "dateAsc":
     return cmpDate(a.attendance_date, b.attendance_date)
    case "dateDesc":
     return cmpDate(b.attendance_date, a.attendance_date)
    case "classAsc":
     return cmpClass(a, b) || cmpDate(b.attendance_date, a.attendance_date)
    case "classDesc":
     return cmpClass(b, a) || cmpDate(b.attendance_date, a.attendance_date)
    case "statusAsc":
     return a.status.localeCompare(b.status, "zh-Hant") || cmpDate(b.attendance_date, a.attendance_date)
    default:
     return cmpDate(b.attendance_date, a.attendance_date)
   }
  })
  return list
 }, [attendance, attClassFilter, attStatusFilter, attDateFrom, attDateTo, attSort])

 if (!sid) {
  return (
   <DetailLayerShell
    variant="student"
    onDismiss={() => navigate(exitPath)}
    layerLabel={null}
   >
    <p className="p-6 text-muted-foreground">無效的學生編號</p>
   </DetailLayerShell>
  )
 }

 if (!loading && !student) {
  return (
   <DetailLayerShell variant="student" onDismiss={() => navigate(exitPath)} layerLabel="學生詳情">
    <div className="p-6">
     <p className="text-muted-foreground">找不到此學生。</p>
     <Button type="button" variant="outline" className="mt-4" asChild>
      <Link to={exitPath}>返回</Link>
     </Button>
    </div>
   </DetailLayerShell>
  )
 }

 return (
  <DetailLayerShell
   variant="student"
   onDismiss={() => void requestLeave()}
   layerLabel="學生詳情 · 次層檢視"
  >
  <div className="flex min-h-full flex-col bg-background">
   <div className="bg-primary px-4 py-4 text-primary-foreground shadow-md md:px-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:gap-4">
     <Button
      type="button"
      variant="secondary"
      size="sm"
      className="w-fit shrink-0 bg-white/90 text-foreground hover:bg-white"
      onClick={() => void requestLeave()}
     >
      <ArrowLeft className="h-4 w-4" />
      返回
     </Button>
     <div className="flex min-w-0 flex-1 items-start gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
       <GraduationCap className="h-6 w-6" />
      </div>
      <div className="min-w-0">
       {loading ? (
        <p className="text-lg">載入中…</p>
       ) : student ? (
        <>
         <h1 className="truncate text-xl font-bold md:text-2xl">{student.full_name}</h1>
         <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/90">
          <span className="tabular-nums">{student.student_code || student.id.slice(0, 8)}</span>
          <StudentClassificationTags student={student} size="sm" surface="onPrimary" />
         </div>
         <p className="mt-1 truncate text-sm text-white/85">
          {formatStudentGrade(student.grade) + " · " + (student.school ?? "—")}
         </p>
         <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/90">
          <span className="rounded-md bg-white/15 px-2 py-0.5">
           小組課：就讀中 {groupActiveCount} 班
          </span>
          <span className="rounded-md bg-white/15 px-2 py-0.5">
           一對一：{privateActiveCount > 0 ? `就讀中 ${privateActiveCount}` : "無"}
          </span>
         </div>
        </>
       ) : null}
      </div>
     </div>
     <div className="flex w-fit shrink-0 flex-col gap-2 sm:items-end">
      <Button
       type="button"
       variant="secondary"
       size="sm"
       className="bg-white/90 text-foreground hover:bg-white"
       onClick={() => setEnrollKindOpen(true)}
      >
       <Plus className="h-4 w-4" />
       新增報讀
      </Button>
      <Button
       type="button"
       variant="secondary"
       size="sm"
       className="bg-white/90 text-foreground hover:bg-white"
       onClick={() => setTab("enrollments")}
      >
       <BookOpen className="h-4 w-4" />
       管理小組報讀
      </Button>
      <Button
       type="button"
       variant="secondary"
       size="sm"
       className="bg-white/90 text-foreground hover:bg-white"
       asChild
      >
       <Link to={`/PrivateTutoring?studentId=${encodeURIComponent(sid ?? "")}`}>
        <UserRound className="h-4 w-4" />
        管理一對一
       </Link>
      </Button>
     </div>
    </div>
   </div>

   <div className="sticky top-0 z-10 border-b border-border bg-card px-2 md:px-4">
    {isMobile ? (
     <label className="grid gap-1 px-2 py-3 text-xs text-muted-foreground">
      <span>分頁</span>
      <Select
       className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm font-medium text-foreground"
       value={tab}
       onChange={(e) => setTab(e.target.value as TabId)}
       aria-label="學生詳情分頁"
      >
       {TABS.map((t) => (
        <option key={t.id} value={t.id}>
         {t.label}
        </option>
       ))}
      </Select>
     </label>
    ) : (
    <nav className="flex gap-1 overflow-x-auto py-1">
     {TABS.map((t) => {
      const Icon = t.icon
      const active = tab === t.id
      return (
       <button
        key={t.id}
        type="button"
        onClick={() => setTab(t.id)}
        className={cn(
         "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
         active
          ? "border-b-2 border-primary text-primary"
          : "text-muted-foreground hover:text-foreground"
        )}
       >
        <Icon className="h-4 w-4" />
        {t.label}
       </button>
      )
     })}
    </nav>
    )}
   </div>

   <div className="p-4 md:p-6">
    {tab === "basic" && student ? (
     <div className="mx-auto max-w-4xl space-y-8">
      <section className="space-y-4">
       <h2 className="text-sm font-semibold text-foreground">基本資料</h2>
       <div className="grid gap-4 sm:grid-cols-2">
        <Field label="中文姓名 *">
         <Input
          value={form.full_name ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
         />
        </Field>
        <Field label="英文姓名">
         <Input
          value={form.english_name ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, english_name: e.target.value }))}
         />
        </Field>
        <Field label="學生編號">
         <Input value={form.student_code ?? ""} disabled className="bg-muted" />
        </Field>
        <Field label="性別">
         <ChoiceChips
          options={GENDER_CHIPS}
          value={form.gender}
          onChange={(gender) => setForm((f) => ({ ...f, gender }))}
         />
        </Field>
        <Field label="年級">
         <StudentGradeChips
          value={form.grade}
          onChange={(grade) => setForm((f) => ({ ...f, grade }))}
         />
        </Field>
        <Field label="客戶身份（注冊）">
         <StatusToggle
          checked={normalizeRegistrationStatus(form.registration_status) === "已註冊"}
          onCheckedChange={(on) =>
           setForm((f) => ({ ...f, registration_status: on ? "已註冊" : "非注冊" }))
          }
          offLabel="非注冊（試堂／查詢）"
          onLabel="已註冊"
         />
        </Field>
        <Field label="就讀狀態">
         <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
          {student.enrollment_status}
          <span className="mt-1 block text-xs text-muted-foreground">
           目前是否有就讀中報讀（自動計算；退讀後為非在讀）
          </span>
         </p>
        </Field>
        <Field label="互動狀態（活躍）">
         <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
          {student.activity_status}
          <span className="mt-1 block text-xs text-muted-foreground">
           近三個月有報讀活動（自動計算；可能含近期退讀，不等於目前在讀）
          </span>
         </p>
        </Field>
        <Field label="學業階段">
         <StatusToggle
          checked={normalizeAcademicStage(form.academic_stage) === "中學階段"}
          onCheckedChange={(on) =>
           setForm((f) => ({ ...f, academic_stage: on ? "中學階段" : "已畢業" }))
          }
          offLabel="已畢業"
          onLabel="中學階段"
         />
        </Field>
        <Field label="學校" className="sm:col-span-2">
         <Input
          value={form.school ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
         />
        </Field>
        <Field label="出生日期">
         <Input
          type="date"
          value={(form.date_of_birth ?? "").slice(0, 10)}
          onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))}
         />
        </Field>
       </div>
      </section>

      <section className="space-y-4">
       <h2 className="text-sm font-semibold text-foreground">家長聯絡</h2>
       <div className="grid gap-4 sm:grid-cols-2">
        <Field label="家長姓名">
         <Input
          value={form.parent_name ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, parent_name: e.target.value }))}
         />
        </Field>
        <Field label="關係">
         <ParentRelationshipChips
          value={form.parent_relationship}
          onChange={(rel) => setForm((f) => ({ ...f, parent_relationship: rel }))}
         />
        </Field>
        <Field label="學生電話">
         <div className="space-y-2">
          <ChoiceChips
           options={PHONE_COUNTRY_CODES}
           value={form.student_phone_country_code ?? "+852"}
           onChange={(code) => setForm((f) => ({ ...f, student_phone_country_code: code }))}
          />
          <Input
           inputMode="numeric"
           value={form.student_phone ?? ""}
           onChange={(e) => setForm((f) => ({ ...f, student_phone: e.target.value }))}
          />
         </div>
        </Field>
        <Field label="家長電話">
         <div className="space-y-2">
          <ChoiceChips
           options={PHONE_COUNTRY_CODES}
           value={form.parent_phone_country_code ?? "+852"}
           onChange={(code) => setForm((f) => ({ ...f, parent_phone_country_code: code }))}
          />
          <Input
           inputMode="numeric"
           value={form.parent_phone ?? ""}
           onChange={(e) => setForm((f) => ({ ...f, parent_phone: e.target.value }))}
          />
         </div>
        </Field>
        <Field label="WhatsApp 號碼">
         <Input
          inputMode="numeric"
          value={form.whatsapp ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
         />
        </Field>
        <Field label="偏好通訊方式">
         <ChoiceChips
          options={PREFERRED_CONTACT_METHODS}
          value={form.preferred_contact_method ?? ""}
          onChange={(m) => setForm((f) => ({ ...f, preferred_contact_method: m }))}
         />
        </Field>
        <Field label="地址" className="sm:col-span-2">
         <Input
          value={form.address ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
         />
        </Field>
        <Field label="備註" className="sm:col-span-2">
         <Textarea
          value={form.remarks ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
         />
        </Field>
        {sid ? (
         <ParentPortalInvitePanel
          studentId={sid}
          studentName={form.full_name ?? student?.full_name ?? ""}
          whatsapp={form.whatsapp ?? student?.whatsapp}
          parentPhone={form.parent_phone ?? student?.parent_phone}
          studentPhone={form.student_phone ?? student?.student_phone}
         />
        ) : null}
       </div>
      </section>

      <section className="space-y-4">
       <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
         <h2 className="text-sm font-semibold text-foreground">親友</h2>
         <p className="mt-1 text-sm text-muted-foreground">
          新增後為<strong className="text-foreground">雙向</strong>連結：對方學生此區也會顯示
          {student ? `「${student.full_name}」` : "此學生"}與相同關係標籤。
         </p>
        </div>
        <Button type="button" size="sm" className="shrink-0" onClick={openAddRelative}>
         <Plus className="h-4 w-4" />
         新增親友
        </Button>
       </div>

       <Dialog open={relativeDialogOpen} onOpenChange={setRelativeDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
         <DialogHeader>
          <DialogTitle>新增親友</DialogTitle>
         </DialogHeader>
         <div className="grid gap-3 text-sm">
          <Field label="選擇學生 *">
           <div className="relative">
            <Input
             placeholder="搜尋姓名或學號…"
             value={
              relativePick
               ? `${relativePick.full_name}${relativePick.student_code ? `（${relativePick.student_code}）` : ""}`
               : relativeQuery
             }
             onChange={(e) => {
              setRelativePick(null)
              setRelativeQuery(e.target.value)
             }}
            />
            {!relativePick && relativeQuery.trim() ? (
             <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover shadow-md">
              {relativePickerOptions.length === 0 ? (
               <div className="px-3 py-2 text-muted-foreground">沒有可選學生（或已全部連結）</div>
              ) : (
               relativePickerOptions.map((s) => (
                <button
                 key={s.id}
                 type="button"
                 className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-muted"
                 onClick={() => {
                  setRelativePick(s)
                  setRelativeQuery("")
                 }}
                >
                 <span className="font-medium">{s.full_name}</span>
                 {s.student_code ? (
                  <span className="text-xs text-muted-foreground">{s.student_code}</span>
                 ) : null}
                </button>
               ))
              )}
             </div>
            ) : null}
           </div>
          </Field>
          <Field label="關係標籤 *">
           <Select
            className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm"
            value={relativePreset}
            onChange={(e) => setRelativePreset(e.target.value)}
           >
            {RELATIONSHIP_PRESETS.map((p) => (
             <option key={p} value={p}>
              {p}
             </option>
            ))}
           </Select>
          </Field>
          {relativePreset === "其他（自訂）" ? (
           <Field label="自訂關係">
            <Input
             value={relativeCustom}
             onChange={(e) => setRelativeCustom(e.target.value)}
             placeholder="例如：鄰居"
            />
           </Field>
          ) : null}
          <Button
           type="button"
           disabled={relativeSaving || !relativePick}
           onClick={() => void submitAddRelative()}
          >
           建立連結
          </Button>
         </div>
        </DialogContent>
       </Dialog>

       {relatives.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚未新增親友。</p>
       ) : (
        <ul className="space-y-3">
         {relatives.map((r) => (
          <li
           key={r.relationshipId}
           className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
           <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
             <Link
              to={`/Students/${r.relatedStudentId}`}
              className="font-semibold text-primary hover:underline"
             >
              {r.relatedName}
             </Link>
             {r.relatedCode ? (
              <span className="text-xs text-muted-foreground tabular-nums">{r.relatedCode}</span>
             ) : null}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
             <Tag tone="info" size="sm">{r.relationship}</Tag>
             <Select
              className="h-8 min-w-[10rem] max-w-full rounded-md border border-input bg-background px-2 text-xs"
              aria-label="變更關係標籤"
              value={r.relationship}
              onChange={async (e) => {
               const v = e.target.value
               try {
                await updateStudentRelationshipLabel(r.relationshipId, v)
                await reloadSubs()
               } catch (err) {
                pushBanner({
                 tone: "error",
                 title: "更新關係失敗",
                 message: err instanceof Error ? err.message : formatLeaveError(err),
                })
               }
              }}
             >
              {RELATIONSHIP_PRESETS.filter((p) => p !== "其他（自訂）").map((p) => (
               <option key={p} value={p}>
                {p}
               </option>
              ))}
              {!(
               RELATIONSHIP_PRESETS.filter((p) => p !== "其他（自訂）") as readonly string[]
              ).includes(r.relationship) ? (
               <option value={r.relationship}>{r.relationship}（自訂）</option>
              ) : null}
             </Select>
            </div>
           </div>
           <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={async () => {
             if (
              !(await confirmDialog({
               title: "移除親友連結",
               description: `移除與「${r.relatedName}」的親友連結？（雙方頁面皆會移除）`,
               confirmText: "確認移除",
               tone: "destructive",
              }))
             )
              return
             try {
              await deleteStudentRelationship(r.relationshipId)
              await reloadSubs()
             } catch (err) {
              pushBanner({
               tone: "error",
               title: "移除親友失敗",
               message: err instanceof Error ? err.message : formatLeaveError(err),
              })
             }
            }}
           >
            移除
           </Button>
          </li>
         ))}
        </ul>
       )}
      </section>

      <Button type="button" onClick={() => void saveBasic()}>
       儲存變更
      </Button>
     </div>
    ) : null}

    {tab === "enrollments" ? (
     <div className="mx-auto max-w-3xl space-y-4">
      {misalignedCount > 0 ? (
       <div
        role="status"
        className="rounded-lg border border-amber-700/30 bg-amber-50 px-3 py-2 text-sm text-amber-950"
       >
        有 <strong className="tabular-nums">{misalignedCount}</strong>{" "}
        個班別的繳費堂數與排程／待補不一致、仍有待補堂，或請假尚無補堂日，請跟進。
       </div>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
       <Select
        className="flex h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm shadow-sm"
        value={pickClass}
        onChange={(e) => {
         const next = e.target.value
         setPickClass(next)
         setPickScheduleIds([])
         setPickEntitledCount("")
         const opt = classOptions.find((o) => o.id === next)
         setPickForm(opt?.courseMode === "summer_two_period" ? "兩期全報" : "full")
        }}
       >
        <option value="">選擇班別加入…</option>
        {classSelectOptions.map((o) => (
         <option key={o.id} value={o.id}>
          {o.label}
         </option>
        ))}
       </Select>
       {pickClass ? (
        <Select
         className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm sm:w-40"
         value={pickForm}
         onChange={(e) => {
          setPickForm(e.target.value)
          if (e.target.value !== SINGLE_SESSION_ENROLLMENT) setPickScheduleIds([])
         }}
        >
         {(isSummerPick
          ? SUMMER_ENROLLMENT_FORM_OPTIONS.map((p) => ({
             value: p,
             label: p === SINGLE_SESSION_ENROLLMENT ? "單堂／自選堂數" : p,
            }))
          : [
             { value: "full", label: "報足全期" },
             { value: SINGLE_SESSION_ENROLLMENT, label: "單堂／自選堂數" },
            ]
         ).map((o) => (
          <option key={o.value} value={o.value}>
           {o.label}
          </option>
         ))}
        </Select>
       ) : null}
       <Button
        type="button"
        onClick={() => void addEnrollment()}
        disabled={!pickClass || (showSessionPicker && pickScheduleIds.length === 0)}
       >
        <Plus className="h-4 w-4" />
        加入
       </Button>
      </div>
      {pickClass ? (
       <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 px-3 py-3 sm:flex-row sm:items-end">
        <Field label="應享／繳費堂數（選填）" className="sm:w-44">
         <Input
          type="number"
          min={1}
          inputMode="numeric"
          placeholder="例如 12"
          value={pickEntitledCount}
          onChange={(e) => setPickEntitledCount(e.target.value)}
          className="h-9"
         />
        </Field>
        <div className="flex-1 text-xs text-muted-foreground sm:pb-2">
         將綁定{" "}
         <strong className="tabular-nums text-foreground">
          {pickBoundPreview == null ? "…" : pickBoundPreview}
         </strong>{" "}
         堂
         {pickPendingPreview > 0 ? (
          <span className="ml-2 text-amber-800">
           · 差額將記待補{" "}
           <strong className="tabular-nums">{pickPendingPreview}</strong> 堂
          </span>
         ) : null}
         <span className="mt-0.5 block">
          遲報時請填應享堂數；若多於可綁定排程，加入時會一併記錄待補。
         </span>
        </div>
       </div>
      ) : null}
      {showSessionPicker ? (
       <EnrollmentSessionPicker
        classId={pickClass}
        selectedIds={pickScheduleIds}
        onChange={setPickScheduleIds}
       />
      ) : null}
      <div className="space-y-3">
       {activeEnrollments.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚未報讀任何班別。</p>
       ) : (
        activeEnrollments.map((e) => {
         const bal = balanceByEnrollment.get(e.id)
         return (
         <div
          key={e.id}
          className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
         >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
           <div className="font-semibold">
            <Link
             to={`/Classes/${e.classId}`}
             className="text-primary hover:underline"
            >
             {formatClassLabel({ subject: e.subject, courseCode: e.courseCode, courseName: e.courseName })}
            </Link>
           </div>
           <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{[e.dayOfWeek, e.timeSlot].filter(Boolean).join(" ")}</span>
            {e.enrollmentFormLabel ? (
             <Tag tone={statusToTagTone(e.enrollmentFormLabel)} size="sm">
              {e.enrollmentFormLabel}
             </Tag>
            ) : null}
            {e.pricePerLesson != null ? <span>· 每節 {money(e.pricePerLesson)}</span> : null}
           </div>
           <div className="mt-1 text-xs text-muted-foreground">
            報讀日期：{e.enroll_date ?? "—"}
           </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
           <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openPendingDialog(e)}
           >
            記錄待補堂
           </Button>
           <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void openEditEnrollmentForm(e)}
           >
            更改報讀形式
           </Button>
           <Select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={e.status}
            onChange={async (ev) => {
             await updateEnrollment(e.id, ev.target.value, sid)
             await reloadSubs()
            }}
           >
            <option value="就讀中">就讀中</option>
            <option value="休學">休學</option>
            <option value="退選">退選</option>
           </Select>
           <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-amber-700/45 text-amber-950 hover:bg-amber-50"
            onClick={() => {
             setWithdrawTarget(e)
             setWithdrawReason("")
             setWithdrawOpen(true)
            }}
           >
            退讀
           </Button>
           <details className="relative">
            <summary className="cursor-pointer list-none text-xs text-muted-foreground underline-offset-2 hover:underline [&::-webkit-details-marker]:hidden">
             其他操作
            </summary>
            <div className="absolute right-0 z-10 mt-1 min-w-[8.5rem] rounded-md border border-border bg-background p-1 shadow-sm">
             <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-full justify-start text-xs text-muted-foreground"
              onClick={() => void onPurgeMistakenEnrollment(e)}
             >
              手誤清除
             </Button>
            </div>
           </details>
          </div>
          </div>
          {bal ? (
           <div
            className={cn(
             "rounded-md border px-3 py-2 text-xs",
             bal.isAligned && bal.pendingLessons === 0 && bal.leaveAwaitingMakeupCount === 0
              ? "border-border bg-muted/40 text-muted-foreground"
              : "border-amber-700/35 bg-amber-50 text-amber-950"
            )}
           >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
             <span>
              已繳{" "}
              <strong className="tabular-nums text-foreground">{bal.paidLessons}</strong> 堂
             </span>
             <span>
              已綁排程{" "}
              <strong className="tabular-nums text-foreground">{bal.boundLessons}</strong> 堂
             </span>
             <span>
              待補{" "}
              <strong className="tabular-nums text-foreground">{bal.pendingLessons}</strong> 堂
             </span>
             <span>
              請假待安排{" "}
              <strong className="tabular-nums text-foreground">{bal.leaveAwaitingMakeupCount}</strong>{" "}
              堂
             </span>
             {bal.paidLessons > 0 ? (
              <Tag
               tone={
                bal.isAligned && bal.leaveAwaitingMakeupCount === 0 ? "success" : "warning"
               }
               size="sm"
              >
               {!bal.isAligned
                ? `尚差 ${bal.gap} 堂未記／未排`
                : bal.leaveAwaitingMakeupCount > 0
                  ? `請假待安排 ${bal.leaveAwaitingMakeupCount} 堂`
                  : "堂數一致"}
              </Tag>
             ) : bal.leaveAwaitingMakeupCount > 0 ? (
              <Tag tone="warning" size="sm">
               請假待安排 {bal.leaveAwaitingMakeupCount} 堂
              </Tag>
             ) : (
              <span className="text-muted-foreground">尚未有該班已收款堂數</span>
             )}
            </div>
            {bal.leaveAwaitingMakeupRows.length > 0 ? (
             <ul className="mt-2 space-y-1">
              {bal.leaveAwaitingMakeupRows.map((L) => (
               <li
                key={L.id}
                className="flex flex-wrap items-center justify-between gap-2 border-t border-amber-700/20 pt-1"
               >
                <span>
                 請假 {L.leaveDate}
                 {L.leaveReason ? ` · ${L.leaveReason}` : ""}
                 {" · "}
                 {L.makeupType?.trim() || "待安排"}
                </span>
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs" asChild>
                 <Link to={`/LeaveManagement?studentId=${encodeURIComponent(sid ?? "")}`}>
                  前往請假管理
                 </Link>
                </Button>
               </li>
              ))}
             </ul>
            ) : null}
            {bal.pendingRows.some((p) => p.status === "待補") ? (
             <ul className="mt-2 space-y-1">
              {bal.pendingRows
               .filter((p) => p.status === "待補")
               .map((p) => (
                <li
                 key={p.id}
                 className="flex flex-wrap items-center justify-between gap-2 border-t border-amber-700/20 pt-1"
                >
                 <span>
                  {p.reason} · 待補 <strong className="tabular-nums">{p.owedCount}</strong> 堂
                  {p.remarks ? `（${p.remarks}）` : ""}
                 </span>
                 <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={async () => {
                   try {
                    await updatePendingLessonStatus(p.id, "已安排")
                    pushBanner({ tone: "success", title: "已標為已安排" })
                    await reloadSubs()
                   } catch (err) {
                    pushBanner({
                     tone: "error",
                     title: "更新失敗",
                     message: err instanceof Error ? err.message : String(err),
                    })
                   }
                  }}
                 >
                  標為已安排
                 </Button>
                </li>
               ))}
             </ul>
            ) : null}
           </div>
          ) : null}
         </div>
         )
        })
       )}
      </div>

      {withdrawnEnrollments.length > 0 ? (
       <div className="space-y-2 rounded-xl border border-dashed border-border bg-muted/20 p-4">
        <p className="text-sm font-medium text-muted-foreground">已退讀（可重新報讀；手誤才用清除）</p>
        <div className="space-y-2">
         {withdrawnEnrollments.map((e) => (
          <div
           key={e.id}
           className="flex flex-col gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
          >
           <div className="min-w-0">
            <div className="font-medium text-muted-foreground">
             {formatClassLabel({
              subject: e.subject,
              courseCode: e.courseCode,
              courseName: e.courseName,
             })}
            </div>
            <div className="text-xs text-muted-foreground">
             {e.enrollmentFormLabel ?? "—"} · 報讀日 {e.enroll_date ?? "—"}
            </div>
           </div>
           <details className="relative shrink-0">
            <summary className="cursor-pointer list-none text-xs text-muted-foreground underline-offset-2 hover:underline [&::-webkit-details-marker]:hidden">
             其他操作
            </summary>
            <div className="absolute right-0 z-10 mt-1 min-w-[8.5rem] rounded-md border border-border bg-background p-1 shadow-sm">
             <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-full justify-start text-xs text-muted-foreground"
              onClick={() => void onPurgeMistakenEnrollment(e)}
             >
              手誤清除
             </Button>
            </div>
           </details>
          </div>
         ))}
        </div>
       </div>
      ) : null}

      <Dialog
       open={editFormOpen}
       onOpenChange={(o) => {
        setEditFormOpen(o)
        if (!o) {
         setEditFormTarget(null)
         setEditFormScheduleIds([])
        }
       }}
      >
       <DialogContent className="max-w-lg">
        <DialogHeader>
         <DialogTitle>更改報讀形式</DialogTitle>
        </DialogHeader>
        {editFormTarget ? (
         <div className="space-y-3 text-sm">
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2 font-medium">
           {formatClassLabel({
            subject: editFormTarget.subject,
            courseCode: editFormTarget.courseCode,
            courseName: editFormTarget.courseName,
           })}
          </div>
          <p className="text-muted-foreground">
           目前：{editFormTarget.enrollmentFormLabel}
           。可改為更多單堂、期數或全期報讀，無需先退讀。
          </p>
          <Field label="報讀形式">
           <Select
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            value={editFormValue}
            onChange={(ev) => {
             setEditFormValue(ev.target.value)
             if (ev.target.value !== SINGLE_SESSION_ENROLLMENT) setEditFormScheduleIds([])
            }}
           >
            {(editFormTarget.courseMode === "summer_two_period"
             ? SUMMER_ENROLLMENT_FORM_OPTIONS.map((p) => ({
                value: p,
                label: p === SINGLE_SESSION_ENROLLMENT ? "單堂／自選堂數" : p,
               }))
             : [
                { value: "full", label: "報足全期" },
                { value: SINGLE_SESSION_ENROLLMENT, label: "單堂／自選堂數" },
               ]
            ).map((o) => (
             <option key={o.value} value={o.value}>
              {o.label}
             </option>
            ))}
           </Select>
          </Field>
          {editFormValue === SINGLE_SESSION_ENROLLMENT ? (
           editFormLoadingSessions ? (
            <p className="text-muted-foreground">載入堂數…</p>
           ) : (
            <EnrollmentSessionPicker
             classId={editFormTarget.classId}
             selectedIds={editFormScheduleIds}
             onChange={setEditFormScheduleIds}
             disabled={editFormSaving}
            />
           )
          ) : null}
          <div className="flex flex-wrap justify-end gap-2 pt-1">
           <Button
            type="button"
            variant="outline"
            disabled={editFormSaving}
            onClick={() => setEditFormOpen(false)}
           >
            取消
           </Button>
           <Button
            type="button"
            disabled={
             editFormSaving ||
             editFormLoadingSessions ||
             (editFormValue === SINGLE_SESSION_ENROLLMENT && editFormScheduleIds.length === 0)
            }
            onClick={() => void submitEditEnrollmentForm()}
           >
            {editFormSaving ? "儲存中…" : "確認更改"}
           </Button>
          </div>
         </div>
        ) : null}
       </DialogContent>
      </Dialog>

      <Dialog
       open={pendingDialogOpen}
       onOpenChange={(o) => {
        setPendingDialogOpen(o)
        if (!o) setPendingTarget(null)
       }}
      >
       <DialogContent className="max-w-md">
        <DialogHeader>
         <DialogTitle>記錄待補堂</DialogTitle>
        </DialogHeader>
        {pendingTarget ? (
         <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
           用於遲報或缺排程、但<strong>不是請假</strong>的情況。記錄後會顯示在該班堂數對帳區，方便同事跟進。
          </p>
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2 font-medium">
           {formatClassLabel({
            subject: pendingTarget.subject,
            courseCode: pendingTarget.courseCode,
            courseName: pendingTarget.courseName,
           })}
          </div>
          <Field label="待補堂數">
           <Input
            type="number"
            min={1}
            inputMode="numeric"
            value={pendingOwedInput}
            onChange={(e) => setPendingOwedInput(e.target.value)}
            className="h-9"
           />
          </Field>
          <Field label="原因">
           <Select
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            value={pendingReason}
            onChange={(e) => setPendingReason(e.target.value)}
           >
            {PENDING_LESSON_REASONS.map((r) => (
             <option key={r} value={r}>
              {r}
             </option>
            ))}
           </Select>
          </Field>
          <Field label="備註（選填）">
           <Textarea
            value={pendingRemarks}
            onChange={(e) => setPendingRemarks(e.target.value)}
            rows={2}
            placeholder="例如：開班後才報讀，少了第 1 堂"
            className="resize-none"
           />
          </Field>
          <div className="flex flex-wrap justify-end gap-2 pt-1">
           <Button
            type="button"
            variant="outline"
            disabled={pendingSaving}
            onClick={() => setPendingDialogOpen(false)}
           >
            取消
           </Button>
           <Button
            type="button"
            disabled={pendingSaving}
            onClick={() => void submitPendingLesson()}
           >
            {pendingSaving ? "儲存中…" : "確認記錄"}
           </Button>
          </div>
         </div>
        ) : null}
       </DialogContent>
      </Dialog>

      <Dialog
       open={withdrawOpen}
       onOpenChange={(o) => {
        setWithdrawOpen(o)
        if (!o) {
         setWithdrawTarget(null)
         setWithdrawReason("")
        }
       }}
      >
       <DialogContent className="max-w-md">
        <DialogHeader>
         <DialogTitle>確認退讀</DialogTitle>
        </DialogHeader>
        {withdrawTarget ? (
         <div className="space-y-3 text-sm">
          <p>
           確定讓 <strong>{student?.full_name ?? "此學生"}</strong> 自{" "}
           <strong className="tabular-nums">{localTodayYmd()}</strong> 起退出以下班別？此操作會寫入增退紀錄。
           若只是手誤選錯，請改用「手誤清除」。
          </p>
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2 font-medium">
           {formatClassLabel({
            subject: withdrawTarget.subject,
            courseCode: withdrawTarget.courseCode,
            courseName: withdrawTarget.courseName,
           })}
          </div>
          <Field label="退讀原因（選填）">
           <Textarea
            value={withdrawReason}
            onChange={(e) => setWithdrawReason(e.target.value)}
            rows={3}
            placeholder="例如：時間無法配合、轉班…"
            className="resize-none"
           />
          </Field>
          <div className="flex flex-wrap justify-end gap-2 pt-1">
           <Button
            type="button"
            variant="outline"
            disabled={withdrawSaving}
            onClick={() => setWithdrawOpen(false)}
           >
            取消
           </Button>
           <Button
            type="button"
            variant="destructive"
            disabled={withdrawSaving}
            onClick={() => void submitWithdraw()}
           >
            {withdrawSaving ? "處理中…" : "確認退讀"}
           </Button>
          </div>
         </div>
        ) : null}
       </DialogContent>
      </Dialog>
     </div>
    ) : null}

    {tab === "payments" ? (
     <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
       <div className="space-y-1 text-sm text-muted-foreground">
        <p>
         共 {payments.length} 筆繳費紀錄
         {totalPaidLessons != null ? (
          <span className="text-foreground">
           {" "}
           · 已收款<strong className="mx-1 text-warning tabular-nums">{totalPaidLessons}</strong>總繳堂數
          </span>
         ) : null}
        </p>
        <p className="text-xs">總繳堂數依「已收款」單據之明細堂數加總。</p>
       </div>
       <Button type="button" size="sm" onClick={() => navigate(`/Payments?studentId=${encodeURIComponent(sid)}`)}>
        <Plus className="h-4 w-4" />
        新增繳費
       </Button>
      </div>
      <div className="space-y-3">
       {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚無繳費紀錄。</p>
       ) : (
        payments.map((p) => (
         <div
          key={p.id}
          className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
         >
          <div>
           <div className="text-lg font-bold">{money(p.total_amount)}</div>
           <div className="text-sm text-muted-foreground">
            {p.payment_date} · {p.payment_method ?? "—"}
           </div>
           {p.receipt_number ? (
            <div className="text-xs text-muted-foreground">收據：{p.receipt_number}</div>
           ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
           <Tag tone={statusToTagTone(p.status)} size="sm">
            {p.status}
           </Tag>
           <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
             try {
              const full = await fetchPaymentFull(p.id)
              if (!full) return
              if (
               !printPaymentForStatus(full, p.status, [
                PAYMENT_STATUS.pendingPay,
                PAYMENT_STATUS.pendingReceive,
               ])
              ) {
               pushBanner({ tone: "warning", title: "無法列印", message: "請允許開啟彈出視窗以列印。" })
              }
             } catch (e) {
              reportUserFacingError(e, { source: "StudentDetailView.printPayment" })
             }
            }}
           >
            <Printer className="h-3.5 w-3.5" />
            列印
           </Button>
           <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
             if (!(await confirmDialog({ title: "刪除繳費紀錄", description: "確定刪除此筆繳費？", confirmText: "確認刪除", tone: "destructive" }))) return
             await deletePayment(p.id)
             await reloadSubs()
            }}
           >
            刪除
           </Button>
          </div>
         </div>
        ))
       )}
      </div>
     </div>
    ) : null}

    {tab === "attendance" ? (
     <div className="mx-auto max-w-3xl space-y-4">
      <div className="grid grid-cols-3 gap-2 md:gap-3">
       <div className="rounded-xl border border-success/30 bg-success/10 p-2.5 text-center md:p-4">
        <div className="text-xl font-bold text-success md:text-2xl">{attStats.present}</div>
        <div className="text-[11px] text-success/90 md:text-xs">總上堂</div>
       </div>
       <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-center md:p-4">
        <div className="text-xl font-bold text-destructive md:text-2xl">{attStats.absent}</div>
        <div className="text-[11px] text-destructive/90 md:text-xs">總缺席</div>
       </div>
       <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-center md:p-4">
        <div className="text-xl font-bold text-amber-800 md:text-2xl">{attStats.makeup}</div>
        <div className="text-[11px] text-amber-900/90 md:text-xs">待補堂</div>
       </div>
      </div>
      <p className="hidden text-xs text-muted-foreground md:block">
       上方數字為<strong className="text-foreground">全部</strong>紀錄統計；下方列表可依條件篩選與排序。
      </p>
      {attendance.length === 0 ? (
       <p className="py-8 text-center text-sm text-muted-foreground">尚無出勤紀錄</p>
      ) : (
       <>
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
         <label className="grid w-full gap-1 text-xs text-muted-foreground sm:w-auto">
          <span>班別</span>
          <Select
           className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm sm:min-w-[10rem]"
           value={attClassFilter}
           onChange={(e) => setAttClassFilter(e.target.value)}
          >
           <option value="all">全部班別</option>
           {attendanceClassOptions.map(([cid, label]) => (
            <option key={cid} value={cid}>
             {label}
            </option>
           ))}
          </Select>
         </label>
         <label className="grid w-full gap-1 text-xs text-muted-foreground sm:w-auto">
          <span>狀態</span>
          <Select
           className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm sm:min-w-[8rem]"
           value={attStatusFilter}
           onChange={(e) =>
            setAttStatusFilter(e.target.value as "all" | "present" | "absent" | "other")
           }
          >
           <option value="all">全部</option>
           <option value="present">出席類</option>
           <option value="absent">缺席類</option>
           <option value="other">其他</option>
          </Select>
         </label>
         <label className="grid w-full gap-1 text-xs text-muted-foreground sm:w-auto">
          <span>上課日起</span>
          <Input
           type="date"
           value={attDateFrom}
           onChange={(e) => setAttDateFrom(e.target.value)}
           className="h-9 w-full sm:w-[11rem]"
          />
         </label>
         <label className="grid w-full gap-1 text-xs text-muted-foreground sm:w-auto">
          <span>上課日迄</span>
          <Input
           type="date"
           value={attDateTo}
           onChange={(e) => setAttDateTo(e.target.value)}
           className="h-9 w-full sm:w-[11rem]"
          />
         </label>
         <label className="grid w-full gap-1 text-xs text-muted-foreground sm:w-auto">
          <span>排序</span>
          <Select
           className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm sm:min-w-[11rem]"
           value={attSort}
           onChange={(e) => setAttSort(e.target.value as typeof attSort)}
          >
           <option value="dateDesc">上課日（新→舊）</option>
           <option value="dateAsc">上課日（舊→新）</option>
           <option value="classAsc">班別名稱（A→Z）</option>
           <option value="classDesc">班別名稱（Z→A）</option>
           <option value="statusAsc">狀態（筆畫序）</option>
          </Select>
         </label>
         <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9"
          onClick={() => {
           setAttClassFilter("all")
           setAttStatusFilter("all")
           setAttDateFrom("")
           setAttDateTo("")
           setAttSort("dateDesc")
          }}
         >
          重設篩選
         </Button>
        </div>
        <p className="text-sm text-muted-foreground">
         篩選結果：<strong className="text-foreground">{filteredSortedAttendance.length}</strong> 筆
         （共 {attendance.length} 筆）
        </p>
        {filteredSortedAttendance.length === 0 ? (
         <p className="py-8 text-center text-sm text-muted-foreground">此條件下沒有紀錄</p>
        ) : (
         <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="hidden grid-cols-[minmax(0,1fr)_auto_auto] gap-x-3 border-b border-border bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground sm:grid">
           <span>班別</span>
           <span className="text-right">日期</span>
           <span className="text-right">狀態</span>
          </div>
          <ul className="divide-y divide-border">
          {filteredSortedAttendance.map((a) => (
           <li
            key={a.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto_auto]"
           >
            <span className="min-w-0 truncate font-medium">
             {a.classId ? (
              <Link to={`/Classes/${a.classId}`} className="block truncate text-primary hover:underline">
               {a.classLabel}
              </Link>
             ) : (
              a.classLabel
             )}
            </span>
            <span className="text-right tabular-nums text-muted-foreground">{a.attendance_date}</span>
            <span className="col-span-2 text-right text-xs text-muted-foreground sm:col-span-1">
             {a.status}
            </span>
           </li>
          ))}
          </ul>
         </div>
        )}
       </>
      )}
     </div>
    ) : null}

    {tab === "leave" ? (
     <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
       <p className="text-sm text-muted-foreground">
        共 {leaves.length} 筆請假記錄 · 待補{" "}
        {leaves.filter((x) => x.status.includes("待")).length} 堂。
        <span className="hidden sm:inline"> 點一筆可開啟請假管理並定位該紀錄。</span>
       </p>
       <Button type="button" variant="secondary" size="sm" onClick={() => void openLeaveDialog()}>
        <Plus className="h-4 w-4" />
        新增請假
       </Button>
      </div>

      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
       <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
         <DialogTitle>新增請假</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 text-sm">
         <Field label="班別（就讀中）">
          <Select
           className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm"
           value={leaveClassId}
           onChange={(e) => setLeaveClassId(e.target.value)}
           disabled={leaveClasses.length === 0}
          >
           {leaveClasses.length === 0 ? (
            <option value="">尚無就讀中班別</option>
           ) : (
            [
             <option key="__placeholder_class__" value="">
              請選擇班別
             </option>,
             ...leaveClasses.map((c) => (
              <option key={c.id} value={c.id}>
               {c.subject}
               {c.course_code_full ? `（${c.course_code_full}）` : ""}
              </option>
             )),
            ]
           )}
          </Select>
         </Field>
         <Field label="請假排程（今日起、未取消／完成）">
          <Select
           className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm"
           value={leaveScheduleId}
           onChange={(e) => setLeaveScheduleId(e.target.value)}
           disabled={!leaveClassId || leaveScheduleOptions.length === 0}
          >
           {!leaveClassId ? (
            <option value="">請先選擇班別</option>
           ) : leaveScheduleOptions.length === 0 ? (
            <option value="">此班尚無符合條件之排程</option>
           ) : (
            [
             <option key="__placeholder_schedule__" value="">
              請選擇堂次
             </option>,
             ...leaveScheduleOptions.map((s) => (
              <option key={s.id} value={s.id}>
               {s.scheduled_date} {s.start_time ?? ""}–{s.end_time ?? ""}
              </option>
             )),
            ]
           )}
          </Select>
         </Field>
         <Field label="原因">
          <Select
           className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm"
           value={leaveReasonPick}
           onChange={(e) =>
            setLeaveReasonPick(e.target.value as (typeof LEAVE_REASON_OPTIONS)[number])
           }
          >
           {LEAVE_REASON_OPTIONS.map((o) => (
            <option key={o} value={o}>
             {o}
            </option>
           ))}
          </Select>
         </Field>
         <Field label="補課安排">
          <Select
           className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm"
           value={leaveMakeup}
           onChange={(e) => {
            const v = e.target.value as (typeof LEAVE_MAKEUP_OPTIONS)[number]
            setLeaveMakeup(v)
            if (v !== "調堂") setLeaveMakeupScheduleId("")
           }}
          >
           {LEAVE_MAKEUP_OPTIONS.map((o) => (
            <option key={o} value={o}>
             {o}
            </option>
           ))}
          </Select>
         </Field>
         {leaveMakeup === "調堂" ? (
          <div className="space-y-2 rounded-lg border border-info bg-info/40 p-3">
           <p className="text-xs font-medium text-info">補堂排程（未來一個月內、可跨班）</p>
           <Input
            placeholder="搜尋科目、代碼、老師、日期…"
            value={leaveMakeupSearch}
            onChange={(e) => setLeaveMakeupSearch(e.target.value)}
            className="h-9"
           />
           <Select
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
            value={leaveMakeupScheduleId}
            onChange={(e) => setLeaveMakeupScheduleId(e.target.value)}
           >
            <option value="">請選擇補堂排程</option>
            {leaveMakeupFiltered.map((s) => (
             <option key={s.id} value={s.id}>
              {s.scheduled_date} {s.start_time ?? ""}–{s.end_time ?? ""} · {s.classLabel}
              {s.course_code_full ? ` (${s.course_code_full})` : ""} · {s.teacher_name ?? "—"}
             </option>
            ))}
           </Select>
          </div>
         ) : null}
         <Field label="備註（選填）">
          <Input value={leaveRemarks} onChange={(e) => setLeaveRemarks(e.target.value)} className="h-9" />
         </Field>
         {leaveErr ? <p className="text-sm text-destructive">{leaveErr}</p> : null}
         <div className="flex justify-end gap-2 pt-2">
          <Button
           type="button"
           variant="outline"
           disabled={leaveSaving}
           onClick={() => setLeaveDialogOpen(false)}
          >
           取消
          </Button>
          <Button type="button" disabled={leaveSaving} onClick={() => void submitStudentLeave()}>
           {leaveSaving ? "儲存中…" : "儲存"}
          </Button>
         </div>
        </div>
       </DialogContent>
      </Dialog>

      {leaves.length === 0 ? (
       <p className="py-8 text-center text-sm text-muted-foreground">尚無請假記錄</p>
      ) : (
       <ul className="space-y-2">
        {leaves.map((x) => (
         <li key={x.id}>
          <Link
           to={`/LeaveManagement?${new URLSearchParams({ studentId: sid, record: x.id }).toString()}`}
           className="block rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm transition-colors hover:border-primary/50 hover:bg-muted/40"
          >
           <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-medium text-primary">{x.classLabel}</span>
            <span className="text-xs text-muted-foreground">請假管理 →</span>
           </div>
           <div className="mt-1 text-muted-foreground">
            {x.leave_date} · {x.leave_reason ?? "—"} · {x.status}
           </div>
          </Link>
         </li>
        ))}
       </ul>
      )}
     </div>
    ) : null}

    {tab === "futureSchedules" ? (
     <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
       <p className="text-sm text-muted-foreground">
        顯示此學生於「就讀中班別」的未來未完成排程，共 {futureSchedules.length} 筆。
       </p>
       <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={exportFutureSchedulesCsv}
        disabled={futureSchedules.length === 0}
       >
        匯出 CSV
       </Button>
      </div>
      {futureSchedules.length === 0 ? (
       <p className="py-8 text-center text-sm text-muted-foreground">尚無未來排程</p>
      ) : (
       <div className="space-y-2">
        {futureSchedules.map((row) => {
         const hints = futureScheduleHints.get(row.id)
         return (
          <ScheduleListCard
           key={row.id}
           sessionNumber={row.session_number}
           scheduledDate={row.scheduled_date}
           startTime={row.start_time}
           endTime={row.end_time}
           attendingNames={hints?.attendingNames}
           leaveNames={hints?.leaveNames}
           namesLoading={hintsLoading}
           subtitle={
            <Link to={`/Classes/${row.class_id}`} className="text-primary hover:underline">
             {row.subject}
             {row.course_code_full ? `（${row.course_code_full}）` : ""}
            </Link>
           }
           controls={
            <div className="text-right text-sm text-muted-foreground">
             <div>{row.teacher_name ?? "—"}</div>
             <div>{row.status || "—"}</div>
            </div>
           }
          />
         )
        })}
       </div>
      )}
     </div>
    ) : null}

    {tab === "relatedTodos" ? (
     <div className="space-y-4">
      <p className="text-sm text-muted-foreground">凡待辦事項勾選「涉及學生」包含此學生者，會顯示於此。</p>
      {relatedTodosLoading ? (
       <p className="text-sm text-muted-foreground">載入中…</p>
      ) : relatedTodos.length === 0 ? (
       <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        此學生暫無關聯待辦。
       </p>
      ) : isMobile ? (
       <div className="space-y-3">
        {relatedTodos.map((r) => (
         <article
          key={r.id}
          role="button"
          tabIndex={0}
          onClick={() => navigate(`/Calendar/${r.id}`, { state: { from: `/Students/${sid}` } })}
          onKeyDown={(e) => {
           if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            navigate(`/Calendar/${r.id}`, { state: { from: `/Students/${sid}` } })
           }
          }}
          className="rounded-xl border border-border bg-card p-4 shadow-sm active:bg-muted/40"
         >
          <div className="flex items-start justify-between gap-2">
           <div className="min-w-0">
            <p className="text-xs tabular-nums text-muted-foreground">{r.eventDate}</p>
            <h3 className="font-semibold">{r.title}</h3>
           </div>
           <Tag tone={statusToTagTone(todoStatusLabel(r.status))} size="sm">
            {todoStatusLabel(r.status)}
           </Tag>
          </div>
          <div className="mt-2">
           <TodoTagList tags={r.tags} />
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
           {r.latestUpdatePreview?.trim() || "尚無跟進摘要"}
          </p>
         </article>
        ))}
       </div>
      ) : (
       <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[720px] table-fixed text-sm">
         <thead className="bg-muted/30 text-xs text-muted-foreground">
          <tr>
           <th className="w-[100px] px-3 py-2 text-left">日期</th>
           <th className="w-[180px] px-3 py-2 text-left">標題</th>
           <th className="w-[140px] px-3 py-2 text-left">標籤</th>
           <th className="w-[90px] px-3 py-2 text-left">狀態</th>
           <th className="px-3 py-2 text-left">最新跟進</th>
          </tr>
         </thead>
         <tbody>
          {relatedTodos.map((r) => (
           <tr
            key={r.id}
            className="cursor-pointer border-t border-border/70 align-top transition-colors hover:bg-muted/30"
            onClick={() =>
             navigate(`/Calendar/${r.id}`, { state: { from: `/Students/${sid}` } })
            }
           >
            <td className="px-3 py-2 font-mono text-xs">{r.eventDate}</td>
            <td className="px-3 py-2 font-medium">{r.title}</td>
            <td className="px-3 py-2">
             <TodoTagList tags={r.tags} />
            </td>
            <td className="px-3 py-2">
             <Tag tone={statusToTagTone(todoStatusLabel(r.status))} size="sm">
              {todoStatusLabel(r.status)}
             </Tag>
            </td>
            <td className="min-w-0 px-3 py-2 text-muted-foreground">
             <span className="line-clamp-2">{r.latestUpdatePreview?.trim() || "—"}</span>
            </td>
           </tr>
          ))}
         </tbody>
        </table>
       </div>
      )}
     </div>
    ) : null}

    {tab === "history" ? (
     <div className="mx-auto max-w-3xl space-y-4">
      <p className="text-sm text-muted-foreground">顯示所有涉及此學生的變動紀錄。</p>
      <ul className="space-y-3">
       {history.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚無紀錄。</p>
       ) : (
        history.map((h) => (
         <li
          key={h.id}
          className={cn(
           "rounded-xl border px-4 py-3 text-sm shadow-sm",
           h.tone === "green" && "border-success/50 bg-success/10",
           h.tone === "blue" && "border-info/50 bg-info/10",
           h.tone === "amber" && "border-warning/50 bg-warning/10",
           h.tone === "muted" && "border-border bg-muted/30"
          )}
         >
          <div className="flex flex-wrap items-start justify-between gap-2">
           <div
            className={cn(
             "font-medium",
             h.tone === "green" && "text-success",
             h.tone === "blue" && "text-info",
             h.tone === "amber" && "text-warning",
             h.tone === "muted" && "text-foreground"
            )}
           >
            {h.title}
           </div>
           <div className="text-xs text-neutral-700">{h.date}</div>
          </div>
          {h.subtitle ? (
           <div className="mt-1 text-xs text-neutral-700">{h.subtitle}</div>
          ) : null}
         </li>
        ))
       )}
      </ul>
     </div>
    ) : null}
   </div>
  </div>

  <Dialog
   open={unsavedLeaveOpen}
   onOpenChange={(open) => {
    if (!open) finishUnsavedLeave("cancel")
   }}
  >
   <DialogContent className="max-w-md">
    <DialogHeader>
     <DialogTitle>有未儲存的變更</DialogTitle>
    </DialogHeader>
    <p className="text-sm text-muted-foreground">
     基本資料已修改但尚未儲存。要儲存後離開，還是放棄變更？
    </p>
    <div className="mt-6 flex flex-wrap justify-end gap-2">
     <Button type="button" variant="outline" onClick={() => finishUnsavedLeave("cancel")}>
      繼續編輯
     </Button>
     <Button type="button" variant="outline" onClick={() => finishUnsavedLeave("discard")}>
      放棄變更
     </Button>
     <Button type="button" onClick={() => finishUnsavedLeave("save")}>
      儲存並離開
     </Button>
    </div>
   </DialogContent>
  </Dialog>

  <Dialog open={enrollKindOpen} onOpenChange={setEnrollKindOpen}>
   <DialogContent className="max-w-md">
    <DialogHeader>
     <DialogTitle>新增報讀</DialogTitle>
    </DialogHeader>
    <p className="text-sm text-muted-foreground">請先選擇報讀類型，再進入對應流程。</p>
    <div className="grid gap-2 pt-2">
     <Button
      type="button"
      variant="outline"
      className="h-auto justify-start px-4 py-3 text-left"
      onClick={() => {
       setEnrollKindOpen(false)
       setTab("enrollments")
      }}
     >
      <span className="font-medium">小組課</span>
      <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
       在本頁「報讀班別」新增小組班別
      </span>
     </Button>
     <Button
      type="button"
      variant="outline"
      className="h-auto justify-start px-4 py-3 text-left"
      asChild
     >
      <Link
       to={`/PrivateTutoring?studentId=${encodeURIComponent(sid ?? "")}&create=1`}
       onClick={() => setEnrollKindOpen(false)}
      >
       <span className="font-medium">一對一／一對二</span>
       <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
        前往一對一學生頁新增報讀
       </span>
      </Link>
     </Button>
    </div>
   </DialogContent>
  </Dialog>
  </DetailLayerShell>
 )
}

function Field({
 label,
 children,
 className,
}: {
 label: string
 children: React.ReactNode
 className?: string
}) {
 return (
  <div className={cn("space-y-1", className)}>
   <label className="text-xs font-medium text-muted-foreground">{label}</label>
   {children}
  </div>
 )
}
