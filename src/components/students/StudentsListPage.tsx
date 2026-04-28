import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ChevronDown, ChevronUp, GraduationCap, LayoutGrid, List, MessageCircle, Plus, Search, Sheet } from "lucide-react"

import { isSuperAdmin } from "@/lib/mgmtRole"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { openWhatsAppChat, pickStudentContactRaw } from "@/lib/whatsappReminder"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
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
import { statusToTagTone } from "@/lib/statusTag"
import {
 deleteStudent,
 fetchAllStudents,
 fetchEnrollmentSubjectsByStudentIds,
 fetchStudentTuitionArrearsByStudentIds,
 insertStudent,
 normalizeStudentStatus,
 type StudentRecord,
 type StudentTuitionArrearsInfo,
} from "@/services/studentQueries"

const STATUS_FILTERS = [
 { key: "all", label: "所有學生" },
 { key: "在讀", label: "在讀" },
 { key: "非在讀", label: "非在讀" },
 { key: "查詢試堂", label: "查詢試堂" },
 { key: "畢業", label: "畢業" },
] as const

const GRADE_FILTERS = [
 { key: "all", label: "全部" },
 { key: "中一", label: "中一" },
 { key: "中二", label: "中二" },
 { key: "中三", label: "中三" },
 { key: "中四", label: "中四" },
 { key: "中五", label: "中五" },
 { key: "中六", label: "中六" },
 { key: "其他", label: "其他" },
] as const

const GRADE_CHIPS = ["中一", "中二", "中三", "中四", "中五", "中六"] as const
const RELATIONSHIP_CHIPS = ["父親", "母親", "祖父母", "兄姊", "親屬", "監護人", "其他"] as const
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
  enrollment_status: "在讀",
  academic_stage: "中學中",
  school: "",
  date_of_birth: "",
  parent_name: "",
  parent_relationship: "",
  student_phone: "",
  parent_phone: "",
  whatsapp: "",
  address: "",
  remarks: "",
 }
}

