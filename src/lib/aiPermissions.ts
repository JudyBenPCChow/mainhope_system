import type { Role } from "@/lib/navStructure"

/** 前端顯示用：是否顯示 AI 報表入口（非安全邊界，後端 JWT 仍會驗證） */
export function canSeeAiReports(role: Role | null | undefined): boolean {
  return role === "alien"
}
