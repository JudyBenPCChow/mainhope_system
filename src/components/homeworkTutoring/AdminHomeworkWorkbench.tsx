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
import { formatUnknownError } from "@/lib/formatUnknownError"
import {
  HOMEWORK_FEE_GRADES,
  HOMEWORK_FEE_PLANS,
  homeworkFeeBaseHkd,
} from "@/lib/homeworkTutoringFees"
import { statusToTagTone } from "@/lib/statusTag"

import { AvailCellButton, AvailEditDialog } from "./availEditor"
import {
  HOMEWORK_GRADE_FILTER_FALLBACK,
  HW_ROSTER_FLOW_NOTE,
  availDatesForMonth,
  countSubmitProgress,
  currentYearMonth,
  dutyAssignments,
  formatDutyDateHeading,
  formatWeekdays,
  formatWeekdaysShort,
  formatYearMonthLabel,
  getAvailEntry,
  holidaysInYearMonth,
  summarizeOverview,
  teacherName,
  type AllTeacherAvailability,
  type AllTeacherSubmitStatus,
  type AvailEntry,
  type HomeworkDutyDay,
  type HomeworkFeeDisplay,
  type HomeworkHoliday,
  type HomeworkStudentRow,
  type HomeworkTeacherRow,
  type MonthRosterState,
} from "@/lib/homeworkTutoringUi"
import { RosterMonthSheet } from "./RosterMonthSheet"
import type { AdminPageId } from "./homeworkTutoringSectionNav"
import {
  FilterChipRow,
  RoomDutyCard,
  SubmitStatusTag,
  SummaryTile,
} from "./sharedUi"

type RosterSub = "progress" | "availability" | "sheet"

function formatHkd(n: number | null): string {
  if (n == null) return "—"
  return `$${n.toLocaleString("en-HK")}`
}

