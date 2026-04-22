import { Link } from "react-router-dom"
import { TriangleAlert } from "lucide-react"

import { formatMoney, formatDateZh } from "@/components/home/format"
import type { UnpaidRow } from "@/services/dashboard"

type Props = {
 items: UnpaidRow[]
 total: number
 loading?: boolean
}

export function UnpaidAlert({ items, total, loading }: Props) {
 const preview = items.slice(0, 3)
 const rest = Math.max(0, total - preview.length)

 return (
  <section className="rounded-xl border-2 border-amber-300/80 bg-amber-50/90 p-5 shadow-sm md:p-6">
   <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
    <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-amber-950 md:text-xl">
     <TriangleAlert className="h-6 w-6 shrink-0 text-amber-600" />
     未繳費提醒
     <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-base font-medium text-amber-900">
      {loading ? "…" : `${total} 筆`}
     </span>
    </h2>
    <Link
     to="/Payments"
     className="text-base font-medium text-amber-800 underline-offset-4 hover:underline"
    >
     前往處理 →
    </Link>
   </div>
   {loading ? (
    <p className="text-base text-amber-900/80">載入中…</p>
   ) : preview.length === 0 ? (
    <p className="text-base text-amber-900/80">目前沒有待繳費／待收款紀錄。</p>
   ) : (
    <>
     <ul className="divide-y divide-amber-200/80">
      {preview.map((row) => (
       <li
        key={row.id}
        className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-base"
       >
        <span className="font-semibold text-amber-950">{row.studentName}</span>
        <span className="text-amber-800/90">{formatDateZh(row.paymentDate)}</span>
        <span className="text-lg font-semibold text-amber-900">{formatMoney(row.amount)}</span>
       </li>
      ))}
     </ul>
     {rest > 0 ? (
      <p className="mt-3 text-sm text-amber-800/80">還有 {rest} 筆未處理…</p>
     ) : null}
    </>
   )}
  </section>
 )
}
