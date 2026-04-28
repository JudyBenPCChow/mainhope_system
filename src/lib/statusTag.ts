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

const HR_AND_ATTENDANCE_RULES: StatusTagRule[] = [
 // 人員狀態 / 出勤：錯誤態
 { tone: "error", keywords: ["failed", "error", "錯誤", "失敗", "拒絕", "離職", "非在職", "缺席"] },
 // 人員狀態 / 出勤：成功態
 { tone: "success", keywords: ["在職", "在讀", "出席", "準時"] },
]

const SCHEDULE_AND_TASK_RULES: StatusTagRule[] = [
 // 排程 / 待辦：待處理與提醒態
 { tone: "warning", keywords: ["pending", "待", "逾期", "提醒", "補課中", "保留中"] },
 // 排程 / 待辦：預定與進行態
 { tone: "info", keywords: ["booked", "預定", "安排", "處理中", "in progress"] },
 // 排程 / 待辦：完成態
 { tone: "success", keywords: ["success", "完成", "已完成", "done", "ok"] },
]

const PAYMENT_RULES: StatusTagRule[] = [
 // 繳費：成功入帳態
 { tone: "success", keywords: ["已收款", "已批核"] },
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
 ...COMMON_CANCELLED_RULES,
 ...HR_AND_ATTENDANCE_RULES,
 ...SCHEDULE_AND_TASK_RULES,
 ...PAYMENT_RULES,
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
