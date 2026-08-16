import { useCallback, useEffect, useMemo, useState } from "react"
import { BarChart3, Download, Loader2, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { useAppBanner } from "@/lib/appBanner"
import { downloadTeacherAttendancePdf } from "@/lib/secondaryAttendancePdf"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { addBillingMonths, formatBillingMonth } from "@/lib/monthlyTuition"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import {
  classAbsentTotal,
  classKindLabel,
  classPresentTotal,
  currentBillingMonthYmd,
  fetchTeacherSecondaryAttendanceReport,
  gradeAbsentTotal,
  gradeLessonCount,
  gradePresentTotal,
  lessonAbsentCount,
  lessonPresentCount,
  teacherAbsentTotal,
  teacherCategoryTotals,
  teacherClassCount,
  teacherGradeKindRows,
  teacherLessonCount,
  teacherPresentTotal,
  type SecondaryClassBlock,
  type SecondaryLessonRow,
  type SecondaryTeacherBlock,
} from "@/services/secondaryAttendanceReportQueries"

function SummaryStat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function NameList({ label, names, empty }: { label: string; names: string[]; empty: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 break-words text-sm text-foreground">
        {names.length > 0 ? names.join("、") : empty}
      </p>
    </div>
  )
}

function LessonCard({ lesson }: { lesson: SecondaryLessonRow }) {
  const present = lessonPresentCount(lesson)
  const absent = lessonAbsentCount(lesson)
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium tabular-nums text-foreground">
          {lesson.date}
          <span className="ml-2 font-normal text-muted-foreground">
            {lesson.startTime}–{lesson.endTime}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {lesson.notRolled ? (
            <Tag tone="warning">未點名</Tag>
          ) : (
            <>
              <span className="tabular-nums text-foreground">出席 {present} 人次</span>
              <span className="tabular-nums text-muted-foreground">缺席 {absent} 人次</span>
            </>
          )}
        </div>
      </div>
      {lesson.makeupOrTrialNote ? (
        <p className="mt-1 text-xs text-muted-foreground">{lesson.makeupOrTrialNote}</p>
      ) : null}
      {lesson.notRolled ? (
        <p className="mt-2 text-sm text-muted-foreground">尚無點名紀錄</p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <NameList label="出席學生" names={lesson.presentStudents} empty="—" />
          <NameList label="缺席學生" names={lesson.absentStudents} empty="—" />
        </div>
      )}
    </div>
  )
}

function ClassDetail({ block }: { block: SecondaryClassBlock }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{block.name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {classKindLabel(block.classKind)} · {block.lessons.length} 堂 · 出席{" "}
            {classPresentTotal(block)} 人次 · 缺席 {classAbsentTotal(block)} 人次
          </p>
        </div>
        <Tag tone={block.classKind === "private" ? "info" : "default"}>
          {classKindLabel(block.classKind)}
        </Tag>
      </div>
      <div className="mt-3 space-y-2">
        {block.lessons.map((l) => (
          <LessonCard key={l.id} lesson={l} />
        ))}
      </div>
    </section>
  )
}

