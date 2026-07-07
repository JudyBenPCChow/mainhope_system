import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { tryDirectDbQuery } from "../_shared/apoDirectQuery.ts"
import {
  APO_DB_TOOL_DEFINITIONS,
  executeApoDbTool,
  extractContextPatch,
  formatContextHint,
  mergeContextPatches,
  toolsForRole,
  type ApoContextPatch,
  type ApoToolDef,
  type AssistantDbContext,
} from "../_shared/apoDbTools.ts"
import { logClientRoleMismatch, resolveCallerFromRequest } from "../_shared/apoAuth.ts"
import { classifyApoIntent, type ApoIntent } from "../_shared/apoIntent.ts"
import {
  buildCorePrompt,
  buildDbAnswerPrompt,
  buildHowtoPrompt,
  buildToolRouterPrompt,
} from "../_shared/apoPromptLayers.ts"
import { APO_VALID_PATHS, mergeReplyPaths } from "../_shared/apoRoutes.ts"
import { fallbackSuggestions } from "../_shared/apoSuggestions.ts"
import { corsHeaders, jsonResponse } from "../_shared/cors.ts"

type IncomingMessage = {
  role: "user" | "assistant"
  content: string
}

type RequestBody = {
  messages?: IncomingMessage[]
  userRole?: string
  teacherId?: string | null
  chatContext?: ApoContextPatch
}

type PathHint = { label: string; path: string }

type ParsedReply = {
  reply: string
  suggestions: string[]
  paths: PathHint[]
}

type ToolCall = {
  id: string
  type: "function"
  function: { name: string; arguments: string }
}

type DeepSeekMessage = {
  role: string
  content: string | null
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"
const DEEPSEEK_MODEL = Deno.env.get("DEEPSEEK_MODEL") ?? "deepseek-chat"
const MAX_HISTORY_TURNS = 6
const MAX_MESSAGE_CHARS = 2000
const MAX_TOOL_ROUNDS = 3

class UpstreamError extends Error {
  status: number
  constructor(status: number, detail: string) {
    super(detail)
    this.status = status
  }
}

function sanitizeMessages(raw: unknown): IncomingMessage[] {
  if (!Array.isArray(raw)) return []
  const out: IncomingMessage[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const role = (item as IncomingMessage).role
    const content = String((item as IncomingMessage).content ?? "").trim()
    if (role !== "user" && role !== "assistant") continue
    if (!content) continue
    out.push({ role, content: content.slice(0, MAX_MESSAGE_CHARS) })
  }
  return out.slice(-MAX_HISTORY_TURNS)
}

function sanitizeTeacherId(raw: unknown): string | null {
  if (raw == null) return null
  const s = String(raw).trim()
  if (!s || !/^[0-9a-f-]{36}$/i.test(s)) return null
  return s
}

function sanitizeChatContext(raw: unknown): ApoContextPatch {
  if (!raw || typeof raw !== "object") return {}
  const o = raw as ApoContextPatch
  const out: ApoContextPatch = {}
  if (o.lastStudentId && /^[0-9a-f-]{36}$/i.test(String(o.lastStudentId))) {
    out.lastStudentId = String(o.lastStudentId)
  }
  if (o.lastStudentName) out.lastStudentName = String(o.lastStudentName).slice(0, 80)
  if (o.lastTeacherId && /^[0-9a-f-]{36}$/i.test(String(o.lastTeacherId))) {
    out.lastTeacherId = String(o.lastTeacherId)
  }
  if (o.lastTeacherName) out.lastTeacherName = String(o.lastTeacherName).slice(0, 80)
  if (o.lastTopic) out.lastTopic = String(o.lastTopic).slice(0, 40)
  if (o.summary) out.summary = String(o.summary).slice(0, 200)
  if (o.listOffset != null && Number.isFinite(Number(o.listOffset))) {
    out.listOffset = Math.max(0, Math.trunc(Number(o.listOffset)))
  }
  if (o.listTotal != null && Number.isFinite(Number(o.listTotal))) {
    out.listTotal = Math.max(0, Math.trunc(Number(o.listTotal)))
  }
  if (typeof o.listHasMore === "boolean") out.listHasMore = o.listHasMore
  return out
}

function sanitizeSuggestions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const item of raw) {
    const s = String(item ?? "").trim()
    if (!s) continue
    out.push(s.slice(0, 40))
    if (out.length >= 3) break
  }
  return out
}

function sanitizePaths(raw: unknown): PathHint[] {
  if (!Array.isArray(raw)) return []
  const out: PathHint[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const label = String((item as PathHint).label ?? "").trim()
    const path = String((item as PathHint).path ?? "").trim()
    if (!label || !path.startsWith("/") || !APO_VALID_PATHS.has(path)) continue
    out.push({ label: label.slice(0, 40), path })
    if (out.length >= 3) break
  }
  return out
}

function stripJsonFences(text: string): string {
  const t = text.trim()
  const fenced = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return fenced ? fenced[1].trim() : t
}

