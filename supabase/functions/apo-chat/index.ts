import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { tryDirectDbQuery } from "../_shared/apoDirectQuery.ts"
import { emptyReplyFallback, tryDelegateActionReply } from "../_shared/apoDelegateRefusal.ts"
import { tryDirectHowtoAnswer } from "../_shared/apoHowtoGuides.ts"
import { cannotAnswerWithoutDbReply, requiresDatabaseAnswer } from "../_shared/apoNoHallucination.ts"
import {
  buildGroundingAnchors,
  buildSearchStudentsStructuredReply,
  buildStudentProfileStructuredReply,
  buildTeacherClassesStructuredReply,
  dbQueryNoToolsReply,
  fallbackReplyFromToolPayloads,
  formatToolResultsForPrompt,
  groundingRetryInstruction,
  parseToolPayload,
  validateReplyAgainstAnchors,
} from "../_shared/apoGrounding.ts"
import { hkTodayYmd } from "../_shared/apoDate.ts"
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
import { sanitizeUserFacingReply } from "../_shared/apoReplySanitize.ts"
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
  opts: {
    useJsonFormat: boolean
    tools?: ApoToolDef[]
    maxTokens?: number
    toolChoice?: "auto" | "required" | "none"
    temperature?: number
  }
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
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.maxTokens ?? 900,
      ...(opts.tools?.length
        ? {
            tools: opts.tools,
            tool_choice: opts.toolChoice ?? "auto",
          }
        : {}),
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
  maxTokens: number,
  temperature = 0.2
): Promise<string | null> {
  const messages: DeepSeekMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ]
  const result = await callDeepSeek(apiKey, messages, {
    useJsonFormat: true,
    maxTokens,
    temperature,
  })
  if (!result.ok) throw new UpstreamError(result.status, result.detail)
  if (!result.raw) return null
  return result.raw
}

function ensureParsedReply(
  parsed: ParsedReply,
  lastUser: string,
  userRole: string | undefined
): ParsedReply {
  if (parsed.reply.trim()) return parsed
  const fallback = emptyReplyFallback(lastUser, userRole)
  return {
    reply: fallback.reply,
    suggestions: parsed.suggestions.length > 0 ? parsed.suggestions : fallback.suggestions,
    paths: parsed.paths.length > 0 ? parsed.paths : fallback.paths,
  }
}

async function summarizeDbQuery(
  apiKey: string,
  userRole: string,
  contextHint: string,
  history: IncomingMessage[],
  extraUserContent?: string
): Promise<string | null> {
  const msgs: IncomingMessage[] = extraUserContent
    ? [...history.slice(0, -1), { role: "user", content: extraUserContent }]
    : history
  const result = await callDeepSeek(
    apiKey,
    [
      { role: "system", content: buildDbAnswerPrompt(userRole, contextHint) },
      ...msgs.map((m) => ({ role: m.role, content: m.content })),
    ],
    { useJsonFormat: true, maxTokens: 950, temperature: 0.1 }
  )
  if (!result.ok) throw new UpstreamError(result.status, result.detail)
  return result.raw?.trim() ? result.raw.trim() : null
}

async function parseDbAnswerFromTools(
  apiKey: string,
  userRole: string,
  contextHint: string,
  messages: IncomingMessage[],
  lastUser: string,
  toolsUsed: string[],
  toolPayloads: Record<string, unknown>[]
): Promise<ParsedReply> {
  const lastTool = toolsUsed[toolsUsed.length - 1] ?? ""
  const lastPayload = toolPayloads[toolPayloads.length - 1]

  if (
    lastPayload &&
    (lastTool === "teacher_classes" || lastTool === "my_teacher_classes")
  ) {
    const structured = buildTeacherClassesStructuredReply(lastPayload)
    if (structured) return structured
  }

  if (lastPayload && lastTool === "student_profile") {
    const structured = buildStudentProfileStructuredReply(lastPayload)
    if (structured) return structured
  }

  if (lastPayload && lastTool === "search_students") {
    const structured = buildSearchStudentsStructuredReply(lastPayload)
    if (structured) return structured
  }

  const fallback = fallbackReplyFromToolPayloads(toolsUsed, toolPayloads)
  if (fallback) return fallback

  return cannotAnswerWithoutDbReply()
}

