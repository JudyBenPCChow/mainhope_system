import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { CalendarDays, GraduationCap, Plus, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tag } from "@/components/ui/tag"
import { Select } from "@/components/ui/select"
import { useAppConfirm } from "@/lib/appConfirm"
import { formatClassLabel } from "@/lib/courseLabel"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { statusToTagTone } from "@/lib/statusTag"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import { fetchAllClasses, fetchClassSchedules, type ClassRecord } from "@/services/classQueries"
import { listStudents } from "@/services/queries"
import { localYmd } from "@/services/scheduleQueries"
import { fetchAllTeachers, type TeacherRecord } from "@/services/teacherQueries"
import {
 deleteTrialSession,
 fetchTrialDashboardStats,
 fetchTrialsWithRelations,
 insertTrialSession,
 trialStatusCategory,
 trialTypeCategory,
 updateTrialSession,
 type TrialDashboardStats,
 type TrialManageRow,
} from "@/services/trialQueries"

type StatusTab = "all" | "booked" | "done" | "cancel"
type TypeTab = "all" | "free" | "half" | "full"

function matchesStatusTab(r: TrialManageRow, tab: StatusTab): boolean {
 if (tab === "all") return true
 return trialStatusCategory(r.status) === tab
}

function matchesTypeTab(r: TrialManageRow, tab: TypeTab): boolean {
 if (tab === "all") return true
 return trialTypeCategory(r.trial_type) === tab
}

