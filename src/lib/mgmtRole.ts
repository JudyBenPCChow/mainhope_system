import { getNextAcademicYearLabel } from "@/lib/academicYearAccess"
import { academicYearLabelFromStartDate } from "@/lib/courseCode"
import { DEMO_ADMIN_GREETING_NAME, DEMO_ALIEN_GREETING_NAME } from "@/lib/demoMgmtPersonas"

/** 與首頁演示／Layout 一致：localStorage `mgmt_role` */
export type MgmtRole = "admin" | "teacher" | "alien"

export function getMgmtRole(): MgmtRole | null {
 if (typeof localStorage === "undefined") return null
 const r = localStorage.getItem("mgmt_role")
 if (r === "admin" || r === "teacher" || r === "alien") return r
 return null
}

/** 目前登入者顯示名（profile → localStorage；無則角色預設／未命名） */
export function resolveMgmtDisplayName(role?: MgmtRole | null): string {
 const r = role ?? getMgmtRole()
 if (typeof localStorage !== "undefined") {
  const stored =
   localStorage.getItem("mgmt_display_name")?.trim() ||
   localStorage.getItem("mgmt_email")?.trim()
  if (stored) return stored
 }
 if (r === "admin") return DEMO_ADMIN_GREETING_NAME
 if (r === "alien") return DEMO_ALIEN_GREETING_NAME
 return "未命名"
}

/**
 * 稽核／操作紀錄用：角色＋明確用戶名，例如「專班老師（Judy Chu）」。
 * 名稱來自登入 profile 寫入的 `mgmt_display_name`（或 email）。
 */
export function formatMgmtActorLabel(role?: MgmtRole | null): string {
 const r = role ?? getMgmtRole()
 if (!r) return "未登入"
 const name = resolveMgmtDisplayName(r)
 if (r === "admin") return `管理員（${name}）`
 if (r === "teacher") return `專班老師（${name}）`
 if (r === "alien") return `外星人（${name}）`
 return "未登入"
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
 * @deprecated 學年硬鎖已撤銷（2026-07-31）。恒回 false；防呆改見 `academicYearSoftGuard`。
 * 舊語意：alien 永不鎖；admin 僅目前＋下一；teacher 依 cutoff。
 */
export function isAcademicYearReadOnly(
 _endDate?: string | null,
 _label?: string | null
): boolean {
 return false
}

/** @deprecated 硬鎖已撤；改為非當期 confirm 提示。 */
export function academicYearReadOnlyHint(_role?: MgmtRole | null): string {
 const current = academicYearLabelFromStartDate(null)
 const next = getNextAcademicYearLabel(current)
 return next
  ? `目前／下一學年（${current}、${next}）可直接修改；其他學年儲存前會要求確認並留下稽核。`
  : `目前學年（${current}）可直接修改；其他學年儲存前會要求確認並留下稽核。`
}

/** 開班等選單：硬鎖撤銷後不再依角色過濾學年 */
export function filterAcademicYearOptionsForEdit<T extends { label: string }>(
 options: T[],
 _referenceYmd?: string | null
): T[] {
 return options
}

/** @deprecated 請改用 isAcademicYearReadOnly(endDate, label) */
export function isHistoryYearReadOnly(isHistoryView: boolean): boolean {
 return isHistoryView && getMgmtRole() !== "alien"
}
