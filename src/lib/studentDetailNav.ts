import type { Location, NavigateFunction } from "react-router-dom"

import type { MgmtRole } from "@/lib/mgmtRole"
import { flattenNav, NAV_STRUCTURE } from "@/lib/navStructure"

export type StudentDetailLeaveTo = { kind: "back" } | { kind: "to"; path: string }

function readFromState(location: Location): string | null {
 const from = (location.state as { from?: unknown } | null)?.from
 if (typeof from === "string" && from.startsWith("/")) return from
 return null
}

export function readHistoryIdx(state: unknown = window.history.state): number | null {
 if (!state || typeof state !== "object") return null
 const idx = (state as { idx?: unknown }).idx
 return typeof idx === "number" ? idx : null
}

/** 學生詳情關閉／返回時的目標路徑（尊重 Link state.from） */
export function resolveStudentDetailExitPath(location: Location, role?: MgmtRole | null): string {
 const from = readFromState(location)
 if (from) return from
 return role === "teacher" ? "/Classes" : "/Students"
}

/** 有上一頁（React Router history idx）時走 history back，否則落到 from／學生或班別列表。 */
export function resolveStudentDetailLeaveTo(
 location: Location,
 role?: MgmtRole | null,
 historyIdx: number | null = readHistoryIdx()
): StudentDetailLeaveTo {
 if (historyIdx != null && historyIdx > 0) return { kind: "back" }
 return { kind: "to", path: resolveStudentDetailExitPath(location, role) }
}

export function navigateStudentDetailLeave(
 navigate: NavigateFunction,
 location: Location,
 role?: MgmtRole | null
): void {
 const to = resolveStudentDetailLeaveTo(location, role)
 if (to.kind === "back") {
  navigate(-1)
  return
 }
 navigate(to.path, { replace: true })
}

export function studentDetailLinkState(
 location: Pick<Location, "pathname" | "search">
): { from: string } {
 return { from: `${location.pathname}${location.search}` }
}

function navLabelForPathname(pathname: string): string | null {
 const exact = flattenNav(NAV_STRUCTURE).find((leaf) => leaf.path.split("?")[0] === pathname)
 return exact?.label ?? null
}

export function resolveStudentDetailBackLabel(
 location: Location,
 role?: MgmtRole | null,
 historyIdx: number | null = readHistoryIdx()
): string {
 const from = readFromState(location)
 if (from) {
  const pathname = from.split(/[?#]/)[0] ?? from
  const navLabel = navLabelForPathname(pathname)
  if (navLabel) return `返回${navLabel}`
  return "返回"
 }
 const leave = resolveStudentDetailLeaveTo(location, role, historyIdx)
 if (leave.kind === "back") return "返回"
 return leave.path.startsWith("/Classes") ? "返回班別管理" : "返回學生管理"
}
