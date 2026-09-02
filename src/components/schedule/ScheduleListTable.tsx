import { Fragment, type KeyboardEvent, type ReactNode } from "react"

import { HeaderFilterButton } from "@/components/list/HeaderFilterButton"
import { SortableColumnHeader } from "@/components/list/SortableColumnHeader"
import {
 stickyTableBodyClass,
 stickyTableHeadCellClass,
 stickyTableHeadClass,
 stickyTableHeadRowClass,
 stickyTableWrapClass,
} from "@/components/list/StickyListShell"
import { ScheduleAlertIcons } from "@/components/schedule/ScheduleAlertIcons"
import {
 isPresetScheduleHeaderFilterColumn,
 rowsMatchingScheduleHeaderFiltersExcept,
 SCHEDULE_LIST_COLUMN_LABEL,
 SCHEDULE_LIST_DATA_COLUMNS,
 SCHEDULE_STATUS_HEADER_FILTER_OPTIONS,
 uniqueScheduleHeaderFilterValues,
 type ScheduleListColumnId,
 type ScheduleListHeaderFilters,
} from "@/components/schedule/scheduleListColumns"
import { SkeletonInlineBadge, SkeletonTableRows } from "@/components/ui/skeleton"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { Tag } from "@/components/ui/tag"
import { isHomeworkOccupancySchedule } from "@/lib/homeworkTutoringSchedules"
import { isUnassignedTeachingTeacherIssue, scheduleTeacherDisplayName } from "@/lib/privateClassKind"
import { formatScheduleSubstituteTag } from "@/lib/scheduleSubstitute"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import type { SortDir } from "@/components/list/listFilterUtils"
import type { ScheduleAlerts, ScheduleManageRow } from "@/services/scheduleQueries"

const rowInteractive =
 "cursor-pointer transition-colors duration-150 hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"

type Props = {
 rows: ScheduleManageRow[]
 filterSourceRows: ScheduleManageRow[]
 alerts: Map<string, ScheduleAlerts>
 loading: boolean
 rosterLoading: boolean
 updating: boolean
 emptyHint: string
 sortKey: ScheduleListColumnId
 sortDir: SortDir
 onToggleSort: (key: ScheduleListColumnId) => void
 headerFilters: ScheduleListHeaderFilters
 onHeaderFilterChange: (key: ScheduleListColumnId, value: string) => void
 todayYmd: string
 teacherScopeId: string | null
 canManageSchedules: boolean
 previewId: string | null
 highlightScheduleId: string | null
 expandedScheduleId: string | null
 onToggleExpand: (id: string) => void
 onOpenRecord: (id: string) => void
 renderRowActions: (schedule: ScheduleManageRow) => ReactNode
 renderStatusControl: (schedule: ScheduleManageRow) => ReactNode
 renderExpanded: (schedule: ScheduleManageRow) => ReactNode
}

