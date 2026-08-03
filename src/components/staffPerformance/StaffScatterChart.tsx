import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts"

import type { StaffPerformanceRow } from "@/components/staffPerformance/types"

type Props = {
  rows: StaffPerformanceRow[]
  loading?: boolean
}

export function StaffScatterChart({ rows, loading }: Props) {
  const data = rows
    .filter((r) => !r.laborMissing && r.laborCost != null)
    .map((r) => ({
      name: r.teacherName,
      revenue: Math.round(r.revenue),
      labor: Math.round(r.laborCost ?? 0),
      margin: r.grossMargin,
    }))

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
        載入散點圖…
      </div>
    )
  }
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
        暫無可比較人工的老師（需有月結快照）
      </div>
    )
  }

  const maxVal = Math.max(...data.flatMap((d) => [d.revenue, d.labor]), 1)

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 12, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            type="number"
            dataKey="revenue"
            name="收入"
            tick={{ fontSize: 11 }}
            domain={[0, Math.ceil(maxVal * 1.05)]}
            tickFormatter={(v) => `$${Number(v).toLocaleString("en-HK")}`}
          />
          <YAxis
            type="number"
            dataKey="labor"
            name="人工"
            tick={{ fontSize: 11 }}
            domain={[0, Math.ceil(maxVal * 1.05)]}
            tickFormatter={(v) => `$${Number(v).toLocaleString("en-HK")}`}
          />
          <ZAxis range={[60, 60]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            formatter={(value: number, name: string) => [
              `HK$ ${Number(value).toLocaleString("en-HK")}`,
              name === "revenue" ? "收入" : name === "labor" ? "人工" : name,
            ]}
            labelFormatter={(_, payload) => {
              const p = payload?.[0]?.payload as { name?: string; margin?: number } | undefined
              if (!p?.name) return ""
              const m = p.margin != null ? ` · 毛利率 ${p.margin.toFixed(1)}%` : ""
              return `${p.name}${m}`
            }}
          />
          <ReferenceLine
            segment={[
              { x: 0, y: 0 },
              { x: maxVal, y: maxVal },
            ]}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="4 4"
            ifOverflow="extendDomain"
          />
          <Scatter data={data} fill="hsl(var(--chart-1))" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