function extractReplyField(parsed: Record<string, unknown>): string {
  for (const key of ["reply", "answer", "response", "content", "text"]) {
    const v = String(parsed[key] ?? "").trim()
    if (v) return v
  }
  return ""
}

function parseModelOutput(raw: string): ParsedReply {
  const trimmed = stripJsonFences(raw.trim())
  if (!trimmed) return { reply: "", suggestions: [], paths: [] }

  const tryParse = (text: string): ParsedReply | null => {
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>
      const reply = extractReplyField(parsed)
      if (reply) {
        return {
          reply,
          suggestions: sanitizeSuggestions(parsed.suggestions),
          paths: sanitizePaths(parsed.paths),
        }
      }
    } catch {
      // ignore
    }
    return null
  }

  const direct = tryParse(trimmed)
  if (direct) return direct

  const jsonMatch = trimmed.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    const nested = tryParse(jsonMatch[0])
    if (nested) return nested
  }

  if (!trimmed.startsWith("{")) {
    return { reply: trimmed, suggestions: [], paths: [] }
  }

  return { reply: "", suggestions: [], paths: [] }
}

type DeepSeekResult =
  | { ok: true; raw: string; finishReason: string | null; toolCalls: ToolCall[] }
  | { ok: false; status: number; detail: string }

async function callDeepSeek(
  apiKey: string,
  messages: DeepSeekMessage[],
  opts: { useJsonFormat: boolean; tools?: ApoToolDef[]; maxTokens?: number }
): Promise<DeepSeekResult> {
  const upstream = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: opts.maxTokens ?? 900,
      ...(opts.tools?.length ? { tools: opts.tools, tool_choice: "auto" } : {}),
      ...(opts.useJsonFormat ? { response_format: { type: "json_object" } } : {}),
    }),
  })

  const payload = await upstream.json()

  if (!upstream.ok) {
    const detail =
      typeof payload?.error?.message === "string"
        ? payload.error.message
        : `DeepSeek 回應錯誤（${upstream.status}）`
    return { ok: false, status: upstream.status, detail }
  }

  const choice = payload?.choices?.[0]
  const message = choice?.message
  const raw = message?.content
  const finishReason = typeof choice?.finish_reason === "string" ? choice.finish_reason : null
  const toolCalls = Array.isArray(message?.tool_calls) ? (message.tool_calls as ToolCall[]) : []

  if (typeof raw === "string" && raw.trim()) {
    return { ok: true, raw: raw.trim(), finishReason, toolCalls }
  }
  if (toolCalls.length > 0) {
    return { ok: true, raw: "", finishReason, toolCalls }
  }

  return { ok: true, raw: "", finishReason, toolCalls: [] }
}

function parseToolArgs(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    // ignore
  }
  return {}
}

async function singleJsonCall(
  apiKey: string,
  systemPrompt: string,
  history: IncomingMessage[],
  maxTokens: number
): Promise<string> {
  const messages: DeepSeekMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ]
  const result = await callDeepSeek(apiKey, messages, { useJsonFormat: true, maxTokens })
  if (!result.ok) throw new UpstreamError(result.status, result.detail)
  if (!result.raw) throw new UpstreamError(502, "明學IT狗沒有產生有效回覆")
  return result.raw
}

type ToolLoopResult = {
  messages: DeepSeekMessage[]
  toolsUsed: string[]
  contextPatches: ApoContextPatch[]
  hadTools: boolean
}

async function runToolLoop(
  apiKey: string,
  systemPrompt: string,
  history: IncomingMessage[],
  ctx: AssistantDbContext
): Promise<ToolLoopResult> {
  const messages: DeepSeekMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ]
  const toolsUsed: string[] = []
  const contextPatches: ApoContextPatch[] = []
  let hadTools = false

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const result = await callDeepSeek(apiKey, messages, {
      useJsonFormat: false,
      tools: toolsForRole(ctx.userRole),
      maxTokens: 500,
    })
    if (!result.ok) throw new UpstreamError(result.status, result.detail)

    if (result.toolCalls.length === 0) break

    hadTools = true
    messages.push({
      role: "assistant",
      content: result.raw || null,
      tool_calls: result.toolCalls,
    })

    for (const tc of result.toolCalls) {
      const name = tc.function.name
      toolsUsed.push(name)
      const resultJson = await executeApoDbTool(name, parseToolArgs(tc.function.arguments), ctx)
      try {
        const parsed = JSON.parse(resultJson) as Record<string, unknown>
        contextPatches.push(extractContextPatch(name, parsed))
      } catch {
        // ignore
      }
      messages.push({ role: "tool", tool_call_id: tc.id, content: resultJson })
    }
  }

  return { messages, toolsUsed, contextPatches, hadTools }
}

