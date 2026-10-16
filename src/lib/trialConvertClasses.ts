import type { ClassKind } from "@/lib/privateClassKind"
import { isExemptFromStudentTimeConflict } from "@/lib/studentTimeConflict"

export type TrialConvertClassCandidate = {
  id: string
  classKind: string | null
  subject?: string | null
  courseName?: string | null
  courseCode?: string | null
}

function looksLikeHomeworkClass(cls: TrialConvertClassCandidate): boolean {
  return isExemptFromStudentTimeConflict({
    classKind: cls.classKind,
    subject: cls.subject,
    courseName: cls.courseName,
    courseCode: cls.courseCode,
  })
}

/**
 * 正式報讀可改選的班。
 * 專科不收功課輔導班：種類、科目／課程名，或課程代碼含 HWK 都算。
 * 暑期 26SM-HWKP 的種類仍是小組，只看種類會漏進專科清單。
 */
export function classAllowedForTrialConvert(
  trialKind: ClassKind,
  trialClassId: string | null | undefined,
  cls: TrialConvertClassCandidate
): boolean {
  if (trialKind === "private") return cls.id === (trialClassId ?? "")
  if (trialKind === "homework") return cls.classKind === "homework"
  return !looksLikeHomeworkClass(cls) && cls.classKind !== "private"
}
