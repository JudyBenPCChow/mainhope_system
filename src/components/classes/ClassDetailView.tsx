import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, BookOpen, CalendarDays, Pencil, Users } from "lucide-react"

import { DetailLayerShell } from "@/components/detail/DetailLayerShell"
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
 KANBAN_DAY_COLUMNS,
 STATUS_CHIPS,
 normalizeClassGradeForForm,
 toCanonicalWeekdayForStore,
 weekdaySelectValueFromStored,
} from "@/components/classes/classesUi"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { useAppBanner } from "@/lib/appBanner"
import { useAppConfirm } from "@/lib/appConfirm"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { normalizeCourseCode } from "@/lib/courseCode"
import { cn } from "@/lib/utils"
import { getTeacherScopeTeacherId } from "@/lib/teacherScope"
import {
 deleteSchedule,
 fetchClassStudents,
 fetchClassSchedules,
 fetchClassroomOptions,
 fetchTeacherOptions,
 getClassById,
 insertScheduleForClass,
 type ClassRecord,
 type ClassScheduleRow,
 type ClassStudentRow,
 updateClass,
 updateSchedule,
} from "@/services/classQueries"
import {
 fetchEnrollmentChangeEventsForClass,
 type ClassEnrollmentChangeEvent,
 fetchAllStudents,
 insertEnrollment,
 type StudentRecord,
} from "@/services/studentQueries"
import { localYmd } from "@/services/teacherQueries"

const PRICE_PRESETS_HKD = [250, 275, 825] as const

/** 日期／文字欄清空時勿送 "" 給 Postgres（date 欄位會報錯） */
function nullIfBlankYmd(v: string | null | undefined): string | null {
 if (v == null) return null
 const t = String(v).trim()
 if (!t) return null
 return t.slice(0, 10)
}

function nullIfBlankText(v: string | null | undefined): string | null {
 if (v == null) return null
 const t = String(v).trim()
 return t === "" ? null : t
}

type TabId = "basic" | "students" | "schedule"

const TABS: {
 id: TabId
 label: (n: { st: number; sc: number }) => string
 icon: typeof BookOpen
}[] = [
 { id: "basic", label: () => "基本資料", icon: BookOpen },
 { id: "students", label: ({ st }) => `學生名單 (${st})`, icon: Users },
 { id: "schedule", label: ({ sc }) => `排程 (${sc})`, icon: CalendarDays },
]

