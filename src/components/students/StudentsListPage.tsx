import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { usePersistentState } from "@/hooks/usePersistentState"
import { ChevronDown, ChevronUp, GraduationCap, LayoutGrid, List, MessageCircle, Plus, Search, Sheet, SlidersHorizontal } from "lucide-react"

import { MobileFilterSheet } from "@/components/mobile/MobileFilterSheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { MOBILE_BREAKPOINT } from "@/lib/layoutBreakpoint"

import { isSuperAdmin } from "@/lib/mgmtRole"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { openWhatsAppChat, pickStudentContactRaw } from "@/lib/whatsappReminder"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { nextStudentCode } from "@/lib/studentCode"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { useAppConfirm } from "@/lib/appConfirm"
import { ChoiceChips, GENDER_CHIPS, ParentRelationshipChips, StatusToggle, StudentClassificationTags, StudentGradeChips, formatStudentGrade } from "@/components/students/studentsUi"
import {
 isPrimaryStudentGrade,
 normalizeStudentGrade,
 PRIMARY_STUDENT_GRADE_CODES,
 STUDENT_GRADE_CODES,
 STUDENT_GRADE_LABELS,
} from "@/lib/studentGrade"
import {
 deleteStudent,
 fetchAllStudents,
 fetchEnrollmentSubjectsByStudentIds,
 fetchRecentClassEnrollments,
 fetchStudentTuitionArrearsByStudentIds,
 insertStudent,
 isUniqueViolation,
 normalizeRegistrationStatus,
 normalizeEnrollmentStatus,
 normalizeActivityStatus,
 normalizeAcademicStage,
 PHONE_COUNTRY_CODES,
 PREFERRED_CONTACT_METHODS,
 type RecentClassEnrollment,
 type StudentRecord,
 type StudentTuitionArrearsInfo,
} from "@/services/studentQueries"

const REGISTRATION_FILTERS = [
 { key: "all", label: "全部" },
 { key: "已註冊", label: "注冊" },
 { key: "非注冊", label: "非注冊" },
] as const

const ENROLLMENT_FILTERS = [
 { key: "all", label: "全部" },
 { key: "在讀", label: "在讀" },
 { key: "非在讀", label: "非在讀" },
] as const

const ACTIVITY_FILTERS = [
 { key: "all", label: "全部" },
 { key: "活躍生", label: "活躍生" },
 { key: "非活躍生", label: "非活躍生" },
] as const

const STAGE_FILTERS = [
 { key: "all", label: "全部" },
 { key: "中學階段", label: "中學階段" },
 { key: "已畢業", label: "已畢業" },
] as const

const GRADE_FILTER_PRIMARY_KEY = "PRIMARY" as const

const GRADE_FILTERS = [
 { key: "all", label: "全部" },
 { key: GRADE_FILTER_PRIMARY_KEY, label: "小學" },
 ...STUDENT_GRADE_CODES.filter(
  (code) => !(PRIMARY_STUDENT_GRADE_CODES as readonly string[]).includes(code)
 ).map((code) => ({
  key: code,
  label: STUDENT_GRADE_LABELS[code],
 })),
] as const

const COMMON_HK_SCHOOLS = [
 "英華書院",
 "聖保羅男女中學",
 "拔萃女書院",
 "喇沙書院",
 "華仁書院",
 "協恩中學",
 "伊利沙伯中學",
 "皇仁書院",
 "拔萃男書院",
 "聖若瑟書院",
] as const

/** 「近期報讀」輪播最多顯示的學生數 */
const RECENT_ENROLL_LIMIT = 5
/** 「近期報讀」自動輪播間隔（毫秒） */
const RECENT_ENROLL_ROTATE_MS = 5000

