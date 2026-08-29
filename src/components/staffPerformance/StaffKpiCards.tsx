import { MgmtStatCard } from "@/components/mgmtDashboard/MgmtStatCard"
import { SkeletonStatGrid } from "@/components/ui/skeleton"
import type { KpiCardModel } from "@/components/mgmtDashboard/types"

type Props = {
  kpis: KpiCardModel[]
  loading?: boolean
}

export function StaffKpiCards({ kpis, loading }: Props) {
  if (loading && kpis.length === 0) {
    return <SkeletonStatGrid count={8} />
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
      {kpis.map((card) => (
        <MgmtStatCard key={card.id} card={card} />
      ))}
    </div>
  )
}
