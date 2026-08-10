import { useMemo, useState, type Dispatch, type SetStateAction } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAppBanner } from "@/lib/appBanner"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"

import {
  MOCK_AVAIL_DATES,
  MOCK_DEFAULT_ROOM,
  MOCK_HOLIDAYS,
  MOCK_PRICE_GRADES,
  MOCK_ROSTER_MONTH_LABEL,
  MOCK_SPLIT_NOTE,
  MOCK_TEACHERS,
  WEEKDAY_OPTIONS,
  countSubmitProgress,
  cycleDutySlot,
  dutyLabel,
  formatWeekdays,
  formatWeekdaysShort,
  planDayCount,
  summarizeOverview,
  type DayPlan,
  type DutySlot,
  type MockDutyDay,
  type MockFeeRow,
  type MockStudent,
  type RosterPublishStatus,
  type SubmitStatus,
  type Weekday,
} from "./mockData"
import {
  FilterChipRow,
  RoleTabNav,
  SubmitStatusTag,
  enrollTone,
} from "./sharedUi"

type TabId = "overview" | "students" | "fees" | "roster" | "calendar" | "settings"

const TABS: { value: TabId; label: string }[] = [
  { value: "overview", label: "概覽" },
  { value: "students", label: "學生報讀" },
  { value: "fees", label: "月費" },
  { value: "roster", label: "當值編更" },
  { value: "calendar", label: "功輔校曆" },
  { value: "settings", label: "設定" },
]

type RosterSub = "progress" | "availability" | "sheet"

