import type { EnrollmentFormValue } from "@/lib/enrollmentPeriod"
import { isSingleSessionEnrollment } from "@/lib/enrollmentPeriod"

export const ENTITLEMENT_PACKAGE_TYPES = [
 "summer_phase_1",
 "summer_phase_2",
 "summer_full",
 "regular_full",
 "single_lesson",
] as const

export type EntitlementPackageType = (typeof ENTITLEMENT_PACKAGE_TYPES)[number]

/** §3.5：細粒度優先（數字愈小愈先扣） */
export const PACKAGE_CONSUME_PRIORITY: Record<EntitlementPackageType, number> = {
 single_lesson: 1,
 summer_phase_1: 2,
 summer_phase_2: 2,
 summer_full: 3,
 regular_full: 3,
}

export const ROSTER_ELIGIBILITY_REASON_CODES = [
 "eligible_declared",
 "not_declared",
 "no_entitlement_balance",
 "pool_expired",
 "namespace_mismatch",
 "schedule_cancelled",
 "student_deferred",
 "student_transferred",
 "manual_pending_approval",
 "legacy_path",
 "trial_session",
 "leave_makeup_guest",
] as const

export type RosterEligibilityReasonCode = (typeof ROSTER_ELIGIBILITY_REASON_CODES)[number]

export const ROSTER_ELIGIBILITY_REASON_LABELS: Record<RosterEligibilityReasonCode, string> = {
 eligible_declared: "已宣告且已繳堂數有效",
 not_declared: "有／可能有已繳堂數但未宣告",
 no_entitlement_balance: "該組別無已繳堂數餘額",
 pool_expired: "已繳堂數已過期",
 namespace_mismatch: "已繳堂數與本堂班／學年包裝不符",
 schedule_cancelled: "交付已取消",
 student_deferred: "已順延",
 student_transferred: "已轉出",
 manual_pending_approval: "手動加名待審",
 legacy_path: "舊路徑（日期／包裝）",
 trial_session: "試堂",
 leave_makeup_guest: "請假補堂掛入",
}

export function enrollmentPeriodToPackageType(
 enrollmentPeriod: EnrollmentFormValue | null | undefined
): EntitlementPackageType {
 if (isSingleSessionEnrollment(enrollmentPeriod)) return "single_lesson"
 if (enrollmentPeriod === "第一期") return "summer_phase_1"
 if (enrollmentPeriod === "第二期") return "summer_phase_2"
 if (enrollmentPeriod === "兩期全報") return "summer_full"
 return "regular_full"
}

export function packageTypeLabel(packageType: EntitlementPackageType): string {
 switch (packageType) {
  case "summer_phase_1":
   return "暑期第一期"
  case "summer_phase_2":
   return "暑期第二期"
  case "summer_full":
   return "暑期兩期全報"
  case "single_lesson":
   return "單堂"
  case "regular_full":
   return "報讀"
 }
}
