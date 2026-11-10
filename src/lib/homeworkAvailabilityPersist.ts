import type {
  AllTeacherAvailability,
  AllTeacherSubmitStatus,
  AvailEntry,
} from "@/lib/homeworkTutoringUi"

export type HomeworkAvailabilityPersistRow = {
  teacherId: string
  status: "草稿" | "已提交"
  entries: Record<string, AvailEntry>
}

/** 只持久化草稿與已提交。鍵序固定，方便比對是否與上次寫入相同。 */
export function homeworkAvailabilityRowsToPersist(
  entries: AllTeacherAvailability,
  statuses: AllTeacherSubmitStatus
): HomeworkAvailabilityPersistRow[] {
  return Object.entries(statuses)
    .flatMap(([teacherId, status]) => {
      if (status !== "草稿" && status !== "已提交") return []
      const raw = entries[teacherId] ?? {}
      const stable: Record<string, AvailEntry> = {}
      for (const key of Object.keys(raw).sort()) stable[key] = raw[key]!
      return [{ teacherId, status, entries: stable }]
    })
    .sort((a, b) => a.teacherId.localeCompare(b.teacherId))
}

export function homeworkAvailabilityPersistKey(
  entries: AllTeacherAvailability,
  statuses: AllTeacherSubmitStatus,
  targetMonth: string
): string {
  return `${targetMonth.slice(0, 7)}\n${JSON.stringify(
    homeworkAvailabilityRowsToPersist(entries, statuses)
  )}`
}
