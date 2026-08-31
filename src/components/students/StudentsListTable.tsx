import { useMemo } from "react"
import { MessageCircle } from "lucide-react"
import { Link } from "react-router-dom"

import { HeaderFilterButton } from "@/components/list/HeaderFilterButton"
import { SortableColumnHeader } from "@/components/list/SortableColumnHeader"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { SkeletonTableRows } from "@/components/ui/skeleton"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { Tag } from "@/components/ui/tag"
import { formatStudentGrade, StudentClassificationTags } from "@/components/students/studentsUi"
import { GRADE_FILTERS } from "@/components/students/studentsListFilters"
import {
 formatStudentCreatedAt,
 isPresetHeaderFilterColumn,
 rowsMatchingHeaderFiltersExcept,
 STATUS_HEADER_FILTERS,
 STUDENT_LIST_COLUMN_LABEL,
 STUDENT_LIST_DATA_COLUMNS,
 uniqueHeaderFilterValues,
 type StudentListColumnId,
 type StudentListHeaderFilters,
} from "@/components/students/studentsListColumns"
import { cn } from "@/lib/utils"
import {
 openPrimaryMessagingTarget,
 resolvePrimaryMessagingTarget,
 type PrimaryMessagingTarget,
} from "@/lib/whatsappReminder"
import type { StudentRecord } from "@/services/studentQueries"

type Props = {
 rows: StudentRecord[]
 filterSourceRows: StudentRecord[]
 tags: Map<string, string[]>
 loading: boolean
 emptyHint: string
 visible: Record<StudentListColumnId, boolean>
 sortKey: StudentListColumnId
 sortDir: "asc" | "desc"
 onToggleSort: (key: StudentListColumnId) => void
 headerFilters: StudentListHeaderFilters
 onHeaderFilterChange: (key: StudentListColumnId, value: string) => void
 selectedIds: string[]
 onToggleSelect: (id: string) => void
 onToggleSelectAll: () => void
 canDeleteStudent: boolean
 onDelete: (e: React.MouseEvent, id: string) => void
 onNavigate: (id: string) => void
 onWeChatCopied: (wechatId: string) => void
 /** 右側預覽中的學生，列高亮 */
 previewId?: string | null
}

export function StudentsListTable({
 rows,
 filterSourceRows,
 tags,
 loading,
 emptyHint,
 visible,
 sortKey,
 sortDir,
 onToggleSort,
 headerFilters,
 onHeaderFilterChange,
 selectedIds,
 onToggleSelect,
 onToggleSelectAll,
 canDeleteStudent,
 onDelete,
 onNavigate,
 onWeChatCopied,
 previewId = null,
}: Props) {
 const selectedSet = new Set(selectedIds)
 const allSelected = rows.length > 0 && rows.every((r) => selectedSet.has(r.id))
 const someSelected = rows.some((r) => selectedSet.has(r.id)) && !allSelected
 const visibleIds = STUDENT_LIST_DATA_COLUMNS.filter((id) => visible[id])
 const colSpan = 1 + visibleIds.length + 1

 return (
  <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
   <div className="overflow-x-auto">
    <table className="w-full min-w-[48rem] border-collapse text-sm">
     <thead>
      <tr className="border-b border-border bg-muted/50 text-left">
       <th className="w-10 px-3 py-2">
        <Checkbox
         checked={allSelected}
         indeterminate={someSelected}
         onCheckedChange={() => onToggleSelectAll()}
         aria-label="全選目前列表"
        />
       </th>
       {visibleIds.map((id) => (
        <th key={id} className="px-3 py-2 font-medium text-muted-foreground">
         <SortableColumnHeader
          label={STUDENT_LIST_COLUMN_LABEL[id]}
          active={sortKey === id}
          dir={sortDir}
          onToggle={() => onToggleSort(id)}
         >
          <StudentHeaderFilter
           column={id}
           value={headerFilters[id]}
           onChange={(v) => onHeaderFilterChange(id, v)}
           sourceRows={filterSourceRows}
           headerFilters={headerFilters}
           tags={tags}
          />
         </SortableColumnHeader>
        </th>
       ))}
       <th className="w-28 px-3 py-2 font-medium text-muted-foreground">操作</th>
      </tr>
     </thead>
     {loading ? (
      <tbody>
       <tr>
        <td colSpan={colSpan} className="px-3 py-4">
         <SkeletonTableRows rows={8} columns={Math.min(colSpan, 8)} />
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
      <StaggerList as="tbody">
       {rows.map((r, idx) => {
        const messaging = resolvePrimaryMessagingTarget(r)
        const checked = selectedSet.has(r.id)
        return (
         <StaggerItem
          key={r.id}
          as="tr"
          onClick={() => onNavigate(r.id)}
          className={cn(
           "cursor-pointer border-b border-border transition-colors hover:bg-muted/60",
           idx % 2 === 1 ? "bg-muted/20" : "",
           checked ? "bg-info/10" : "",
           previewId === r.id ? "bg-info/15" : ""
          )}
         >
          <td className="px-3 py-3 align-top" onClick={(e) => e.stopPropagation()}>
           <Checkbox
            checked={checked}
            onCheckedChange={() => onToggleSelect(r.id)}
            aria-label={`選取 ${r.full_name}`}
           />
          </td>
          {visibleIds.map((id) => (
           <td key={id} className="min-w-0 align-top px-3 py-3">
            <StudentCell
             column={id}
             row={r}
             tags={tags.get(r.id) ?? []}
             messaging={messaging}
             onWeChatCopied={onWeChatCopied}
            />
           </td>
          ))}
          <td className="align-top px-3 py-3">
           <Link
            to={`/Students/${r.id}`}
            className="text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
           >
            編輯
           </Link>
           {canDeleteStudent ? (
            <>
             <span className="mx-2 text-muted-foreground">|</span>
             <button
              type="button"
              className="text-amber-700 hover:underline"
              onClick={(e) => void onDelete(e, r.id)}
             >
              刪除
             </button>
            </>
           ) : null}
          </td>
         </StaggerItem>
        )
       })}
      </StaggerList>
     )}
    </table>
   </div>
  </div>
 )
}

