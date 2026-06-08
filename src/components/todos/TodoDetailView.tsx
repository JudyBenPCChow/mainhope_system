import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Pencil, Trash2 } from "lucide-react"

import { DetailLayerShell } from "@/components/detail/DetailLayerShell"
import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/tag"
import { Textarea } from "@/components/ui/textarea"
import { useAppConfirm } from "@/lib/appConfirm"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { getMgmtRole } from "@/lib/mgmtRole"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import {
 canAddTodoUpdate,
 deleteCalendarEvent,
 fetchCalendarParticipantOptions,
 getCalendarEventById,
 insertCalendarEventUpdate,
 listCalendarEventUpdates,
 updateCalendarEvent,
 type CalendarEventRow,
 type CalendarEventStatus,
 type CalendarEventUpdateRow,
} from "@/services/calendarQueries"

import { TodoFormDialog, todoFormFromEvent, type TodoFormValues } from "./TodoFormDialog"
import { todoStatusLabel, todoStatusTone, TodoStatusChips, TodoTagList } from "./todoUi"

function formatDateTime(iso: string): string {
 const d = new Date(iso)
 if (Number.isNaN(d.getTime())) return iso
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

export function TodoDetailView() {
 const { eventId } = useParams<{ eventId: string }>()
 const navigate = useNavigate()
 const location = useLocation()
 const { confirmDialog } = useAppConfirm()
 const role = getMgmtRole()
 const canEditMeta = role === "admin" || role === "alien"

 const [event, setEvent] = useState<CalendarEventRow | null>(null)
 const [updates, setUpdates] = useState<CalendarEventUpdateRow[]>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)
 const [updateBody, setUpdateBody] = useState("")
 const [updateSaving, setUpdateSaving] = useState(false)
 const [updateErr, setUpdateErr] = useState<string | null>(null)
 const [canAddUpdate, setCanAddUpdate] = useState(false)
 const [formOpen, setFormOpen] = useState(false)
 const [formSaving, setFormSaving] = useState(false)
 const [labels, setLabels] = useState<{ teachers: Map<string, string>; students: Map<string, string> }>({
  teachers: new Map(),
  students: new Map(),
 })

 const returnPath =
  typeof location.state === "object" &&
  location.state != null &&
  "from" in location.state &&
  typeof (location.state as { from: unknown }).from === "string"
   ? (location.state as { from: string }).from
   : "/Calendar"

 const load = useCallback(async () => {
  if (!eventId || !isSupabaseConfigured) {
   setEvent(null)
   setUpdates([])
   setLoading(false)
   return
  }
  setLoading(true)
  setErr(null)
  try {
   const [ev, ups, opts] = await Promise.all([
    getCalendarEventById(eventId),
    listCalendarEventUpdates(eventId),
    fetchCalendarParticipantOptions(),
   ])
   setEvent(ev)
   setUpdates(ups)
   setLabels({
    teachers: new Map(opts.teachers.map((t) => [t.id, t.label])),
    students: new Map(opts.students.map((s) => [s.id, s.label])),
   })
   if (ev) setCanAddUpdate(await canAddTodoUpdate(ev))
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, { source: "TodoDetailView.load", setErr, userMessage: msg })
   setEvent(null)
   setUpdates([])
  } finally {
   setLoading(false)
  }
 }, [eventId])

 useEffect(() => {
  void load()
 }, [load])

 const categories = useMemo(() => {
  const set = new Set<string>(["一般"])
  if (event?.category) set.add(event.category)
  return [...set]
 }, [event])

 const dismiss = useCallback(() => {
  navigate(returnPath)
 }, [navigate, returnPath])

 const submitUpdate = async () => {
  if (!event || !updateBody.trim()) return
  setUpdateSaving(true)
  setUpdateErr(null)
  try {
   const row = await insertCalendarEventUpdate(event.id, updateBody)
   setUpdates((prev) => [row, ...prev])
   setUpdateBody("")
   setEvent((prev) =>
    prev
     ? {
        ...prev,
        latestUpdatePreview: row.body,
        latestUpdateAt: row.createdAt,
        updatedAt: row.createdAt,
       }
     : prev
   )
  } catch (e) {
   const msg = formatUnknownError(e)
   setUpdateErr(msg)
   reportUserFacingError(e, { source: "TodoDetailView.submitUpdate", setErr: setUpdateErr, userMessage: msg })
  } finally {
   setUpdateSaving(false)
  }
 }

 const changeStatus = async (status: CalendarEventStatus) => {
  if (!event || !canEditMeta || event.status === status) return
  try {
   const updated = await updateCalendarEvent(event.id, { status })
   setEvent(updated)
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, { source: "TodoDetailView.changeStatus", setErr, userMessage: msg })
  }
 }

 const submitEdit = async (values: TodoFormValues) => {
  if (!event) return
  setFormSaving(true)
  try {
   const updated = await updateCalendarEvent(event.id, {
    title: values.title,
    category: values.category,
    eventDate: values.eventDate,
    status: values.status,
    visibility: values.visibility,
    teacherIds: values.teacherIds,
    studentIds: values.studentIds,
    tags: values.tags,
   })
   setEvent(updated)
   setCanAddUpdate(await canAddTodoUpdate(updated))
   setFormOpen(false)
  } finally {
   setFormSaving(false)
  }
 }

 const removeEvent = async () => {
  if (!event || !canEditMeta) return
  const ok = await confirmDialog({
   title: "刪除待辦",
   description: `確定刪除「${event.title}」？`,
   confirmText: "刪除",
   tone: "destructive",
  })
  if (!ok) return
  try {
   await deleteCalendarEvent(event.id)
   navigate(returnPath)
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, { source: "TodoDetailView.removeEvent", setErr, userMessage: msg })
  }
 }

 if (loading) {
  return (
   <DetailLayerShell variant="todo" onDismiss={dismiss} layerLabel="待辦詳情">
    <div className="min-h-full bg-background p-6 text-sm text-muted-foreground">載入中…</div>
   </DetailLayerShell>
  )
 }

 if (!event) {
  return (
   <DetailLayerShell variant="todo" onDismiss={dismiss} layerLabel="待辦詳情">
    <div className="min-h-full space-y-4 bg-background p-6">
     <p className="text-sm text-destructive">{err ?? "找不到此待辦。"}</p>
     <Button type="button" variant="outline" onClick={dismiss}>
      <ArrowLeft className="mr-1.5 h-4 w-4" />
      返回
     </Button>
    </div>
   </DetailLayerShell>
  )
 }

 return (
  <DetailLayerShell variant="todo" onDismiss={dismiss} layerLabel="待辦詳情">
   <div className="min-h-full space-y-6 bg-background p-4 md:p-6">
    {err ? (
     <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {err}
     </div>
    ) : null}

    <header className="space-y-3 border-b border-border/80 pb-4">
     <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
       <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{event.title}</h1>
       <div className="mt-2 flex flex-wrap items-center gap-2">
        <Tag tone={todoStatusTone(event.status)} size="sm">
         {todoStatusLabel(event.status)}
        </Tag>
        <span className="text-xs text-muted-foreground">事項日期 {event.eventDate}</span>
        <span className="text-xs text-muted-foreground">分類 {event.category || "一般"}</span>
       </div>
      </div>
      <div className="flex flex-wrap gap-2">
       {canEditMeta ? (
        <>
         <Button type="button" variant="outline" size="sm" onClick={() => setFormOpen(true)}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          編輯
         </Button>
         <Button type="button" variant="outline" size="sm" className="text-destructive" onClick={() => void removeEvent()}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          刪除
         </Button>
        </>
       ) : null}
      </div>
     </div>

     <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">標籤</p>
      <TodoTagList tags={event.tags} />
     </div>

     {canEditMeta ? (
      <div>
       <p className="mb-1 text-xs font-medium text-muted-foreground">狀態</p>
       <TodoStatusChips value={event.status} onChange={(s) => void changeStatus(s)} />
      </div>
     ) : null}

     <div className="grid gap-2 text-sm sm:grid-cols-2">
      <div>
       <p className="text-xs font-medium text-muted-foreground">涉及老師</p>
       <p className="mt-0.5">
        {event.teacherIds.length === 0
         ? "—"
         : event.teacherIds.map((id) => (
            <span key={id}>
             <Link
              to={`/Teachers/${id}`}
              className="text-primary underline-offset-2 hover:underline"
              onClick={(e) => e.stopPropagation()}
             >
              {labels.teachers.get(id) ?? id}
             </Link>
             {" "}
            </span>
           ))}
       </p>
      </div>
      <div>
       <p className="text-xs font-medium text-muted-foreground">涉及學生</p>
       <p className="mt-0.5">
        {event.studentIds.length === 0
         ? "—"
         : event.studentIds.map((id) => (
            <span key={id}>
             <Link
              to={`/Students/${id}`}
              className="text-primary underline-offset-2 hover:underline"
              onClick={(e) => e.stopPropagation()}
             >
              {labels.students.get(id) ?? id}
             </Link>
             {" "}
            </span>
           ))}
       </p>
      </div>
     </div>
    </header>

    {canAddUpdate ? (
     <section className="rounded-xl border border-border/80 bg-muted/15 p-4">
      <h2 className="mb-2 text-sm font-semibold">快速新增跟進</h2>
      <Textarea
       rows={3}
       value={updateBody}
       onChange={(e) => setUpdateBody(e.target.value)}
       placeholder="記錄本次跟進內容…"
      />
      {updateErr ? <p className="mt-2 text-xs text-destructive">{updateErr}</p> : null}
      <div className="mt-2 flex justify-end">
       <Button
        type="button"
        disabled={updateSaving || !updateBody.trim()}
        onClick={() => void submitUpdate()}
       >
        {updateSaving ? "送出中…" : "送出紀錄"}
       </Button>
      </div>
     </section>
    ) : (
     <p className="text-xs text-muted-foreground">您目前僅可檢視此待辦的跟進紀錄。</p>
    )}

    <section>
     <h2 className="mb-3 text-sm font-semibold">跟進時間軸</h2>
     {updates.length === 0 ? (
      <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
       尚無跟進紀錄。{canAddUpdate ? "請在上方新增第一筆跟進。" : ""}
      </p>
     ) : (
      <ol className="space-y-3">
       {updates.map((u, i) => (
        <li
         key={u.id}
         className={cn(
          "relative rounded-lg border border-border/80 bg-card px-4 py-3 pl-5",
          i === 0 && "border-info/30 bg-info/10"
         )}
        >
         <div className="absolute left-2 top-4 h-[calc(100%-1rem)] w-0.5 bg-border/80" aria-hidden />
         <div className="absolute left-1.5 top-4 h-2 w-2 rounded-full bg-info" aria-hidden />
         <p className="text-xs text-muted-foreground">
          {formatDateTime(u.createdAt)}
          {u.createdByLabel ? ` · ${u.createdByLabel}` : ""}
         </p>
         <p className="mt-1 whitespace-pre-wrap text-sm">{u.body}</p>
        </li>
       ))}
      </ol>
     )}
    </section>
   </div>

   <TodoFormDialog
    open={formOpen}
    onOpenChange={setFormOpen}
    title="編輯待辦"
    initial={todoFormFromEvent(event)}
    categories={categories}
    saving={formSaving}
    onSubmit={submitEdit}
   />
  </DetailLayerShell>
 )
}
