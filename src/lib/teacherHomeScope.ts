import { academicYearLabelFromCourseCode } from "@/lib/courseCode"
import type { AcademicYearPeriodRow } from "@/lib/enrollmentPeriod"
import {
 resolveCurrentAcademicYearLabel,
 type AcademicYearWindowInput,
} from "@/lib/softArchiveWindow"

export type TeacherHomeSemesterRange = {
 startYmd: string
 endYmd: string
}

export function classAcademicYearLabel(c: {
 academic_year_label?: string | null
 course_code_full?: string | null
}): string | null {
 const fromYear = (c.academic_year_label ?? "").trim()
 if (fromYear) return fromYear
 return academicYearLabelFromCourseCode(c.course_code_full)
}

export function filterClassesForCurrentAcademicYear<
 T extends { academic_year_label?: string | null; course_code_full?: string | null },
>(classes: T[], currentYearLabel: string | null): T[] {
 if (!currentYearLabel) return classes
 return classes.filter((c) => classAcademicYearLabel(c) === currentYearLabel)
}

/** 本學期：學年期數含 asOf 之日；否則退回該學年 start–end。 */
export function resolveSemesterDateRange(opts: {
 asOfYmd: string
 years: AcademicYearWindowInput[]
 periods: AcademicYearPeriodRow[]
}): TeacherHomeSemesterRange | null {
 const asOf = opts.asOfYmd.slice(0, 10)
 const period = opts.periods.find((p) => asOf >= p.startDate && asOf <= p.endDate)
 if (period) return { startYmd: period.startDate, endYmd: period.endDate }
 const label = resolveCurrentAcademicYearLabel(opts.years, asOf)
 const year = opts.years.find((y) => y.label.trim() === (label ?? ""))
 const start = (year?.start_date ?? "").slice(0, 10)
 const end = (year?.end_date ?? "").slice(0, 10)
 if (start && end) return { startYmd: start, endYmd: end }
 return null
}

export function isYmdInRange(ymd: string, range: TeacherHomeSemesterRange | null): boolean {
 if (!range) return true
 const d = ymd.slice(0, 10)
 return d >= range.startYmd && d <= range.endYmd
}
