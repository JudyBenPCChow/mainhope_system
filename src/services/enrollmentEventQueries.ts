import { normalizeEnrollmentPeriod, type EnrollmentFormValue } from "@/lib/enrollmentPeriod"
import { sanitizeIlikeFragment } from "@/lib/ilikeFragment"
import { supabase } from "@/lib/supabaseClient"
import { formatClassLabel } from "@/lib/courseLabel"
import { isSoftArchiveQueriesEnabled } from "@/lib/softArchiveFlag"
import { enrollmentOpsEffectiveDateOrFilter } from "@/lib/softArchiveListScope"
import { fetchOpsAcademicYearWindow } from "@/services/softArchiveQueries"

/** 全站增退紀錄列表列 */
export type EnrollmentChangeListRow = {
 id: string
 action: "enroll" | "withdraw" | "period_change" | "session_change"
 effectiveDate: string
 reason: string | null
 enrollmentPeriod: EnrollmentFormValue | null
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
     : actionRaw === "session_change"
       ? "session_change"
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
 includeOlderYears?: boolean
}

export type EnrollmentChangeListResult = {
 rows: EnrollmentChangeListRow[]
 hiddenOlderCount: number
 appliedFromYmd: string | null
}

export async function fetchEnrollmentChangeEventsList(
 opts: EnrollmentChangeQuery = {}
): Promise<EnrollmentChangeListResult> {
 if (!supabase) return { rows: [], hiddenOlderCount: 0, appliedFromYmd: null }
 const limit = Math.min(Math.max(opts.limit ?? 400, 1), 1000)
 const includeOlder = Boolean(opts.includeOlderYears) || !isSoftArchiveQueriesEnabled()

 let appliedFromYmd = (opts.fromYmd ?? "").trim().slice(0, 10) || null
 let hiddenOlderCount = 0
 let opsNullInclusiveDate = false

 if (!includeOlder && !appliedFromYmd) {
  const window = await fetchOpsAcademicYearWindow()
  if (window?.startYmd) {
   appliedFromYmd = window.startYmd
   opsNullInclusiveDate = true
   let countQ = supabase
    .from("enrollment_change_events")
    .select("id", { count: "exact", head: true })
    .lt("effective_date", window.startYmd)
   if (opts.action === "enroll" || opts.action === "withdraw") {
    countQ = countQ.eq("action", opts.action)
   }
   const { count, error: countErr } = await countQ
   if (countErr) {
    console.warn("[fetchEnrollmentChangeEventsList] hidden count", countErr.message)
   } else {
    hiddenOlderCount = count ?? 0
   }
  }
 }

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
 if (opsNullInclusiveDate && appliedFromYmd) {
  q = q.or(enrollmentOpsEffectiveDateOrFilter(appliedFromYmd))
 } else if (appliedFromYmd) {
  q = q.gte("effective_date", appliedFromYmd)
 }
 if (opts.toYmd) q = q.lte("effective_date", opts.toYmd)

 const searchFrag = sanitizeIlikeFragment(opts.search ?? "")
 if (searchFrag) {
  const [studentRes, classRes, teacherRes] = await Promise.all([
   supabase
    .from("students")
    .select("id")
    .or(`full_name.ilike.%${searchFrag}%,english_name.ilike.%${searchFrag}%,student_code.ilike.%${searchFrag}%`),
   supabase.from("classes").select("id").ilike("subject", `%${searchFrag}%`),
   supabase.from("teachers").select("id").ilike("full_name", `%${searchFrag}%`),
  ])
  if (studentRes.error) {
   console.warn("[fetchEnrollmentChangeEventsList] student search", studentRes.error.message)
  }
  if (classRes.error) {
   console.warn("[fetchEnrollmentChangeEventsList] class search", classRes.error.message)
  }
  if (teacherRes.error) {
   console.warn("[fetchEnrollmentChangeEventsList] teacher search", teacherRes.error.message)
  }
  const studentIds = (studentRes.data ?? []).map((r) => String((r as { id: string }).id))
  let classIds = (classRes.data ?? []).map((r) => String((r as { id: string }).id))
  const teacherIds = (teacherRes.data ?? []).map((r) => String((r as { id: string }).id))
  if (teacherIds.length > 0 && supabase) {
   const taught = await supabase.from("classes").select("id").in("teacher_id", teacherIds)
   if (!taught.error) {
    classIds = [...new Set([...classIds, ...(taught.data ?? []).map((r) => String((r as { id: string }).id))])]
   }
  }
  const orParts = [`reason.ilike.%${searchFrag}%`]
  if (studentIds.length > 0) orParts.push(`student_id.in.(${studentIds.join(",")})`)
  if (classIds.length > 0) orParts.push(`class_id.in.(${classIds.join(",")})`)
  q = q.or(orParts.join(","))
 }

 const { data, error } = await q
 if (error) {
  console.warn("[fetchEnrollmentChangeEventsList]", error.message)
  return { rows: [], hiddenOlderCount: 0, appliedFromYmd }
 }
 const rows = (data ?? []).map((x) => mapRow(x as Record<string, unknown>))
 return { rows, hiddenOlderCount, appliedFromYmd }
}
