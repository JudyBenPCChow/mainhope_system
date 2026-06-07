import { isClosedAcademicYear } from "@/lib/academicYearAccess"

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

/** 2526 及更早唯讀；26SM 起可編輯（外星人不受限） */
export function isAcademicYearReadOnly(
 endDate?: string | null,
 label?: string | null
): boolean {
 if (getMgmtRole() === "alien") return false
 return isClosedAcademicYear(endDate, label)
}

/** @deprecated 請改用 isAcademicYearReadOnly(endDate, label) */
export function isHistoryYearReadOnly(isHistoryView: boolean): boolean {
 return isHistoryView && getMgmtRole() !== "alien"
}
