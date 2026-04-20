/** 將未知錯誤（含 Supabase Postgrest 錯誤物件）轉成可顯示的中文／純文字訊息 */
export function formatUnknownError(e: unknown): string {
  if (e == null) return "未知錯誤"
  if (typeof e === "string") return e.trim() || "未知錯誤"
  if (e instanceof Error) {
    const m = e.message?.trim()
    return m || "發生錯誤"
  }
  if (typeof e !== "object") return String(e)

  const o = e as Record<string, unknown>

  const pickStr = (v: unknown): string | null =>
    typeof v === "string" && v.trim() ? v.trim() : null

  const msg = pickStr(o.message)
  if (msg) return msg

  const nested = o.error
  if (nested && typeof nested === "object") {
    const ne = nested as Record<string, unknown>
    const nm = pickStr(ne.message)
    if (nm) return nm
  }

  const details = pickStr(o.details)
  const hint = pickStr(o.hint)
  const code = pickStr(o.code)
  const pieces = [details, hint].filter(Boolean)
  if (pieces.length > 0) {
    return code ? `${pieces.join(" · ")}（${code}）` : pieces.join(" · ")
  }
  if (code) return `請求失敗（${code}）`

  try {
    return JSON.stringify(o)
  } catch {
    return "發生錯誤"
  }
}
