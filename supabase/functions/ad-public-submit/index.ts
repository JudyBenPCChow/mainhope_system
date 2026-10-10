import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

import { corsHeaders, jsonResponse } from "../_shared/cors.ts"

type ContactMethod = "WhatsApp" | "WeChat"

type Body = {
  mode?: unknown
  turnstileToken?: unknown
  fullName?: unknown
  school?: unknown
  grade?: unknown
  phone?: unknown
  note?: unknown
  company?: unknown
  contactMethod?: unknown
  wechatId?: unknown
  phoneCountryCode?: unknown
  lines?: unknown
  electedSubjectCodes?: unknown
  subjects?: unknown
  leadId?: unknown
  eventId?: unknown
  fbp?: unknown
  fbc?: unknown
  fbclid?: unknown
  landingPath?: unknown
  utm_source?: unknown
  utm_medium?: unknown
  utm_campaign?: unknown
  utm_content?: unknown
  utm_term?: unknown
}

function asString(v: unknown, max = 500): string {
  return String(v ?? "").trim().slice(0, max)
}

function clientKeyFromRequest(req: Request): string {
  const cf = req.headers.get("cf-connecting-ip")?.trim()
  if (cf) return cf.slice(0, 80).toLowerCase()
  const real = req.headers.get("x-real-ip")?.trim()
  if (real) return real.slice(0, 80).toLowerCase()
  const xff = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  if (xff) return xff.slice(0, 80).toLowerCase()
  return "unknown"
}

function clientUserAgent(req: Request): string {
  return (req.headers.get("user-agent") ?? "").slice(0, 512)
}

async function verifyTurnstile(token: string, remoteIp: string): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY")?.trim()
  if (!secret) {
    // 未設定密鑰：驗證失敗，不接受提交。
    return false
  }
  if (!token) return false
  const form = new URLSearchParams()
  form.set("secret", secret)
  form.set("response", token)
  if (remoteIp && remoteIp !== "unknown") form.set("remoteip", remoteIp)
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  })
  if (!res.ok) return false
  const data = (await res.json()) as { success?: boolean }
  return data.success === true
}

