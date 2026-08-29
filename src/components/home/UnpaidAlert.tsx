import { Link } from "react-router-dom"
import { TriangleAlert } from "lucide-react"

import { formatMoney, formatDateZh } from "@/components/home/format"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { Tag } from "@/components/ui/tag"
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
  <section className="rounded-xl border-2 border-warning/40 bg-warning/10 p-5 shadow-sm md:p-6">
   <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
    <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-foreground md:text-xl">
     <TriangleAlert className="h-6 w-6 shrink-0 text-warning" />
     未繳費提醒
     <Tag tone="warning" size="sm">{loading ? "…" : `${total} 筆`}</Tag>
    </h2>
    <Link
     to="/PaymentHistory?histStatus=pending"
     className="text-base font-medium text-primary underline-offset-4 hover:underline"
    >
     前往處理 →
    </Link>
   </div>
   {loading ? (
    <p className="text-base text-muted-foreground">載入中…</p>
   ) : preview.length === 0 ? (
    <p className="text-base text-muted-foreground">目前沒有待收款紀錄。</p>
   ) : (
    <>
     <StaggerList as="ul" className="divide-y divide-border/80">
      {preview.map((row) => (
       <StaggerItem
        key={row.id}
        as="li"
        className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-base"
       >
        <span className="font-semibold text-foreground">{row.studentName}</span>
        <span className="text-muted-foreground">{formatDateZh(row.paymentDate)}</span>
        <span className="text-lg font-semibold text-foreground">{formatMoney(row.amount)}</span>
       </StaggerItem>
      ))}
     </StaggerList>
     {rest > 0 ? (
      <p className="mt-3 text-sm text-muted-foreground">還有 {rest} 筆未處理…</p>
     ) : null}
    </>
   )}
  </section>
 )
}
