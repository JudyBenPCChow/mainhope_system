import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import type { LucideIcon } from "lucide-react"
import { GraduationCap, Mail, Pencil, RefreshCw, Shield, Sparkles, UserCog } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
 Dialog,
 DialogContent,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { isSuperAdmin } from "@/lib/mgmtRole"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import { fetchTeacherOptions, type TeacherOption } from "@/services/classQueries"
import { listAppUsers, updateAppUser } from "@/services/queries"

export type AppUserRow = {
 id: string
 email: string | null
 display_name: string | null
 role: string
 teacher_id: string | null
 created_at: string
 updated_at: string
}

function asAppUser(row: Record<string, unknown>): AppUserRow {
 return {
  id: String(row.id ?? ""),
  email: row.email != null ? String(row.email) : null,
  display_name: row.display_name != null ? String(row.display_name) : null,
  role: String(row.role ?? "admin"),
  teacher_id: row.teacher_id != null ? String(row.teacher_id) : null,
  created_at: String(row.created_at ?? ""),
  updated_at: String(row.updated_at ?? ""),
 }
}

function formatUpdated(iso: string): string {
 if (!iso) return "—"
 try {
  return new Date(iso).toLocaleString("zh-Hant", {
   dateStyle: "short",
   timeStyle: "short",
  })
 } catch {
  return iso
 }
}

function roleMeta(role: string): { label: string; className: string; Icon: LucideIcon } {
 const r = role.trim().toLowerCase()
 if (r === "alien")
  return {
   label: "外星人",
   className: "border-violet-300 bg-violet-100 text-violet-950",
   Icon: Sparkles,
  }
 if (r === "teacher")
  return {
   label: "專班老師",
   className: "border-success bg-success text-success-foreground",
   Icon: GraduationCap,
  }
 return {
  label: "管理員",
  className: "border-slate-300 bg-slate-100 text-slate-900",
  Icon: Shield,
 }
}

const ROLE_OPTIONS = [
 { value: "admin", label: "管理員" },
 { value: "teacher", label: "專班老師" },
 { value: "alien", label: "外星人" },
] as const

