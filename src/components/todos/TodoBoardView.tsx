import { useCallback, useEffect, useMemo, useState } from "react"
import { KanbanSquare, List, Pencil, Plus, Search, Trash2, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
 type CalendarEventRow,
 type CalendarEventStatus,
 type CalendarParticipantOptions,
 updateCalendarEvent,
} from "@/services/calendarQueries"

type ViewMode = "table" | "kanban"

type FormState = {
 title: string
 description: string
 category: string
 eventDate: string
 status: CalendarEventStatus
 visibility: "private" | "teachers"
 teacherIds: string[]
 userIds: string[]
 studentIds: string[]
}

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

function emptyForm(): FormState {
 return {
  title: "",
  description: "",
  category: "一般",
  eventDate: localYmd(),
  status: "todo",
  visibility: "private",
  teacherIds: [],
  userIds: [],
  studentIds: [],
 }
}

function statusLabel(s: CalendarEventStatus): string {
 if (s === "todo") return "待處理"
 if (s === "in_progress") return "進行中"
 if (s === "done") return "已完成"
 return "已取消"
}

function statusStyle(s: CalendarEventStatus): string {
 if (s === "todo") return "border-slate-300 bg-slate-100 text-slate-900"
 if (s === "in_progress") return "border-sky-300 bg-sky-100 text-sky-900"
 if (s === "done") return "border-emerald-300 bg-emerald-100 text-emerald-900"
 return "border-rose-300 bg-rose-100 text-rose-900"
}

