import { formatWeekdaysDisplay } from "@/lib/weekdayUtils"
import type { TrialInviteClassOption } from "@/services/trialInviteQueries"

export type TrialPick = {
  classId: string
  scheduleId: string
  subjectLabel: string
  classLabel: string
  scheduleLabel: string
}

export type SubjectGroup = {
  key: string
  label: string
  classKind: string
  classes: TrialInviteClassOption[]
}

export function classKindLabel(kind: string): string {
  if (kind === "homework") return "功課輔導班"
  if (kind === "group") return "專科班"
  return kind || "班別"
}

export function subjectLabelOf(cls: TrialInviteClassOption): string {
  return (cls.subject || cls.course_name || cls.course_code_full || "未分類").trim() || "未分類"
}

export function subjectKeyOf(cls: TrialInviteClassOption): string {
  return `${cls.class_kind}::${subjectLabelOf(cls)}`
}

export function classLabelOf(cls: TrialInviteClassOption): string {
  const code = cls.course_code_full.trim()
  const name = cls.course_name.trim()
  const subject = subjectLabelOf(cls)
  if (code) return code
  if (name && name !== subject) return name
  return [name || subject, cls.teacher_name].filter(Boolean).join(" · ") || "班別"
}

export function classMeetingLabel(cls: TrialInviteClassOption): string {
  const days = formatWeekdaysDisplay(cls.day_of_week)
  const weekday = days ? (days.startsWith("逢") ? days : `逢${days}`) : ""
  const slot = cls.time_slot.trim()
  return [weekday, slot].filter(Boolean).join(" ")
}

export function classSubLabel(cls: TrialInviteClassOption): string {
  return [cls.teacher_name, classMeetingLabel(cls)]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" · ")
}

export function formatScheduleLine(opts: {
  scheduled_date: string
  start_time: string
  end_time: string
}): string {
  const date = opts.scheduled_date || "—"
  const start = (opts.start_time || "").slice(0, 5)
  const end = (opts.end_time || "").slice(0, 5)
  if (start && end) return `${date} ${start}–${end}`
  if (start) return `${date} ${start}`
  return date
}

/** 公開頁每科最多列出最近班別／每班最多列出最近堂次。 */
export const TRIAL_INVITE_NEAR_LIMIT = 4

export function nearestUpcomingSchedules(
  cls: TrialInviteClassOption,
  limit = TRIAL_INVITE_NEAR_LIMIT
): TrialInviteClassOption["schedules"] {
  return [...cls.schedules]
    .sort((a, b) => {
      const d = a.scheduled_date.localeCompare(b.scheduled_date)
      if (d !== 0) return d
      const t = (a.start_time || "").localeCompare(b.start_time || "")
      if (t !== 0) return t
      return (a.session_number ?? 0) - (b.session_number ?? 0)
    })
    .slice(0, limit)
}

/** 按下一堂日期排序，只留最近 `limit` 班；已選班若不在名單內仍保留。 */
export function visibleTrialClasses(
  classes: TrialInviteClassOption[],
  keepClassId?: string | null,
  limit = TRIAL_INVITE_NEAR_LIMIT
): TrialInviteClassOption[] {
  const sorted = [...classes].sort((a, b) => {
    const as = nearestUpcomingSchedules(a, 1)[0]
    const bs = nearestUpcomingSchedules(b, 1)[0]
    if (!as && !bs) return 0
    if (!as) return 1
    if (!bs) return -1
    const d = as.scheduled_date.localeCompare(bs.scheduled_date)
    if (d !== 0) return d
    return (as.start_time || "").localeCompare(bs.start_time || "")
  })
  const top = sorted.slice(0, limit)
  if (keepClassId && !top.some((c) => c.id === keepClassId)) {
    const kept = classes.find((c) => c.id === keepClassId)
    if (kept) return [...top.slice(0, Math.max(limit - 1, 0)), kept]
  }
  return top
}

export function buildSubjectGroups(classes: TrialInviteClassOption[]): SubjectGroup[] {
  const map = new Map<string, SubjectGroup>()
  for (const cls of classes) {
    const key = subjectKeyOf(cls)
    const existing = map.get(key)
    if (existing) {
      existing.classes.push(cls)
      continue
    }
    map.set(key, {
      key,
      label: subjectLabelOf(cls),
      classKind: cls.class_kind,
      classes: [cls],
    })
  }
  return [...map.values()].sort((a, b) => {
    const kindRank = (k: string) => (k === "group" ? 0 : k === "homework" ? 1 : 2)
    const d = kindRank(a.classKind) - kindRank(b.classKind)
    if (d !== 0) return d
    return a.label.localeCompare(b.label, "zh-Hant")
  })
}

export function classAllowedAfterElectives(
  cls: TrialInviteClassOption,
  requiresSurvey: boolean,
  electedCodes: Set<string>
): boolean {
  if (!requiresSurvey) return true
  if (cls.class_kind === "homework") return true
  if (cls.subject_category === "main") return true
  if (cls.subject_code && electedCodes.has(cls.subject_code)) return true
  return false
}

