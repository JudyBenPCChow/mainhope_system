import type { ResolvedCaller } from "./apoAuth.ts"

/** 行政班務助手：僅行政角色（後端權威；不開放管理層／財務／老師／外星人） */
export function canAccessAdminOpsAssistant(caller: ResolvedCaller): boolean {
  return caller.userRole === "admin"
}

export function assertAdminOpsAccess(
  caller: ResolvedCaller
): { ok: true } | { ok: false; error: string; status: number } {
  if (!canAccessAdminOpsAssistant(caller)) {
    return { ok: false, error: "班務助手僅開放行政角色。", status: 403 }
  }
  return { ok: true }
}
