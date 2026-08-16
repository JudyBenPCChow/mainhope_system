import { AlertTriangle, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"

import { MgmtGroupLoadError } from "@/components/mgmtDashboard/MgmtGroupLoadError"
import type {
 DrilldownFocus,
 MgmtDashboardPayload,
 OpsAlertCategory,
} from "@/components/mgmtDashboard/types"
import { Tag } from "@/components/ui/tag"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"

const CATEGORY_LABEL: Record<OpsAlertCategory, string> = {
 unpaid: "欠費",
 withdraw: "退讀",
 lowAttendance: "低出席",
 nearFull: "滿班",
 teacherLoad: "導師負荷",
 conversionDrop: "轉化異常",
}

type Props = {
 alerts: MgmtDashboardPayload["opsAlerts"]
 error: string | null
 focus: DrilldownFocus
 onFocus: (focus: DrilldownFocus) => void
}

export function MgmtOpsAlertsSection({ alerts, error, focus, onFocus }: Props) {
 return (
  <section className="space-y-3">
   <div className="flex flex-wrap items-end justify-between gap-2">
    <div>
     <h2 className="text-lg font-semibold tracking-tight">營運警示</h2>
     <p className="mt-1 text-sm text-muted-foreground">
      需立即處理的事項；點擊可對齊下方跟進清單
     </p>
    </div>
    <p className="text-xs text-muted-foreground">{alerts.length} 項</p>
   </div>

   {error ? <MgmtGroupLoadError message={error} /> : null}

   {alerts.length === 0 && !error ? (
    <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground shadow-sm">
     目前無營運警示，狀態正常
    </div>
   ) : alerts.length === 0 ? null : (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
     {alerts.map((item) => {
      const active =
       focus?.type === "alert" && focus.category === item.category
      return (
       <button
        key={item.id}
        type="button"
        onClick={() => onFocus({ type: "alert", category: item.category })}
        className={cn(
         "rounded-xl border bg-card p-4 text-left shadow-sm transition-colors",
         "hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
         item.severity === "警示" ? "border-destructive/30" : "border-warning/35",
         active && "ring-2 ring-primary/40"
        )}
       >
        <div className="flex items-start justify-between gap-2">
         <div className="flex items-center gap-2">
          <AlertTriangle
           className={cn(
            "h-4 w-4 shrink-0",
            item.severity === "警示" ? "text-destructive" : "text-warning"
           )}
           aria-hidden
          />
          <span className="text-xs text-muted-foreground">
           {CATEGORY_LABEL[item.category]}
          </span>
         </div>
         <Tag tone={statusToTagTone(item.severity)} size="sm">
          {item.severity}
         </Tag>
        </div>
        <p className="mt-2 text-sm font-medium leading-snug">{item.title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
         {item.count != null ? (
          <span className="tabular-nums text-muted-foreground">{item.count} 筆</span>
         ) : (
          <span />
         )}
         {item.href ? (
          <Link
           to={item.href}
           onClick={(e) => e.stopPropagation()}
           className="inline-flex items-center text-primary underline-offset-2 hover:underline"
          >
           前往處理
           <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
         ) : (
          <span className="inline-flex items-center text-muted-foreground">
           檢視明細
           <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </span>
         )}
        </div>
       </button>
      )
     })}
    </div>
   )}
  </section>
 )
}