export function ScheduleListTable({
 rows,
 filterSourceRows,
 alerts,
 loading,
 rosterLoading,
 updating,
 emptyHint,
 sortKey,
 sortDir,
 onToggleSort,
 headerFilters,
 onHeaderFilterChange,
 todayYmd,
 teacherScopeId,
 canManageSchedules,
 previewId,
 highlightScheduleId,
 expandedScheduleId,
 onToggleExpand,
 onOpenRecord,
 renderRowActions,
 renderStatusControl,
 renderExpanded,
}: Props) {
 const colSpan = SCHEDULE_LIST_DATA_COLUMNS.length + 1

 const onRowKey = (e: KeyboardEvent, id: string) => {
  if (e.key === "Enter" || e.key === " ") {
   e.preventDefault()
   onOpenRecord(id)
  }
 }

 return (
  <div className="space-y-2">
   {updating ? (
    <p className="text-sm text-muted-foreground" role="status">
     正在更新
    </p>
   ) : null}
   <div className={stickyTableWrapClass}>
    <table className="w-full min-w-0 table-fixed border-separate border-spacing-0 text-sm isolate">
     <thead className={stickyTableHeadClass}>
      <tr className={stickyTableHeadRowClass}>
       {SCHEDULE_LIST_DATA_COLUMNS.map((id) => (
        <th
         key={id}
         className={cn(
          stickyTableHeadCellClass,
          "min-w-0 whitespace-nowrap py-3 font-medium text-muted-foreground px-3 pr-2",
          id === "date" && "w-[11%]",
          id === "class" && "w-[22%]",
          id === "time" && "w-[11%]",
          id === "teacher" && "w-[12%]",
          id === "room" && "w-[12%]",
          id === "status" && "w-[12%]",
          id === "enroll" && "w-[8%] text-center"
         )}
        >
         <SortableColumnHeader
          label={SCHEDULE_LIST_COLUMN_LABEL[id]}
          active={sortKey === id}
          dir={sortDir}
          onToggle={() => onToggleSort(id)}
          className={id === "enroll" ? "justify-center" : undefined}
         >
          <HeaderFilterButton
           columnLabel={SCHEDULE_LIST_COLUMN_LABEL[id]}
           value={headerFilters[id]}
           onChange={(next) => onHeaderFilterChange(id, next)}
           mode={isPresetScheduleHeaderFilterColumn(id) ? "preset" : "text"}
           options={
            isPresetScheduleHeaderFilterColumn(id)
             ? SCHEDULE_STATUS_HEADER_FILTER_OPTIONS
             : uniqueScheduleHeaderFilterValues(
                id,
                rowsMatchingScheduleHeaderFiltersExcept(filterSourceRows, headerFilters, id)
               ).map((value) => ({ value, label: value }))
           }
          />
         </SortableColumnHeader>
        </th>
       ))}
       <th className={cn(stickyTableHeadCellClass, "w-[12%] px-3 py-3 font-medium text-muted-foreground")}>
        操作
       </th>
      </tr>
     </thead>
     <StaggerList as="tbody" className={stickyTableBodyClass} animate={!loading}>
      {loading && rows.length === 0 ? (
       <SkeletonTableRows columns={colSpan} rows={6} />
      ) : rows.length === 0 ? (
       <tr>
        <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-muted-foreground">
         {emptyHint}
        </td>
       </tr>
      ) : (
       rows.map((s) => {
        const a = alerts.get(s.id) ?? { trial: false, makeup: false, leave: false, record: false }
        const open = expandedScheduleId === s.id
        const occupancy = isHomeworkOccupancySchedule(s)
        const selected = previewId === s.id || highlightScheduleId === s.id
        return (
         <Fragment key={s.id}>
          <StaggerItem
           as="tr"
           data-schedule-anchor={s.id}
           tabIndex={0}
           className={cn(rowInteractive, "border-b border-border", selected && "bg-info/30")}
           onClick={() => onOpenRecord(s.id)}
           onKeyDown={(e: KeyboardEvent<HTMLTableRowElement>) => onRowKey(e, s.id)}
          >
           <td className="min-w-0 align-top px-3 py-3 tabular-nums">
            <div className="flex flex-wrap items-center gap-1.5">
             {s.scheduled_date}
             {s.scheduled_date === todayYmd ? (
              <span className="rounded bg-amber-200 px-1.5 text-xs font-medium text-amber-950">今天</span>
             ) : null}
             {rosterLoading ? (
              <SkeletonInlineBadge className="h-4 w-12" aria-label="標記載入中" />
             ) : (
              <ScheduleAlertIcons alerts={a} />
             )}
            </div>
           </td>
           <td className="min-w-0 align-top px-3 py-3 font-medium">
            <span className="block break-words">{s.classLabel}</span>
            {s.course_code_full ? (
             <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
              ({s.course_code_full})
             </span>
            ) : null}
            {occupancy ? (
             <Tag tone={statusToTagTone("佔室")} size="sm" className="mt-1">
              佔室
             </Tag>
            ) : null}
           </td>
           <td className="min-w-0 align-top px-3 py-3 tabular-nums text-muted-foreground">
            {s.start_time ?? "—"}–{s.end_time ?? "—"}
           </td>
           <td className="min-w-0 align-top px-3 py-3">
            <span
             className={cn(
              "block break-words",
              canManageSchedules && isUnassignedTeachingTeacherIssue(s) && "font-medium text-warning"
             )}
            >
             {scheduleTeacherDisplayName(s, { warnIfUnassigned: canManageSchedules })}
            </span>
            {(() => {
             const subTag = formatScheduleSubstituteTag(s, teacherScopeId)
             return subTag ? (
              <Tag tone={statusToTagTone(subTag)} size="sm" className="mt-1">
               {subTag}
              </Tag>
             ) : null
            })()}
           </td>
           <td className="min-w-0 align-top px-3 py-3 text-muted-foreground">
            <span className="block break-words">{s.classroom_name ?? "—"}</span>
           </td>
           <td className="align-top px-3 py-3" onClick={(e) => e.stopPropagation()}>
            {renderStatusControl(s)}
           </td>
           <td className="align-top px-3 py-3 text-center tabular-nums">
            {occupancy ? (
             "—"
            ) : rosterLoading || s.enrollCount == null ? (
             <SkeletonInlineBadge className="mx-auto h-4 w-8" aria-label="點名冊人數載入中" />
            ) : (
             s.enrollCount
            )}
           </td>
           <td className="min-w-0 align-top px-3 py-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-wrap items-center gap-2">
             {renderRowActions(s)}
             <button
              type="button"
              className="text-sm font-medium text-info hover:underline"
              aria-expanded={open}
              onClick={() => onToggleExpand(s.id)}
             >
              {open ? "收合名單" : "展開名單"}
             </button>
            </div>
           </td>
          </StaggerItem>
          {open ? (
           <tr className="border-b border-border bg-success/30">
            <td colSpan={colSpan} className="px-4 py-4">
             {renderExpanded(s)}
            </td>
           </tr>
          ) : null}
         </Fragment>
        )
       })
      )}
     </StaggerList>
    </table>
   </div>
  </div>
 )
}
