import { useEffect, useState } from "react"
import { KeyRound, ListFilter, Mail, Settings } from "lucide-react"

import { StatusToggle } from "@/components/students/studentsUi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { useAuth } from "@/lib/authBootstrap"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSoftArchiveQueriesEnabled, setSoftArchiveQueriesEnabled } from "@/lib/softArchiveFlag"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { getAuthSession } from "@/lib/supabaseAuth"
import {
  changeOwnPassword,
  getMustChangePasswordFlag,
} from "@/services/authAccountQueries"
import { logMgmtAuditAction } from "@/services/mgmtGodViewQueries"

export function SettingsView() {
  const { pushBanner } = useAppBanner()
  const { confirmDialog } = useAppConfirm()
  const { role } = useAuth()
  const canToggleSoftArchive =
    role === "admin" || role === "manager" || role === "finance" || role === "alien"
  const [email, setEmail] = useState<string>("")
  const [mustChange, setMustChange] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [togglingArchive, setTogglingArchive] = useState(false)
  const [narrowLists] = useState(() => isSoftArchiveQueriesEnabled())

  useEffect(() => {
    if (!isSupabaseConfigured) return
    void (async () => {
      const { session } = await getAuthSession()
      setEmail(session?.user?.email?.trim().toLowerCase() ?? "")
      setMustChange(await getMustChangePasswordFlag())
    })()
  }, [])

  const onToggleSoftArchive = async (on: boolean) => {
    if (togglingArchive) return
    if (on === isSoftArchiveQueriesEnabled()) return
    if (!on) {
      const ok = await confirmDialog({
        title: "關閉日常名單收窄",
        description:
          "列表與下拉會載入已畢業生及更舊學年，僅供緊急回滾。確定關閉？關閉後會重新整理本頁。",
        confirmText: "關閉收窄",
        cancelText: "取消",
        tone: "warning",
      })
      if (ok !== true) return
    }
    setTogglingArchive(true)
    setSoftArchiveQueriesEnabled(on)
    await logMgmtAuditAction({
      action: "soft_archive_queries_toggled",
      detail: JSON.stringify({ enabled: on, source: "SettingsView" }),
    })
    window.location.reload()
  }

  const submit = async () => {
    setErr(null)
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErr("請填寫目前密碼、新密碼與確認新密碼。")
      return
    }
    if (newPassword !== confirmPassword) {
      setErr("兩次輸入的新密碼不一致。")
      return
    }
    if (newPassword.length < 8) {
      setErr("新密碼至少需要 8 個字元。")
      return
    }

    setSaving(true)
    try {
      const result = await changeOwnPassword({ currentPassword, newPassword })
      if (!result.ok) {
        setErr(result.message)
        return
      }
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setMustChange(false)
      pushBanner({
        tone: "success",
        title: "密碼已更新",
        message: "請以新密碼登入；之後可隨時在設定中再次修改。",
      })
    } catch (e) {
      reportUserFacingError(e, { source: "SettingsView.changePassword", setErr, userMessage: formatUnknownError(e) })
    } finally {
      setSaving(false)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-xl border border-warning/50 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
        尚未設定 Supabase，無法修改密碼。
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="space-y-2 border-b border-border/80 pb-6">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
          <Settings className="h-8 w-8 shrink-0 text-info" aria-hidden />
          設定
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground md:text-base">
          管理登入帳號密碼
          {canToggleSoftArchive ? "，以及本機日常名單收窄開關。" : "。臨時密碼登入後建議改成自己記得的密碼。"}
        </p>
      </header>

      {mustChange ? (
        <div
          role="status"
          className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground"
        >
          你目前使用臨時密碼登入。建議在下方改成自己記得的密碼（可稍後再改）。
        </div>
      ) : null}

      {canToggleSoftArchive ? (
        <section className="max-w-lg space-y-5 rounded-xl border border-border bg-card p-5 shadow-sm md:p-6">
          <div className="flex items-start gap-3">
            <ListFilter className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0 flex-1 space-y-1">
              <h2 className="text-base font-semibold">日常名單收窄</h2>
              <p className="text-xs text-muted-foreground">
                開啟時，學生／班別等日常列表預設不載入已畢業生與更舊學年（資料仍在）。關閉＝緊急回滾，僅影響本瀏覽器。
              </p>
            </div>
          </div>
          <StatusToggle
            checked={narrowLists}
            onCheckedChange={(on) => void onToggleSoftArchive(on)}
            offLabel="全量載入"
            onLabel="日常收窄"
          />
        </section>
      ) : null}

      <section className="max-w-lg space-y-5 rounded-xl border border-border bg-card p-5 shadow-sm md:p-6">
        <div className="flex items-start gap-3">
          <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-base font-semibold">修改密碼</h2>
            <p className="text-xs text-muted-foreground">修改後立即生效；關閉其他裝置上的舊登入狀態可能仍需重新登入。</p>
          </div>
        </div>

        <label className="grid gap-1.5 text-sm">
          <span className="text-xs font-medium text-muted-foreground">登入電郵</span>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="bg-muted/50 pl-9" value={email || "—"} readOnly disabled />
          </div>
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="text-xs font-medium text-muted-foreground">目前密碼</span>
          <Input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={saving}
          />
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="text-xs font-medium text-muted-foreground">新密碼</span>
          <Input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={saving}
            placeholder="至少 8 個字元"
          />
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="text-xs font-medium text-muted-foreground">確認新密碼</span>
          <Input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={saving}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit()
            }}
          />
        </label>

        {err ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {err}
          </div>
        ) : null}

        <Button type="button" loading={saving} loadingText="更新中…" onClick={() => void submit()}>
          更新密碼
        </Button>
      </section>
    </div>
  )
}
