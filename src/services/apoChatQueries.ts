import { appendMgmtSystemError } from "@/services/mgmtGodViewQueries"
import { sanitizeErrorDetail } from "@/lib/mgmtErrorReporting"
import { enrichApoReply } from "@/lib/apoPaths"
import { formatUnknownError } from "@/lib/formatUnknownError"
import type { Role } from "@/lib/navStructure"
import type { ApoChatContext } from "@/lib/apoSession"
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient"

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
  /** 👍／👎 */
  feedback?: "up" | "down" | null
  /** 可否解決你的問題 */
  satisfaction?: "solved" | "unsolved" | null
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
  if (o.lastTeacherId) out.lastTeacherId = String(o.lastTeacherId)
  if (o.lastTeacherName) out.lastTeacherName = String(o.lastTeacherName)
  if (o.lastTopic) out.lastTopic = String(o.lastTopic)
  if (o.summary) out.summary = String(o.summary)
  if (o.listOffset != null && Number.isFinite(Number(o.listOffset))) {
    out.listOffset = Math.max(0, Math.trunc(Number(o.listOffset)))
  }
  if (o.listTotal != null && Number.isFinite(Number(o.listTotal))) {
    out.listTotal = Math.max(0, Math.trunc(Number(o.listTotal)))
  }
  if (typeof o.listHasMore === "boolean") out.listHasMore = o.listHasMore
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

export type SubmitApoSatisfactionInput = {
  satisfied: boolean
  userRole: Role
  userMessage: string
  assistantMessage: string
}

/** 滿意度：已解決／不滿意；不滿意時推送至外星人 SystemIssues */
export async function submitApoChatSatisfaction(input: SubmitApoSatisfactionInput): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return

  const satisfaction = input.satisfied ? "solved" : "unsolved"
  let escalated = false

  if (!input.satisfied) {
    const detail = sanitizeErrorDetail(
      [
        `用戶角色：${input.userRole}`,
        `用戶問題：${input.userMessage.slice(0, 800)}`,
        `IT狗回覆：${input.assistantMessage.slice(0, 1200)}`,
      ].join("\n")
    )
    escalated = await appendMgmtSystemError({
      severity: "warning",
      source: "ApoAssistant.satisfaction",
      message: "明學IT狗回覆未解決用戶問題（用戶表示不滿意）",
      detail,
      path: typeof window !== "undefined" ? window.location.pathname : "/",
    })
  }

  try {
    const { error } = await supabase.from("apo_chat_feedback").insert({
      helpful: input.satisfied,
      satisfaction,
      escalated,
      user_role: input.userRole,
      user_message: input.userMessage.slice(0, 2000),
      assistant_message: input.assistantMessage.slice(0, 4000),
    })
    if (error) console.warn("apo_chat_feedback satisfaction insert failed", error.message)
  } catch (e) {
    console.warn("apo_chat_feedback satisfaction insert exception", e)
  }
}
