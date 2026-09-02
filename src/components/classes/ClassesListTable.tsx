import { useMemo } from "react"
import { AlertTriangle } from "lucide-react"
import { Link } from "react-router-dom"

import {
 GRADE_HEADER_FILTER_OPTIONS,
 CLASS_LIST_COLUMN_LABEL,
 CLASS_LIST_DATA_COLUMNS,
 isPresetClassHeaderFilterColumn,
 rowsMatchingClassHeaderFiltersExcept,
 uniqueClassHeaderFilterValues,
 type ClassListColumnId,
 type ClassListExtras,
 type ClassListHeaderFilters,
} from "@/components/classes/classesListColumns"
import { HeaderFilterButton } from "@/components/list/HeaderFilterButton"
import { SortableColumnHeader } from "@/components/list/SortableColumnHeader"
import {
 stickyTableBodyClass,
 stickyTableHeadCellClass,
 stickyTableHeadClass,
 stickyTableHeadRowClass,
 stickyTableWrapClass,
} from "@/components/list/StickyListShell"
import { Checkbox } from "@/components/ui/checkbox"
import { SkeletonTableRows } from "@/components/ui/skeleton"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { classDisplayName } from "@/lib/courseLabel"
import { cn } from "@/lib/utils"
import type { ClassRecord } from "@/services/classQueries"

const rowInteractive =
 "cursor-pointer transition-colors duration-150 hover:bg-info/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"

type Props = {
 rows: ClassRecord[]
 filterSourceRows: ClassRecord[]
 extras: ClassListExtras
 loading: boolean
 emptyHint: string
 sortKey: ClassListColumnId
 sortDir: "asc" | "desc"
 onToggleSort: (key: ClassListColumnId) => void
 headerFilters: ClassListHeaderFilters
 onHeaderFilterChange: (key: ClassListColumnId, value: string) => void
 selectedIds: string[]
 onToggleSelect: (id: string) => void
 onToggleSelectAll: () => void
 onNavigate: (id: string) => void
 previewId?: string | null
 hasNoActiveSchedule: (c: ClassRecord) => boolean
}