function applyGroundingCheck(
  apiKey: string,
  userRole: string,
  contextHint: string,
  history: IncomingMessage[],
  parsed: ParsedReply,
  toolsUsed: string[],
  toolPayloads: Record<string, unknown>[]
): Promise<ParsedReply> {
  return (async () => {
    if (toolPayloads.length === 0) return parsed

    const anchors = buildGroundingAnchors(toolPayloads, hkTodayYmd())
    const check = validateReplyAgainstAnchors(parsed.reply, anchors)
    if (check.ok) return parsed

    console.warn("apo-chat grounding failed", check.issues)

    const lastUser = history[history.length - 1]?.content ?? ""
    const retryContent = `${lastUser}\n\n${formatToolResultsForPrompt(toolsUsed, toolPayloads)}\n\n${groundingRetryInstruction(check.issues)}`
    try {
      const rawRetry = await summarizeDbQuery(apiKey, userRole, contextHint, history, retryContent)
      if (rawRetry) {
        const retryParsed = parseModelOutput(rawRetry)
        if (retryParsed.reply) {
          const retryCheck = validateReplyAgainstAnchors(retryParsed.reply, anchors)
          if (retryCheck.ok) return retryParsed
          console.warn("apo-chat grounding retry failed", retryCheck.issues)
          return {
            ...retryParsed,
            reply:
              retryParsed.reply +
              "\n\n（系統提示：以上部分細節可能未經查詢確認，請以「進行點名」或「出席紀錄」頁面為準。）",
          }
        }
      }
    } catch (e) {
      console.warn("apo-chat grounding retry summarize failed", e)
    }
    return parsed
  })()
}

type ToolLoopResult = {
  messages: DeepSeekMessage[]
  toolsUsed: string[]
  contextPatches: ApoContextPatch[]
  toolPayloads: Record<string, unknown>[]
  hadTools: boolean
}

async function runToolLoop(
  apiKey: string,
  systemPrompt: string,
  history: IncomingMessage[],
  ctx: AssistantDbContext,
  opts?: { forceTools?: boolean }
): Promise<ToolLoopResult> {
  const messages: DeepSeekMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ]
  const toolsUsed: string[] = []
  const contextPatches: ApoContextPatch[] = []
  const toolPayloads: Record<string, unknown>[] = []
  let hadTools = false

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const mustUseTool = Boolean(opts?.forceTools) && !hadTools && round === 0
    const result = await callDeepSeek(apiKey, messages, {
      useJsonFormat: false,
      tools: toolsForRole(ctx.userRole),
      toolChoice: mustUseTool ? "required" : "auto",
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
      const parsedPayload = parseToolPayload(resultJson)
      if (parsedPayload) toolPayloads.push(parsedPayload)
      try {
        if (parsedPayload) contextPatches.push(extractContextPatch(name, parsedPayload))
      } catch {
        // ignore
      }
      messages.push({ role: "tool", tool_call_id: tc.id, content: resultJson })
    }
  }

  return { messages, toolsUsed, contextPatches, toolPayloads, hadTools }
}

function mapUpstreamError(detail: string): string {
  if (detail === "Insufficient Balance") {
    return "明學IT狗暫時無法回應：DeepSeek 帳戶餘額不足，請到 platform.deepseek.com 充值後再試。"
  }
  return `明學IT狗暫時無法回應：${detail}`
}

