import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Mail, Phone, Plus, User, Users } from "lucide-react"

import { isSuperAdmin } from "@/lib/mgmtRole"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { useAppConfirm } from "@/lib/appConfirm"
import { statusToTagTone } from "@/lib/statusTag"
import {
 deleteTeacher,
 fetchAllTeachers,
 insertTeacher,
 type TeacherRecord,
} from "@/services/teacherQueries"

const SUBJECT_SPECIALITY_OPTIONS = [
 "中文",
 "英文",
 "數學",
 "綜合科學",
 "物理",
 "化學",
 "生物",
 "M2",
 "BAFS",
 "中史",
 "歷史",
 "地理",
 "經濟",
 "ICT",
] as const

export function TeachersListPage() {
 const navigate = useNavigate()
 const { confirmDialog } = useAppConfirm()
 const [rows, setRows] = useState<TeacherRecord[]>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)
 const [addOpen, setAddOpen] = useState(false)
 const [form, setForm] = useState({
  full_name: "",
  english_name: "",
  abbr: "",
  phone: "",
  email: "",
  status: "在職",
 })
 const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])

 const load = useCallback(async () => {
  setLoading(true)
  setErr(null)
  try {
   setRows(await fetchAllTeachers())
  } catch (e) {
   reportUserFacingError(e, { source: "TeachersListPage.load", setErr })
  } finally {
   setLoading(false)
  }
 }, [])

 useEffect(() => {
  void load()
 }, [load])

 const onAdd = async () => {
  if (!form.full_name.trim()) return
  const subjects = selectedSubjects
  setErr(null)
  try {
   await insertTeacher({
    full_name: form.full_name.trim(),
    english_name: form.english_name.trim() || null,
    abbr: form.abbr.trim() || null,
    phone: form.phone.trim() || null,
    email: form.email.trim() || null,
    status: form.status,
    subject_speciality: subjects.length ? subjects : null,
   })
   setAddOpen(false)
   setForm({
    full_name: "",
    english_name: "",
    abbr: "",
    phone: "",
    email: "",
    status: "在職",
   })
   setSelectedSubjects([])
   await load()
  } catch (e) {
   reportUserFacingError(e, { source: "TeachersListPage.onAdd", setErr })
  }
 }

 const onDelete = async (e: React.MouseEvent, id: string) => {
  e.stopPropagation()
 if (
  !(await confirmDialog({
   title: "刪除老師",
   description: "確定刪除此老師？若班級仍指向該老師，請先改派。",
   confirmText: "確認刪除",
   tone: "destructive",
  }))
 )
  return
  try {
   await deleteTeacher(id)
   await load()
  } catch (er) {
   reportUserFacingError(er, { source: "TeachersListPage.onDelete", setErr })
  }
 }

 return (
  <div className="space-y-6 p-4 md:p-6">
   {!isSupabaseConfigured ? (
    <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm">
     請設定純文字 <code className="rounded bg-muted px-1">.env</code> 後重啟 dev。
    </div>
   ) : null}
   {err ? (
    <div
     role="alert"
     tabIndex={-1}
     className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
    >
     {err}
    </div>
   ) : null}

   <div className="flex flex-wrap items-center justify-between gap-4">
    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
     <Users className="h-7 w-7 shrink-0 text-primary" aria-hidden />
     老師管理
    </h1>
    {isSuperAdmin() ? (
     <Dialog open={addOpen} onOpenChange={setAddOpen}>
      <DialogTrigger asChild>
       <Button type="button" className="bg-success text-white hover:bg-success">
        <Plus className="h-4 w-4" />
        新增老師
       </Button>
      </DialogTrigger>
      <DialogContent>
       <DialogHeader>
        <DialogTitle>新增老師</DialogTitle>
       </DialogHeader>
       <div className="grid gap-3">
        <div>
         <label className="text-xs font-medium text-muted-foreground">中文姓名 *</label>
         <Input
          className="mt-1"
          value={form.full_name}
          onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
         />
        </div>
        <div>
         <label className="text-xs font-medium text-muted-foreground">英文姓名</label>
         <Input
          className="mt-1"
          value={form.english_name}
          onChange={(e) => setForm((f) => ({ ...f, english_name: e.target.value }))}
         />
        </div>
        <div>
         <label className="text-xs font-medium text-muted-foreground">
          內部簡稱（ABBR）
         </label>
         <Input
          className="mt-1 font-mono text-sm uppercase"
          spellCheck={false}
          maxLength={64}
          placeholder="選填，例：JUDY"
          value={form.abbr}
          onChange={(e) => setForm((f) => ({ ...f, abbr: e.target.value }))}
         />
         <p className="mt-1 text-xs text-muted-foreground">最多 64 字元；可留空。</p>
        </div>
        <div>
         <label className="text-xs font-medium text-muted-foreground">電話</label>
         <Input
          className="mt-1"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
         />
        </div>
        <div>
         <label className="text-xs font-medium text-muted-foreground">電郵</label>
         <Input
          className="mt-1"
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
         />
        </div>
        <div>
         <label className="text-xs font-medium text-muted-foreground">狀態</label>
         <Select
          className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          value={form.status === "非在職" ? "非在職" : "在職"}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
         >
          <option value="在職">在職</option>
          <option value="非在職">非在職</option>
         </Select>
        </div>
        <div>
         <label className="text-xs font-medium text-muted-foreground">專長科目</label>
         <div className="mt-2 flex flex-wrap gap-2">
          {SUBJECT_SPECIALITY_OPTIONS.map((subject) => {
           const active = selectedSubjects.includes(subject)
           return (
            <button
             key={subject}
             type="button"
             onClick={() => {
              setSelectedSubjects((prev) => {
               if (prev.includes(subject)) return prev.filter((x) => x !== subject)
               return SUBJECT_SPECIALITY_OPTIONS.filter((x) => [...prev, subject].includes(x))
              })
             }}
             className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              active
               ? "border-info bg-info text-info-foreground"
               : "border-border bg-card text-foreground hover:bg-muted/80"
             )}
             aria-pressed={active}
            >
             {subject}
            </button>
           )
          })}
         </div>
         <div className="mt-2 flex flex-wrap gap-1">
          {selectedSubjects.length === 0 ? (
           <span className="text-xs text-muted-foreground">尚未選擇專長科目</span>
          ) : (
           selectedSubjects.map((sub) => (
            <Tag key={sub} tone="info" size="sm">{sub}</Tag>
           ))
          )}
         </div>
        </div>
        <Button type="button" onClick={() => void onAdd()}>
         建立
        </Button>
       </div>
      </DialogContent>
     </Dialog>
    ) : null}
   </div>

   {loading ? (
    <p className="text-sm text-muted-foreground">載入中…</p>
   ) : rows.length === 0 ? (
    <p className="text-sm text-muted-foreground">
     {isSuperAdmin()
      ? "尚無老師資料，請新增。"
      : "尚無老師資料。新增老師僅限「外星人」帳號操作。"}
    </p>
   ) : (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
     {rows.map((t) => (
      <article
       key={t.id}
       role="button"
       tabIndex={0}
       onClick={() => navigate(`/Teachers/${t.id}`)}
       onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
         e.preventDefault()
         navigate(`/Teachers/${t.id}`)
        }
       }}
       className="flex cursor-pointer flex-col rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
      >
       <div className="relative flex gap-3 border-b border-border p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
         <User className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
         <div className="font-semibold text-foreground">{t.full_name}</div>
         {t.english_name ? (
          <div className="text-sm text-muted-foreground">{t.english_name}</div>
         ) : null}
         {t.abbr ? (
          <div className="mt-1 font-mono text-xs text-info">ABBR：{t.abbr}</div>
         ) : null}
        </div>
        <Tag tone={statusToTagTone(t.status)} size="sm" className="absolute right-3 top-3">
         {t.status ?? "—"}
        </Tag>
       </div>
       <div className="flex flex-1 flex-col gap-2 p-4 text-sm">
        {t.phone ? (
         <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4 shrink-0" />
          <span className="tabular-nums text-foreground">{t.phone}</span>
         </div>
        ) : null}
        {t.email ? (
         <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
          <Mail className="h-4 w-4 shrink-0" />
          <span className="truncate text-foreground">{t.email}</span>
         </div>
        ) : null}
        <div className="flex flex-wrap gap-1 pt-1">
         {(t.subject_speciality ?? []).map((sub) => (
          <Tag key={sub} tone="info" size="sm">{sub}</Tag>
         ))}
        </div>
       </div>
       <div className="flex justify-between border-t border-border px-4 py-3 text-sm">
        <Link
         to={`/Teachers/${t.id}`}
         className="font-medium text-primary hover:underline"
         onClick={(e) => e.stopPropagation()}
        >
         編輯
        </Link>
        {isSuperAdmin() ? (
         <button
          type="button"
          className="font-medium text-destructive hover:underline"
          onClick={(e) => void onDelete(e, t.id)}
         >
          刪除
         </button>
        ) : null}
       </div>
      </article>
     ))}
    </div>
   )}

   <p className="text-xs text-muted-foreground">點選卡片進入老師詳細資料。</p>
  </div>
 )
}
