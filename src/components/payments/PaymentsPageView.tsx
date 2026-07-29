import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Banknote, BookOpen, ClipboardCheck, FileText, History, MessageCircle, Plus, Printer, Trash2, Wallet } from "lucide-react"

import {
 DEFAULT_LESSON_COUNT,
 DEFAULT_TRIAL_LESSON_COUNT,
 FormField,
 SectionCard,
 TRIAL_SELECT_VALUE,
 TrialClassPicker,
 classRecordToPriceInfo,
 discountOptionLabel,
 enrollmentLabel,
 formatStudentPhone,
 lineAmountFor,
 money,
 newLine,
 selectClassName,
 statusBadge,
 type ClassPriceInfo,
 type LineRow,
 type TrialPayType,
} from "@/components/payments/paymentsUi"
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
import { academicYearLabelFromStartDate } from "@/lib/courseCode"
import { useAppBanner } from "@/lib/appBanner"
import { openNextTuitionReminder } from "@/lib/tuitionPaymentReminder"
import {
 academicYearEditBlockedMessage,
 canEditAcademicYearForDate,
} from "@/lib/academicYearEditGuard"
import { formatClassLabel } from "@/lib/courseLabel"
import {
 normalizeSpecialDiscountAmount,
 SPECIAL_DISCOUNT_LABEL,
} from "@/lib/paymentSpecialDiscount"
import { buildPaymentAmountBreakdown, computeDiscountApplicationsForSave } from "@/lib/paymentAmountBreakdown"
import {
 buildPaymentEligibilityContext,
 evaluateDiscountAvailability,
} from "@/lib/paymentDiscountEligibility"
import { summarizePaymentDiscountForAdmin } from "@/lib/paymentDiscountAdminSummary"
import {
 buildPaymentReceiptDocumentHtmlAsync,
 printPayment,
} from "@/lib/paymentPrint"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSuperAdmin } from "@/lib/mgmtRole"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import {
 PAYMENT_METHOD_PRESETS,
 PAYMENT_STATUS,
 fetchPaymentFull,
 fetchRecentPaymentsForStudent,
 fetchTotalAttendedLessonsForStudent,
 fetchTotalPaidLessonsForStudent,
 insertPaymentRecord,
 type PaymentDetailInput,
 type PaymentFull,
 type PaymentListRow,
} from "@/services/paymentQueries"
import {
 applyDiscountsToSubtotal,
 applyFixedDiscountAmount,
 fetchPaymentFormDiscounts,
 getGlobalMaxStackCount,
 isDiscountCheckboxDisabled,
 resolveSelectedDiscounts,
 validateDiscountSelection,
 type PaymentDiscountRow,
} from "@/services/paymentDiscountQueries"
import { fetchAllClasses } from "@/services/classQueries"
import {
 fetchAllStudents,
 fetchEnrollmentsForStudent,
 type EnrollmentWithClass,
 type StudentRecord,
} from "@/services/studentQueries"
import { fetchRelativesForStudent, type StudentRelativeRow } from "@/services/studentRelationshipQueries"
import { isStudentNewToMingXue } from "@/services/referralQueries"

type CollectMode = "receive" | "invoice"

