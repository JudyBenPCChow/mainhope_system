import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

import {
 emptyIntakeForm,
 payloadFromPartial,
 StudentIntakeFormFields,
} from "@/components/frontDesk/StudentIntakeFormFields"
import { Button } from "@/components/ui/button"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import {
 getFrontDeskIntakeSession,
 submitFrontDeskIntakeSession,
 type FrontDeskIntakePayload,
 type FrontDeskIntakeSession,
} from "@/services/frontDeskIntakeQueries"

/** 家長連結填表頁：公開路由，不經側欄 Layout */
export default function FrontDeskIntake() {
 const { token = "" } = useParams<{ token: string }>()
 const [session, setSession] = useState<FrontDeskIntakeSession | null>(null)
 const [form, setForm] = useState<FrontDeskIntakePayload>(emptyIntakeForm)
 const [loading, setLoading] = useState(true)
 const [saving, setSaving] = useState(false)
 const [err, setErr] = useState<string | null>(null)
 const [done, setDone] = useState(false)

 useEffect(() => {
  if (!token || !isSupabaseConfigured) {
   setLoading(false)
   setErr(!isSupabaseConfigured ? "系統尚未設定，請聯絡職員。" : "連結無效")
   return
  }
  let cancelled = false
  setLoading(true)
  void getFrontDeskIntakeSession(token)
   .then((s) => {
    if (cancelled) return
    setSession(s)
    if (s.status === "submitted" || s.status === "consumed") {
     setForm(payloadFromPartial(s.payload))
     setDone(true)
    } else if (s.status === "open") {
     setForm(payloadFromPartial(s.payload.full_name ? s.payload : emptyIntakeForm()))
    } else {
     setErr(`此連結無法使用（${s.status}）`)
    }
   })
   .catch((e) => {
    if (!cancelled) setErr(e instanceof Error ? e.message : String(e))
   })
   .finally(() => {
    if (!cancelled) setLoading(false)
   })
  return () => {
   cancelled = true
  }
 }, [token])

 const onSubmit = async () => {
  if (saving || !token) return
  if (!(form.full_name ?? "").trim()) {
   setErr("請填寫中文姓名")
   return
  }
  setSaving(true)
  setErr(null)
  try {
   const s = await submitFrontDeskIntakeSession(token, {
    ...form,
    full_name: form.full_name.trim(),
    registration_status: "已註冊",
    academic_stage: "中學階段",
   })
   setSession(s)
   setDone(true)
  } catch (e) {
   setErr(e instanceof Error ? e.message : String(e))
  } finally {
   setSaving(false)
  }
 }

 if (loading) {
  return (
   <div className="mx-auto max-w-lg p-6 text-sm text-muted-foreground">載入表單中…</div>
  )
 }

 return (
  <div className="min-h-dvh bg-background">
   <div className="mx-auto max-w-lg space-y-6 p-4 pb-16 md:p-6">
    <header className="space-y-1">
     <p className="text-xs font-medium uppercase tracking-wide text-primary">明學 · 新生資料</p>
     <h1 className="text-xl font-semibold">請填寫學生資料</h1>
     <p className="text-sm text-muted-foreground">
      填妥後按「提交給前台」。職員核對後才會正式建立學籍。
     </p>
    </header>

    {err ? (
     <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {err}
     </div>
    ) : null}

    {done ? (
     <div role="status" className="space-y-2 rounded-xl border border-success/40 bg-success/10 px-4 py-4 text-sm text-success">
      <p className="font-semibold">已提交成功</p>
      <p>請把手機交回前台職員核對。無需重複提交。</p>
      {session?.payload.full_name ? <p>學生：{session.payload.full_name}</p> : null}
     </div>
    ) : (
     <>
      <StudentIntakeFormFields parentFacing value={form} onChange={setForm} disabled={saving} />
      <Button type="button" className="w-full" disabled={saving} onClick={() => void onSubmit()}>
       {saving ? "提交中…" : "提交給前台"}
      </Button>
     </>
    )}
   </div>
  </div>
 )
}
