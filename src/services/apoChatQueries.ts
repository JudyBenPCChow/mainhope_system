import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient"
import { enrichApoReply } from "@/lib/apoPaths"
import { formatUnknownError } from "@/lib/formatUnknownError"
import type { Role } from "@/lib/navStructure"
import type { ApoChatContext } from "@/lib/apoSession"

export type ApoPathHint = {
  label: string
  path: string
}

export type ApoChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  suggestions?: string[]
  paths?: ApoPathHint[]
  feedback?: "up" | "down" | null
}

export type SendApoChatInput = {
  messages: Pick<ApoChatMessage, "role" | "content">[]
  userRole: Role
  /** 專班老師登入時的 teachers.id，供資料庫查詢範圍過濾 */
  teacherId?: string | null
  /** 對話上下文（當前討論學生等），減少重複搜尋 */
  chatContext?: ApoChatContext
}

export type SendApoChatResult =
  | {
      ok: true
      reply: string
      suggestions: string[]
      paths: ApoPathHint[]
      context: ApoChatContext
    }
  | { ok: false; message: string }

function mapInvokeError(error: unknown, data: unknown): string {
  if (data && typeof data === "object" && data !== null) {
    const err = (data as { error?: unknown }).error
    if (typeof err === "string" && err.trim()) return err.trim()
  }
  return formatUnknownError(error)
}

async function readFunctionErrorBody(error: unknown, response?: Response): Promise<string | null> {
  const res = response ?? (error as { context?: Response } | null)?.context
  if (!res || typeof res.json !== "function") return null
  try {
    const body = (await res.clone().json()) as { error?: unknown }
    if (typeof body.error === "string" && body.error.trim()) return body.error.trim()
  } catch {
    // ignore
  }
  return null
}

function normalizePaths(raw: unknown): ApoPathHint[] {
  if (!Array.isArray(raw)) return []
  const out: ApoPathHint[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const label = String((item as ApoPathHint).label ?? "").trim()
    const path = String((item as ApoPathHint).path ?? "").trim()
    if (!label || !path) continue
    out.push({ label, path })
  }
  return out
}

function normalizeSuggestions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((s) => String(s ?? "").trim()).filter(Boolean).slice(0, 3)
}

function normalizeContext(raw: unknown): ApoChatContext {
  if (!raw || typeof raw !== "object") return {}
  const o = raw as ApoChatContext
  const out: ApoChatContext = {}
  if (o.lastStudentId) out.lastStudentId = String(o.lastStudentId)
  if (o.lastStudentName) out.lastStudentName = String(o.lastStudentName)
  if (o.lastTopic) out.lastTopic = String(o.lastTopic)
  if (o.summary) out.summary = String(o.summary)
  return out
}

/** 呼叫 Edge Function「apo-chat」，由後端代連 DeepSeek（API Key 不經瀏覽器） */
export async function sendApoChatMessage(input: SendApoChatInput): Promise<SendApoChatResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      ok: false,
      message: "尚未設定 Supabase（VITE_SUPABASE_URL／VITE_SUPABASE_ANON_KEY），明學IT狗無法連線。",
    }
  }

  const { data, error, response } = await supabase.functions.invoke("apo-chat", {
    body: {
      messages: input.messages.map((m) => ({ role: m.role, content: m.content })),
      userRole: input.userRole,
      teacherId: input.teacherId ?? null,
      chatContext: input.chatContext ?? {},
    },
  })

  if (error) {
    const detail = await readFunctionErrorBody(error, response)
    if (detail) return { ok: false, message: detail }
    return { ok: false, message: mapInvokeError(error, data) }
  }

  if (data && typeof data === "object" && data !== null) {
    const payload = data as {
      reply?: unknown
      error?: unknown
      suggestions?: unknown
      paths?: unknown
      context?: unknown
    }
    if (typeof payload.error === "string" && payload.error.trim()) {
      return { ok: false, message: payload.error.trim() }
    }
    if (typeof payload.reply === "string" && payload.reply.trim()) {
      const enriched = enrichApoReply(payload.reply.trim(), normalizePaths(payload.paths))
      return {
        ok: true,
        reply: enriched.reply,
        suggestions: normalizeSuggestions(payload.suggestions),
        paths: enriched.paths,
        context: normalizeContext(payload.context),
      }
    }
  }

  return { ok: false, message: "明學IT狗回覆格式異常，請稍後再試。" }
}

export type SubmitApoFeedbackInput = {
  helpful: boolean
  userRole: Role
  userMessage: string
  assistantMessage: string
}

/** 儲存單則回覆回饋（靜默失敗，不阻擋對話） */
export async function submitApoChatFeedback(input: SubmitApoFeedbackInput): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return
  try {
    const { error } = await supabase.from("apo_chat_feedback").insert({
      helpful: input.helpful,
      user_role: input.userRole,
      user_message: input.userMessage.slice(0, 2000),
      assistant_message: input.assistantMessage.slice(0, 4000),
    })
    if (error) console.warn("apo_chat_feedback insert failed", error.message)
  } catch (e) {
    console.warn("apo_chat_feedback insert exception", e)
  }
}
