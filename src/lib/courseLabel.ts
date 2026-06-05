export function formatClassLabel(params: {
 subject: string
 courseCode: string | null | undefined
 courseName?: string | null | undefined
}): string {
 const subject = (params.subject ?? "").trim() || "—"
 const code = (params.courseCode ?? "").trim()
 const name = (params.courseName ?? "").trim()
 const head = name !== "" ? name : subject
 return code !== "" ? `${head}（${code}）` : head
}

