import {
  executeApoDbTool,
  extractContextPatch,
  type ApoContextPatch,
  type AssistantDbContext,
} from "./apoDbTools.ts"

/** 高頻查詢直連 RPC，跳過 tool-selection LLM 回合 */
export async function tryDirectDbQuery(
  text: string,
  ctx: AssistantDbContext,
  chatContext: ApoContextPatch | undefined
): Promise<{ toolName: string; resultJson: string; patch: ApoContextPatch } | null> {
  const t = text.trim()

  if (chatContext?.lastStudentId) {
    const sid = chatContext.lastStudentId
    if (/上堂|上唔上堂|幾點|今日.*堂|洗唔洗/.test(t)) {
      return invoke(ctx, "student_today_lessons", { student_id: sid })
    }
    if (/請假|請咗假|請假未/.test(t)) {
      return invoke(ctx, "student_today_lessons", { student_id: sid })
    }
    if (/狀態|在讀|活躍|報讀|邊班/.test(t)) {
      return invoke(ctx, "student_profile", { student_id: sid })
    }
    if (/出席|點名|最近/.test(t)) {
      return invoke(ctx, "student_recent_attendance", { student_id: sid, limit: 8 })
    }
    if (/繳費|追收|堂數|欠/.test(t) && ctx.userRole !== "teacher") {
      return invoke(ctx, "student_tuition", { student_id: sid })
    }
  }

  if (/今日.*請假|請假.*今日|邊個.*請假|請假名單/.test(t)) {
    return invoke(ctx, "today_leaves", {})
  }

  if (/試堂|trial/i.test(t) && !/如何|點樣|怎樣/.test(t)) {
    return invoke(ctx, "upcoming_trials", { days: 7 })
  }

  if (ctx.userRole === "teacher" && /我今日|今日.*堂|今日.*排程|今日有幾堂/.test(t)) {
    return invoke(ctx, "teacher_day_schedule", {})
  }

  return null
}

async function invoke(
  ctx: AssistantDbContext,
  toolName: string,
  args: Record<string, unknown>
): Promise<{ toolName: string; resultJson: string; patch: ApoContextPatch }> {
  const resultJson = await executeApoDbTool(toolName, args, ctx)
  let parsed: Record<string, unknown> = {}
  try {
    parsed = JSON.parse(resultJson) as Record<string, unknown>
  } catch {
    // ignore
  }
  return {
    toolName,
    resultJson,
    patch: extractContextPatch(toolName, parsed),
  }
}
