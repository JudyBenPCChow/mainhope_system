/** 廣告公開表單正規網域（例如 https://ad.mainhope.edu.hk）。未設定則不轉址。 */
export function adPublicCanonicalOrigin(): string {
  return (import.meta.env.VITE_AD_PUBLIC_ORIGIN as string | undefined)?.trim().replace(/\/$/, "") ?? ""
}

/** Cloudflare Turnstile site key；未設定則不顯示 widget（Edge 在未設 secret 時亦放行）。 */
export function adPublicTurnstileSiteKey(): string {
  return (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim() ?? ""
}

/**
 * 若已設定正規 origin，且目前不在該 origin，則把 /AdTrial、/AdInterest 轉過去。
 * 須先完成 DNS／Vercel 綁定再設 env，否則會轉到無法開啟的網域。
 */
export function maybeRedirectAdPublicToCanonical(): void {
  if (typeof window === "undefined") return
  const canonical = adPublicCanonicalOrigin()
  if (!canonical) return
  let canonicalUrl: URL
  try {
    canonicalUrl = new URL(canonical)
  } catch {
    return
  }
  if (window.location.origin === canonicalUrl.origin) return
  const path = window.location.pathname
  if (path !== "/AdTrial" && path !== "/AdInterest" && !path.startsWith("/AdTrial/") && !path.startsWith("/AdInterest/")) {
    return
  }
  const next = `${canonicalUrl.origin}${path}${window.location.search}${window.location.hash}`
  window.location.replace(next)
}

const SUBMIT_COOLDOWN_MS = 10_000
const COOLDOWN_STORAGE_KEY = "ad_public_submit_cooldown_until"

export function adPublicSubmitCooldownRemainingMs(now = Date.now()): number {
  if (typeof sessionStorage === "undefined") return 0
  const raw = sessionStorage.getItem(COOLDOWN_STORAGE_KEY)
  const until = raw ? Number(raw) : 0
  if (!Number.isFinite(until)) return 0
  return Math.max(0, until - now)
}

export function markAdPublicSubmitCooldown(now = Date.now()): void {
  if (typeof sessionStorage === "undefined") return
  sessionStorage.setItem(COOLDOWN_STORAGE_KEY, String(now + SUBMIT_COOLDOWN_MS))
}
