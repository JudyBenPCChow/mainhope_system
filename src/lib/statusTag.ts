import type { TagTone } from "@/components/ui/tag"

export type StatusTagRule = {
 tone: TagTone
 /**
  * 關鍵字（不分大小寫），只要命中任一字串即套用 tone。
  * 建議將更高優先級規則放在較前面。
  */
 keywords: string[]
}

const COMMON_CANCELLED_RULES: StatusTagRule[] = [
 // 全模組共用：取消 / 作廢 / 撤回屬中性灰階
 { tone: "default", keywords: ["cancel", "cancelled", "取消", "已取消", "作廢", "撤回"] },
]

const STUDENT_CLASSIFICATION_RULES: StatusTagRule[] = [
 { tone: "default", keywords: ["非活躍生", "非注冊", "非在讀", "中學階段"] },
 { tone: "success", keywords: ["活躍生", "注冊", "已註冊"] },
 { tone: "info", keywords: ["已畢業"] },
]

const HR_AND_ATTENDANCE_RULES: StatusTagRule[] = [
 // 人員狀態 / 出勤：錯誤／扣堂缺席態（no show 高於泛用）
 { tone: "error", keywords: ["no show", "failed", "error", "錯誤", "失敗", "拒絕", "離職", "非在職", "缺席"] },
 // 請假類（含扣堂之「請假而不需補回」與舊「不用補回」）
 { tone: "warning", keywords: ["請假而不需補回", "不用補回", "事假", "病假"] },
 // 扣堂上課形式
 { tone: "info", keywords: ["錄影回放", "zoom實時網課", "即時直播", "網課", "線上"] },
 // 人員狀態 / 出勤：成功態
 { tone: "success", keywords: ["在職", "在讀", "現場", "出席", "準時"] },
]

const SCHEDULE_AND_TASK_RULES: StatusTagRule[] = [
 // 排程：加堂（額外加開課堂，獨立標記）以橙色提示
 { tone: "warning", keywords: ["加堂"] },
 // 排程：代堂指派（高於泛用「安排」）
 { tone: "warning", keywords: ["已指派代堂", "代堂"] },
 // 排程 / 待辦：待處理與提醒態
 { tone: "warning", keywords: ["pending", "待", "逾期", "提醒", "補課中", "保留中"] },
 // 排程 / 待辦：正常（如常進行）／預定與進行態
 { tone: "info", keywords: ["booked", "預定", "安排", "處理中", "in progress"] },
 // 排程 / 待辦：完成態
 { tone: "success", keywords: ["success", "完成", "已完成", "done", "ok"] },
]

const PAYMENT_RULES: StatusTagRule[] = [
 // 繳費：成功入帳態
 { tone: "success", keywords: ["已收款", "已批核", "已收"] },
]

const TRIAL_AND_ENROLLMENT_RULES: StatusTagRule[] = [
 // 試堂類型
 { tone: "success", keywords: ["免費試堂", "免費"] },
 { tone: "warning", keywords: ["半價試堂", "半價"] },
 { tone: "info", keywords: ["全價", "正式試堂"] },
 { tone: "default", keywords: ["當日紀錄"] },
 // 單堂報讀（高於泛用「報讀」）
 { tone: "info", keywords: ["單堂報讀", "單堂", "沒有報讀此堂", "未報讀此堂"] },
 // 排程列表：尚無報讀（高於泛用「報讀」，中性灰）
 { tone: "default", keywords: ["暫未有學生報讀", "無人報讀"] },
 // 日視圖：全員請假／部分請假生
 { tone: "warning", keywords: ["所有學生請假", "請假生"] },
 // 日視圖：網課生／要錄影（高於泛用「試堂」）
 { tone: "info", keywords: ["網課生", "要錄影"] },
 // 日視圖：試堂生（高於泛用「試堂」）
 { tone: "warning", keywords: ["試堂生"] },
 // 排程學生名單等：試堂來源（橙）；就讀來源（藍，見下一條）
 { tone: "warning", keywords: ["試堂"] },
 // 試堂 / 報讀：進行與預約態
 { tone: "info", keywords: ["報讀", "可分配", "已分配", "就讀", "已預約"] },
 // 試堂 / 報讀：待跟進
 { tone: "warning", keywords: ["待跟進", "待安排", "退讀"] },
]

const ISSUE_AND_ROLE_RULES: StatusTagRule[] = [
 // 系統問題 / 待處理
 { tone: "warning", keywords: ["待處理", "open", "未解決"] },
 // 角色：管理員
 { tone: "info", keywords: ["admin", "管理員", "alien", "外星人"] },
 // 角色：老師
 { tone: "success", keywords: ["teacher", "老師", "專班"] },
]

const OPS_DASHBOARD_STATUS_RULES: StatusTagRule[] = [
 // 營運總覽 KPI／警示：綠=正常、橙=注意、紅=警示（置頂優先）
 { tone: "error", keywords: ["警示"] },
 { tone: "warning", keywords: ["注意"] },
 { tone: "success", keywords: ["正常"] },
]

/**
 * 狀態字典（可配置）
 *
 * 維護原則：
 * 1) 先放「高優先」規則（越上面越先匹配）
 * 2) 需要新增狀態時，只改這裡，不改各頁元件
 * 3) 盡量將關鍵字放到最貼近業務模組的分段
 */
export const STATUS_TAG_RULES: StatusTagRule[] = [
 ...OPS_DASHBOARD_STATUS_RULES,
 ...COMMON_CANCELLED_RULES,
 ...STUDENT_CLASSIFICATION_RULES,
 ...HR_AND_ATTENDANCE_RULES,
 ...SCHEDULE_AND_TASK_RULES,
 ...PAYMENT_RULES,
 ...TRIAL_AND_ENROLLMENT_RULES,
 ...ISSUE_AND_ROLE_RULES,
]

function normalize(text: string): string {
 return text.trim().toLowerCase()
}

export type StatusTagExplainResult = {
 input: string
 normalized: string
 tone: TagTone
 matched: boolean
 ruleIndex: number | null
 keyword: string | null
}

export function explainStatusTone(status: string | null | undefined): StatusTagExplainResult {
 const input = String(status ?? "")
 const s = normalize(input)
 if (!s) {
  return { input, normalized: s, tone: "default", matched: false, ruleIndex: null, keyword: null }
 }
 for (let i = 0; i < STATUS_TAG_RULES.length; i += 1) {
  const rule = STATUS_TAG_RULES[i]!
  for (const kw of rule.keywords) {
   const nkw = normalize(kw)
   if (nkw && s.includes(nkw)) {
    return {
     input,
     normalized: s,
     tone: rule.tone,
     matched: true,
     ruleIndex: i,
     keyword: kw,
    }
   }
  }
 }
 return { input, normalized: s, tone: "default", matched: false, ruleIndex: null, keyword: null }
}

export function statusToTagTone(status: string | null | undefined): TagTone {
 return explainStatusTone(status).tone
}
