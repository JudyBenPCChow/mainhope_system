import { useParams } from "react-router-dom"

import { TrialInvitePublicForm } from "@/components/trialInvite/TrialInvitePublicForm"

/** 家長試堂邀請：公開頁，不經側欄 Layout */
export default function TrialInvite() {
  const { token = "" } = useParams<{ token: string }>()
  return <TrialInvitePublicForm token={token} />
}
