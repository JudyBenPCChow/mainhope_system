/** 明學IT狗：意圖分流（免 LLM，慳 token） */

import { extractStudentNameQuery } from "./apoStudentQuery.ts"

export type ApoIntent = "chitchat" | "howto" | "db_query"

const DB_KEYWORDS =
  /上堂|上唔上堂|請假|點名|出席|試堂|在讀|活躍|非活躍|排程|繳費|追收|班別|名單|學生|學號|報讀|課堂|今日有|幾點上|欠費|堂數|老師|teacher|roster|profile|待補|補課|依家報|而家報|報緊|讀緊|報什麼|報咩|報乜/i

const HOWTO_KEYWORDS =
  /如何|怎樣|點樣|在哪|邊度|怎麼|步驟|做法|新增|設定|分別|什麼是|係咩|意思|操作|入口|頁面|點用|點審|點處理|點刪|申請|提醒/i

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

  if (hasEntityContext && /點名狀態|點名.*如何|有冇點名|未點名|點咗名未/.test(t)) {
    return "db_query"
  }

  // 老師班別查詢一律走 DB
  if (/老師|teacher/i.test(t) && /班|課/.test(t)) return "db_query"
  if (/係老師|是老師/.test(t)) return "db_query"
  if (/班別|邊班|乜班|有咩班/.test(t) && /[A-Za-z]{2,}/.test(t)) return "db_query"

  // 今日點名狀態查詢（有「如何」仍屬資料查詢，唔係操作教學）
  if (/點名/.test(t) && /(?:今日|今天)/.test(t) && /狀態|如何|怎樣|點樣/.test(t)) {
    return "db_query"
  }

  // 學生而家報讀咩（「什麼」唔係操作教學）
  if (/依家報|而家報|報緊|讀緊|報什麼|報咩|報乜/.test(t)) {
    return "db_query"
  }

  const hasDb = DB_KEYWORDS.test(t)
  const hasHowto = HOWTO_KEYWORDS.test(t)
  const hasChitchat = CHITCHAT_KEYWORDS.test(t)

  // 概念／操作教學優先：明確問「如何做／係咩」時，即使有點名、在讀等關鍵字仍走 howto
  if (
    hasHowto &&
    /如何|怎樣|點樣|怎麼|步驟|做法|在哪|邊度|邊到|入口|點用|點審|點處理|點刪/.test(t)
  ) {
    return "howto"
  }
  if (/有.?什麼分別|有.?咩分別|意思是|定義|係咩|是什麼|什麼是/.test(t)) {
    if (/在讀|活躍|注冊|報讀|四維|學號|學業/.test(t)) return "howto"
    // 「報什麼」係查資料，唔係概念教學
    if (/依家報|而家報|報緊|讀緊|報什麼|報咩|報乜/.test(t)) return "db_query"
  }

  // 明確閒聊（無業務關鍵字）
  if (hasChitchat && !hasDb && !hasHowto) return "chitchat"

  // 資料查詢優先
  if (hasDb) return "db_query"

  // 短姓名查詢（例如「霍健一呢」）；業務關鍵字已由 extract 排除
  if (extractStudentNameQuery(t) && /^[\u4e00-\u9fffA-Za-z]/.test(t) && t.length <= 40) {
    const onlyName =
      /^[\u4e00-\u9fff]{2,4}[呢呀嗎嘛？?！!\s]*$/.test(t) ||
      /^[A-Za-z][A-Za-z\s.'-]{1,40}?[?？!！\s]*$/.test(t)
    if (onlyName) return "db_query"
  }

  // 概念／操作教學
  if (hasHowto) return "howto"

  // 短句閒聊問候
  if (hasChitchat || /^(hi|hello|你好|嗨|早晨|午安)/i.test(t)) return "chitchat"

  // 追問但無上下文 → 當教學／澄清
  if (followUp) return "howto"

  return "howto"
}
