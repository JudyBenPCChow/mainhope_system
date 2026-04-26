import { supabase } from "@/lib/supabaseClient"

function localYmd(d = new Date()): string {
 const y = d.getFullYear()
 const m = String(d.getMonth() + 1).padStart(2, "0")
 const day = String(d.getDate()).padStart(2, "0")
 return `${y}-${m}-${day}`
}

export type AdminTodoRow = {
 id: string
 title: string
 notes: string | null
 dueDate: string
 completedAt: string | null
 sortOrder: number
 createdAt: string
}

function mapTodo(r: Record<string, unknown>): AdminTodoRow {
 return {
  id: String(r.id),
  title: String(r.title ?? ""),
  notes: r.notes != null ? String(r.notes) : null,
  dueDate: String(r.due_date ?? "").slice(0, 10),
  completedAt: r.completed_at != null ? String(r.completed_at) : null,
  sortOrder: Number(r.sort_order ?? 0),
  createdAt: String(r.created_at ?? ""),
 }
}

export type TodoFilterTab = "pending" | "done" | "all"

export async function fetchAdminTodos(filter: TodoFilterTab = "all"): Promise<AdminTodoRow[]> {
 if (!supabase) return []
 let q = supabase
  .from("admin_todos")
  .select("id, title, notes, due_date, completed_at, sort_order, created_at")
  .order("sort_order", { ascending: true })
  .order("due_date", { ascending: true })
  .order("created_at", { ascending: false })

 if (filter === "pending") q = q.is("completed_at", null)
 else if (filter === "done") q = q.not("completed_at", "is", null)

 const { data, error } = await q
 if (error) throw error
 return (data ?? []).map((x) => mapTodo(x as Record<string, unknown>))
}

export async function insertAdminTodo(row: {
 title: string
 notes?: string | null
 dueDate?: string
 sortOrder?: number
}): Promise<AdminTodoRow> {
 if (!supabase) throw new Error("Supabase 未設定")
 const due = row.dueDate?.trim() || localYmd()
 const { data, error } = await supabase
  .from("admin_todos")
  .insert({
   title: row.title.trim(),
   notes: row.notes?.trim() || null,
   due_date: due,
   sort_order: row.sortOrder ?? 0,
  })
  .select("id, title, notes, due_date, completed_at, sort_order, created_at")
  .single()
 if (error) throw error
 return mapTodo(data as Record<string, unknown>)
}

export async function updateAdminTodo(
 id: string,
 patch: {
  title?: string
  notes?: string | null
  dueDate?: string
  sortOrder?: number
  completedAt?: string | null
 }
): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const payload: Record<string, unknown> = {}
 if (patch.title !== undefined) payload.title = patch.title.trim()
 if (patch.notes !== undefined) payload.notes = patch.notes?.trim() || null
 if (patch.dueDate !== undefined) payload.due_date = patch.dueDate
 if (patch.sortOrder !== undefined) payload.sort_order = patch.sortOrder
 if (patch.completedAt !== undefined) payload.completed_at = patch.completedAt
 const { error } = await supabase.from("admin_todos").update(payload).eq("id", id)
 if (error) throw error
}

export async function deleteAdminTodo(id: string): Promise<void> {
 if (!supabase) throw new Error("Supabase 未設定")
 const { error } = await supabase.from("admin_todos").delete().eq("id", id)
 if (error) throw error
}

export async function setTodoCompleted(id: string, done: boolean): Promise<void> {
 await updateAdminTodo(id, {
  completedAt: done ? new Date().toISOString() : null,
 })
}
