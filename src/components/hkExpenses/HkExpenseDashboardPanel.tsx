import { MgmtStatCard } from "@/components/mgmtDashboard/MgmtStatCard"
import type { KpiCardModel } from "@/components/mgmtDashboard/types"
import { Tag } from "@/components/ui/tag"
import type { ExpenseMonthDashboard } from "@/services/expenseQueries"

type Props = {
  dashboard: ExpenseMonthDashboard
  loading?: boolean
}

function hkd(n: number): string {
  return `HK$ ${n.toLocaleString("en-HK", { maximumFractionDigits: 0 })}`
}

function kpiBase(
  partial: Pick<KpiCardModel, "id" | "label" | "value" | "format" | "tone" | "hint" | "status">
): KpiCardModel {
  return {
    ...partial,
    deltaPct: null,
    yoyPct: null,
    targetGap: null,
    targetGapUnit: null,
  }
}

function buildKpis(d: ExpenseMonthDashboard): KpiCardModel[] {
  return [
    kpiBase({
      id: "total",
      label: "本月已確認總成本",
      value: d.totalConfirmed,
      format: "hkd",
      tone: "default",
      status: "正常",
    }),
    kpiBase({
      id: "direct",
      label: "直接成本",
      value: d.totalDirect,
      format: "hkd",
      tone: "default",
      status: "正常",
    }),
    kpiBase({
      id: "overhead",
      label: "間接成本",
      value: d.totalOverhead,
      format: "hkd",
      tone: "default",
      status: "正常",
    }),
    kpiBase({
      id: "labor",
      label: "人工（計糧過帳）",
      value: d.laborTotal,
      format: "hkd",
      tone: "default",
      status: "正常",
    }),
    kpiBase({
      id: "pending",
      label: "待覆核金額",
      value: d.pendingAmount,
      format: "hkd",
      tone: d.pendingCount > 0 ? "warning" : "default",
      status: d.pendingCount > 0 ? "注意" : "正常",
      hint: d.pendingCount > 0 ? `${d.pendingCount} 筆待覆核` : undefined,
    }),
  ]
}

export function HkExpenseDashboardPanel({ dashboard, loading }: Props) {
  const kpis = buildKpis(dashboard)
  const maxAccount = Math.max(1, ...dashboard.byAccount.map((a) => a.amount))
  const maxTrend = Math.max(1, ...dashboard.monthlyTrend.map((t) => t.totalConfirmed))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {loading && kpis.every((k) => k.value === 0)
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl border border-border bg-muted/40"
              />
            ))
          : kpis.map((card) => <MgmtStatCard key={card.id} card={card} />)}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-base font-semibold tracking-tight">科目結構（已確認）</h2>
          <p className="mt-1 text-xs text-muted-foreground">按本月 spent_on／計糧月歸屬</p>
          {dashboard.byAccount.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">本月尚無已確認成本</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {dashboard.byAccount.map((a) => (
                <li key={a.accountId} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <Tag size="sm" tone={a.accountGroup === "direct" ? "info" : "default"}>
                        {a.accountGroup === "direct" ? "直接" : "間接"}
                      </Tag>
                      <span className="truncate">{a.label}</span>
                    </span>
                    <span className="shrink-0 tabular-nums">{hkd(a.amount)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${Math.round((a.amount / maxAccount) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-base font-semibold tracking-tight">老師人工（下鑽）</h2>
          <p className="mt-1 text-xs text-muted-foreground">來自計糧結算過帳</p>
          {dashboard.byTeacher.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">本月尚無計糧過帳人工</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[20rem] text-left text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 font-medium">老師</th>
                    <th className="py-2 text-right font-medium">薪酬</th>
                    <th className="py-2 text-right font-medium">僱主 MPF</th>
                    <th className="py-2 text-right font-medium">合計</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.byTeacher.map((t) => (
                    <tr key={t.teacherId} className="border-b border-border/60">
                      <td className="py-2">{t.teacherName}</td>
                      <td className="py-2 text-right tabular-nums">{hkd(t.laborTutor)}</td>
                      <td className="py-2 text-right tabular-nums">{hkd(t.employerMpf)}</td>
                      <td className="py-2 text-right tabular-nums font-medium">
                        {hkd(t.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-base font-semibold tracking-tight">近 6 月已確認成本</h2>
        <ul className="mt-4 space-y-3">
          {dashboard.monthlyTrend.map((t) => (
            <li key={t.monthKey} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="tabular-nums text-muted-foreground">{t.monthKey}</span>
                <span className="flex gap-3 tabular-nums">
                  <span className="text-muted-foreground">人工 {hkd(t.laborTotal)}</span>
                  <span>{hkd(t.totalConfirmed)}</span>
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/60"
                  style={{
                    width: `${Math.round((t.totalConfirmed / maxTrend) * 100)}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
