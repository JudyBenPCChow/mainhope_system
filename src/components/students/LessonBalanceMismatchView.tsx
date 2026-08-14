import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { BookOpen, RefreshCw, Scale, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tag } from "@/components/ui/tag"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import {
 fetchMisalignedLessonBalances,
 type MisalignedLessonBalanceRow,
} from "@/services/pendingLessonQueries"

type IssueFilter = "" | "gap" | "pending" | "leave"

function matchesSearch(row: MisalignedLessonBalanceRow, q: string): boolean {
 if (!q) return true
 const hay = [row.studentName, row.englishName ?? "", row.studentCode ?? "", row.classLabel]
  .join(" ")
  .toLowerCase()
 return hay.includes(q.toLowerCase())
}

function issueLabel(row: MisalignedLessonBalanceRow): string {
 if (row.paidLessons > 0 && !row.isAligned) {
  return row.gap > 0
   ? `尚差 ${row.gap} 堂未記／未排`
   : `多記／多排 ${Math.abs(row.gap)} 堂`
 }
 if (row.leaveAwaitingMakeupCount > 0) {
  return `請假待安排 ${row.leaveAwaitingMakeupCount} 堂`
 }
 if (row.pendingLessons > 0) return `待補 ${row.pendingLessons} 堂`
 return "需跟進"
}

