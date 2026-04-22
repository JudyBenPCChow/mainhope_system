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
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
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
 applyDiscountToSubtotal,
 fetchActivePaymentDiscounts,
 type PaymentDiscountRow,
} from "@/services/paymentDiscountQueries"
import {
 fetchAllStudents,
 fetchEnrollmentsForStudent,
 type EnrollmentWithClass,
 type StudentRecord,
} from "@/services/studentQueries"

type MainTab = "receive" | "invoice" | "history"

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
  lessons: "",
  amount: "",
 }
}

function money(n: number) {
 return new Intl.NumberFormat("zh-Hant", { style: "currency", currency: "HKD" }).format(n)
}

function escHtml(s: string) {
 return s
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
}

function openPrintableDocument(title: string, bodyHtml: string): boolean {
 const w = window.open("", "_blank", "noopener,noreferrer")
 if (!w) {
  return false
 }
 w.document.open()
 w.document.write(`<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="utf-8"/><title>${escHtml(title)}</title>
<style>
 body{font-family:ui-sans-serif,system-ui,sans-serif;padding:28px;max-width:720px;margin:0 auto;color:#111;line-height:1.5}
 h1{font-size:22px;margin:0 0 8px;font-weight:700}
 .sub{color:#555;font-size:14px;margin-bottom:20px}
 .row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #eee;font-size:15px}
 .label{color:#666;flex-shrink:0}
 .val{text-align:right;word-break:break-all}
 table{width:100%;border-collapse:collapse;margin-top:16px;font-size:14px}
 th,td{border:1px solid #ddd;padding:8px;text-align:left}
 th{background:#f6f6f6}
 .total{font-size:18px;font-weight:700;margin-top:20px;text-align:right}
 @media print{body{padding:12px}}
</style></head><body>${bodyHtml}</body></html>`)
 w.document.close()
 w.focus()
 w.print()
 w.addEventListener(
  "afterprint",
  () => {
   w.close()
  },
  { once: true }
 )
 return true
}

function buildPrintBody(p: PaymentFull, kind: "invoice" | "receipt"): string {
 const isInvoice = kind === "invoice"
 const headTitle = isInvoice ? "繳費通知單" : "收款收據"
 const sub = isInvoice
  ? "請家長／學生依下列金額繳付；繳款後請保留收據。"
  : "茲收到下列款項，此據。"

 const discParts: string[] = []
 if (p.discountName) discParts.push(escHtml(p.discountName))
 if (p.discountPercentOff != null && p.discountPercentOff > 0) {
  discParts.push(`減免 ${p.discountPercentOff}%`)
 }
 if (p.discountAmountOff != null && p.discountAmountOff > 0) {
  discParts.push(`固定減 ${money(p.discountAmountOff)}`)
 }
 const discRow =
  p.discountName || discParts.length > 0
   ? `<div class="row"><span class="label">優惠</span><span class="val">${discParts.join("；") || "—"}</span></div>`
   : ""

 const lines =
  p.details.length === 0
   ? ""
   : `<table><thead><tr><th>項目</th><th>堂數</th><th>金額</th><th>備註</th></tr></thead><tbody>${p.details
     .map(
      (d) =>
       `<tr><td>${escHtml(d.classLabel)}</td><td>${d.lessonCount ?? "—"}</td><td>${d.amount != null ? money(d.amount) : "—"}</td><td>${escHtml(d.description ?? "—")}</td></tr>`
     )
     .join("")}</tbody></table>`

 return `
  <h1>${escHtml(headTitle)}</h1>
  <div class="sub">${escHtml(sub)}</div>
  <div class="row"><span class="label">單據編號</span><span class="val">${escHtml(p.receiptNumber ?? "—")}</span></div>
  <div class="row"><span class="label">學生</span><span class="val">${escHtml(p.studentName)}${p.studentCode ? `（${escHtml(p.studentCode)}）` : ""}</span></div>
  <div class="row"><span class="label">日期</span><span class="val">${escHtml(p.paymentDate)}</span></div>
  <div class="row"><span class="label">狀態</span><span class="val">${escHtml(p.status)}</span></div>
  <div class="row"><span class="label">繳費方式</span><span class="val">${escHtml(p.paymentMethod ?? "—")}</span></div>
  ${discRow}
  ${p.remarks ? `<div class="row"><span class="label">備註</span><span class="val">${escHtml(p.remarks)}</span></div>` : ""}
  ${lines}
  <div class="total">合計 ${money(p.totalAmount)}</div>
 `
}

