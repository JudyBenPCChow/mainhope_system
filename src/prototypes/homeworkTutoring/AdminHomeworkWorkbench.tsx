import { useMemo, useState, type Dispatch, type SetStateAction } from "react"
import { Link } from "react-router-dom"
import { SlidersHorizontal } from "lucide-react"

import { MobileFilterSheet } from "@/components/mobile/MobileFilterSheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tag } from "@/components/ui/tag"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAppBanner } from "@/lib/appBanner"
import { statusToTagTone } from "@/lib/statusTag"

import { AvailCellButton, AvailEditDialog } from "./availEditor"
import {
  MOCK_AVAIL_DATES,
  MOCK_HOLIDAYS,
  MOCK_PRICE_GRADES,
  MOCK_ROSTER_MONTH_LABEL,
  MOCK_SPLIT_NOTE,
  countSubmitProgress,
  currentYearMonth,
  formatSession,
  formatWeekdays,
  formatWeekdaysShort,
  formatYearMonthLabel,
  getAvailEntry,
  summarizeOverview,
  studentDivision,
  teacherName,
  type AllTeacherAvailability,
  type AllTeacherSubmitStatus,
  type AvailEntry,
  type HwDivision,
  type MockDutyDay,
  type MockFeeRow,
  type MockStudent,
  type MockTeacher,
  type MonthRosterState,
} from "./mockData"
import { RosterMonthSheet } from "./RosterMonthSheet"
import type { AdminPageId } from "./sandboxNav"
import {
  DivisionDutyCard,
  FilterChipRow,
  SubmitStatusTag,
  SummaryTile,
  enrollTone,
} from "./sharedUi"

type RosterSub = "progress" | "availability" | "sheet"

