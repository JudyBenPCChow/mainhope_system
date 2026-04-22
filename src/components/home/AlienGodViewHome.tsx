import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { AlertTriangle, FileSearch, Orbit, RefreshCw } from "lucide-react"

import { dashboardTitleDate, todayYmdLocal } from "@/components/home/format"
import { Button } from "@/components/ui/button"
import { DEMO_ALIEN_GREETING_NAME } from "@/lib/demoMgmtPersonas"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import {
 fetchRecentMgmtSystemErrors,
 fetchTodayMgmtAuditLogs,
 type MgmtAuditLogRow,
 type MgmtSystemErrorRow,
} from "@/services/mgmtGodViewQueries"

function formatTs(iso: string): string {
 try {
  return new Date(iso).toLocaleString("zh-Hant", {
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

export function AlienGodViewHome() {
 const [auditRows, setAuditRows] = useState<MgmtAuditLogRow[]>([])
 const [errorRows, setErrorRows] = useState<MgmtSystemErrorRow[]>([])
 const [loading, setLoading] = useState(true)
 const [err, setErr] = useState<string | null>(null)

 const load = useCallback(async () => {
  if (!isSupabaseConfigured) {
   setLoading(false)
   setAuditRows([])
   setErrorRows([])
   return
  }
  setLoading(true)
  setErr(null)
  try {
   const [a, e] = await Promise.all([fetchTodayMgmtAuditLogs(20), fetchRecentMgmtSystemErrors(20)])
   setAuditRows(a)
   setErrorRows(e)
  } catch (e) {
   setErr(e instanceof Error ? e.message : "載入失敗")
   setAuditRows([])
   setErrorRows([])
  } finally {
   setLoading(false)
  }
 }, [])

 useEffect(() => {
  void load()
 }, [load])

 return (
  <div className="space-y-8 p-4 md:p-6 lg:space-y-10">
   <header className="flex flex-wrap items-end justify-between gap-4 border-b border-sky-200/60 pb-6">
    <div>
     <p className="text-sm font-medium uppercase tracking-wide text-sky-800/90">外星人 · 上帝視角</p>
     <h1 className="mt-2 flex flex-wrap items-center gap-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
      <Orbit className="h-9 w-9 text-sky-600" aria-hidden />
      你好，{DEMO_ALIEN_GREETING_NAME}！
     </h1>
     <p className="mt-2 text-base text-muted-foreground md:text-lg">
      本機今日 {todayYmdLocal()}（{dashboardTitleDate()}）· 全系統監看
     </p>
    </div>
    <div className="flex flex-wrap gap-2">
     <Button type="button" variant="default" size="sm" className="gap-2 bg-sky-700 hover:bg-sky-800" asChild>
      <Link to="/SystemLogs">
       <FileSearch className="h-4 w-4" aria-hidden />
       系統日志
      </Link>
     </Button>
     <Button type="button" variant="outline" size="sm" className="gap-2" asChild>
      <Link to="/SystemIssues">
       <AlertTriangle className="h-4 w-4" aria-hidden />
       報錯與問題
      </Link>
     </Button>
     <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void load()} disabled={loading}>
      <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
      重新整理
     </Button>
     <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
       localStorage.removeItem("mgmt_role")
       localStorage.removeItem("teacher_id")
       window.location.reload()
      }}
     >
      清除角色（演示）
     </Button>
    </div>
   </header>

   {!isSupabaseConfigured ? (
    <div
     className="rounded-xl border border-amber-400/50 bg-amber-50 px-4 py-3 text-amber-950"
     role="status"
    >
     尚未設定 Supabase，無法載入稽核與錯誤列表。請設定 <code className="rounded bg-white/70 px-1">.env</code> 並執行{" "}
     <code className="rounded bg-white/70 px-1">supabase db reset</code>（會套用含{" "}
     <code className="rounded bg-white/70 px-1">mgmt_audit_log</code> /{" "}
     <code className="rounded bg-white/70 px-1">mgmt_system_errors</code> 的 migration）。
    </div>
   ) : null}

   {err ? (
    <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-destructive">
     {err}
     <p className="mt-2 text-sm text-destructive/90">
      若訊息為資料表不存在，請執行 migration <code className="rounded bg-background px-1">20260420100000_mgmt_godview_tables.sql</code>{" "}
      後再 <code className="rounded bg-background px-1">db reset</code>。
     </p>
    </div>
   ) : null}

   <section className="rounded-2xl border border-border bg-card shadow-sm" aria-labelledby="alien-audit-heading">
    <div className="border-b border-border px-5 py-4 md:px-6">
     <h2 id="alien-audit-heading" className="text-lg font-semibold md:text-xl">
      今日使用者登入與操作
     </h2>
     <p className="mt-1 text-sm text-muted-foreground">依本機日曆篩選「今日」，最多顯示 20 筆（新→舊）。</p>
    </div>
    <div className="overflow-x-auto">
     {loading ? (
      <p className="px-5 py-8 text-muted-foreground md:px-6">載入中…</p>
     ) : auditRows.length === 0 ? (
      <p className="px-5 py-8 text-muted-foreground md:px-6">尚無今日紀錄。選角登入後會寫入稽核；種子亦含演示列。</p>
     ) : (
      <table className="w-full min-w-[640px] table-fixed border-collapse text-left text-sm">
       <thead className="border-b border-border bg-muted/40 text-muted-foreground">
        <tr>
         <th className="w-[18%] px-4 py-3 font-medium md:px-5">時間</th>
         <th className="w-[16%] px-4 py-3 font-medium">使用者</th>
         <th className="w-[12%] px-4 py-3 font-medium">角色</th>
         <th className="w-[18%] px-4 py-3 font-medium">操作</th>
         <th className="w-[36%] px-4 py-3 font-medium md:pr-5">路徑／備註</th>
        </tr>
       </thead>
       <tbody className="divide-y divide-border">
        {auditRows.map((r) => (
         <tr key={r.id} className="bg-background/50 hover:bg-muted/20">
          <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground md:px-5">
           {formatTs(r.created_at)}
          </td>
          <td className="px-4 py-3 font-medium text-foreground">{r.actor_label}</td>
          <td className="px-4 py-3">{r.role}</td>
          <td className="px-4 py-3">{r.action}</td>
          <td className="max-w-[280px] px-4 py-3 text-muted-foreground md:max-w-md md:pr-5">
           <span className="break-words">{r.path ?? "—"}</span>
           {r.detail ? (
            <span className="mt-1 block text-xs text-muted-foreground/90">{r.detail}</span>
           ) : null}
          </td>
         </tr>
        ))}
       </tbody>
      </table>
     )}
    </div>
   </section>

   <section className="rounded-2xl border border-border bg-card shadow-sm" aria-labelledby="alien-errors-heading">
    <div className="border-b border-border px-5 py-4 md:px-6">
     <h2 id="alien-errors-heading" className="flex items-center gap-2 text-lg font-semibold md:text-xl">
      <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden />
      系統報錯與問題
     </h2>
     <p className="mt-1 text-sm text-muted-foreground">最近 20 筆（新→舊）；含未解決與已標記處理。</p>
    </div>
    <div className="overflow-x-auto">
     {loading ? (
      <p className="px-5 py-8 text-muted-foreground md:px-6">載入中…</p>
     ) : errorRows.length === 0 ? (
      <p className="px-5 py-8 text-muted-foreground md:px-6">尚無錯誤紀錄。應用程式可寫入{" "}
       <code className="rounded bg-muted px-1">mgmt_system_errors</code> 以集中追蹤。</p>
     ) : (
      <table className="w-full min-w-[640px] table-fixed border-collapse text-left text-sm">
       <thead className="border-b border-border bg-muted/40 text-muted-foreground">
        <tr>
         <th className="w-[18%] px-4 py-3 font-medium md:px-5">時間</th>
         <th className="w-[12%] px-4 py-3 font-medium">嚴重度</th>
         <th className="w-[14%] px-4 py-3 font-medium">來源</th>
         <th className="w-[28%] px-4 py-3 font-medium">訊息</th>
         <th className="w-[28%] px-4 py-3 font-medium md:pr-5">狀態／詳情</th>
        </tr>
       </thead>
       <tbody className="divide-y divide-border">
        {errorRows.map((r) => (
         <tr key={r.id} className="bg-background/50 hover:bg-muted/20">
          <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground md:px-5">
           {formatTs(r.created_at)}
          </td>
          <td className="px-4 py-3">{r.severity}</td>
          <td className="px-4 py-3">{r.source}</td>
          <td className="max-w-xs px-4 py-3 break-words md:max-w-md">{r.message}</td>
          <td className="px-4 py-3 text-muted-foreground md:pr-5">
           {r.resolved_at ? (
            <span className="text-emerald-800">已處理 {formatTs(r.resolved_at)}</span>
           ) : (
            <span className="font-medium text-amber-800">待處理</span>
           )}
           {r.detail ? <span className="mt-1 block text-xs break-words">{r.detail}</span> : null}
          </td>
         </tr>
        ))}
       </tbody>
      </table>
     )}
    </div>
   </section>
  </div>
 )
}
