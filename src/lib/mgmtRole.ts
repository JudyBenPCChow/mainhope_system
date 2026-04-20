/** 與首頁演示／Layout 一致：localStorage `mgmt_role` */
export type MgmtRole = "admin" | "teacher" | "alien"

export function getMgmtRole(): MgmtRole | null {
  if (typeof localStorage === "undefined") return null
  const r = localStorage.getItem("mgmt_role")
  if (r === "admin" || r === "teacher" || r === "alien") return r
  return null
}

/** 外星人（alien，舊稱超級管理）— 刪除老師／班別／學生等進階操作僅限此角色 */
export function isSuperAdmin(): boolean {
  return getMgmtRole() === "alien"
}
