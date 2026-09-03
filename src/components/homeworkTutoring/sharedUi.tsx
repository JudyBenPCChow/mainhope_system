import { Clock, School } from "lucide-react"

import { Tag } from "@/components/ui/tag"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import type { SubmitStatus } from "@/lib/homeworkTutoringUi"

export function SummaryTile({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

type RoomCardTone = "info" | "success"

const ROOM_CARD_TONE: Record<
  RoomCardTone,
  { bar: string; border: string; label: string }
> = {
  info: {
    bar: "bg-info",
    border: "border-info/30",
    label: "text-info",
  },
  success: {
    bar: "bg-success",
    border: "border-success/30",
    label: "text-success",
  },
}

/** 單一場次兩室當值卡（課室為準） */
export function RoomDutyCard({
  room,
  tone,
  session,
  teacher,
  weekdayHint,
}: {
  room: string
  tone: RoomCardTone
  session: string
  teacher: string
  weekdayHint: string
}) {
  const t = ROOM_CARD_TONE[tone]
  return (
    <section
      className={cn("overflow-hidden rounded-xl border bg-card shadow-sm", t.border)}
      aria-label={`課室 ${room}，${teacher}，${session}`}
    >
      <div className="flex">
        <div className={cn("w-1.5 shrink-0", t.bar)} aria-hidden />
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background/80",
                  t.border,
                  t.label
                )}
              >
                <School className="h-4 w-4" aria-hidden />
              </span>
              <h3 className={cn("text-base font-semibold", t.label)}>{room}</h3>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs text-muted-foreground">當值老師</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{teacher}</p>
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="tabular-nums">{session}</span>
            <span aria-hidden>·</span>
            <span>{weekdayHint}</span>
          </p>
        </div>
      </div>
    </section>
  )
}

export function SubmitStatusTag({ status }: { status: SubmitStatus }) {
  return (
    <Tag tone={statusToTagTone(status)} size="sm">
      {status}
    </Tag>
  )
}

export function FilterChipRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((opt) => {
          const active = value === opt.value
          return (
            <button
              key={opt.value || "__all__"}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