function TeacherDetail({ teacher }: { teacher: SecondaryTeacherBlock }) {
  const cats = teacherCategoryTotals(teacher)
  const gradeKindRows = teacherGradeKindRows(teacher)
  return (
    <div className="space-y-5">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[24%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[20%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2.5 font-medium">類別</th>
              <th className="px-3 py-2.5 font-medium">年級數</th>
              <th className="px-3 py-2.5 font-medium">班數</th>
              <th className="px-3 py-2.5 font-medium">堂數</th>
              <th className="px-3 py-2.5 font-medium">出席人次</th>
              <th className="px-3 py-2.5 font-medium">缺席人次</th>
            </tr>
          </thead>
          <tbody>
            {cats.map((b) => (
              <tr key={b.key} className="border-b border-border">
                <td className="px-3 py-2.5 font-medium">{b.label}</td>
                <td className="px-3 py-2.5 tabular-nums">{b.gradeIds.size}</td>
                <td className="px-3 py-2.5 tabular-nums">{b.classCount}</td>
                <td className="px-3 py-2.5 tabular-nums">{b.lessonCount}</td>
                <td className="px-3 py-2.5 tabular-nums font-semibold">{b.presentVisits}</td>
                <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                  {b.absentVisits}
                </td>
              </tr>
            ))}
            <tr className="border-b border-border bg-muted/20 last:border-0">
              <td className="px-3 py-2.5 font-semibold">合計</td>
              <td className="px-3 py-2.5 tabular-nums text-muted-foreground">—</td>
              <td className="px-3 py-2.5 tabular-nums font-semibold">
                {cats.reduce((s, c) => s + c.classCount, 0)}
              </td>
              <td className="px-3 py-2.5 tabular-nums font-semibold">
                {cats.reduce((s, c) => s + c.lessonCount, 0)}
              </td>
              <td className="px-3 py-2.5 tabular-nums font-semibold">
                {teacherPresentTotal(teacher)}
              </td>
              <td className="px-3 py-2.5 tabular-nums font-semibold">
                {teacherAbsentTotal(teacher)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[24%]" />
            <col className="w-[24%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2.5 font-medium">年級</th>
              <th className="px-3 py-2.5 font-medium">類型</th>
              <th className="px-3 py-2.5 font-medium">班數</th>
              <th className="px-3 py-2.5 font-medium">堂數</th>
              <th className="px-3 py-2.5 font-medium">出席人次</th>
              <th className="px-3 py-2.5 font-medium">缺席人次</th>
            </tr>
          </thead>
          <tbody>
            {gradeKindRows.map((r) => (
              <tr
                key={`${r.gradeLabel}-${r.classKind}`}
                className="border-b border-border last:border-0"
              >
                <td className="px-3 py-2.5 font-medium">{r.gradeLabel}</td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {classKindLabel(r.classKind)}
                </td>
                <td className="px-3 py-2.5 tabular-nums">{r.classCount}</td>
                <td className="px-3 py-2.5 tabular-nums">{r.lessonCount}</td>
                <td className="px-3 py-2.5 tabular-nums font-semibold">{r.presentVisits}</td>
                <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                  {r.absentVisits}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {teacher.grades.map((g) => (
        <div key={g.gradeLabel} className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
            <h2 className="text-base font-semibold text-foreground">{g.gradeLabel}</h2>
            <p className="text-xs text-muted-foreground">
              出席 {gradePresentTotal(g)} 人次 · 缺席 {gradeAbsentTotal(g)} 人次 · {g.classes.length}{" "}
              班 · {gradeLessonCount(g)} 堂
            </p>
          </div>
          {g.classes.map((c) => (
            <ClassDetail key={`${g.gradeLabel}-${c.id}-${c.classKind}`} block={c} />
          ))}
        </div>
      ))}
    </div>
  )
}

function monthOptionsAround(current: string): string[] {
  const opts: string[] = []
  for (let i = -8; i <= 2; i++) {
    opts.push(addBillingMonths(current, i))
  }
  return opts.reverse()
}

export function SecondaryAttendanceReportView() {
  const { pushBanner } = useAppBanner()
  const [yearMonth, setYearMonth] = useState(currentBillingMonthYmd)
  const [teachers, setTeachers] = useState<SecondaryTeacherBlock[]>([])
  const [teacherId, setTeacherId] = useState("")
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [pdfBusy, setPdfBusy] = useState(false)

  const monthChoices = useMemo(() => monthOptionsAround(currentBillingMonthYmd()), [])

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setTeachers([])
      setLoading(false)
      return
    }
    setLoading(true)
    setErr(null)
    try {
      const payload = await fetchTeacherSecondaryAttendanceReport(yearMonth)
      setTeachers(payload.teachers)
      setTeacherId((prev) => {
        if (prev && payload.teachers.some((t) => t.id === prev)) return prev
        return payload.teachers[0]?.id ?? ""
      })
    } catch (e) {
      reportUserFacingError(e, {
        source: "SecondaryAttendanceReportView.load",
        setErr,
      })
      setTeachers([])
    } finally {
      setLoading(false)
    }
  }, [yearMonth])

  useEffect(() => {
    void load()
  }, [load])

  const selected = useMemo(
    () => teachers.find((t) => t.id === teacherId) ?? teachers[0] ?? null,
    [teacherId, teachers]
  )

  const overview = useMemo(
    () =>
      teachers.map((t) => ({
        id: t.id,
        name: t.name,
        grades: t.grades.length,
        classes: teacherClassCount(t),
        lessons: teacherLessonCount(t),
        present: teacherPresentTotal(t),
        absent: teacherAbsentTotal(t),
      })),
    [teachers]
  )

  const onDownloadPdf = async () => {
    if (!selected || pdfBusy) return
    setPdfBusy(true)
    try {
      await downloadTeacherAttendancePdf(selected, yearMonth)
      pushBanner({
        tone: "success",
        title: "已下載 PDF",
        message: `${selected.name} ${formatBillingMonth(yearMonth)} 計算頁已下載。`,
      })
    } catch (e) {
      reportUserFacingError(e, {
        source: "SecondaryAttendanceReportView.pdf",
        setErr: (msg) =>
          pushBanner({
            tone: "error",
            title: "PDF 下載失敗",
            message: msg ?? "未知錯誤",
          }),
      })
    } finally {
      setPdfBusy(false)
    }
  }

  return (
    <div className="space-y-6 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <BarChart3 className="h-8 w-8 text-primary" aria-hidden />
            老師中學出席統計
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            以當日排程老師歸屬；中一至中六；人次＝每堂實際出席加總。四類分計：初中／高中 ×
            小組／一對一。可下載該老師計算頁 PDF。
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="block min-w-[9rem]">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">月份</span>
            <Select
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              aria-label="統計月份"
            >
              {monthChoices.map((m) => (
                <option key={m} value={m}>
                  {formatBillingMonth(m)}
                </option>
              ))}
            </Select>
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={!isSupabaseConfigured || loading}
          >
            <RefreshCw className={cn("mr-1.5 h-4 w-4", loading && "animate-spin")} />
            重新整理
          </Button>
        </div>
      </header>

      {!isSupabaseConfigured ? (
        <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          尚未設定 Supabase，無法載入報表。
        </p>
      ) : null}

      {err ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {err}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : teachers.length === 0 ? (
        <p className="rounded-lg border border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
          此月沒有中一至中六的非取消排程（或以當日老師計無資料）。
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col className="w-[22%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[21%]" />
                <col className="w-[21%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium">老師</th>
                  <th className="px-3 py-2.5 font-medium">年級數</th>
                  <th className="px-3 py-2.5 font-medium">班數</th>
                  <th className="px-3 py-2.5 font-medium">堂數</th>
                  <th className="px-3 py-2.5 font-medium">出席人次</th>
                  <th className="px-3 py-2.5 font-medium">缺席人次</th>
                </tr>
              </thead>
              <tbody>
                {overview.map((row) => (
                  <tr
                    key={row.id}
                    className={
                      row.id === selected?.id
                        ? "border-b border-border bg-info/5 last:border-0"
                        : "border-b border-border last:border-0"
                    }
                  >
                    <td className="px-3 py-2.5 font-medium">{row.name}</td>
                    <td className="px-3 py-2.5 tabular-nums">{row.grades}</td>
                    <td className="px-3 py-2.5 tabular-nums">{row.classes}</td>
                    <td className="px-3 py-2.5 tabular-nums">{row.lessons}</td>
                    <td className="px-3 py-2.5 tabular-nums font-semibold">{row.present}</td>
                    <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                      {row.absent}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
            <label className="block min-w-[12rem] flex-1">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                選擇老師
              </span>
              <Select
                value={selected?.id ?? ""}
                onChange={(e) => setTeacherId(e.target.value)}
                aria-label="選擇老師"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </label>
            {selected ? (
              <div className="flex flex-wrap gap-3 pb-0.5 text-sm">
                {teacherCategoryTotals(selected).map((c) => (
                  <SummaryStat key={c.key} label={`${c.label}出席`} value={c.presentVisits} />
                ))}
              </div>
            ) : null}
            <Button
              type="button"
              variant="default"
              size="sm"
              className="ml-auto"
              disabled={!selected || pdfBusy}
              onClick={() => void onDownloadPdf()}
            >
              {pdfBusy ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-1.5 h-4 w-4" />
              )}
              {pdfBusy ? "產生 PDF…" : "下載此老師計算頁 PDF"}
            </Button>
          </div>

          {selected ? (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {selected.name}{"\u3000"}明細
              </h2>
              <TeacherDetail teacher={selected} />
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
