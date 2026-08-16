import { formatUnknownError } from "@/lib/formatUnknownError"
import { classKindLabel } from "@/lib/privateClassKind"
import { DEFAULT_ID_CHUNK, forEachIdChunk } from "@/lib/supabaseInChunks"
import { supabase } from "@/lib/supabaseClient"
import { fetchAcademicYearOptions, type AcademicYearOption } from "@/services/classQueries"

export type ClassKindFilter = "all" | "group" | "private"

export type EnrollmentReportFilters = {
 academicYearId: string
 classKind: ClassKindFilter
}

export type SubjectHeadcountRow = {
 subjectKey: string
 subjectCode: string | null
 subjectName: string
 classCount: number
 enrollmentCount: number
 studentCount: number
}

export type ClassHeadcountRow = {
 classId: string
 courseCodeFull: string | null
 subjectLabel: string
 classKind: "group" | "private" | string
 teacherName: string | null
 studentCount: number
}

export type TeacherHeadcountRow = {
 teacherId: string | null
 teacherName: string
 classCount: number
 enrollmentCount: number
 studentCount: number
}

export type StatusBucket = {
 label: string
 count: number
}

export type OverallStudentAnalysis = {
 totalStudents: number
 enrolledStudents: number
 buckets: {
  registration: StatusBucket[]
  enrollment: StatusBucket[]
  activity: StatusBucket[]
  academicStage: StatusBucket[]
 }
}

export type EnrollmentReportPayload = {
 subjects: SubjectHeadcountRow[]
 classes: ClassHeadcountRow[]
 teachers: TeacherHeadcountRow[]
 totals: {
  classCount: number
  enrollmentCount: number
  distinctStudents: number
 }
}

type ClassMeta = {
 id: string
 subject: string
 classKind: string
 courseCodeFull: string | null
 teacherId: string | null
 teacherName: string | null
 subjectCode: string | null
 subjectNameZh: string | null
}

