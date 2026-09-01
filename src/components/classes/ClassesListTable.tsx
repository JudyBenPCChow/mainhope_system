import { useMemo } from "react"
import { AlertTriangle, Copy } from "lucide-react"
import { Link } from "react-router-dom"

import {
 GRADE_HEADER_FILTER_OPTIONS,
 STATUS_HEADER_FILTER_OPTIONS,
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
import { stickyTableHeadCellClass, stickyTableHeadRowClass } from "@/components/list/StickyListShell"
import { Checkbox } from "@/components/ui/checkbox"
import { Select } from "@/components/ui/select"
import { SkeletonTableRows } from "@/components/ui/skeleton"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { STATUS_CHIPS } from "@/components/classes/classesUi"
import { classDisplayName } from "@/lib/courseLabel"
import { cn } from "@/lib/utils"
import type { ClassRecord } from "@/services/classQueries"

const rowInteractive =
 "cursor-pointer transition-colors duration-150 hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"

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
 teacherScoped: boolean
 canDeleteClass: boolean
 onNavigate: (id: string) => void
 previewId?: string | null
 onStatusChange: (id: string, status: string) => void
 onCopy: (e: React.MouseEvent, id: string) => void
 onDelete: (e: React.MouseEvent, id: string) => void
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
 teacherScoped,
 canDeleteClass,
 onNavigate,
 previewId = null,
 onStatusChange,
 onCopy,
 onDelete,
 hasNoActiveSchedule,
}: Props) {
 const selectedSet = new Set(selectedIds)
 const allSelected = rows.length > 0 && rows.every((r) => selectedSet.has(r.id))
 const someSelected = rows.some((r) => selectedSet.has(r.id)) && !allSelected
 const colSpan = 1 + CLASS_LIST_DATA_COLUMNS.length + 1

 return (
  <div className="rounded-xl border border-border bg-card shadow-sm">
    <table className="w-full min-w-[104rem] table-fixed border-separate border-spacing-0 text-sm">
     <thead>
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
          "whitespace-nowrap py-3 font-medium text-muted-foreground",
          id === "course_code" ? "min-w-[7.5rem] px-4 pr-2" : "min-w-[5.5rem] px-3 pr-2",
          id === "student_count" ? "text-center" : "",
          id === "student_names" ? "min-w-[20rem]" : "",
          id === "enrollment_notice" ? "min-w-[12rem]" : ""
         )}
        >
         <SortableColumnHeader
          label={CLASS_LIST_COLUMN_LABEL[id]}
          active={sortKey === id}
          dir={sortDir}
          onToggle={() => onToggleSort(id)}
          className={id === "student_count" ? "justify-center" : undefined}
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
       <th
        className={cn(
         stickyTableHeadCellClass,
         "min-w-[6.5rem] whitespace-nowrap px-3 py-3 pl-2 font-medium text-muted-foreground"
        )}
       >
        操作
       </th>
      </tr>
     </thead>
     {loading ? (
      <tbody>
       <tr>
        <td colSpan={colSpan} className="px-3 py-4">
         <SkeletonTableRows rows={8} columns={Math.min(colSpan, 10)} />
        </td>
       </tr>
      </tbody>
     ) : rows.length === 0 ? (
      <tbody>
       <tr>
        <td colSpan={colSpan} className="px-3 py-8 text-center text-muted-foreground">
         {emptyHint}
        </td>
       </tr>
      </tbody>
     ) : (
      <StaggerList as="tbody" className="[&_td]:border-b [&_td]:border-border">
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
             className="block truncate font-mono text-xs"
             title={c.course_code_full ?? undefined}
            >
             {c.course_code_full ?? "—"}
            </span>
           </span>
          </td>
          <td className="min-w-0 align-top px-3 py-3 pr-2">
           <span className="block break-words leading-relaxed">
            {(c.grade ?? []).join("、") || "—"}
           </span>
          </td>
          <td className="min-w-0 align-top px-3 py-3 pr-2">
           <span className="block break-words font-medium leading-relaxed">
            {classDisplayName({ subject: c.subject, courseName: c.course_name })}
           </span>
          </td>
          <td className="min-w-0 align-top px-3 py-3 pr-2 text-muted-foreground">
           <span className="block break-words leading-relaxed">{extras.timeLabel(c)}</span>
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
           className="min-w-[20rem] max-w-[28rem] align-top px-3 py-3 pr-4 text-xs text-muted-foreground"
           onClick={(e) => e.stopPropagation()}
           title={(roster?.names ?? []).length > 0 ? (roster?.names ?? []).join("、") : undefined}
          >
           {(roster?.names ?? []).length > 0 ? (
            <span className="line-clamp-2 break-words leading-relaxed [overflow-wrap:anywhere]">
             {(roster?.names ?? []).join("、")}
            </span>
           ) : (
            "—"
           )}
          </td>
          <td
           className="min-w-[12rem] max-w-[16rem] align-top px-3 py-3 pr-2 text-xs text-muted-foreground"
           title={c.enrollment_notice?.trim() || undefined}
          >
           {c.enrollment_notice?.trim() ? (
            <span className="line-clamp-2 break-words leading-relaxed [overflow-wrap:anywhere]">
             {c.enrollment_notice}
            </span>
           ) : (
            "—"
           )}
          </td>
          <td className="align-top px-3 py-3 pr-2" onClick={(e) => e.stopPropagation()}>
           <Select
            className="h-8 w-full min-w-0 max-w-full rounded-md border border-input bg-background px-2 text-xs transition-colors hover:border-primary/50"
            value={c.status}
            disabled={teacherScoped}
            onChange={(e) => void onStatusChange(c.id, e.target.value)}
           >
            {STATUS_CHIPS.filter((s) => s !== "全部").map((s) => (
             <option key={s} value={s}>
              {s}
             </option>
            ))}
           </Select>
          </td>
          <td className="align-top px-3 py-3 pl-2" onClick={(e) => e.stopPropagation()}>
           <div className="flex min-w-0 flex-col items-start gap-y-1.5 leading-none">
            <button
             type="button"
             className="text-left text-primary hover:underline"
             onClick={() => onNavigate(c.id)}
            >
             {teacherScoped ? "查看" : "編輯"}
            </button>
            {!teacherScoped ? (
             <button
              type="button"
              className="text-left text-muted-foreground hover:text-foreground hover:underline"
              onClick={(e) => void onCopy(e, c.id)}
             >
              <Copy className="mr-0.5 inline h-3.5 w-3.5" />
              複製
             </button>
            ) : null}
            {canDeleteClass ? (
             <button
              type="button"
              className="text-left text-destructive hover:underline"
              onClick={(e) => void onDelete(e, c.id)}
             >
              刪除
             </button>
            ) : null}
           </div>
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
  if (column === "status") return STATUS_HEADER_FILTER_OPTIONS
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
