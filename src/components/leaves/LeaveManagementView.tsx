import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { CalendarDays, Camera, Clock, Plus, Search, Umbrella, Users, Video } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import {
  deleteLeaveMakeupRecord,
  fetchEnrolledClassesForStudent,
  fetchLeaveMakeupWithRelations,
  fetchLeaveTodayStats,
  fetchMakeupCandidateSchedules,
  fetchUpcomingSchedulesForClass,
  insertLeaveMakeupRecord,
  LEAVE_MAKEUP_OPTIONS,
  LEAVE_REASON_OPTIONS,
  isLeaveStatusAbandoned,
  isLeaveStatusDone,
  isLeaveStatusPending,
  localYmd,
  updateLeaveMakeupRecord,
  type ClassScheduleOption,
  type EnrolledClassOption,
  type LeaveManageRow,
  type LeaveTodayStats,
} from "@/services/leaveQueries"
import { listStudents } from "@/services/queries"
import type { ScheduleManageRow } from "@/services/scheduleQueries"

function formatLoadError(e: unknown): string {
  if (e instanceof Error) return e.message
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message)
  return "載入失敗"
}

type StatusTab = "all" | "pending" | "done" | "abandoned"

function classTab(row: LeaveManageRow): StatusTab {
  if (isLeaveStatusAbandoned(row.status)) return "abandoned"
  if (isLeaveStatusDone(row.status)) return "done"
  if (isLeaveStatusPending(row.status)) return "pending"
  return "all"
}

/** 列表顯示：優先已連結排程之上課日 */
function displayLeaveDate(r: LeaveManageRow): string {
  return r.sched_date ?? r.leave_date
}

