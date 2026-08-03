import { MgmtStatCard } from "@/components/mgmtDashboard/MgmtStatCard"
import type { KpiCardModel } from "@/components/mgmtDashboard/types"

type Props = {
  kpis: KpiCardModel[]
  loading?: boolean
}

export function StaffKpiCards({ kpis, loading }: Props) {
  if (loading && kpis.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-muted/40" />
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
      {kpis.map((card) => (
        <MgmtStatCard key={card.id} card={card} />
      ))}
    </div>
  )
}
