const STORAGE_KEY = "mgmt_academic_year_filter"

/** 篩選值：`current` 表示「目前學年」，否則為學年 label（如 26SM、2526） */
export function getStoredAcademicYearFilter(): string {
 if (typeof localStorage === "undefined") return "current"
 return localStorage.getItem(STORAGE_KEY) ?? "current"
}

export function setStoredAcademicYearFilter(value: string): void {
 if (typeof localStorage === "undefined") return
 localStorage.setItem(STORAGE_KEY, value)
}

export function resolveAcademicYearLabel(filter: string, currentLabel: string): string {
 return filter === "current" ? currentLabel : filter
}
