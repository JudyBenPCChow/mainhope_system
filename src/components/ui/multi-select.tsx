import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react"
import { Check, ChevronDown, Plus } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type MultiSelectOption = {
 value: string
 label: ReactNode
 disabled?: boolean
}

type MultiSelectProps = {
 value: string[]
 onChange: (next: string[]) => void
 options: MultiSelectOption[]
 placeholder?: string
 disabled?: boolean
 className?: string
 /** 下拉底部可新增自訂選項（互斥群組等無主檔清單時使用） */
 allowCustom?: boolean
 customPlaceholder?: string
 emptyMessage?: string
}

export function MultiSelect({
 value,
 onChange,
 options,
 placeholder = "請選擇",
 disabled,
 className,
 allowCustom = false,
 customPlaceholder = "新增選項…",
 emptyMessage = "尚無可選項目",
}: MultiSelectProps) {
 const [open, setOpen] = useState(false)
 const [customInput, setCustomInput] = useState("")
 const triggerRef = useRef<HTMLButtonElement>(null)
 const panelRef = useRef<HTMLDivElement>(null)
 const listId = useId()

 const selected = useMemo(() => {
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of value) {
   const t = v.trim()
   if (!t || seen.has(t)) continue
   seen.add(t)
   out.push(t)
  }
  return out
 }, [value])

 const optionByValue = useMemo(() => new Map(options.map((o) => [o.value, o])), [options])

 const triggerLabel = useMemo(() => {
  if (selected.length === 0) return placeholder
  const labels = selected.map((v) => {
   const opt = optionByValue.get(v)
   if (opt?.label != null) return String(opt.label)
   return v
  })
  if (labels.length <= 2) return labels.join("、")
  return `已選 ${labels.length} 項`
 }, [selected, optionByValue, placeholder])

 const toggle = (optValue: string) => {
  if (disabled) return
  onChange(
   selected.includes(optValue) ? selected.filter((v) => v !== optValue) : [...selected, optValue]
  )
 }

 const addCustom = () => {
  const t = customInput.trim()
  if (!t || disabled) return
  if (!selected.includes(t)) onChange([...selected, t])
  setCustomInput("")
 }

 useEffect(() => {
  if (!open) return
  const onPointerDown = (e: MouseEvent) => {
   const target = e.target as Node
   if (triggerRef.current?.contains(target)) return
   if (panelRef.current?.contains(target)) return
   setOpen(false)
  }
  const onKeyDown = (e: KeyboardEvent) => {
   if (e.key === "Escape") setOpen(false)
  }
  document.addEventListener("mousedown", onPointerDown)
  document.addEventListener("keydown", onKeyDown)
  return () => {
   document.removeEventListener("mousedown", onPointerDown)
   document.removeEventListener("keydown", onKeyDown)
  }
 }, [open])

 const panel = open ? (
      <div
       ref={panelRef}
       id={listId}
       role="listbox"
       aria-multiselectable="true"
       className="absolute left-0 right-0 top-[calc(100%+6px)] z-[270] max-h-80 overflow-y-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl"
      >
       {options.length === 0 ? (
        <p className="px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</p>
       ) : (
        options.map((opt) => {
         const active = selected.includes(opt.value)
         return (
          <button
           key={opt.value}
           type="button"
           role="option"
           aria-selected={active}
           disabled={opt.disabled || disabled}
           onClick={() => toggle(opt.value)}
           className={cn(
            "relative flex w-full cursor-default select-none items-center rounded-md py-2 pl-8 pr-3 text-left text-sm outline-none",
            "hover:bg-muted focus-visible:bg-muted disabled:pointer-events-none disabled:opacity-50"
           )}
          >
           <span
            className={cn(
             "absolute left-2 inline-flex h-4 w-4 items-center justify-center",
             active ? "text-foreground" : "text-transparent"
            )}
            aria-hidden
           >
            <Check className="h-4 w-4" />
           </span>
           <span>{opt.label}</span>
          </button>
         )
        })
       )}
       {allowCustom ? (
        <div className="mt-1 flex gap-2 border-t border-border/80 p-2">
         <Input
          className="h-8 text-sm"
          value={customInput}
          disabled={disabled}
          placeholder={customPlaceholder}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
           if (e.key === "Enter") {
            e.preventDefault()
            addCustom()
           }
          }}
         />
         <button
          type="button"
          disabled={disabled || !customInput.trim()}
          onClick={addCustom}
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-border bg-muted/40 px-2 text-xs font-medium hover:bg-muted disabled:opacity-50"
         >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          加入
         </button>
        </div>
       ) : null}
      </div>
 ) : null

 return (
  <div className="relative">
   <button
    ref={triggerRef}
    type="button"
    disabled={disabled}
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-controls={open ? listId : undefined}
    onClick={() => {
     if (disabled) return
     setOpen((v) => !v)
    }}
    className={cn(
     "flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 text-left text-sm shadow-sm transition-colors",
     "focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
     "hover:border-neutral-400",
     selected.length === 0 && "text-muted-foreground",
     className
    )}
   >
    <span className="min-w-0 truncate">{triggerLabel}</span>
    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
   </button>
   {panel}
  </div>
 )
}
