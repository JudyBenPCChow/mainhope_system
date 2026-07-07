/** 禁止捏造資料：查唔到資料庫就明確話唔知 */

import { classifyApoIntent } from "./apoIntent.ts"
import { extractStudentNameQuery } from "./apoStudentQuery.ts"
import { extractTeacherNameQuery } from "./apoTeacherQuery.ts"

export const APO_NO_HALLUCINATION_RULE = `
**鐵則（最高優先）**：任何學生、老師、班別、點名、請假、繳費、名單等**事實性資料**，只可來自本次系統查詢結果；查唔到或結果不足時，必須直接說「我查唔到／唔肯定」，**絕對不可**憑空捏造姓名、學號、班名、時間、狀態或數字。操作教學（去邊頁、點咩掣）可用知識庫；閒聊可幽默，但同樣不可假裝查過資料庫。
`.trim()

export type SafeParsedReply = {
  reply: string
  suggestions: string[]
  paths: Array<{ label: string; path: string }>
}

/** 需要即時資料庫佐證先可以答（唔係純概念／操作教學） */
export function requiresDatabaseAnswer(text: string, hasEntityContext = false): boolean {
  const t = text.trim()
  if (!t) return false

  if (/^(hi|hello|你好|嗨|早晨|午安)/i.test(t)) return false

  // 概念／定義（知識庫直答，唔使查 DB）
  if (/有.?什麼分別|有.?咩分別|什麼是|係咩|意思是|定義/.test(t)) {
    if (/在讀|活躍|注冊|報讀|四維|學號|學業/.test(t)) return false
  }

  // 純操作教學（無具名查詢對象）
  if (/如何|怎樣|點樣|怎麼|步驟|做法|邊度|在哪|邊到|入口/.test(t)) {
    const named =
      Boolean(extractStudentNameQuery(t)) ||
      Boolean(extractTeacherNameQuery(t)) ||
      /^[\u4e00-\u9fff]{2,4}(?:依家|而家|現在)/.test(t) ||
      /^[A-Za-z][A-Za-z\s.'-]{1,50}(?:\s|$)/.test(t)
    if (!named) return false
  }

  if (classifyApoIntent(t, hasEntityContext) === "db_query") return true

  if (extractStudentNameQuery(t) || extractTeacherNameQuery(t)) return true

  return /上堂|上唔上|請假|點名|出席|試堂|在讀|活躍|排程|繳費|追收|班別|名單|學號|報讀|今日有|待補|補課|欠費|依家報|而家報|報緊|讀緊|報什麼|報咩|報乜/.test(
    t
  )
}

export function cannotAnswerWithoutDbReply(): SafeParsedReply {
  return {
    reply:
      "我未能從資料庫查到可靠資料來回答呢個問題，所以唔會亂估。\n\n" +
      "請你講清楚學生或老師姓名／學號，或者換個方式再問。若係問系統點用，可以問例如「如何進行點名？」。",
    suggestions: ["如何進行點名？", "今日有邊個請假？", "在讀與活躍有什麼分別？"],
    paths: [{ label: "所有功能", path: "/AllFeatures" }],
  }
}
