import { useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/authBootstrap"
import { clearAuthState, applyProfileToStorage } from "@/lib/authSession"
import { setPasswordChangeNudge } from "@/lib/passwordChangeNudge"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { signInWithPasswordAuth, signOutAuth } from "@/lib/supabaseAuth"
import { fetchCurrentAuthzProfile } from "@/services/authzProfileQueries"

export default function Login() {
  const navigate = useNavigate()
  const { ready, role } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const onlyAlienEmail = (import.meta.env.VITE_ALIEN_EMAIL as string | undefined)?.trim().toLowerCase() ?? ""

  if (ready && role) return <Navigate to="/Home" replace />

  if (!ready) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-brand-bg text-sm text-muted-foreground">
        正在確認登入狀態…
      </div>
    )
  }

  const submit = async () => {
    if (!isSupabaseConfigured) {
      setError("尚未設定 Supabase，暫時無法登入。")
      return
    }
    if (!email.trim() || !password) {
      setError("請輸入電郵與密碼。")
      return
    }

    setLoading(true)
    setError(null)
    clearAuthState()
    try {
      const { error: signInError, data } = await signInWithPasswordAuth(
        email.trim().toLowerCase(),
        password,
      )
      if (signInError) throw signInError
      const profile = await fetchCurrentAuthzProfile()
      if (!profile) {
        await signOutAuth()
        throw new Error("此帳號尚未在系統角色名單中設定，請聯絡Christine Fan。")
      }
      if (profile.activeRole === "teacher" && !profile.teacherId) {
        await signOutAuth()
        throw new Error("老師帳號未綁定 teacher_id，請聯絡Christine Fan修正。")
      }
      if (profile.activeRole === "alien" && onlyAlienEmail && profile.email !== onlyAlienEmail) {
        await signOutAuth()
        throw new Error("此帳號不是外星人指定帳號。")
      }
      applyProfileToStorage(profile)
      if (data.user?.user_metadata?.must_change_password === true) {
        setPasswordChangeNudge()
      }
      navigate("/Home", { replace: true })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "登入失敗"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-brand-bg p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">明學教育 Nova Beta 1.0</h1>
        <p className="mt-1 text-sm text-muted-foreground">請輸入你的電郵及密碼。如不確定或遺失，請聯絡Christine Fan。</p>

        <div className="mt-5 space-y-3">
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">電郵</span>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">密碼</span>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              onKeyDown={(e) => {
                if (e.key === "Enter") void submit()
              }}
            />
          </label>
        </div>

        {error ? <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div> : null}

        <Button type="button" className="mt-5 w-full" disabled={loading} onClick={() => void submit()}>
          {loading ? "登入中…" : "登入"}
        </Button>
      </div>
    </div>
  )
}
