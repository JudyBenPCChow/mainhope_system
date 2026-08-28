import type { StaffHeatCell } from "@/components/staffPerformance/types"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { cn } from "@/lib/utils"

type Props = {
  cells: StaffHeatCell[]
  loading?: boolean
}

function cellClass(ratio: number | null, hasLabor: boolean): string {
  if (!hasLabor || ratio == null) return "bg-muted/40 text-muted-foreground"
  if (ratio < 40) return "bg-success/20 text-foreground"
  if (ratio <= 60) return "bg-warning/25 text-foreground"
  return "bg-destructive/20 text-foreground"
}

export function StaffLaborHeatTable({ cells, loading }: Props) {
  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        載入熱力表…
      </div>
    )
  }
  if (cells.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        暫無資料
      </div>
    )
  }

  const months = [...new Set(cells.map((c) => c.month))].sort()
  const teachers = [...new Map(cells.map((c) => [c.teacherId, c.teacherName])).entries()]

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[28rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="px-3 py-2 font-medium">老師</th>
            {months.map((m) => (
              <th key={m} className="px-3 py-2 text-right font-medium tabular-nums">
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <StaggerList as="tbody">
          {teachers.map(([id, name]) => (
            <StaggerItem key={id} as="tr" className="border-b border-border/70">
              <td className="px-3 py-2 whitespace-nowrap">{name}</td>
              {months.map((m) => {
                const cell = cells.find((c) => c.teacherId === id && c.month === m)
                const hasLabor = cell?.laborCost != null
                const ratio = cell?.laborCostRatio ?? null
                return (
                  <td
                    key={m}
                    className={cn(
                      "px-3 py-2 text-right tabular-nums",
                      cellClass(ratio, Boolean(hasLabor))
                    )}
                    title={
                      hasLabor
                        ? `收入 HK$ ${(cell?.revenue ?? 0).toLocaleString("en-HK")} · 人工 HK$ ${(cell?.laborCost ?? 0).toLocaleString("en-HK")}`
                        : "未有月結人工"
                    }
                  >
                    {hasLabor && ratio != null ? `${ratio.toFixed(1)}%` : "—"}
                  </td>
                )
              })}
            </StaggerItem>
          ))}
        </StaggerList>
      </table>
      <p className="mt-2 text-xs text-muted-foreground">
        顏色：綠 &lt;40% · 黃 40–60% · 紅 &gt;60%；灰色＝未有月結人工
      </p>
    </div>
  )
}
