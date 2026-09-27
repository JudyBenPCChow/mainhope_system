import type { AdminOpsMessage } from "@/services/adminOpsAssistantQueries"
import { ADMIN_OPS_SESSION_STORAGE_KEY } from "@/lib/adminOpsAssistant/config"
import { EMPTY_ADMIN_OPS_CONTEXT, type AdminOpsChatContext } from "@/lib/adminOpsAssistant/types"

type SessionPayload = {
  v: 1
  messages: AdminOpsMessage[]
  opsContext: AdminOpsChatContext
}

export function loadAdminOpsSession(): {
  messages: AdminOpsMessage[] | null
  opsContext: AdminOpsChatContext
} {
  if (typeof sessionStorage === "undefined") {
    return { messages: null, opsContext: EMPTY_ADMIN_OPS_CONTEXT }
  }
  try {
    const raw = sessionStorage.getItem(ADMIN_OPS_SESSION_STORAGE_KEY)
    if (!raw) return { messages: null, opsContext: EMPTY_ADMIN_OPS_CONTEXT }
    const parsed = JSON.parse(raw) as SessionPayload
    if (parsed?.v === 1 && Array.isArray(parsed.messages)) {
      return {
        messages: parsed.messages,
        opsContext: parsed.opsContext ?? EMPTY_ADMIN_OPS_CONTEXT,
      }
    }
  } catch {
    // ignore
  }
  return { messages: null, opsContext: EMPTY_ADMIN_OPS_CONTEXT }
}

export function saveAdminOpsSession(
  messages: AdminOpsMessage[],
  opsContext: AdminOpsChatContext
): void {
  if (typeof sessionStorage === "undefined") return
  try {
    const payload: SessionPayload = { v: 1, messages, opsContext }
    sessionStorage.setItem(ADMIN_OPS_SESSION_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore
  }
}

export function clearAdminOpsSession(): void {
  if (typeof sessionStorage === "undefined") return
  try {
    sessionStorage.removeItem(ADMIN_OPS_SESSION_STORAGE_KEY)
  } catch {
    // ignore
  }
}
