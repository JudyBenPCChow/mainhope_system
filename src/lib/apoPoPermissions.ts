import type { Role } from "@/lib/navStructure"

/** 前端顯示：阿Po 工作台（非安全邊界，後端 apo-po 仍會驗證 JWT） */
export function canSeeApoPo(role: Role | null | undefined): boolean {
  return role === "alien"
}
