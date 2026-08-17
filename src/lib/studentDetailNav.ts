import type { Location } from "react-router-dom"

import type { MgmtRole } from "@/lib/mgmtRole"

/** 學生詳情關閉／返回時的目標路徑（尊重 Link state.from） */
export function resolveStudentDetailExitPath(location: Location, role?: MgmtRole | null): string {
 const from = (location.state as { from?: unknown } | null)?.from
 if (typeof from === "string" && from.startsWith("/")) return from
 return role === "teacher" ? "/Classes" : "/Students"
}
