import {
 DEFAULT_TRIAL_LESSON_COUNT,
 lineAmountFor,
 newLine,
 type ClassPriceInfo,
 type LineRow,
 type TrialPayType,
} from "@/components/payments/paymentsUi"
import type { TrialPayQuery } from "@/lib/paymentsReceiveHref"

export function trialTypeFromPay(trialPay: TrialPayQuery): TrialPayType {
 return trialPay === "half" ? "半價試堂" : trialPay === "full" ? "原價試堂" : "免費試堂"
}

/** 班價已在手才建列；缺班價回 null，讓呼叫端繼續等單班查詢。 */
export function buildTrialPrefLines(
 pref: { classId: string; trialPay: TrialPayQuery }[],
 classes: ClassPriceInfo[]
): LineRow[] | null {
 const trialMap = new Map(classes.map((row) => [row.id, row]))
 if (pref.some((item) => item.classId && !trialMap.has(item.classId))) return null
 return pref.map((item) => {
  const trialType = trialTypeFromPay(item.trialPay)
  const line = newLine("trial")
  line.trialType = trialType
  if (item.classId) {
   line.classId = item.classId
   line.lessons = DEFAULT_TRIAL_LESSON_COUNT
   line.amount = lineAmountFor(item.classId, line.lessons, new Map(), {
    kind: "trial",
    trialType,
    trialClasses: trialMap,
   })
   if (trialType === "免費試堂" && !line.amount) line.amount = "0"
  } else if (trialType === "免費試堂") {
   line.amount = "0"
  }
  return line
 })
}
