import { STUDENT_GRADE_CODES } from "@/lib/studentGrade"
import type { LeadRow, LeadSource, LeadStatus } from "@/services/leadQueries"

export type LeadListStatus = LeadStatus | "all"
export type LeadListSource = LeadSource | "all"
export type LeadBrowseMode = "all" | "inquiry" | "trial"
export type LeadSortKey = "createdAt" | "fullName" | "grade" | "school"

export function leadHasTrialSchedule(row: Pick<LeadRow, "intentions">): boolean {
  return row.intentions.some((line) => Boolean(line.scheduleId || line.scheduledDate))
}

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: "新進",
  contacted: "已聯絡",
  converted: "已建檔",
  closed: "已結束",
}

export const LEAD_SOURCE_LABEL: Record<LeadSource, string> = {
  ad_trial: "廣告試堂",
  phone: "電話",
  front_desk: "前台",
  website: "官網",
  other: "其他",
}

export const LEAD_SORT_LABEL: Record<LeadSortKey, string> = {
  createdAt: "提交時間",
  fullName: "姓名",
  grade: "年級",
  school: "學校",
}

const GRADE_RANK = new Map<string, number>(STUDENT_GRADE_CODES.map((code, index) => [code, index]))

export function formatLeadAge(iso: string, now = new Date()): string {
  const at = Date.parse(iso)
  if (!Number.isFinite(at)) return ""
  const minutes = Math.floor((now.getTime() - at) / 60_000)
  if (minutes < 1) return "剛剛"
  if (minutes < 60) return `${minutes} 分鐘前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小時前`
  const days = Math.floor(hours / 24)
  if (days < 14) return `${days} 日前`
  return iso.slice(0, 10)
}

export function leadIsStaleNew(row: Pick<LeadRow, "status" | "createdAt">, now = new Date()): boolean {
  if (row.status !== "new") return false
  const at = Date.parse(row.createdAt)
  if (!Number.isFinite(at)) return false
  return now.getTime() - at >= 24 * 60 * 60 * 1000
}

export function pickOpenIntention(
  intentions: { classId: string | null; scheduleId: string | null; classLabel: string }[],
  staleMessages: string[]
): { classId: string; scheduleId: string } | "expired" | null {
  const withIds = intentions.filter((line) => line.classId && line.scheduleId)
  if (withIds.length === 0) return null
  const open = withIds.find((line) => {
    const label = line.classLabel || "想試堂次"
    return !staleMessages.some((message) => message.startsWith(`${label}：`))
  })
  if (open?.classId && open.scheduleId) {
    return { classId: open.classId, scheduleId: open.scheduleId }
  }
  return "expired"
}

export function filterLeads(
  rows: LeadRow[],
  opts: {
    status: LeadListStatus
    source: LeadListSource
    query: string
    grade: string
    browse: LeadBrowseMode
  }
): LeadRow[] {
  return rows.filter((row) => {
    if (opts.status !== "all" && row.status !== opts.status) return false
    if (opts.source !== "all" && row.source !== opts.source) return false
    if (opts.grade && row.grade !== opts.grade) return false
    const trial = leadHasTrialSchedule(row)
    if (opts.browse === "trial" && !trial) return false
    if (opts.browse === "inquiry" && trial) return false
    return leadMatchesQuery(row, opts.query)
  })
}

export function sortLeads(rows: LeadRow[], key: LeadSortKey, dir: "asc" | "desc"): LeadRow[] {
  const mul = dir === "asc" ? 1 : -1
  const emptyLast = (aEmpty: boolean, bEmpty: boolean): number | null => {
    if (aEmpty && bEmpty) return 0
    if (aEmpty) return 1
    if (bEmpty) return -1
    return null
  }
  return [...rows].sort((a, b) => {
    if (key === "createdAt") {
      const at = Date.parse(a.createdAt)
      const bt = Date.parse(b.createdAt)
      const empty = emptyLast(!Number.isFinite(at), !Number.isFinite(bt))
      if (empty != null) return empty
      return (at - bt) * mul
    }
    if (key === "grade") {
      const ar = GRADE_RANK.get(a.grade)
      const br = GRADE_RANK.get(b.grade)
      const empty = emptyLast(ar == null, br == null)
      if (empty != null) return empty
      return ((ar ?? 0) - (br ?? 0)) * mul
    }
    const av = (key === "fullName" ? a.fullName : a.school).trim()
    const bv = (key === "fullName" ? b.fullName : b.school).trim()
    const empty = emptyLast(!av, !bv)
    if (empty != null) return empty
    return av.localeCompare(bv, "zh-Hant") * mul
  })
}

export function leadMatchesQuery(row: LeadRow, rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase()
  if (!query) return true
  const haystack = [row.fullName, row.school, row.wechatId, row.note, row.phone].join(" ").toLowerCase()
  if (haystack.includes(query)) return true
  const digits = query.replace(/\D/g, "")
  if (digits.length < 3) return false
  return row.phone.replace(/\D/g, "").includes(digits)
}
