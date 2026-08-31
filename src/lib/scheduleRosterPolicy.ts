import { parseMakeupOfScheduleId } from "@/lib/scheduleMakeupMarkers"

export const ROSTER_POLICY_CLASS_ALL = "class_all" as const
export const ROSTER_POLICY_SELECTED = "selected" as const

export type RosterPolicy = typeof ROSTER_POLICY_CLASS_ALL | typeof ROSTER_POLICY_SELECTED

export function normalizeRosterPolicy(value: string | null | undefined): RosterPolicy {
 return value === ROSTER_POLICY_SELECTED ? ROSTER_POLICY_SELECTED : ROSTER_POLICY_CLASS_ALL
}

/** 新建排程預設：加堂且非 makeup_of 補回堂 → selected；其餘 class_all。 */
export function defaultRosterPolicyForNewSchedule(opts: {
 isExtraLesson: boolean
 remarks?: string | null
}): RosterPolicy {
 if (!opts.isExtraLesson) return ROSTER_POLICY_CLASS_ALL
 if (parseMakeupOfScheduleId(opts.remarks)) return ROSTER_POLICY_CLASS_ALL
 return ROSTER_POLICY_SELECTED
}

export function canPickEnrolledRoster(opts: {
 rosterPolicy?: string | null
 remarks?: string | null
}): boolean {
 if (parseMakeupOfScheduleId(opts.remarks)) return false
 return normalizeRosterPolicy(opts.rosterPolicy) === ROSTER_POLICY_SELECTED
}

/** 既有加堂（尚未 selected）可改為挑選；正班與 makeup_of 補回堂不可。 */
export function canConvertExtraLessonToSelectedRoster(opts: {
 isExtraLesson: boolean
 rosterPolicy?: string | null
 remarks?: string | null
}): boolean {
 if (!opts.isExtraLesson) return false
 if (parseMakeupOfScheduleId(opts.remarks)) return false
 return normalizeRosterPolicy(opts.rosterPolicy) === ROSTER_POLICY_CLASS_ALL
}
