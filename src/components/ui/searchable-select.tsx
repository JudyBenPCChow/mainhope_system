import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { Check, ChevronDown } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export const MGMT_SEARCHABLE_SELECT_PANEL_ATTR = "data-mgmt-searchable-select-panel"

export function isMgmtSearchableSelectPanelTarget(target: EventTarget | null): boolean {
 return (
  target instanceof Element && Boolean(target.closest(`[${MGMT_SEARCHABLE_SELECT_PANEL_ATTR}]`))
 )
}

export type SearchableSelectOption = {
 value: string
 label: ReactNode
 searchText?: string
 disabled?: boolean
}

type PanelPlacement = { left: number; top: number; width: number; maxHeight: number }

type SearchableSelectProps = {
 value: string
 onChange: (next: string) => void
 options: SearchableSelectOption[]
 placeholder?: string
 searchPlaceholder?: string
 emptyMessage?: string
 disabled?: boolean
 className?: string
 /** 下拉偏好最小寬度；實際會跟觸發器取較寬、並受視窗限制 */
 preferredMinWidth?: number
 id?: string
 "aria-label"?: string
}

function optionSearchText(opt: SearchableSelectOption): string {
 if (opt.searchText) return opt.searchText
 if (typeof opt.label === "string") return opt.label
 return opt.value
}

