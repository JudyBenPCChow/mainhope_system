import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
 ArrowLeft,
 BookOpen,
 CalendarDays,
 CalendarRange,
 ClipboardCheck,
 Mail,
 Phone,
 User,
} from "lucide-react"

import { DetailLayerShell } from "@/components/detail/DetailLayerShell"
import {
 TeacherWeekTimetable,
 weekItemsFromTeacherScheduleRows,
} from "@/components/teachers/TeacherWeekTimetable"
import { ScheduleListCard } from "@/components/schedules/ScheduleListCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tag } from "@/components/ui/tag"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { formatUnknownError } from "@/lib/formatUnknownError"
import { isSuperAdmin } from "@/lib/mgmtRole"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"
import {
 fetchScheduleStudentHintsByClass,
 type ScheduleStudentHints,
} from "@/services/classQueries"
import {
 fetchTeacherAttendance,
 fetchTeacherClasses,
 fetchTeacherSchedules,
 getTeacherById,
 localYmd,
 partitionSchedules,
 type ScheduleRow,
 type TeacherAttendanceRow,
 type TeacherClassRow,
 type TeacherRecord,
 updateTeacher,
} from "@/services/teacherQueries"

type TabId = "basic" | "classes" | "timetable" | "schedule" | "attendance"

const SUBJECT_SPECIALITY_OPTIONS = [
 "中文",
 "英文",
 "數學",
 "綜合科學",
 "物理",
 "化學",
 "生物",
 "M2",
 "BAFS",
 "中史",
 "歷史",
 "地理",
 "經濟",
 "ICT",
] as const

const TABS: { id: TabId; label: (c: { cl: number; sc: number }) => string; icon: typeof User }[] =
 [
  { id: "basic", label: () => "基本資料", icon: User },
  {
   id: "classes",
   label: ({ cl }) => `任教班別 (${cl})`,
   icon: BookOpen,
  },
  { id: "timetable", label: () => "時間表", icon: CalendarRange },
  {
   id: "schedule",
   label: ({ sc }) => `排程 (${sc})`,
   icon: CalendarDays,
  },
  { id: "attendance", label: () => "點名記錄", icon: ClipboardCheck },
 ]

function money(n: number | null) {
 if (n == null) return "—"
 return `$${n.toLocaleString("zh-Hant-TW")}/節`
}

