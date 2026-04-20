import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Copy, Images, LayoutGrid, List, Plus } from "lucide-react"

import { isSuperAdmin } from "@/lib/mgmtRole"
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
import {
  GRADE_CHIPS,
  KANBAN_DAY_COLUMNS,
  STATUS_CHIPS,
  SUBJECT_CHIPS,
  classMatchesGrade,
  classMatchesStatus,
  classMatchesSubject,
  kanbanDayKey,
} from "@/components/classes/classesUi"
import { coalesceCourseCodeForDb } from "@/lib/courseCode"
import {
  deleteClass,
  duplicateClass,
  fetchAllClasses,
  fetchTeacherOptions,
  insertClass,
  type ClassRecord,
  updateClass,
} from "@/services/classQueries"

const cardInteractive =
  "cursor-pointer rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"

const rowInteractive =
  "cursor-pointer transition-colors duration-150 hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"

const GALLERY_COVERS = [
  "bg-gradient-to-br from-violet-500 via-fuchsia-600 to-indigo-700",
  "bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-800",
  "bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600",
  "bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-700",
  "bg-gradient-to-br from-pink-400 via-rose-500 to-purple-700",
  "bg-gradient-to-br from-lime-400 via-green-500 to-emerald-800",
  "bg-gradient-to-br from-orange-400 to-red-700",
  "bg-gradient-to-br from-cyan-400 to-teal-800",
] as const

function galleryCoverClass(subject: string): string {
  let h = 0
  for (let i = 0; i < subject.length; i++) {
    h = (h * 31 + subject.charCodeAt(i)) >>> 0
  }
  return GALLERY_COVERS[h % GALLERY_COVERS.length]
}

