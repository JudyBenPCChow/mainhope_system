import { useEffect } from "react"

import { AdTrialPublicForm } from "@/components/adTrial/AdTrialPublicForm"
import { maybeRedirectAdPublicToCanonical } from "@/lib/adPublicOrigin"

/** 廣告試堂登記：公開頁，不經側欄 Layout */
export default function AdTrial() {
  useEffect(() => {
    maybeRedirectAdPublicToCanonical()
  }, [])
  return <AdTrialPublicForm />
}