export function ClassDetailView() {
 const { classId } = useParams<{ classId: string }>()
 const navigate = useNavigate()
 const cid = classId ?? ""
 const [tab, setTab] = useState<TabId>("basic")
 const [cls, setCls] = useState<ClassRecord | null>(null)
 const [students, setStudents] = useState<ClassStudentRow[]>([])
 const [allStudents, setAllStudents] = useState<StudentRecord[]>([])
 const [enrollmentEvents, setEnrollmentEvents] = useState<ClassEnrollmentChangeEvent[]>([])
 const [schedules, setSchedules] = useState<ClassScheduleRow[]>([])
 const [loading, setLoading] = useState(true)
 const [editOpen, setEditOpen] = useState(false)
 const [editErr, setEditErr] = useState<string | null>(null)
 const [savingEdit, setSavingEdit] = useState(false)
 const [teachers, setTeachers] = useState<{ id: string; label: string }[]>([])
 const [rooms, setRooms] = useState<{ id: string; label: string }[]>([])
 const [form, setForm] = useState<Partial<ClassRecord>>({})
 const [gradeSelections, setGradeSelections] = useState<string[]>([])
 const [schedFilter, setSchedFilter] = useState<"future" | "past" | "cancel">("future")
 const [addSchedOpen, setAddSchedOpen] = useState(false)
 const [newSchedDate, setNewSchedDate] = useState(() => localYmd())
 const [newSchedStart, setNewSchedStart] = useState("")
 const [newSchedEnd, setNewSchedEnd] = useState("")
 const [savingAddSched, setSavingAddSched] = useState(false)
 const [addSchedErr, setAddSchedErr] = useState<string | null>(null)
 const [addStudentOpen, setAddStudentOpen] = useState(false)
 const [studentQuery, setStudentQuery] = useState("")
 const [addingStudentId, setAddingStudentId] = useState<string | null>(null)
 const [addStudentErr, setAddStudentErr] = useState<string | null>(null)
 const [schedActionErr, setSchedActionErr] = useState<string | null>(null)
 const [pageErr, setPageErr] = useState<string | null>(null)
 const { pushBanner } = useAppBanner()
 const { confirmDialog } = useAppConfirm()

 const reload = useCallback(async () => {
  if (!cid) return
  setLoading(true)
  setPageErr(null)
  try {
   const [c, st, ev, sc, tch, rm, allSt] = await Promise.all([
    getClassById(cid),
    fetchClassStudents(cid),
    fetchEnrollmentChangeEventsForClass(cid),
    fetchClassSchedules(cid),
    fetchTeacherOptions(),
    fetchClassroomOptions(),
    fetchAllStudents(),
   ])
   setCls(c)
   if (c) {
    const mappedDay = weekdaySelectValueFromStored(c.day_of_week)
    const safeCap = c.capacity != null && c.capacity < 0 ? null : c.capacity
    setForm({
     ...c,
     day_of_week: mappedDay || c.day_of_week || null,
     capacity: safeCap,
    })
    const grades = (c.grade ?? [])
     .map((g) => normalizeClassGradeForForm(g))
     .filter((x): x is string => x != null)
    setGradeSelections([...new Set(grades)])
   } else {
    setForm({})
    setGradeSelections([])
   }
   setStudents(st)
   setEnrollmentEvents(ev)
   setSchedules(sc)
   setTeachers(tch)
   setRooms(rm)
   setAllStudents(allSt)
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, {
    source: "ClassDetailView.reload",
    setErr: setPageErr,
    userMessage: msg,
   })
  } finally {
   setLoading(false)
  }
 }, [cid])

 useEffect(() => {
  void reload()
 }, [reload])

 const today = localYmd()

 const schedFiltered = useMemo(() => {
  return schedules.filter((s) => {
   if (schedFilter === "cancel") return s.status.includes("取消")
   if (schedFilter === "past")
    return s.scheduled_date < today && !s.status.includes("取消")
   return s.scheduled_date >= today && !s.status.includes("取消")
  })
 }, [schedules, schedFilter, today])

 const parts = useMemo(() => {
  let fut = 0
  let past = 0
  let canc = 0
  for (const s of schedules) {
   if (s.status.includes("取消")) {
    canc++
    continue
   }
   if (s.scheduled_date >= today) fut++
   else past++
  }
  return { fut, past, canc }
 }, [schedules, today])

 const saveClass = async () => {
  if (!cid || !cls) return
  setEditErr(null)
  const cap = form.capacity
  if (cap != null && cap < 0) {
   pushBanner({ tone: "warning", title: "收生上限不可為負數" })
   return
  }
  const gradeArr = gradeSelections.length > 0 ? gradeSelections : []
  const dowRaw = form.day_of_week != null ? String(form.day_of_week).trim() : ""
  const dayStored = dowRaw === "" ? null : toCanonicalWeekdayForStore(dowRaw) ?? dowRaw
  setSavingEdit(true)
  try {
   await updateClass(cid, {
    subject: form.subject ?? cls.subject,
    course_code: form.course_code?.trim() ? form.course_code : null,
    grade: gradeArr,
    day_of_week: dayStored,
    time_slot: nullIfBlankText(form.time_slot),
    teacher_id: form.teacher_id ?? null,
    classroom_id: form.classroom_id ?? null,
    capacity: cap == null ? null : Math.max(0, Math.floor(cap)),
    price_per_lesson:
     form.price_per_lesson != null && !Number.isNaN(form.price_per_lesson)
      ? Math.max(0, form.price_per_lesson)
      : null,
    start_date: nullIfBlankYmd(form.start_date),
    end_date: nullIfBlankYmd(form.end_date),
    status: form.status ?? cls.status,
   })
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, {
    source: "ClassDetailView.saveClass",
    setErr: setEditErr,
    userMessage: msg,
   })
   return
  } finally {
   setSavingEdit(false)
  }
  setEditOpen(false)
  await reload()
 pushBanner({ tone: "success", title: "已儲存班別設定", message: "班別資料已更新。" })
 }

 const addSched = async () => {
  if (!cls) return
  setSavingAddSched(true)
  setAddSchedErr(null)
  try {
   await insertScheduleForClass(cid, cls.teacher_id, {
    scheduled_date: newSchedDate,
    start_time: newSchedStart || null,
    end_time: newSchedEnd || null,
   })
   setAddSchedOpen(false)
   setNewSchedDate(localYmd())
   setNewSchedStart("")
   setNewSchedEnd("")
   await reload()
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, {
    source: "ClassDetailView.addSched",
    setErr: setAddSchedErr,
    userMessage: msg,
   })
  } finally {
   setSavingAddSched(false)
  }
 }

 const timeLine = (c: ClassRecord) =>
  [c.day_of_week, c.time_slot].filter(Boolean).join(" ") || "—"

 if (!cid) {
  return (
   <DetailLayerShell variant="student" onDismiss={() => navigate("/Classes")} layerLabel={null}>
    <p className="p-6 text-muted-foreground">無效路由</p>
   </DetailLayerShell>
  )
 }
 if (!loading && !cls) {
  return (
   <DetailLayerShell variant="student" onDismiss={() => navigate("/Classes")} layerLabel="班別詳情">
    <div className="p-6">
     <p className="text-muted-foreground">找不到班別。</p>
     <Button className="mt-4" variant="outline" asChild>
      <Link to="/Classes">返回</Link>
     </Button>
    </div>
   </DetailLayerShell>
  )
 }

 const scopeTeacherId = getTeacherScopeTeacherId()
 if (!loading && cls && scopeTeacherId && cls.teacher_id !== scopeTeacherId) {
  return (
   <DetailLayerShell variant="student" onDismiss={() => navigate("/Classes")} layerLabel="班別詳情">
    <div className="p-6">
     <p>此班別不屬於您的指派，無法檢視。</p>
     <Button className="mt-4" variant="outline" asChild>
      <Link to="/Classes">返回班別列表</Link>
     </Button>
    </div>
   </DetailLayerShell>
  )
 }

