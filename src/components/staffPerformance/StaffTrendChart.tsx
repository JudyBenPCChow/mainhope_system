import { useEffect, useMemo, useState } from "react"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { MultiSelect } from "@/components/ui/multi-select"
import type { StaffTeacherTrend } from "@/components/staffPerformance/types"

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

type Props = {
  trends: StaffTeacherTrend[]
  loading?: boolean
}

export function StaffTrendChart({ trends, loading }: Props) {
  const options = trends.map((t) => ({ value: t.teacherId, label: t.teacherName }))
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    setSelected((prev) => {
      if (prev.length > 0) {
        const still = prev.filter((id) => trends.some((t) => t.teacherId === id))
        if (still.length > 0) return still
      }
      return trends.slice(0, 3).map((t) => t.teacherId)
    })
  }, [trends])

  const chartData = useMemo(() => {
    const picked = trends.filter((t) => selected.includes(t.teacherId)).slice(0, 5)
    if (picked.length === 0) return []
    const months = picked[0]?.months.map((m) => m.month) ?? []
    return months.map((month) => {
      const row: Record<string, string | number | null> = { month }
      for (const t of picked) {
        const pt = t.months.find((m) => m.month === month)
        row[`${t.teacherId}_revenue`] = pt?.revenue ?? 0
        row[`${t.teacherId}_profit`] = pt?.profit ?? null
      }
      return row
    })
  }, [trends, selected])

  const picked = trends.filter((t) => selected.includes(t.teacherId)).slice(0, 5)

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
        載入趨勢…
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">比較老師（最多 5 位）</label>
        <MultiSelect
          value={selected}
          options={options}
          onChange={(ids) => setSelected(ids.slice(0, 5))}
          placeholder="選擇老師"
          emptyMessage="尚無老師"
        />
      </div>
      {chartData.length === 0 || picked.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          請選擇老師以顯示月趨勢
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${Number(v).toLocaleString("en-HK")}`} />
              <Tooltip
                formatter={(value: number, name: string) => {
                  const isProfit = name.endsWith("_profit")
                  const tid = name.replace(/_revenue$|_profit$/, "")
                  const teacher = picked.find((t) => t.teacherId === tid)?.teacherName ?? tid
                  return [
                    value == null ? "—" : `HK$ ${Number(value).toLocaleString("en-HK")}`,
                    `${teacher} ${isProfit ? "毛利" : "收入"}`,
                  ]
                }}
              />
              <Legend />
              {picked.map((t, i) => (
                <Line
                  key={`${t.teacherId}-rev`}
                  type="monotone"
                  dataKey={`${t.teacherId}_revenue`}
                  name={`${t.teacherName} 收入`}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
