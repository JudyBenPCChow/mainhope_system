import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Trash2 } from "lucide-react"

import { localTodayYmd } from "@/components/frontDesk/frontDeskUi"
import {
 enrollmentLabel,
 FormField,
 money,
 newLine,
 SectionCard,
 selectClassName,
 type LineRow,
} from "@/components/payments/paymentsUi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { cn } from "@/lib/utils"
import {
 insertPaymentRecord,
 PAYMENT_METHOD_PRESETS,
 PAYMENT_STATUS,
} from "@/services/paymentQueries"
import {
 fetchEnrollmentsForStudent,
 type EnrollmentWithClass,
 type StudentRecord,
} from "@/services/studentQueries"

function lineAmountFor(enrollments: EnrollmentWithClass[], classId: string, lessons: string): string {
 const e = enrollments.find((x) => x.classId === classId)
 const n = Number(lessons)
 if (!e?.pricePerLesson || !Number.isFinite(n) || n <= 0) return ""
 return String(Math.round(e.pricePerLesson * n * 100) / 100)
}

type Props = {
 student: StudentRecord
 onPaymentDone: () => void
 onSkipPayment: () => void
}

export function PaymentStep({ student, onPaymentDone, onSkipPayment }: Props) {
 const { pushBanner } = useAppBanner()
 const { confirmDialog } = useAppConfirm()
 const [enrollments, setEnrollments] = useState<EnrollmentWithClass[]>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)
 const [mode, setMode] = useState<"receive" | "invoice">("receive")
 const [payDate, setPayDate] = useState(localTodayYmd())
 const [method, setMethod] = useState<string>(PAYMENT_METHOD_PRESETS[0] ?? "現金")
 const [invoiceStatus, setInvoiceStatus] = useState<string>(PAYMENT_STATUS.pendingReceive)
 const [remarks, setRemarks] = useState("")
 const [lines, setLines] = useState<LineRow[]>([newLine()])
 const [saving, setSaving] = useState(false)

 useEffect(() => {
  let cancelled = false
  setLoading(true)
  void fetchEnrollmentsForStudent(student.id)
   .then((list) => {
    if (cancelled) return
    const active = list.filter((e) => e.status !== "已退讀")
    setEnrollments(active)
    if (active.length > 0) {
     const first = active[0]
     setLines([
      {
       ...newLine(),
       classId: first.classId,
       amount: lineAmountFor(active, first.classId, "4"),
      },
     ])
    } else {
     setLines([newLine()])
    }
   })
   .catch((e) => {
    if (!cancelled) reportUserFacingError(e, { source: "PaymentStep.load", setErr })
   })
   .finally(() => {
    if (!cancelled) setLoading(false)
   })
  return () => {
   cancelled = true
  }
 }, [student.id])

 const usedClassIds = useMemo(() => new Set(lines.map((l) => l.classId).filter(Boolean)), [lines])
 const canAddLine = enrollments.some((e) => !usedClassIds.has(e.classId))

 const subtotal = useMemo(() => {
  return lines.reduce((sum, line) => {
   const n = Number(line.amount)
   return sum + (Number.isFinite(n) && n > 0 ? n : 0)
  }, 0)
 }, [lines])

 const totalLessons = useMemo(() => {
  return lines.reduce((sum, line) => {
   const n = Math.floor(Number(line.lessons))
   return sum + (Number.isFinite(n) && n > 0 ? n : 0)
  }, 0)
 }, [lines])

 const enrollmentsForLine = (key: string, classId: string) => {
  const locked = new Set(lines.filter((l) => l.key !== key && l.classId).map((l) => l.classId))
  return enrollments.filter((e) => e.classId === classId || !locked.has(e.classId))
 }

 const updateLine = (key: string, patch: Partial<LineRow>) => {
  setLines((prev) =>
   prev.map((line) => {
    if (line.key !== key) return line
    const next = { ...line, ...patch }
    if (patch.classId != null || patch.lessons != null) {
     const auto = lineAmountFor(enrollments, next.classId, next.lessons)
     if (auto) next.amount = auto
    }
    return next
   })
  )
 }

 const addLine = () => {
  const nextClass = enrollments.find((e) => !usedClassIds.has(e.classId))
  if (!nextClass) return
  setLines((prev) => [
   ...prev,
   {
    ...newLine(),
    classId: nextClass.classId,
    amount: lineAmountFor(enrollments, nextClass.classId, "4"),
   },
  ])
 }

 const onSubmit = async () => {
  if (saving) return
  if (loading) {
   setErr("載入報讀資料中…")
   return
  }
  if (enrollments.length === 0) {
   setErr("此學生沒有可用的報讀紀錄，請先回到上一步報讀。")
   return
  }
  const details = lines
   .map((line) => {
    const lessons = Math.floor(Number(line.lessons))
    const amount = Number(line.amount)
    if (!line.classId || !Number.isFinite(lessons) || lessons < 1 || !Number.isFinite(amount) || amount <= 0) {
     return null
    }
    return {
     classId: line.classId,
     lessonCount: lessons,
     amount,
     description: null as string | null,
    }
   })
   .filter((x): x is NonNullable<typeof x> => x != null)
  if (details.length === 0) {
   setErr("請至少新增一筆班別、堂數與金額。")
   return
  }
  if (subtotal <= 0) {
   setErr("請確認各項金額。")
   return
  }

  setSaving(true)
  setErr(null)
  try {
   await insertPaymentRecord({
    studentId: student.id,
    paymentDate: payDate,
    subtotalAmount: subtotal,
    totalAmount: subtotal,
    paymentMethod: method,
    status: mode === "receive" ? PAYMENT_STATUS.received : invoiceStatus,
    remarks: remarks.trim() || null,
    receiptKind: mode === "receive" ? "RC" : "INV",
    details,
   })
   pushBanner({
    tone: "success",
    title: mode === "receive" ? "已登記收款" : "已出單",
    message: "單據已建立。",
    action: {
     pageLabel: "繳費紀錄",
     to: `/Payments?studentId=${encodeURIComponent(student.id)}&tab=history`,
    },
   })
   onPaymentDone()
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentStep.onSubmit", setErr })
  } finally {
   setSaving(false)
  }
 }

 const onSkip = async () => {
  const ok = await confirmDialog({
   title: "稍後付款？",
   description: "確定略過本步驟？之後可在繳費紀錄頁為該生收款／出單。",
   confirmText: "稍後付款",
  })
  if (!ok) return
  onSkipPayment()
 }

 const modePill = (active: boolean) =>
  cn(
   "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
   active
    ? "border-warning bg-warning text-white"
    : "border-border bg-card text-foreground hover:border-warning/40"
  )

 return (
  <div className="space-y-4">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <div className="flex flex-wrap gap-2">
     <button type="button" className={modePill(mode === "receive")} onClick={() => setMode("receive")}>
      收款登記
     </button>
     <button type="button" className={modePill(mode === "invoice")} onClick={() => setMode("invoice")}>
      出單（待繳）
     </button>
    </div>
    <Button type="button" variant="ghost" size="sm" asChild>
     <Link to={`/Payments?studentId=${encodeURIComponent(student.id)}&tab=receive`}>前往繳費紀錄頁面</Link>
    </Button>
   </div>

   {err ? (
    <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
     {err}
    </div>
   ) : null}

   <SectionCard title="1. 學生／收款對象" description="精靈已鎖定學生；以下為進行中報讀摘要。">
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm">
     <div className="font-medium">
      {student.full_name}
      {student.student_code ? `（${student.student_code}）` : ""}
     </div>
     <div className="mt-1 text-muted-foreground">
      年級 {student.grade || "—"}
      {loading ? " · 載入報讀中…" : ` · 報讀 ${enrollments.length} 班`}
     </div>
     {enrollments.length > 0 ? (
      <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
       {enrollments.map((e) => (
        <li key={e.id}>{enrollmentLabel(e)}</li>
       ))}
      </ul>
     ) : !loading ? (
      <p className="mt-2 text-warning">尚無報讀紀錄，請先回到上一步。</p>
     ) : null}
    </div>
   </SectionCard>

   <SectionCard title="2. 本次應收內容" description="選定收費項目後，核對應收總額再進入收款操作。">
    {loading ? (
     <p className="text-sm text-muted-foreground">載入報讀班別中…</p>
    ) : enrollments.length === 0 ? (
     <div role="alert" className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-3 text-sm text-warning">
      此學生目前沒有可用的報讀紀錄。
     </div>
    ) : (
     <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
       <span className="text-sm font-medium">收費項目（已報讀班別）</span>
       <Button type="button" variant="outline" size="sm" onClick={addLine} disabled={!canAddLine}>
        <Plus className="h-4 w-4" />
        新增班別
       </Button>
      </div>
      <ul className="space-y-3">
       {lines.map((row) => (
        <li
         key={row.key}
         className="grid min-w-0 gap-3 overflow-hidden rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-[minmax(0,1fr)_100px_120px_auto]"
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
          />
         </FormField>
         <FormField label="金額（HKD）">
          <Input
           type="number"
           min={0}
           step="0.01"
           value={row.amount}
           onChange={(e) => updateLine(row.key, { amount: e.target.value })}
          />
         </FormField>
         <div className="flex items-end justify-end">
          <Button
           type="button"
           variant="ghost"
           size="icon"
           className="text-muted-foreground hover:text-destructive"
           disabled={lines.length <= 1}
           onClick={() => setLines((prev) => prev.filter((x) => x.key !== row.key))}
           aria-label="移除此列"
          >
           <Trash2 className="h-4 w-4" />
          </Button>
         </div>
        </li>
       ))}
      </ul>
      {totalLessons > 0 ? (
       <p className="text-xs text-muted-foreground">本次堂數：{totalLessons} 堂</p>
      ) : null}
      <div className="rounded-lg border border-dashed border-border bg-muted/15 px-3 py-3 text-sm">
       <div className="flex justify-between gap-2">
        <span className="text-muted-foreground">項目小計</span>
        <span className="tabular-nums font-medium">{money(subtotal)}</span>
       </div>
       <div className="mt-2 flex justify-between gap-2 border-t border-border pt-2 text-base font-semibold">
        <span>應收總額</span>
        <span className="tabular-nums text-warning">{money(subtotal)}</span>
       </div>
       <p className="mt-2 text-xs text-muted-foreground">
        優惠／轉介／聯合收費請使用完整繳費頁。
       </p>
      </div>
     </div>
    )}
   </SectionCard>

   <SectionCard
    title={mode === "receive" ? "3. 本次收款操作" : "3. 本次出單操作"}
    description={
     mode === "receive"
      ? "確認付款方式與備註後送出；送出期間請勿重複點擊。"
      : "建立待繳／待收款通知單，之後可於繳費紀錄標記已收。"
    }
   >
    <div className="grid gap-4 sm:grid-cols-2">
     <FormField label="日期 *">
      <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
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
     {mode === "invoice" ? (
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
     <FormField label="實收／應收金額">
      <Input readOnly value={money(subtotal)} className="bg-muted/40 tabular-nums font-semibold" />
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
    <div className="flex flex-wrap gap-2">
     <Button
      type="button"
      className="w-full bg-warning text-white hover:bg-warning sm:w-auto"
      disabled={saving || enrollments.length === 0}
      onClick={() => void onSubmit()}
     >
      {saving ? "處理中…" : mode === "receive" ? "確認登記收款" : "建立通知單"}
     </Button>
     <Button type="button" variant="outline" disabled={saving} onClick={() => void onSkip()}>
      稍後付款
     </Button>
    </div>
   </SectionCard>
  </div>
 )
}
