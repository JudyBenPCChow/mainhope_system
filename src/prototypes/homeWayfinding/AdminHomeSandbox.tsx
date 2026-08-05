import {
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  HandCoins,
  Inbox,
  ListOrdered,
  MessageSquareQuote,
  School,
  UserRoundX,
  Users,
  CalendarX,
} from "lucide-react"

import { Tag } from "@/components/ui/tag"
import { cn } from "@/lib/utils"

import {
  MOCK_ADMIN_ALERTS,
  MOCK_ADMIN_NAME,
  MOCK_ADMIN_SCENARIOS,
  MOCK_ADMIN_TODAY_CLASSES,
  MOCK_TODAY_LABEL,
  type MockAlert,
  type MockScenario,
} from "./mockData"

type Props = {
  onPreviewAction: (label: string) => void
}

const SCENARIO_ICONS: Record<string, typeof ListOrdered> = {
  s1: ListOrdered,
  s2: HandCoins,
  s3: CalendarX,
  s4: UserRoundX,
  s5: Users,
  s6: CalendarDays,
  s7: MessageSquareQuote,
  s8: School,
}

function alertToneClass(tone: MockAlert["tone"]) {
  if (tone === "warning") return "border-warning/40 bg-warning/10"
  if (tone === "error") return "border-destructive/40 bg-destructive/10"
  return "border-info/40 bg-info/10"
}

function AlertCard({ alert, onPreviewAction }: { alert: MockAlert; onPreviewAction: Props["onPreviewAction"] }) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-xl border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between", alertToneClass(alert.tone))}>
      <div className="min-w-0">
        <p className="font-semibold text-foreground">{alert.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{alert.detail}</p>
      </div>
      <button
        type="button"
        onClick={() => onPreviewAction(alert.destinationHint)}
        className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {alert.actionLabel}
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </div>
  )
}

function ScenarioCard({
  scenario,
  onPreviewAction,
}: {
  scenario: MockScenario
  onPreviewAction: Props["onPreviewAction"]
}) {
  const Icon = SCENARIO_ICONS[scenario.id] ?? ListOrdered
  return (
    <button
      type="button"
      onClick={() => onPreviewAction(scenario.goesTo)}
      className="group flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-info/40 hover:bg-info/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-info/10 group-hover:text-info">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-foreground">{scenario.title}</span>
          <span className="mt-1 block text-sm leading-5 text-muted-foreground">{scenario.situation}</span>
        </span>
        <ChevronRight
          className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-border/70 pt-3 text-xs text-muted-foreground">
        <span>
          去到：<span className="font-medium text-foreground">{scenario.goesTo}</span>
        </span>
        <Tag tone="default" size="sm">
          側欄 · {scenario.sidebarHint}
        </Tag>
      </div>
    </button>
  )
}

/**
 * 行政首頁改善草案：情境導航 + 今日待辦，非功能目錄複本。
 */
export function AdminHomeSandbox({ onPreviewAction }: Props) {
  const pendingRoll = MOCK_ADMIN_TODAY_CLASSES.filter((c) => !c.rollCallDone).length

  return (
    <div className="space-y-6 md:space-y-8">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-info/90">行政工作台 · 草案</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          你好，{MOCK_ADMIN_NAME}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          {MOCK_TODAY_LABEL} · 先處理待辦，再用「我想做…」搵入口
        </p>
      </header>

      <section className="space-y-3" aria-labelledby="admin-followups-title">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="admin-followups-title" className="text-lg font-semibold text-foreground">
            今日要跟進
          </h2>
          <p className="text-xs text-muted-foreground">有事先出；無事可收埋呢段</p>
        </div>
        <div className="space-y-2">
          {MOCK_ADMIN_ALERTS.map((a) => (
            <AlertCard key={a.id} alert={a} onPreviewAction={onPreviewAction} />
          ))}
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="admin-scenarios-title">
        <div>
          <h2 id="admin-scenarios-title" className="text-lg font-semibold text-foreground">
            我想做…
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            用日常情境搵頁，唔使記系統功能名。每張卡底標示會去邊同側欄大概位置。
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {MOCK_ADMIN_SCENARIOS.map((s) => (
            <ScenarioCard key={s.id} scenario={s} onPreviewAction={onPreviewAction} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => onPreviewAction("所有功能（瀏覽／搜尋）")}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          <Inbox className="h-4 w-4" aria-hidden />
          唔係以上情況？開「所有功能」搜尋
        </button>
      </section>

      <section className="space-y-3" aria-labelledby="admin-today-classes-title">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="admin-today-classes-title" className="text-lg font-semibold text-foreground">
              今日課堂（概覽）
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              參考用；詳細改堂請由「改課堂時間／課室」入去。未點名 {pendingRoll} 堂。
            </p>
          </div>
          <button
            type="button"
            onClick={() => onPreviewAction("進行點名")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium shadow-sm hover:bg-muted/40"
          >
            <ClipboardCheck className="h-4 w-4" aria-hidden />
            進行點名
          </button>
        </div>
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {MOCK_ADMIN_TODAY_CLASSES.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="w-28 shrink-0 text-sm tabular-nums text-muted-foreground">{row.time}</span>
              <span className="min-w-0 flex-1">
                <span className="font-medium text-foreground">{row.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {row.room} · {row.headcount} 人
                </span>
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {row.tags?.map((t) => (
                  <Tag key={t} tone="info" size="sm">
                    {t}
                  </Tag>
                ))}
                <Tag tone={row.rollCallDone ? "success" : "warning"} size="sm">
                  {row.rollCallDone ? "已點名" : "未點名"}
                </Tag>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
