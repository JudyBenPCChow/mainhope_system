import { Button } from "@/components/ui/button"

type Props = {
 selectedCount: number
 unitLabel?: string
 allFilteredSelected: boolean
 onToggleSelectAll: () => void
 onClear: () => void
 children?: React.ReactNode
}

/**
 * 列表多選工具列外框：已選數量、全選、清除；批量動作放 children。
 */
export function BulkSelectionBar({
 selectedCount,
 unitLabel = "項",
 allFilteredSelected,
 onToggleSelectAll,
 onClear,
 children,
}: Props) {
 if (selectedCount <= 0) return null

 return (
  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-sm">
   <span className="text-sm">
    已選 {selectedCount} {unitLabel}
   </span>
   <Button type="button" variant="outline" size="sm" onClick={onToggleSelectAll}>
    {allFilteredSelected ? "取消全選" : "全選目前列表"}
   </Button>
   {children}
   <Button type="button" variant="ghost" size="sm" onClick={onClear}>
    清除選取
   </Button>
  </div>
 )
}
