import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { BookOpen, CalendarRange, RefreshCw, ScrollText, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tag } from "@/components/ui/tag"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import { statusToTagTone } from "@/lib/statusTag"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import {
 fetchEnrollmentChangeEventsList,
 type EnrollmentChangeListRow,
} from "@/services/enrollmentEventQueries"

type ActionFilter = "" | "enroll" | "withdraw"

export function EnrollmentChangesView() {
 const [rows, setRows] = useState<EnrollmentChangeListRow[]>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)

 const [action, setAction] = useState<ActionFilter>("")
 const [fromYmd, setFromYmd] = useState("")
 const [toYmd, setToYmd] = useState("")
 const [searchInput, setSearchInput] = useState("")
 const [searchDebounced, setSearchDebounced] = useState("")

 useEffect(() => {
  const t = window.setTimeout(() => setSearchDebounced(searchInput.trim()), 400)
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
   const data = await fetchEnrollmentChangeEventsList({
    action: action || undefined,
    fromYmd: fromYmd.trim() || undefined,
    toYmd: toYmd.trim() || undefined,
    search: searchDebounced || undefined,
    limit: 500,
   })
   setRows(data)
  } catch (e) {
   reportUserFacingError(e, { source: "EnrollmentChangesView.load", setErr })
   setRows([])
  } finally {
   setLoading(false)
  }
 }, [action, fromYmd, toYmd, searchDebounced])

 useEffect(() => {
  void load()
 }, [load])

 const counts = useMemo(() => {
  let enroll = 0
  let withdraw = 0
  for (const r of rows) {
   if (r.action === "withdraw") withdraw++
   else enroll++
  }
  return { enroll, withdraw, total: rows.length }
 }, [rows])

 return (
  <div className="space-y-6 p-4 md:p-6">
   <header className="flex flex-wrap items-end justify-between gap-4">
    <div>
     <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
      <ScrollText className="h-8 w-8 text-teal-600" aria-hidden />
      增退紀錄
     </h1>
     <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
      資料來源為 <code className="rounded bg-muted px-1 text-xs">enrollment_change_events</code>
      。報讀／退讀由學生詳情與相關流程寫入；此頁供查詢與稽核。
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
    <div role="alert" className="rounded-lg border border-warning/50 bg-warning/10 px-3 py-2 text-sm text-warning">
     請設定 <code className="rounded bg-muted px-1">.env</code> 內 Supabase 後重啟 dev。
    </div>
   ) : null}

   {err ? (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
     {err}
    </div>
   ) : null}

   <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
    <div className="mb-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
     <span>
      本頁最多顯示 500 筆（依生效日新到舊）。篩選後筆數：<strong className="text-foreground">{counts.total}</strong>（報讀{" "}
      {counts.enroll}／退讀 {counts.withdraw}）
     </span>
    </div>

    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
     <div className="flex flex-wrap gap-2">
      {(
       [
        ["", "全部"],
        ["enroll", "報讀"],
        ["withdraw", "退讀"],
       ] as const
      ).map(([key, label]) => (
       <button
        key={key || "all"}
        type="button"
        onClick={() => setAction(key)}
        className={cn(
         "rounded-full border px-3 py-1.5 text-sm font-medium",
         action === key
          ? "border-teal-600 bg-teal-600 text-white"
          : "border-border bg-background hover:bg-muted/60"
        )}
       >
        {label}
       </button>
      ))}
     </div>
     <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
       <CalendarRange className="h-3.5 w-3.5" />
       生效日
      </span>
      <Input
       type="date"
       className="h-9 w-[11rem]"
       value={fromYmd}
       onChange={(e) => setFromYmd(e.target.value)}
      />
      <span className="text-muted-foreground">—</span>
      <Input
       type="date"
       className="h-9 w-[11rem]"
       value={toYmd}
       onChange={(e) => setToYmd(e.target.value)}
      />
     </div>
     <div className="relative min-w-[12rem] flex-1 lg:max-w-sm">
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
       className="h-9 pl-9"
       placeholder="搜尋學生、班別、原因…"
       value={searchInput}
       onChange={(e) => setSearchInput(e.target.value)}
      />
     </div>
    </div>
   </div>

   {loading ? (
    <p className="text-sm text-muted-foreground">載入中…</p>
   ) : rows.length === 0 ? (
    <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
     沒有符合條件的紀錄。若資料庫為空，可先執行{" "}
     <code className="rounded bg-muted px-1 text-xs">supabase/seed.sql</code>（<code className="rounded bg-muted px-1 text-xs">supabase db reset</code>）或於學生詳情操作報讀／退讀。
    </p>
   ) : (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
     <table className="w-full min-w-[56rem] table-fixed border-collapse text-sm">
      <thead>
       <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium text-muted-foreground">
        <th className="w-[10%] px-3 py-2 whitespace-nowrap">生效日</th>
        <th className="w-[9%] px-3 py-2 whitespace-nowrap">類型</th>
        <th className="w-[14%] px-3 py-2">學生</th>
        <th className="w-[22%] px-3 py-2">班別</th>
        <th className="w-[15%] px-3 py-2 whitespace-nowrap">老師</th>
        <th className="w-[22%] px-3 py-2">原因／備註</th>
        <th className="w-[8%] px-3 py-2 whitespace-nowrap">建立時間</th>
       </tr>
      </thead>
      <tbody>
       {rows.map((r) => (
        <tr
         key={r.id}
         className={cn(
          "border-b border-border/80",
          r.action === "withdraw" ? "bg-warning/10" : "bg-info/10"
         )}
        >
         <td className="min-w-0 align-top px-3 py-2.5 tabular-nums text-muted-foreground">
          {r.effectiveDate}
         </td>
         <td className="min-w-0 align-top px-3 py-2.5">
          <Tag tone={statusToTagTone(r.action === "withdraw" ? "退讀" : "報讀")} size="sm">
           {r.action === "withdraw" ? "退讀" : "報讀"}
          </Tag>
         </td>
         <td className="min-w-0 align-top px-3 py-2.5">
          <Link
           to={`/Students/${r.studentId}`}
           className="block break-words font-medium text-primary hover:underline"
          >
           {r.studentName}
          </Link>
         </td>
         <td className="min-w-0 align-top px-3 py-2.5">
          <Link
           to={`/Classes/${r.classId}`}
           className="inline-flex max-w-full items-start gap-1 break-words text-primary hover:underline"
          >
           <BookOpen className="h-3.5 w-3.5 shrink-0 opacity-70" />
           <span className="min-w-0">{r.classLabel}</span>
          </Link>
         </td>
         <td className="min-w-0 align-top px-3 py-2.5 text-muted-foreground">
          <span className="block break-words">{r.teacherName ?? "—"}</span>
         </td>
         <td className="min-w-0 px-3 py-2.5 text-muted-foreground">
          <span className="line-clamp-3 break-words">{r.reason ?? "—"}</span>
         </td>
         <td className="min-w-0 align-top px-3 py-2.5 text-xs tabular-nums text-muted-foreground">
          {r.createdAt ? r.createdAt.slice(0, 19).replace("T", " ") : "—"}
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
