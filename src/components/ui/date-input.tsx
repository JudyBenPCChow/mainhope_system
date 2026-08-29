import * as React from "react"
import { createPortal } from "react-dom"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"

/** Dialog／Sheet 辨識用：portal 面板點擊不可視為「點擊外部」 */
export const MGMT_DATE_PANEL_ATTR = "data-mgmt-date-panel"

export function isMgmtDatePanelTarget(target: EventTarget | null): boolean {
 return target instanceof Element && Boolean(target.closest(`[${MGMT_DATE_PANEL_ATTR}]`))
}

type DateInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">

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

function formatPanelDate(date: Date): string {
 return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date)
}

type PanelPlacement = { left: number; top: number; width: number }

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
 ({ className, value, onChange, disabled, id, name, required, "aria-label": ariaLabel }, ref) => {
  const [open, setOpen] = React.useState(false)
  const [placement, setPlacement] = React.useState<PanelPlacement>({ left: 0, top: 0, width: 340 })
  const wrapperRef = React.useRef<HTMLDivElement | null>(null)
  const triggerRef = React.useRef<HTMLButtonElement | null>(null)
  const panelRef = React.useRef<HTMLDivElement | null>(null)
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

  const selected = React.useMemo(() => parseYmd(typeof value === "string" ? value : undefined), [value])
  const [month, setMonth] = React.useState<Date>(selected ?? new Date())

  React.useEffect(() => {
   if (selected) setMonth(selected)
  }, [selected])

  const computePlacement = React.useCallback(() => {
   const trigger = triggerRef.current
   if (!trigger) return
   const r = trigger.getBoundingClientRect()
   const preferredW = 340
   const panelW = Math.min(preferredW, Math.max(280, window.innerWidth - 16))
   const panelH = 480
   const gap = 8
   let left = r.left
   let top = r.bottom + gap
   if (left + panelW > window.innerWidth - 8) left = Math.max(8, window.innerWidth - panelW - 8)
   if (left < 8) left = 8
   if (top + panelH > window.innerHeight - 8) top = Math.max(8, r.top - panelH - gap)
   setPlacement({ left, top, width: panelW })
  }, [])

  React.useEffect(() => {
   if (!open) return
   computePlacement()
   const onResize = () => computePlacement()
   const onScroll = () => computePlacement()
   const onDocMouseDown = (event: MouseEvent) => {
    const target = event.target as Node
    if (wrapperRef.current?.contains(target)) return
    if (panelRef.current?.contains(target)) return
    setOpen(false)
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

  const emitChange = (nextValue: string) => {
   if (!onChange) return
   onChange({
    target: { value: nextValue, name },
    currentTarget: { value: nextValue, name },
   } as React.ChangeEvent<HTMLInputElement>)
  }

  const panel =
   open && typeof document !== "undefined"
    ? createPortal(
       <div
        ref={panelRef}
        {...{ [MGMT_DATE_PANEL_ATTR]: "" }}
        className="fixed z-[320] overflow-hidden rounded-[22px] border border-border/80 bg-white shadow-xl"
        style={{
         left: placement.left,
         top: placement.top,
         width: placement.width,
         /**
          * Radix modal Dialog 會把 body 設為 pointer-events:none，只讓 DialogContent 可點。
          * 面板 portal 到 body 後必須自行恢復，否則點擊會穿透到下方「已排課堂」等內容。
          */
         pointerEvents: "auto",
        }}
       >
        <div className="border-b border-border/70 px-6 py-4 text-center text-lg text-foreground">
         {selected ? formatPanelDate(selected) : "請選擇日期"}
        </div>
        <div className="flex justify-center px-4 py-4">
         <DayPicker
          mode="single"
          month={month}
          onMonthChange={setMonth}
          selected={selected}
          onSelect={(date) => {
           emitChange(date ? formatYmd(date) : "")
           setOpen(false)
          }}
          showOutsideDays={false}
          classNames={{
           months: "flex justify-center",
           month: "space-y-3",
           caption: "relative flex items-center justify-center px-10 text-[30px] font-semibold",
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
           day_button:
            "mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full p-0 font-normal hover:bg-muted",
           day_selected: "bg-success text-success-foreground hover:bg-success",
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
          onClick={() => emitChange("")}
         >
          Reset
         </button>
        </div>
       </div>,
       document.body
      )
    : null

  return (
   <div ref={wrapperRef} className={cn("relative", className)}>
    <input
     ref={inputRef}
     id={id}
     name={name}
     type="hidden"
     value={typeof value === "string" ? value : ""}
     required={required}
    />
    <button
     ref={triggerRef}
     type="button"
     disabled={disabled}
     aria-label={ariaLabel}
     className={cn(
      "flex h-10 w-full items-center rounded-md border border-input bg-background px-3 text-left text-sm shadow-sm transition-colors",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
     )}
     onClick={() => setOpen((v) => !v)}
    >
     <span className={cn("truncate", selected ? "text-foreground" : "text-muted-foreground")}>
      {selected ? formatYmd(selected) : "請選擇日期"}
     </span>
    </button>
    {panel}
   </div>
  )
 }
)

DateInput.displayName = "DateInput"
