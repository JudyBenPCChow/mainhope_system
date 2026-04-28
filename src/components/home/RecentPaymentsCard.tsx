import { Link } from "react-router-dom"
import { Banknote } from "lucide-react"

import { formatMoney, formatDateZh } from "@/components/home/format"
import type { RecentPaymentRow } from "@/services/dashboard"

type Props = {
 payments: RecentPaymentRow[]
 loading?: boolean
}

function statusClass(status: string) {
 if (status.includes("待")) return "text-amber-700 bg-amber-50 border-amber-200"
 if (status.includes("已收")) return "text-success bg-success border-success"
 return "text-muted-foreground bg-muted border-transparent"
}

export function RecentPaymentsCard({ payments, loading }: Props) {
 return (
  <section className="flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-sm md:p-6">
   <div className="mb-4 flex items-center justify-between gap-2">
    <h2 className="flex items-center gap-2 text-lg font-semibold md:text-xl">
     <Banknote className="h-6 w-6 shrink-0 text-primary" />
     最近收費
    </h2>
    <Link
     to="/Payments"
     className="text-sm font-medium text-primary underline-offset-4 hover:underline"
    >
     查看全部
    </Link>
   </div>
   {loading ? (
    <p className="text-base text-muted-foreground">載入中…</p>
   ) : payments.length === 0 ? (
    <p className="text-base text-muted-foreground">尚無繳費紀錄。</p>
   ) : (
    <ul className="flex flex-1 flex-col gap-3">
     {payments.map((p) => (
      <li
       key={p.id}
       className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/80 px-4 py-3 text-base"
      >
       <div className="min-w-0">
        <div className="font-semibold text-foreground">{p.studentName}</div>
        <div className="text-sm text-muted-foreground">
         {formatDateZh(p.paymentDate)} · {p.method}
        </div>
       </div>
       <div className="flex items-center gap-2">
        <span className="text-lg font-semibold tabular-nums">{formatMoney(p.amount)}</span>
        <span
         className={`shrink-0 rounded-md border px-2 py-0.5 text-sm font-medium ${statusClass(p.status)}`}
        >
         {p.status}
        </span>
       </div>
      </li>
     ))}
    </ul>
   )}
  </section>
 )
}
