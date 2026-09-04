import {
 ADMIN_MAIN_NAV,
 adminNavEntryIsActive,
 adminNavPathIsActive,
} from "@/lib/adminNavigation"
import {
 FINANCE_MAIN_NAV,
 financeNavEntryIsActive,
 financeNavPathIsActive,
} from "@/lib/financeNavigation"
import {
 filterMainNavEntries,
 filterNavForRole,
 NAV_STRUCTURE,
 pathIsActive,
 type NavEntryDef,
 type Role,
} from "@/lib/navStructure"
import {
 resolveTeacherMainNav,
 teacherNavEntryIsActive,
 teacherNavPathIsActive,
 type TeacherNavFlags,
} from "@/lib/teacherNavigation"

export type RoleMainNavFlags = TeacherNavFlags

/** 側欄／抽屜主選單真源：行政／老師／財務用專用 IA；其餘仍跟 NAV_STRUCTURE。 */
export function resolveRoleMainNav(
 role: Role,
 flags: RoleMainNavFlags = { homeworkTutoringNavVisible: true, homeworkTutorOnly: false }
): NavEntryDef[] {
 if (role === "admin") return ADMIN_MAIN_NAV
 if (role === "teacher") return resolveTeacherMainNav(flags)
 if (role === "finance") return FINANCE_MAIN_NAV
 return filterMainNavEntries(filterNavForRole(role, NAV_STRUCTURE))
}

export function roleNavPathIsActive(role: Role, pathname: string, itemPath: string): boolean {
 const pathOnly = itemPath.split("?")[0] || itemPath
 if (role === "admin") return adminNavPathIsActive(pathname, pathOnly)
 if (role === "teacher") return teacherNavPathIsActive(pathname, pathOnly)
 if (role === "finance") return financeNavPathIsActive(pathname, pathOnly)
 return pathIsActive(pathname, pathOnly)
}

export function roleNavEntryIsActive(role: Role, pathname: string, entry: NavEntryDef): boolean {
 if (role === "admin") return adminNavEntryIsActive(pathname, entry)
 if (role === "teacher") return teacherNavEntryIsActive(pathname, entry)
 if (role === "finance") return financeNavEntryIsActive(pathname, entry)
 if (entry.kind === "leaf") return pathIsActive(pathname, entry.path)
 return entry.children.some((child) => pathIsActive(pathname, child.path))
}

/** 是否使用專用頂層 IA（單開群組、與 NAV_STRUCTURE 分開）。 */
export function usesStructuredRoleNav(role: Role | null | undefined): boolean {
 return role === "admin" || role === "teacher" || role === "finance"
}