function monthStartIso(): string {
 const d = new Date()
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`
}

function studentCodeRank(code: string | null | undefined): number {
 const s = (code ?? "").trim()
 if (!s) return -1
 const m = s.match(/(\d+)(?!.*\d)/)
 if (!m) return -1
 return Number(m[1])
}

function emptyAddForm(): Partial<StudentRecord> {
 return {
  full_name: "",
  english_name: "",
  student_code: "",
  gender: "",
  grade: "",
  registration_status: "已註冊",
  academic_stage: "中學階段",
  school: "",
  date_of_birth: "",
  parent_name: "",
  parent_relationship: "",
  student_phone: "",
  student_phone_country_code: "+852",
  parent_phone: "",
  parent_phone_country_code: "+852",
  whatsapp: "",
  preferred_contact_method: "",
  address: "",
  remarks: "",
 }
}

/** 依區號驗證電話位數（+852=8 位、+86=11 位，可含空格或連字號），允許留空 */
function isValidPhoneForCode(raw: string | null | undefined, countryCode: string | null | undefined): boolean {
 const s = (raw ?? "").trim()
 if (!s) return true
 const digits = s.replace(/[\s-]/g, "")
 if (!/^\d+$/.test(digits)) return false
 if (countryCode === "+86") return digits.length === 11
 return digits.length === 8
}

/** WhatsApp 號碼（無區號欄位）：允許 8 或 11 位數字，允許留空 */
function isValidWhatsApp(raw: string | null | undefined): boolean {
 const s = (raw ?? "").trim()
 if (!s) return true
 const digits = s.replace(/[\s-]/g, "")
 return /^\d{8}$/.test(digits) || /^\d{11}$/.test(digits)
}

/** 出生日期不可為未來日期 */
function isValidBirthDate(raw: string | null | undefined): boolean {
 const s = (raw ?? "").trim()
 if (!s) return true
 if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
 return s <= localYmd()
}

function localYmd(d = new Date()): string {
 const y = d.getFullYear()
 const m = String(d.getMonth() + 1).padStart(2, "0")
 const day = String(d.getDate()).padStart(2, "0")
 return `${y}-${m}-${day}`
}

/** 將 created_at（UTC timestamptz ISO）換成本機日期 YYYY-MM-DD；無法解析時回退取前 10 字元。 */
function createdAtLocalYmd(createdAt: string | null | undefined): string {
 const s = (createdAt ?? "").trim()
 if (!s) return ""
 const d = new Date(s)
 if (Number.isNaN(d.getTime())) return s.slice(0, 10)
 return localYmd(d)
}

function formatCsv(rows: StudentRecord[]): string {
 const headers = [
  "id",
  "student_code",
  "full_name",
  "english_name",
  "grade",
  "status",
  "student_phone",
  "parent_phone",
  "school",
 ]
 const esc = (v: string | null | undefined) => {
  const s = v ?? ""
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
 }
 const lines = [headers.join(",")]
 for (const r of rows) {
  lines.push(
   [
    r.id,
    r.student_code,
    r.full_name,
    r.english_name,
    r.grade,
    r.status,
    r.student_phone,
    r.parent_phone,
    r.school,
   ]
    .map((c) => esc(c))
    .join(",")
  )
 }
 return "\uFEFF" + lines.join("\n")
}

function getInitialStudentsViewMode(): "table" | "gallery" {
 try {
  const raw = sessionStorage.getItem("mgmt_students_viewMode")
  if (raw != null) return JSON.parse(raw) as "table" | "gallery"
 } catch {
  /* ignore */
 }
 return typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT ? "gallery" : "table"
}

export function StudentsListPage() {
 const { confirmDialog } = useAppConfirm()
 const navigate = useNavigate()
 const isMobile = useIsMobile()
 const [filtersOpen, setFiltersOpen] = useState(false)
 const [rows, setRows] = useState<StudentRecord[]>([])
 const [tags, setTags] = useState<Map<string, string[]>>(new Map())
 const [tuitionMap, setTuitionMap] = useState<Map<string, StudentTuitionArrearsInfo>>(new Map())
 const [recentEnrollments, setRecentEnrollments] = useState<RecentClassEnrollment[]>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)
 const [registrationKey, setRegistrationKey] = usePersistentState<
  (typeof REGISTRATION_FILTERS)[number]["key"]
 >("mgmt_students_registrationKey", "all")
 const [enrollmentKey, setEnrollmentKey] = usePersistentState<
  (typeof ENROLLMENT_FILTERS)[number]["key"]
 >("mgmt_students_enrollmentKey", "all")
 const [activityKey, setActivityKey] = usePersistentState<(typeof ACTIVITY_FILTERS)[number]["key"]>(
  "mgmt_students_activityKey",
  "all"
 )
 const [stageKey, setStageKey] = usePersistentState<(typeof STAGE_FILTERS)[number]["key"]>(
  "mgmt_students_stageKey",
  "all"
 )
 const [gradeKey, setGradeKey] = usePersistentState<(typeof GRADE_FILTERS)[number]["key"]>(
  "mgmt_students_gradeKey",
  "all"
 )
 const [viewMode, setViewMode] = usePersistentState<"table" | "gallery">(
  "mgmt_students_viewMode",
  getInitialStudentsViewMode()
 )
 const [sortMode, setSortMode] = usePersistentState<"codeAsc" | "codeDesc">(
  "mgmt_students_sortMode",
  "codeDesc"
 )
 const [showGraduated, setShowGraduated] = usePersistentState<boolean>("mgmt_students_showGraduated", false)
 const [dashboardCollapsed, setDashboardCollapsed] = useState(false)
 const [recentIndex, setRecentIndex] = useState(0)
 const [search, setSearch] = usePersistentState<string>("mgmt_students_search", "")
 const [addOpen, setAddOpen] = useState(false)
 const [addForm, setAddForm] = useState<Partial<StudentRecord>>(emptyAddForm())
 const [addErr, setAddErr] = useState<string | null>(null)
 const [addSaving, setAddSaving] = useState(false)
 const [schoolSearch, setSchoolSearch] = useState("")

 const load = useCallback(async () => {
  setLoading(true)
  setErr(null)
  try {
   const list = await fetchAllStudents()
   setRows(list)
   const ids = list.map((s) => s.id)
   const [tagMap, arrearsMap, recentEnr] = await Promise.all([
    fetchEnrollmentSubjectsByStudentIds(ids),
    fetchStudentTuitionArrearsByStudentIds(ids),
    fetchRecentClassEnrollments(RECENT_ENROLL_LIMIT),
   ])
   setTags(tagMap)
   setTuitionMap(arrearsMap)
   setRecentEnrollments(recentEnr)
  } catch (e) {
   reportUserFacingError(e, { source: "StudentsListPage.load", setErr })
  } finally {
   setLoading(false)
  }
 }, [])

 useEffect(() => {
  void load()
 }, [load])

 const stats = useMemo(() => {
  const total = rows.length
  const enrolled = rows.filter((r) => normalizeEnrollmentStatus(r.enrollment_status) === "在讀").length
  const active = rows.filter((r) => normalizeActivityStatus(r.activity_status) === "活躍生").length
  const start = monthStartIso()
  const newThisMonth = rows.filter((r) => createdAtLocalYmd(r.created_at) >= start).length
  return { total, enrolled, active, newThisMonth }
 }, [rows])

 // 資料變動時回到最新一筆報讀
 useEffect(() => {
  setRecentIndex(0)
 }, [recentEnrollments.length])

 // 閒置自動輪播；多於一筆才啟動
 useEffect(() => {
  if (recentEnrollments.length <= 1) return
  const id = window.setInterval(() => {
   setRecentIndex((i) => (i + 1) % recentEnrollments.length)
  }, RECENT_ENROLL_ROTATE_MS)
  return () => window.clearInterval(id)
 }, [recentEnrollments.length])

 const recentCurrent =
  recentEnrollments.length === 0
   ? null
   : recentEnrollments[Math.min(recentIndex, recentEnrollments.length - 1)]

 // 取「學號數值最大」者；忽略無/非數字學號（rank < 0），與表格排序共用 studentCodeRank
 const latestCodeStudent = useMemo(() => {
  let best: StudentRecord | null = null
  let bestRank = -1
  for (const r of rows) {
   const rank = studentCodeRank(r.student_code)
   if (rank < 0) continue
   if (best == null || rank > bestRank) {
    best = r
    bestRank = rank
   }
  }
  return best
 }, [rows])

 const filtered = useMemo(() => {
  let list = rows
  if (registrationKey !== "all") {
   list = list.filter((r) => normalizeRegistrationStatus(r.registration_status) === registrationKey)
  }
  if (enrollmentKey !== "all") {
   list = list.filter((r) => normalizeEnrollmentStatus(r.enrollment_status) === enrollmentKey)
  }
  if (activityKey !== "all") {
   list = list.filter((r) => normalizeActivityStatus(r.activity_status) === activityKey)
  }
  if (stageKey !== "all") {
   list = list.filter((r) => normalizeAcademicStage(r.academic_stage) === stageKey)
  }
  if (!showGraduated) {
   list = list.filter(
    (r) => normalizeAcademicStage(r.academic_stage) !== "已畢業" && (r.grade ?? "") !== "GD"
   )
  }
  if (gradeKey !== "all") {
   if (gradeKey === GRADE_FILTER_PRIMARY_KEY) {
    list = list.filter((r) => isPrimaryStudentGrade(r.grade))
   } else {
    list = list.filter((r) => (r.grade ?? "") === gradeKey)
   }
  }
  const q = search.trim().toLowerCase()
  if (q) {
   list = list.filter((r) => {
    const hay = [
     r.full_name,
     r.english_name,
     r.student_code,
     r.student_phone,
     r.parent_phone,
    ]
     .filter(Boolean)
     .join(" ")
     .toLowerCase()
    return hay.includes(q)
   })
  }
  const sorted = [...list].sort((a, b) => {
   const ra = studentCodeRank(a.student_code)
   const rb = studentCodeRank(b.student_code)
   const aEmpty = ra < 0
   const bEmpty = rb < 0
   // 無學號一律排最後（不受升/降序影響），與「最新學號」忽略無學號的口徑一致
   if (aEmpty && bEmpty) return a.full_name.localeCompare(b.full_name, "zh-Hant")
   if (aEmpty) return 1
   if (bEmpty) return -1
   if (ra !== rb) return sortMode === "codeAsc" ? ra - rb : rb - ra
   return a.full_name.localeCompare(b.full_name, "zh-Hant")
  })
  return sorted
 }, [rows, registrationKey, enrollmentKey, activityKey, stageKey, showGraduated, gradeKey, search, sortMode])

 const classificationCounts = useMemo(() => {
  const registration = new Map<string, number>()
  const enrollment = new Map<string, number>()
  const activity = new Map<string, number>()
  const stage = new Map<string, number>()
  for (const r of rows) {
   const reg = normalizeRegistrationStatus(r.registration_status)
   const enr = normalizeEnrollmentStatus(r.enrollment_status)
   const act = normalizeActivityStatus(r.activity_status)
   const stg = normalizeAcademicStage(r.academic_stage)
   registration.set(reg, (registration.get(reg) ?? 0) + 1)
   enrollment.set(enr, (enrollment.get(enr) ?? 0) + 1)
   activity.set(act, (activity.get(act) ?? 0) + 1)
   stage.set(stg, (stage.get(stg) ?? 0) + 1)
  }
  return { registration, enrollment, activity, stage }
 }, [rows])

 const activeFilterCount = useMemo(() => {
  let count = 0
  if (registrationKey !== "all") count++
  if (enrollmentKey !== "all") count++
  if (activityKey !== "all") count++
  if (stageKey !== "all") count++
  if (gradeKey !== "all") count++
  if (showGraduated) count++
  return count
 }, [registrationKey, enrollmentKey, activityKey, stageKey, gradeKey, showGraduated])

 const resetFilters = () => {
  setRegistrationKey("all")
  setEnrollmentKey("all")
  setActivityKey("all")
  setStageKey("all")
  setGradeKey("all")
  setShowGraduated(false)
 }

 const exportCsv = () => {
  const blob = new Blob([formatCsv(filtered)], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
 }

 const onAddStudent = async () => {
  if (addSaving) return
  const fullName = (addForm.full_name ?? "").trim()
  if (!fullName) {
   setAddErr("請填寫中文姓名")
   return
  }
  if (!isValidPhoneForCode(addForm.student_phone, addForm.student_phone_country_code)) {
   setAddErr(
    addForm.student_phone_country_code === "+86"
     ? "學生電話格式不正確（+86 需為 11 位數字）"
     : "學生電話格式不正確（+852 需為 8 位數字）"
   )
   return
  }
  if (!isValidPhoneForCode(addForm.parent_phone, addForm.parent_phone_country_code)) {
   setAddErr(
    addForm.parent_phone_country_code === "+86"
     ? "家長電話格式不正確（+86 需為 11 位數字）"
     : "家長電話格式不正確（+852 需為 8 位數字）"
   )
   return
  }
  if (!isValidWhatsApp(addForm.whatsapp)) {
   setAddErr("WhatsApp 號碼格式不正確（需為 8 或 11 位數字）")
   return
  }
  if (!isValidBirthDate(addForm.date_of_birth)) {
   setAddErr("出生日期不可為未來日期")
   return
  }

  setAddSaving(true)
  setAddErr(null)
  const reg = addForm.registration_status === "非注冊" ? "非注冊" : "已註冊"
  const payload = {
   full_name: fullName,
   english_name: (addForm.english_name ?? "").trim() || null,
   gender: (addForm.gender ?? "").trim() || null,
   grade: normalizeStudentGrade(addForm.grade),
   registration_status: reg,
   academic_stage: addForm.academic_stage === "已畢業" ? "已畢業" : "中學階段",
   school: (addForm.school ?? "").trim() || null,
   date_of_birth: (addForm.date_of_birth ?? "").trim() || null,
   parent_name: (addForm.parent_name ?? "").trim() || null,
   parent_relationship: (addForm.parent_relationship ?? "").trim() || null,
   student_phone: (addForm.student_phone ?? "").trim() || null,
   student_phone_country_code: addForm.student_phone_country_code === "+86" ? "+86" : "+852",
   parent_phone: (addForm.parent_phone ?? "").trim() || null,
   parent_phone_country_code: addForm.parent_phone_country_code === "+86" ? "+86" : "+852",
   whatsapp: (addForm.whatsapp ?? "").trim() || null,
   preferred_contact_method:
    addForm.preferred_contact_method === "WeChat" || addForm.preferred_contact_method === "WhatsApp"
     ? addForm.preferred_contact_method
     : null,
   address: (addForm.address ?? "").trim() || null,
   remarks: (addForm.remarks ?? "").trim() || null,
  } as const

  try {
   try {
    await insertStudent({ ...payload, student_code: (addForm.student_code ?? "").trim() || null })
   } catch (e) {
    // 學號可能因競態而重複：以最新清單重算後重試一次
    if (isUniqueViolation(e)) {
     const fresh = await fetchAllStudents()
     await insertStudent({ ...payload, student_code: nextStudentCode(fresh) })
    } else {
     throw e
    }
   }
   setAddOpen(false)
   setAddForm(emptyAddForm())
   await load()
  } catch (e) {
   if (isUniqueViolation(e)) {
    setAddErr("學號重複，請關閉視窗重新整理後再試。")
   } else {
    reportUserFacingError(e, { source: "StudentsListPage.onAddStudent", setErr: setAddErr })
   }
  } finally {
   setAddSaving(false)
  }
 }

 const schoolOptions = useMemo(() => {
  const fromRows = rows.map((r) => (r.school ?? "").trim()).filter(Boolean)
  const all = [...COMMON_HK_SCHOOLS, ...fromRows]
  return [...new Set(all)].sort((a, b) => a.localeCompare(b, "zh-Hant"))
 }, [rows])

 const schoolFiltered = useMemo(() => {
  const q = schoolSearch.trim().toLowerCase()
  if (!q) return schoolOptions
  return schoolOptions.filter((s) => s.toLowerCase().includes(q))
 }, [schoolOptions, schoolSearch])

 const onDelete = async (e: React.MouseEvent, id: string) => {
  e.stopPropagation()
 if (
  !(await confirmDialog({
   title: "刪除學生",
   description: "確定刪除此學生？將一併刪除關聯選課等資料（若資料庫設為 cascade）。",
   confirmText: "確認刪除",
   tone: "destructive",
  }))
 )
  return
  try {
   await deleteStudent(id)
   await load()
  } catch (er) {
   reportUserFacingError(er, { source: "StudentsListPage.onDelete", setErr })
  }
 }

 const renderFilterPanel = () => (
  <>
   <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
    <div className="flex flex-wrap items-center gap-2">
     <h2 className="text-sm font-semibold tracking-wide">學生儀表板</h2>
     <Tag tone="default" size="sm">目前排序：{sortMode === "codeAsc" ? "按學號（小→大）" : "按學號（最新）"}</Tag>
     <span className="text-xs text-muted-foreground">統計為全體，不受下方篩選影響</span>
    </div>
    <Button
     type="button"
     variant="ghost"
     size="sm"
     className="gap-1.5"
     onClick={() => setDashboardCollapsed((v) => !v)}
    >
     {dashboardCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
     {dashboardCollapsed ? "展開" : "收合"}
    </Button>
   </div>

   {!dashboardCollapsed ? (
    <>
     <div className="grid gap-3 sm:grid-cols-4">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
       <div className="text-3xl font-bold text-primary">{loading ? "…" : stats.enrolled}</div>
       <div className="text-sm text-muted-foreground">目前在讀</div>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
       <div className="text-3xl font-bold text-success">{loading ? "…" : stats.active}</div>
       <div className="text-sm text-muted-foreground">活躍生（近三個月報讀）</div>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
       <div className="text-3xl font-bold text-foreground">{loading ? "…" : stats.total}</div>
       <div className="text-sm text-muted-foreground">學生總數</div>
      </div>
      <button
       type="button"
       onClick={() => setSortMode("codeDesc")}
       className="rounded-xl border border-info bg-info p-4 text-left shadow-sm transition hover:border-info/70 hover:shadow-md"
       title="按學號（最新）排序"
      >
       <div className="text-xs font-medium uppercase tracking-wide text-info-foreground/90">最新學號</div>
       <div className="mt-1 text-2xl font-bold text-info-foreground">{latestCodeStudent?.student_code ?? "—"}</div>
       <div className="mt-2 text-xs text-info-foreground/80">點擊後改為「按學號（最新）」排序</div>
      </button>
     </div>

     {recentCurrent ? (
      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-primary px-4 py-4 text-primary-foreground shadow-md">
       <button
        type="button"
        onClick={() => navigate(`/Students/${recentCurrent.studentId}`)}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-semibold outline-none transition-colors hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-white/70"
        aria-label={`開啟 ${recentCurrent.studentName} 的學生詳情`}
       >
        {recentCurrent.studentName.slice(0, 1)}
       </button>
       <div className="min-w-0 flex-1">
        <div className="text-xs font-medium uppercase tracking-wide text-white/80">
         {recentIndex === 0 ? "最新報讀班別" : `近期報讀班別（第 ${recentIndex + 1} 新）`}
        </div>
        <button
         type="button"
         onClick={() => navigate(`/Students/${recentCurrent.studentId}`)}
         className="block max-w-full truncate text-left text-lg font-semibold underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-white/70"
        >
         {recentCurrent.studentName} · {recentCurrent.classLabel}
        </button>
        <div className="text-sm text-white/90">報讀日期：{recentCurrent.enrollDate ?? "—"}</div>
       </div>
       {recentEnrollments.length > 1 ? (
        <div className="flex gap-1.5" role="tablist" aria-label="近期報讀班別切換">
         {recentEnrollments.map((e, i) => (
          <button
           key={e.id}
           type="button"
           role="tab"
           aria-selected={i === recentIndex}
           aria-label={`第 ${i + 1} 筆近期報讀班別`}
           onClick={() => setRecentIndex(i)}
           className={cn(
            "h-2.5 w-2.5 rounded-full transition-colors",
            i === recentIndex ? "bg-white" : "bg-white/40 hover:bg-white/70"
           )}
          />
         ))}
        </div>
       ) : null}
      </div>
     ) : null}
    </>
   ) : null}

   <div className="space-y-2">
    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">注冊狀態</div>
    <div className="flex flex-wrap gap-2">
     {REGISTRATION_FILTERS.map((f) => {
      const count = f.key === "all" ? rows.length : (classificationCounts.registration.get(f.key) ?? 0)
      const active = registrationKey === f.key
      return (
       <button
        key={f.key}
        type="button"
        onClick={() => setRegistrationKey(f.key)}
        className={cn(
         "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
         active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-muted/80"
        )}
       >
        {f.label}
        {f.key !== "all" ? ` (${count})` : ` (${count})`}
       </button>
      )
     })}
    </div>
   </div>

   <div className="space-y-2">
    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">在讀狀態</div>
    <div className="flex flex-wrap gap-2">
     {ENROLLMENT_FILTERS.map((f) => {
      const count = f.key === "all" ? rows.length : (classificationCounts.enrollment.get(f.key) ?? 0)
      const active = enrollmentKey === f.key
      return (
       <button
        key={f.key}
        type="button"
        onClick={() => setEnrollmentKey(f.key)}
        className={cn(
         "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
         active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-muted/80"
        )}
       >
        {f.label}
        {f.key !== "all" ? ` (${count})` : ` (${count})`}
       </button>
      )
     })}
    </div>
   </div>

   <div className="space-y-2">
    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">活躍狀態（近三個月）</div>
    <div className="flex flex-wrap gap-2">
     {ACTIVITY_FILTERS.map((f) => {
      const count = f.key === "all" ? rows.length : (classificationCounts.activity.get(f.key) ?? 0)
      const active = activityKey === f.key
      return (
       <button
        key={f.key}
        type="button"
        onClick={() => setActivityKey(f.key)}
        className={cn(
         "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
         active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-muted/80"
        )}
       >
        {f.label}
        {f.key !== "all" ? ` (${count})` : ` (${count})`}
       </button>
      )
     })}
    </div>
   </div>

   <div className="space-y-2">
    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">學業階段</div>
    <div className="flex flex-wrap gap-2">
     {STAGE_FILTERS.map((f) => {
      const count = f.key === "all" ? rows.length : (classificationCounts.stage.get(f.key) ?? 0)
      const active = stageKey === f.key
      return (
       <button
        key={f.key}
        type="button"
        onClick={() => setStageKey(f.key)}
        className={cn(
         "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
         active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-muted/80"
        )}
       >
        {f.label}
        {f.key !== "all" ? ` (${count})` : ` (${count})`}
       </button>
      )
     })}
     <button
      type="button"
      onClick={() => setShowGraduated((v) => !v)}
      className={cn(
       "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
       showGraduated
        ? "border-border bg-card text-foreground hover:bg-muted/80"
        : "border-primary bg-primary text-primary-foreground"
      )}
      title={showGraduated ? "目前同時顯示已畢業生" : "目前不顯示已畢業生"}
     >
      {showGraduated ? "顯示已畢業生：開" : "顯示已畢業生：關"}
     </button>
    </div>
   </div>

   <div className="space-y-2">
    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">年級</div>
    <div className="flex flex-wrap gap-2">
     {GRADE_FILTERS.map((f) => {
      const active = gradeKey === f.key
      return (
       <button
        key={f.key}
        type="button"
        onClick={() => setGradeKey(f.key)}
        className={cn(
         "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
         active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-muted/80"
        )}
       >
        {f.label}
       </button>
      )
     })}
    </div>
   </div>
  </>
 )

 return (
  <div className="space-y-5 py-4 md:p-6">
   {!isSupabaseConfigured ? (
    <div role="alert" className="rounded-lg border border-warning/50 bg-warning/10 px-3 py-2 text-sm text-warning">
     請設定純文字 <code className="rounded bg-muted px-1">.env</code> 後重啟 dev，才能載入學生。
    </div>
   ) : null}
   {err ? (
    <div
     role="alert"
     tabIndex={-1}
     className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
    >
     {err}
    </div>
   ) : null}

   <div className="flex flex-wrap items-center gap-3">
    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
     <GraduationCap className="h-7 w-7 shrink-0 text-primary" aria-hidden />
     學生管理
    </h1>
   <Tag tone="info">{loading ? "…" : `${stats.total} 人`}</Tag>
   </div>

   {isMobile ? (
    <MobileFilterSheet
     open={filtersOpen}
     onClose={() => setFiltersOpen(false)}
     title="篩選學生"
     activeCount={activeFilterCount}
     onReset={resetFilters}
    >
     {renderFilterPanel()}
    </MobileFilterSheet>
   ) : (
    renderFilterPanel()
   )}

   <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
    {isMobile ? (
     <Button type="button" variant="outline" className="gap-2" onClick={() => setFiltersOpen(true)}>
      <SlidersHorizontal className="h-4 w-4" aria-hidden />
      篩選
      {activeFilterCount > 0 ? (
       <Tag tone="info" size="sm">
        {activeFilterCount}
       </Tag>
      ) : null}
     </Button>
    ) : null}
    <div className="relative flex-1">
     <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
     <Input
      className="pl-9"
      placeholder="搜尋姓名 / 學號 / 學生電話 / 家長電話…"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
     />
    </div>
    <div className="flex flex-wrap gap-2">
     <div className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5">
      <button
       type="button"
       onClick={() => setViewMode("table")}
       className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
        viewMode === "table"
         ? "bg-primary text-primary-foreground shadow-sm"
         : "text-muted-foreground hover:text-foreground"
       )}
      >
       <List className="h-4 w-4" />
       列表
      </button>
      <button
       type="button"
       onClick={() => setViewMode("gallery")}
       className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
        viewMode === "gallery"
         ? "bg-primary text-primary-foreground shadow-sm"
         : "text-muted-foreground hover:text-foreground"
       )}
      >
       <LayoutGrid className="h-4 w-4" />
       圖庫
      </button>
     </div>
     <Button type="button" variant="outline" onClick={exportCsv}>
      <Sheet className="h-4 w-4" />
      匯出 CSV
     </Button>
     <Dialog
      open={addOpen}
      onOpenChange={(open) => {
       if (open && addSaving) return
       setAddOpen(open)
       setAddErr(null)
       if (open) {
        setAddForm({ ...emptyAddForm(), student_code: nextStudentCode(rows) })
        setSchoolSearch("")
       } else {
        setAddForm(emptyAddForm())
        setSchoolSearch("")
       }
      }}
     >
      <DialogTrigger asChild>
       <Button type="button">
        <Plus className="h-4 w-4" />
        新增學生
       </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
       <DialogHeader>
        <DialogTitle>新增學生</DialogTitle>
       </DialogHeader>
       <p className="text-sm text-muted-foreground">
        新增僅建立學生基本資料，不包含報讀班別；完成後請到學生詳細頁「報讀班別」分頁再新增班別。
       </p>
       {addErr ? (
        <div
         role="alert"
         className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
         {addErr}
        </div>
       ) : null}
       <div className="space-y-6">
        <section className="space-y-4">
         <h3 className="text-sm font-semibold text-foreground">基本資料</h3>
         <div className="grid gap-4 sm:grid-cols-2">
          <Field label="中文姓名 *">
           <Input
            value={addForm.full_name ?? ""}
            onChange={(e) => setAddForm((f) => ({ ...f, full_name: e.target.value }))}
           />
          </Field>
          <Field label="英文姓名">
           <Input
            value={addForm.english_name ?? ""}
            onChange={(e) => setAddForm((f) => ({ ...f, english_name: e.target.value }))}
           />
          </Field>
          <Field label="學生編號">
           <Input
            value={addForm.student_code ?? ""}
            readOnly
            className="bg-muted/30"
            placeholder="系統自動生成"
           />
          </Field>
          <Field label="性別">
           <ChoiceChips
            options={GENDER_CHIPS}
            value={addForm.gender ?? ""}
            onChange={(gender) => setAddForm((f) => ({ ...f, gender }))}
           />
          </Field>
          <Field label="年級">
           <StudentGradeChips
            value={addForm.grade}
            onChange={(grade) => setAddForm((f) => ({ ...f, grade }))}
           />
          </Field>
          <Field label="注冊狀態">
           <StatusToggle
            checked={(addForm.registration_status ?? "已註冊") === "已註冊"}
            onCheckedChange={(on) =>
             setAddForm((f) => ({ ...f, registration_status: on ? "已註冊" : "非注冊" }))
            }
            offLabel="非注冊（試堂／查詢）"
            onLabel="注冊"
           />
          </Field>
          <Field label="學業階段">
           <StatusToggle
            checked={(addForm.academic_stage ?? "中學階段") === "中學階段"}
            onCheckedChange={(on) =>
             setAddForm((f) => ({ ...f, academic_stage: on ? "中學階段" : "已畢業" }))
            }
            offLabel="已畢業"
            onLabel="中學階段"
           />
          </Field>
          <p className="sm:col-span-2 text-xs text-muted-foreground">
           「在讀／非在讀」與「活躍生／非活躍生」會依報讀班別自動計算，無需手動設定。
          </p>
          <Field label="學校" className="sm:col-span-2">
           <div className="space-y-2">
            <Input
             value={schoolSearch}
             onChange={(e) => setSchoolSearch(e.target.value)}
             placeholder="搜尋學校…"
            />
            <Select
             className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
             value={addForm.school ?? ""}
             onChange={(e) => setAddForm((f) => ({ ...f, school: e.target.value }))}
            >
             <option value="">請選擇學校</option>
             {schoolFiltered.map((s) => (
              <option key={s} value={s}>
               {s}
              </option>
             ))}
            </Select>
           </div>
          </Field>
          <Field label="出生日期">
           <Input
            type="date"
            value={(addForm.date_of_birth ?? "").slice(0, 10)}
            onChange={(e) => setAddForm((f) => ({ ...f, date_of_birth: e.target.value }))}
           />
          </Field>
         </div>
        </section>

        <section className="space-y-4">
         <h3 className="text-sm font-semibold text-foreground">家長聯絡</h3>
         <div className="grid gap-4 sm:grid-cols-2">
          <Field label="家長姓名">
           <Input
            value={addForm.parent_name ?? ""}
            onChange={(e) => setAddForm((f) => ({ ...f, parent_name: e.target.value }))}
           />
          </Field>
          <Field label="關係">
           <ParentRelationshipChips
            value={addForm.parent_relationship}
            onChange={(rel) => setAddForm((f) => ({ ...f, parent_relationship: rel }))}
           />
          </Field>
          <Field label="學生電話">
           <div className="space-y-2">
            <ChoiceChips
             options={PHONE_COUNTRY_CODES}
             value={addForm.student_phone_country_code ?? "+852"}
             onChange={(code) => setAddForm((f) => ({ ...f, student_phone_country_code: code }))}
            />
            <Input
             inputMode="numeric"
             value={addForm.student_phone ?? ""}
             onChange={(e) => setAddForm((f) => ({ ...f, student_phone: e.target.value }))}
            />
           </div>
          </Field>
          <Field label="家長電話">
           <div className="space-y-2">
            <ChoiceChips
             options={PHONE_COUNTRY_CODES}
             value={addForm.parent_phone_country_code ?? "+852"}
             onChange={(code) => setAddForm((f) => ({ ...f, parent_phone_country_code: code }))}
            />
            <Input
             inputMode="numeric"
             value={addForm.parent_phone ?? ""}
             onChange={(e) => setAddForm((f) => ({ ...f, parent_phone: e.target.value }))}
            />
           </div>
          </Field>
          <Field label="WhatsApp 號碼">
           <Input
            inputMode="numeric"
            value={addForm.whatsapp ?? ""}
            onChange={(e) => setAddForm((f) => ({ ...f, whatsapp: e.target.value }))}
           />
          </Field>
          <Field label="偏好通訊方式">
           <ChoiceChips
            options={PREFERRED_CONTACT_METHODS}
            value={addForm.preferred_contact_method ?? ""}
            onChange={(m) => setAddForm((f) => ({ ...f, preferred_contact_method: m }))}
           />
          </Field>
          <Field label="地址" className="sm:col-span-2">
           <Input
            value={addForm.address ?? ""}
            onChange={(e) => setAddForm((f) => ({ ...f, address: e.target.value }))}
           />
          </Field>
          <Field label="備註" className="sm:col-span-2">
           <Textarea
            value={addForm.remarks ?? ""}
            onChange={(e) => setAddForm((f) => ({ ...f, remarks: e.target.value }))}
            rows={3}
           />
          </Field>
         </div>
        </section>

        <div className="flex justify-end gap-2">
         <Button
          type="button"
          variant="outline"
          disabled={addSaving}
          onClick={() => setAddOpen(false)}
         >
          取消
         </Button>
         <Button
          type="button"
          onClick={() => void onAddStudent()}
          disabled={addSaving || !(addForm.full_name ?? "").trim()}
         >
          {addSaving ? "建立中…" : "建立"}
         </Button>
        </div>
       </div>
      </DialogContent>
     </Dialog>
    </div>
   </div>

   {viewMode === "table" ? (
   <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
    <div className="overflow-x-auto">
     <table className="w-full min-w-[62rem] table-fixed border-collapse text-sm">
      <thead>
       <tr className="border-b border-border bg-muted/50 text-left">
        <th className="w-[9%] px-3 py-3 font-medium text-muted-foreground">學號</th>
        <th className="w-[14%] px-3 py-3 font-medium text-muted-foreground">姓名</th>
        <th className="w-[6%] px-3 py-3 font-medium text-muted-foreground">年級</th>
        <th className="w-[12%] px-3 py-3 font-medium text-muted-foreground">學生電話</th>
        <th className="w-[12%] px-3 py-3 font-medium text-muted-foreground">家長電話</th>
        <th className="w-[20%] px-3 py-3 font-medium text-muted-foreground">報讀班別</th>
        <th className="w-[18%] px-3 py-3 font-medium text-muted-foreground">狀態</th>
        <th className="w-[7%] px-3 py-3 font-medium text-muted-foreground">學費</th>
        <th className="w-[12%] px-3 py-3 font-medium text-muted-foreground">操作</th>
       </tr>
      </thead>
      <tbody>
       {loading ? (
        <tr>
         <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
          載入中…
         </td>
        </tr>
       ) : filtered.length === 0 ? (
        <tr>
         <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
          沒有符合條件的學生
         </td>
        </tr>
       ) : (
        filtered.map((r, idx) => {
         const t = tuitionMap.get(r.id)
         const waContact = pickStudentContactRaw({
          whatsapp: r.whatsapp,
          student_phone: r.student_phone,
          parent_phone: r.parent_phone,
         })
         const studentWaPhone = r.student_phone?.trim() || null
         return (
          <tr
           key={r.id}
           onClick={() => navigate(`/Students/${r.id}`)}
           className={cn(
            "cursor-pointer border-b border-border transition-colors hover:bg-muted/60",
            idx % 2 === 1 ? "bg-muted/20" : ""
           )}
          >
           <td className="align-top px-3 py-3 text-muted-foreground">
            <span className="block truncate tabular-nums" title={r.student_code ?? undefined}>
             {r.student_code || "—"}
            </span>
           </td>
           <td className="min-w-0 align-top px-3 py-3">
            <div className="break-words font-medium text-foreground">{r.full_name}</div>
            {r.english_name ? (
             <div className="break-words text-xs text-muted-foreground">{r.english_name}</div>
            ) : null}
           </td>
           <td className="align-top px-3 py-3">{formatStudentGrade(r.grade)}</td>
           <td className="min-w-0 align-top px-3 py-3">
            <div className="flex min-w-0 items-center gap-1.5">
             <span className="min-w-0 truncate tabular-nums" title={r.student_phone ?? undefined}>
              {r.student_phone ?? "—"}
             </span>
             {studentWaPhone ? (
              <Button
               type="button"
               variant="ghost"
               size="icon"
              className="h-8 w-8 shrink-0 text-success hover:bg-success hover:text-success-foreground"
               title="以 WhatsApp 聯絡學生電話"
               aria-label="開啟學生電話 WhatsApp"
               onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                openWhatsAppChat(studentWaPhone)
               }}
              >
               <MessageCircle className="h-4 w-4" aria-hidden />
              </Button>
             ) : null}
            </div>
           </td>
           <td className="min-w-0 align-top px-3 py-3">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="min-w-0 truncate tabular-nums" title={r.parent_phone ?? undefined}>
               {r.parent_phone ?? "—"}
              </span>
             {waContact ? (
              <Button
               type="button"
               variant="ghost"
               size="icon"
              className="h-8 w-8 shrink-0 text-success hover:bg-success hover:text-success-foreground"
               title="以 WhatsApp 聯絡（優先 WhatsApp 欄，其次家長電話）"
               aria-label="開啟 WhatsApp"
               onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                openWhatsAppChat(waContact)
               }}
              >
               <MessageCircle className="h-4 w-4" aria-hidden />
              </Button>
             ) : null}
            </div>
           </td>
           <td className="min-w-0 align-top px-3 py-3">
            <div className="flex flex-wrap gap-1 break-words">
             {(tags.get(r.id) ?? []).map((sub) => (
              <Tag key={sub} tone="info" size="sm">{sub}</Tag>
             ))}
             {(tags.get(r.id) ?? []).length === 0 ? (
              <span className="text-xs text-muted-foreground">—</span>
             ) : null}
            </div>
           </td>
           <td className="min-w-0 align-top px-3 py-3">
            <StudentClassificationTags student={r} size="sm" compact />
           </td>
           <td className="align-top px-3 py-3">
            {t?.showArrears ? (
             <Tag
              tone="warning"
              size="sm"
              title={`計費出席 ${t.attendedLessons} 堂 · 已繳費 ${t.paidLessons} 堂（「已收款」收據之堂數加總）`}
             >
              追收學費
             </Tag>
            ) : (
             <span className="text-xs text-muted-foreground">—</span>
            )}
           </td>
           <td className="align-top px-3 py-3">
            <Link
             to={`/Students/${r.id}`}
             className="text-primary hover:underline"
             onClick={(e) => e.stopPropagation()}
            >
             編輯
            </Link>
            {isSuperAdmin() ? (
             <>
              <span className="mx-2 text-muted-foreground">|</span>
              <button
               type="button"
               className="text-amber-700 hover:underline"
               onClick={(e) => void onDelete(e, r.id)}
              >
               刪除
              </button>
             </>
            ) : null}
           </td>
          </tr>
         )
        })
       )}
      </tbody>
     </table>
    </div>
   </div>
   ) : (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
     {loading ? (
      <div className="col-span-full rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
       載入中…
      </div>
     ) : filtered.length === 0 ? (
      <div className="col-span-full rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
       沒有符合條件的學生
      </div>
     ) : (
      filtered.map((r) => {
       const waContact = pickStudentContactRaw({
        whatsapp: r.whatsapp,
        student_phone: r.student_phone,
        parent_phone: r.parent_phone,
       })
       const t = tuitionMap.get(r.id)
       return (
        <article
         key={r.id}
         role="button"
         tabIndex={0}
         onClick={() => navigate(`/Students/${r.id}`)}
         onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
           e.preventDefault()
           navigate(`/Students/${r.id}`)
          }
         }}
         className="flex cursor-pointer flex-col rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md"
        >
         <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
           <p className="text-xs text-muted-foreground">學號：{r.student_code ?? "—"}</p>
           <h3 className="truncate text-lg font-semibold">{r.full_name}</h3>
           {r.english_name ? <p className="truncate text-sm text-muted-foreground">{r.english_name}</p> : null}
          </div>
          <StudentClassificationTags student={r} size="sm" compact className="max-w-[11rem] justify-end" />
         </div>
         <div className="mt-3 space-y-1 text-sm text-muted-foreground">
          <p>年級：{formatStudentGrade(r.grade)}</p>
          <p>學校：{r.school ?? "—"}</p>
          <p className="tabular-nums">學生電話：{r.student_phone ?? "—"}</p>
          <p className="tabular-nums">家長電話：{r.parent_phone ?? "—"}</p>
         </div>
         <div className="mt-3 flex flex-wrap gap-1">
          {(tags.get(r.id) ?? []).slice(0, 4).map((sub) => (
           <Tag key={sub} tone="info" size="sm">{sub}</Tag>
          ))}
         </div>
         <div className="mt-4 flex items-center justify-between">
          <Link
           to={`/Students/${r.id}`}
           className="text-sm font-medium text-primary hover:underline"
           onClick={(e) => e.stopPropagation()}
          >
           查看詳細
          </Link>
          <div className="flex items-center gap-2">
           {t?.showArrears ? (
            <Tag tone="warning" size="sm">
             追收學費
            </Tag>
           ) : null}
           {waContact ? (
            <Button
             type="button"
             variant="ghost"
             size="icon"
            className="h-8 w-8 text-success hover:bg-success hover:text-success-foreground"
             title="開啟 WhatsApp"
             aria-label="開啟 WhatsApp"
             onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              openWhatsAppChat(waContact)
             }}
            >
             <MessageCircle className="h-4 w-4" aria-hidden />
            </Button>
           ) : null}
          </div>
         </div>
        </article>
       )
      })
     )}
    </div>
   )}

   <p className="text-xs text-muted-foreground">
    點選表格列可進入該學生的詳細資料（第二級頁面）。
    <span className="mt-1 block text-[11px] leading-relaxed">
     「追收學費」：計費出席堂數（點名為出席、網課／線上、補堂等；不含缺席與請假）≥
     已繳費堂數（僅計收據狀態為「已收款」之 <code className="rounded bg-muted px-0.5">payment_details.lesson_count</code>{" "}
     加總），且兩者不全為 0。
    </span>
   </p>
  </div>
 )
}

function Field({
 label,
 children,
 className,
}: {
 label: string
 children: React.ReactNode
 className?: string
}) {
 return (
  <div className={cn("space-y-1", className)}>
   <label className="text-xs font-medium text-muted-foreground">{label}</label>
   {children}
  </div>
 )
}
