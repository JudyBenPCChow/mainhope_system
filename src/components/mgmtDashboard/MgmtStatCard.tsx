import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

import { Sparkline } from "@/components/mgmtDashboard/charts/MgmtCharts"
import type { KpiCardModel } from "@/components/mgmtDashboard/types"
import { Tag } from "@/components/ui/tag"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"

function formatValue(card: KpiCardModel): string {
 if (card.format === "hkd") {
  return `HK$ ${card.value.toLocaleString("en-HK", { maximumFractionDigits: 0 })}`
 }
 if (card.format === "percent") {
  return `${card.value.toLocaleString("en-HK", { maximumFractionDigits: 1 })}%`
 }
 return card.value.toLocaleString("en-HK", { maximumFractionDigits: 1 })
}

function formatGap(card: KpiCardModel): string | null {
 if (card.targetGap == null || card.targetGapUnit == null) return null
 const g = card.targetGap
 const sign = g > 0 ? "+" : ""
 if (card.targetGapUnit === "hkd") {
  return `目標差 ${sign}HK$ ${Math.abs(g).toLocaleString("en-HK")}`
 }
 if (card.targetGapUnit === "percent") {
  return `目標差 ${sign}${g}%`
 }
 return `目標差 ${sign}${g.toLocaleString("en-HK")}`
}

const toneBorder: Record<KpiCardModel["tone"], string> = {
 default: "border-border",
 success: "border-success/25",
 warning: "border-warning/35",
 destructive: "border-destructive/30",
}

type Props = {
 card: KpiCardModel
 selected?: boolean
 onSelect?: () => void
}

export function MgmtStatCard({ card, selected, onSelect }: Props) {
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
 const gapText = formatGap(card)

 return (
  <button
   type="button"
   onClick={onSelect}
   className={cn(
    "flex h-full w-full flex-col rounded-xl border bg-card p-4 text-left shadow-sm transition-colors",
    "hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    toneBorder[card.tone],
    selected && "ring-2 ring-primary/40"
   )}
  >
   <div className="flex items-start justify-between gap-2">
    <p className="text-sm text-muted-foreground">{card.label}</p>
    <Tag tone={statusToTagTone(card.status)} size="sm">
     {card.status}
    </Tag>
   </div>
   <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{formatValue(card)}</p>
   {card.hint ? <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p> : null}

   {card.breakdown && card.breakdown.length > 0 ? (
    <ul className="mt-2 grid grid-cols-3 gap-1.5">
     {card.breakdown.map((item) => (
      <li
       key={item.label}
       className="rounded-md border border-border/70 bg-muted/30 px-1.5 py-1 text-center"
      >
       <p className="truncate text-[10px] leading-tight text-muted-foreground">{item.label}</p>
       <p className="mt-0.5 text-xs font-semibold tabular-nums">
        {item.value.toLocaleString("en-HK")}
       </p>
      </li>
     ))}
    </ul>
   ) : null}

   <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
    <span className={cn("inline-flex items-center gap-0.5", deltaTone)}>
     <DeltaIcon className="h-3.5 w-3.5" aria-hidden />
     {delta == null ? "無環比" : `環比 ${delta > 0 ? "+" : ""}${delta}%`}
    </span>
    <span className="text-muted-foreground">
     {card.yoyPct == null
      ? "無同比"
      : `同比 ${card.yoyPct > 0 ? "+" : ""}${card.yoyPct}%`}
    </span>
   </div>
   {gapText ? <p className="mt-1 text-xs text-muted-foreground">{gapText}</p> : null}

   {card.sparkline && card.sparkline.length >= 2 ? (
    <div className="mt-auto pt-2">
     <Sparkline values={card.sparkline} tone={card.tone} />
    </div>
   ) : null}
  </button>
 )
}
