import type { ResolvedCaller } from "./apoAuth.ts"

/** 阿Po 工作台：僅外星人（後端權威） */
export function canAccessApoPo(caller: ResolvedCaller): boolean {
  return caller.userRole === "alien"
}

export function assertApoPoAccess(
  caller: ResolvedCaller
): { ok: true } | { ok: false; error: string; status: number } {
  if (!canAccessApoPo(caller)) {
    return { ok: false, error: "阿Po 僅開放外星人角色。", status: 403 }
  }
  return { ok: true }
}
