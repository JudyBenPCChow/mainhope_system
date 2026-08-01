import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  APP_MAX_SESSION_MS,
  APP_RELOAD_COUNTDOWN_MS,
  APP_UPDATE_POLL_MS,
  fetchRemoteBuildId,
  getClientBuildId,
  hardReloadPage,
  isStaleChunkError,
  type AppUpdateReason,
} from "@/lib/appUpdateGuard"

function reasonCopy(reason: AppUpdateReason): { title: string; message: string } {
  if (reason === "new_deploy") {
    return {
      title: "系統已更新",
      message: "偵測到新版本，即將重新載入頁面，以使用最新功能與修正。",
    }
  }
  if (reason === "chunk_error") {
    return {
      title: "頁面資源已過期",
      message: "目前開啟的版本已無法載入新頁面，即將重新載入。",
    }
  }
  return {
    title: "需要重新載入",
    message: "此分頁已開啟超過 6 小時，即將重新載入以確保使用最新系統。",
  }
}

/**
 * 生產環境：定期比對 `/version.json`；部署後或開著超過 6 小時即提示並強制重載。
 * 開發環境略過（避免干擾 HMR）。
 */
export function AppUpdateGuard() {
  const [pending, setPending] = useState<AppUpdateReason | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const armedRef = useRef(false)
  const sessionStartedAt = useRef(Date.now())

  useEffect(() => {
    if (import.meta.env.DEV) return

    const arm = (reason: AppUpdateReason) => {
      if (armedRef.current) return
      armedRef.current = true
      setPending(reason)
      setSecondsLeft(Math.ceil(APP_RELOAD_COUNTDOWN_MS / 1000))
    }

    const checkDeploy = async (signal: AbortSignal) => {
      try {
        const remote = await fetchRemoteBuildId(signal)
        if (!remote) return
        if (remote !== getClientBuildId()) arm("new_deploy")
      } catch {
        // 離線／暫時失敗：略過，下一輪再試
      }
    }

    const checkSessionAge = () => {
      if (Date.now() - sessionStartedAt.current >= APP_MAX_SESSION_MS) {
        arm("max_session")
      }
    }

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return
      checkSessionAge()
      void checkDeploy(abort.signal)
    }

    const onVitePreloadError = (event: Event) => {
      event.preventDefault()
      arm("chunk_error")
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : ""
      if (message && isStaleChunkError(message)) arm("chunk_error")
    }

    const abort = new AbortController()
    void checkDeploy(abort.signal)
    checkSessionAge()

    const pollId = window.setInterval(() => {
      checkSessionAge()
      void checkDeploy(abort.signal)
    }, APP_UPDATE_POLL_MS)

    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("vite:preloadError", onVitePreloadError)
    window.addEventListener("unhandledrejection", onUnhandledRejection)

    return () => {
      abort.abort()
      window.clearInterval(pollId)
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("vite:preloadError", onVitePreloadError)
      window.removeEventListener("unhandledrejection", onUnhandledRejection)
    }
  }, [])

  useEffect(() => {
    if (!pending) return

    const tickId = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(tickId)
          hardReloadPage()
          return 0
        }
        return s - 1
      })
    }, 1000)

    return () => window.clearInterval(tickId)
  }, [pending])

  if (!pending) return null

  const copy = reasonCopy(pending)

  return (
    <div
      className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[100] border-t border-border bg-background/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 md:bottom-0"
      role="alertdialog"
      aria-labelledby="app-update-title"
      aria-describedby="app-update-desc"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p id="app-update-title" className="text-sm font-semibold text-foreground">
            {copy.title}
          </p>
          <p id="app-update-desc" className="mt-0.5 text-sm text-muted-foreground">
            {copy.message}
            {secondsLeft > 0 ? `（${secondsLeft} 秒）` : null}
          </p>
        </div>
        <Button type="button" className="shrink-0" onClick={() => hardReloadPage()}>
          立即重新載入
        </Button>
      </div>
    </div>
  )
}
