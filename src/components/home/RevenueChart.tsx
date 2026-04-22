import { formatMoney } from "@/components/home/format"
import type { RevenueBar } from "@/services/dashboard"

type Props = {
 bars: RevenueBar[]
 loading?: boolean
}

export function RevenueChart({ bars, loading }: Props) {
 const max = Math.max(1, ...bars.map((b) => b.amount))
 const maxPx = 120

 return (
  <section className="rounded-xl border border-border bg-card p-5 shadow-sm md:p-6">
   <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
    <h2 className="text-lg font-semibold md:text-xl">月收入趨勢</h2>
    <span className="text-sm text-muted-foreground">近 6 個月 · 已收款</span>
   </div>
   {loading ? (
    <p className="text-base text-muted-foreground">載入中…</p>
   ) : (
    <div className="flex h-56 items-end justify-between gap-2 border-b border-border pb-2 md:h-60">
     {bars.map((b) => {
      const px = Math.round((b.amount / max) * maxPx)
      const barH = Math.max(b.amount > 0 ? 8 : 2, px)
      return (
       <div key={b.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
        <span className="max-w-full truncate text-xs font-medium text-muted-foreground tabular-nums md:text-sm">
         {b.amount > 0 ? formatMoney(b.amount) : "—"}
        </span>
        <div
         className="w-full max-w-10 rounded-t-md bg-[hsl(var(--chart-1))] shadow-sm transition-all"
         style={{ height: barH }}
         title={formatMoney(b.amount)}
        />
        <span className="text-sm text-muted-foreground">{b.label}</span>
       </div>
      )
     })}
    </div>
   )}
  </section>
 )
}
