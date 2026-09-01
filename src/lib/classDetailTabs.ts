export const CLASS_DETAIL_TAB_IDS = ["basic", "students", "enrollment", "schedule"] as const

export type ClassDetailTabId = (typeof CLASS_DETAIL_TAB_IDS)[number]

export const CLASS_DETAIL_TABS: { id: ClassDetailTabId; label: string }[] = [
 { id: "basic", label: "基本資料" },
 { id: "students", label: "學生名單" },
 { id: "enrollment", label: "增退紀錄" },
 { id: "schedule", label: "排程" },
]

export function isClassDetailTabId(value: string | null | undefined): value is ClassDetailTabId {
 return CLASS_DETAIL_TAB_IDS.includes(value as ClassDetailTabId)
}

/** 無效 tab → 基本資料。 */
export function parseClassDetailTab(raw: string | null | undefined): ClassDetailTabId {
 const t = raw?.trim() ?? ""
 if (!isClassDetailTabId(t)) return "basic"
 return t
}
