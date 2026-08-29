import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import type { LucideIcon } from "lucide-react"
import {
 BookOpen,
 GraduationCap,
 KeyRound,
 Mail,
 Pencil,
 Plus,
 RefreshCw,
 Shield,
 Sparkles,
 UserCog,
 Wallet,
} from "lucide-react"

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
import { Tag, type TagTone } from "@/components/ui/tag"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { useAuth } from "@/lib/authBootstrap"
import { can } from "@/lib/authzProfile"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { statusToTagTone } from "@/lib/statusTag"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import { fetchTeacherOptions, type TeacherOption } from "@/services/classQueries"
import { createTeacherMgmtUser, resetMgmtUserPassword } from "@/services/mgmtUserQueries"
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

function roleMeta(role: string): { label: string; tone: TagTone; Icon: LucideIcon; iconClass: string } {
 const r = role.trim().toLowerCase()
 if (r === "alien")
  return {
   label: "外星人",
   tone: statusToTagTone("外星人"),
   Icon: Sparkles,
   iconClass: "border-info/30 bg-info/15 text-info",
  }
 if (r === "manager")
  return {
   label: "管理層",
   tone: statusToTagTone("管理員"),
   Icon: Shield,
   iconClass: "border-primary/30 bg-primary/10 text-primary",
  }
 if (r === "finance")
  return {
   label: "財務",
   tone: statusToTagTone("管理員"),
   Icon: Wallet,
   iconClass: "border-warning/30 bg-warning/15 text-warning",
  }
 if (r === "teacher")
  return {
   label: "專班老師",
   tone: statusToTagTone("老師"),
   Icon: GraduationCap,
   iconClass: "border-success/30 bg-success/15 text-success",
  }
 return {
  label: "管理員",
  tone: statusToTagTone("管理員"),
  Icon: Shield,
  iconClass: "border-border bg-muted text-muted-foreground",
 }
}

const ROLE_OPTIONS = [
 { value: "admin", label: "管理員" },
 { value: "manager", label: "管理層" },
 { value: "finance", label: "財務" },
 { value: "teacher", label: "專班老師" },
 { value: "alien", label: "外星人" },
] as const

function canResetPassword(u: AppUserRow): boolean {
 const role = u.role.trim().toLowerCase()
 if (role === "student") return false
 return Boolean(u.email?.trim())
}

type CreateUserKind = "specialty" | "homework"

