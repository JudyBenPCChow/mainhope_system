import { useEffect } from "react"

import { AdTrialPublicForm } from "@/components/adTrial/AdTrialPublicForm"
import { maybeRedirectAdPublicToCanonical } from "@/lib/adPublicOrigin"

/** 廣告查詢：只收個人資料與有興趣科目，不選堂次。公開頁，不經側欄。 */
export default function AdInterest() {
  useEffect(() => {
    maybeRedirectAdPublicToCanonical()
  }, [])
  return <AdTrialPublicForm mode="interest" />
}
