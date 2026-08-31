import { useCallback, useEffect, useState } from "react"
import { CircleUser, Mail, Phone, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/authBootstrap"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import { SUBJECT_SPECIALITY_OPTIONS } from "@/lib/teacherSubjectSpeciality"
import { cn } from "@/lib/utils"
import {
 getTeacherById,
 type TeacherRecord,
 updateTeacher,
} from "@/services/teacherQueries"

export default function TeacherProfilePage() {
 const { profile } = useAuth()
 const teacherId = getTeacherScopeTeacherId(profile)
 const [teacher, setTeacher] = useState<TeacherRecord | null>(null)
 const [form, setForm] = useState<Partial<TeacherRecord>>({})
 const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
 const [loading, setLoading] = useState(true)
 const [saving, setSaving] = useState(false)
 const [err, setErr] = useState<string | null>(null)
 const [okMsg, setOkMsg] = useState<string | null>(null)

 const reload = useCallback(async () => {
  if (!isSupabaseConfigured || !teacherId) {
   setLoading(false)
   return
  }
  setLoading(true)
  setErr(null)
  try {
   const t = await getTeacherById(teacherId)
   setTeacher(t)
   if (t) {
    setForm(t)
    setSelectedSubjects(t.subject_speciality ?? [])
   } else {
    setForm({})
    setSelectedSubjects([])
   }
  } catch (e) {
   reportUserFacingError(e, { source: "TeacherProfile.reload", setErr })
   setTeacher(null)
  } finally {
   setLoading(false)
  }
 }, [teacherId])

 useEffect(() => {
  void reload()
 }, [reload])

 const save = async () => {
  if (!teacherId || !teacher) return
  const subjects = selectedSubjects
  setSaving(true)
  setErr(null)
  setOkMsg(null)
  try {
   const updated = await updateTeacher(teacherId, {
    phone: form.phone?.trim() ? form.phone.trim() : null,
    subject_speciality: subjects.length ? subjects : null,
    remarks: form.remarks?.trim() ? form.remarks.trim() : null,
   })
   setTeacher(updated)
   setForm(updated)
   setSelectedSubjects(updated.subject_speciality ?? [])
   setOkMsg("已儲存")
   window.setTimeout(() => setOkMsg(null), 4000)
  } catch (e) {
   reportUserFacingError(e, { source: "TeacherProfile.save", setErr })
  } finally {
   setSaving(false)
  }
 }

 if (!teacherId) {
  return (
   <div className="rounded-xl border border-warning/50 bg-warning/10 p-6 text-warning-foreground">
    <p className="font-medium">此頁僅供專班老師使用。請以老師身分登入。</p>
   </div>
  )
 }

 if (!isSupabaseConfigured) {
  return (
   <div className="rounded-xl border border-warning/50 bg-warning/10 p-6 text-warning-foreground">
    <p>尚未設定 Supabase，無法載入個人資料。</p>
   </div>
  )
 }

 return (
  <div className="space-y-6 p-4 md:p-6">
   <header className="flex flex-wrap items-start justify-between gap-4">
    <div className="min-w-0">
     <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
      <CircleUser className="h-7 w-7 shrink-0 text-primary" aria-hidden />
      個人資料
     </h1>
     <p className="mt-1 text-sm text-muted-foreground">
      您可修改電話、專長科目及備註；姓名、電郵、狀態等由管理員維護。
     </p>
     {teacher ? (
      <p className="mt-2 font-mono text-xs text-muted-foreground">教師編號：{teacher.id}</p>
     ) : null}
    </div>
   </header>

   {err ? (
    <div
     role="alert"
     tabIndex={-1}
     className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
    >
     {err}
    </div>
   ) : null}
   {okMsg ? (
    <div
     role="status"
     className="rounded-lg border border-success bg-success px-4 py-3 text-sm text-success"
    >
     {okMsg}
    </div>
   ) : null}

   {loading ? (
    <p className="text-muted-foreground">載入中…</p>
   ) : !teacher ? (
    <p className="text-muted-foreground">找不到您的教師檔案，請聯絡管理員。</p>
   ) : (
    <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
     <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
       <label className="text-xs font-medium text-muted-foreground">中文姓名 *</label>
       <div className="relative mt-1">
        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
         className="pl-9 bg-muted/50"
         readOnly
         disabled
         value={form.full_name ?? ""}
        />
       </div>
      </div>
      <div className="sm:col-span-2">
       <label className="text-xs font-medium text-muted-foreground">英文姓名</label>
       <Input
        className="mt-1 bg-muted/50"
        readOnly
        disabled
        value={form.english_name ?? ""}
        placeholder="—"
       />
      </div>
      <div className="sm:col-span-2">
       <label className="text-xs font-medium text-muted-foreground">內部簡稱（ABBR）</label>
       <Input
        className="mt-1 bg-muted/50 font-mono text-sm"
        readOnly
        disabled
        value={teacher.abbr ?? ""}
        placeholder="尚未設定"
        title="此欄僅能由「外星人」管理員設定，無法自行修改。"
       />
      </div>
      <div>
       <label className="text-xs font-medium text-muted-foreground">電話</label>
       <div className="relative mt-1">
        <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
         className="pl-9"
         value={form.phone ?? ""}
         onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
         placeholder="例：9000-1234"
        />
       </div>
      </div>
      <div>
       <label className="text-xs font-medium text-muted-foreground">電郵</label>
       <div className="relative mt-1">
        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
         className="pl-9 bg-muted/50"
         readOnly
         disabled
         type="email"
         value={form.email ?? ""}
         placeholder="—"
        />
       </div>
      </div>
     </div>

     <div>
      <label className="text-xs font-medium text-muted-foreground">狀態</label>
      <Select
       className="mt-1 flex h-10 w-full max-w-md rounded-md border border-input bg-muted/50 px-2 text-sm"
       value={form.status === "非在職" ? "非在職" : "在職"}
       disabled
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

     <div>
      <label className="text-xs font-medium text-muted-foreground">備註</label>
      <Textarea
       className="mt-1 min-h-[100px]"
       value={form.remarks ?? ""}
       onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
       placeholder="選填"
      />
     </div>

     <div className="flex flex-wrap gap-3">
      <Button type="button" onClick={() => void save()} loading={saving} loadingText="儲存中…">
       儲存變更
      </Button>
      <Button type="button" variant="outline" onClick={() => void reload()} disabled={saving || loading}>
       還原為上次載入
      </Button>
     </div>
    </div>
   )}
  </div>
 )
}
