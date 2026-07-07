import { useCallback, useState } from "react"
import { Link } from "react-router-dom"
import { Bot, Copy, Download, Loader2, RefreshCw, Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { statusToTagTone } from "@/lib/statusTag"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import {
  downloadTextFile,
  exportOverdueTuitionCsv,
  fetchAiReport,
  type FetchAiReportResult,
  type OverdueTuitionRow,
} from "@/services/aiReportQueries"

const REPORT_OPTIONS = [{ value: "overdue_tuition", label: "追收學費摘要" }] as const

function formatGeneratedAt(iso: string): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleString("zh-Hant", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  } catch {
    return iso
  }
}

function studentDisplayName(row: OverdueTuitionRow): string {
  return row.full_name?.trim() || row.english_name?.trim() || row.student_code || "（未命名）"
}

export function AiReportsView() {
  const [reportType, setReportType] = useState<(typeof REPORT_OPTIONS)[number]["value"]>("overdue_tuition")
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [result, setResult] = useState<Extract<FetchAiReportResult, { ok: true }> | null>(null)
  const [copyOk, setCopyOk] = useState(false)

  const generate = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setErr("尚未設定 Supabase，無法生成報表。")
      return
    }
    setLoading(true)
    setErr(null)
    setCopyOk(false)
    try {
      const res = await fetchAiReport({ reportType, includeSummary: true })
      if (!res.ok) {
        setResult(null)
        setErr(res.message)
        return
      }
      setResult(res)
    } catch (e) {
      reportUserFacingError(e, { source: "AiReportsView.generate", setErr })
      setResult(null)
    } finally {
      setLoading(false)
    }
  }, [reportType])

  const onExportCsv = () => {
    if (!result || result.records.length === 0) return
    const csv = exportOverdueTuitionCsv(result.records)
    const filename = `追收學費摘要_${result.hkDate}.csv`
    downloadTextFile(filename, `\uFEFF${csv}`, "text/csv;charset=utf-8")
  }

  const onCopySummary = async () => {
    if (!result?.summary) return
    try {
      await navigator.clipboard.writeText(result.summary)
      setCopyOk(true)
      window.setTimeout(() => setCopyOk(false), 2000)
    } catch {
      setErr("無法複製摘要，請手動選取文字。")
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" aria-hidden />
            <h1 className="text-2xl font-semibold tracking-tight">AI 報表</h1>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            唯讀報表工作區：資料來自現有系統查詢，不會自動修改任何紀錄。AI 摘要僅供內部參考，實際追收請以
            <Link to="/Payments" className="mx-1 text-primary underline-offset-2 hover:underline">
              繳費紀錄
            </Link>
            為準。
          </p>
        </div>
        <Button type="button" variant="outline" asChild>
          <Link to="/Payments">
            <Wallet className="h-4 w-4" />
            前往繳費紀錄
          </Link>
        </Button>
      </div>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[12rem] flex-1">
            <label className="mb-1.5 block text-sm font-medium text-foreground">報表類型</label>
            <Select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as typeof reportType)}
              disabled={loading}
            >
              {REPORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <Button type="button" onClick={() => void generate()} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                生成中…
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                生成報表
              </>
            )}
          </Button>
        </div>
        {err && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {err}
          </p>
        )}
      </section>

      {result && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="需追收學生" value={String(result.stats.total_count)} suffix="人" />
            <StatCard label="合計欠堂" value={String(result.stats.total_lesson_gap)} suffix="堂" />
            <StatCard label="平均欠堂" value={String(result.stats.avg_lesson_gap)} suffix="堂" />
            <StatCard label="最高欠堂" value={String(result.stats.max_lesson_gap)} suffix="堂" />
          </section>

          <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">AI 摘要</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  資料截至 {result.hkDate}（香港時間）｜生成於 {formatGeneratedAt(result.generatedAt)}｜
                  {result.summarySource === "llm" ? "AI 生成" : "系統模板"}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => void onCopySummary()}>
                <Copy className="h-4 w-4" />
                {copyOk ? "已複製" : "複製摘要"}
              </Button>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{result.summary}</p>
          </section>

          <section className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 className="text-base font-semibold">明細列表（{result.records.length} 筆）</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onExportCsv}
                disabled={result.records.length === 0}
              >
                <Download className="h-4 w-4" />
                匯出 CSV
              </Button>
            </div>
            {result.records.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">目前沒有需要追收的學生。</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                      <th className="w-[10%] px-3 py-2.5 font-medium">學號</th>
                      <th className="w-[14%] px-3 py-2.5 font-medium">姓名</th>
                      <th className="w-[8%] px-3 py-2.5 font-medium">年級</th>
                      <th className="w-[9%] px-3 py-2.5 font-medium">已繳</th>
                      <th className="w-[9%] px-3 py-2.5 font-medium">已出席</th>
                      <th className="w-[9%] px-3 py-2.5 font-medium">欠堂</th>
                      <th className="w-[20%] px-3 py-2.5 font-medium">報讀狀態</th>
                      <th className="w-[21%] px-3 py-2.5 font-medium">活躍狀態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.records.map((row) => (
                      <tr key={row.student_id} className="border-b border-border/70 last:border-0">
                        <td className="min-w-0 truncate px-3 py-2.5" title={row.student_code ?? ""}>
                          <Link
                            to={`/Students/${row.student_id}`}
                            className="text-primary underline-offset-2 hover:underline"
                          >
                            {row.student_code ?? "—"}
                          </Link>
                        </td>
                        <td className="min-w-0 truncate px-3 py-2.5" title={studentDisplayName(row)}>
                          {studentDisplayName(row)}
                        </td>
                        <td className="min-w-0 truncate px-3 py-2.5">{row.grade ?? "—"}</td>
                        <td className="px-3 py-2.5 tabular-nums">{row.paid_lessons}</td>
                        <td className="px-3 py-2.5 tabular-nums">{row.attended_lessons}</td>
                        <td className="px-3 py-2.5 tabular-nums font-medium text-warning">{row.lesson_gap}</td>
                        <td className="px-3 py-2.5">
                          {row.enrollment_status ? (
                            <Tag tone={statusToTagTone(row.enrollment_status)}>{row.enrollment_status}</Tag>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {row.activity_status ? (
                            <Tag tone={statusToTagTone(row.activity_status)}>{row.activity_status}</Tag>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  suffix,
}: {
  label: string
  value: string
  suffix?: string
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card px-4 py-3 shadow-sm")}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
        {value}
        {suffix && <span className="ml-1 text-sm font-normal text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  )
}