function printPayment(p: PaymentFull, kind: "invoice" | "receipt"): boolean {
 const title = kind === "invoice" ? "繳費通知單" : "收款收據"
 return openPrintableDocument(title, buildPrintBody(p, kind))
}

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
 const [discountId, setDiscountId] = useState("")

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

 const selectedDiscount = useMemo(
  () => (discountId ? (discounts.find((d) => d.id === discountId) ?? null) : null),
  [discountId, discounts]
 )

 const totalDue = useMemo(
  () => applyDiscountToSubtotal(subtotal, selectedDiscount),
  [subtotal, selectedDiscount]
 )

 const loadBasics = useCallback(async () => {
  if (!isSupabaseConfigured) return
  try {
   const [st, disc] = await Promise.all([fetchAllStudents(), fetchActivePaymentDiscounts()])
   setStudents(st)
   setDiscounts(disc)
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentsPageView.loadBasics", setErr: setFormErr })
  }
 }, [])

 useEffect(() => {
  void loadBasics()
 }, [loadBasics])

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
   setDiscountId("")
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
  } else {
   setEnrollments([])
   setLines([])
   setDiscountId("")
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
      next.lessons = ""
      next.amount = ""
      return next
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

 const addLine = () => setLines((prev) => [...prev, newLine()])
 const removeLine = (key: string) =>
  setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)))

 const buildDetailInputs = (): PaymentDetailInput[] => {
  return lines
   .filter((l) => l.classId && Number(l.lessons) > 0)
   .map((l) => {
    const e = enrollmentByClass.get(l.classId)
    const amt = Number(l.amount)
    const desc = e
     ? `${e.subject}${e.courseCode ? `（${e.courseCode}）` : ""}`
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
  if (enrollLoading) return "載入報讀資料中…"
  if (enrollments.length === 0) return "此學生尚無報讀班別，請先於學生詳情「報讀班別」新增。"
  const details = buildDetailInputs()
  if (details.length === 0) return "請至少新增一筆班別與堂數。"
  if (subtotal <= 0) return "請確認各項金額（可依班別每堂單價 × 堂數自動帶入）。"
  return null
 }

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
    totalAmount: totalDue,
    paymentMethod: method,
    status: PAYMENT_STATUS.received,
    remarks: remarks.trim() || null,
    receiptKind: "RC",
    discountId: discountId || null,
    details: buildDetailInputs(),
   })
   if (printAfterReceive) {
    const full = await fetchPaymentFull(id)
    if (full && !printPayment(full, "receipt")) {
     setFormErr("請允許開啟彈出視窗以列印。")
    }
   }
   setRemarks("")
   setDiscountId("")
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
    totalAmount: totalDue,
    paymentMethod: method,
    status: invoiceStatus,
    remarks: remarks.trim() || null,
    receiptKind: "INV",
    discountId: discountId || null,
    details: buildDetailInputs(),
   })
   if (printAfterInvoice) {
    const full = await fetchPaymentFull(id)
    if (full && !printPayment(full, "invoice")) {
     setFormErr("請允許開啟彈出視窗以列印。")
    }
   }
   setRemarks("")
   setDiscountId("")
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
  if (!confirm(`確定刪除單據「${row.receiptNumber ?? row.id.slice(0, 8)}」？`)) return
  try {
   await deletePaymentRecord(row.id)
   void loadHistory()
   void loadDashboardStats()
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentsPageView.onDeleteRow", setErr: setFormErr })
  }
 }

 const statusBadge = (status: string) => {
  const pending = status.includes("待")
  return (
   <span
    className={cn(
     "rounded-full px-2 py-0.5 text-xs font-medium",
     pending ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"
    )}
   >
    {status}
   </span>
  )
 }

 const enrollmentLabel = (e: EnrollmentWithClass) => {
  const bits = [e.subject, e.courseCode, e.dayOfWeek, e.timeSlot].filter(Boolean)
  return bits.join(" · ")
 }

 const discountOptionLabel = (d: PaymentDiscountRow) => {
  const bits = [d.name]
  if (d.percentOff != null && d.percentOff > 0) bits.push(`-${d.percentOff}%`)
  if (d.amountOff != null && d.amountOff > 0) bits.push(`-$${d.amountOff}`)
  return bits.join(" ")
 }

 return (
  <div className="space-y-6 p-4 md:p-6">
   <header className="flex flex-wrap items-end justify-between gap-4">
    <div>
     <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
      <Wallet className="h-8 w-8 text-orange-600" aria-hidden />
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
     className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950"
    >
     {formOk}
    </div>
   ) : null}

   {!isSupabaseConfigured ? (
    <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm">
     請設定 <code className="rounded bg-muted px-1">.env</code> 內 Supabase 後重啟 dev。
    </div>
   ) : null}

   {isSupabaseConfigured ? (
    <div className="grid gap-3 sm:grid-cols-2">
     <div className="flex gap-3 rounded-xl border border-orange-200/80 bg-gradient-to-br from-orange-50 to-amber-50 p-4 shadow-sm dark:border-orange-900/50 dark:from-orange-950/40 dark:to-amber-950/30">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white shadow">
       <BookOpen className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0">
       <div className="text-xs font-medium uppercase tracking-wide text-orange-900/80 dark:text-orange-100/80">
        學生總交堂數
       </div>
       <div className="mt-1 text-2xl font-bold tabular-nums text-orange-950 dark:text-orange-50">
        {dashLoading ? "…" : (dashStats?.totalPaidLessons ?? "—")}
       </div>
       <p className="mt-0.5 text-xs text-orange-900/70 dark:text-orange-100/70">
        已收款繳費單 · 明細堂數加總
       </p>
      </div>
     </div>
     <div className="flex gap-3 rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/40 dark:to-teal-950/30">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow">
       <ClipboardCheck className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0">
       <div className="text-xs font-medium uppercase tracking-wide text-emerald-900/80 dark:text-emerald-100/80">
        學生總上堂數
       </div>
       <div className="mt-1 text-2xl font-bold tabular-nums text-emerald-950 dark:text-emerald-50">
        {dashLoading ? "…" : (dashStats?.totalAttendedLessons ?? "—")}
       </div>
       <p className="mt-0.5 text-xs text-emerald-900/70 dark:text-emerald-100/70">
        出席紀錄中計為「出席」之堂次（全庫）
       </p>
      </div>
     </div>
    </div>
   ) : null}

   <div className="flex flex-wrap gap-2">
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
        ? "border-orange-600 bg-orange-600 text-white"
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
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
         此學生尚無報讀班別，請先到「學生管理 → 該生詳情 → 報讀班別」新增後再繳費。
        </div>
       ) : (
        <div className="space-y-3">
         <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium">收費項目（已報讀班別）</span>
          <Button type="button" variant="outline" size="sm" onClick={addLine}>
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
             <select
              className={selectClassName()}
              value={row.classId}
              onChange={(e) => updateLine(row.key, { classId: e.target.value })}
             >
              <option value="">請選擇</option>
              {enrollments.map((e) => (
               <option key={e.classId} value={e.classId}>
                {enrollmentLabel(e)}
               </option>
              ))}
             </select>
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

      <div className="grid gap-4 sm:grid-cols-2">
       <FormField label="優惠">
        <select
         className={selectClassName()}
         value={discountId}
         onChange={(e) => setDiscountId(e.target.value)}
         disabled={!selectedStudent || enrollments.length === 0}
        >
         <option value="">無優惠</option>
         {discounts.map((d) => (
          <option key={d.id} value={d.id}>
           {discountOptionLabel(d)}
          </option>
         ))}
        </select>
        <p className="text-xs text-muted-foreground">
         優惠項目由外星人於「優惠折扣」維護；先計百分比減免，再減固定金額。
        </p>
       </FormField>
       <FormField label="日期 *">
        <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
       </FormField>
      </div>

      <div className="rounded-lg border border-dashed border-border bg-muted/15 px-3 py-3 text-sm">
       <div className="flex justify-between gap-2">
        <span className="text-muted-foreground">項目小計</span>
        <span className="tabular-nums font-medium">{money(subtotal)}</span>
       </div>
       {selectedDiscount ? (
        <div className="mt-1 flex justify-between gap-2 text-muted-foreground">
         <span>優惠：{selectedDiscount.name}</span>
         <span className="tabular-nums">
          {totalDue !== subtotal
           ? `→ ${money(totalDue)}`
           : selectedDiscount.percentOff == null && selectedDiscount.amountOff == null
            ? "（僅註記）"
            : "—"}
         </span>
        </div>
       ) : null}
       <div className="mt-2 flex justify-between gap-2 border-t border-border pt-2 text-base font-semibold">
        <span>應繳總額</span>
        <span className="tabular-nums text-orange-700 dark:text-orange-300">{money(totalDue)}</span>
       </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
       <FormField label="繳費方式">
        <select className={selectClassName()} value={method} onChange={(e) => setMethod(e.target.value)}>
         {PAYMENT_METHOD_PRESETS.map((m) => (
          <option key={m} value={m}>
           {m}
          </option>
         ))}
        </select>
       </FormField>
       {mainTab === "invoice" ? (
        <FormField label="帳款狀態">
         <select
          className={selectClassName()}
          value={invoiceStatus}
          onChange={(e) => setInvoiceStatus(e.target.value)}
         >
          <option value={PAYMENT_STATUS.pendingReceive}>{PAYMENT_STATUS.pendingReceive}</option>
          <option value={PAYMENT_STATUS.pendingPay}>{PAYMENT_STATUS.pendingPay}</option>
         </select>
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
       className="w-full bg-orange-600 text-white hover:bg-orange-700 sm:w-auto"
       disabled={!isSupabaseConfigured || saving}
       onClick={() => void (mainTab === "receive" ? submitReceive() : submitInvoice())}
      >
       {mainTab === "receive" ? "確認登記收款" : "建立通知單"}
      </Button>
     </div>

     <aside className="space-y-3 rounded-xl border border-orange-200/60 bg-orange-50/50 p-4 text-sm dark:border-orange-900/40 dark:bg-orange-950/20">
      <p className="font-medium text-orange-900 dark:text-orange-100">小提示</p>
      <ul className="list-inside list-disc space-y-2 text-orange-900/90 dark:text-orange-100/90">
       <li>班別僅顯示該生「報讀中」班級；金額預設為班級每堂單價 × 堂數（可再手改）。</li>
       <li>「+ 新增班別」可同一張單據收多班費用。</li>
       <li>單據編號由系統自動產生，無法手動輸入。</li>
       <li>優惠選項由外星人在側欄「優惠折扣」設定。</li>
      </ul>
     </aside>
    </div>
   ) : (
    <div className="space-y-4">
     <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <FormField label="狀態">
       <select
        className={cn(selectClassName(), "min-w-[140px]")}
        value={histStatus}
        onChange={(e) => setHistStatus(e.target.value as typeof histStatus)}
       >
        <option value="all">全部</option>
        <option value="received">已收款</option>
        <option value="pending">待繳／待收款</option>
        <option value="pendingPay">待繳費（出單）</option>
       </select>
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
     ) : historyRows.length === 0 ? (
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
         {historyRows.map((r) => {
          const pending =
           r.status === PAYMENT_STATUS.pendingPay || r.status === PAYMENT_STATUS.pendingReceive
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
                 if (full && !printPayment(full, pending ? "invoice" : "receipt")) {
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
              {pending ? (
               <Button type="button" size="sm" onClick={() => openMarkReceived(r)}>
                標記已收
               </Button>
              ) : null}
              <Button
               type="button"
               variant="ghost"
               size="sm"
               className="text-destructive hover:text-destructive"
               onClick={() => void onDeleteRow(r)}
              >
               刪除
              </Button>
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
       {detailPay.discountName ? (
        <div className="flex justify-between gap-2">
         <span className="text-muted-foreground">優惠</span>
         <span>{detailPay.discountName}</span>
        </div>
       ) : null}
       <div className="flex justify-between gap-2">
        <span className="text-muted-foreground">金額</span>
        <span className="font-semibold">{money(detailPay.totalAmount)}</span>
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
          const pending =
           detailPay.status === PAYMENT_STATUS.pendingPay ||
           detailPay.status === PAYMENT_STATUS.pendingReceive
          if (!printPayment(detailPay, pending ? "invoice" : "receipt")) {
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
        <select className={selectClassName()} value={markMethod} onChange={(e) => setMarkMethod(e.target.value)}>
         {PAYMENT_METHOD_PRESETS.map((m) => (
          <option key={m} value={m}>
           {m}
          </option>
         ))}
        </select>
       </FormField>
       <Button
        type="button"
        className="bg-emerald-600 text-white hover:bg-emerald-700"
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
