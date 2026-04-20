import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, BookOpen, CalendarDays, Pencil, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
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
} from "@/services/studentQueries"
import { localYmd } from "@/services/teacherQueries"

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
  const [enrollmentEvents, setEnrollmentEvents] = useState<ClassEnrollmentChangeEvent[]>([])
  const [schedules, setSchedules] = useState<ClassScheduleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [teachers, setTeachers] = useState<{ id: string; label: string }[]>([])
  const [rooms, setRooms] = useState<{ id: string; label: string }[]>([])
  const [form, setForm] = useState<Partial<ClassRecord>>({})
  const [gradeStr, setGradeStr] = useState("")
  const [schedFilter, setSchedFilter] = useState<"future" | "past" | "cancel">("future")
  const [addSchedOpen, setAddSchedOpen] = useState(false)
  const [newSchedDate, setNewSchedDate] = useState(() => localYmd())
  const [newSchedStart, setNewSchedStart] = useState("")
  const [newSchedEnd, setNewSchedEnd] = useState("")

  const reload = useCallback(async () => {
    if (!cid) return
    setLoading(true)
    try {
      const [c, st, ev, sc, tch, rm] = await Promise.all([
        getClassById(cid),
        fetchClassStudents(cid),
        fetchEnrollmentChangeEventsForClass(cid),
        fetchClassSchedules(cid),
        fetchTeacherOptions(),
        fetchClassroomOptions(),
      ])
      setCls(c)
      if (c) {
        setForm(c)
        setGradeStr((c.grade ?? []).join("，"))
      }
      setStudents(st)
      setEnrollmentEvents(ev)
      setSchedules(sc)
      setTeachers(tch)
      setRooms(rm)
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
    const gradeArr = gradeStr
      .split(/[,，、]/)
      .map((x) => x.trim())
      .filter(Boolean)
    try {
      await updateClass(cid, {
        subject: form.subject ?? cls.subject,
        course_code: form.course_code?.trim() ? form.course_code : null,
        grade: gradeArr,
        day_of_week: form.day_of_week ?? null,
        time_slot: form.time_slot ?? null,
        teacher_id: form.teacher_id ?? null,
        classroom_id: form.classroom_id ?? null,
        capacity: form.capacity ?? null,
        price_per_lesson: form.price_per_lesson ?? null,
        start_date: form.start_date ?? null,
        end_date: form.end_date ?? null,
        status: form.status ?? cls.status,
      })
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
      return
    }
    setEditOpen(false)
    await reload()
    alert("已儲存")
  }

  const addSched = async () => {
    if (!cls) return
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
  }

  const timeLine = (c: ClassRecord) =>
    [c.day_of_week, c.time_slot].filter(Boolean).join(" ") || "—"

  if (!cid) return <p className="p-6 text-muted-foreground">無效路由</p>
  if (!loading && !cls) {
    return (
      <div className="p-6">
        <p>找不到班別。</p>
        <Button className="mt-4" variant="outline" asChild>
          <Link to="/Classes">返回</Link>
        </Button>
      </div>
    )
  }

  const scopeTeacherId = getTeacherScopeTeacherId()
  if (!loading && cls && scopeTeacherId && cls.teacher_id !== scopeTeacherId) {
    return (
      <div className="p-6">
        <p>此班別不屬於您的指派，無法檢視。</p>
        <Button className="mt-4" variant="outline" asChild>
          <Link to="/Classes">返回班別列表</Link>
        </Button>
      </div>
    )
  }

  const tabCounts = { st: students.length, sc: schedules.length }

  return (
    <div className="min-h-full bg-background">
      <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-4 py-4 text-white shadow-lg md:px-6">
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
              📚
            </div>
            <div className="min-w-0">
              {loading ? (
                <p className="text-lg">載入中…</p>
              ) : cls ? (
                <>
                  <h1 className="text-2xl font-bold">{cls.subject}</h1>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/90">
                    <span className="font-mono">{cls.course_code ?? "—"}</span>
                    <span className="rounded-full bg-emerald-400/90 px-2 py-0.5 text-xs font-medium text-emerald-950">
                      {cls.status}
                    </span>
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
            onClick={() => setEditOpen(true)}
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
                    ? "border-b-2 border-violet-600 text-violet-700"
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
        {tab === "basic" && cls ? (
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { k: "科目", v: cls.subject },
                { k: "課程編號", v: cls.course_code ?? "—" },
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
              <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-center transition-transform hover:scale-[1.02]">
                <div className="text-3xl font-bold text-violet-800">{students.length}</div>
                <div className="text-xs font-medium text-violet-900/90">就讀學生</div>
              </div>
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-center transition-transform hover:scale-[1.02]">
                <div className="text-3xl font-bold text-sky-800">{parts.fut}</div>
                <div className="text-xs font-medium text-sky-900/90">未來排程</div>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center transition-transform hover:scale-[1.02]">
                <div className="text-3xl font-bold text-emerald-800">{parts.past}</div>
                <div className="text-xs font-medium text-emerald-900/90">已完成課堂</div>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "students" ? (
          <div className="mx-auto max-w-2xl space-y-3">
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
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                    {s.status}
                  </span>
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
                          : "border-sky-200 bg-sky-50/70"
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
                        ? "border-violet-600 bg-violet-600 text-white shadow-sm"
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
                    className="bg-violet-600 text-white hover:bg-violet-700"
                  >
                    + 新增排程
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>新增排程</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-3">
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
                    <Button type="button" onClick={() => void addSched()}>
                      建立
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
                      <select
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm transition-colors hover:border-primary/50"
                        value={s.status}
                        onChange={(e) => void updateSchedule(s.id, { status: e.target.value }).then(reload)}
                      >
                        <option value="預定">預定</option>
                        <option value="完成">完成</option>
                        <option value="取消">取消</option>
                      </select>
                      <button
                        type="button"
                        className="text-sm text-destructive hover:underline"
                        onClick={async () => {
                          if (!confirm("刪除此排程？")) return
                          await deleteSchedule(s.id)
                          await reload()
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>編輯班別</DialogTitle>
          </DialogHeader>
          {cls ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground">科目</label>
                <Input
                  className="mt-1"
                  value={form.subject ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground">課程編號（可留空）</label>
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
                  僅大寫英文與數字：4 位學年 + 年級碼（F1–F6／S1–S6／P1–P6）+ 2–6 字母科目簡稱 + 4 位種子碼（1000–9999）。
                </p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">年級（逗號分隔）</label>
                <Input
                  className="mt-1"
                  value={gradeStr}
                  onChange={(e) => setGradeStr(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">星期</label>
                <Input
                  className="mt-1"
                  value={form.day_of_week ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, day_of_week: e.target.value }))}
                />
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
                <select
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
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">課室</label>
                <select
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
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">收生上限</label>
                <Input
                  type="number"
                  className="mt-1"
                  value={form.capacity ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      capacity: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">每節學費</label>
                <Input
                  type="number"
                  className="mt-1"
                  value={form.price_per_lesson ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      price_per_lesson: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
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
                <Input
                  className="mt-1"
                  value={form.status ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="button" onClick={() => void saveClass()}>
                  儲存
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  取消
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
