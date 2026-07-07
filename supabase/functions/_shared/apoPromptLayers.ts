import { APO_DB_TOOLS_PROMPT } from "./apoDbTools.ts"
import { APO_SYSTEM_DIRECTIVES, APO_ROUTES_COMPACT, APO_STATUS_COMPACT } from "./apoKnowledge.ts"
import { APO_JSON_INSTRUCTIONS } from "./apoRoutes.ts"

const ROLE_LABELS: Record<string, string> = {
  admin: "管理員（admin）",
  teacher: "專科班老師（teacher）",
  alien: "外星人（alien）",
}

export function roleLine(userRole: string | undefined): string {
  return userRole
    ? `目前登入角色：${ROLE_LABELS[userRole] ?? userRole}。`
    : "目前使用者角色未知。"
}

export function buildContextHintBlock(contextHint: string | undefined): string {
  if (!contextHint?.trim()) return ""
  return `\n\n## 對話上下文（沿用，唔使重複搜尋）\n${contextHint.trim()}`
}

/** L1：身份、語氣、業務／閒聊守則 */
export function buildCorePrompt(userRole: string | undefined, contextHint?: string): string {
  return `${APO_SYSTEM_DIRECTIVES}${buildContextHintBlock(contextHint)}

---

${APO_JSON_INSTRUCTIONS}

---

${roleLine(userRole)}`
}

/** 操作教學：L1 + 精簡路由與狀態 */
export function buildHowtoPrompt(userRole: string | undefined, contextHint?: string): string {
  return `${buildCorePrompt(userRole, contextHint)}

---

${APO_ROUTES_COMPACT}

${APO_STATUS_COMPACT}`
}

/** DB 工具選擇：極簡 router，唔載語氣金句 */
export function buildToolRouterPrompt(userRole: string | undefined, contextHint?: string): string {
  return `你是明學管理系統的查詢路由器（明學IT狗後台）。根據用戶最後一則問題，選擇並呼叫唯讀工具；唔好閒聊。
${buildContextHintBlock(contextHint)}
${roleLine(userRole)}

${APO_DB_TOOLS_PROMPT}

規則：
- 具名**老師**／問老師班別：admin 用 search_teachers → teacher_classes；**專班老師**用 my_teacher_classes（只查自己）。
- 具名**學生**必先 search_students（除非上下文已有 student_id）。
- 有 student_id 後用 student_today_lessons / student_profile 等。
- 今日請假名單用 today_leaves；待補課名單用 pending_makeups；追收學費名單用 overdue_tuition_list（admin／alien）；老師自己排程用 teacher_day_schedule。
- 分頁名單 has_more 為 true 時，必須問用戶是否繼續；用戶答「繼續」時用 next_offset。
- 一次可呼叫多個工具；唔好捏造。`
}

/** DB 答覆：L1 + 查詢結果綜合（唔再附 tool definitions） */
export function buildDbAnswerPrompt(userRole: string | undefined, contextHint?: string): string {
  return `${APO_SYSTEM_DIRECTIVES}${buildContextHintBlock(contextHint)}

---

${APO_JSON_INSTRUCTIONS}

---

${roleLine(userRole)}

根據 tool 查詢結果或系統提供的查詢摘要回答；先結論；不可捏造。
若 teacher_classes 或 search_teachers 顯示 class_count > 0，必須列出班別，不可說「冇被分配班別」。
若 pending_makeups 或 overdue_tuition_list 的 has_more 為 true，必須說明已列出頭 20 筆、仲有幾多筆，並問用戶是否繼續；suggestions 應包含「繼續列出」。`
}
