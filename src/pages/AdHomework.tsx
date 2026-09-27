import { useEffect } from "react"

import { AdHomeworkPublicForm } from "@/components/adTrial/AdHomeworkPublicForm"
import { maybeRedirectAdPublicToCanonical } from "@/lib/adPublicOrigin"
import { initAdPublicTracking } from "@/lib/adTracking"

/** 功課輔導班公開查詢：可只留資料，或再選試堂日子。不經側欄 Layout。 */
export default function AdHomework() {
  useEffect(() => {
    maybeRedirectAdPublicToCanonical()
    initAdPublicTracking()
  }, [])
  return <AdHomeworkPublicForm />
}
