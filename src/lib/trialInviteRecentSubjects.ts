import { todayYmdLocal } from "@/lib/weekdayUtils"

/** 與公開目錄 `trial_invite_subject_recent_trial_open_for_student` 同一時間窗。 */
export const RECENT_TRIAL_SUBJECT_MONTHS = 6

export type RecentTrialSessionInput = {
  studentId: string
  trialDate: string
  status: string
  classKind: string
  subject: string
  subjectId: string | null
  subjectCode: string | null
}

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

/** 曆月加減並夾在該月最後一日（接近 Postgres `date + interval 'n months'`）。 */
export function addMonthsYmd(ymd: string, months: number): string {
  const [y, m, d] = ymd.split("-").map(Number)
  const total = y * 12 + (m - 1) + months
  const year = Math.floor(total / 12)
  const monthIndex = ((total % 12) + 12) % 12
  const lastDay = new Date(year, monthIndex + 1, 0).getDate()
  const day = Math.min(d, lastDay)
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`
}

export function recentTrialSubjectCutoffYmd(todayYmd = todayYmdLocal()): string {
  return addMonthsYmd(todayYmd, -RECENT_TRIAL_SUBJECT_MONTHS)
}

export function isTrialInviteCatalogClassKind(kind: string): kind is "group" | "homework" {
  return kind === "group" || kind === "homework"
}

function subjectIdentity(row: RecentTrialSessionInput): string | null {
  const id = (row.subjectId ?? "").trim()
  if (id) return `id:${id}`
  const code = (row.subjectCode ?? "").trim().toUpperCase()
  if (code) return `code:${code}`
  const text = row.subject.trim()
  if (text) return `text:${text}`
  return null
}

function displayLabel(row: RecentTrialSessionInput): string {
  const subject =
    row.subject.trim() || (row.subjectCode ?? "").trim() || "未分類"
  if (row.classKind === "homework") return `${subject}（功輔）`
  return subject
}

/**
 * 職員名冊用：半年內未取消、專科班／功課輔導班，按學生＋產品線＋科目去重。
 * 取消不計；私人課程不計。
 */
export function aggregateRecentTrialSubjects(
  rows: RecentTrialSessionInput[],
  opts?: { cutoffYmd?: string }
): Map<string, string[]> {
  const cutoff = opts?.cutoffYmd ?? recentTrialSubjectCutoffYmd()
  const latest = new Map<
    string,
    { date: string; kind: "group" | "homework"; label: string }
  >()

  for (const row of rows) {
    if (!isTrialInviteCatalogClassKind(row.classKind)) continue
    if (String(row.status).includes("取消")) continue
    const date = String(row.trialDate ?? "").slice(0, 10)
    if (!date || date < cutoff) continue
    const ident = subjectIdentity(row)
    if (!ident) continue
    const studentId = row.studentId.trim()
    if (!studentId) continue
    const key = `${studentId}::${row.classKind}::${ident}`
    const prev = latest.get(key)
    if (prev && prev.date >= date) continue
    latest.set(key, {
      date,
      kind: row.classKind,
      label: displayLabel(row),
    })
  }

  const byStudent = new Map<string, { kind: "group" | "homework"; label: string }[]>()
  for (const [key, item] of latest) {
    const studentId = key.slice(0, key.indexOf("::"))
    const list = byStudent.get(studentId) ?? []
    list.push({ kind: item.kind, label: item.label })
    byStudent.set(studentId, list)
  }

  const out = new Map<string, string[]>()
  for (const [studentId, list] of byStudent) {
    list.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "group" ? -1 : 1
      return a.label.localeCompare(b.label, "zh-Hant")
    })
    out.set(
      studentId,
      list.map((x) => x.label)
    )
  }
  return out
}

export function formatRecentTrialSubjectsCaption(labels: string[]): string | null {
  if (labels.length === 0) return null
  return `曾試堂：${labels.join("、")}`
}
