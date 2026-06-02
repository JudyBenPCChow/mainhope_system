import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { BookOpen, Copy, Images, LayoutGrid, List, Plus } from "lucide-react"

import { isSuperAdmin } from "@/lib/mgmtRole"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
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
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { statusToTagTone } from "@/lib/statusTag"
import {
 CLASS_GRADE_FORM_OPTIONS,
 GRADE_CHIPS,
 KANBAN_DAY_COLUMNS,
 STATUS_CHIPS,
 SUBJECT_CHIPS,
 classMatchesGrade,
 classMatchesStatus,
 classMatchesSubject,
 kanbanDayKey,
 toCanonicalWeekdayForStore,
} from "@/components/classes/classesUi"
import { academicYearLabelFromStartDate } from "@/lib/courseCode"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import {
 deleteClass,
 duplicateClass,
  fetchAcademicYearOptions,
 fetchAllClasses,
  fetchCourseOptions,
  fetchSubjectOptions,
 fetchTeacherOptions,
 insertClass,
 type ClassRecord,
 updateClass,
} from "@/services/classQueries"
import { fetchEnrollmentRosterByClassIds } from "@/services/scheduleQueries"

const PRICE_PRESETS_HKD = [250, 275, 825] as const

const cardInteractive =
 "cursor-pointer rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"

const rowInteractive =
 "cursor-pointer transition-colors duration-150 hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"

const GALLERY_COVERS = [
 "bg-gradient-to-br from-sky-500 via-cyan-600 to-slate-800",
 "bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-800",
 "bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600",
 "bg-gradient-to-br from-sky-400 via-blue-500 to-slate-800",
 "bg-gradient-to-br from-pink-400 via-rose-500 to-slate-700",
 "bg-gradient-to-br from-lime-400 via-green-500 to-emerald-800",
 "bg-gradient-to-br from-orange-400 to-red-700",
 "bg-gradient-to-br from-cyan-400 to-teal-800",
] as const

function gradeLabelToCode(label: string): string | null {
 const t = label.trim()
 const map: Record<string, string> = {
  小一: "P1",
  小二: "P2",
  小三: "P3",
  小四: "P4",
  小五: "P5",
  小六: "P6",
  中一: "F1",
  中二: "F2",
  中三: "F3",
  中四: "F4",
  中五: "F5",
  中六: "F6",
 }
 return map[t] ?? null
}

function galleryCoverClass(subject: string): string {
 let h = 0
 for (let i = 0; i < subject.length; i++) {
  h = (h * 31 + subject.charCodeAt(i)) >>> 0
 }
 return GALLERY_COVERS[h % GALLERY_COVERS.length]
}

