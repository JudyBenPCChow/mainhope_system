import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { Link, useSearchParams } from "react-router-dom"
import {
 Banknote,
 BookOpen,
 ClipboardCheck,
 FileText,
 History,
 Plus,
 Printer,
 Search,
 Trash2,
 Wallet,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { resolveAcademicYearLabel } from "@/lib/academicYearFilter"
import { academicYearLabelFromStartDate } from "@/lib/courseCode"
import { useAcademicYearFilter } from "@/hooks/useAcademicYearFilter"
import {
 academicYearEditBlockedMessage,
 canEditAcademicYearForDate,
} from "@/lib/academicYearEditGuard"
import { formatClassLabel } from "@/lib/courseLabel"
import { useAppConfirm } from "@/lib/appConfirm"
import { buildPaymentAmountBreakdown, computeDiscountApplicationsForSave } from "@/lib/paymentAmountBreakdown"
import {
 buildPaymentEligibilityContext,
 evaluateDiscountAvailability,
} from "@/lib/paymentDiscountEligibility"
import { printPayment, printPaymentForStatus } from "@/lib/paymentPrint"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import { statusToTagTone } from "@/lib/statusTag"
import {
 PAYMENT_METHOD_PRESETS,
 PAYMENT_STATUS,
 deletePaymentRecord,
 fetchPaymentDashboardStats,
 fetchPaymentFull,
 fetchPaymentsList,
 insertPaymentRecord,
 markPaymentReceived,
 type PaymentDetailInput,
 type PaymentFull,
 type PaymentListRow,
} from "@/services/paymentQueries"
import {
 applyDiscountsToSubtotal,
 fetchPaymentFormDiscounts,
 getGlobalMaxStackCount,
 isDiscountCheckboxDisabled,
 resolveSelectedDiscounts,
 validateDiscountSelection,
 type PaymentDiscountRow,
} from "@/services/paymentDiscountQueries"
import {
 fetchAllStudents,
 fetchEnrollmentsForStudent,
 type EnrollmentWithClass,
 type StudentRecord,
} from "@/services/studentQueries"
import { fetchRelativesForStudent, type StudentRelativeRow } from "@/services/studentRelationshipQueries"
import { isStudentNewToMingXue } from "@/services/referralQueries"

type MainTab = "receive" | "invoice" | "history"

const DEFAULT_LESSON_COUNT = "4"

type LineRow = {
 key: string
 classId: string
 lessons: string
 amount: string
}

function newLine(): LineRow {
 return {
  key: crypto.randomUUID(),
  classId: "",
  lessons: DEFAULT_LESSON_COUNT,
  amount: "",
 }
}

function money(n: number) {
 return new Intl.NumberFormat("zh-Hant", { style: "currency", currency: "HKD" }).format(n)
}

function discountOptionLabel(d: PaymentDiscountRow, resolvedAmountOff?: number) {
 const bits = [d.name]
 if (d.percentOff != null && d.percentOff > 0) bits.push(`-${d.percentOff}%`)
 const amt = resolvedAmountOff ?? d.amountOff
 if (amt != null && amt > 0) bits.push(`-$${amt}`)
 return bits.join(" ")
}

const PENDING_PAYMENT_STATUSES = [PAYMENT_STATUS.pendingPay, PAYMENT_STATUS.pendingReceive] as const

function selectClassName() {
 return cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
 )
}

function FormField({
 label,
 children,
}: {
 label: string
 children: ReactNode
}) {
 return (
  <div className="grid gap-1.5">
   <label className="text-sm font-medium text-foreground">{label}</label>
   {children}
  </div>
 )
}

function lineAmountFor(
 classId: string,
 lessons: string,
 byClass: Map<string, EnrollmentWithClass>
): string {
 const n = Number(lessons)
 const e = byClass.get(classId)
 if (!e?.pricePerLesson || !Number.isFinite(n) || n <= 0) return ""
 return String(Math.round(e.pricePerLesson * n * 100) / 100)
}

