import { useEffect, useMemo, useState } from "react"
import { BookMarked, CalendarDays, Tags, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import {
 fetchCalendarParticipantOptions,
 type CalendarEventRow,
 type CalendarEventStatus,
 type CalendarParticipantOptions,
} from "@/services/calendarQueries"

import { TodoStatusChips, TodoTagMultiSelect } from "./todoUi"

export type TodoFormValues = {
 title: string
 category: string
 eventDate: string
 status: CalendarEventStatus
 visibility: "private" | "teachers"
 teacherIds: string[]
 studentIds: string[]
 tags: string[]
}

type TodoFormDialogProps = {
 open: boolean
 onOpenChange: (open: boolean) => void
 title: string
 initial: TodoFormValues
 categories: string[]
 saving: boolean
 onSubmit: (values: TodoFormValues) => Promise<void>
}

function localYmd(d = new Date()): string {
 const y = d.getFullYear()
 const m = String(d.getMonth() + 1).padStart(2, "0")
 const day = String(d.getDate()).padStart(2, "0")
 return `${y}-${m}-${day}`
}

export function emptyTodoFormValues(): TodoFormValues {
 return {
  title: "",
  category: "一般",
  eventDate: localYmd(),
  status: "in_progress",
  visibility: "private",
  teacherIds: [],
  studentIds: [],
  tags: [],
 }
}

export function todoFormFromEvent(r: CalendarEventRow): TodoFormValues {
 return {
  title: r.title,
  category: r.category || "一般",
  eventDate: r.eventDate,
  status: r.status,
  visibility: r.visibility,
  teacherIds: [...r.teacherIds],
  studentIds: [...r.studentIds],
  tags: [...r.tags],
 }
}

function SectionCard({
 icon: Icon,
 title,
 children,
}: {
 icon: typeof CalendarDays
 title: string
 children: React.ReactNode
}) {
 return (
  <section className="rounded-xl border border-border/80 bg-muted/15 p-4">
   <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
    <Icon className="h-4 w-4 text-primary" />
    {title}
   </h3>
   {children}
  </section>
 )
}

export function TodoFormDialog({
 open,
 onOpenChange,
 title,
 initial,
 categories,
 saving,
 onSubmit,
}: TodoFormDialogProps) {
 const [form, setForm] = useState<TodoFormValues>(initial)
 const [editErr, setEditErr] = useState<string | null>(null)
 const [options, setOptions] = useState<CalendarParticipantOptions>({ teachers: [], students: [] })
 const [teacherQuery, setTeacherQuery] = useState("")
 const [studentQuery, setStudentQuery] = useState("")

 useEffect(() => {
  if (open) {
   setForm(initial)
   setEditErr(null)
   setTeacherQuery("")
   setStudentQuery("")
  }
 }, [open, initial])

 useEffect(() => {
  if (!open) return
  let cancelled = false
  void fetchCalendarParticipantOptions()
   .then((p) => {
    if (!cancelled) setOptions(p)
   })
   .catch(() => {
    if (!cancelled) setOptions({ teachers: [], students: [] })
   })
  return () => {
   cancelled = true
  }
 }, [open])

 const toggleId = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

 const filteredTeachers = useMemo(() => {
  const q = teacherQuery.trim().toLowerCase()
  if (!q) return options.teachers
  return options.teachers.filter((t) => t.label.toLowerCase().includes(q))
 }, [options.teachers, teacherQuery])

 const filteredStudents = useMemo(() => {
  const q = studentQuery.trim().toLowerCase()
  if (!q) return options.students
  return options.students.filter((s) => s.label.toLowerCase().includes(q))
 }, [options.students, studentQuery])

 const handleSubmit = async () => {
  if (!form.title.trim()) return
  setEditErr(null)
  try {
   await onSubmit(form)
  } catch (e) {
   const msg = formatUnknownError(e)
   setEditErr(msg)
   reportUserFacingError(e, { source: "TodoFormDialog.submit", setErr: setEditErr, userMessage: msg })
  }
 }

 return (
  <Dialog open={open} onOpenChange={(v) => !saving && onOpenChange(v)}>
   <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
    <DialogHeader>
     <DialogTitle>{title}</DialogTitle>
    </DialogHeader>
    <div className="grid gap-4 text-sm">
     {editErr ? (
      <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
       {editErr}
      </div>
     ) : null}

     <SectionCard icon={CalendarDays} title="基本資料">
      <div className="grid gap-3 sm:grid-cols-2">
       <div className="sm:col-span-2">
        <label className="text-xs font-medium text-muted-foreground">標題 *</label>
        <Input className="mt-1" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
       </div>
       <div>
        <label className="text-xs font-medium text-muted-foreground">事項日期</label>
        <Input
         className="mt-1"
         type="date"
         value={form.eventDate}
         onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
        />
       </div>
       <div>
        <label className="text-xs font-medium text-muted-foreground">分類</label>
        <Input
         className="mt-1"
         list="todo-category-list"
         value={form.category}
         onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
        />
        <datalist id="todo-category-list">
         {categories.map((c) => (
          <option key={c} value={c} />
         ))}
        </datalist>
       </div>
       <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">狀態</label>
        <TodoStatusChips value={form.status} onChange={(status) => setForm((f) => ({ ...f, status }))} />
       </div>
       <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">老師可見</label>
        <Select
         value={form.visibility}
         onChange={(e) =>
          setForm((f) => ({ ...f, visibility: e.target.value as "private" | "teachers" }))
         }
        >
         <option value="private">僅被指派老師可見</option>
         <option value="teachers">全體老師可見</option>
        </Select>
       </div>
      </div>
     </SectionCard>

     <SectionCard icon={Tags} title="標籤">
      <TodoTagMultiSelect value={form.tags} onChange={(tags) => setForm((f) => ({ ...f, tags }))} />
     </SectionCard>

     <SectionCard icon={Users} title="關聯對象">
      <div className="grid gap-3 lg:grid-cols-2">
       <div className="rounded-lg border border-border/60 bg-background/60 p-3">
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
         {filteredTeachers.length === 0 ? (
          <p className="py-2 text-xs text-muted-foreground">找不到老師。</p>
         ) : (
          filteredTeachers.map((t) => (
           <label key={t.id} className="flex items-center gap-2 text-xs">
            <input
             type="checkbox"
             checked={form.teacherIds.includes(t.id)}
             onChange={() => setForm((f) => ({ ...f, teacherIds: toggleId(f.teacherIds, t.id) }))}
            />
            <span>{t.label}</span>
           </label>
          ))
         )}
        </div>
       </div>
       <div className="rounded-lg border border-border/60 bg-background/60 p-3">
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
         {filteredStudents.length === 0 ? (
          <p className="py-2 text-xs text-muted-foreground">找不到學生。</p>
         ) : (
          filteredStudents.map((s) => (
           <label key={s.id} className="flex items-center gap-2 text-xs">
            <input
             type="checkbox"
             checked={form.studentIds.includes(s.id)}
             onChange={() => setForm((f) => ({ ...f, studentIds: toggleId(f.studentIds, s.id) }))}
            />
            <span>{s.label}</span>
           </label>
          ))
         )}
        </div>
       </div>
      </div>
     </SectionCard>

     <p className="flex items-start gap-2 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-xs text-info">
      <BookMarked className="mt-0.5 h-4 w-4 shrink-0" />
      儲存後可於詳情頁新增跟進紀錄；每次跟進會保留在時間軸，不會覆蓋過往內容。
     </p>
    </div>
    <DialogFooter className="border-t border-border pt-4">
     <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
      取消
     </Button>
     <Button
      type="button"
      className=""
      disabled={saving || !form.title.trim()}
      onClick={() => void handleSubmit()}
     >
      {saving ? "儲存中…" : "儲存待辦"}
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 )
}
