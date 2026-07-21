import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DateRangeInput } from "@/components/ui/date-range-input"
import { MultiSelect } from "@/components/ui/multi-select"
import { Select } from "@/components/ui/select"
import type { ClassKindFilter, MgmtDashboardFilters } from "@/components/mgmtDashboard/types"

function localYmd(d = new Date()): string {
 const y = d.getFullYear()
 const m = String(d.getMonth() + 1).padStart(2, "0")
 const day = String(d.getDate()).padStart(2, "0")
 return `${y}-${m}-${day}`
}

function firstDayOfMonth(d = new Date()): string {
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`
}

function firstDayOfQuarter(d = new Date()): string {
 const q = Math.floor(d.getMonth() / 3) * 3
 return `${d.getFullYear()}-${String(q + 1).padStart(2, "0")}-01`
}

type Props = {
 filters: MgmtDashboardFilters
 onChange: (next: MgmtDashboardFilters) => void
 teacherOptions: { value: string; label: string }[]
 onExport: () => void
 exporting?: boolean
}

export function MgmtDashboardFilterBar({
 filters,
 onChange,
 teacherOptions,
 onExport,
 exporting,
}: Props) {
 const setKind = (classKind: ClassKindFilter) => onChange({ ...filters, classKind })

 return (
  <div className="sticky top-0 z-20 -mx-6 border-b border-border bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
   <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
    <div className="min-w-[16rem] flex-1">
     <DateRangeInput
      label="日期區間"
      value={{ from: filters.dateFrom, to: filters.dateTo }}
      onChange={(v) =>
       onChange({
        ...filters,
        dateFrom: v.from || filters.dateFrom,
        dateTo: v.to || filters.dateTo,
       })
      }
     />
    </div>

    <div className="flex flex-wrap gap-2">
     <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() =>
       onChange({
        ...filters,
        dateFrom: firstDayOfMonth(),
        dateTo: localYmd(),
       })
      }
     >
      本月
     </Button>
     <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() =>
       onChange({
        ...filters,
        dateFrom: firstDayOfQuarter(),
        dateTo: localYmd(),
       })
      }
     >
      本季
     </Button>
    </div>

    <div className="w-full sm:w-40">
     <label className="mb-1 block text-xs text-muted-foreground">課種</label>
     <Select
      value={filters.classKind}
      onChange={(e) => setKind(e.target.value as ClassKindFilter)}
     >
      <option value="all">全部</option>
      <option value="group">小組</option>
      <option value="private">一對一</option>
     </Select>
    </div>

    <div className="min-w-[14rem] flex-1">
     <label className="mb-1 block text-xs text-muted-foreground">導師</label>
     <MultiSelect
      value={filters.teacherIds}
      onChange={(teacherIds) => onChange({ ...filters, teacherIds })}
      options={teacherOptions}
      placeholder="全部導師"
      emptyMessage="尚無導師"
     />
    </div>

    <Button type="button" variant="outline" onClick={onExport} disabled={exporting}>
     <Download className="mr-2 h-4 w-4" aria-hidden />
     匯出 CSV
    </Button>
   </div>
  </div>
 )
}
