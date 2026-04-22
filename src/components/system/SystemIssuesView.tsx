import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { AlertTriangle, ChevronLeft, RefreshCw } from "lucide-react"

import { addDaysToYmd, todayYmdLocal } from "@/components/home/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import {
 fetchMgmtSystemErrorsFiltered,
 MGMT_LOG_PAGE_SIZE,
} from "@/services/mgmtLogQueries"
import type { MgmtSystemErrorRow } from "@/services/mgmtGodViewQueries"

function formatTs(iso: string): string {
 try {
  return new Date(iso).toLocaleString("zh-Hant", {
   year: "numeric",
   month: "2-digit",
   day: "2-digit",
   hour: "2-digit",
   minute: "2-digit",
   second: "2-digit",
   hour12: false,
  })
 } catch {
  return iso
 }
}

const roleOptions = [
 { value: "all", label: "全部角色" },
 { value: "admin", label: "管理員" },
 { value: "teacher", label: "專班老師" },
 { value: "alien", label: "外星人" },
 { value: "guest", label: "未登入" },
 { value: "system", label: "系統" },
]

type IssueFilterOverride = Partial<{
 dateFrom: string
 dateTo: string
 role: string
 actorContains: string
 pathContains: string
 sourceContains: string
 messageContains: string
 unresolvedOnly: boolean
}>