function monthKey(d: Date): string {
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export function TeacherDetailView() {
 const { teacherId } = useParams<{ teacherId: string }>()
 const navigate = useNavigate()
 const tid = teacherId ?? ""
 const [tab, setTab] = useState<TabId>("basic")
 const [teacher, setTeacher] = useState<TeacherRecord | null>(null)
 const [classes, setClasses] = useState<TeacherClassRow[]>([])
 const [schedules, setSchedules] = useState<ScheduleRow[]>([])
 const [scheduleHints, setScheduleHints] = useState<Map<string, ScheduleStudentHints>>(
  new Map()
 )
 const [hintsLoading, setHintsLoading] = useState(false)
 const [attendance, setAttendance] = useState<TeacherAttendanceRow[]>([])
 const [loading, setLoading] = useState(true)
 const hintsRequestIdRef = useRef(0)
 const [form, setForm] = useState<Partial<TeacherRecord>>({})
 const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
 const [schedFilter, setSchedFilter] = useState<"future" | "past" | "cancel">("future")
 const [attMonth, setAttMonth] = useState(() => monthKey(new Date()))
 const [pageErr, setPageErr] = useState<string | null>(null)
 const [pageOk, setPageOk] = useState<string | null>(null)
 const [partialLoadIssues, setPartialLoadIssues] = useState<string[]>([])
 const [saving, setSaving] = useState(false)

 const today = localYmd()

 const reload = useCallback(async () => {
  if (!tid) return
  setLoading(true)
  setPageErr(null)
  setPartialLoadIssues([])
  try {
   const t = await getTeacherById(tid)
   setTeacher(t)
   if (t) {
    setForm(t)
    setSelectedSubjects(t.subject_speciality ?? [])
   }
   const [clRes, scRes, attRes] = await Promise.allSettled([
    fetchTeacherClasses(tid),
    fetchTeacherSchedules(tid),
    fetchTeacherAttendance(tid),
   ])
   const sc = scRes.status === "fulfilled" ? scRes.value : []
   setClasses(clRes.status === "fulfilled" ? clRes.value : [])
   setSchedules(sc)
   setAttendance(attRes.status === "fulfilled" ? attRes.value : [])
   if (clRes.status === "rejected") {
    setPartialLoadIssues((prev) => [...prev, "任教班別"])
    reportUserFacingError(clRes.reason, {
     source: "TeacherDetailView.reload.classes",
     userMessage: "老師班別資料載入失敗",
    })
   }
   if (scRes.status === "rejected") {
    setPartialLoadIssues((prev) => [...prev, "排程"])
    reportUserFacingError(scRes.reason, {
     source: "TeacherDetailView.reload.schedules",
     userMessage: "老師排程資料載入失敗",
    })
   }
   if (attRes.status === "rejected") {
    setPartialLoadIssues((prev) => [...prev, "點名記錄"])
    reportUserFacingError(attRes.reason, {
     source: "TeacherDetailView.reload.attendance",
     userMessage: "老師點名資料載入失敗",
    })
   }
   setLoading(false)

   const byClass = new Map<string, { id: string; scheduled_date: string }[]>()
   for (const s of sc) {
    if (!s.classId) continue
    const arr = byClass.get(s.classId) ?? []
    arr.push({ id: s.id, scheduled_date: s.scheduledDate })
    byClass.set(s.classId, arr)
   }
   const reqId = ++hintsRequestIdRef.current
   setHintsLoading(true)
   try {
    const hints = await fetchScheduleStudentHintsByClass(byClass)
    if (reqId !== hintsRequestIdRef.current) return
    setScheduleHints(hints)
   } catch (e) {
    if (reqId !== hintsRequestIdRef.current) return
    reportUserFacingError(e, {
     source: "TeacherDetailView.reload.hints",
     userMessage: "排程學生名單載入失敗",
    })
   } finally {
    if (reqId === hintsRequestIdRef.current) setHintsLoading(false)
   }
  } catch (e) {
   reportUserFacingError(e, { source: "TeacherDetailView.reload", setErr: setPageErr })
   setLoading(false)
  }
 }, [tid])

 useEffect(() => {
  void reload()
 }, [reload])

 const parts = useMemo(() => partitionSchedules(schedules, today), [schedules, today])

 const pastDoneCount = useMemo(() => {
  return schedules.filter(
   (s) => s.scheduledDate < today && !s.status.includes("取消")
  ).length
 }, [schedules, today])

 const futureSchedCount = useMemo(() => {
  return schedules.filter((s) => s.scheduledDate >= today && !s.status.includes("取消")).length
 }, [schedules, today])

 const filteredSchedules = useMemo(() => {
  if (schedFilter === "cancel") return schedules.filter((s) => s.status.includes("取消"))
  if (schedFilter === "past")
   return schedules.filter((s) => s.scheduledDate < today && !s.status.includes("取消"))
  return schedules.filter((s) => s.scheduledDate >= today && !s.status.includes("取消"))
 }, [schedules, schedFilter, today])

 const attInMonth = useMemo(
  () => attendance.filter((a) => a.date.startsWith(attMonth)),
  [attendance, attMonth]
 )

 const attMonthStats = useMemo(() => {
  const dates = new Set(attInMonth.map((a) => a.date))
  const present = attInMonth.filter(
   (a) => !a.status.includes("缺席") && !a.status.includes("請假")
  ).length
  return { sessionDays: dates.size, presentRows: present }
 }, [attInMonth])

 const attGrouped = useMemo(() => {
  const m = new Map<string, TeacherAttendanceRow[]>()
  for (const a of attInMonth) {
   const arr = m.get(a.date) ?? []
   arr.push(a)
   m.set(a.date, arr)
  }
  return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]))
 }, [attInMonth])

 const bumpMonth = (delta: number) => {
  const [y, mo] = attMonth.split("-").map(Number)
  const d = new Date(y, mo - 1 + delta, 1)
  setAttMonth(monthKey(d))
 }

 const saveBasic = async () => {
  if (!tid || !teacher) return
  const subjects = selectedSubjects
  setSaving(true)
  setPageErr(null)
  setPageOk(null)
  try {
   const patch: Parameters<typeof updateTeacher>[1] = {
    full_name: form.full_name ?? teacher.full_name,
    english_name: form.english_name,
    phone: form.phone,
    email: form.email,
    status: form.status,
    subject_speciality: subjects.length ? subjects : null,
    remarks: form.remarks,
   }
   if (isSuperAdmin()) {
    const raw = form.abbr != null ? String(form.abbr).trim() : ""
    patch.abbr = raw === "" ? null : raw.slice(0, 64)
   }
   const updated = await updateTeacher(tid, patch)
   setTeacher(updated)
   setForm(updated)
   setSelectedSubjects(updated.subject_speciality ?? [])
   setPageOk("已儲存")
   window.setTimeout(() => setPageOk(null), 4000)
  } catch (e) {
   const msg = formatUnknownError(e)
   reportUserFacingError(e, {
    source: "TeacherDetailView.saveBasic",
    setErr: setPageErr,
    userMessage: msg,
   })
  } finally {
   setSaving(false)
  }
 }

 if (!tid) {
  return (
   <DetailLayerShell
    variant="teacher"
    onDismiss={() => navigate("/Teachers")}
    layerLabel={null}
   >
    <p className="p-6 text-muted-foreground">無效的路由</p>
   </DetailLayerShell>
  )
 }

 if (!loading && !teacher) {
  return (
   <DetailLayerShell variant="teacher" onDismiss={() => navigate("/Teachers")} layerLabel="老師詳情">
    <div className="p-6">
     <p className="text-muted-foreground">找不到此老師。</p>
     <Button type="button" variant="outline" className="mt-4" asChild>
      <Link to="/Teachers">返回列表</Link>
     </Button>
    </div>
   </DetailLayerShell>
  )
 }

 const tabCounts = { cl: classes.length, sc: schedules.length }

 return (
  <DetailLayerShell
   variant="teacher"
   onDismiss={() => navigate("/Teachers")}
   layerLabel="老師詳情 · 次層檢視"
  >
  <div className="flex min-h-full flex-col bg-background">
   {pageErr || pageOk || partialLoadIssues.length > 0 ? (
    <div className="sticky top-0 z-20 flex flex-col border-b border-border/70 bg-background/95 shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-background/80">
     {pageErr ? (
      <div
       role="alert"
       tabIndex={-1}
       className="border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive outline-none focus-visible:ring-2 focus-visible:ring-destructive/30 md:px-6"
      >
       {pageErr}
      </div>
     ) : null}
     {pageOk ? (
      <div
       role="status"
      className="border-b border-success bg-success px-4 py-2 text-sm text-success-foreground md:px-6"
      >
       {pageOk}
      </div>
     ) : null}
     {partialLoadIssues.length > 0 ? (
      <div role="alert" className="border-b border-warning/30 bg-warning/10 px-4 py-2 text-sm text-warning md:px-6">
       部分資料載入失敗：{partialLoadIssues.join("、")}。你仍可先查看其餘已載入內容。
      </div>
     ) : null}
    </div>
   ) : null}
   <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-4 text-white shadow-md md:px-6">
    <div className="flex flex-wrap items-start gap-4">
     <Button
      type="button"
      variant="secondary"
      size="sm"
      className="shrink-0 bg-white/90 text-foreground hover:bg-white"
      onClick={() => navigate("/Teachers")}
     >
      <ArrowLeft className="h-4 w-4" />
      返回
     </Button>
     <div className="flex min-w-0 flex-1 items-start gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
       <User className="h-6 w-6" />
      </div>
      <div className="min-w-0">
       {loading ? (
        <p className="text-lg">載入中…</p>
       ) : teacher ? (
        <>
         <h1 className="text-xl font-bold md:text-2xl">
          {teacher.full_name}
          {teacher.english_name ? (
           <span className="ml-2 text-base font-normal text-white/90">
            {teacher.english_name}
           </span>
          ) : null}
         </h1>
         <Tag tone={statusToTagTone(teacher.status)} size="sm" className="mt-2 bg-white/20 text-white">
          {teacher.status ?? "—"}
         </Tag>
        </>
       ) : null}
      </div>
     </div>
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
          ? "border-b-2 border-success text-success"
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
    {tab === "basic" && teacher ? (
     <div className="mx-auto max-w-4xl space-y-8">
      <div className="max-w-xl">
       <label className="text-xs font-medium text-muted-foreground">
        內部簡稱（ABBR）
        {!isSuperAdmin() ? (
         <span className="ml-2 font-normal text-muted-foreground">（僅外星人可編輯）</span>
        ) : null}
       </label>
       {isSuperAdmin() ? (
        <Input
         className="mt-1 font-mono text-sm uppercase"
         spellCheck={false}
         maxLength={64}
         placeholder="例：JUDY、CFAN"
         value={form.abbr ?? ""}
         onChange={(e) => setForm((f) => ({ ...f, abbr: e.target.value }))}
        />
       ) : (
        <p className="mt-1 rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-sm">
         {teacher.abbr?.trim() ? teacher.abbr : "—"}
        </p>
       )}
       <p className="mt-1 text-xs text-muted-foreground">
        供內部辨識或串接用；最多 64 字元。
       </p>
      </div>

      <div className="flex flex-wrap gap-6 text-sm">
       <div className="flex items-center gap-2">
        <Phone className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">電話</span>
        <Input
         className="w-40"
         value={form.phone ?? ""}
         onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
       </div>
       <div className="flex min-w-0 flex-1 items-center gap-2">
        <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="text-muted-foreground">電郵</span>
        <Input
         className="min-w-0 flex-1"
         type="email"
         value={form.email ?? ""}
         onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
       </div>
      </div>

      <div>
       <h2 className="mb-2 text-sm font-semibold">專長科目</h2>
       <div className="flex flex-wrap gap-2">
        {SUBJECT_SPECIALITY_OPTIONS.map((subject) => {
         const active = selectedSubjects.includes(subject)
         return (
          <button
           key={subject}
           type="button"
           onClick={() => {
            setSelectedSubjects((prev) => {
             if (prev.includes(subject)) return prev.filter((x) => x !== subject)
             return SUBJECT_SPECIALITY_OPTIONS.filter((x) => [...prev, subject].includes(x))
            })
           }}
           className={cn(
            "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
            active
             ? "border-info bg-info text-info-foreground"
             : "border-border bg-card text-foreground hover:bg-muted/80"
           )}
           aria-pressed={active}
          >
           {subject}
          </button>
         )
        })}
       </div>
       <div className="mt-2 flex flex-wrap gap-1">
        {selectedSubjects.length === 0 ? (
         <span className="text-xs text-muted-foreground">尚未選擇專長科目</span>
        ) : (
         selectedSubjects.map((sub) => (
          <Tag key={sub} tone="info" size="sm">{sub}</Tag>
         ))
        )}
       </div>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-3">
       <div className="rounded-xl border border-success bg-success p-2.5 text-center text-success-foreground shadow-sm md:p-4">
        <div className="text-xl font-bold text-success-foreground md:text-3xl">{classes.length}</div>
        <div className="text-[11px] font-medium text-success-foreground/90 md:text-xs">任教班別</div>
       </div>
       <div className="rounded-xl border border-info bg-info p-2.5 text-center text-info-foreground shadow-sm md:p-4">
        <div className="text-xl font-bold text-info-foreground md:text-3xl">{futureSchedCount}</div>
        <div className="text-[11px] font-medium text-info-foreground/90 md:text-xs">未來排程</div>
       </div>
       <div className="rounded-xl border border-teal-200 bg-teal-50 p-2.5 text-center shadow-sm md:p-4">
        <div className="text-xl font-bold text-teal-800 md:text-3xl">{pastDoneCount}</div>
        <div className="text-[11px] font-medium text-teal-900/90 md:text-xs">已上堂數</div>
       </div>
      </div>

      <div className="max-w-md">
       <label className="text-xs font-medium text-muted-foreground">狀態</label>
       <Select
        className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
        value={form.status === "非在職" ? "非在職" : "在職"}
        onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
       >
        <option value="在職">在職</option>
        <option value="非在職">非在職</option>
       </Select>
      </div>
      <div>
       <label className="text-xs font-medium text-muted-foreground">備註</label>
       <Textarea
        className="mt-1"
        value={form.remarks ?? ""}
        onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
       />
      </div>
      <Button type="button" disabled={saving} onClick={() => void saveBasic()}>
       {saving ? "儲存中…" : "儲存變更"}
      </Button>
     </div>
    ) : null}

    {tab === "classes" ? (
     <div className="mx-auto max-w-3xl space-y-3">
      {classes.length === 0 ? (
       <p className="text-sm text-muted-foreground">尚未指派任教班別。</p>
      ) : (
       classes.map((c) => (
        <Link
         key={c.id}
         to={`/Classes/${c.id}`}
         className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/20"
        >
         <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
           <div className="text-lg font-semibold text-primary underline-offset-4 hover:underline">
            {c.subject}
           </div>
           <div className="mt-1 text-sm text-muted-foreground">
            {[c.courseCode, c.dayOfWeek, c.timeSlot, (c.grades ?? []).join("、")]
             .filter(Boolean)
             .join(" ")}
           </div>
           <div className="mt-2 text-sm text-muted-foreground">
            {c.studentCount} 位學生
           </div>
          </div>
          <div className="text-lg font-semibold text-info">
           {money(c.pricePerLesson)}
          </div>
         </div>
        </Link>
       ))
      )}
     </div>
    ) : null}

    {tab === "timetable" ? (
     <TeacherWeekTimetable items={weekItemsFromTeacherScheduleRows(schedules)} />
    ) : null}

    {tab === "schedule" ? (
     <div className="mx-auto max-w-3xl space-y-4">
      <div className="grid grid-cols-2 gap-2 md:gap-3">
       <div className="rounded-xl border border-info bg-info p-2.5 text-center text-info-foreground md:p-4">
        <div className="text-xl font-bold text-info-foreground md:text-3xl">{parts.todayCount}</div>
        <div className="text-[11px] text-info-foreground/90 md:text-sm">本日排程</div>
       </div>
       <div className="rounded-xl border border-info bg-info p-2.5 text-center text-info-foreground md:p-4">
        <div className="text-xl font-bold text-info-foreground md:text-3xl">{parts.next7Count}</div>
        <div className="text-[11px] text-info-foreground/90 md:text-sm">未來 7 天</div>
       </div>
      </div>
      <div className="flex flex-wrap gap-2">
       {(
        [
         ["future", `未來排程 (${parts.futureCount})`],
         ["past", `過去排程 (${parts.pastCount})`],
         ["cancel", `取消課堂 (${parts.cancelledCount})`],
        ] as const
       ).map(([key, label]) => (
        <button
         key={key}
         type="button"
         onClick={() => setSchedFilter(key)}
         className={cn(
          "rounded-full border px-3 py-1.5 text-sm font-medium",
          schedFilter === key
           ? "border-info bg-info text-white"
           : "border-border bg-muted/50 text-foreground hover:bg-muted"
         )}
        >
         {label}
        </button>
       ))}
      </div>
      <div className="space-y-3">
       {filteredSchedules.length === 0 ? (
        <p className="text-sm text-muted-foreground">此分類尚無排程。</p>
       ) : (
        filteredSchedules.map((s) => {
         const hints = scheduleHints.get(s.id)
         return (
          <Link key={s.id} to={`/Schedule/${s.id}`} className="block">
           <ScheduleListCard
            sessionNumber={s.sessionNumber}
            scheduledDate={s.scheduledDate}
            startTime={s.startTime}
            endTime={s.endTime}
            attendingNames={hints?.attendingNames}
            leaveNames={hints?.leaveNames}
            namesLoading={hintsLoading}
            subtitle={
             <>
              {s.subject}{" "}
              {s.courseCode ? (
               <span className="font-normal">{s.courseCode}</span>
              ) : null}
              <span className="mt-0.5 block">
               位置：{s.classroomName?.trim() ? s.classroomName : "未分配"}
               {s.teachingNotes?.trim() ? " · 已有教學紀錄" : ""}
              </span>
             </>
            }
            controls={<Tag tone={statusToTagTone(s.status)} size="sm">{s.status}</Tag>}
           />
          </Link>
         )
        })
       )}
      </div>
     </div>
    ) : null}

    {tab === "attendance" ? (
     <div className="mx-auto max-w-3xl space-y-4">
      <div className="grid grid-cols-2 gap-2 md:gap-3">
       <div className="rounded-xl border border-teal-200 bg-teal-50 p-2.5 text-center md:p-4">
        <div className="text-xl font-bold text-teal-800 md:text-3xl">{attMonthStats.sessionDays}</div>
        <div className="text-[11px] text-teal-900/90 md:text-sm">本月課堂</div>
       </div>
       <div className="rounded-xl border border-success bg-success p-2.5 text-center text-success-foreground md:p-4">
        <div className="text-xl font-bold text-success-foreground md:text-3xl">
         {attMonthStats.presentRows}
        </div>
        <div className="text-[11px] text-success-foreground/90 md:text-sm">本月出席筆數</div>
       </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
       <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => bumpMonth(-1)}>
         &lt;
        </Button>
        <span className="min-w-[8rem] text-center text-sm font-medium">{attMonth}</span>
        <Button type="button" variant="outline" size="sm" onClick={() => bumpMonth(1)}>
         &gt;
        </Button>
       </div>
       <span className="text-sm text-muted-foreground">{attInMonth.length} 筆記錄</span>
      </div>
      {attGrouped.length === 0 ? (
       <p className="py-8 text-center text-sm text-muted-foreground">尚無點名紀錄</p>
      ) : (
       <div className="space-y-4">
        {attGrouped.map(([date, list]) => {
         const subj = list[0]?.subject ?? ""
         const present = list.filter(
          (x) => !x.status.includes("缺席") && !x.status.includes("請假")
         ).length
         return (
          <div key={date} className="overflow-hidden rounded-xl border border-border">
           <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/60 px-3 py-2 text-sm">
            <span className="font-medium">
              {date} {subj}
            </span>
            <span className="text-muted-foreground">{present} 人出席</span>
           </div>
           <ul className="divide-y divide-border bg-card">
            {list.map((a) => (
             <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
             >
              <div>
               <span className="font-medium">{a.studentName}</span>
               <span className="ml-2 text-muted-foreground">
                {a.studentGrade ?? ""} {a.subject}
               </span>
               {a.remarks ? (
                <span className="ml-2 text-xs text-muted-foreground">
                 {a.remarks}
                </span>
               ) : null}
              </div>
              <Tag tone={statusToTagTone(a.status)} size="sm">
               {a.status}
              </Tag>
             </li>
            ))}
           </ul>
          </div>
         )
        })}
       </div>
      )}
     </div>
    ) : null}
   </div>
  </div>
  </DetailLayerShell>
 )
}
