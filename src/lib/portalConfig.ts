/**
 * 家長 Portal 網域（不含結尾斜線）。
 * 於 .env 設定 VITE_PORTAL_BASE_URL，例如 https://portal.example.com
 */
export function getPortalBaseUrl(): string {
 const raw = (import.meta.env.VITE_PORTAL_BASE_URL as string | undefined)?.trim() ?? ""
 return raw.replace(/\/+$/, "")
}

export function isPortalBaseUrlConfigured(): boolean {
 return getPortalBaseUrl().length > 0
}

/** 組出家長啟用連結；未設定網域時回傳 null */
export function buildPortalActivateUrl(token: string): string | null {
 const base = getPortalBaseUrl()
 if (!base) return null
 const t = token.trim()
 if (!t) return null
 return `${base}/activate?token=${encodeURIComponent(t)}`
}