function asRecord(v: unknown): Record<string, unknown> | null {
 return v != null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function subjectLabelFromClass(c: ClassMeta): string {
 const zh = c.subjectNameZh?.trim()
 if (zh) return zh
 const sub = c.subject?.trim()
 if (sub) return sub
 return "（未分類科目）"
}

function subjectKeyFromClass(c: ClassMeta): string {
 const code = c.subjectCode?.trim()
 if (code) return `code:${code}`
 return `name:${subjectLabelFromClass(c)}`
}

async function fetchClassesForReport(filters: EnrollmentReportFilters): Promise<ClassMeta[]> {
 if (!supabase) return []
 const pageSize = 1000
 const all: ClassMeta[] = []
 for (let from = 0; ; from += pageSize) {
  let q = supabase
   .from("classes")
   .select(
    "id, subject, class_kind, course_code_full, teacher_id, academic_year_id, teachers ( id, full_name ), courses ( subjects ( code, name_zh ) )"
   )
   .order("id", { ascending: true })
   .range(from, from + pageSize - 1)
  if (filters.academicYearId) q = q.eq("academic_year_id", filters.academicYearId)
  if (filters.classKind === "group" || filters.classKind === "private") {
   q = q.eq("class_kind", filters.classKind)
  }
  const { data, error } = await q
  if (error) throw new Error(formatUnknownError(error))
  const chunk = (data ?? []) as Record<string, unknown>[]
  for (const row of chunk) {
   const teacher = asRecord(row.teachers)
   const course = asRecord(row.courses)
   const subject = asRecord(course?.subjects)
   all.push({
    id: String(row.id),
    subject: row.subject != null ? String(row.subject) : "",
    classKind: row.class_kind != null ? String(row.class_kind) : "group",
    courseCodeFull: row.course_code_full != null ? String(row.course_code_full) : null,
    teacherId: row.teacher_id != null ? String(row.teacher_id) : teacher?.id != null ? String(teacher.id) : null,
    teacherName: teacher?.full_name != null ? String(teacher.full_name) : null,
    subjectCode: subject?.code != null ? String(subject.code) : null,
    subjectNameZh: subject?.name_zh != null ? String(subject.name_zh) : null,
   })
  }
  if (chunk.length < pageSize) break
 }
 return all
}

async function fetchActiveEnrollmentCountsByClass(
 classIds: string[]
): Promise<Map<string, { enrollmentCount: number; studentIds: Set<string> }>> {
 const byClass = new Map<string, { enrollmentCount: number; studentIds: Set<string> }>()
 if (!supabase || classIds.length === 0) return byClass

 await forEachIdChunk(classIds, DEFAULT_ID_CHUNK, async (slice) => {
  const pageSize = 1000
  for (let from = 0; ; from += pageSize) {
   const { data, error } = await supabase!
    .from("student_class_enrollments")
    .select("id, student_id, class_id")
    .eq("status", "就讀中")
    .in("class_id", slice)
    .order("id", { ascending: true })
    .range(from, from + pageSize - 1)
   if (error) throw new Error(formatUnknownError(error))
   const chunk = (data ?? []) as Record<string, unknown>[]
   for (const row of chunk) {
    const classId = String(row.class_id)
    const studentId = String(row.student_id)
    let entry = byClass.get(classId)
    if (!entry) {
     entry = { enrollmentCount: 0, studentIds: new Set() }
     byClass.set(classId, entry)
    }
    entry.enrollmentCount += 1
    entry.studentIds.add(studentId)
   }
   if (chunk.length < pageSize) break
  }
 })

 return byClass
}

function bumpBucket(map: Map<string, number>, label: string) {
 const key = label.trim() || "（未設定）"
 map.set(key, (map.get(key) ?? 0) + 1)
}

function mapToBuckets(map: Map<string, number>, preferredOrder: string[]): StatusBucket[] {
 const out: StatusBucket[] = []
 const seen = new Set<string>()
 for (const label of preferredOrder) {
  if (!map.has(label)) continue
  out.push({ label, count: map.get(label)! })
  seen.add(label)
 }
 for (const [label, count] of [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-Hant"))) {
  if (seen.has(label)) continue
  out.push({ label, count })
 }
 return out
}

/** 學生主檔四維人數分析（不受學年／班別類型篩選影響） */
export async function fetchOverallStudentAnalysis(): Promise<OverallStudentAnalysis> {
 if (!supabase) {
  return {
   totalStudents: 0,
   enrolledStudents: 0,
   buckets: { registration: [], enrollment: [], activity: [], academicStage: [] },
  }
 }

 const registration = new Map<string, number>()
 const enrollment = new Map<string, number>()
 const activity = new Map<string, number>()
 const academicStage = new Map<string, number>()
 let totalStudents = 0
 let enrolledStudents = 0

 const pageSize = 1000
 for (let from = 0; ; from += pageSize) {
  const { data, error } = await supabase
   .from("students")
   .select("id, registration_status, enrollment_status, activity_status, academic_stage")
   .order("id", { ascending: true })
   .range(from, from + pageSize - 1)
  if (error) throw new Error(formatUnknownError(error))
  const chunk = (data ?? []) as Record<string, unknown>[]
  for (const row of chunk) {
   totalStudents += 1
   const reg = row.registration_status != null ? String(row.registration_status) : "（未設定）"
   const enr = row.enrollment_status != null ? String(row.enrollment_status) : "（未設定）"
   const act = row.activity_status != null ? String(row.activity_status) : "（未設定）"
   const stage = row.academic_stage != null ? String(row.academic_stage) : "（未設定）"
   bumpBucket(registration, reg)
   bumpBucket(enrollment, enr)
   bumpBucket(activity, act)
   bumpBucket(academicStage, stage)
   if (enr === "在讀") enrolledStudents += 1
  }
  if (chunk.length < pageSize) break
 }

 return {
  totalStudents,
  enrolledStudents,
  buckets: {
   registration: mapToBuckets(registration, ["已註冊", "非注冊"]).map((bucket) => ({
    ...bucket,
    label: bucket.label === "非注冊" ? "非註冊" : bucket.label,
   })),
   enrollment: mapToBuckets(enrollment, ["在讀", "非在讀"]),
   activity: mapToBuckets(activity, ["活躍生", "非活躍生"]),
   academicStage: mapToBuckets(academicStage, ["中學階段", "已畢業"]),
  },
 }
}

/** 就讀中報讀聚合：每科／每班／每位老師 */
export async function fetchEnrollmentReport(
 filters: EnrollmentReportFilters
): Promise<EnrollmentReportPayload> {
 const classes = await fetchClassesForReport(filters)
 const classIds = classes.map((c) => c.id)
 const byClass = await fetchActiveEnrollmentCountsByClass(classIds)

 const subjectMap = new Map<
  string,
  {
   subjectCode: string | null
   subjectName: string
   classIds: Set<string>
   enrollmentCount: number
   studentIds: Set<string>
  }
 >()
 const teacherMap = new Map<
  string,
  {
   teacherId: string | null
   teacherName: string
   classIds: Set<string>
   enrollmentCount: number
   studentIds: Set<string>
  }
 >()

 const classRows: ClassHeadcountRow[] = []
 let enrollmentTotal = 0
 const allStudentIds = new Set<string>()

 for (const c of classes) {
  const stats = byClass.get(c.id) ?? { enrollmentCount: 0, studentIds: new Set<string>() }
  enrollmentTotal += stats.enrollmentCount
  for (const sid of stats.studentIds) allStudentIds.add(sid)

  classRows.push({
   classId: c.id,
   courseCodeFull: c.courseCodeFull,
   subjectLabel: subjectLabelFromClass(c),
   classKind: c.classKind,
   teacherName: c.teacherName,
   studentCount: stats.enrollmentCount,
  })

  const sKey = subjectKeyFromClass(c)
  let sEntry = subjectMap.get(sKey)
  if (!sEntry) {
   sEntry = {
    subjectCode: c.subjectCode,
    subjectName: subjectLabelFromClass(c),
    classIds: new Set(),
    enrollmentCount: 0,
    studentIds: new Set(),
   }
   subjectMap.set(sKey, sEntry)
  }
  sEntry.classIds.add(c.id)
  sEntry.enrollmentCount += stats.enrollmentCount
  for (const sid of stats.studentIds) sEntry.studentIds.add(sid)

  const tKey = c.teacherId ?? `name:${c.teacherName?.trim() || "未指派老師"}`
  let tEntry = teacherMap.get(tKey)
  if (!tEntry) {
   tEntry = {
    teacherId: c.teacherId,
    teacherName: c.teacherName?.trim() || "未指派老師",
    classIds: new Set(),
    enrollmentCount: 0,
    studentIds: new Set(),
   }
   teacherMap.set(tKey, tEntry)
  }
  tEntry.classIds.add(c.id)
  tEntry.enrollmentCount += stats.enrollmentCount
  for (const sid of stats.studentIds) tEntry.studentIds.add(sid)
 }

 const subjects: SubjectHeadcountRow[] = [...subjectMap.entries()]
  .map(([subjectKey, e]) => ({
   subjectKey,
   subjectCode: e.subjectCode,
   subjectName: e.subjectName,
   classCount: e.classIds.size,
   enrollmentCount: e.enrollmentCount,
   studentCount: e.studentIds.size,
  }))
  .sort((a, b) => b.studentCount - a.studentCount || a.subjectName.localeCompare(b.subjectName, "zh-Hant"))

 const teachers: TeacherHeadcountRow[] = [...teacherMap.values()]
  .map((e) => ({
   teacherId: e.teacherId,
   teacherName: e.teacherName,
   classCount: e.classIds.size,
   enrollmentCount: e.enrollmentCount,
   studentCount: e.studentIds.size,
  }))
  .sort((a, b) => b.studentCount - a.studentCount || a.teacherName.localeCompare(b.teacherName, "zh-Hant"))

 classRows.sort(
  (a, b) => b.studentCount - a.studentCount || (a.courseCodeFull ?? "").localeCompare(b.courseCodeFull ?? "", "zh-Hant")
 )

 return {
  subjects,
  classes: classRows,
  teachers,
  totals: {
   classCount: classes.length,
   enrollmentCount: enrollmentTotal,
   distinctStudents: allStudentIds.size,
  },
 }
}

export async function fetchEnrollmentReportAcademicYears(): Promise<AcademicYearOption[]> {
 return fetchAcademicYearOptions()
}

export function exportSubjectHeadcountCsv(rows: SubjectHeadcountRow[]): string {
 const lines = ["科目代碼,科目,班別數,報讀筆數,學生人數"]
 for (const r of rows) {
  lines.push(
   [csvCell(r.subjectCode ?? ""), csvCell(r.subjectName), r.classCount, r.enrollmentCount, r.studentCount].join(",")
  )
 }
 return lines.join("\n")
}

export function exportClassHeadcountCsv(rows: ClassHeadcountRow[]): string {
 const lines = ["班別代碼,科目,類型,老師,就讀中人數"]
 for (const r of rows) {
  lines.push(
   [
    csvCell(r.courseCodeFull ?? ""),
    csvCell(r.subjectLabel),
    csvCell(classKindLabel(r.classKind)),
    csvCell(r.teacherName ?? ""),
    r.studentCount,
   ].join(",")
  )
 }
 return lines.join("\n")
}

export function exportTeacherHeadcountCsv(rows: TeacherHeadcountRow[]): string {
 const lines = ["老師,班別數,報讀筆數,學生人數"]
 for (const r of rows) {
  lines.push([csvCell(r.teacherName), r.classCount, r.enrollmentCount, r.studentCount].join(","))
 }
 return lines.join("\n")
}

export function exportOverallStudentCsv(analysis: OverallStudentAnalysis): string {
 const lines = ["維度,狀態,人數"]
 const push = (dim: string, buckets: StatusBucket[]) => {
  for (const b of buckets) lines.push([csvCell(dim), csvCell(b.label), b.count].join(","))
 }
 lines.push(["摘要", "學生總數", analysis.totalStudents].join(","))
 lines.push(["摘要", "在讀人數", analysis.enrolledStudents].join(","))
 push("註冊狀態", analysis.buckets.registration)
 push("在讀狀態", analysis.buckets.enrollment)
 push("活躍狀態", analysis.buckets.activity)
 push("學業階段", analysis.buckets.academicStage)
 return lines.join("\n")
}

function csvCell(value: string): string {
 if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
 return value
}

export function downloadEnrollmentReportCsv(filename: string, csvBody: string): void {
 const blob = new Blob([`\uFEFF${csvBody}`], { type: "text/csv;charset=utf-8" })
 const url = URL.createObjectURL(blob)
 const a = document.createElement("a")
 a.href = url
 a.download = filename
 a.click()
 URL.revokeObjectURL(url)
}