export function UserManagementView() {
 const canEdit = isSuperAdmin()
 const [rows, setRows] = useState<AppUserRow[]>([])
 const [teachers, setTeachers] = useState<TeacherOption[]>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)
 const [editErr, setEditErr] = useState<string | null>(null)
 const [editOpen, setEditOpen] = useState(false)
 const [editing, setEditing] = useState<AppUserRow | null>(null)
 const [form, setForm] = useState({
  email: "",
  display_name: "",
  role: "admin",
  teacher_id: "",
 })
 const [saving, setSaving] = useState(false)

 const load = useCallback(async () => {
  if (!isSupabaseConfigured) {
   setRows([])
   setTeachers([])
   setLoading(false)
   return
  }
  setLoading(true)
  setErr(null)
  try {
   const [raw, tch] = await Promise.all([listAppUsers(), fetchTeacherOptions()])
   setRows((raw as Record<string, unknown>[]).map((r) => asAppUser(r)))
   setTeachers(tch)
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, {
    source: "UserManagementView.load",
    setErr,
    userMessage: msg,
   })
   setRows([])
  } finally {
   setLoading(false)
  }
 }, [])

 useEffect(() => {
  void load()
 }, [load])

 const sortedRows = useMemo(() => {
  const order = (r: string) => {
   const x = r.toLowerCase()
   if (x === "alien") return 0
   if (x === "admin") return 1
   if (x === "teacher") return 2
   return 9
  }
  return [...rows].sort((a, b) => {
   const d = order(a.role) - order(b.role)
   if (d !== 0) return d
   return (a.display_name ?? a.email ?? "").localeCompare(b.display_name ?? b.email ?? "", "zh-Hant")
  })
 }, [rows])

 const openEdit = (u: AppUserRow) => {
  if (!canEdit) return
  setErr(null)
  setEditErr(null)
  setEditing(u)
  setForm({
   email: u.email ?? "",
   display_name: u.display_name ?? "",
   role: u.role,
   teacher_id: u.teacher_id ?? "",
  })
  setEditOpen(true)
 }

 const saveEdit = async () => {
  if (!editing) return
  setSaving(true)
  setEditErr(null)
  try {
   await updateAppUser(editing.id, {
    email: form.email.trim() || null,
    display_name: form.display_name.trim() || null,
    role: form.role,
    teacher_id: form.teacher_id.trim() || null,
   })
   setEditOpen(false)
   setEditing(null)
   setEditErr(null)
   await load()
  } catch (e) {
   const msg = formatUnknownError(e)
   setEditErr(msg)
   reportUserFacingError(e, {
    source: "UserManagementView.saveEdit",
    setErr: setEditErr,
    userMessage: msg,
   })
  } finally {
   setSaving(false)
  }
 }

 const teacherOption = (id: string | null): TeacherOption | null => {
  if (!id) return null
  const t = teachers.find((x) => x.id === id)
  if (t) return t
  return { id, label: `${id.slice(0, 8)}…`, abbr: null }
 }

 function teacherSelectText(t: TeacherOption): string {
  const name = t.label.trim() || "（無姓名）"
  return t.abbr ? `${name} · ${t.abbr}` : name
 }

 if (!isSupabaseConfigured) {
  return (
   <div className="rounded-xl border border-amber-400/50 bg-amber-50 px-4 py-3 text-sm text-amber-950">
    尚未設定 Supabase，無法載入用戶。請建立 <code className="rounded bg-white/70 px-1">.env</code> 並重啟 dev。
   </div>
  )
 }

 return (
  <div className="space-y-6 p-4 md:p-6">
   <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border/80 pb-6">
    <div className="min-w-0 space-y-2">
     <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
      <UserCog className="h-8 w-8 shrink-0 text-info" aria-hidden />
      用戶管理
     </h1>
     <p className="max-w-prose text-sm text-muted-foreground md:text-base">
      資料來自 Supabase 表 <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">app_users</code>
      （後台演示身分；之後可併入 Auth）。
     </p>
     {canEdit ? (
      <p className="text-xs font-medium text-violet-800">
       您目前為<strong>外星人</strong>：可點卡片下方「編輯」修改顯示名稱、角色與綁定老師；下拉會顯示老師
       <abbr title="Abbreviation，內部簡稱／代碼">ABBR</abbr>
       。修改 ABBR 本身請至「老師」詳情。
      </p>
     ) : (
      <p className="text-xs text-muted-foreground">此頁僅供檢視；編輯需切換為外星人角色。</p>
     )}
    </div>
    <Button
     type="button"
     variant="outline"
     size="sm"
     className="gap-2 shrink-0"
     onClick={() => void load()}
     disabled={loading}
    >
     <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
     重新載入
    </Button>
   </header>

   {err ? (
    <div
     role="alert"
     className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
     {err}
    </div>
   ) : null}

   {loading ? (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
     {[1, 2, 3].map((i) => (
      <div
       key={i}
       className="h-48 animate-pulse rounded-2xl border border-border bg-muted/40"
       aria-hidden
      />
     ))}
    </div>
   ) : sortedRows.length === 0 ? (
    <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-12 text-center text-sm text-muted-foreground">
     目前沒有後台使用者。可於 Table Editor 新增，或執行 <code className="rounded bg-muted px-1">supabase db reset</code>{" "}
     套用種子資料。
    </p>
   ) : (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
     {sortedRows.map((u) => {
      const meta = roleMeta(u.role)
      const Icon = meta.Icon
      const tOpt = teacherOption(u.teacher_id)
      return (
       <article
        key={u.id}
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/90 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-info/60 hover:shadow-lg"
       >
        <div
         className={cn(
          "h-1.5 w-full bg-gradient-to-r",
          u.role.toLowerCase() === "alien"
           ? "from-violet-500 to-fuchsia-500"
           : u.role.toLowerCase() === "teacher"
            ? "from-emerald-500 to-teal-500"
            : "from-slate-400 to-slate-600"
         )}
         aria-hidden
        />
        <div className="flex flex-1 flex-col gap-4 p-5">
         <div className="flex items-start gap-3">
          <div
           className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 bg-gradient-to-br shadow-inner",
            meta.className
           )}
          >
           <Icon className="h-7 w-7 opacity-90" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
           <p className="truncate text-lg font-bold tracking-tight text-foreground">
            {u.display_name?.trim() || "（未命名）"}
           </p>
           <span
            className={cn(
             "mt-2 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
             meta.className
            )}
           >
            {meta.label}
            <span className="font-mono font-normal opacity-80">({u.role})</span>
           </span>
          </div>
         </div>

         <div className="space-y-2.5 text-sm">
          <div className="flex items-start gap-2 text-muted-foreground">
           <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
           <span className="min-w-0 break-all text-foreground">{u.email?.trim() || "—"}</span>
          </div>
          <div className="flex items-start gap-2 text-muted-foreground">
           <GraduationCap className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
           <span className="min-w-0 flex-1">
            {u.teacher_id && tOpt ? (
             <span className="block min-w-0">
              <Link
               to={`/Teachers/${u.teacher_id}`}
               className="font-medium text-primary underline-offset-4 hover:underline"
              >
               {tOpt.label.trim() || "（無姓名）"}
              </Link>
              {tOpt.abbr ? (
               <span className="mt-1 block font-mono text-xs text-info">
                <abbr title="內部簡稱／代碼（teachers.abbr）" className="no-underline">
                 ABBR
                </abbr>
                ：{tOpt.abbr}
               </span>
              ) : null}
             </span>
            ) : (
             <span className="text-muted-foreground">未綁定老師</span>
            )}
           </span>
          </div>
         </div>

         <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-4 text-xs text-muted-foreground">
          <span className="tabular-nums">更新 {formatUpdated(u.updated_at)}</span>
          {canEdit ? (
           <Button
            type="button"
            size="sm"
            variant="secondary"
            className="gap-1.5 shadow-sm"
            onClick={() => openEdit(u)}
           >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            編輯
           </Button>
          ) : null}
         </div>
        </div>
       </article>
      )
     })}
    </div>
   )}

   <Dialog
    open={editOpen}
    onOpenChange={(open) => {
     if (!open && !saving) {
      setEditOpen(false)
      setEditing(null)
      setEditErr(null)
     }
    }}
   >
    <DialogContent className="max-w-md gap-0 overflow-hidden border-info p-0 sm:rounded-xl">
     <div className="bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-4 text-white">
      <DialogHeader className="space-y-1 text-left">
       <DialogTitle className="text-lg font-semibold text-white">編輯後台使用者</DialogTitle>
       <p className="text-xs font-normal text-white/85">
        {editing?.display_name ?? editing?.email ?? editing?.id.slice(0, 8)}
       </p>
      </DialogHeader>
     </div>
     <div className="space-y-4 px-6 py-5 text-sm">
      <label className="grid gap-1.5">
       <span className="text-xs font-medium text-muted-foreground">Email</span>
       <Input
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        placeholder="選填"
        className="h-10"
       />
      </label>
      <label className="grid gap-1.5">
       <span className="text-xs font-medium text-muted-foreground">顯示名稱</span>
       <Input
        value={form.display_name}
        onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
        placeholder="選填"
        className="h-10"
       />
      </label>
      <label className="grid gap-1.5">
       <span className="text-xs font-medium text-muted-foreground">角色</span>
       <Select
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={form.role}
        onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
       >
        {ROLE_OPTIONS.map((o) => (
         <option key={o.value} value={o.value}>
          {o.label}
         </option>
        ))}
       </Select>
      </label>
      <label className="grid gap-1.5">
       <span className="text-xs font-medium text-muted-foreground">
        綁定老師
        <span className="ml-1 font-normal text-muted-foreground/90">
         （選項含 <abbr title="Abbreviation，內部簡稱">ABBR</abbr>）
        </span>
       </span>
       <Select
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={form.teacher_id}
        onChange={(e) => setForm((f) => ({ ...f, teacher_id: e.target.value }))}
       >
        <option value="">不綁定</option>
        {teachers.map((t) => (
         <option key={t.id} value={t.id}>
          {teacherSelectText(t)}
         </option>
        ))}
       </Select>
       {form.teacher_id.trim() ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
         目前選中老師的{" "}
         <abbr title="teachers 表欄位 abbr，內部簡稱／代碼" className="font-mono no-underline">
          ABBR
         </abbr>
         ：
         <span className="font-mono text-foreground">
          {teachers.find((x) => x.id === form.teacher_id)?.abbr ?? "—"}
         </span>
         。若要修改 ABBR，請至{" "}
         <Link to={`/Teachers/${form.teacher_id}`} className="text-primary underline-offset-4 hover:underline">
          該老師詳情頁
         </Link>
         。
        </p>
       ) : null}
      </label>
      {editErr ? (
       <div
        role="alert"
        className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
       >
        {editErr}
       </div>
      ) : null}
     </div>
     <DialogFooter className="flex border-t border-border bg-muted/30 px-6 py-4 sm:justify-end">
      <Button
       type="button"
       variant="outline"
       disabled={saving}
       onClick={() => {
        setEditOpen(false)
        setEditing(null)
        setEditErr(null)
       }}
      >
       取消
      </Button>
      <Button
       type="button"
       className="bg-info text-white hover:bg-info"
       disabled={saving}
       onClick={() => void saveEdit()}
      >
       {saving ? "儲存中…" : "儲存"}
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </div>
 )
}
