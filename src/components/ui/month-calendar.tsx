import type { ReactNode } from "react"

import {
  MONTH_CALENDAR_WEEK_HEADERS,
  padMonthCalendarDays,
  type MonthCalendarDayBase,
} from "@/lib/monthCalendar"
import { cn } from "@/lib/utils"

/**
 * 月視格底色（無業務語意）：
 * closed＝不可用日；accent＝需突出的日子；info＝一般營業日；plain＝無底色。
 */
export type MonthCalendarTone = "closed" | "accent" | "info" | "plain"

export type MonthCalendarDensity = "comfortable" | "compact"

export type MonthCalendarProps<T extends MonthCalendarDayBase> = {
  days: readonly T[]
  renderBody: (day: T) => ReactNode
  getTone?: (day: T) => MonthCalendarTone
  getAriaLabel?: (day: T) => string
  isDayInteractive?: (day: T) => boolean
  onDayClick?: (day: T) => void
  density?: MonthCalendarDensity
  className?: string
}

const TONE_CLASS: Record<MonthCalendarTone, string> = {
  closed: "bg-muted/40 text-muted-foreground",
  accent: "bg-warning/15",
  info: "bg-info/15",
  plain: "",
}

const TONE_HOVER_CLASS: Record<MonthCalendarTone, string> = {
  closed: "",
  accent: "hover:bg-warning/25",
  info: "hover:bg-info/25",
  plain: "hover:bg-muted/30",
}

function cellMinHeight(density: MonthCalendarDensity): string {
  return density === "compact" ? "min-h-[4.5rem]" : "min-h-[8rem]"
}

function cellChromeClass(
  tone: MonthCalendarTone,
  density: MonthCalendarDensity,
  interactive: boolean
): string {
  return cn(
    "flex flex-col items-stretch gap-1 border-b border-r border-border/60 p-1.5 text-left text-[10px] leading-tight sm:p-2 sm:text-xs",
    cellMinHeight(density),
    TONE_CLASS[tone],
    interactive && TONE_HOVER_CLASS[tone]
  )
}

/** 七日欄月視格。格內日期數字由元件畫；內容由 renderBody 提供。 */
export function MonthCalendar<T extends MonthCalendarDayBase>({
  days,
  renderBody,
  getTone,
  getAriaLabel,
  isDayInteractive,
  onDayClick,
  density = "comfortable",
  className,
}: MonthCalendarProps<T>) {
  const cells = padMonthCalendarDays(days)
  const minH = cellMinHeight(density)

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border", className)}>
      <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-medium text-muted-foreground">
        {MONTH_CALENDAR_WEEK_HEADERS.map((h) => (
          <div key={h} className="px-1 py-2">
            {h}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (!day) {
            return (
              <div
                key={`pad-${idx}`}
                className={cn(minH, "border-b border-r border-border/60 bg-muted/10")}
              />
            )
          }
          const tone = getTone?.(day) ?? "plain"
          const interactive = Boolean(onDayClick) && (isDayInteractive?.(day) ?? true)
          const ariaLabel = getAriaLabel?.(day)
          const classNameCell = cellChromeClass(tone, density, interactive)
          const body = (
            <>
              <span className="text-sm font-medium tabular-nums text-foreground">{day.day}</span>
              {renderBody(day)}
            </>
          )
          if (interactive) {
            return (
              <button
                key={day.key}
                type="button"
                className={classNameCell}
                aria-label={ariaLabel}
                onClick={() => onDayClick?.(day)}
              >
                {body}
              </button>
            )
          }
          return (
            <div key={day.key} className={classNameCell} aria-label={ariaLabel}>
              {body}
            </div>
          )
        })}
      </div>
    </div>
  )
}
