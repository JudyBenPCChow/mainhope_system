import { isEndedClassStatus } from "@/lib/classOperatingStatus"
import { academicYearLabelFromStartDate } from "@/lib/courseCode"
import { resolveClassKind } from "@/lib/privateClassKind"

export type TrialAddClassCandidate = {
  status?: string | null
  classKind?: string | null
  subject?: string | null
  academicYearLabel?: string | null
}

/** 新增試堂可選班：只留當下學年，不含私人課程與已結束。 */
export function classAllowedForNewTrial(
  cls: TrialAddClassCandidate,
  asOfYmd?: string | null
): boolean {
  if (isEndedClassStatus(cls.status)) return false
  if (resolveClassKind(cls.classKind, cls.subject) === "private") return false
  const current = academicYearLabelFromStartDate(asOfYmd ?? null)
  return (cls.academicYearLabel ?? "").trim() === current
}
