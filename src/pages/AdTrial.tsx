import { useEffect } from "react"

import { AdTrialPublicForm } from "@/components/adTrial/AdTrialPublicForm"
import { maybeRedirectAdPublicToCanonical } from "@/lib/adPublicOrigin"
import { initAdPublicTracking } from "@/lib/adTracking"

/** 廣告試堂登記：公開頁，不經側欄 Layout */
export default function AdTrial() {
  useEffect(() => {
    maybeRedirectAdPublicToCanonical()
    initAdPublicTracking()
  }, [])
  return <AdTrialPublicForm />
}
