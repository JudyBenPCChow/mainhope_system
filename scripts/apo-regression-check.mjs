#!/usr/bin/env node
/**
 * 明學IT狗：意圖／直連規則回歸檢查（離線，唔需要 DeepSeek）
 * 執行：npm run apo:regression
 */

const DB_KEYWORDS =
  /上堂|上唔上堂|請假|點名|出席|試堂|在讀|活躍|非活躍|排程|繳費|追收|班別|名單|學生|學號|報讀|課堂|今日有|幾點上|欠費|堂數|老師|teacher|roster|profile|待補|補課|依家報|而家報|報緊|讀緊|報什麼|報咩|報乜/i

const HOWTO_KEYWORDS =
  /如何|怎樣|點樣|在哪|邊度|怎麼|步驟|做法|新增|設定|分別|什麼是|係咩|意思|操作|入口|頁面/i

/** 與 apoIntent.ts classifyApoIntent 同步（離線鏡像） */
function classifyIntent(text, hasEntityContext = false) {
  const t = text.trim()
  if (/點名/.test(t) && /(?:今日|今天)/.test(t) && /狀態|如何|怎樣|點樣/.test(t)) {
    return "db_query"
  }
  if (/依家報|而家報|報緊|讀緊|報什麼|報咩|報乜/.test(t)) {
    return "db_query"
  }
  const hasDb = DB_KEYWORDS.test(t)
  const hasHowto = HOWTO_KEYWORDS.test(t)
  if (hasHowto && /如何|怎樣|點樣|怎麼|步驟|做法|在哪|邊度|邊到|入口/.test(t)) {
    return "howto"
  }
  if (/有.?什麼分別|有.?咩分別|意思是|定義|係咩|是什麼|什麼是/.test(t)) {
    if (/在讀|活躍|注冊|報讀|四維|學號|學業/.test(t)) return "howto"
  }
  if (hasDb) return "db_query"
  if (hasHowto) return "howto"
  return "howto"
}

/** 與 apoDelegateRefusal.ts isDelegateWriteRequest 同步 */
function isDelegateWriteRequest(text) {
  const t = text.trim()
  if (!t) return false
  if (/如何|怎樣|點樣|怎麼|步驟|做法|邊度|在哪|邊到/.test(t)) return false
  if (/^你可唔可以幫我加[？?]?$/.test(t)) return true
  if (/^幫我加[？?]?$/.test(t)) return true
  const asksAgent = /(?:你可唔可以|可唔可以|能否|可不可以|請你|幫我|替我|代我)/.test(t)
  const writeAction = /(?:加|新增|改|修改|刪|刪除|移除|建立|創建|開|設定|寫入|更新|登記|退讀|取消)/.test(t)
  return asksAgent && writeAction
}

function extractTeacherNameFromAttendanceQuery(text) {
  const t = text.trim()
  const patterns = [
    /^([A-Za-z][A-Za-z\s.'-]{1,50}?)\s+(?:今日|今天).{0,24}點名/,
    /^([A-Za-z][A-Za-z\s.'-]{1,50}?)\s+.{0,24}點名狀態/,
  ]
  for (const re of patterns) {
    const m = t.match(re)
    if (m?.[1]) return m[1].trim()
  }
  return null
}

function extractStudentNameQuery(text) {
  const t = text.trim()
  const patterns = [
    /^([\u4e00-\u9fff]{2,4})(?:依家|而家|現在).{0,12}(?:報|讀)/,
    /^([\u4e00-\u9fff]{2,8}?)(?:今日|今天).{0,24}(?:上堂|上唔上|有冇堂|洗唔洗)/,
    /^([\u4e00-\u9fff]{2,4})\s*.{0,12}(?:報緊|讀緊|報乜|報咩|報什麼|報讀)/,
    /^([A-Za-z][A-Za-z\s.'-]{1,50}?)\s+(?:今日|今天).{0,24}(?:上堂|上唔上|lesson)/i,
  ]
  for (const re of patterns) {
    const m = t.match(re)
    if (m?.[1]) return m[1].trim()
  }
  return null
}

function extractClassQueryFromText(text) {
  const code = text.match(/\b(\d{2}[A-Z]{2}-[A-Z0-9]+(?:-[A-Z0-9]+)?)\b/i)
  return code?.[1] ?? null
}

const cases = [
  {
    name: "點名狀態 → db 關鍵字",
    run: () => DB_KEYWORDS.test("點名狀態如何？"),
  },
  {
    name: "Mark Yu 點名 → 抽出老師名",
    run: () => extractTeacherNameFromAttendanceQuery("Mark Yu 今日點名狀態如何？") === "Mark Yu",
  },
  {
    name: "Cyndi Ng 班別 → 英文老師名",
    run: () => /^([A-Za-z][A-Za-z\s.'-]{1,50}?)\s+有(?:咩|什麼|哪些|乜)班/.test("Cyndi Ng 有咩班"),
  },
  {
    name: "班別代碼點名",
    run: () => extractClassQueryFromText("26SM-ENGS6008-A 今日點名名單") === "26SM-ENGS6008-A",
  },
  {
    name: "學生今日上堂",
    run: () => extractStudentNameQuery("陳大文今日上唔上堂？") === "陳大文",
  },
  {
    name: "ISO 日期錨點",
    run: () => {
      const hk = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Hong_Kong" }).format(new Date())
      return /^\d{4}-\d{2}-\d{2}$/.test(hk)
    },
  },
  {
    name: "如何進行點名 → howto 意圖",
    run: () => classifyIntent("如何進行點名？") === "howto",
  },
  {
    name: "在讀活躍分別 → howto 意圖",
    run: () => classifyIntent("在讀與活躍狀態有什麼分別？") === "howto",
  },
  {
    name: "老師點名狀態查詢 → db 意圖",
    run: () => classifyIntent("Mark Yu 今日點名狀態如何？") === "db_query",
  },
  {
    name: "點名教學 → 知識庫關鍵字",
    run: () => /點名/.test("如何進行點名？"),
  },
  {
    name: "你可唔可以幫我加 → 代辦寫入",
    run: () => isDelegateWriteRequest("你可唔可以幫我加"),
  },
  {
    name: "如何新增報讀 → 唔係代辦",
    run: () => !isDelegateWriteRequest("如何新增報讀班別？"),
  },
  {
    name: "蕭樂瑩依家報什麼 → 抽出學生名",
    run: () => extractStudentNameQuery("蕭樂瑩依家報什麼") === "蕭樂瑩",
  },
  {
    name: "蕭樂瑩依家報什麼 → db 意圖",
    run: () => classifyIntent("蕭樂瑩依家報什麼") === "db_query",
  },
  {
    name: "過濾舊版用語",
    run: () => {
      const out = "學生狀態分四維（唔好同舊版單一「狀態」欄混淆）：\n在讀 — 自動"
        .replace(/（?唔好同舊版[^）\n]*）?/g, "")
        .replace(/舊版[^。\n；;]{0,60}[。；;]?/g, "")
        .trim()
      return !out.includes("舊版") && out.startsWith("學生狀態分四維")
    },
  },
]

let failed = 0
for (const c of cases) {
  let ok = false
  try {
    ok = Boolean(c.run())
  } catch (e) {
    console.error(`✗ ${c.name}: ${e}`)
    failed++
    continue
  }
  if (ok) {
    console.log(`✓ ${c.name}`)
  } else {
    console.error(`✗ ${c.name}`)
    failed++
  }
}

if (failed > 0) {
  console.error(`\n${failed} 項失敗`)
  process.exit(1)
}
console.log(`\n全部 ${cases.length} 項通過`)
