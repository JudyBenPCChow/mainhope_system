import type { LucideIcon } from "lucide-react"
import { Clock, School } from "lucide-react"

import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import type { EnrollStatus, SubmitStatus } from "./mockData"

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

type DivisionTone = "info" | "success"

const DIVISION_TONE: Record<
  DivisionTone,
  { bar: string; border: string; bg: string; label: string }
> = {
  info: {
    bar: "bg-info",
    border: "border-info/30",
    bg: "bg-info/5",
    label: "text-info",
  },
  success: {
    bar: "bg-success",
    border: "border-success/30",
    bg: "bg-success/5",
    label: "text-success",
  },
}

/** 單一場次兩室當值卡（課室為準，唔分學部） */
export function RoomDutyCard({
  room,
  tone,
  session,
  teacher,
  weekdayHint,
}: {
  room: string
  tone: DivisionTone
  session: string
  teacher: string
  weekdayHint: string
}) {
  const t = DIVISION_TONE[tone]
  return (
    <section
      className={cn("overflow-hidden rounded-xl border shadow-sm", t.border, t.bg)}
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

/** @deprecated 用 RoomDutyCard */
export function DivisionDutyCard({
  title,
  tone,
  weekdayHint,
  room,
  session,
  teacher,
}: {
  title: string
  division: "secondary" | "primary"
  tone: DivisionTone
  studentCount: number
  weekdayHint: string
  room: string
  session: string
  teacher: string
}) {
  return (
    <RoomDutyCard
      room={room !== "—" ? room : title}
      tone={tone}
      session={session}
      teacher={teacher}
      weekdayHint={weekdayHint}
    />
  )
}

export function enrollTone(status: EnrollStatus) {
  return statusToTagTone(status)
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

/** 沙盒預覽：正式時這些項目會掛在系統側欄一級「功課輔導」 */
export function SandboxSectionNav<T extends string>({
  items,
  value,
  onChange,
  isMobile,
}: {
  items: { value: T; label: string; icon: LucideIcon }[]
  value: T
  onChange: (v: T) => void
  isMobile: boolean
}) {
  if (isMobile) {
    return (
      <label className="grid gap-1 text-xs text-muted-foreground">
        <span>頁面（正式＝側欄）</span>
        <Select
          className="h-10 w-full"
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          aria-label="功課輔導頁面"
        >
          {items.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </label>
    )
  }

  return (
    <aside className="w-56 shrink-0 rounded-xl border border-border bg-card p-2 shadow-sm">
      <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">功課輔導</p>
      <nav className="flex flex-col gap-0.5" aria-label="功課輔導頁面">
        {items.map((t) => {
          const active = value === t.value
          const Icon = t.icon
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange(t.value)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{t.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