export function LessonBalanceMismatchView() {
 const [rows, setRows] = useState<MisalignedLessonBalanceRow[]>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)
 const [issue, setIssue] = useState<IssueFilter>("")
 const [searchInput, setSearchInput] = useState("")
 const [searchDebounced, setSearchDebounced] = useState("")

 useEffect(() => {
  const t = window.setTimeout(() => setSearchDebounced(searchInput.trim()), 300)
  return () => window.clearTimeout(t)
 }, [searchInput])

 const load = useCallback(async () => {
  if (!isSupabaseConfigured) {
   setRows([])
   setLoading(false)
   return
  }
  setLoading(true)
  setErr(null)
  try {
   setRows(await fetchMisalignedLessonBalances())
  } catch (e) {
   reportUserFacingError(e, { source: "LessonBalanceMismatchView.load", setErr })
   setRows([])
  } finally {
   setLoading(false)
  }
 }, [])

 useEffect(() => {
  void load()
 }, [load])

 const filtered = useMemo(() => {
  return rows.filter((r) => {
   if (!matchesSearch(r, searchDebounced)) return false
   if (issue === "gap") return r.paidLessons > 0 && !r.isAligned
   if (issue === "pending") return r.pendingLessons > 0
   if (issue === "leave") return r.leaveAwaitingMakeupCount > 0
   return true
  })
 }, [rows, searchDebounced, issue])

 const counts = useMemo(() => {
  let gap = 0
  let pending = 0
  let leave = 0
  const students = new Set<string>()
  for (const r of rows) {
   students.add(r.studentId)
   if (r.paidLessons > 0 && !r.isAligned) gap++
   if (r.pendingLessons > 0) pending++
   if (r.leaveAwaitingMakeupCount > 0) leave++
  }
  return { total: rows.length, gap, pending, leave, students: students.size }
 }, [rows])

 return (
  <div className="space-y-6 md:p-6">
   <header className="flex flex-wrap items-end justify-between gap-4">
    <div>
     <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
      <Scale className="h-8 w-8 text-amber-700" aria-hidden />
      堂數對帳
     </h1>
     <p className="mt-1 hidden max-w-2xl text-sm text-muted-foreground md:block">
      彙整就讀中報讀：已繳堂數與已綁排程／待補不一致，或請假尚無補堂日的學生，方便一次跟進。點學生可前往詳情「報讀班別」或請假管理處理。
     </p>
    </div>
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
   </header>

   {!isSupabaseConfigured ? (
    <div
     role="alert"
     className="rounded-lg border border-warning/50 bg-warning/10 px-3 py-2 text-sm text-warning"
    >
     請設定 <code className="rounded bg-muted px-1">.env</code> 內 Supabase 後重啟
     dev。
    </div>
   ) : null}

   {err ? (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
     {err}
    </div>
   ) : null}

   <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
    <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
     <span>
      需跟進{" "}
      <strong className="tabular-nums text-foreground">{counts.total}</strong> 筆報讀 ·{" "}
      <strong className="tabular-nums text-foreground">{counts.students}</strong>{" "}
      位學生
     </span>
     <span>
      堂數不一致 <strong className="tabular-nums text-foreground">{counts.gap}</strong>
     </span>
     <span>
      有待補 <strong className="tabular-nums text-foreground">{counts.pending}</strong>
     </span>
     <span>
      請假待安排{" "}
      <strong className="tabular-nums text-foreground">{counts.leave}</strong>
     </span>
    </div>

    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
     <div className="flex flex-wrap gap-2">
      {(
       [
        ["", "全部"],
        ["gap", "堂數不一致"],
        ["pending", "有待補"],
        ["leave", "請假待安排"],
       ] as const
      ).map(([key, label]) => (
       <button
        key={key || "all"}
        type="button"
        onClick={() => setIssue(key)}
        className={cn(
         "rounded-full border px-3 py-1.5 text-sm font-medium",
         issue === key
          ? "border-amber-700 bg-amber-700 text-white"
          : "border-border bg-background hover:bg-muted/60"
        )}
       >
        {label}
       </button>
      ))}
     </div>
     <div className="relative min-w-[12rem] flex-1 lg:max-w-sm">
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
       className="h-9 pl-9"
       placeholder="搜尋學生、學號、班別…"
       value={searchInput}
       onChange={(e) => setSearchInput(e.target.value)}
      />
     </div>
    </div>
   </div>

   {loading ? (
    <p className="text-sm text-muted-foreground">載入對帳中…</p>
   ) : filtered.length === 0 ? (
    <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
     {rows.length === 0
      ? "目前沒有已繳／排程／待補不一致，或請假尚無補堂日的就讀中報讀。"
      : "沒有符合篩選條件的紀錄。"}
    </p>
   ) : (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
     <table className="w-full min-w-[70rem] table-fixed border-collapse text-sm">
      <thead>
       <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium text-muted-foreground">
        <th className="w-[15%] px-3 py-2">學生</th>
        <th className="w-[20%] px-3 py-2">班別</th>
        <th className="w-[8%] px-3 py-2 whitespace-nowrap text-right">已繳</th>
        <th className="w-[10%] px-3 py-2 whitespace-nowrap text-right">已綁排程</th>
        <th className="w-[8%] px-3 py-2 whitespace-nowrap text-right">待補</th>
        <th className="w-[10%] px-3 py-2 whitespace-nowrap text-right">請假待安排</th>
        <th className="w-[19%] px-3 py-2">狀態</th>
        <th className="w-[10%] px-3 py-2 whitespace-nowrap">報讀日</th>
       </tr>
      </thead>
      <tbody>
       {filtered.map((r) => (
        <tr key={r.enrollmentId} className="border-b border-border/80 bg-amber-50/40">
         <td className="min-w-0 align-top px-3 py-2.5">
          <Link
           to={`/Students/${r.studentId}`}
           className="block break-words font-medium text-primary hover:underline"
          >
           {r.studentName}
          </Link>
          {r.studentCode ? (
           <div className="mt-0.5 text-xs tabular-nums text-muted-foreground">
            {r.studentCode}
           </div>
          ) : null}
         </td>
         <td className="min-w-0 align-top px-3 py-2.5">
          <Link
           to={`/Classes/${r.classId}`}
           className="inline-flex max-w-full items-start gap-1 break-words text-primary hover:underline"
          >
           <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" />
           <span className="min-w-0">{r.classLabel}</span>
          </Link>
         </td>
         <td className="align-top px-3 py-2.5 text-right tabular-nums font-medium">
          {r.paidLessons}
         </td>
         <td className="align-top px-3 py-2.5 text-right tabular-nums font-medium">
          {r.boundLessons}
         </td>
         <td className="align-top px-3 py-2.5 text-right tabular-nums font-medium">
          {r.pendingLessons}
         </td>
         <td className="align-top px-3 py-2.5 text-right tabular-nums font-medium">
          {r.leaveAwaitingMakeupCount}
         </td>
         <td className="min-w-0 align-top px-3 py-2.5">
          <Tag
           tone={
            r.isAligned && r.pendingLessons === 0 && r.leaveAwaitingMakeupCount === 0
             ? "success"
             : "warning"
           }
           size="sm"
          >
           {issueLabel(r)}
          </Tag>
         </td>
         <td className="align-top px-3 py-2.5 tabular-nums text-muted-foreground">
          {r.enrollDate ?? "—"}
         </td>
        </tr>
       ))}
      </tbody>
     </table>
    </div>
   )}
  </div>
 )
}
