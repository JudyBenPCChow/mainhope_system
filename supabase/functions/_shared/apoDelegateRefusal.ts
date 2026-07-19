/** 用戶要求 IT狗代為新增／修改資料時的直答（唔經 LLM） */

export type DelegateRefusalReply = {
  reply: string
  suggestions: string[]
  paths: Array<{ label: string; path: string }>
}

function refusalPrefix(): string {
  return "我無法直接幫你改資料庫或代你按掣儲存，但可以教你喺邊個頁面自己做。\n\n"
}

/** 是否要求 IT狗代為執行寫入／修改（唔係問「如何」） */
export function isDelegateWriteRequest(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (/如何|怎樣|點樣|怎麼|步驟|做法|邊度|在哪|邊到/.test(t)) return false

  if (/^你可唔可以幫我加[？?]?$/.test(t)) return true
  if (/^幫我加[？?]?$/.test(t)) return true
  if (/^可唔可以幫我加[？?]?$/.test(t)) return true

  const asksAgent =
    /(?:你可唔可以|可唔可以|能否|可不可以|請你|幫我|替我|代我)/.test(t)
  const writeAction =
    /(?:加|新增|改|修改|刪|刪除|移除|建立|創建|開|設定|寫入|更新|登記|退讀|取消)/.test(t)

  return asksAgent && writeAction
}

export function tryDelegateActionReply(
  text: string,
  userRole: string | undefined
): DelegateRefusalReply | null {
  if (!isDelegateWriteRequest(text)) return null

  const t = text.trim()
  const isTeacher = userRole === "teacher"
  const canAdminEnroll = userRole === "admin" || userRole === "alien"

  if (/報讀|班別|加入班/.test(t)) {
    if (isTeacher) {
      return {
        reply:
          refusalPrefix() +
          "專班老師一般唔會喺系統幫學生新增報讀；請聯絡管理員。\n\n" +
          "你可以用「進行點名」處理自己班嘅出席，或問我查學生今日上堂狀態。",
        suggestions: ["如何進行點名？", "今日有邊個請假？", "我有咩班？"],
        paths: [{ label: "進行點名", path: "/Attendance" }],
      }
    }
    if (canAdminEnroll) {
      return {
        reply:
          refusalPrefix() +
          "新增報讀班別步驟：\n" +
          "1. 進入「學生管理」，打開該生詳情。\n" +
          "2. 切換到「報讀班別」分頁。\n" +
          "3. 揀班別同報讀形式（全期／暑期期數／單堂自選堂數）。\n" +
          "4. 若係單堂，勾選堂次後按「加入」。\n\n" +
          "請講埋學生姓名，我可以幫你查佢而家報讀咗邊啲班（唯讀）。",
        suggestions: ["如何新增報讀班別？", "單堂報讀係咩？", "在讀與活躍有什麼分別？"],
        paths: [{ label: "學生管理", path: "/Students" }],
      }
    }
  }

  if (/請假/.test(t) && canAdminEnroll) {
    return {
      reply:
        refusalPrefix() +
        "新增請假：進入「請假管理」→「新增請假」→ 揀學生、班別、課堂排程同原因後儲存。\n\n" +
        "亦可喺學生詳情內新增請假。",
      suggestions: ["如何請假？", "有邊個待補課？", "今日有邊個請假？"],
      paths: [{ label: "請假管理", path: "/LeaveManagement" }],
    }
  }

  if (/繳費|學費|出單|收款/.test(t) && canAdminEnroll) {
    return {
      reply:
        refusalPrefix() +
        "收款／出單：進入「收款登記」→ 揀學生 → 建立待繳或標記已收。查舊單請去「繳費紀錄」。\n\n" +
        "學生需先有報讀班別；新生可用「前台指引精靈」一次過做。",
      suggestions: ["如何登記繳費？", "如何用前台指引精靈？", "邊個要追收學費？"],
      paths: [
        { label: "收款登記", path: "/Payments" },
        { label: "繳費紀錄", path: "/PaymentHistory" },
      ],
    }
  }

  if (/(?:學生|新生)/.test(t) && /加|新增|建立/.test(t) && canAdminEnroll) {
    return {
      reply:
        refusalPrefix() +
        "新增學生：可用「前台指引精靈」一次過登記＋報讀＋收款；或進入「學生管理」→ 新增學生，再去詳情「報讀班別」加入班別。\n\n" +
        "建立主檔本身唔包含報讀。",
      suggestions: ["如何用前台指引精靈？", "如何新增報讀班別？", "學號點生成？"],
      paths: [
        { label: "前台指引精靈", path: "/FrontDeskWizard" },
        { label: "學生管理", path: "/Students" },
      ],
    }
  }

  if (/班別|開班/.test(t) && canAdminEnroll) {
    return {
      reply:
        refusalPrefix() +
        "新增班別：側欄「班別管理」→「新增班別」，填好課程、老師、時間等後儲存。",
      suggestions: ["如何新增班別？", "排程點管理？", "如何新增報讀班別？"],
      paths: [
        { label: "新增班別", path: "/Classes/New" },
        { label: "班別管理", path: "/Classes" },
      ],
    }
  }

  return {
    reply:
      refusalPrefix() +
      "你想加咩？請講清楚，例如：\n" +
      "• 幫學生加報讀班別\n" +
      "• 新增請假紀錄\n" +
      "• 新增學生\n" +
      "• 登記繳費\n" +
      "• 新增班別\n\n" +
      "講明邊一項，我會話你具體步驟同去邊一頁。",
    suggestions: [
      "如何新增報讀班別？",
      "如何進行點名？",
      "在讀與活躍有什麼分別？",
    ],
    paths: [{ label: "所有功能", path: "/AllFeatures" }],
  }
}

/** LLM 無回覆時的最後保底 */
export function emptyReplyFallback(text: string, userRole: string | undefined): DelegateRefusalReply {
  const delegate = tryDelegateActionReply(text, userRole)
  if (delegate) return delegate

  return {
    reply:
      "我未能理解你嘅問題，或者今次未能產生回覆。請試下講具體啲，例如：\n" +
      "• 「如何進行點名？」\n" +
      "• 「今日有邊個請假？」\n" +
      "• 「陳大文今日上唔上堂？」\n\n" +
      "如果想自己加資料，請講「想加報讀／請假／繳費」等，我會教你步驟（我無法代你儲存）。",
    suggestions: ["如何進行點名？", "今日有邊個請假？", "所有功能有咩？"],
    paths: [{ label: "所有功能", path: "/AllFeatures" }],
  }
}
