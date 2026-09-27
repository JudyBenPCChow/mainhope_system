/**
 * 廣告公開頁追蹤：Meta Pixel + GA4。
 * 未設定對應 VITE_ env 時為 no-op，不擋表單。
 */

import { normalizePhoneDigitsForMeta } from "@/lib/adAttribution"

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean }
    _fbq?: unknown
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const PIXEL_SCRIPT_ID = "meta-pixel-sdk"
const GA_SCRIPT_ID = "ga4-gtag"

function metaPixelId(): string {
  return (import.meta.env.VITE_META_PIXEL_ID as string | undefined)?.trim() ?? ""
}

function gaMeasurementId(): string {
  return (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim() ?? ""
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value.trim().toLowerCase())
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function ensureMetaPixel(pixelId: string): void {
  if (typeof window === "undefined" || !pixelId) return
  if (window.fbq) {
    window.fbq("init", pixelId)
    return
  }
  const n = function (...args: unknown[]) {
    const fn = n as Window["fbq"] & {
      callMethod?: (...a: unknown[]) => void
      queue: unknown[]
      loaded: boolean
      version: string
    }
    if (typeof fn.callMethod === "function") {
      fn.callMethod(...args)
    } else {
      fn.queue.push(args)
    }
  } as Window["fbq"] & { callMethod?: (...a: unknown[]) => void; queue: unknown[]; loaded: boolean; version: string }
  n.queue = []
  n.loaded = true
  n.version = "2.0"
  window.fbq = n
  window._fbq = n
  if (!document.getElementById(PIXEL_SCRIPT_ID)) {
    const t = document.createElement("script")
    t.id = PIXEL_SCRIPT_ID
    t.async = true
    t.src = "https://connect.facebook.net/en_US/fbevents.js"
    const s = document.getElementsByTagName("script")[0]
    s?.parentNode?.insertBefore(t, s)
  }
  window.fbq("init", pixelId)
}

function ensureGa4(measurementId: string): void {
  if (typeof window === "undefined" || !measurementId) return
  window.dataLayer = window.dataLayer || []
  if (!window.gtag) {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args)
    }
  }
  if (!document.getElementById(GA_SCRIPT_ID)) {
    const t = document.createElement("script")
    t.id = GA_SCRIPT_ID
    t.async = true
    t.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
    document.head.appendChild(t)
    window.gtag("js", new Date())
    window.gtag("config", measurementId, { send_page_view: false })
  }
}

/** 僅在廣告公開路由呼叫：載入 SDK 並送 PageView。 */
export function initAdPublicTracking(): void {
  const pixelId = metaPixelId()
  const gaId = gaMeasurementId()
  if (pixelId) {
    ensureMetaPixel(pixelId)
    window.fbq?.("track", "PageView")
  }
  if (gaId) {
    ensureGa4(gaId)
    window.gtag?.("event", "page_view", { page_location: window.location.href })
  }
}

export type AdLeadTrackInput = {
  eventId: string
  mode: "trial" | "interest"
  phone?: string
  phoneCountryCode?: "+852" | "+86"
  contactMethod?: "WhatsApp" | "WeChat"
}

/** 提交成功後打 Lead（與 CAPI 共用 event_id）。 */
export async function trackAdPublicLead(input: AdLeadTrackInput): Promise<void> {
  const pixelId = metaPixelId()
  const gaId = gaMeasurementId()
  const contentName = input.mode === "interest" ? "ad_interest" : "ad_trial"

  if (pixelId) {
    ensureMetaPixel(pixelId)
    // 進階配對：提交後、同意私隱後才帶雜湊電話再 init／track
    if (
      input.contactMethod !== "WeChat" &&
      input.phone &&
      typeof crypto !== "undefined" &&
      crypto.subtle
    ) {
      const digits = normalizePhoneDigitsForMeta(input.phone, input.phoneCountryCode ?? "+852")
      if (digits) {
        const ph = await sha256Hex(digits)
        window.fbq?.("init", pixelId, { ph })
      }
    }
    window.fbq?.("track", "Lead", { content_name: contentName }, { eventID: input.eventId })
  }

  if (gaId) {
    ensureGa4(gaId)
    window.gtag?.("event", "generate_lead", {
      event_id: input.eventId,
      lead_source: contentName,
      send_to: gaId,
    })
  }
}

export function adPublicTrackingConfigured(): { pixel: boolean; ga4: boolean } {
  return { pixel: Boolean(metaPixelId()), ga4: Boolean(gaMeasurementId()) }
}
