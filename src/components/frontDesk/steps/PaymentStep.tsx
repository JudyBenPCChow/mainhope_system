import { useEffect, useMemo, useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { localTodayYmd } from "@/components/frontDesk/frontDeskUi"
import {
 DEFAULT_LESSON_COUNT,
 DEFAULT_TRIAL_LESSON_COUNT,
 FormField,
 TRIAL_SELECT_VALUE,
 TrialClassPicker,
 classRecordToPriceInfo,
 enrollmentLabel,
 money,
 newLine,
 SectionCard,
 selectClassName,
 type ClassPriceInfo,
 type LineRow,
 type TrialPayType,
} from "@/components/payments/paymentsUi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatClassLabel } from "@/lib/courseLabel"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { cn } from "@/lib/utils"
import { fetchAllClasses } from "@/services/classQueries"
import {
 insertPaymentRecord,
 PAYMENT_METHOD_PRESETS,
 PAYMENT_STATUS,
 type PaymentDetailInput,
} from "@/services/paymentQueries"
import {
 fetchEnrollmentsForStudent,
 type EnrollmentWithClass,
 type StudentRecord,
} from "@/services/studentQueries"

function lineAmount(
 line: LineRow,
 enrollments: EnrollmentWithClass[],
 trialById: Map<string, ClassPriceInfo>
): string {
 const n = Number(line.lessons)
 if (!Number.isFinite(n) || n <= 0) return ""
 if (line.kind === "trial") {
  const c = trialById.get(line.classId)
  const base = c?.pricePerLesson
  if (!(base != null && base > 0)) return ""
  const unit = line.trialType === "半價試堂" ? base * 0.5 : base
  return String(Math.round(unit * n * 100) / 100)
 }
 const e = enrollments.find((x) => x.classId === line.classId)
 if (!e?.pricePerLesson) return ""
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
 const [trialClasses, setTrialClasses] = useState<ClassPriceInfo[]>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)
 const [mode, setMode] = useState<"receive" | "invoice">("receive")
 const [payDate, setPayDate] = useState(localTodayYmd())
 const [method, setMethod] = useState<string>(PAYMENT_METHOD_PRESETS[0] ?? "現金")
 const [invoiceStatus, setInvoiceStatus] = useState<string>(PAYMENT_STATUS.pendingReceive)
 const [remarks, setRemarks] = useState("")
 const [lines, setLines] = useState<LineRow[]>([newLine("trial")])
 const [saving, setSaving] = useState(false)

 const trialById = useMemo(() => {
  const m = new Map<string, ClassPriceInfo>()
  for (const c of trialClasses) m.set(c.id, c)
  return m
 }, [trialClasses])

 useEffect(() => {
  let cancelled = false
  setLoading(true)
  void Promise.all([fetchEnrollmentsForStudent(student.id), fetchAllClasses()])
   .then(([list, classes]) => {
    if (cancelled) return
    const active = list.filter((e) => e.status !== "已退讀")
    setEnrollments(active)
    setTrialClasses(classes.map(classRecordToPriceInfo))
    if (active.length > 0) {
     const first = active[0]!
     setLines([
      {
       ...newLine("enrollment"),
       classId: first.classId,
       amount: lineAmount(
        { ...newLine("enrollment"), classId: first.classId, lessons: DEFAULT_LESSON_COUNT },
        active,
        new Map()
       ),
      },
     ])
    } else {
     setLines([newLine("trial")])
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
  const locked = new Set(
   lines.filter((l) => l.key !== key && l.kind === "enrollment" && l.classId).map((l) => l.classId)
  )
  return enrollments.filter((e) => e.classId === classId || !locked.has(e.classId))
 }

 const updateLine = (
  key: string,
  patch: Partial<Pick<LineRow, "kind" | "classId" | "lessons" | "amount" | "trialType">>
 ) => {
  setLines((prev) =>
   prev.map((line) => {
    if (line.key !== key) return line
    const next = { ...line, ...patch }
    if (patch.kind === "trial") {
     next.classId = patch.classId ?? ""
     if (!next.lessons || next.lessons === DEFAULT_LESSON_COUNT) {
      next.lessons = DEFAULT_TRIAL_LESSON_COUNT
     }
    }
    if (patch.kind === "enrollment") {
     next.trialType = "原價試堂"
     if (!next.lessons || next.lessons === DEFAULT_TRIAL_LESSON_COUNT) {
      next.lessons = DEFAULT_LESSON_COUNT
     }
    }
    if (
     patch.classId != null ||
     patch.lessons != null ||
     patch.kind != null ||
     patch.trialType != null
    ) {
     const auto = lineAmount(next, enrollments, trialById)
     if (auto) next.amount = auto
    }
    return next
   })
  )
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

 const addLine = () => {
  const taken = new Set(
   lines.filter((l) => l.kind === "enrollment" && l.classId).map((l) => l.classId)
  )
  const nextClass = enrollments.find((e) => !taken.has(e.classId))
  if (nextClass) {
   setLines((prev) => [
    ...prev,
    {
     ...newLine("enrollment"),
     classId: nextClass.classId,
     amount: lineAmount(
      { ...newLine("enrollment"), classId: nextClass.classId },
      enrollments,
      trialById
     ),
    },
   ])
   return
  }
  setLines((prev) => [...prev, newLine("trial")])
 }

 const buildDetails = (): PaymentDetailInput[] =>
  lines
   .filter((l) => l.classId && Number(l.lessons) > 0)
   .map((l) => {
    const amt = Number(l.amount)
    if (l.kind === "trial") {
     const t = trialById.get(l.classId)
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
    const e = enrollments.find((x) => x.classId === l.classId)
    return {
     classId: l.classId,
     lessonCount: Number(l.lessons),
     amount: Number.isFinite(amt) && amt > 0 ? amt : null,
     description: e
      ? formatClassLabel({ subject: e.subject, courseCode: e.courseCode, courseName: e.courseName })
      : null,
    }
   })

 const onSubmit = async () => {
  if (saving) return
  if (loading) {
   setErr("載入收費資料中…")
   return
  }
  const details = buildDetails()
  if (details.length === 0) {
   const hasTrialWithoutClass = lines.some((l) => l.kind === "trial" && !l.classId)
   setErr(hasTrialWithoutClass ? "請為試堂項目選擇班別。" : "請至少新增一筆班別與堂數。")
   return
  }
  if (subtotal <= 0) {
   setErr("請確認各項金額。")
   return
  }
  if (
   !(await confirmDialog({
    title: mode === "receive" ? "確認收款" : "確認出單",
    description: `應收 ${money(subtotal)}，確定送出？`,
    confirmText: mode === "receive" ? "確認收款" : "確認出單",
   }))
  ) {
   return
  }
  setSaving(true)
  setErr(null)
  try {
   await insertPaymentRecord({
    studentId: student.id,
    paymentDate: payDate,
    totalAmount: subtotal,
    subtotalAmount: subtotal,
    paymentMethod: method,
    status: mode === "receive" ? PAYMENT_STATUS.received : invoiceStatus,
    remarks: remarks.trim() || null,
    receiptKind: "RC",
    details,
   })
   pushBanner({
    tone: "success",
    title: mode === "receive" ? "收款成功" : "已建立繳費單",
    message: `${student.full_name} · ${money(subtotal)}`,
   })
   onPaymentDone()
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentStep.submit", setErr })
  } finally {
   setSaving(false)
  }
 }

 return (
  <div className="space-y-4">
   <SectionCard title="1. 學生" description="確認本次收款學生與報讀概況。">
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-3 text-sm">
     <div className="font-medium text-foreground">
      {student.full_name}
      {student.student_code ? `（${student.student_code}）` : ""}
     </div>
     <div className="mt-1 text-muted-foreground">
      年級 {student.grade || "—"}
      {loading ? " · 載入中…" : ` · 報讀 ${enrollments.length} 班`}
     </div>
     {enrollments.length > 0 ? (
      <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
       {enrollments.map((e) => (
        <li key={e.id}>{enrollmentLabel(e)}</li>
       ))}
      </ul>
     ) : !loading ? (
      <p className="mt-2 text-info-foreground">尚無報讀，可直接以「試堂」收費。</p>
     ) : null}
    </div>
   </SectionCard>

   <SectionCard title="2. 本次應收內容" description="選定收費項目後，核對應收總額再進入收款操作。">
    {loading ? (
     <p className="text-sm text-muted-foreground">載入收費資料中…</p>
    ) : (
     <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
       <span className="text-sm font-medium">收費項目（已報讀或試堂）</span>
       <Button type="button" variant="outline" size="sm" onClick={addLine}>
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
           row.kind === "trial" ? "sm:grid-cols-2" : "sm:grid-cols-[minmax(0,1fr)_100px_120px]"
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
              onChange={(classId) => updateLine(row.key, { classId })}
             />
            </FormField>
            <FormField label="試堂類型">
             <Select
              className={selectClassName()}
              value={row.trialType}
              onChange={(e) => updateLine(row.key, { trialType: e.target.value as TrialPayType })}
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
         </div>
         <div className="flex justify-end">
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
      </div>
     </div>
    )}
   </SectionCard>

   <SectionCard
    title={mode === "receive" ? "3. 本次收款操作" : "3. 本次出單操作"}
    description="確認後送出；亦可略過收款稍後再處理。"
   >
    <div className="mb-3 flex flex-wrap gap-2">
     <Button
      type="button"
      size="sm"
      variant={mode === "receive" ? "default" : "outline"}
      onClick={() => setMode("receive")}
     >
      即時收款
     </Button>
     <Button
      type="button"
      size="sm"
      variant={mode === "invoice" ? "default" : "outline"}
      onClick={() => setMode("invoice")}
     >
      先出單
     </Button>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
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
       </Select>
      </FormField>
     ) : null}
     <FormField label="備註">
      <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
     </FormField>
    </div>
    {err ? (
     <p role="alert" className="mt-3 text-sm text-destructive">
      {err}
     </p>
    ) : null}
    <div className="mt-4 flex flex-wrap gap-2">
     <Button type="button" onClick={() => void onSubmit()} disabled={saving || loading}>
      {saving ? "送出中…" : mode === "receive" ? "確認收款" : "確認出單"}
     </Button>
     <Button type="button" variant="outline" onClick={onSkipPayment} disabled={saving}>
      略過收款
     </Button>
    </div>
   </SectionCard>
  </div>
 )
}
