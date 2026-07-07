import type { ApoIntent } from "./apoIntent.ts"

/** 模型 suggestions 不足時的後備追問 */
export function fallbackSuggestions(
  intent: ApoIntent,
  toolsUsed: string[],
  studentName?: string | null
): string[] {
  if (intent === "chitchat") {
    return ["你可以幫我查學生上堂嗎？", "如何進行點名？", "在讀與活躍有什麼分別？"]
  }

  if (toolsUsed.includes("student_today_lessons") && studentName) {
    return [`${studentName}請假未？`, "佢報讀邊啲班？", "最近出席紀錄"]
  }

  if (toolsUsed.includes("search_students")) {
    return ["佢今日上唔上堂？", "學生狀態係點？", "最近出席紀錄"]
  }

  if (toolsUsed.includes("today_leaves")) {
    return ["邊個班今日上堂？", "如何進行點名？", "試堂預約"]
  }

  if (intent === "howto") {
    return ["詳細步驟係咩？", "老師角色有咩分別？", "邊度查出席紀錄？"]
  }

  return ["仲有咩可以幫到你？", "如何查今日請假？", "如何進行點名？"]
}
