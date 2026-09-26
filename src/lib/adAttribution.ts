/**
 * 廣告公開頁歸因：UTM／fbclid／Meta cookie／event_id。
 * 僅在瀏覽器使用。
 */

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const

export type AdAttribution = {
  eventId: string
  fbp: string
  fbc: string
  fbclid: string
  landingPath: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_content: string
  utm_term: string
}

function readCookie(name: string): string {
  if (typeof document === "undefined") return ""
  const prefix = `${name}=`
  const hit = document.cookie.split(";").map((c) => c.trim()).find((c) => c.startsWith(prefix))
  return hit ? decodeURIComponent(hit.slice(prefix.length)) : ""
}

function newEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`
}

/** 從目前 URL 與 cookie 組歸因；每次提交應呼叫一次以產生新 event_id。 */
export function collectAdAttribution(): AdAttribution {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams()
  const fbclid = (params.get("fbclid") ?? "").trim().slice(0, 200)
  let fbc = readCookie("_fbc").slice(0, 200)
  if (!fbc && fbclid) {
    fbc = `fb.1.${Date.now()}.${fbclid}`.slice(0, 200)
  }
  const utm = Object.fromEntries(
    UTM_KEYS.map((key) => [key, (params.get(key) ?? "").trim().slice(0, 120)])
  ) as Pick<AdAttribution, (typeof UTM_KEYS)[number]>

  return {
    eventId: newEventId(),
    fbp: readCookie("_fbp").slice(0, 200),
    fbc,
    fbclid,
    landingPath: typeof window !== "undefined" ? window.location.pathname.slice(0, 120) : "",
    ...utm,
  }
}

/** 香港／內地電話正規化成 E.164 數字（無 +），供 Meta 雜湊。 */
export function normalizePhoneDigitsForMeta(
  phone: string,
  countryCode: "+852" | "+86" = "+852"
): string {
  const digits = phone.replace(/\D/g, "")
  if (!digits) return ""
  if (countryCode === "+86") {
    if (digits.startsWith("86")) return digits
    return `86${digits}`
  }
  if (digits.startsWith("852")) return digits
  if (digits.length === 8) return `852${digits}`
  return digits
}
