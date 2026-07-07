import type { ResolvedCaller } from "./apoAuth.ts"

/** 可存取 AI 報表工作區的角色（後端權威；明學IT狗不受此限制） */
export function canAccessAiReports(caller: ResolvedCaller): boolean {
  return caller.userRole === "alien"
}

export function assertAiReportAccess(
  caller: ResolvedCaller
): { ok: true } | { ok: false; error: string; status: number } {
  if (!canAccessAiReports(caller)) {
    return { ok: false, error: "AI 報表暫時僅開放外星人角色。", status: 403 }
  }
  return { ok: true }
}