function mapUpstreamError(detail: string): string {
  if (detail === "Insufficient Balance") {
    return "明學IT狗暫時無法回應：DeepSeek 帳戶餘額不足，請到 platform.deepseek.com 充值後再試。"
  }
  return `明學IT狗暫時無法回應：${detail}`
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "僅支援 POST" }, 405)
  }

  const apiKey = Deno.env.get("DEEPSEEK_API_KEY")
  if (!apiKey) {
    return jsonResponse(
      {
        error:
          "明學IT狗尚未設定完成：請在 Supabase 專案的 Edge Functions Secrets 新增 DEEPSEEK_API_KEY。",
      },
      503
    )
  }

  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    return jsonResponse({ error: "請求格式不正確" }, 400)
  }

  const authResult = await resolveCallerFromRequest(req)
  if (!authResult.ok) {
    return jsonResponse({ error: authResult.error }, authResult.status)
  }
  const caller = authResult.caller
  logClientRoleMismatch(caller, body.userRole, sanitizeTeacherId(body.teacherId))

  const messages = sanitizeMessages(body.messages)
  if (messages.length === 0 || messages[messages.length - 1]?.role !== "user") {
    return jsonResponse({ error: "請提供至少一則使用者訊息" }, 400)
  }

  const chatContext = sanitizeChatContext(body.chatContext)
  const dbCtx: AssistantDbContext = {
    userRole: caller.userRole,
    teacherId: caller.teacherId,
  }

  const userRole = caller.userRole

  const lastUser = messages[messages.length - 1]?.content ?? ""
  const hasStudentCtx = Boolean(chatContext.lastStudentId)
  const hasTeacherCtx = Boolean(chatContext.lastTeacherId)
  const hasEntityCtx = hasStudentCtx || hasTeacherCtx
  const intent: ApoIntent = classifyApoIntent(lastUser, hasEntityCtx)
  const contextHint = formatContextHint(chatContext)

  let toolsUsed: string[] = []
  let contextPatch = { ...chatContext }

  try {
    let rawReply: string

    if (intent === "chitchat") {
      rawReply = await singleJsonCall(
        apiKey,
        buildCorePrompt(userRole, contextHint),
        messages,
        750
      )
    } else if (intent === "howto") {
      rawReply = await singleJsonCall(
        apiKey,
        buildHowtoPrompt(userRole, contextHint),
        messages,
        900
      )
    } else {
      // db_query
      const direct = await tryDirectDbQuery(lastUser, dbCtx, chatContext)

      if (direct) {
        toolsUsed = [direct.toolName]
        contextPatch = mergeContextPatches(chatContext, direct.patch)
        const dbMessages: IncomingMessage[] = [
          ...messages.slice(0, -1),
          {
            role: "user",
            content: `${lastUser}\n\n[系統查詢結果 ${direct.toolName}]\n${direct.resultJson}`,
          },
        ]
        rawReply = await singleJsonCall(
          apiKey,
          buildDbAnswerPrompt(userRole, formatContextHint(contextPatch)),
          dbMessages,
          950
        )
      } else {
        const loop = await runToolLoop(
          apiKey,
          buildToolRouterPrompt(userRole, contextHint),
          messages,
          dbCtx
        )
        toolsUsed = loop.toolsUsed
        contextPatch = mergeContextPatches(chatContext, ...loop.contextPatches)

        if (!loop.hadTools) {
          // 模型認為唔使查 DB → 用 howto 單次回答
          rawReply = await singleJsonCall(
            apiKey,
            buildHowtoPrompt(userRole, contextHint),
            messages,
            900
          )
        } else {
          loop.messages.push({
            role: "user",
            content:
              "請根據以上查詢結果，以 JSON（reply、suggestions、paths）回答用戶最後一則問題。先講結論；不可捏造。",
          })
          const finalMessages: DeepSeekMessage[] = [
            { role: "system", content: buildDbAnswerPrompt(userRole, formatContextHint(contextPatch)) },
            ...loop.messages.slice(1),
          ]
          const final = await callDeepSeek(apiKey, finalMessages, {
            useJsonFormat: true,
            maxTokens: 950,
          })
          if (!final.ok) throw new UpstreamError(final.status, final.detail)
          if (!final.raw) throw new UpstreamError(502, "明學IT狗沒有產生有效回覆")
          rawReply = final.raw
        }
      }
    }

    const parsed = parseModelOutput(rawReply)
    if (!parsed.reply) {
      return jsonResponse({ error: "明學IT狗回覆格式異常，請再試一次。" }, 502)
    }

    let suggestions =
      parsed.suggestions.length > 0
        ? parsed.suggestions
        : fallbackSuggestions(intent, toolsUsed, contextPatch.lastStudentName ?? contextPatch.lastTeacherName)

    if (
      contextPatch.listHasMore &&
      !suggestions.some((s) => /繼續/.test(s))
    ) {
      suggestions = ["繼續列出", ...suggestions].slice(0, 3)
    }

    const enriched = mergeReplyPaths(parsed.reply, parsed.paths)

    return jsonResponse({
      reply: enriched.reply,
      suggestions,
      paths: enriched.paths,
      context: contextPatch,
    })
  } catch (e) {
    if (e instanceof UpstreamError) {
      return jsonResponse({ error: mapUpstreamError(e.message) }, 502)
    }
    console.error("apo-chat exception", e)
    return jsonResponse({ error: "明學IT狗連線失敗，請稍後再試。" }, 502)
  }
})
