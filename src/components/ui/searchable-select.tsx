import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
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
 /** 觸發器即搜尋框：打字時同步顯示命中選項 */
 combobox?: boolean
 /** 輸入內容不在清單內時，可直接採用該文字 */
 allowCustomValue?: boolean
 /** 搜尋前正規化查詢與選項文字（例如學校近形錯字） */
 normalizeSearch?: (text: string) => string
}

function optionSearchText(opt: SearchableSelectOption): string {
 if (opt.searchText) return opt.searchText
 if (typeof opt.label === "string") return opt.label
 return opt.value
}

export function filterSearchableOptions(
 options: SearchableSelectOption[],
 query: string,
 opts?: {
  combobox?: boolean
  selectedText?: string
  allowCustomValue?: boolean
  normalizeSearch?: (text: string) => string
 }
): SearchableSelectOption[] {
 const q = query.trim()
 const selectedText = opts?.selectedText ?? ""
 const normalize = opts?.normalizeSearch ?? ((text: string) => text.trim().toLowerCase())
 const qKey = normalize(q)
 const showAll =
  !q ||
  (Boolean(opts?.combobox) && selectedText !== "" && normalize(selectedText) === qKey)
 const list = showAll
  ? options
  : options.filter((opt) => {
     const hay = normalize(optionSearchText(opt))
     return q.split(/\s+/).map(normalize).filter(Boolean).every((token) => hay.includes(token))
    })
 if (!opts?.allowCustomValue || !q) return list
 const exact = options.some((opt) => opt.value === q || optionSearchText(opt) === q)
 if (exact) return list
 return [...list, { value: q, label: `使用「${q}」` }]
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
 preferredMinWidth,
 id,
 "aria-label": ariaLabel,
 combobox = false,
 allowCustomValue = false,
 normalizeSearch,
}: SearchableSelectProps) {
 const minWidth = preferredMinWidth ?? (combobox ? 0 : 560)
 const [open, setOpen] = useState(false)
 const [query, setQuery] = useState("")
 const [highlight, setHighlight] = useState(0)
 const [placement, setPlacement] = useState<PanelPlacement>({
  left: 0,
  top: 0,
  width: Math.max(minWidth, 280),
  maxHeight: 448,
 })
 const wrapRef = useRef<HTMLDivElement>(null)
 const panelRef = useRef<HTMLDivElement>(null)
 const searchRef = useRef<HTMLInputElement>(null)
 const queryRef = useRef(query)
 const valueRef = useRef(value)
 const onChangeRef = useRef(onChange)
 queryRef.current = query
 valueRef.current = value
 onChangeRef.current = onChange
 const listId = useId()

 const optionByValue = useMemo(() => new Map(options.map((o) => [o.value, o])), [options])
 const selected = optionByValue.get(value) ?? (value ? { value, label: value } : undefined)
 const selectedText = selected ? optionSearchText(selected) : ""

 const filtered = useMemo(
  () =>
   filterSearchableOptions(options, query, {
    combobox,
    selectedText,
    allowCustomValue,
    normalizeSearch,
   }),
  [allowCustomValue, combobox, normalizeSearch, options, query, selectedText]
 )

 const computePlacement = () => {
  const trigger = wrapRef.current
  if (!trigger) return
  const r = trigger.getBoundingClientRect()
  const gap = 6
  const maxWidth = Math.max(280, window.innerWidth - 16)
  const width = Math.min(maxWidth, Math.max(r.width, minWidth))
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

 const closePanel = () => {
  if (combobox && queryRef.current.trim() === "" && valueRef.current) {
   onChangeRef.current("")
  }
  setOpen(false)
 }

 useEffect(() => {
  if (!open) return
  computePlacement()
  if (!combobox) {
   setQuery("")
   setHighlight(0)
  }
  const focusTimer = combobox
   ? undefined
   : window.setTimeout(() => searchRef.current?.focus(), 0)
  const onResize = () => computePlacement()
  const onScroll = () => computePlacement()
  const onDocMouseDown = (event: MouseEvent) => {
   const target = event.target as Node
   if (wrapRef.current?.contains(target)) return
   if (panelRef.current?.contains(target)) return
   closePanel()
  }
  const onKeyDown = (event: globalThis.KeyboardEvent) => {
   if (event.key === "Escape") closePanel()
  }
  window.addEventListener("resize", onResize)
  window.addEventListener("scroll", onScroll, true)
  document.addEventListener("mousedown", onDocMouseDown)
  document.addEventListener("keydown", onKeyDown)
  return () => {
   if (focusTimer != null) window.clearTimeout(focusTimer)
   window.removeEventListener("resize", onResize)
   window.removeEventListener("scroll", onScroll, true)
   document.removeEventListener("mousedown", onDocMouseDown)
   document.removeEventListener("keydown", onKeyDown)
  }
  // closePanel 讀 ref，避免把 query 放進依賴而令打字重置
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [open, minWidth, combobox])

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

 const onSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "ArrowDown") {
   e.preventDefault()
   if (!open) setOpen(true)
   else moveHighlight(1)
  } else if (e.key === "ArrowUp") {
   e.preventDefault()
   if (!open) setOpen(true)
   else moveHighlight(-1)
  } else if (e.key === "Enter") {
   e.preventDefault()
   const opt = filtered[highlight]
   if (opt && !opt.disabled) selectValue(opt.value)
  } else if (e.key === "Escape") {
   e.preventDefault()
   e.stopPropagation()
   closePanel()
  }
 }

 const listMaxHeight = combobox ? placement.maxHeight : placement.maxHeight - 58

 const optionList =
  filtered.length === 0 ? (
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
  )

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
       {combobox ? null : (
        <div className="border-b border-border/80 p-2">
         <Input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="h-10"
          onKeyDown={onSearchKeyDown}
         />
        </div>
       )}
       <div className="overflow-y-auto p-1" style={{ maxHeight: listMaxHeight }}>
        {optionList}
       </div>
      </div>,
      document.body
     )
   : null

 const comboboxDisplay = open ? query : selectedText

 return (
  <div className="relative min-w-0" ref={wrapRef}>
   {combobox ? (
    <div
     className={cn(
      "flex min-h-10 w-full min-w-0 items-center gap-1 rounded-xl border border-input bg-background px-3 shadow-sm transition-colors",
      "hover:border-neutral-400 focus-within:ring-1 focus-within:ring-ring",
      disabled ? "cursor-not-allowed opacity-50" : null,
      className
     )}
    >
     <input
      ref={searchRef}
      id={id}
      type="text"
      role="combobox"
      aria-autocomplete="list"
      aria-label={ariaLabel ?? placeholder}
      aria-expanded={open}
      aria-controls={open ? listId : undefined}
      aria-haspopup="listbox"
      disabled={disabled}
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      placeholder={searchPlaceholder || placeholder}
      value={comboboxDisplay}
      onChange={(e) => {
       setQuery(e.target.value)
       if (!open) setOpen(true)
      }}
      onFocus={() => {
       if (disabled) return
       if (!open) {
        setQuery(selectedText)
        setOpen(true)
        window.setTimeout(() => {
         const el = searchRef.current
         if (el && el.value === selectedText) el.select()
        }, 0)
       }
      }}
      onKeyDown={onSearchKeyDown}
      className="min-h-10 min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
     />
     <button
      type="button"
      tabIndex={-1}
      disabled={disabled}
      aria-label={open ? "收合選單" : "展開選單"}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground"
      onMouseDown={(e) => {
       e.preventDefault()
      }}
      onClick={() => {
       if (disabled) return
       if (open) closePanel()
       else {
        setQuery(selectedText)
        setOpen(true)
        searchRef.current?.focus()
        window.setTimeout(() => {
         const el = searchRef.current
         if (el && el.value === selectedText) el.select()
        }, 0)
       }
      }}
     >
      <ChevronDown className="h-4 w-4" aria-hidden />
     </button>
    </div>
   ) : (
    <button
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
   )}
   {panel}
  </div>
 )
}
