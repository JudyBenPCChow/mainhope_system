export const STUDENT_DETAIL_TAB_IDS = [
 "basic",
 "enrollments",
 "payments",
 "leave",
 "attendance",
 "futureSchedules",
 "history",
] as const

export type StudentDetailTabId = (typeof STUDENT_DETAIL_TAB_IDS)[number]

export const STUDENT_DETAIL_TABS: { id: StudentDetailTabId; label: string }[] = [
 { id: "basic", label: "基本資料" },
 { id: "enrollments", label: "報讀班別" },
 { id: "payments", label: "繳費紀錄" },
 { id: "leave", label: "請假紀錄" },
 { id: "attendance", label: "上課紀錄" },
 { id: "futureSchedules", label: "未來排程" },
 { id: "history", label: "更動紀錄" },
]

export function isStudentDetailTabId(value: string | null | undefined): value is StudentDetailTabId {
 return STUDENT_DETAIL_TAB_IDS.includes(value as StudentDetailTabId)
}

/** 無權限或無效 tab → 基本資料。能力尚未載入時，暫不把繳費校正掉。 */
export function parseStudentDetailTab(
 raw: string | null | undefined,
 opts: { canViewMoney: boolean; capsReady: boolean }
): StudentDetailTabId {
 const t = raw?.trim() ?? ""
 if (!isStudentDetailTabId(t)) return "basic"
 if (t === "payments" && opts.capsReady && !opts.canViewMoney) return "basic"
 return t
}