export function TrialSessionsView() {
 const { confirmDialog } = useAppConfirm()
 const [rows, setRows] = useState<TrialManageRow[]>([])
 const [stats, setStats] = useState<TrialDashboardStats>({ todayCount: 0, weekCount: 0 })
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)

 const [statusTab, setStatusTab] = useState<StatusTab>("all")
 const [typeTab, setTypeTab] = useState<TypeTab>("all")
 const [filterDateFrom, setFilterDateFrom] = useState("")
 const [filterDateTo, setFilterDateTo] = useState("")
 const [filterSubject, setFilterSubject] = useState("all")
 const [filterTeacherId, setFilterTeacherId] = useState("all")
 const [filterGrade, setFilterGrade] = useState("all")

 const [teachers, setTeachers] = useState<TeacherRecord[]>([])

 const [addOpen, setAddOpen] = useState(false)
 const [addStudentId, setAddStudentId] = useState("")
 const [addClassId, setAddClassId] = useState("")
 const [addTrialDate, setAddTrialDate] = useState("")
 const [addScheduleId, setAddScheduleId] = useState("")
 const [addTrialType, setAddTrialType] = useState("免費試堂")
 const [addRemarks, setAddRemarks] = useState("")
 const [addSaving, setAddSaving] = useState(false)
 const [addErr, setAddErr] = useState<string | null>(null)
 const [classPickList, setClassPickList] = useState<ClassRecord[]>([])
 const [studentPickList, setStudentPickList] = useState<{ id: string; label: string }[]>([])
 const [schedOptions, setSchedOptions] = useState<{ id: string; label: string }[]>([])

 const reload = useCallback(async () => {
  if (!isSupabaseConfigured) return
  setLoading(true)
  setErr(null)
  try {
   const [list, st, tch] = await Promise.all([
    fetchTrialsWithRelations(),
    fetchTrialDashboardStats(),
    fetchAllTeachers(),
   ])
   setRows(list)
   setStats(st)
   setTeachers(tch)
  } catch (e) {
   reportUserFacingError(e, { source: "TrialSessionsView.reload", setErr })
   setRows([])
  } finally {
   setLoading(false)
  }
 }, [])

 useEffect(() => {
  void reload()
 }, [reload])

 useEffect(() => {
  if (!addOpen) return
  setAddErr(null)
  void fetchAllClasses().then((cls) => {
   setClassPickList(cls)
   setAddClassId((c) => c || cls[0]?.id || "")
  })
  void listStudents().then((raw) => {
   const sl = (raw as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    label: `${String(r.full_name ?? "—")}（${String(r.grade ?? "—")}）`,
   }))
   setStudentPickList(sl)
   setAddStudentId((p) => p || sl[0]?.id || "")
  })
  setAddTrialDate(localYmd())
  setAddScheduleId("")
  setAddTrialType("免費試堂")
  setAddRemarks("")
 }, [addOpen])

 useEffect(() => {
  if (!addOpen || !addClassId || !addTrialDate) {
   setSchedOptions([])
   setAddScheduleId("")
   return
  }
  void fetchClassSchedules(addClassId).then((sched) => {
   const day = sched.filter((s) => s.scheduled_date === addTrialDate && !s.status.includes("取消"))
   const opts = day.map((s) => ({
    id: s.id,
    label: `${s.scheduled_date} ${s.start_time ?? "—"}–${s.end_time ?? "—"}`,
   }))
   setSchedOptions(opts)
   setAddScheduleId((prev) => {
    if (prev && opts.some((o) => o.id === prev)) return prev
    return opts[0]?.id ?? ""
   })
  })
 }, [addOpen, addClassId, addTrialDate])

 const subjectOptions = useMemo(() => {
  const s = new Set<string>()
  for (const r of rows) {
   if (r.class_subject) s.add(r.class_subject)
  }
  return [...s].sort((a, b) => a.localeCompare(b, "zh-Hant"))
 }, [rows])

 const gradeOptions = useMemo(() => {
  const g = new Set<string>()
  for (const r of rows) {
   if (r.student_grade) g.add(r.student_grade)
  }
  return [...g].sort((a, b) => a.localeCompare(b, "zh-Hant"))
 }, [rows])

 const statusCounts = useMemo(() => {
  const all = rows.length
  let booked = 0
  let done = 0
  let cancel = 0
  for (const r of rows) {
   const c = trialStatusCategory(r.status)
   if (c === "cancel") cancel++
   else if (c === "done") done++
   else booked++
  }
  return { all, booked, done, cancel }
 }, [rows])

 const typeCounts = useMemo(() => {
  const all = rows.length
  let free = 0
  let half = 0
  let full = 0
  for (const r of rows) {
   const c = trialTypeCategory(r.trial_type)
   if (c === "free") free++
   else if (c === "half") half++
   else if (c === "full") full++
  }
  return { all, free, half, full }
 }, [rows])

 const filtered = useMemo(() => {
  return rows.filter((r) => {
   if (!matchesStatusTab(r, statusTab)) return false
   if (!matchesTypeTab(r, typeTab)) return false
   if (filterSubject !== "all" && (r.class_subject ?? "") !== filterSubject) return false
   if (filterTeacherId !== "all" && (r.teacher_id ?? "") !== filterTeacherId) return false
   if (filterGrade !== "all" && (r.student_grade ?? "") !== filterGrade) return false
   if (filterDateFrom && r.trial_date < filterDateFrom) return false
   if (filterDateTo && r.trial_date > filterDateTo) return false
   return true
  })
 }, [rows, statusTab, typeTab, filterSubject, filterTeacherId, filterGrade, filterDateFrom, filterDateTo])

 const openAdd = () => setAddOpen(true)

 const submitAdd = async () => {
  if (!addStudentId || !addClassId || !addTrialDate || !addScheduleId) {
   setAddErr("請選擇學生、班別、試堂日期，並確認該日有可用的排程")
   return
  }
  setAddSaving(true)
  setAddErr(null)
  try {
   await insertTrialSession({
    student_id: addStudentId,
    class_id: addClassId,
    schedule_id: addScheduleId,
    trial_date: addTrialDate,
    trial_type: addTrialType,
    status: "已預約",
    remarks: addRemarks || null,
   })
   setAddOpen(false)
   await reload()
  } catch (e) {
   reportUserFacingError(e, { source: "TrialSessionsView.onAdd", setErr: setAddErr, userMessage: "新增失敗" })
  } finally {
   setAddSaving(false)
  }
 }

 if (!isSupabaseConfigured) {
  return (
   <div role="alert" className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
    尚未設定 Supabase（請建立 <code className="rounded bg-white/60 px-1">.env</code>）。
   </div>
  )
 }

 return (
  <div className="space-y-4">
   <header className="flex flex-wrap items-start justify-between gap-3">
    <div>
     <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
      <Sparkles className="h-7 w-7 text-info" aria-hidden />
      試堂紀錄
      <Tag tone="info" size="sm">{rows.length} 筆</Tag>
     </h1>
     <p className="mt-1 text-sm text-muted-foreground">試堂資料與排程連結；點學生或班別可開啟詳情頁。</p>
    </div>
    <Button type="button" className="gap-1 bg-info text-white hover:bg-info" onClick={openAdd}>
     <Plus className="h-4 w-4" />
     新增試堂
    </Button>
   </header>

   {err ? (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
     {err}
    </div>
   ) : null}

   <section className="grid gap-3 sm:grid-cols-2" aria-label="試堂概覽">
    <div className="rounded-xl border border-info/80 bg-info/60 p-4 shadow-sm">
     <div className="flex items-center gap-2 text-sm font-medium text-info/90">
      <CalendarDays className="h-4 w-4" />
      今天試堂人數
     </div>
     <p className="mt-2 text-3xl font-bold tabular-nums text-info">{stats.todayCount}</p>
     <p className="mt-1 text-xs text-muted-foreground">試堂日期為今天之筆數（含各狀態）</p>
    </div>
    <div className="rounded-xl border border-info/80 bg-info/60 p-4 shadow-sm">
     <div className="flex items-center gap-2 text-sm font-medium text-info/90">
      <GraduationCap className="h-4 w-4" />
      本星期試堂人數
     </div>
     <p className="mt-2 text-3xl font-bold tabular-nums text-info">{stats.weekCount}</p>
     <p className="mt-1 text-xs text-muted-foreground">本週一至週日（依試堂日期）之筆數</p>
    </div>
   </section>

   <div className="space-y-3 rounded-xl border border-border bg-card p-3 shadow-sm">
    <div className="flex flex-col gap-2">
     <span className="text-xs font-medium text-muted-foreground">狀態</span>
     <div className="flex flex-wrap gap-2" role="tablist">
      {(
       [
        ["all", `全部 ${statusCounts.all}`],
        ["booked", `已預約 ${statusCounts.booked}`],
        ["done", `已完成 ${statusCounts.done}`],
        ["cancel", `取消 ${statusCounts.cancel}`],
       ] as const
      ).map(([id, label]) => (
       <button
        key={id}
        type="button"
        role="tab"
        aria-selected={statusTab === id}
        onClick={() => setStatusTab(id)}
        className={cn(
         "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
         statusTab === id
          ? "border-info bg-info text-white shadow-sm"
          : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
        )}
       >
        {label}
       </button>
      ))}
     </div>
    </div>
    <div className="flex flex-col gap-2 border-t border-dashed border-border pt-3">
     <span className="text-xs font-medium text-muted-foreground">類型</span>
     <div className="flex flex-wrap gap-2" role="tablist">
      {(
       [
        ["all", `全部 ${typeCounts.all}`],
        ["free", `免費試堂 ${typeCounts.free}`],
        ["half", `半價試堂 ${typeCounts.half}`],
        ["full", `原價試堂 ${typeCounts.full}`],
       ] as const
      ).map(([id, label]) => (
       <button
        key={id}
        type="button"
        role="tab"
        aria-selected={typeTab === id}
        onClick={() => setTypeTab(id)}
        className={cn(
         "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
         typeTab === id
          ? "border-info bg-info text-white shadow-sm"
          : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
        )}
       >
        {label}
       </button>
      ))}
     </div>
    </div>
    <div className="flex flex-wrap items-end gap-2 border-t border-dashed border-border pt-3">
     <label className="grid gap-1 text-xs text-muted-foreground">
      <span>試堂日起</span>
      <Input
       type="date"
       value={filterDateFrom}
       onChange={(e) => setFilterDateFrom(e.target.value)}
       className="h-9 w-[11rem]"
      />
     </label>
     <label className="grid gap-1 text-xs text-muted-foreground">
      <span>試堂日迄</span>
      <Input
       type="date"
       value={filterDateTo}
       onChange={(e) => setFilterDateTo(e.target.value)}
       className="h-9 w-[11rem]"
      />
     </label>
     <label className="grid gap-1 text-xs text-muted-foreground">
      <span>科目</span>
      <Select
       className="h-9 min-w-[8rem] rounded-md border border-input bg-background px-2 text-sm"
       value={filterSubject}
       onChange={(e) => setFilterSubject(e.target.value)}
      >
       <option value="all">全部科目</option>
       {subjectOptions.map((sub) => (
        <option key={sub} value={sub}>
         {sub}
        </option>
       ))}
      </Select>
     </label>
     <label className="grid gap-1 text-xs text-muted-foreground">
      <span>老師</span>
      <Select
       className="h-9 min-w-[10rem] rounded-md border border-input bg-background px-2 text-sm"
       value={filterTeacherId}
       onChange={(e) => setFilterTeacherId(e.target.value)}
      >
       <option value="all">全部老師</option>
       {teachers.map((t) => (
        <option key={t.id} value={t.id}>
         {t.full_name}
        </option>
       ))}
      </Select>
     </label>
     <label className="grid gap-1 text-xs text-muted-foreground">
      <span>年級</span>
      <Select
       className="h-9 min-w-[8rem] rounded-md border border-input bg-background px-2 text-sm"
       value={filterGrade}
       onChange={(e) => setFilterGrade(e.target.value)}
      >
       <option value="all">全部年級</option>
       {gradeOptions.map((g) => (
        <option key={g} value={g}>
         {g}
        </option>
       ))}
      </Select>
     </label>
    </div>
   </div>

   {loading ? (
    <p className="text-sm text-muted-foreground">載入中…</p>
   ) : filtered.length === 0 ? (
    <p className="py-12 text-center text-sm text-muted-foreground">此條件下沒有紀錄</p>
   ) : (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
     <table className="w-full min-w-[880px] table-fixed border-collapse text-sm">
      <thead>
       <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
        <th className="w-[12%] px-3 py-2 font-medium">日期</th>
        <th className="w-[16%] px-3 py-2 font-medium">學生</th>
        <th className="w-[20%] px-3 py-2 font-medium">班別</th>
        <th className="w-[12%] px-3 py-2 font-medium">時間</th>
        <th className="w-[10%] px-3 py-2 font-medium">類型</th>
        <th className="w-[10%] px-3 py-2 font-medium">狀態</th>
        <th className="w-[12%] px-3 py-2 font-medium">備註</th>
        <th className="w-[8%] px-3 py-2 font-medium">操作</th>
       </tr>
      </thead>
      <tbody>
       {filtered.map((r) => (
        <tr key={r.id} className="border-b border-border last:border-0">
         <td className="px-3 py-2 align-top tabular-nums text-muted-foreground">{r.trial_date}</td>
         <td className="px-3 py-2 align-top">
          <Link to={`/Students/${r.student_id}`} className="font-medium text-info hover:underline">
           {r.student_name ?? "—"}
          </Link>
          <div className="text-xs text-muted-foreground">{r.student_grade ?? "—"}</div>
         </td>
         <td className="px-3 py-2 align-top">
          <Link to={`/Classes/${r.class_id}`} className="font-medium text-info hover:underline">
           {r.class_subject ?? "—"}
          </Link>
          {r.course_code_full ? (
           <div className="font-mono text-xs text-muted-foreground">{r.course_code_full}</div>
          ) : null}
         </td>
         <td className="px-3 py-2 align-top tabular-nums text-muted-foreground">
          {r.sched_start && r.sched_end ? `${r.sched_start}–${r.sched_end}` : "—"}
         </td>
         <td className="px-3 py-2 align-top">
          <Tag tone={statusToTagTone(r.trial_type)} size="sm">
           {r.trial_type}
          </Tag>
         </td>
         <td className="px-3 py-2 align-top" onClick={(e) => e.stopPropagation()}>
          <Select
           className="h-9 w-full min-w-[6.5rem] text-xs"
           value={r.status}
           onChange={async (e) => {
            await updateTrialSession(r.id, { status: e.target.value })
            await reload()
           }}
          >
           <option value="已預約">已預約</option>
           <option value="已完成">已完成</option>
           <option value="取消">取消</option>
          </Select>
         </td>
         <td className="max-w-[10rem] px-3 py-2 align-top text-xs text-muted-foreground">
          {r.remarks ?? "—"}
         </td>
         <td className="px-3 py-2 align-top">
          <button
           type="button"
           className="text-xs font-medium text-destructive hover:underline"
           onClick={async () => {
           if (!(await confirmDialog({ title: "刪除試堂紀錄", description: "確定刪除此筆試堂？", confirmText: "確認刪除", tone: "destructive" }))) return
            await deleteTrialSession(r.id)
            await reload()
           }}
          >
           刪除
          </button>
         </td>
        </tr>
       ))}
      </tbody>
     </table>
     <div className="border-t border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
      共 {filtered.length} 筆試堂紀錄
      {filtered.length !== rows.length ? `（全部 ${rows.length} 筆）` : null}
     </div>
    </div>
   )}

   <Dialog open={addOpen} onOpenChange={setAddOpen}>
    <DialogContent className="max-w-md">
     <DialogHeader>
      <DialogTitle>新增試堂</DialogTitle>
     </DialogHeader>
     <div className="grid gap-3 text-sm">
      <label className="grid gap-1">
       <span className="text-muted-foreground">學生</span>
       <Select
        className="h-9 w-full rounded-md border border-input px-2"
        value={addStudentId}
        onChange={(e) => setAddStudentId(e.target.value)}
       >
        {studentPickList.map((s) => (
         <option key={s.id} value={s.id}>
          {s.label}
         </option>
        ))}
       </Select>
      </label>
      <label className="grid gap-1">
       <span className="text-muted-foreground">班別</span>
       <Select
        className="h-9 w-full rounded-md border border-input px-2"
        value={addClassId}
        onChange={(e) => setAddClassId(e.target.value)}
       >
        {classPickList.map((c) => (
         <option key={c.id} value={c.id}>
          {formatClassLabel({
           subject: c.subject,
           courseCode: c.course_code_full,
           courseName: c.course_name,
          })}
         </option>
        ))}
       </Select>
      </label>
      <label className="grid gap-1">
       <span className="text-muted-foreground">試堂日期</span>
       <Input type="date" value={addTrialDate} onChange={(e) => setAddTrialDate(e.target.value)} className="h-9" />
      </label>
      <label className="grid gap-1">
       <span className="text-muted-foreground">對應排程（該班當日堂）</span>
       <Select
        className="h-9 w-full rounded-md border border-input px-2"
        value={addScheduleId}
        onChange={(e) => setAddScheduleId(e.target.value)}
        disabled={schedOptions.length === 0}
       >
        {schedOptions.length === 0 ? (
         <option value="">該日無排程或已全部取消</option>
        ) : (
         schedOptions.map((o) => (
          <option key={o.id} value={o.id}>
           {o.label}
          </option>
         ))
        )}
       </Select>
      </label>
      <label className="grid gap-1">
       <span className="text-muted-foreground">試堂類型</span>
       <Select
        className="h-9 w-full rounded-md border border-input px-2"
        value={addTrialType}
        onChange={(e) => setAddTrialType(e.target.value)}
       >
        <option value="免費試堂">免費試堂</option>
        <option value="半價試堂">半價試堂</option>
        <option value="原價試堂">原價試堂</option>
        <option value="體驗課">體驗課</option>
       </Select>
      </label>
      <label className="grid gap-1">
       <span className="text-muted-foreground">備註（選填）</span>
       <Input value={addRemarks} onChange={(e) => setAddRemarks(e.target.value)} className="h-9" />
      </label>
      {addErr ? <p className="text-destructive">{addErr}</p> : null}
      <div className="flex justify-end gap-2 pt-2">
       <Button type="button" variant="outline" disabled={addSaving} onClick={() => setAddOpen(false)}>
        取消
       </Button>
       <Button type="button" disabled={addSaving} onClick={() => void submitAdd()}>
        {addSaving ? "儲存中…" : "儲存"}
       </Button>
      </div>
     </div>
    </DialogContent>
   </Dialog>
  </div>
 )
}