const tabCounts = { st: students.length, sc: schedules.length }
const addableStudents = (() => {
  const enrolledIds = new Set(students.map((s) => s.studentId))
  const q = studentQuery.trim().toLowerCase()
  const list = allStudents.filter((s) => !enrolledIds.has(s.id))
  if (!q) return list.slice(0, 50)
  return list
   .filter((s) => {
    const hay = [s.full_name, s.english_name, s.student_code, s.student_phone, s.parent_phone]
     .filter(Boolean)
     .join(" ")
     .toLowerCase()
    return hay.includes(q)
   })
   .slice(0, 50)
})()

 const onAddStudentToClass = async (studentId: string) => {
  if (!cid) return
  setAddingStudentId(studentId)
  setAddStudentErr(null)
  try {
   await insertEnrollment(studentId, cid)
   setStudentQuery("")
   await reload()
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, {
    source: "ClassDetailView.onAddStudentToClass",
    setErr: setAddStudentErr,
    userMessage: msg,
   })
  } finally {
   setAddingStudentId(null)
  }
 }

 const onChangeScheduleStatus = async (scheduleId: string, status: string) => {
  setSchedActionErr(null)
  try {
   await updateSchedule(scheduleId, { status })
   await reload()
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, {
    source: "ClassDetailView.onChangeScheduleStatus",
    setErr: setSchedActionErr,
    userMessage: msg,
   })
  }
 }

 const onDeleteSchedule = async (scheduleId: string) => {
  setSchedActionErr(null)
  try {
   await deleteSchedule(scheduleId)
   await reload()
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, {
    source: "ClassDetailView.onDeleteSchedule",
    setErr: setSchedActionErr,
    userMessage: msg,
   })
  }
 }

 return (
  <DetailLayerShell
   variant="student"
   onDismiss={() => navigate("/Classes")}
   layerLabel="班別詳情 · 次層檢視"
  >
   <div className="flex min-h-full flex-col bg-background">
   <div className="bg-primary px-4 py-4 text-primary-foreground shadow-md md:px-6">
    <div className="flex flex-wrap items-start gap-4">
     <Button
      type="button"
      variant="secondary"
      size="sm"
      className="bg-white/90 text-foreground hover:bg-white"
      onClick={() => navigate("/Classes")}
     >
      <ArrowLeft className="h-4 w-4" />
      返回
     </Button>
     <div className="flex min-w-0 flex-1 items-start gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-xl">
       
      </div>
      <div className="min-w-0">
       {loading ? (
        <p className="text-lg">載入中…</p>
       ) : cls ? (
        <>
         <h1 className="text-xl font-bold md:text-2xl">{cls.subject}</h1>
         <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/90">
          <span className="font-mono">{cls.course_code_full ?? cls.course_code ?? "—"}</span>
          <Tag tone={statusToTagTone(cls.status)} size="sm">{cls.status}</Tag>
          <span>{timeLine(cls)}</span>
         </div>
        </>
       ) : null}
      </div>
     </div>
     <Button
      type="button"
      variant="secondary"
      className="bg-white/20 text-white hover:bg-white/30"
      onClick={() => {
       setEditErr(null)
       setEditOpen(true)
      }}
     >
      <Pencil className="h-4 w-4" />
      編輯班別
     </Button>
    </div>
   </div>

   <div className="border-b border-border bg-card px-2 md:px-4">
    <nav className="flex gap-1 overflow-x-auto py-1">
     {TABS.map((t) => {
      const Icon = t.icon
      const active = tab === t.id
      return (
       <button
        key={t.id}
        type="button"
        onClick={() => setTab(t.id)}
        className={cn(
         "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
         active
          ? "border-b-2 border-primary text-primary"
          : "text-muted-foreground hover:text-foreground"
        )}
       >
        <Icon className="h-4 w-4" />
        {t.label(tabCounts)}
       </button>
      )
     })}
    </nav>
   </div>

   <div className="p-4 md:p-6">
    {pageErr ? (
     <div
      role="alert"
      className="mx-auto mb-4 max-w-5xl rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
     >
      {pageErr}
     </div>
    ) : null}
    {tab === "basic" && cls ? (
     <div className="mx-auto max-w-5xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
       {[
        { k: "科目", v: cls.subject },
        { k: "班別編碼", v: cls.course_code_full ?? cls.course_code ?? "—" },
        { k: "適用年級", v: (cls.grade ?? []).join("、") || "—" },
        { k: "星期 / 時間", v: timeLine(cls) },
        {
         k: "負責老師",
         v: cls.teacher_id ? (
          <Link
           to={`/Teachers/${cls.teacher_id}`}
           className="font-medium text-primary underline-offset-4 hover:underline"
          >
           {cls.teacher_name ?? "—"}
          </Link>
         ) : (
          "未指定"
         ),
        },
        { k: "上課課室", v: cls.classroom_name ?? "未指定" },
        { k: "收生上限", v: cls.capacity != null ? `${cls.capacity} 人` : "—" },
        {
         k: "每節學費",
         v:
          cls.price_per_lesson != null
           ? `HKD $${cls.price_per_lesson.toLocaleString("zh-Hant-TW")}`
           : "—",
        },
        { k: "開始日期", v: cls.start_date ?? "—" },
        { k: "結束日期", v: cls.end_date ?? "—" },
       ].map((cell) => (
        <div
         key={cell.k}
         className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
        >
         <div className="text-xs font-medium text-muted-foreground">{cell.k}</div>
         <div className="mt-1 text-sm font-semibold text-foreground">{cell.v}</div>
        </div>
       ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
       <div className="rounded-xl border border-info bg-info p-4 text-center transition-transform hover:scale-[1.02]">
        <div className="text-3xl font-bold text-info">{students.length}</div>
        <div className="text-xs font-medium text-info/90">就讀學生</div>
       </div>
       <div className="rounded-xl border border-info bg-info p-4 text-center transition-transform hover:scale-[1.02]">
        <div className="text-3xl font-bold text-info">{parts.fut}</div>
        <div className="text-xs font-medium text-info/90">未來排程</div>
       </div>
       <div className="rounded-xl border border-success bg-success p-4 text-center transition-transform hover:scale-[1.02]">
        <div className="text-3xl font-bold text-success">{parts.past}</div>
        <div className="text-xs font-medium text-success/90">已完成課堂</div>
       </div>
      </div>
     </div>
    ) : null}

    {tab === "students" ? (
     <div className="mx-auto max-w-2xl space-y-3">
      {addStudentErr ? (
       <div
        role="alert"
        className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
       >
        {addStudentErr}
       </div>
      ) : null}
      <div className="flex justify-end">
       <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
        <DialogTrigger asChild>
         <Button type="button">+ 增加學生</Button>
        </DialogTrigger>
        <DialogContent>
         <DialogHeader>
          <DialogTitle>增加學生到本班</DialogTitle>
         </DialogHeader>
         <div className="space-y-3">
          <Input
           placeholder="搜尋姓名 / 學號 / 電話"
           value={studentQuery}
           onChange={(e) => setStudentQuery(e.target.value)}
          />
          <div className="max-h-80 space-y-2 overflow-y-auto">
           {addableStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground">找不到可加入的學生。</p>
           ) : (
            addableStudents.map((s) => (
             <button
              key={s.id}
              type="button"
              disabled={addingStudentId === s.id}
              onClick={() => void onAddStudentToClass(s.id)}
              className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left transition hover:border-primary/40 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
             >
              <span className="min-w-0">
               <span className="block truncate text-sm font-medium">{s.full_name}</span>
               <span className="block truncate text-xs text-muted-foreground">
                {s.student_code ?? "—"} · {s.grade ?? "—"} · {s.student_phone ?? s.parent_phone ?? "—"}
               </span>
              </span>
              <span className="text-xs text-primary">
               {addingStudentId === s.id ? "加入中…" : "加入"}
              </span>
             </button>
            ))
           )}
          </div>
         </div>
        </DialogContent>
       </Dialog>
      </div>
      {students.length === 0 ? (
       <p className="text-sm text-muted-foreground">尚無學生名單。</p>
      ) : (
       students.map((s) => (
        <Link
         key={s.enrollmentId}
         to={`/Students/${s.studentId}`}
         className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
        >
         <div>
          <div className="text-lg font-semibold text-primary">{s.fullName}</div>
          <div className="mt-1 text-sm text-muted-foreground">
           {s.grade ?? "—"} · {s.school ?? "—"} · 報讀：{s.enrollDate ?? "—"}
          </div>
         </div>
         <Tag tone={statusToTagTone(s.status)} size="sm">{s.status}</Tag>
        </Link>
       ))
      )}

      <div className="mt-8 border-t border-border pt-6">
       <h3 className="mb-3 text-sm font-semibold text-foreground">增退紀錄</h3>
       <p className="mb-3 text-xs text-muted-foreground">
        顯示此班別的報讀與退讀事件（含生效日）。表格定義於{" "}
        <code className="rounded bg-muted px-1">20260418120000_baseline.sql</code>；種子見{" "}
        <code className="rounded bg-muted px-1">supabase/seed.sql</code>。
       </p>
       {enrollmentEvents.length === 0 ? (
        <p className="text-sm text-muted-foreground">尚無增退紀錄。</p>
       ) : (
        <ul className="space-y-2">
         {enrollmentEvents.map((ev) => (
          <li
           key={ev.id}
           className={cn(
            "flex flex-col gap-1 rounded-lg border px-3 py-2.5 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
            ev.action === "withdraw"
             ? "border-amber-200 bg-amber-50/70"
             : "border-info bg-info/70"
           )}
          >
           <div className="min-w-0">
            <Link
             to={`/Students/${ev.studentId}`}
             className="font-medium text-primary hover:underline"
            >
             {ev.studentName}
            </Link>
            <span className="text-muted-foreground">
             {" "}
             · {ev.action === "withdraw" ? "退讀" : "報讀"} · 生效{" "}
             <span className="tabular-nums">{ev.effectiveDate}</span>
            </span>
           </div>
           {ev.reason ? (
            <span className="text-xs text-muted-foreground">原因：{ev.reason}</span>
           ) : null}
          </li>
         ))}
        </ul>
       )}
      </div>
     </div>
    ) : null}

    {tab === "schedule" ? (
     <div className="mx-auto max-w-3xl space-y-4">
      {schedActionErr ? (
       <div
        role="alert"
        className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
       >
        {schedActionErr}
       </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
       <div className="flex flex-wrap gap-2">
        {(
         [
          ["future", `未來排程 (${parts.fut})`],
          ["past", `過去排程 (${parts.past})`],
          ["cancel", `取消課堂 (${parts.canc})`],
         ] as const
        ).map(([key, label]) => (
         <button
          key={key}
          type="button"
          onClick={() => setSchedFilter(key)}
          className={cn(
           "rounded-full border px-3 py-1.5 text-sm font-medium transition-all active:scale-95",
           schedFilter === key
            ? "border-primary bg-primary text-primary-foreground shadow-sm"
            : "border-border bg-card hover:bg-muted/70"
          )}
         >
          {label}
         </button>
        ))}
       </div>
       <Dialog open={addSchedOpen} onOpenChange={setAddSchedOpen}>
        <DialogTrigger asChild>
         <Button
          type="button"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
         >
          + 新增排程
         </Button>
        </DialogTrigger>
        <DialogContent>
         <DialogHeader>
          <DialogTitle>新增排程</DialogTitle>
         </DialogHeader>
         <div className="grid gap-3">
          {addSchedErr ? (
           <div
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
           >
            {addSchedErr}
           </div>
          ) : null}
          <p className="text-xs text-muted-foreground">
           建議依全社預設堂數：每格 75 分鐘，由 09:00 起（例：09:00–10:15）。
          </p>
          <div>
           <label className="text-xs text-muted-foreground">日期</label>
           <Input
            type="date"
            className="mt-1"
            value={newSchedDate}
            onChange={(e) => setNewSchedDate(e.target.value)}
           />
          </div>
          <div>
           <label className="text-xs text-muted-foreground">開始</label>
           <Input
            className="mt-1"
            placeholder="09:00"
            value={newSchedStart}
            onChange={(e) => setNewSchedStart(e.target.value)}
           />
          </div>
          <div>
           <label className="text-xs text-muted-foreground">結束</label>
           <Input
            className="mt-1"
            placeholder="10:15"
            value={newSchedEnd}
            onChange={(e) => setNewSchedEnd(e.target.value)}
           />
          </div>
          <Button type="button" disabled={savingAddSched} onClick={() => void addSched()}>
           {savingAddSched ? "建立中…" : "建立"}
          </Button>
         </div>
        </DialogContent>
       </Dialog>
      </div>
      <div className="space-y-2">
       {schedFiltered.length === 0 ? (
        <p className="text-sm text-muted-foreground">此分類尚無排程。</p>
       ) : (
        schedFiltered.map((s) => (
         <div
          key={s.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/30"
         >
          <Link
           to={`/Schedule/${s.id}`}
           className="min-w-0 flex-1 font-medium text-primary underline-offset-4 hover:underline"
          >
           {s.scheduled_date}{" "}
           {s.start_time && s.end_time ? `${s.start_time}-${s.end_time}` : ""}
          </Link>
          <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
           <Select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm transition-colors hover:border-primary/50"
            value={s.status}
            onChange={(e) => void onChangeScheduleStatus(s.id, e.target.value)}
           >
            <option value="預定">預定</option>
            <option value="完成">完成</option>
            <option value="取消">取消</option>
           </Select>
           <button
            type="button"
            className="text-sm text-destructive hover:underline"
            onClick={async () => {
            if (!(await confirmDialog({ title: "刪除排程", description: "刪除此排程？", confirmText: "確認刪除", tone: "destructive" }))) return
            await onDeleteSchedule(s.id)
            }}
           >
            刪除
           </button>
          </div>
         </div>
        ))
       )}
      </div>
     </div>
    ) : null}
   </div>

   <Dialog
    open={editOpen}
    onOpenChange={(open) => {
     setEditOpen(open)
     if (!open) setEditErr(null)
    }}
   >
    <DialogContent className="max-h-[90vh] overflow-y-auto">
     <DialogHeader>
      <DialogTitle>編輯班別</DialogTitle>
     </DialogHeader>
     {cls ? (
      <div className="grid gap-3 sm:grid-cols-2">
       {editErr ? (
        <div
         role="alert"
         className="sm:col-span-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
         {editErr}
        </div>
       ) : null}
       <div className="sm:col-span-2">
        <label className="text-xs text-muted-foreground">科目</label>
        <Input
         className="mt-1"
         value={form.subject ?? ""}
         onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
        />
       </div>
       <div className="sm:col-span-2">
        <label className="text-xs text-muted-foreground">舊課程編號（相容期，可留空）</label>
        <Input
         className="mt-1 font-mono uppercase"
         autoCapitalize="characters"
         spellCheck={false}
         placeholder="例：2526F6CHI1001"
         value={form.course_code ?? ""}
         onChange={(e) => setForm((f) => ({ ...f, course_code: e.target.value }))}
         onBlur={() =>
          setForm((f) => ({
           ...f,
           course_code: normalizeCourseCode(f.course_code ?? "") ?? "",
          }))
         }
        />
        <p className="mt-1 text-xs text-muted-foreground">
         新班別顯示碼由系統管理（course_id + section_code）；此欄位僅作舊資料相容保留。
        </p>
       </div>
       <div>
        <label className="text-xs text-muted-foreground">課程 ID（course_id）</label>
        <Input
         className="mt-1 font-mono"
         value={form.course_id ?? ""}
         onChange={(e) => setForm((f) => ({ ...f, course_id: e.target.value }))}
        />
       </div>
       <div>
        <label className="text-xs text-muted-foreground">班號（section_code）</label>
        <Input
         className="mt-1 font-mono uppercase"
         value={form.section_code ?? ""}
         onChange={(e) => setForm((f) => ({ ...f, section_code: e.target.value.toUpperCase() }))}
        />
       </div>
       <div className="sm:col-span-2">
        <label className="text-xs text-muted-foreground">年級（可多選）</label>
        <Select
         multiple
         size={8}
         className="mt-1 min-h-[8.5rem] w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
         value={gradeSelections}
         onChange={(e) =>
          setGradeSelections(Array.from(e.target.selectedOptions, (o) => o.value))
         }
        >
         {CLASS_GRADE_FORM_OPTIONS.map((g) => (
          <option key={g} value={g}>
           {g}
          </option>
         ))}
        </Select>
        <p className="mt-1 text-xs text-muted-foreground">
         按住 Cmd（Mac）或 Ctrl（Windows）可複選；未選表示不寫入年級（清空）。
        </p>
       </div>
       <div>
        <label className="text-xs text-muted-foreground">逢星期</label>
        <Select
         className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
         value={form.day_of_week ?? ""}
         onChange={(e) =>
          setForm((f) => ({ ...f, day_of_week: e.target.value || null }))
         }
        >
         <option value="">未指定</option>
         {KANBAN_DAY_COLUMNS.map((d) => (
          <option key={d} value={d}>
           {d}
          </option>
         ))}
         {form.day_of_week &&
         !(KANBAN_DAY_COLUMNS as readonly string[]).includes(form.day_of_week) ? (
          <option value={form.day_of_week}>{form.day_of_week}（原資料）</option>
         ) : null}
        </Select>
       </div>
       <div>
        <label className="text-xs text-muted-foreground">時段</label>
        <Input
         className="mt-1"
         value={form.time_slot ?? ""}
         onChange={(e) => setForm((f) => ({ ...f, time_slot: e.target.value }))}
        />
       </div>
       <div>
        <label className="text-xs text-muted-foreground">老師</label>
        <Select
         className="mt-1 flex h-9 w-full rounded-md border border-input px-2 text-sm"
         value={form.teacher_id ?? ""}
         onChange={(e) => setForm((f) => ({ ...f, teacher_id: e.target.value || null }))}
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
        <label className="text-xs text-muted-foreground">課室</label>
        <Select
         className="mt-1 flex h-9 w-full rounded-md border border-input px-2 text-sm"
         value={form.classroom_id ?? ""}
         onChange={(e) => setForm((f) => ({ ...f, classroom_id: e.target.value || null }))}
        >
         <option value="">未指定</option>
         {rooms.map((r) => (
          <option key={r.id} value={r.id}>
           {r.label}
          </option>
         ))}
        </Select>
       </div>
       <div>
        <label className="text-xs text-muted-foreground">收生上限</label>
        <Input
         type="number"
         min={0}
         step={1}
         className="mt-1"
         value={form.capacity ?? ""}
         onChange={(e) => {
          const v = e.target.value
          setForm((f) => {
           if (v === "") return { ...f, capacity: null }
           const n = Number(v)
           if (Number.isNaN(n)) return { ...f, capacity: null }
           return { ...f, capacity: Math.max(0, Math.floor(n)) }
          })
         }}
        />
        <p className="mt-1 text-xs text-muted-foreground">不可為負數；留空表示不設上限。</p>
       </div>
       <div>
        <label className="text-xs text-muted-foreground">每節學費（HKD）</label>
        <div className="mt-1 flex flex-wrap gap-2">
         {PRICE_PRESETS_HKD.map((p) => (
          <Button
           key={p}
           type="button"
           size="sm"
           variant={form.price_per_lesson === p ? "default" : "outline"}
           className={form.price_per_lesson === p ? "" : "bg-background"}
           onClick={() => setForm((f) => ({ ...f, price_per_lesson: p }))}
          >
           {p}
          </Button>
         ))}
        </div>
        <Input
         type="number"
         min={0}
         step={1}
         className="mt-2"
         placeholder="或手動輸入金額（HKD）"
         value={
          form.price_per_lesson != null && !Number.isNaN(form.price_per_lesson)
           ? form.price_per_lesson
           : ""
         }
         onChange={(e) => {
          const v = e.target.value
          setForm((f) => {
           if (v === "") return { ...f, price_per_lesson: null }
           const n = Number(v)
           if (Number.isNaN(n)) return { ...f, price_per_lesson: null }
           return { ...f, price_per_lesson: Math.max(0, n) }
          })
         }}
        />
       </div>
       <div>
        <label className="text-xs text-muted-foreground">開始日期</label>
        <Input
         type="date"
         className="mt-1"
         value={(form.start_date ?? "").slice(0, 10)}
         onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
        />
       </div>
       <div>
        <label className="text-xs text-muted-foreground">結束日期</label>
        <Input
         type="date"
         className="mt-1"
         value={(form.end_date ?? "").slice(0, 10)}
         onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
        />
       </div>
      <div className="sm:col-span-2">
       <label className="text-xs text-muted-foreground">狀態</label>
       <Select
        className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
        value={form.status ?? "進行中"}
        onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
       >
        {(STATUS_CHIPS.filter((s) => s !== "全部") as string[]).map((s) => (
         <option key={s} value={s}>
          {s}
         </option>
        ))}
        {form.status &&
        !(STATUS_CHIPS.filter((s) => s !== "全部") as string[]).includes(form.status) ? (
         <option value={form.status}>{form.status}（原資料）</option>
        ) : null}
       </Select>
      </div>
       <div className="sm:col-span-2 flex gap-2">
        <Button type="button" disabled={savingEdit} onClick={() => void saveClass()}>
         {savingEdit ? "儲存中…" : "儲存"}
        </Button>
        <Button type="button" variant="outline" disabled={savingEdit} onClick={() => setEditOpen(false)}>
         取消
        </Button>
       </div>
      </div>
     ) : null}
    </DialogContent>
   </Dialog>
  </div>
  </DetailLayerShell>
 )
}
