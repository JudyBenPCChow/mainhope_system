import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { usePersistentState } from "@/hooks/usePersistentState"
import { ChevronDown, ChevronUp, Columns3, GraduationCap, LayoutGrid, List, MessageCircle, Plus, Search, Sheet, SlidersHorizontal } from "lucide-react"

import {
 AdminPageHeading,
 adminPageHeaderLayoutClass,
} from "@/components/detail/AdminPageHeader"
import { MobileFilterSheet } from "@/components/mobile/MobileFilterSheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { MOBILE_BREAKPOINT } from "@/lib/layoutBreakpoint"

import { useAuth } from "@/lib/authBootstrap"
import { can } from "@/lib/authzProfile"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { openPrimaryMessagingTarget, resolvePrimaryMessagingTarget } from "@/lib/whatsappReminder"
import { useAppBanner } from "@/lib/appBanner"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import { StudentsListTable } from "@/components/students/StudentsListTable"
import { useOpenStudentRecord, useRecordPreview } from "@/components/recordPreview/recordPreviewContext"
import {
 dropStaleEnrollmentYearTags,
 getStudentsListDataCache,
 isStudentsListCacheFresh,
 patchStudentsListDataCache,
 setStudentsListDataCache,
 studentsListCacheKey,
} from "@/components/students/studentsListState"
import { BulkSelectionBar } from "@/components/list/BulkSelectionBar"
import { StickyListLead, StickyListShell } from "@/components/list/StickyListShell"
import {
 compareStudents,
 countActiveHeaderFilters,
 EMPTY_HEADER_FILTERS,
 mergeVisibleColumns,
 sortLabel,
 studentCodeRank,
 studentMatchesHeaderFilters,
 isStudentListColumnId,
 STUDENT_LIST_COLUMN_LABEL,
 STUDENT_LIST_DATA_COLUMNS,
 type StudentListColumnId,
 type StudentListHeaderFilters,
} from "@/components/students/studentsListColumns"
import { GRADE_FILTER_PRIMARY_KEY, GRADE_FILTERS } from "@/components/students/studentsListFilters"
import { CollapsibleFilterCard } from "@/components/ui/collapsible-filter-card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { SkeletonCardGrid } from "@/components/ui/skeleton"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
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
import { confirmCreateGraduatedStudent, logCreateGraduatedStudent } from "@/lib/graduationGuard"
import { SchoolSearchableSelect } from "@/components/students/SchoolSearchableSelect"
import { ChoiceChips, GENDER_CHIPS, ParentRelationshipChips, StatusToggle, StudentClassificationTags, StudentGradeChips, formatStudentGrade } from "@/components/students/studentsUi"
import { isPrimaryStudentGrade, normalizeStudentGrade } from "@/lib/studentGrade"
import {
 deleteStudent,
 fetchEnrollmentSubjectsByStudentIds,
 fetchRecentClassEnrollments,
 fetchStudentsForOpsList,
 allocateNextStudentCode,
 insertStudent,
 isUniqueViolation,
 normalizeRegistrationStatus,
 normalizeEnrollmentStatus,
 normalizeActivityStatus,
 normalizeAcademicStage,
 PHONE_COUNTRY_CODES,
 PREFERRED_CONTACT_METHODS,
 PRIMARY_CONTACT_PERSONS,
 type RecentClassEnrollment,
 type StudentRecord,
} from "@/services/studentQueries"
import { usesSharedAppShell } from "@/lib/mgmtRole"

