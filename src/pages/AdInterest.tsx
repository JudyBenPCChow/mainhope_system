import { AdTrialPublicForm } from "@/components/adTrial/AdTrialPublicForm"

/** 廣告查詢：只收個人資料與有興趣科目，不選堂次。公開頁，不經側欄。 */
export default function AdInterest() {
  return <AdTrialPublicForm mode="interest" />
}
