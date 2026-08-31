import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import {
  DEFAULT_CUSTOM_END,
  DEFAULT_CUSTOM_START,
  defaultCustomEntry,
  formatAvailLabel,
  isAvailActive,
  type AvailEntry,
} from "@/lib/homeworkTutoringUi"

type AvailKind = "clear" | "full" | "custom"

const KIND_OPTIONS: { value: AvailKind; label: string }[] = [
  { value: "clear", label: "不報（留空）" },
  { value: "full", label: "全節" },
  { value: "custom", label: "自訂時段" },
]

function entryToKind(entry: AvailEntry | null): AvailKind {
  if (!entry) return "clear"
  return entry.kind
}

export function AvailCellButton({
  entry,
  date,
  disabled,
  onClick,
  compact,
}: {
  entry: AvailEntry | null
  date: string
  disabled?: boolean
  onClick: () => void
  compact?: boolean
}) {
  const active = isAvailActive(entry)
  const label = formatAvailLabel(entry)

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={`${date}：${label === "—" ? "未報" : label}`}
      className={cn(
        "w-full rounded-lg border font-medium transition-colors",
        compact ? "min-h-10 px-1 py-1.5 text-[11px] sm:text-xs" : "min-h-12 px-1 py-2 text-xs sm:text-sm",
        active
          ? "border-primary/30 bg-primary/10 text-foreground"
          : "border-border bg-muted/30 text-muted-foreground",
        disabled && "opacity-70"
      )}
    >
      {label}
    </button>
  )
}

/** 批量自訂時間（剔選日子後） */
export function BulkCustomTimeDialog({
  open,
  count,
  onOpenChange,
  onSave,
}: {
  open: boolean
  count: number
  onOpenChange: (open: boolean) => void
  onSave: (start: string, end: string) => void
}) {
  const [start, setStart] = useState(DEFAULT_CUSTOM_START)
  const [end, setEnd] = useState(DEFAULT_CUSTOM_END)

  useEffect(() => {
    if (!open) return
    setStart(DEFAULT_CUSTOM_START)
    setEnd(DEFAULT_CUSTOM_END)
  }, [open])

  const invalid = start >= end

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>輸入時間（{count} 日）</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-xs text-muted-foreground">
            <span>開始</span>
            <Input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="h-11 tabular-nums"
            />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            <span>結束</span>
            <Input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="h-11 tabular-nums"
            />
          </label>
        </div>
        {invalid ? (
          <p role="alert" className="text-xs text-destructive">結束時間須晚於開始時間。</p>
        ) : null}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            type="button"
            disabled={invalid}
            onClick={() => {
              onSave(start, end)
              onOpenChange(false)
            }}
          >
            套用至已剔日子
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AvailEditDialog({
  open,
  date,
  entry,
  onOpenChange,
  onSave,
}: {
  open: boolean
  date: string
  entry: AvailEntry | null
  onOpenChange: (open: boolean) => void
  onSave: (entry: AvailEntry | null) => void
}) {
  const [kind, setKind] = useState<AvailKind>(() => entryToKind(entry))
  const [start, setStart] = useState(
    entry?.kind === "custom" ? entry.start : DEFAULT_CUSTOM_START
  )
  const [end, setEnd] = useState(entry?.kind === "custom" ? entry.end : DEFAULT_CUSTOM_END)

  useEffect(() => {
    if (!open) return
    setKind(entryToKind(entry))
    setStart(entry?.kind === "custom" ? entry.start : DEFAULT_CUSTOM_START)
    setEnd(entry?.kind === "custom" ? entry.end : DEFAULT_CUSTOM_END)
  }, [open, entry])

  const save = () => {
    if (kind === "clear") {
      onSave(null)
      onOpenChange(false)
      return
    }
    if (kind === "custom" && start >= end) return
    if (kind === "full") onSave({ kind: "full" })
    else onSave({ kind: "custom", start, end })
    onOpenChange(false)
  }

  const pickCustom = () => {
    setKind("custom")
    if (entry?.kind === "custom") {
      setStart(entry.start)
      setEnd(entry.end)
    } else {
      const defaults = defaultCustomEntry()
      if (defaults.kind === "custom") {
        setStart(defaults.start)
        setEnd(defaults.end)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{date} 可當值</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">不報的日子留空即可。</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="可當值類型">
            {KIND_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                size="sm"
                variant={kind === opt.value ? "default" : "outline"}
                onClick={() => {
                  if (opt.value === "custom") pickCustom()
                  else setKind(opt.value)
                }}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          {kind === "custom" ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-xs text-muted-foreground">
                <span>開始</span>
                <Input
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="h-11 tabular-nums"
                />
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                <span>結束</span>
                <Input
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="h-11 tabular-nums"
                />
              </label>
            </div>
          ) : null}
          {kind === "custom" && start >= end ? (
            <p role="alert" className="text-xs text-destructive">結束時間須晚於開始時間。</p>
          ) : null}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button type="button" disabled={kind === "custom" && start >= end} onClick={save}>
            確定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
