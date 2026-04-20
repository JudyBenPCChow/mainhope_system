import { useCallback, useEffect, useState } from "react"
import { CircleUser, Mail, Phone, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import { cn } from "@/lib/utils"
import {
  getTeacherById,
  type TeacherRecord,
  updateTeacher,
} from "@/services/teacherQueries"

export default function TeacherProfilePage() {
  const teacherId = getTeacherScopeTeacherId()
  const [teacher, setTeacher] = useState<TeacherRecord | null>(null)
  const [form, setForm] = useState<Partial<TeacherRecord>>({})
  const [subjectInput, setSubjectInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

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
        setSubjectInput((t.subject_speciality ?? []).join(", "))
      } else {
        setForm({})
        setSubjectInput("")
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
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
    const name = (form.full_name ?? teacher.full_name ?? "").trim()
    if (!name) {
      alert("請填寫中文姓名。")
      return
    }
    const subjects = subjectInput
      .split(/[,，、]/)
      .map((s) => s.trim())
      .filter(Boolean)
    setSaving(true)
    setErr(null)
    try {
      const updated = await updateTeacher(teacherId, {
        full_name: name,
        english_name: form.english_name?.trim() ? form.english_name.trim() : null,
        phone: form.phone?.trim() ? form.phone.trim() : null,
        email: form.email?.trim() ? form.email.trim() : null,
        status: form.status,
        subject_speciality: subjects.length ? subjects : null,
        remarks: form.remarks?.trim() ? form.remarks.trim() : null,
      })
      setTeacher(updated)
      setForm(updated)
      setSubjectInput((updated.subject_speciality ?? []).join(", "))
      alert("已儲存")
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  if (!teacherId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
        <p className="font-medium">此頁僅供專班老師使用。請以老師身分登入。</p>
      </div>
    )
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
        <p>尚未設定 Supabase，無法載入個人資料。</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="flex flex-wrap items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-700 text-white shadow-md">
          <CircleUser className="h-8 w-8" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">個人資料</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            維護您的聯絡方式與專長；僅您本人可編輯此頁。
          </p>
          {teacher ? (
            <p className="mt-2 font-mono text-xs text-muted-foreground">教師編號：{teacher.id}</p>
          ) : null}
        </div>
      </header>

      {err ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-destructive">{err}</div>
      ) : null}

      {loading ? (
        <p className="text-muted-foreground">載入中…</p>
      ) : !teacher ? (
        <p className="text-muted-foreground">找不到您的教師檔案，請聯絡管理員。</p>
      ) : (
        <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">中文姓名 *</label>
              <div className="relative mt-1">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={form.full_name ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">英文姓名</label>
              <Input
                className="mt-1"
                value={form.english_name ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, english_name: e.target.value }))}
                placeholder="選填"
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
                  className="pl-9"
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="選填"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">狀態</label>
            <select
              className="mt-1 flex h-10 w-full max-w-md rounded-md border border-input bg-background px-2 text-sm"
              value={form.status === "非在職" ? "非在職" : "在職"}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="在職">在職</option>
              <option value="非在職">非在職</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">專長科目（逗號分隔）</label>
            <Input
              className="mt-1"
              value={subjectInput}
              onChange={(e) => setSubjectInput(e.target.value)}
              placeholder="中文, 數學"
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {subjectInput
                .split(/[,，、]/)
                .map((s) => s.trim())
                .filter(Boolean)
                .map((sub) => (
                  <span
                    key={sub}
                    className={cn(
                      "rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800"
                    )}
                  >
                    {sub}
                  </span>
                ))}
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
            <Button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? "儲存中…" : "儲存變更"}
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