export function filterCatalogClasses(
  classes: TrialInviteClassOption[],
  requiresElectiveSurvey: boolean,
  electedCodes: Set<string>
): TrialInviteClassOption[] {
  // 人數上限、該堂已有試堂、本學年已報讀同科：由 trial_invite_get 過濾，此處只處理選修與空堂。
  return classes.filter(
    (c) =>
      c.schedules.length > 0 &&
      classAllowedAfterElectives(c, requiresElectiveSurvey, electedCodes)
  )
}

export function selectedSubjectGroups(
  groups: SubjectGroup[],
  selectedSubjectKeys: string[]
): SubjectGroup[] {
  const allowed = new Set(selectedSubjectKeys)
  return groups.filter((g) => allowed.has(g.key))
}

/** 從已選科目移除一科；只剩一科則不變。 */
export function dropSelectedSubject(
  selectedSubjectKeys: string[],
  subjectKey: string
): string[] {
  if (selectedSubjectKeys.length <= 1) return selectedSubjectKeys
  if (!selectedSubjectKeys.includes(subjectKey)) return selectedSubjectKeys
  return selectedSubjectKeys.filter((k) => k !== subjectKey)
}

function validClassId(group: SubjectGroup, classId: string | undefined): string | null {
  if (!classId) return null
  return group.classes.some((c) => c.id === classId) ? classId : null
}

function validScheduleId(
  cls: TrialInviteClassOption,
  scheduleId: string | undefined
): string | null {
  if (!scheduleId) return null
  return cls.schedules.some((s) => s.id === scheduleId) ? scheduleId : null
}

/** 只保留仍勾選的科目；僅一班則預填。 */
export function pruneAndAutofillClasses(
  selectedSubjectKeys: string[],
  groups: SubjectGroup[],
  current: Record<string, string>
): Record<string, string> {
  const groupByKey = new Map(groups.map((g) => [g.key, g]))
  const next: Record<string, string> = {}
  for (const key of selectedSubjectKeys) {
    const group = groupByKey.get(key)
    if (!group) continue
    const kept = validClassId(group, current[key])
    if (kept) {
      next[key] = kept
      continue
    }
    if (group.classes.length === 1) {
      next[key] = group.classes[0].id
    }
  }
  return next
}

/** 只保留仍選中的班；僅一堂則預填。 */
export function pruneAndAutofillSchedules(
  selectedClassIds: string[],
  classes: TrialInviteClassOption[],
  current: Record<string, string>
): Record<string, string> {
  const classById = new Map(classes.map((c) => [c.id, c]))
  const next: Record<string, string> = {}
  for (const classId of selectedClassIds) {
    const cls = classById.get(classId)
    if (!cls) continue
    const kept = validScheduleId(cls, current[classId])
    if (kept) {
      next[classId] = kept
      continue
    }
    if (cls.schedules.length === 1) {
      next[classId] = cls.schedules[0].id
    }
  }
  return next
}

export function pickedClassCount(
  selectedKeys: string[],
  groups: SubjectGroup[],
  classBySubject: Record<string, string>
): { picked: number; total: number } {
  const groupByKey = new Map(groups.map((g) => [g.key, g]))
  let picked = 0
  for (const key of selectedKeys) {
    const group = groupByKey.get(key)
    if (group && validClassId(group, classBySubject[key])) picked += 1
  }
  return { picked, total: selectedKeys.length }
}

export function selectedClassIdsForGroups(
  groups: SubjectGroup[],
  classBySubject: Record<string, string>
): string[] {
  const ids: string[] = []
  for (const group of groups) {
    const id = validClassId(group, classBySubject[group.key])
    if (id) ids.push(id)
  }
  return ids
}

export function pickedScheduleCount(
  classIds: string[],
  classes: TrialInviteClassOption[],
  scheduleByClass: Record<string, string>
): { picked: number; total: number } {
  const classById = new Map(classes.map((c) => [c.id, c]))
  let picked = 0
  for (const classId of classIds) {
    const cls = classById.get(classId)
    if (cls && validScheduleId(cls, scheduleByClass[classId])) picked += 1
  }
  return { picked, total: classIds.length }
}

export function assemblePicks(
  groups: SubjectGroup[],
  selectedSubjectKeys: string[],
  classBySubject: Record<string, string>,
  scheduleByClass: Record<string, string>
): TrialPick[] {
  const result: TrialPick[] = []
  const allowed = new Set(selectedSubjectKeys)
  for (const group of groups) {
    if (!allowed.has(group.key)) continue
    const classId = validClassId(group, classBySubject[group.key])
    if (!classId) continue
    const cls = group.classes.find((c) => c.id === classId)
    if (!cls) continue
    const scheduleId = validScheduleId(cls, scheduleByClass[classId])
    if (!scheduleId) continue
    const sch = cls.schedules.find((s) => s.id === scheduleId)
    if (!sch) continue
    result.push({
      classId: cls.id,
      scheduleId: sch.id,
      subjectLabel: group.label,
      classLabel: classLabelOf(cls),
      scheduleLabel: formatScheduleLine(sch),
    })
  }
  return result
}