export function UserManagementView() {
 const { profile } = useAuth()
 const canEdit = can(profile?.activeCapabilities, "users.manage")
 const { pushBanner } = useAppBanner()
 const { confirmDialog } = useAppConfirm()
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
 const [createOpen, setCreateOpen] = useState(false)
 const [createKind, setCreateKind] = useState<CreateUserKind>("specialty")
 const [createErr, setCreateErr] = useState<string | null>(null)
 const [creating, setCreating] = useState(false)
 const [createdCredential, setCreatedCredential] = useState<{
  email: string
  displayName: string
  temporaryPassword: string
  teacherName: string
  homeworkTutoringNav: boolean
  warning?: string
 } | null>(null)
 const [createForm, setCreateForm] = useState({
  email: "",
  display_name: "",
  teacher_id: "",
 })
  const [resettingId, setResettingId] = useState<string | null>(null)
  const [resetCredential, setResetCredential] = useState<{
   email: string
   displayName: string
   temporaryPassword: string
   provisioned: boolean
  } | null>(null)
  const [resetOpen, setResetOpen] = useState(false)

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
   if (x === "manager") return 2
   if (x === "teacher") return 3
   return 9
  }
  return [...rows].sort((a, b) => {
   const d = order(a.role) - order(b.role)
   if (d !== 0) return d
   return (a.display_name ?? a.email ?? "").localeCompare(b.display_name ?? b.email ?? "", "zh-Hant")
  })
 }, [rows])

 const teacherUserMap = useMemo(() => {
  const out = new Map<string, AppUserRow>()
  for (const row of rows) {
   if (row.role.trim().toLowerCase() !== "teacher" || !row.teacher_id) continue
   out.set(row.teacher_id, row)
  }
  return out
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

 const selectedCreateTeacher = teachers.find((t) => t.id === createForm.teacher_id) ?? null
 const existingTeacherUser = createForm.teacher_id ? teacherUserMap.get(createForm.teacher_id) ?? null : null

 const resetCreateForm = () => {
  setCreateForm({ email: "", display_name: "", teacher_id: "" })
  setCreateErr(null)
  setCreatedCredential(null)
 }

 const openCreate = (kind: CreateUserKind) => {
  if (!canEdit) return
  setErr(null)
  setCreateKind(kind)
  resetCreateForm()
  setCreateOpen(true)
 }

 const isHomeworkCreate = createKind === "homework"

  const resetPassword = async (u: AppUserRow) => {
   if (!canEdit || !canResetPassword(u)) return
   const label = u.display_name?.trim() || u.email || "此用戶"
   const ok = await confirmDialog({
    title: "重設密碼",
    description: `確定要為「${label}」產生新臨時密碼？若此用戶尚未有登入帳號會一併建立；舊密碼將立即失效，臨時密碼只會顯示一次。`,
    confirmText: "確認重設",
    tone: "destructive",
   })
   if (!ok) return

   setResettingId(u.id)
   setErr(null)
   try {
    const result = await resetMgmtUserPassword({
     appUserId: u.id,
     email: u.email,
    })
    if (!result.ok) {
     setErr(result.message)
     pushBanner({
      tone: "error",
      title: "重設密碼失敗",
      message: `無法為「${label}」重設密碼：${result.message}`,
     })
     return
    }
    setResetCredential({
     email: result.email,
     displayName: result.displayName || label,
     temporaryPassword: result.temporaryPassword,
     provisioned: result.provisioned,
    })
    setResetOpen(true)
    pushBanner({
     tone: "success",
     title: result.provisioned ? "已建立登入並產生臨時密碼" : "已重設密碼",
     message: `${result.displayName || result.email} 的臨時密碼已產生，請安全交給對方。`,
    })
    await load()
   } catch (e) {
    const msg = formatUnknownError(e)
    reportUserFacingError(e, {
     source: "UserManagementView.resetPassword",
     setErr,
     userMessage: msg,
    })
    pushBanner({
     tone: "error",
     title: "重設密碼失敗",
     message: `無法為「${label}」重設密碼：${msg}`,
    })
   } finally {
    setResettingId(null)
   }
  }

 const saveCreate = async () => {
  const email = createForm.email.trim().toLowerCase()
  const teacherId = createForm.teacher_id.trim()
  if (!email) {
   setCreateErr("請輸入電郵。")
   return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
   setCreateErr("請輸入有效電郵。")
   return
  }
  if (!teacherId) {
   setCreateErr("請選擇要綁定的老師。")
   return
  }
  if (existingTeacherUser) {
   setCreateErr("此老師已綁定一個老師用戶，請改用編輯流程。")
   return
  }

  setCreating(true)
  setCreateErr(null)
  try {
   const result = await createTeacherMgmtUser({
    email,
    displayName: createForm.display_name.trim() || selectedCreateTeacher?.label || null,
    teacherId,
    enableHomeworkTutoringNav: isHomeworkCreate,
   })
   if (!result.ok) {
    setCreateErr(result.message)
    return
   }
   setCreatedCredential({
    email: result.email,
    displayName: result.displayName,
    temporaryPassword: result.temporaryPassword,
    teacherName: result.teacherName,
    homeworkTutoringNav: result.homeworkTutoringNav,
    warning: result.warning,
   })
   pushBanner({
    tone: result.warning ? "warning" : "success",
    title: isHomeworkCreate ? "已建立功輔班導師登入帳號" : "已建立專班老師登入帳號",
    message: result.warning
     ? result.warning
     : isHomeworkCreate
       ? `${result.displayName || result.email} 已可用新帳號登入，並已開啟功課輔導側欄；臨時密碼只會顯示一次。`
       : `${result.displayName || result.email} 已可用新帳號登入，臨時密碼只會顯示一次。`,
   })
   await load()
  } catch (e) {
   const msg = formatUnknownError(e)
   setCreateErr(msg)
   reportUserFacingError(e, {
    source: "UserManagementView.saveCreate",
    setErr: setCreateErr,
    userMessage: msg,
   })
  } finally {
   setCreating(false)
  }
 }

 if (!isSupabaseConfigured) {
  return (
   <div className="rounded-xl border border-amber-400/50 bg-amber-50 px-4 py-3 text-sm text-amber-950">
    尚未設定 Supabase，無法載入用戶。請建立 <code className="rounded bg-white/70 px-1">.env</code> 並重啟 dev。
   </div>
  )
 }

 return (
  <div className="space-y-6 md:p-6">
   <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border/80 pb-6">
    <div className="min-w-0 space-y-2">
     <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
      <UserCog className="h-8 w-8 shrink-0 text-info" aria-hidden />
      用戶管理
     </h1>
     <p className="hidden max-w-prose text-sm text-muted-foreground md:block md:text-base">
      資料來自 Supabase 表 <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">app_users</code>
      ，登入憑證由 Supabase Auth 管理。
     </p>
     {canEdit ? (
      <p className="text-xs font-medium text-info">
       您目前為<strong>外星人</strong>：可編輯顯示名稱／角色／綁定老師，或為既有用戶「重設密碼」產生臨時密碼。
      </p>
     ) : (
      <p className="text-xs text-muted-foreground">此頁僅供檢視；編輯與重設密碼需外星人角色。</p>
     )}
    </div>
    <div className="flex shrink-0 flex-wrap gap-2">
     {canEdit ? (
      <>
       <Button
        type="button"
        size="sm"
        className="gap-2 bg-success text-white hover:bg-success"
        onClick={() => openCreate("specialty")}
       >
        <Plus className="h-4 w-4" aria-hidden />
        新增專班老師用戶
       </Button>
       <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-2 border-info/50 text-info hover:bg-info/10"
        onClick={() => openCreate("homework")}
       >
        <BookOpen className="h-4 w-4" aria-hidden />
        新增功輔班導師用戶
       </Button>
      </>
     ) : null}
     <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => void load()}
      disabled={loading}
     >
      <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
      重新載入
     </Button>
    </div>
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
     目前沒有後台使用者。
     {canEdit ? "可直接用右上角按鈕建立專班老師或功輔班導師登入帳號。" : null}
    </p>
   ) : (
    <StaggerList as="div" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
     {sortedRows.map((u) => {
      const meta = roleMeta(u.role)
      const Icon = meta.Icon
      const tOpt = teacherOption(u.teacher_id)
      return (
       <StaggerItem
        key={u.id}
        as="article"
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/90 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-info/60 hover:shadow-lg"
       >
        <div
         className={cn(
          "h-1.5 w-full",
          u.role.toLowerCase() === "alien"
           ? "bg-info"
           : u.role.toLowerCase() === "manager"
            ? "bg-primary"
           : u.role.toLowerCase() === "teacher"
            ? "bg-success"
            : "bg-muted-foreground/40"
         )}
         aria-hidden
        />
        <div className="flex flex-1 flex-col gap-4 p-5">
         <div className="flex items-start gap-3">
          <div
           className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 shadow-inner",
            meta.iconClass
           )}
          >
           <Icon className="h-7 w-7 opacity-90" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
           <p className="truncate text-lg font-bold tracking-tight text-foreground">
            {u.display_name?.trim() || "（未命名）"}
           </p>
           <Tag tone={meta.tone} size="sm" className="mt-2">
            {meta.label}
            <span className="font-mono font-normal opacity-80"> ({u.role})</span>
           </Tag>
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
           <div className="flex flex-wrap gap-2">
            {canResetPassword(u) ? (
             <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5 shadow-sm"
              disabled={resettingId === u.id}
              onClick={() => void resetPassword(u)}
             >
              <KeyRound className="h-3.5 w-3.5" aria-hidden />
              {resettingId === u.id ? "重設中…" : "重設密碼"}
             </Button>
            ) : null}
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
           </div>
          ) : null}
         </div>
        </div>
       </StaggerItem>
      )
     })}
    </StaggerList>
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

   <Dialog
    open={resetOpen}
    onOpenChange={(open) => {
     if (!open) {
      setResetOpen(false)
      setResetCredential(null)
     }
    }}
   >
    <DialogContent className="max-w-md gap-0 overflow-hidden border-warning p-0 sm:rounded-xl">
     <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 text-white">
      <DialogHeader className="space-y-1 text-left">
       <DialogTitle className="text-lg font-semibold text-white">
        {resetCredential?.provisioned ? "登入帳號已建立" : "密碼已重設"}
       </DialogTitle>
       <p className="text-xs font-normal text-white/85">臨時密碼只顯示一次，請立即安全交給對方。</p>
      </DialogHeader>
     </div>
     <div className="space-y-3 px-6 py-5 text-sm">
      {resetCredential ? (
       <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-foreground">
        <p className="mt-0 break-all">
         <span className="text-muted-foreground">用戶：</span>
         {resetCredential.displayName || "—"}
        </p>
        <p className="mt-1 break-all">
         <span className="text-muted-foreground">電郵：</span>
         {resetCredential.email}
        </p>
        <p className="mt-1 break-all">
         <span className="text-muted-foreground">臨時密碼：</span>
         <span className="font-mono text-foreground">{resetCredential.temporaryPassword}</span>
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
         {resetCredential.provisioned
          ? "此用戶原本沒有登入帳號，已一併建立；關閉此視窗後系統不會再次顯示。"
          : "舊密碼已失效；關閉此視窗後系統不會再次顯示。"}
        </p>
       </div>
      ) : null}
     </div>
     <DialogFooter className="flex border-t border-border bg-muted/30 px-6 py-4 sm:justify-end">
      <Button
       type="button"
       onClick={() => {
        setResetOpen(false)
        setResetCredential(null)
       }}
      >
       完成
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>

   <Dialog
    open={createOpen}
    onOpenChange={(open) => {
     if (!open && !creating) {
      setCreateOpen(false)
      resetCreateForm()
     }
    }}
   >
    <DialogContent
     className={cn(
      "max-w-lg gap-0 overflow-hidden p-0 sm:rounded-xl",
      isHomeworkCreate ? "border-info" : "border-success"
     )}
    >
     <div
      className={cn(
       "px-6 py-4 text-white",
       isHomeworkCreate
        ? "bg-gradient-to-r from-sky-600 to-cyan-600"
        : "bg-gradient-to-r from-emerald-600 to-teal-600"
      )}
     >
      <DialogHeader className="space-y-1 text-left">
       <DialogTitle className="text-lg font-semibold text-white">
        {isHomeworkCreate ? "新增功輔班導師登入帳號" : "新增專班老師登入帳號"}
       </DialogTitle>
       <p className="text-xs font-normal text-white/85">
        系統會同步建立 Supabase Auth 與 app_users，臨時密碼只顯示一次。
        {isHomeworkCreate ? "並會開啟功課輔導側欄入口。" : ""}
       </p>
      </DialogHeader>
     </div>
     <div className="space-y-4 px-6 py-5 text-sm">
      <label className="grid gap-1.5">
       <span className="text-xs font-medium text-muted-foreground">綁定老師</span>
       <Select
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={createForm.teacher_id}
        onChange={(e) => {
         const nextTeacherId = e.target.value
         const nextTeacher = teachers.find((t) => t.id === nextTeacherId) ?? null
         setCreateForm((f) => ({
          ...f,
          teacher_id: nextTeacherId,
          display_name: f.display_name.trim() ? f.display_name : nextTeacher?.label ?? "",
         }))
        }}
        disabled={creating || createdCredential !== null}
       >
        <option value="">請選擇老師</option>
        {teachers.map((t) => (
         <option key={t.id} value={t.id}>
          {teacherSelectText(t)}
         </option>
        ))}
       </Select>
       {selectedCreateTeacher ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
         目前選中老師的{" "}
         <abbr title="teachers 表欄位 abbr，內部簡稱／代碼" className="font-mono no-underline">
          ABBR
         </abbr>
         ：
         <span className="font-mono text-foreground">{selectedCreateTeacher.abbr ?? "—"}</span>
         。
        </p>
       ) : null}
       {existingTeacherUser ? (
        <p className="text-xs text-destructive">
         此老師已綁定用戶：{existingTeacherUser.display_name?.trim() || existingTeacherUser.email || "（未命名）"}
        </p>
       ) : null}
      </label>
      <label className="grid gap-1.5">
       <span className="text-xs font-medium text-muted-foreground">登入電郵</span>
       <Input
        type="email"
        value={createForm.email}
        onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
        placeholder="teacher@example.com"
        className="h-10"
        disabled={creating || createdCredential !== null}
       />
      </label>
      <label className="grid gap-1.5">
       <span className="text-xs font-medium text-muted-foreground">顯示名稱</span>
       <Input
        value={createForm.display_name}
        onChange={(e) => setCreateForm((f) => ({ ...f, display_name: e.target.value }))}
        placeholder="預設使用老師姓名"
        className="h-10"
        disabled={creating || createdCredential !== null}
       />
      </label>
      <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
       {isHomeworkCreate
        ? "建立後會設定角色為「專班老師」、綁定所選老師，並開啟功課輔導側欄（報更／我的當值）。請把臨時密碼安全地交給對方，首次登入後再自行更改。若老師主檔尚未建立，請先到「老師」頁新增。"
        : "建立後會自動設定角色為「專班老師」，並綁定所選老師。請把臨時密碼安全地交給該老師，首次登入後再自行更改。"}
      </div>
      {createdCredential ? (
       <div
        className={cn(
         "rounded-lg px-4 py-3 text-sm text-foreground",
         createdCredential.warning
          ? "border border-warning/40 bg-warning/10"
          : "border border-success/40 bg-success/10"
        )}
       >
        <p className={cn("font-medium", createdCredential.warning ? "text-warning" : "text-success")}>
         {createdCredential.warning ? "帳號已建立（功輔入口需手動補）" : "帳號已建立"}
        </p>
        <p className="mt-2 break-all">
         <span className="text-muted-foreground">老師：</span>
         {createdCredential.teacherName || "—"}
        </p>
        <p className="mt-1 break-all">
         <span className="text-muted-foreground">電郵：</span>
         {createdCredential.email}
        </p>
        <p className="mt-1 break-all">
         <span className="text-muted-foreground">臨時密碼：</span>
         <span className="font-mono text-foreground">{createdCredential.temporaryPassword}</span>
        </p>
        {isHomeworkCreate ? (
         <p className="mt-1 text-xs text-muted-foreground">
          功輔側欄：
          {createdCredential.homeworkTutoringNav ? "已開啟" : "未開啟（請到功課輔導設定剔選）"}
         </p>
        ) : null}
        {createdCredential.warning ? (
         <p className="mt-2 text-xs text-warning">{createdCredential.warning}</p>
        ) : null}
        <p className="mt-2 text-xs text-muted-foreground">請立即記下臨時密碼；關閉此視窗後系統不會再次顯示。</p>
       </div>
      ) : null}
      {createErr ? (
       <div
        role="alert"
        className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
       >
        {createErr}
       </div>
      ) : null}
     </div>
     <DialogFooter className="flex border-t border-border bg-muted/30 px-6 py-4 sm:justify-end">
      <Button
       type="button"
       variant="outline"
       disabled={creating}
       onClick={() => {
        setCreateOpen(false)
        resetCreateForm()
       }}
      >
       {createdCredential ? "完成" : "取消"}
      </Button>
      {createdCredential ? null : (
       <Button
        type="button"
        className={
         isHomeworkCreate
          ? "bg-info text-white hover:bg-info"
          : "bg-success text-white hover:bg-success"
        }
        disabled={creating}
        onClick={() => void saveCreate()}
       >
        {creating ? "建立中…" : "建立帳號"}
       </Button>
      )}
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </div>
 )
}
