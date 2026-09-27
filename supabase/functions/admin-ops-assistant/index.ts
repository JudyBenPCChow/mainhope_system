import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { createClient } from "jsr:@supabase/supabase-js@2"
import { resolveCallerFromRequest } from "../_shared/apoAuth.ts"
import { assertAdminOpsAccess } from "../_shared/adminOpsAuth.ts"
import { handleAdminOpsChat } from "../_shared/adminOpsChat.ts"
import { EMPTY_ADMIN_OPS_CONTEXT, type AdminOpsChatContext, type AdminOpsWorkflow } from "../_shared/adminOpsTypes.ts"
import { corsHeaders, jsonResponse } from "../_shared/cors.ts"

type IncomingMessage = {
  role?: string
  content?: string
}

type RequestBody = {
  action?: string
  messages?: IncomingMessage[]
  opsContext?: AdminOpsChatContext
}

const WORKFLOWS: AdminOpsWorkflow[] = [
  "idle",
  "clarify_scope",
  "delete_empty_class",
  "change_fixed_slot",
  "swap_slots",
  "create_class_schedule",
  "replace_empty_slot",
]

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
  return out.slice(-16)
}

function sanitizeOpsContext(raw: unknown): AdminOpsChatContext {
  if (!raw || typeof raw !== "object") return { ...EMPTY_ADMIN_OPS_CONTEXT }
  const o = raw as AdminOpsChatContext
  const workflow = WORKFLOWS.includes(o.workflow) ? o.workflow : "idle"
  const slots = o.slots && typeof o.slots === "object" ? o.slots : {}
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

  const access = assertAdminOpsAccess(authResult.caller)
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
      message: "班務助手已就緒",
      role: authResult.caller.userRole,
    })
  }

  if (action === "chat") {
    const messages = sanitizeMessages(body.messages)
    if (messages.length === 0 || messages[messages.length - 1]?.role !== "user") {
      return jsonResponse({ error: "請提供至少一則使用者訊息" }, 400)
    }

    const admin = createServiceClient()
    if (!admin) {
      return jsonResponse({ error: "班務助手伺服器資料庫連線未設定" }, 503)
    }

    const opsContext = sanitizeOpsContext(body.opsContext)
    const apiKey = Deno.env.get("DEEPSEEK_API_KEY") ?? null
    const result = await handleAdminOpsChat(admin, messages, opsContext, { apiKey })

    return jsonResponse({
      reply: result.reply,
      suggestions: result.suggestions,
      choices: result.choices,
      opsContext: result.opsContext,
      pendingExecute: result.pendingExecute ?? null,
    })
  }

  return jsonResponse({ error: `不支援的操作：${action}` }, 400)
})