export function AdminHomeworkWorkbench({
  tab,
  onTabChange,
  students,
  fees,
  avail,
  setAvail,
  submitStatus,
  setSubmitStatus,
  dutyDays,
  setDutyDays,
  monthRosterStatus,
  setMonthRosterStatus,
  hwTeachers,
}: {
  tab: AdminPageId
  onTabChange: (tab: AdminPageId) => void
  students: MockStudent[]
  fees: MockFeeRow[]
  avail: AllTeacherAvailability
  setAvail: Dispatch<SetStateAction<AllTeacherAvailability>>
  submitStatus: AllTeacherSubmitStatus
  setSubmitStatus: Dispatch<SetStateAction<AllTeacherSubmitStatus>>
  dutyDays: MockDutyDay[]
  setDutyDays: Dispatch<SetStateAction<MockDutyDay[]>>
  monthRosterStatus: Record<string, MonthRosterState>
  setMonthRosterStatus: Dispatch<SetStateAction<Record<string, MonthRosterState>>>
  hwTeachers: MockTeacher[]
}) {
  const { pushBanner } = useAppBanner()
  const isMobile = useIsMobile()
  const [query, setQuery] = useState("")
  const [planFilter, setPlanFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [divisionFilter, setDivisionFilter] = useState<"" | HwDivision>("")
  const [gradeFilter, setGradeFilter] = useState("")
  const [monthFilter, setMonthFilter] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [rosterSub, setRosterSub] = useState<RosterSub>("sheet")
  const [editAvail, setEditAvail] = useState<{ teacherId: string; date: string } | null>(null)
  const [sheetMonth, setSheetMonth] = useState(() => currentYearMonth())

  const overview = useMemo(() => summarizeOverview(students, fees), [students, fees])
  const progress = useMemo(
    () => countSubmitProgress(submitStatus, hwTeachers),
    [submitStatus, hwTeachers]
  )
  const effectiveMonthOptions = useMemo(() => {
    const set = new Set(students.map((s) => s.effectiveMonth))
    return Array.from(set).sort()
  }, [students])

  const studentChipFilterCount = [
    divisionFilter,
    gradeFilter,
    planFilter,
    statusFilter,
    monthFilter,
  ].filter(Boolean).length

  const hasStudentFilters = Boolean(query.trim()) || studentChipFilterCount > 0

  const clearStudentFilters = () => {
    setQuery("")
    setPlanFilter("")
    setStatusFilter("")
    setDivisionFilter("")
    setGradeFilter("")
    setMonthFilter("")
  }

  const studentFilterChips = (
    <>
      <FilterChipRow
        label="學部"
        value={divisionFilter}
        onChange={(v) => setDivisionFilter(v as "" | HwDivision)}
        options={[
          { value: "", label: "全部" },
          { value: "secondary", label: "中學" },
          { value: "primary", label: "小學" },
        ]}
      />
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
    </>
  )

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase()
    return students.filter((s) => {
      if (planFilter && s.plan !== planFilter) return false
      if (statusFilter && s.status !== statusFilter) return false
      if (divisionFilter && studentDivision(s.grade) !== divisionFilter) return false
      if (gradeFilter && s.grade !== gradeFilter) return false
      if (monthFilter && s.effectiveMonth !== monthFilter) return false
      if (!q) return true
      return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
    })
  }, [students, query, planFilter, statusFilter, divisionFilter, gradeFilter, monthFilter])

  const feeRows = useMemo(() => {
    return fees
      .map((f) => {
        const s = students.find((x) => x.id === f.studentId)
        if (!s || s.status === "結束") return null
        return { ...f, student: s }
      })
      .filter(Boolean) as Array<MockFeeRow & { student: MockStudent }>
  }, [fees, students])

  const adminSaveAvail = (teacherId: string, date: string, entry: AvailEntry | null) => {
    setAvail((prev) => {
      const nextRow = { ...(prev[teacherId] ?? {}) }
      if (entry == null) delete nextRow[date]
      else nextRow[date] = entry
      return { ...prev, [teacherId]: nextRow }
    })
    setSubmitStatus((s) => {
      const cur = s[teacherId] ?? "未交"
      if (cur === "未交") return { ...s, [teacherId]: "草稿" }
      return s
    })
  }

  const editingAvailEntry = editAvail
    ? getAvailEntry(avail, editAvail.teacherId, editAvail.date)
    : null

  return (
    <div className="space-y-4">
      {tab === "overview" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryTile
              label="中學本日"
              value={String(overview.todaySecondary)}
              hint={
                overview.todayWeekday
                  ? `慣常逢${formatWeekdays([overview.todayWeekday])}`
                  : undefined
              }
            />
            <SummaryTile
              label="小學本日"
              value={String(overview.todayPrimary)}
              hint={
                overview.todayWeekday
                  ? `慣常逢${formatWeekdays([overview.todayWeekday])}`
                  : undefined
              }
            />
            <SummaryTile label="本月已繳" value={String(overview.paid)} />
            <SummaryTile label="本月未繳" value={String(overview.unpaid)} hint="不含暫停／結束" />
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                今日當值
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                示範：9 月 3 日（三）
              </h2>
            </div>
            <Button type="button" variant="outline" onClick={() => onTabChange("roster")}>
              查看本月編更
            </Button>
          </div>
          <div className="space-y-3">
            <DivisionDutyCard
              title="中學"
              division="secondary"
              tone="info"
              studentCount={overview.todaySecondary}
              weekdayHint={
                overview.todayWeekday
                  ? `慣常逢${formatWeekdays([overview.todayWeekday])}`
                  : "—"
              }
              room={overview.todayDuty.secondaryRoom ?? "—"}
              session={formatSession(overview.todayDuty)}
              teacher={teacherName(overview.todayDuty.secondaryTeacherId)}
            />
            <DivisionDutyCard
              title="小學"
              division="primary"
              tone="success"
              studentCount={overview.todayPrimary}
              weekdayHint={
                overview.todayWeekday
                  ? `慣常逢${formatWeekdays([overview.todayWeekday])}`
                  : "—"
              }
              room={overview.todayDuty.primaryRoom ?? "—"}
              session={formatSession(overview.todayDuty)}
              teacher={teacherName(overview.todayDuty.primaryTeacherId)}
            />
          </div>

          <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-semibold">提醒</h2>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li className="flex flex-wrap items-center justify-between gap-2">
                <span>尚有 {overview.unpaid} 人未繳本月月費</span>
                <Button type="button" variant="outline" size="sm" onClick={() => onTabChange("fees")}>
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
                    onTabChange("roster")
                    setRosterSub("progress")
                  }}
                >
                  報更進度
                </Button>
              </li>
              <li className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {formatYearMonthLabel(currentYearMonth())} 編更：
                  {monthRosterStatus[currentYearMonth()] ?? "未編更"}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onTabChange("roster")
                    setRosterSub("sheet")
                    setSheetMonth(currentYearMonth())
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
            {isMobile ? (
              <Button
                type="button"
                variant="outline"
                className="h-10 gap-2"
                onClick={() => setFiltersOpen(true)}
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden />
                篩選
                {studentChipFilterCount > 0 ? (
                  <Tag tone="info" size="sm">
                    {studentChipFilterCount}
                  </Tag>
                ) : null}
              </Button>
            ) : null}
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜尋姓名／學號"
              className="h-10 sm:max-w-xs"
            />
            <div className="flex flex-wrap gap-2 sm:ml-auto">
              {hasStudentFilters ? (
                <Button type="button" variant="outline" onClick={clearStudentFilters}>
                  清除篩選
                </Button>
              ) : null}
              <Button type="button" asChild>
                <Link to="/Students">前往學生管理</Link>
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            本頁只列出已報讀功課輔導班的學生。新學生請先到學生管理「新增學生」註冊，再到學生詳細頁「報讀班別」加入功課輔導班，並選每週日數及逢星期幾。
          </p>
          {isMobile ? (
            <MobileFilterSheet
              open={filtersOpen}
              onClose={() => setFiltersOpen(false)}
              title="篩選功輔報讀"
              activeCount={studentChipFilterCount}
              onReset={clearStudentFilters}
            >
              {studentFilterChips}
            </MobileFilterSheet>
          ) : (
            <div className="space-y-3 rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4">
              {studentFilterChips}
            </div>
          )}
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
                      <Button type="button" size="sm" variant="outline" asChild>
                        <Link
                          to={
                            row.status === "未收款"
                              ? `/Payments?studentId=${encodeURIComponent(row.studentId)}&mode=receive`
                              : `/PaymentHistory?studentId=${encodeURIComponent(row.studentId)}`
                          }
                        >
                          {row.status === "未收款" ? "收款" : "查看單據"}
                        </Link>
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
        <Tabs
          value={rosterSub}
          onValueChange={(v) => {
            if (v === "progress" || v === "availability" || v === "sheet") setRosterSub(v)
          }}
          className="space-y-3"
        >
          <TabsList className="w-full justify-start sm:w-auto">
            <TabsTrigger value="progress">報更進度</TabsTrigger>
            <TabsTrigger value="availability">可上班時段</TabsTrigger>
            <TabsTrigger value="sheet">月工作表</TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="mt-0 space-y-2">
              <p className="text-sm text-muted-foreground">
                {MOCK_ROSTER_MONTH_LABEL} · {progress.rateLabel} · 老師只報一次更；可代填（覆寫）
              </p>
              <ul className="space-y-2">
                {hwTeachers.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    尚未剔選有功課輔導班入口的老師。請由管理層「老師入口」剔選。
                  </li>
                ) : null}
                {hwTeachers.map((t) => {
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
            </TabsContent>

          <TabsContent value="availability" className="mt-0 space-y-2">
              <p className="text-xs text-muted-foreground">
                {MOCK_SPLIT_NOTE} · 點格編輯（行政覆寫）；空白＝該日不報 · 顯示該月全部平日
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
                    {hwTeachers.map((t) => (
                      <tr key={t.id} className="border-t border-border">
                        <td className="px-2 py-2 text-left font-medium">{t.name}</td>
                        <td className="px-2 py-2">
                          <SubmitStatusTag status={submitStatus[t.id] ?? "未交"} />
                        </td>
                        {MOCK_AVAIL_DATES.map((d) => {
                          const entry = getAvailEntry(avail, t.id, d)
                          return (
                            <td key={d} className="px-1 py-1">
                              <AvailCellButton
                                entry={entry}
                                date={d}
                                compact
                                onClick={() => setEditAvail({ teacherId: t.id, date: d })}
                              />
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

          <TabsContent value="sheet" className="mt-0">
            <RosterMonthSheet
              yearMonth={sheetMonth}
              onYearMonthChange={setSheetMonth}
              dutyDays={dutyDays}
              onDutyDaysChange={setDutyDays}
              monthStatus={monthRosterStatus}
              onMonthStatusChange={(ym, state) =>
                setMonthRosterStatus((prev) => ({ ...prev, [ym]: state }))
              }
              avail={avail}
            />
          </TabsContent>
        </Tabs>
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
                <Tag tone={statusToTagTone("功輔放假")} size="sm">
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
            <p className="mt-2 text-sm">
              中學部／小學部同為 15:30–19:30（佔用自 15:15）；月工作表可按日改編班時間。課室
              17D／17E。
            </p>
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
            每日功課進度（影相＋打字）不進本系統，繼續使用 Notion。末節讓房不做。
          </section>
        </div>
      ) : null}

      {editAvail ? (
        <AvailEditDialog
          open
          date={editAvail.date}
          entry={editingAvailEntry}
          onOpenChange={(open) => {
            if (!open) setEditAvail(null)
          }}
          onSave={(entry) => adminSaveAvail(editAvail.teacherId, editAvail.date, entry)}
        />
      ) : null}
    </div>
  )
}