function normalizePhoneDigits(phone: string, countryCode: string): string {
  const digits = phone.replace(/\D/g, "")
  if (!digits) return ""
  if (countryCode === "+86" || countryCode === "86") {
    return digits.startsWith("86") ? digits : `86${digits}`
  }
  if (digits.startsWith("852")) return digits
  if (digits.length === 8) return `852${digits}`
  return digits
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value.trim().toLowerCase())
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/** CAPI 失敗不影響提交成功；僅 log。 */
async function sendMetaCapiLead(params: {
  eventId: string
  mode: "trial" | "interest"
  phone: string
  phoneCountryCode: string
  contactMethod: ContactMethod
  fbp: string
  fbc: string
  clientIp: string
  userAgent: string
  eventSourceUrl: string
}): Promise<void> {
  const pixelId = Deno.env.get("META_PIXEL_ID")?.trim()
  const token = Deno.env.get("META_CAPI_ACCESS_TOKEN")?.trim()
  if (!pixelId || !token || !params.eventId) return

  const userData: Record<string, unknown> = {}
  if (params.contactMethod === "WhatsApp" && params.phone) {
    const digits = normalizePhoneDigits(params.phone, params.phoneCountryCode)
    if (digits) userData.ph = [await sha256Hex(digits)]
  }
  if (params.fbp) userData.fbp = params.fbp
  if (params.fbc) userData.fbc = params.fbc
  if (params.clientIp && params.clientIp !== "unknown") userData.client_ip_address = params.clientIp
  if (params.userAgent) userData.client_user_agent = params.userAgent

  const body = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: params.eventId,
        event_source_url: params.eventSourceUrl.slice(0, 1000) || undefined,
        action_source: "website",
        user_data: userData,
        custom_data: {
          content_name: params.mode === "interest" ? "ad_interest" : "ad_trial",
        },
      },
    ],
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    )
    if (!res.ok) {
      const text = await res.text()
      console.error("meta_capi_lead_failed", res.status, text.slice(0, 500))
    }
  } catch (e) {
    console.error("meta_capi_lead_error", e)
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim()
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim()
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: "伺服器設定不完整" }, 500)
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return jsonResponse({ error: "請求格式無效" }, 400)
  }

  const mode = asString(body.mode, 20)
  if (mode !== "trial" && mode !== "interest" && mode !== "homework" && mode !== "homework_details" && mode !== "homework_date") {
    return jsonResponse({ error: "mode 無效" }, 400)
  }

  const rateKey = clientKeyFromRequest(req)
  const turnstileToken = asString(body.turnstileToken, 2048)
  if (mode !== "homework_date") {
    const turnstileOk = await verifyTurnstile(turnstileToken, rateKey)
    if (!turnstileOk) {
      return jsonResponse({ error: "人機驗證失敗，請重新整理後再試" }, 403)
    }
  }

  const contactMethod: ContactMethod =
    asString(body.contactMethod, 20) === "WeChat" ? "WeChat" : "WhatsApp"
  const phoneCountryCode =
    asString(body.phoneCountryCode, 8) === "+86" || asString(body.phoneCountryCode, 8) === "86"
      ? "+86"
      : "+852"

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const fullName = asString(body.fullName, 80)
  const phone = asString(body.phone, 40)
  const eventId = asString(body.eventId, 80)
  const fbp = asString(body.fbp, 200)
  const fbc = asString(body.fbc, 200)
  const landingPath = asString(body.landingPath, 120)

  const baseArgs = {
    p_full_name: fullName,
    p_school: asString(body.school, 120),
    p_grade: asString(body.grade, 10),
    p_phone: phone,
    p_note: asString(body.note, 500) || null,
    p_company: asString(body.company, 120),
    p_contact_method: contactMethod,
    p_wechat_id: contactMethod === "WeChat" ? asString(body.wechatId, 40) || null : null,
    p_phone_country_code: phoneCountryCode,
    p_rate_client_key: rateKey,
  }

  const line = Array.isArray(body.lines) ? body.lines[0] : null
  const lineRec = line && typeof line === "object" ? (line as Record<string, unknown>) : null
  const rpcName =
    mode === "interest"
      ? "ad_trial_interest_submit"
      : mode === "homework"
        ? "ad_homework_trial_submit"
        : mode === "homework_details"
          ? "ad_homework_details_submit"
          : mode === "homework_date"
            ? "ad_homework_attach_date"
            : "ad_trial_submit"
  const rpcArgs =
    mode === "interest"
      ? {
          ...baseArgs,
          p_subjects: Array.isArray(body.subjects)
            ? body.subjects.map((s) => asString(s, 40)).filter(Boolean)
            : [],
        }
      : mode === "homework_details"
        ? baseArgs
        : mode === "homework_date"
          ? {
              p_lead_id: asString(body.leadId, 40),
              p_class_id: asString(lineRec?.class_id, 40),
              p_schedule_id: asString(lineRec?.schedule_id, 40),
              p_company: asString(body.company, 120),
              p_rate_client_key: rateKey,
            }
          : mode === "homework"
            ? {
                ...baseArgs,
                p_lines: Array.isArray(body.lines) ? body.lines : [],
              }
            : {
                ...baseArgs,
                p_lines: Array.isArray(body.lines) ? body.lines : [],
                p_elected_subject_codes: Array.isArray(body.electedSubjectCodes)
                  ? body.electedSubjectCodes.map((c) => asString(c, 20).toUpperCase()).filter(Boolean)
                  : [],
              }

  const { data, error } = await admin.rpc(rpcName, rpcArgs)
  if (error) {
    return jsonResponse({ error: error.message || "提交失敗" }, 400)
  }

  const origin = req.headers.get("origin")?.trim() || Deno.env.get("AD_PUBLIC_ORIGIN")?.trim() || ""
  const eventSourceUrl = origin
    ? `${origin.replace(/\/$/, "")}${landingPath || (mode === "interest" ? "/AdInterest" : "/AdTrial")}`
    : landingPath

  // 試堂／查詢維持既有 CAPI；功輔模式不另送，避免把新頁算進試堂轉化。
  if (mode === "trial" || mode === "interest") {
    await sendMetaCapiLead({
      eventId,
      mode,
      phone,
      phoneCountryCode,
      contactMethod,
      fbp,
      fbc,
      clientIp: rateKey,
      userAgent: clientUserAgent(req),
      eventSourceUrl,
    })
  }

  return jsonResponse(data ?? { accepted: true })
})
