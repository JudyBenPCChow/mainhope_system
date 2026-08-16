import { Download, RefreshCw, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MultiSelect } from "@/components/ui/multi-select"
import { Select } from "@/components/ui/select"
import { CANONICAL_CLASS_GRADE_LABELS } from "@/lib/classGrade"
import type { ClassKindFilter, StaffPerformanceFilters } from "@/components/staffPerformance/types"

type Props = {
  filters: StaffPerformanceFilters
  onChange: (next: StaffPerformanceFilters) => void
  subjectOptions: { value: string; label: string }[]
  teacherOptions: { value: string; label: string }[]
  classOptions: { value: string; label: string }[]
  onExport: () => void
  onRefresh: () => void
  loading?: boolean
  asOf?: string | null
  periodLabel?: string
}

function monthOptions(count = 18): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 1; i <= count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    out.push({ value: key, label: `${d.getFullYear()}年${d.getMonth() + 1}月` })
  }
  return out
}

function yearOptions(): { value: string; label: string }[] {
  const y = new Date().getFullYear()
  return [y, y - 1, y - 2].map((n) => ({ value: String(n), label: `${n}年` }))
}

const gradeOptions = CANONICAL_CLASS_GRADE_LABELS.map((g) => ({ value: g, label: g }))

export function StaffFilterBar({
  filters,
  onChange,
  subjectOptions,
  teacherOptions,
  classOptions,
  onExport,
  onRefresh,
  loading,
  asOf,
  periodLabel,
}: Props) {
  const months = monthOptions()

  return (
    <div className="sticky top-0 z-20 -mx-6 border-b border-border bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-28">
              <label className="mb-1 block text-xs text-muted-foreground">期間</label>
              <Select
                value={filters.periodMode}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    periodMode: e.target.value === "quarter" ? "quarter" : "month",
                  })
                }
              >
                <option value="month">月份</option>
                <option value="quarter">季度</option>
              </Select>
            </div>
            {filters.periodMode === "month" ? (
              <div className="w-40">
                <label className="mb-1 block text-xs text-muted-foreground">月份</label>
                <Select
                  value={filters.monthKey}
                  onChange={(e) => onChange({ ...filters, monthKey: e.target.value })}
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <>
                <div className="w-28">
                  <label className="mb-1 block text-xs text-muted-foreground">年份</label>
                  <Select
                    value={String(filters.year)}
                    onChange={(e) => onChange({ ...filters, year: Number(e.target.value) })}
                  >
                    {yearOptions().map((y) => (
                      <option key={y.value} value={y.value}>
                        {y.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="w-28">
                  <label className="mb-1 block text-xs text-muted-foreground">季度</label>
                  <Select
                    value={String(filters.quarter)}
                    onChange={(e) => onChange({ ...filters, quarter: Number(e.target.value) })}
                  >
                    <option value="1">Q1</option>
                    <option value="2">Q2</option>
                    <option value="3">Q3</option>
                    <option value="4">Q4</option>
                  </Select>
                </div>
              </>
            )}
            <div className="w-44">
              <label className="mb-1 block text-xs text-muted-foreground">老闆</label>
              <Select
                value={filters.excludeOwners ? "exclude" : "include"}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    excludeOwners: e.target.value !== "include",
                  })
                }
              >
                <option value="exclude">排除 Mark／Christine</option>
                <option value="include">包含老闆</option>
              </Select>
            </div>
            {periodLabel ? (
              <p className="pb-2 text-sm text-muted-foreground">目前：{periodLabel}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onExport}>
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

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">科目</label>
            <MultiSelect
              value={filters.subjectIds}
              onChange={(subjectIds) => onChange({ ...filters, subjectIds })}
              options={subjectOptions}
              placeholder="全部科目"
              emptyMessage="尚無科目"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">老師</label>
            <MultiSelect
              value={filters.teacherIds}
              onChange={(teacherIds) => onChange({ ...filters, teacherIds })}
              options={teacherOptions}
              placeholder="全部老師"
              emptyMessage="尚無老師"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">班型</label>
            <Select
              value={filters.classKind}
              onChange={(e) =>
                onChange({
                  ...filters,
                  classKind: e.target.value as ClassKindFilter,
                })
              }
            >
              <option value="all">全部</option>
              <option value="group">專科班</option>
              <option value="private">私人課程</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">年級</label>
            <MultiSelect
              value={filters.gradeIds}
              onChange={(gradeIds) => onChange({ ...filters, gradeIds })}
              options={gradeOptions}
              placeholder="全部年級"
              emptyMessage="尚無年級"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">新生／舊生</label>
            <Select
              value={filters.studentType}
              onChange={(e) => {
                const v = e.target.value
                onChange({
                  ...filters,
                  studentType: v === "new" || v === "returning" ? v : "all",
                })
              }}
            >
              <option value="all">全部</option>
              <option value="new">新生</option>
              <option value="returning">舊生</option>
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
