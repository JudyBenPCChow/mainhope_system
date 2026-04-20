import { useCallback, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { isSupabaseConfigured } from "@/lib/supabaseClient"

type Column = { key: string; label: string }

type Props = {
  title: string
  subtitle?: string
  load: () => Promise<unknown[]>
  columns: Column[]
}

function cellText(row: Record<string, unknown>, key: string): string {
  const v = row[key]
  if (v == null) return "—"
  if (typeof v === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) {
      try {
        return new Date(v).toLocaleString("zh-Hant", {
          dateStyle: "short",
          timeStyle: "short",
        })
      } catch {
        return v
      }
    }
    if (key.endsWith("_id") && v.length > 12) {
      return `${v.slice(0, 8)}…`
    }
    return v
  }
  if (typeof v === "number" || typeof v === "boolean") return String(v)
  return JSON.stringify(v)
}

export function EntityListPage({ title, subtitle, load, columns }: Props) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const loadRef = useRef(load)
  loadRef.current = load

  const fetchRows = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const data = await loadRef.current()
      setRows((data as Record<string, unknown>[]) ?? [])
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchRows()
  }, [fetchRows])

  return (
    <div className="space-y-4 p-6">
      {!isSupabaseConfigured ? (
        <div
          className="rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100"
          role="status"
        >
          <strong className="font-medium">尚未連上 Supabase：</strong>
          請在專案根目錄建立<strong>純文字</strong>檔名{" "}
          <code className="rounded bg-muted px-1">.env</code>（可複製{" "}
          <code className="rounded bg-muted px-1">.env.example</code>
          ），填入 <code className="rounded bg-muted px-1">VITE_SUPABASE_URL</code> 與{" "}
          <code className="rounded bg-muted px-1">VITE_SUPABASE_ANON_KEY</code>。
          若用 macOS「文字編輯」另存，請選「純文字」格式，勿存成{" "}
          <code className="rounded bg-muted px-1">.env.rtf</code>。改完後請<strong>重啟</strong>
          <code className="rounded bg-muted px-1">npm run dev</code>。
        </div>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="mt-1 max-w-prose text-sm text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void fetchRows()}>
          重新載入
        </Button>
      </div>

      {err ? (
        <div
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {err}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">載入中…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          目前沒有資料。若剛建好表，可執行{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">supabase db reset</code>{" "}
          （套用 <code className="rounded bg-muted px-1 py-0.5 text-xs">seed.sql</code>
          ），或直接在 Table Editor 新增。
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <table className="w-full min-w-[32rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left">
                {columns.map((c) => (
                  <th key={c.key} className="whitespace-nowrap px-3 py-2 font-medium">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const id = String(row.id ?? Math.random())
                return (
                  <tr key={id} className="border-b border-border last:border-0">
                    {columns.map((c) => (
                      <td key={c.key} className="px-3 py-2 align-top text-muted-foreground">
                        {cellText(row, c.key)}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