export function SearchableSelect({
 value,
 onChange,
 options,
 placeholder = "請選擇",
 searchPlaceholder = "搜尋…",
 emptyMessage = "沒有符合的選項",
 disabled,
 className,
 preferredMinWidth = 560,
 id,
 "aria-label": ariaLabel,
}: SearchableSelectProps) {
 const [open, setOpen] = useState(false)
 const [query, setQuery] = useState("")
 const [highlight, setHighlight] = useState(0)
 const [placement, setPlacement] = useState<PanelPlacement>({
  left: 0,
  top: 0,
  width: preferredMinWidth,
  maxHeight: 448,
 })
 const triggerRef = useRef<HTMLButtonElement>(null)
 const panelRef = useRef<HTMLDivElement>(null)
 const searchRef = useRef<HTMLInputElement>(null)
 const listId = useId()

 const optionByValue = useMemo(() => new Map(options.map((o) => [o.value, o])), [options])
 const selected = optionByValue.get(value)

 const filtered = useMemo(() => {
  const q = query.trim().toLowerCase()
  if (!q) return options
  return options.filter((opt) => optionSearchText(opt).toLowerCase().includes(q))
 }, [options, query])

 const computePlacement = () => {
  const trigger = triggerRef.current
  if (!trigger) return
  const r = trigger.getBoundingClientRect()
  const gap = 6
  const maxWidth = Math.max(280, window.innerWidth - 16)
  const width = Math.min(maxWidth, Math.max(r.width, preferredMinWidth))
  let left = r.left
  if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - width - 8)
  if (left < 8) left = 8
  const maxHeight = Math.min(448, Math.max(240, window.innerHeight * 0.7))
  let top = r.bottom + gap
  if (top + Math.min(maxHeight, 280) > window.innerHeight - 8) {
   top = Math.max(8, r.top - maxHeight - gap)
  }
  setPlacement({ left, top, width, maxHeight })
 }

 useEffect(() => {
  if (!open) return
  computePlacement()
  setQuery("")
  setHighlight(0)
  const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 0)
  const onResize = () => computePlacement()
  const onScroll = () => computePlacement()
  const onDocMouseDown = (event: MouseEvent) => {
   const target = event.target as Node
   if (triggerRef.current?.contains(target)) return
   if (panelRef.current?.contains(target)) return
   setOpen(false)
  }
  const onKeyDown = (event: KeyboardEvent) => {
   if (event.key === "Escape") setOpen(false)
  }
  window.addEventListener("resize", onResize)
  window.addEventListener("scroll", onScroll, true)
  document.addEventListener("mousedown", onDocMouseDown)
  document.addEventListener("keydown", onKeyDown)
  return () => {
   window.clearTimeout(focusTimer)
   window.removeEventListener("resize", onResize)
   window.removeEventListener("scroll", onScroll, true)
   document.removeEventListener("mousedown", onDocMouseDown)
   document.removeEventListener("keydown", onKeyDown)
  }
 }, [open, preferredMinWidth])

 useEffect(() => {
  setHighlight(0)
 }, [query])

 const selectValue = (next: string) => {
  if (disabled) return
  onChange(next)
  setOpen(false)
 }

 const moveHighlight = (delta: number) => {
  if (filtered.length === 0) return
  setHighlight((prev) => {
   const next = (prev + delta + filtered.length) % filtered.length
   const el = panelRef.current?.querySelector(`[data-option-index="${next}"]`)
   if (el instanceof HTMLElement) el.scrollIntoView({ block: "nearest" })
   return next
  })
 }

 const panel =
  open && typeof document !== "undefined"
   ? createPortal(
      <div
       ref={panelRef}
       {...{ [MGMT_SEARCHABLE_SELECT_PANEL_ATTR]: "" }}
       id={listId}
       role="listbox"
       className="fixed z-[320] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl"
       style={{
        left: placement.left,
        top: placement.top,
        width: placement.width,
        maxHeight: placement.maxHeight,
        pointerEvents: "auto",
       }}
      >
       <div className="border-b border-border/80 p-2">
        <Input
         ref={searchRef}
         value={query}
         onChange={(e) => setQuery(e.target.value)}
         placeholder={searchPlaceholder}
         aria-label={searchPlaceholder}
         className="h-10"
         onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
           e.preventDefault()
           moveHighlight(1)
          } else if (e.key === "ArrowUp") {
           e.preventDefault()
           moveHighlight(-1)
          } else if (e.key === "Enter") {
           e.preventDefault()
           const opt = filtered[highlight]
           if (opt && !opt.disabled) selectValue(opt.value)
          }
         }}
        />
       </div>
       <div className="overflow-y-auto p-1" style={{ maxHeight: placement.maxHeight - 58 }}>
        {filtered.length === 0 ? (
         <p className="px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
         filtered.map((opt, index) => {
          const active = opt.value === value
          const highlighted = index === highlight
          return (
           <button
            key={opt.value}
            type="button"
            role="option"
            aria-selected={active}
            data-option-index={index}
            disabled={opt.disabled || disabled}
            onMouseEnter={() => setHighlight(index)}
            onClick={() => {
             if (opt.disabled) return
             selectValue(opt.value)
            }}
            className={cn(
             "relative flex w-full cursor-default select-none items-start rounded-md py-2 pl-8 pr-3 text-left text-sm outline-none",
             "disabled:pointer-events-none disabled:opacity-50",
             highlighted ? "bg-muted text-foreground" : null
            )}
           >
            <span
             className={cn(
              "absolute left-2 top-2.5 inline-flex h-4 w-4 items-center justify-center",
              active ? "text-foreground" : "text-transparent"
             )}
             aria-hidden
            >
             <Check className="h-4 w-4" />
            </span>
            <span className="whitespace-normal break-words">{opt.label}</span>
           </button>
          )
         })
        )}
       </div>
      </div>,
      document.body
     )
   : null

 return (
  <div className="relative min-w-0">
   <button
    ref={triggerRef}
    id={id}
    type="button"
    disabled={disabled}
    aria-label={ariaLabel ?? placeholder}
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-controls={open ? listId : undefined}
    onClick={() => {
     if (disabled) return
     setOpen((v) => !v)
    }}
    className={cn(
     "flex min-h-10 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-input bg-background px-3 py-2 text-left text-sm shadow-sm transition-colors",
     "focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
     "hover:border-neutral-400",
     className
    )}
   >
    <span className={cn("min-w-0 flex-1", selected ? "text-foreground" : "text-muted-foreground")}>
     {selected ? selected.label : placeholder}
    </span>
    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
   </button>
   {panel}
  </div>
 )
}
