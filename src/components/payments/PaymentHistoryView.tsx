import { useCallback, useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { History, Search, SlidersHorizontal, Wallet } from "lucide-react"

import { MobileFilterSheet } from "@/components/mobile/MobileFilterSheet"
import {
 FormField,
 PENDING_PAYMENT_STATUSES,
 money,
 selectClassName,
 statusBadge,
} from "@/components/payments/paymentsUi"
import { PaymentReceiptDownloadButton } from "@/components/payments/PaymentReceiptDownloadButton"
import { PaymentReceiptWhatsAppButton } from "@/components/payments/PaymentReceiptWhatsAppButton"
import { VoidPaymentDialog, type VoidPaymentTarget } from "@/components/payments/VoidPaymentDialog"
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
import { useAppConfirm } from "@/lib/appConfirm"
import { confirmNonCurrentAcademicYearWrite } from "@/lib/academicYearSoftGuard"
import { useIsMobile } from "@/hooks/use-mobile"
import { buildPaymentAmountBreakdown } from "@/lib/paymentAmountBreakdown"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isAdminOrAlien } from "@/lib/mgmtRole"
import { RECEIPT_DOWNLOAD_FOLDER_DISPLAY_PATH } from "@/lib/receiptDownloadFolder"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import {
 PAYMENT_METHOD_PRESETS,
 PAYMENT_STATUS,
 fetchPaymentFull,
 fetchPaymentsList,
 markPaymentReceived,
 type PaymentFull,
 type PaymentListRow,
} from "@/services/paymentQueries"
import { fetchAllStudents, type StudentRecord } from "@/services/studentQueries"

