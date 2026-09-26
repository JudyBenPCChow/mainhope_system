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

async function verifyTurnstile(token: string, remoteIp: string): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY")?.trim()
  if (!secret) {
    // 未設定 secret：仍允許提交（僅靠 DB 限速／蜜罐）。正式環境請設定。
    return true
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
  if (mode !== "trial" && mode !== "interest") {
    return jsonResponse({ error: "mode 無效" }, 400)
  }

  const rateKey = clientKeyFromRequest(req)
  const turnstileToken = asString(body.turnstileToken, 2048)
  const turnstileOk = await verifyTurnstile(turnstileToken, rateKey)
  if (!turnstileOk) {
    return jsonResponse({ error: "人機驗證失敗，請重新整理後再試" }, 403)
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

  const baseArgs = {
    p_full_name: asString(body.fullName, 80),
    p_school: asString(body.school, 120),
    p_grade: asString(body.grade, 10),
    p_phone: asString(body.phone, 40),
    p_note: asString(body.note, 500) || null,
    p_company: asString(body.company, 120),
    p_contact_method: contactMethod,
    p_wechat_id: contactMethod === "WeChat" ? asString(body.wechatId, 40) || null : null,
    p_phone_country_code: phoneCountryCode,
    p_rate_client_key: rateKey,
  }

  const rpcName = mode === "interest" ? "ad_trial_interest_submit" : "ad_trial_submit"
  const rpcArgs =
    mode === "interest"
      ? {
          ...baseArgs,
          p_subjects: Array.isArray(body.subjects)
            ? body.subjects.map((s) => asString(s, 40)).filter(Boolean)
            : [],
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
  return jsonResponse(data ?? { accepted: true })
})
