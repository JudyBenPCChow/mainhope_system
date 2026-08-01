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

export function enrollTone(status: EnrollStatus) {
  if (status === "在籍") return statusToTagTone("在讀")
  if (status === "暫停") return statusToTagTone("暫停")
  return statusToTagTone("結束")
}

export function submitTone(status: SubmitStatus) {
  if (status === "已提交") return "success" as const
  if (status === "草稿") return "warning" as const
  return "default" as const
}

export function SubmitStatusTag({ status }: { status: SubmitStatus }) {
  return (
    <Tag tone={submitTone(status)} size="sm">
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

export function RoleTabNav<T extends string>({
  tabs,
  value,
  onChange,
  isMobile,
  ariaLabel,
}: {
  tabs: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  isMobile: boolean
  ariaLabel: string
}) {
  if (isMobile) {
    return (
      <label className="grid gap-1 border-b border-border py-2 text-xs text-muted-foreground">
        <span>分頁</span>
        <Select
          className="h-10 w-full"
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          aria-label={ariaLabel}
        >
          {tabs.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </label>
    )
  }
  return (
    <div className="border-b border-border">
      <nav className="flex gap-1 overflow-x-auto py-1" aria-label={ariaLabel}>
        {tabs.map((t) => {
          const active = value === t.value
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange(t.value)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
