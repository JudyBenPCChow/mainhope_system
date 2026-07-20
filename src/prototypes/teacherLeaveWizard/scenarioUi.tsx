import { Ban, Check, Layers, RefreshCw, Users, UserCog } from "lucide-react"

import { cn } from "@/lib/utils"

import type { ScenarioId, ScenarioPack } from "./mockData"

function scenarioDots(pack: ScenarioPack) {
  const hasLeave = pack.lessons.some((l) => l.students.some((s) => s.kind === "leave"))
  const hasMakeup = pack.lessons.some((l) => l.students.some((s) => s.kind === "makeup"))
  const partialLeave = pack.lessons.some((l) => l.leaveTarget)
  return { lessons: pack.lessons.length, hasLeave, hasMakeup, partialLeave }
}

export function ScenarioPicker({
  scenarios,
  activeId,
  onPick,
}: {
  scenarios: ScenarioPack[]
  activeId: ScenarioId
  onPick: (id: ScenarioId) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">快速載入情境</p>
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
        {scenarios.map((sc) => {
          const active = activeId === sc.id
          const dots = scenarioDots(sc)
          return (
            <button
              key={sc.id}
              type="button"
              title={sc.blurb}
              onClick={() => onPick(sc.id)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl border px-3 py-3 text-left transition-colors",
                active
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold",
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {sc.id === "mixed" ? "綜" : sc.id}
              </span>
              <span className="text-sm font-medium leading-tight">{sc.shortTitle}</span>
              <span className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Layers className="h-3 w-3" aria-hidden />
                  {dots.lessons}
                </span>
                {dots.hasLeave ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-warning" title="含已請假" />
                ) : null}
                {dots.hasMakeup ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-info" title="含來補堂" />
                ) : null}
                {dots.partialLeave ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-success" title="只請其中一堂" />
                ) : null}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function LessonTimeline({
  lessons,
}: {
  lessons: Array<{
    id: string
    start_time: string
    end_time: string
    classLabel: string
    room: string
    consecutive?: boolean
    leaveTarget?: boolean
  }>
}) {
  return (
    <ol className="relative space-y-0 pl-2">
      {lessons.map((l, i) => (
        <li key={l.id} className="relative flex gap-3 pb-4 last:pb-0">
          {i < lessons.length - 1 ? (
            <span
              className="absolute left-[11px] top-7 bottom-0 w-px bg-border"
              aria-hidden
            />
          ) : null}
          <span className="relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-card text-[10px] font-semibold text-primary">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1 rounded-lg border border-border bg-muted/20 px-3 py-2">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-mono text-sm font-semibold tabular-nums">
                {l.start_time}
                <span className="mx-0.5 font-normal text-muted-foreground">–</span>
                {l.end_time}
              </span>
              {l.leaveTarget ? (
                <span className="rounded bg-warning/20 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                  此堂請假
                </span>
              ) : null}
              {l.consecutive ? (
                <span className="rounded bg-warning/20 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                  連堂
                </span>
              ) : null}
            </div>
            <p className="truncate text-sm font-medium">{l.classLabel}</p>
            <p className="text-xs text-muted-foreground">{l.room}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function CancelPolicyStrip() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
      <span className="inline-flex items-center gap-1 font-medium">
        <Users className="h-3.5 w-3.5" aria-hidden />
        待另約
      </span>
      <span className="text-warning/40">·</span>
      <span className="inline-flex items-center gap-1 font-medium">
        <Ban className="h-3.5 w-3.5" aria-hidden />
        跳過已請假
      </span>
      <span className="text-warning/40">·</span>
      <span className="inline-flex items-center gap-1 font-medium">
        <RefreshCw className="h-3.5 w-3.5" aria-hidden />
        拆補堂
      </span>
    </div>
  )
}

export function DecisionPickButtons({
  action,
  onSubstitute,
  onCancel,
  onKeep,
}: {
  action: "unset" | "substitute" | "cancel" | "keep"
  onSubstitute: () => void
  onCancel: () => void
  onKeep: () => void
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <button
        type="button"
        onClick={onSubstitute}
        className={cn(
          "flex items-center gap-3 rounded-xl border-2 px-3 py-3 text-left transition-colors",
          action === "substitute"
            ? "border-success bg-success/15 text-success"
            : "border-border bg-card hover:border-success/50"
        )}
      >
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            action === "substitute" ? "bg-success text-white" : "bg-muted text-muted-foreground"
          )}
        >
          <UserCog className="h-5 w-5" aria-hidden />
        </span>
        <span>
          <span className="block text-sm font-semibold text-foreground">即日代堂</span>
          <span className="block text-xs text-muted-foreground">別人代上</span>
        </span>
      </button>
      <button
        type="button"
        onClick={onCancel}
        className={cn(
          "flex items-center gap-3 rounded-xl border-2 px-3 py-3 text-left transition-colors",
          action === "cancel"
            ? "border-warning bg-warning/15 text-warning"
            : "border-border bg-card hover:border-warning/50"
        )}
      >
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            action === "cancel" ? "bg-warning text-white" : "bg-muted text-muted-foreground"
          )}
        >
          <Ban className="h-5 w-5" aria-hidden />
        </span>
        <span>
          <span className="block text-sm font-semibold text-foreground">取消並另約</span>
          <span className="block text-xs text-muted-foreground">學生待跟進</span>
        </span>
      </button>
      <button
        type="button"
        onClick={onKeep}
        className={cn(
          "flex items-center gap-3 rounded-xl border-2 px-3 py-3 text-left transition-colors",
          action === "keep"
            ? "border-info bg-info/15 text-info"
            : "border-border bg-card hover:border-info/50"
        )}
      >
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            action === "keep" ? "bg-info text-white" : "bg-muted text-muted-foreground"
          )}
        >
          <Check className="h-5 w-5" aria-hidden />
        </span>
        <span>
          <span className="block text-sm font-semibold text-foreground">老師照常</span>
          <span className="block text-xs text-muted-foreground">此堂不請假</span>
        </span>
      </button>
    </div>
  )
}
