import { useState, type ReactNode } from "react"
import { Link } from "react-router-dom"

import {
 EnrollmentFunnelChart,
 HorizontalBarChart,
 RevenueTrendChart,
 UnpaidAmountBarChart,
} from "@/components/mgmtDashboard/charts/MgmtCharts"
import { MgmtGroupLoadError } from "@/components/mgmtDashboard/MgmtGroupLoadError"
import type { DrilldownFocus, MgmtDashboardPayload } from "@/components/mgmtDashboard/types"
import { isLoadOk } from "@/components/mgmtDashboard/types"
import { Tag } from "@/components/ui/tag"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"

type Props = {
 data: MgmtDashboardPayload
 loading?: boolean
 focus: DrilldownFocus
 onFocus: (focus: DrilldownFocus) => void
}

function PanelShell({
 title,
 subtitle,
 active,
 onClick,
 children,
}: {
 title: string
 subtitle: string
 active?: boolean
 onClick?: () => void
 children: ReactNode
}) {
 return (
  <section
   className={cn(
    "rounded-xl border border-border bg-card p-4 shadow-sm",
    active && "ring-2 ring-primary/30"
   )}
  >
   <button
    type="button"
    className="w-full text-left focus-visible:outline-none"
    onClick={onClick}
   >
    <h2 className="text-base font-semibold">{title}</h2>
    <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
   </button>
   <div className="mt-3">{children}</div>
  </section>
 )
}

