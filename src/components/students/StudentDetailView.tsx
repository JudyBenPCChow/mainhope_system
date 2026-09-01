import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams, useLocation, useSearchParams } from "react-router-dom"
import { Loader2, Plus, Printer, X } from "lucide-react"

import { AdaptiveDetailLayer } from "@/components/detail/DetailLayerShell"
import { ParentPortalInvitePanel } from "@/components/students/ParentPortalInvitePanel"
import { StudentAttendanceTab } from "@/components/students/StudentAttendanceTab"
import { StudentFutureSchedulesTab } from "@/components/students/StudentFutureSchedulesTab"
import { StudentHistoryTab } from "@/components/students/StudentHistoryTab"
import { StudentLeaveTab } from "@/components/students/StudentLeaveTab"
import { Button } from "@/components/ui/button"
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { SchoolSearchableSelect } from "@/components/students/SchoolSearchableSelect"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { Textarea } from "@/components/ui/textarea"
import { useIsMobile } from "@/hooks/use-mobile"
import { ChoiceChips, GENDER_CHIPS, ParentRelationshipChips, StatusToggle, StudentClassificationTags, StudentGradeChips } from "@/components/students/studentsUi"
import { formatStudentGrade } from "@/lib/studentGrade"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import {
 confirmGraduateStudent,
 confirmUngraduateStudent,
 graduationHasWarnings,
 logGraduateStudentChange,
 logUngraduateStudentChange,
} from "@/lib/graduationGuard"
import { resolveEnrollmentAttendanceOptions } from "@/lib/enrollmentAttendanceConfirm"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { useAuth } from "@/lib/authBootstrap"
import { can } from "@/lib/authzProfile"
import { resolveStudentDetailExitPath } from "@/lib/studentDetailNav"
import {
 parseStudentDetailTab,
 STUDENT_DETAIL_TABS,
 type StudentDetailTabId,
} from "@/lib/studentDetailTabs"
import { useNavGuard } from "@/hooks/useNavGuard"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import { formatClassLabel } from "@/lib/courseLabel"
import {
 formatClassScheduleLabel,
 isCancelledScheduleStatus,
 resolveEnrollmentStartDate,
 resolveNextClassSchedule,
 type EnrollmentStartMode,
} from "@/lib/enrollmentStart"
import { VoidPaymentDialog, type VoidPaymentTarget } from "@/components/payments/VoidPaymentDialog"
import { printPaymentForStatus } from "@/lib/paymentPrint"
import {
 fetchPaymentFull,
 fetchTotalPaidLessonsForStudent,
 PAYMENT_STATUS,
} from "@/services/paymentQueries"
import { fetchGraduationBlockers } from "@/services/graduationGuardQueries"
import {
 fetchAllStudents,
 fetchClassOptions,
 fetchEnrollmentsForStudent,
 fetchPaymentsForStudent,
 getStudentById,
 insertEnrollment,
 normalizeAcademicStage,
 normalizeRegistrationStatus,
 registrationStatusLabel,
 PHONE_COUNTRY_CODES,
 PREFERRED_CONTACT_METHODS,
 PRIMARY_CONTACT_PERSONS,
 previewEnrollmentAttendanceImpact,
 purgeMistakenEnrollment,
 type ClassOption,
 type EnrollmentWithClass,
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
 ENROLLMENT_PERIOD_OPTIONS,
 SINGLE_SESSION_ENROLLMENT,
 SUMMER_ENROLLMENT_FORM_OPTIONS,
 formatEnrollmentFormLabel,
 isSingleSessionEnrollment,
 type EnrollmentFormValue,
 type EnrollmentPeriod,
} from "@/lib/enrollmentPeriod"
import { EnrollmentSessionPicker } from "@/components/enrollment/EnrollmentSessionPicker"
import { invalidateStudentsListDataCache } from "@/components/students/studentsListState"
import { fetchClassSchedules, type ClassScheduleRow } from "@/services/classQueries"
import {
 fetchLessonBalancesForStudent,
 isLessonBalanceNeedsFollowUp,
 updatePendingLessonStatus,
 type LessonBalanceRow,
} from "@/services/pendingLessonQueries"
import { isHomeworkClassKind } from "@/lib/privateClassKind"

function formatLeaveError(e: unknown): string {
 if (e instanceof Error) return e.message
 if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message)
 return "操作失敗"
}