export function ClassesListTable({
 rows,
 filterSourceRows,
 extras,
 loading,
 emptyHint,
 sortKey,
 sortDir,
 onToggleSort,
 headerFilters,
 onHeaderFilterChange,
 selectedIds,
 onToggleSelect,
 onToggleSelectAll,
 onNavigate,
 previewId = null,
 hasNoActiveSchedule,
}: Props) {
 const selectedSet = new Set(selectedIds)
 const allSelected = rows.length > 0 && rows.every((r) => selectedSet.has(r.id))
 const someSelected = rows.some((r) => selectedSet.has(r.id)) && !allSelected
 const colSpan = 1 + CLASS_LIST_DATA_COLUMNS.length

 return (
  <div className={stickyTableWrapClass}>
    <table className="w-full min-w-0 table-fixed border-separate border-spacing-0 text-sm isolate">
     <thead className={stickyTableHeadClass}>
      <tr className={stickyTableHeadRowClass}>
       <th className={cn(stickyTableHeadCellClass, "w-10 px-3 py-3")}>
        <Checkbox
         checked={allSelected}
         indeterminate={someSelected}
         onCheckedChange={() => onToggleSelectAll()}
         aria-label="全選目前列表"
        />
       </th>
       {CLASS_LIST_DATA_COLUMNS.map((id) => (
        <th
         key={id}
         className={cn(
          stickyTableHeadCellClass,
          "min-w-0 whitespace-nowrap py-3 font-medium text-muted-foreground",
          id === "course_code" ? "w-[11rem] px-4 pr-2" : "px-3 pr-2",
          id === "grade" ? "w-[3.75rem]" : "",
          id === "student_count" ? "w-[7.25rem] text-center" : "",
          id === "student_names" ? "w-[28%]" : ""
         )}
        >
         <SortableColumnHeader
          label={CLASS_LIST_COLUMN_LABEL[id]}
          active={sortKey === id}
          dir={sortDir}
          onToggle={() => onToggleSort(id)}
          className={id === "student_count" ? "justify-center" : undefined}
          labelClassName={id === "student_count" ? "whitespace-nowrap" : undefined}
         >
          <ClassHeaderFilter
           column={id}
           value={headerFilters[id]}
           onChange={(v) => onHeaderFilterChange(id, v)}
           sourceRows={filterSourceRows}
           headerFilters={headerFilters}
           extras={extras}
          />
         </SortableColumnHeader>
        </th>
       ))}
      </tr>
     </thead>
     {loading ? (
      <tbody className={stickyTableBodyClass}>
       <tr>
        <td colSpan={colSpan} className="px-3 py-4">
         <SkeletonTableRows rows={8} columns={Math.min(colSpan, 10)} />
        </td>
       </tr>
      </tbody>
     ) : rows.length === 0 ? (
      <tbody className={stickyTableBodyClass}>
       <tr>
        <td colSpan={colSpan} className="px-3 py-8 text-center text-muted-foreground">
         {emptyHint}
        </td>
       </tr>
      </tbody>
     ) : (
      <StaggerList
       as="tbody"
       className={cn(stickyTableBodyClass, "[&_td]:border-b [&_td]:border-border")}
      >
       {rows.map((c, idx) => {
        const checked = selectedSet.has(c.id)
        const roster = extras.enrollRoster.get(c.id)
        return (
         <StaggerItem
          key={c.id}
          as="tr"
          onClick={() => onNavigate(c.id)}
          className={cn(
           "border-b border-border",
           rowInteractive,
           idx % 2 === 1 ? "bg-muted/15" : "",
           checked ? "bg-info/10" : "",
           previewId === c.id ? "bg-info/15" : ""
          )}
         >
          <td className="px-3 py-3 align-top" onClick={(e) => e.stopPropagation()}>
           <Checkbox
            checked={checked}
            onCheckedChange={() => onToggleSelect(c.id)}
            aria-label={`選取 ${classDisplayName({ subject: c.subject, courseName: c.course_name })}`}
           />
          </td>
          <td className="min-w-0 align-top px-4 py-3 pr-2 text-muted-foreground">
           <span
            className="flex items-start gap-1"
            title={hasNoActiveSchedule(c) ? "此班別尚無進行中的排程" : undefined}
           >
            {hasNoActiveSchedule(c) ? (
             <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-warning"
              aria-label="尚無排程"
             />
            ) : null}
            <span
             className="block whitespace-nowrap font-mono text-xs"
             title={c.course_code_full ?? undefined}
            >
             {c.course_code_full ?? "—"}
            </span>
           </span>
          </td>
          <td className="min-w-0 align-top px-3 py-3 pr-2">
           <span className="block break-words text-xs leading-relaxed">
            {(c.grade ?? []).join("、") || "—"}
           </span>
          </td>
          <td className="min-w-0 align-top px-3 py-3 pr-2">
           <span className="block break-words font-medium leading-relaxed">
            {classDisplayName({ subject: c.subject, courseName: c.course_name })}
           </span>
          </td>
          <td className="min-w-0 align-top px-3 py-3 pr-2 text-muted-foreground">
           <span className="block truncate whitespace-nowrap leading-relaxed" title={extras.timeLabel(c)}>
            {extras.timeLabel(c)}
           </span>
          </td>
          <td className="min-w-0 align-top px-3 py-3 pr-2" onClick={(e) => e.stopPropagation()}>
           {c.teacher_id ? (
            <Link
             to={`/Teachers/${c.teacher_id}`}
             className="font-medium text-primary underline-offset-4 hover:underline"
            >
             {c.teacher_name ?? "—"}
            </Link>
           ) : (
            "—"
           )}
          </td>
          <td
           className="align-top px-3 py-3 pr-2 text-center tabular-nums text-muted-foreground"
           onClick={(e) => e.stopPropagation()}
           title="僅統計狀態為「就讀中」的選課"
          >
           {roster?.count ?? 0}
          </td>
          <td
           className="min-w-0 align-top px-3 py-3 pr-4 text-sm text-foreground"
           onClick={(e) => e.stopPropagation()}
           title={(roster?.names ?? []).length > 0 ? (roster?.names ?? []).join("、") : undefined}
          >
           {(roster?.names ?? []).length > 0 ? (
            <span className="line-clamp-2 break-words leading-relaxed [overflow-wrap:anywhere]">
             {(roster?.names ?? []).join("、")}
            </span>
           ) : (
            <span className="text-muted-foreground">—</span>
           )}
          </td>
         </StaggerItem>
        )
       })}
      </StaggerList>
     )}
    </table>
  </div>
 )
}

function ClassHeaderFilter({
 column,
 value,
 onChange,
 sourceRows,
 headerFilters,
 extras,
}: {
 column: ClassListColumnId
 value: string
 onChange: (next: string) => void
 sourceRows: ClassRecord[]
 headerFilters: ClassListHeaderFilters
 extras: ClassListExtras
}) {
 const options = useMemo(() => {
  if (column === "grade") return GRADE_HEADER_FILTER_OPTIONS
  const subset = rowsMatchingClassHeaderFiltersExcept(sourceRows, headerFilters, column, extras)
  return uniqueClassHeaderFilterValues(column, subset, extras).map((v) => ({ value: v, label: v }))
 }, [column, sourceRows, headerFilters, extras])

 return (
  <HeaderFilterButton
   columnLabel={CLASS_LIST_COLUMN_LABEL[column]}
   value={value}
   onChange={onChange}
   mode={isPresetClassHeaderFilterColumn(column) ? "preset" : "text"}
   options={options}
  />
 )
}
