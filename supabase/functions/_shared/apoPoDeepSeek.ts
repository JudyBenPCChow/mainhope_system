const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"
const DEEPSEEK_MODEL = Deno.env.get("DEEPSEEK_MODEL") ?? "deepseek-chat"

export type DeepSeekJsonResult =
  | { ok: true; raw: string }
  | { ok: false; status: number; detail: string }

/** 阿Po：單次 JSON 格式 DeepSeek 呼叫 */
export async function callDeepSeekJson(
  apiKey: string,
  systemPrompt: string,
  userContent: string,
  opts?: { maxTokens?: number; temperature?: number }
): Promise<DeepSeekJsonResult> {
  const upstream = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: opts?.temperature ?? 0.1,
      max_tokens: opts?.maxTokens ?? 500,
      response_format: { type: "json_object" },
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

  const raw = payload?.choices?.[0]?.message?.content
  if (typeof raw === "string" && raw.trim()) {
    return { ok: true, raw: raw.trim() }
  }

  return { ok: false, status: 502, detail: "DeepSeek 無回覆內容" }
}

export function parseJsonObject(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  const text = fenced ? fenced[1].trim() : trimmed
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed
  } catch {
    const m = text.match(/\{[\s\S]*\}/)
    if (m) {
      try {
        const parsed = JSON.parse(m[0]) as Record<string, unknown>
        if (parsed && typeof parsed === "object") return parsed
      } catch {
        // ignore
      }
    }
  }
  return null
}