export function PaymentHistoryView() {
 const isMobile = useIsMobile()
 const { confirmDialog } = useAppConfirm()
 const [filtersOpen, setFiltersOpen] = useState(false)
 const [searchParams, setSearchParams] = useSearchParams()

 const [historyRows, setHistoryRows] = useState<PaymentListRow[]>([])
 const [histLoading, setHistLoading] = useState(true)
 const [histErr, setHistErr] = useState<string | null>(null)
 const [histStatus, setHistStatus] = useState<
  "all" | "received" | "pending" | "pendingPay" | "pendingReceive" | "voided"
 >("all")
 const [histFrom, setHistFrom] = useState("")
 const [histTo, setHistTo] = useState("")
 const [histSearch, setHistSearch] = useState("")
 const [filterStudentId, setFilterStudentId] = useState<string | null>(null)
 const [filterStudent, setFilterStudent] = useState<StudentRecord | null>(null)

 const [detailOpen, setDetailOpen] = useState(false)
 const [detailPay, setDetailPay] = useState<PaymentFull | null>(null)
 const [detailLoading, setDetailLoading] = useState(false)

 const [markOpen, setMarkOpen] = useState(false)
 const [markTarget, setMarkTarget] = useState<PaymentListRow | null>(null)
 const [markMethod, setMarkMethod] = useState<string>(PAYMENT_METHOD_PRESETS[0] ?? "現金")
 const [saving, setSaving] = useState(false)

 const [voidOpen, setVoidOpen] = useState(false)
 const [voidTarget, setVoidTarget] = useState<VoidPaymentTarget | null>(null)
 const canVoidPayment = isAdminOrAlien()
 const canMarkReceived = isAdminOrAlien()

 const [formErr, setFormErr] = useState<string | null>(null)
 const [receivedDone, setReceivedDone] = useState<{
  paymentId: string
  amount: number
  studentId: string
  studentName: string
 } | null>(null)

 useEffect(() => {
  const hs = searchParams.get("histStatus")
  if (
   hs === "all" ||
   hs === "received" ||
   hs === "pending" ||
   hs === "pendingPay" ||
   hs === "pendingReceive" ||
   hs === "voided"
  ) {
   setHistStatus(hs)
  }
  const sid = searchParams.get("studentId")?.trim() ?? ""
  if (sid) {
   setFilterStudentId(sid)
   setSearchParams(
    (prev) => {
     const next = new URLSearchParams(prev)
     next.delete("studentId")
     return next
    },
    { replace: true }
   )
  }
 }, [searchParams, setSearchParams])

 useEffect(() => {
  if (!filterStudentId || !isSupabaseConfigured) {
   setFilterStudent(null)
   return
  }
  let cancelled = false
  void fetchAllStudents()
   .then((list) => {
    if (cancelled) return
    setFilterStudent(list.find((s) => s.id === filterStudentId) ?? null)
   })
   .catch(() => {
    if (!cancelled) setFilterStudent(null)
   })
  return () => {
   cancelled = true
  }
 }, [filterStudentId])

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
    studentId: filterStudentId || undefined,
    limit: 500,
   })
   setHistoryRows(rows)
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentHistoryView.loadHistory", setErr: setHistErr })
   setHistoryRows([])
  } finally {
   setHistLoading(false)
  }
 }, [histStatus, histFrom, histTo, histSearch, filterStudentId])

 useEffect(() => {
  void loadHistory()
 }, [loadHistory])

 const openDetail = async (row: PaymentListRow) => {
  setDetailOpen(true)
  setDetailLoading(true)
  setDetailPay(null)
  try {
   setDetailPay(await fetchPaymentFull(row.id))
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentHistoryView.openDetail", setErr: setFormErr })
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
  if (!markTarget || saving) return
  if (
   !(await confirmNonCurrentAcademicYearWrite(confirmDialog, {
    dateYmd: markTarget.paymentDate,
    source: "PaymentHistoryView.confirmMarkReceived",
   }))
  ) {
   return
  }
  setSaving(true)
  setFormErr(null)
  try {
   await markPaymentReceived(markTarget.id, { paymentMethod: markMethod })
   setReceivedDone({
    paymentId: markTarget.id,
    amount: markTarget.totalAmount,
    studentId: markTarget.studentId,
    studentName: markTarget.studentName,
   })
   setMarkOpen(false)
   setMarkTarget(null)
   void loadHistory()
  } catch (e) {
   reportUserFacingError(e, { source: "PaymentHistoryView.confirmMarkReceived", setErr: setFormErr })
  } finally {
   setSaving(false)
  }
 }

 const onVoidRow = (row: PaymentListRow) => {
  if (row.status === PAYMENT_STATUS.voided) return
  setVoidTarget({
   id: row.id,
   receiptNumber: row.receiptNumber,
   studentName: row.studentName,
   totalAmount: row.totalAmount,
   paymentDate: row.paymentDate,
   status: row.status,
  })
  setVoidOpen(true)
 }

 const activeFilterCount = [
  histStatus !== "all",
  Boolean(histFrom),
  Boolean(histTo),
  Boolean(histSearch.trim()),
  Boolean(filterStudentId),
 ].filter(Boolean).length

 return (
  <div className="space-y-6 md:p-6">
   <header className="flex flex-wrap items-end justify-between gap-4">
    <div>
     <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
      <History className="h-8 w-8 text-warning" aria-hidden />
      繳費紀錄
     </h1>
     <p className="mt-1 hidden text-sm text-muted-foreground md:block">
      查詢、下載收據、以 WhatsApp 傳送 PDF 收據、將待收款（及歷史待繳費）單據標記為已收款。收款請至「收款登記」。下期學費請用文字提醒，勿再開收據式待繳費單。
     </p>
     <p className="mt-1 hidden max-w-3xl text-xs text-muted-foreground md:block">
      下載收據（Chrome）：首次請選取資料夾「{RECEIPT_DOWNLOAD_FOLDER_DISPLAY_PATH}」，之後會自動存入。
     </p>
    </div>
    <Button type="button" variant="outline" asChild>
     <Link to="/Payments">
      <Wallet className="h-4 w-4" />
      前往收款登記
     </Link>
    </Button>
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
      已標記收款 {money(receivedDone.amount)}
      <span className="ml-2 font-normal text-muted-foreground">· {receivedDone.studentName}</span>
     </p>
     <div className="flex flex-wrap gap-2">
      <PaymentReceiptDownloadButton paymentId={receivedDone.paymentId} />
      <PaymentReceiptWhatsAppButton paymentId={receivedDone.paymentId} />
      <Button type="button" size="sm" variant="outline" asChild>
       <Link to={`/Students/${receivedDone.studentId}`}>返回學生頁</Link>
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setReceivedDone(null)}>
       關閉
      </Button>
     </div>
    </div>
   ) : null}

   {filterStudentId ? (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
     <span className="text-muted-foreground">目前篩選學生：</span>
     <span className="font-medium">
      {filterStudent?.full_name ?? "（載入中…）"}
      {filterStudent?.student_code ? `（${filterStudent.student_code}）` : null}
     </span>
     <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={() => {
       setFilterStudentId(null)
       setFilterStudent(null)
      }}
     >
      清除學生篩選
     </Button>
     <Button type="button" size="sm" variant="outline" asChild>
      <Link to={`/Payments?studentId=${encodeURIComponent(filterStudentId)}`}>為此生收款</Link>
     </Button>
    </div>
   ) : null}

   {!isSupabaseConfigured ? (
    <div role="alert" className="rounded-lg border border-warning/50 bg-warning/10 px-3 py-2 text-sm text-warning">
     請設定 <code className="rounded bg-muted px-1">.env</code> 內 Supabase 後重啟 dev。
    </div>
   ) : null}

   <div className="space-y-4">
    {isMobile ? (
     <>
      <div className="flex items-center gap-2">
       <Button type="button" variant="outline" className="gap-2" onClick={() => setFiltersOpen(true)}>
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        篩選
        {activeFilterCount > 0 ? (
         <Tag tone="info" size="sm">
          {activeFilterCount}
         </Tag>
        ) : null}
       </Button>
       <Button
        type="button"
        variant="secondary"
        className="shrink-0"
        disabled={!isSupabaseConfigured}
        onClick={() => void loadHistory()}
       >
        重新載入
       </Button>
      </div>
      <MobileFilterSheet
       open={filtersOpen}
       onClose={() => {
        setFiltersOpen(false)
        void loadHistory()
       }}
       title="篩選繳費紀錄"
       activeCount={activeFilterCount}
       onReset={() => {
        setHistStatus("all")
        setHistFrom("")
        setHistTo("")
        setHistSearch("")
        setFilterStudentId(null)
        setFilterStudent(null)
       }}
      >
       <FormField label="狀態">
        <Select
         className={cn(selectClassName(), "w-full")}
         value={histStatus}
         onChange={(e) => setHistStatus(e.target.value as typeof histStatus)}
        >
         <option value="all">全部</option>
         <option value="received">已收款</option>
         <option value="pending">待收款／歷史待繳</option>
         <option value="pendingReceive">待收款</option>
         <option value="pendingPay">歷史待繳費</option>
         <option value="voided">作廢</option>
        </Select>
       </FormField>
       <FormField label="起日">
        <Input type="date" value={histFrom} onChange={(e) => setHistFrom(e.target.value)} className="w-full" />
       </FormField>
       <FormField label="迄日">
        <Input type="date" value={histTo} onChange={(e) => setHistTo(e.target.value)} className="w-full" />
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
      </MobileFilterSheet>
     </>
    ) : (
     <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <FormField label="狀態">
       <Select
        className={cn(selectClassName(), "min-w-[140px]")}
        value={histStatus}
        onChange={(e) => setHistStatus(e.target.value as typeof histStatus)}
       >
        <option value="all">全部</option>
        <option value="received">已收款</option>
         <option value="pending">待收款／歷史待繳</option>
         <option value="pendingReceive">待收款</option>
         <option value="pendingPay">歷史待繳費</option>
        <option value="voided">作廢</option>
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
    )}

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
    ) : isMobile ? (
     <div className="space-y-3">
      {historyRows.map((r) => {
       const pending = PENDING_PAYMENT_STATUSES.includes(
        r.status as (typeof PENDING_PAYMENT_STATUSES)[number]
       )
       return (
        <article key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
         <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
           <p className="text-xs tabular-nums text-muted-foreground">{r.paymentDate}</p>
           <p className="font-mono text-xs">{r.receiptNumber ?? "—"}</p>
           <Link className="mt-1 block font-semibold text-primary hover:underline" to={`/Students/${r.studentId}`}>
            {r.studentName}
           </Link>
           {r.studentCode ? <p className="text-xs text-muted-foreground">({r.studentCode})</p> : null}
          </div>
          {statusBadge(r.status)}
         </div>
         <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <p className="text-muted-foreground">金額</p>
          <p className="text-right tabular-nums font-medium">{money(r.totalAmount)}</p>
          <p className="text-muted-foreground">方式</p>
          <p className="text-right">{r.paymentMethod ?? "—"}</p>
          <p className="text-muted-foreground">優惠</p>
          <p className="truncate text-right">{r.discountName ?? "—"}</p>
         </div>
         <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void openDetail(r)}>
           詳情
          </Button>
          <PaymentReceiptDownloadButton paymentId={r.id} />
          <PaymentReceiptWhatsAppButton paymentId={r.id} contactPhone={r.contactPhone} />
          {pending && canMarkReceived ? (
           <Button type="button" size="sm" onClick={() => openMarkReceived(r)}>
            標記已收
           </Button>
          ) : null}
          {canVoidPayment && r.status !== PAYMENT_STATUS.voided ? (
           <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onVoidRow(r)}
           >
            作廢
           </Button>
          ) : null}
         </div>
        </article>
       )
      })}
     </div>
    ) : (
     <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full min-w-[960px] table-fixed border-collapse text-left text-sm">
       <thead className="border-b bg-muted/40">
        <tr>
         <th className="w-[10%] px-3 py-2 font-medium">日期</th>
         <th className="w-[12%] px-3 py-2 font-medium">單號</th>
         <th className="w-[16%] px-3 py-2 font-medium">學生</th>
         <th className="w-[11%] px-3 py-2 font-medium">優惠</th>
         <th className="w-[10%] px-3 py-2 font-medium text-right">金額</th>
         <th className="w-[9%] px-3 py-2 font-medium">方式</th>
         <th className="w-[12%] px-3 py-2 font-medium">狀態</th>
         <th className="w-[20%] px-3 py-2 font-medium">操作</th>
        </tr>
       </thead>
       <tbody>
        {historyRows.map((r) => {
         const pending = PENDING_PAYMENT_STATUSES.includes(
          r.status as (typeof PENDING_PAYMENT_STATUSES)[number]
         )
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
             <PaymentReceiptDownloadButton paymentId={r.id} />
             <PaymentReceiptWhatsAppButton paymentId={r.id} contactPhone={r.contactPhone} />
             {pending && canMarkReceived ? (
              <Button type="button" size="sm" onClick={() => openMarkReceived(r)}>
               標記已收
              </Button>
             ) : null}
             {canVoidPayment && r.status !== PAYMENT_STATUS.voided ? (
              <Button
               type="button"
               variant="ghost"
               size="sm"
               className="text-destructive hover:text-destructive"
               onClick={() => onVoidRow(r)}
              >
               作廢
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

   <VoidPaymentDialog
    open={voidOpen}
    target={voidTarget}
    onOpenChange={(open) => {
     setVoidOpen(open)
     if (!open) setVoidTarget(null)
    }}
    onVoided={() => void loadHistory()}
   />

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
        <PaymentReceiptDownloadButton payment={detailPay} />
        <PaymentReceiptWhatsAppButton payment={detailPay} contactPhone={detailPay.contactPhone} />
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
        將 <strong>{markTarget.studentName}</strong> 的 {money(markTarget.totalAmount)}{" "}
        標記為已收。收據編號將由系統自動產生。
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
        {saving ? "處理中…" : "確認"}
       </Button>
      </div>
     ) : null}
    </DialogContent>
   </Dialog>
  </div>
 )
}