export function SystemIssuesView() {
 const defaultFrom = useMemo(() => addDaysToYmd(todayYmdLocal(), -90), [])
 const [dateFrom, setDateFrom] = useState(defaultFrom)
 const [dateTo, setDateTo] = useState(todayYmdLocal())
 const [role, setRole] = useState("all")
 const [actorContains, setActorContains] = useState("")
 const [pathContains, setPathContains] = useState("")
 const [sourceContains, setSourceContains] = useState("")
 const [messageContains, setMessageContains] = useState("")
 const [unresolvedOnly, setUnresolvedOnly] = useState(false)

 const [rows, setRows] = useState<MgmtSystemErrorRow[]>([])
 const [offset, setOffset] = useState(0)
 const [loading, setLoading] = useState(false)
 const [err, setErr] = useState<string | null>(null)

 const load = useCallback(
  async (nextOffset: number, append: boolean, override?: IssueFilterOverride) => {
   if (!isSupabaseConfigured) return
   const df = override?.dateFrom ?? dateFrom
   const dt = override?.dateTo ?? dateTo
   const r = override?.role ?? role
   const ac = override?.actorContains !== undefined ? override.actorContains : actorContains
   const pc = override?.pathContains !== undefined ? override.pathContains : pathContains
   const sc = override?.sourceContains !== undefined ? override.sourceContains : sourceContains
   const mc = override?.messageContains !== undefined ? override.messageContains : messageContains
   const uo = override?.unresolvedOnly !== undefined ? override.unresolvedOnly : unresolvedOnly

   setLoading(true)
   setErr(null)
   try {
    const batch = await fetchMgmtSystemErrorsFiltered({
     dateFrom: df || null,
     dateTo: dt || null,
     role: r === "all" ? null : r,
     actorContains: ac || null,
     pathContains: pc || null,
     sourceContains: sc || null,
     messageContains: mc || null,
     unresolvedOnly: uo,
     offset: nextOffset,
    })
    setOffset(nextOffset)
    setRows((prev) => (append ? [...prev, ...batch] : batch))
   } catch (e) {
    setErr(e instanceof Error ? e.message : "載入失敗")
    if (!append) setRows([])
   } finally {
    setLoading(false)
   }
  },
  [dateFrom, dateTo, role, actorContains, pathContains, sourceContains, messageContains, unresolvedOnly]
 )

 useEffect(() => {
  if (!isSupabaseConfigured) return
  let cancelled = false
  void (async () => {
   setLoading(true)
   setErr(null)
   try {
    const from = addDaysToYmd(todayYmdLocal(), -90)
    const to = todayYmdLocal()
    const batch = await fetchMgmtSystemErrorsFiltered({
     dateFrom: from,
     dateTo: to,
     role: null,
     actorContains: null,
     pathContains: null,
     sourceContains: null,
     messageContains: null,
     unresolvedOnly: false,
     offset: 0,
    })
    if (!cancelled) {
     setRows(batch)
     setOffset(0)
    }
   } catch (e) {
    if (!cancelled) {
     setErr(e instanceof Error ? e.message : "載入失敗")
     setRows([])
    }
   } finally {
    if (!cancelled) setLoading(false)
   }
  })()
  return () => {
   cancelled = true
  }
 }, [])

 const onSearch = () => void load(0, false)
 const onLoadMore = () => {
  if (rows.length < MGMT_LOG_PAGE_SIZE) return
  void load(offset + MGMT_LOG_PAGE_SIZE, true)
 }

 return (
  <div className="space-y-6">
   <header className="flex flex-wrap items-start justify-between gap-4">
    <div>
     <Button variant="ghost" size="sm" className="-ml-2 mb-1 gap-1 text-muted-foreground" asChild>
      <Link to="/Home">
       <ChevronLeft className="h-4 w-4" aria-hidden />
       返回首頁
      </Link>
     </Button>
     <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl">
      <AlertTriangle className="h-8 w-8 text-amber-600" aria-hidden />
      報錯與問題
     </h1>
     <p className="mt-1 text-sm text-muted-foreground md:text-base">
      操作失敗、例外與系統問題紀錄。實際寫入需於程式中呼叫{" "}
      <code className="rounded bg-muted px-1">appendMgmtSystemError</code>；種子含演示列。
     </p>
    </div>
    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void onSearch()} disabled={loading}>
     <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
     重新整理
    </Button>
   </header>

   {!isSupabaseConfigured ? (
    <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950">尚未設定 Supabase。</div>
   ) : null}

   {err ? (
    <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-destructive">{err}</div>
   ) : null}

   <section className="rounded-xl border border-border bg-card p-4 shadow-sm md:p-5">
    <h2 className="text-sm font-semibold text-foreground">篩選</h2>
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
     <div className="space-y-1.5">
      <label htmlFor="iss-from" className="text-xs font-medium text-muted-foreground">
       開始日期
      </label>
      <Input id="iss-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
     </div>
     <div className="space-y-1.5">
      <label htmlFor="iss-to" className="text-xs font-medium text-muted-foreground">
       結束日期
      </label>
      <Input id="iss-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
     </div>
     <div className="space-y-1.5">
      <label htmlFor="iss-role" className="text-xs font-medium text-muted-foreground">
       按角色（用戶類型）
      </label>
      <select
       id="iss-role"
       className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
       value={role}
       onChange={(e) => setRole(e.target.value)}
      >
       {roleOptions.map((o) => (
        <option key={o.value} value={o.value}>
         {o.label}
        </option>
       ))}
      </select>
     </div>
     <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
      <label htmlFor="iss-actor" className="text-xs font-medium text-muted-foreground">
       按用戶（顯示名稱包含）
      </label>
      <Input
       id="iss-actor"
       placeholder="若該筆有記錄操作者"
       value={actorContains}
       onChange={(e) => setActorContains(e.target.value)}
      />
     </div>
     <div className="space-y-1.5">
      <label htmlFor="iss-path" className="text-xs font-medium text-muted-foreground">
       按功能 · 路徑包含
      </label>
      <Input id="iss-path" placeholder="例如：/Schedule" value={pathContains} onChange={(e) => setPathContains(e.target.value)} />
     </div>
     <div className="space-y-1.5">
      <label htmlFor="iss-src" className="text-xs font-medium text-muted-foreground">
       按功能 · 來源包含
      </label>
      <Input id="iss-src" placeholder="例如：schedule、payment" value={sourceContains} onChange={(e) => setSourceContains(e.target.value)} />
     </div>
     <div className="space-y-1.5">
      <label htmlFor="iss-msg" className="text-xs font-medium text-muted-foreground">
       訊息包含
      </label>
      <Input id="iss-msg" placeholder="關鍵字" value={messageContains} onChange={(e) => setMessageContains(e.target.value)} />
     </div>
     <div className="flex items-end pb-1 sm:col-span-2 lg:col-span-3">
      <label className="flex cursor-pointer items-center gap-2 text-sm">
       <input
        type="checkbox"
        className="h-4 w-4 rounded border-input"
        checked={unresolvedOnly}
        onChange={(e) => setUnresolvedOnly(e.target.checked)}
       />
       僅顯示待處理（未標記 resolved）
      </label>
     </div>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
     <Button type="button" onClick={() => void onSearch()}>
      查詢
     </Button>
     <Button
      type="button"
      variant="outline"
      onClick={() => {
       const from = addDaysToYmd(todayYmdLocal(), -90)
       const to = todayYmdLocal()
       setDateFrom(from)
       setDateTo(to)
       setRole("all")
       setActorContains("")
       setPathContains("")
       setSourceContains("")
       setMessageContains("")
       setUnresolvedOnly(false)
       void load(0, false, {
        dateFrom: from,
        dateTo: to,
        role: "all",
        actorContains: "",
        pathContains: "",
        sourceContains: "",
        messageContains: "",
        unresolvedOnly: false,
       })
      }}
     >
      重設條件
     </Button>
    </div>
   </section>

   <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
    <table className="w-full min-w-[880px] table-fixed border-collapse text-left text-sm">
     <thead className="border-b border-border bg-muted/50 text-muted-foreground">
      <tr>
       <th className="w-[12%] px-3 py-3 font-medium md:px-4">時間</th>
       <th className="w-[8%] px-3 py-3 font-medium">嚴重度</th>
       <th className="w-[10%] px-3 py-3 font-medium">用戶</th>
       <th className="w-[8%] px-3 py-3 font-medium">角色</th>
       <th className="w-[12%] px-3 py-3 font-medium">路徑</th>
       <th className="w-[12%] px-3 py-3 font-medium">來源</th>
       <th className="w-[22%] px-3 py-3 font-medium md:px-4">訊息</th>
       <th className="w-[16%] px-3 py-3 font-medium md:px-4">狀態／詳情</th>
      </tr>
     </thead>
     <tbody className="divide-y divide-border">
      {rows.length === 0 && !loading ? (
       <tr>
        <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
         無資料。請按「查詢」或調整篩選。
        </td>
       </tr>
      ) : (
       rows.map((r) => (
        <tr key={r.id} className="bg-background/40 hover:bg-muted/30">
         <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-muted-foreground md:px-4">
          {formatTs(r.created_at)}
         </td>
         <td className="px-3 py-2.5">{r.severity}</td>
         <td className="px-3 py-2.5">{r.actor_label ?? "—"}</td>
         <td className="px-3 py-2.5">{r.role ?? "—"}</td>
         <td className="max-w-[140px] break-all px-3 py-2.5 text-muted-foreground">{r.path ?? "—"}</td>
         <td className="px-3 py-2.5">{r.source}</td>
         <td className="max-w-xs px-3 py-2.5 break-words md:px-4">{r.message}</td>
         <td className="max-w-sm px-3 py-2.5 text-muted-foreground md:px-4">
          {r.resolved_at ? (
           <span className="text-emerald-800">已處理 {formatTs(r.resolved_at)}</span>
          ) : (
           <span className="font-medium text-amber-800">待處理</span>
          )}
          {r.detail ? <span className="mt-1 block text-xs break-words">{r.detail}</span> : null}
         </td>
        </tr>
       ))
      )}
     </tbody>
    </table>
   </div>

   <div className="flex flex-wrap items-center justify-between gap-3">
    <p className="text-sm text-muted-foreground">已載入 {rows.length} 筆</p>
    {rows.length >= MGMT_LOG_PAGE_SIZE ? (
     <Button type="button" variant="secondary" size="sm" onClick={() => void onLoadMore()} disabled={loading}>
      {loading ? "載入中…" : "載入更多"}
     </Button>
    ) : null}
   </div>
  </div>
 )
}