export function MgmtAnalysisSection({ data, loading, focus, onFocus }: Props) {
 const [withdrawDim, setWithdrawDim] = useState<"subject" | "teacher" | "class" | "date">(
  "subject"
 )
 const withdrawal = data.withdrawalAnalysis
 const withdrawAnalysis = isLoadOk(withdrawal) ? withdrawal.ok : null
 const withdrawData =
  withdrawAnalysis == null
   ? []
   : withdrawDim === "subject"
     ? withdrawAnalysis.bySubject
     : withdrawDim === "teacher"
       ? withdrawAnalysis.byTeacher
       : withdrawDim === "class"
         ? withdrawAnalysis.byClass
         : withdrawAnalysis.byDate

 const unpaid = data.unpaidOverdue
 const unpaidRows = isLoadOk(unpaid) ? unpaid.ok : null
 const unpaidChart =
  unpaidRows == null
   ? []
   : unpaidRows.slice(0, 8).map((r) => ({
      label: r.studentName,
      amount: r.amount,
      overdueDays: r.overdueDays,
     }))

 return (
  <section className="space-y-3">
   <div>
    <h2 className="text-lg font-semibold tracking-tight">核心分析</h2>
    <p className="mt-1 text-sm text-muted-foreground">
     回答「錢從哪來、人怎麼進來、誰在流失、誰該催繳」——點擊模組可對齊下方明細
    </p>
   </div>

   <div className="grid gap-4 lg:grid-cols-2">
    <PanelShell
     title="本月收款趨勢與目標"
     subtitle="按月已收款；虛線為區間月均參考目標（正式目標表尚未接入）"
     active={focus?.type === "analysis" && focus.panel === "revenue"}
     onClick={() => onFocus({ type: "analysis", panel: "revenue" })}
    >
     {isLoadOk(data.revenueSeries) ? (
      <RevenueTrendChart data={data.revenueSeries.ok} loading={loading} />
     ) : (
      <MgmtGroupLoadError />
     )}
    </PanelShell>

    <PanelShell
     title="招生漏斗：試堂 → 報讀 → 在讀"
     subtitle="標示轉化率與流失點；在讀為快照、試堂／報讀為篩選區間"
     active={focus?.type === "analysis" && focus.panel === "funnel"}
     onClick={() => onFocus({ type: "analysis", panel: "funnel" })}
    >
     {isLoadOk(data.funnel) ? (
      <EnrollmentFunnelChart data={data.funnel.ok} loading={loading} />
     ) : (
      <MgmtGroupLoadError />
     )}
    </PanelShell>

    <PanelShell
     title="退讀風險來源"
     subtitle="按科目／導師／班別／日期找出高風險來源"
     active={focus?.type === "analysis" && focus.panel === "withdrawal"}
     onClick={() => onFocus({ type: "analysis", panel: "withdrawal" })}
    >
     <div className="mb-3 flex flex-wrap gap-2">
      {(
       [
        ["subject", "科目"],
        ["teacher", "導師"],
        ["class", "班別"],
        ["date", "日期"],
       ] as const
      ).map(([key, label]) => (
       <button
        key={key}
        type="button"
        onClick={(e) => {
         e.stopPropagation()
         setWithdrawDim(key)
         onFocus({ type: "analysis", panel: "withdrawal" })
        }}
        className={cn(
         "rounded-md border px-2.5 py-1 text-xs transition-colors",
         withdrawDim === key
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border text-muted-foreground hover:bg-muted/40"
        )}
       >
        {label}
       </button>
      ))}
     </div>
     {withdrawAnalysis != null ? (
      <HorizontalBarChart
       data={withdrawData}
       loading={loading}
       valueLabel="退讀人數"
       emptyLabel="篩選區間內尚無退讀紀錄"
      />
     ) : (
      <MgmtGroupLoadError />
     )}
    </PanelShell>

    <PanelShell
     title="待繳費與逾期跟進"
     subtitle="欠費金額、逾期天數與跟進狀態；優先處理逾期較長者"
     active={focus?.type === "analysis" && focus.panel === "unpaid"}
     onClick={() => onFocus({ type: "analysis", panel: "unpaid" })}
    >
     {unpaidRows != null ? (
      <>
       <UnpaidAmountBarChart data={unpaidChart} loading={loading} />
       <div className="mt-3 overflow-x-auto">
        <table className="w-full table-fixed text-sm">
         <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
           <th className="w-[28%] px-2 py-2 font-medium">學生</th>
           <th className="w-[18%] px-2 py-2 text-right font-medium">金額</th>
           <th className="w-[16%] px-2 py-2 text-right font-medium">逾期</th>
           <th className="w-[18%] px-2 py-2 font-medium">狀態</th>
           <th className="w-[20%] px-2 py-2 font-medium">跟進</th>
          </tr>
         </thead>
         <tbody>
          {unpaidRows.length === 0 ? (
           <tr>
            <td colSpan={5} className="px-2 py-6 text-center text-muted-foreground">
             目前無待繳費
            </td>
           </tr>
          ) : (
           unpaidRows.slice(0, 6).map((row, i) => (
            <tr
             key={row.id}
             className={cn(
              "border-b border-border/60 hover:bg-muted/40",
              i % 2 === 1 && "bg-muted/20"
             )}
            >
             <td className="min-w-0 truncate px-2 py-2">{row.studentName}</td>
             <td className="px-2 py-2 text-right tabular-nums">
              {row.amount.toLocaleString("en-HK")}
             </td>
             <td className="px-2 py-2 text-right tabular-nums">{row.overdueDays} 天</td>
             <td className="px-2 py-2">
              <Tag tone={statusToTagTone(row.status)} size="sm">
               {row.status}
              </Tag>
             </td>
             <td className="px-2 py-2">
              <Tag tone={statusToTagTone(row.followUpStatus)} size="sm">
               {row.followUpStatus}
              </Tag>
             </td>
            </tr>
           ))
          )}
         </tbody>
        </table>
       </div>
      </>
     ) : (
      <MgmtGroupLoadError />
     )}
     <p className="mt-2 text-right text-sm">
      <Link to="/PaymentHistory" className="text-primary underline-offset-2 hover:underline">
       前往繳費紀錄
      </Link>
     </p>
    </PanelShell>
   </div>
  </section>
 )
}