export function AdminHomeworkWorkbench({
  students,
  setStudents,
  fees,
  avail,
  setAvail,
  submitStatus,
  setSubmitStatus,
  dutyDays,
  setDutyDays,
  rosterPublishStatus,
  setRosterPublishStatus,
}: {
  students: MockStudent[]
  setStudents: Dispatch<SetStateAction<MockStudent[]>>
  fees: MockFeeRow[]
  avail: Record<string, Record<string, DutySlot>>
  setAvail: Dispatch<SetStateAction<Record<string, Record<string, DutySlot>>>>
  submitStatus: Record<string, SubmitStatus>
  setSubmitStatus: Dispatch<SetStateAction<Record<string, SubmitStatus>>>
  dutyDays: MockDutyDay[]
  setDutyDays: Dispatch<SetStateAction<MockDutyDay[]>>
  rosterPublishStatus: RosterPublishStatus
  setRosterPublishStatus: Dispatch<SetStateAction<RosterPublishStatus>>
}) {
  const { pushBanner } = useAppBanner()
  const isMobile = useIsMobile()
  const [tab, setTab] = useState<TabId>("overview")
  const [query, setQuery] = useState("")
  const [planFilter, setPlanFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [gradeFilter, setGradeFilter] = useState("")
  const [monthFilter, setMonthFilter] = useState("")
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [draftName, setDraftName] = useState("")
  const [draftGrade, setDraftGrade] = useState("中二")
  const [draftPlan, setDraftPlan] = useState<DayPlan>("四日")
  const [draftWeekdays, setDraftWeekdays] = useState<Weekday[]>(["一", "二", "四", "五"])
  const [rosterSub, setRosterSub] = useState<RosterSub>("progress")
  const [defaultRoom, setDefaultRoom] = useState(MOCK_DEFAULT_ROOM)
  const [editDay, setEditDay] = useState<MockDutyDay | null>(null)

  const overview = useMemo(() => summarizeOverview(students, fees), [students, fees])
  const progress = useMemo(() => countSubmitProgress(submitStatus), [submitStatus])
  const effectiveMonthOptions = useMemo(() => {
    const set = new Set(students.map((s) => s.effectiveMonth))
    return Array.from(set).sort()
  }, [students])

  const hasStudentFilters =
    Boolean(query.trim()) ||
    Boolean(planFilter) ||
    Boolean(statusFilter) ||
    Boolean(gradeFilter) ||
    Boolean(monthFilter)

  const clearStudentFilters = () => {
    setQuery("")
    setPlanFilter("")
    setStatusFilter("")
    setGradeFilter("")
    setMonthFilter("")
  }

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase()
    return students.filter((s) => {
      if (planFilter && s.plan !== planFilter) return false
      if (statusFilter && s.status !== statusFilter) return false
      if (gradeFilter && s.grade !== gradeFilter) return false
      if (monthFilter && s.effectiveMonth !== monthFilter) return false
      if (!q) return true
      return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
    })
  }, [students, query, planFilter, statusFilter, gradeFilter, monthFilter])

  const feeRows = useMemo(() => {
    return fees
      .map((f) => {
        const s = students.find((x) => x.id === f.studentId)
        if (!s || s.status === "結束") return null
        return { ...f, student: s }
      })
      .filter(Boolean) as Array<MockFeeRow & { student: MockStudent }>
  }, [fees, students])

  const onDraftPlanChange = (plan: DayPlan) => {
    setDraftPlan(plan)
    const need = planDayCount(plan)
    setDraftWeekdays((prev) => {
      if (prev.length === need) return prev
      if (prev.length > need) return prev.slice(0, need)
      const extras = WEEKDAY_OPTIONS.filter((d) => !prev.includes(d))
      return [...prev, ...extras].slice(0, need)
    })
  }

  const toggleDraftWeekday = (day: Weekday) => {
    setDraftWeekdays((prev) => {
      if (prev.includes(day)) return prev.filter((d) => d !== day)
      return WEEKDAY_OPTIONS.filter((d) => [...prev, day].includes(d))
    })
  }

  const onSaveEnroll = () => {
    if (!draftName.trim()) {
      pushBanner({ title: "無法儲存", tone: "error", message: "請填寫學生姓名（沙盒）" })
      return
    }
    const need = planDayCount(draftPlan)
    if (draftWeekdays.length !== need) {
      pushBanner({
        title: "無法儲存",
        tone: "error",
        message: `每週${draftPlan}請選 ${need} 日（已選 ${draftWeekdays.length}）`,
      })
      return
    }
    setStudents((prev) => [
      {
        id: `s${Date.now()}`,
        name: draftName.trim(),
        code: `S${String(prev.length + 200).padStart(4, "0")}`,
        grade: draftGrade,
        plan: draftPlan,
        weekdays: draftWeekdays,
        effectiveMonth: "2026-09",
        status: "在籍",
      },
      ...prev,
    ])
    setEnrollOpen(false)
    setDraftName("")
    pushBanner({ title: "已更新", tone: "success", message: "已加入報讀（沙盒）。" })
  }

  const adminCycleAvail = (teacherId: string, date: string) => {
    setAvail((prev) => {
      const cur = prev[teacherId]?.[date] ?? "—"
      return {
        ...prev,
        [teacherId]: { ...(prev[teacherId] ?? {}), [date]: cycleDutySlot(cur) },
      }
    })
    setSubmitStatus((s) => {
      const cur = s[teacherId] ?? "未交"
      if (cur === "未交") return { ...s, [teacherId]: "草稿" }
      return s
    })
  }

  return (
    <div className="space-y-4">
      <RoleTabNav
        tabs={TABS}
        value={tab}
        onChange={setTab}
        isMobile={isMobile}
        ariaLabel="行政功輔分頁"
      />

      {tab === "overview" ? (
        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  今日當值
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                  示範：9 月 3 日（三）
                </h2>
              </div>
              <Button type="button" variant="outline" onClick={() => setTab("roster")}>
                查看本月編更
              </Button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                <p className="text-xs text-muted-foreground">課室</p>
                <p className="mt-1 text-2xl font-semibold">{overview.todayDuty.room}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                <p className="text-xs text-muted-foreground">時段</p>
                <p className="mt-1 text-lg font-semibold sm:text-xl">15:15–19:30</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                <p className="text-xs text-muted-foreground">當值導師</p>
                <p className="mt-1 text-lg font-semibold sm:text-xl">
                  {dutyLabel(overview.todayDuty)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-semibold">提醒</h2>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li className="flex flex-wrap items-center justify-between gap-2">
                <span>尚有 {overview.unpaid} 人未繳本月月費</span>
                <Button type="button" variant="outline" size="sm" onClick={() => setTab("fees")}>
                  前往月費
                </Button>
              </li>
              <li className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {MOCK_ROSTER_MONTH_LABEL} 報更：{progress.rateLabel}（{progress.missing} 未交）
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTab("roster")
                    setRosterSub("progress")
                  }}
                >
                  報更進度
                </Button>
              </li>
              <li className="flex flex-wrap items-center justify-between gap-2">
                <span>十月編更狀態：{rosterPublishStatus}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTab("roster")
                    setRosterSub("sheet")
                  }}
                >
                  月工作表
                </Button>
              </li>
            </ul>
          </section>
        </div>
      ) : null}

      {tab === "students" ? (
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜尋姓名／學號"
              className="sm:max-w-xs"
            />
            <div className="flex flex-wrap gap-2 sm:ml-auto">
              {hasStudentFilters ? (
                <Button type="button" variant="outline" onClick={clearStudentFilters}>
                  清除篩選
                </Button>
              ) : null}
              <Button type="button" onClick={() => setEnrollOpen(true)}>
                新增報讀
              </Button>
            </div>
          </div>
          <div className="space-y-3 rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4">
            <FilterChipRow
              label="年級"
              value={gradeFilter}
              onChange={setGradeFilter}
              options={[
                { value: "", label: "全部" },
                ...MOCK_PRICE_GRADES.map((g) => ({ value: g, label: g })),
              ]}
            />
            <FilterChipRow
              label="日數檔"
              value={planFilter}
              onChange={setPlanFilter}
              options={[
                { value: "", label: "全部" },
                { value: "三日", label: "每週三日" },
                { value: "四日", label: "每週四日" },
                { value: "五日", label: "每週五日" },
              ]}
            />
            <FilterChipRow
              label="狀態"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "", label: "全部" },
                { value: "在籍", label: "在籍" },
                { value: "暫停", label: "暫停" },
                { value: "結束", label: "結束" },
              ]}
            />
            <FilterChipRow
              label="生效月"
              value={monthFilter}
              onChange={setMonthFilter}
              options={[
                { value: "", label: "全部" },
                ...effectiveMonthOptions.map((m) => ({ value: m, label: m })),
              ]}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            顯示 {filteredStudents.length}／{students.length} 人
          </p>
          {filteredStudents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              沒有符合條件的報讀。
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">姓名</th>
                    <th className="px-3 py-2 font-medium">學號</th>
                    <th className="px-3 py-2 font-medium">年級</th>
                    <th className="px-3 py-2 font-medium">價目檔</th>
                    <th className="px-3 py-2 font-medium">逢星期幾</th>
                    <th className="px-3 py-2 font-medium">生效月</th>
                    <th className="px-3 py-2 font-medium">狀態</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="px-3 py-2.5 font-medium">{s.name}</td>
                      <td className="px-3 py-2.5 tabular-nums text-muted-foreground">{s.code}</td>
                      <td className="px-3 py-2.5">{s.grade}</td>
                      <td className="px-3 py-2.5">每週{s.plan}</td>
                      <td className="px-3 py-2.5">{formatWeekdaysShort(s.weekdays)}</td>
                      <td className="px-3 py-2.5 tabular-nums">{s.effectiveMonth}</td>
                      <td className="px-3 py-2.5">
                        <Tag tone={enrollTone(s.status)} size="sm">
                          {s.status}
                        </Tag>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {tab === "fees" ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">本月月費</h2>
          <p className="text-xs text-muted-foreground">
            已繳 {overview.paid} · 未繳 {overview.unpaid} · 金額合計 —（價錢後補）
          </p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">學生</th>
                  <th className="px-3 py-2 font-medium">價目檔</th>
                  <th className="px-3 py-2 font-medium">應繳</th>
                  <th className="px-3 py-2 font-medium">狀態</th>
                  <th className="px-3 py-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {feeRows.map((row) => (
                  <tr key={row.studentId} className="border-t border-border">
                    <td className="px-3 py-2.5 font-medium">{row.student.name}</td>
                    <td className="px-3 py-2.5">每週{row.student.plan}</td>
                    <td className="px-3 py-2.5">{row.amountLabel}</td>
                    <td className="px-3 py-2.5">
                      <Tag tone={statusToTagTone(row.status)} size="sm">
                        {row.status}
                      </Tag>
                    </td>
                    <td className="px-3 py-2.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          pushBanner({
                            title: "沙盒提示",
                            tone: "info",
                            message: "正式版將跳轉現有繳費入口。",
                          })
                        }
                      >
                        {row.status === "未收款" ? "收款" : "查看單據"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === "roster" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["progress", "報更進度"],
                ["availability", "可上班時段"],
                ["sheet", "月工作表"],
              ] as const
            ).map(([id, label]) => (
              <Button
                key={id}
                type="button"
                size="sm"
                variant={rosterSub === id ? "default" : "outline"}
                onClick={() => setRosterSub(id)}
              >
                {label}
              </Button>
            ))}
            <Tag
              tone={rosterPublishStatus === "已發布" ? "success" : "warning"}
              size="sm"
            >
              {rosterPublishStatus}
            </Tag>
          </div>

          {rosterSub === "progress" ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {MOCK_ROSTER_MONTH_LABEL} · {progress.rateLabel} · 可代填（覆寫老師提交）
              </p>
              <ul className="space-y-2">
                {MOCK_TEACHERS.map((t) => {
                  const st = submitStatus[t.id] ?? "未交"
                  return (
                    <li
                      key={t.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
                    >
                      <span className="font-medium">{t.name}</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <SubmitStatusTag status={st} />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRosterSub("availability")
                            pushBanner({
                              title: "代填",
                              tone: "info",
                              message: `請在可上班時段為 ${t.name} 點格編輯。`,
                            })
                          }}
                        >
                          代填
                        </Button>
                        {st !== "已提交" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSubmitStatus((s) => ({ ...s, [t.id]: "已提交" }))
                              pushBanner({
                                title: "已代交",
                                tone: "success",
                                message: `已將 ${t.name} 標為已提交（沙盒）。`,
                              })
                            }}
                          >
                            標為已提交
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}

          {rosterSub === "availability" ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {MOCK_SPLIT_NOTE} · 點格循環切換（行政覆寫）
              </p>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[520px] text-center text-sm">
                  <thead className="bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-2 py-2 text-left font-medium">老師</th>
                      <th className="px-2 py-2 font-medium">狀態</th>
                      {MOCK_AVAIL_DATES.map((d) => (
                        <th key={d} className="px-2 py-2 font-medium">
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_TEACHERS.map((t) => (
                      <tr key={t.id} className="border-t border-border">
                        <td className="px-2 py-2 text-left font-medium">{t.name}</td>
                        <td className="px-2 py-2">
                          <SubmitStatusTag status={submitStatus[t.id] ?? "未交"} />
                        </td>
                        {MOCK_AVAIL_DATES.map((d) => {
                          const slot = avail[t.id]?.[d] ?? "—"
                          return (
                            <td key={d} className="px-1 py-1">
                              <button
                                type="button"
                                onClick={() => adminCycleAvail(t.id, d)}
                                className={cn(
                                  "w-full rounded-md border px-1 py-1.5 text-xs font-medium",
                                  slot === "—"
                                    ? "border-border bg-muted/30 text-muted-foreground"
                                    : "border-primary/30 bg-primary/10"
                                )}
                              >
                                {slot}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {rosterSub === "sheet" ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">預設課室</span>
                  <Select
                    value={defaultRoom}
                    onChange={(e) => setDefaultRoom(e.target.value)}
                    className="w-28"
                  >
                    <option value="17E">17E</option>
                    <option value="17D">17D</option>
                    <option value="山案座">山案座</option>
                  </Select>
                </label>
                {rosterPublishStatus === "草稿" ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setRosterPublishStatus("已發布")
                      pushBanner({
                        title: "已發布",
                        tone: "success",
                        message: "十月編更已發布；老師報更鎖定（沙盒）。",
                      })
                    }}
                  >
                    發布
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRosterPublishStatus("草稿")
                      pushBanner({ title: "已撤回", tone: "info", message: "已改回草稿。" })
                    }}
                  >
                    撤回草稿
                  </Button>
                )}
              </div>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">日期</th>
                      <th className="px-3 py-2 font-medium">課室</th>
                      <th className="px-3 py-2 font-medium">當值</th>
                      <th className="px-3 py-2 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dutyDays.map((d) => (
                      <tr key={d.date} className="border-t border-border">
                        <td className="px-3 py-2.5 tabular-nums">
                          {d.date}（{d.weekday}）
                          {d.holiday ? (
                            <Tag tone="default" size="sm" className="ml-2">
                              功輔放假
                            </Tag>
                          ) : null}
                        </td>
                        <td className="px-3 py-2.5">{d.room ?? "—"}</td>
                        <td className="px-3 py-2.5">{dutyLabel(d)}</td>
                        <td className="px-3 py-2.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={Boolean(d.holiday)}
                            onClick={() => setEditDay({ ...d })}
                          >
                            改
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "calendar" ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">功輔校曆</h2>
          <ul className="space-y-2">
            {MOCK_HOLIDAYS.map((h) => (
              <li
                key={h.date}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-3 text-sm shadow-sm"
              >
                <div>
                  <p className="font-medium tabular-nums">{h.date}</p>
                  <p className="text-muted-foreground">{h.label}</p>
                </div>
                <Tag tone="default" size="sm">
                  功輔放假
                </Tag>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tab === "settings" ? (
        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-semibold">時段</h2>
            <p className="mt-2 text-sm">15:30–19:30（佔用自 15:15）· 上下節分界 17:00</p>
          </section>
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-semibold">價目表</h2>
            <p className="mt-1 text-xs text-muted-foreground">金額未定顯示「—」</p>
            <table className="mt-3 w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="py-1 text-left">年級</th>
                  <th className="py-1 text-left">三日</th>
                  <th className="py-1 text-left">四日</th>
                  <th className="py-1 text-left">五日</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_PRICE_GRADES.map((g) => (
                  <tr key={g} className="border-t border-border/70">
                    <td className="py-2">{g}</td>
                    <td className="py-2">—</td>
                    <td className="py-2">—</td>
                    <td className="py-2">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            每日功課進度（影相＋打字）不進本系統，繼續使用 Notion。末節讓房規則待定。
          </section>
        </div>
      ) : null}

      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新增功輔報讀</DialogTitle>
            <p className="text-sm text-muted-foreground">
              可紀錄慣常到校星期；不設請假補堂。
            </p>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">學生姓名 *</span>
              <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">年級 *</span>
              <Select value={draftGrade} onChange={(e) => setDraftGrade(e.target.value)}>
                {MOCK_PRICE_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
            </label>
            <fieldset className="space-y-1.5">
              <legend className="text-sm font-medium">每週日數檔 *</legend>
              <div className="flex flex-wrap gap-2">
                {(["三日", "四日", "五日"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onDraftPlanChange(p)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-medium",
                      draftPlan === p
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="space-y-1.5">
              <legend className="text-sm font-medium">
                逢星期幾 *（{planDayCount(draftPlan)} 日）
              </legend>
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDraftWeekday(d)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-medium",
                      draftWeekdays.includes(d)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card"
                    )}
                  >
                    星期{d}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{formatWeekdays(draftWeekdays)}</p>
            </fieldset>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEnrollOpen(false)}>
              取消
            </Button>
            <Button type="button" onClick={onSaveEnroll}>
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editDay)} onOpenChange={(o) => !o && setEditDay(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>編輯當值 — {editDay?.date}</DialogTitle>
          </DialogHeader>
          {editDay ? (
            <div className="space-y-3">
              <Select
                value={editDay.room ?? defaultRoom}
                onChange={(e) => setEditDay({ ...editDay, room: e.target.value })}
              >
                <option value="17E">17E</option>
                <option value="17D">17D</option>
                <option value="山案座">山案座</option>
              </Select>
              <div className="flex gap-2">
                {(["全日", "分上下節"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() =>
                      setEditDay({
                        ...editDay,
                        mode: m,
                        fullTeacherId: m === "全日" ? editDay.fullTeacherId ?? "t1" : undefined,
                        upperTeacherId:
                          m === "分上下節" ? editDay.upperTeacherId ?? "t1" : undefined,
                        lowerTeacherId:
                          m === "分上下節" ? editDay.lowerTeacherId ?? "t2" : undefined,
                      })
                    }
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm",
                      editDay.mode === m
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {editDay.mode === "全日" ? (
                <Select
                  value={editDay.fullTeacherId ?? "t1"}
                  onChange={(e) => setEditDay({ ...editDay, fullTeacherId: e.target.value })}
                >
                  {MOCK_TEACHERS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              ) : (
                <>
                  <Select
                    value={editDay.upperTeacherId ?? "t1"}
                    onChange={(e) => setEditDay({ ...editDay, upperTeacherId: e.target.value })}
                  >
                    {MOCK_TEACHERS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                  <Select
                    value={editDay.lowerTeacherId ?? "t2"}
                    onChange={(e) => setEditDay({ ...editDay, lowerTeacherId: e.target.value })}
                  >
                    {MOCK_TEACHERS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                </>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditDay(null)}>
              取消
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!editDay) return
                setDutyDays((prev) => prev.map((d) => (d.date === editDay.date ? editDay : d)))
                setEditDay(null)
                pushBanner({ title: "已更新", tone: "success", message: "當值已更新（沙盒）。" })
              }}
            >
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