export function ClassesListPage() {
  const navigate = useNavigate()
  const teacherTid = getTeacherScopeTeacherId()
  const [rows, setRows] = useState<ClassRecord[]>([])
  const [teachers, setTeachers] = useState<{ id: string; label: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [view, setView] = useState<"list" | "kanban" | "gallery">("list")
  const [kanbanGroup, setKanbanGroup] = useState<"day" | "teacher" | "grade">("day")
  const [gradeKey, setGradeKey] = useState<(typeof GRADE_CHIPS)[number]>("全部")
  const [subjectKey, setSubjectKey] = useState<(typeof SUBJECT_CHIPS)[number]>("全部")
  const [statusKey, setStatusKey] = useState<(typeof STATUS_CHIPS)[number]>("進行中")
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({
    subject: "",
    course_code: "",
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
      setRows(await fetchAllClasses())
      setTeachers(await fetchTeacherOptions())
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!teacherTid && view === "gallery") setView("list")
  }, [teacherTid, view])

  const baseRows = useMemo(() => {
    if (!teacherTid) return rows
    return rows.filter((c) => c.teacher_id === teacherTid)
  }, [rows, teacherTid])

  const filtered = useMemo(() => {
    return baseRows.filter(
      (c) =>
        classMatchesGrade(c, gradeKey) &&
        classMatchesSubject(c, subjectKey) &&
        classMatchesStatus(c, statusKey)
    )
  }, [baseRows, gradeKey, subjectKey, statusKey])

  const stats = useMemo(() => {
    const total = baseRows.length
    const inProg = baseRows.filter((c) => c.status.includes("進行")).length
    return { total, inProg, filtered: filtered.length }
  }, [baseRows, filtered])

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
    if (!form.subject.trim()) return
    try {
      await insertClass({
        subject: form.subject.trim(),
        course_code: coalesceCourseCodeForDb(form.course_code.trim() || null),
        day_of_week: form.day_of_week || null,
        time_slot: form.time_slot.trim() || null,
        teacher_id: form.teacher_id || null,
        price_per_lesson: form.price ? Number(form.price) : null,
        status: form.status,
      })
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
      return
    }
    setAddOpen(false)
    setForm({
      subject: "",
      course_code: "",
      day_of_week: "星期六",
      time_slot: "",
      teacher_id: "",
      price: "",
      status: "進行中",
    })
    await load()
  }

  const onDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm("確定刪除此班別？")) return
    try {
      await deleteClass(id)
      await load()
    } catch (er) {
      alert(er instanceof Error ? er.message : String(er))
    }
  }

  const onCopy = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      await duplicateClass(id)
      await load()
    } catch (er) {
      alert(er instanceof Error ? er.message : String(er))
    }
  }

  const onStatusChange = async (id: string, status: string) => {
    try {
      await updateClass(id, { status })
      await load()
    } catch (er) {
      alert(er instanceof Error ? er.message : String(er))
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
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <span aria-hidden>📚</span>
          {teacherTid ? "我的班別" : "班別管理"}
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-sm font-medium text-violet-800">
            {loading ? "…" : `${stats.total} 班`}
          </span>
        </h1>
        <div className="flex flex-wrap items-center gap-2">
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
          <div className="text-2xl font-bold text-emerald-600">{loading ? "…" : stats.inProg}</div>
          <div className="text-sm text-muted-foreground">進行中</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="text-2xl font-bold text-violet-700">{loading ? "…" : stats.filtered}</div>
          <div className="text-sm text-muted-foreground">篩選結果</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">年級</div>
        <div className="flex flex-wrap gap-2">
          {GRADE_CHIPS.map((g) => (
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

      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">科目</div>
        <div className="flex flex-wrap gap-2">
          {SUBJECT_CHIPS.map((s) => (
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

      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">狀態</div>
        <div className="flex flex-wrap gap-2">
          {STATUS_CHIPS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusKey(s)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-all active:scale-95",
                statusKey === s
                  ? s === "進行中"
                    ? "border-emerald-500 bg-emerald-600 text-white shadow-sm"
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
                    ? "border-violet-500 bg-violet-600 text-white shadow-sm"
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
        {!teacherTid ? (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                className="bg-violet-600 text-white shadow-sm transition-all hover:bg-violet-700 hover:shadow active:scale-[0.98]"
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
                  <label className="text-xs text-muted-foreground">科目 *</label>
                  <Input
                    className="mt-1"
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">課程編號（可留空）</label>
                  <Input
                    className="mt-1 font-mono uppercase"
                    autoCapitalize="characters"
                    spellCheck={false}
                    placeholder="例：2526F6CHI1001"
                    value={form.course_code}
                    onChange={(e) => setForm((f) => ({ ...f, course_code: e.target.value }))}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    僅大寫英文與數字：4 位學年 + 年級碼（F1–F6 等）+ 2–6 字母科目簡稱 + 4 位種子（1000–9999）。
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">星期</label>
                  <Input
                    className="mt-1"
                    value={form.day_of_week}
                    onChange={(e) => setForm((f) => ({ ...f, day_of_week: e.target.value }))}
                  />
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
                  <select
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
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">每節學費</label>
                  <Input
                    className="mt-1"
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">狀態</label>
                  <Input
                    className="mt-1"
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  />
                </div>
                <Button type="button" onClick={() => void onAdd()}>
                  建立
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <p className="text-sm text-muted-foreground">專班老師僅可檢視指派班別，無法新增。</p>
        )}
      </div>

      {view === "list" ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[72rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th className="px-3 py-3 font-medium">課程編號</th>
                  <th className="px-3 py-3 font-medium">科目</th>
                  <th className="px-3 py-3 font-medium">年級</th>
                  <th className="px-3 py-3 font-medium">上課時間</th>
                  <th className="px-3 py-3 font-medium">老師</th>
                  <th className="px-3 py-3 font-medium">學費/節</th>
                  <th className="px-3 py-3 font-medium">狀態</th>
                  <th className="px-3 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                      載入中…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
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
                      <td className="px-3 py-3 text-muted-foreground">{c.course_code ?? "—"}</td>
                      <td className="px-3 py-3 font-medium">{c.subject}</td>
                      <td className="px-3 py-3">{(c.grade ?? []).join("、") || "—"}</td>
                      <td className="px-3 py-3 text-muted-foreground">{timeLabel(c)}</td>
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
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
                      <td className="px-3 py-3 font-medium text-violet-700">
                        {c.price_per_lesson != null
                          ? `$${c.price_per_lesson.toLocaleString("zh-Hant-TW")}`
                          : "—"}
                      </td>
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs transition-colors hover:border-primary/50"
                          value={c.status}
                          onChange={(e) => void onStatusChange(c.id, e.target.value)}
                        >
                          {STATUS_CHIPS.filter((s) => s !== "全部").map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() => navigate(`/Classes/${c.id}`)}
                        >
                          編輯
                        </button>
                        <span className="mx-2 text-muted-foreground">|</span>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground hover:underline"
                          onClick={(e) => void onCopy(e, c.id)}
                        >
                          <Copy className="mr-0.5 inline h-3.5 w-3.5" />
                          複製
                        </button>
                        {isSuperAdmin() ? (
                          <>
                            <span className="mx-2 text-muted-foreground">|</span>
                            <button
                              type="button"
                              className="text-destructive hover:underline"
                              onClick={(e) => void onDelete(e, c.id)}
                            >
                              刪除
                            </button>
                          </>
                        ) : null}
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
                    {c.course_code ? (
                      <p className="font-mono text-xs text-muted-foreground">{c.course_code}</p>
                    ) : null}
                    <p className="text-sm text-muted-foreground">{timeLabel(c)}</p>
                    <p className="text-sm text-muted-foreground">{(c.grade ?? []).join("、") || "—"}</p>
                    <span className="inline-flex w-fit rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900">
                      {c.status}
                    </span>
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
                          {c.course_code ?? "—"}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                          {c.status}
                        </span>
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
                      <div className="text-sm font-semibold text-violet-700">
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
                          className="text-muted-foreground hover:underline"
                          onClick={(e) => void onCopy(e, c.id)}
                        >
                          複製
                        </button>
                        {isSuperAdmin() ? (
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