export function LeaveManagementView() {
  const [searchParams, setSearchParams] = useSearchParams()
  const recordFromUrl = searchParams.get("record")
  const studentIdFromUrl = searchParams.get("studentId")

  const [rows, setRows] = useState<LeaveManageRow[]>([])
  const [stats, setStats] = useState<LeaveTodayStats>({ leaveStudentCount: 0, makeupStudentCount: 0 })
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const [statusTab, setStatusTab] = useState<StatusTab>("all")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [filterSubject, setFilterSubject] = useState<string>("all")
  const [filterStudent, setFilterStudent] = useState("")

  const [addOpen, setAddOpen] = useState(false)
  const [studentSearch, setStudentSearch] = useState("")
  const [addStudentId, setAddStudentId] = useState("")
  const [addClassId, setAddClassId] = useState("")
  const [addScheduleId, setAddScheduleId] = useState("")
  const [addReason, setAddReason] = useState<(typeof LEAVE_REASON_OPTIONS)[number]>("病假")
  const [addMakeupArrange, setAddMakeupArrange] = useState<(typeof LEAVE_MAKEUP_OPTIONS)[number]>("錄影")
  const [addMakeupScheduleId, setAddMakeupScheduleId] = useState("")
  const [addMakeupSearch, setAddMakeupSearch] = useState("")
  const [addRemarks, setAddRemarks] = useState("")
  const [addSaving, setAddSaving] = useState(false)
  const [addErr, setAddErr] = useState<string | null>(null)

  const [studentPickList, setStudentPickList] = useState<{ id: string; label: string }[]>([])
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClassOption[]>([])
  const [scheduleOptions, setScheduleOptions] = useState<ClassScheduleOption[]>([])
  const [makeupCandidates, setMakeupCandidates] = useState<ScheduleManageRow[]>([])

  const reload = useCallback(async () => {
    if (!isSupabaseConfigured) return
    setLoading(true)
    setErr(null)
    try {
      const [list, st] = await Promise.all([fetchLeaveMakeupWithRelations(), fetchLeaveTodayStats()])
      setRows(list)
      setStats(st)
    } catch (e) {
      setErr(formatLoadError(e))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    if (!recordFromUrl || loading) return
    const t = window.setTimeout(() => {
      document.getElementById(`leave-record-${recordFromUrl}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }, 100)
    return () => window.clearTimeout(t)
  }, [recordFromUrl, loading, rows])

  const clearDeepLinkFilters = () => {
    const next = new URLSearchParams(searchParams)
    next.delete("studentId")
    next.delete("record")
    setSearchParams(next, { replace: true })
  }

  useEffect(() => {
    if (!addOpen) return
    setAddErr(null)
    setStudentSearch("")
    setAddStudentId("")
    setAddClassId("")
    setAddScheduleId("")
    setAddReason("病假")
    setAddMakeupArrange("錄影")
    setAddMakeupScheduleId("")
    setAddMakeupSearch("")
    setAddRemarks("")
    setEnrolledClasses([])
    setScheduleOptions([])
    void listStudents().then((raw) => {
      const sl = (raw as Record<string, unknown>[]).map((r) => ({
        id: String(r.id),
        label: `${String(r.full_name ?? "—")}（${String(r.grade ?? "—")}）`,
      }))
      setStudentPickList(sl)
    })
  }, [addOpen])

  useEffect(() => {
    if (!addOpen || !addStudentId) {
      setEnrolledClasses([])
      setAddClassId("")
      setAddScheduleId("")
      setScheduleOptions([])
      return
    }
    void fetchEnrolledClassesForStudent(addStudentId).then((cls) => {
      setEnrolledClasses(cls)
      setAddClassId((prev) => (prev && cls.some((c) => c.id === prev) ? prev : cls[0]?.id ?? ""))
    })
  }, [addOpen, addStudentId])

  useEffect(() => {
    if (!addOpen || !addClassId) {
      setScheduleOptions([])
      setAddScheduleId("")
      return
    }
    void fetchUpcomingSchedulesForClass(addClassId, localYmd()).then((opts) => {
      setScheduleOptions(opts)
      setAddScheduleId((prev) => (prev && opts.some((o) => o.id === prev) ? prev : opts[0]?.id ?? ""))
    })
  }, [addOpen, addClassId])

  useEffect(() => {
    if (!addOpen || addMakeupArrange !== "調堂") return
    void fetchMakeupCandidateSchedules().then(setMakeupCandidates)
  }, [addOpen, addMakeupArrange])

  const studentsFiltered = useMemo(() => {
    const q = studentSearch.trim().toLowerCase()
    if (!q) return studentPickList
    return studentPickList.filter((s) => s.label.toLowerCase().includes(q))
  }, [studentPickList, studentSearch])

  const makeupFiltered = useMemo(() => {
    const q = addMakeupSearch.trim().toLowerCase()
    if (!q) return makeupCandidates
    return makeupCandidates.filter((s) => {
      const hay = `${s.subject} ${s.course_code ?? ""} ${s.teacher_name ?? ""} ${s.scheduled_date}`.toLowerCase()
      return hay.includes(q)
    })
  }, [makeupCandidates, addMakeupSearch])

  const subjectOptions = useMemo(() => {
    const s = new Set<string>()
    for (const r of rows) {
      if (r.class_subject) s.add(r.class_subject)
    }
    return [...s].sort((a, b) => a.localeCompare(b, "zh-Hant"))
  }, [rows])

  const tabCounts = useMemo(() => {
    let all = rows.length
    let pending = 0
    let done = 0
    let abandoned = 0
    for (const r of rows) {
      if (isLeaveStatusAbandoned(r.status)) abandoned++
      else if (isLeaveStatusDone(r.status)) done++
      else if (isLeaveStatusPending(r.status)) pending++
    }
    return { all, pending, done, abandoned }
  }, [rows])

  const filteredSorted = useMemo(() => {
    const qStudent = filterStudent.trim().toLowerCase()
    const sidFilter = studentIdFromUrl?.trim() ?? ""
    const recFocus = recordFromUrl?.trim() ?? ""
    const list = rows.filter((r) => {
      if (recFocus && r.id === recFocus) return true
      if (sidFilter && r.student_id !== sidFilter) return false
      if (statusTab !== "all" && classTab(r) !== statusTab) return false
      if (filterSubject !== "all" && (r.class_subject ?? "") !== filterSubject) return false
      if (filterDateFrom && r.leave_date < filterDateFrom) return false
      if (filterDateTo && r.leave_date > filterDateTo) return false
      if (qStudent) {
        const name = (r.student_name ?? "").toLowerCase()
        if (!name.includes(qStudent)) return false
      }
      return true
    })
    return [...list].sort((a, b) => {
      const da = displayLeaveDate(a)
      const db = displayLeaveDate(b)
      if (da !== db) return da.localeCompare(db)
      return a.id.localeCompare(b.id)
    })
  }, [
    rows,
    statusTab,
    filterSubject,
    filterDateFrom,
    filterDateTo,
    filterStudent,
    studentIdFromUrl,
    recordFromUrl,
  ])

  const openAdd = () => setAddOpen(true)

  const submitAdd = async () => {
    if (!addStudentId || !addClassId || !addScheduleId) {
      setAddErr("請完成：搜尋並選擇學生、班別，並選擇請假排程")
      return
    }
    if (addMakeupArrange === "調堂" && !addMakeupScheduleId) {
      setAddErr("補課安排為「調堂」時，請選擇補堂排程")
      return
    }
    const sched = scheduleOptions.find((s) => s.id === addScheduleId)
    if (!sched) {
      setAddErr("請假排程無效")
      return
    }
    const makeupRow =
      addMakeupArrange === "調堂" ? makeupCandidates.find((s) => s.id === addMakeupScheduleId) : undefined

    setAddSaving(true)
    setAddErr(null)
    try {
      await insertLeaveMakeupRecord({
        student_id: addStudentId,
        class_id: addClassId,
        schedule_id: addScheduleId,
        leave_date: sched.scheduled_date,
        leave_reason: addReason,
        makeup_type: addMakeupArrange,
        makeup_schedule_id: addMakeupArrange === "調堂" ? addMakeupScheduleId : null,
        makeup_date: makeupRow?.scheduled_date ?? null,
        remarks: addRemarks.trim() || null,
        status: "待補課",
      })
      setAddOpen(false)
      await reload()
    } catch (e) {
      setAddErr(formatLoadError(e) || "新增失敗")
    } finally {
      setAddSaving(false)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        尚未設定 Supabase（請建立 <code className="rounded bg-white/60 px-1">.env</code>）。
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
            <Umbrella className="h-7 w-7 text-orange-600" aria-hidden />
            請假管理
            <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-900">
              {tabCounts.all} 則記錄
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">請假與補堂紀錄；點學生或班別可開啟詳情頁，涉及排程可開排程詳情。</p>
        </div>
        <Button
          type="button"
          className="gap-1 bg-orange-600 text-white hover:bg-orange-700"
          onClick={openAdd}
        >
          <Plus className="h-4 w-4" />
          新增請假
        </Button>
      </header>

      {err ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </div>
      ) : null}

      {studentIdFromUrl || recordFromUrl ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sky-200 bg-sky-50/80 px-3 py-2 text-sm text-sky-950 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100">
          <span>
            已由學生詳情帶入篩選
            {recordFromUrl ? "（並嘗試捲動至該筆）" : ""}
            。
          </span>
          <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={clearDeepLinkFilters}>
            清除網址篩選
          </Button>
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2" aria-label="今日請假與補堂概覽">
        <div className="rounded-xl border border-orange-200/80 bg-orange-50/60 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-orange-900/90">
            <Users className="h-4 w-4" />
            今日請假人數
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-orange-800">{stats.leaveStudentCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">以「請假日期」為今天之不重複學生數</p>
        </div>
        <div className="rounded-xl border border-violet-200/80 bg-violet-50/60 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-violet-900/90">
            <CalendarDays className="h-4 w-4" />
            今日補堂人數
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-violet-800">{stats.makeupStudentCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">以「補課日期」為今天之不重複學生數</p>
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm lg:flex-row lg:flex-wrap lg:items-end">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="狀態篩選">
          {(
            [
              ["all", `全部 ${tabCounts.all}`],
              ["pending", `待補課 ${tabCounts.pending}`],
              ["done", `已補課 ${tabCounts.done}`],
              ["abandoned", `放棄補課 ${tabCounts.abandoned}`],
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
                  ? "border-orange-400 bg-orange-100 text-orange-950"
                  : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2 border-t border-dashed border-border pt-3 lg:border-0 lg:pt-0">
          <label className="grid gap-1 text-xs text-muted-foreground">
            <span>請假日起</span>
            <Input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="h-9 w-[11rem]"
            />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            <span>請假日迄</span>
            <Input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="h-9 w-[11rem]"
            />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            <span>科目</span>
            <select
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
            </select>
          </label>
          <label className="grid min-w-[10rem] flex-1 gap-1 text-xs text-muted-foreground">
            <span>學生（姓名）</span>
            <Input
              placeholder="搜尋姓名…"
              value={filterStudent}
              onChange={(e) => setFilterStudent(e.target.value)}
              className="h-9"
            />
          </label>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : filteredSorted.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">此條件下沒有紀錄</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[1040px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                <th className="px-3 py-2 font-medium">學生</th>
                <th className="px-3 py-2 font-medium">請假班別</th>
                <th className="px-3 py-2 font-medium">所屬老師</th>
                <th className="px-3 py-2 font-medium">請假日期</th>
                <th className="px-3 py-2 font-medium">涉及排程</th>
                <th className="px-3 py-2 font-medium">原因</th>
                <th className="px-3 py-2 font-medium">補課安排</th>
                <th className="px-3 py-2 font-medium">備註</th>
                <th className="px-3 py-2 font-medium">狀態</th>
                <th className="px-3 py-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredSorted.map((r) => (
                <tr
                  key={r.id}
                  id={`leave-record-${r.id}`}
                  className={cn(
                    "border-b border-border last:border-0 transition-colors",
                    recordFromUrl === r.id &&
                      "bg-amber-100/90 ring-2 ring-inset ring-amber-400 dark:bg-amber-950/50 dark:ring-amber-600"
                  )}
                >
                  <td className="px-3 py-2 align-top">
                    <Link
                      to={`/Students/${r.student_id}`}
                      className="font-medium text-sky-700 hover:underline"
                    >
                      {r.student_name ?? "—"}
                    </Link>
                    <div className="text-xs text-muted-foreground">{r.student_grade ?? "—"}</div>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Link
                      to={`/Classes/${r.class_id}`}
                      className="font-medium text-sky-700 hover:underline"
                    >
                      {r.class_subject ?? "—"}
                      {r.course_code ? (
                        <span className="ml-1 font-mono text-xs text-muted-foreground">({r.course_code})</span>
                      ) : null}
                    </Link>
                  </td>
                  <td className="px-3 py-2 align-top text-muted-foreground">{r.teacher_name ?? "—"}</td>
                  <td className="px-3 py-2 align-top tabular-nums text-muted-foreground">
                    {displayLeaveDate(r)}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {r.schedule_id ? (
                      <Link
                        to={`/Schedule/${r.schedule_id}`}
                        className="font-medium text-sky-700 hover:underline"
                      >
                        {r.sched_date ?? r.leave_date} {r.sched_start ?? ""}–{r.sched_end ?? ""}
                      </Link>
                    ) : (
                      <span className="text-orange-600/90">待連結排程</span>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top text-muted-foreground">{r.leave_reason ?? "—"}</td>
                  <td className="px-3 py-2 align-top">
                    <MakeupCell row={r} />
                  </td>
                  <td className="max-w-[8rem] px-3 py-2 align-top text-xs text-muted-foreground">
                    {r.remarks ?? "—"}
                  </td>
                  <td className="px-3 py-2 align-top" onClick={(e) => e.stopPropagation()}>
                    <select
                      className={cn(
                        "h-9 max-w-[7rem] rounded-md border px-1 text-xs font-medium",
                        isLeaveStatusDone(r.status)
                          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                          : isLeaveStatusAbandoned(r.status)
                            ? "border-slate-300 bg-slate-50"
                            : "border-orange-300 bg-orange-50 text-orange-900"
                      )}
                      value={r.status}
                      onChange={async (e) => {
                        await updateLeaveMakeupRecord(r.id, { status: e.target.value })
                        await reload()
                      }}
                    >
                      <option value="待補課">待補課</option>
                      <option value="已批核">已批核</option>
                      <option value="已補課">已補課</option>
                      <option value="已完成">已完成</option>
                      <option value="放棄補課">放棄補課</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <button
                      type="button"
                      className="text-xs font-medium text-sky-700 hover:underline"
                      onClick={async () => {
                        if (!confirm("確定刪除此筆請假紀錄？")) return
                        await deleteLeaveMakeupRecord(r.id)
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
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增請假</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 text-sm">
            <label className="grid gap-1">
              <span className="text-muted-foreground">學生（可搜尋姓名／年級）</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="輸入關鍵字篩選…"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="h-9 pl-8"
                />
              </div>
              <select
                className="h-9 w-full rounded-md border border-input px-2"
                value={addStudentId}
                onChange={(e) => setAddStudentId(e.target.value)}
              >
                <option value="">請選擇學生</option>
                {studentsFiltered.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              {studentSearch.trim() && studentsFiltered.length === 0 ? (
                <p className="text-xs text-muted-foreground">無符合學生，請調整搜尋字。</p>
              ) : null}
            </label>

            <label className="grid gap-1">
              <span className="text-muted-foreground">班別（僅顯示該生就讀中班別）</span>
              <select
                className="h-9 w-full rounded-md border border-input px-2"
                value={addClassId}
                onChange={(e) => setAddClassId(e.target.value)}
                disabled={!addStudentId || enrolledClasses.length === 0}
              >
                {!addStudentId ? (
                  <option value="">請先選擇學生</option>
                ) : enrolledClasses.length === 0 ? (
                  <option value="">該學生尚無就讀中班別</option>
                ) : (
                  enrolledClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.subject}
                      {c.course_code ? `（${c.course_code}）` : ""}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-muted-foreground">請假排程（未上堂：今日起、非取消／完成）</span>
              <select
                className="h-9 w-full rounded-md border border-input px-2"
                value={addScheduleId}
                onChange={(e) => setAddScheduleId(e.target.value)}
                disabled={!addClassId || scheduleOptions.length === 0}
              >
                {!addClassId ? (
                  <option value="">請先選擇班別</option>
                ) : scheduleOptions.length === 0 ? (
                  <option value="">此班尚無符合條件之排程</option>
                ) : (
                  scheduleOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.scheduled_date} {s.start_time ?? ""}–{s.end_time ?? ""}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-muted-foreground">原因</span>
              <select
                className="h-9 w-full rounded-md border border-input px-2"
                value={addReason}
                onChange={(e) => setAddReason(e.target.value as (typeof LEAVE_REASON_OPTIONS)[number])}
              >
                {LEAVE_REASON_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-muted-foreground">補課安排</span>
              <select
                className="h-9 w-full rounded-md border border-input px-2"
                value={addMakeupArrange}
                onChange={(e) => {
                  const v = e.target.value as (typeof LEAVE_MAKEUP_OPTIONS)[number]
                  setAddMakeupArrange(v)
                  if (v !== "調堂") setAddMakeupScheduleId("")
                }}
              >
                {LEAVE_MAKEUP_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>

            {addMakeupArrange === "調堂" ? (
              <div className="rounded-lg border border-violet-200 bg-violet-50/40 p-3 space-y-2">
                <p className="text-xs font-medium text-violet-900">選擇補堂排程（未來一個月內、跨班）</p>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="搜尋科目、代碼、老師、日期…"
                    value={addMakeupSearch}
                    onChange={(e) => setAddMakeupSearch(e.target.value)}
                    className="h-9 pl-8"
                  />
                </div>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                  value={addMakeupScheduleId}
                  onChange={(e) => setAddMakeupScheduleId(e.target.value)}
                >
                  <option value="">請選擇補堂排程</option>
                  {makeupFiltered.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.scheduled_date} {s.start_time ?? ""}–{s.end_time ?? ""} · {s.subject}
                      {s.course_code ? ` (${s.course_code})` : ""} · {s.teacher_name ?? "—"}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

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

function MakeupCell({ row }: { row: LeaveManageRow }) {
  const t = (row.makeup_type ?? "").trim()
  const hasDate = !!row.makeup_date
  if (!t && !hasDate) {
    return <span className="text-orange-600/90">待安排</span>
  }
  if (t.includes("不補回")) {
    return <span className="text-muted-foreground">不補回</span>
  }
  if (t === "其他") {
    return <span className="text-muted-foreground">其他</span>
  }
  const isRecord = t.includes("錄影") || t.includes("錄像")
  const isResched = t.includes("調堂") || t.includes("調") || t.includes("另排")
  return (
    <div className="space-y-1 text-xs">
      {isRecord ? (
        <span className="inline-flex items-center gap-1 text-violet-800">
          <Camera className="h-3.5 w-3.5 shrink-0" />
          {t || "錄影"}
        </span>
      ) : isResched ? (
        <span className="inline-flex items-center gap-1 text-violet-800">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          {t || "調堂"}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-foreground">
          <Video className="h-3.5 w-3.5 shrink-0 opacity-70" />
          {t || "—"}
        </span>
      )}
      {hasDate ? (
        <div className="tabular-nums text-violet-700">{row.makeup_date}</div>
      ) : null}
    </div>
  )
}
