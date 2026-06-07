/** 班別顯示名稱：優先課程名稱，其次科目 */
export function classDisplayName(params: {
 subject?: string | null
 courseName?: string | null
}): string {
 const name = (params.courseName ?? "").trim()
 if (name !== "") return name
 return (params.subject ?? "").trim() || "—"
}

export function formatClassLabel(params: {
 subject: string
 courseCode: string | null | undefined
 courseName?: string | null | undefined
}): string {
 const head = classDisplayName(params)
 const code = (params.courseCode ?? "").trim()
 return code !== "" ? `${head}（${code}）` : head
}

