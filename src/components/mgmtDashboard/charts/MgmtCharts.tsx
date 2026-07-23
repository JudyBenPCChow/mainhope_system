import {
 Area,
 AreaChart,
 Bar,
 BarChart,
 CartesianGrid,
 ComposedChart,
 Legend,
 Line,
 ResponsiveContainer,
 Tooltip,
 XAxis,
 YAxis,
} from "recharts"

import type { FunnelStage, NamedCount, RevenueSeriesPoint } from "@/components/mgmtDashboard/types"
import { cn } from "@/lib/utils"

function ChartEmpty({ label = "暫無資料" }: { label?: string }) {
 return (
  <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
   {label}
  </div>
 )
}

function ChartLoading() {
 return (
  <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
   載入圖表…
  </div>
 )
}

/** KPI 卡內迷你趨勢 */
export function Sparkline({
 values,
 tone = "default",
 className,
}: {
 values: number[]
 tone?: "default" | "success" | "warning" | "destructive"
 className?: string
}) {
 if (values.length < 2) return null
 const stroke =
  tone === "success"
   ? "hsl(var(--success))"
   : tone === "warning"
     ? "hsl(var(--warning))"
     : tone === "destructive"
       ? "hsl(var(--destructive))"
       : "hsl(var(--chart-1))"
 const data = values.map((v, i) => ({ i, v }))
 return (
  <div className={cn("h-10 w-full", className)} aria-hidden>
   <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
     <Area
      type="monotone"
      dataKey="v"
      stroke={stroke}
      fill={stroke}
      fillOpacity={0.12}
      strokeWidth={1.5}
      isAnimationActive={false}
     />
    </AreaChart>
   </ResponsiveContainer>
  </div>
 )
}

export function RevenueTrendChart({
 data,
 loading,
}: {
 data: RevenueSeriesPoint[]
 loading?: boolean
}) {
 if (loading) return <ChartLoading />
 if (data.length === 0) return <ChartEmpty label="篩選區間內尚無收款資料" />
 const hasTarget = data.some((d) => d.target != null && d.target > 0)
 return (
  <div className="h-64 w-full">
   <ResponsiveContainer width="100%" height="100%">
    <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
     <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
     <XAxis dataKey="label" tick={{ fontSize: 12 }} />
     <YAxis tick={{ fontSize: 12 }} width={56} />
     <Tooltip
      formatter={(value: number, name: string) => [
       `HK$ ${Number(value).toLocaleString("en-HK")}`,
       name === "目標" || name === "target" ? "目標" : "已收款",
      ]}
     />
     {hasTarget ? <Legend /> : null}
     <Bar dataKey="amount" name="已收款" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
     {hasTarget ? (
      <Line
       type="monotone"
       dataKey="target"
       name="目標"
       stroke="hsl(var(--warning))"
       strokeWidth={2}
       dot={false}
       strokeDasharray="4 4"
      />
     ) : null}
    </ComposedChart>
   </ResponsiveContainer>
  </div>
 )
}

/** 招生漏斗：條形 + 階段轉化率 */
export function EnrollmentFunnelChart({
 data,
 loading,
}: {
 data: FunnelStage[]
 loading?: boolean
}) {
 if (loading) return <ChartLoading />
 if (data.length === 0 || data.every((d) => d.count === 0)) {
  return <ChartEmpty label="篩選區間內尚無招生漏斗資料" />
 }
 return (
  <div className="space-y-3">
   <div className="h-52 w-full">
    <ResponsiveContainer width="100%" height="100%">
     <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
      <XAxis type="number" tick={{ fontSize: 12 }} />
      <YAxis type="category" dataKey="stage" width={56} tick={{ fontSize: 12 }} />
      <Tooltip
       formatter={(value: number, _name, item) => {
        const row = item?.payload as FunnelStage | undefined
        const conv =
         row?.conversionPct != null ? `（轉化 ${row.conversionPct}%）` : ""
        return [`${Number(value).toLocaleString("en-HK")} 人${conv}`, "人數"]
       }}
      />
      <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
     </BarChart>
    </ResponsiveContainer>
   </div>
   <ul className="grid gap-2 sm:grid-cols-3">
    {data.map((stage, i) => (
     <li
      key={stage.stage}
      className="rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-sm"
     >
      <p className="text-muted-foreground">{stage.stage}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">
       {stage.count.toLocaleString("en-HK")}
      </p>
      {i > 0 && stage.conversionPct != null ? (
       <p className="mt-0.5 text-xs text-muted-foreground">
        自上一階轉化 {stage.conversionPct}%
       </p>
      ) : i > 0 ? (
       <p className="mt-0.5 text-xs text-muted-foreground">轉化率無法計算</p>
      ) : null}
     </li>
    ))}
   </ul>
  </div>
 )
}

export function HorizontalBarChart({
 data,
 loading,
 valueLabel = "人數",
 emptyLabel,
}: {
 data: NamedCount[]
 loading?: boolean
 valueLabel?: string
 emptyLabel?: string
}) {
 if (loading) return <ChartLoading />
 if (data.length === 0) return <ChartEmpty label={emptyLabel ?? "暫無資料"} />
 return (
  <div className="h-64 w-full">
   <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
     <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
     <XAxis type="number" tick={{ fontSize: 12 }} />
     <YAxis type="category" dataKey="label" width={88} tick={{ fontSize: 11 }} />
     <Tooltip
      formatter={(value: number) => [Number(value).toLocaleString("en-HK"), valueLabel]}
     />
     <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
    </BarChart>
   </ResponsiveContainer>
  </div>
 )
}

/** 待繳費金額條形（決策用，非佔比圓環） */
export function UnpaidAmountBarChart({
 data,
 loading,
}: {
 data: { label: string; amount: number; overdueDays: number }[]
 loading?: boolean
}) {
 if (loading) return <ChartLoading />
 if (data.length === 0) return <ChartEmpty label="目前無待繳費／逾期資料" />
 return (
  <div className="h-56 w-full">
   <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
     <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
     <XAxis type="number" tick={{ fontSize: 12 }} />
     <YAxis type="category" dataKey="label" width={72} tick={{ fontSize: 11 }} />
     <Tooltip
      formatter={(value: number, _n, item) => {
       const days = (item?.payload as { overdueDays?: number })?.overdueDays
       const suffix = days != null ? `（逾期 ${days} 天）` : ""
       return [`HK$ ${Number(value).toLocaleString("en-HK")}${suffix}`, "欠費"]
      }}
     />
     <Bar dataKey="amount" fill="hsl(var(--warning))" radius={[0, 4, 4, 0]} />
    </BarChart>
   </ResponsiveContainer>
  </div>
 )
}