const REGISTRATION_FILTERS = [
 { key: "all", label: "全部" },
 { key: "已註冊", label: "註冊" },
 { key: "非注冊", label: "非註冊" },
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


/** 「近期報讀」輪播最多顯示的學生數 */
const RECENT_ENROLL_LIMIT = 5
/** 「近期報讀」自動輪播間隔（毫秒） */
const RECENT_ENROLL_ROTATE_MS = 5000

function monthStartIso(): string {
 const d = new Date()
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`
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
  student_preferred_contact_method: "",
  parent_preferred_contact_method: "",
  student_wechat_id: "",
  parent_wechat_id: "",
  primary_contact_person: "",
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
 const { pushBanner } = useAppBanner()
 const { profile, role } = useAuth()
 const canDeleteStudent = can(profile?.activeCapabilities, "students.update")
 const openStudent = useOpenStudentRecord()
 const { preview } = useRecordPreview()
 const previewStudentId = preview?.kind === "student" ? preview.id : null
 const [searchParams, setSearchParams] = useSearchParams()
 const isMobile = useIsMobile()
 const listScope: "active" | "roster" = searchParams.get("scope") === "roster" ? "roster" : "active"
 const isActiveScope = listScope === "active"
 const [filtersOpen, setFiltersOpen] = useState(false)
 const initialCache = useMemo(() => {
  const cached = getStudentsListDataCache()
  if (!cached) return null
  const year = studentsListCacheKey({
   isActiveScope: cached.key.isActiveScope,
   showGraduated: cached.key.showGraduated,
  }).enrollmentYear
  const next = dropStaleEnrollmentYearTags(cached, year)
  if (next !== cached) patchStudentsListDataCache(() => next)
  return next
 }, [])
 const [rows, setRows] = useState<StudentRecord[]>(() => initialCache?.rows ?? [])
 const [tags, setTags] = useState<Map<string, string[]>>(() => initialCache?.tags ?? new Map())
 const [recentEnrollments, setRecentEnrollments] = useState<RecentClassEnrollment[]>(
  () => initialCache?.recentEnrollments ?? []
 )
 const [loading, setLoading] = useState(() => initialCache == null)
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
 const [sortKey, setSortKey] = usePersistentState<StudentListColumnId>(
  "mgmt_students_sortKey",
  "student_code"
 )
 const [sortDir, setSortDir] = usePersistentState<"asc" | "desc">("mgmt_students_sortDir", "desc")
 const [visibleStored, setVisibleStored] = usePersistentState<
  Partial<Record<StudentListColumnId, boolean>>
 >("mgmt_students_visibleColumns", {})
 const [headerFiltersStored, setHeaderFilters] = usePersistentState<StudentListHeaderFilters>(
  "mgmt_students_headerFilters",
  EMPTY_HEADER_FILTERS
 )
 const headerFilters = useMemo(
  () => ({ ...EMPTY_HEADER_FILTERS, ...headerFiltersStored }),
  [headerFiltersStored]
 )
 const [selectedIds, setSelectedIds] = useState<string[]>([])
 const [columnsOpen, setColumnsOpen] = useState(false)
 const [bulkSaving, setBulkSaving] = useState(false)
 const [viewMode, setViewMode] = usePersistentState<"table" | "gallery">(
  "mgmt_students_viewMode",
  getInitialStudentsViewMode()
 )
 const [showGraduated, setShowGraduated] = usePersistentState<boolean>("mgmt_students_showGraduated", false)
 const [hiddenGraduatedCount, setHiddenGraduatedCount] = useState(
  () => initialCache?.hiddenGraduatedCount ?? 0
 )
 const [dashboardCollapsed, setDashboardCollapsed] = useState(isMobile)
 const [recentIndex, setRecentIndex] = useState(0)
 const [search, setSearch] = usePersistentState<string>("mgmt_students_search", "")
 const [addOpen, setAddOpen] = useState(false)
 const [addForm, setAddForm] = useState<Partial<StudentRecord>>(emptyAddForm())
 const [addErr, setAddErr] = useState<string | null>(null)
 const [addSaving, setAddSaving] = useState(false)

 const setListScope = (next: "active" | "roster") => {
  setSearchParams(
   (prev) => {
    const nextParams = new URLSearchParams(prev)
    if (next === "roster") nextParams.set("scope", "roster")
    else nextParams.delete("scope")
    return nextParams
   },
   { replace: true }
  )
  if (next === "active") {
   setActivityKey("all")
   if (stageKey === "已畢業") setStageKey("all")
  } else {
   setViewMode("table")
  }
 }

 const load = useCallback(async (opts?: { silent?: boolean }) => {
  const cached = getStudentsListDataCache()
  const key = studentsListCacheKey({ isActiveScope, showGraduated })
  const reuseTags = cached?.key.enrollmentYear === key.enrollmentYear
  const skipSpinner = Boolean(opts?.silent || cached)
  if (!skipSpinner) setLoading(true)
  setErr(null)
  try {
   const { students: list, hiddenGraduatedCount: hidden } = await fetchStudentsForOpsList({
    includeGraduated: !isActiveScope && showGraduated,
    activityStatus: isActiveScope ? "活躍生" : undefined,
   })
   const hiddenCount = isActiveScope ? 0 : hidden
   setRows(list)
   setHiddenGraduatedCount(hiddenCount)
   if (!reuseTags) setTags(new Map())
   const recentEnr = await fetchRecentClassEnrollments(RECENT_ENROLL_LIMIT)
   setRecentEnrollments(recentEnr)
   setStudentsListDataCache({
    key,
    rows: list,
    tags: reuseTags ? (cached?.tags ?? new Map()) : new Map(),
    recentEnrollments: recentEnr,
    hiddenGraduatedCount: hiddenCount,
   })
  } catch (e) {
   reportUserFacingError(e, { source: "StudentsListPage.load", setErr })
  } finally {
   setLoading(false)
  }
 }, [isActiveScope, showGraduated])

 useEffect(() => {
  const key = studentsListCacheKey({ isActiveScope, showGraduated })
  if (isStudentsListCacheFresh(key)) return
  const cached = getStudentsListDataCache()
  const keyChanged =
   cached != null &&
   (cached.key.isActiveScope !== isActiveScope ||
    cached.key.showGraduated !== showGraduated ||
    cached.key.enrollmentYear !== key.enrollmentYear)
  void load({ silent: cached != null && !keyChanged })
 }, [isActiveScope, showGraduated, load])

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

 const visibleColumns = useMemo(() => mergeVisibleColumns(visibleStored), [visibleStored])

 const scoped = useMemo(() => {
  let list = rows
  if (registrationKey !== "all") {
   list = list.filter((r) => normalizeRegistrationStatus(r.registration_status) === registrationKey)
  }
  if (enrollmentKey !== "all") {
   list = list.filter((r) => normalizeEnrollmentStatus(r.enrollment_status) === enrollmentKey)
  }
  if (!isActiveScope && activityKey !== "all") {
   list = list.filter((r) => normalizeActivityStatus(r.activity_status) === activityKey)
  }
  if (!isActiveScope && stageKey !== "all") {
   list = list.filter((r) => normalizeAcademicStage(r.academic_stage) === stageKey)
  }
  if (!isActiveScope && !showGraduated) {
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
  return list
 }, [
  rows,
  registrationKey,
  enrollmentKey,
  activityKey,
  stageKey,
  showGraduated,
  gradeKey,
  search,
  isActiveScope,
 ])

 const filtered = useMemo(() => {
  const list = scoped.filter((r) => studentMatchesHeaderFilters(r, headerFilters, tags))
  return [...list].sort((a, b) => compareStudents(a, b, sortKey, sortDir, tags))
 }, [scoped, headerFilters, sortKey, sortDir, tags])

 const taggedIdKey = useMemo(() => [...tags.keys()].sort().join(","), [tags])

 useEffect(() => {
  if (!isActiveScope) setViewMode("table")
 }, [isActiveScope, setViewMode])

 useEffect(() => {
  const have = new Set(taggedIdKey ? taggedIdKey.split(",") : [])
  const missing = filtered.map((r) => r.id).filter((id) => !have.has(id))
  if (missing.length === 0) return
  let cancelled = false
  void fetchEnrollmentSubjectsByStudentIds(missing).then((tagMap) => {
   if (cancelled) return
   setTags((prev) => {
    const next = new Map(prev)
    for (const id of missing) {
     if (!next.has(id)) next.set(id, tagMap.get(id) ?? [])
    }
    patchStudentsListDataCache((c) => ({ ...c, tags: next }))
    return next
   })
  })
  return () => {
   cancelled = true
  }
 }, [filtered, taggedIdKey])

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
  if (!isActiveScope && activityKey !== "all") count++
  if (!isActiveScope && stageKey !== "all") count++
  if (gradeKey !== "all") count++
  if (!isActiveScope && showGraduated) count++
  count += countActiveHeaderFilters(headerFilters)
  return count
 }, [
  registrationKey,
  enrollmentKey,
  activityKey,
  stageKey,
  gradeKey,
  showGraduated,
  headerFilters,
  isActiveScope,
 ])

 const resetFilters = () => {
  setRegistrationKey("all")
  setEnrollmentKey("all")
  setActivityKey("all")
  setStageKey("all")
  setGradeKey("all")
  setShowGraduated(false)
  setHeaderFilters(EMPTY_HEADER_FILTERS)
 }

 const selectedRows = useMemo(
  () => filtered.filter((r) => selectedIds.includes(r.id)),
  [filtered, selectedIds]
 )

 useEffect(() => {
  const allowed = new Set(filtered.map((r) => r.id))
  setSelectedIds((prev) => {
   const next = prev.filter((id) => allowed.has(id))
   return next.length === prev.length ? prev : next
  })
 }, [filtered])

 const toggleSelect = (id: string) => {
  setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
 }

 const toggleSelectAllFiltered = () => {
  if (filtered.length > 0 && filtered.every((r) => selectedIds.includes(r.id))) {
   setSelectedIds([])
   return
  }
  setSelectedIds(filtered.map((r) => r.id))
 }

 const toggleSort = (key: StudentListColumnId) => {
  if (sortKey === key) {
   setSortDir((d) => (d === "asc" ? "desc" : "asc"))
   return
  }
  setSortKey(key)
  setSortDir(key === "student_code" || key === "created_at" ? "desc" : "asc")
 }

 const toggleColumnVisible = (id: StudentListColumnId) => {
  if (id === "name") return
  setVisibleStored((prev) => ({ ...mergeVisibleColumns(prev), [id]: !visibleColumns[id] }))
 }

 const exportCsv = (target = filtered) => {
  const blob = new Blob([formatCsv(target)], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
 }

 const copySelectedParentPhones = async () => {
  const lines = selectedRows
   .map((r) => {
    const phone = (r.parent_phone ?? "").trim()
    return phone ? `${r.full_name}\t${phone}` : null
   })
   .filter((x): x is string => Boolean(x))
  if (lines.length === 0) {
   pushBanner({ tone: "warning", title: "已選學生沒有家長電話" })
   return
  }
  try {
   await navigator.clipboard.writeText(lines.join("\n"))
   pushBanner({ tone: "success", title: `已複製 ${lines.length} 個家長電話` })
  } catch (e) {
   reportUserFacingError(e, {
    source: "StudentsListPage.copySelectedParentPhones",
    setErr,
    userMessage: formatUnknownError(e),
   })
  }
 }

 const onBulkDelete = async () => {
  if (bulkSaving || selectedRows.length === 0) return
  const n = selectedRows.length
  const ok = await confirmDialog({
   title: `刪除 ${n} 名學生`,
   description: "將一併刪除關聯選課等資料（若資料庫設為 cascade）。此操作不可還原。",
   confirmText: "確認刪除",
   tone: "destructive",
   confirmInput: { label: "請輸入「刪除」以確認", expected: "刪除" },
  })
  if (!ok) return
  setBulkSaving(true)
  try {
   const failures: string[] = []
   for (const r of selectedRows) {
    try {
     await deleteStudent(r.id)
    } catch (e) {
     failures.push(`${r.full_name}：${formatUnknownError(e)}`)
    }
   }
   setSelectedIds([])
   await load()
   if (failures.length > 0) {
    const msg = `已刪除 ${n - failures.length} 人，${failures.length} 人失敗。${failures[0]}`
    reportUserFacingError(new Error(msg), {
     source: "StudentsListPage.onBulkDelete",
     setErr,
     userMessage: msg,
    })
   } else {
    pushBanner({ tone: "success", title: `已刪除 ${n} 名學生` })
   }
  } finally {
   setBulkSaving(false)
  }
 }

 const emptyListHint = isActiveScope
  ? "活躍名單沒有符合條件的學生"
  : activityKey !== "all"
    ? "沒有符合條件的學生。活躍狀態包含在讀，以及近三個月曾報讀或退讀的學生。"
    : "沒有符合條件的學生"

 const goRosterWithSearch = () => {
  setListScope("roster")
 }

 const includeGraduatedOnRoster = () => {
  if (isActiveScope) setListScope("roster")
  setShowGraduated(true)
 }

 const renderEmptyState = () => {
  const q = search.trim()
  const hasFilters = activeFilterCount > 0
  return (
   <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
    <p>{emptyListHint}</p>
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
     {q && isActiveScope ? (
      <Button type="button" onClick={goRosterWithSearch}>
       在學生名冊搜尋「{q}」
      </Button>
     ) : null}
     {q && !isActiveScope && !showGraduated ? (
      <Button type="button" variant="outline" onClick={includeGraduatedOnRoster}>
       包含已畢業生
      </Button>
     ) : null}
     {hasFilters ? (
      <Button type="button" variant="outline" onClick={resetFilters}>
       重設篩選
      </Button>
     ) : null}
    </div>
   </div>
  )
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
  if (!isValidBirthDate(addForm.date_of_birth)) {
   setAddErr("出生日期不可為未來日期")
   return
  }

  if (addForm.academic_stage === "已畢業") {
   const ok = await confirmCreateGraduatedStudent(confirmDialog, {
    studentName: fullName,
   })
   if (!ok) return
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
   student_preferred_contact_method:
    addForm.student_preferred_contact_method === "WeChat" ||
    addForm.student_preferred_contact_method === "WhatsApp"
     ? addForm.student_preferred_contact_method
     : null,
   parent_preferred_contact_method:
    addForm.parent_preferred_contact_method === "WeChat" ||
    addForm.parent_preferred_contact_method === "WhatsApp"
     ? addForm.parent_preferred_contact_method
     : null,
   student_wechat_id:
    addForm.student_preferred_contact_method === "WeChat"
     ? (addForm.student_wechat_id ?? "").trim() || null
     : null,
   parent_wechat_id:
    addForm.parent_preferred_contact_method === "WeChat"
     ? (addForm.parent_wechat_id ?? "").trim() || null
     : null,
   primary_contact_person:
    addForm.primary_contact_person === "學生" || addForm.primary_contact_person === "家長"
     ? addForm.primary_contact_person
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
     await insertStudent({ ...payload, student_code: await allocateNextStudentCode() })
    } else {
     throw e
    }
   }
   if (payload.academic_stage === "已畢業") {
    logCreateGraduatedStudent({
     studentName: fullName,
     source: "StudentsListPage.onAddStudent",
    })
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

 const extraSchools = useMemo(
  () => rows.map((r) => (r.school ?? "").trim()).filter(Boolean),
  [rows]
 )

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

 const renderStudentFilterChips = () => (
  <>
   <div className="space-y-2">
    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
     註冊狀態
     <span
      className="ml-1 font-normal normal-case text-muted-foreground/80"
      title="已註冊＝正式學生；非註冊＝試堂／查詢等尚未註冊"
     >
      （？）
     </span>
    </div>
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
    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
     在讀狀態
     <span
      className="ml-1 font-normal normal-case text-muted-foreground/80"
      title="目前至少有一個就讀中的報讀"
     >
      （？）
     </span>
    </div>
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

   {!isActiveScope ? (
   <div className="space-y-2">
    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
     活躍狀態
     <span
      className="ml-1 font-normal normal-case text-muted-foreground/80"
      title="在讀，或近三個月曾報讀／退讀；用於找出未續報或暫停一個月的學生"
     >
      （？）
     </span>
    </div>
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
   ) : null}

   {!isActiveScope ? (
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
        onClick={() => {
         if (f.key === "已畢業") setShowGraduated(true)
         setStageKey(f.key)
        }}
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
      onClick={() => {
       setShowGraduated((v) => {
        const next = !v
        if (!next && stageKey === "已畢業") setStageKey("all")
        return next
       })
      }}
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
   ) : null}

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

 const renderFilterPanel = () => (
  <>
   <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
    <div className="flex flex-wrap items-center gap-2">
     <h2 className="text-sm font-semibold tracking-wide">{isMobile ? "統計摘要" : "學生儀表板"}</h2>
     {!isMobile ? (
      <>
       <Tag tone="default" size="sm">目前排序：{sortLabel(sortKey, sortDir)}</Tag>
       <span className="text-xs text-muted-foreground">
        {isActiveScope ? "統計為活躍名單（在讀或近三個月報讀／退讀）" : "統計為學生名冊；預設不含已畢業生"}
       </span>
      </>
     ) : null}
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
     <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
      <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm md:p-4">
       <div className="text-xl font-bold text-primary md:text-3xl">{loading ? "…" : stats.enrolled}</div>
       <div className="text-[11px] text-muted-foreground md:text-sm">目前在讀</div>
      </div>
      {!isActiveScope ? (
      <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm md:p-4">
       <div className="text-xl font-bold text-success md:text-3xl">{loading ? "…" : stats.active}</div>
       <div className="text-[11px] text-muted-foreground md:text-sm">活躍生</div>
      </div>
      ) : null}
      <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm md:p-4">
       <div className="text-xl font-bold text-foreground md:text-3xl">{loading ? "…" : stats.total}</div>
       <div className="text-[11px] text-muted-foreground md:text-sm">
        {isActiveScope ? "本頁人數" : "學生總數"}
       </div>
      </div>
      <button
       type="button"
       onClick={() => {
        setSortKey("student_code")
        setSortDir("desc")
       }}
       className="rounded-xl border border-info bg-info p-2.5 text-left shadow-sm transition hover:border-info/70 hover:shadow-md md:p-4"
       title="按學號（最新）排序"
      >
       <div className="text-[10px] font-medium uppercase tracking-wide text-info-foreground/90 md:text-xs">最新學號</div>
       <div className="mt-0.5 text-lg font-bold text-info-foreground md:mt-1 md:text-2xl">{latestCodeStudent?.student_code ?? "—"}</div>
       <div className="mt-2 hidden text-xs text-info-foreground/80 md:block">點擊後改為「按學號（最新）」排序</div>
      </button>
     </div>

     {recentCurrent ? (
      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-primary px-4 py-4 text-primary-foreground shadow-md">
       <button
        type="button"
        onClick={() => openStudent(recentCurrent.studentId)}
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
         onClick={() => openStudent(recentCurrent.studentId)}
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

   {isMobile ? (
    renderStudentFilterChips()
   ) : (
    <CollapsibleFilterCard activeCount={activeFilterCount}>{renderStudentFilterChips()}</CollapsibleFilterCard>
   )}
  </>
 )

 return (
  <StickyListShell
   sticky={!isMobile}
   header={
    <>
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

   <div
    className={
     usesSharedAppShell(role)
      ? adminPageHeaderLayoutClass
      : "flex flex-wrap items-center justify-between gap-4"
    }
   >
    {usesSharedAppShell(role) ? (
     <AdminPageHeading
      eyebrow="行政工作"
      title="學生"
      description="搜尋學生、檢視報讀及開啟學生紀錄。"
      titleExtra={
       <>
        <Tag tone="info" size="sm">
         {loading ? "…" : `${isActiveScope ? "活躍" : "名冊"} ${stats.total} 人`}
        </Tag>
        {!loading && filtered.length !== stats.total ? (
         <span className="text-sm font-normal text-muted-foreground">
          顯示 {filtered.length} 人
         </span>
        ) : null}
       </>
      }
     />
    ) : (
     <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
      <GraduationCap className="h-7 w-7 shrink-0 text-primary" aria-hidden />
      學生管理
      <Tag tone="info" size="sm">
       {loading ? "…" : `${isActiveScope ? "活躍" : "名冊"} ${stats.total} 人`}
      </Tag>
      {!loading && filtered.length !== stats.total ? (
       <span className="text-sm font-normal text-muted-foreground">顯示 {filtered.length} 人</span>
      ) : null}
     </h1>
    )}
    <div className="flex flex-wrap items-center gap-2">
     <div className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5" role="group" aria-label="名單範圍">
      <button
       type="button"
       aria-pressed={isActiveScope}
       onClick={() => setListScope("active")}
       className={cn(
        "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all",
        isActiveScope
         ? "bg-primary text-primary-foreground shadow-sm"
         : "text-muted-foreground hover:text-foreground"
       )}
      >
       活躍
      </button>
      <button
       type="button"
       aria-pressed={!isActiveScope}
       onClick={() => setListScope("roster")}
       className={cn(
        "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all",
        !isActiveScope
         ? "bg-primary text-primary-foreground shadow-sm"
         : "text-muted-foreground hover:text-foreground"
       )}
      >
       學生名冊
      </button>
     </div>
     <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
      <button
       type="button"
       onClick={() => setViewMode("table")}
       className={cn(
        "flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
        viewMode === "table"
         ? "bg-primary text-primary-foreground shadow-sm"
         : "text-muted-foreground hover:text-foreground"
       )}
      >
       <List className="h-4 w-4" />
       {isMobile ? "精簡" : "列表"}
      </button>
      <button
       type="button"
       onClick={() => setViewMode("gallery")}
       className={cn(
        "flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
        viewMode === "gallery"
         ? "bg-primary text-primary-foreground shadow-sm"
         : "text-muted-foreground hover:text-foreground"
       )}
      >
       <LayoutGrid className="h-4 w-4" />
       圖庫
      </button>
     </div>
    </div>
   </div>
    </>
   }
  >
   <StickyListLead>

   {!isActiveScope && !showGraduated && hiddenGraduatedCount > 0 ? (
    <div
     role="status"
     className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground"
    >
     <span>
      已隱藏 {hiddenGraduatedCount} 位已畢業生（資料仍在，並非刪除）
     </span>
     <Button type="button" variant="outline" size="sm" onClick={() => setShowGraduated(true)}>
      顯示
     </Button>
    </div>
   ) : null}

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
     <div className="flex w-full gap-2 sm:w-auto">
      <Select
       aria-label="排序欄位"
       className="h-10 min-w-[8rem]"
       value={sortKey}
       onChange={(e) => {
        if (!isStudentListColumnId(e.target.value)) return
        const next = e.target.value
        setSortKey(next)
        if (next !== sortKey) setSortDir(next === "student_code" || next === "created_at" ? "desc" : "asc")
       }}
      >
       {STUDENT_LIST_DATA_COLUMNS.map((id) => (
        <option key={id} value={id}>
         {STUDENT_LIST_COLUMN_LABEL[id]}
        </option>
       ))}
      </Select>
      <Select
       aria-label="排序方向"
       className="h-10 w-[5.5rem]"
       value={sortDir}
       onChange={(e) => setSortDir(e.target.value === "asc" ? "asc" : "desc")}
      >
       <option value="asc">升序</option>
       <option value="desc">降序</option>
      </Select>
     </div>
     <div className="relative hidden sm:block">
      <Button type="button" variant="outline" onClick={() => setColumnsOpen((v) => !v)}>
       <Columns3 className="h-4 w-4" />
       欄位
      </Button>
      {columnsOpen ? (
       <div className="absolute right-0 z-30 mt-1 w-52 rounded-md border border-border bg-background p-2 shadow-md">
        <p className="px-1 pb-1 text-xs text-muted-foreground">顯示欄（姓名固定）</p>
        {STUDENT_LIST_DATA_COLUMNS.map((id) => (
         <label key={id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 text-sm hover:bg-muted/60">
          <Checkbox
           checked={visibleColumns[id]}
           disabled={id === "name"}
           onCheckedChange={() => toggleColumnVisible(id)}
           aria-label={STUDENT_LIST_COLUMN_LABEL[id]}
          />
          {STUDENT_LIST_COLUMN_LABEL[id]}
         </label>
        ))}
       </div>
      ) : null}
     </div>
     <Button type="button" variant="outline" className="hidden sm:inline-flex" onClick={() => exportCsv()} >
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
        void allocateNextStudentCode()
         .then((code) => {
          setAddForm({ ...emptyAddForm(), student_code: code })
         })
         .catch((e) => {
          reportUserFacingError(e, { source: "StudentsListPage.openAdd", setErr: setAddErr })
          setAddForm(emptyAddForm())
         })
       } else {
        setAddForm(emptyAddForm())
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
          <Field label="註冊狀態">
           <StatusToggle
            checked={(addForm.registration_status ?? "已註冊") === "已註冊"}
            onCheckedChange={(on) =>
             setAddForm((f) => ({ ...f, registration_status: on ? "已註冊" : "非注冊" }))
            }
            offLabel="非註冊（試堂／查詢）"
            onLabel="註冊"
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
           <SchoolSearchableSelect
            value={addForm.school ?? ""}
            extraSchools={extraSchools}
            onChange={(school) => setAddForm((f) => ({ ...f, school }))}
           />
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
          <Field label="第一聯絡人" className="sm:col-span-2">
           <ChoiceChips
            options={PRIMARY_CONTACT_PERSONS}
            value={addForm.primary_contact_person ?? ""}
            onChange={(v) => setAddForm((f) => ({ ...f, primary_contact_person: v }))}
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
          <Field label="學生偏好通訊方式">
           <div className="space-y-2">
            <ChoiceChips
             options={PREFERRED_CONTACT_METHODS}
             value={addForm.student_preferred_contact_method ?? ""}
             onChange={(m) =>
              setAddForm((f) => ({
               ...f,
               student_preferred_contact_method: m,
               ...(m !== "WeChat" ? { student_wechat_id: "" } : {}),
              }))
             }
            />
            {addForm.student_preferred_contact_method === "WeChat" ? (
             <Input
              placeholder="學生 WeChat ID"
              value={addForm.student_wechat_id ?? ""}
              onChange={(e) => setAddForm((f) => ({ ...f, student_wechat_id: e.target.value }))}
             />
            ) : null}
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
          <Field label="家長偏好通訊方式">
           <div className="space-y-2">
            <ChoiceChips
             options={PREFERRED_CONTACT_METHODS}
             value={addForm.parent_preferred_contact_method ?? ""}
             onChange={(m) =>
              setAddForm((f) => ({
               ...f,
               parent_preferred_contact_method: m,
               ...(m !== "WeChat" ? { parent_wechat_id: "" } : {}),
              }))
             }
            />
            {addForm.parent_preferred_contact_method === "WeChat" ? (
             <Input
              placeholder="家長 WeChat ID"
              value={addForm.parent_wechat_id ?? ""}
              onChange={(e) => setAddForm((f) => ({ ...f, parent_wechat_id: e.target.value }))}
             />
            ) : null}
           </div>
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

   {selectedIds.length > 0 ? (
    <BulkSelectionBar
     selectedCount={selectedIds.length}
     unitLabel="人"
     allFilteredSelected={filtered.length > 0 && filtered.every((r) => selectedIds.includes(r.id))}
     onToggleSelectAll={toggleSelectAllFiltered}
     onClear={() => setSelectedIds([])}
    >
     <Button type="button" variant="outline" size="sm" onClick={() => exportCsv(selectedRows)}>
      匯出已選
     </Button>
     <Button type="button" variant="outline" size="sm" onClick={() => void copySelectedParentPhones()}>
      複製家長電話
     </Button>
     {canDeleteStudent ? (
      <Button
       type="button"
       variant="destructive"
       size="sm"
       disabled={bulkSaving}
       onClick={() => void onBulkDelete()}
      >
       {bulkSaving ? "刪除中…" : "批量刪除"}
      </Button>
     ) : null}
    </BulkSelectionBar>
   ) : null}
   </StickyListLead>

   {viewMode === "table" && !isMobile ? (
    <StudentsListTable
     rows={filtered}
     filterSourceRows={scoped}
     tags={tags}
     loading={loading}
     emptyHint={renderEmptyState()}
     visible={visibleColumns}
     sortKey={sortKey}
     sortDir={sortDir}
     onToggleSort={toggleSort}
     headerFilters={headerFilters}
     onHeaderFilterChange={(key, value) => setHeaderFilters((prev) => ({ ...prev, [key]: value }))}
     selectedIds={selectedIds}
     onToggleSelect={toggleSelect}
     onToggleSelectAll={toggleSelectAllFiltered}
     canDeleteStudent={canDeleteStudent}
     onDelete={onDelete}
     onNavigate={openStudent}
     previewId={previewStudentId}
     onWeChatCopied={(wechatId) =>
      pushBanner({ tone: "success", title: "已複製 WeChat ID", message: wechatId })
     }
    />
   ) : viewMode === "table" && isMobile ? (
    <div className="space-y-2">
     {loading ? (
      <SkeletonCardGrid count={4} />
     ) : filtered.length === 0 ? (
      renderEmptyState()
     ) : (
      <StaggerList as="div" className="space-y-2">
       {filtered.map((r) => {
        const messaging = resolvePrimaryMessagingTarget(r)
        const canMessage =
         messaging?.channel === "WeChat"
          ? Boolean(messaging.wechatId?.trim())
          : Boolean(messaging?.phone?.trim())
        return (
         <StaggerItem
          key={r.id}
          as="article"
          role="button"
          tabIndex={0}
          onClick={() => openStudent(r.id)}
          onKeyDown={(e: KeyboardEvent) => {
           if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            openStudent(r.id)
           }
          }}
          className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition-colors hover:bg-info/20 active:bg-info/25"
         >
         <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2">
           <span
            className="pt-1"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
           >
            <Checkbox
             checked={selectedIds.includes(r.id)}
             onCheckedChange={() => toggleSelect(r.id)}
             aria-label={`選取 ${r.full_name}`}
            />
           </span>
           <div className="min-w-0">
            <p className="text-xs tabular-nums text-muted-foreground">{r.student_code ?? "—"}</p>
            <h3 className="truncate font-semibold">{r.full_name}</h3>
           <p className="text-sm text-muted-foreground">
            {formatStudentGrade(r.grade)}
            {(tags.get(r.id) ?? []).length > 0
             ? ` · ${(tags.get(r.id) ?? []).slice(0, 2).join("、")}`
             : ""}
           </p>
           </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
           <StudentClassificationTags student={r} size="sm" compact className="max-w-[9rem] justify-end" />
          </div>
         </div>
         <div className="mt-2 flex items-center justify-between gap-2 text-sm">
          <span className="tabular-nums text-muted-foreground">{r.student_phone ?? r.parent_phone ?? "—"}</span>
          {canMessage && messaging ? (
           <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
             "h-8 w-8",
             messaging.channel === "WeChat"
              ? "text-sky-700 hover:bg-sky-600 hover:text-white"
              : "text-success hover:bg-success hover:text-success-foreground"
            )}
            aria-label={messaging.channel === "WeChat" ? "複製 WeChat ID" : "開啟 WhatsApp"}
            onClick={(e) => {
             e.preventDefault()
             e.stopPropagation()
             void openPrimaryMessagingTarget(messaging).then((result) => {
              if (result === "wechat") {
               pushBanner({
                tone: "success",
                title: "已複製 WeChat ID",
                message: messaging.wechatId ?? "",
               })
              }
             })
            }}
           >
            <MessageCircle className="h-4 w-4" aria-hidden />
           </Button>
          ) : null}
         </div>
        </StaggerItem>
       )
      })}
      </StaggerList>
     )}
    </div>
   ) : (
    loading ? (
     <SkeletonCardGrid count={6} />
    ) : filtered.length === 0 ? (
     renderEmptyState()
    ) : (
     <StaggerList as="div" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {filtered.map((r) => {
       const messaging = resolvePrimaryMessagingTarget(r)
       const canMessage =
        messaging?.channel === "WeChat"
         ? Boolean(messaging.wechatId?.trim())
         : Boolean(messaging?.phone?.trim())
       return (
        <StaggerItem key={r.id} as="article"
         role="button"
         tabIndex={0}
         onClick={() => openStudent(r.id)}
         onKeyDown={(e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
           e.preventDefault()
           openStudent(r.id)
          }
         }}
         className="flex cursor-pointer flex-col rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-info/40 hover:bg-info/20 hover:shadow-md"
        >
         <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2">
           <span className="pt-1" onClick={(e) => e.stopPropagation()}>
            <Checkbox
             checked={selectedIds.includes(r.id)}
             onCheckedChange={() => toggleSelect(r.id)}
             aria-label={`選取 ${r.full_name}`}
            />
           </span>
           <div className="min-w-0">
            <p className="text-xs text-muted-foreground">學號：{r.student_code ?? "—"}</p>
            <h3 className="truncate text-lg font-semibold">{r.full_name}</h3>
            {r.english_name ? <p className="truncate text-sm text-muted-foreground">{r.english_name}</p> : null}
           </div>
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
           {canMessage && messaging ? (
            <Button
             type="button"
             variant="ghost"
             size="icon"
             className={cn(
              "h-8 w-8",
              messaging.channel === "WeChat"
               ? "text-sky-700 hover:bg-sky-600 hover:text-white"
               : "text-success hover:bg-success hover:text-success-foreground"
             )}
             title={messaging.channel === "WeChat" ? "複製 WeChat ID" : "開啟 WhatsApp"}
             aria-label={messaging.channel === "WeChat" ? "複製 WeChat ID" : "開啟 WhatsApp"}
             onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              void openPrimaryMessagingTarget(messaging).then((result) => {
               if (result === "wechat") {
                pushBanner({
                 tone: "success",
                 title: "已複製 WeChat ID",
                 message: messaging.wechatId ?? "",
                })
               }
              })
             }}
            >
             <MessageCircle className="h-4 w-4" aria-hidden />
            </Button>
           ) : null}
          </div>
         </div>
        </StaggerItem>
       )
      })}
     </StaggerList>
    )
   )}

   <StickyListLead className="pb-1">
    <p className="text-xs text-muted-foreground">
     {isMobile ? "點選學生卡片可進入詳細資料。" : "點選表格列可進入該學生的詳細資料（第二級頁面）。"}
    </p>
   </StickyListLead>
  </StickyListShell>
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
