import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Tag } from "@/components/ui/tag"
import type { StaffPerformanceRow } from "@/components/staffPerformance/types"
import { statusToTagTone } from "@/lib/statusTag"
import { cn } from "@/lib/utils"

type SortKey =
  | "teacherName"
  | "revenue"
  | "laborCost"
  | "grossProfit"
  | "grossMargin"
  | "laborCostRatio"
  | "teachingHours"
  | "retentionRate"
  | "absenceRate"

type Props = {
  rows: StaffPerformanceRow[]
  loading?: boolean
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  align = "left",
}: {
  label: string
  active: boolean
  dir: "asc" | "desc"
  onClick: () => void
  align?: "left" | "right"
}) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground",
        align === "right" && "w-full justify-end"
      )}
    >
      {label}
      <Icon className="h-3.5 w-3.5" aria-hidden />
    </button>
  )
}

function fmtHkd(n: number | null): string {
  if (n == null) return "—"
  return `HK$ ${n.toLocaleString("en-HK", { maximumFractionDigits: 0 })}`
}

function fmtPct(n: number | null): string {
  if (n == null) return "—"
  return `${n.toFixed(1)}%`
}

export function StaffDetailTable({ rows, loading }: Props) {
  const [q, setQ] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("revenue")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    let list = rows
    if (needle) {
      list = list.filter(
        (r) =>
          r.teacherName.toLowerCase().includes(needle) ||
          (r.teacherAbbr ?? "").toLowerCase().includes(needle)
      )
    }
    const mul = sortDir === "asc" ? 1 : -1
    return [...list].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === "string" && typeof bv === "string") {
        return av.localeCompare(bv, "zh-Hant") * mul
      }
      return (Number(av) - Number(bv)) * mul
    })
  }, [rows, q, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(key)
      setSortDir(key === "teacherName" ? "asc" : "desc")
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">搜尋老師</label>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="姓名或簡稱"
        />
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">載入明細…</p>
      ) : null}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[64rem] border-collapse text-sm">
          <thead className="bg-muted/40">
            <tr className="border-b border-border text-left">
              <th className="px-3 py-2.5">
                <SortHeader
                  label="老師"
                  active={sortKey === "teacherName"}
                  dir={sortDir}
                  onClick={() => toggleSort("teacherName")}
                />
              </th>
              {(
                [
                  ["revenue", "收入"],
                  ["laborCost", "人工"],
                  ["grossProfit", "毛利"],
                  ["grossMargin", "毛利率"],
                  ["laborCostRatio", "人工佔比"],
                  ["teachingHours", "授課時數"],
                  ["retentionRate", "續報率"],
                  ["absenceRate", "缺課率"],
                ] as const
              ).map(([key, label]) => (
                <th key={key} className="px-3 py-2.5 text-right">
                  <SortHeader
                    label={label}
                    active={sortKey === key}
                    dir={sortDir}
                    onClick={() => toggleSort(key)}
                    align="right"
                  />
                </th>
              ))}
              <th className="px-3 py-2.5">異常</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-muted-foreground">
                  無符合資料
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.teacherId} className="border-b border-border/70 hover:bg-muted/20">
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <Link
                      to={`/Teachers/${r.teacherId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {r.teacherName}
                      {r.teacherAbbr ? (
                        <span className="ml-1 text-muted-foreground">（{r.teacherAbbr}）</span>
                      ) : null}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{fmtHkd(r.revenue)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {r.laborMissing ? (
                      <span className="text-muted-foreground">未有月結</span>
                    ) : (
                      fmtHkd(r.laborCost)
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{fmtHkd(r.grossProfit)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{fmtPct(r.grossMargin)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{fmtPct(r.laborCostRatio)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{r.teachingHours}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{fmtPct(r.retentionRate)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{fmtPct(r.absenceRate)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {r.anomalyTags.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        r.anomalyTags.map((tag) => (
                          <Tag key={tag} tone={statusToTagTone(tag)} size="sm">
                            {tag}
                          </Tag>
                        ))
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
