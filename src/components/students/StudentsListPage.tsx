import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { MessageCircle, Plus, Search, Sheet } from "lucide-react"

import { isSuperAdmin } from "@/lib/mgmtRole"
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
import {
  deleteStudent,
  fetchAllStudents,
  fetchEnrollmentSubjectsByStudentIds,
  fetchStudentTuitionArrearsByStudentIds,
  insertStudent,
  type StudentRecord,
  type StudentTuitionArrearsInfo,
} from "@/services/studentQueries"

const STATUS_FILTERS = [
  { key: "all", label: "所有學生" },
  { key: "就讀中", label: "就讀中" },
  { key: "查詢/試堂", label: "查詢/試堂" },
  { key: "休學", label: "休學" },
  { key: "退學", label: "退學" },
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

function monthStartIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`
}

function formatCsv(rows: StudentRecord[]): string {
  const headers = [
    "id",
    "student_code",
    "full_name",
    "english_name",
    "grade",
    "status",
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
  const navigate = useNavigate()
  const [rows, setRows] = useState<StudentRecord[]>([])
  const [tags, setTags] = useState<Map<string, string[]>>(new Map())
  const [tuitionMap, setTuitionMap] = useState<Map<string, StudentTuitionArrearsInfo>>(new Map())
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [statusKey, setStatusKey] = useState<(typeof STATUS_FILTERS)[number]["key"]>("all")
  const [gradeKey, setGradeKey] = useState<(typeof GRADE_FILTERS)[number]["key"]>("all")
  const [search, setSearch] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newGrade, setNewGrade] = useState("")
  const [newPhone, setNewPhone] = useState("")

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
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const stats = useMemo(() => {
    const total = rows.length
    const enrolled = rows.filter((r) => r.status === "就讀中").length
    const start = monthStartIso()
    const newThisMonth = rows.filter((r) => r.created_at.slice(0, 10) >= start).length
    return { total, enrolled, newThisMonth }
  }, [rows])

  const latest = rows[0] ?? null

  const filtered = useMemo(() => {
    let list = rows
    if (statusKey !== "all") {
      list = list.filter((r) => (r.status ?? "") === statusKey)
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
          r.parent_phone,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        return hay.includes(q)
      })
    }
    return list
  }, [rows, statusKey, gradeKey, search])

  const statusCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of rows) {
      const st = r.status ?? "未標示"
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
    if (!newName.trim()) return
    await insertStudent({
      full_name: newName.trim(),
      grade: newGrade.trim() || null,
      parent_phone: newPhone.trim() || null,
      status: "就讀中",
    })
    setAddOpen(false)
    setNewName("")
    setNewGrade("")
    setNewPhone("")
    await load()
  }

  const onDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm("確定刪除此學生？將一併刪除關聯選課等資料（若資料庫設為 cascade）。")) return
    try {
      await deleteStudent(id)
      await load()
    } catch (er) {
      alert(er instanceof Error ? er.message : String(er))
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
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <span className="text-2xl" aria-hidden>
            🎓
          </span>
          學生管理
        </h1>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          {loading ? "…" : `${stats.total} 人`}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="text-3xl font-bold text-primary">{loading ? "…" : stats.enrolled}</div>
          <div className="text-sm text-muted-foreground">目前就讀中</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="text-3xl font-bold text-emerald-600">
            {loading ? "…" : stats.newThisMonth}
          </div>
          <div className="text-sm text-muted-foreground">本月新報讀</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="text-3xl font-bold text-foreground">{loading ? "…" : stats.total}</div>
          <div className="text-sm text-muted-foreground">學生總數</div>
        </div>
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
            placeholder="搜尋姓名 / 編號 / 電話…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={exportCsv}>
            <Sheet className="h-4 w-4" />
            匯出 CSV
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button type="button">
                <Plus className="h-4 w-4" />
                新增學生
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新增學生</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">中文姓名 *</label>
                  <Input
                    className="mt-1"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="姓名"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">年級</label>
                  <Input
                    className="mt-1"
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    placeholder="例：中三"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">家長電話</label>
                  <Input
                    className="mt-1"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>
                <Button type="button" onClick={() => void onAddStudent()}>
                  建立
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[62rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left">
                <th className="px-3 py-3 font-medium text-muted-foreground">編號</th>
                <th className="px-3 py-3 font-medium text-muted-foreground">姓名</th>
                <th className="px-3 py-3 font-medium text-muted-foreground">年級</th>
                <th className="px-3 py-3 font-medium text-muted-foreground">家長電話</th>
                <th className="px-3 py-3 font-medium text-muted-foreground">報讀班別</th>
                <th className="px-3 py-3 font-medium text-muted-foreground">狀態</th>
                <th className="px-3 py-3 font-medium text-muted-foreground">學費</th>
                <th className="px-3 py-3 font-medium text-muted-foreground">操作</th>
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
                    沒有符合條件的學生
                  </td>
                </tr>
              ) : (
                filtered.map((r, idx) => {
                  const t = tuitionMap.get(r.id)
                  const waContact = pickStudentContactRaw({
                    whatsapp: r.whatsapp,
                    parent_phone: r.parent_phone,
                  })
                  return (
                    <tr
                      key={r.id}
                      onClick={() => navigate(`/Students/${r.id}`)}
                      className={cn(
                        "cursor-pointer border-b border-border transition-colors hover:bg-muted/60",
                        idx % 2 === 1 ? "bg-muted/20" : ""
                      )}
                    >
                      <td className="px-3 py-3 text-muted-foreground">
                        {r.student_code || "—"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-foreground">{r.full_name}</div>
                        {r.english_name ? (
                          <div className="text-xs text-muted-foreground">{r.english_name}</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">{r.grade ?? "—"}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="tabular-nums">{r.parent_phone ?? "—"}</span>
                          {waContact ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-900"
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
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(tags.get(r.id) ?? []).map((sub) => (
                            <span
                              key={sub}
                              className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800"
                            >
                              {sub}
                            </span>
                          ))}
                          {(tags.get(r.id) ?? []).length === 0 ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                          {r.status ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
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
                      <td className="px-3 py-3">
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