export function AdminHomeworkWorkbench({
  tab,
  onTabChange,
  students,
  fees,
  avail,
  setAvail,
  submitStatus,
  onPersistTeacherAvail,
  dutyDays,
  overviewDutyDays,
  setDutyDays,
  monthRosterStatus,
  persistMonthRosterStatus,

  hwTeachers,
  holidays = [],
  sheetMonth: sheetMonthProp,
  onSheetMonthChange,
  onPublishRoster,
}: {
  tab: AdminPageId
  onTabChange: (tab: AdminPageId) => void
  students: HomeworkStudentRow[]
  fees: HomeworkFeeDisplay[]
  avail: AllTeacherAvailability
  setAvail: Dispatch<SetStateAction<AllTeacherAvailability>>
  submitStatus: AllTeacherSubmitStatus
  onPersistTeacherAvail: (teacherId: string, status: "草稿" | "已提交") => Promise<void>
  dutyDays: HomeworkDutyDay[]
  overviewDutyDays?: HomeworkDutyDay[]
  setDutyDays: Dispatch<SetStateAction<HomeworkDutyDay[]>>
  monthRosterStatus: Record<string, MonthRosterState>
  persistMonthRosterStatus: (yearMonth: string, state: MonthRosterState) => Promise<void>
  hwTeachers: HomeworkTeacherRow[]
  holidays?: HomeworkHoliday[]
  sheetMonth?: string
  onSheetMonthChange?: (yearMonth: string) => void
  onPublishRoster?: (yearMonth: string, monthDays: HomeworkDutyDay[]) => Promise<void>
}) {
  const { pushBanner } = useAppBanner()
  const isMobile = useIsMobile()
  const [query, setQuery] = useState("")
  const [planFilter, setPlanFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [gradeFilter, setGradeFilter] = useState("")
  const [monthFilter, setMonthFilter] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [rosterSub, setRosterSub] = useState<RosterSub>("sheet")
  const [editAvail, setEditAvail] = useState<{ teacherId: string; date: string } | null>(null)
  const [localSheetMonth, setLocalSheetMonth] = useState(() => currentYearMonth())

  const sheetMonth = sheetMonthProp ?? localSheetMonth
  const setSheetMonth = (ym: string) => {
    if (onSheetMonthChange) onSheetMonthChange(ym)
    else setLocalSheetMonth(ym)
  }

  const overview = useMemo(
    () => summarizeOverview(students, fees, overviewDutyDays ?? dutyDays),
    [students, fees, overviewDutyDays, dutyDays]
  )
  const progress = useMemo(
    () => countSubmitProgress(submitStatus, hwTeachers),
    [submitStatus, hwTeachers]
  )
  const monthLabel = formatYearMonthLabel(sheetMonth)
  const monthHolidays = useMemo(
    () => holidaysInYearMonth(sheetMonth, holidays),
    [sheetMonth, holidays]
  )
  const availDates = useMemo(
    () => availDatesForMonth(sheetMonth, monthHolidays),
    [sheetMonth, monthHolidays]
  )
  const gradeOptions = useMemo(() => {
    const fromStudents = Array.from(new Set(students.map((s) => s.grade))).sort()
    return fromStudents.length > 0 ? fromStudents : [...HOMEWORK_GRADE_FILTER_FALLBACK]
  }, [students])

  const effectiveMonthOptions = useMemo(() => {
    const set = new Set(students.map((s) => s.effectiveMonth))
    return Array.from(set).sort()
  }, [students])

  const studentChipFilterCount = [
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
    setGradeFilter("")
    setMonthFilter("")
  }

  const studentFilterChips = (
    <>
      <FilterChipRow
        label="年級"
        value={gradeFilter}
        onChange={setGradeFilter}
        options={[
          { value: "", label: "全部" },
          ...gradeOptions.map((g) => ({ value: g, label: g })),
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
        label="報讀月份"
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
      .filter(Boolean) as Array<HomeworkFeeDisplay & { student: HomeworkStudentRow }>
  }, [fees, students])

  const adminSaveAvail = async (teacherId: string, date: string, entry: AvailEntry | null) => {
    setAvail((prev) => {
      const nextRow = { ...(prev[teacherId] ?? {}) }
      if (entry == null) delete nextRow[date]
      else nextRow[date] = entry
      return { ...prev, [teacherId]: nextRow }
    })
    const cur = submitStatus[teacherId] ?? "未交"
    const nextStatus = cur === "已提交" ? "已提交" : "草稿"
    try {
      await onPersistTeacherAvail(teacherId, nextStatus)
    } catch (e) {
      pushBanner({
        title: "儲存失敗",
        tone: "error",
        message: formatUnknownError(e),
      })
    }
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
              label="今日到校"
              value={String(overview.todayCount)}
              hint={
                overview.todayWeekday
                  ? `慣常逢${formatWeekdays([overview.todayWeekday])}`
                  : undefined
              }
            />
            <SummaryTile label="在籍" value={String(overview.activeCount)} />
            <SummaryTile label="本月已繳" value={String(overview.paid)} />
            <SummaryTile label="本月未繳" value={String(overview.unpaid)} hint="不含暫停／結束" />
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                今日當值
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                {overview.todayDuty
                  ? formatDutyDateHeading(overview.todayDuty)
                  : "今日無功輔當值"}
              </h2>
            </div>
            <Button type="button" variant="outline" onClick={() => onTabChange("roster")}>
              前往當值編更
            </Button>
          </div>
          {overview.todayDuty && !overview.todayDuty.holiday ? (
            <div className="space-y-3">
              {dutyAssignments(overview.todayDuty).length === 0 ? (
                <p className="text-sm text-muted-foreground">今日尚未排當值。</p>
              ) : (
                dutyAssignments(overview.todayDuty).map((a, i) => (
                  <RoomDutyCard
                    key={`${a.teacherId}-${a.room}-${i}`}
                    room={a.room}
                    tone={i % 2 === 0 ? "info" : "success"}
                    session={`${a.start}–${a.end}`}
                    teacher={teacherName(a.teacherId, hwTeachers)}
                    weekdayHint={
                      overview.todayWeekday
                        ? `慣常逢${formatWeekdays([overview.todayWeekday])}`
                        : "—"
                    }
                  />
                ))
              )}
            </div>
          ) : overview.todayDuty?.holiday ? (
            <p className="text-sm text-muted-foreground">今日功輔放假：{overview.todayDuty.holiday}</p>
          ) : (
            <p className="text-sm text-muted-foreground">今日無開放日或尚未編更。</p>
          )}

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
                  {monthLabel} 報更：{progress.rateLabel}（{progress.missing} 未交）
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
                  {monthLabel} 編更：
                  {monthRosterStatus[sheetMonth] ?? "未編更"}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onTabChange("roster")
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
                    <th className="px-3 py-2 font-medium">報讀月份</th>
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
                        <Tag tone={statusToTagTone(s.status)} size="sm">
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
          <h2 className="text-sm font-semibold">{formatYearMonthLabel(currentYearMonth())}月費</h2>
          <p className="text-xs text-muted-foreground">
            已繳／未繳以繳費紀錄為準（單據覆蓋月份）。請到「收款登記」出單，本頁不另開收款。已繳 {overview.paid} · 未繳 {overview.unpaid}
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
                              ? `/Payments?studentId=${encodeURIComponent(row.studentId)}&mode=receive${
                                  row.classId ? `&classId=${encodeURIComponent(row.classId)}` : ""
                                }`
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
                {monthLabel} · {progress.rateLabel} · 可代填（覆寫）
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
                              void (async () => {
                                try {
                                  await onPersistTeacherAvail(t.id, "已提交")
                                  pushBanner({
                                    title: "已代交",
                                    tone: "success",
                                    message: `已將 ${t.name} 標為已提交。`,
                                  })
                                } catch (e) {
                                  pushBanner({
                                    title: "儲存失敗",
                                    tone: "error",
                                    message: formatUnknownError(e),
                                  })
                                }
                              })()
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
                {HW_ROSTER_FLOW_NOTE} · 點格編輯（行政覆寫）；空白＝該日不報 · 顯示該月全部平日
              </p>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[520px] text-center text-sm">
                  <thead className="bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-2 py-2 text-left font-medium">老師</th>
                      <th className="px-2 py-2 font-medium">狀態</th>
                      {availDates.map((d) => (
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
                        {availDates.map((d) => {
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
              onMonthStatusChange={(ym, state) => persistMonthRosterStatus(ym, state)}
              avail={avail}
              teachers={hwTeachers}
              holidays={holidays}
              students={students}
              onPublish={onPublishRoster}
            />
          </TabsContent>
        </Tabs>
      ) : null}

      {tab === "calendar" ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">功輔校曆</h2>
          <ul className="space-y-2">
            {holidays.map((h) => (
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
              場次 15:30–19:30（課室佔用自 15:15）。排更時段默認跟報更，可改；一日可排多於一位，唔使全日都有人。課室預設 17D／17E。
            </p>
          </section>
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="text-sm font-semibold">價目表</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              港元／月；小一至小六跟中一。12 月、2 月收四分三。中四至中六未列價。
            </p>
            <table className="mt-3 w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="py-1 text-left">年級</th>
                  {HOMEWORK_FEE_PLANS.map((p) => (
                    <th key={p} className="py-1 text-left">
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOMEWORK_FEE_GRADES.map((g) => (
                  <tr key={g} className="border-t border-border/70">
                    <td className="py-2">{g}{g === "中一" ? "（含小學）" : ""}</td>
                    {HOMEWORK_FEE_PLANS.map((p) => (
                      <td key={p} className="py-2 tabular-nums">
                        {formatHkd(homeworkFeeBaseHkd(p, g))}
                      </td>
                    ))}
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
          onSave={(entry) => void adminSaveAvail(editAvail.teacherId, editAvail.date, entry)}
        />
      ) : null}
    </div>
  )
}
