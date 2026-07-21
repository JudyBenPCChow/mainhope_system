import { useEffect, useMemo, useState } from "react"
import { CalendarRange, ReceiptText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { Textarea } from "@/components/ui/textarea"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { enumerateBillingMonths, formatBillingMonth } from "@/lib/monthlyTuition"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { statusToTagTone } from "@/lib/statusTag"
import {
 createMonthlyTuitionPayment,
 fetchMonthlyTuitionPreview,
 type MonthlyTuitionPreview,
} from "@/services/monthlyTuitionQueries"
import {
 PAYMENT_METHOD_PRESETS,
 PAYMENT_STATUS,
} from "@/services/paymentQueries"
import { fetchAllStudents, type StudentRecord } from "@/services/studentQueries"

function localMonth(): string {
 const now = new Date()
 return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

function localToday(): string {
 const now = new Date()
 return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

function money(value: number): string {
 return new Intl.NumberFormat("zh-HK", {
  style: "currency",
  currency: "HKD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
 }).format(value)
}

export function MonthlyTuitionView() {
 const { pushBanner } = useAppBanner()
 const { confirmDialog } = useAppConfirm()
 const [students, setStudents] = useState<StudentRecord[]>([])
 const [studentId, setStudentId] = useState("")
 const [firstMonth, setFirstMonth] = useState(localMonth())
 const [monthCount, setMonthCount] = useState("1")
 const [preview, setPreview] = useState<MonthlyTuitionPreview | null>(null)
 const [selectedKeys, setSelectedKeys] = useState<string[]>([])
 const [paymentDate, setPaymentDate] = useState(localToday())
 const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHOD_PRESETS[0] ?? "現金")
 const [paymentStatus, setPaymentStatus] = useState<
  typeof PAYMENT_STATUS.received | typeof PAYMENT_STATUS.pendingPay | typeof PAYMENT_STATUS.pendingReceive
 >(PAYMENT_STATUS.received)
 const [remarks, setRemarks] = useState("")
 const [loading, setLoading] = useState(false)
 const [saving, setSaving] = useState(false)
 const [err, setErr] = useState<string | null>(null)

 const months = useMemo(
  () => enumerateBillingMonths(firstMonth, Number(monthCount)),
  [firstMonth, monthCount]
 )
 const selectedLines = useMemo(
  () => preview?.lines.filter((line) => selectedKeys.includes(line.key)) ?? [],
  [preview, selectedKeys]
 )
 const total = useMemo(
  () => selectedLines.reduce((sum, line) => sum + line.netAmount, 0),
  [selectedLines]
 )

 useEffect(() => {
  void fetchAllStudents()
   .then(setStudents)
   .catch((error) => reportUserFacingError(error, { source: "MonthlyTuitionView.students", setErr }))
 }, [])

 useEffect(() => {
  setPreview(null)
  setSelectedKeys([])
 }, [studentId, firstMonth, monthCount])

 const loadPreview = async () => {
  if (!studentId) {
   setErr("請選擇學生")
   return
  }
  setLoading(true)
  setErr(null)
  try {
   const next = await fetchMonthlyTuitionPreview(studentId, months)
   setPreview(next)
   setSelectedKeys(
    next.lines
     .filter((line) => !["已繳", "已抵扣"].includes(line.status))
     .map((line) => line.key)
   )
  } catch (error) {
   reportUserFacingError(error, { source: "MonthlyTuitionView.preview", setErr })
  } finally {
   setLoading(false)
  }
 }

 const submit = async () => {
  if (saving || selectedLines.length === 0) return
  const unusual = selectedLines.filter((line) => line.calendarLessonCount !== 4)
  if (
   unusual.length > 0 &&
   !(await confirmDialog({
    title: "月份堂數不是 4 堂",
    description: unusual
     .map(
      (line) =>
       `${formatBillingMonth(line.billingMonth)} · ${line.classLabel}：${line.calendarLessonCount} 堂`
     )
     .join("\n"),
    confirmText: "確認仍然出單",
    tone: "warning",
   }))
  ) {
   return
  }
  setSaving(true)
  setErr(null)
  try {
   const paymentId = await createMonthlyTuitionPayment({
    studentId,
    selectedKeys,
    billingMonths: months,
    paymentDate,
    paymentMethod,
    paymentStatus,
    remarks: remarks.trim() || null,
   })
   pushBanner({
    tone: "success",
    title: paymentStatus === PAYMENT_STATUS.received ? "月費收款完成" : "月費帳單已建立",
    message: `${money(total)} · 單據 ${paymentId.slice(0, 8)}`,
   })
   setRemarks("")
   await loadPreview()
  } catch (error) {
   reportUserFacingError(error, { source: "MonthlyTuitionView.submit", setErr })
  } finally {
   setSaving(false)
  }
 }

 return (
  <div className="mx-auto max-w-7xl space-y-6">
   <header>
    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
     <CalendarRange className="h-7 w-7 text-warning" aria-hidden />
     每月學費
    </h1>
    <p className="mt-1 text-sm text-muted-foreground">
     按校曆、有效報讀及請假減收計算；可一次預繳最多 12 個月份。
    </p>
   </header>

   <section className="rounded-xl border border-border bg-card p-4">
    <div className="grid gap-3 md:grid-cols-4">
     <label className="text-sm md:col-span-2">
      <span className="mb-1 block text-muted-foreground">學生</span>
      <Select value={studentId} onChange={(event) => setStudentId(event.target.value)}>
       <option value="">請選擇學生</option>
       {students.map((student) => (
        <option key={student.id} value={student.id}>
         {student.full_name}{student.student_code ? `（${student.student_code}）` : ""}
        </option>
       ))}
      </Select>
     </label>
     <label className="text-sm">
      <span className="mb-1 block text-muted-foreground">首個帳期</span>
      <Input type="month" value={firstMonth} onChange={(event) => setFirstMonth(event.target.value)} />
     </label>
     <label className="text-sm">
      <span className="mb-1 block text-muted-foreground">預繳月數</span>
      <Select value={monthCount} onChange={(event) => setMonthCount(event.target.value)}>
       {Array.from({ length: 12 }, (_, index) => String(index + 1)).map((value) => (
        <option key={value} value={value}>{value} 個月</option>
       ))}
      </Select>
     </label>
    </div>
    <Button className="mt-3" type="button" variant="outline" onClick={() => void loadPreview()} disabled={loading}>
     {loading ? "計算中…" : "計算月費"}
    </Button>
   </section>

   {preview ? (
    <section className="space-y-3">
     <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
       <h2 className="text-base font-semibold">帳單明細</h2>
       <p className="text-xs text-muted-foreground">
        可用結餘：{money(preview.availableCreditBefore)}；本次後尚餘：{money(preview.availableCreditAfter)}
       </p>
      </div>
      <p className="text-lg font-semibold tabular-nums">本次應收：{money(total)}</p>
     </div>
     {preview.lines.length === 0 ? (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
       所選月份沒有有效報讀或排程。
      </p>
     ) : (
      <div className="overflow-x-auto rounded-lg border border-border">
       <table className="w-full min-w-[900px] table-fixed text-sm">
        <thead className="bg-muted/50 text-left">
         <tr>
          <th className="w-[5%] px-3 py-2 font-medium">選</th>
          <th className="w-[12%] px-3 py-2 font-medium">帳期</th>
          <th className="w-[24%] px-3 py-2 font-medium">班別</th>
          <th className="w-[10%] px-3 py-2 text-right font-medium">校曆堂數</th>
          <th className="w-[10%] px-3 py-2 text-right font-medium">請假減收</th>
          <th className="w-[10%] px-3 py-2 text-right font-medium">應收堂數</th>
          <th className="w-[11%] px-3 py-2 text-right font-medium">結餘抵扣</th>
          <th className="w-[10%] px-3 py-2 text-right font-medium">金額</th>
          <th className="w-[8%] px-3 py-2 font-medium">狀態</th>
         </tr>
        </thead>
        <tbody>
         {preview.lines.map((line) => {
          const disabled = ["已繳", "已抵扣"].includes(line.status)
          return (
           <tr key={line.key} className="border-t border-border align-top">
            <td className="px-3 py-2">
             <input
              type="checkbox"
              checked={selectedKeys.includes(line.key)}
              disabled={disabled}
              onChange={(event) =>
               setSelectedKeys((previous) =>
                event.target.checked
                 ? [...previous, line.key]
                 : previous.filter((key) => key !== line.key)
               )
              }
              aria-label={`選擇 ${line.billingMonth} ${line.classLabel}`}
             />
            </td>
            <td className="px-3 py-2 tabular-nums">{line.billingMonth}</td>
            <td className="break-words px-3 py-2">
             <span className="font-medium">{line.classLabel}</span>
             {line.warning ? <span className="mt-1 block text-xs text-warning">{line.warning}</span> : null}
            </td>
            <td className="px-3 py-2 text-right tabular-nums">{line.calendarLessonCount}</td>
            <td className="px-3 py-2 text-right tabular-nums">{line.leaveDeductionCount}</td>
            <td className="px-3 py-2 text-right tabular-nums">{line.chargeableLessonCount}</td>
            <td className="px-3 py-2 text-right tabular-nums">{money(line.creditApplied)}</td>
            <td className="px-3 py-2 text-right font-medium tabular-nums">{money(line.netAmount)}</td>
            <td className="px-3 py-2">
             <Tag tone={statusToTagTone(line.status)} size="sm">{line.status}</Tag>
            </td>
           </tr>
          )
         })}
        </tbody>
       </table>
      </div>
     )}
    </section>
   ) : null}

   {selectedLines.length > 0 ? (
    <section className="rounded-xl border border-border bg-card p-4">
     <h2 className="flex items-center gap-2 text-base font-semibold">
      <ReceiptText className="h-5 w-5" aria-hidden />
      收款／出單
     </h2>
     <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-sm">
       <span className="mb-1 block text-muted-foreground">操作</span>
       <Select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as typeof paymentStatus)}>
        <option value={PAYMENT_STATUS.received}>即時收款</option>
        <option value={PAYMENT_STATUS.pendingPay}>出單（待繳費）</option>
        <option value={PAYMENT_STATUS.pendingReceive}>待收款</option>
       </Select>
      </label>
      <label className="text-sm">
       <span className="mb-1 block text-muted-foreground">日期</span>
       <Input type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} />
      </label>
      <label className="text-sm">
       <span className="mb-1 block text-muted-foreground">付款方式</span>
       <Select
        value={paymentMethod}
        onChange={(event) =>
         setPaymentMethod(event.target.value as (typeof PAYMENT_METHOD_PRESETS)[number])
        }
       >
        {PAYMENT_METHOD_PRESETS.map((method) => <option key={method} value={method}>{method}</option>)}
       </Select>
      </label>
      <label className="text-sm">
       <span className="mb-1 block text-muted-foreground">備註</span>
       <Textarea className="min-h-9" rows={1} value={remarks} onChange={(event) => setRemarks(event.target.value)} />
      </label>
     </div>
     <Button className="mt-4" type="button" onClick={() => void submit()} disabled={saving}>
      {saving ? "處理中…" : paymentStatus === PAYMENT_STATUS.received ? `確認收款 ${money(total)}` : `建立帳單 ${money(total)}`}
     </Button>
    </section>
   ) : null}

   {err ? <p role="alert" className="text-sm text-destructive">{err}</p> : null}
  </div>
 )
}
