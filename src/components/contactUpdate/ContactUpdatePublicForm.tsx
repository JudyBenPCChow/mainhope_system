import { useEffect, useState, type ReactNode } from "react"
import { CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import {
  emptyContactUpdateForm,
  getContactUpdateSession,
  submitContactUpdateSession,
  type ContactUpdateFormPayload,
  type ContactUpdateIdentity,
} from "@/services/contactUpdateQueries"
import {
  PHONE_COUNTRY_CODES,
  PREFERRED_CONTACT_METHODS,
  PRIMARY_CONTACT_PERSONS,
} from "@/services/studentQueries"

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
      {children}
    </label>
  )
}

function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[]
  value: string
  onChange: (value: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-muted/80"
            )}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

/**
 * 家長公開填表：核對／更新聯絡資料（Layout 外）。
 */
export function ContactUpdatePublicForm({ token }: { token: string }) {
  const [identity, setIdentity] = useState<ContactUpdateIdentity | null>(null)
  const [form, setForm] = useState<ContactUpdateFormPayload>(() => emptyContactUpdateForm())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [readOnly, setReadOnly] = useState(false)

  useEffect(() => {
    if (!token || !isSupabaseConfigured) {
      setLoading(false)
      setErr(!isSupabaseConfigured ? "系統尚未設定，請聯絡職員。" : "連結無效")
      return
    }
    let cancelled = false
    setLoading(true)
    void getContactUpdateSession(token)
      .then((s) => {
        if (cancelled) return
        setIdentity(s.identity)
        setForm(s.form)
        if (s.status === "submitted" || s.status === "approved") {
          setDone(true)
          setReadOnly(true)
        } else if (s.status === "open") {
          setDone(false)
          setReadOnly(false)
        } else {
          setErr(
            s.status === "expired"
              ? "此連結已過期，請向職員索取新連結"
              : `此連結無法使用（${s.status}）`
          )
        }
      })
      .catch((e) => {
        if (!cancelled) {
          reportUserFacingError(e, { source: "ContactUpdatePublicForm.load", setErr })
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const patch = (partial: Partial<ContactUpdateFormPayload>) => {
    setForm((f) => ({ ...f, ...partial }))
    setErr(null)
  }

  const onSubmit = async () => {
    if (saving || readOnly) return
    if (!form.parent_phone.trim() && !form.student_phone.trim()) {
      setErr("請至少填寫學生電話或家長電話")
      return
    }
    if (form.student_preferred_contact_method === "WeChat" && !form.student_wechat_id.trim()) {
      setErr("學生偏好 WeChat，請填寫學生 WeChat ID")
      return
    }
    if (form.parent_preferred_contact_method === "WeChat" && !form.parent_wechat_id.trim()) {
      setErr("家長偏好 WeChat，請填寫家長 WeChat ID")
      return
    }
    setSaving(true)
    setErr(null)
    try {
      await submitContactUpdateSession(token, form)
      setDone(true)
      setReadOnly(true)
    } catch (e) {
      reportUserFacingError(e, { source: "ContactUpdatePublicForm.submit", setErr })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg items-center justify-center px-4 text-sm text-muted-foreground">
        載入中…
      </div>
    )
  }

  if (err && !identity) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10">
        <div
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {err}
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10">
        <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" aria-hidden />
          <h1 className="mt-4 text-xl font-bold">已收到更新</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            資料已交職員核對，核准後先寫入學生檔案。如需再改，請向職員索取新連結。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-8">
      <header className="mb-6 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">明學教育 · MainHope</p>
        <h1 className="text-2xl font-bold tracking-tight">核對／更新聯絡資料</h1>
        <p className="text-sm text-muted-foreground">
          請核對以下資料。若學生電話同家長電話調亂，請直接改正後提交。
        </p>
      </header>

      {identity ? (
        <section className="mb-6 rounded-xl border border-border bg-muted/40 px-4 py-3">
          <p className="text-xs text-muted-foreground">學生（只供確認，不可改）</p>
          <p className="mt-1 text-lg font-semibold">{identity.full_name}</p>
          {identity.student_code ? (
            <p className="text-sm text-muted-foreground">學號 {identity.student_code}</p>
          ) : null}
          <p className="mt-1 text-sm text-muted-foreground">
            {[identity.grade, identity.school].filter(Boolean).join(" · ")}
          </p>
        </section>
      ) : null}

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault()
          void onSubmit()
        }}
      >
        <Field label="第一聯絡人" hint="系統發送通知時優先聯絡邊位；偏好 WeChat 會顯示 WeChat 按鈕">
          <ChoiceChips
            options={PRIMARY_CONTACT_PERSONS}
            value={form.primary_contact_person}
            onChange={(v) => patch({ primary_contact_person: v })}
          />
        </Field>

        <section className="space-y-4 rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold">學生聯絡</h2>
          <Field label="學生電話" hint="學生本人手機；唔好同家長電話調轉">
            <div className="space-y-2">
              <ChoiceChips
                options={PHONE_COUNTRY_CODES}
                value={form.student_phone_country_code}
                onChange={(code) => patch({ student_phone_country_code: code })}
              />
              <Input
                inputMode="numeric"
                autoComplete="tel"
                placeholder="例如 65551234"
                value={form.student_phone}
                onChange={(e) => patch({ student_phone: e.target.value })}
              />
            </div>
          </Field>
          <Field label="學生偏好通訊方式">
            <ChoiceChips
              options={PREFERRED_CONTACT_METHODS}
              value={form.student_preferred_contact_method}
              onChange={(m) =>
                patch({
                  student_preferred_contact_method: m,
                  ...(m !== "WeChat" ? { student_wechat_id: "" } : {}),
                })
              }
            />
          </Field>
          {form.student_preferred_contact_method === "WeChat" ? (
            <Field label="學生 WeChat ID">
              <Input
                autoComplete="username"
                placeholder="WeChat ID"
                value={form.student_wechat_id}
                onChange={(e) => patch({ student_wechat_id: e.target.value })}
              />
            </Field>
          ) : null}
        </section>

        <section className="space-y-4 rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold">家長聯絡</h2>
          <Field label="家長電話" hint="日常聯絡家長用；唔好同學生電話調轉">
            <div className="space-y-2">
              <ChoiceChips
                options={PHONE_COUNTRY_CODES}
                value={form.parent_phone_country_code}
                onChange={(code) => patch({ parent_phone_country_code: code })}
              />
              <Input
                inputMode="numeric"
                autoComplete="tel"
                placeholder="例如 91234567"
                value={form.parent_phone}
                onChange={(e) => patch({ parent_phone: e.target.value })}
              />
            </div>
          </Field>
          <Field label="家長偏好通訊方式">
            <ChoiceChips
              options={PREFERRED_CONTACT_METHODS}
              value={form.parent_preferred_contact_method}
              onChange={(m) =>
                patch({
                  parent_preferred_contact_method: m,
                  ...(m !== "WeChat" ? { parent_wechat_id: "" } : {}),
                })
              }
            />
          </Field>
          {form.parent_preferred_contact_method === "WeChat" ? (
            <Field label="家長 WeChat ID">
              <Input
                autoComplete="username"
                placeholder="WeChat ID"
                value={form.parent_wechat_id}
                onChange={(e) => patch({ parent_wechat_id: e.target.value })}
              />
            </Field>
          ) : null}
        </section>

        {err ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {err}
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "提交中…" : "提交更新"}
        </Button>
      </form>
    </div>
  )
}
