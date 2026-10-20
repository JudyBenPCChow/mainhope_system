/** 公開試堂滿班：專科班就讀中超過此人數則不出現。功課輔導班不套用。 */
export const TRIAL_PUBLIC_ENROLLED_CAP = 5

export function trialPublicEnrolledCapHidesClass(
  classKind: string | null | undefined,
  enrolledCount: number
): boolean {
  if (classKind === "homework") return false
  return enrolledCount > TRIAL_PUBLIC_ENROLLED_CAP
}
