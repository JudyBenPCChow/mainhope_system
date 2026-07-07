import type { ApoPoMessage } from "@/services/apoPoQueries"
import { APO_PO_SESSION_STORAGE_KEY } from "@/lib/apoPoConfig"
import { EMPTY_PO_CONTEXT, type PoChatContext } from "@/lib/apoPo/types"

type ApoPoSessionPayload = {
  v: 1
  messages: ApoPoMessage[]
  poContext: PoChatContext
}

export function loadApoPoSession(): { messages: ApoPoMessage[] | null; poContext: PoChatContext } {
  if (typeof sessionStorage === "undefined") {
    return { messages: null, poContext: EMPTY_PO_CONTEXT }
  }
  try {
    const raw = sessionStorage.getItem(APO_PO_SESSION_STORAGE_KEY)
    if (!raw) return { messages: null, poContext: EMPTY_PO_CONTEXT }
    const parsed = JSON.parse(raw) as ApoPoSessionPayload
    if (parsed?.v === 1 && Array.isArray(parsed.messages)) {
      return {
        messages: parsed.messages,
        poContext: parsed.poContext ?? EMPTY_PO_CONTEXT,
      }
    }
  } catch {
    // ignore
  }
  return { messages: null, poContext: EMPTY_PO_CONTEXT }
}

export function saveApoPoSession(messages: ApoPoMessage[], poContext: PoChatContext): void {
  if (typeof sessionStorage === "undefined") return
  try {
    const payload: ApoPoSessionPayload = { v: 1, messages, poContext }
    sessionStorage.setItem(APO_PO_SESSION_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore
  }
}
