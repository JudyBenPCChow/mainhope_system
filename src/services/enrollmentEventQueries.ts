import { normalizeEnrollmentPeriod, type EnrollmentPeriod } from "@/lib/enrollmentPeriod"
import { supabase } from "@/lib/supabaseClient"
import { formatClassLabel } from "@/lib/courseLabel"

/** 全站增退紀錄列表列 */
export type EnrollmentChangeListRow = {
 id: string
 action: "enroll" | "withdraw" | "period_change"
 effectiveDate: string
 reason: string | null
 enrollmentPeriod: EnrollmentPeriod | null
 enrollmentId: string | null
 createdAt: string
 studentId: string
 studentName: string
 classId: string
 classLabel: string
 teacherName: string | null
}

function mapRow(r: Record<string, unknown>): EnrollmentChangeListRow {
 const st = r.students as Record<string, unknown> | null
 const cls = r.classes as Record<string, unknown> | null
 const tch = cls?.teachers as Record<string, unknown> | null | undefined
 const sub = cls?.subject != null ? String(cls.subject) : "—"
 const code = cls?.course_code_full != null ? String(cls.course_code_full) : ""
 const course = cls?.courses as Record<string, unknown> | null
 const courseName = course?.course_name != null ? String(course.course_name) : null
 const actionRaw = String(r.action ?? "enroll")
 const action: EnrollmentChangeListRow["action"] =
  actionRaw === "withdraw"
   ? "withdraw"
   : actionRaw === "period_change"
     ? "period_change"
     : "enroll"
 const enrollmentPeriod = normalizeEnrollmentPeriod(
  r.enrollment_period != null ? String(r.enrollment_period) : null
 )
 return {
  id: String(r.id),
  action,
  effectiveDate: String(r.effective_date ?? "").slice(0, 10),
  reason: r.reason != null ? String(r.reason) : null,
  enrollmentPeriod,
  enrollmentId: r.enrollment_id != null ? String(r.enrollment_id) : null,
  createdAt: String(r.created_at ?? ""),
  studentId: String(r.student_id),
  studentName: st?.full_name != null ? String(st.full_name) : "—",
  classId: String(r.class_id),
  classLabel: formatClassLabel({ subject: sub, courseCode: code, courseName }),
  teacherName: tch?.full_name != null ? String(tch.full_name) : null,
 }
}

export type EnrollmentChangeQuery = {
 action?: "enroll" | "withdraw" | ""
 fromYmd?: string
 toYmd?: string
 search?: string
 limit?: number
}

export async function fetchEnrollmentChangeEventsList(
 opts: EnrollmentChangeQuery = {}
): Promise<EnrollmentChangeListRow[]> {
 if (!supabase) return []
 const limit = Math.min(Math.max(opts.limit ?? 400, 1), 1000)
 const search = opts.search?.trim().toLowerCase() ?? ""

 let q = supabase
  .from("enrollment_change_events")
  .select(
   "id, action, effective_date, reason, enrollment_period, enrollment_id, created_at, student_id, class_id, students ( full_name ), classes ( subject, course_code_full, courses ( course_name ), teachers ( full_name ) )"
  )
  .order("effective_date", { ascending: false })
  .order("created_at", { ascending: false })
  .limit(limit)

 if (opts.action === "enroll" || opts.action === "withdraw") {
  q = q.eq("action", opts.action)
 }
 if (opts.fromYmd) q = q.gte("effective_date", opts.fromYmd)
 if (opts.toYmd) q = q.lte("effective_date", opts.toYmd)

 const { data, error } = await q
 if (error) {
  console.warn("[fetchEnrollmentChangeEventsList]", error.message)
  return []
 }
 let rows = (data ?? []).map((x) => mapRow(x as Record<string, unknown>))
 if (search) {
  rows = rows.filter((r) => {
   const hay = `${r.studentName} ${r.classLabel} ${r.teacherName ?? ""} ${r.reason ?? ""}`.toLowerCase()
   return hay.includes(search)
  })
 }
 return rows
}
