import { X } from "lucide-react"
import { useState } from "react"

import { Input } from "@/components/ui/input"
import { Tag } from "@/components/ui/tag"
import { cn } from "@/lib/utils"
import { normalizeTodoTags, type CalendarEventStatus } from "@/services/calendarQueries"

export const TODO_TAG_PRESETS = ["待收學費", "調堂跟進", "試堂跟進"] as const

export function todoStatusLabel(status: CalendarEventStatus): string {
 return status === "done" ? "已完成" : "處理中"
}

export function todoStatusTone(status: CalendarEventStatus): "info" | "success" {
 return status === "done" ? "success" : "info"
}

type TodoStatusChipsProps = {
 value: CalendarEventStatus
 onChange: (value: CalendarEventStatus) => void
 disabled?: boolean
 className?: string
}

const STATUS_OPTIONS: CalendarEventStatus[] = ["in_progress", "done"]

export function TodoStatusChips({ value, onChange, disabled, className }: TodoStatusChipsProps) {
 return (
  <div className={cn("flex flex-wrap gap-2", className)}>
   {STATUS_OPTIONS.map((opt) => {
    const active = value === opt
    return (
     <button
      key={opt}
      type="button"
      disabled={disabled}
      onClick={() => onChange(opt)}
      className={cn(
       "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
       active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-card text-foreground hover:bg-muted/80"
      )}
     >
      {todoStatusLabel(opt)}
     </button>
    )
   })}
  </div>
 )
}

type TodoTagMultiSelectProps = {
 value: string[]
 onChange: (tags: string[]) => void
 disabled?: boolean
 className?: string
}

export function TodoTagMultiSelect({ value, onChange, disabled, className }: TodoTagMultiSelectProps) {
 const [customInput, setCustomInput] = useState("")
 const selected = normalizeTodoTags(value)

 const toggle = (tag: string) => {
  if (disabled) return
  onChange(selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag])
 }

 const addCustom = () => {
  const t = customInput.trim()
  if (!t || disabled) return
  if (!selected.includes(t)) onChange([...selected, t])
  setCustomInput("")
 }

 return (
  <div className={cn("space-y-3", className)}>
   <div className="flex flex-wrap gap-2">
    {TODO_TAG_PRESETS.map((tag) => {
     const active = selected.includes(tag)
     return (
      <button
       key={tag}
       type="button"
       disabled={disabled}
       onClick={() => toggle(tag)}
       className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
        active
         ? "border-primary bg-primary text-primary-foreground"
         : "border-border bg-card text-foreground hover:bg-muted/80"
       )}
      >
       {tag}
      </button>
     )
    })}
   </div>
   <div className="flex flex-wrap gap-2">
    <Input
     className="h-9 max-w-[200px] text-sm"
     value={customInput}
     disabled={disabled}
     placeholder="自訂標籤"
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
     className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
    >
     加入標籤
    </button>
   </div>
   {selected.length > 0 ? (
    <div className="flex flex-wrap gap-1.5">
     {selected.map((tag) => (
      <span key={tag} className="inline-flex items-center gap-1">
       <Tag tone="default" size="sm">
        {tag}
       </Tag>
       {!disabled ? (
        <button
         type="button"
         className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
         aria-label={`移除標籤 ${tag}`}
         onClick={() => toggle(tag)}
        >
         <X className="h-3.5 w-3.5" />
        </button>
       ) : null}
      </span>
     ))}
    </div>
   ) : (
    <p className="text-xs text-muted-foreground">尚未選擇標籤</p>
   )}
  </div>
 )
}

export function TodoTagList({ tags, className }: { tags: string[]; className?: string }) {
 const list = normalizeTodoTags(tags)
 if (list.length === 0) return <span className="text-xs text-muted-foreground">—</span>
 return (
  <div className={cn("flex flex-wrap gap-1", className)}>
   {list.map((tag) => (
    <Tag key={tag} tone="default" size="sm">
     {tag}
    </Tag>
   ))}
  </div>
 )
}
