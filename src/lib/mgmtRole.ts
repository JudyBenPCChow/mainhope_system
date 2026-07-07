import {
 isAdminEditableAcademicYearLabel,
 isClosedAcademicYear,
 getNextAcademicYearLabel,
 getAdminEditableAcademicYearLabels,
} from "@/lib/academicYearAccess"
import { academicYearLabelFromStartDate } from "@/lib/courseCode"

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

/** 管理員或外星人 — 可管理班別／排程等 */
export function isMgmtStaff(): boolean {
 const r = getMgmtRole()
 return r === "admin" || r === "alien"
}

export function isAdmin(): boolean {
 return getMgmtRole() === "admin"
}

export function isAlien(): boolean {
 return getMgmtRole() === "alien"
}

/** 單據經手人：顯示目前登入角色 */
export function formatMgmtRoleLabel(role?: MgmtRole | null): string {
 const r = role ?? getMgmtRole()
 if (r === "admin") return "管理員"
 if (r === "teacher") return "專科班老師"
 if (r === "alien") return "外星人"
 return "—"
}

/**
 * 學年唯讀判斷：
 * - alien：不受限
 * - admin：僅可編輯「目前學年」及「下一學年」
 * - teacher 等：2526 及更早唯讀；26SM 起可編輯
 */
export function isAcademicYearReadOnly(
 endDate?: string | null,
 label?: string | null
): boolean {
 const role = getMgmtRole()
 if (role === "alien") return false
 if (role === "admin") {
  if (!label?.trim()) return false
  return !isAdminEditableAcademicYearLabel(label, endDate?.slice(0, 10) ?? null)
 }
 return isClosedAcademicYear(endDate, label)
}

/** 學年唯讀提示（依角色顯示不同說明） */
export function academicYearReadOnlyHint(role?: MgmtRole | null): string {
 const r = role ?? getMgmtRole()
 if (r === "admin") {
  const current = academicYearLabelFromStartDate(null)
  const next = getNextAcademicYearLabel(current)
  return next
   ? `僅 ${current} 及 ${next} 學年可新增或修改；其他學年僅供查閱。`
   : `僅 ${current} 學年可新增或修改；其他學年僅供查閱。`
 }
 return "2526 及更早學年僅供查閱；不可新增、修改、刪除。"
}

/** 新增／編輯班別等：依角色篩選可選學年（admin 僅目前 + 下一） */
export function filterAcademicYearOptionsForEdit<T extends { label: string }>(
 options: T[],
 referenceYmd?: string | null
): T[] {
 const role = getMgmtRole()
 if (role === "alien") return options
 if (role === "admin") {
  const allowed = new Set(
   getAdminEditableAcademicYearLabels(referenceYmd).map((l) => l.trim().toUpperCase())
  )
  return options.filter((o) => allowed.has(o.label.trim().toUpperCase()))
 }
 return options.filter((o) => !isClosedAcademicYear(undefined, o.label))
}

/** @deprecated 請改用 isAcademicYearReadOnly(endDate, label) */
export function isHistoryYearReadOnly(isHistoryView: boolean): boolean {
 return isHistoryView && getMgmtRole() !== "alien"
}
