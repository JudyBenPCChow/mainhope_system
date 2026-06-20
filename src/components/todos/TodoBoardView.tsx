import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { usePersistentState } from "@/hooks/usePersistentState"
import { ChevronDown, ChevronUp, KanbanSquare, List, Pencil, Plus, Search, Trash2, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tag } from "@/components/ui/tag"
import { useAppConfirm } from "@/lib/appConfirm"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { getMgmtRole } from "@/lib/mgmtRole"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import { cn } from "@/lib/utils"
import {
 deleteCalendarEvent,
 fetchCalendarParticipantOptions,
 insertCalendarEvent,
 listCalendarEventsInRange,
 updateCalendarEvent,
 type CalendarEventRow,
 type CalendarEventStatus,
} from "@/services/calendarQueries"

import {
 emptyTodoFormValues,
 TodoFormDialog,
 todoFormFromEvent,
 type TodoFormValues,
} from "./TodoFormDialog"
import { TODO_TAG_PRESETS, todoStatusLabel, todoStatusTone, TodoTagList } from "./todoUi"

type ViewMode = "table" | "kanban"

function localYmd(d = new Date()): string {
 const y = d.getFullYear()
 const m = String(d.getMonth() + 1).padStart(2, "0")
 const day = String(d.getDate()).padStart(2, "0")
 return `${y}-${m}-${day}`
}

function addDaysYmd(ymd: string, days: number): string {
 const [y, mo, da] = ymd.split("-").map(Number)
 const dt = new Date(y, mo - 1, da)
 dt.setDate(dt.getDate() + days)
 return localYmd(dt)
}

