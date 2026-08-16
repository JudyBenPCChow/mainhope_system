import { Download, RefreshCw, Loader2 } from "lucide-react"

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
 subjectOptions: { value: string; label: string }[]
 teacherOptions: { value: string; label: string }[]
 classOptions: { value: string; label: string }[]
 onExport: () => void
 onRefresh: () => void
 loading?: boolean
 exporting?: boolean
 asOf?: string | null
}

export function MgmtDashboardFilterBar({
 filters,
 onChange,
 subjectOptions,
 teacherOptions,
 classOptions,
 onExport,
 onRefresh,
 loading,
 exporting,
 asOf,
}: Props) {
 return (
  <div className="sticky top-0 z-20 -mx-6 border-b border-border bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
   <div className="flex flex-col gap-3">
    <div className="flex flex-wrap items-end justify-between gap-3">
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
     <div className="flex flex-wrap items-center gap-2">
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
      <Button type="button" variant="outline" size="sm" onClick={onExport} disabled={exporting}>
       <Download className="mr-2 h-4 w-4" aria-hidden />
       匯出 CSV
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
       {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
       ) : (
        <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
       )}
       重新整理
      </Button>
     </div>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
     <div>
      <label className="mb-1 block text-xs text-muted-foreground">課程／科目</label>
      <MultiSelect
       value={filters.subjectIds}
       onChange={(subjectIds) => onChange({ ...filters, subjectIds })}
       options={subjectOptions}
       placeholder="全部科目"
       emptyMessage="尚無科目"
      />
     </div>
     <div>
      <label className="mb-1 block text-xs text-muted-foreground">導師</label>
      <MultiSelect
       value={filters.teacherIds}
       onChange={(teacherIds) => onChange({ ...filters, teacherIds })}
       options={teacherOptions}
       placeholder="全部導師"
       emptyMessage="尚無導師"
      />
     </div>
     <div>
      <label className="mb-1 block text-xs text-muted-foreground">班別類型</label>
      <Select
       value={filters.classKind}
       onChange={(e) =>
        onChange({ ...filters, classKind: e.target.value as ClassKindFilter })
       }
      >
       <option value="all">全部</option>
       <option value="group">專科班</option>
       <option value="private">私人課程</option>
      </Select>
     </div>
     <div>
      <label className="mb-1 block text-xs text-muted-foreground">班別</label>
      <MultiSelect
       value={filters.classIds}
       onChange={(classIds) => onChange({ ...filters, classIds })}
       options={classOptions}
       placeholder="全部班別"
       emptyMessage="尚無班別"
      />
     </div>
    </div>

    {asOf ? (
     <p className="text-xs text-muted-foreground">
      數據更新時間 as of <span className="tabular-nums text-foreground">{asOf}</span>
     </p>
    ) : null}
   </div>
  </div>
 )
}
