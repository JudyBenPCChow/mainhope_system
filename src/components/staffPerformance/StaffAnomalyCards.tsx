import { Link } from "react-router-dom"
import { AlertTriangle } from "lucide-react"

import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { Tag } from "@/components/ui/tag"
import type { StaffAnomalyCard } from "@/components/staffPerformance/types"
import { statusToTagTone } from "@/lib/statusTag"

type Props = {
  anomalies: StaffAnomalyCard[]
  loading?: boolean
}

export function StaffAnomalyCards({ anomalies, loading }: Props) {
  if (loading && anomalies.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">載入異常提醒…</p>
      </div>
    )
  }
  if (anomalies.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-sm font-medium">異常提醒</p>
        <p className="mt-1 text-sm text-muted-foreground">目前無異常項目。</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-warning" aria-hidden />
        <p className="text-sm font-medium">異常提醒（{anomalies.length}）</p>
      </div>
      <StaggerList as="ul" className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {anomalies.map((a) => (
          <StaggerItem key={a.id} as="li" className="rounded-lg border border-border/80 bg-muted/20 p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium leading-snug">{a.title}</p>
              <Tag tone={statusToTagTone(a.severity)} size="sm">
                {a.severity}
              </Tag>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{a.detail}</p>
            {a.href ? (
              <Link to={a.href} className="mt-2 inline-block text-xs text-primary hover:underline">
                查看老師
              </Link>
            ) : null}
          </StaggerItem>
        ))}
      </StaggerList>
    </div>
  )
}
