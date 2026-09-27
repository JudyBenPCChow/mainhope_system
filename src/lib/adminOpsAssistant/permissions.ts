import type { Role } from "@/lib/navStructure"

/** 前端顯示閘：僅行政。後端 Edge 仍會驗證 JWT 角色。 */
export function canSeeAdminOpsAssistant(role: Role | null | undefined): boolean {
  return role === "admin"
}
