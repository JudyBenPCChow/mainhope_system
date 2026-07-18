import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
 placeholder?: string
}

type OptionLike = {
 value: string
 label: React.ReactNode
 disabled?: boolean
 groupLabel?: string
}

const EMPTY_SENTINEL = "__SELECT_EMPTY__"

function toUiValue(value: string | undefined): string {
 if (value == null || value === "") return EMPTY_SENTINEL
 return value
}

function fromUiValue(value: string): string {
 if (value === EMPTY_SENTINEL) return ""
 return value
}

function collectOptions(children: React.ReactNode, groupLabel?: string): OptionLike[] {
 const out: OptionLike[] = []
 for (const child of React.Children.toArray(children)) {
  if (!React.isValidElement(child)) continue
  if (child.type === React.Fragment) {
   out.push(...collectOptions(child.props.children, groupLabel))
   continue
  }
  if (typeof child.type !== "string") continue
  if (child.type === "optgroup") {
   const label = typeof child.props.label === "string" ? child.props.label : undefined
   out.push(...collectOptions(child.props.children, label))
   continue
  }
  if (child.type === "option") {
   const v = child.props.value != null ? String(child.props.value) : ""
   out.push({
    value: v,
    label: child.props.children,
    disabled: Boolean(child.props.disabled),
    groupLabel,
   })
  }
 }
 return out
}

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
 (
  {
   className,
   children,
   value,
   defaultValue,
   onChange,
   disabled,
   id,
   name,
   required,
   placeholder,
  },
  ref
 ) => {
  const options = React.useMemo(() => collectOptions(children), [children])
  const grouped = React.useMemo(() => {
   const map = new Map<string, OptionLike[]>()
   for (const o of options) {
    const key = o.groupLabel ?? ""
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(o)
   }
   return [...map.entries()]
  }, [options])

  const effectivePlaceholder =
   placeholder ?? (options.find((o) => o.value === "")?.label ? String(options.find((o) => o.value === "")?.label) : "請選擇")

  const currentValue = typeof value === "string" ? toUiValue(value) : undefined
  const currentDefault = typeof defaultValue === "string" ? toUiValue(defaultValue) : undefined

  const handleValueChange = (nextUi: string) => {
   if (!onChange) return
   const next = fromUiValue(nextUi)
   onChange({
    target: { value: next, name },
    currentTarget: { value: next, name },
   } as React.ChangeEvent<HTMLSelectElement>)
  }

  return (
   <div className="relative min-w-0">
    <SelectPrimitive.Root
     value={currentValue}
     defaultValue={currentDefault}
     onValueChange={handleValueChange}
     disabled={disabled}
    >
     <SelectPrimitive.Trigger
      ref={ref}
      id={id}
      aria-label={typeof effectivePlaceholder === "string" ? effectivePlaceholder : undefined}
      className={cn(
       "flex min-h-10 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-input bg-background px-3 py-2 text-left text-sm shadow-sm transition-colors",
       "focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
       "hover:border-neutral-400",
       "[&>span]:min-w-0 [&>span]:flex-1 [&>span]:truncate",
       className
      )}
     >
      <SelectPrimitive.Value placeholder={effectivePlaceholder} />
      <SelectPrimitive.Icon asChild>
       <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </SelectPrimitive.Icon>
     </SelectPrimitive.Trigger>
     <SelectPrimitive.Portal>
      <SelectPrimitive.Content
       position="popper"
       sideOffset={6}
       className="z-[320] max-h-80 min-w-[var(--radix-select-trigger-width)] max-w-[min(100vw-1.5rem,var(--radix-select-trigger-width))] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl"
      >
       <SelectPrimitive.Viewport className="p-1">
        {grouped.map(([label, items]) => (
         <div key={label || "__default"}>
          {label ? <p className="px-2 py-1 text-xs font-medium text-muted-foreground">{label}</p> : null}
          {items.map((opt) => (
           <SelectPrimitive.Item
            key={`${label}-${opt.value || "__empty__"}`}
            value={toUiValue(opt.value)}
            disabled={opt.disabled}
            className={cn(
             "relative flex cursor-default select-none items-start rounded-md py-2 pl-8 pr-3 text-sm outline-none",
             "data-[highlighted]:bg-muted data-[highlighted]:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            )}
           >
            <SelectPrimitive.ItemIndicator className="absolute left-2 top-2.5 inline-flex items-center">
             <Check className="h-4 w-4" />
            </SelectPrimitive.ItemIndicator>
            <SelectPrimitive.ItemText className="whitespace-normal break-words">
             {opt.label}
            </SelectPrimitive.ItemText>
           </SelectPrimitive.Item>
          ))}
          {label ? <div className="my-1 h-px bg-border/80" /> : null}
         </div>
        ))}
       </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
     </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
    {name ? <input type="hidden" name={name} value={typeof value === "string" ? value : ""} required={required} /> : null}
   </div>
  )
 }
)

Select.displayName = "Select"

export { Select }