export function ClassesListPage() {
 const navigate = useNavigate()
 const { pushBanner } = useAppBanner()
 const { confirmDialog } = useAppConfirm()
 const teacherTid = getTeacherScopeTeacherId()
 const [rows, setRows] = useState<ClassRecord[]>([])
 const [enrollRoster, setEnrollRoster] = useState<Map<string, { count: number; names: string[] }>>(
  () => new Map()
 )
 const [teachers, setTeachers] = useState<{ id: string; label: string }[]>([])
 const [subjectOptions, setSubjectOptions] = useState<{ id: string; code: string; name_zh: string }[]>([])
 const [yearOptions, setYearOptions] = useState<{ id: string; label: string; is_current: boolean }[]>([])
 const [courseOptions, setCourseOptions] = useState<{ id: string; label: string; course_seq: number }[]>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)
 const [view, setView] = useState<"list" | "kanban" | "gallery">("list")
 const [kanbanGroup, setKanbanGroup] = useState<"day" | "teacher" | "grade">("day")
 const [gradeKey, setGradeKey] = useState<string>("全部")
 const [subjectKey, setSubjectKey] = useState<string>("全部")
 const [statusKey, setStatusKey] = useState<string>("進行中")
 const [academicYearFilter, setAcademicYearFilter] = useState<string>("current")
 const [addOpen, setAddOpen] = useState(false)
 const [form, setForm] = useState({
  subject: "",
  subject_id: "",
  subject_code: "",
  academic_year_id: "",
  academic_year_label: "",
  grade_code: "",
  course_id: "",
  course_seq: "1001",
  section_code: "",
  day_of_week: "星期六",
  time_slot: "",
  teacher_id: "",
  price: "",
  status: "進行中",
 })

 const load = useCallback(async () => {
  setLoading(true)
  setErr(null)
  try {
   const list = await fetchAllClasses()
   const [teacherOpts, subjectOpts, yearOpts] = await Promise.all([
    fetchTeacherOptions(),
    fetchSubjectOptions(),
    fetchAcademicYearOptions(),
   ])
   setRows(list)
   setTeachers(teacherOpts)
   setSubjectOptions(subjectOpts)
   setYearOptions(yearOpts)
   setEnrollRoster(await fetchEnrollmentRosterByClassIds(list.map((c) => c.id)))
  } catch (e) {
   reportUserFacingError(e, { source: "ClassesListPage.load", setErr })
  } finally {
   setLoading(false)
  }
 }, [])

 useEffect(() => {
  const pickedYear = yearOptions.find((y) => y.is_current) ?? yearOptions[0]
  if (!pickedYear) return
  setForm((f) => {
   if (f.academic_year_id) return f
   return { ...f, academic_year_id: pickedYear.id, academic_year_label: pickedYear.label }
  })
 }, [yearOptions])

 useEffect(() => {
  const sid = form.subject_id
  const g = form.grade_code
  if (!sid || !g) {
   setCourseOptions([])
   return
  }
  void (async () => {
   try {
    const opts = await fetchCourseOptions({ subject_id: sid, grade_code: g })
    setCourseOptions(opts.map((o) => ({ id: o.id, label: o.label, course_seq: o.course_seq })))
   } catch {
    setCourseOptions([])
   }
  })()
 }, [form.subject_id, form.grade_code])

 useEffect(() => {
  void load()
 }, [load])

 useEffect(() => {
  if (!teacherTid && view === "gallery") setView("list")
 }, [teacherTid, view])

 const currentAcademicYear = useMemo(() => academicYearLabelFromStartDate(null), [])

 const baseRows = useMemo(() => {
  if (!teacherTid) return rows
  return rows.filter((c) => c.teacher_id === teacherTid)
 }, [rows, teacherTid])

 const academicYearOptions = useMemo(() => {
  const years = [
   ...new Set(
    rows
     .map((c) => c.academic_year_label ?? academicYearLabelFromStartDate(c.start_date))
     .filter((x) => /^\d{4}$/.test(x))
   ),
  ].sort((a, b) => b.localeCompare(a))
  return years
 }, [rows])

 const yearScopedRows = useMemo(() => {
  const pick = academicYearFilter === "current" ? currentAcademicYear : academicYearFilter
  return baseRows.filter((c) => {
   if (!pick || pick === "all") return true
   return (c.academic_year_label ?? academicYearLabelFromStartDate(c.start_date)) === pick
  })
 }, [baseRows, academicYearFilter, currentAcademicYear])

 const isHistoryView = useMemo(() => {
  const pick = academicYearFilter === "current" ? currentAcademicYear : academicYearFilter
  return pick !== currentAcademicYear
 }, [academicYearFilter, currentAcademicYear])

 const filtered = useMemo(() => {
  return yearScopedRows.filter(
   (c) =>
    classMatchesGrade(c, gradeKey) &&
    classMatchesSubject(c, subjectKey) &&
    classMatchesStatus(c, statusKey)
  )
 }, [yearScopedRows, gradeKey, subjectKey, statusKey])

 const subjectChips = useMemo(() => {
  if (!teacherTid) return [...SUBJECT_CHIPS]
  const uniq = [...new Set(yearScopedRows.map((c) => c.subject.trim()).filter(Boolean))]
  return ["全部", ...uniq.sort((a, b) => a.localeCompare(b, "zh-Hant"))]
 }, [teacherTid, yearScopedRows])

 const gradeChips = useMemo(() => {
  if (!teacherTid) return [...GRADE_CHIPS]
  const uniq = [
   ...new Set(yearScopedRows.flatMap((c) => (c.grade ?? []).map((g) => g.trim())).filter(Boolean)),
  ]
  return ["全部", ...uniq.sort((a, b) => a.localeCompare(b, "zh-Hant"))]
 }, [teacherTid, yearScopedRows])

 const statusChips = useMemo(() => {
  if (!teacherTid) return [...STATUS_CHIPS]
  const uniq = [...new Set(yearScopedRows.map((c) => c.status.trim()).filter(Boolean))]
  return ["全部", ...uniq.sort((a, b) => a.localeCompare(b, "zh-Hant"))]
 }, [teacherTid, yearScopedRows])

 useEffect(() => {
  if (!subjectChips.includes(subjectKey)) setSubjectKey("全部")
 }, [subjectChips, subjectKey])

 useEffect(() => {
  if (!gradeChips.includes(gradeKey)) setGradeKey("全部")
 }, [gradeChips, gradeKey])

 useEffect(() => {
  if (!statusChips.includes(statusKey)) setStatusKey("全部")
 }, [statusChips, statusKey])

 const stats = useMemo(() => {
  const total = yearScopedRows.length
  const inProg = yearScopedRows.filter((c) => c.status.includes("進行")).length
  return { total, inProg, filtered: filtered.length }
 }, [yearScopedRows, filtered])

 const kanbanColumns = useMemo(() => {
  if (kanbanGroup === "day") {
   const m = new Map<string, ClassRecord[]>()
   for (const d of [...KANBAN_DAY_COLUMNS, "其他" as const]) {
    m.set(d, [])
   }
   for (const c of filtered) {
    const key = kanbanDayKey(c.day_of_week)
    const col = m.get(key) ?? m.get("其他")!
    col.push(c)
   }
   return [...KANBAN_DAY_COLUMNS, "其他"].map((title) => ({
    title,
    items: m.get(title) ?? [],
   }))
  }
  if (kanbanGroup === "teacher") {
   const m = new Map<string, ClassRecord[]>()
   for (const c of filtered) {
    const t = c.teacher_name ?? "未指派"
    if (!m.has(t)) m.set(t, [])
    m.get(t)!.push(c)
   }
   return [...m.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "zh-Hant"))
    .map(([title, items]) => ({ title, items }))
  }
  const m = new Map<string, ClassRecord[]>()
  for (const c of filtered) {
   const g = (c.grade ?? []).join("、") || "未標示"
   if (!m.has(g)) m.set(g, [])
   m.get(g)!.push(c)
  }
  return [...m.entries()]
   .sort((a, b) => a[0].localeCompare(b[0], "zh-Hant"))
   .map(([title, items]) => ({ title, items }))
 }, [filtered, kanbanGroup])

 const onAdd = async () => {
  if (isHistoryView) return
  if (!form.subject_id || !form.academic_year_id || !form.grade_code) {
   pushBanner({ tone: "warning", title: "請先選擇學年、科目與年級" })
   return
  }
  const rawPrice = form.price.trim()
  const priceNum = rawPrice === "" ? null : Number(rawPrice)
  if (priceNum != null && (Number.isNaN(priceNum) || priceNum < 0)) {
   pushBanner({ tone: "warning", title: "每節學費請輸入 0 或以上的金額（HKD）" })
   return
  }
  const dowRaw = form.day_of_week.trim()
  const dayStored = dowRaw === "" ? null : toCanonicalWeekdayForStore(dowRaw) ?? dowRaw
  setErr(null)
  const selectedSubject = subjectOptions.find((s) => s.id === form.subject_id)
  if (!selectedSubject) {
   pushBanner({ tone: "warning", title: "科目設定無效，請重新選擇" })
   return
  }
  try {
   await insertClass({
    subject: selectedSubject.name_zh,
    subject_id: form.subject_id,
    subject_code: selectedSubject.code,
    academic_year_id: form.academic_year_id,
    academic_year_label: form.academic_year_label,
    grade_code: form.grade_code,
    course_id: form.course_id || null,
    course_seq: Number(form.course_seq || "1001"),
    section_code: form.section_code.trim() || null,
    course_code: null,
    day_of_week: dayStored,
    time_slot: form.time_slot.trim() || null,
    teacher_id: form.teacher_id || null,
    price_per_lesson: priceNum == null ? null : Math.max(0, priceNum),
    status: form.status,
   })
  } catch (e) {
   reportUserFacingError(e, { source: "ClassesListPage.onAdd", setErr })
   return
  }
  setAddOpen(false)
  setForm({
   subject: "",
   subject_id: "",
   subject_code: "",
   academic_year_id: form.academic_year_id,
   academic_year_label: form.academic_year_label,
   grade_code: "",
   course_id: "",
   course_seq: "1001",
   section_code: "",
   day_of_week: "星期六",
   time_slot: "",
   teacher_id: "",
   price: "",
   status: "進行中",
  })
  await load()
 }

 const onDelete = async (e: React.MouseEvent, id: string) => {
  if (isHistoryView) return
  e.stopPropagation()
 if (!(await confirmDialog({ title: "刪除班別", description: "確定刪除此班別？", confirmText: "確認刪除", tone: "destructive" }))) return
  try {
   await deleteClass(id)
   await load()
  } catch (er) {
   reportUserFacingError(er, { source: "ClassesListPage.onDelete", setErr })
  }
 }

 const onCopy = async (e: React.MouseEvent, id: string) => {
  if (isHistoryView) return
  e.stopPropagation()
  try {
   await duplicateClass(id)
   await load()
  } catch (er) {
   reportUserFacingError(er, { source: "ClassesListPage.onCopy", setErr })
  }
 }

 const onStatusChange = async (id: string, status: string) => {
  if (isHistoryView) return
  try {
   await updateClass(id, { status })
   await load()
  } catch (er) {
   reportUserFacingError(er, { source: "ClassesListPage.onStatusChange", setErr })
  }
 }

 const timeLabel = (c: ClassRecord) =>
  [c.day_of_week, c.time_slot].filter(Boolean).join(" ") || "—"

 return (
  <div className="space-y-5 p-4 md:p-6">
   {!isSupabaseConfigured ? (
    <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm">
     請設定 <code className="rounded bg-muted px-1">.env</code> 後重啟 dev。
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

   <div className="flex flex-wrap items-center justify-between gap-4">
    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
     <BookOpen className="h-7 w-7 shrink-0 text-primary" aria-hidden />
     {teacherTid ? "我的班別" : "班別管理"}
     <Tag tone="info" size="sm">{loading ? "…" : `${stats.total} 班`}</Tag>
    </h1>
    <div className="flex flex-wrap items-center gap-2">
     <Select
      className="h-9 min-w-[10rem] rounded-md border border-input bg-background px-2 text-sm"
      value={academicYearFilter}
      onChange={(e) => setAcademicYearFilter(e.target.value)}
     >
      <option value="current">目前學年（{currentAcademicYear}）</option>
      {academicYearOptions.map((y) => (
       <option key={y} value={y}>
        {y} 學年
       </option>
      ))}
     </Select>
     <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
      <button
       type="button"
       onClick={() => setView("list")}
       className={cn(
        "flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
        view === "list"
         ? "bg-primary text-primary-foreground shadow-sm"
         : "text-muted-foreground hover:text-foreground"
       )}
      >
       <List className="h-4 w-4" />
       列表
      </button>
      <button
       type="button"
       onClick={() => setView("kanban")}
       className={cn(
        "flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
        view === "kanban"
         ? "bg-primary text-primary-foreground shadow-sm"
         : "text-muted-foreground hover:text-foreground"
       )}
      >
       <LayoutGrid className="h-4 w-4" />
       看板
      </button>
      {teacherTid ? (
       <button
        type="button"
        onClick={() => setView("gallery")}
        className={cn(
         "flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
         view === "gallery"
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
        )}
       >
        <Images className="h-4 w-4" />
        圖庫
       </button>
      ) : null}
     </div>
    </div>
   </div>

   <div className="grid gap-3 sm:grid-cols-3">
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
     <div className="text-2xl font-bold">{loading ? "…" : stats.total}</div>
     <div className="text-sm text-muted-foreground">班級總數</div>
    </div>
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
     <div className="text-2xl font-bold text-success">{loading ? "…" : stats.inProg}</div>
     <div className="text-sm text-muted-foreground">進行中</div>
    </div>
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
     <div className="text-2xl font-bold text-info">{loading ? "…" : stats.filtered}</div>
     <div className="text-sm text-muted-foreground">篩選結果</div>
    </div>
   </div>

  <div className="space-y-2">
   <div className="space-y-2">
    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">科目</div>
    <div className="flex flex-wrap gap-2">
     {subjectChips.map((s) => (
      <button
       key={s}
       type="button"
       onClick={() => setSubjectKey(s)}
       className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-all active:scale-95",
        subjectKey === s
         ? "border-primary bg-primary text-primary-foreground shadow-sm"
         : "border-border bg-card hover:border-primary/30 hover:bg-muted/60"
       )}
      >
       {s}
      </button>
     ))}
    </div>
   </div>

   <div className="space-y-2">
    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">年級</div>
    <div className="flex flex-wrap gap-2">
     {gradeChips.map((g) => (
      <button
       key={g}
       type="button"
       onClick={() => setGradeKey(g)}
       className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-all active:scale-95",
        gradeKey === g
         ? "border-primary bg-primary text-primary-foreground shadow-sm"
         : "border-border bg-card hover:border-primary/30 hover:bg-muted/60"
       )}
      >
       {g}
      </button>
     ))}
    </div>
   </div>
  </div>

   {isHistoryView ? (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
     目前為歷史學年檢視（唯讀）：可查閱資料，但不可新增、修改、刪除。
    </div>
   ) : null}

   <div className="space-y-3">
    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">狀態</div>
    <div className="flex flex-wrap gap-2">
     {statusChips.map((s) => (
      <button
       key={s}
       type="button"
       onClick={() => setStatusKey(s)}
       className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-all active:scale-95",
        statusKey === s
         ? s === "進行中"
          ? "border-success bg-success text-white shadow-sm"
          : "border-primary bg-primary text-primary-foreground shadow-sm"
         : "border-border bg-card hover:border-primary/30 hover:bg-muted/60"
       )}
      >
       {s}
      </button>
     ))}
    </div>
   </div>

   <div className="flex flex-wrap items-center justify-between gap-3">
    {view === "kanban" ? (
     <div className="flex flex-wrap gap-2">
      {(
       [
        ["day", "依星期"],
        ["teacher", "依老師"],
        ["grade", "依年級"],
       ] as const
      ).map(([key, label]) => (
       <button
        key={key}
        type="button"
        onClick={() => setKanbanGroup(key)}
        className={cn(
         "rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
         kanbanGroup === key
          ? "border-info bg-info text-white shadow-sm"
          : "border-border bg-muted/50 hover:bg-muted"
        )}
       >
        {label}
       </button>
      ))}
     </div>
    ) : (
     <span />
    )}
    {!teacherTid && !isHistoryView ? (
     <Dialog open={addOpen} onOpenChange={setAddOpen}>
      <DialogTrigger asChild>
       <Button
        type="button"
        className="bg-info text-white shadow-sm transition-all hover:bg-info hover:shadow active:scale-[0.98]"
       >
        <Plus className="h-4 w-4" />
        新增班別
       </Button>
      </DialogTrigger>
      <DialogContent>
       <DialogHeader>
        <DialogTitle>新增班別</DialogTitle>
       </DialogHeader>
       <div className="grid max-h-[70vh] gap-3 overflow-y-auto pr-1">
        <div>
         <label className="text-xs text-muted-foreground">學年 *</label>
         <Select
          className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          value={form.academic_year_id}
          onChange={(e) => {
           const y = yearOptions.find((x) => x.id === e.target.value)
           setForm((f) => ({ ...f, academic_year_id: e.target.value, academic_year_label: y?.label ?? "" }))
          }}
         >
          <option value="">請選擇</option>
          {yearOptions.map((y) => (
           <option key={y.id} value={y.id}>
            {y.label} {y.is_current ? "（目前）" : ""}
           </option>
          ))}
         </Select>
        </div>
        <div>
         <label className="text-xs text-muted-foreground">科目 *</label>
         <Select
          className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          value={form.subject_id}
          onChange={(e) => {
           const s = subjectOptions.find((x) => x.id === e.target.value)
           setForm((f) => ({ ...f, subject_id: e.target.value, subject: s?.name_zh ?? "", subject_code: s?.code ?? "", course_id: "" }))
          }}
         >
          <option value="">請選擇</option>
          {subjectOptions.map((s) => (
           <option key={s.id} value={s.id}>
            {s.name_zh}（{s.code}）
           </option>
          ))}
         </Select>
        </div>
        <div>
         <label className="text-xs text-muted-foreground">年級 *</label>
         <Select
          className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          value={form.grade_code}
          onChange={(e) => setForm((f) => ({ ...f, grade_code: e.target.value, course_id: "" }))}
         >
          <option value="">請選擇</option>
          {CLASS_GRADE_FORM_OPTIONS.map((g) => {
           const code = gradeLabelToCode(g)
           if (!code) return null
           return (
            <option key={g} value={code}>
             {g}（{code}）
            </option>
           )
          })}
         </Select>
        </div>
        <div>
         <label className="text-xs text-muted-foreground">課程（可選既有）</label>
         <Select
          className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          value={form.course_id}
          onChange={(e) => {
           const c = courseOptions.find((x) => x.id === e.target.value)
           setForm((f) => ({ ...f, course_id: e.target.value, course_seq: c ? String(c.course_seq) : f.course_seq }))
          }}
         >
          <option value="">新課程（用下方序號）</option>
          {courseOptions.map((c) => (
           <option key={c.id} value={c.id}>
            {c.label}
           </option>
          ))}
         </Select>
        </div>
        <div>
         <label className="text-xs text-muted-foreground">課程序號（預設 1001）</label>
         <Input
          className="mt-1 font-mono"
          value={form.course_seq}
          onChange={(e) => setForm((f) => ({ ...f, course_seq: e.target.value }))}
         />
        </div>
        <div>
         <label className="text-xs text-muted-foreground">班號（可留空，自動分配）</label>
         <Input
          className="mt-1 font-mono uppercase"
          value={form.section_code}
          onChange={(e) => setForm((f) => ({ ...f, section_code: e.target.value }))}
         />
        </div>
        <div>
         <label className="text-xs text-muted-foreground">逢星期</label>
         <Select
          className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          value={form.day_of_week}
          onChange={(e) => setForm((f) => ({ ...f, day_of_week: e.target.value }))}
         >
          <option value="">未指定</option>
          {KANBAN_DAY_COLUMNS.map((d) => (
           <option key={d} value={d}>
            {d}
           </option>
          ))}
         </Select>
        </div>
        <div>
         <label className="text-xs text-muted-foreground">時段（例 14:00-16:00）</label>
         <Input
          className="mt-1"
          value={form.time_slot}
          onChange={(e) => setForm((f) => ({ ...f, time_slot: e.target.value }))}
         />
        </div>
        <div>
         <label className="text-xs text-muted-foreground">老師</label>
         <Select
          className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          value={form.teacher_id}
          onChange={(e) => setForm((f) => ({ ...f, teacher_id: e.target.value }))}
         >
          <option value="">未指定</option>
          {teachers.map((t) => (
           <option key={t.id} value={t.id}>
            {t.label}
           </option>
          ))}
         </Select>
        </div>
        <div>
         <label className="text-xs text-muted-foreground">每節學費（HKD）</label>
         <div className="mt-1 flex flex-wrap gap-2">
          {PRICE_PRESETS_HKD.map((p) => (
           <Button
            key={p}
            type="button"
            size="sm"
            variant={form.price === String(p) ? "default" : "outline"}
            className={form.price === String(p) ? "" : "bg-background"}
            onClick={() => setForm((f) => ({ ...f, price: String(p) }))}
           >
            {p}
           </Button>
          ))}
         </div>
         <Input
          className="mt-2"
          type="number"
          min={0}
          step={1}
          placeholder="或手動輸入金額（HKD）"
          value={form.price}
          onChange={(e) => {
           const v = e.target.value
           if (v === "") {
            setForm((f) => ({ ...f, price: "" }))
            return
           }
           const n = Number(v)
           if (Number.isNaN(n)) {
            setForm((f) => ({ ...f, price: "" }))
            return
           }
           setForm((f) => ({ ...f, price: String(Math.max(0, n)) }))
          }}
         />
        </div>
        <div>
         <label className="text-xs text-muted-foreground">狀態</label>
         <Select
          className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
         >
          {STATUS_CHIPS.filter((s) => s !== "全部").map((s) => (
           <option key={s} value={s}>
            {s}
           </option>
          ))}
         </Select>
        </div>
        <Button type="button" onClick={() => void onAdd()}>
         建立
        </Button>
       </div>
      </DialogContent>
     </Dialog>
    ) : (
     <p className="text-sm text-muted-foreground">
      {isHistoryView ? "歷史學年為唯讀模式，無法新增班別。" : "專班老師僅可檢視指派班別，無法新增。"}
     </p>
    )}
   </div>

   {view === "list" ? (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
     <div className="overflow-x-auto">
      <table className="w-full min-w-[92rem] border-collapse text-sm">
       <thead>
        <tr className="border-b border-border bg-muted/50 text-left">
         <th className="min-w-[7.5rem] whitespace-nowrap px-4 py-3 pr-2 font-medium">
          課程編號
         </th>
         <th className="min-w-[5.5rem] whitespace-nowrap px-3 py-3 pr-2 font-medium">年級</th>
         <th className="min-w-[9rem] whitespace-nowrap px-3 py-3 pr-2 font-medium">科目</th>
         <th className="min-w-[9.5rem] whitespace-nowrap px-3 py-3 pr-2 font-medium">上課時間</th>
         <th className="min-w-[7rem] whitespace-nowrap px-3 py-3 pr-2 font-medium">老師</th>
         <th className="min-w-[4.5rem] whitespace-nowrap px-3 py-3 pr-2 text-center font-medium">
          學生人數
         </th>
         <th className="min-w-[20rem] px-3 py-3 pr-4 font-medium">學生名單</th>
         <th className="min-w-[7.5rem] whitespace-nowrap px-3 py-3 pr-2 font-medium">狀態</th>
         <th className="min-w-[6.5rem] whitespace-nowrap px-3 py-3 pl-2 font-medium">操作</th>
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
           沒有符合條件的班別
          </td>
         </tr>
        ) : (
         filtered.map((c, idx) => (
          <tr
           key={c.id}
           onClick={() => navigate(`/Classes/${c.id}`)}
           className={cn(
            "border-b border-border",
            rowInteractive,
            idx % 2 === 1 ? "bg-muted/15" : ""
           )}
          >
           <td className="min-w-0 align-top px-4 py-3 pr-2 text-muted-foreground">
            <span className="block truncate font-mono text-xs" title={c.course_code_full ?? c.course_code ?? undefined}>
             {c.course_code_full ?? c.course_code ?? "—"}
            </span>
           </td>
           <td className="min-w-0 align-top px-3 py-3 pr-2">
            <span className="block break-words leading-relaxed">{(c.grade ?? []).join("、") || "—"}</span>
           </td>
           <td className="min-w-0 align-top px-3 py-3 pr-2">
            <span className="block break-words leading-relaxed font-medium">{c.subject}</span>
           </td>
           <td className="min-w-0 align-top px-3 py-3 pr-2 text-muted-foreground">
            <span className="block break-words leading-relaxed">{timeLabel(c)}</span>
           </td>
           <td className="min-w-0 align-top px-3 py-3 pr-2" onClick={(e) => e.stopPropagation()}>
            {c.teacher_id ? (
             <Link
              to={`/Teachers/${c.teacher_id}`}
              className="font-medium text-primary underline-offset-4 hover:underline"
             >
              {c.teacher_name ?? "—"}
             </Link>
            ) : (
             "—"
            )}
           </td>
           <td
            className="align-top px-3 py-3 pr-2 text-center tabular-nums text-muted-foreground"
            onClick={(e) => e.stopPropagation()}
            title="僅統計狀態為「就讀中」的選課"
           >
            {enrollRoster.get(c.id)?.count ?? 0}
           </td>
           <td
            className="min-w-[20rem] max-w-[28rem] align-top px-3 py-3 pr-4 text-xs text-muted-foreground"
            onClick={(e) => e.stopPropagation()}
            title={
             (enrollRoster.get(c.id)?.names ?? []).length > 0
              ? (enrollRoster.get(c.id)?.names ?? []).join("、")
              : undefined
            }
           >
            {(enrollRoster.get(c.id)?.names ?? []).length > 0 ? (
             <span className="line-clamp-2 break-words leading-relaxed [overflow-wrap:anywhere]">
              {(enrollRoster.get(c.id)?.names ?? []).join("、")}
             </span>
            ) : (
             "—"
            )}
           </td>
           <td className="align-top px-3 py-3 pr-2" onClick={(e) => e.stopPropagation()}>
            <Select
             className="h-8 w-full min-w-0 max-w-full rounded-md border border-input bg-background px-2 text-xs transition-colors hover:border-primary/50"
             value={c.status}
             disabled={isHistoryView}
             onChange={(e) => void onStatusChange(c.id, e.target.value)}
            >
             {STATUS_CHIPS.filter((s) => s !== "全部").map((s) => (
              <option key={s} value={s}>
               {s}
              </option>
             ))}
            </Select>
           </td>
           <td className="align-top px-3 py-3 pl-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex min-w-0 flex-col items-start gap-y-1.5 leading-none">
             <button
              type="button"
              className="text-left text-primary hover:underline"
              onClick={() => navigate(`/Classes/${c.id}`)}
             >
              編輯
             </button>
             <button
              type="button"
              className={cn(
               "text-left text-muted-foreground",
               isHistoryView ? "cursor-not-allowed opacity-50" : "hover:text-foreground hover:underline"
              )}
              onClick={(e) => {
               if (isHistoryView) return
               void onCopy(e, c.id)
              }}
             >
              <Copy className="mr-0.5 inline h-3.5 w-3.5" />
              複製
             </button>
             {isSuperAdmin() && !isHistoryView ? (
              <button
               type="button"
               className="text-left text-destructive hover:underline"
               onClick={(e) => void onDelete(e, c.id)}
              >
               刪除
              </button>
             ) : null}
            </div>
           </td>
          </tr>
         ))
        )}
       </tbody>
      </table>
     </div>
     <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
      共 {filtered.length} 班
     </div>
    </div>
   ) : view === "gallery" && teacherTid ? (
    <div className="rounded-xl border border-border bg-muted/20 p-4 shadow-sm md:p-6">
     {loading ? (
      <p className="py-12 text-center text-muted-foreground">載入中…</p>
     ) : filtered.length === 0 ? (
      <p className="py-12 text-center text-muted-foreground">沒有符合條件的班別</p>
     ) : (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
       {filtered.map((c) => (
        <Link
         key={c.id}
         to={`/Classes/${c.id}`}
         className="group overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
        >
         <div className={cn("relative aspect-[5/3] w-full overflow-hidden", galleryCoverClass(c.subject))}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.22),transparent_55%)] opacity-90 transition group-hover:opacity-100" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-4 pb-4 pt-14 text-white">
           <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/75">班別</p>
           <p className="line-clamp-2 text-lg font-bold leading-snug">{c.subject}</p>
          </div>
         </div>
         <div className="space-y-2 px-4 py-3">
          {c.course_code_full || c.course_code ? (
           <p className="font-mono text-xs text-muted-foreground">{c.course_code_full ?? c.course_code}</p>
          ) : null}
          <p className="text-sm text-muted-foreground">{timeLabel(c)}</p>
          <p className="text-sm text-muted-foreground">{(c.grade ?? []).join("、") || "—"}</p>
          <Tag tone={statusToTagTone(c.status)} size="sm">{c.status}</Tag>
         </div>
        </Link>
       ))}
      </div>
     )}
    </div>
   ) : (
    <div className="flex gap-3 overflow-x-auto pb-2">
     {kanbanColumns.map((col) => (
      <div
       key={col.title}
       className="flex w-64 min-w-[14rem] shrink-0 flex-col rounded-xl border border-border bg-muted/20 p-2"
      >
       <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-sm font-semibold">{col.title}</span>
        <span className="text-xs text-muted-foreground">{col.items.length}</span>
       </div>
       <div className="flex flex-1 flex-col gap-2">
        {col.items.length === 0 ? (
         <div className="rounded-lg border border-dashed border-border/80 bg-card/50 py-8 text-center text-xs text-muted-foreground">
          暫無班別
         </div>
        ) : (
         col.items.map((c) => (
          <div
           key={c.id}
           role="button"
           tabIndex={0}
           onClick={() => navigate(`/Classes/${c.id}`)}
           onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
             e.preventDefault()
             navigate(`/Classes/${c.id}`)
            }
           }}
           className={cn("flex flex-col gap-2 p-3", cardInteractive)}
          >
           <div className="flex items-start justify-between gap-2">
            <span className="font-mono text-xs text-muted-foreground">
             {c.course_code_full ?? c.course_code ?? "—"}
            </span>
            <Tag tone={statusToTagTone(c.status)} size="sm" className="text-[10px]">{c.status}</Tag>
           </div>
           <div className="text-base font-bold">{c.subject}</div>
           <div className="text-xs text-muted-foreground">{timeLabel(c)}</div>
           {c.teacher_id ? (
            <Link
             to={`/Teachers/${c.teacher_id}`}
             onClick={(e) => e.stopPropagation()}
             className="text-sm font-medium text-primary hover:underline"
            >
             {c.teacher_name}
            </Link>
           ) : (
            <span className="text-sm text-muted-foreground">未指派</span>
           )}
           <div className="text-sm font-semibold text-info">
            {c.price_per_lesson != null
             ? `HKD $${c.price_per_lesson}/節`
             : ""}
           </div>
           <div
            className="mt-1 flex justify-between border-t border-border pt-2 text-xs"
            onClick={(e) => e.stopPropagation()}
           >
            <button
             type="button"
             className="text-primary hover:underline"
             onClick={() => navigate(`/Classes/${c.id}`)}
            >
             編輯
            </button>
            <button
             type="button"
             className={cn(
              "text-muted-foreground",
              isHistoryView ? "cursor-not-allowed opacity-50" : "hover:underline"
             )}
             onClick={(e) => {
              if (isHistoryView) return
              void onCopy(e, c.id)
             }}
            >
             複製
            </button>
            {isSuperAdmin() && !isHistoryView ? (
             <button
              type="button"
              className="text-destructive hover:underline"
              onClick={(e) => void onDelete(e, c.id)}
             >
              刪除
             </button>
            ) : null}
           </div>
          </div>
         ))
        )}
       </div>
      </div>
     ))}
    </div>
   )}

   <p className="text-xs text-muted-foreground">
    點列表列、看板卡片或圖庫卡片進入班別詳情；老師姓名可連至老師頁。
   </p>
  </div>
 )
}