export function PaymentsPageView() {
 const { pushBanner } = useAppBanner()
 const [searchParams, setSearchParams] = useSearchParams()
 const [collectMode, setCollectMode] = useState<CollectMode>("receive")

 const [students, setStudents] = useState<StudentRecord[]>([])
 const [studentQuery, setStudentQuery] = useState("")
 const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null)
 const [pickerOpen, setPickerOpen] = useState(false)

 const [enrollments, setEnrollments] = useState<EnrollmentWithClass[]>([])
 const [enrollLoading, setEnrollLoading] = useState(false)
 const [trialClasses, setTrialClasses] = useState<ClassPriceInfo[]>([])
 const [trialClassesLoading, setTrialClassesLoading] = useState(false)
 const [lines, setLines] = useState<LineRow[]>([])

 const [discounts, setDiscounts] = useState<PaymentDiscountRow[]>([])
 const [discountIds, setDiscountIds] = useState<string[]>([])
 const [specialDiscountEnabled, setSpecialDiscountEnabled] = useState(false)
 const [specialDiscountAmount, setSpecialDiscountAmount] = useState("")
 const [siblingExtraLessons, setSiblingExtraLessons] = useState("")
 const [isNewStudent, setIsNewStudent] = useState<boolean | null>(null)
 const [relatives, setRelatives] = useState<StudentRelativeRow[]>([])
 const [referrerStudentId, setReferrerStudentId] = useState("")
 const [batchMemberCount, setBatchMemberCount] = useState("")

 const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10))
 const [method, setMethod] = useState<string>(PAYMENT_METHOD_PRESETS[0] ?? "現金")
 const [remarks, setRemarks] = useState("")
 const [printAfterReceive, setPrintAfterReceive] = useState(false)
 const [printAfterInvoice, setPrintAfterInvoice] = useState(true)
 const [saving, setSaving] = useState(false)
 const [discountHelpOpen, setDiscountHelpOpen] = useState(false)
 const [receiptPreview, setReceiptPreview] = useState<PaymentFull | null>(null)
 const [receiptPreviewHtml, setReceiptPreviewHtml] = useState<string | null>(null)
 const [receiptPrintHint, setReceiptPrintHint] = useState<string | null>(null)
 const [receivedDone, setReceivedDone] = useState<{
  paymentId: string
  amount: number
  studentId: string
  studentName: string
  kind: "receive" | "invoice"
 } | null>(null)

 const [studentCtxLoading, setStudentCtxLoading] = useState(false)
 const [recentPayments, setRecentPayments] = useState<PaymentListRow[]>([])
 const [paidLessons, setPaidLessons] = useState<number | null>(null)
 const [attendedLessons, setAttendedLessons] = useState<number | null>(null)

 const [formErr, setFormErr] = useState<string | null>(null)
 const payDateEditable = useMemo(() => canEditAcademicYearForDate(payDate), [payDate])

 const enrollmentByClass = useMemo(() => {
  const m = new Map<string, EnrollmentWithClass>()
  for (const e of enrollments) m.set(e.classId, e)
  return m
 }, [enrollments])

 const trialClassById = useMemo(() => {
  const m = new Map<string, ClassPriceInfo>()
  for (const c of trialClasses) m.set(c.id, c)
  return m
 }, [trialClasses])

 useEffect(() => {
  if (!isSupabaseConfigured) {
   setTrialClasses([])
   return
  }
  let cancelled = false
  setTrialClassesLoading(true)
  void fetchAllClasses()
   .then((list) => {
    if (cancelled) return
    setTrialClasses(list.map(classRecordToPriceInfo))
   })
   .catch((e) => {
    if (!cancelled) {
     reportUserFacingError(e, { source: "PaymentsPageView.loadTrialClasses", setErr: setFormErr })
     setTrialClasses([])
    }
   })
   .finally(() => {
    if (!cancelled) setTrialClassesLoading(false)
   })
  return () => {
   cancelled = true
  }
 }, [])

 const subtotal = useMemo(() => {
  let s = 0
  for (const l of lines) {
   const a = Number(l.amount)
   if (Number.isFinite(a) && a > 0) s += a
  }
  return Math.round(s * 100) / 100
 }, [lines])

 const paymentAcademicYear = useMemo(() => academicYearLabelFromStartDate(payDate), [payDate])

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
     if (e) {
      return {
       subjectCode: e.subjectCode,
       subjectCategory: e.subjectCategory,
       enrollmentPeriod: e.enrollmentPeriod,
       courseMode: e.courseMode,
       teacherId: e.teacherId,
       timeSlot: e.timeSlot,
       dayOfWeek: e.dayOfWeek,
      }
     }
     const t = trialClassById.get(classId)
     if (!t) return null
     return {
      subjectCode: t.subjectCode,
      teacherId: t.teacherId,
      timeSlot: t.timeSlot,
      dayOfWeek: t.dayOfWeek,
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
   trialClassById,
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
  setDiscountIds((prev) => prev.filter((id) => discountAvailability.get(id)?.eligible !== false))
 }, [discountAvailability])

 const afterCatalogDue = useMemo(
  () => applyDiscountsToSubtotal(subtotal, selectedDiscounts, paymentEligibilityCtx),
  [subtotal, selectedDiscounts, paymentEligibilityCtx]
 )

 const specialAmountN = useMemo(() => {
  if (!specialDiscountEnabled) return 0
  return normalizeSpecialDiscountAmount(specialDiscountAmount)
 }, [specialDiscountEnabled, specialDiscountAmount])

 const totalDue = useMemo(
  () => applyFixedDiscountAmount(afterCatalogDue, specialAmountN),
  [afterCatalogDue, specialAmountN]
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
  const mode = searchParams.get("mode") ?? searchParams.get("tab")
  if (mode === "receive" || mode === "invoice") {
   setCollectMode(mode)
  }
 }, [searchParams])

 useEffect(() => {
  if (!prefStudentId || students.length === 0) return
  const found = students.find((s) => s.id === prefStudentId)
  if (!found) return
  setSelectedStudent(found)
  setStudentQuery("")
  setPickerOpen(false)
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
   setLines([newLine(list.length > 0 ? "enrollment" : "trial")])
   setDiscountIds([])
   setSpecialDiscountEnabled(false)
   setSpecialDiscountAmount("")
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentsPageView.loadEnrollments", setErr: setFormErr })
   setEnrollments([])
   setLines([newLine("trial")])
  } finally {
   setEnrollLoading(false)
  }
 }, [])

 const loadStudentContext = useCallback(async (studentId: string) => {
  if (!isSupabaseConfigured) {
   setRecentPayments([])
   setPaidLessons(null)
   setAttendedLessons(null)
   return
  }
  setStudentCtxLoading(true)
  try {
   const [recent, paid, attended] = await Promise.all([
    fetchRecentPaymentsForStudent(studentId, 3),
    fetchTotalPaidLessonsForStudent(studentId),
    fetchTotalAttendedLessonsForStudent(studentId),
   ])
   setRecentPayments(recent)
   setPaidLessons(paid)
   setAttendedLessons(attended)
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentsPageView.loadStudentContext", setErr: setFormErr })
   setRecentPayments([])
   setPaidLessons(null)
   setAttendedLessons(null)
  } finally {
   setStudentCtxLoading(false)
  }
 }, [])

 useEffect(() => {
  if (selectedStudent) {
   void loadEnrollments(selectedStudent.id)
   void loadStudentContext(selectedStudent.id)
   void isStudentNewToMingXue(selectedStudent.id).then(setIsNewStudent).catch(() => setIsNewStudent(null))
   void fetchRelativesForStudent(selectedStudent.id).then(setRelatives).catch(() => setRelatives([]))
  } else {
   setEnrollments([])
   setLines([])
   setDiscountIds([])
   setSpecialDiscountEnabled(false)
   setSpecialDiscountAmount("")
   setIsNewStudent(null)
   setRelatives([])
   setReferrerStudentId("")
   setSiblingExtraLessons("")
   setBatchMemberCount("")
   setRecentPayments([])
   setPaidLessons(null)
   setAttendedLessons(null)
  }
 }, [selectedStudent, loadEnrollments, loadStudentContext])

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
  (
   key: string,
   patch: Partial<Pick<LineRow, "kind" | "classId" | "lessons" | "amount" | "trialType">>
  ) => {
   setLines((prev) =>
    prev.map((l) => {
     if (l.key !== key) return l
     const next = { ...l, ...patch }
     if (patch.kind === "trial") {
      next.classId = patch.classId ?? ""
      if (!next.lessons || next.lessons === DEFAULT_LESSON_COUNT) {
       next.lessons = DEFAULT_TRIAL_LESSON_COUNT
      }
     }
     if (patch.kind === "enrollment") {
      next.classId = patch.classId ?? ""
      next.trialType = "原價試堂"
      if (!next.lessons || next.lessons === DEFAULT_TRIAL_LESSON_COUNT) {
       next.lessons = DEFAULT_LESSON_COUNT
      }
     }
     if (patch.classId !== undefined && !patch.classId && patch.kind === undefined) {
      next.lessons = next.kind === "trial" ? DEFAULT_TRIAL_LESSON_COUNT : DEFAULT_LESSON_COUNT
      next.amount = ""
      return next
     }
     if (patch.classId !== undefined && patch.classId) {
      if (!next.lessons || next.lessons.trim() === "") {
       next.lessons = next.kind === "trial" ? DEFAULT_TRIAL_LESSON_COUNT : DEFAULT_LESSON_COUNT
      }
     }
     if (
      patch.classId !== undefined ||
      patch.lessons !== undefined ||
      patch.kind !== undefined ||
      patch.trialType !== undefined
     ) {
      next.amount = lineAmountFor(next.classId, next.lessons, enrollmentByClass, {
       kind: next.kind,
       trialType: next.trialType,
       trialClasses: trialClassById,
      })
     }
     return next
    })
   )
  },
  [enrollmentByClass, trialClassById]
 )

 const enrollmentsForLine = useCallback(
  (rowKey: string, currentClassId: string) => {
   const taken = new Set(
    lines
     .filter((l) => l.key !== rowKey && l.kind === "enrollment" && l.classId)
     .map((l) => l.classId)
   )
   return enrollments.filter((e) => e.classId === currentClassId || !taken.has(e.classId))
  },
  [lines, enrollments]
 )

 const canAddLine = true

 const addLine = () => {
  const taken = new Set(
   lines.filter((l) => l.kind === "enrollment" && l.classId).map((l) => l.classId)
  )
  const nextEnrollment = enrollments.find((e) => !taken.has(e.classId))
  if (nextEnrollment) {
   setLines((prev) => [
    ...prev,
    {
     ...newLine("enrollment"),
     classId: nextEnrollment.classId,
     amount: lineAmountFor(nextEnrollment.classId, DEFAULT_LESSON_COUNT, enrollmentByClass),
    },
   ])
   return
  }
  setLines((prev) => [...prev, newLine("trial")])
 }

 const onLineSelectChange = (rowKey: string, value: string) => {
  if (value === TRIAL_SELECT_VALUE) {
   updateLine(rowKey, { kind: "trial", classId: "", lessons: DEFAULT_TRIAL_LESSON_COUNT })
   return
  }
  updateLine(rowKey, {
   kind: "enrollment",
   classId: value,
   lessons: DEFAULT_LESSON_COUNT,
  })
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
    const amt = Number(l.amount)
    if (l.kind === "trial") {
     const t = trialClassById.get(l.classId)
     const classLabel = t
      ? formatClassLabel({
         subject: t.subject,
         courseCode: t.courseCode,
         courseName: t.courseName,
        })
      : null
     return {
      classId: l.classId,
      lessonCount: Number(l.lessons),
      amount: Number.isFinite(amt) && amt > 0 ? amt : null,
      description: classLabel ? `試堂（${l.trialType}）· ${classLabel}` : `試堂（${l.trialType}）`,
     }
    }
    const e = enrollmentByClass.get(l.classId)
    const desc = e
     ? formatClassLabel({ subject: e.subject, courseCode: e.courseCode, courseName: e.courseName })
     : null
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
  if (enrollLoading || trialClassesLoading) return "載入收費資料中…"
  const details = buildDetailInputs()
  if (details.length === 0) {
   const hasTrialWithoutClass = lines.some((l) => l.kind === "trial" && !l.classId)
   if (hasTrialWithoutClass) return "請為試堂項目選擇班別。"
   return "請至少新增一筆班別與堂數。"
  }
  if (subtotal <= 0) return "請確認各項金額（可依班別每堂單價 × 堂數自動帶入）。"
  if (needsReferrer && !referrerStudentId.trim()) return "請選擇推薦人（舊生）。"
  if (needsGroupBatch && batchMemberCountN < 3) return "自組同班優惠需填寫聯合收費人數（至少 3 人）。"
  if (needsGroupBatch && !batchSharedClassId) return "自組同班優惠需所有明細為同一班別。"
  if (specialDiscountEnabled) {
   if (specialAmountN <= 0) return `請輸入 ${SPECIAL_DISCOUNT_LABEL} 減免定金額。`
   if (specialAmountN > afterCatalogDue + 0.01) {
    return `${SPECIAL_DISCOUNT_LABEL} 不可大於剩餘應收（${money(afterCatalogDue)}）。`
   }
  }
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

 const openReceiptPreview = async (paymentId: string) => {
  setReceiptPrintHint(null)
  try {
   const full = await fetchPaymentFull(paymentId)
   if (!full) {
    setFormErr("找不到單據，無法預覽收據。")
    return
   }
   const html = await buildPaymentReceiptDocumentHtmlAsync(full)
   setReceiptPreview(full)
   setReceiptPreviewHtml(html)
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentsPageView.openReceiptPreview", setErr: setFormErr })
  }
 }

 const printFromPreview = async () => {
  if (!receiptPreview) return
  setReceiptPrintHint(null)
  if (!(await printPayment(receiptPreview, "receipt"))) {
   setReceiptPrintHint("如未開啟列印視窗，請檢查瀏覽器是否阻擋彈出視窗，或再按「列印」重試。")
  }
 }

 const submitReceive = async () => {
  if (saving) return
  const err = validateForm()
  if (err) {
   setFormErr(err)
   return
  }
  setSaving(true)
  setFormErr(null)
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
    specialDiscountAmount: specialAmountN > 0 ? specialAmountN : null,
    details: buildDetailInputs(),
    ...buildPaymentExtras(),
   })
   const full = await fetchPaymentFull(id)
   setReceivedDone({
    paymentId: id,
    amount: totalDue,
    studentId: selectedStudent!.id,
    studentName: selectedStudent!.full_name,
    kind: "receive",
   })
   if (printAfterReceive && full) {
    const html = await buildPaymentReceiptDocumentHtmlAsync(full)
    setReceiptPreview(full)
    setReceiptPreviewHtml(html)
    setReceiptPrintHint(null)
    window.setTimeout(() => {
     void (async () => {
      if (!(await printPayment(full, "receipt"))) {
       setReceiptPrintHint("如未開啟列印視窗，請檢查瀏覽器是否阻擋彈出視窗，或按「列印」重試。")
      }
     })()
    }, 200)
   }
   setRemarks("")
   setDiscountIds([])
   setSpecialDiscountEnabled(false)
   setSpecialDiscountAmount("")
   if (selectedStudent) {
    void loadEnrollments(selectedStudent.id)
    void loadStudentContext(selectedStudent.id)
   }
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentsPageView.submitReceive", setErr: setFormErr })
  } finally {
   setSaving(false)
  }
 }

 const submitInvoice = async () => {
  if (saving) return
  const err = validateForm()
  if (err) {
   setFormErr(err)
   return
  }
  setSaving(true)
  setFormErr(null)
  try {
   const id = await insertPaymentRecord({
    studentId: selectedStudent!.id,
    paymentDate: payDate,
    subtotalAmount: subtotal,
    totalAmount: totalDue,
    paymentMethod: method,
    status: PAYMENT_STATUS.pendingReceive,
    remarks: buildRemarksForSave(),
    receiptKind: "INV",
    discountIds,
    specialDiscountAmount: specialAmountN > 0 ? specialAmountN : null,
    details: buildDetailInputs(),
    ...buildPaymentExtras(),
   })
   const full = await fetchPaymentFull(id)
   setReceivedDone({
    paymentId: id,
    amount: totalDue,
    studentId: selectedStudent!.id,
    studentName: selectedStudent!.full_name,
    kind: "invoice",
   })
   if (printAfterInvoice && full) {
    const html = await buildPaymentReceiptDocumentHtmlAsync(full)
    setReceiptPreview(full)
    setReceiptPreviewHtml(html)
    setReceiptPrintHint(null)
    window.setTimeout(() => {
     void (async () => {
      if (!(await printPayment(full, "invoice"))) {
       setReceiptPrintHint("如未開啟列印視窗，請檢查瀏覽器是否阻擋彈出視窗，或按「列印」重試。")
      }
     })()
    }, 200)
   }
   setRemarks("")
   setDiscountIds([])
   setSpecialDiscountEnabled(false)
   setSpecialDiscountAmount("")
   if (selectedStudent) {
    void loadEnrollments(selectedStudent.id)
    void loadStudentContext(selectedStudent.id)
   }
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentsPageView.submitInvoice", setErr: setFormErr })
  } finally {
   setSaving(false)
  }
 }

 const continueCollect = () => {
  setReceivedDone(null)
  setFormErr(null)
 }

 const renderStudentContextPanel = (sticky: boolean) => (
  <aside className={cn("space-y-4", sticky && "lg:sticky lg:top-4 lg:self-start")}>
   {!selectedStudent ? (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
     請先選擇學生，以顯示上次繳費、已繳堂數與總上堂數。
    </div>
   ) : studentCtxLoading ? (
    <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
     載入學生收款上下文…
    </div>
   ) : (
    <>
     <div className="grid grid-cols-2 gap-2 md:gap-3 lg:grid-cols-1">
      <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm md:p-4">
       <div className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground md:gap-2 md:text-xs">
        <BookOpen className="h-3.5 w-3.5" aria-hidden />
        已繳堂數
       </div>
       <p className="mt-1 text-xl font-bold tabular-nums md:mt-2 md:text-2xl">{paidLessons ?? "—"}</p>
       <p className="mt-1 hidden text-xs text-muted-foreground md:block">已收款單據之堂數加總</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm md:p-4">
       <div className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground md:gap-2 md:text-xs">
        <ClipboardCheck className="h-3.5 w-3.5" aria-hidden />
        總上堂數
       </div>
       <p className="mt-1 text-xl font-bold tabular-nums md:mt-2 md:text-2xl">{attendedLessons ?? "—"}</p>
       <p className="mt-1 hidden text-xs text-muted-foreground md:block">計費出席堂次</p>
      </div>
     </div>
     <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
       <h3 className="text-sm font-semibold">上次繳費</h3>
       <Button type="button" size="sm" variant="ghost" asChild>
        <Link to={`/PaymentHistory?studentId=${encodeURIComponent(selectedStudent.id)}`}>全部紀錄</Link>
       </Button>
      </div>
      {recentPayments.length > 0 ? (
       <ul className="mt-3 space-y-3">
        {recentPayments.map((pay, idx) => (
         <li
          key={pay.id}
          className={cn(
           "space-y-2 text-sm",
           idx > 0 && "border-t border-border pt-3"
          )}
         >
          <div className="flex justify-between gap-2">
           <span className="text-muted-foreground">日期</span>
           <span className="tabular-nums">{pay.paymentDate}</span>
          </div>
          <div className="flex justify-between gap-2">
           <span className="text-muted-foreground">單號</span>
           <span className="font-mono text-xs">{pay.receiptNumber ?? "—"}</span>
          </div>
          <div className="flex justify-between gap-2">
           <span className="text-muted-foreground">金額</span>
           <span className="tabular-nums font-medium">{money(pay.totalAmount)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
           <span className="text-muted-foreground">狀態</span>
           {statusBadge(pay.status)}
          </div>
          <Button
           type="button"
           size="sm"
           variant="outline"
           className="w-full"
           onClick={() => void openReceiptPreview(pay.id)}
          >
           <Printer className="h-3.5 w-3.5" />
           預覽／重印
          </Button>
         </li>
        ))}
       </ul>
      ) : (
       <p className="mt-3 text-sm text-muted-foreground">尚無繳費紀錄。</p>
      )}
     </div>
    </>
   )}
  </aside>
 )

 return (
  <div className="space-y-6 md:p-6">
   <header className="flex flex-wrap items-end justify-between gap-4">
    <div>
     <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
      <Wallet className="h-8 w-8 text-warning" aria-hidden />
      收款登記
     </h1>
     <p className="mt-1 hidden text-sm text-muted-foreground md:block">
      內部行政收款：先確認學生與應收內容，再登記已收款或待收款。下期學費請用文字提醒家長，勿再開收據式待繳費單。
     </p>
    </div>
    <div className="flex flex-wrap gap-2">
     <Button type="button" variant="outline" asChild>
      <Link to="/PaymentHistory">
       <History className="h-4 w-4" />
       繳費紀錄
      </Link>
     </Button>
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

   {receivedDone ? (
    <div
     role="status"
     className="flex flex-col gap-3 rounded-lg border border-success/40 bg-success/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
     <p className="text-sm font-medium text-foreground">
      {receivedDone.kind === "receive" ? "已收款" : "已建立待收款單"} {money(receivedDone.amount)}
      <span className="ml-2 font-normal text-muted-foreground">· {receivedDone.studentName}</span>
     </p>
     <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" onClick={() => void openReceiptPreview(receivedDone.paymentId)}>
       <Printer className="h-4 w-4" />
       {receivedDone.kind === "receive" ? "列印收據" : "列印待收款單"}
      </Button>
      <Button type="button" size="sm" variant="outline" asChild>
       <Link to={`/PaymentHistory?studentId=${encodeURIComponent(receivedDone.studentId)}`}>
        查看繳費紀錄
       </Link>
      </Button>
      <Button type="button" size="sm" variant="outline" asChild>
       <Link to={`/Students/${receivedDone.studentId}`}>返回學生頁</Link>
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={continueCollect}>
       繼續收款
      </Button>
     </div>
    </div>
   ) : null}

   {!isSupabaseConfigured ? (
    <div role="alert" className="rounded-lg border border-warning/50 bg-warning/10 px-3 py-2 text-sm text-warning">
     請設定 <code className="rounded bg-muted px-1">.env</code> 內 Supabase 後重啟 dev。
    </div>
   ) : null}

   <div className="flex flex-wrap gap-2">
    {(
     [
      ["receive", "收款登記", Banknote],
      ["invoice", "待收款", FileText],
     ] as const
    ).map(([key, label, Icon]) => (
     <button
      key={key}
      type="button"
      onClick={() => setCollectMode(key)}
      className={cn(
       "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
       collectMode === key
        ? "border-warning bg-warning text-white"
        : "border-border bg-card hover:bg-muted/60"
      )}
     >
      <Icon className="h-4 w-4" aria-hidden />
      {label}
     </button>
    ))}
   </div>

   <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] lg:gap-0">
    <div className="space-y-5 lg:pr-6">
     <SectionCard title="1. 學生／收款對象" description="確認現在是替哪位學生收款，避免錯收。">
      <FormField label="學生 *">
       <div className="flex min-w-0 items-start gap-2">
        <div className="relative min-w-0 flex-1">
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
               setReceivedDone(null)
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
         <>
          <Button
           type="button"
           variant="outline"
           size="sm"
           className="mt-0.5 shrink-0"
           onClick={() => {
            void openNextTuitionReminder(selectedStudent, {
             classLabels: enrollments
              .map((e) => e.subject || e.courseName || e.courseCode || "")
              .filter(Boolean),
            }).then((result) => {
             if (result === "whatsapp") {
              pushBanner({ tone: "success", title: "已開啟 WhatsApp", message: "請確認預填文字後手動發送。" })
             } else if (result === "wechat") {
              pushBanner({ tone: "success", title: "已複製 WeChat ID", message: "請到 WeChat 貼上學費提醒文字。" })
             } else {
              pushBanner({ tone: "warning", title: "無法開啟通訊", message: "請先確認學生／家長電話或 WeChat。" })
             }
            })
           }}
          >
           <MessageCircle className="h-4 w-4" />
           提醒繳付下期學費
          </Button>
          <Button
           type="button"
           variant="outline"
           size="sm"
           className="mt-0.5 shrink-0"
           onClick={() => {
            setSelectedStudent(null)
            setStudentQuery("")
            setReceivedDone(null)
           }}
          >
           清除選取
          </Button>
         </>
        ) : null}
       </div>
      </FormField>

      {selectedStudent ? (
       <div className="space-y-3 rounded-lg border border-border bg-muted/20 px-3 py-3 text-sm">
        <h3 className="text-sm font-semibold text-foreground">學生詳情</h3>
        <div className="grid gap-2 sm:grid-cols-2">
         <div>
          <p className="text-xs text-muted-foreground">學號</p>
          <p className="font-medium">{selectedStudent.student_code ?? "—"}</p>
         </div>
         <div>
          <p className="text-xs text-muted-foreground">年級</p>
          <p className="font-medium">{selectedStudent.grade ?? "—"}</p>
         </div>
         <div className="sm:col-span-2">
          <p className="text-xs text-muted-foreground">聯絡</p>
          <p className="font-medium">{formatStudentPhone(selectedStudent)}</p>
         </div>
         <div className="sm:col-span-2">
          <p className="text-xs text-muted-foreground">進行中報讀</p>
          {enrollLoading ? (
           <p className="text-muted-foreground">載入中…</p>
          ) : enrollments.length === 0 ? (
           <p className="text-muted-foreground">目前沒有可用報讀（仍可以試堂收費）</p>
          ) : (
           <ul className="mt-1 list-inside list-disc text-foreground">
            {enrollments.map((e) => (
             <li key={e.classId}>{enrollmentLabel(e)}</li>
            ))}
           </ul>
          )}
         </div>
        </div>
       </div>
      ) : null}

      <div className="lg:hidden">{renderStudentContextPanel(false)}</div>
     </SectionCard>

     <SectionCard title="2. 本次應收內容" description="選定收費項目與優惠後，核對應收總額再進入收款操作。">
      {!selectedStudent ? (
       <p className="text-sm text-muted-foreground">請先選擇學生。</p>
      ) : enrollLoading ? (
       <p className="text-sm text-muted-foreground">載入報讀班別中…</p>
      ) : (
       <div className="space-y-3">
        {enrollments.length === 0 ? (
         <p className="rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-sm text-info-foreground">
          此學生尚無報讀班別，可直接以「試堂」收費；正式報讀後亦可在此補繳學費。
         </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2">
         <span className="text-sm font-medium">收費項目（已報讀或試堂）</span>
         <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addLine}
          disabled={!canAddLine}
          title="可新增已報讀班別或試堂收費"
         >
          <Plus className="h-4 w-4" />
          新增班別
         </Button>
        </div>
        <ul className="space-y-3">
         {lines.map((row) => (
          <li
           key={row.key}
           className="relative grid min-w-0 gap-3 overflow-visible rounded-lg border border-border bg-muted/20 p-3"
          >
           <div
            className={cn(
             "grid min-w-0 gap-3",
             row.kind === "trial"
              ? "sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_100px_120px]"
              : "sm:grid-cols-[minmax(0,1fr)_100px_120px]"
            )}
           >
           <FormField label="班別">
            <Select
             className={selectClassName()}
             value={row.kind === "trial" ? TRIAL_SELECT_VALUE : row.classId}
             onChange={(e) => onLineSelectChange(row.key, e.target.value)}
            >
             <option value="">請選擇</option>
             {enrollmentsForLine(row.key, row.classId).length > 0 ? (
              <optgroup label="已報讀">
               {enrollmentsForLine(row.key, row.classId).map((e) => (
                <option key={e.classId} value={e.classId}>
                 {enrollmentLabel(e)}
                </option>
               ))}
              </optgroup>
             ) : null}
             <optgroup label="試堂">
              <option value={TRIAL_SELECT_VALUE}>試堂</option>
             </optgroup>
            </Select>
           </FormField>
           {row.kind === "trial" ? (
            <>
             <FormField label="試堂班別 *">
              <TrialClassPicker
               classes={trialClasses}
               value={row.classId}
               disabled={trialClassesLoading}
               onChange={(classId) => updateLine(row.key, { classId })}
              />
             </FormField>
             <FormField label="試堂類型">
              <Select
               className={selectClassName()}
               value={row.trialType}
               onChange={(e) =>
                updateLine(row.key, { trialType: e.target.value as TrialPayType })
               }
              >
               <option value="原價試堂">原價試堂</option>
               <option value="半價試堂">半價試堂</option>
              </Select>
             </FormField>
            </>
           ) : null}
           <FormField label="堂數 *">
            <Input
             type="number"
             min={1}
             step={1}
             value={row.lessons}
             onChange={(e) => updateLine(row.key, { lessons: e.target.value })}
             placeholder={row.kind === "trial" ? "例如 1" : "例如 4"}
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
           </div>
           <div className="flex justify-end">
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
      )}

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

      <FormField label="優惠（可多選）">
       <div className="mb-2 flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => setDiscountHelpOpen(true)}>
         查看優惠規則
        </Button>
        <Link to="/PaymentDiscounts" className="text-xs text-primary underline-offset-2 hover:underline">
         開啟優惠目錄
        </Link>
       </div>
       <div
        className={cn(
         "max-h-40 space-y-2 overflow-y-auto rounded-md border border-input bg-background p-3",
         !selectedStudent && "opacity-60"
        )}
       >
        {discounts.length === 0 ? (
         <p className="text-sm text-muted-foreground">尚無啟用中的優惠。</p>
        ) : (
         discounts.map((d) => {
          const avail = discountAvailability.get(d.id)
          const eligibilityBlocked = avail != null && !avail.eligible
          const stackBlocked =
           !eligibilityBlocked && isDiscountCheckboxDisabled(d, discountIds, discounts)
          const checkboxDisabled =
           !selectedStudent || eligibilityBlocked || stackBlocked
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
        {isSuperAdmin()
         ? "優惠規則可於「優惠折扣」維護；依目錄排序套用（先百分比再固定金額）。"
         : "優惠規則可於「優惠折扣」查閱；修改僅限管理員。依目錄排序套用（先百分比再固定金額）。"}
        {maxStackCount != null ? ` 每單最多 ${maxStackCount} 項。` : null}
       </p>
      </FormField>

      <FormField label={SPECIAL_DISCOUNT_LABEL}>
       <label
        className={cn(
         "flex items-center gap-2 text-sm",
         !selectedStudent ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        )}
       >
        <input
         type="checkbox"
         className="h-4 w-4 rounded border-input"
         checked={specialDiscountEnabled}
         disabled={!selectedStudent}
         onChange={(e) => {
          setSpecialDiscountEnabled(e.target.checked)
          if (!e.target.checked) setSpecialDiscountAmount("")
         }}
        />
        套用臨時減免（收據固定顯示 {SPECIAL_DISCOUNT_LABEL}）
       </label>
       {specialDiscountEnabled ? (
        <div className="mt-2 max-w-xs">
         <Input
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          placeholder="減免金額（HKD）"
          value={specialDiscountAmount}
          onChange={(e) => setSpecialDiscountAmount(e.target.value)}
         />
         <p className="mt-1 text-xs text-muted-foreground">
          於目錄優惠之後扣除；不可大於剩餘應收 {money(afterCatalogDue)}。
         </p>
        </div>
       ) : null}
      </FormField>

      <div className="rounded-lg border border-dashed border-border bg-muted/15 px-3 py-3 text-sm">
       <div className="flex justify-between gap-2">
        <span className="text-muted-foreground">項目小計</span>
        <span className="tabular-nums font-medium">{money(subtotal)}</span>
       </div>
       {selectedDiscounts.length > 0 ? (
        <div className="mt-1 space-y-2 text-muted-foreground">
         {selectedDiscounts.map((d, idx) => {
          const step = discountStepsPreview[idx]
          const avail = discountAvailability.get(d.id)
          const summary = summarizePaymentDiscountForAdmin(d)
          return (
           <div key={d.id} className="space-y-0.5">
            <div className="flex justify-between gap-2">
             <span>
              已套用：{d.name}
              {avail?.resolvedAmountOff != null || d.percentOff != null || d.amountOff != null
               ? `（${discountOptionLabel(d, avail?.resolvedAmountOff)}）`
               : ""}
             </span>
             <span className="tabular-nums text-warning">
              {step && step.amountDeducted > 0 ? `-${money(step.amountDeducted)}` : "（僅註記）"}
             </span>
            </div>
            <p className="text-xs">
             規則：
             {summary.descriptionText ??
              summary.eligibilityText ??
              "此優惠尚未提供詳細說明，如有疑問請向主管確認。"}
            </p>
           </div>
          )
         })}
        </div>
       ) : null}
       {specialAmountN > 0 ? (
        <div className="mt-1 flex justify-between gap-2 text-muted-foreground">
         <span>已套用：{SPECIAL_DISCOUNT_LABEL}</span>
         <span className="tabular-nums text-warning">-{money(specialAmountN)}</span>
        </div>
       ) : null}
       <div className="mt-2 flex justify-between gap-2 border-t border-border pt-2 text-base font-semibold">
        <span>應收總額</span>
        <span className="tabular-nums text-warning dark:text-warning">{money(totalDue)}</span>
       </div>
      </div>
     </SectionCard>

     <SectionCard
      title={collectMode === "receive" ? "3. 本次收款操作" : "3. 本次待收款操作"}
      description={
       collectMode === "receive"
        ? "確認付款方式與備註後送出；送出期間請勿重複點擊。"
        : "建立待收款單（未入帳）；下期學費請另以文字提醒家長，勿再開待繳費通知單。"
      }
     >
      <div className="grid gap-4 sm:grid-cols-2">
       <FormField label="日期 *">
        <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
        {!payDateEditable ? (
         <p className="mt-1 text-xs text-amber-800">{academicYearEditBlockedMessage()}</p>
        ) : null}
       </FormField>
       <FormField label="繳費方式">
        <Select className={selectClassName()} value={method} onChange={(e) => setMethod(e.target.value)}>
         {PAYMENT_METHOD_PRESETS.map((m) => (
          <option key={m} value={m}>
           {m}
          </option>
         ))}
        </Select>
       </FormField>
       {collectMode === "invoice" ? (
        <FormField label="帳款狀態">
         <Input readOnly value={PAYMENT_STATUS.pendingReceive} className="bg-muted/40" />
        </FormField>
       ) : (
        <FormField label="帳款狀態">
         <Input readOnly value={PAYMENT_STATUS.received} className="bg-muted/40" />
        </FormField>
       )}
       <FormField label="實收／應收金額">
        <Input readOnly value={money(totalDue)} className="bg-muted/40 tabular-nums font-semibold" />
       </FormField>
      </div>

      <FormField label="備註">
       <Textarea
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        rows={2}
        placeholder="內部備註、轉數快參考編號等"
       />
      </FormField>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
       <input
        type="checkbox"
        checked={collectMode === "receive" ? printAfterReceive : printAfterInvoice}
        onChange={(e) =>
         collectMode === "receive"
          ? setPrintAfterReceive(e.target.checked)
          : setPrintAfterInvoice(e.target.checked)
        }
       />
       建立後開啟列印
      </label>

      <Button
       type="button"
       className="w-full bg-warning text-white hover:bg-warning sm:w-auto"
       disabled={!isSupabaseConfigured || saving || !payDateEditable || Boolean(receivedDone)}
       onClick={() => void (collectMode === "receive" ? submitReceive() : submitInvoice())}
      >
       {saving
        ? "處理中…"
        : collectMode === "receive"
          ? "確認登記收款"
          : "建立待收款單"}
      </Button>
     </SectionCard>
    </div>

    <div className="hidden border-l border-border lg:block lg:pl-6">
     {renderStudentContextPanel(true)}
    </div>
   </div>

   <Dialog
    open={Boolean(receiptPreview)}
    onOpenChange={(o) => {
     if (!o) {
      setReceiptPreview(null)
      setReceiptPreviewHtml(null)
      setReceiptPrintHint(null)
     }
    }}
   >
    <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
     <DialogHeader>
      <DialogTitle>收據預覽</DialogTitle>
     </DialogHeader>
     {receiptPreview ? (
      <div className="space-y-3">
       <iframe
        title="收據預覽"
        className="h-[min(70vh,40rem)] w-full rounded-md border border-border bg-[#ececec]"
        srcDoc={receiptPreviewHtml ?? ""}
       />
       {receiptPrintHint ? (
        <p className="text-sm text-warning" role="status">
         {receiptPrintHint}
        </p>
       ) : null}
       <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void printFromPreview()}>
         <Printer className="h-4 w-4" />
         列印
        </Button>
        <Button
         type="button"
         variant="outline"
         onClick={() => {
          setReceiptPreview(null)
          setReceiptPreviewHtml(null)
          setReceiptPrintHint(null)
         }}
        >
         關閉
        </Button>
       </div>
       {receiptPreview ? (
        <div className="rounded-md border border-border bg-muted/15 p-3 text-xs text-muted-foreground">
         {buildPaymentAmountBreakdown(receiptPreview).lines.map((line) => (
          <div key={line.key} className="flex justify-between gap-2 py-0.5">
           <span>{line.label}</span>
           <span className="tabular-nums">
            {line.tone === "deduction" ? `-${money(Math.abs(line.amount))}` : money(line.amount)}
           </span>
          </div>
         ))}
        </div>
       ) : null}
      </div>
     ) : null}
    </DialogContent>
   </Dialog>

   <Dialog open={discountHelpOpen} onOpenChange={setDiscountHelpOpen}>
    <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
     <DialogHeader>
      <DialogTitle>優惠規則說明</DialogTitle>
     </DialogHeader>
     <p className="text-sm text-muted-foreground">
      以下為目前可用優惠的唯讀說明。
      {isSuperAdmin() ? null : " 修改規則僅限管理員。"}
     </p>
     {discounts.length === 0 ? (
      <p className="text-sm text-muted-foreground">尚無啟用中的優惠。</p>
     ) : (
      <ul className="space-y-3">
       {discounts.map((d) => {
        const s = summarizePaymentDiscountForAdmin(d)
        return (
         <li key={d.id} className="rounded-lg border border-border p-3 text-sm">
          <div className="font-medium text-foreground">{d.name}</div>
          <p className="mt-1 text-muted-foreground">{s.kindLabel}</p>
          <p className="mt-1 text-muted-foreground">
           {s.descriptionText ?? "此優惠尚未提供詳細說明，如有疑問請向主管確認。"}
          </p>
          {s.eligibilityText ? (
           <p className="mt-1 text-xs text-muted-foreground">適用：{s.eligibilityText}</p>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">{s.stackText}</p>
          <p className="mt-1 text-xs text-muted-foreground">{s.validityText}</p>
         </li>
        )
       })}
      </ul>
     )}
     <Button type="button" variant="outline" asChild>
      <Link to="/PaymentDiscounts" onClick={() => setDiscountHelpOpen(false)}>
       前往優惠目錄
      </Link>
     </Button>
    </DialogContent>
   </Dialog>
  </div>
 )
}
