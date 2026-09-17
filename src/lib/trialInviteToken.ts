import type { TrialInviteTokenRow } from "@/services/trialInviteQueries"

export function trialInviteTokenExpired(token: TrialInviteTokenRow): boolean {
  if (token.status === "expired") return true
  if (
    token.status === "open" &&
    token.expires_at &&
    new Date(token.expires_at).getTime() < Date.now()
  ) {
    return true
  }
  return false
}

/** 家長仍可用的進行中連結 */
export function trialInviteTokenUsable(
  token: TrialInviteTokenRow | null
): token is TrialInviteTokenRow {
  return Boolean(token && token.status === "open" && !trialInviteTokenExpired(token))
}

/** 已有可複製／通知的公開連結（未交或待審核） */
export function trialInviteTokenHasPublicUrl(
  token: TrialInviteTokenRow | null
): token is TrialInviteTokenRow {
  if (!token) return false
  if (token.status === "submitted") return true
  return token.status === "open" && !trialInviteTokenExpired(token)
}

/** 職員可作廢：未交、待審核、已過期 */
export function trialInviteTokenVoidable(
  token: TrialInviteTokenRow | null
): token is TrialInviteTokenRow {
  if (!token) return false
  if (token.status === "approved" || token.status === "voided") return false
  return (
    token.status === "open" ||
    token.status === "submitted" ||
    token.status === "expired" ||
    trialInviteTokenExpired(token)
  )
}
