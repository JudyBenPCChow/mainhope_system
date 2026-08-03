import { HorizontalBarChart } from "@/components/mgmtDashboard/charts/MgmtCharts"
import type { StaffPerformanceRow } from "@/components/staffPerformance/types"

type Props = {
  rows: StaffPerformanceRow[]
  loading?: boolean
}

export function StaffProfitRanking({ rows, loading }: Props) {
  const data = rows
    .filter((r) => r.grossProfit != null)
    .map((r) => ({
      label: r.teacherAbbr ? `${r.teacherName}（${r.teacherAbbr}）` : r.teacherName,
      count: Math.round(r.grossProfit ?? 0),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)

  return (
    <HorizontalBarChart
      data={data}
      loading={loading}
      valueLabel="毛利"
      emptyLabel="暫無毛利資料（需有人工月結）"
    />
  )
}
