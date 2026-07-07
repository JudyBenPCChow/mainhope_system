import type { ApoChatMessage } from "@/services/apoChatQueries"

import { APO_SESSION_STORAGE_KEY } from "./apoConfig"

export type ApoChatContext = {
  lastStudentId?: string | null
  lastStudentName?: string | null
  lastTopic?: string | null
  summary?: string | null
}

type ApoSessionPayload = {
  v: 1
  messages: ApoChatMessage[]
  context: ApoChatContext
}

export const EMPTY_APO_CHAT_CONTEXT: ApoChatContext = {}

export function loadApoSession(): { messages: ApoChatMessage[] | null; context: ApoChatContext } {
  if (typeof sessionStorage === "undefined") {
    return { messages: null, context: EMPTY_APO_CHAT_CONTEXT }
  }
  try {
    const raw = sessionStorage.getItem(APO_SESSION_STORAGE_KEY)
    if (!raw) return { messages: null, context: EMPTY_APO_CHAT_CONTEXT }

    const parsed = JSON.parse(raw) as ApoSessionPayload | ApoChatMessage[]
    if (Array.isArray(parsed)) {
      return { messages: parsed, context: EMPTY_APO_CHAT_CONTEXT }
    }
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.messages)) {
      return {
        messages: parsed.messages,
        context: parsed.context ?? EMPTY_APO_CHAT_CONTEXT,
      }
    }
  } catch {
    // ignore
  }
  return { messages: null, context: EMPTY_APO_CHAT_CONTEXT }
}

export function saveApoSession(messages: ApoChatMessage[], context: ApoChatContext): void {
  if (typeof sessionStorage === "undefined") return
  try {
    const payload: ApoSessionPayload = { v: 1, messages, context }
    sessionStorage.setItem(APO_SESSION_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // quota or private mode
  }
}
