import type { MgmtRole } from "@/lib/mgmtRole"

/** Catalog `check_mode = account` 的 key。必須同 DB `private.authz_capabilities` 一致。 */
export const ACCOUNT_CAPABILITY_KEYS = ["payments.void.approve"] as const

export type AccountCapability = (typeof ACCOUNT_CAPABILITY_KEYS)[number]

export type AuthzCapability = string

export type AuthzProfile = {
  appUserId: string
  email: string
  displayName: string | null
  activeRole: MgmtRole
  availableRoles: MgmtRole[]
  teacherId: string | null
  activeCapabilities: AuthzCapability[]
  accountCapabilities: AuthzCapability[]
  authzVersion: number
}

export function can(capabilities: readonly string[] | null | undefined, key: string): boolean {
  return Boolean(capabilities?.includes(key))
}

export function canAny(
  capabilities: readonly string[] | null | undefined,
  keys: readonly string[]
): boolean {
  return keys.some((key) => can(capabilities, key))
}

export function usesAccountCapabilities(key: string): boolean {
  return (ACCOUNT_CAPABILITY_KEYS as readonly string[]).includes(key)
}