function headerFilterOptions(column: StudentListColumnId): { value: string; label: string }[] {
 if (column === "grade") {
  return GRADE_FILTERS.map((g) => ({
   value: g.key === "all" ? "" : g.key,
   label: g.label,
  }))
 }
 if (column === "status") {
  return STATUS_HEADER_FILTERS.map((g) => ({ value: g.key, label: g.label }))
 }
 return []
}

function StudentHeaderFilter({
 column,
 value,
 onChange,
 sourceRows,
 headerFilters,
 tags,
}: {
 column: StudentListColumnId
 value: string
 onChange: (next: string) => void
 sourceRows: StudentRecord[]
 headerFilters: StudentListHeaderFilters
 tags: Map<string, string[]>
}) {
 const preset = isPresetHeaderFilterColumn(column)
 const options = useMemo(() => {
  if (preset) return headerFilterOptions(column)
  const subset = rowsMatchingHeaderFiltersExcept(sourceRows, headerFilters, column, tags)
  return uniqueHeaderFilterValues(column, subset, tags).map((v) => ({ value: v, label: v }))
 }, [preset, column, sourceRows, headerFilters, tags])

 return (
  <HeaderFilterButton
   columnLabel={STUDENT_LIST_COLUMN_LABEL[column]}
   value={value}
   onChange={onChange}
   mode={preset ? "preset" : "text"}
   options={options}
  />
 )
}

function StudentCell({
 column,
 row,
 tags,
 messaging,
 onWeChatCopied,
}: {
 column: StudentListColumnId
 row: StudentRecord
 tags: string[]
 messaging: PrimaryMessagingTarget | null
 onWeChatCopied: (wechatId: string) => void
}) {
 if (column === "student_code") {
  return (
   <span className="block truncate tabular-nums text-muted-foreground" title={row.student_code ?? undefined}>
    {row.student_code || "—"}
   </span>
  )
 }
 if (column === "name") {
  return (
   <>
    <div className="break-words font-medium text-foreground">{row.full_name}</div>
    {row.english_name ? (
     <div className="break-words text-xs text-muted-foreground">{row.english_name}</div>
    ) : null}
   </>
  )
 }
 if (column === "grade") return <>{formatStudentGrade(row.grade)}</>
 if (column === "school") return <span className="break-words">{row.school || "—"}</span>
 if (column === "student_phone") {
  return (
   <span className="min-w-0 truncate tabular-nums" title={row.student_phone ?? undefined}>
    {row.student_phone ?? "—"}
   </span>
  )
 }
 if (column === "parent_phone") {
  const canMessage =
   messaging?.channel === "WeChat"
    ? Boolean(messaging.wechatId?.trim())
    : Boolean(messaging?.phone?.trim())
  return (
   <div className="flex min-w-0 items-center gap-1.5">
    <span className="min-w-0 truncate tabular-nums" title={row.parent_phone ?? undefined}>
     {row.parent_phone ?? "—"}
    </span>
    {canMessage && messaging ? (
     <MessageButton messaging={messaging} onWeChatCopied={onWeChatCopied} />
    ) : null}
   </div>
  )
 }
 if (column === "subjects") {
  return (
   <div className="flex flex-wrap gap-1 break-words">
    {tags.map((sub) => (
     <Tag key={sub} tone="info" size="sm">
      {sub}
     </Tag>
    ))}
    {tags.length === 0 ? <span className="text-xs text-muted-foreground">—</span> : null}
   </div>
  )
 }
 if (column === "status") {
  return <StudentClassificationTags student={row} size="sm" compact />
 }
 return <span className="tabular-nums text-muted-foreground">{formatStudentCreatedAt(row.created_at)}</span>
}

function MessageButton({
 messaging,
 onWeChatCopied,
}: {
 messaging: PrimaryMessagingTarget
 onWeChatCopied: (wechatId: string) => void
}) {
 return (
  <Button
   type="button"
   variant="ghost"
   size="icon"
   className={cn(
    "h-8 w-8 shrink-0",
    messaging.channel === "WeChat"
     ? "text-sky-700 hover:bg-sky-600 hover:text-white"
     : "text-success hover:bg-success hover:text-success-foreground"
   )}
   title={
    messaging.channel === "WeChat"
     ? `複製第一聯絡人（${messaging.person}）WeChat ID`
     : `以 WhatsApp 聯絡第一聯絡人（${messaging.person}）`
   }
   aria-label={messaging.channel === "WeChat" ? "複製 WeChat ID" : "開啟 WhatsApp"}
   onClick={(e) => {
    e.preventDefault()
    e.stopPropagation()
    void openPrimaryMessagingTarget(messaging).then((result) => {
     if (result === "wechat") onWeChatCopied(messaging.wechatId ?? "")
    })
   }}
  >
   <MessageCircle className="h-4 w-4" aria-hidden />
  </Button>
 )
}
