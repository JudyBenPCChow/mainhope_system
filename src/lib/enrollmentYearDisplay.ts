import { academicYearOrderKey, getNextAcademicYearLabel } from "@/lib/academicYearAccess"
import { academicYearLabelFromStartDate } from "@/lib/courseCode"
import { isRegularAcademicYearLabel } from "@/lib/softArchiveWindow"

/**
 * 進行中報讀所屬學年：以日曆推算目前學年。
 * 暑期另含下一常規學年（暑假已開的下學年班）。
 * 常規學年期間不含剛結束的暑期。
 */
export function listCurrentEnrollmentYearLabels(asOfYmd?: string | null): string[] {
 const current = academicYearLabelFromStartDate(asOfYmd ?? null)
 if (!current) return []
 if (isRegularAcademicYearLabel(current)) return [current]
 const next = getNextAcademicYearLabel(current)
 return next ? [current, next] : [current]
}

/** 無學年標籤時當進行中，避免把營運資料藏起。 */
export function isCurrentEnrollmentYear(
 label: string | null | undefined,
 asOfYmd?: string | null
): boolean {
 const t = (label ?? "").trim()
 if (!t) return true
 return listCurrentEnrollmentYearLabels(asOfYmd).includes(t)
}

type EnrollmentYearFields = {
 status: string
 academicYearLabel?: string | null
 classKind?: string | null
}

/** 私人課程不受學年結束影響；專科／功輔只在目前學年可當進行中／可收款。 */
export function isCollectableEnrollment(row: EnrollmentYearFields, asOfYmd?: string | null): boolean {
 if (row.status === "已退讀") return false
 if (row.classKind === "private") return true
 return isCurrentEnrollmentYear(row.academicYearLabel, asOfYmd)
}

export type EnrollmentYearPartition<T> = {
 current: T[]
 past: T[]
 withdrawn: T[]
}

export function partitionEnrollmentsByAcademicYear<T extends EnrollmentYearFields>(
 enrollments: T[],
 asOfYmd?: string | null
): EnrollmentYearPartition<T> {
 const current: T[] = []
 const past: T[] = []
 const withdrawn: T[] = []
 for (const row of enrollments) {
  if (row.status === "已退讀") {
   withdrawn.push(row)
   continue
  }
  if (isCollectableEnrollment(row, asOfYmd)) current.push(row)
  else past.push(row)
 }
 return { current, past, withdrawn }
}

export type EnrollmentSubjectTagInput = {
 studentId: string
 subjectLabel: string | null | undefined
 academicYearLabel?: string | null
 classKind?: string | null
 status?: string
}

/** 學生管理清單「報讀班別」：只收目前學年（私人課程除外）。 */
export function collectCurrentEnrollmentSubjectTags(
 rows: EnrollmentSubjectTagInput[],
 asOfYmd?: string | null
): Map<string, string[]> {
 const map = new Map<string, string[]>()
 for (const row of rows) {
  const label = (row.subjectLabel ?? "").trim()
  if (!label) continue
  if (
   !isCollectableEnrollment(
    {
     status: row.status ?? "就讀中",
     academicYearLabel: row.academicYearLabel,
     classKind: row.classKind,
    },
    asOfYmd
   )
  ) {
   continue
  }
  const arr = map.get(row.studentId) ?? []
  if (!arr.includes(label)) arr.push(label)
  map.set(row.studentId, arr)
 }
 return map
}

export function groupEnrollmentsByAcademicYear<T extends { academicYearLabel?: string | null }>(
 enrollments: T[]
): { label: string; items: T[] }[] {
 const map = new Map<string, T[]>()
 for (const row of enrollments) {
  const label = (row.academicYearLabel ?? "").trim() || "未標學年"
  const list = map.get(label) ?? []
  list.push(row)
  map.set(label, list)
 }
 return [...map.entries()]
  .sort((a, b) => academicYearOrderKey(b[0]) - academicYearOrderKey(a[0]))
  .map(([label, items]) => ({ label, items }))
}
