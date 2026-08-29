import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Paperclip } from "lucide-react"

import { HkExpenseEntryDetailDialog } from "@/components/hkExpenses/HkExpenseEntryDetailDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { StaggerItem, StaggerList } from "@/components/ui/stagger-list"
import { can } from "@/lib/authzProfile"
import { statusToTagTone } from "@/lib/statusTag"
import { reportUserFacingError } from "@/lib/mgmtErrorReporting"
import {
  confirmExpenseEntries,
  fetchExpenseEntries,
  type ExpenseEntry,
  type ExpenseLedgerAccount,
  type ExpenseLedgerStatus,
  type ExpenseOrigin,
} from "@/services/expenseQueries"

type Props = {
  monthKey: string
  accounts: ExpenseLedgerAccount[]
  refreshToken: number
  capabilities: readonly string[] | null | undefined
  canReadFullLedger: boolean
  onChanged: () => void
}

function hkd(n: number): string {
  return `HK$ ${n.toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function statusLabel(status: ExpenseLedgerStatus, voided: boolean): string {
  if (voided) return "已作廢"
  return status === "confirmed" ? "已確認" : "待覆核"
}

export function ExpenseJournalList({
  monthKey,
  accounts,
  refreshToken,
  capabilities,
  canReadFullLedger,
  onChanged,
}: Props) {
  const canConfirm = can(capabilities, "expenses.confirm")
  const canVoid = can(capabilities, "expenses.void")
  const canReopen = can(capabilities, "expenses.reopen")
  const [entries, setEntries] = useState<ExpenseEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<ExpenseLedgerStatus | "all">("all")
  const [originFilter, setOriginFilter] = useState<ExpenseOrigin | "all">("all")
  const [q, setQ] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  const detailEntry = useMemo(
    () => (detailId ? entries.find((e) => e.id === detailId) ?? null : null),
    [detailId, entries]
  )

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const rows = await fetchExpenseEntries({
        monthKey,
        ledgerStatus: statusFilter,
        origin: canReadFullLedger ? originFilter : "manual",
        q: q.trim() || undefined,
      })
      setEntries(rows)
    } catch (e) {
      reportUserFacingError(e, { source: "ExpenseJournalList.load", setErr })
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [monthKey, statusFilter, originFilter, q, canReadFullLedger])

  useEffect(() => {
    void load()
  }, [load, refreshToken])

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const onConfirmSelected = async () => {
    const ids = [...selected].filter((id) => {
      const e = entries.find((x) => x.id === id)
      return e && !e.voidedAt && e.ledgerStatus === "pending_review" && e.ledgerAccountId
    })
    if (ids.length === 0) {
      setErr("請先選取已有科目的待覆核列")
      return
    }
    setSaving(true)
    setErr(null)
    try {
      await confirmExpenseEntries(ids)
      setSelected(new Set())
      onChanged()
      await load()
    } catch (e) {
      reportUserFacingError(e, { source: "ExpenseJournalList.onConfirmSelected", setErr })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">狀態</span>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ExpenseLedgerStatus | "all")}
          >
            <option value="all">全部</option>
            <option value="pending_review">待覆核</option>
            <option value="confirmed">已確認</option>
          </Select>
        </label>
        {canReadFullLedger ? (
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">來源</span>
            <Select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value as ExpenseOrigin | "all")}
            >
              <option value="all">全部</option>
              <option value="manual">人手入帳</option>
              <option value="payroll_settle">計糧過帳</option>
              <option value="history_import">歷史匯入</option>
            </Select>
          </label>
        ) : null}
        <label className="grow space-y-1 text-sm">
          <span className="text-muted-foreground">搜尋標題</span>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="關鍵字" />
        </label>
        {canConfirm ? (
          <Button
            type="button"
            variant="outline"
            disabled={saving || selected.size === 0}
            onClick={() => void onConfirmSelected()}
          >
            批量確認
          </Button>
        ) : null}
      </div>

      {err ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {err}
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-[16vh] items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          載入明細…
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">本月尚無入帳</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                {canConfirm ? <th className="w-8 px-3 py-2" /> : null}
                <th className="px-3 py-2 font-medium">付款日</th>
                <th className="px-3 py-2 font-medium">標題</th>
                <th className="px-3 py-2 text-right font-medium">金額</th>
                <th className="px-3 py-2 font-medium">分類</th>
                <th className="px-3 py-2 font-medium">負責人</th>
                <th className="px-3 py-2 font-medium">狀態</th>
                <th className="px-3 py-2 font-medium">操作</th>
              </tr>
            </thead>
            <StaggerList as="tbody">
              {entries.map((e) => {
                const voided = Boolean(e.voidedAt)
                const canSelect =
                  canConfirm &&
                  !voided &&
                  e.ledgerStatus === "pending_review" &&
                  Boolean(e.ledgerAccountId)
                return (
                  <StaggerItem key={e.id} as="tr" className="border-t border-border/70 align-top">
                    {canConfirm ? (
                      <td className="px-3 py-2">
                        {canSelect ? (
                          <input
                            type="checkbox"
                            checked={selected.has(e.id)}
                            onChange={() => toggleSelect(e.id)}
                            aria-label={`選取 ${e.title}`}
                          />
                        ) : null}
                      </td>
                    ) : null}
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums">{e.spentOn}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-start gap-1.5">
                        <span>{e.title}</span>
                        {e.attachmentPath ? (
                          <Paperclip
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                            aria-label="有附件"
                          />
                        ) : null}
                      </div>
                      {e.teacherName ? (
                        <div className="text-xs text-muted-foreground">{e.teacherName}</div>
                      ) : null}
                      {e.suggestionHint ? (
                        <div className="text-xs text-warning">{e.suggestionHint}</div>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                      {hkd(e.amountHkd)}
                    </td>
                    <td className="min-w-[10rem] px-3 py-2">
                      <span>{e.ledgerAccountLabel ?? "—"}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">{e.ownerLabel ?? "—"}</td>
                    <td className="px-3 py-2">
                      <Tag size="sm" tone={statusToTagTone(statusLabel(e.ledgerStatus, voided))}>
                        {statusLabel(e.ledgerStatus, voided)}
                      </Tag>
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={saving}
                        onClick={() => setDetailId(e.id)}
                      >
                        入詳細
                      </Button>
                    </td>
                  </StaggerItem>
                )
              })}
            </StaggerList>
          </table>
        </div>
      )}

      <HkExpenseEntryDetailDialog
        entry={detailEntry}
        open={detailEntry != null}
        accounts={accounts}
        canConfirm={canConfirm}
        canVoid={canVoid}
        canReopen={canReopen}
        onOpenChange={(open) => {
          if (!open) setDetailId(null)
        }}
        onChanged={() => {
          onChanged()
          void load()
        }}
      />
    </section>
  )
}
