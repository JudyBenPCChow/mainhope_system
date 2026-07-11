import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ClipboardList, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
 Dialog,
 DialogContent,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog"
import { Tag } from "@/components/ui/tag"
import { Textarea } from "@/components/ui/textarea"
import { useAppBanner } from "@/lib/appBanner"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { statusToTagTone } from "@/lib/statusTag"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import {
 fetchPortalEnrollmentRequests,
 PORTAL_ENROLLMENT_STATUS_LABEL,
 reviewRequest,
 summarizeRequestLines,
 type PortalEnrollmentRequestRow,
 type PortalEnrollmentRequestStatus,
} from "@/services/portalEnrollmentRequestQueries"

type StatusFilter = "submitted" | "all"
type ReviewMode = "approve" | "reject"

function formatMoney(n: number): string {
 return `$${n.toLocaleString("zh-HK", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function formatDateTime(iso: string | null | undefined): string {
 if (!iso) return "—"
 return iso.slice(0, 19).replace("T", " ")
}

function statusLabel(status: PortalEnrollmentRequestStatus): string {
 return PORTAL_ENROLLMENT_STATUS_LABEL[status] ?? status
}

export function PortalEnrollmentRequestsView() {
 const { pushBanner } = useAppBanner()
 const [rows, setRows] = useState<PortalEnrollmentRequestRow[]>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)
 const [filter, setFilter] = useState<StatusFilter>("submitted")
 const [selectedId, setSelectedId] = useState<string | null>(null)

 const [reviewOpen, setReviewOpen] = useState(false)
 const [reviewMode, setReviewMode] = useState<ReviewMode>("approve")
 const [staffNote, setStaffNote] = useState("")
 const [reviewBusy, setReviewBusy] = useState(false)

 const load = useCallback(async () => {
  if (!isSupabaseConfigured) {
   setRows([])
   setLoading(false)
   return
  }
  setLoading(true)
  setErr(null)
  try {
   const data = await fetchPortalEnrollmentRequests({
    status: filter === "submitted" ? "submitted" : "",
    limit: 200,
   })
   setRows(data)
  } catch (e) {
   reportUserFacingError(e, { source: "PortalEnrollmentRequestsView.load", setErr })
   setRows([])
  } finally {
   setLoading(false)
  }
 }, [filter])

 useEffect(() => {
  void load()
 }, [load])

 useEffect(() => {
  if (rows.length === 0) {
   setSelectedId(null)
   return
  }
  if (!selectedId || !rows.some((r) => r.id === selectedId)) {
   setSelectedId(rows[0]!.id)
  }
 }, [rows, selectedId])

 const selected = useMemo(
  () => rows.find((r) => r.id === selectedId) ?? null,
  [rows, selectedId]
 )

 const openReview = (mode: ReviewMode) => {
  if (!selected || selected.status !== "submitted") return
  setReviewMode(mode)
  setStaffNote("")
  setReviewOpen(true)
 }

 const submitReview = async () => {
  if (!selected) return
  setReviewBusy(true)
  try {
   await reviewRequest(selected.id, reviewMode === "approve", staffNote)
   setReviewOpen(false)
   if (reviewMode === "approve") {
    pushBanner({
     tone: "success",
     title: "已核准",
     message: "已建立報讀與待繳費單",
    })
   } else {
    pushBanner({
     tone: "success",
     title: "已拒絕",
     message: "申請已標記為拒絕",
    })
   }
   await load()
  } catch (e) {
   reportUserFacingError(e, { source: "PortalEnrollmentRequestsView.submitReview" })
   pushBanner({
    tone: "error",
    title: reviewMode === "approve" ? "核准失敗" : "拒絕失敗",
    message: formatUnknownError(e),
   })
  } finally {
   setReviewBusy(false)
  }
 }

 return (
  <div className="space-y-6 p-4 md:p-6">
   <header className="flex flex-wrap items-end justify-between gap-4">
    <div>
     <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
      <ClipboardList className="h-8 w-8 text-teal-600" aria-hidden />
      家長報讀申請
     </h1>
     <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
      審核家長 Portal 提交的報讀申請。核准後會建立報讀紀錄與待繳費單。
     </p>
    </div>
    <Button
     type="button"
     variant="outline"
     size="sm"
     onClick={() => void load()}
     disabled={!isSupabaseConfigured || loading}
    >
     <RefreshCw className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")} />
     重新整理
    </Button>
   </header>

   {!isSupabaseConfigured ? (
    <div role="alert" className="rounded-lg border border-warning/50 bg-warning/10 px-3 py-2 text-sm text-warning">
     請設定 <code className="rounded bg-muted px-1">.env</code> 內 Supabase 後重啟 dev。
    </div>
   ) : null}

   {err ? (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
     {err}
    </div>
   ) : null}

   <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
    <div className="flex flex-wrap gap-2">
     {(
      [
       ["submitted", "待審核"],
       ["all", "全部"],
      ] as const
     ).map(([key, label]) => (
      <button
       key={key}
       type="button"
       onClick={() => setFilter(key)}
       className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium",
        filter === key
         ? "border-teal-600 bg-teal-600 text-white"
         : "border-border bg-background hover:bg-muted/60"
       )}
      >
       {label}
      </button>
     ))}
    </div>
    <p className="mt-3 text-xs text-muted-foreground">
     本頁最多顯示 200 筆（依申請時間新到舊）。目前筆數：
     <strong className="text-foreground"> {rows.length}</strong>
    </p>
   </div>

   {loading ? (
    <p className="text-sm text-muted-foreground">載入中…</p>
   ) : rows.length === 0 ? (
    <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
     {filter === "submitted" ? "目前沒有待審核的申請。" : "目前沒有報讀申請。"}
    </p>
   ) : (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
     <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full min-w-[40rem] table-fixed border-collapse text-sm">
       <thead>
        <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium text-muted-foreground">
         <th className="w-[22%] px-3 py-2">學生</th>
         <th className="w-[16%] px-3 py-2 whitespace-nowrap">申請時間</th>
         <th className="w-[12%] px-3 py-2 whitespace-nowrap">估計學費</th>
         <th className="w-[36%] px-3 py-2">班別摘要</th>
         <th className="w-[14%] px-3 py-2 whitespace-nowrap">狀態</th>
        </tr>
       </thead>
       <tbody>
        {rows.map((r) => {
         const active = r.id === selectedId
         return (
          <tr
           key={r.id}
           className={cn(
            "cursor-pointer border-b border-border/80 transition-colors",
            active ? "bg-teal-50/80" : "hover:bg-muted/40"
           )}
           onClick={() => setSelectedId(r.id)}
          >
           <td className="min-w-0 align-top px-3 py-2.5">
            <Link
             to={`/Students/${r.studentId}`}
             className="block break-words font-medium text-primary hover:underline"
             onClick={(e) => e.stopPropagation()}
            >
             {r.studentName}
            </Link>
            {r.studentCode ? (
             <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
              {r.studentCode}
             </span>
            ) : null}
           </td>
           <td className="min-w-0 align-top px-3 py-2.5 text-xs tabular-nums text-muted-foreground">
            {formatDateTime(r.createdAt)}
           </td>
           <td className="min-w-0 align-top px-3 py-2.5 tabular-nums font-medium">
            {formatMoney(r.estimatedTotal)}
           </td>
           <td className="min-w-0 align-top px-3 py-2.5 text-muted-foreground">
            <span className="line-clamp-2 break-words">{summarizeRequestLines(r.lines)}</span>
           </td>
           <td className="min-w-0 align-top px-3 py-2.5">
            <Tag tone={statusToTagTone(statusLabel(r.status))} size="sm">
             {statusLabel(r.status)}
            </Tag>
           </td>
          </tr>
         )
        })}
       </tbody>
      </table>
     </div>

     <aside className="rounded-xl border border-border bg-card p-4 shadow-sm">
      {!selected ? (
       <p className="text-sm text-muted-foreground">請選擇一筆申請查看詳情。</p>
      ) : (
       <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
         <div>
          <h2 className="text-lg font-semibold tracking-tight">申請詳情</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
           {formatDateTime(selected.createdAt)}
          </p>
         </div>
         <Tag tone={statusToTagTone(statusLabel(selected.status))} size="sm">
          {statusLabel(selected.status)}
         </Tag>
        </div>

        <div className="space-y-1 text-sm">
         <div>
          <span className="text-muted-foreground">學生：</span>
          <Link
           to={`/Students/${selected.studentId}`}
           className="font-medium text-primary hover:underline"
          >
           {selected.studentName}
          </Link>
          {selected.studentCode ? (
           <span className="ml-1.5 text-xs tabular-nums text-muted-foreground">
            ({selected.studentCode})
           </span>
          ) : null}
         </div>
         <div>
          <span className="text-muted-foreground">估計學費：</span>
          <span className="tabular-nums font-medium">{formatMoney(selected.estimatedTotal)}</span>
          {selected.estimatedSubtotal !== selected.estimatedTotal ? (
           <span className="ml-1.5 text-xs text-muted-foreground">
            （小計 {formatMoney(selected.estimatedSubtotal)}）
           </span>
          ) : null}
         </div>
         {selected.paymentId ? (
          <div>
           <span className="text-muted-foreground">繳費單：</span>
           <Link
            to={`/Payments?studentId=${selected.studentId}`}
            className="text-primary hover:underline"
           >
            查看（{selected.paymentId.slice(0, 8)}…）
           </Link>
          </div>
         ) : null}
         {selected.reviewedAt ? (
          <div className="text-xs text-muted-foreground">
           審核時間：{formatDateTime(selected.reviewedAt)}
          </div>
         ) : null}
        </div>

        <div>
         <h3 className="mb-2 text-sm font-medium">報讀明細</h3>
         {selected.lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">無明細行。</p>
         ) : (
          <ul className="space-y-2">
           {selected.lines.map((line) => (
            <li
             key={line.id}
             className="rounded-lg border border-border/80 bg-muted/20 px-3 py-2 text-sm"
            >
             <div className="flex flex-wrap items-start justify-between gap-2">
              <Link
               to={`/Classes/${line.classId}`}
               className="font-medium text-primary hover:underline"
              >
               {line.classLabel?.trim() || "班別"}
              </Link>
              <span className="tabular-nums font-medium">
               {formatMoney(line.lineSubtotal)}
              </span>
             </div>
             <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              {line.enrollmentPeriod ? <span>期數：{line.enrollmentPeriod}</span> : null}
              <span>堂數：{line.lessonCount}</span>
              {line.unitPrice != null ? (
               <span>單價：{formatMoney(line.unitPrice)}</span>
              ) : null}
              {line.enrollmentPeriod === "單堂" && line.scheduleIds.length > 0 ? (
               <span>選堂：{line.scheduleIds.length} 堂</span>
              ) : null}
             </div>
            </li>
           ))}
          </ul>
         )}
        </div>

        <div>
         <h3 className="mb-1 text-sm font-medium">家長備註</h3>
         <p className="whitespace-pre-wrap rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
          {selected.parentNote?.trim() || "（無）"}
         </p>
        </div>

        {selected.staffNote ? (
         <div>
          <h3 className="mb-1 text-sm font-medium">職員備註</h3>
          <p className="whitespace-pre-wrap rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm">
           {selected.staffNote}
          </p>
         </div>
        ) : null}

        {selected.status === "submitted" ? (
         <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Button
           type="button"
           className="bg-success text-white hover:bg-success/90"
           onClick={() => openReview("approve")}
          >
           核准
          </Button>
          <Button type="button" variant="outline" onClick={() => openReview("reject")}>
           拒絕
          </Button>
         </div>
        ) : null}
       </div>
      )}
     </aside>
    </div>
   )}

   <Dialog
    open={reviewOpen}
    onOpenChange={(open) => {
     if (reviewBusy) return
     setReviewOpen(open)
    }}
   >
    <DialogContent className="max-w-md">
     <DialogHeader>
      <DialogTitle>{reviewMode === "approve" ? "核准報讀申請" : "拒絕報讀申請"}</DialogTitle>
     </DialogHeader>
     <div className="space-y-3 text-sm">
      {reviewMode === "approve" ? (
       <p className="text-muted-foreground">
        核准後將建立報讀紀錄與待繳費單，確定繼續？
       </p>
      ) : (
       <p className="text-muted-foreground">拒絕後申請狀態會改為已拒絕。</p>
      )}
      <label className="block space-y-1.5">
       <span className="text-muted-foreground">職員備註（選填）</span>
       <Textarea
        value={staffNote}
        onChange={(e) => setStaffNote(e.target.value)}
        placeholder="可填寫審核說明…"
        rows={3}
        disabled={reviewBusy}
       />
      </label>
     </div>
     <DialogFooter>
      <Button
       type="button"
       variant="outline"
       disabled={reviewBusy}
       onClick={() => setReviewOpen(false)}
      >
       取消
      </Button>
      <Button
       type="button"
       disabled={reviewBusy}
       className={
        reviewMode === "approve"
         ? "bg-success text-white hover:bg-success/90"
         : undefined
       }
       variant={reviewMode === "reject" ? "destructive" : "default"}
       onClick={() => void submitReview()}
      >
       {reviewBusy
        ? "處理中…"
        : reviewMode === "approve"
          ? "確認核准"
          : "確認拒絕"}
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </div>
 )
}
