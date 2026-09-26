import { useEffect, useRef, useState } from "react"

import { adPublicTurnstileSiteKey } from "@/lib/adPublicOrigin"

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string
          callback?: (token: string) => void
          "expired-callback"?: () => void
          "error-callback"?: () => void
          theme?: "light" | "dark" | "auto"
        }
      ) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
    }
  }
}

const SCRIPT_ID = "cf-turnstile-script"
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (window.turnstile) return Promise.resolve()
  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("Turnstile 載入失敗")), { once: true })
    })
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.id = SCRIPT_ID
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Turnstile 載入失敗"))
    document.head.appendChild(script)
  })
}

/** 廣告公開表單用 Turnstile；未設定 site key 時不渲染。 */
export function AdPublicTurnstile({
  onToken,
}: {
  onToken: (token: string | null) => void
}) {
  const siteKey = adPublicTurnstileSiteKey()
  const hostRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const onTokenRef = useRef(onToken)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    onTokenRef.current = onToken
  }, [onToken])

  useEffect(() => {
    if (!siteKey || !hostRef.current) return
    let cancelled = false
    void (async () => {
      try {
        await loadTurnstileScript()
        if (cancelled || !hostRef.current || !window.turnstile) return
        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current)
          widgetIdRef.current = null
        }
        widgetIdRef.current = window.turnstile.render(hostRef.current, {
          sitekey: siteKey,
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => {
            onTokenRef.current(null)
            setErr("人機驗證載入失敗，請重新整理")
          },
          theme: "light",
        })
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "人機驗證載入失敗")
          onTokenRef.current(null)
        }
      }
    })()
    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [siteKey])

  if (!siteKey) return null

  return (
    <div className="space-y-1">
      <div ref={hostRef} />
      {err ? <p className="text-sm text-destructive">{err}</p> : null}
    </div>
  )
}

export function resetAdPublicTurnstile(): void {
  if (typeof window === "undefined" || !window.turnstile) return
  try {
    window.turnstile.reset()
  } catch {
    /* ignore */
  }
}
