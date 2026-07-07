import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { createClient } from "jsr:@supabase/supabase-js@2"
import { resolveCallerFromRequest } from "../_shared/apoAuth.ts"
import { assertApoPoAccess } from "../_shared/apoPoAuth.ts"
import { handlePoChat } from "../_shared/apoPoChat.ts"
import { EMPTY_PO_CONTEXT, type PoChatContext } from "../_shared/apoPoTypes.ts"
import { corsHeaders, jsonResponse } from "../_shared/cors.ts"

type IncomingMessage = {
  role?: string
  content?: string
}

type RequestBody = {
  action?: string
  messages?: IncomingMessage[]
  poContext?: PoChatContext
}

function sanitizeMessages(raw: unknown): Array<{ role: "user" | "assistant"; content: string }> {
  if (!Array.isArray(raw)) return []
  const out: Array<{ role: "user" | "assistant"; content: string }> = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const role = (item as IncomingMessage).role
    const content = String((item as IncomingMessage).content ?? "").trim()
    if (role !== "user" && role !== "assistant") continue
    if (!content) continue
    out.push({ role, content: content.slice(0, 2000) })
  }
  return out.slice(-12)
}

function sanitizePoContext(raw: unknown): PoChatContext {
  if (!raw || typeof raw !== "object") return { ...EMPTY_PO_CONTEXT }
  const o = raw as PoChatContext
  const workflow = o.workflow === "create_class" ? "create_class" : "idle"
  const slots =
    o.slots && typeof o.slots === "object" ? (o.slots as PoChatContext["slots"]) : {}
  return { workflow, slots }
}

function createServiceClient() {
  const url = Deno.env.get("SUPABASE_URL")
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "僅支援 POST" }, 405)
  }

  const authResult = await resolveCallerFromRequest(req)
  if (!authResult.ok) {
    return jsonResponse({ error: authResult.error }, authResult.status)
  }

  const access = assertApoPoAccess(authResult.caller)
  if (!access.ok) {
    return jsonResponse({ error: access.error }, access.status)
  }

  let body: RequestBody = {}
  try {
    body = (await req.json()) as RequestBody
  } catch {
    return jsonResponse({ error: "請求格式不正確" }, 400)
  }

  const action = String(body.action ?? "chat").trim()

  if (action === "ping") {
    return jsonResponse({
      ok: true,
      message: "阿Po 已就緒",
      role: authResult.caller.userRole,
      email: authResult.caller.email,
    })
  }

  if (action === "chat") {
    const messages = sanitizeMessages(body.messages)
    if (messages.length === 0 || messages[messages.length - 1]?.role !== "user") {
      return jsonResponse({ error: "請提供至少一則使用者訊息" }, 400)
    }

    const admin = createServiceClient()
    if (!admin) {
      return jsonResponse({ error: "阿Po 伺服器資料庫連線未設定" }, 503)
    }

    const poContext = sanitizePoContext(body.poContext)
    const apiKey = Deno.env.get("DEEPSEEK_API_KEY") ?? null
    const result = await handlePoChat(admin, messages, poContext, { apiKey })

    return jsonResponse({
      reply: result.reply,
      suggestions: result.suggestions,
      choices: result.choices,
      poContext: result.poContext,
      pendingExecute: result.pendingExecute ?? null,
    })
  }

  if (action === "diagnose") {
    const admin = createServiceClient()
    if (!admin) {
      return jsonResponse({ error: "阿Po 伺服器資料庫連線未設定" }, 503)
    }

    const { count: unresolvedCount, error: countErr } = await admin
      .from("mgmt_system_errors")
      .select("id", { count: "exact", head: true })
      .is("resolved_at", null)

    if (countErr) {
      return jsonResponse({ error: "無法讀取系統報錯統計" }, 502)
    }

    const { data: recent, error: listErr } = await admin
      .from("mgmt_system_errors")
      .select("id, created_at, severity, source, message, resolved_at")
      .order("created_at", { ascending: false })
      .limit(8)

    if (listErr) {
      return jsonResponse({ error: "無法讀取最近報錯" }, 502)
    }

    return jsonResponse({
      ok: true,
      unresolvedCount: unresolvedCount ?? 0,
      recent: recent ?? [],
    })
  }

  return jsonResponse({ error: `不支援的操作：${action}` }, 400)
})