export function PaymentsPageView() {
 const { confirmDialog } = useAppConfirm()
 const [searchParams, setSearchParams] = useSearchParams()
 const [mainTab, setMainTab] = useState<MainTab>("receive")

 const [students, setStudents] = useState<StudentRecord[]>([])
 const [studentQuery, setStudentQuery] = useState("")
 const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null)
 const [pickerOpen, setPickerOpen] = useState(false)

 const [enrollments, setEnrollments] = useState<EnrollmentWithClass[]>([])
 const [enrollLoading, setEnrollLoading] = useState(false)
 const [lines, setLines] = useState<LineRow[]>([])

 const [discounts, setDiscounts] = useState<PaymentDiscountRow[]>([])
 const [discountIds, setDiscountIds] = useState<string[]>([])
 const [siblingExtraLessons, setSiblingExtraLessons] = useState("")
 const [isNewStudent, setIsNewStudent] = useState<boolean | null>(null)
 const [relatives, setRelatives] = useState<StudentRelativeRow[]>([])
 const [referrerStudentId, setReferrerStudentId] = useState("")
 const [batchMemberCount, setBatchMemberCount] = useState("")

 const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10))
 const [method, setMethod] = useState<string>(PAYMENT_METHOD_PRESETS[0] ?? "現金")
 const [invoiceStatus, setInvoiceStatus] = useState<string>(PAYMENT_STATUS.pendingReceive)
 const [remarks, setRemarks] = useState("")
 const [printAfterReceive, setPrintAfterReceive] = useState(false)
 const [printAfterInvoice, setPrintAfterInvoice] = useState(true)
 const [saving, setSaving] = useState(false)

 const [historyRows, setHistoryRows] = useState<PaymentListRow[]>([])
 const [histLoading, setHistLoading] = useState(true)
 const [histErr, setHistErr] = useState<string | null>(null)
 const [histStatus, setHistStatus] = useState<"all" | "received" | "pending" | "pendingPay">("all")
 const [histFrom, setHistFrom] = useState("")
 const [histTo, setHistTo] = useState("")
 const [histSearch, setHistSearch] = useState("")
 const [academicYearFilter, setAcademicYearFilter] = useAcademicYearFilter()

 const [detailOpen, setDetailOpen] = useState(false)
 const [detailPay, setDetailPay] = useState<PaymentFull | null>(null)
 const [detailLoading, setDetailLoading] = useState(false)

 const [markOpen, setMarkOpen] = useState(false)
 const [markTarget, setMarkTarget] = useState<PaymentListRow | null>(null)
 const [markMethod, setMarkMethod] = useState<string>(PAYMENT_METHOD_PRESETS[0] ?? "現金")

 const [dashStats, setDashStats] = useState<{ totalPaidLessons: number; totalAttendedLessons: number } | null>(
  null
 )
 const [dashLoading, setDashLoading] = useState(false)
 const [formErr, setFormErr] = useState<string | null>(null)
 const [formOk, setFormOk] = useState<string | null>(null)
 const currentAcademicYear = useMemo(() => academicYearLabelFromStartDate(new Date().toISOString().slice(0, 10)), [])
 const selectedYearLabel = useMemo(
  () => resolveAcademicYearLabel(academicYearFilter, currentAcademicYear),
  [academicYearFilter, currentAcademicYear]
 )
 const payDateEditable = useMemo(() => canEditAcademicYearForDate(payDate), [payDate])

 const loadDashboardStats = useCallback(async () => {
  if (!isSupabaseConfigured) {
   setDashStats(null)
   return
  }
  setDashLoading(true)
  try {
   setDashStats(await fetchPaymentDashboardStats())
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentsPageView.loadDashboardStats", setErr: setFormErr })
   setDashStats(null)
  } finally {
   setDashLoading(false)
  }
 }, [])

 useEffect(() => {
  void loadDashboardStats()
 }, [loadDashboardStats])

 const enrollmentByClass = useMemo(() => {
  const m = new Map<string, EnrollmentWithClass>()
  for (const e of enrollments) m.set(e.classId, e)
  return m
 }, [enrollments])

 const subtotal = useMemo(() => {
  let s = 0
  for (const l of lines) {
   const a = Number(l.amount)
   if (Number.isFinite(a) && a > 0) s += a
  }
  return Math.round(s * 100) / 100
 }, [lines])

 const paymentAcademicYear = useMemo(
  () => academicYearLabelFromStartDate(payDate),
  [payDate]
 )

 const selectedDiscounts = useMemo(
  () => resolveSelectedDiscounts(discountIds, discounts),
  [discountIds, discounts]
 )

 const siblingExtraN = useMemo(() => {
  const n = Number(siblingExtraLessons)
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0
 }, [siblingExtraLessons])

 const batchMemberCountN = useMemo(() => {
  const n = Number(batchMemberCount)
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 1
 }, [batchMemberCount])

 const batchSharedClassId = useMemo(() => {
  const ids = [...new Set(lines.map((l) => l.classId).filter(Boolean))]
  return ids.length === 1 ? ids[0]! : null
 }, [lines])

 const paymentEligibilityCtx = useMemo(
  () =>
   buildPaymentEligibilityContext(
    lines.map((l) => ({ classId: l.classId, lessons: l.lessons })),
    (classId) => {
     const e = enrollmentByClass.get(classId)
     if (!e) return null
     return {
      subjectCode: e.subjectCode,
      subjectCategory: e.subjectCategory,
      enrollmentPeriod: e.enrollmentPeriod,
      courseMode: e.courseMode,
      teacherId: e.teacherId,
      timeSlot: e.timeSlot,
      dayOfWeek: e.dayOfWeek,
     }
    },
    {
     siblingExtraLessons: siblingExtraN,
     isNewStudent: isNewStudent ?? undefined,
     batchMemberCount: batchMemberCountN,
     batchSharedClassId,
     referrerStudentId: referrerStudentId.trim() || null,
    }
   ),
  [
   lines,
   enrollmentByClass,
   siblingExtraN,
   isNewStudent,
   batchMemberCountN,
   batchSharedClassId,
   referrerStudentId,
  ]
 )

 const discountAvailability = useMemo(() => {
  const map = new Map<string, ReturnType<typeof evaluateDiscountAvailability>>()
  for (const d of discounts) {
   map.set(
    d.id,
    evaluateDiscountAvailability(d, paymentEligibilityCtx, {
     asOfDate: payDate,
     academicYear: paymentAcademicYear,
    })
   )
  }
  return map
 }, [discounts, paymentEligibilityCtx, payDate, paymentAcademicYear])

 const maxStackCount = useMemo(() => getGlobalMaxStackCount(discounts), [discounts])

 useEffect(() => {
  setDiscountIds((prev) =>
   prev.filter((id) => discountAvailability.get(id)?.eligible !== false)
  )
 }, [discountAvailability])

 const totalDue = useMemo(
  () => applyDiscountsToSubtotal(subtotal, selectedDiscounts, paymentEligibilityCtx),
  [subtotal, selectedDiscounts, paymentEligibilityCtx]
 )

 const discountStepsPreview = useMemo(
  () => computeDiscountApplicationsForSave(subtotal, selectedDiscounts, paymentEligibilityCtx),
  [subtotal, selectedDiscounts, paymentEligibilityCtx]
 )

 const needsReferrer = useMemo(
  () =>
   selectedDiscounts.some(
    (d) => d.discountKind === "referral_referee" || d.discountKind === "referral_referrer_cash"
   ),
  [selectedDiscounts]
 )

 const needsGroupBatch = useMemo(
  () => selectedDiscounts.some((d) => d.discountKind === "group_class"),
  [selectedDiscounts]
 )

 const loadBasics = useCallback(async () => {
  if (!isSupabaseConfigured) return
  try {
   const [st, disc] = await Promise.all([fetchAllStudents(), fetchPaymentFormDiscounts()])
   setStudents(st)
   setDiscounts(disc)
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentsPageView.loadBasics", setErr: setFormErr })
  }
 }, [])

 useEffect(() => {
  void loadBasics()
 }, [loadBasics])

 useEffect(() => {
  setDiscountIds((prev) => prev.filter((id) => discounts.some((d) => d.id === id)))
 }, [discounts])

 const prefStudentId = searchParams.get("studentId")?.trim() ?? ""

 useEffect(() => {
  const tab = searchParams.get("tab")
  if (tab === "receive" || tab === "invoice" || tab === "history") {
   setMainTab(tab)
  }
  const hs = searchParams.get("histStatus")
  if (hs === "all" || hs === "received" || hs === "pending" || hs === "pendingPay") {
   setHistStatus(hs)
  }
 }, [searchParams])

 useEffect(() => {
  if (!prefStudentId || students.length === 0) return
  const found = students.find((s) => s.id === prefStudentId)
  if (!found) return
  setSelectedStudent(found)
  setStudentQuery("")
  setPickerOpen(false)
  setMainTab("receive")
  setSearchParams(
   (prev) => {
    const next = new URLSearchParams(prev)
    next.delete("studentId")
    return next
   },
   { replace: true }
  )
 }, [prefStudentId, students, setSearchParams])

 const loadEnrollments = useCallback(async (studentId: string) => {
  if (!isSupabaseConfigured) {
   setEnrollments([])
   return
  }
  setEnrollLoading(true)
  try {
   const list = await fetchEnrollmentsForStudent(studentId)
   setEnrollments(list)
   setLines([newLine()])
   setDiscountIds([])
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentsPageView.loadEnrollments", setErr: setFormErr })
   setEnrollments([])
   setLines([])
  } finally {
   setEnrollLoading(false)
  }
 }, [])

 useEffect(() => {
  if (selectedStudent) {
   void loadEnrollments(selectedStudent.id)
   void isStudentNewToMingXue(selectedStudent.id).then(setIsNewStudent).catch(() => setIsNewStudent(null))
   void fetchRelativesForStudent(selectedStudent.id).then(setRelatives).catch(() => setRelatives([]))
  } else {
   setEnrollments([])
   setLines([])
   setDiscountIds([])
   setIsNewStudent(null)
   setRelatives([])
   setReferrerStudentId("")
   setSiblingExtraLessons("")
   setBatchMemberCount("")
  }
 }, [selectedStudent, loadEnrollments])

 const loadHistory = useCallback(async () => {
  if (!isSupabaseConfigured) {
   setHistoryRows([])
   setHistLoading(false)
   return
  }
  setHistLoading(true)
  setHistErr(null)
  try {
   const rows = await fetchPaymentsList({
    status: histStatus,
    fromYmd: histFrom || undefined,
    toYmd: histTo || undefined,
    search: histSearch || undefined,
    limit: 500,
   })
   setHistoryRows(rows)
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentsPageView.loadHistory", setErr: setHistErr })
   setHistoryRows([])
  } finally {
   setHistLoading(false)
  }
 }, [histStatus, histFrom, histTo, histSearch])

 useEffect(() => {
  if (mainTab === "history") void loadHistory()
 }, [mainTab, loadHistory])

 const historyRowsDisplayed = useMemo(() => {
  const pick = selectedYearLabel
  return historyRows.filter((r) => academicYearLabelFromStartDate(r.paymentDate) === pick)
 }, [historyRows, selectedYearLabel])

 const academicYearOptions = useMemo(() => {
 const years = [...new Set(historyRows.map((r) => academicYearLabelFromStartDate(r.paymentDate)))]
 return years.sort((a, b) => b.localeCompare(a))
}, [historyRows])

 const filteredStudents = useMemo(() => {
  const q = studentQuery.trim().toLowerCase()
  if (!q) return students.slice(0, 12)
  return students
   .filter((s) => {
    const hay = `${s.full_name} ${s.student_code ?? ""} ${s.english_name ?? ""}`.toLowerCase()
    return hay.includes(q)
   })
   .slice(0, 20)
 }, [students, studentQuery])

 const updateLine = useCallback(
  (key: string, patch: Partial<Pick<LineRow, "classId" | "lessons" | "amount">>) => {
   setLines((prev) =>
    prev.map((l) => {
     if (l.key !== key) return l
     const next = { ...l, ...patch }
     if (patch.classId !== undefined && !patch.classId) {
      next.lessons = DEFAULT_LESSON_COUNT
      next.amount = ""
      return next
     }
     if (patch.classId !== undefined && patch.classId) {
      if (!next.lessons || next.lessons.trim() === "") {
       next.lessons = DEFAULT_LESSON_COUNT
      }
     }
     if (patch.classId !== undefined || patch.lessons !== undefined) {
      next.amount = lineAmountFor(next.classId, next.lessons, enrollmentByClass)
     }
     return next
    })
   )
  },
  [enrollmentByClass]
 )

 const enrollmentsForLine = useCallback(
  (rowKey: string, currentClassId: string) => {
   const taken = new Set(
    lines.filter((l) => l.key !== rowKey && l.classId).map((l) => l.classId)
   )
   return enrollments.filter((e) => e.classId === currentClassId || !taken.has(e.classId))
  },
  [lines, enrollments]
 )

 const canAddLine = lines.length < enrollments.length

 const addLine = () => {
  if (!canAddLine) return
  setLines((prev) => [...prev, newLine()])
 }

 const toggleDiscount = (id: string) => {
  const avail = discountAvailability.get(id)
  if (avail && !avail.eligible) {
   setFormErr(avail.reason ?? "不符合此優惠資格")
   return
  }
  setDiscountIds((prev) => {
   if (prev.includes(id)) return prev.filter((x) => x !== id)
   const nextIds = [...prev, id]
   const nextSelected = resolveSelectedDiscounts(nextIds, discounts)
   const err = validateDiscountSelection(nextSelected, discounts)
   if (err) {
    setFormErr(err)
    return prev
   }
   setFormErr(null)
   return nextIds
  })
 }

 const buildRemarksForSave = (): string | null => {
  const trimmed = remarks.trim()
  return trimmed.length > 0 ? trimmed : null
 }
 const removeLine = (key: string) =>
  setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)))

 const buildDetailInputs = (): PaymentDetailInput[] => {
  return lines
   .filter((l) => l.classId && Number(l.lessons) > 0)
   .map((l) => {
    const e = enrollmentByClass.get(l.classId)
    const amt = Number(l.amount)
   const desc = e ? formatClassLabel({ subject: e.subject, courseCode: e.courseCode, courseName: e.courseName }) : null
    return {
     classId: l.classId,
     lessonCount: Number(l.lessons),
     amount: Number.isFinite(amt) && amt > 0 ? amt : null,
     description: desc,
    }
   })
 }

 const validateForm = (): string | null => {
  if (!selectedStudent) return "請選擇學生"
  if (enrollLoading) return "載入報讀資料中…"
  if (enrollments.length === 0) return "此學生尚無報讀班別，請先於學生詳情「報讀班別」新增。"
  const details = buildDetailInputs()
  if (details.length === 0) return "請至少新增一筆班別與堂數。"
  if (subtotal <= 0) return "請確認各項金額（可依班別每堂單價 × 堂數自動帶入）。"
  if (needsReferrer && !referrerStudentId.trim()) return "請選擇推薦人（舊生）。"
  if (needsGroupBatch && batchMemberCountN < 3) return "自組同班優惠需填寫聯合收費人數（至少 3 人）。"
  if (needsGroupBatch && !batchSharedClassId) return "自組同班優惠需所有明細為同一班別。"
  return null
 }

 const buildPaymentExtras = () => ({
  paymentDateForDiscounts: payDate,
  academicYearForDiscounts: paymentAcademicYear,
  siblingExtraLessons: siblingExtraN,
  isNewStudent: isNewStudent ?? undefined,
  batchMemberCount: needsGroupBatch ? batchMemberCountN : undefined,
  batchSharedClassId: needsGroupBatch ? batchSharedClassId : null,
  referrerStudentId: needsReferrer ? referrerStudentId.trim() : null,
  createReferralRecord: needsReferrer && Boolean(referrerStudentId.trim()),
  createPaymentBatchIfNeeded: needsGroupBatch,
 })

 const submitReceive = async () => {
  const err = validateForm()
  if (err) {
   setFormErr(err)
   return
  }
  setSaving(true)
  setFormErr(null)
  setFormOk(null)
  try {
   const id = await insertPaymentRecord({
    studentId: selectedStudent!.id,
    paymentDate: payDate,
    subtotalAmount: subtotal,
    totalAmount: totalDue,
    paymentMethod: method,
    status: PAYMENT_STATUS.received,
    remarks: buildRemarksForSave(),
    receiptKind: "RC",
    discountIds,
    details: buildDetailInputs(),
    ...buildPaymentExtras(),
   })
   if (printAfterReceive) {
    const full = await fetchPaymentFull(id)
    if (full && !printPayment(full, "receipt")) {
     setFormErr("請允許開啟彈出視窗以列印。")
    }
   }
   setRemarks("")
   setDiscountIds([])
   if (selectedStudent) void loadEnrollments(selectedStudent.id)
   setFormOk("已登記收款。")
   window.setTimeout(() => setFormOk(null), 5000)
   void loadHistory()
   void loadDashboardStats()
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentsPageView.submitReceive", setErr: setFormErr })
  } finally {
   setSaving(false)
  }
 }

 const submitInvoice = async () => {
  const err = validateForm()
  if (err) {
   setFormErr(err)
   return
  }
  setSaving(true)
  setFormErr(null)
  setFormOk(null)
  try {
   const id = await insertPaymentRecord({
    studentId: selectedStudent!.id,
    paymentDate: payDate,
    subtotalAmount: subtotal,
    totalAmount: totalDue,
    paymentMethod: method,
    status: invoiceStatus,
    remarks: buildRemarksForSave(),
    receiptKind: "INV",
    discountIds,
    details: buildDetailInputs(),
    ...buildPaymentExtras(),
   })
   if (printAfterInvoice) {
    const full = await fetchPaymentFull(id)
    if (full && !printPayment(full, "invoice")) {
     setFormErr("請允許開啟彈出視窗以列印。")
    }
   }
   setRemarks("")
   setDiscountIds([])
   if (selectedStudent) void loadEnrollments(selectedStudent.id)
   setFormOk("已建立待繳／通知單。")
   window.setTimeout(() => setFormOk(null), 5000)
   void loadHistory()
   void loadDashboardStats()
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentsPageView.submitInvoice", setErr: setFormErr })
  } finally {
   setSaving(false)
  }
 }

 const openDetail = async (row: PaymentListRow) => {
  setDetailOpen(true)
  setDetailLoading(true)
  setDetailPay(null)
  try {
   setDetailPay(await fetchPaymentFull(row.id))
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentsPageView.openDetail", setErr: setFormErr })
   setDetailOpen(false)
  } finally {
   setDetailLoading(false)
  }
 }

 const openMarkReceived = (row: PaymentListRow) => {
  setMarkTarget(row)
  setMarkMethod(PAYMENT_METHOD_PRESETS[0] ?? "現金")
  setMarkOpen(true)
 }

 const confirmMarkReceived = async () => {
  if (!markTarget) return
  setSaving(true)
  try {
   await markPaymentReceived(markTarget.id, { paymentMethod: markMethod })
   setMarkOpen(false)
   setMarkTarget(null)
   void loadHistory()
   void loadDashboardStats()
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentsPageView.confirmMarkReceived", setErr: setFormErr })
  } finally {
   setSaving(false)
  }
 }

 const onDeleteRow = async (row: PaymentListRow) => {
 if (
  !(await confirmDialog({
   title: "刪除單據",
   description: `確定刪除單據「${row.receiptNumber ?? row.id.slice(0, 8)}」？`,
   confirmText: "確認刪除",
   tone: "destructive",
  }))
 )
  return
  try {
   await deletePaymentRecord(row.id)
   void loadHistory()
   void loadDashboardStats()
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentsPageView.onDeleteRow", setErr: setFormErr })
  }
 }

 const statusBadge = (status: string) => (
  <Tag tone={statusToTagTone(status)} size="sm">
   {status}
  </Tag>
 )

 const enrollmentLabel = (e: EnrollmentWithClass) => {
  const bits = [e.subject, e.courseCode, e.dayOfWeek, e.timeSlot].filter(Boolean)
  return bits.join(" · ")
 }

 return (
  <div className="space-y-6 p-4 md:p-6">
   <header className="flex flex-wrap items-end justify-between gap-4">
    <div>
     <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
      <Wallet className="h-8 w-8 text-warning" aria-hidden />
      繳費記錄
     </h1>
     <p className="mt-1 text-sm text-muted-foreground">
      登記收款與出單；班別僅限該生已報讀項目。單據編號由系統自動產生。
     </p>
    </div>
   </header>

   {formErr ? (
    <div
     role="alert"
     tabIndex={-1}
     className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
    >
     {formErr}
    </div>
   ) : null}
   {formOk ? (
    <div
     role="status"
    className="rounded-md border border-success bg-success px-3 py-2 text-sm text-success-foreground"
    >
     {formOk}
    </div>
   ) : null}

   {!isSupabaseConfigured ? (
    <div role="alert" className="rounded-lg border border-warning/50 bg-warning/10 px-3 py-2 text-sm text-warning">
     請設定 <code className="rounded bg-muted px-1">.env</code> 內 Supabase 後重啟 dev。
    </div>
   ) : null}

   {isSupabaseConfigured ? (
    <div className="grid gap-3 sm:grid-cols-2">
     <div className="flex gap-3 rounded-xl border border-warning/80 bg-gradient-to-br from-orange-50 to-amber-50 p-4 shadow-sm dark:border-warning/50 dark:from-orange-950/40 dark:to-amber-950/30">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-warning text-white shadow">
       <BookOpen className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0">
       <div className="text-xs font-medium uppercase tracking-wide text-warning/80 dark:text-warning/80">
        學生總交堂數
       </div>
       <div className="mt-1 text-2xl font-bold tabular-nums text-warning dark:text-warning">
        {dashLoading ? "…" : (dashStats?.totalPaidLessons ?? "—")}
       </div>
       <p className="mt-0.5 text-xs text-warning/70 dark:text-warning/70">
        已收款繳費單 · 明細堂數加總
       </p>
      </div>
     </div>
     <div className="flex gap-3 rounded-xl border border-success/80 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm dark:border-success/50 dark:from-emerald-950/40 dark:to-teal-950/30">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-success text-white shadow">
       <ClipboardCheck className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0">
       <div className="text-xs font-medium uppercase tracking-wide text-success/80 dark:text-success/80">
        學生總上堂數
       </div>
       <div className="mt-1 text-2xl font-bold tabular-nums text-success dark:text-success">
        {dashLoading ? "…" : (dashStats?.totalAttendedLessons ?? "—")}
       </div>
       <p className="mt-0.5 text-xs text-success/70 dark:text-success/70">
        出席紀錄中計為「出席」之堂次（全庫）
       </p>
      </div>
     </div>
    </div>
   ) : null}

   <div className="flex flex-wrap gap-2">
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
    {(
     [
      ["receive", "收款登記", Banknote],
      ["invoice", "出單（待繳）", FileText],
      ["history", "紀錄查詢", History],
     ] as const
    ).map(([key, label, Icon]) => (
     <button
      key={key}
      type="button"
      onClick={() => setMainTab(key)}
      className={cn(
       "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
       mainTab === key
        ? "border-warning bg-warning text-white"
        : "border-border bg-card hover:bg-muted/60"
      )}
     >
      <Icon className="h-4 w-4" aria-hidden />
      {label}
     </button>
    ))}
   </div>

   {mainTab !== "history" ? (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
     <div className="space-y-5 rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold">
       {mainTab === "receive" ? "登記已收款項" : "建立繳費通知（待繳）"}
      </h2>

      <FormField label="學生 *">
       <div className="relative">
        <Input
         placeholder="輸入姓名或學號搜尋…"
         value={
          selectedStudent
           ? `${selectedStudent.full_name}${selectedStudent.student_code ? `（${selectedStudent.student_code}）` : ""}`
           : studentQuery
         }
         onChange={(e) => {
          setSelectedStudent(null)
          setStudentQuery(e.target.value)
          setPickerOpen(true)
         }}
         onFocus={() => setPickerOpen(true)}
        />
        {pickerOpen && !selectedStudent && studentQuery.trim() ? (
         <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover shadow-md">
          {filteredStudents.length === 0 ? (
           <div className="px-3 py-2 text-sm text-muted-foreground">找不到學生</div>
          ) : (
           filteredStudents.map((s) => (
            <button
             key={s.id}
             type="button"
             className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted"
             onClick={() => {
              setSelectedStudent(s)
              setStudentQuery("")
              setPickerOpen(false)
             }}
            >
             <span className="font-medium">{s.full_name}</span>
             {s.student_code ? (
              <span className="text-xs text-muted-foreground">學號 {s.student_code}</span>
             ) : null}
            </button>
           ))
          )}
         </div>
        ) : null}
       </div>
       {selectedStudent ? (
        <button
         type="button"
         className="mt-1 text-xs text-primary underline-offset-4 hover:underline"
         onClick={() => {
          setSelectedStudent(null)
          setStudentQuery("")
         }}
        >
         清除選取
        </button>
       ) : null}
      </FormField>

      {selectedStudent ? (
       enrollLoading ? (
        <p className="text-sm text-muted-foreground">載入報讀班別中…</p>
       ) : enrollments.length === 0 ? (
        <div role="alert" className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
         此學生尚無報讀班別，請先到「學生管理 → 該生詳情 → 報讀班別」新增後再繳費。
        </div>
       ) : (
        <div className="space-y-3">
         <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium">收費項目（已報讀班別）</span>
          <Button
           type="button"
           variant="outline"
           size="sm"
           onClick={addLine}
           disabled={!canAddLine}
           title={canAddLine ? undefined : "所有報讀班別皆已加入收費項目"}
          >
           <Plus className="h-4 w-4" />
           新增班別
          </Button>
         </div>
         <ul className="space-y-3">
          {lines.map((row) => (
           <li
            key={row.key}
            className="grid gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-[1fr_100px_120px_auto]"
           >
            <FormField label="班別">
             <Select
              className={selectClassName()}
              value={row.classId}
              onChange={(e) => updateLine(row.key, { classId: e.target.value })}
             >
              <option value="">請選擇</option>
              {enrollmentsForLine(row.key, row.classId).map((e) => (
               <option key={e.classId} value={e.classId}>
                {enrollmentLabel(e)}
               </option>
              ))}
             </Select>
            </FormField>
            <FormField label="堂數 *">
             <Input
              type="number"
              min={1}
              step={1}
              value={row.lessons}
              onChange={(e) => updateLine(row.key, { lessons: e.target.value })}
              placeholder="例如 4"
             />
            </FormField>
            <FormField label="金額（HKD）">
             <Input
              type="number"
              min={0}
              step="0.01"
              value={row.amount}
              onChange={(e) => updateLine(row.key, { amount: e.target.value })}
              placeholder="自動"
             />
            </FormField>
            <div className="flex items-end justify-end sm:col-span-4">
             <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              disabled={lines.length <= 1}
              onClick={() => removeLine(row.key)}
              aria-label="移除此列"
             >
              <Trash2 className="h-4 w-4" />
             </Button>
            </div>
           </li>
          ))}
         </ul>
        </div>
       )
      ) : null}

      {selectedStudent && paymentEligibilityCtx.tierTotalLessons > paymentEligibilityCtx.totalLessons ? (
       <p className="text-xs text-muted-foreground">
        階梯計算堂數：{paymentEligibilityCtx.tierTotalLessons} 堂（含兄弟姊妹合計{" "}
        {paymentEligibilityCtx.tierTotalLessons - paymentEligibilityCtx.totalLessons} 堂）
       </p>
      ) : paymentEligibilityCtx.totalLessons > 0 ? (
       <p className="text-xs text-muted-foreground">
        本次堂數：{paymentEligibilityCtx.totalLessons} 堂
        {isNewStudent === true ? " · 新生" : isNewStudent === false ? " · 舊生" : null}
       </p>
      ) : null}

      {selectedStudent && relatives.length > 0 ? (
       <FormField label="兄弟姊妹合計堂數（階梯優惠）">
        <Input
         type="number"
         min={0}
         step={1}
         value={siblingExtraLessons}
         onChange={(e) => setSiblingExtraLessons(e.target.value)}
         placeholder="0"
        />
        <p className="mt-1 text-xs text-muted-foreground">
         已登記親屬：
         {relatives.map((r) => `${r.relatedName}（${r.relationship}）`).join("、")}
         。請填入姊妹等同日一併報讀的額外堂數。
        </p>
       </FormField>
      ) : null}

      {needsGroupBatch ? (
       <FormField label="聯合收費人數（含本學生，至少 3 人）">
        <Input
         type="number"
         min={3}
         step={1}
         value={batchMemberCount}
         onChange={(e) => setBatchMemberCount(e.target.value)}
         placeholder="3"
        />
        <p className="mt-1 text-xs text-muted-foreground">
         自組同班優惠需 ≥3 人同一班、兩期全報且同時付款。請確認所有明細為同一班別。
        </p>
       </FormField>
      ) : null}

      {needsReferrer ? (
       <FormField label="推薦人（舊生）*">
        <select
         className={selectClassName()}
         value={referrerStudentId}
         onChange={(e) => setReferrerStudentId(e.target.value)}
        >
         <option value="">— 請選擇 —</option>
         {students
          .filter((s) => s.id !== selectedStudent?.id)
          .map((s) => (
           <option key={s.id} value={s.id}>
            {s.full_name}
            {s.student_code ? ` (${s.student_code})` : ""}
           </option>
          ))}
        </select>
        {isNewStudent === false ? (
         <p className="mt-1 text-xs text-destructive">此學生非新生，不符合被推薦優惠。</p>
        ) : null}
       </FormField>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
       <FormField label="優惠（可多選）">
        <div
         className={cn(
          "max-h-40 space-y-2 overflow-y-auto rounded-md border border-input bg-background p-3",
          (!selectedStudent || enrollments.length === 0) && "opacity-60"
         )}
        >
         {discounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚無啟用中的優惠。</p>
         ) : (
          discounts.map((d) => {
           const avail = discountAvailability.get(d.id)
           const eligibilityBlocked = avail != null && !avail.eligible
           const stackBlocked =
            !eligibilityBlocked &&
            isDiscountCheckboxDisabled(d, discountIds, discounts)
           const checkboxDisabled =
            !selectedStudent ||
            enrollments.length === 0 ||
            eligibilityBlocked ||
            stackBlocked
           return (
            <div key={d.id} className="space-y-0.5">
             <label
              className={cn(
               "flex items-center gap-2 text-sm",
               checkboxDisabled && !discountIds.includes(d.id)
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer"
              )}
             >
              <input
               type="checkbox"
               className="h-4 w-4 rounded border-input"
               checked={discountIds.includes(d.id)}
               disabled={checkboxDisabled}
               onChange={() => toggleDiscount(d.id)}
              />
              {discountOptionLabel(d, avail?.resolvedAmountOff)}
             </label>
             {eligibilityBlocked && avail?.reason ? (
              <p className="pl-6 text-xs text-muted-foreground">{avail.reason}</p>
             ) : null}
             {stackBlocked && !eligibilityBlocked ? (
              <p className="pl-6 text-xs text-muted-foreground">
               {maxStackCount != null && discountIds.length >= maxStackCount
                ? `每單最多 ${maxStackCount} 項優惠`
                : "與已選優惠互斥或不可疊加"}
              </p>
             ) : null}
            </div>
           )
          })
         )}
        </div>
        <p className="text-xs text-muted-foreground">
         優惠由外星人於「優惠折扣」維護；依目錄排序套用（各項先百分比減免，再減固定金額）。
         {maxStackCount != null ? ` 每單最多 ${maxStackCount} 項。` : null}
        </p>
       </FormField>
       <FormField label="日期 *">
        <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
        {!payDateEditable ? (
         <p className="mt-1 text-xs text-amber-800">{academicYearEditBlockedMessage()}</p>
        ) : null}
       </FormField>
      </div>

      <div className="rounded-lg border border-dashed border-border bg-muted/15 px-3 py-3 text-sm">
       <div className="flex justify-between gap-2">
        <span className="text-muted-foreground">項目小計</span>
        <span className="tabular-nums font-medium">{money(subtotal)}</span>
       </div>
       {selectedDiscounts.length > 0 ? (
        <div className="mt-1 space-y-1 text-muted-foreground">
         {selectedDiscounts.map((d, idx) => {
          const step = discountStepsPreview[idx]
          const avail = discountAvailability.get(d.id)
          return (
           <div key={d.id} className="flex justify-between gap-2">
            <span>優惠：{discountOptionLabel(d, avail?.resolvedAmountOff)}</span>
            <span className="tabular-nums text-warning">
             {step && step.amountDeducted > 0 ? `-${money(step.amountDeducted)}` : "（僅註記）"}
            </span>
           </div>
          )
         })}
        </div>
       ) : null}
       <div className="mt-2 flex justify-between gap-2 border-t border-border pt-2 text-base font-semibold">
        <span>應繳總額</span>
        <span className="tabular-nums text-warning dark:text-warning">{money(totalDue)}</span>
       </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
       <FormField label="繳費方式">
        <Select className={selectClassName()} value={method} onChange={(e) => setMethod(e.target.value)}>
         {PAYMENT_METHOD_PRESETS.map((m) => (
          <option key={m} value={m}>
           {m}
          </option>
         ))}
        </Select>
       </FormField>
       {mainTab === "invoice" ? (
        <FormField label="帳款狀態">
         <Select
          className={selectClassName()}
          value={invoiceStatus}
          onChange={(e) => setInvoiceStatus(e.target.value)}
         >
          <option value={PAYMENT_STATUS.pendingReceive}>{PAYMENT_STATUS.pendingReceive}</option>
          <option value={PAYMENT_STATUS.pendingPay}>{PAYMENT_STATUS.pendingPay}</option>
         </Select>
        </FormField>
       ) : (
        <FormField label="帳款狀態">
         <Input readOnly value={PAYMENT_STATUS.received} className="bg-muted/40" />
        </FormField>
       )}
      </div>

      <FormField label="備註">
       <Textarea
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        rows={2}
        placeholder="內部備註等"
       />
      </FormField>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
       <input
        type="checkbox"
        checked={mainTab === "receive" ? printAfterReceive : printAfterInvoice}
        onChange={(e) =>
         mainTab === "receive"
          ? setPrintAfterReceive(e.target.checked)
          : setPrintAfterInvoice(e.target.checked)
        }
       />
       {mainTab === "receive" ? "建立後開啟列印（收據）" : "建立後開啟列印（通知單）"}
      </label>

      <Button
       type="button"
       className="w-full bg-warning text-white hover:bg-warning sm:w-auto"
       disabled={!isSupabaseConfigured || saving || !payDateEditable}
       onClick={() => void (mainTab === "receive" ? submitReceive() : submitInvoice())}
      >
       {mainTab === "receive" ? "確認登記收款" : "建立通知單"}
      </Button>
     </div>

    <aside className="space-y-3 rounded-xl border border-warning/60 bg-warning p-4 text-sm text-warning-foreground dark:border-warning/40 dark:bg-warning/80 dark:text-warning-foreground">
     <p className="font-medium text-warning-foreground dark:text-warning-foreground">小提示</p>
     <ul className="list-inside list-disc space-y-2 text-warning-foreground/90 dark:text-warning-foreground/90">
       <li>班別僅顯示該生「報讀中」班級；堂數預設 4 堂，金額依每堂單價自動計算（可再手改）。</li>
       <li>同一張單據可收多班費用，但每個班別只能選一次。</li>
       <li>優惠可複選，依目錄排序套用百分比與固定減免；互斥群組與疊加上限依設定自動限制。</li>
       <li>單據編號由系統自動產生，無法手動輸入。</li>
       <li>優惠選項由外星人在側欄「優惠折扣」設定。</li>
      </ul>
     </aside>
    </div>
   ) : (
    <div className="space-y-4">
     <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <FormField label="狀態">
       <Select
        className={cn(selectClassName(), "min-w-[140px]")}
        value={histStatus}
        onChange={(e) => setHistStatus(e.target.value as typeof histStatus)}
       >
        <option value="all">全部</option>
        <option value="received">已收款</option>
        <option value="pending">待繳／待收款</option>
        <option value="pendingPay">待繳費（出單）</option>
       </Select>
      </FormField>
      <FormField label="起日">
       <Input type="date" value={histFrom} onChange={(e) => setHistFrom(e.target.value)} className="w-[160px]" />
      </FormField>
      <FormField label="迄日">
       <Input type="date" value={histTo} onChange={(e) => setHistTo(e.target.value)} className="w-[160px]" />
      </FormField>
      <FormField label="搜尋">
       <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
         className="pl-8"
         placeholder="學生、學號、單號…"
         value={histSearch}
         onChange={(e) => setHistSearch(e.target.value)}
        />
       </div>
      </FormField>
      <Button
       type="button"
       variant="secondary"
       className="shrink-0"
       disabled={!isSupabaseConfigured}
       onClick={() => void loadHistory()}
      >
       套用篩選
      </Button>
     </div>

     {histErr ? (
      <div
       role="alert"
       tabIndex={-1}
       className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
      >
       {histErr}
      </div>
     ) : null}

     {histLoading ? (
      <p className="text-sm text-muted-foreground">載入中…</p>
     ) : historyRowsDisplayed.length === 0 ? (
      <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
       沒有符合條件的紀錄。
      </div>
     ) : (
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
       <table className="w-full min-w-[860px] table-fixed border-collapse text-left text-sm">
        <thead className="border-b bg-muted/40">
         <tr>
          <th className="w-[11%] px-3 py-2 font-medium">日期</th>
          <th className="w-[13%] px-3 py-2 font-medium">單號</th>
          <th className="w-[18%] px-3 py-2 font-medium">學生</th>
          <th className="w-[12%] px-3 py-2 font-medium">優惠</th>
          <th className="w-[11%] px-3 py-2 font-medium text-right">金額</th>
          <th className="w-[10%] px-3 py-2 font-medium">方式</th>
          <th className="w-[13%] px-3 py-2 font-medium">狀態</th>
          <th className="w-[12%] px-3 py-2 font-medium">操作</th>
         </tr>
        </thead>
        <tbody>
         {historyRowsDisplayed.map((r) => {
          const pending = PENDING_PAYMENT_STATUSES.includes(
           r.status as (typeof PENDING_PAYMENT_STATUSES)[number]
          )
          const rowEditable = canEditAcademicYearForDate(r.paymentDate)
          return (
           <tr key={r.id} className="border-b border-border/80 last:border-0">
            <td className="px-3 py-2 whitespace-nowrap">{r.paymentDate}</td>
            <td className="px-3 py-2 font-mono text-xs">{r.receiptNumber ?? "—"}</td>
            <td className="px-3 py-2">
             <Link className="text-primary hover:underline" to={`/Students/${r.studentId}`}>
              {r.studentName}
             </Link>
             {r.studentCode ? (
              <span className="ml-1 text-xs text-muted-foreground">({r.studentCode})</span>
             ) : null}
            </td>
            <td className="max-w-[140px] truncate px-3 py-2 text-muted-foreground">
             {r.discountName ?? "—"}
            </td>
            <td className="px-3 py-2 text-right tabular-nums">{money(r.totalAmount)}</td>
            <td className="px-3 py-2">{r.paymentMethod ?? "—"}</td>
            <td className="px-3 py-2">{statusBadge(r.status)}</td>
            <td className="px-3 py-2">
             <div className="flex flex-wrap gap-1">
              <Button type="button" variant="outline" size="sm" onClick={() => void openDetail(r)}>
               詳情
              </Button>
              <Button
               type="button"
               variant="outline"
               size="sm"
               onClick={async () => {
                try {
                 const full = await fetchPaymentFull(r.id)
                 if (full && !printPaymentForStatus(full, r.status, PENDING_PAYMENT_STATUSES)) {
                  setFormErr("請允許開啟彈出視窗以列印。")
                 }
                } catch (e) {
                 reportUserFacingError(e, {
                  source: "PaymentsPageView.printFromHistory",
                  setErr: setFormErr,
                 })
                }
               }}
              >
               <Printer className="h-3.5 w-3.5" />
               列印
              </Button>
              {pending && rowEditable ? (
               <Button type="button" size="sm" onClick={() => openMarkReceived(r)}>
                標記已收
               </Button>
              ) : null}
              {rowEditable ? (
              <Button
               type="button"
               variant="ghost"
               size="sm"
               className="text-destructive hover:text-destructive"
               onClick={() => void onDeleteRow(r)}
              >
               刪除
              </Button>
              ) : null}
             </div>
            </td>
           </tr>
          )
         })}
        </tbody>
       </table>
      </div>
     )}
    </div>
   )}

   <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
     <DialogHeader>
      <DialogTitle>繳費詳情</DialogTitle>
     </DialogHeader>
     {detailLoading ? (
      <p className="text-sm text-muted-foreground">載入中…</p>
     ) : detailPay ? (
      <div className="space-y-3 text-sm">
       <div className="flex justify-between gap-2">
        <span className="text-muted-foreground">單號</span>
        <span className="font-mono text-xs">{detailPay.receiptNumber ?? "—"}</span>
       </div>
       <div className="flex justify-between gap-2">
        <span className="text-muted-foreground">學生</span>
        <Link className="text-primary hover:underline" to={`/Students/${detailPay.studentId}`}>
         {detailPay.studentName}
        </Link>
       </div>
       <div className="flex justify-between gap-2">
        <span className="text-muted-foreground">日期</span>
        <span>{detailPay.paymentDate}</span>
       </div>
       <div className="rounded-md border border-border bg-muted/15 p-3">
        <div className="mb-2 font-medium">金額明細</div>
        <div className="space-y-1.5">
         {buildPaymentAmountBreakdown(detailPay).lines.map((line) => (
          <div key={line.key} className="flex justify-between gap-2">
           <span className={line.tone === "deduction" ? "text-warning" : "text-muted-foreground"}>
            {line.label}
           </span>
           <span
            className={cn(
             "tabular-nums",
             line.tone === "total" && "font-semibold text-foreground",
             line.tone === "deduction" && "text-warning"
            )}
           >
            {line.tone === "deduction" ? `-${money(Math.abs(line.amount))}` : money(line.amount)}
           </span>
          </div>
         ))}
        </div>
       </div>
       <div className="flex justify-between gap-2">
        <span className="text-muted-foreground">方式</span>
        <span>{detailPay.paymentMethod ?? "—"}</span>
       </div>
       <div className="flex justify-between gap-2">
        <span className="text-muted-foreground">狀態</span>
        {statusBadge(detailPay.status)}
       </div>
       {detailPay.remarks ? (
        <div>
         <div className="text-muted-foreground">備註</div>
         <p className="mt-1 whitespace-pre-wrap rounded-md bg-muted/40 p-2">{detailPay.remarks}</p>
        </div>
       ) : null}
       {detailPay.details.length > 0 ? (
        <div>
         <div className="mb-1 font-medium">明細</div>
         <ul className="space-y-2 rounded-md border p-2">
          {detailPay.details.map((d) => (
           <li key={d.id} className="text-xs">
            <span className="font-medium">{d.classLabel}</span>
            {d.lessonCount != null ? ` · ${d.lessonCount} 堂` : ""}
            {d.amount != null ? ` · ${money(d.amount)}` : ""}
            {d.description ? ` — ${d.description}` : ""}
           </li>
          ))}
         </ul>
        </div>
       ) : null}
       <div className="flex flex-wrap gap-2 pt-2">
        <Button
         type="button"
         variant="outline"
         size="sm"
         onClick={() => {
          if (!printPaymentForStatus(detailPay, detailPay.status, PENDING_PAYMENT_STATUSES)) {
           setFormErr("請允許開啟彈出視窗以列印。")
          }
         }}
        >
         <Printer className="h-4 w-4" />
         列印
        </Button>
       </div>
      </div>
     ) : null}
    </DialogContent>
   </Dialog>

   <Dialog open={markOpen} onOpenChange={setMarkOpen}>
    <DialogContent className="sm:max-w-md">
     <DialogHeader>
      <DialogTitle>標記為已收款</DialogTitle>
     </DialogHeader>
     {markTarget ? (
      <div className="grid gap-3 text-sm">
       <p>
        將 <strong>{markTarget.studentName}</strong> 的 {money(markTarget.totalAmount)} 標記為已收。收據編號將由系統自動產生。
       </p>
       <FormField label="繳費方式">
        <Select className={selectClassName()} value={markMethod} onChange={(e) => setMarkMethod(e.target.value)}>
         {PAYMENT_METHOD_PRESETS.map((m) => (
          <option key={m} value={m}>
           {m}
          </option>
         ))}
        </Select>
       </FormField>
       <Button
        type="button"
        className="bg-success text-white hover:bg-success"
       disabled={saving}
        onClick={() => void confirmMarkReceived()}
       >
        確認
       </Button>
      </div>
     ) : null}
    </DialogContent>
   </Dialog>
  </div>
 )
}