async function respondFromDbDirect(
  apiKey: string,
  userRole: string | undefined,
  messages: IncomingMessage[],
  lastUser: string,
  chatContext: ApoContextPatch,
  direct: { toolName: string; resultJson: string; patch: ApoContextPatch }
): Promise<Response> {
  const toolsUsed = [direct.toolName]
  const contextPatch = mergeContextPatches(chatContext, direct.patch)
  const directPayload = parseToolPayload(direct.resultJson)
  const toolPayloads: Record<string, unknown>[] = directPayload ? [directPayload] : []

  let parsed = await parseDbAnswerFromTools(
    apiKey,
    userRole,
    formatContextHint(contextPatch),
    messages,
    lastUser,
    toolsUsed,
    toolPayloads
  )

  if (parsed.reply && toolPayloads.length > 0) {
    const lastTool = toolsUsed[toolsUsed.length - 1] ?? ""
    const skipGrounding =
      lastTool === "teacher_classes" ||
      lastTool === "my_teacher_classes" ||
      lastTool === "student_profile" ||
      lastTool === "search_students"
    if (!skipGrounding) {
      parsed = await applyGroundingCheck(
        apiKey,
        userRole,
        formatContextHint(contextPatch),
        messages,
        parsed,
        toolsUsed,
        toolPayloads
      )
    }
  }

  if (!parsed.reply) {
    parsed = ensureParsedReply(parsed, lastUser, userRole)
  }

  let suggestions =
    parsed.suggestions.length > 0
      ? parsed.suggestions
      : fallbackSuggestions(
          "db_query",
          toolsUsed,
          contextPatch.lastStudentName ?? contextPatch.lastTeacherName
        )

  if (contextPatch.listHasMore && !suggestions.some((s) => /繼續/.test(s))) {
    suggestions = ["繼續列出", ...suggestions].slice(0, 3)
  }

  const enriched = mergeReplyPaths(sanitizeUserFacingReply(parsed.reply), parsed.paths)

  return jsonResponse({
    reply: enriched.reply,
    suggestions,
    paths: enriched.paths,
    context: contextPatch,
  })
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

  const delegateEarly = tryDelegateActionReply(lastUser, userRole)
  if (delegateEarly) {
    const enriched = mergeReplyPaths(sanitizeUserFacingReply(delegateEarly.reply), delegateEarly.paths)
    return jsonResponse({
      reply: enriched.reply,
      suggestions: delegateEarly.suggestions,
      paths: enriched.paths,
      context: chatContext,
    })
  }

  const directDbEarly = await tryDirectDbQuery(lastUser, dbCtx, chatContext)
  if (directDbEarly) {
    try {
      return await respondFromDbDirect(
        apiKey,
        userRole,
        messages,
        lastUser,
        chatContext,
        directDbEarly
      )
    } catch (e) {
      if (e instanceof UpstreamError) {
        return jsonResponse({ error: mapUpstreamError(e.message) }, 502)
      }
      throw e
    }
  }

  const directHowtoEarly = tryDirectHowtoAnswer(lastUser, userRole)
  if (directHowtoEarly) {
    const enriched = mergeReplyPaths(
      sanitizeUserFacingReply(directHowtoEarly.reply),
      directHowtoEarly.paths
    )
    return jsonResponse({
      reply: enriched.reply,
      suggestions: directHowtoEarly.suggestions,
      paths: enriched.paths,
      context: chatContext,
    })
  }

  const intent: ApoIntent = classifyApoIntent(lastUser, hasEntityCtx)

  if (requiresDatabaseAnswer(lastUser, hasEntityCtx) && intent !== "db_query") {
    const noData = cannotAnswerWithoutDbReply()
    const enriched = mergeReplyPaths(sanitizeUserFacingReply(noData.reply), noData.paths)
    return jsonResponse({
      reply: enriched.reply,
      suggestions: noData.suggestions,
      paths: enriched.paths,
      context: chatContext,
    })
  }

  const contextHint = formatContextHint(chatContext)

  let toolsUsed: string[] = []
  let contextPatch = { ...chatContext }
  let toolPayloads: Record<string, unknown>[] = []

  try {
    let parsed: ParsedReply

    if (intent === "chitchat") {
      const raw = await singleJsonCall(apiKey, buildCorePrompt(userRole, contextHint), messages, 750)
      parsed = ensureParsedReply(
        raw ? parseModelOutput(raw) : { reply: "", suggestions: [], paths: [] },
        lastUser,
        userRole
      )
    } else if (intent === "howto") {
      const raw = await singleJsonCall(apiKey, buildHowtoPrompt(userRole, contextHint), messages, 900)
      parsed = ensureParsedReply(
        raw ? parseModelOutput(raw) : { reply: "", suggestions: [], paths: [] },
        lastUser,
        userRole
      )
    } else {
      // db_query
      const direct = await tryDirectDbQuery(lastUser, dbCtx, chatContext)

      if (direct) {
        toolsUsed = [direct.toolName]
        contextPatch = mergeContextPatches(chatContext, direct.patch)
        const directPayload = parseToolPayload(direct.resultJson)
        if (directPayload) toolPayloads.push(directPayload)

        parsed = await parseDbAnswerFromTools(
          apiKey,
          userRole,
          formatContextHint(contextPatch),
          messages,
          lastUser,
          toolsUsed,
          toolPayloads
        )
      } else {
        let loop = await runToolLoop(
          apiKey,
          buildToolRouterPrompt(userRole, contextHint),
          messages,
          dbCtx
        )

        if (!loop.hadTools) {
          loop = await runToolLoop(
            apiKey,
            `${buildToolRouterPrompt(userRole, contextHint)}\n\n【強制】這是資料查詢問題，你必須至少呼叫一個唯讀查詢工具；不可在無查詢結果下回答。`,
            messages,
            dbCtx,
            { forceTools: true }
          )
        }

        toolsUsed = loop.toolsUsed
        contextPatch = mergeContextPatches(chatContext, ...loop.contextPatches)
        toolPayloads = loop.toolPayloads

        if (!loop.hadTools || toolPayloads.length === 0) {
          const delegate = tryDelegateActionReply(lastUser, userRole)
          parsed = delegate
            ? {
                reply: delegate.reply,
                suggestions: delegate.suggestions,
                paths: delegate.paths,
              }
            : dbQueryNoToolsReply()
        } else {
          parsed = await parseDbAnswerFromTools(
            apiKey,
            userRole,
            formatContextHint(contextPatch),
            messages,
            lastUser,
            toolsUsed,
            toolPayloads
          )
        }
      }

      if (parsed.reply && toolPayloads.length > 0) {
    const lastTool = toolsUsed[toolsUsed.length - 1] ?? ""
    const skipGrounding =
      lastTool === "teacher_classes" ||
      lastTool === "my_teacher_classes" ||
      lastTool === "student_profile" ||
      lastTool === "search_students"
    if (!skipGrounding) {
      parsed = await applyGroundingCheck(
        apiKey,
        userRole,
        formatContextHint(contextPatch),
        messages,
        parsed,
        toolsUsed,
        toolPayloads
      )
    }
  }
    }

    if (!parsed.reply) {
      parsed = ensureParsedReply(parsed, lastUser, userRole)
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

    const enriched = mergeReplyPaths(sanitizeUserFacingReply(parsed.reply), parsed.paths)

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
