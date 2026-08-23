import { useEffect, useId, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ArrowDown, ArrowUp, ArrowUpDown, Check, ListFilter, MessageCircle } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
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
         <div className="flex min-w-0 items-center gap-0.5">
          <button
           type="button"
           className="inline-flex min-w-0 items-center gap-1 hover:text-foreground"
           onClick={() => onToggleSort(id)}
          >
           <span className="truncate">{STUDENT_LIST_COLUMN_LABEL[id]}</span>
           {sortKey === id ? (
            sortDir === "asc" ? (
             <ArrowUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
            ) : (
             <ArrowDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
            )
           ) : (
            <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden />
           )}
          </button>
          <HeaderFilterButton
           column={id}
           value={headerFilters[id]}
           onChange={(v) => onHeaderFilterChange(id, v)}
           sourceRows={filterSourceRows}
           headerFilters={headerFilters}
           tags={tags}
          />
         </div>
        </th>
       ))}
       <th className="w-28 px-3 py-2 font-medium text-muted-foreground">操作</th>
      </tr>
     </thead>
     <tbody>
      {loading ? (
       <tr>
        <td colSpan={colSpan} className="px-3 py-8 text-center text-muted-foreground">
         載入中…
        </td>
       </tr>
      ) : rows.length === 0 ? (
       <tr>
        <td colSpan={colSpan} className="px-3 py-8 text-center text-muted-foreground">
         {emptyHint}
        </td>
       </tr>
      ) : (
       rows.map((r, idx) => {
        const messaging = resolvePrimaryMessagingTarget(r)
        const checked = selectedSet.has(r.id)
        return (
         <tr
          key={r.id}
          onClick={() => onNavigate(r.id)}
          className={cn(
           "cursor-pointer border-b border-border transition-colors hover:bg-muted/60",
           idx % 2 === 1 ? "bg-muted/20" : "",
           checked ? "bg-info/10" : ""
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
         </tr>
        )
       })
      )}
     </tbody>
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

function HeaderFilterButton({
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
 const [open, setOpen] = useState(false)
 const [optionQuery, setOptionQuery] = useState("")
 const [placement, setPlacement] = useState({ left: 0, top: 0, width: 240, maxHeight: 320 })
 const triggerRef = useRef<HTMLButtonElement>(null)
 const panelRef = useRef<HTMLDivElement>(null)
 const searchRef = useRef<HTMLInputElement>(null)
 const listId = useId()
 const preset = isPresetHeaderFilterColumn(column)
 const active = Boolean(value.trim())
 const label = STUDENT_LIST_COLUMN_LABEL[column]

 const uniqueValues = useMemo(() => {
  if (!open || preset) return []
  const subset = rowsMatchingHeaderFiltersExcept(sourceRows, headerFilters, column, tags)
  return uniqueHeaderFilterValues(column, subset, tags)
 }, [open, preset, sourceRows, headerFilters, column, tags])

 const presetOptions = useMemo(() => headerFilterOptions(column), [column])

 const visibleOptions = useMemo(() => {
  if (preset) {
   const q = optionQuery.trim().toLowerCase()
   if (!q) return presetOptions
   return presetOptions.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
  }
  const q = value.trim().toLowerCase()
  if (!q) return uniqueValues.map((v) => ({ value: v, label: v }))
  return uniqueValues
   .filter((v) => v.toLowerCase().includes(q))
   .map((v) => ({ value: v, label: v }))
 }, [preset, presetOptions, optionQuery, uniqueValues, value])

 const computePlacement = () => {
  const trigger = triggerRef.current
  if (!trigger) return
  const r = trigger.getBoundingClientRect()
  const gap = 6
  const width = Math.min(Math.max(240, r.width), Math.max(220, window.innerWidth - 16))
  let left = r.left
  if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - width - 8)
  if (left < 8) left = 8
  const maxHeight = Math.min(320, Math.max(200, window.innerHeight * 0.5))
  let top = r.bottom + gap
  if (top + Math.min(maxHeight, 220) > window.innerHeight - 8) {
   top = Math.max(8, r.top - maxHeight - gap)
  }
  setPlacement({ left, top, width, maxHeight })
 }

 useEffect(() => {
  if (!open) return
  computePlacement()
  setOptionQuery("")
  const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 0)
  const onResize = () => computePlacement()
  const onScroll = () => computePlacement()
  const onDocMouseDown = (event: MouseEvent) => {
   const target = event.target as Node
   if (triggerRef.current?.contains(target)) return
   if (panelRef.current?.contains(target)) return
   setOpen(false)
  }
  const onKeyDown = (event: KeyboardEvent) => {
   if (event.key === "Escape") setOpen(false)
  }
  window.addEventListener("resize", onResize)
  window.addEventListener("scroll", onScroll, true)
  document.addEventListener("mousedown", onDocMouseDown)
  document.addEventListener("keydown", onKeyDown)
  return () => {
   window.clearTimeout(focusTimer)
   window.removeEventListener("resize", onResize)
   window.removeEventListener("scroll", onScroll, true)
   document.removeEventListener("mousedown", onDocMouseDown)
   document.removeEventListener("keydown", onKeyDown)
  }
 }, [open])

 const selectValue = (next: string) => {
  onChange(next)
  setOpen(false)
 }

 const panel =
  open && typeof document !== "undefined"
   ? createPortal(
      <div
       ref={panelRef}
       data-mgmt-header-filter-panel=""
       className="fixed z-[320] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl"
       style={{
        left: placement.left,
        top: placement.top,
        width: placement.width,
        maxHeight: placement.maxHeight,
       }}
      >
       <div className="border-b border-border/80 p-2">
        <Input
         ref={searchRef}
         className="h-8 text-xs"
         value={preset ? optionQuery : value}
         placeholder={preset ? "搜尋選項…" : "包含…"}
         aria-label={preset ? `搜尋${label}選項` : `篩選${label}`}
         onChange={(e) => {
          if (preset) setOptionQuery(e.target.value)
          else onChange(e.target.value)
         }}
         onKeyDown={(e) => {
          if (e.key === "Enter") {
           e.preventDefault()
           if (!preset) setOpen(false)
          }
         }}
        />
       </div>
       <div className="overflow-y-auto p-1" style={{ maxHeight: placement.maxHeight - 52 }} role="listbox" id={listId}>
        <button
         type="button"
         role="option"
         aria-selected={!active}
         onClick={() => selectValue("")}
         className={cn(
          "relative flex w-full cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-3 text-left text-xs outline-none",
          !active ? "bg-muted text-foreground" : "hover:bg-muted/70"
         )}
        >
         <span
          className={cn(
           "absolute left-2 inline-flex h-4 w-4 items-center justify-center",
           !active ? "text-foreground" : "text-transparent"
          )}
          aria-hidden
         >
          <Check className="h-3.5 w-3.5" />
         </span>
         全部
        </button>
        {visibleOptions.length === 0 ? (
         <p className="px-3 py-2 text-xs text-muted-foreground">沒有符合的選項</p>
        ) : (
         visibleOptions.map((opt) => {
          const selected = opt.value === value
          if (preset && opt.value === "") return null
          return (
           <button
            key={opt.value || "__empty__"}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => selectValue(opt.value)}
            className={cn(
             "relative flex w-full cursor-default select-none items-start rounded-md py-1.5 pl-8 pr-3 text-left text-xs outline-none",
             selected ? "bg-muted text-foreground" : "hover:bg-muted/70"
            )}
           >
            <span
             className={cn(
              "absolute left-2 top-1.5 inline-flex h-4 w-4 items-center justify-center",
              selected ? "text-foreground" : "text-transparent"
             )}
             aria-hidden
            >
             <Check className="h-3.5 w-3.5" />
            </span>
            <span className="whitespace-normal break-words">{opt.label}</span>
           </button>
          )
         })
        )}
       </div>
      </div>,
      document.body
     )
   : null

 return (
  <>
   <button
    ref={triggerRef}
    type="button"
    aria-label={`篩選${label}`}
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-controls={open ? listId : undefined}
    title={active ? `${label}：${preset ? presetOptions.find((o) => o.value === value)?.label ?? value : value}` : `篩選${label}`}
    onClick={(e) => {
     e.preventDefault()
     e.stopPropagation()
     setOpen((v) => !v)
    }}
    className={cn(
     "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-muted hover:text-foreground",
     active ? "text-primary" : "text-muted-foreground/50"
    )}
   >
    <ListFilter className="h-3.5 w-3.5" aria-hidden />
   </button>
   {panel}
  </>
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
