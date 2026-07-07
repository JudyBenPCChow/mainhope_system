import { formatUnknownError } from "@/lib/formatUnknownError"
import type { PoChatContext, PoChoice, PoPendingExecute } from "@/lib/apoPo/types"
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient"

export type ApoPoMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  /** 用戶按鈕選擇時顯示嘅文字 */
  displayContent?: string
  choices?: PoChoice[]
  suggestions?: string[]
  pendingExecute?: PoPendingExecute | null
}

export type SendApoPoChatInput = {
  messages: Pick<ApoPoMessage, "role" | "content">[]
  poContext: PoChatContext
}

export type SendApoPoChatResult =
  | {
      ok: true
      reply: string
      suggestions: string[]
      choices: PoChoice[]
      poContext: PoChatContext
      pendingExecute: PoPendingExecute | null
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

function normalizeChoices(raw: unknown): PoChoice[] {
  if (!Array.isArray(raw)) return []
  const out: PoChoice[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const id = String((item as PoChoice).id ?? "").trim()
    const label = String((item as PoChoice).label ?? "").trim()
    const payload = String((item as PoChoice).payload ?? "").trim()
    if (!id || !label || !payload) continue
    out.push({ id, label, payload })
  }
  return out
}

function normalizeSuggestions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((s) => String(s ?? "").trim()).filter(Boolean).slice(0, 4)
}

function normalizePoContext(raw: unknown): PoChatContext {
  if (!raw || typeof raw !== "object") return { workflow: "idle", slots: {} }
  const o = raw as PoChatContext
  return {
    workflow: o.workflow === "create_class" ? "create_class" : "idle",
    slots: o.slots && typeof o.slots === "object" ? o.slots : {},
  }
}

function normalizePendingExecute(raw: unknown): PoPendingExecute | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as PoPendingExecute
  if (o.workflow !== "create_class") return null
  if (!o.slots || typeof o.slots !== "object") return null
  const previewLines = Array.isArray(o.previewLines)
    ? o.previewLines.map((l) => String(l ?? "").trim()).filter(Boolean)
    : []
  return { workflow: "create_class", slots: o.slots, previewLines }
}

/** 阿Po 對話（slot-filling + 按鈕選項） */
export async function sendApoPoChatMessage(input: SendApoPoChatInput): Promise<SendApoPoChatResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, message: "尚未設定 Supabase，阿Po 無法連線。" }
  }

  const { data, error, response } = await supabase.functions.invoke("apo-po", {
    body: {
      action: "chat",
      messages: input.messages.map((m) => ({ role: m.role, content: m.content })),
      poContext: input.poContext,
    },
  })

  if (error) {
    const detail = await readFunctionErrorBody(error, response)
    return { ok: false, message: detail ?? mapInvokeError(error, data) }
  }

  if (data && typeof data === "object" && data !== null) {
    const payload = data as {
      reply?: unknown
      error?: unknown
      suggestions?: unknown
      choices?: unknown
      poContext?: unknown
      pendingExecute?: unknown
    }
    if (typeof payload.error === "string" && payload.error.trim()) {
      return { ok: false, message: payload.error.trim() }
    }
    if (typeof payload.reply === "string" && payload.reply.trim()) {
      return {
        ok: true,
        reply: payload.reply.trim(),
        suggestions: normalizeSuggestions(payload.suggestions),
        choices: normalizeChoices(payload.choices),
        poContext: normalizePoContext(payload.poContext),
        pendingExecute: normalizePendingExecute(payload.pendingExecute),
      }
    }
  }

  return { ok: false, message: "阿Po 回覆格式異常。" }
}