function formatUpdateTime(iso: string | null): string {
 if (!iso) return "—"
 const d = new Date(iso)
 if (Number.isNaN(d.getTime())) return iso.slice(0, 16)
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

export function TodoBoardView() {
 const navigate = useNavigate()
 const { confirmDialog } = useAppConfirm()
 const role = getMgmtRole()
 const isTeacher = role === "teacher"
 const canEdit = role === "admin" || role === "alien"
 const teacherId = isTeacher ? getTeacherScopeTeacherId() : null

 const [viewMode, setViewMode] = usePersistentState<ViewMode>("mgmt_todos_viewMode", "table")
 const [searchText, setSearchText] = usePersistentState<string>("mgmt_todos_searchText", "")
 const [dateFrom, setDateFrom] = usePersistentState<string>(
  "mgmt_todos_dateFrom",
  addDaysYmd(localYmd(), -30)
 )
 const [dateTo, setDateTo] = usePersistentState<string>("mgmt_todos_dateTo", addDaysYmd(localYmd(), 60))
 const [tagFilter, setTagFilter] = usePersistentState<string[]>("mgmt_todos_tagFilter", [])
 const [rows, setRows] = useState<CalendarEventRow[]>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)

 const [formOpen, setFormOpen] = useState(false)
 const [editing, setEditing] = useState<CalendarEventRow | null>(null)
 const [formInitial, setFormInitial] = useState<TodoFormValues>(emptyTodoFormValues())
 const [saving, setSaving] = useState(false)
 const [participantLabels, setParticipantLabels] = useState<{
  teachers: Map<string, string>
  students: Map<string, string>
 }>({ teachers: new Map(), students: new Map() })
 const [expandedKanbanIds, setExpandedKanbanIds] = useState<Set<string>>(() => new Set())

 const load = useCallback(async () => {
  if (!isSupabaseConfigured) {
   setRows([])
   setLoading(false)
   return
  }
  setLoading(true)
  setErr(null)
  try {
   const events = await listCalendarEventsInRange(dateFrom, dateTo, {
     teacherId,
     tags: tagFilter.length > 0 ? tagFilter : undefined,
    })
   const studentIds = [...new Set(events.flatMap((e) => e.studentIds))]
   const p = await fetchCalendarParticipantOptions(studentIds)
   setRows(events)
   setParticipantLabels({
    teachers: new Map(p.teachers.map((t) => [t.id, t.label])),
    students: new Map(p.students.map((s) => [s.id, s.label])),
   })
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, { source: "TodoBoardView.load", setErr, userMessage: msg })
   setRows([])
  } finally {
   setLoading(false)
  }
 }, [dateFrom, dateTo, teacherId, tagFilter])

 useEffect(() => {
  void load()
 }, [load])

 const filteredRows = useMemo(() => {
  const q = searchText.trim().toLowerCase()
  if (!q) return rows
  return rows.filter((r) => {
   const hay = `${r.title} ${r.category} ${r.tags.join(" ")} ${r.latestUpdatePreview ?? ""}`.toLowerCase()
   return hay.includes(q)
  })
 }, [rows, searchText])

 const kanbanGroups = useMemo(() => {
  const grouped: Record<CalendarEventStatus, CalendarEventRow[]> = {
   in_progress: [],
   done: [],
  }
  for (const r of filteredRows) grouped[r.status].push(r)
  return grouped
 }, [filteredRows])

 const categories = useMemo(() => {
  const set = new Set<string>(["一般"])
  for (const r of rows) if (r.category.trim()) set.add(r.category.trim())
  return [...set]
 }, [rows])

 const allTags = useMemo(() => {
  const set = new Set<string>([...TODO_TAG_PRESETS])
  for (const r of rows) for (const t of r.tags) set.add(t)
  return [...set]
 }, [rows])

 const teacherLabel = (id: string) => participantLabels.teachers.get(id) ?? `${id.slice(0, 8)}…`
 const studentLabel = (id: string) => participantLabels.students.get(id) ?? `${id.slice(0, 8)}…`

 const openCreate = () => {
  if (!canEdit) return
  setEditing(null)
  setFormInitial(emptyTodoFormValues())
  setFormOpen(true)
 }

 const openEdit = (r: CalendarEventRow, e: React.MouseEvent) => {
  e.stopPropagation()
  if (!canEdit) return
  setEditing(r)
  setFormInitial(todoFormFromEvent(r))
  setFormOpen(true)
 }

 const openDetail = (r: CalendarEventRow) => {
  navigate(`/Calendar/${r.id}`)
 }

 const toggleTagFilter = (tag: string) => {
  setTagFilter((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
 }

 const submitForm = async (values: TodoFormValues) => {
  setSaving(true)
  try {
   const payload = {
    title: values.title,
    category: values.category,
    eventDate: values.eventDate,
    status: values.status,
    visibility: values.visibility,
    allDay: true,
    startTime: null,
    endTime: null,
    teacherIds: values.teacherIds,
    studentIds: values.studentIds,
    tags: values.tags,
   } as const
   if (editing) {
    await updateCalendarEvent(editing.id, payload)
    setFormOpen(false)
    await load()
   } else {
    const created = await insertCalendarEvent(payload)
    setFormOpen(false)
    navigate(`/Calendar/${created.id}`)
   }
  } finally {
   setSaving(false)
  }
 }

 const removeEvent = async (r: CalendarEventRow, e: React.MouseEvent) => {
  e.stopPropagation()
  if (!canEdit) return
  const ok = await confirmDialog({
   title: "刪除待辦",
   description: `確定刪除「${r.title}」？此操作無法復原。`,
   confirmText: "刪除",
   tone: "destructive",
  })
  if (!ok) return
  try {
   await deleteCalendarEvent(r.id)
   await load()
  } catch (err) {
   const msg = formatUnknownError(err)
   reportUserFacingError(err, { source: "TodoBoardView.removeEvent", setErr, userMessage: msg })
  }
 }

 return (
  <div className="space-y-6 p-4 md:p-6">
   <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border/80 pb-5">
    <div>
     <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
      <List className="h-8 w-8 text-primary" />
      待辦事項
     </h1>
     <p className="text-sm text-muted-foreground">點擊項目進入詳情；可標籤分類、記錄跟進時間軸，並關聯老師與學生。</p>
    </div>
    {canEdit ? (
     <Button type="button" onClick={openCreate}>
      <Plus className="mr-1.5 h-4 w-4" />
      新增待辦
     </Button>
    ) : null}
   </header>

   {err ? (
    <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
     {err}
    </div>
   ) : null}

   <div className="flex flex-wrap items-center gap-2">
    <div className="inline-flex rounded-md border border-border bg-muted/30 p-0.5 text-sm">
     <button
      type="button"
      onClick={() => setViewMode("table")}
      className={cn("rounded px-3 py-1.5", viewMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
     >
      <span className="inline-flex items-center gap-1">
       <List className="h-4 w-4" />
       Table
      </span>
     </button>
     <button
      type="button"
      onClick={() => setViewMode("kanban")}
      className={cn("rounded px-3 py-1.5", viewMode === "kanban" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
     >
      <span className="inline-flex items-center gap-1">
       <KanbanSquare className="h-4 w-4" />
       Kanban
      </span>
     </button>
    </div>
    <label className="relative min-w-[220px] flex-1 sm:max-w-xs">
     <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
     <Input
      className="pl-8"
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
      placeholder="搜尋標題/分類/標籤/跟進"
     />
    </label>
    <Input type="date" className="w-[170px]" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
    <Input type="date" className="w-[170px]" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
   </div>

   {allTags.length > 0 ? (
    <div className="flex flex-wrap items-center gap-2">
     <span className="text-xs font-medium text-muted-foreground">標籤篩選：</span>
     {allTags.map((tag) => {
      const active = tagFilter.includes(tag)
      return (
       <button
        key={tag}
        type="button"
        onClick={() => toggleTagFilter(tag)}
        className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors", active && "ring-2 ring-primary/40")}
       >
        <Tag tone={active ? "info" : "default"} size="sm">
         {tag}
        </Tag>
       </button>
      )
     })}
     {tagFilter.length > 0 ? (
      <button type="button" className="text-xs text-muted-foreground underline" onClick={() => setTagFilter([])}>
       清除篩選
      </button>
     ) : null}
    </div>
   ) : null}

   {loading ? <p className="text-sm text-muted-foreground">載入中…</p> : null}

   {!loading && viewMode === "table" ? (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
     <table className="w-full min-w-[1100px] table-fixed text-sm">
      <thead className="bg-muted/30 text-xs text-muted-foreground">
       <tr>
        <th className="w-[100px] px-3 py-2 text-left">日期</th>
        <th className="w-[180px] px-3 py-2 text-left">標題</th>
        <th className="w-[140px] px-3 py-2 text-left">標籤</th>
        <th className="w-[90px] px-3 py-2 text-left">分類</th>
        <th className="w-[90px] px-3 py-2 text-left">狀態</th>
        <th className="w-[160px] px-3 py-2 text-left">最後跟進</th>
        <th className="px-3 py-2 text-left">跟進摘要</th>
        <th className="w-[180px] px-3 py-2 text-left">涉及對象</th>
        {canEdit ? <th className="w-[90px] px-3 py-2 text-left">操作</th> : null}
       </tr>
      </thead>
      <tbody>
       {filteredRows.length === 0 ? (
        <tr>
         <td colSpan={canEdit ? 9 : 8} className="px-4 py-8 text-center text-muted-foreground">
          暫無資料。
         </td>
        </tr>
       ) : (
        filteredRows.map((r) => (
         <tr
          key={r.id}
          className="cursor-pointer border-t border-border/70 align-top transition-colors hover:bg-muted/30"
          onClick={() => openDetail(r)}
         >
          <td className="px-3 py-2 font-mono text-xs">{r.eventDate}</td>
          <td className="px-3 py-2 font-medium">{r.title}</td>
          <td className="px-3 py-2">
           <TodoTagList tags={r.tags} />
          </td>
          <td className="px-3 py-2">
           <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs">{r.category || "一般"}</span>
          </td>
          <td className="px-3 py-2">
           <Tag tone={todoStatusTone(r.status)} size="sm">
            {todoStatusLabel(r.status)}
           </Tag>
          </td>
          <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{formatUpdateTime(r.latestUpdateAt)}</td>
          <td className="min-w-0 px-3 py-2 text-muted-foreground">
           <span className="line-clamp-2">{r.latestUpdatePreview?.trim() || "—"}</span>
          </td>
          <td className="px-3 py-2 text-xs text-muted-foreground">
           師：{r.teacherIds.map(teacherLabel).join("、") || "—"}
           <br />
           生：{r.studentIds.map(studentLabel).join("、") || "—"}
          </td>
          {canEdit ? (
           <td className="px-3 py-2">
            <div className="flex gap-1">
             <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => openEdit(r, e)}>
              <Pencil className="h-3.5 w-3.5" />
             </Button>
             <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={(e) => void removeEvent(r, e)}
             >
              <Trash2 className="h-3.5 w-3.5" />
             </Button>
            </div>
           </td>
          ) : null}
         </tr>
        ))
       )}
      </tbody>
     </table>
    </div>
   ) : null}

   {!loading && viewMode === "kanban" ? (
    <div className="grid gap-4 md:grid-cols-2">
     {(["in_progress", "done"] as CalendarEventStatus[]).map((status) => (
      <section key={status} className="rounded-xl border border-border bg-card p-3 shadow-sm">
       <header className="mb-2 flex flex-col items-center gap-1 text-center">
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
         {todoStatusLabel(status)}
        </h3>
        <Tag tone={todoStatusTone(status)} size="sm">
         {kanbanGroups[status].length}
        </Tag>
       </header>
       <div className="space-y-2">
        {kanbanGroups[status].length === 0 ? (
         <p className="rounded-md border border-dashed border-border px-2 py-4 text-center text-xs text-muted-foreground">無項目</p>
        ) : (
         kanbanGroups[status].map((r) => {
          const expanded = expandedKanbanIds.has(r.id)
          return (
          <article
           key={r.id}
           className="rounded-lg border border-border/80 bg-background px-3 py-2 transition-colors hover:border-info/40 hover:bg-muted/20"
          >
           <div className="flex items-start gap-2">
            <button
             type="button"
             className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
             aria-expanded={expanded}
             aria-label={expanded ? "收合卡片" : "展開卡片"}
             onClick={(e) => {
              e.stopPropagation()
              setExpandedKanbanIds((prev) => {
               const next = new Set(prev)
               if (next.has(r.id)) next.delete(r.id)
               else next.add(r.id)
               return next
              })
             }}
            >
             {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <div
             role="button"
             tabIndex={0}
             className="min-w-0 flex-1 cursor-pointer"
             onClick={() => openDetail(r)}
             onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
               e.preventDefault()
               openDetail(r)
              }
             }}
            >
             <div className="mt-0.5">
              <TodoTagList tags={r.tags} />
             </div>
             <p className="text-xs font-medium text-muted-foreground">{r.eventDate}</p>
             <p className="text-sm font-semibold">{r.title}</p>
             <p className="mt-1 text-xs text-muted-foreground">{r.category || "一般"}</p>
             {!expanded && r.latestUpdatePreview?.trim() ? (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.latestUpdatePreview}</p>
             ) : null}
             {expanded && r.latestUpdatePreview?.trim() ? (
              <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{r.latestUpdatePreview}</p>
             ) : null}
             {expanded ? (
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
               <p>
                <span className="font-medium text-foreground">老師：</span>
                {r.teacherIds.length === 0
                 ? "—"
                 : r.teacherIds.map((id, i) => (
                    <span key={id}>
                     {i > 0 ? "、" : ""}
                     <Link
                      to={`/Teachers/${id}`}
                      className="text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                     >
                      {participantLabels.teachers.get(id) ?? id}
                     </Link>
                    </span>
                   ))}
               </p>
               <p>
                <span className="font-medium text-foreground">學生：</span>
                {r.studentIds.length === 0
                 ? "—"
                 : r.studentIds.map((id, i) => (
                    <span key={id}>
                     {i > 0 ? "、" : ""}
                     <Link
                      to={`/Students/${id}`}
                      className="text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                     >
                      {participantLabels.students.get(id) ?? id}
                     </Link>
                    </span>
                   ))}
               </p>
              </div>
             ) : (
              <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
               <Users className="h-3.5 w-3.5" />
               師 {r.teacherIds.length} / 生 {r.studentIds.length}
              </div>
             )}
            </div>
           </div>
           {canEdit ? (
            <div className="mt-1 flex gap-1 pl-6" onClick={(e) => e.stopPropagation()}>
             <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => openEdit(r, e)}>
              <Pencil className="h-3.5 w-3.5" />
             </Button>
             <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={(e) => void removeEvent(r, e)}
             >
              <Trash2 className="h-3.5 w-3.5" />
             </Button>
            </div>
           ) : null}
          </article>
         )})
        )}
       </div>
      </section>
     ))}
    </div>
   ) : null}

   <TodoFormDialog
    open={formOpen}
    onOpenChange={setFormOpen}
    title={editing ? "編輯待辦" : "新增待辦"}
    initial={formInitial}
    categories={categories}
    saving={saving}
    onSubmit={submitForm}
   />
  </div>
 )
}
