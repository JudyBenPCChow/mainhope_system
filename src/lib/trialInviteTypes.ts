export const TRIAL_INVITE_TYPES = ["免費試堂", "半價試堂", "原價試堂"] as const

export type TrialInviteType = (typeof TRIAL_INVITE_TYPES)[number]

export function isTrialInviteType(value: string): value is TrialInviteType {
  return (TRIAL_INVITE_TYPES as readonly string[]).includes(value)
}

export function trialInviteTypeOrDefault(value: string | null | undefined): TrialInviteType {
  const t = (value ?? "").trim()
  return isTrialInviteType(t) ? t : "免費試堂"
}
