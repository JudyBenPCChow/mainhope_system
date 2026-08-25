import { useEffect, useId, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Check, ListFilter } from "lucide-react"

import type { HeaderFilterOption } from "@/components/list/listFilterUtils"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type HeaderFilterMode = "preset" | "text"

type Props = {
 columnLabel: string
 value: string
 onChange: (next: string) => void
 mode: HeaderFilterMode
 /** preset：固定選項；text：目前可選唯一值（建議已套用其他欄篩選後再算） */
 options: HeaderFilterOption[]
}

/**
 * 表頭漏斗篩選（portal 面板）。
 * 領域頁負責傳入 options／mode；唔好另造一套表頭篩選 UI。
 */
export function HeaderFilterButton({ columnLabel, value, onChange, mode, options }: Props) {
 const [open, setOpen] = useState(false)
 const [optionQuery, setOptionQuery] = useState("")
 const [placement, setPlacement] = useState({ left: 0, top: 0, width: 240, maxHeight: 320 })
 const triggerRef = useRef<HTMLButtonElement>(null)
 const panelRef = useRef<HTMLDivElement>(null)
 const searchRef = useRef<HTMLInputElement>(null)
 const listId = useId()
 const preset = mode === "preset"
 const active = Boolean(value.trim())

 const visibleOptions = useMemo(() => {
  if (preset) {
   const q = optionQuery.trim().toLowerCase()
   if (!q) return options
   return options.filter(
    (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
   )
  }
  const q = value.trim().toLowerCase()
  if (!q) return options
  return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
 }, [preset, options, optionQuery, value])

 const computePlacement = () => {
  const trigger = triggerRef.current
  if (!trigger) return
  const r = trigger.getBoundingClientRect()
  const gap = 6
  const width = Math.min(Math.max(240, r.width), Math.max(220, window.innerWidth - 16))
  let left = r.left
  if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - width - 8)
  if (left < 8) left = 8
  const maxHeight = Math.min(320, Math.max(200, window.innerHeight * 0.5))
  let top = r.bottom + gap
  if (top + Math.min(maxHeight, 220) > window.innerHeight - 8) {
   top = Math.max(8, r.top - maxHeight - gap)
  }
  setPlacement({ left, top, width, maxHeight })
 }

 useEffect(() => {
  if (!open) return
  computePlacement()
  setOptionQuery("")
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
 }, [open])

 const selectValue = (next: string) => {
  onChange(next)
  setOpen(false)
 }

 const panel =
  open && typeof document !== "undefined"
   ? createPortal(
      <div
       ref={panelRef}
       data-mgmt-header-filter-panel=""
       className="fixed z-[320] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl"
       style={{
        left: placement.left,
        top: placement.top,
        width: placement.width,
        maxHeight: placement.maxHeight,
       }}
      >
       <div className="border-b border-border/80 p-2">
        <Input
         ref={searchRef}
         className="h-8 text-xs"
         value={preset ? optionQuery : value}
         placeholder={preset ? "搜尋選項…" : "包含…"}
         aria-label={preset ? `搜尋${columnLabel}選項` : `篩選${columnLabel}`}
         onChange={(e) => {
          if (preset) setOptionQuery(e.target.value)
          else onChange(e.target.value)
         }}
         onKeyDown={(e) => {
          if (e.key === "Enter") {
           e.preventDefault()
           if (!preset) setOpen(false)
          }
         }}
        />
       </div>
       <div
        className="overflow-y-auto p-1"
        style={{ maxHeight: placement.maxHeight - 52 }}
        role="listbox"
        id={listId}
       >
        <button
         type="button"
         role="option"
         aria-selected={!active}
         onClick={() => selectValue("")}
         className={cn(
          "relative flex w-full cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-3 text-left text-xs outline-none",
          !active ? "bg-muted text-foreground" : "hover:bg-muted/70"
         )}
        >
         <span
          className={cn(
           "absolute left-2 inline-flex h-4 w-4 items-center justify-center",
           !active ? "text-foreground" : "text-transparent"
          )}
          aria-hidden
         >
          <Check className="h-3.5 w-3.5" />
         </span>
         全部
        </button>
        {visibleOptions.length === 0 ? (
         <p className="px-3 py-2 text-xs text-muted-foreground">沒有符合的選項</p>
        ) : (
         visibleOptions.map((opt) => {
          const selected = opt.value === value
          if (preset && opt.value === "") return null
          return (
           <button
            key={opt.value || "__empty__"}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => selectValue(opt.value)}
            className={cn(
             "relative flex w-full cursor-default select-none items-start rounded-md py-1.5 pl-8 pr-3 text-left text-xs outline-none",
             selected ? "bg-muted text-foreground" : "hover:bg-muted/70"
            )}
           >
            <span
             className={cn(
              "absolute left-2 top-1.5 inline-flex h-4 w-4 items-center justify-center",
              selected ? "text-foreground" : "text-transparent"
             )}
             aria-hidden
            >
             <Check className="h-3.5 w-3.5" />
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
  <>
   <button
    ref={triggerRef}
    type="button"
    aria-label={`篩選${columnLabel}`}
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-controls={open ? listId : undefined}
    title={
     active
      ? `${columnLabel}：${preset ? options.find((o) => o.value === value)?.label ?? value : value}`
      : `篩選${columnLabel}`
    }
    onClick={(e) => {
     e.preventDefault()
     e.stopPropagation()
     setOpen((v) => !v)
    }}
    className={cn(
     "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-muted hover:text-foreground",
     active ? "text-primary" : "text-muted-foreground/50"
    )}
   >
    <ListFilter className="h-3.5 w-3.5" aria-hidden />
   </button>
   {panel}
  </>
 )
}
