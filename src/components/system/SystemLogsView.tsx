import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ChevronLeft, FileSearch, RefreshCw } from "lucide-react"

import { addDaysToYmd, todayYmdLocal } from "@/components/home/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import {
  fetchMgmtAuditLogsFiltered,
  MGMT_LOG_PAGE_SIZE,
} from "@/services/mgmtLogQueries"
import type { MgmtAuditLogRow } from "@/services/mgmtGodViewQueries"

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

type LogFilterOverride = Partial<{
  dateFrom: string
  dateTo: string
  role: string
  actorContains: string
  pathContains: string
  actionContains: string
}>

export function SystemLogsView() {
  const defaultFrom = useMemo(() => addDaysToYmd(todayYmdLocal(), -30), [])
  const [dateFrom, setDateFrom] = useState(defaultFrom)
  const [dateTo, setDateTo] = useState(todayYmdLocal())
  const [role, setRole] = useState("all")
  const [actorContains, setActorContains] = useState("")
  const [pathContains, setPathContains] = useState("")
  const [actionContains, setActionContains] = useState("")

  const [rows, setRows] = useState<MgmtAuditLogRow[]>([])
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(
    async (nextOffset: number, append: boolean, override?: LogFilterOverride) => {
      if (!isSupabaseConfigured) return
      const df = override?.dateFrom ?? dateFrom
      const dt = override?.dateTo ?? dateTo
      const r = override?.role ?? role
      const ac = override?.actorContains !== undefined ? override.actorContains : actorContains
      const pc = override?.pathContains !== undefined ? override.pathContains : pathContains
      const act = override?.actionContains !== undefined ? override.actionContains : actionContains

      setLoading(true)
      setErr(null)
      try {
        const batch = await fetchMgmtAuditLogsFiltered({
          dateFrom: df || null,
          dateTo: dt || null,
          role: r === "all" ? null : r,
          actorContains: ac || null,
          pathContains: pc || null,
          actionContains: act || null,
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
    [dateFrom, dateTo, role, actorContains, pathContains, actionContains]
  )

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      setErr(null)
      try {
        const from = addDaysToYmd(todayYmdLocal(), -30)
        const to = todayYmdLocal()
        const batch = await fetchMgmtAuditLogsFiltered({
          dateFrom: from,
          dateTo: to,
          role: null,
          actorContains: null,
          pathContains: null,
          actionContains: null,
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
            <FileSearch className="h-8 w-8 text-violet-600" aria-hidden />
            系統日志
          </h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            所有使用者操作紀錄（依篩選；每批最多 {MGMT_LOG_PAGE_SIZE} 筆，可載入更多）。
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
            <label htmlFor="log-from" className="text-xs font-medium text-muted-foreground">
              開始日期
            </label>
            <Input id="log-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="log-to" className="text-xs font-medium text-muted-foreground">
              結束日期
            </label>
            <Input id="log-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="log-role" className="text-xs font-medium text-muted-foreground">
              按角色（用戶類型）
            </label>
            <select
              id="log-role"
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
            <label htmlFor="log-actor" className="text-xs font-medium text-muted-foreground">
              按用戶（顯示名稱包含）
            </label>
            <Input
              id="log-actor"
              placeholder="例如：Sophie、Judy、外星人"
              value={actorContains}
              onChange={(e) => setActorContains(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="log-path" className="text-xs font-medium text-muted-foreground">
              按功能 · 路徑包含
            </label>
            <Input id="log-path" placeholder="例如：/Schedule" value={pathContains} onChange={(e) => setPathContains(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="log-action" className="text-xs font-medium text-muted-foreground">
              按功能 · 操作包含
            </label>
            <Input id="log-action" placeholder="例如：排程、點名、登入" value={actionContains} onChange={(e) => setActionContains(e.target.value)} />
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
              const from = addDaysToYmd(todayYmdLocal(), -30)
              const to = todayYmdLocal()
              setDateFrom(from)
              setDateTo(to)
              setRole("all")
              setActorContains("")
              setPathContains("")
              setActionContains("")
              void load(0, false, {
                dateFrom: from,
                dateTo: to,
                role: "all",
                actorContains: "",
                pathContains: "",
                actionContains: "",
              })
            }}
          >
            重設條件
          </Button>
        </div>
      </section>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-3 py-3 font-medium md:px-4">時間</th>
              <th className="px-3 py-3 font-medium">用戶</th>
              <th className="px-3 py-3 font-medium">角色</th>
              <th className="px-3 py-3 font-medium">操作</th>
              <th className="px-3 py-3 font-medium md:px-4">路徑</th>
              <th className="px-3 py-3 font-medium md:px-4">備註</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 && !loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  無資料。請按「查詢」或調整篩選。
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="bg-background/40 hover:bg-muted/30">
                  <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-muted-foreground md:px-4">
                    {formatTs(r.created_at)}
                  </td>
                  <td className="px-3 py-2.5 font-medium">{r.actor_label}</td>
                  <td className="px-3 py-2.5">{r.role}</td>
                  <td className="px-3 py-2.5">{r.action}</td>
                  <td className="max-w-[200px] break-all px-3 py-2.5 text-muted-foreground md:max-w-xs md:px-4">
                    {r.path ?? "—"}
                  </td>
                  <td className="max-w-md px-3 py-2.5 text-muted-foreground md:px-4">
                    <span className="line-clamp-3 break-words">{r.detail ?? "—"}</span>
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
