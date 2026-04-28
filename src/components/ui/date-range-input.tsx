import * as React from "react"
import { DayPicker, type DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"

export type DateRangeValue = {
 from: string
 to: string
}

type DateRangeInputProps = {
 value: DateRangeValue
 onChange: (next: DateRangeValue) => void
 className?: string
 label?: string
}

function parseYmd(value: string | undefined): Date | undefined {
 if (!value) return undefined
 const [y, m, d] = value.split("-").map(Number)
 if (!y || !m || !d) return undefined
 return new Date(y, m - 1, d)
}

function formatYmd(date: Date): string {
 const y = date.getFullYear()
 const m = String(date.getMonth() + 1).padStart(2, "0")
 const d = String(date.getDate()).padStart(2, "0")
 return `${y}-${m}-${d}`
}

function formatDisplay(v: DateRangeValue): string {
 if (!v.from) return "請選擇日期範圍"
 if (!v.to) return v.from
 return `${v.from} → ${v.to}`
}

type PanelPlacement = { left: number; top: number }

export function DateRangeInput({ value, onChange, className, label = "日期範圍" }: DateRangeInputProps) {
 const [open, setOpen] = React.useState(false)
 const [placement, setPlacement] = React.useState<PanelPlacement>({ left: 0, top: 0 })
 const wrapperRef = React.useRef<HTMLDivElement | null>(null)
 const triggerRef = React.useRef<HTMLButtonElement | null>(null)

 const selected = React.useMemo<DateRange | undefined>(() => {
  const from = parseYmd(value.from)
  if (!from) return undefined
  const to = parseYmd(value.to)
  return { from, to }
 }, [value.from, value.to])

 const [month, setMonth] = React.useState<Date>(parseYmd(value.from) ?? new Date())

 React.useEffect(() => {
  const from = parseYmd(value.from)
  if (from) setMonth(from)
 }, [value.from])

 const computePlacement = React.useCallback(() => {
  const trigger = triggerRef.current
  if (!trigger) return
  const r = trigger.getBoundingClientRect()
  const panelW = 360
  const panelH = 500
  const gap = 8
  let left = r.left
  let top = r.bottom + gap
  if (left + panelW > window.innerWidth - 8) left = Math.max(8, window.innerWidth - panelW - 8)
  if (top + panelH > window.innerHeight - 8) top = Math.max(8, r.top - panelH - gap)
  setPlacement({ left, top })
 }, [])

 React.useEffect(() => {
  if (!open) return
  computePlacement()
  const onResize = () => computePlacement()
  const onScroll = () => computePlacement()
  const onDocMouseDown = (event: MouseEvent) => {
    const target = event.target as Node
    if (!wrapperRef.current?.contains(target)) setOpen(false)
  }
  window.addEventListener("resize", onResize)
  window.addEventListener("scroll", onScroll, true)
  document.addEventListener("mousedown", onDocMouseDown)
  return () => {
    window.removeEventListener("resize", onResize)
    window.removeEventListener("scroll", onScroll, true)
    document.removeEventListener("mousedown", onDocMouseDown)
  }
 }, [open, computePlacement])

 return (
  <div ref={wrapperRef} className={cn("relative", className)}>
   <label className="grid gap-1 text-xs text-muted-foreground">
    <span>{label}</span>
    <button
     ref={triggerRef}
     type="button"
     className="flex h-9 w-full items-center rounded-md border border-input bg-background px-3 text-left text-sm shadow-sm transition-colors hover:border-neutral-400"
     onClick={() => setOpen((v) => !v)}
    >
     <span className={cn("truncate", value.from ? "text-foreground" : "text-muted-foreground")}>
      {formatDisplay(value)}
     </span>
    </button>
   </label>
   {open ? (
    <div
     className="fixed z-[320] w-[360px] overflow-hidden rounded-[22px] border border-border/80 bg-white shadow-xl"
     style={{ left: `${placement.left}px`, top: `${placement.top}px` }}
    >
     <div className="border-b border-border/70 px-6 py-4 text-center text-lg text-foreground">
      {value.from && value.to ? `${value.from} → ${value.to}` : value.from || "Start Date → End Date"}
     </div>
     <div className="flex justify-center px-4 py-4">
      <DayPicker
       mode="range"
       month={month}
       onMonthChange={setMonth}
       selected={selected}
       onSelect={(range) => {
        const from = range?.from ? formatYmd(range.from) : ""
        const to = range?.to ? formatYmd(range.to) : ""
        onChange({ from, to })
       }}
       showOutsideDays={false}
       classNames={{
        months: "flex justify-center",
        month: "space-y-3",
        caption: "relative flex items-center justify-center px-10 text-lg font-semibold",
        caption_label: "text-foreground",
        nav: "absolute inset-x-2 top-1/2 flex -translate-y-1/2 items-center justify-between",
        nav_button:
         "inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/80 bg-white text-foreground hover:bg-muted/60",
        nav_button_previous: "",
        nav_button_next: "",
        table: "w-full border-collapse",
        head_row: "grid grid-cols-7",
        head_cell: "py-2 text-center text-sm font-normal text-muted-foreground",
        row: "mt-1 grid grid-cols-7",
        cell: "relative h-11 text-center text-base",
        day: "h-10 w-10 rounded-full p-0 font-normal hover:bg-muted",
        day_button: "mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full p-0 font-normal hover:bg-muted",
        // Keep generic selected state neutral; range-specific styles below control the final look.
        day_selected: "text-foreground",
        // Start/End: tinted cell + dark circular date button.
        range_start:
         "bg-[#5b2be0]/20 [&>button]:bg-[#5b2be0] [&>button]:text-white [&>button:hover]:bg-[#5b2be0]",
        range_end:
         "bg-[#5b2be0]/20 [&>button]:bg-[#5b2be0] [&>button]:text-white [&>button:hover]:bg-[#5b2be0]",
        // Middle dates: only tinted strip, no circular highlight.
        range_middle: "bg-[#5b2be0]/20 [&>button]:bg-transparent [&>button]:text-foreground [&>button]:rounded-none",
        day_today: "font-semibold",
        day_outside: "text-muted-foreground opacity-30",
        day_disabled: "text-muted-foreground opacity-30",
       }}
      />
     </div>
     <div className="flex justify-center border-t border-border/70 px-6 py-6">
      <button
       type="button"
       className="rounded-full border border-border/80 bg-white px-5 py-1.5 text-sm font-medium text-foreground hover:bg-muted/60"
       onClick={() => onChange({ from: "", to: "" })}
      >
       Reset
      </button>
     </div>
    </div>
   ) : null}
  </div>
 )
}
