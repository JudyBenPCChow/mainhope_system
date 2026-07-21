import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

import type { KpiCardModel } from "@/components/mgmtDashboard/types"
import { cn } from "@/lib/utils"

function formatValue(card: KpiCardModel): string {
 if (card.format === "hkd") {
  return `HK$ ${card.value.toLocaleString("en-HK", { maximumFractionDigits: 0 })}`
 }
 if (card.format === "percent") {
  return `${card.value.toLocaleString("en-HK", { maximumFractionDigits: 1 })}%`
 }
 return card.value.toLocaleString("en-HK")
}

const toneBorder: Record<KpiCardModel["tone"], string> = {
 default: "border-border",
 success: "border-success/30",
 warning: "border-warning/40",
 destructive: "border-destructive/30",
}

export function MgmtStatCard({ card }: { card: KpiCardModel }) {
 const delta = card.deltaPct
 const DeltaIcon =
  delta == null ? Minus : delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus
 const deltaTone =
  delta == null
   ? "text-muted-foreground"
   : delta > 0
     ? "text-success"
     : delta < 0
       ? "text-destructive"
       : "text-muted-foreground"

 return (
  <div
   className={cn(
    "rounded-xl border bg-card p-4 shadow-sm",
    toneBorder[card.tone]
   )}
  >
   <p className="text-sm text-muted-foreground">{card.label}</p>
   <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{formatValue(card)}</p>
   {card.hint ? <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p> : null}
   <div className={cn("mt-2 flex items-center gap-1 text-xs", deltaTone)}>
    <DeltaIcon className="h-3.5 w-3.5" aria-hidden />
    <span>
     {delta == null ? "無上期對比" : `環比 ${delta > 0 ? "+" : ""}${delta}%`}
    </span>
   </div>
  </div>
 )
}