export function TodoBoardView() {
 const role = getMgmtRole()
 const isTeacher = role === "teacher"
 const canEdit = role === "admin" || role === "alien"
 const teacherId = isTeacher ? getTeacherScopeTeacherId() : null

 const [viewMode, setViewMode] = useState<ViewMode>("table")
 const [searchText, setSearchText] = useState("")
 const [dateFrom, setDateFrom] = useState(addDaysYmd(localYmd(), -30))
 const [dateTo, setDateTo] = useState(addDaysYmd(localYmd(), 60))
 const [rows, setRows] = useState<CalendarEventRow[]>([])
 const [options, setOptions] = useState<CalendarParticipantOptions>({
  teachers: [],
  users: [],
  students: [],
 })
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)

 const [open, setOpen] = useState(false)
 const [editing, setEditing] = useState<CalendarEventRow | null>(null)
 const [saving, setSaving] = useState(false)
 const [editErr, setEditErr] = useState<string | null>(null)
 const [form, setForm] = useState<FormState>(emptyForm)
 const [teacherQuery, setTeacherQuery] = useState("")
 const [userQuery, setUserQuery] = useState("")
 const [studentQuery, setStudentQuery] = useState("")

 const load = useCallback(async () => {
  if (!isSupabaseConfigured) {
   setRows([])
   setOptions({ teachers: [], users: [], students: [] })
   setLoading(false)
   return
  }
  setLoading(true)
  setErr(null)
  try {
   const [events, p] = await Promise.all([
    listCalendarEventsInRange(dateFrom, dateTo, { teacherId }),
    fetchCalendarParticipantOptions(),
   ])
   setRows(events)
   setOptions(p)
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, { source: "TodoBoardView.load", setErr, userMessage: msg })
   setRows([])
  } finally {
   setLoading(false)
  }
 }, [dateFrom, dateTo, teacherId])

 useEffect(() => {
  void load()
 }, [load])

 const filteredRows = useMemo(() => {
  const q = searchText.trim().toLowerCase()
  if (!q) return rows
  return rows.filter((r) => `${r.title} ${r.description ?? ""} ${r.category}`.toLowerCase().includes(q))
 }, [rows, searchText])

 const kanbanGroups = useMemo(() => {
  const grouped: Record<CalendarEventStatus, CalendarEventRow[]> = {
   todo: [],
   in_progress: [],
   done: [],
   cancelled: [],
  }
  for (const r of filteredRows) grouped[r.status].push(r)
  return grouped
 }, [filteredRows])

 const categories = useMemo(() => {
  const set = new Set<string>(["一般"])
  for (const r of rows) if (r.category.trim()) set.add(r.category.trim())
  return [...set]
 }, [rows])

 const filteredTeacherOptions = useMemo(() => {
  const q = teacherQuery.trim().toLowerCase()
  if (!q) return options.teachers
  return options.teachers.filter((t) => t.label.toLowerCase().includes(q))
 }, [options.teachers, teacherQuery])

 const filteredUserOptions = useMemo(() => {
  const q = userQuery.trim().toLowerCase()
  if (!q) return options.users
  return options.users.filter((u) => u.label.toLowerCase().includes(q))
 }, [options.users, userQuery])

 const filteredStudentOptions = useMemo(() => {
  const q = studentQuery.trim().toLowerCase()
  if (!q) return options.students
  return options.students.filter((s) => s.label.toLowerCase().includes(q))
 }, [options.students, studentQuery])

 const teacherLabel = (id: string) => options.teachers.find((t) => t.id === id)?.label ?? `${id.slice(0, 8)}…`
 const userLabel = (id: string) => options.users.find((u) => u.id === id)?.label ?? `${id.slice(0, 8)}…`
 const studentLabel = (id: string) => options.students.find((s) => s.id === id)?.label ?? `${id.slice(0, 8)}…`
 const toggleId = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

 const openCreate = () => {
  if (!canEdit) return
  setEditing(null)
  setForm(emptyForm())
  setEditErr(null)
  setTeacherQuery("")
  setUserQuery("")
  setStudentQuery("")
  setOpen(true)
 }

 const openEdit = (r: CalendarEventRow) => {
  if (!canEdit) return
  setEditing(r)
  setForm({
   title: r.title,
   description: r.description ?? "",
   category: r.category || "一般",
   eventDate: r.eventDate,
   status: r.status,
   visibility: r.visibility,
   teacherIds: [...r.teacherIds],
   userIds: [...r.userIds],
   studentIds: [...r.studentIds],
  })
  setEditErr(null)
  setTeacherQuery("")
  setUserQuery("")
  setStudentQuery("")
  setOpen(true)
 }

 const submit = async () => {
  if (!form.title.trim()) return
  setSaving(true)
  try {
   const payload = {
    title: form.title,
    description: form.description,
    category: form.category,
    eventDate: form.eventDate,
    status: form.status,
    visibility: form.visibility,
    allDay: true,
    startTime: null,
    endTime: null,
    teacherIds: form.teacherIds,
    userIds: form.userIds,
    studentIds: form.studentIds,
   } as const
   if (editing) await updateCalendarEvent(editing.id, payload)
   else await insertCalendarEvent(payload)
   setOpen(false)
   await load()
  } catch (e) {
   const msg = formatUnknownError(e)
   setEditErr(msg)
   reportUserFacingError(e, { source: "TodoBoardView.submit", setErr: setEditErr, userMessage: msg })
  } finally {
   setSaving(false)
  }
 }

 const removeEvent = async (r: CalendarEventRow) => {
  if (!canEdit) return
  if (!confirm(`刪除待辦「${r.title}」？`)) return
  try {
   await deleteCalendarEvent(r.id)
   await load()
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, { source: "TodoBoardView.removeEvent", setErr, userMessage: msg })
  }
 }

 return (
  <div className="space-y-6 p-4 md:p-6">
   <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border/80 pb-5">
    <div>
     <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
      <List className="h-8 w-8 text-sky-600" />
      待辦事項
     </h1>
     <p className="text-sm text-muted-foreground">只紀錄日期，並可關聯老師、同事、學生，支援分類與狀態。</p>
    </div>
    {canEdit ? (
     <Button type="button" className="bg-sky-600 text-white hover:bg-sky-700" onClick={openCreate}>
      <Plus className="mr-1.5 h-4 w-4" />
      新增待辦
     </Button>
    ) : null}
   </header>

   {err ? <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</div> : null}
   <div className="flex flex-wrap items-center gap-2">
    <div className="inline-flex rounded-md border border-border bg-muted/30 p-0.5 text-sm">
     <button type="button" onClick={() => setViewMode("table")} className={cn("rounded px-3 py-1.5", viewMode === "table" ? "bg-sky-600 text-white" : "text-muted-foreground")}>
      <span className="inline-flex items-center gap-1"><List className="h-4 w-4" />Table</span>
     </button>
     <button type="button" onClick={() => setViewMode("kanban")} className={cn("rounded px-3 py-1.5", viewMode === "kanban" ? "bg-sky-600 text-white" : "text-muted-foreground")}>
      <span className="inline-flex items-center gap-1"><KanbanSquare className="h-4 w-4" />Kanban</span>
     </button>
    </div>
    <label className="relative min-w-[220px] flex-1 sm:max-w-xs">
     <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
     <Input className="pl-8" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="搜尋標題/內容/分類" />
    </label>
    <Input type="date" className="w-[170px]" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
    <Input type="date" className="w-[170px]" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
   </div>

   {loading ? <p className="text-sm text-muted-foreground">載入中…</p> : null}
   {!loading && viewMode === "table" ? (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
     <table className="w-full min-w-[980px] table-fixed text-sm">
      <thead className="bg-muted/30 text-xs text-muted-foreground">
       <tr><th className="w-[120px] px-3 py-2 text-left">日期</th><th className="w-[220px] px-3 py-2 text-left">標題</th><th className="w-[120px] px-3 py-2 text-left">分類</th><th className="w-[120px] px-3 py-2 text-left">狀態</th><th className="px-3 py-2 text-left">內容</th><th className="w-[210px] px-3 py-2 text-left">涉及對象</th>{canEdit ? <th className="w-[120px] px-3 py-2 text-left">操作</th> : null}</tr>
      </thead>
      <tbody>
       {filteredRows.length === 0 ? <tr><td colSpan={canEdit ? 7 : 6} className="px-4 py-8 text-center text-muted-foreground">暫無資料。</td></tr> : filteredRows.map((r) => (
        <tr key={r.id} className="border-t border-border/70 align-top">
         <td className="px-3 py-2 font-mono text-xs">{r.eventDate}</td>
         <td className="px-3 py-2 font-medium">{r.title}</td>
         <td className="px-3 py-2"><span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs">{r.category || "一般"}</span></td>
         <td className="px-3 py-2"><span className={cn("rounded-full border px-2 py-0.5 text-xs", statusStyle(r.status))}>{statusLabel(r.status)}</span></td>
         <td className="px-3 py-2 text-muted-foreground">{r.description?.trim() || "—"}</td>
         <td className="px-3 py-2 text-xs text-muted-foreground">師：{r.teacherIds.map(teacherLabel).join("、") || "—"}<br />同：{r.userIds.map(userLabel).join("、") || "—"}<br />生：{r.studentIds.map(studentLabel).join("、") || "—"}</td>
         {canEdit ? <td className="px-3 py-2"><div className="flex gap-1"><Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button><Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => void removeEvent(r)}><Trash2 className="h-3.5 w-3.5" /></Button></div></td> : null}
        </tr>
       ))}
      </tbody>
     </table>
    </div>
   ) : null}

   {!loading && viewMode === "kanban" ? (
    <div className="grid gap-4 lg:grid-cols-4">
     {(["todo", "in_progress", "done", "cancelled"] as CalendarEventStatus[]).map((status) => (
      <section key={status} className="rounded-xl border border-border bg-card p-3 shadow-sm">
       <header className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{statusLabel(status)}</h3>
        <span className={cn("rounded-full border px-2 py-0.5 text-xs", statusStyle(status))}>{kanbanGroups[status].length}</span>
       </header>
       <div className="space-y-2">
        {kanbanGroups[status].length === 0 ? <p className="rounded-md border border-dashed border-border px-2 py-4 text-center text-xs text-muted-foreground">無項目</p> : kanbanGroups[status].map((r) => (
         <article key={r.id} className="rounded-lg border border-border/80 bg-background px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">{r.eventDate}</p>
          <p className="text-sm font-semibold">{r.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{r.category || "一般"}</p>
          {r.description?.trim() ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.description}</p> : null}
          <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><Users className="h-3.5 w-3.5" />師 {r.teacherIds.length} / 同事 {r.userIds.length} / 生 {r.studentIds.length}</div>
          {canEdit ? <div className="mt-1 flex gap-1"><Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button><Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => void removeEvent(r)}><Trash2 className="h-3.5 w-3.5" /></Button></div> : null}
         </article>
        ))}
       </div>
      </section>
     ))}
    </div>
   ) : null}

   <Dialog open={open} onOpenChange={(v) => !saving && setOpen(v)}>
    <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
     <DialogHeader><DialogTitle>{editing ? "編輯待辦" : "新增待辦"}</DialogTitle></DialogHeader>
     <div className="grid gap-4 text-sm">
      {editErr ? <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{editErr}</div> : null}
      <div className="grid gap-3 sm:grid-cols-3">
       <div className="sm:col-span-2"><label className="text-xs font-medium text-muted-foreground">標題 *</label><Input className="mt-1" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
       <div><label className="text-xs font-medium text-muted-foreground">日期</label><Input className="mt-1" type="date" value={form.eventDate} onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))} /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
       <div><label className="text-xs font-medium text-muted-foreground">分類</label><Input className="mt-1" list="todo-category-list" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} /><datalist id="todo-category-list">{categories.map((c) => <option key={c} value={c} />)}</datalist></div>
       <div><label className="text-xs font-medium text-muted-foreground">狀態</label><select className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as CalendarEventStatus }))}><option value="todo">待處理</option><option value="in_progress">進行中</option><option value="done">已完成</option><option value="cancelled">已取消</option></select></div>
       <div><label className="text-xs font-medium text-muted-foreground">老師可見</label><select className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.visibility} onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value as "private" | "teachers" }))}><option value="private">僅被指派老師可見</option><option value="teachers">全體老師可見</option></select></div>
      </div>
      <div><label className="text-xs font-medium text-muted-foreground">內容</label><Textarea className="mt-1" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
      <div className="grid gap-3 lg:grid-cols-3">
       <div className="rounded-lg border border-border/80 bg-muted/20 p-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">涉及老師</p>
        {options.teachers.length > 7 ? (
         <Input
          className="mb-2 h-8 text-xs"
          value={teacherQuery}
          onChange={(e) => setTeacherQuery(e.target.value)}
          placeholder="搜尋老師"
         />
        ) : null}
        <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
         {filteredTeacherOptions.length === 0 ? (
          <p className="py-2 text-xs text-muted-foreground">找不到老師。</p>
         ) : (
          filteredTeacherOptions.map((t) => (
           <label key={t.id} className="flex items-center gap-2 text-xs">
            <input
             type="checkbox"
             checked={form.teacherIds.includes(t.id)}
             onChange={() => setForm((f) => ({ ...f, teacherIds: toggleId(f.teacherIds, t.id) }))}
            />
            <span>{teacherLabel(t.id)}</span>
           </label>
          ))
         )}
        </div>
       </div>
       <div className="rounded-lg border border-border/80 bg-muted/20 p-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">涉及同事</p>
        {options.users.length > 7 ? (
         <Input
          className="mb-2 h-8 text-xs"
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
          placeholder="搜尋同事"
         />
        ) : null}
        <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
         {filteredUserOptions.length === 0 ? (
          <p className="py-2 text-xs text-muted-foreground">找不到同事。</p>
         ) : (
          filteredUserOptions.map((u) => (
           <label key={u.id} className="flex items-center gap-2 text-xs">
            <input
             type="checkbox"
             checked={form.userIds.includes(u.id)}
             onChange={() => setForm((f) => ({ ...f, userIds: toggleId(f.userIds, u.id) }))}
            />
            <span>{userLabel(u.id)}</span>
           </label>
          ))
         )}
        </div>
       </div>
       <div className="rounded-lg border border-border/80 bg-muted/20 p-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">涉及學生</p>
        {options.students.length > 7 ? (
         <Input
          className="mb-2 h-8 text-xs"
          value={studentQuery}
          onChange={(e) => setStudentQuery(e.target.value)}
          placeholder="搜尋學生"
         />
        ) : null}
        <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
         {filteredStudentOptions.length === 0 ? (
          <p className="py-2 text-xs text-muted-foreground">找不到學生。</p>
         ) : (
          filteredStudentOptions.map((s) => (
           <label key={s.id} className="flex items-center gap-2 text-xs">
            <input
             type="checkbox"
             checked={form.studentIds.includes(s.id)}
             onChange={() => setForm((f) => ({ ...f, studentIds: toggleId(f.studentIds, s.id) }))}
            />
            <span>{studentLabel(s.id)}</span>
           </label>
          ))
         )}
        </div>
       </div>
      </div>
     </div>
     <DialogFooter className="border-t border-border pt-4">
      <Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>取消</Button>
      <Button type="button" className="bg-sky-600 text-white hover:bg-sky-700" disabled={saving || !form.title.trim()} onClick={() => void submit()}>{saving ? "儲存中…" : "儲存待辦"}</Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </div>
 )
}
