import type { Location } from "react-router-dom"

import { getMgmtRole } from "@/lib/mgmtRole"

/** 學生詳情關閉／返回時的目標路徑（尊重 Link state.from） */
export function resolveStudentDetailExitPath(location: Location): string {
 const from = (location.state as { from?: unknown } | null)?.from
 if (typeof from === "string" && from.startsWith("/")) return from
 return getMgmtRole() === "teacher" ? "/Classes" : "/Students"
}