type TabId = StudentDetailTabId

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
 "student_preferred_contact_method",
 "parent_preferred_contact_method",
 "student_wechat_id",
 "parent_wechat_id",
 "primary_contact_person",
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
 const { ready: authReady, role: authRole, profile } = useAuth()
 const exitPath = useMemo(() => resolveStudentDetailExitPath(location, authRole), [location, authRole])
 const { pushBanner } = useAppBanner()
 const { confirmDialog } = useAppConfirm()
 const [tab, setTabState] = useState<TabId>(() =>
  parseStudentDetailTab(new URLSearchParams(window.location.search).get("tab"), {
   canViewMoney: true,
   capsReady: false,
  })
 )
 const [basicEditing, setBasicEditing] = useState(false)

 const caps = profile?.activeCapabilities
 const canViewMoney = can(caps, "payments.read")
 const canMutateLeave = can(caps, "leaves.manage")
 const canMutateStudentOps = can(caps, "students.update") || can(caps, "students.enroll")
 const canOpenLeaveManagement = can(caps, "leaves.read") || can(caps, "leaves.manage")
 const canDeleteAttendance = can(caps, "attendance.delete")
 const canVoidPayment = can(caps, "payments.void")
 const canRegisterPayment = can(caps, "payments.create") || can(caps, "payments.mark_received")

 const visibleTabs = useMemo(
  () => STUDENT_DETAIL_TABS.filter((t) => canViewMoney || t.id !== "payments"),
  [canViewMoney]
 )

 const writeTabParam = useCallback(
  (next: TabId) => {
   setSearchParams(
    (prev) => {
     const nextParams = new URLSearchParams(prev)
     nextParams.set("tab", next)
     return nextParams
    },
    { replace: true }
   )
  },
  [setSearchParams]
 )

 const applyTab = useCallback(
  (next: TabId) => {
   const parsed = parseStudentDetailTab(next, { canViewMoney, capsReady: authReady })
   setTabState(parsed)
   writeTabParam(parsed)
  },
  [canViewMoney, authReady, writeTabParam]
 )

 useEffect(() => {
  const parsed = parseStudentDetailTab(searchParams.get("tab"), {
   canViewMoney,
   capsReady: authReady,
  })
  setTabState(parsed)
  if (searchParams.get("tab") !== parsed) writeTabParam(parsed)
 }, [searchParams, canViewMoney, authReady, writeTabParam])
 const [student, setStudent] = useState<StudentRecord | null>(null)
 const [studentState, setStudentState] = useState<"loading" | "ready" | "error">("loading")
 const [loading, setLoading] = useState(true)
 const [enrollments, setEnrollments] = useState<EnrollmentWithClass[]>([])
 const [enrollmentsState, setEnrollmentsState] = useState<"loading" | "ready" | "error">("loading")
 const [payments, setPayments] = useState<PaymentRow[]>([])
 const [paymentsState, setPaymentsState] = useState<"loading" | "ready" | "error">("loading")
 const [islandReloadToken, setIslandReloadToken] = useState(0)
 const [classOptions, setClassOptions] = useState<ClassOption[]>([])
 const [pickClass, setPickClass] = useState("")
 /** 暑期：期數或單堂；正規：full | 單堂 */
 const [pickForm, setPickForm] = useState<string>("full")
 const [pickScheduleIds, setPickScheduleIds] = useState<string[]>([])
 const [addEnrollmentDialogOpen, setAddEnrollmentDialogOpen] = useState(false)
 const [addEnrollmentSaving, setAddEnrollmentSaving] = useState(false)
 const [addEnrollmentError, setAddEnrollmentError] = useState<string | null>(null)
 const [pickStartMode, setPickStartMode] = useState<EnrollmentStartMode>("next")
 const [pickStartScheduleId, setPickStartScheduleId] = useState("")
 const [pickClassSchedules, setPickClassSchedules] = useState<ClassScheduleRow[]>([])
 const [pickClassSchedulesLoading, setPickClassSchedulesLoading] = useState(false)
 const [pickHwPlan, setPickHwPlan] = useState<"三日" | "四日" | "五日" | "七日">("四日")
 const [pickHwWeekdays, setPickHwWeekdays] = useState<Array<"一" | "二" | "三" | "四" | "五">>([
  "一",
  "二",
  "四",
  "五",
 ])
 const [totalPaidLessons, setTotalPaidLessons] = useState<number | null>(null)
 const [lessonBalances, setLessonBalances] = useState<LessonBalanceRow[]>([])
 const [lessonBalancesState, setLessonBalancesState] = useState<"loading" | "ready" | "error">("loading")
 const [withdrawOpen, setWithdrawOpen] = useState(false)
 const [withdrawTarget, setWithdrawTarget] = useState<EnrollmentWithClass | null>(null)
 const [withdrawReason, setWithdrawReason] = useState("")
 const [withdrawSaving, setWithdrawSaving] = useState(false)
 const [voidPayOpen, setVoidPayOpen] = useState(false)
 const [voidPayTarget, setVoidPayTarget] = useState<VoidPaymentTarget | null>(null)

 const [editFormOpen, setEditFormOpen] = useState(false)
 const [editFormTarget, setEditFormTarget] = useState<EnrollmentWithClass | null>(null)
 const [editFormValue, setEditFormValue] = useState<string>("full")
 const [editFormScheduleIds, setEditFormScheduleIds] = useState<string[]>([])
 const [editFormSaving, setEditFormSaving] = useState(false)
 const [editFormLoadingSessions, setEditFormLoadingSessions] = useState(false)

 const [relatives, setRelatives] = useState<StudentRelativeRow[]>([])
 const [relativesState, setRelativesState] = useState<"loading" | "ready" | "error">("loading")
 const [relativeDialogOpen, setRelativeDialogOpen] = useState(false)
 const [allStudentsForPick, setAllStudentsForPick] = useState<StudentRecord[]>([])
 const [relativeQuery, setRelativeQuery] = useState("")
 const [relativePick, setRelativePick] = useState<StudentRecord | null>(null)
 const [relativePreset, setRelativePreset] = useState<string>(RELATIONSHIP_PRESETS[0])
 const [relativeCustom, setRelativeCustom] = useState("")
 const [relativeSaving, setRelativeSaving] = useState(false)

 const sid = studentId ?? ""

 const tabLoadedRef = useRef<Set<TabId>>(new Set(["basic"]))
 const [tabLoading, setTabLoading] = useState(false)

 /** 首屏：學生＋報讀摘要＋親屬（基本資料 tab） */
 const reloadCore = useCallback(async () => {
  if (!sid) return
  setEnrollmentsState("loading")
  setRelativesState("loading")
  setLessonBalancesState("loading")
  const settled = await Promise.allSettled([
   getStudentById(sid),
   fetchEnrollmentsForStudent(sid),
   fetchRelativesForStudent(sid),
   fetchLessonBalancesForStudent(sid, { includePaidLessons: canViewMoney }),
  ])
  if (settled[0].status === "fulfilled") {
   setStudent(settled[0].value)
   setStudentState("ready")
  } else {
   reportUserFacingError(settled[0].reason, { source: "StudentDetailView.student" })
   setStudentState("error")
  }
  if (settled[1].status === "fulfilled") {
   setEnrollments(settled[1].value)
   setEnrollmentsState("ready")
  } else {
   reportUserFacingError(settled[1].reason, { source: "StudentDetailView.enrollments" })
   setEnrollmentsState("error")
  }
  if (settled[2].status === "fulfilled") {
   setRelatives(settled[2].value)
   setRelativesState("ready")
  } else {
   reportUserFacingError(settled[2].reason, { source: "StudentDetailView.relatives" })
   setRelativesState("error")
  }
  if (settled[3].status === "fulfilled") {
   setLessonBalances(settled[3].value)
   setLessonBalancesState("ready")
  } else {
   reportUserFacingError(settled[3].reason, { source: "StudentDetailView.lessonBalances" })
   setLessonBalancesState("error")
  }
 }, [sid, canViewMoney])

 /** 按分頁懶載；force 時重拉（寫入後） */
 const ensureTabData = useCallback(
  async (tabId: TabId, force = false) => {
   if (!sid) return
   if (tabId === "attendance" || tabId === "leave" || tabId === "history" || tabId === "futureSchedules") return
   if (!force && tabLoadedRef.current.has(tabId)) return
   const includeMoney = canViewMoney
   setTabLoading(true)
   try {
    if (tabId === "basic") {
     try {
      const rels = await fetchRelativesForStudent(sid)
      setRelatives(rels)
      setRelativesState("ready")
     } catch (e) {
      reportUserFacingError(e, { source: "StudentDetailView.relativesTab" })
      setRelativesState("error")
     }
    } else if (tabId === "enrollments") {
     setLessonBalancesState("loading")
     const settled = await Promise.allSettled([
      fetchEnrollmentsForStudent(sid),
      includeMoney ? fetchTotalPaidLessonsForStudent(sid) : Promise.resolve(null),
      fetchLessonBalancesForStudent(sid, { includePaidLessons: includeMoney }),
      fetchClassOptions(),
     ])
     if (settled[0].status === "fulfilled") {
      setEnrollments(settled[0].value)
      setEnrollmentsState("ready")
     } else {
      reportUserFacingError(settled[0].reason, { source: "StudentDetailView.enrollmentsTab" })
      setEnrollmentsState("error")
     }
     if (settled[1].status === "fulfilled") setTotalPaidLessons(settled[1].value)
     if (settled[2].status === "fulfilled") {
      setLessonBalances(settled[2].value)
      setLessonBalancesState("ready")
     } else {
      reportUserFacingError(settled[2].reason, { source: "StudentDetailView.lessonBalances" })
      setLessonBalancesState("error")
     }
     if (settled[3].status === "fulfilled") setClassOptions(settled[3].value)
    } else if (tabId === "payments") {
     if (!includeMoney) {
      setPayments([])
      setPaymentsState("ready")
     } else {
      const settled = await Promise.allSettled([
       fetchPaymentsForStudent(sid),
       fetchTotalPaidLessonsForStudent(sid),
      ])
      if (settled[0].status === "fulfilled") {
       setPayments(settled[0].value)
       setPaymentsState("ready")
      } else {
       reportUserFacingError(settled[0].reason, { source: "StudentDetailView.payments" })
       setPaymentsState("error")
      }
      if (settled[1].status === "fulfilled") setTotalPaidLessons(settled[1].value)
     }
    }
    tabLoadedRef.current.add(tabId)
   } catch (e) {
    reportUserFacingError(e, { source: `StudentDetailView.tab.${tabId}` })
   } finally {
    setTabLoading(false)
   }
  },
  [sid, canViewMoney]
 )

 /** 寫入後：重載核心＋已開過／而家嘅分頁 */
 const reloadSubs = useCallback(async () => {
  if (!sid) return
  const tabsToReload = new Set<TabId>(tabLoadedRef.current)
  tabsToReload.add(tab)
  await reloadCore()
  tabLoadedRef.current = new Set(["basic"])
  setIslandReloadToken((n) => n + 1)
  const islandTabs: TabId[] = ["attendance", "leave", "history", "futureSchedules"]
  await Promise.all(
   [...tabsToReload]
    .filter((t) => t !== "basic" && !islandTabs.includes(t))
    .map((t) => ensureTabData(t, true))
  )
 }, [sid, tab, reloadCore, ensureTabData])

 const loadAll = useCallback(async () => {
  if (!sid) return
  setLoading(true)
  setPayments([])
  setPaymentsState("loading")
  tabLoadedRef.current = new Set(["basic"])
  try {
   await reloadCore()
  } finally {
   setLoading(false)
  }
 }, [sid, reloadCore])

 useEffect(() => {
  void loadAll()
 }, [loadAll])

 useEffect(() => {
  if (loading || !sid || !student) return
  void ensureTabData(tab)
 }, [tab, loading, sid, student, ensureTabData])

 const [form, setForm] = useState<Partial<StudentRecord>>({})
 const [savingBasic, setSavingBasic] = useState(false)
 const savingBasicRef = useRef(false)

 useEffect(() => {
  if (student) setForm(student)
 }, [student])

 const saveBasic = useCallback(async (): Promise<boolean> => {
  if (!sid || !student || savingBasicRef.current) return false
  savingBasicRef.current = true
  setSavingBasic(true)
  try {
   const prevStage = normalizeAcademicStage(student.academic_stage)
   const nextStage = normalizeAcademicStage(form.academic_stage)
   const studentName = (form.full_name ?? student.full_name ?? "").trim() || "此生"
   const graduating = prevStage !== "已畢業" && nextStage === "已畢業"
   const ungraduating = prevStage === "已畢業" && nextStage !== "已畢業"
   let graduateBlockers = null as Awaited<ReturnType<typeof fetchGraduationBlockers>> | null
   if (graduating) {
    graduateBlockers = await fetchGraduationBlockers(sid)
    if (
     !(await confirmGraduateStudent(confirmDialog, {
      studentName,
      blockers: graduateBlockers,
     }))
    ) {
     return false
    }
   } else if (ungraduating) {
    if (
     !(await confirmUngraduateStudent(confirmDialog, {
      studentName,
     }))
    ) {
     return false
    }
   }
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
    student_preferred_contact_method: form.student_preferred_contact_method || null,
    parent_preferred_contact_method: form.parent_preferred_contact_method || null,
    student_wechat_id:
     form.student_preferred_contact_method === "WeChat"
      ? form.student_wechat_id || null
      : null,
    parent_wechat_id:
     form.parent_preferred_contact_method === "WeChat" ? form.parent_wechat_id || null : null,
    primary_contact_person: form.primary_contact_person || null,
    address: form.address,
    remarks: form.remarks,
   })
   setStudent(updated)
   setForm(updated)
   invalidateStudentsListDataCache()
   if (graduating && graduateBlockers) {
    logGraduateStudentChange({
     forced: graduationHasWarnings(graduateBlockers),
     studentId: sid,
     studentName,
     blockers: graduateBlockers,
     source: "StudentDetailView.saveBasic",
    })
   } else if (ungraduating) {
    logUngraduateStudentChange({
     studentId: sid,
     studentName,
     source: "StudentDetailView.saveBasic",
    })
   }
   pushBanner({ tone: "success", title: "已儲存學生資料", message: "學生基本資料已更新。" })
   setBasicEditing(false)
   return true
  } catch (e) {
   reportUserFacingError(e, { source: "StudentDetailView.saveBasic" })
   pushBanner({ tone: "error", title: "儲存失敗", message: e instanceof Error ? e.message : String(e) })
   return false
  } finally {
   savingBasicRef.current = false
   setSavingBasic(false)
  }
 }, [sid, student, form, pushBanner, confirmDialog])

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

 const discardBasicEdits = useCallback(() => {
  if (student) setForm(student)
  setBasicEditing(false)
 }, [student])

 const confirmUnsavedIfNeeded = useCallback(async (): Promise<boolean> => {
  if (unsavedLeaveResolverRef.current) return false
  if (!student || !basicEditing || !isStudentBasicFormDirty(student, form)) return true
  const choice = await promptUnsavedLeave()
  if (choice === "cancel") return false
  if (choice === "save") {
   const ok = await saveBasic()
   if (!ok) return false
   setBasicEditing(false)
   return true
  }
  discardBasicEdits()
  return true
 }, [student, basicEditing, form, promptUnsavedLeave, saveBasic, discardBasicEdits])

 const requestLeave = useCallback(async () => {
  const ok = await confirmUnsavedIfNeeded()
  if (!ok) return
  navigate(exitPath)
 }, [confirmUnsavedIfNeeded, navigate, exitPath])

 const setTab = useCallback(
  (next: TabId) => {
   void (async () => {
    const ok = await confirmUnsavedIfNeeded()
    if (!ok) return
    applyTab(next)
    const scrollRoot = document.querySelector("[data-detail-layer-scroll]")
    if (scrollRoot instanceof HTMLElement) scrollRoot.scrollTo({ top: 0 })
    else document.querySelector("main")?.scrollTo({ top: 0 })
   })()
  },
  [confirmUnsavedIfNeeded, applyTab]
 )

 const goExternal = useCallback(
  (to: string) => {
   void (async () => {
    const ok = await confirmUnsavedIfNeeded()
    if (!ok) return
    navigate(to)
   })()
  },
  [confirmUnsavedIfNeeded, navigate]
 )

 const allowNav = useCallback(async () => {
  return confirmUnsavedIfNeeded()
 }, [confirmUnsavedIfNeeded])

 const basicDirty = Boolean(student && basicEditing && isStudentBasicFormDirty(student, form))
 useNavGuard(basicDirty, allowNav)

 const resetAddEnrollmentDialog = useCallback(() => {
  setPickClass("")
  setPickForm("full")
  setPickScheduleIds([])
  setPickStartMode("next")
  setPickStartScheduleId("")
  setPickClassSchedules([])
  setPickClassSchedulesLoading(false)
  setPickHwPlan("四日")
  setPickHwWeekdays(["一", "二", "四", "五"])
  setAddEnrollmentSaving(false)
  setAddEnrollmentError(null)
 }, [])

 const openAddEnrollmentDialog = useCallback(
  (classId: string) => {
   const opt = classOptions.find((o) => o.id === classId)
   setPickClass(classId)
   setPickScheduleIds([])
   setPickForm(opt?.courseMode === "summer_two_period" ? "第一期" : "full")
   setPickStartMode("next")
   setPickStartScheduleId("")
   setPickHwPlan("四日")
   setPickHwWeekdays(["一", "二", "四", "五"])
   setAddEnrollmentSaving(false)
   setAddEnrollmentError(null)
   setAddEnrollmentDialogOpen(true)
  },
  [classOptions]
 )

 const addEnrollment = async () => {
  if (!pickClass || addEnrollmentSaving) return
  const picked = classOptions.find((o) => o.id === pickClass)
  const isHomework = picked?.classKind === "homework"
  const isSummer = picked?.courseMode === "summer_two_period"
  const isSingle = !isHomework && pickForm === SINGLE_SESSION_ENROLLMENT
  if (isSingle && pickScheduleIds.length === 0) {
   setAddEnrollmentError("單堂報讀請至少勾選一堂")
   return
  }
  if (isHomework) {
   const need =
    pickHwPlan === "三日" ? 3 : pickHwPlan === "四日" ? 4 : pickHwPlan === "五日" ? 5 : 7
   if (pickHwPlan !== "七日" && pickHwWeekdays.length !== need) {
    setAddEnrollmentError(`每週${pickHwPlan}請選 ${need} 日（已選 ${pickHwWeekdays.length}）`)
    return
   }
  }
  let period: EnrollmentFormValue | null = null
  if (isSingle) period = SINGLE_SESSION_ENROLLMENT
  else if (isSummer && ENROLLMENT_PERIOD_OPTIONS.includes(pickForm as EnrollmentPeriod)) {
   period = pickForm as EnrollmentPeriod
  }
  let enrollDate: string
  try {
   if (isHomework) {
    enrollDate = todayYmd
   } else {
    enrollDate = resolveEnrollmentStartDate({
     mode: pickStartMode,
     todayYmd,
     nextScheduleDate: nextPickSchedule?.scheduled_date,
     specifiedScheduleDate: pickStartScheduleOptions.find((row) => row.id === pickStartScheduleId)
      ?.scheduled_date,
    })
   }
  } catch (e) {
   setAddEnrollmentError(e instanceof Error ? e.message : String(e))
   return
  }
  setAddEnrollmentSaving(true)
  setAddEnrollmentError(null)
  try {
   await insertEnrollment(
    sid,
    pickClass,
    period,
    isSingle ? pickScheduleIds : undefined,
    null,
    {
     enrollDate,
     homeworkDayPlan: isHomework ? pickHwPlan : null,
     homeworkWeekdays: isHomework ? pickHwWeekdays : null,
    }
   )
   setAddEnrollmentDialogOpen(false)
   resetAddEnrollmentDialog()
   invalidateStudentsListDataCache()
   pushBanner({
    tone: "success",
    title: "已加入班別",
    message: isHomework
     ? "功課輔導班報讀已建立。請於功輔「月費」頁產生應收後前往收款登記。"
     : "報讀已建立。請前往收款／出單確認學費，已繳堂數才會增加。",
    action: isHomework
     ? {
        pageLabel: "功輔月費",
        to: "/HomeworkTutoring/Fees",
       }
     : {
        pageLabel: "收款／出單",
        to: `/Payments?studentId=${encodeURIComponent(sid)}&mode=receive`,
       },
   })
   await reloadSubs()
  } catch (e) {
   reportUserFacingError(e, { source: "StudentDetailView.addEnrollment" })
   const message = e instanceof Error ? e.message : String(e)
   setAddEnrollmentError(message)
   pushBanner({
    tone: "error",
    title: "加入失敗",
    message,
   })
  } finally {
   setAddEnrollmentSaving(false)
  }
 }

 const submitWithdraw = async () => {
  if (!withdrawTarget || !sid) return
  setWithdrawSaving(true)
  try {
   const studentName = (student?.full_name ?? form.full_name ?? "").trim() || "學生"
   const hits = await previewEnrollmentAttendanceImpact(sid, withdrawTarget.classId)
   const attOpts = await resolveEnrollmentAttendanceOptions(
    confirmDialog,
    hits,
    "withdraw",
    studentName
   )
   if (attOpts === "abort") return
   await withdrawStudentFromClass({
    enrollmentId: withdrawTarget.id,
    studentId: sid,
    classId: withdrawTarget.classId,
    effectiveDate: localTodayYmd(),
    reason: withdrawReason.trim() || null,
    ...attOpts,
   })
   setWithdrawOpen(false)
   setWithdrawTarget(null)
   setWithdrawReason("")
   invalidateStudentsListDataCache()
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
 const occupiedClassIds =
  enrollmentsState === "ready" ? new Set(activeEnrollments.map((e) => e.classId)) : new Set<string>()
 const classSelectOptions = classOptions.filter((o) => !occupiedClassIds.has(o.id))
 const pickedClassOption = classOptions.find((o) => o.id === pickClass)
 const isSummerPick = pickedClassOption?.courseMode === "summer_two_period"
 const isHomeworkPick = pickedClassOption?.classKind === "homework"
 const showSessionPicker = Boolean(pickClass) && pickForm === SINGLE_SESSION_ENROLLMENT
 const classSearchableOptions = useMemo(
  () =>
   classSelectOptions.map((o) => ({
    value: o.id,
    label: o.label,
    searchText: o.label,
   })),
  [classSelectOptions]
 )
 const todayYmd = localTodayYmd()
 const pickStartScheduleOptions = useMemo(
  () =>
   pickClassSchedules.filter(
    (row) =>
     !isCancelledScheduleStatus(row.status) && row.scheduled_date.slice(0, 10) >= todayYmd
   ),
  [pickClassSchedules, todayYmd]
 )
 const nextPickSchedule = useMemo(
  () => resolveNextClassSchedule(pickClassSchedules, todayYmd),
  [pickClassSchedules, todayYmd]
 )

 const balanceByEnrollment = useMemo(() => {
  const map = new Map<string, LessonBalanceRow>()
  for (const row of lessonBalances) map.set(row.enrollmentId, row)
  return map
 }, [lessonBalances])
 const misalignedCount = useMemo(
  () =>
   lessonBalancesState === "ready"
    ? lessonBalances.filter((b) => isLessonBalanceNeedsFollowUp(b)).length
    : 0,
  [lessonBalances, lessonBalancesState]
 )
 const teacherFollowUpCount = useMemo(
  () =>
   lessonBalancesState === "ready"
    ? lessonBalances.filter((b) => b.pendingLessons > 0 || b.leaveAwaitingMakeupCount > 0).length
    : 0,
  [lessonBalances, lessonBalancesState]
 )
 const headerExceptionBits = useMemo(() => {
  if (lessonBalancesState !== "ready") return [] as string[]
  let pending = 0
  let leave = 0
  let misaligned = 0
  for (const b of lessonBalances) {
   pending += b.pendingLessons
   leave += b.leaveAwaitingMakeupCount
   if (isLessonBalanceNeedsFollowUp(b) && !b.isAligned) misaligned += 1
  }
  const bits: string[] = []
  if (pending > 0) bits.push(`待補 ${pending} 堂`)
  if (leave > 0) bits.push(`請假未安排 ${leave} 堂`)
  if (canViewMoney && misaligned > 0) bits.push(`${misaligned} 班堂數不一致`)
  return bits
 }, [lessonBalances, lessonBalancesState, canViewMoney])

 useEffect(() => {
  if (!addEnrollmentDialogOpen || !pickClass) {
   setPickClassSchedules([])
   setPickClassSchedulesLoading(false)
   return
  }
  let cancelled = false
  setPickClassSchedulesLoading(true)
  void fetchClassSchedules(pickClass)
   .then((rows) => {
    if (!cancelled) setPickClassSchedules(rows)
   })
   .catch((e) => {
    if (!cancelled) {
     reportUserFacingError(e, { source: "StudentDetailView.pickClassSchedules" })
     setPickClassSchedules([])
    }
   })
   .finally(() => {
    if (!cancelled) setPickClassSchedulesLoading(false)
   })
  return () => {
   cancelled = true
  }
 }, [addEnrollmentDialogOpen, pickClass])

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
   const hits = await previewEnrollmentAttendanceImpact(sid, e.classId)
   const attOpts = await resolveEnrollmentAttendanceOptions(
    confirmDialog,
    hits,
    "purge",
    studentName
   )
   if (attOpts === "abort") return
   await purgeMistakenEnrollment({ enrollmentId: e.id, studentId: sid, ...attOpts })
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


 const showBasicForm = basicEditing && canMutateStudentOps

 if (!sid) {
  return (
   <AdaptiveDetailLayer
    variant="student"
    onDismiss={() => navigate(exitPath)}
    layerLabel={null}
    chrome={
     <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2.5">
      <p className="text-sm font-semibold">學生詳情</p>
      <Button type="button" variant="ghost" size="icon" aria-label="關閉" onClick={() => navigate(exitPath)}>
       <X className="h-4 w-4" />
      </Button>
     </div>
    }
   >
    <p className="p-6 text-muted-foreground">無效的學生編號</p>
   </AdaptiveDetailLayer>
  )
 }

 if (!loading && !student) {
  const loadFailed = studentState === "error"
  return (
   <AdaptiveDetailLayer
    variant="student"
    onDismiss={() => navigate(exitPath)}
    layerLabel={null}
    chrome={
     <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2.5">
      <p className="text-sm font-semibold">學生詳情</p>
      <Button type="button" variant="ghost" size="icon" aria-label="關閉" onClick={() => navigate(exitPath)}>
       <X className="h-4 w-4" />
      </Button>
     </div>
    }
   >
    <div className="p-6">
     {loadFailed ? (
      <div className="space-y-2" role="alert">
       <p role="alert" className="text-sm text-destructive">學生資料未能載入。</p>
       <button
        type="button"
        className="text-sm font-medium text-primary hover:underline"
        onClick={() => void loadAll()}
       >
        重試
       </button>
      </div>
     ) : (
      <p className="text-muted-foreground">找不到此學生。</p>
     )}
     <Button type="button" variant="outline" className="mt-4" asChild>
      <Link to={exitPath}>返回</Link>
     </Button>
    </div>
   </AdaptiveDetailLayer>
  )
 }

 return (
  <AdaptiveDetailLayer
   variant="student"
   onDismiss={() => void requestLeave()}
   layerLabel={null}
   chrome={
    <div className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-2.5">
     <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-foreground">
       {student?.full_name ?? (loading ? "載入中…" : "學生詳情")}
      </p>
      {student ? (
       <p className="truncate text-xs tabular-nums text-muted-foreground">
        {student.student_code || student.id.slice(0, 8)}
       </p>
      ) : null}
     </div>
     <Button
      type="button"
      variant="ghost"
      size="icon"
      className="shrink-0"
      aria-label="關閉"
      onClick={() => void requestLeave()}
     >
      <X className="h-4 w-4" />
     </Button>
    </div>
   }
  >
  <div className="flex min-h-full flex-col bg-background px-4 pb-4 md:px-0 md:pb-0">
   {isMobile ? null : (
   <div className="space-y-3">
    <button
     type="button"
     className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
     onClick={() => void requestLeave()}
    >
     {exitPath.startsWith("/Classes") ? "返回班別管理" : "返回學生管理"}
    </button>
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="min-w-0">
      {loading ? (
       <p className="text-lg">載入中…</p>
      ) : student ? (
       <>
        <h1 className="truncate text-xl font-bold md:text-2xl">{student.full_name}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
         <span className="tabular-nums">{student.student_code || student.id.slice(0, 8)}</span>
         <StudentClassificationTags student={student} size="sm" />
        </div>
        {headerExceptionBits.length > 0 ? (
         <button
          type="button"
          className="mt-2 w-full rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-left text-xs font-medium text-warning"
          onClick={() => setTab("enrollments")}
         >
          {headerExceptionBits.join(" · ")}
         </button>
        ) : null}
       </>
      ) : null}
     </div>
     <div className="flex w-fit shrink-0 flex-wrap gap-2">
      {canRegisterPayment ? (
       <Button
        type="button"
        size="sm"
        onClick={() =>
         goExternal(`/Payments?studentId=${encodeURIComponent(sid ?? "")}`)
        }
       >
        收款登記
       </Button>
      ) : null}
      {canOpenLeaveManagement ? (
       <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
         goExternal(`/LeaveManagement?studentId=${encodeURIComponent(sid ?? "")}`)
        }
       >
        請假
       </Button>
      ) : null}
     </div>
    </div>
   </div>
   )}

   <div className={cn("border-b border-border", isMobile ? "px-0" : "mt-4")}>
    {isMobile ? (
     <Select
      className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm font-medium text-foreground"
      value={tab}
      onChange={(e) => setTab(e.target.value as TabId)}
      aria-label={visibleTabs.find((t) => t.id === tab)?.label ?? "基本資料"}
     >
      {visibleTabs.map((t) => (
       <option key={t.id} value={t.id}>
        {t.label}
       </option>
      ))}
     </Select>
    ) : (
    <nav className="flex gap-1 overflow-x-auto">
     {visibleTabs.map((t) => {
      const active = tab === t.id
      return (
       <button
        key={t.id}
        type="button"
        onClick={() => setTab(t.id)}
        className={cn(
         "shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
         active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
        )}
       >
        {t.label}
       </button>
      )
     })}
    </nav>
    )}
   </div>

   {isMobile && (canRegisterPayment || canOpenLeaveManagement) ? (
    <div className="flex flex-wrap gap-2 pt-3">
     {canRegisterPayment ? (
      <Button
       type="button"
       size="sm"
       onClick={() => goExternal(`/Payments?studentId=${encodeURIComponent(sid ?? "")}`)}
      >
       收款登記
      </Button>
     ) : null}
     {canOpenLeaveManagement ? (
      <Button
       type="button"
       variant="outline"
       size="sm"
       onClick={() =>
        goExternal(`/LeaveManagement?studentId=${encodeURIComponent(sid ?? "")}`)
       }
      >
       請假
      </Button>
     ) : null}
    </div>
   ) : null}

   {isMobile && headerExceptionBits.length > 0 ? (
    <button
     type="button"
     className="mt-3 w-full rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-left text-xs font-medium text-warning"
     onClick={() => setTab("enrollments")}
    >
     {headerExceptionBits.join(" · ")}
    </button>
   ) : null}

   <div className="pt-4 md:pt-6">
    {studentState === "error" && student ? (
     <div className="mb-4 space-y-2" role="alert">
      <p role="alert" className="text-sm text-destructive">學生資料未能載入。</p>
      <button
       type="button"
       className="text-sm font-medium text-primary hover:underline"
       onClick={() => void loadAll()}
      >
       重試
      </button>
     </div>
    ) : null}
    {tabLoading && tab !== "basic" && tab !== "futureSchedules" && tab !== "attendance" && tab !== "leave" && tab !== "history" ? (
     <p className="mb-4 flex items-center gap-2 text-sm text-muted-foreground" role="status">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      載入此分頁…
     </p>
    ) : null}
    {tab === "basic" && student ? (
     <div className="mx-auto max-w-4xl space-y-8">
      <fieldset
       disabled={!showBasicForm}
       className="min-w-0 space-y-8 border-0 p-0 disabled:opacity-100"
      >
      <section className="space-y-4">
       <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">基本資料</h2>
        {canMutateStudentOps && !showBasicForm ? (
         <Button type="button" size="sm" onClick={() => setBasicEditing(true)}>
          編輯
         </Button>
        ) : null}
       </div>
       <div className="grid gap-4 sm:grid-cols-2">
        <Field label="中文姓名 *" read={showBasicForm ? undefined : (form.full_name || "—")}>
         <Input
          value={form.full_name ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
         />
        </Field>
        <Field label="英文姓名" read={showBasicForm ? undefined : (form.english_name || "—")}>
         <Input
          value={form.english_name ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, english_name: e.target.value }))}
         />
        </Field>
        <Field label="學生編號" read={form.student_code || "—"}>
         <Input value={form.student_code ?? ""} disabled className="bg-muted" />
        </Field>
        <Field label="性別" read={showBasicForm ? undefined : (form.gender || "—")}>
         <ChoiceChips
          options={GENDER_CHIPS}
          value={form.gender}
          onChange={(gender) => setForm((f) => ({ ...f, gender }))}
         />
        </Field>
        <Field
         label="年級"
         read={showBasicForm ? undefined : formatStudentGrade(form.grade)}
        >
         <StudentGradeChips
          value={form.grade}
          onChange={(grade) => setForm((f) => ({ ...f, grade }))}
         />
        </Field>
        <Field
         label="客戶身份（註冊）"
         read={
          showBasicForm
           ? undefined
           : registrationStatusLabel(normalizeRegistrationStatus(form.registration_status))
         }
        >
         <StatusToggle
          checked={normalizeRegistrationStatus(form.registration_status) === "已註冊"}
          onCheckedChange={(on) =>
           setForm((f) => ({ ...f, registration_status: on ? "已註冊" : "非注冊" }))
          }
          offLabel="非註冊（試堂／查詢）"
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
           在讀，或近三個月曾報讀／退讀（自動計算；在讀一定活躍）
          </span>
         </p>
        </Field>
        <Field
         label="學業階段"
         read={showBasicForm ? undefined : (normalizeAcademicStage(form.academic_stage) === "已畢業" ? "已畢業" : "中學階段")}
        >
         <StatusToggle
          checked={normalizeAcademicStage(form.academic_stage) === "中學階段"}
          onCheckedChange={(on) =>
           setForm((f) => ({ ...f, academic_stage: on ? "中學階段" : "已畢業" }))
          }
          offLabel="已畢業"
          onLabel="中學階段"
         />
        </Field>
        <Field label="學校" className="sm:col-span-2" read={showBasicForm ? undefined : (form.school || "—")}>
         <SchoolSearchableSelect
          disabled={!showBasicForm}
          value={form.school ?? ""}
          onChange={(school) => setForm((f) => ({ ...f, school }))}
         />
        </Field>
        <Field
         label="出生日期"
         read={showBasicForm ? undefined : ((form.date_of_birth ?? "").slice(0, 10) || "—")}
        >
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
        <Field label="家長姓名" read={showBasicForm ? undefined : (form.parent_name || "—")}>
         <Input
          value={form.parent_name ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, parent_name: e.target.value }))}
         />
        </Field>
        <Field label="關係" read={showBasicForm ? undefined : (form.parent_relationship || "—")}>
         <ParentRelationshipChips
          value={form.parent_relationship}
          onChange={(rel) => setForm((f) => ({ ...f, parent_relationship: rel }))}
         />
        </Field>
        <Field
         label="第一聯絡人"
         className="sm:col-span-2"
         read={showBasicForm ? undefined : (form.primary_contact_person || "—")}
        >
         <ChoiceChips
          options={PRIMARY_CONTACT_PERSONS}
          value={form.primary_contact_person ?? ""}
          onChange={(v) => setForm((f) => ({ ...f, primary_contact_person: v }))}
         />
        </Field>
        <Field
         label="學生電話"
         read={
          showBasicForm
           ? undefined
           : `${form.student_phone_country_code ?? "+852"} ${form.student_phone || "—"}`
         }
        >
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
        <Field
         label="學生偏好通訊方式"
         read={
          showBasicForm
           ? undefined
           : form.student_preferred_contact_method === "WeChat"
             ? `WeChat${form.student_wechat_id ? `（${form.student_wechat_id}）` : ""}`
             : (form.student_preferred_contact_method || "—")
         }
        >
         <div className="space-y-2">
          <ChoiceChips
           options={PREFERRED_CONTACT_METHODS}
           value={form.student_preferred_contact_method ?? ""}
           onChange={(m) =>
            setForm((f) => ({
             ...f,
             student_preferred_contact_method: m,
             ...(m !== "WeChat" ? { student_wechat_id: null } : {}),
            }))
           }
          />
          {form.student_preferred_contact_method === "WeChat" ? (
           <Input
            placeholder="學生 WeChat ID"
            value={form.student_wechat_id ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, student_wechat_id: e.target.value }))}
           />
          ) : null}
         </div>
        </Field>
        <Field
         label="家長電話"
         read={
          showBasicForm
           ? undefined
           : `${form.parent_phone_country_code ?? "+852"} ${form.parent_phone || "—"}`
         }
        >
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
        <Field
         label="家長偏好通訊方式"
         read={
          showBasicForm
           ? undefined
           : form.parent_preferred_contact_method === "WeChat"
             ? `WeChat${form.parent_wechat_id ? `（${form.parent_wechat_id}）` : ""}`
             : (form.parent_preferred_contact_method || "—")
         }
        >
         <div className="space-y-2">
          <ChoiceChips
           options={PREFERRED_CONTACT_METHODS}
           value={form.parent_preferred_contact_method ?? ""}
           onChange={(m) =>
            setForm((f) => ({
             ...f,
             parent_preferred_contact_method: m,
             ...(m !== "WeChat" ? { parent_wechat_id: null } : {}),
            }))
           }
          />
          {form.parent_preferred_contact_method === "WeChat" ? (
           <Input
            placeholder="家長 WeChat ID"
            value={form.parent_wechat_id ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, parent_wechat_id: e.target.value }))}
           />
          ) : null}
         </div>
        </Field>
        <Field label="地址" className="sm:col-span-2" read={showBasicForm ? undefined : (form.address || "—")}>
         <Input
          value={form.address ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
         />
        </Field>
        <Field label="備註" className="sm:col-span-2" read={showBasicForm ? undefined : (form.remarks || "—")}>
         <Textarea
          value={form.remarks ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
         />
        </Field>
       </div>
      </section>

      {showBasicForm ? (
       <div className="sticky bottom-0 z-[1] flex flex-wrap justify-end gap-2 border-t border-border bg-background py-3">
        <Button type="button" variant="outline" onClick={discardBasicEdits}>
         取消
        </Button>
        <Button type="button" loading={savingBasic} loadingText="儲存中…" onClick={() => void saveBasic()}>
         儲存
        </Button>
       </div>
      ) : null}
      </fieldset>

      {sid ? (
       <ParentPortalInvitePanel
        studentId={sid}
        studentName={form.full_name ?? student?.full_name ?? ""}
        parentPhone={form.parent_phone ?? student?.parent_phone}
        studentPhone={form.student_phone ?? student?.student_phone}
        primaryContactPerson={form.primary_contact_person ?? student?.primary_contact_person}
        studentPreferredContactMethod={
         form.student_preferred_contact_method ?? student?.student_preferred_contact_method
        }
        parentPreferredContactMethod={
         form.parent_preferred_contact_method ?? student?.parent_preferred_contact_method
        }
        studentWechatId={form.student_wechat_id ?? student?.student_wechat_id}
        parentWechatId={form.parent_wechat_id ?? student?.parent_wechat_id}
        studentPhoneCountryCode={
         form.student_phone_country_code ?? student?.student_phone_country_code
        }
        parentPhoneCountryCode={
         form.parent_phone_country_code ?? student?.parent_phone_country_code
        }
       />
      ) : null}

      <section className="space-y-4">
       <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
         <h2 className="text-sm font-semibold text-foreground">親友</h2>
         <p className="mt-1 text-sm text-muted-foreground">
          新增後為<strong className="text-foreground">雙向</strong>連結：對方學生此區也會顯示
          {student ? `「${student.full_name}」` : "此學生"}與相同關係標籤。
         </p>
        </div>
        {canMutateStudentOps ? (
         <Button type="button" size="sm" className="shrink-0" onClick={openAddRelative}>
          <Plus className="h-4 w-4" />
          新增親友
         </Button>
        ) : null}
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

       {relativesState === "error" ? (
        <div className="space-y-2" role="alert">
         <p role="alert" className="text-sm text-destructive">親友資料未能載入。</p>
         <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => void reloadCore()}>
          重試
         </button>
        </div>
       ) : relativesState !== "ready" ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
       ) : relatives.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚未新增親友。</p>
       ) : (
        <StaggerList as="ul" className="space-y-3">
         {relatives.map((r) => (
          <StaggerItem
           key={r.relationshipId}
           as="li"
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
             {canMutateStudentOps ? (
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
             ) : null}
            </div>
           </div>
           {canMutateStudentOps ? (
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
           ) : null}
          </StaggerItem>
         ))}
        </StaggerList>
       )}
      </section>
     </div>
    ) : null}

    {tab === "enrollments" ? (
     <div className="mx-auto max-w-5xl space-y-4">
      {lessonBalancesState === "error" ? (
       <div className="space-y-2" role="alert">
        <p role="alert" className="text-sm text-destructive">堂數核對未能載入。</p>
        <button
         type="button"
         className="text-sm font-medium text-primary hover:underline"
         onClick={() => void ensureTabData("enrollments", true)}
        >
         重試
        </button>
       </div>
      ) : null}
      {canViewMoney && enrollmentsState === "ready" && misalignedCount > 0 ? (
       <div
        role="status"
        className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning"
       >
        有 <strong className="tabular-nums">{misalignedCount}</strong>{" "}
        個班別的已繳堂數與排程不一致，或仍有歷史待補紀錄、請假尚無補堂日，請經收款或堂數更正跟進。
       </div>
      ) : null}
      {!canViewMoney && enrollmentsState === "ready" && teacherFollowUpCount > 0 ? (
       <div
        role="status"
        className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning"
       >
        有 <strong className="tabular-nums">{teacherFollowUpCount}</strong>{" "}
        個班別仍有待補堂，或請假尚無補堂日。
        <span className="mt-1 block">
         補堂安排請交行政處理；你可在「請假紀錄」查看詳情。
        </span>
       </div>
      ) : null}
      {canMutateStudentOps && enrollmentsState === "ready" ? (
      <>
      <div className="flex flex-wrap items-center gap-2">
       <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
         goExternal(`/PrivateTutoring?studentId=${encodeURIComponent(sid ?? "")}&create=1`)
        }
       >
        新增私人課程
       </Button>
      </div>
      <SearchableSelect
       value=""
       onChange={(next) => {
        if (!next) return
        openAddEnrollmentDialog(next)
       }}
       options={classSearchableOptions}
       placeholder="選擇班別加入…"
       searchPlaceholder="搜尋班別名稱或代碼…"
       className="min-h-11 w-full"
       preferredMinWidth={640}
       aria-label="選擇班別加入"
      />
      <Dialog
       open={addEnrollmentDialogOpen}
       onOpenChange={(open) => {
        if (addEnrollmentSaving) return
        setAddEnrollmentDialogOpen(open)
        if (!open) resetAddEnrollmentDialog()
       }}
      >
       <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
         <DialogTitle>加入報讀班別</DialogTitle>
        </DialogHeader>
        {pickClass && pickedClassOption ? (
         <div className="space-y-4 text-sm">
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2 font-medium">
           {pickedClassOption.label}
          </div>
          {isHomeworkPick ? (
           <>
            <p className="text-muted-foreground">
             功課輔導班按月繳費，不設專科式扣堂／補堂。請選每週日數檔及慣常到校星期。
            </p>
            <Field label="每週日數檔">
             <div className="flex flex-wrap gap-2">
              {(["三日", "四日", "五日", "七日"] as const).map((p) => (
               <button
                key={p}
                type="button"
                onClick={() => {
                 setPickHwPlan(p)
                 const need = p === "三日" ? 3 : p === "四日" ? 4 : p === "五日" ? 5 : 7
                 setPickHwWeekdays((prev) => {
                  if (p === "七日") return ["一", "二", "三", "四", "五"]
                  if (prev.length === need) return prev
                  if (prev.length > need) return prev.slice(0, need)
                  const extras = (["一", "二", "三", "四", "五"] as const).filter(
                   (d) => !prev.includes(d)
                  )
                  return [...prev, ...extras].slice(0, need)
                 })
                }}
                className={
                 pickHwPlan === p
                  ? "rounded-full border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                  : "rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium"
                }
               >
                {p}
               </button>
              ))}
             </div>
            </Field>
            <Field label="逢星期幾">
             <div className="flex flex-wrap gap-2">
              {(["一", "二", "三", "四", "五"] as const).map((d) => {
               const active = pickHwWeekdays.includes(d)
               return (
                <button
                 key={d}
                 type="button"
                 onClick={() => {
                  setPickHwWeekdays((prev) =>
                   prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
                  )
                 }}
                 className={
                  active
                   ? "rounded-full border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                   : "rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium"
                 }
                >
                 星期{d}
                </button>
               )
              })}
             </div>
            </Field>
           </>
          ) : (
           <>
          <p className="text-muted-foreground">
           報讀只建立就讀關係。可上課堂數須經收款確認後才計入已繳堂數，請勿在此手動填寫堂數。
          </p>
          <Field label="報讀形式">
           <Select
            className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
            value={pickForm}
            onChange={(e) => {
             setPickForm(e.target.value)
             if (e.target.value !== SINGLE_SESSION_ENROLLMENT) setPickScheduleIds([])
            }}
           >
            {(isSummerPick
             ? (["第一期", "第二期", SINGLE_SESSION_ENROLLMENT] as const).map((p) => ({
                value: p,
                label:
                 p === SINGLE_SESSION_ENROLLMENT
                  ? "單堂／自選堂數"
                  : p === "第一期"
                    ? "暑期第一期"
                    : "暑期第二期",
               }))
             : [
                { value: "full", label: "報讀" },
                { value: SINGLE_SESSION_ENROLLMENT, label: "單堂／自選堂數" },
               ]
            ).map((o) => (
             <option key={o.value} value={o.value}>
              {o.label}
             </option>
            ))}
           </Select>
          </Field>
          <Field label="開始報讀">
           <ChoiceChips
            options={["next", "schedule"] as const}
            value={pickStartMode}
            onChange={(mode) => {
             setPickStartMode(mode)
             if (mode === "schedule" && !pickStartScheduleId && nextPickSchedule) {
              setPickStartScheduleId(nextPickSchedule.id)
             }
            }}
            label={(mode) => (mode === "next" ? "下一堂" : "指定排程開始")}
           />
          </Field>
          {pickStartMode === "next" ? (
           <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-muted-foreground">
            {pickClassSchedulesLoading ? (
             "載入排程中…"
            ) : nextPickSchedule ? (
             <>
              將由{" "}
              <strong className="text-foreground">
               {formatClassScheduleLabel(nextPickSchedule)}
              </strong>{" "}
              開始計入報讀
             </>
            ) : (
             "此班暫無未來排程，將以今天為報讀開始日。"
            )}
           </div>
          ) : (
           <Field label="選擇開始排程">
            {pickClassSchedulesLoading ? (
             <p className="text-muted-foreground">載入排程中…</p>
            ) : pickStartScheduleOptions.length === 0 ? (
             <p role="alert" className="text-destructive">此班暫無可選的未來排程。</p>
            ) : (
             <Select
              className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={pickStartScheduleId}
              onChange={(e) => setPickStartScheduleId(e.target.value)}
             >
              <option value="">請選擇排程…</option>
              {pickStartScheduleOptions.map((row) => (
               <option key={row.id} value={row.id}>
                {formatClassScheduleLabel(row)}
               </option>
              ))}
             </Select>
            )}
           </Field>
          )}
          {showSessionPicker ? (
           <EnrollmentSessionPicker
            classId={pickClass}
            selectedIds={pickScheduleIds}
            onChange={setPickScheduleIds}
           />
          ) : null}
           </>
          )}
          <div className="flex flex-wrap justify-end gap-2 pt-1">
           <Button
            type="button"
            variant="outline"
            disabled={addEnrollmentSaving}
            onClick={() => {
             setAddEnrollmentDialogOpen(false)
             resetAddEnrollmentDialog()
            }}
           >
            取消
           </Button>
           <Button
            type="button"
            loading={addEnrollmentSaving}
            loadingText="加入中…"
            onClick={() => void addEnrollment()}
            disabled={
             addEnrollmentSaving ||
             !pickClass ||
             (showSessionPicker && pickScheduleIds.length === 0) ||
             (pickStartMode === "schedule" && !pickStartScheduleId)
            }
           >
            <Plus className="h-4 w-4" />
            加入
           </Button>
          </div>
          {addEnrollmentError ? (
           <p className="text-sm text-destructive" role="alert">
            {addEnrollmentError}
           </p>
          ) : null}
         </div>
        ) : null}
       </DialogContent>
      </Dialog>
      </>
      ) : null}
      <div className="space-y-3">
       {enrollmentsState === "error" ? (
        <div className="space-y-2" role="alert">
         <p role="alert" className="text-sm text-destructive">報讀資料未能載入。</p>
         <button
          type="button"
          className="text-sm font-medium text-primary hover:underline"
          onClick={() => void ensureTabData("enrollments", true)}
         >
          重試
         </button>
        </div>
       ) : enrollmentsState !== "ready" ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
       ) : activeEnrollments.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚未報讀任何班別。</p>
       ) : (
        <StaggerList as="div" className="space-y-3">
        {activeEnrollments.map((e) => {
         const isHomework = isHomeworkClassKind(e.classKind)
         const bal = isHomework ? undefined : balanceByEnrollment.get(e.id)
         return (
         <StaggerItem
          key={e.id}
          as="div"
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
            {canViewMoney && !isHomework && e.pricePerLesson != null ? (
             <span>· 每節 {money(e.pricePerLesson)}</span>
            ) : null}
            {isHomework && e.homeworkDayPlan ? (
             <span>每週{e.homeworkDayPlan}</span>
            ) : null}
           </div>
           <div className="mt-1 text-xs text-muted-foreground">
            報讀日期：{e.enroll_date ?? "—"}
           </div>
          </div>
          {canMutateStudentOps ? (
          <div className="flex flex-wrap items-center gap-2">
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
             const next = ev.target.value
             try {
              await updateEnrollment(e.id, next, sid)
              await reloadSubs()
             } catch (err) {
              reportUserFacingError(err, { source: "StudentDetailView.updateEnrollmentStatus" })
              pushBanner({
               tone: "error",
               title: "更新報讀狀態失敗",
               message: err instanceof Error ? err.message : String(err),
              })
             }
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
          ) : (
           <Tag tone={statusToTagTone(e.status)} size="sm">
            {e.status}
           </Tag>
          )}
          </div>
          {isHomework ? (
           <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            功課輔導班按月繳費，不按堂對帳、不補堂。已繳月份見功課輔導 → 月費，或繳費紀錄。
           </div>
          ) : lessonBalancesState === "ready" && bal ? (
           <div
            className={cn(
             "rounded-md border px-3 py-2 text-xs",
             canViewMoney
              ? bal.isAligned && bal.pendingLessons === 0 && bal.leaveAwaitingMakeupCount === 0
                ? "border-border bg-muted/40 text-muted-foreground"
                : "border-amber-700/35 bg-amber-50 text-amber-950"
              : bal.pendingLessons === 0 && bal.leaveAwaitingMakeupCount === 0
                ? "border-border bg-muted/40 text-muted-foreground"
                : "border-amber-700/35 bg-amber-50 text-amber-950"
            )}
           >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
             {canViewMoney ? (
              <>
               <span>
                已繳{" "}
                <strong className="tabular-nums text-foreground">{bal.paidLessons}</strong> 堂
               </span>
               <span>
                已綁排程{" "}
                <strong className="tabular-nums text-foreground">{bal.boundLessons}</strong> 堂
               </span>
              </>
             ) : null}
             <span>
              待補{" "}
              <strong className="tabular-nums text-foreground">{bal.pendingLessons}</strong> 堂
             </span>
             <span>
              請假待安排{" "}
              <strong className="tabular-nums text-foreground">{bal.leaveAwaitingMakeupCount}</strong>{" "}
              堂
             </span>
             {canViewMoney ? (
              bal.paidLessons > 0 ? (
               <Tag
                tone={
                 bal.isAligned && bal.leaveAwaitingMakeupCount === 0 ? "success" : "warning"
                }
                size="sm"
               >
                {!bal.isAligned
                 ? `尚差 ${bal.gap} 堂（請經收款／出單增加已繳堂數）`
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
              )
             ) : bal.leaveAwaitingMakeupCount > 0 ? (
              <Tag tone="warning" size="sm">
               請假待安排 {bal.leaveAwaitingMakeupCount} 堂
              </Tag>
             ) : null}
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
                {canOpenLeaveManagement ? (
                 <Button type="button" variant="outline" size="sm" className="h-7 text-xs" asChild>
                  <Link to={`/LeaveManagement?studentId=${encodeURIComponent(sid ?? "")}`}>
                   前往請假管理
                  </Link>
                 </Button>
                ) : (
                 <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setTab("leave")}
                 >
                  查看請假紀錄
                 </Button>
                )}
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
                 {canMutateStudentOps ? (
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
                 ) : null}
                </li>
               ))}
             </ul>
            ) : null}
           </div>
          ) : null}
         </StaggerItem>
         )
        })}
        </StaggerList>
       )}
      </div>

      {enrollmentsState === "ready" && withdrawnEnrollments.length > 0 ? (
       <div className="space-y-2 rounded-xl border border-dashed border-border bg-muted/20 p-4">
        <p className="text-sm font-medium text-muted-foreground">
         {canMutateStudentOps ? "已退讀（可重新報讀；手誤才用清除）" : "已退讀"}
        </p>
        <StaggerList as="div" className="space-y-2">
         {withdrawnEnrollments.map((e) => (
          <StaggerItem
           key={e.id}
           as="div"
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
           {canMutateStudentOps ? (
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
           ) : null}
          </StaggerItem>
         ))}
        </StaggerList>
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
           。可改為單堂；暑期班亦可更改報讀期數，無需先退讀。
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
                label:
                 p === SINGLE_SESSION_ENROLLMENT
                  ? "單堂／自選堂數"
                  : p === "第一期"
                    ? "暑期第一期"
                    : p === "第二期"
                      ? "暑期第二期"
                      : "暑期兩期全報",
               }))
             : [
                { value: "full", label: "報讀" },
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

    {canViewMoney ? (
    <VoidPaymentDialog
     open={voidPayOpen}
     target={voidPayTarget}
     onOpenChange={(open) => {
      setVoidPayOpen(open)
      if (!open) setVoidPayTarget(null)
     }}
     onVoided={() => void reloadSubs()}
    />
    ) : null}

    {tab === "payments" && canViewMoney ? (
     <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
       <div className="space-y-1 text-sm text-muted-foreground">
        <p>
         {paymentsState === "error"
          ? "繳費紀錄"
          : `共 ${payments.length} 筆繳費紀錄`}
         {paymentsState === "ready" && totalPaidLessons != null ? (
          <span className="text-foreground">
           {" "}
           · 已收款<strong className="mx-1 text-warning tabular-nums">{totalPaidLessons}</strong>總繳堂數
          </span>
         ) : null}
        </p>
        <p className="text-xs">總繳堂數依「已收款」單據之明細堂數加總。</p>
       </div>
       {canRegisterPayment ? (
        <Button type="button" size="sm" onClick={() => goExternal(`/Payments?studentId=${encodeURIComponent(sid)}`)}>
         <Plus className="h-4 w-4" />
         新增繳費
        </Button>
       ) : (
        <p className="text-xs text-muted-foreground">收款登記請由行政／外星人處理。</p>
       )}
      </div>
      <div className="space-y-3">
       {paymentsState === "error" ? (
        <div className="space-y-2" role="alert">
         <p role="alert" className="text-sm text-destructive">繳費資料未能載入。</p>
         <button
          type="button"
          className="text-sm font-medium text-primary hover:underline"
          onClick={() => void ensureTabData("payments", true)}
         >
          重試
         </button>
        </div>
       ) : paymentsState !== "ready" ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
       ) : payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚無繳費紀錄。</p>
       ) : (
        <StaggerList as="div" className="space-y-3">
        {payments.map((p) => (
         <StaggerItem
          key={p.id}
          as="div"
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
               !(await printPaymentForStatus(full, p.status, [
                PAYMENT_STATUS.pendingPay,
                PAYMENT_STATUS.pendingReceive,
               ]))
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
           {canVoidPayment && p.status !== PAYMENT_STATUS.voided ? (
            <Button
             type="button"
             variant="outline"
             size="sm"
             className="text-destructive hover:text-destructive"
             onClick={() => {
              setVoidPayTarget({
               id: p.id,
               receiptNumber: p.receipt_number,
               studentName: student?.full_name ?? "—",
               studentId: student?.id,
               totalAmount: p.total_amount,
               paymentDate: p.payment_date,
               status: p.status,
               createdAt: p.created_at ?? null,
              })
              setVoidPayOpen(true)
             }}
            >
             作廢
            </Button>
           ) : null}
          </div>
         </StaggerItem>
        ))}
        </StaggerList>
       )}
      </div>
     </div>
    ) : null}

    <StudentAttendanceTab
     studentId={sid}
     studentName={student?.full_name ?? ""}
     active={tab === "attendance"}
     reloadToken={islandReloadToken}
     canDeleteAttendance={canDeleteAttendance}
     onChanged={reloadSubs}
    />
    <StudentLeaveTab
     studentId={sid}
     active={tab === "leave"}
     reloadToken={islandReloadToken}
     canMutateLeave={canMutateLeave}
     canOpenLeaveManagement={canOpenLeaveManagement}
     onChanged={reloadSubs}
    />

    <StudentFutureSchedulesTab
     studentId={sid}
     active={tab === "futureSchedules"}
     reloadToken={islandReloadToken}
    />
    <StudentHistoryTab
     studentId={sid}
     active={tab === "history"}
     reloadToken={islandReloadToken}
     includePayments={canViewMoney}
    />
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
     基本資料已修改但尚未儲存。要儲存、放棄變更，還是繼續編輯？
    </p>
    <div className="mt-6 flex flex-wrap justify-end gap-2">
     <Button type="button" variant="outline" onClick={() => finishUnsavedLeave("cancel")}>
      繼續編輯
     </Button>
     <Button type="button" variant="outline" onClick={() => finishUnsavedLeave("discard")}>
      放棄變更
     </Button>
     <Button type="button" onClick={() => finishUnsavedLeave("save")}>
      儲存
     </Button>
    </div>
   </DialogContent>
  </Dialog>
  </AdaptiveDetailLayer>
 )
}

function Field({
 label,
 children,
 className,
 read,
}: {
 label: string
 children: React.ReactNode
 className?: string
 read?: React.ReactNode
}) {
 return (
  <div className={cn("space-y-1", className)}>
   <label className="text-xs font-medium text-muted-foreground">{label}</label>
   {read !== undefined ? <ReadValue>{read}</ReadValue> : children}
  </div>
 )
}

function ReadValue({ children }: { children: React.ReactNode }) {
 return (
  <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
   {children == null || children === "" ? "—" : children}
  </p>
 )
}
