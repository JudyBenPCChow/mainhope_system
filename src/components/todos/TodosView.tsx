import { useCallback, useEffect, useState } from "react"
import {
 CalendarDays,
 CheckCircle2,
 Circle,
 ListTodo,
 Pencil,
 Plus,
 Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAppConfirm } from "@/lib/appConfirm"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import {
 deleteAdminTodo,
 fetchAdminTodos,
 insertAdminTodo,
 setTodoCompleted,
 updateAdminTodo,
 type AdminTodoRow,
 type TodoFilterTab,
} from "@/services/todoQueries"

export function TodosView() {
 const { confirmDialog } = useAppConfirm()
 const [tab, setTab] = useState<TodoFilterTab>("pending")
 const [rows, setRows] = useState<AdminTodoRow[]>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)

 const [dialogOpen, setDialogOpen] = useState(false)
 const [editing, setEditing] = useState<AdminTodoRow | null>(null)
 const [formTitle, setFormTitle] = useState("")
 const [formNotes, setFormNotes] = useState("")
 const [formDue, setFormDue] = useState("")
 const [formSort, setFormSort] = useState("0")
 const [saving, setSaving] = useState(false)

 const load = useCallback(async () => {
  if (!isSupabaseConfigured) {
   setRows([])
   setLoading(false)
   return
  }
  setLoading(true)
  setErr(null)
  try {
   setRows(await fetchAdminTodos(tab))
  } catch (e) {
   reportUserFacingError(e, { source: "TodosView.load", setErr })
   setRows([])
  } finally {
   setLoading(false)
  }
 }, [tab])

 useEffect(() => {
  void load()
 }, [load])

 const openCreate = () => {
  setEditing(null)
  setFormTitle("")
  setFormNotes("")
  setFormDue(new Date().toISOString().slice(0, 10))
  setFormSort("0")
  setDialogOpen(true)
 }

 const openEdit = (r: AdminTodoRow) => {
  setEditing(r)
  setFormTitle(r.title)
  setFormNotes(r.notes ?? "")
  setFormDue(r.dueDate)
  setFormSort(String(r.sortOrder))
  setDialogOpen(true)
 }

 const submitForm = async () => {
  if (!formTitle.trim()) return
  setSaving(true)
  try {
   const sortN = Number(formSort)
   if (editing) {
    await updateAdminTodo(editing.id, {
     title: formTitle,
     notes: formNotes.trim() || null,
     dueDate: formDue,
     sortOrder: Number.isFinite(sortN) ? sortN : 0,
    })
   } else {
    await insertAdminTodo({
     title: formTitle,
     notes: formNotes.trim() || null,
     dueDate: formDue,
     sortOrder: Number.isFinite(sortN) ? sortN : 0,
    })
   }
   setDialogOpen(false)
   await load()
  } catch (e) {
   reportUserFacingError(e, { source: "TodosView.submitForm", setErr })
  } finally {
   setSaving(false)
  }
 }

 const onToggleDone = async (r: AdminTodoRow) => {
  try {
   await setTodoCompleted(r.id, !r.completedAt)
   await load()
  } catch (e) {
   reportUserFacingError(e, { source: "TodosView.onToggleDone", setErr })
  }
 }

 const onDelete = async (r: AdminTodoRow) => {
  const ok = await confirmDialog({
   title: "刪除待辦",
   description: `刪除待辦「${r.title}」？`,
   confirmText: "刪除",
   tone: "destructive",
  })
  if (!ok) return
  try {
   await deleteAdminTodo(r.id)
   await load()
  } catch (e) {
   reportUserFacingError(e, { source: "TodosView.onDelete", setErr })
  }
 }

 return (
  <div className="space-y-6 p-4 md:p-6">
   <header className="flex flex-wrap items-end justify-between gap-4">
    <div>
     <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
      <ListTodo className="h-8 w-8 text-primary" aria-hidden />
      待辦事項
     </h1>
     <p className="mt-1 text-sm text-muted-foreground">
      管理後台待辦；已完成項目可保留查閱或刪除。
     </p>
    </div>
    <Button type="button" onClick={openCreate} disabled={!isSupabaseConfigured}>
     <Plus className="mr-1.5 h-4 w-4" />
     新增待辦
    </Button>
   </header>

   {!isSupabaseConfigured ? (
    <div
     role="alert"
     className="rounded-lg border border-warning/50 bg-warning/10 px-3 py-2 text-sm text-warning"
    >
     請設定 <code className="rounded bg-muted px-1">.env</code> 內 Supabase 後重啟 dev。
    </div>
   ) : null}

   {err ? (
    <div
     role="alert"
     className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
     {err}
    </div>
   ) : null}

   <div className="flex flex-wrap gap-2">
    {(
     [
      ["pending", "進行中"],
      ["done", "已完成"],
      ["all", "全部"],
     ] as const
    ).map(([key, label]) => (
     <button
      key={key}
      type="button"
      onClick={() => setTab(key)}
      className={cn(
       "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
       tab === key
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-card hover:bg-muted/60"
      )}
     >
      {label}
     </button>
    ))}
   </div>

   {loading ? (
    <p className="text-sm text-muted-foreground">載入中…</p>
   ) : rows.length === 0 ? (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
     {tab === "pending" ? "目前沒有進行中的待辦。" : tab === "done" ? "尚無已完成的待辦。" : "尚無任何待辦。"}
    </div>
   ) : (
    <ul className="space-y-3">
     {rows.map((r) => (
      <li
       key={r.id}
       className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between",
        r.completedAt ? "border-border/80 opacity-90" : "border-info/30"
       )}
      >
       <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
         <button
          type="button"
          className="mt-0.5 shrink-0 text-primary hover:opacity-80"
          aria-label={r.completedAt ? "標為未完成" : "標為完成"}
          onClick={() => void onToggleDone(r)}
         >
          {r.completedAt ? (
           <CheckCircle2 className="h-5 w-5" />
          ) : (
           <Circle className="h-5 w-5" />
          )}
         </button>
         <div className="min-w-0">
          <div
           className={cn(
            "font-medium text-foreground",
            r.completedAt && "text-muted-foreground line-through"
           )}
          >
           {r.title}
          </div>
          {r.notes ? (
           <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{r.notes}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
           <span className="inline-flex items-center gap-1 tabular-nums">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            截止 {r.dueDate}
           </span>
           <span>排序 {r.sortOrder}</span>
          </div>
         </div>
        </div>
       </div>
       <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(r)}>
         <Pencil className="mr-1 h-3.5 w-3.5" />
         編輯
        </Button>
        <Button
         type="button"
         variant="ghost"
         size="sm"
         className="text-destructive hover:bg-destructive/10"
         onClick={() => void onDelete(r)}
        >
         <Trash2 className="mr-1 h-3.5 w-3.5" />
         刪除
        </Button>
       </div>
      </li>
     ))}
    </ul>
   )}

   <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
    <DialogContent className="max-w-md">
     <DialogHeader>
      <DialogTitle>{editing ? "編輯待辦" : "新增待辦"}</DialogTitle>
     </DialogHeader>
     <div className="grid gap-3 text-sm">
      <div>
       <label className="text-xs font-medium text-muted-foreground">標題 *</label>
       <Input
        className="mt-1"
        value={formTitle}
        onChange={(e) => setFormTitle(e.target.value)}
        placeholder="要做什麼？"
       />
      </div>
      <div>
       <label className="text-xs font-medium text-muted-foreground">備註</label>
       <Textarea
        className="mt-1 resize-none"
        rows={3}
        value={formNotes}
        onChange={(e) => setFormNotes(e.target.value)}
        placeholder="選填"
       />
      </div>
      <div className="grid grid-cols-2 gap-3">
       <div>
        <label className="text-xs font-medium text-muted-foreground">截止日期</label>
        <Input
         type="date"
         className="mt-1"
         value={formDue}
         onChange={(e) => setFormDue(e.target.value)}
        />
       </div>
       <div>
        <label className="text-xs font-medium text-muted-foreground">排序（數字小靠前）</label>
        <Input
         type="number"
         className="mt-1"
         value={formSort}
         onChange={(e) => setFormSort(e.target.value)}
        />
       </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
       <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
        取消
       </Button>
       <Button
        type="button"
        disabled={saving || !formTitle.trim()}
        onClick={() => void submitForm()}
       >
        {saving ? "儲存中…" : "儲存"}
       </Button>
      </div>
     </div>
    </DialogContent>
   </Dialog>
  </div>
 )
}
