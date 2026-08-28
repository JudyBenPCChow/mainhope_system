import { useCallback, useEffect, useState } from "react"
import { CheckCircle2, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import {
 fetchPendingReferralRebates,
 markReferralRebatePaid,
 type ReferralRecordRow,
} from "@/services/referralQueries"

function money(n: number): string {
 return new Intl.NumberFormat("zh-Hant", { style: "currency", currency: "HKD" }).format(n)
}

function formatDate(iso: string): string {
 if (!iso) return "—"
 return iso.slice(0, 10)
}

export function ReferralRebatesView() {
 const [rows, setRows] = useState<ReferralRecordRow[]>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)
 const [payingId, setPayingId] = useState<string | null>(null)

 const load = useCallback(async () => {
  if (!isSupabaseConfigured) {
   setRows([])
   setLoading(false)
   return
  }
  setLoading(true)
  setErr(null)
  try {
   const data = await fetchPendingReferralRebates()
   setRows(data)
  } catch (e) {
   reportUserFacingError(e, { source: "ReferralRebatesView.load", setErr })
   setRows([])
  } finally {
   setLoading(false)
  }
 }, [])

 useEffect(() => {
  void load()
 }, [load])

 const onMarkPaid = async (row: ReferralRecordRow) => {
  setPayingId(row.id)
  try {
   await markReferralRebatePaid(row.id)
   await load()
  } catch (e) {
   reportUserFacingError(e, { source: "ReferralRebatesView.onMarkPaid", setErr })
  } finally {
   setPayingId(null)
  }
 }

 const totalPending = rows.reduce((s, r) => s + r.referrerRebateAmount, 0)

 return (
  <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <div>
     <h1 className="text-2xl font-semibold tracking-tight">推薦回贈待發</h1>
     <p className="mt-1 hidden text-sm text-muted-foreground md:block">
      舊生推薦新生後，被推薦人學費減免於繳費單處理；推薦人現金回贈於此清單標記已付。
     </p>
    </div>
    <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
     <RefreshCw className="h-4 w-4" aria-hidden />
     重新載入
    </Button>
   </div>

   {err ? (
    <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
     {err}
    </p>
   ) : null}

   <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
    <span className="text-muted-foreground">待發筆數：</span>
    <span className="font-medium tabular-nums">{rows.length}</span>
    <span className="mx-2 text-muted-foreground">·</span>
    <span className="text-muted-foreground">待發總額：</span>
    <span className="font-semibold tabular-nums text-warning">{money(totalPending)}</span>
   </div>

   {loading ? (
    <p className="text-sm text-muted-foreground">載入中…</p>
   ) : rows.length === 0 ? (
    <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
     目前沒有待發推薦回贈。
    </div>
   ) : (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
     <table className="w-full min-w-[720px] border-collapse text-left text-sm">
      <thead className="border-b bg-muted/40">
       <tr>
        <th className="px-3 py-2 font-medium">建立日</th>
        <th className="px-3 py-2 font-medium">推薦人</th>
        <th className="px-3 py-2 font-medium">被推薦人</th>
        <th className="px-3 py-2 font-medium">回贈金額</th>
        <th className="px-3 py-2 font-medium">付款單</th>
        <th className="px-3 py-2 font-medium">操作</th>
       </tr>
      </thead>
      <StaggerList as="tbody">
       {rows.map((r) => (
        <StaggerItem key={r.id} as="tr" className="border-b border-border/80 last:border-0">
         <td className="px-3 py-2 tabular-nums text-muted-foreground">{formatDate(r.createdAt)}</td>
         <td className="px-3 py-2 font-medium">{r.referrerName}</td>
         <td className="px-3 py-2">{r.refereeName}</td>
         <td className="px-3 py-2 tabular-nums font-medium">{money(r.referrerRebateAmount)}</td>
         <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{r.paymentId.slice(0, 8)}…</td>
         <td className="px-3 py-2">
          <Button
           type="button"
           size="sm"
           variant="outline"
           disabled={payingId === r.id}
           onClick={() => void onMarkPaid(r)}
          >
           <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
           標記已付
          </Button>
         </td>
        </StaggerItem>
       ))}
      </StaggerList>
     </table>
    </div>
   )}
  </div>
 )
}
