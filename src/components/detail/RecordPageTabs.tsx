import { Select } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export type RecordPageTabItem<T extends string = string> = {
 id: T
 label: string
}

type RecordPageTabsProps<T extends string> = {
 tabs: readonly RecordPageTabItem<T>[]
 value: T
 onChange: (id: T) => void
 isMobile: boolean
 className?: string
}

/** 紀錄頁分頁：桌面純文字底線；流動裝置用 Select 顯示工作名稱。 */
export function RecordPageTabs<T extends string>({
 tabs,
 value,
 onChange,
 isMobile,
 className,
}: RecordPageTabsProps<T>) {
 const activeLabel = tabs.find((t) => t.id === value)?.label ?? tabs[0]?.label ?? "分頁"

 return (
  <div className={cn("border-b border-border", isMobile ? "px-0" : "mt-4", className)}>
   {isMobile ? (
    <Select
     className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm font-medium text-foreground"
     value={value}
     onChange={(e) => onChange(e.target.value as T)}
     aria-label={activeLabel}
    >
     {tabs.map((t) => (
      <option key={t.id} value={t.id}>
       {t.label}
      </option>
     ))}
    </Select>
   ) : (
    <nav className="flex gap-1 overflow-x-auto">
     {tabs.map((t) => {
      const active = value === t.id
      return (
       <button
        key={t.id}
        type="button"
        onClick={() => onChange(t.id)}
        className={cn(
         "shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
         active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
        )}
       >
        {t.label}
       </button>
      )
     })}
    </nav>
   )}
  </div>
 )
}
