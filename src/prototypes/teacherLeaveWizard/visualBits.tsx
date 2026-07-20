import type { LucideIcon } from "lucide-react"
import {
  CalendarClock,
  ClipboardCheck,
  PartyPopper,
  UserRound,
} from "lucide-react"

import { cn } from "@/lib/utils"

export const STEP_LABELS = ["選老師與日期", "逐堂決策", "確認執行", "完成摘要"] as const
export type WizardStep = 1 | 2 | 3 | 4

const STEP_ICONS: LucideIcon[] = [UserRound, CalendarClock, ClipboardCheck, PartyPopper]

export function WizardStepRail({
  step,
  maxReached,
  onGo,
}: {
  step: WizardStep | "done"
  maxReached: WizardStep
  onGo: (n: WizardStep) => void
}) {
  return (
    <ol className="grid gap-2 sm:grid-cols-4" aria-label="沙盒精靈步驟">
      {STEP_LABELS.map((label, i) => {
        const n = (i + 1) as WizardStep
        const Icon = STEP_ICONS[i]!
        const reached = n <= maxReached
        const current = step === n || (step === "done" && n === 4)
        return (
          <li key={label}>
            <button
              type="button"
              disabled={!reached || (step === "done" && n < 4)}
              onClick={() => onGo(n)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
                current
                  ? "border-primary bg-primary/10 text-foreground shadow-sm"
                  : reached
                    ? "border-border bg-card text-foreground hover:border-primary/40"
                    : "border-border/60 bg-muted/40 text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  current ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                  Step {n}
                </span>
                <span className={cn("block truncate text-sm", current && "font-medium")}>{label}</span>
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

export function InitialAvatar({
  name,
  size = "md",
  tone = "neutral",
}: {
  name: string
  size?: "sm" | "md" | "lg"
  tone?: "neutral" | "warning" | "info" | "success"
}) {
  const initial = name.trim().charAt(0) || "?"
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        size === "sm" && "h-7 w-7 text-xs",
        size === "md" && "h-9 w-9 text-sm",
        size === "lg" && "h-14 w-14 text-xl",
        tone === "neutral" && "bg-neutral-200 text-neutral-700",
        tone === "warning" && "bg-warning/20 text-warning",
        tone === "info" && "bg-info/20 text-info",
        tone === "success" && "bg-success/20 text-success"
      )}
    >
      {initial}
    </span>
  )
}