function nextStudentCode(rows: StudentRecord[]): string {
 let max = 0
 for (const r of rows) {
  const code = (r.student_code ?? "").trim()
  const m = code.match(/^SNFNL(\d+)$/i)
  if (!m) continue
  const n = Number(m[1])
  if (Number.isFinite(n) && n > max) max = n
 }
 const next = Math.max(1, max + 1)
 return `SNFNL${String(next).padStart(4, "0")}`
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

export function StudentsListPage() {
 const { confirmDialog } = useAppConfirm()
 const navigate = useNavigate()
 const [rows, setRows] = useState<StudentRecord[]>([])
 const [tags, setTags] = useState<Map<string, string[]>>(new Map())
 const [tuitionMap, setTuitionMap] = useState<Map<string, StudentTuitionArrearsInfo>>(new Map())
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)
 const [statusKey, setStatusKey] = useState<(typeof STATUS_FILTERS)[number]["key"]>("all")
 const [gradeKey, setGradeKey] = useState<(typeof GRADE_FILTERS)[number]["key"]>("all")
 const [viewMode, setViewMode] = useState<"table" | "gallery">("table")
 const [sortMode, setSortMode] = useState<"codeAsc" | "codeDesc">("codeDesc")
 const [showGraduated, setShowGraduated] = useState(false)
 const [dashboardCollapsed, setDashboardCollapsed] = useState(false)
 const [search, setSearch] = useState("")
 const [addOpen, setAddOpen] = useState(false)
 const [addForm, setAddForm] = useState<Partial<StudentRecord>>(emptyAddForm())
 const [schoolSearch, setSchoolSearch] = useState("")

 const load = useCallback(async () => {
  setLoading(true)
  setErr(null)
  try {
   const list = await fetchAllStudents()
   setRows(list)
   const ids = list.map((s) => s.id)
   const [tagMap, arrearsMap] = await Promise.all([
    fetchEnrollmentSubjectsByStudentIds(ids),
    fetchStudentTuitionArrearsByStudentIds(ids),
   ])
   setTags(tagMap)
   setTuitionMap(arrearsMap)
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
  const enrolled = rows.filter((r) => normalizeStudentStatus(r.status) === "在讀").length
  const start = monthStartIso()
  const newThisMonth = rows.filter((r) => r.created_at.slice(0, 10) >= start).length
  return { total, enrolled, newThisMonth }
 }, [rows])

 const latest = useMemo(() => {
  if (rows.length === 0) return null
  return [...rows]
   .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
 }, [rows])

 const latestCodeStudent = useMemo(() => {
  if (rows.length === 0) return null
  return [...rows].sort((a, b) => {
   const ra = studentCodeRank(a.student_code)
   const rb = studentCodeRank(b.student_code)
   if (ra !== rb) return rb - ra
   return b.created_at.localeCompare(a.created_at)
  })[0]
 }, [rows])

 const filtered = useMemo(() => {
  let list = rows
  if (statusKey !== "all") {
   list = list.filter((r) => normalizeStudentStatus(r.status) === statusKey)
  }
  if (!showGraduated) {
   list = list.filter((r) => normalizeStudentStatus(r.status) !== "畢業")
  }
  if (gradeKey !== "all") {
   list = list.filter((r) => (r.grade ?? "") === gradeKey)
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
   const aa = (a.student_code ?? "").trim()
   const bb = (b.student_code ?? "").trim()
   if (!aa && !bb) return a.full_name.localeCompare(b.full_name, "zh-Hant")
   if (!aa) return sortMode === "codeAsc" ? 1 : -1
   if (!bb) return sortMode === "codeAsc" ? -1 : 1
   const ncmp = aa.localeCompare(bb, "en", { numeric: true, sensitivity: "base" })
   if (ncmp !== 0) return sortMode === "codeAsc" ? ncmp : -ncmp
   return a.full_name.localeCompare(b.full_name, "zh-Hant")
  })
  return sorted
 }, [rows, statusKey, showGraduated, gradeKey, search, sortMode])

 const statusCounts = useMemo(() => {
  const m = new Map<string, number>()
  for (const r of rows) {
   const st = normalizeStudentStatus(r.status)
   m.set(st, (m.get(st) ?? 0) + 1)
  }
  return m
 }, [rows])

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
  if (!(addForm.full_name ?? "").trim()) return
  try {
   const reg = addForm.registration_status === "僅查詢" ? "僅查詢" : "已註冊"
   await insertStudent({
    full_name: (addForm.full_name ?? "").trim(),
    english_name: (addForm.english_name ?? "").trim() || null,
    student_code: (addForm.student_code ?? "").trim() || null,
    gender: (addForm.gender ?? "").trim() || null,
    grade: (addForm.grade ?? "").trim() || null,
    registration_status: reg,
    enrollment_status: "在讀",
    academic_stage: "中學中",
    school: (addForm.school ?? "").trim() || null,
    date_of_birth: (addForm.date_of_birth ?? "").trim() || null,
    parent_name: (addForm.parent_name ?? "").trim() || null,
    parent_relationship: (addForm.parent_relationship ?? "").trim() || null,
    student_phone: (addForm.student_phone ?? "").trim() || null,
    parent_phone: (addForm.parent_phone ?? "").trim() || null,
    whatsapp: (addForm.whatsapp ?? "").trim() || null,
    address: (addForm.address ?? "").trim() || null,
    remarks: (addForm.remarks ?? "").trim() || null,
   })
   setAddOpen(false)
   setAddForm(emptyAddForm())
   await load()
  } catch (e) {
   reportUserFacingError(e, { source: "StudentsListPage.onAddStudent", setErr })
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

 return (
  <div className="space-y-5 p-4 md:p-6">
   {!isSupabaseConfigured ? (
    <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm">
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

  <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
   <div className="flex items-center gap-2">
    <h2 className="text-sm font-semibold tracking-wide">學生儀表板</h2>
    <Tag tone="default" size="sm">目前排序：{sortMode === "codeAsc" ? "按學號（小→大）" : "按學號（最新）"}</Tag>
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
     <div className="text-3xl font-bold text-success">
      {loading ? "…" : stats.newThisMonth}
     </div>
     <div className="text-sm text-muted-foreground">本月新報讀</div>
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
    <div className="text-xs font-medium uppercase tracking-wide text-info">最新學號</div>
    <div className="mt-1 text-2xl font-bold text-info">{latestCodeStudent?.student_code ?? "—"}</div>
    <div className="mt-2 text-xs text-info/80">點擊後改為「按學號（最新）」排序</div>
   </button>
   </div>

   {latest ? (
    <div className="flex flex-wrap items-center gap-4 rounded-xl bg-primary px-4 py-4 text-primary-foreground shadow-md">
     <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-semibold">
      {latest.full_name.slice(0, 1)}
     </div>
     <div className="min-w-0 flex-1">
      <div className="text-xs font-medium uppercase tracking-wide text-white/80">最新報讀</div>
      <div className="text-lg font-semibold">{latest.full_name}</div>
      <div className="text-sm text-white/90">
       {(latest.grade ?? "—") + " · " + (latest.school ?? "—")}
      </div>
     </div>
     <div className="flex gap-1">
      {rows.slice(0, 5).map((_, i) => (
       <span
        key={i}
        className={cn(
         "h-2 w-2 rounded-full",
         i === 0 ? "bg-white" : "bg-white/40"
        )}
       />
      ))}
     </div>
    </div>
   ) : null}
  </>
  ) : null}

   <div className="space-y-2">
    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
     狀態
    </div>
    <div className="flex flex-wrap gap-2">
     {STATUS_FILTERS.map((f) => {
      const count =
       f.key === "all" ? rows.length : (statusCounts.get(f.key) ?? 0)
      const active = statusKey === f.key
      return (
       <button
        key={f.key}
        type="button"
        onClick={() => setStatusKey(f.key)}
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
    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
     年級
    </div>
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

   <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
       setAddOpen(open)
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
         <Input
          value={addForm.gender ?? ""}
          onChange={(e) => setAddForm((f) => ({ ...f, gender: e.target.value }))}
          placeholder="男／女"
         />
        </Field>
        <Field label="年級">
         <div className="flex flex-wrap gap-2">
          {GRADE_CHIPS.map((g) => (
           <button
            key={g}
            type="button"
            onClick={() => setAddForm((f) => ({ ...f, grade: g }))}
            className={cn(
             "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
             (addForm.grade ?? "") === g
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:bg-muted/80"
            )}
           >
            {g}
           </button>
          ))}
         </div>
        </Field>
        <Field label="註冊狀態">
         <div className="flex gap-4 py-1">
          <label className="inline-flex items-center gap-2 text-sm">
           <input
            type="radio"
            name="registration-status"
            checked={(addForm.registration_status ?? "已註冊") === "已註冊"}
            onChange={() => setAddForm((f) => ({ ...f, registration_status: "已註冊" }))}
           />
           正式註冊
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
           <input
            type="radio"
            name="registration-status"
            checked={(addForm.registration_status ?? "已註冊") === "僅查詢"}
            onChange={() => setAddForm((f) => ({ ...f, registration_status: "僅查詢" }))}
           />
           試堂/查詢
          </label>
         </div>
        </Field>
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
        <Field label="家長稱呼">
         <Input
          value={addForm.parent_name ?? ""}
          onChange={(e) => setAddForm((f) => ({ ...f, parent_name: e.target.value }))}
         />
        </Field>
        <Field label="關係">
         <div className="flex flex-wrap gap-2">
          {RELATIONSHIP_CHIPS.map((rel) => (
           <button
            key={rel}
            type="button"
            onClick={() => setAddForm((f) => ({ ...f, parent_relationship: rel }))}
            className={cn(
             "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
             (addForm.parent_relationship ?? "") === rel
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:bg-muted/80"
            )}
           >
            {rel}
           </button>
          ))}
         </div>
        </Field>
        <Field label="學生電話">
         <Input
          value={addForm.student_phone ?? ""}
          onChange={(e) => setAddForm((f) => ({ ...f, student_phone: e.target.value }))}
         />
        </Field>
        <Field label="家長電話">
         <Input
          value={addForm.parent_phone ?? ""}
          onChange={(e) => setAddForm((f) => ({ ...f, parent_phone: e.target.value }))}
         />
        </Field>
        <Field label="WhatsApp">
         <Input
          value={addForm.whatsapp ?? ""}
          onChange={(e) => setAddForm((f) => ({ ...f, whatsapp: e.target.value }))}
         />
        </Field>
        <Field label="親友連結" className="sm:col-span-2">
         <Input
          value={addForm.address ?? ""}
          onChange={(e) => setAddForm((f) => ({ ...f, address: e.target.value }))}
          placeholder="例如：父親 9123xxxx；姨媽 9888xxxx"
         />
        </Field>
        <Field label="備註" className="sm:col-span-2">
         <Textarea
          value={addForm.remarks ?? ""}
          onChange={(e) => setAddForm((f) => ({ ...f, remarks: e.target.value }))}
          rows={3}
         />
        </Field>
        <div className="sm:col-span-2">
         <Button type="button" onClick={() => void onAddStudent()} disabled={!(addForm.full_name ?? "").trim()}>
          建立
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
        <th className="w-[8%] px-3 py-3 font-medium text-muted-foreground">狀態</th>
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
           <td className="align-top px-3 py-3">{r.grade ?? "—"}</td>
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
           <td className="align-top px-3 py-3">
           <Tag tone={statusToTagTone(normalizeStudentStatus(r.status))} size="sm">{normalizeStudentStatus(r.status)}</Tag>
           </td>
           <td className="align-top px-3 py-3">
            {t?.showArrears ? (
             <span
              className="inline-flex rounded-md border border-amber-300 bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-950"
              title={`計費出席 ${t.attendedLessons} 堂 · 已繳費 ${t.paidLessons} 堂（「已收款」收據之堂數加總）`}
             >
              追收學費
             </span>
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
          <Tag tone={statusToTagTone(normalizeStudentStatus(r.status))} size="sm">{normalizeStudentStatus(r.status)}</Tag>
         </div>
         <div className="mt-3 space-y-1 text-sm text-muted-foreground">
          <p>年級：{r.grade ?? "—"}</p>
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
            <span className="rounded-md border border-amber-300 bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-950">
             追收學費
            </span>
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
