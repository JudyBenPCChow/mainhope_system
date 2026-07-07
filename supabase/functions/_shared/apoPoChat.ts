import type { SupabaseClient } from "jsr:@supabase/supabase-js@2"
import {
  handleCreateClassTurn,
  isCancelWorkflow,
  isCreateClassIntent,
  isLikelyCreateClassDetails,
} from "./apoPoCreateClassFlow.ts"
import { EMPTY_PO_CONTEXT, type PoChatContext, type PoChatResult } from "./apoPoTypes.ts"

type IncomingMessage = { role: "user" | "assistant"; content: string }

export async function handlePoChat(
  admin: SupabaseClient,
  messages: IncomingMessage[],
  poContext: PoChatContext,
  opts?: { apiKey?: string | null }
): Promise<PoChatResult> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content?.trim() ?? ""
  const history = messages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }))
  const turnOpts = { apiKey: opts?.apiKey, history }
  let ctx = poContext?.workflow ? poContext : { ...EMPTY_PO_CONTEXT }

  if (isCancelWorkflow(lastUser)) {
    return {
      reply: "已取消目前工作。你想做咩可以重新講，例如「幫我開班」或「系統診斷」。",
      suggestions: ["幫我開新班", "系統診斷"],
      choices: [],
      poContext: { ...EMPTY_PO_CONTEXT },
      pendingExecute: null,
    }
  }

  if (ctx.workflow === "create_class") {
    return await handleCreateClassTurn(admin, lastUser, ctx.slots ?? {}, turnOpts)
  }

  if (/系統診斷|診斷/.test(lastUser)) {
    const { count } = await admin
      .from("mgmt_system_errors")
      .select("id", { count: "exact", head: true })
      .is("resolved_at", null)

    const { data: recent } = await admin
      .from("mgmt_system_errors")
      .select("severity, message, source, created_at")
      .order("created_at", { ascending: false })
      .limit(5)

    const lines = (recent ?? []).map((row) => {
      const r = row as Record<string, unknown>
      return `• [${r.severity}] ${r.message}（${r.source}）`
    })

    return {
      reply:
        `系統診斷完成：未解決報錯 ${count ?? 0} 筆。\n` +
        (lines.length > 0 ? `最近紀錄：\n${lines.join("\n")}` : "最近沒有新報錯。") +
        "\n\n詳情可到「報錯與問題」頁面。",
      suggestions: ["幫我開新班", "今日有邊個請假？"],
      choices: [],
      poContext: { ...EMPTY_PO_CONTEXT },
      pendingExecute: null,
    }
  }

  if (isCreateClassIntent(lastUser) || isLikelyCreateClassDetails(lastUser)) {
    return await handleCreateClassTurn(admin, lastUser, { status: "進行中" }, turnOpts)
  }

  return {
    reply:
      "你好，我係阿Po（外星人工作台）。我可以幫你以對話方式處理系統工作，例如開班別；你可以一次過用自然語言講班別資料，未齊嘅會用按鈕方便你揀。\n\n" +
      "你可以講：\n• 「幫我開新班」\n• 「系統診斷」\n\n查學生、點名等日常問題請用右下角明學IT狗。",
    suggestions: ["幫我開新班", "系統診斷"],
    choices: [],
    poContext: { ...EMPTY_PO_CONTEXT },
    pendingExecute: null,
  }
}
