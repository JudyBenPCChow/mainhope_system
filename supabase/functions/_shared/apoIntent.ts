/** 明學IT狗：意圖分流（免 LLM，慳 token） */

export type ApoIntent = "chitchat" | "howto" | "db_query"

const DB_KEYWORDS =
  /上堂|上唔上堂|請假|點名|出席|試堂|在讀|活躍|非活躍|排程|繳費|追收|班別|名單|學生|學號|報讀|課堂|今日有|幾點上|欠費|堂數|老師|teacher|roster|profile|待補|補課/i

const HOWTO_KEYWORDS =
  /如何|怎樣|點樣|在哪|邊度|怎麼|步驟|做法|新增|設定|分別|什麼是|係咩|意思|操作|入口|頁面/i

const CHITCHAT_KEYWORDS =
  /鍾意返工|鍾唔鍾意返工|訴求就係返工|想辭職|辭職|加人工|加糧|六合彩|有背景|背影|貧窮限制|頂硬上|吹水|傾偈|你好嗎|你是誰|你係誰|IT狗|明學IT狗/i

const FOLLOW_UP_PRONOUNS = /^(佢|她|他|呢個學生|呢位|嗰個|同上|剛才|上面|之前嗰|咁佢)/

export function isFollowUpQuestion(text: string): boolean {
  const t = text.trim()
  if (FOLLOW_UP_PRONOUNS.test(t)) return true
  if (/佢|她|呢位|呢個學生/.test(t) && t.length < 40) return true
  return false
}

export function classifyApoIntent(
  text: string,
  hasEntityContext: boolean
): ApoIntent {
  const t = text.trim()
  if (!t) return "howto"

  const followUp = isFollowUpQuestion(t)
  if (followUp && hasEntityContext) return "db_query"

  // 老師班別查詢一律走 DB
  if (/老師|teacher/i.test(t) && /班|課/.test(t)) return "db_query"
  if (/係老師|是老師/.test(t)) return "db_query"
  if (/班別|邊班|乜班|有咩班/.test(t) && /[A-Za-z]{2,}/.test(t)) return "db_query"

  const hasDb = DB_KEYWORDS.test(t)
  const hasHowto = HOWTO_KEYWORDS.test(t)
  const hasChitchat = CHITCHAT_KEYWORDS.test(t)

  // 明確閒聊（無業務關鍵字）
  if (hasChitchat && !hasDb && !hasHowto) return "chitchat"

  // 資料查詢優先
  if (hasDb) return "db_query"

  // 概念／操作教學
  if (hasHowto) return "howto"

  // 短句閒聊問候
  if (hasChitchat || /^(hi|hello|你好|嗨|早晨|午安)/i.test(t)) return "chitchat"

  // 追問但無上下文 → 當教學／澄清
  if (followUp) return "howto"

  return "howto"
}
